# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Teachers, who create tests and assignments, manage student accounts (name and year, such as "Year 4"), and grade submissions from a signed-in dashboard organised around what needs their marks. Students, who join or open tests via an invite code or personal link, work through a To do and Completed list that may grow long, take tests in a fullscreen exam view, and hand in assignments (written work and files) before a due date. The teacher's situation (school class, tutor, trainer) is not yet confirmed; treat it as open.

## Product Purpose

Assessly is an online examination and assignment platform: teachers build tests and assignments, share them with students, and grade the results; students take timed tests, hand in assignments, and see their results once released. Success is a teacher going from blank test to released grades with little busywork, and a student completing an exam without friction or doubt that answers were saved.

## Positioning

Not yet confirmed by the owner. Evidence in the code points to controlled access (teacher-created student accounts, invite codes), exam-integrity visibility (focus-violation counts), and auto-graded MCQs. Treat the position as open until confirmed.

## Operating Context

Teachers work in a desktop browser: a work-queue dashboard (submissions waiting, published tests), a filterable Tests card list, a searchable Students card list with a per-student details drawer listing every assigned test and result, and a Submissions list, and an Assignments workspace (tracker, questions, brief and files, review). On a phone the navigation is a menu button at the top, not a bottom bar. Students take tests in fullscreen with a persistent countdown, autosave, a question navigator, and skip-and-return. They do assignments in three tabs (Brief, Questions, Your files), where typed work and uploads (up to five files, 10 MB each) live under Your files, and attached files open in a preview drawer. Tests move Draft, Publish, Archive. Questions are multiple choice (2 to 6 options), short answer, or essay, each with marks and an optional image (chosen, dragged in, or pasted from a screenshot; PNG, JPG, WebP or GIF up to 5 MB, one per question). Written answers are graded by the teacher, who then finalizes an evaluation to release results.

## Capabilities and Constraints

Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui on base-ui, Supabase auth and Postgres with row-level security, hosted on Vercel. Preserve the existing features and flows: test lifecycle, three question types with an optional image per question (stored in the public `question-images` Supabase bucket, URL in `questions.image_url`, added by `supabase/migrations/2026-11-add-question-image.sql`), student management (including the optional year label stored in `profiles.year_level`, added by `supabase/migrations/2026-10-add-profile-year-level.sql`), submissions list and evaluation with a sticky summary, drawers for create, edit, preview and student details. Teachers can read only the students they created, plus students who joined one of their tests (`supabase/migrations/2026-11-limit-teacher-student-visibility.sql`). Students have no sign-out control by design: they use a personal link. Assignments (migration `supabase/migrations/2026-11-add-assignments.sql`): a brief, optional files and questions, a due date, students picked by the teacher, late work accepted and flagged, one submission per student that the teacher can return for revision, and a per-student share step before marks and comments are visible. Their files live in the private `assignment-files` bucket, and students read assignment data only through server actions. Terminology: test, assignment, question, submission, hand in, evaluation, return for revision, share a result, invite code, focus violation.

## Brand Commitments

Name: Assessly, tagline "Assess smarter. Teach better." Binding: the SiteNest "Butter" tokens shared with Aemora (amber #e8b923 as a fill, ochre #826400 for accent text, desk #fcfaf3), Newsreader for headlines with DM Sans for everything else, the shield-check logo mark in deep amber (#d4a615, the `--logo` token, also the favicon), and pill buttons. Light is the default; dark is a warm charcoal ramp. A toggle switches between them, with no system option.

## Evidence on Hand

Feature documentation in FEATURES.md and progress notes in PROGRESS.md. The landing page's product screenshots are captures of fictional sample data (a teacher named Paula, sample tests and students) in light and dark; no real customer data appears. A demo teacher account with the same sample data exists for sharing. No testimonials, customer names, or usage statistics exist; do not invent any.

## Product Principles

Controlled and calm: exams should feel trustworthy, never gimmicky. Fast to the next action: every teacher view makes the next step (publish, add questions, grade) obvious. Honest feedback: saved, submitted, graded and violation states are always legible. Same flows, fresher surface: redesign changes look and layout, not what the product does. Scale by default: any list a teacher or student may fill (tests, students, completed work) needs search, grouping and a capped first page, never an ever-longer scroll.

## Accessibility & Inclusion

Meet WCAG AA: at least 4.5:1 text contrast, visible focus states, usable on keyboard. Students may be young or on small screens; keep touch targets and reading sizes generous in student views.
