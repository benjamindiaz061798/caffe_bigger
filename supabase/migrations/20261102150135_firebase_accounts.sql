-- Firebase identities retain UUID-backed Supabase records and existing history.
create table private.firebase_accounts(
  firebase_uid text primary key check(length(firebase_uid) between 1 and 128),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email text not null,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);
create table private.firebase_sessions(
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
create index firebase_sessions_user_idx on private.firebase_sessions(user_id);
create table private.firebase_registration(
  singleton boolean primary key default true check(singleton),
  workspace_id uuid not null references public.workspaces(id)
);
create index firebase_registration_workspace_idx on private.firebase_registration(workspace_id);
insert into private.firebase_registration(workspace_id)
select id from public.workspaces where name='Caffe Bigger' order by created_at limit 1;
alter table private.firebase_accounts enable row level security;
alter table private.firebase_sessions enable row level security;
alter table private.firebase_registration enable row level security;
revoke all on private.firebase_accounts,private.firebase_sessions,private.firebase_registration from public,anon,authenticated;
grant usage on schema private to service_role;

-- Public Supabase signup remains restricted. Only trusted Auth admin calls can
-- set raw_app_meta_data; user_metadata never grants permissions.
create or replace function private.enforce_authorized_account() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from private.authorized_accounts where email=lower(trim(new.email)))
     or (new.raw_app_meta_data->>'bigger_identity_provider'='firebase'
         and length(new.raw_app_meta_data->>'firebase_uid') between 1 and 128) then
    return new;
  end if;
  raise exception 'La cuenta no está autorizada para este espacio.';
end;
$$;

create or replace function private.is_workspace_member(w uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null
    and exists(select 1 from public.memberships where workspace_id=w and user_id=(select auth.uid()))
    and (
      not exists(select 1 from private.firebase_accounts where user_id=(select auth.uid()))
      or exists(
        select 1 from private.firebase_accounts f
        join private.firebase_sessions s on s.user_id=f.user_id
        where f.user_id=(select auth.uid()) and not f.disabled
          and s.session_id::text=auth.jwt()->>'session_id' and s.expires_at>now()
      )
    );
$$;

create function private.firebase_lookup(p_uid text,p_email text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  select jsonb_build_object('user_id',u.id,'email',u.email,'disabled',f.disabled,'linked',true)
    into result from private.firebase_accounts f join auth.users u on u.id=f.user_id where f.firebase_uid=p_uid;
  if result is not null then return result;end if;
  select jsonb_build_object('user_id',u.id,'email',u.email,'disabled',false,'linked',false)
    into result from auth.users u where lower(u.email)=lower(p_email)
    and not exists(select 1 from private.firebase_accounts where user_id=u.id);
  return result;
end;
$$;
create function public.firebase_lookup(p_uid text,p_email text) returns jsonb
language sql security invoker set search_path='' as $$ select private.firebase_lookup(p_uid,p_email); $$;

create function private.firebase_link(p_uid text,p_user_id uuid,p_email text) returns void
language plpgsql security definer set search_path='' as $$
declare workspace uuid; existing private.firebase_accounts;
begin
  if length(p_uid) not between 1 and 128 then raise exception 'Identidad inválida.';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_uid,2));
  if not exists(select 1 from auth.users where id=p_user_id and lower(email)=lower(p_email)) then
    raise exception 'La identidad no coincide con la cuenta.';
  end if;
  select * into existing from private.firebase_accounts where firebase_uid=p_uid;
  if found and (existing.user_id<>p_user_id or existing.disabled) then raise exception 'Acceso no disponible.';end if;
  insert into private.firebase_accounts(firebase_uid,user_id,email) values(p_uid,p_user_id,lower(p_email))
    on conflict(firebase_uid) do update set email=excluded.email;
  select workspace_id into workspace from private.firebase_registration where singleton;
  if workspace is null then raise exception 'El espacio de compras aún no está configurado.';end if;
  insert into public.memberships(workspace_id,user_id,role) values(workspace,p_user_id,'buyer')
    on conflict(workspace_id,user_id) do nothing;
