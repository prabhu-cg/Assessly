---
name: Assessly
description: Assess smarter. Teach better. A warm cream-and-terracotta examination platform for teachers and students, built on the Doxa token system.
colors:
  primary: "#c74504"
  primary-deep: "#a93a03"
  primary-soft: "#fdefe7"
  primary-foreground: "#ffffff"
  background: "#ffffff"
  surface: "#f4f2ea"
  ink: "#1c1917"
  ink-muted: "#6f6963"
  hairline: "#e8ddc8"
  hairline-strong: "#d6c7ab"
  success: "#146c43"
  success-soft: "#e6f4ec"
  warning: "#8a5a00"
  warning-soft: "#fdf3e0"
  info: "#1f5f9e"
  info-soft: "#ebf3fb"
  destructive: "#b3261e"
  destructive-soft: "#fdeceb"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "normal"
rounded:
  sm: "3.6px"
  md: "4.8px"
  lg: "6px"
  xl: "8.4px"
  card: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "80px"
  container-max: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "42px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "42px"
    padding: "0 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
  input-control:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  badge-soft:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "20px"
    padding: "2px 8px"
  nav-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    height: "56px"
    padding: "0 24px"
  band-cream:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "80px 24px"
---

# Design System: Assessly

## Overview

**Creative North Star: "The Working Ledger"**

