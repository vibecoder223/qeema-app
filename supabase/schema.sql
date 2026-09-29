-- Qeema schema. Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Model: an organisation is a company. People join it through members.
-- The company profile, library and quarter live in orgs.data; each tender is one row.
-- Row-level security: you can only read or write rows of organisations you belong to.

create extension if not exists pgcrypto;

create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  join_code   text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.members (
  org_id      uuid not null references public.orgs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  ini         text not null,
  role        text not null default 'Member',
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists members_user_idx on public.members(user_id);

create table if not exists public.tenders (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  ref         text not null default '',
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);
create index if not exists tenders_org_idx on public.tenders(org_id);

-- ── helpers (security definer so policies can call them without recursion) ──
create or replace function public.is_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where org_id = o and user_id = auth.uid());
$$;
create or replace function public.is_admin(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where org_id = o and user_id = auth.uid() and is_admin);
$$;

-- Create a company and become its first (admin) member, atomically.
create or replace function public.create_org(p_name text, p_person text, p_ini text, p_role text, p_data jsonb)
returns public.orgs language plpgsql security definer set search_path = public as $$
declare o public.orgs;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.orgs(name, data) values (p_name, coalesce(p_data, '{}'::jsonb)) returning * into o;
  insert into public.members(org_id, user_id, name, ini, role, is_admin) values (o.id, auth.uid(), p_person, p_ini, p_role, true);
  return o;
end $$;

-- Join a company with the code an admin shared.
create or replace function public.join_org(p_code text, p_person text, p_ini text, p_role text)
returns public.orgs language plpgsql security definer set search_path = public as $$
declare o public.orgs;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into o from public.orgs where join_code = upper(trim(p_code));
  if o.id is null then raise exception 'No company uses that code'; end if;
  insert into public.members(org_id, user_id, name, ini, role) values (o.id, auth.uid(), p_person, p_ini, p_role)
  on conflict (org_id, user_id) do nothing;
  return o;
end $$;

-- ── row-level security ──
alter table public.orgs    enable row level security;
alter table public.members enable row level security;
alter table public.tenders enable row level security;

drop policy if exists orgs_read   on public.orgs;
drop policy if exists orgs_write  on public.orgs;
create policy orgs_read  on public.orgs for select using (public.is_member(id));
create policy orgs_write on public.orgs for update using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists members_read   on public.members;
drop policy if exists members_self   on public.members;
drop policy if exists members_admin  on public.members;
drop policy if exists members_remove on public.members;
create policy members_read   on public.members for select using (public.is_member(org_id));
create policy members_self   on public.members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy members_admin  on public.members for update using (public.is_admin(org_id)) with check (public.is_admin(org_id));
create policy members_remove on public.members for delete using (public.is_admin(org_id) or user_id = auth.uid());

drop policy if exists tenders_all on public.tenders;
create policy tenders_all on public.tenders for all using (public.is_member(org_id)) with check (public.is_member(org_id));

-- ── files: private bucket, one folder per organisation ──
insert into storage.buckets (id, name, public) values ('files', 'files', false) on conflict (id) do nothing;
drop policy if exists files_read   on storage.objects;
drop policy if exists files_write  on storage.objects;
drop policy if exists files_delete on storage.objects;
create policy files_read   on storage.objects for select using (bucket_id = 'files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy files_write  on storage.objects for insert with check (bucket_id = 'files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy files_delete on storage.objects for delete using (bucket_id = 'files' and public.is_member(((storage.foldername(name))[1])::uuid));

-- ── live updates for teammates ──
do $$ begin
  begin alter publication supabase_realtime add table public.tenders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.orgs;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.members; exception when duplicate_object then null; end;
end $$;
alter table public.tenders replica identity full;
