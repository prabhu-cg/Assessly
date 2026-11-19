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
