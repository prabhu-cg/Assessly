-- Optional image on a question (uploaded, dragged in, or pasted from a screenshot).
-- The file itself lives in the public "question-images" storage bucket, which the app creates on first upload.
alter table public.questions add column if not exists image_url text;
