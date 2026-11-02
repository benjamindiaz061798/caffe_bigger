-- GoTrue may populate admin app_metadata after the initial INSERT. A short,
-- single-use server grant permits that INSERT without trusting caller metadata.
create table private.firebase_registration_grants (
  email text primary key,
  firebase_uid text not null,
  token_hash bytea not null,
  expires_at timestamptz not null
);
alter table private.firebase_registration_grants enable row level security;
revoke all on private.firebase_registration_grants from public,anon,authenticated;

create function private.firebase_registration_grant(p_uid text,p_email text) returns text
language plpgsql security definer set search_path='' as $$
declare token text;
begin
  if p_uid is null or length(p_uid) not between 1 and 128 or p_email is null or length(p_email) not between 3 and 254 then
    raise exception 'Identidad inválida.';
  end if;
  token := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
  delete from private.firebase_registration_grants where expires_at<=now();
  insert into private.firebase_registration_grants(email,firebase_uid,token_hash,expires_at)
    values(lower(trim(p_email)),p_uid,sha256(convert_to(token,'UTF8')),now()+interval '2 minutes')
    on conflict(email) do update set firebase_uid=excluded.firebase_uid,token_hash=excluded.token_hash,expires_at=excluded.expires_at;
  return token;
end;
$$;
create function public.firebase_registration_grant(p_uid text,p_email text) returns text
language sql security invoker set search_path='' as $$ select private.firebase_registration_grant(p_uid,p_email); $$;
revoke all on function private.firebase_registration_grant(text,text),public.firebase_registration_grant(text,text) from public,anon,authenticated;
grant execute on function private.firebase_registration_grant(text,text),public.firebase_registration_grant(text,text) to service_role;

create or replace function private.enforce_authorized_account() returns trigger
language plpgsql security definer set search_path='' as $$
declare granted boolean;
begin
  if exists(select 1 from private.authorized_accounts where email=lower(trim(new.email)))
    or (new.raw_app_meta_data->>'bigger_identity_provider'='firebase'
      and length(new.raw_app_meta_data->>'firebase_uid') between 1 and 128) then return new;end if;
  -- Metadata alone never grants access: require the hashed server-only nonce,
  -- the verified Firebase UID and email, and consume the unexpired grant.
  delete from private.firebase_registration_grants
    where email=lower(trim(new.email)) and expires_at>now()
      and firebase_uid=new.raw_user_meta_data->>'bigger_registration_uid'
      and token_hash=sha256(convert_to(coalesce(new.raw_user_meta_data->>'bigger_registration_token',''),'UTF8'))
    returning true into granted;
  if granted then return new;end if;
  raise exception 'La cuenta no está autorizada para este espacio.';
end;
$$;
