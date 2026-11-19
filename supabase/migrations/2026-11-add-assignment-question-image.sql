-- Optional image on an assignment question (choose a file, drag one in, or paste a screenshot), same as test questions.
-- The file lives in the public "question-images" storage bucket, under a folder named after the assignment.
-- Safe to run more than once.
alter table public.assignment_questions add column if not exists image_url text;