end;
$$;
create function public.firebase_link(p_uid text,p_user_id uuid,p_email text) returns void
language sql security invoker set search_path='' as $$ select private.firebase_link(p_uid,p_user_id,p_email); $$;

create function private.firebase_record_session(p_user_id uuid,p_session_id uuid,p_expires_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_expires_at<=now() or p_expires_at is null then raise exception 'Sesión vencida.';end if;
  if not exists(select 1 from private.firebase_accounts where user_id=p_user_id and not disabled)
    or not exists(select 1 from auth.sessions where id=p_session_id and user_id=p_user_id) then
    raise exception 'Sesión no disponible.';
  end if;
  insert into private.firebase_sessions(session_id,user_id,expires_at)
    values(p_session_id,p_user_id,least(p_expires_at,now()+interval '1 hour'))
    on conflict(session_id) do update set expires_at=excluded.expires_at;
end;
$$;
create function public.firebase_record_session(p_user_id uuid,p_session_id uuid,p_expires_at timestamptz) returns void
language sql security invoker set search_path='' as $$ select private.firebase_record_session(p_user_id,p_session_id,p_expires_at); $$;

revoke all on function private.firebase_lookup(text,text),private.firebase_link(text,uuid,text),private.firebase_record_session(uuid,uuid,timestamptz),public.firebase_lookup(text,text),public.firebase_link(text,uuid,text),public.firebase_record_session(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function private.firebase_lookup(text,text),private.firebase_link(text,uuid,text),private.firebase_record_session(uuid,uuid,timestamptz),public.firebase_lookup(text,text),public.firebase_link(text,uuid,text),public.firebase_record_session(uuid,uuid,timestamptz) to service_role;

create function private.list_workspace_users(p_workspace_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not private.is_workspace_member(p_workspace_id) or not exists(
    select 1 from public.memberships where workspace_id=p_workspace_id and user_id=auth.uid() and role='owner'
  ) then raise exception 'Solo un administrador puede gestionar usuarios.';end if;
  return coalesce((select jsonb_agg(row_to_json(row)) from (
    select u.id as user_id,u.email,left(coalesce(u.raw_user_meta_data->>'display_name',''),100) as name,
      m.role,coalesce(f.disabled,false) as disabled,(f.firebase_uid is not null) as firebase_account,u.created_at
    from public.memberships m join auth.users u on u.id=m.user_id
      left join private.firebase_accounts f on f.user_id=u.id
    where m.workspace_id=p_workspace_id order by m.role desc,u.created_at
  ) row),'[]'::jsonb);
end;
$$;
create function public.list_workspace_users(p_workspace_id uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.list_workspace_users(p_workspace_id); $$;

create function private.set_workspace_user_enabled(p_workspace_id uuid,p_user_id uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not private.is_workspace_member(p_workspace_id) or not exists(
    select 1 from public.memberships where workspace_id=p_workspace_id and user_id=auth.uid() and role='owner'
  ) then raise exception 'Solo un administrador puede gestionar usuarios.';end if;
  if p_enabled is null or not exists(select 1 from public.memberships where workspace_id=p_workspace_id and user_id=p_user_id and role='buyer') then
    raise exception 'No puedes cambiar el acceso de una cuenta administradora.';
  end if;
  update private.firebase_accounts set disabled=not p_enabled where user_id=p_user_id;
  if not found then raise exception 'La cuenta no utiliza Firebase.';end if;
end;
$$;
create function public.set_workspace_user_enabled(p_workspace_id uuid,p_user_id uuid,p_enabled boolean) returns void
language sql security invoker set search_path='' as $$ select private.set_workspace_user_enabled(p_workspace_id,p_user_id,p_enabled); $$;
revoke all on function private.list_workspace_users(uuid),public.list_workspace_users(uuid),private.set_workspace_user_enabled(uuid,uuid,boolean),public.set_workspace_user_enabled(uuid,uuid,boolean) from public,anon;
grant execute on function private.list_workspace_users(uuid),public.list_workspace_users(uuid),private.set_workspace_user_enabled(uuid,uuid,boolean),public.set_workspace_user_enabled(uuid,uuid,boolean) to authenticated;
