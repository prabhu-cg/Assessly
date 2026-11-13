---
name: Assessly
description: Assess smarter. Teach better. A flat, warm examination platform for teachers and students: white paper on a pale butter desk, butter hairlines and one amber accent, built on the SiteNest "Butter" tokens shared with Aemora.
colors:
  accent: "#e8b923"
  accent-hover: "#d4a615"
  accent-text: "#826400"
  accent-tint: "#faf4df"
  on-accent: "#353335"
  background: "#ffffff"
  desk: "#fcfaf3"
  sand: "#f8f4e4"
  ink: "#4d4a4d"
  ink-strong: "#353335"
  ink-muted: "#6b6b6b"
  hairline: "#ece5cc"
  hairline-strong: "#dccfa6"
  control-border: "#8a7f6e"
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
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "4.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "normal"
rounded:
  control: "8px"
  input: "8px"
  menu: "12px"
  card: "20px"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  button-ghost-hover:
    backgroundColor: "{colors.sand}"
  input-control:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "40px"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  badge-soft:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "20px"
    padding: "2px 8px"
  nav-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    height: "56px"
    padding: "0 24px"
  band-desk:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.ink}"
    padding: "80px 24px"
---

# Design System: Assessly

## Overview

**Creative North Star: "White Paper on a Butter Desk"**

