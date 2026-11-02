-- Replace the two UUID markers with a verified Auth user and its workspace.
-- All test records and confirmations are rolled back. No WhatsApp messages are sent.
begin;
select set_config('request.jwt.claim.sub','__USER_ID__',true);
select set_config('request.jwt.claims','{"sub":"__USER_ID__","role":"authenticated"}',true);
select set_config('bigger.other_workspace',gen_random_uuid()::text,true);
insert into public.workspaces(id,name) values(current_setting('bigger.other_workspace')::uuid,'Verification rollback only');
set local role authenticated;
do $$
declare
  w uuid:='__WORKSPACE_ID__'; s uuid; p uuid; o uuid; d uuid; retry uuid;
  nonce uuid:=gen_random_uuid(); rejected boolean:=false; n numeric; label text;
begin
  if auth.uid()<>'__USER_ID__'::uuid then raise exception 'JWT context mismatch';end if;
  if exists(select 1 from public.workspaces where id=current_setting('bigger.other_workspace')::uuid) then
    raise exception 'Cross-workspace read was not isolated';
  end if;
  begin
    insert into public.suppliers(workspace_id,name) values(current_setting('bigger.other_workspace')::uuid,'Denied');
  exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'Cross-workspace write was not denied';end if;
  insert into public.suppliers(workspace_id,name) values(w,'Verification rollback supplier') returning id into s;
  insert into public.products(workspace_id,supplier_id,name,presentation,unit)
    values(w,s,'Verification water','Caja de 12 unidades','caja') returning id into p;
  o:=public.save_purchase_order(s,jsonb_build_array(jsonb_build_object('product_id',p,'quantity',2)),'Verification rollback',null,true,nonce);
  update public.products set name='Changed catalog name' where id=p;
  select name,quantity into label,n from public.purchase_order_items where order_id=o;
  if label<>'Verification water' or n<>2 then raise exception 'Historical snapshot mismatch';end if;
  retry:=public.save_purchase_order(s,jsonb_build_array(jsonb_build_object('product_id',p,'quantity',2)),'Verification rollback',null,true,nonce);
  if retry<>o then raise exception 'Retry created a duplicate';end if;
  d:=public.save_purchase_order(s,jsonb_build_array(jsonb_build_object('product_id',p,'quantity',1)),'Draft verification',null,false,gen_random_uuid());
  retry:=public.save_purchase_order(s,jsonb_build_array(jsonb_build_object('product_id',p,'quantity',3)),'Draft verification',d,true,gen_random_uuid());
  if retry<>d then raise exception 'Draft identity changed';end if;
  select quantity into n from public.purchase_order_items where order_id=d;
  if n<>3 then raise exception 'Draft quantity mismatch';end if;
  rejected:=false;
  begin
    perform public.save_purchase_order(s,jsonb_build_array(jsonb_build_object('product_id',p,'quantity',0.5)));
  exception when others then rejected:=true;end;
  if not rejected then raise exception 'Fractional boxes accepted';end if;
  perform public.confirm_purchase_order(o);
  if not exists(select 1 from public.purchase_orders where id=o and status='confirmed' and confirmed_by=auth.uid()) then
    raise exception 'Manual confirmation mismatch';
  end if;
end;
$$;
set local role anon;
do $$
declare denied boolean:=false;
begin
  begin perform 1 from public.suppliers;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'Anonymous access was not denied';end if;
end;
$$;
rollback;
select true as purchasing_live_smoke_passed;
