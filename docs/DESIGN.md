# DESIGN.md — Artifactuals visual system

**Status:** Design direction + system spec, ready for implementation.
**Companion to:** [`PRD.md`](PRD.md), [`TECHNICAL_HANDOFF.md`](TECHNICAL_HANDOFF.md).
**Applies to:** everything under `src/app` and `src/components`. The sandboxed
user artifacts are deliberately *out of scope* — they are the content, we are
the frame.

This document has three parts:

1. **Audit** — an honest review of the current UI, by severity.
2. **Direction** — the design concept, principles, and anti-slop bans.
3. **System** — concrete tokens, Tailwind wiring, component specs, and a
   phased roadmap mapped to real files.

---

## 0. How to use this doc

- Read the **Direction** section before touching any UI file — it's the "why"
  that keeps the redesign coherent.
- Treat the **System** tokens as the single source of truth. Do not hand-pick
  hex/zinc values in components anymore; consume semantic tokens.
- When implementing, follow the AGENTS.md rule: this is a non-standard Next.js
  version — read the relevant guide in `node_modules/next/dist/docs/` before
  writing framework code.
- The roadmap in §12 is ordered so each phase ships a visibly better product
  without waiting on the whole thing.

---

## 1. Design audit — where we are today

The current UI is clean and functional, but it reads as *unfinished* rather
than *restrained*. It has the raw ingredients of a good editorial system
(monochrome palette, hairline borders, square corners, tight type) but none of
them are deliberate, tokenized, or pushed far enough to feel designed. Below,
by severity.

### 1.1 Critical

- **The brand font never loads.** `src/app/layout.tsx` wires up Geist Sans and
  Geist Mono as CSS variables, but `src/app/globals.css` then hardcodes
  `body { font-family: Arial, Helvetica, sans-serif; }`. Net result: the entire
  product renders in **Arial**. This one line is responsible for most of the
  "generic" feeling. Fixing it is the highest-leverage change in this doc.

- **No design tokens.** `globals.css` defines only `--background` and
  `--foreground`. Every color, in every component, is a literal Tailwind
  `zinc-*` / `white` / `red-600` class with a hand-written `dark:` twin. There
  is no semantic layer, so the system can't be tuned centrally and dark mode is
  maintained by copy-paste.

### 1.2 High

- **No brand identity / no accent.** The palette is pure grayscale. There is
  nothing a user would recognize as "Artifactuals." Primary actions, links,
  focus states, and destructive actions all look the same weight of black/gray.
- **Dark mode is `prefers-color-scheme` only,** hand-duplicated per element
  (`dark:` appears dozens of times). No user toggle, and high risk of drift
  between the two themes.
- **Flat hierarchy, no elevation.** Cards, header, and inputs all sit on the
  same 1px border with no shadow language, so nothing feels foreground vs.
  background. The feed (`feed-post.tsx`) and profile grid look like wireframes.
- **The landing page under-sells the product** (`src/app/page.tsx`): a single
  headline + two buttons, no visual proof of what an "artifact" is. This is the
  top of the funnel for non-technical creators (PRD persona A) and shows them
  nothing.

### 1.3 Medium

- **No motion system.** The only interaction feedback is hover color changes
  and `active:translate-y-px`. No entrance transitions, no card lift, no
  optimistic-state polish on likes/follows.
- **Typographic scale is ad hoc.** Sizes are picked per-file
  (`text-[15px]`, `text-5xl`, `text-2xl`, `leading-[1.05]`) with no shared
  scale. Geist Mono is loaded but used nowhere — a wasted signature.
- **Focus states are weak.** Inputs use `focus:border-zinc-500`; there is no
  visible focus ring for keyboard users on buttons/links. Accessibility gap.
- **Square corners are accidental, not intentional.** Everything is 0-radius
  because nothing sets a radius — which happens to be on-trend, but it isn't a
  decision the system defends, so it looks flat rather than sharp.

### 1.4 Low / polish

- Tag pills, "Pinned" badge, and share buttons each invent their own padding
  and border treatment — no shared `Badge`/`Button` primitive.
- `min-h-[320px]`, `h-[70vh]`, `max-w-[600px]` magic numbers scattered across
  files with no layout tokens.
- Empty states are plain text; they're an opportunity for personality.

### 1.5 What to keep

Not everything needs to change. The following instincts are correct and the new
system formalizes them rather than replacing them:

