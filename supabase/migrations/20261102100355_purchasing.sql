-- Bigger Compras: apply once in the Supabase SQL editor or with the Supabase CLI.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated;
create table public.workspaces(id uuid primary key default gen_random_uuid(),name text not null check(length(trim(name)) between 1 and 100),created_at timestamptz not null default now());
create table public.memberships(workspace_id uuid references public.workspaces(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,role text not null default 'buyer' check(role in ('owner','buyer')),primary key(workspace_id,user_id));
create index on public.memberships(user_id);
create function private.is_workspace_member(w uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid())) $$;
revoke all on function private.is_workspace_member(uuid) from public,anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
create table public.suppliers(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id),name text not null check(length(trim(name)) between 1 and 100),contact text not null default '' check(length(contact)<=100),phone text not null default '' check(length(phone)<=30),notes text not null default '' check(length(notes)<=500),archived boolean not null default false,created_at timestamptz not null default now(),unique(id,workspace_id));
create index on public.suppliers(workspace_id);
create table public.products(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id),supplier_id uuid not null,name text not null check(length(trim(name)) between 1 and 120),presentation text not null check(length(trim(presentation)) between 1 and 150),unit text not null check(unit in ('unidad','caja','bolsa','botella','paquete','kilo','litro','bidón')),allow_decimal boolean not null default false,archived boolean not null default false,created_at timestamptz not null default now(),foreign key(supplier_id,workspace_id) references public.suppliers(id,workspace_id),unique(id,workspace_id),check(allow_decimal=(unit in ('kilo','litro'))));
create index on public.products(workspace_id,supplier_id);
create index on public.products(supplier_id,workspace_id);
create table public.purchase_orders(id uuid primary key default gen_random_uuid(),order_number bigint generated always as identity unique,request_id uuid unique,request_hash text,workspace_id uuid not null references public.workspaces(id),supplier_id uuid not null,supplier_name text not null,supplier_phone text not null default '',note text not null default '' check(length(note)<=1000),status text not null check(status in ('draft','prepared','confirmed')),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),prepared_at timestamptz,confirmed_at timestamptz,confirmed_by uuid references auth.users(id),foreign key(supplier_id,workspace_id) references public.suppliers(id,workspace_id),unique(id,workspace_id));
create index on public.purchase_orders(workspace_id,created_at desc);
create index on public.purchase_orders(supplier_id,workspace_id);
create index on public.purchase_orders(created_by);
create index on public.purchase_orders(confirmed_by);
create table public.purchase_order_items(id uuid primary key default gen_random_uuid(),workspace_id uuid not null,order_id uuid not null,product_id uuid not null,name text not null,presentation text not null,unit text not null,position integer not null default 0,quantity numeric not null check(quantity>0 and quantity<=100000 and scale(quantity)<=3),foreign key(order_id,workspace_id) references public.purchase_orders(id,workspace_id) on delete cascade,foreign key(product_id,workspace_id) references public.products(id,workspace_id),unique(order_id,product_id));
create index on public.purchase_order_items(workspace_id,order_id);
create index on public.purchase_order_items(product_id,workspace_id);
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
revoke all on public.workspaces,public.memberships,public.suppliers,public.products,public.purchase_orders,public.purchase_order_items from anon,authenticated;
grant select on public.workspaces,public.memberships,public.purchase_orders,public.purchase_order_items to authenticated;
grant select,insert,update on public.suppliers,public.products to authenticated;
create policy workspace_read on public.workspaces for select to authenticated using(private.is_workspace_member(id));
create policy membership_read on public.memberships for select to authenticated using(user_id=(select auth.uid()));
create policy supplier_read on public.suppliers for select to authenticated using(private.is_workspace_member(workspace_id));
create policy supplier_insert on public.suppliers for insert to authenticated with check(private.is_workspace_member(workspace_id));
create policy supplier_update on public.suppliers for update to authenticated using(private.is_workspace_member(workspace_id)) with check(private.is_workspace_member(workspace_id));
create policy product_read on public.products for select to authenticated using(private.is_workspace_member(workspace_id));
create policy product_insert on public.products for insert to authenticated with check(private.is_workspace_member(workspace_id));
create policy product_update on public.products for update to authenticated using(private.is_workspace_member(workspace_id)) with check(private.is_workspace_member(workspace_id));
create policy orders_read on public.purchase_orders for select to authenticated using(private.is_workspace_member(workspace_id));
create policy items_read on public.purchase_order_items for select to authenticated using(private.is_workspace_member(workspace_id));