Assessly's world is warm paper and one burnt-orange voice. Cream (`surface`, #f4f2ea) is the chrome: the teacher sidebar, the student page ground, footers and landing bands. The things people actually work with (the teacher's content area, cards, forms, question sheets) are white and held by hairline borders the colour of old parchment. A single terracotta accent (`primary`, #c74504) means "act here" or "this is yours". Manrope carries every word. The tokens are shared with the Doxa system so both products read as one family.

The system covers two modes. The landing page persuades: cream bands alternate with white, the headline carries one terracotta phrase, and a MacBook-framed dashboard shows the product. The teacher app operates from a cream sidebar beside a white content area with entity cards; the student app from a white top bar over a cream page with compact test rows. Both stay scannable at any list length: search, grouping and "show more" instead of ever-longer pages. Brand lives in the details (the shield-check mark, the accent on the primary action, the focus ring), not in decoration. Sign-in is the one place that leaves the page plane for imagery: a terracotta-tinted photograph beside the form.

**Key Characteristics:**

- One accent, terracotta, used for the primary action, focus, the logo mark and key numbers.
- Cream chrome, white working surfaces, hairline rules; depth is mostly tonal, with one faint resting shadow on cards.
- Manrope only, a small fixed type scale, weight (not size) for hierarchy.
- Teacher shell: a cream 240px sidebar (logo, four nav items), a white 56px top bar with the account menu at top right, a white content area, max 1152px (6xl) content, no footer. Student shell: a white 64px top bar (logo, My tests, Join a test, name and avatar) over the cream page, 1024px (5xl) content.
- Motion confirms state and keeps continuity: a 180ms page fade, a capped card/row stagger, hover lifts, drawer slides. Nothing blocks the user, and reduced motion keeps meaning without travel.
- Sign-in pairs a tinted photograph panel (teacher only) with the form on cream; student sign-in stays a single centred card.
- Light and dark: dark is a warm brown-black ramp (`#12100e` ground, `#1c1916` cards), never neutral grey.

## Colors

A cream-and-white ledger with one burnt-orange accent and warm neutrals.

### Primary

- **Assessly Terracotta** (`primary`, #c74504): the primary button, focus ring, logo mark, active tab state, hero emphasis phrase and stat numbers. White text on it reaches 4.9:1.
- **Terracotta Deep** (`primary-deep`, #a93a03): hover for the primary fill and the only accent used as text on tints (`primary-text`, `accent-foreground`).
- **Terracotta Tint** (`primary-soft`, #fdefe7): the accent as a ground: icon tiles, soft badges, hover accents, `accent` surfaces.

### Neutral

- **Oat Cream** (`surface`, #f4f2ea; also `secondary`, `muted`): the teacher sidebar, the student page ground, footers, the landing's alternating bands, sign-in and 404 backgrounds, and inset panels (shown as `muted/40`–`muted/50`).
- **Paper White** (`background`/`card`, #ffffff): the teacher content area, top bars, cards, inputs, selects, popovers and the landing's white bands.
- **Warm Ink** (`ink`, #1c1917): all primary text.
- **Stone** (`ink-muted`, #6f6963): secondary copy, meta, placeholders. 5.4:1 on white, 4.8:1 on cream.
- **Parchment Hairline** (`hairline`, #e8ddc8): every border, divider and input outline.
- **Parchment Strong** (`hairline-strong`, #d6c7ab): emphasised dividers and scrollbar thumbs.

### Semantic

`success`, `warning`, `info`, `destructive` and their `-soft` grounds are defined in tokens (`--success`, `--success-soft`, …). Status colours across teacher and student pages use these tokens (`text-success`, `bg-warning-soft`, `border-destructive/40`); no raw Tailwind palette colours remain outside `components/ui`.

### Named Rules

**The One Voice Rule.** Terracotta is the only accent. It marks the primary action, the focus state and the brand mark; it is never a second decorative colour next to blues or greens.

**The Cream Chrome Rule.** Chrome is `surface` (teacher sidebar, student page ground, footers); working surfaces are white. A card on a white teacher page is separated by its hairline border and faint shadow, so cards always carry both. Never hardcode a cream hex: use `bg-surface` / `var(--surface)`.

**The Token Only Rule.** No literal `#C74504`, `#FFF9EB` or `bg-white` in components. Use `primary`, `surface`, `card`, `popover` so dark mode and future re-theming hold.

## Typography

**Display Font:** Manrope (with ui-sans-serif, system-ui fallback)
**Body Font:** Manrope
**Label/Mono Font:** Manrope; Geist Mono is loaded for code and invite codes.

**Character:** Manrope's round, open forms keep an exam tool friendly instead of clinical. Hierarchy comes from weight (400, 500, 600, 700, 800) and a handful of sizes.

### Hierarchy

- **Display** (800, 3rem/48px on sm and up, 1.1, -0.025em): the landing hero headline only, with one terracotta phrase.
- **Headline** (700, 1.875rem/30px, 1.25, -0.025em): landing section titles; app page titles step down to `text-xl` (700).
- **Title** (600, 1rem, 1.5): card titles ("Recent Tests"), drawer titles, the sign-in card heading.
- **Body** (400, 0.875rem/14px, 1.43): app copy, form text, table cells. Landing lead paragraphs are 1.125rem in `ink-muted`, capped near 36rem.
- **Label** (500, 0.75rem/12px): badges, meta, hints, timestamps. Sentence case.

### Named Rules

**The Weight Not Size Rule.** Emphasis comes from weight and `ink` vs `ink-muted`; there is no fluid type and no tier above Display.

**The Tabular Numbers Rule.** Scores, marks, counts and timers are numbers people compare; give them `tabular-nums`.

## Layout

Teacher content is a single column capped at `max-w-6xl` (1152px), student content at `max-w-5xl` (1024px) with the dashboard list at `max-w-3xl`, all centred with 16 to 32px gutters; the landing caps at `max-w-screen-xl` (1280px). The landing stacks sections with 80px (`py-20`) vertical rhythm: a cream hero, a white product-preview band, white and cream feature bands, then FAQ and footer. The teacher shell is a sticky 240px cream sidebar with a hairline right edge (logo row aligned with the top bar, four nav items, no user block), a sticky 56px translucent white top bar with the account menu top right, and a white `main` with `px-8 py-8`; below `md` the sidebar becomes the top bar's logo plus a bottom tab bar. There is no teacher footer. Detail pages open with a breadcrumb trail above the title. The teacher dashboard is a work queue: "Needs grading" (wide, one row per test with submissions waiting, oldest first) beside "Published tests" (narrow, tests with students taking them listed first), each capped at 6 rows with "+N more". The student shell is a sticky 64px translucent white top bar with two nav links; the student dashboard is search plus a To do / Completed segmented control over grouped compact rows, 8 at a time. The test-instructions page centres a 2xl column and a centred, full-width Start button. The shared footer is one centred line: "© year Assessly. Assess smarter. Teach better."

Sign-in is a split screen from `lg` (1024px): a 58% photograph panel on the left and the form centred on cream on the right. Below `lg` the panel disappears and the form fills the screen. Student sign-in is not split: one centred card on cream. Drawers slide from the right over the page at 440–560px wide.

Spacing uses the Tailwind 4px scale; common steps are 8, 12, 16, 24 and 80px.

## Elevation & Depth

Mostly flat and tonal. Surfaces separate by ground (cream chrome, white content) and by 1px hairline. Entity cards and student rows add one very faint resting shadow (`shadow-card`, 1px/3px at about 5% ink) and on hover turn the border terracotta, deepen to `shadow-raised` and lift 2px. Real elevation is reserved for things that leave the page plane: the profile dropdown (`shadow-lg`), and drawers (`shadow-2xl` over a `bg-black/40` scrim with a 300ms slide). The MacBook mockup on the landing carries a deep soft shadow because it is an illustration of a device.

### Named Rules

**The Quiet Elevation Rule.** Rows, badges and inputs have no resting shadow; cards carry only the faint `shadow-card`. Real lift belongs to hover, the dropdown, the drawer and the device mockup.

## Shapes

Gently rounded, never sharp, never bubbly apart from pills. The base radius is 0.375rem (6px): buttons and inputs sit at `lg` (6px/8px as built), cards at `xl`, the larger landing cards at `2xl` (16px), badges and avatars are full pills. The MacBook frame uses a 22px lid and 10px screen radius. Borders are 1px hairline, dashed only for empty or placeholder states. The logo mark is a shield with a check, filled with `primary` (white on tinted panels).

## Components

### Buttons

- **Shape:** 6px radius, 42px tall by default (32px `sm`, 24px `xs`), 14px medium.
- **Primary:** `primary` fill, white text, `px-4`; hover darkens toward `primary-deep`.
- **Outline:** white ground, hairline border, `muted` hover. **Ghost:** transparent, cream hover. **Secondary:** `secondary` fill. **Destructive:** soft red tint, not a solid red block.
- **Focus:** 3px ring in `ring` (terracotta) with a matching border shift.

### Cards / Containers

- **Corner Style:** 12px (`rounded-xl`) for app cards; 16px for landing feature and FAQ cards.
- **Background:** white `card` on the cream page. **Border:** `ring-1` at 10% ink, hairline on landing cards.
- **Internal Padding:** `py-4` with `px-4` content; landing cards use `p-6`.
- **Hover:** ring tints toward terracotta at 50%, plus a faint lift.

### Inputs / Fields

- **Style:** 40px tall, 8px radius, white `card` ground, hairline `input` border, `text-base` (16px, prevents mobile zoom).
- **Focus:** border becomes terracotta with a 3px 50% ring.
- **Icon fields:** a muted 16px leading icon at `left-2.5` with `pl-8` padding; password fields add a trailing show/hide toggle.

### Badges

Full pills, 20px tall, 12px medium. Soft badges use `primary-soft` with `primary-deep` text. Test status uses tinted pairs: published as a green tint, draft as `muted` with a hairline border, archived as muted text.

### Navigation

Teacher: a 240px cream sidebar whose logo row aligns with the 56px white top bar (account menu with Sign out at top right, no footer); its active item is a `foreground/5` wash with semibold text, never an accent fill. Student: a sticky 64px white top bar with the mark and wordmark on the left, two 40px nav links (My tests, Join a test) with a `primary-soft` active state, and the student's name and avatar on the right (no sign-out menu: students use a personal link). The landing nav is a translucent white sticky bar with a ghost "Student portal" and a primary "Teacher sign in".

### Dashboard queue (signature)

The teacher dashboard is two white cards, not a grid, so it holds at any number of tests. "Needs grading" lists one row per test with a count badge in the header, the oldest waiting submission, and an outlined terracotta "N to grade" chip; rows link to the submissions page filtered to that test. "Published tests" lists tests with duration, enrolled count and a `warning-soft` "N taking now" tag. Each list shows 6 rows then a "+N more" link, and each has an empty state.

### Entity card (signature)

The shared card for tests and students, ported from Doxa's `EntityCard`: a 16px-radius white `surface-raised` card with a hairline border and `shadow-card`. On hover the border turns terracotta, the shadow deepens to `shadow-raised`, and the card lifts 2px over 200ms (no lift under reduced motion). Cards with a destination stretch the title link over the whole card; a vertical-ellipsis menu (Questions, Edit, Delete on tests; View details, Edit, Delete on students) sits top right above that link. Cards can carry a subtitle under the title (a student's year) and a free body slot. A card with no destination page makes its name a button that opens a drawer. The footer is pinned to the bottom behind a hairline so cards in a row align. Tests are sorted newest first, with a search box, All/Published/Draft/Archived filters with counts and a Newest-first switch; students are sorted A to Z with a search that matches name or year.

### Student details drawer

Clicking a student's name opens a right-hand drawer: avatar, name, year (or "No year set"), date added; every assigned test as a row with its status (tinted score and percentage, outlined "To grade", "In progress", "Not started") sorted To grade first, with a search box once there are more than 6; and the personal login link behind a "Show login link" button so the token is only fetched on request. Rows with a submission link to its evaluation page.

### Student test rows

Student tests are 72px-minimum rows in the entity-card style: title, duration, and one action on the right: a 44px terracotta Start or Continue button, a tinted score, or a `warning-soft` "Waiting for marks". To do is grouped into In progress and Ready to start, Completed into Waiting for marks and Marked, 8 rows at a time with a "Show N more" button. A pulsing `warning` dot marks an in-progress test.

### Switch

A 36x20px accessible switch (`role=switch`) with a terracotta track when on and a 200ms thumb slide; used for the Newest-first sort.

### Breadcrumbs

Detail pages carry a trail above the title (Tests, test name, Questions; Submissions, test name, student; Students, Add student). Parents are links, the last item is the current page in medium weight, and long labels truncate. Top-level pages have no trail.

### Drawer (signature)

Creating tests, adding students, editing questions and previewing a test all open as right-hand drawers instead of centred modals: a `bg-black/40` overlay, a white panel with a left hairline, a header with title, subtitle and close button, and a scrolling body. Destructive confirmations stay as small centred dialogs.

### Auth panel (signature)

The left half of teacher sign-in: a library or classroom photograph under a 60% terracotta multiply tint and a dark top-to-bottom scrim, carrying the white mark, the daily quote (1.6rem, 600) with a soft text shadow, and the copyright line.

### Device mockup (signature)

A CSS-built MacBook (dark lid, camera dot, silver base with notch) holding a 16:10 screenshot of the dashboard, used once on the landing page.

## Do's and Don'ts

### Do:

- **Do** use `bg-surface` for chrome (sidebar, student page, footers) and `bg-card` for cards, forms, selects and popovers.
- **Do** keep terracotta to the primary action, focus, the mark and one emphasis phrase per view.
- **Do** separate surfaces with 1px hairlines (#e8ddc8) and tone, and keep resting surfaces shadowless.
- **Do** open create, edit, preview and details flows in a right-hand drawer with the shared overlay, 300ms slide and header pattern, mounted through `Portal` so a transformed card or page can never trap it.
- **Do** keep lists scalable: search, grouping, and a capped first page with "show more" or "+N more" instead of an ever-longer list.
- **Do** put a breadcrumb trail above the title on every drilled-down teacher page.
- **Do** use `tabular-nums` for scores, marks, counts and timers.
- **Do** keep white text on any tinted photo behind a scrim that guarantees 4.5:1.

### Don't:

- **Don't** write a literal brand hex, `bg-white`, or a hardcoded cream in components; use tokens.
- **Don't** put a second accent colour next to terracotta for decoration.
- **Don't** add a shadow to rows, badges or inputs at rest, or put a transform on a page-level wrapper (it traps `position: fixed` drawers); page transitions are opacity only.
- **Don't** build a view whose size is students times tests; show queues and per-entity details instead.
- **Don't** split student sign-in into the photograph layout; it stays a single centred card.
- **Don't** use neutral grey for dark mode; use the warm brown-black ramp.
- **Don't** invent copy or statistics in the dashboard mockup beyond clearly labelled sample data.
