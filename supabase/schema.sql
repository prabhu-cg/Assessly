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
  year_level   text,
  created_at   timestamptz not null default now()
);

-- Migration (run if table already exists):
-- alter table public.profiles add column if not exists access_token uuid unique default gen_random_uuid();
-- Student year / class label shown on the Students page (e.g. 'Year 4'). Run this once in the Supabase SQL editor:
-- alter table public.profiles add column if not exists year_level text;

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
  -- Optional picture shown with the question (public URL in the question-images bucket)
  image_url         text,
  marks             integer not null default 1 check (marks > 0),
  order_index       integer not null default 0,
  created_at        timestamptz not null default now()
);

create index questions_test_id_idx on public.questions(test_id, order_index);

-- ============================================================
-- SUBMISSIONS
-- Multiple submissions (attempts) per student per test are allowed
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
  created_at       timestamptz not null default now()
);

-- Migrations (run if table already exists):
-- alter table public.submissions add column if not exists focus_violations integer not null default 0;
-- alter table public.submissions add column if not exists session_token uuid;
-- alter table public.submissions drop constraint if exists submissions_test_id_student_id_key;

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

-- Helper: can the current teacher see this student? (created them, or the student joined one of their tests)
create or replace function public.teacher_can_see_student(p_student_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = p_student_id and p.role = 'student' and p.created_by = auth.uid()
    )
    or exists (
      select 1 from public.test_access ta
      join public.tests t on t.id = ta.test_id
      where ta.student_id = p_student_id and t.teacher_id = auth.uid()
    );
$$;

