# Technical handoff — AI artifact portfolio platform

Companion to `PRD.md`. This doc assumes the Phase 1 scope defined there and gets specific about how to build it. Stack suggestions are a reasonable starting point, not a mandate — adjust to whatever the receiving team already standardizes on.

---

## 1. Architecture overview

Four logical pieces:

1. **Web app** — the profile pages, feed, compose flow, comments. Server-rendered or hybrid for SEO on public profile/artifact pages (these need to be crawlable and need to produce good link previews).
2. **API/backend** — auth, profile CRUD, artifact CRUD, follows, comments, likes, rate limiting.
3. **Artifact rendering & sandbox service** — where user-submitted HTML actually executes, both in the compose-preview and on the published artifact page.
4. **Screenshot/OG-image service** — headless-browser render of a published artifact, producing the static preview image used in the feed and in link previews.

```
Browser (creator, composing)
   │
   ▼
Web app ── API ── Database (users, profiles, artifacts, comments, follows, likes, reports)
   │                 │
   │                 └── Object storage (artifact HTML source, screenshot images)
   │
   └── Sandboxed iframe (artifact render), same mechanism used for compose-preview and published page
                 │
                 ▼
       Screenshot service (headless browser) → writes preview image to object storage → linked from artifact record
```

Keep the rendering sandbox and the screenshot service as genuinely separate concerns from the main app — they're the two places arbitrary user content actually executes, and isolating them limits blast radius if something goes wrong.

---

## 2. Data model

Core entities and key fields. Treat this as a starting schema, not final DDL.

**User**
- `id`, `email`, `auth_provider` (google/github), `auth_provider_id`, `created_at`