Assessly uses the SiteNest "Butter" design system, the same one as Aemora: white paper on a pale butter desk, butter hairlines and one amber accent. Desk (`desk`, #fcfaf3) is the chrome: the teacher sidebar, landing bands, sign-in and 404 grounds. Paper (`background`/`card`, #ffffff) is what people work with: the teacher content area, cards, forms and question sheets. Amber (`accent`, #e8b923) is a fill that marks what is actionable or selected: the primary button, the logo mark, an active nav item's tint, a selected row. Amber is never text. Newsreader carries headlines; DM Sans carries everything else.

The system covers two modes. The landing page persuades: desk and white bands alternate, the hero headline carries one ochre phrase, and a MacBook-framed screenshot of the app shows the product (a light capture in light mode, a dark one in dark mode). The teacher app operates from a desk sidebar beside a white content area with entity cards; the student app from a white top bar over a white page with compact test rows. Both stay scannable at any list length: search, grouping and "show more" instead of ever-longer pages.

**Key Characteristics:**

- **One amber voice.** Fill, not text. Text that carries the accent is `accent-text` (ochre #826400), which is also the focus colour. Text on an amber fill is charcoal (`on-accent`), never white.
- **Newsreader for headlines, DM Sans for everything else.** Every h1 and h2 (and `.font-display`) is Newsreader 500 at -0.02em, enforced by one unlayered rule so per-page `font-bold` classes cannot change it. h3 and h4, labels and buttons are DM Sans 600. Bold and extra-bold utilities both resolve to 600.
- **Paper and desk.** White is paper (cards, panels, inputs); pale butter is the desk (sidebar, landing bands); `sand` is the stronger butter wash for hover and secondary tints.
- **Flat pages.** Depth comes from ground and 1px hairline. Shadows are reserved for what leaves the page plane (drawers, menus, the device mockup) and for the hover lift on clickable cards. No gradients, no glow.
- **Shape.** Every button is a full pill (text, icon, close, menu items, toggles, chips). Inputs, textareas and selects are 8px. Menus and popovers are 12px with pill items. Cards, panels and dialogs are 20px.
- **Selection is butter, not grey.** A selected tab, nav item, list item or segment uses `accent-tint` with `accent-text`. Hover uses `sand`. Grey washes (`foreground` at low opacity) are not used.
- **Light or dark, nothing else.** Light is the default; there is no system option. A pill sun/moon toggle sits in the landing header, both app top bars and both sign-in pages, and the choice is stored in the browser (`assessly-theme`). Dark is the warm charcoal ramp (`#141312` ground, `#1c1b19` cards), never neutral grey.
- **Honest about what is simulated.** Landing screenshots are labelled as sample data and are captured from fictional sample content.
- **Motion explains state.** A 180ms page fade, a capped card/row stagger, drawer slides (300ms), and a 2% press scale on buttons. Reduced motion keeps meaning without travel.

## Colors

### Accent

- **Butter Amber** (`accent`, #e8b923; `--primary`): the primary button, logo mark, active-tab underline, the toggle track and chart fills. Charcoal text on it reaches AA.
- **Amber Hover** (`accent-hover`, #d4a615; dark #f0c94a): hover for the primary fill.
- **Ochre** (`accent-text`, #826400; dark #f0c94a): accent-coloured text, links, the focus ring and active nav text. The only accent allowed as text.
- **Amber Tint** (`accent-tint`, #faf4df; dark #2a2410): the accent as a ground: selected items, soft badges, icon tiles.

### Neutral

- **Desk** (`desk` / `--surface`, #fcfaf3; dark #181716): sidebar, landing bands, sign-in and 404 grounds, footers' inset areas.
- **Sand** (`sand` / `--secondary`, `--muted`, #f8f4e4; dark #262420): hover and secondary tints.
- **Paper** (`background`/`card`, #ffffff; dark #141312 / #1c1b19): content area, cards, inputs, popovers.
- **Ink** (`ink`, #4d4a4d; dark #e6e2da): body text. **Ink Strong** (`ink-strong`, #353335; dark #faf8f2): headings, button labels, wordmark. **Ink Muted** (`ink-muted`, #6b6b6b; dark #a8a399): secondary copy, meta, placeholders.
- **Hairline** (`hairline`, #ece5cc; dark #2e2b26): borders and dividers. **Hairline Strong** (`hairline-strong`, #dccfa6; dark #433e35): menus, outline buttons, dashed zones.
- **Control Border** (`control-border` / `--input`, #8a7f6e; dark #7d7569): outlines of text fields, selects and textareas, so field boundaries meet 3:1 (WCAG 1.4.11).

### Semantic

`success`, `warning`, `info`, `destructive` and their `-soft` grounds are tokens. Destructive actions are an outline button with red text, never a solid red block. No raw Tailwind palette colours outside `components/ui`.

### Named Rules

**The One Voice Rule.** Amber is the only accent, and it is a fill. Anything that needs amber as text uses `accent-text`.

**The Token Only Rule.** No literal brand hex, `bg-white` or hardcoded cream in components; use `primary`, `surface`, `card`, `popover` so dark mode holds. The `--primary` token is amber; `--primary-text` is ochre; `--primary-soft` is the tint.

## Typography

**Display Font:** Newsreader (500 only), with Georgia as fallback. **Body Font:** DM Sans. **Mono:** Geist Mono for invite codes.

### Hierarchy

- **Display** (Newsreader 500, 3rem on mobile, 4.5rem/72px from `sm`, line-height 1, -0.02em): the landing hero headline, with one `accent-text` phrase.
- **Headline** (Newsreader 500, 2.25rem/36px, -0.02em): landing section titles. App page titles are Newsreader 500 at `text-2xl`.
- **Title** (DM Sans 600, 1.25rem on the landing, 1rem in the app): card titles, drawer titles, feature titles (h3).
- **Body** (DM Sans 400, 0.875rem/14px): app copy, form text, table cells. Landing lead paragraphs are 1.125rem in `ink-muted`.
- **Label** (DM Sans 600, 0.75rem): badges, meta, hints. Sentence case.

### Named Rules

**The One Heading Rule.** Every h1 and h2 looks the same wherever it appears: Newsreader, weight 500. Do not add `font-bold` to a heading to change it; it will be overridden.

**The Tabular Numbers Rule.** Scores, marks, counts and timers get `tabular-nums`.

## Layout

The landing caps at `max-w-screen-xl` (1280px) with 80px (`py-20`) vertical rhythm. Sections **alternate desk and white**: hero (desk), product preview (white), features (desk), how it works (white), FAQ (desk), final call to action (white). The final call to action is not an amber band. The footer follows SiteNest: a white ground with a hairline top border, the mark and wordmark (with tagline) on the left, the copyright centred and "Student portal" and "Teacher sign in" on the right (the same order as the header), stacking and centring on mobile.

The teacher shell is a sticky 240px desk sidebar (logo row aligned with the top bar, four pill nav items) beside a 56px white top bar holding the theme toggle and account menu; content is `app-page` (fluid, capped at 1440px) with `px-4` to `px-6` gutters; below `md` the sidebar becomes a bottom tab bar. Detail pages open with a breadcrumb trail. The dashboard is a work queue: "Needs grading" (wide, one row per test with submissions waiting, oldest first, an outlined "N to grade" pill) beside "Published tests" (narrow, with a `warning-soft` "N taking now" tag), each capped at 6 rows. The student shell is a sticky 64px white top bar (logo, My tests, Join a test, theme toggle, name and avatar) over a white page; the dashboard is search plus a To do / Completed control over grouped rows, 8 at a time.

Sign-in is a split screen from `lg`: a 58% photograph panel on the left (under a flat charcoal scrim, no gradient, no tint) and the form on desk on the right with the theme toggle at its top right. Student sign-in is one centred card. Drawers slide from the right at 440 to 560px.

## Elevation & Depth

Flat by default. Surfaces separate by ground and 1px hairline. Clickable entity cards lift on hover: the border strengthens to `hairline-strong`, the card rises 2px and gains `shadow-raised` (a soft charcoal-tinted shadow); under reduced motion there is no lift. Menus use a `hairline-strong` border and no shadow; drawers sit over a `bg-black/40` scrim; the MacBook mockup carries a deep soft shadow because it is a picture of a device.

### Named Rules

**The Quiet Elevation Rule.** Rows, badges, inputs and resting cards have no shadow. Lift belongs to hover on clickable cards, drawers, and the device mockup.

## Shapes

Pills for every button and chip; 8px for fields and compact controls; 12px for menus and popovers; 20px for cards, panels, dialogs and landing cards. Borders are 1px hairline, dashed only for empty or upload zones. The logo mark is a shield with a check, filled amber (white on the photo panel).

## Components

### Buttons

- **Shape:** full pill, 44px tall by default (36px `sm`, 52px `lg`), DM Sans 600, 2% press scale.
- **Primary:** amber fill, charcoal text; hover `accent-hover`. One filled primary per view.
- **Outline:** white ground, `hairline-strong` border; hover `sand`. **Ghost:** transparent, `sand` hover. **Secondary:** `sand` fill. **Destructive:** outline with red text; hover `destructive-soft`.
- **Focus:** 3px ring in `ring` (ochre).

### Inputs, textareas and selects

- 40px tall, 8px radius, white `card` ground, `control-border` outline, 12px side padding, `text-base` (no mobile zoom). Focus turns the border ochre with a 3px ring.
- **Selects** match the input (40px, 8px) and display the option's label, not its raw value (for example "Multiple Choice", not `mcq`). In a form column they fill the width.
- **Number fields are short.** Marks, duration and pass mark are 80 to 112px wide, not full width. The grading marks field also clamps to the question's maximum.
- Icon fields: a muted 16px leading icon with `pl-8`; password fields add a show/hide toggle.

### Cards

20px radius, white ground, 1px hairline, `p-5`. Clickable entity cards (tests, students) stretch the title link over the whole card, carry an ellipsis menu top right, a free body slot and a footer pinned behind a hairline. Hover lifts as described under Elevation.

### Badges

Full pills, 20px tall, DM Sans 600. Default is `accent-tint` with `accent-text`. Test status: published is a `success-soft` pair, draft is `sand` with a hairline, archived is outlined.

### Tabs and segmented controls

A pill track with a 1px hairline and `desk` ground, 4px padding. The selected segment is an `accent-tint` pill with `accent-text`; unselected segments are `ink-muted` and darken on hover. Underlined tabs use an amber underline with `accent-text`. No grey fill, no shadow.

### Navigation

Teacher sidebar: pill items; hover is `sand` with `ink-strong` text; active is `accent-tint` with `accent-text` and 600 weight. Student top bar: the same pill items. The landing nav is a translucent white sticky bar with the theme toggle, a ghost "Student portal" and a primary "Teacher sign in".

### Theme toggle

A 36px pill icon button (moon in light mode, sun in dark mode) with a `sand` hover, labelled "Toggle light and dark mode". Both icons render and swap with CSS, so there is no hydration flash.

### Question image field

An optional Image field on the question form: a dashed 12px zone you can click, drop a file on, or paste a screenshot into (⌘V or Ctrl+V works anywhere in the form; text pastes are untouched). It states its limits in the UI: PNG, JPG, WebP or GIF up to 5 MB; large PNG and JPG images are resized automatically, GIFs are not; one image per question. A set image shows as a preview with a round remove button and a spinner while uploading. Images appear above the answer area on the teacher question list, the student test page, the results page and the grading view.

### Dashboard rows

Rows inside a 20px panel separated by hairlines; the panel header has a Newsreader title, a count badge and a text link in `accent-text`. Each list has an empty state.

### Student details drawer

Clicking a student's name opens a drawer: avatar, name, year, date added; every assigned test as a row with its status (tinted score, outlined "To grade", "In progress", "Not started"), searchable once there are more than 6; and the personal login link behind a "Show login link" button.

### Student test rows

72px-minimum rows: title, duration and one action on the right: a 44px amber Start or Continue pill, a tinted score, or a `warning-soft` "Waiting for marks". Grouped into In progress / Ready to start and Waiting for marks / Marked, 8 at a time. A pulsing `warning` dot marks an in-progress test.

### Switch, breadcrumbs, drawer

A 36x20px accessible switch with an amber track when on. Breadcrumbs sit above detail-page titles with a medium-weight current page. Create, edit, preview and details flows open as right-hand drawers mounted through `Portal` (so a transformed card can never trap them); destructive confirmations stay as small centred dialogs.

### Auth panel and device mockup

The auth panel is a library or classroom photograph under a flat charcoal scrim with the white mark, the daily quote and the copyright line. The device mockup is a CSS-built MacBook holding a 16:10 screenshot; the landing shows a light or dark capture to match the theme. The captures are 2880x1800 PNGs of fictional sample data (`public/mockups/*-light-v2.png` and `*-dark-v2.png`); retake them whenever the app chrome changes, and rename the files so caches refresh.

## Do's and Don'ts

### Do:

- **Do** use amber as a fill and `accent-text` for accent-coloured text; put charcoal text on amber.
- **Do** use `bg-surface` (desk) for chrome and landing bands, `bg-card` for cards, forms and popovers, and `sand` for hover.
- **Do** keep every button a pill, every field 8px, every card 20px.
- **Do** make selected states `accent-tint`, hover `sand`.
- **Do** keep numeric inputs short and show labels, not raw values, in selects.
- **Do** open create, edit, preview and details flows in a right-hand drawer through `Portal`.
- **Do** keep lists scalable: search, grouping, and a capped first page.
- **Do** state upload limits next to the control and offer paste, drag and choose.
- **Do** keep white text on any photo behind a scrim that guarantees 4.5:1.

### Don't:

- **Don't** use amber as text, or white text on an amber fill.
- **Don't** add gradients, glow, grey selection washes, or amber full-width sections.
- **Don't** put a literal brand hex, `bg-white` or `font-bold` on a heading in components.
- **Don't** add a shadow to rows, badges, inputs or resting cards, or a transform on a page-level wrapper (it traps `position: fixed` drawers).
- **Don't** make destructive buttons solid red.
- **Don't** offer a "system" theme option, or use neutral grey for dark mode.
- **Don't** invent copy or statistics in the screenshots beyond clearly sample data.