create function public.create_purchase_workspace(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare w uuid;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para continuar.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.memberships where user_id=auth.uid()) then raise exception 'Ya tienes un espacio de compras.';end if;
 if length(trim(p_name)) not between 1 and 100 then raise exception 'Nombre del espacio inválido.';end if;
 insert into public.workspaces(name) values(trim(p_name)) returning id into w;
 insert into public.memberships(workspace_id,user_id,role) values(w,auth.uid(),'owner');return w;
end;$$;

-- Both the order and its snapshots are saved in one database transaction.
-- Caller-supplied product names, provider names and status confirmations are ignored.
create function public.save_purchase_order(p_supplier_id uuid,p_lines jsonb,p_note text default '',p_draft_id uuid default null,p_prepare boolean default true,p_request_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.suppliers;p public.products;o public.purchase_orders;l jsonb;q numeric;oid uuid;seen uuid[]:='{}';pos integer:=0;fingerprint text;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para continuar.';end if;
 if p_prepare is null then raise exception 'Estado de preparación inválido.';end if;
 select * into s from public.suppliers where id=p_supplier_id and not archived;
 if not found or not private.is_workspace_member(s.workspace_id) then raise exception 'Proveedor no disponible.';end if;
 if p_lines is null or jsonb_typeof(p_lines) is distinct from 'array' then raise exception 'Selecciona productos válidos.';end if;
 if jsonb_array_length(p_lines) not between 1 and 200 then raise exception 'Selecciona entre 1 y 200 productos.';end if;
 if length(coalesce(p_note,''))>1000 then raise exception 'Las observaciones son demasiado largas.';end if;
 fingerprint:=md5(p_supplier_id::text||p_lines::text||coalesce(p_note,'')||coalesce(p_prepare,true)::text);
 if p_draft_id is null and p_request_id is not null then
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,1));
  select * into o from public.purchase_orders where request_id=p_request_id;
  if found then
   if o.workspace_id=s.workspace_id and o.created_by=auth.uid() and o.request_hash=fingerprint then return o.id;end if;
   raise exception 'El intento de guardado ya fue utilizado. Crea una preparación nueva.';
  end if;
 end if;
 if p_draft_id is not null then
  select * into o from public.purchase_orders where id=p_draft_id and workspace_id=s.workspace_id for update;
  if not found or o.status<>'draft' or o.supplier_id<>s.id then raise exception 'Solo se puede editar un borrador del mismo proveedor.';end if;
  oid:=o.id;
  update public.purchase_orders set supplier_name=s.name,supplier_phone=s.phone,note=trim(coalesce(p_note,'')),status=case when p_prepare then 'prepared' else 'draft' end,prepared_at=case when p_prepare then now() else null end where id=oid;
  delete from public.purchase_order_items where order_id=oid;
 else
  insert into public.purchase_orders(workspace_id,supplier_id,supplier_name,supplier_phone,note,status,created_by,prepared_at,request_id,request_hash) values(s.workspace_id,s.id,s.name,s.phone,trim(coalesce(p_note,'')),case when p_prepare then 'prepared' else 'draft' end,auth.uid(),case when p_prepare then now() else null end,p_request_id,fingerprint) returning id into oid;
 end if;
 for l in select value from jsonb_array_elements(p_lines) loop
  if jsonb_typeof(l->'quantity')<>'number' then raise exception 'Cantidad inválida.';end if;
  q:=(l->>'quantity')::numeric;
  select * into p from public.products where id=(l->>'product_id')::uuid and supplier_id=s.id and workspace_id=s.workspace_id and not archived;
  if not found or p.id=any(seen) then raise exception 'Producto no disponible o repetido.';end if;
  if q is null or q<=0 or q>100000 or scale(q)>3 or (not p.allow_decimal and q<>trunc(q)) then raise exception 'Cantidad inválida para %.',p.name;end if;
  seen:=array_append(seen,p.id);
  insert into public.purchase_order_items(workspace_id,order_id,product_id,name,presentation,unit,quantity,position) values(s.workspace_id,oid,p.id,p.name,p.presentation,p.unit,q,pos);pos:=pos+1;
 end loop;return oid;
end;$$;
create function public.confirm_purchase_order(p_order_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión para continuar.';end if;
 update public.purchase_orders set status='confirmed',confirmed_at=now(),confirmed_by=auth.uid() where id=p_order_id and status='prepared' and private.is_workspace_member(workspace_id);
 if not found then raise exception 'No se pudo confirmar este pedido.';end if;
end;$$;
revoke all on function public.create_purchase_workspace(text),public.save_purchase_order(uuid,jsonb,text,uuid,boolean,uuid),public.confirm_purchase_order(uuid) from public,anon;
grant execute on function public.create_purchase_workspace(text),public.save_purchase_order(uuid,jsonb,text,uuid,boolean,uuid),public.confirm_purchase_order(uuid) to authenticated;
