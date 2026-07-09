# Artifactuals

A social portfolio platform for people who build things with AI: publish single-page HTML artifacts, get a public profile at `artifactuals.com/username`, and share your work on a real feed with follows, likes, and comments.

Product docs live in [`docs/`](docs/):

- [`docs/README.md`](docs/README.md) — handoff package overview and key decisions
- [`docs/PRD.md`](docs/PRD.md) — product scope, personas, Phase 1/2 breakdown, risks
- [`docs/TECHNICAL_HANDOFF.md`](docs/TECHNICAL_HANDOFF.md) — architecture, data model, sandboxing, build sequencing

## Stack

- **Web:** Next.js (App Router) + Tailwind, deployed on Vercel
- **Backend:** Supabase (Postgres + Auth + Storage), schema managed via migration files in [`supabase/migrations/`](supabase/migrations/)
- **Artifact sandbox:** separate origin serving user HTML in a sandboxed iframe with strict CSP (see technical handoff §3)
- **Screenshots/OG images:** async headless-browser pipeline (Phase 1, step 7 of build sequence)

## Local development

Requires Node 20+ (`nvm use 22.13.1`) and Docker (for local Supabase).

```bash
npm install
npx supabase start           # local Postgres + Auth + Storage (Docker)
cp .env.example .env.local   # fill in values printed by supabase start
npm run dev
```

Open http://localhost:3000. Local auth uses email/password (no email
confirmation); Google OAuth is added when the hosted project goes live.

## Screenshot / OG-image generation

Every published artifact gets a 1200x630 preview image (feed cards and social
link previews), rendered through the same sandbox route the site uses. Since
headless Chromium can't run in Vercel's serverless runtime, the render is
offloaded to a hosted browser API ([ScreenshotOne](https://screenshotone.com)).

Generation runs **synchronously at publish time** (`generateArtifactPreview` in
[`src/lib/screenshot.ts`](src/lib/screenshot.ts)), before the user is handed a
share link — this guarantees the real image exists the first time LinkedIn
scrapes the page (LinkedIn caches the OG image aggressively, so a late image
would never win). Owners can re-render at any time via **Regenerate preview** on
their artifact page.

Set `SCREENSHOTONE_ACCESS_KEY` in production. If it's unset (e.g. local dev) or
the origin isn't publicly reachable, the render is skipped and the per-artifact
OG route serves a branded fallback card until an image exists.

## Database migrations

Schema changes are captured as SQL migration files under `supabase/migrations/` and applied with the Supabase CLI:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF   # one-time
npx supabase db push                               # apply migrations to the hosted project
```
