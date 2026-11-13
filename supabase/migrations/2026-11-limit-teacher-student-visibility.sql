-- Teachers could read EVERY student profile (the old policy had "or role = 'student'").
-- Limit them to students they created, plus students who joined one of their tests.
-- Safe to run more than once.

-- Helper (security definer so it can look at profiles/test_access without recursing into their RLS)
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

drop policy if exists "Teachers can read student profiles they created" on public.profiles;

create policy "Teachers can read student profiles they created"
  on public.profiles for select
  using (
    public.current_role() = 'teacher'
    and (id = auth.uid() or public.teacher_can_see_student(id))
  );
