-- ============================================================
-- WEDLY DATABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- EVENTS
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  client_name text,
  date date,
  venue text,
  budget bigint default 0,
  status text default 'planning' check (status in ('planning','ongoing','done')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- VENDORS
create table vendors (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  contract_amount bigint default 0,
  paid_amount bigint default 0,
  contact text,
  due_date date,
  status text default 'belum' check (status in ('belum','dp','lunas')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CASHFLOW (pemasukan & pengeluaran)
create table cashflow (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('in','out')),
  category text,
  description text not null,
  amount bigint not null,
  date date default current_date,
  created_at timestamptz default now()
);

-- TIMELINE
create table timeline (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  time text not null,
  activity text not null,
  pic text,
  done boolean default false,
  created_at timestamptz default now()
);

-- CHECKLIST
create table checklist_items (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  group_name text not null,
  text text not null,
  done boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- DOCUMENTS (metadata saja, file di Supabase Storage)
create table documents (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  size text,
  storage_path text not null,
  created_at timestamptz default now()
);

-- PROFILES (data WO)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  wo_name text,
  owner_name text,
  phone text,
  city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table events enable row level security;
alter table vendors enable row level security;
alter table cashflow enable row level security;
alter table timeline enable row level security;
alter table checklist_items enable row level security;
alter table documents enable row level security;
alter table profiles enable row level security;

-- Events: user hanya bisa akses data sendiri
create policy "events_own" on events for all using (auth.uid() = user_id);
create policy "vendors_own" on vendors for all using (auth.uid() = user_id);
create policy "cashflow_own" on cashflow for all using (auth.uid() = user_id);
create policy "timeline_own" on timeline for all using (auth.uid() = user_id);
create policy "checklist_own" on checklist_items for all using (auth.uid() = user_id);
create policy "documents_own" on documents for all using (auth.uid() = user_id);
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- ============================================================
-- STORAGE BUCKET untuk dokumen
-- ============================================================
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "documents_upload" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "documents_read" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "documents_delete" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- AUTO-CREATE PROFILE saat user register
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