- Near-monochrome canvas (correct call — lets colorful user artifacts pop).
- Hairline borders and a content-first, low-chrome layout.
- The LinkedIn/Instagram-style single-column feed structure.
- Square, structural edges (we'll make this an *intentional* signature).

---

## 2. Design direction — "The Quiet Gallery"

> Artifactuals is a frame around other people's work. The best gallery walls
> are white, precise, and silent so the art is the color. Our UI should be
> **confident, editorial, and near-invisible**, then get *loud* in exactly
> three places: type, the artifact frame, and pure black-on-white contrast.

This is the same discipline the reference sites (`tasteskill.dev`,
`impeccable.style`) sell: escape generic AI-slop by being deliberately
restrained, typographically strong, and monochrome-with-intent — not by adding
gradients, glows, and rounded glass.

### 2.1 Principles

1. **Content is the color.** User artifacts are vivid and unpredictable. The
   chrome is pure monochrome (ink on paper) so it never competes — the only
   colors in the entire product are the user's artifacts and two tiny semantic
   status cues (like, pinned). Emphasis comes from ink weight and black↔white
   inversion, not from a brand hue.
2. **Type does the heavy lifting.** A real Geist Sans display scale plus a
   Geist **Mono** signature for metadata (handles, timestamps, counts, labels)
   gives the product its voice — this is the "editorial" tell.
3. **Sharp on purpose.** 0-radius structural surfaces (cards, buttons, inputs,
   the artifact frame) are the brand signature. Only avatars and status pills
   are round. Commit to it everywhere so it reads as a decision.
4. **Hairline structure, soft light.** Thin borders define layout; a quiet
   shadow language provides just enough elevation to separate foreground from
   background and to reward hover.
5. **Motion is a whisper.** Fast, purposeful transitions (120–320ms). Entrances
   fade-and-rise; interactions lift and press. Nothing bounces. Everything
   respects `prefers-reduced-motion`.
6. **Tokens, not literals.** Components consume semantic variables. Retheming
   (including the whole dark mode) happens in one file.

### 2.2 Anti-slop bans (do not ship these)

These are hard rules. A PR that introduces one should be rejected.

- ❌ Gradient text / gradient fills for decoration (accent gradients on CTAs).
- ❌ Glassmorphism / heavy backdrop blur beyond the existing thin header blur.
- ❌ Purple-to-pink "AI" gradient palettes.
- ❌ Drop shadows used as decoration (glow, colored shadows). Shadows are only
  for real elevation.
- ❌ Rounded-everything. Radius is reserved (avatars, pills) — not a default.
- ❌ Emoji as UI iconography (we have Phosphor).
- ❌ Decorative color in the chrome. The interface is monochrome; the only
  non-neutral colors are the semantic status cues (rose = like, amber = pinned)
  and the user artifacts themselves. If an optional warm accent is enabled
  (§3.3), it is still limited to interactive emphasis only — never decoration.
- ❌ Center-everything hero with a giant gradient blob. The landing page proves
  the product with real artifact previews.

---

## 3. Foundations — color

The palette is a warm-neutral ink-on-paper scale — **no brand hue** — plus a
small set of semantic status colors. Interactive emphasis (primary buttons,
links, focus, active states) is carried by the ink↔paper inversion, not by
color: a "primary" button is simply an ink-filled plate that inverts to paper
in dark mode. Values are given in `oklch` for perceptual consistency (this is
also the format the reference DESIGN.md tools expect). They are a considered
starting point — tune lightness, but keep the structure.

> The `--accent*` tokens below are intentionally kept as named tokens even
> though they resolve to ink/paper. This means the whole system is already
> wired to accept a single warm accent later (§3.3) via a one-line change,
> without touching any component.

### 3.1 Semantic tokens (light)

| Token | oklch | Role |
|---|---|---|
| `--bg` | `oklch(0.985 0.003 95)` | Page background (paper, faint warmth) |
| `--surface` | `oklch(1 0 0)` | Raised cards, header, inputs |
| `--surface-muted` | `oklch(0.965 0.003 95)` | Sunken wells, preview toolbars |
| `--border` | `oklch(0.905 0.004 95)` | Hairline dividers/borders |
| `--border-strong` | `oklch(0.82 0.004 95)` | Hover borders, emphasis |
| `--fg` | `oklch(0.22 0.006 95)` | Primary text (warm near-black) |
| `--fg-muted` | `oklch(0.50 0.006 95)` | Secondary text |
| `--fg-subtle` | `oklch(0.63 0.006 95)` | Timestamps, meta, placeholders |
| `--accent` | `oklch(0.22 0.006 95)` | Primary action / links / focus (ink) |
| `--accent-hover` | `oklch(0.36 0.006 95)` | Accent hover (lifted ink) |
| `--accent-fg` | `oklch(0.985 0.003 95)` | Text/icon on accent (paper) |
| `--like` | `oklch(0.63 0.22 15)` | Like heart (semantic only) |
| `--highlight` | `oklch(0.80 0.14 80)` | Pinned/featured (semantic only) |
| `--danger` | `oklch(0.58 0.22 25)` | Errors, destructive, report |

### 3.2 Semantic tokens (dark)

| Token | oklch |
|---|---|
| `--bg` | `oklch(0.165 0.005 285)` |
| `--surface` | `oklch(0.205 0.005 285)` |
| `--surface-muted` | `oklch(0.245 0.005 285)` |
| `--border` | `oklch(0.29 0.006 285)` |
| `--border-strong` | `oklch(0.40 0.006 285)` |
| `--fg` | `oklch(0.95 0.004 285)` |
| `--fg-muted` | `oklch(0.72 0.005 285)` |
| `--fg-subtle` | `oklch(0.58 0.005 285)` |
| `--accent` | `oklch(0.95 0.004 285)` |
| `--accent-hover` | `oklch(0.82 0.005 285)` |
| `--accent-fg` | `oklch(0.165 0.005 285)` |
| `--like` | `oklch(0.70 0.19 15)` |
| `--highlight` | `oklch(0.82 0.13 80)` |
| `--danger` | `oklch(0.68 0.19 25)` |

### 3.3 The accent — monochrome (default), with an optional warm slot

**Default: there is no brand hue.** The interactive "accent" is pure ink on
light and pure paper on dark. Emphasis is created by *inversion and weight*, not
color — the discipline the reference sites (`tasteskill.dev`,
`impeccable.style`) are built on, and the safest brand choice (no risk of
clashing with any external palette). The accent surfaces are:

- The primary button — an ink-filled plate (inverts to paper on dark).
- Text links inside body copy — ink + underline (the underline is the signal,
  not a color).
- The focus ring (all interactive elements).
- Active nav / active feed tab underline.
- Small active-state accents (e.g. selected tag, follow confirmation).

Because these all read from `--accent*`, the system is already wired to accept a
single warm accent later with a one-line change and **zero** component edits.

#### Optional warm accent (off by default)

If a spark of color is wanted, enable exactly one of these — never blue (too
close to a conflicting external brand). Swap the three `--accent*` values in
`:root` (and their dark twins) and nothing else changes. Keep chroma modest so
it still reads as chrome, not decoration; re-check contrast of `--accent-fg` on
the fill.

| Option | Light `--accent` / `--accent-hover` / `--accent-fg` | Dark `--accent` / `--accent-hover` / `--accent-fg` | Feel |
|---|---|---|---|
| **Ember** (burnt orange) | `0.60 0.16 45` / `0.53 0.16 45` / `0.99 0 0` | `0.70 0.15 47` / `0.77 0.14 47` / `0.16 0.02 60` | Warm, energetic, editorial |
| **Amber** (gold) | `0.74 0.14 78` / `0.67 0.14 78` / `0.20 0.03 80` | `0.82 0.13 80` / `0.87 0.12 80` / `0.16 0.02 80` | Premium, calm, gallery |
| **Evergreen** | `0.48 0.09 158` / `0.42 0.09 158` / `0.99 0 0` | `0.62 0.09 158` / `0.69 0.09 158` / `0.14 0.02 160` | Grounded, quiet, mature |

(All values are `oklch`.) If a warm accent is enabled, reconsider the logo mark
so its accent notch matches — see the logo note in §14.

---

## 4. Foundations — typography

**Fix first:** delete the `font-family: Arial…` rule from `globals.css` and let
the body inherit `--font-sans` (Geist). This is prerequisite to everything here.

- **Display / UI:** Geist Sans (already installed).
- **Signature / meta / code:** Geist Mono — used for handles (`@name`),
  timestamps, counts, uppercase eyebrow labels, and the compose code editor.
  This monospace-for-metadata treatment is the primary editorial signal.

### 4.1 Type scale

| Name | Size / line-height | Tracking | Weight | Usage |
|---|---|---|---|---|
| `display-xl` | 4.25rem / 1.02 | -0.03em | 600 | Landing hero |
| `display-l` | 3rem / 1.05 | -0.025em | 600 | Section heroes |
| `h1` | 2rem / 1.1 | -0.02em | 600 | Page titles |
| `h2` | 1.5rem / 1.15 | -0.015em | 600 | Sub-sections |
| `title` | 1.0625rem / 1.35 | -0.01em | 600 | Card/feed titles |
| `body` | 0.9375rem / 1.6 | 0 | 400 | Default body |
| `small` | 0.8125rem / 1.5 | 0 | 400 | Secondary |
| `label` | 0.6875rem / 1.4 | +0.09em | 600 | **Mono**, uppercase eyebrows |
| `meta` | 0.75rem / 1.4 | +0.01em | 500 | **Mono**, handles/counts/time |

Rules:
- Display and h1/h2 always use negative tracking — tight, editorial.
- Never set type sizes as arbitrary values in components; use scale utilities.
- Body copy max width ~68ch for readability (`max-w-[68ch]`).

---

## 5. Foundations — spacing, radius, borders, elevation

### 5.1 Spacing

4px base grid (Tailwind default). Rhythm guidance:

- **Header height:** raise from `h-12` (48px) to `h-14` (56px) — the current
  bar is cramped.
- **Card internal padding:** 16px mobile / 20px desktop.
- **Section spacing:** 48–64px between major page sections (profile currently
  uses `mt-8` / 32px — bump to `mt-12`).
- **Feed gap:** 16px between cards (keep), but give the column more breathing
  room with 24px side gutters on desktop.

### 5.2 Radius

| Token | Value | Applies to |
|---|---|---|
| `--radius-none` | `0` | Cards, buttons, inputs, tags, artifact frame, badges |
| `--radius-pill` | `9999px` | Avatars, status dots, count chips |

That's the whole radius system. Sharp is the signature.

### 5.3 Borders

- Default border is `1px` `--border`. Hover raises to `--border-strong`.
- The header uses a bottom hairline only; cards get a full hairline frame.
- On dark, borders do the separation work that shadows can't.

### 5.4 Elevation (shadow)

Quiet, monochrome, real-elevation-only. Two steps:

```css
--shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05), 0 1px 1px oklch(0 0 0 / 0.04);
--shadow-md: 0 6px 24px -8px oklch(0 0 0 / 0.14), 0 2px 6px -2px oklch(0 0 0 / 0.08);
```

- `--shadow-sm`: resting state for the header and standalone cards.
- `--shadow-md`: hover-lift for interactive cards (feed post, profile grid
  item). Paired with a 1px translate-up.
- Dark mode: shadows are near-invisible; rely on `--border` + a subtle
  `--surface` step-up instead. Do not fake glow.

---

## 6. Foundations — motion

```css
--ease-out: cubic-bezier(0.2, 0, 0, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--dur-micro: 120ms;   /* press, color, checkbox */
--dur-base:  200ms;   /* hover lift, borders, opacity */
--dur-enter: 320ms;   /* entrances, tab/route reveals */
```

- **Hover (cards):** `translateY(-2px)` + `--shadow-md`, `--dur-base`.
- **Press (buttons):** `translateY(1px)` + brief scale to `0.98`, `--dur-micro`.
- **Like/follow:** optimistic; a small scale pop on the icon (`1 → 1.15 → 1`).
- **Feed entrance:** cards fade+rise (`opacity 0→1`, `translateY 8px→0`),
  staggered ~40ms, only on first paint.
- **Always** wrap non-essential motion in
  `@media (prefers-reduced-motion: no-preference)`.

---

## 7. Tailwind v4 implementation

Everything above lands in `src/app/globals.css`. Tailwind v4 is CSS-first
(`@theme`), so tokens become utilities automatically. Replace the current file
with this shape:

```css
@import "tailwindcss";

/* ---- Base tokens (light) ---- */
:root {
  --bg: oklch(0.985 0.003 95);
  --surface: oklch(1 0 0);
  --surface-muted: oklch(0.965 0.003 95);
  --border: oklch(0.905 0.004 95);
  --border-strong: oklch(0.82 0.004 95);
  --fg: oklch(0.22 0.006 95);
  --fg-muted: oklch(0.50 0.006 95);
  --fg-subtle: oklch(0.63 0.006 95);
  /* Monochrome by default: "accent" is ink. To enable a warm accent (§3.3),
     swap only these three values (and their dark twins below). */
  --accent: oklch(0.22 0.006 95);
  --accent-hover: oklch(0.36 0.006 95);
  --accent-fg: oklch(0.985 0.003 95);
  --like: oklch(0.63 0.22 15);
  --highlight: oklch(0.80 0.14 80);
  --danger: oklch(0.58 0.22 25);

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05), 0 1px 1px oklch(0 0 0 / 0.04);
  --shadow-md: 0 6px 24px -8px oklch(0 0 0 / 0.14), 0 2px 6px -2px oklch(0 0 0 / 0.08);
}

/* ---- Dark overrides ---- */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: oklch(0.165 0.005 285);
    --surface: oklch(0.205 0.005 285);
    --surface-muted: oklch(0.245 0.005 285);
    --border: oklch(0.29 0.006 285);
    --border-strong: oklch(0.40 0.006 285);
    --fg: oklch(0.95 0.004 285);
    --fg-muted: oklch(0.72 0.005 285);
    --fg-subtle: oklch(0.58 0.005 285);
    --accent: oklch(0.95 0.004 285);
    --accent-hover: oklch(0.82 0.005 285);
    --accent-fg: oklch(0.165 0.005 285);
    --like: oklch(0.70 0.19 15);
    --highlight: oklch(0.82 0.13 80);
    --danger: oklch(0.68 0.19 25);
  }
}
/* Optional explicit toggle: [data-theme="dark"] mirrors the block above. */

/* ---- Expose tokens to Tailwind utilities ---- */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-fg: var(--accent-fg);
  --color-like: var(--like);
  --color-highlight: var(--highlight);
  --color-danger: var(--danger);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  background: var(--bg);
  color: var(--fg);
  /* No more Arial. Inherit the Geist stack from --font-sans. */
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Global focus ring — accessibility floor for every interactive element. */
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

After this, components use `bg-surface`, `text-fg-muted`, `border-border`,
`text-accent`, etc. — and the dozens of `dark:` twins mostly disappear, because
the tokens already flip. This is the refactor that pays for itself.

> Note: this replaces `--background`/`--foreground`. Grep for those two names
> and migrate any stragglers.

---

## 8. Component specs

Introduce a tiny primitive layer so the same treatment isn't re-invented per
file. Suggested new files under `src/components/ui/`: `button.tsx`, `badge.tsx`,
`input.tsx` (a shared `inputClass` string is the minimum). Everything below is
described in token terms.

### 8.1 Button

Three variants, one size logic (sharp corners, mono-free, medium weight):

- **Primary** — `bg-accent text-accent-fg`, hover `bg-accent-hover`, press
  translate-down. In the monochrome default this is the classic ink-filled
  plate (paper text) that inverts to a paper fill on dark. *Formalizes* the
  current black `bg-zinc-950` primary already used in the header, landing,
  login, compose, and comments — now driven by tokens.
- **Secondary** — `bg-surface text-fg border border-border`, hover
  `border-border-strong`.
- **Ghost** — transparent, `text-fg-muted`, hover `bg-surface-muted text-fg`.
  Used for icon actions in the feed action bar and viewer toolbar.
- Disabled: `opacity-50`, no pointer. Loading label keeps width stable.

### 8.2 Input / Textarea

- `bg-surface border border-border`, sharp corners, `px-3 py-2.5`.
- Focus: border → `--accent` **and** the global focus ring (currently only
  border changes). Placeholder uses `--fg-subtle`.
- Consolidate the three identical `inputClass` strings (login, onboarding,
  compose) into one shared constant/component.
- The onboarding `artifactuals.com/` prefix chip uses `--surface-muted`.

### 8.3 Badge / Tag

- One `Badge` primitive, sharp, `px-2.5 py-0.5`, `meta` mono type.
- **Neutral** (tags): `bg-surface-muted text-fg-muted`.
- **Selected tag** (compose): `bg-accent text-accent-fg`.
- **Pinned**: `--highlight` background tint + dark highlight text (semantic).

### 8.4 Avatar

- Keep the initials-fallback logic in `avatar.tsx` (good). Two changes:
  - Add a 1px `--border` ring so light avatars separate from `--surface`.
  - Recolor the initials palette to sit *under* the new neutral chrome — the
    current saturated `bg-rose/orange/amber/...-500` set fights the accent.
    Move to slightly muted tones (e.g. `-500/90` or a curated 8-swatch set at
    ~0.62 lightness) so avatars read as content, not chrome.

### 8.5 Site header (`site-header.tsx`)

- Height `h-14`; keep sticky + thin blur, but use `bg-surface/85` and
  `border-border`.
- Wordmark: consider a mono or tighter-tracked treatment to make "Artifactuals"
  a logo, not just bold text. Add a tiny square accent mark (the sharp-corner
  motif) to the left as a proto-logo.
- Nav links: `text-fg-muted` → `text-fg` on hover; **active route** gets the
  accent. "New" button becomes Primary; "Sign in" Primary; profile chip Ghost.

### 8.6 Feed post (`feed-post.tsx`) — the flagship component

- Card: `bg-surface border border-border shadow-sm`; on hover the whole card
  lifts (`shadow-md` + `-translate-y-0.5`, `--dur-base`). This is the single
  most impactful visual upgrade.
- Header row: name in `title` weight; **handle, and timestamp in Geist Mono
  `meta`** (the editorial signature). Bio line `fg-muted`.
- Media: keep the 1200/630 frame; on card hover, a very subtle image
  `scale-[1.02]` inside `overflow-hidden` (respect reduced-motion). Improve the
  "Preview coming soon" empty state with a centered mono label on
  `--surface-muted` and a faint sharp-corner placeholder motif.
- Action bar: use the Ghost button treatment; like-heart fills `--like` with
  the scale-pop from §6.

### 8.7 Feed tabs (`feed/page.tsx`)

- Active tab underline uses `--accent` (currently `zinc-900`). Inactive
  `fg-subtle` → `fg` on hover. Give the tab bar the `--surface` card treatment
  so it reads as part of the feed column.

### 8.8 Artifact viewer (`artifact-viewer.tsx`)

- This is the "art on the wall" — frame it like one. `border-border` frame,
  `--surface-muted` toolbar, `label` mono "LIVE ARTIFACT" eyebrow (already
  uppercase — switch it to Geist Mono). Fullscreen button = Ghost.
- Consider a faint inner top hairline so the toolbar reads as a plate, and a
  subtle `shadow-sm` on the whole frame so the running artifact feels seated on
  the page rather than floating in a box.

### 8.9 Comments (`comments-section.tsx`)

- Section eyebrow → `label` mono. Comment author name `title` weight, timestamp
  mono `meta`. Comment `body` at `body` size / 1.6.
- Comment `<textarea>` + submit uses the shared Input + Primary button.

### 8.10 Profile header (`[username]/page.tsx`)

- Give the profile a proper masthead: larger avatar, `h1` display name, handle
  and follower/following counts in Geist Mono. Link chips use the Secondary/
  Badge treatment consistently (currently a one-off border style).
- "Recent on GitHub" and "Artifacts" eyebrows → `label` mono, `mt-12` rhythm.
- Artifact grid items get the same card + hover-lift language as the feed.

### 8.11 Empty states & toasts

- Empty states: centered `label` mono line + a one-line CTA (Primary/link),
  on a dashed `--border` well. Give each a touch of copy voice
  ("Nothing on the wall yet.").
- Introduce a minimal toast for optimistic-action failures (like/follow errors
  currently surface as inline text or nothing) — a small `--surface` +
  `shadow-md` sharp card, bottom-center, auto-dismiss.

---

## 9. Page-level direction

- **Landing (`page.tsx`)** — keep the strong left-aligned display headline (fix
  the font!), but **prove the product**: a live/loop or a curated 3–6 artifact
  preview wall below the fold so a visitor instantly sees what an "artifact" is.
  Primary CTA = accent. Add one line of mono eyebrow ("A HOME FOR WHAT YOU BUILD
  WITH AI") above the headline for editorial framing.
- **Feed** — the flagship. Nail the card system (§8.6) and entrance motion; this
  is where returning users live.
- **Artifact page** — gallery treatment (§8.8); the live artifact is the hero,
  everything else is quiet metadata.
- **Profile** — masthead + gallery grid; a portfolio someone is proud to put on
  a résumé (PRD goal).
- **Compose (`new`)** — the code/preview split is good; upgrade the editor
  textarea to true Geist Mono, tokenize the panes, and make the preview toolbar
  a proper `--surface-muted` plate. This screen should feel like a tool.
- **Auth / onboarding** — quiet, centered, confident. Shared Input + Primary.

---

## 10. Accessibility (non-negotiable floor)

- Visible focus ring on **every** interactive element (the global rule in §7).
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1 in **both** themes — the token
  values above are chosen to pass; re-verify if you retune them.
- Hit targets ≥ 40px; the current `py-1` header buttons are under that.
- All icon-only buttons need `aria-label` (feed share/open, viewer fullscreen).
- Respect `prefers-reduced-motion` (global rule in §7).
- Don't encode meaning in color alone (like state also changes icon fill/weight,
  which is already the case — keep it).

---

## 11. Governance

- **Tokens are law.** No new literal `zinc-*`/hex in components. Reviewers
  reject PRs that reintroduce them.
- **Monochrome chrome.** The interface ships with no brand hue. Enabling the
  optional warm accent (§3.3) — or adding any other color — is a design decision
  that must be recorded here first. Never blue.
- **The anti-slop bans (§2.2)** are a review checklist.
- When this system changes, this file changes first, then the code.

---

## 12. Implementation roadmap

Ordered so each phase is independently shippable and each one visibly improves
the product. Nothing here changes the sandboxed artifact rendering.

**Phase 0 — Foundation (highest leverage, ~half a day)**
1. Remove the Arial rule; wire Geist via `--font-sans` in `globals.css`.
2. Add the full token layer + `@theme` mapping + focus ring + reduced-motion
   (the §7 CSS). Product instantly looks intentional.

**Phase 1 — Primitives**
3. Add `ui/button.tsx`, `ui/badge.tsx`, shared `inputClass`.
4. Introduce the accent on primary buttons, links, focus, active nav/tabs.
5. Migrate `dark:` twins to tokens where touched.

**Phase 2 — Flagship surfaces**
6. Feed post card: elevation, hover-lift, mono metadata, entrance motion.
7. Feed tabs + header polish (h-14, active-accent, wordmark mark).
8. Artifact viewer gallery framing.

**Phase 3 — Profile & compose**
9. Profile masthead + gallery grid + mono counts.
10. Compose panes tokenized, Geist Mono editor, preview plate.

**Phase 4 — Landing & finish**
11. Landing artifact-wall proof section + editorial eyebrow.
12. Empty states with voice, toast primitive, avatar palette retune.
13. Optional: user-facing light/dark toggle (`data-theme`) now that dark is
    token-driven.

---

## 13. Open questions (confirm before/while building)

- **Color scheme:** ✅ **Decided — pure monochrome** (ink on paper), no brand
  hue. Blue is explicitly ruled out (conflicts with an external brand). The
  Ember / Amber / Evergreen options in §3.3 remain documented as a future
  one-line switch, but the product ships black-and-white.
- **Wordmark:** is "Artifactuals" the final name (PRD still calls it a
  placeholder)? A clean logo now exists — a sharp black square with a
  negative-space "A" + lowercase "artifactuals" wordmark (see §14).
- **Dark mode toggle:** auto-only (current) or add a user switch in Phase 4?
- **Landing proof:** okay to feature real published artifacts on the landing
  page (needs a small curated/trending query), or use static sample tiles until
  there's content?
- **Light-mode default vs. dark-first:** which theme should screenshots/marketing
  lead with?

---

## 14. Logo

The wordmark is set: a **sharp-cornered black square containing a negative-space
"A"**, followed by the lowercase wordmark **`artifactuals`** in a tight
geometric sans (Geist-family). The square mark reuses the product's core
signature — 0-radius plates and negative space — so the logo and the UI speak
the same language. The mark stands alone as the app icon / favicon; the lockup
(mark + wordmark) is for the header and marketing.

**Monochrome adaptation.** ✅ **Decided:** the cobalt notch in the "A" is
retired and replaced with a **tonal gray** step inside the black square —
approx `oklch(0.62 0 0)` (~`#8A8A8A`) on light backgrounds — keeping the mark
fully monochrome and on-system. (If a warm accent is ever enabled per §3.3,
the notch would move to that accent so logo and UI share the one hue.)

**Deliverables to produce from the mark:**
- `mark` and `lockup`, each as SVG + transparent PNG.
- Mono (all-ink) and reversed (all-paper) variants for light/dark chrome and the
  sticky header.
- Favicon / app-icon export from the standalone square mark.
- Store under `public/` (e.g. `public/logo/`); the source draft is in
  `assets/`.
