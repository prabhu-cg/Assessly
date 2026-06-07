# Assessly — Billing & Payments Design

> This document captures the agreed design for student fee management. Nothing here is built yet. It exists so decisions made in conversation are not lost.

---

## Mental Model

The teacher charges students a recurring fee (weekly or monthly) to access their tests. Payment is managed inside Assessly — one tool for tests and payments. A student with an unpaid or lapsed subscription cannot start a test.

---

## Payment Model

| Decision | Choice | Reason |
|---|---|---|
| Billing unit | Per student | Simpler than per-test; matches how tutors charge |
| Intervals | Weekly or Monthly | Teacher chooses one interval per their account |
| Processor | Stripe Subscriptions | Handles retries, receipts, card failures automatically |
| Currency | Teacher's local currency | Set once in billing config |
| Free students | Supported (optional) | Some students may be exempt (e.g. scholarship) |

A teacher sets **one plan** (amount + interval). All paying students are on that plan. Free/exempt students are explicitly flagged as such.

---

## Data Model

### New tables

```sql
-- Teacher's billing configuration
create table public.teacher_billing_config (
  teacher_id        uuid primary key references public.profiles(id) on delete cascade,
  stripe_account_id text,                          -- Stripe Connect account (if teacher collects directly)
  amount            integer not null,              -- in smallest currency unit (e.g. pence, cents)
  currency          text not null default 'gbp',
  interval          text not null check (interval in ('week', 'month')),
  stripe_price_id   text,                          -- created in Stripe when config is saved
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Per-student payment status
create table public.student_billing (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.profiles(id) on delete cascade,
  teacher_id            uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id    text,
  stripe_subscription_id text,
  status                text not null default 'none'
                          check (status in ('active', 'past_due', 'cancelled', 'exempt', 'none')),
  current_period_end    timestamptz,               -- when the current paid period expires
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (student_id, teacher_id)
);
```

### Status meanings

| Status | Meaning | Can take tests? |
|---|---|---|
| `active` | Subscription is current and paid | ✅ Yes |
| `past_due` | Payment failed, Stripe is retrying | ❌ No |
| `cancelled` | Subscription was cancelled | ❌ No |
| `exempt` | Manually marked free by teacher | ✅ Yes |
| `none` | No subscription set up yet | ❌ No |

---

## Access Gate

Before a student can start a test, the server checks `student_billing.status`:

```
status === 'active' OR status === 'exempt'  →  allow
otherwise                                   →  block with message
```

**Block screen copy:**
> "Your subscription is not active. Please contact your teacher to continue accessing tests."

This check happens server-side in the test instructions page — students never reach the test-taking UI without a valid status.

---

## Teacher-Facing UI

### Students page — billing column

Each student row gains a payment status badge and a manage action:

```
JJ  Jack Jill      ● Active    Next: 12 Jul    [Manage]
JG  James Godard   ● Past due  Since: 01 Jun   [Remind]  [Manage]
SA  Sara Ahmed     ● Exempt    —
NK  New Student    ● Not set   —               [Invite to pay]
```

Badge colours:
- `active` → green
- `past_due` → amber
- `cancelled` / `none` → muted grey
- `exempt` → blue/outline

### Test detail — students section

No change to the existing layout. A small amber warning icon (⚠) appears next to the student's name if their payment is `past_due` or `cancelled`, so the teacher has context when reviewing submissions. Tooltip: "Subscription past due".

### New "Billing" settings page (`/teacher/billing`)

- Set or update the plan (amount + interval)
- See total active subscribers, monthly revenue estimate
- Link to Stripe dashboard for detailed payment history

---

## Notifications

### Stripe-native (zero code required)
| Event | Recipient | Via |
|---|---|---|
| Payment succeeded | Student | Stripe receipt email |
| Payment failed | Student | Stripe dunning email |
| Subscription cancelled | Student | Stripe email |

### Custom (Vercel Cron + Resend)
| Trigger | Recipient | Timing |
|---|---|---|
| Subscription renews in 3 days | Student | Daily cron checks `current_period_end` |
| Student goes `past_due` | Teacher | Stripe webhook → email summary |
| Student's subscription is `none` after 7 days of being added | Teacher | Daily cron |

### In-app
- Dashboard summary card: "N students with overdue payments" with a link to the students page
- Students page amber banner when any student is `past_due`

---

## Implementation Phases

### Phase A — Manual tracking (no Stripe, MVP)
Build the UI and data model without any payment processor. Teacher manually marks each student as `active`, `past_due`, or `exempt`. The access gate enforces status. Useful for teachers who collect cash/bank transfer offline.

Scope:
- `student_billing` table (status + notes only, no Stripe columns)
- Status badges on Students page
- Access gate on test instructions page
- Teacher can toggle status per student

### Phase B — Stripe integration
Wire up Stripe Subscriptions for automated billing.

Scope:
- `teacher_billing_config` table + Stripe plan creation
- Stripe Customer + Subscription creation per student
- Webhook handler to sync status on payment events
- Billing settings page (`/teacher/billing`)
- "Invite to pay" flow — teacher sends student a Stripe payment link

### Phase C — Notifications
Scope:
- Vercel Cron job for upcoming renewal reminders (Resend)
- Webhook-triggered teacher notification on `past_due`
- In-app dashboard banner

---

## Open Questions

- [ ] **Who is the Stripe account?** Does the teacher collect payments directly (Stripe Connect) or does Assessly collect and pay out? Connect is more complex but gives teachers full control.
- [ ] **What happens to in-progress tests when a payment lapses?** Current proposal: allow them to finish, block the next attempt.
- [ ] **Grace period for `past_due`?** Stripe retries for several days — should we mirror that grace period in the access gate, or block immediately on first failure?
- [ ] **Student-facing payment UI?** If Stripe is integrated, students need somewhere to enter card details. Stripe Checkout (hosted page) vs. embedded Elements.

---

*Last updated: June 2026*
*Status: Design only — not yet built*
