-- ============================================================
-- Assessly Database Schema
-- ============================================================

-- Enable pgcrypto for UUID generation and random strings
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- Extends auth.users; created via trigger on signup
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text not null,
  role         text not null check (role in ('teacher', 'student')),
  created_by   uuid references public.profiles(id) on delete set null,
  access_token uuid unique default gen_random_uuid(),
  created_at   timestamptz not null default now()
);

-- Migration (run if table already exists):
-- alter table public.profiles add column if not exists access_token uuid unique default gen_random_uuid();

-- Trigger: auto-create profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TESTS
-- ============================================================
create table public.tests (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  teacher_id        uuid not null references public.profiles(id) on delete cascade,
  duration_minutes  integer not null default 60 check (duration_minutes > 0),
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  invite_code       text not null unique default upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8)),
  instructions      text,
  pass_mark         integer check (pass_mark >= 0),
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tests_updated_at
  before update on public.tests
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- QUESTIONS
-- ============================================================
create table public.questions (
  id                uuid primary key default gen_random_uuid(),
  test_id           uuid not null references public.tests(id) on delete cascade,
  type              text not null check (type in ('mcq', 'short_answer', 'long_answer')),
  content           text not null,
  -- For MCQ: [{id: uuid, text: string}, ...] (2–6 options)
  options           jsonb,
  correct_option_id text,
  marks             integer not null default 1 check (marks > 0),
  order_index       integer not null default 0,
  created_at        timestamptz not null default now()
);

create index questions_test_id_idx on public.questions(test_id, order_index);

-- ============================================================
-- SUBMISSIONS
-- One submission per student per test
-- ============================================================
create table public.submissions (
  id               uuid primary key default gen_random_uuid(),
  test_id          uuid not null references public.tests(id) on delete cascade,
  student_id       uuid not null references public.profiles(id) on delete cascade,
  status           text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'evaluated')),
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  total_marks      integer,
  obtained_marks   integer,
  focus_violations integer not null default 0,
  session_token    uuid,
  created_at       timestamptz not null default now(),
  unique (test_id, student_id)
);

-- Migrations (run if table already exists):
-- alter table public.submissions add column if not exists focus_violations integer not null default 0;
-- alter table public.submissions add column if not exists session_token uuid;

-- ============================================================
-- ANSWERS
-- One row per question per submission; upserted on autosave
-- ============================================================
create table public.answers (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null references public.submissions(id) on delete cascade,
  question_id        uuid not null references public.questions(id) on delete cascade,
  answer_text        text,
  selected_option_id text,
  marks_obtained     integer,
  teacher_comment    text,
  last_saved_at      timestamptz not null default now(),
  is_skipped         boolean not null default false,
  unique (submission_id, question_id)
);

create index answers_submission_id_idx on public.answers(submission_id);

-- ============================================================
-- TEST ACCESS (invite-code-based)
-- Records which students have unlocked which tests
-- ============================================================
create table public.test_access (
  test_id     uuid not null references public.tests(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  primary key (test_id, student_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.tests       enable row level security;
alter table public.questions   enable row level security;
alter table public.submissions enable row level security;
alter table public.answers     enable row level security;
alter table public.test_access enable row level security;

-- Helper: get current user role
create or replace function public.current_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: check if student has access to a test (bypasses RLS to avoid recursion)
create or replace function public.user_has_test_access(p_test_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.test_access ta
    join public.tests t on t.id = ta.test_id
    where ta.test_id = p_test_id
      and ta.student_id = auth.uid()
      and t.status = 'published'
  );
$$;

-- Helper: check if current user owns a test (bypasses RLS to avoid recursion)
create or replace function public.teacher_owns_test(p_test_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.tests
    where id = p_test_id and teacher_id = auth.uid()
  );
$$;

-- --------------------------------------------------------
-- profiles
-- --------------------------------------------------------
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Teachers can read student profiles they created"
  on public.profiles for select
  using (
    public.current_role() = 'teacher'
    and (id = auth.uid() or created_by = auth.uid() or role = 'student')
  );

create policy "Teachers can insert student profiles"
  on public.profiles for insert
  with check (public.current_role() = 'teacher' and role = 'student');

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- --------------------------------------------------------
-- tests
-- --------------------------------------------------------
create policy "Teachers can manage own tests"
  on public.tests for all
  using (teacher_id = auth.uid());

create policy "Students can view accessible published tests"
  on public.tests for select
  using (
    public.current_role() = 'student'
    and status = 'published'
    and public.user_has_test_access(id)
  );

-- --------------------------------------------------------
-- questions
-- --------------------------------------------------------
create policy "Teachers can manage questions for own tests"
  on public.questions for all
  using (
    exists (
      select 1 from public.tests
      where id = questions.test_id and teacher_id = auth.uid()
    )
  );

create policy "Students can view questions for accessible tests"
  on public.questions for select
  using (
    public.current_role() = 'student'
    and public.user_has_test_access(test_id)
  );

-- --------------------------------------------------------
-- submissions
-- --------------------------------------------------------
create policy "Students manage own submissions"
  on public.submissions for all
  using (student_id = auth.uid());

create policy "Teachers view submissions for their tests"
  on public.submissions for select
  using (
    exists (
      select 1 from public.tests
      where id = submissions.test_id and teacher_id = auth.uid()
    )
  );

create policy "Teachers update submissions for evaluation"
  on public.submissions for update
  using (
    exists (
      select 1 from public.tests
      where id = submissions.test_id and teacher_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- answers
-- --------------------------------------------------------
create policy "Students manage own answers"
  on public.answers for all
  using (
    exists (
      select 1 from public.submissions
      where id = answers.submission_id and student_id = auth.uid()
    )
  );

create policy "Teachers view and update answers for their tests"
  on public.answers for all
  using (
    exists (
      select 1 from public.submissions s
      join public.tests t on t.id = s.test_id
      where s.id = answers.submission_id and t.teacher_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- test_access
-- --------------------------------------------------------
create policy "Teachers manage access for their tests"
  on public.test_access for all
  using (public.teacher_owns_test(test_id));

create policy "Students view own access"
  on public.test_access for select
  using (student_id = auth.uid());

create policy "Students can join via invite (insert own access)"
  on public.test_access for insert
  with check (student_id = auth.uid());
