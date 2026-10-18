-- Adds the student year/class label. Safe to run more than once.
alter table public.profiles add column if not exists year_level text;
