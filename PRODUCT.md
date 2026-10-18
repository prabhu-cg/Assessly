# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Teachers, who create tests, manage student accounts (name and year, such as "Year 4"), and grade submissions from a signed-in dashboard organised around what needs their marks. Students, who join or open tests via an invite code or personal link, work through a To do and Completed list that may grow long, and take tests in a fullscreen exam view. The teacher's situation (school class, tutor, trainer) is not yet confirmed; treat it as open.

## Product Purpose

Assessly is an online examination platform: teachers build tests, share them with students, and grade the results; students take timed tests and see their results once released. Success is a teacher going from blank test to released grades with little busywork, and a student completing an exam without friction or doubt that answers were saved.

## Positioning

Not yet confirmed by the owner. Evidence in the code points to controlled access (teacher-created student accounts, invite codes), exam-integrity visibility (focus-violation counts), and auto-graded MCQs. Treat the position as open until confirmed.

## Operating Context

Teachers work in a desktop browser: a work-queue dashboard (submissions waiting, published tests), a filterable Tests card list, a searchable Students card list with a per-student details drawer listing every assigned test and result, and a Submissions list. Students take tests in fullscreen with a persistent countdown, autosave, a question navigator, and skip-and-return. Tests move Draft, Publish, Archive. Questions are multiple choice (2 to 6 options), short answer, or essay, each with marks. Written answers are graded by the teacher, who then finalizes an evaluation to release results.

## Capabilities and Constraints

Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui on base-ui, Supabase auth and Postgres with row-level security, hosted on Vercel. Preserve the existing features and flows: test lifecycle, three question types, student management (including the optional year label stored in `profiles.year_level`, added by `supabase/migrations/2026-10-add-profile-year-level.sql`), submissions list and evaluation with a sticky summary, drawers for create, edit, preview and student details. Students have no sign-out control by design: they use a personal link. Terminology: test, question, submission, evaluation, invite code, focus violation.

## Brand Commitments

Name: Assessly, tagline "Assess smarter. Teach better." Binding: terracotta primary #c74504, Manrope typeface, the shield-check logo mark, and token consistency with the Doxa design system. Both a light and a warm dark theme must keep working.

## Evidence on Hand

Feature documentation in FEATURES.md and progress notes in PROGRESS.md. Real screenshots do not exist outside the sample dashboard on the landing page. No testimonials, customer names, or usage statistics exist; do not invent any.

## Product Principles

Controlled and calm: exams should feel trustworthy, never gimmicky. Fast to the next action: every teacher view makes the next step (publish, add questions, grade) obvious. Honest feedback: saved, submitted, graded and violation states are always legible. Same flows, fresher surface: redesign changes look and layout, not what the product does. Scale by default: any list a teacher or student may fill (tests, students, completed work) needs search, grouping and a capped first page, never an ever-longer scroll.

## Accessibility & Inclusion

Meet WCAG AA: at least 4.5:1 text contrast, visible focus states, usable on keyboard. Students may be young or on small screens; keep touch targets and reading sizes generous in student views.
