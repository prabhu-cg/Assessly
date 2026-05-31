# Assessly — Feature Documentation

> Online examination platform for teachers and students. Built for reliability, fairness, and ease of use.

---

## For Teachers

### Test Management
- Create tests with a title, description, duration, pass mark, and optional date/time window
- Draft → Publish → Archive workflow — tests are only visible to students when published
- Edit any test detail at any time while in draft
- Delete tests (with confirmation prompt)
- Each test gets a unique 8-character invite code on creation

### Question Builder
- Three question types: **Multiple Choice (MCQ)**, **Short Answer**, and **Essay**
- MCQ supports 2–6 options per question with a designated correct answer
- Assign marks per question; total marks are calculated automatically
- Reorder questions; add as many as needed
- MCQ answers are auto-graded on submission — no manual work required

### Student Management
- Create student accounts directly from the dashboard (no self-registration)
- Students receive credentials from the teacher — controlled access
- View all students in a searchable list with join date

### Submissions & Grading
- View all submissions across all tests, filterable by test and status
- Three statuses: **In Progress**, **Submitted**, **Evaluated**
- Grade short answer and essay questions with a marks input and optional written feedback
- MCQ questions are auto-graded — scores appear instantly on submission
- Finalize evaluation to release results to the student
- Score summary shows marks obtained vs. total, pass/fail against the pass mark

### Exam Integrity Visibility
- Each submission displays the number of **focus violations** recorded during the test
- Violations are shown as a warning badge (⚠) on both the submissions list and the evaluation page
- Teachers can factor violations into their assessment of a student's submission

---

## For Students

### Joining & Access
- Join a test using an **invite code** shared by the teacher — no browsing or searching
- Dashboard shows all joined tests, their status, and available actions
- Tests are only accessible while published; archived tests are hidden

### Taking a Test
- Test opens in **fullscreen mode** — browser chrome is hidden during the exam
- Persistent countdown timer visible at all times
- Question navigator panel (desktop sidebar / mobile drawer) for jumping between questions
- Answer types:
  - MCQ: tap/click to select an option
  - Short Answer: text input (auto-saved)
  - Essay: large text area (auto-saved)
- **Autosave** — every answer is saved automatically as you type (debounced per question)
- Skip questions and return to them later
- Progress bar shows how many questions are answered

### Review & Submit
- "Review & Submit" dialog shows answered, skipped, and unanswered counts before final submission
- Warns if there are unanswered questions — student must confirm before submitting
- Test auto-submits when the timer reaches zero

### Results
- Results page available immediately after submission
- Evaluated results show: total score, percentage bar, pass/fail indicator
- Per-question breakdown: colour-coded by full marks / partial / no marks / skipped / pending
- MCQ results show correct answer vs. selected answer
- Teacher's written feedback is displayed per question when available
- Pending submissions show an "Awaiting Evaluation" state until the teacher grades

---

## Exam Integrity & Anti-Cheat

### Fullscreen Enforcement
- Test opens in fullscreen automatically when the student clicks Start
- Exiting fullscreen (Esc, F11, or swipe on mobile) is detected and counted as a violation
- A "Return to Fullscreen" button appears in the test header if the student exits
- If the student refreshes mid-test, fullscreen is re-requested automatically

### Focus & Tab Monitoring
- Switching to another browser tab is detected via the Page Visibility API
- Switching to another application (Alt+Tab, Cmd+Tab) is detected via window focus events
- Both events share a 2-second debounce to avoid double-counting

### Violation System
- Each detected event (fullscreen exit, tab switch, window switch) counts as **one violation**
- A violation counter is shown in the test header (e.g., ⚠ 1/3)
- A warning dialog appears after each violation telling the student how many remain
- After **3 violations**, the test is **automatically submitted** — no further action needed
- All violation counts are stored in the database and visible to the teacher

### Concurrent Session Detection
- A unique session token is written to the database each time a student opens a test
- A heartbeat check runs every 30 seconds during the test
- If the same test is opened on a second device or browser, the token is overwritten
- The first device detects the mismatch and shows a "Session Conflict" dialog, locking that session out
- Only one active session per student per test is permitted

### Input Restrictions
- Right-click (context menu) is disabled on the test page
- Keyboard shortcuts blocked: `Ctrl+T` (new tab), `Ctrl+N` (new window), `Ctrl+W` (close tab)
- Developer tools shortcuts blocked: `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`

### Pre-Test Integrity Notice
- The instructions page displays a red **Exam Integrity Rules** card before the student starts
- Rules listed: fullscreen requirement, no tab switching, violation limit, single-device rule, teacher visibility

### Honest Scope
The above measures cover browser-based cheating on a single device. They do not detect:
- Use of a second physical device (phone, tablet) to look up answers
- Physical materials (notes, books)
- Browser developer tools opened via the browser's own menu (not keyboard)

---

## Technical

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (base-ui) |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (email + password) |
| Hosting | Vercel (production) |
| Repository | GitHub |

### Security
- All database access governed by Row Level Security (RLS) policies
- Students can only read tests they have been granted access to
- Teachers can only read/write their own tests and students
- Service role key used server-side only (never exposed to the client)
- Environment variables managed via Vercel — never committed to the repository

---

*Last updated: May 2026*
