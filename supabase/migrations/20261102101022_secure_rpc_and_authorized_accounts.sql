-- Only the public invoker wrappers are exposed through the Data API.
alter function public.create_purchase_workspace(text) set schema private;
alter function public.save_purchase_order(uuid,jsonb,text,uuid,boolean,uuid) set schema private;
alter function public.confirm_purchase_order(uuid) set schema private;

create function public.create_purchase_workspace(p_name text) returns uuid
language sql security invoker set search_path='' as $$
  select private.create_purchase_workspace(p_name);
$$;
create function public.save_purchase_order(
  p_supplier_id uuid,p_lines jsonb,p_note text default '',p_draft_id uuid default null,
  p_prepare boolean default true,p_request_id uuid default null
) returns uuid language sql security invoker set search_path='' as $$
  select private.save_purchase_order(p_supplier_id,p_lines,p_note,p_draft_id,p_prepare,p_request_id);
$$;
create function public.confirm_purchase_order(p_order_id uuid) returns void
language sql security invoker set search_path='' as $$
  select private.confirm_purchase_order(p_order_id);
$$;
revoke all on function public.create_purchase_workspace(text),public.save_purchase_order(uuid,jsonb,text,uuid,boolean,uuid),public.confirm_purchase_order(uuid) from public,anon;
grant execute on function public.create_purchase_workspace(text),public.save_purchase_order(uuid,jsonb,text,uuid,boolean,uuid),public.confirm_purchase_order(uuid) to authenticated;

-- An explicit allowlist also protects the direct Auth signup endpoint.
-- Only the database administrator can authorize another account.
create table private.authorized_accounts(
  email text primary key check(email=lower(trim(email)) and position('@' in email)>1),
  created_at timestamptz not null default now()
);
alter table private.authorized_accounts enable row level security;
revoke all on private.authorized_accounts from public,anon,authenticated;
create function private.enforce_authorized_account() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.email is null or not exists(
    select 1 from private.authorized_accounts a where a.email=lower(trim(new.email))
  ) then
    raise exception 'La cuenta no está autorizada para este espacio.';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_authorized_account() from public,anon,authenticated;
create trigger bigger_authorized_account before insert on auth.users
for each row execute function private.enforce_authorized_account();

create index purchase_order_items_order_workspace_idx on public.purchase_order_items(order_id,workspace_id);
