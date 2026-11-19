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
- Optional **image on any question**: choose a file, drag one in, or paste a screenshot straight from the clipboard (⌘V / Ctrl+V). PNG, JPG, WebP or GIF up to 5 MB, one per question; large PNG and JPG images are resized automatically. Images show on the student's test and results pages and in grading
- Assign marks per question; total marks are calculated automatically
- Reorder questions; add as many as needed
- MCQ answers are auto-graded on submission — no manual work required

### Assignments
- Any attached file (the teacher's brief files, a student's own files in review and in their results) opens in a right-hand drawer: PDFs, PNG, JPG, WebP, GIF and text files are shown in place; Word, Excel, PowerPoint and zip files can't be previewed, so the drawer offers Download. Every file also has Open in new tab and a quick download button
- Create an assignment with a title, summary, written brief, due date, marks for the written work and an optional pass mark
- Optional questions, the same three types as tests (multiple choice is auto-marked on hand-in); reorder with the up and down buttons
- Optional image on any assignment question, same as tests: choose a file, drag one in, or paste a screenshot (PNG, JPG, WebP or GIF up to 5 MB, one per question). Images show to students on the work and result pages and to you in review
- Attach up to 5 files for students (PDF, Word, Excel, PowerPoint, text, image or zip, 10 MB each); students open them from the brief
- Draft → Publish → Archive; students only see a published assignment
- Assign it to the students you choose, from a searchable picker; unassign anyone who has not handed in
- Track every student from Not started to In progress, Handed in, Returned, Marked and Shared, with search, filters, a Late flag and scores
- Review one student's work: written response, files, answers; give marks (clamped to each maximum), a comment per answer and overall feedback
- Return work for revision with a note; the student edits and hands in again
- Share the result when ready: per student, or all marked results at once. Students see no marks, comments or answer keys until you share
- The dashboard's Needs grading list and the Assignments out panel include assignments

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

### Assignments
- Assignments sit under their own Assignments tab, with To do and Completed lists, search and a due-date order; the dashboard links to what is waiting
- Each assignment shows the brief and teacher files (click to preview), in three tabs: **Brief** (the brief and your teacher's files, click to preview), **Questions** (with an answered count) and **Your files** ("Type or upload your work": a text box plus up to 5 files, 10 MB each, both optional). The Questions tab only appears when there are questions; everything stays as you switch tabs, and Hand in is always at the bottom
- Autosave: work saves as you type; Save draft and a Hand in confirmation that warns when it is late
- Late work is accepted and marked Late
- After hand-in the work is locked, shown as Waiting for marks
- If the teacher returns it, the note shows at the top and the student can revise and hand in again
- Once the teacher shares the result: score, percentage, pass or not, overall feedback, per-answer marks, comments and correct answers

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

## Billing & Payments *(planned — not yet built)*

> Full design in [BILLING.md](./BILLING.md)

### For Teachers
- Set a recurring fee per student (weekly or monthly)
- Dashboard shows active subscribers, overdue students, and revenue summary
- Manually mark students as exempt (free access)
- Send payment invites to students
- Link to Stripe dashboard for full payment history

### Access Control
- Students with an active or exempt subscription can take tests normally
- Students with a lapsed, past-due, or unconfigured subscription are blocked at the test instructions screen with a clear message

### Notifications
- Stripe sends automated receipts and payment failure emails to students
- Teacher is notified (email + in-app) when a student goes past due
- Students receive a reminder 3 days before their subscription renews

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

### Appearance
- On phones, navigation is a hamburger menu in the top bar that opens the app's links in a sheet; there is no bottom bar
- Light and dark mode for teachers and students, switched with a toggle in the top bar (light by default, remembered per browser)

### Security
- All database access governed by Row Level Security (RLS) policies
- Students can only read tests they have been granted access to
- Teachers can only read/write their own tests and students (plus students who joined one of their tests by invite code)
- Assignment tables are teacher-only under row-level security; students reach their own assignment through server actions that check they are assigned, and answer keys, marks and comments stay on the server until a result is shared
- Assignment files live in a private storage bucket and are served with one-hour signed links
- Service role key used server-side only (never exposed to the client)
- Environment variables managed via Vercel — never committed to the repository

---

*Last updated: November 2026 (assignments added)*
