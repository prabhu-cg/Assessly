# Assessly — Project Progress & Handoff

## What Is This?
A full-stack online examination platform for teachers and students.
Built with Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui (base-ui v4), and Supabase.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui v4 (base-ui, NOT radix) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email + password) |
| Forms | React Hook Form + Zod v4 |
| Font | Newsreader (headlines) + DM Sans (Google Fonts via next/font) |
| Deployment | Vercel (Free plan) |

### Important API notes
- shadcn/ui v4 uses **base-ui** — use `render={<Link href="..." />}` instead of `asChild`
- Zod v4 uses `.issues[0].message` not `.errors[0].message`
- Admin client lives in `src/lib/supabase/admin.ts` (uses `SUPABASE_SERVICE_ROLE_KEY`)
- Next.js 16 renamed `middleware.ts` → `proxy.ts` and `middleware()` → `proxy()`

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          — Login page (client component)
│   ├── (student)/             — Student-protected layout + pages
│   │   └── student/
│   │       ├── dashboard/     — Available & completed tests, link to assignments
│   │       ├── assignments/   — List, and [id] to work on, hand in and read feedback
│   │       ├── join/          — Enter invite code
│   │       └── tests/[id]/
│   │           ├── instructions/  — Pre-test info page
│   │           ├── take/          — Test-taking UI (timer, autosave, navigator)
│   │           └── results/       — Post-submit results
│   ├── (teacher)/             — Teacher-protected layout + pages
│   │   └── teacher/
│   │       ├── dashboard/     — Overview + quick actions
│   │       ├── tests/         — List, create, edit, questions
│   │       ├── assignments/   — List, [id] workspace (students, questions, files), submissions/[submissionId] review
│   │       ├── students/      — List + create student accounts
│   │       └── submissions/   — View + evaluate submissions
│   └── actions/               — Server actions
│       ├── auth.ts            — login, logout, createStudent
│       ├── tests.ts           — createTest, updateTest, joinTest, etc.
│       ├── questions.ts       — createQuestion, updateQuestion, deleteQuestion
│       ├── submissions.ts     — startSubmission, saveAnswer, submitTest, evaluateAnswer
│       ├── assignments.ts     — teacher: assignment CRUD, assign, questions, files, review, return, share
│       └── assignment-submissions.ts — student: draft, files, hand in (service role, own rows only)
├── components/
│   ├── shared/
│   │   ├── top-nav.tsx        — Header + tab navigation (replaces sidebar)
│   │   ├── navbar.tsx         — (legacy, no longer used)
│   │   └── sidebar.tsx        — (legacy, no longer used)
│   ├── student/
│   │   ├── test-timer.tsx     — Countdown timer with warning states
│   │   └── question-navigator.tsx — Grid navigator (answered/skipped/current)
│   └── teacher/
│       ├── test-form.tsx      — Create/edit test form
│       └── question-form.tsx  — Add/edit question (MCQ/short/long)
├── lib/
│   ├── supabase/
│   │   ├── client.ts          — Browser client
│   │   ├── server.ts          — Server component client
│   │   └── admin.ts           — Service role client (teacher creates students)
│   └── validators/schemas.ts  — Zod schemas for all forms
├── types/database.ts          — TypeScript types for all DB tables
└── proxy.ts                   — Route protection + role-based redirects
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends auth.users — stores full_name, role, created_by |
| `tests` | Test metadata — title, duration, invite_code, status |
| `questions` | Questions per test — MCQ/short_answer/long_answer |
| `submissions` | Multiple attempts per student per test — tracks status + scores |
| `answers` | One per question per submission — autosaved |
| `test_access` | Which students can access which tests (invite code gated) |
| `assignments` | Assignment brief, due date, status, marks for written work |
| `assignment_questions` | Optional questions (MCQ/short/long) |
| `assignment_files` | Teacher files attached for students (private bucket `assignment-files`) |
| `assignment_assignees` | Which students were given which assignment |
| `assignment_submissions` | One per student per assignment: status, response, late flag, marks, feedback, `released_at` |
| `assignment_answers` | Per-question answers, marks and teacher comments |
| `assignment_submission_files` | Files a student attached |

Schema file: `supabase/schema.sql` — run this in Supabase SQL editor to set up.

Existing projects: run `supabase/migrations/2026-11-add-assignments.sql` once to add the assignments tables, then `supabase/migrations/2026-11-add-assignment-question-image.sql` for question images (both safe to re-run). Until it has run, the Assignments pages show a one-line setup notice.

---

## Environment Variables

File: `.env.local` (never commit this)