**Profile** (1:1 with User, split out so profile display data isn't tangled with auth)
- `user_id`, `display_name`, `username` (unique, used in profile URL), `bio` (text, length-capped), `avatar_url` (uploaded photo or generated initials/color fallback — not AI-generated in Phase 1), `github_url`, `linkedin_url`, `instagram_url`, `custom_links` (small array/JSON of {label, url}), `github_username` (used to pull public GitHub data separately, see §7)

**Artifact**
- `id`, `owner_id` (→ User), `title`, `description`, `tags` (array or small fixed taxonomy), `source_html` (the actual artifact content — object storage reference, not inline in the DB row, once past a small size threshold), `preview_image_url`, `like_count`, `comment_count`, `view_count`, `status` (published / removed), `created_at`

**Comment**
- `id`, `artifact_id`, `author_id`, `body`, `created_at`, `status` (visible / removed)

**Follow**
- `follower_id`, `followee_id`, `created_at` — composite unique key on (follower_id, followee_id)

**Like**
- `user_id`, `artifact_id`, `created_at` — composite unique key

**Report**
- `id`, `reporter_id`, `target_type` (artifact / comment), `target_id`, `reason`, `status` (open / reviewed / actioned), `created_at`

Notes:
- Store `source_html` in object storage (S3-compatible), not as a large text column — keeps the DB lean and makes the sandbox/screenshot services able to fetch by reference rather than round-tripping through the app DB.
- `view_count`/`like_count`/`comment_count` on Artifact are denormalized counters for feed ranking performance — update via the write path or a periodic reconciliation job, don't compute live from joins on every feed request.

---

## 3. Artifact rendering & sandboxing

This is the single most important non-negotiable piece of the system, per the PRD's baseline safety requirement (§6.6).

- Render every artifact inside an `<iframe>` using the `sandbox` attribute, at minimum: `sandbox="allow-scripts"` — deliberately **omit** `allow-same-origin`, so the artifact's JS cannot read/write the parent page's cookies, localStorage, or DOM.
- Serve artifact content from a **separate subdomain** from the main app (e.g. `artifacts.yoursite.com` vs `yoursite.com`), not just an iframe on the same origin — this is standard practice for any platform hosting untrusted user content (this is how CodePen, Glitch, and similar platforms isolate user output) and adds a second layer of isolation beyond the sandbox attribute alone.
- Set a strict Content-Security-Policy on the artifact-serving subdomain: no ability to make arbitrary outbound network requests to exfiltrate data where avoidable, restrict frame-ancestors to your own domain so artifacts can't be embedded elsewhere without your knowledge.
- Use the exact same rendering path for the compose-time live preview and the published page — don't build two separate renderers, since they'll drift and the compose preview will stop being a reliable preview of what actually gets published.
- Enforce a reasonable size limit on `source_html` (both for abuse prevention and because "single-page HTML artifact" is the whole product premise).

---

## 4. Screenshot / OG-image pipeline

- Triggered on publish (and on any subsequent edit, if editing is supported).
- Headless browser (Playwright or Puppeteer) loads the artifact in the same sandboxed rendering path described above, waits for a reasonable render-settle window, and captures a screenshot at a fixed viewport size suitable for Open Graph / Twitter Card images (1200×630 is the standard safe size for both platforms).
- Store the resulting image in object storage, save its URL on the Artifact record, and set it as the `og:image` / `twitter:image` meta tag on the artifact's public page.
- Run this as an async job (queue-based), not inline in the publish request — screenshot generation is slow enough that it shouldn't block the user's "publish" action from completing.
- Cache/reuse the screenshot rather than regenerating on every feed render — it only needs to change when the artifact itself changes.

---

## 5. Feed & ranking logic

**Following feed:** straightforward reverse-chronological query of artifacts from followed creators. No ranking complexity needed for Phase 1.

**Trending/discover feed:** a simple weighted score is sufficient for Phase 1 — something like `score = (likes × w1 + comments × w2 + views × w3) / time_decay_factor`, recomputed periodically (a scheduled job, not live on every request) rather than a real recommendation model. The goal at this stage is "don't let week-old low-effort posts outrank yesterday's popular one," not a sophisticated algorithm — revisit once there's real engagement data to tune against.

---

## 6. Sharing implementation

Use share-intent links — no OAuth, no API approval process needed for either platform:

**X (Twitter):**
```
https://twitter.com/intent/tweet?text=<url-encoded text>&url=<url-encoded artifact link>
```

**LinkedIn:**
```
https://www.linkedin.com/sharing/share-offsite/?url=<url-encoded artifact link>
```

Both simply open the platform's own compose UI in a new window/tab with the content pre-filled; the user still hits "post" themselves. This requires zero developer-platform approval and has no ongoing API maintenance burden — the tradeoff documented in the PRD (§6.5) for going this route instead of native OAuth posting.

For the link preview itself to render correctly on both platforms, the artifact's public page needs standard Open Graph tags (`og:title`, `og:description`, `og:image`, and `twitter:card` = `summary_large_image`) pointing at the generated screenshot from §4.

---

## 7. Third-party integrations

- **GitHub:** use GitHub's public REST API (no OAuth needed) to pull a user's public profile info and pinned/recent repos for display on the profile page, keyed off the `github_username` field the user supplies. Be mindful of GitHub's unauthenticated rate limits — cache responses (a few hours is reasonable) rather than hitting the API on every profile page view.
- **LinkedIn:** outbound link field only. LinkedIn's API does not support pulling public profile data for third-party display in any practical way — don't scope this as an integration.
- **Instagram:** outbound link field only, same reasoning.

---

## 8. Auth strategy

Social login only (Google + GitHub at minimum) — no self-managed password auth. Given the target audience is explicitly non-technical (per PRD persona A), minimizing signup friction and avoiding the support burden of password resets/security matters more here than for a typical dev-tool product. GitHub login also has a nice side benefit: it's a natural place to also capture `github_username` for the profile integration in §7.

---

## 9. Rate limiting & baseline safety (Phase 1 requirements, not deferred)

- Rate limit posting, commenting, and follow/unfollow actions per user (specific numeric thresholds are a judgment call for engineering based on expected usage — start conservative and loosen based on real data).
- Report/flag action on artifacts and comments writes to the `Report` table (§2); Phase 1 does not need an admin UI for this, but the data needs to be captured from day one so Phase 2's moderation tooling has something to work with. At minimum, someone on the team needs a way to query open reports manually (even a raw DB query is acceptable for Phase 1 volume).
- Sandbox and CSP requirements from §3 apply before the first artifact is ever published — this is launch-blocking, not a fast-follow.

---

## 10. Suggested tech stack

A reasonable, unopinionated starting point — swap freely for whatever the team already runs:

- **Web app:** React-based framework with server rendering (e.g. Next.js) for SEO/link-preview needs on public pages.
- **API:** Node/TypeScript or your team's standard backend language; REST or GraphQL, either is fine at this scale.
- **Database:** PostgreSQL — the relational model in §2 maps cleanly, and follow/like uniqueness constraints are simple to enforce.
- **Object storage:** S3-compatible bucket for artifact source and screenshots.
- **Queue:** for the async screenshot job (§4) — anything standard (SQS, a Redis-backed queue, etc.).
- **Screenshot rendering:** Playwright (actively maintained, handles modern JS-heavy artifacts well).
- **Rate limiting:** Redis-backed counters are the standard approach.

---

## 11. Phase 2 technical notes (for planning, not immediate build)

**MCP push (draft tool schema):**
```
tool: push_artifact
  input:
    title: string
    description: string
    html: string
    tags: string[] (optional)
  auth: per-user token, generated in account settings, scoped to this tool only
  output:
    artifact_url: string
```
Auth should be a dedicated API token (not the user's login session) generated from their account settings, similar to how GitHub personal access tokens work — this keeps the MCP integration's blast radius limited if a token leaks.

**Moderation tooling:** an admin-facing queue reading from the `Report` table (§2), with actions that update `Artifact.status` / `Comment.status` to `removed` rather than hard-deleting (preserve for audit/appeal purposes). Automated spam/abuse detection is a "build once you have real abuse patterns to detect," not a day-one requirement.

**Notifications:** straightforward event-driven system off the existing Comment/Follow/Like writes — in-app notification feed first, email digest as a fast-follow if warranted by engagement data.

---

## 12. Suggested build sequencing

1. Auth + Profile CRUD (no artifacts yet) — get the identity layer solid first.
2. Artifact posting + sandboxed rendering (§3) — this is the highest-risk technical piece, build and harden it before anything depends on it.
3. Public artifact page + screenshot pipeline (§4) + OG tags — needed before sharing (§6) makes sense.
4. Feed (Following + Trending, §5) — depends on artifacts existing in volume to be meaningful.
5. Comments, likes, follows (§9's rate limiting and report capture ship alongside this step, not after).
6. Share buttons (§6) — trivial once §3 is solid.
7. Phase 2 items per PRD §7, sequenced based on real Phase 1 usage data rather than pre-committed order.
