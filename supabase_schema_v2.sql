-- ============================================================
-- WEDLY - TAMBAHAN SCHEMA v2
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- KONTAK KLIEN (tambahan kolom di events)
alter table events add column if not exists client_phone text;
alter table events add column if not exists client_email text;
alter table events add column if not exists client_address text;
alter table events add column if not exists guest_count int default 0;

-- MEETING NOTES
create table if not exists meeting_notes (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date,
  title text not null,
  attendees text,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ACTION ITEMS (follow up dari meeting)
create table if not exists action_items (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meeting_notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  done boolean default false,
  due_date date,
  created_at timestamptz default now()
);

-- REMINDERS
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  remind_date date not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- EVENT NOTES (catatan bebas per event)
alter table events add column if not exists notes text;

-- RLS
alter table meeting_notes enable row level security;
alter table action_items enable row level security;
alter table reminders enable row level security;

create policy "meeting_notes_own" on meeting_notes for all using (auth.uid() = user_id);
create policy "action_items_own" on action_items for all using (auth.uid() = user_id);
create policy "reminders_own" on reminders for all using (auth.uid() = user_id);