create policy "Teachers can read student profiles they created"
  on public.profiles for select
  using (
    public.current_role() = 'teacher'
    and (id = auth.uid() or public.teacher_can_see_student(id))
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

-- ============================================================
-- ASSIGNMENTS MODULE (same as supabase/migrations/2026-11-add-assignments.sql)
-- ============================================================

-- Assignments module: teachers prepare an assignment (brief, files, optional questions), assign it to students,
-- review what comes back, mark it, comment, and share the result. Safe to run more than once.
--
-- Access model: only teachers read and write these tables through the normal (RLS) client.
-- Students never touch them directly. Every student read and write goes through a server action that checks
-- the student is assigned, uses the service role, and hides marks and answer keys until a result is shared.
--
-- Files live in a private Storage bucket called "assignment-files" (created on first upload by the server).

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
create table if not exists public.assignments (
  id             uuid primary key default gen_random_uuid(),
  teacher_id     uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  description    text,
  instructions   text,
  status         text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  due_at         timestamptz,
  -- Marks for the written response and files (on top of any question marks). 0 = questions only.
  response_marks integer not null default 0 check (response_marks >= 0),
  pass_mark      integer check (pass_mark >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists assignments_updated_at on public.assignments;
create trigger assignments_updated_at
  before update on public.assignments
  for each row execute procedure public.set_updated_at();

create index if not exists assignments_teacher_idx on public.assignments(teacher_id, created_at desc);

-- ============================================================
-- ASSIGNMENT QUESTIONS (same three types as tests)
-- ============================================================
create table if not exists public.assignment_questions (
  id                uuid primary key default gen_random_uuid(),
  assignment_id     uuid not null references public.assignments(id) on delete cascade,
  type              text not null check (type in ('mcq', 'short_answer', 'long_answer')),
  content           text not null,
  options           jsonb,
  correct_option_id text,
  -- Optional picture (public URL in the question-images bucket)
  image_url         text,
  marks             integer not null default 1 check (marks > 0),
  order_index       integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists assignment_questions_idx on public.assignment_questions(assignment_id, order_index);

-- ============================================================
-- ASSIGNMENT FILES (resources the teacher attaches for students)
-- ============================================================
create table if not exists public.assignment_files (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  name          text not null,
  path          text not null,
  size_bytes    integer not null default 0,
  content_type  text,
  created_at    timestamptz not null default now()
);

create index if not exists assignment_files_idx on public.assignment_files(assignment_id);

-- ============================================================
-- ASSIGNEES (which students were given the assignment)
-- ============================================================
create table if not exists public.assignment_assignees (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create index if not exists assignment_assignees_student_idx on public.assignment_assignees(student_id);

-- ============================================================
-- SUBMISSIONS (one per student per assignment; "returned" lets the student revise and hand in again)
-- released_at is the moment the teacher shared the result. Until then the student sees no marks or comments.
-- ============================================================
create table if not exists public.assignment_submissions (
  id                      uuid primary key default gen_random_uuid(),
  assignment_id           uuid not null references public.assignments(id) on delete cascade,
  student_id              uuid not null references public.profiles(id) on delete cascade,
  status                  text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'returned', 'evaluated')),
  response_text           text,
  started_at              timestamptz not null default now(),
  submitted_at            timestamptz,
  is_late                 boolean not null default false,
  revision_count          integer not null default 0,
  total_marks             integer,
  response_marks_obtained integer,
  obtained_marks          integer,
  overall_feedback        text,
  returned_at             timestamptz,
  evaluated_at            timestamptz,
  released_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (assignment_id, student_id)
);

drop trigger if exists assignment_submissions_updated_at on public.assignment_submissions;
create trigger assignment_submissions_updated_at
  before update on public.assignment_submissions
  for each row execute procedure public.set_updated_at();

create index if not exists assignment_submissions_assignment_idx on public.assignment_submissions(assignment_id, status);
create index if not exists assignment_submissions_student_idx on public.assignment_submissions(student_id);

-- ============================================================
-- ANSWERS (to the assignment's questions)
-- ============================================================
create table if not exists public.assignment_answers (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null references public.assignment_submissions(id) on delete cascade,
  question_id        uuid not null references public.assignment_questions(id) on delete cascade,
  answer_text        text,
  selected_option_id text,
  marks_obtained     integer,
  teacher_comment    text,
  last_saved_at      timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index if not exists assignment_answers_submission_idx on public.assignment_answers(submission_id);

-- ============================================================
-- SUBMISSION FILES (what the student attached)
-- ============================================================
create table if not exists public.assignment_submission_files (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.assignment_submissions(id) on delete cascade,
  name          text not null,
  path          text not null,
  size_bytes    integer not null default 0,
  content_type  text,
  created_at    timestamptz not null default now()
);

create index if not exists assignment_submission_files_idx on public.assignment_submission_files(submission_id);

-- ============================================================
-- ROW LEVEL SECURITY (teacher-only; students go through server actions)
-- ============================================================
alter table public.assignments                  enable row level security;
alter table public.assignment_questions         enable row level security;
alter table public.assignment_files             enable row level security;
alter table public.assignment_assignees         enable row level security;
alter table public.assignment_submissions       enable row level security;
alter table public.assignment_answers           enable row level security;
alter table public.assignment_submission_files  enable row level security;

-- Helper: does the current user own this assignment? (security definer avoids policy recursion)
create or replace function public.teacher_owns_assignment(p_assignment_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.assignments
    where id = p_assignment_id and teacher_id = auth.uid()
  );
$$;

drop policy if exists "Teachers manage own assignments" on public.assignments;
create policy "Teachers manage own assignments"
  on public.assignments for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers manage questions of own assignments" on public.assignment_questions;
create policy "Teachers manage questions of own assignments"
  on public.assignment_questions for all
  using (public.teacher_owns_assignment(assignment_id))
  with check (public.teacher_owns_assignment(assignment_id));

drop policy if exists "Teachers manage files of own assignments" on public.assignment_files;
create policy "Teachers manage files of own assignments"
  on public.assignment_files for all
  using (public.teacher_owns_assignment(assignment_id))
  with check (public.teacher_owns_assignment(assignment_id));

drop policy if exists "Teachers manage assignees of own assignments" on public.assignment_assignees;
create policy "Teachers manage assignees of own assignments"
  on public.assignment_assignees for all
  using (public.teacher_owns_assignment(assignment_id))
  with check (public.teacher_owns_assignment(assignment_id));

drop policy if exists "Teachers manage submissions of own assignments" on public.assignment_submissions;
create policy "Teachers manage submissions of own assignments"
  on public.assignment_submissions for all
  using (public.teacher_owns_assignment(assignment_id))
  with check (public.teacher_owns_assignment(assignment_id));

drop policy if exists "Teachers manage answers of own assignments" on public.assignment_answers;
create policy "Teachers manage answers of own assignments"
  on public.assignment_answers for all
  using (exists (
    select 1 from public.assignment_submissions s
    where s.id = assignment_answers.submission_id and public.teacher_owns_assignment(s.assignment_id)
  ));

drop policy if exists "Teachers manage submission files of own assignments" on public.assignment_submission_files;
create policy "Teachers manage submission files of own assignments"
  on public.assignment_submission_files for all
  using (exists (
    select 1 from public.assignment_submissions s
    where s.id = assignment_submission_files.submission_id and public.teacher_owns_assignment(s.assignment_id)
  ));
