-- Schema für die TODO App
-- Idempotent: kann jederzeit erneut ausgeführt werden.

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  email         text not null unique,
  password_hash text not null,
  timezone      text not null default 'Europe/Zurich',
  created_at    timestamptz not null default now()
);

create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  color      text not null default 'blue',
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists todos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  project_id       uuid references projects(id) on delete set null,
  title            text not null,
  notes            text not null default '',
  link             text,
  starred          boolean not null default false,
  priority         text not null default 'none',
  due_at           timestamptz,
  due_all_day      boolean not null default true,
  duration_minutes integer not null default 30,
  remind_at        timestamptz,
  reminder_sent_at timestamptz,
  repeat_mode      text,
  repeat_unit      text,
  repeat_interval  integer not null default 1,
  position         double precision not null default 0,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_user     on projects (user_id, position);
create index if not exists idx_todos_user        on todos (user_id, completed_at);
create index if not exists idx_todos_project     on todos (project_id);
create index if not exists idx_todos_due         on todos (due_at);
create index if not exists idx_todos_remind      on todos (remind_at) where reminder_sent_at is null;
create index if not exists idx_push_user         on push_subscriptions (user_id);
