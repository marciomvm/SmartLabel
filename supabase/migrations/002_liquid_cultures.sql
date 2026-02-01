-- Liquid Cultures Table
-- Run this migration in Supabase SQL Editor

do $$ begin
    create type mush_lc_status as enum ('ACTIVE', 'EXHAUSTED', 'CONTAMINATED');
exception
    when duplicate_object then null;
end $$;

create table if not exists mush_liquid_cultures (
  id uuid primary key default uuid_generate_v4(),
  readable_id text not null unique, -- e.g., "LC-20260201-01"
  strain_id uuid references mush_strains(id),
  status mush_lc_status not null default 'ACTIVE',
  volume_ml int, -- optional, remaining volume
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table mush_liquid_cultures enable row level security;
create policy "Enable all access for now" on mush_liquid_cultures for all using (true);

-- Trigger for updated_at
drop trigger if exists update_mush_liquid_cultures_updated_at on mush_liquid_cultures;
create trigger update_mush_liquid_cultures_updated_at
before update on mush_liquid_cultures
for each row
execute procedure update_updated_at_column();
