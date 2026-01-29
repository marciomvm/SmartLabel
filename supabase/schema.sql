-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. STRAINS TABLE (Configuration)
create table if not exists mush_strains (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  colonization_days int not null default 14,
  created_at timestamptz default now()
);

-- 2. BATCHES TABLE
do $$ begin
    create type mush_batch_type as enum ('GRAIN', 'SUBSTRATE', 'BULK');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type mush_batch_status as enum ('INCUBATING', 'READY', 'SOLD', 'CONTAMINATED');
exception
    when duplicate_object then null;
end $$;

create table if not exists mush_batches (
  id uuid primary key default uuid_generate_v4(),
  readable_id text not null unique, -- e.g., "G-001"
  type mush_batch_type not null,
  strain_id uuid references mush_strains(id),
  status mush_batch_status not null default 'INCUBATING',
  parent_id uuid references mush_batches(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. EVENTS TABLE (Audit Log)
create table if not exists mush_events (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references mush_batches(id) on delete cascade,
  action_type text not null, -- 'CREATED', 'MOVED', 'SOLD', 'CONTAMINATED'
  details jsonb,
  created_at timestamptz default now()
);

-- 4. RECURSIVE LINEAGE VIEW
create or replace view view_mush_batch_lineage as
with recursive genealogy as (
  -- Base case: the batch itself
  select 
    id, 
    readable_id, 
    parent_id, 
    status,
    type,
    1 as depth,
    cast(readable_id as text) as path
  from mush_batches
  
  union all
  
  -- Recursive step: find parents
  select 
    p.id, 
    p.readable_id, 
    p.parent_id, 
    p.status,
    p.type,
    g.depth + 1,
    p.readable_id || ' -> ' || g.path
  from mush_batches p
  inner join genealogy g on g.parent_id = p.id
)
select * from genealogy;

-- RLS (Open for MVP)
alter table mush_batches enable row level security;
alter table mush_events enable row level security;
alter table mush_strains enable row level security;

create policy "Enable all access for now" on mush_batches for all using (true);
create policy "Enable all access for now" on mush_events for all using (true);
create policy "Enable all access for now" on mush_strains for all using (true);

-- Functions
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_mush_batches_updated_at on mush_batches;
create trigger update_mush_batches_updated_at
before update on mush_batches
for each row
execute procedure update_updated_at_column();