```
NEXT_PUBLIC_SUPABASE_URL=https://nrfyuetqwiqhofneruih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Design Tokens

| Token | Value |
|-------|-------|
Butter system (SiteNest / Aemora tokens). Full detail in [DESIGN.md](./DESIGN.md).

| Token | Value |
|-------|-------|
| Headline font | Newsreader 500 (every h1 and h2) |
| Body font | DM Sans (600 for titles, labels, buttons) |
| Primary fill (buttons, logo, active tint) | `#e8b923` amber, charcoal text on it, never used as text |
| Accent text / focus ring | `#826400` ochre |
| Background | `#ffffff` (paper) |
| Surface (sidebar, landing bands) | `#fcfaf3` (desk) |
| Hover / secondary tint | `#f8f4e4` (sand) |
| Border | `#ece5cc` hairline, `#dccfa6` strong, `#8a7f6e` for field outlines |
| Radius | pill buttons, `8px` fields, `12px` menus, `20px` cards |
| Input height | `40px` |
| Button height | `44px` (36 sm, 52 lg) |
| Theme | light (default) and dark, toggle in every top bar, no system option |

---

## How to Run Locally

```bash
npm run dev
```

Opens at `http://localhost:3000`

---

## First-Time Teacher Account Setup

Since students are created via the app, the first teacher must be set up manually:

1. Go to Supabase → **Authentication → Users → Add user → Create new user**
2. Enter email + password
3. Go to **Table Editor → profiles** → find the row → set `role = teacher` → save
4. Sign in at `localhost:3000`

---

## Current Status

### ✅ Phase 1 — Complete
- [x] Project scaffold (Next.js 15 + TS + Tailwind + shadcn/ui)
- [x] Supabase schema + RLS policies
- [x] Email auth — login / logout
- [x] Role-based routing (teacher / student)
- [x] Teacher: dashboard, test CRUD, question management (MCQ/short/long)
- [x] Teacher: create student accounts (Supabase Admin API)
- [x] Teacher: view submissions, evaluate answers, finalize scores
- [x] Student: dashboard, join test via invite code
- [x] Student: test-taking UI — timer, autosave, question navigator, submit
- [x] Student: results page
- [x] Top tab navigation (replaced sidebar)
- [x] Theme: Butter reskin (amber accent, Newsreader + DM Sans, pill buttons), light and dark mode with a toggle
- [x] Question images: choose, drag in, or paste a screenshot (PNG/JPG/WebP/GIF, up to 5 MB, one per question); files are deleted with the question, the image or the test
- [x] Teachers limited to their own students by row-level security
- [x] Landing page: sample-data screenshots in light and dark, images and dark-mode features, FAQ, SiteNest-style footer
- [x] Assignments module: teacher builds, assigns, tracks, reviews, comments, returns and shares; student works, hands in and reads feedback (see FEATURES.md). Needs the 2026-11-add-assignments migration
- [x] TypeScript clean (0 errors)
- [x] Git initialized, initial commit made

---

## Next Up

### Phase 2 — End-to-End Testing + Polish
- [ ] Test the full flow: teacher creates test → student joins → takes test → teacher evaluates
- [ ] Polish login page UI
- [ ] Better empty states and error messages
- [ ] Student: review all answers before final submit
- [ ] Student: per-question score breakdown after evaluation

### Phase 3 — Teacher Power Features
- [ ] Copy invite code with one click
- [ ] Bulk assign test to multiple students at once
- [ ] Clone/duplicate an existing test
- [ ] Submission stats per test (average score, pass rate)

### Phase 4 — Notifications
- [ ] Email to student when test is evaluated (Supabase + Resend)

### Phase 5 — Deployment
- [ ] Push repo to GitHub
- [ ] Connect to Vercel (import repo → set 3 env vars → deploy)
- [ ] Custom domain (optional)

### Phase 6 — Billing & Payments
> Full design in [BILLING.md](./BILLING.md)

#### Phase 6A — Manual tracking (no Stripe)
- [ ] `student_billing` table (status: active / past_due / exempt / none)
- [ ] Payment status badges on Students page
- [ ] Teacher can toggle billing status per student
- [ ] Access gate on test instructions page — block non-active students

#### Phase 6B — Stripe integration
- [ ] `teacher_billing_config` table + Stripe plan creation
- [ ] Stripe Customer + Subscription per student
- [ ] Webhook handler to sync status on payment events (`customer.subscription.updated`, `invoice.payment_failed`, etc.)
- [ ] Billing settings page (`/teacher/billing`)
- [ ] "Invite to pay" flow — Stripe payment link or hosted Checkout

#### Phase 6C — Billing notifications
- [ ] Vercel Cron: renewal reminder email to student 3 days before `current_period_end`
- [ ] Webhook-triggered teacher email when student goes `past_due`
- [ ] In-app dashboard banner for overdue students

---

## Known Issues / Notes
- Free Supabase projects **pause after 1 week of inactivity** — upgrade when going live
- `proxy.ts` = Next.js 16 renamed middleware; export must be named `proxy` not `middleware`
- The `createStudent` action requires the service role key — only works server-side
- MCQ auto-grading happens at submit time; short/long answers require manual evaluation
