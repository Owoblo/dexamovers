create table if not exists leads (
  id integer primary key autoincrement,
  lead_type text,
  form_name text,
  name text not null,
  email text not null,
  phone text,
  service text,
  move_date text,
  move_size text,
  from_city text,
  to_city text,
  details text,
  source_page text,
  submitted_at text not null,
  raw_json text not null,
  created_at text not null default current_timestamp
);

create index if not exists idx_leads_created_at on leads (created_at desc);
create index if not exists idx_leads_email on leads (email);
