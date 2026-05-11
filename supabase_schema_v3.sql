-- ============================================================
-- WEDLY - SCHEMA v3: HALAMAN RAPAT
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- MEETINGS (rapat dengan klien & tim)
create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete set null,
  type text not null check (type in ('client','team')),
  title text not null,
  meeting_number int default 1,
  attendees text,
  date date default current_date,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ACTION ITEMS per meeting
create table if not exists meeting_actions (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meetings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- FILES per meeting (foto & dokumen)
create table if not exists meeting_files (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meetings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  size text,
  storage_path text not null,
  file_type text default 'file',
  created_at timestamptz default now()
);

-- RLS
alter table meetings enable row level security;
alter table meeting_actions enable row level security;
alter table meeting_files enable row level security;

create policy "meetings_own" on meetings for all using (auth.uid() = user_id);
create policy "meeting_actions_own" on meeting_actions for all using (auth.uid() = user_id);
create policy "meeting_files_own" on meeting_files for all using (auth.uid() = user_id);

-- Storage bucket untuk file rapat
insert into storage.buckets (id, name, public)
values ('meeting-files', 'meeting-files', false)
on conflict (id) do nothing;

create policy "meeting_files_upload" on storage.objects for insert
  with check (bucket_id = 'meeting-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "meeting_files_read" on storage.objects for select
  using (bucket_id = 'meeting-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "meeting_files_delete" on storage.objects for delete
  using (bucket_id = 'meeting-files' and auth.uid()::text = (storage.foldername(name))[1]);
