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

Requires Node 20+ (`nvm use 22.13.1`).

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project values
npm run dev
```

Open http://localhost:3000.

## Database migrations

Schema changes are captured as SQL migration files under `supabase/migrations/` and applied with the Supabase CLI:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF   # one-time
npx supabase db push                               # apply migrations to the hosted project
```
