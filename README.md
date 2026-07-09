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

## Screenshot / OG-image worker

Generates 1200x630 preview images for published artifacts (feed cards and
link previews), rendering through the same sandbox route the site uses:

```bash
npm run screenshots         # one-shot
npm run screenshots:watch   # poll every 30s
```

Runs anywhere Node + Playwright run; in production this becomes a small
container or cron job, not a serverless function.

## Database migrations

Schema changes are captured as SQL migration files under `supabase/migrations/` and applied with the Supabase CLI:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF   # one-time
npx supabase db push                               # apply migrations to the hosted project
```
