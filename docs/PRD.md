# PRD — AI artifact portfolio platform

**Working title:** Artifacts Hub (placeholder)
**Doc status:** Concept-stage, ready for design/eng scoping. Not yet validated with real users.

---

## 1. Summary

A social platform where people who build things using AI tools (starting with Claude Artifacts, single-page HTML/JS/CSS outputs) can create a public profile and publish their work as shareable, live, interactive posts. The platform combines a personal-brand profile (photo, bio, links to LinkedIn/GitHub/Instagram) with a real social feed (follow, like, comment) and one-click sharing to LinkedIn and X. Phase 2 adds an MCP server so artifacts can be pushed directly from an AI chat session without leaving the conversation.

Primary audience: non-technical or lightly-technical people who are actively creating with AI but have no idea how to host or share what they've built.

---

## 2. Problem statement

Anyone using Claude (or similar tools) to build interactive artifacts — games, calculators, visualizations, small tools — currently has no easy way to:

- Give that work a permanent, shareable home tied to their name/identity
- Build a portfolio of everything they've made over time
- Be discovered by other people doing similar work
- Get the artifact in front of a LinkedIn/X audience without screenshotting it (which kills the "interactive" part of the artifact entirely)

Existing options are all missing at least one piece of this:

| Product | What it does | What it's missing |
|---|---|---|
| madewithclaude.com | Anthropic's official curated gallery of Claude artifacts | Curated by Anthropic, not user profiles; no feed, follows, or comments |
| claudeartifacts.com / .net, Awesome-Claude-Artifacts (GitHub) | Third-party directories of submitted artifacts | Directory/list format, no individual identity or social graph |
| vibe-code.art, vibecoding.gallery | Indie directories for AI-built apps (not Claude-specific), submission + upvote model | Full apps, not single-file artifacts; still a submission queue, not a profile-centric feed |
| CodePen | Profiles, feed, follows, remixing — closest structural analog | Predates the AI wave; assumes hand-written code; no AI-native posting |
| 0Portfolio, Taskade, Figma Make, Wix AI portfolio builders | AI-assisted personal portfolio site generation | Generates a static resume-style site; doesn't host or embed *live* interactive artifacts, no social feed |

The gap: nothing combines a **person-first public profile** + a **real social feed** (not a curated list) + **single-file HTML artifacts specifically** + a **push-from-chat publishing path**.

---

## 3. Goals

- Let anyone who's built something with AI publish it publicly in under a minute, with zero web hosting knowledge required.
- Give creators a durable, personal, brandable profile — not just a list of links — that they'd be comfortable putting on a resume or LinkedIn bio.
- Create a real discovery feed so posting has a reason to happen more than once (i.e., an actual audience, not a void).
- Make the artifacts genuinely easy to spread outside the platform (rich previews, one-tap share to LinkedIn/X).
- Lay groundwork (data model, auth, sandboxing) that Phase 2's MCP push and moderation tooling can build on without a rework.

## 4. Non-goals (explicitly out of scope for Phase 1, and possibly permanently)

- Not a general-purpose no-code app builder. We host and display artifacts; we don't generate or edit them.
- Not a replacement for GitHub — no multi-file projects, no build steps, no version control. Single-file HTML/CSS/JS only.
- Not doing in-platform AI generation (e.g., "generate an artifact for me" inside our product). Creation happens elsewhere (Claude, etc.); we're the publishing/social layer.
- Not building native OAuth posting to LinkedIn/X in Phase 1 (see technical handoff — share-intent links only).
- Not supporting private/unlisted profiles in Phase 1 — this is a public portfolio product by design; revisit only if there's clear demand.

---

## 5. Target users / personas

**Persona A — "Casual creator."** Non-technical, uses Claude for fun or utility projects (a budgeting tool, a game for their kid, a recipe scaler). Doesn't think of themselves as a developer. Wants a simple, low-effort way to show friends and followers what they made. Primary motivator: pride/sharing, not career.

**Persona B — "AI builder / power user."** Comfortable with prompting, iterates on artifacts, may cross-post to X already. Wants a home base, discovery of similar creators, and light networking. Primary motivator: reputation and community.

**Persona C — "Recruiter / collaborator / hiring manager."** Browses profiles and the feed to evaluate what someone can actually produce, especially for AI-fluency signals that a resume can't show. Primarily a *consumer*, not a poster, at least initially.

Phase 1 should optimize for Persona A and B creating content; Persona C is a secondary beneficiary of the feed/discovery surface, not someone we design a distinct experience for yet.

---

## 6. Scope — Phase 1 (MVP core loop)

### 6.1 Profile & auth

- Sign up / log in via social auth (Google and GitHub at minimum — see technical handoff for reasoning).
- Profile fields: display name, headshot (upload; fallback to initials/color avatar if none provided — **no AI-generated avatars in Phase 1**), short bio (plain text, character-limited), and outbound links: LinkedIn, GitHub, Instagram, plus 1-2 freeform "custom link" slots (personal site, Twitter/X, etc.).
- GitHub gets real integration, not just a link: pull public profile data (avatar fallback source, pinned repos or recent public activity) via GitHub's public REST API. No OAuth required for public data.
- LinkedIn and Instagram are outbound links only — their APIs don't support pulling profile data for third-party display; don't scope this as a real integration.
- Profile page shows: header (photo, name, bio, links), a grid/list of the user's posted artifacts, follower/following counts.
- Basic customization: choose which artifacts are "pinned" or featured at the top of the profile (a highlight, not a full custom-layout builder).

**Acceptance criteria:**
- A new user can go from landing page to a live, shareable public profile URL in under 2 minutes.
- Profile is accessible via a clean URL (e.g. `site.com/username`) without requiring the visitor to be logged in.

### 6.2 Artifact posting

- Two entry paths: paste HTML/JS/CSS into a code box with a live preview pane, or upload a `.html` file directly.
- Live preview renders in the same sandboxed environment used for published artifacts (see technical handoff), so what the creator sees while composing matches what gets published.
- Metadata at post time: title, short description, tags/category (freeform or a small fixed list — games, tools, data viz, education, etc., matching the categorization pattern already established by madewithclaude.com), and a visibility toggle is *not* included in Phase 1 (public only, per Non-goals).
- On publish, the system auto-generates a preview image (screenshot) server-side for use in the feed and in link previews (see 6.5 and technical handoff).

**Acceptance criteria:**
- A pasted artifact renders identically in the compose preview and the published page.
- Publishing an artifact takes no more than a few seconds beyond the screenshot generation step.

### 6.3 Feed

- Two feed views: **Following** (reverse-chronological posts from people the user follows) and **Trending/discover** (surfaces artifacts using a simple recency + engagement signal — likes, comments, view count — not a full recommendation algorithm at this stage).
- Each feed card shows: creator (photo + name), artifact title/description, the generated preview image, and engagement counts (likes, comments).
- Clicking a card opens the full artifact page where it actually runs live (not just the static preview image).

**Acceptance criteria:**
- A logged-out visitor can browse the Trending feed and view individual artifact pages without an account.
- A logged-in user with zero follows sees a sensible default (Trending) rather than an empty Following feed.

### 6.4 Comments & follows

- Users can follow/unfollow other profiles.
- Users can comment on artifacts (flat, not threaded, for Phase 1 — threading is a reasonable Phase 2 nice-to-have but not required).
- Users can like an artifact.
- Notifications for comments/follows are explicitly **Phase 2** — Phase 1 does not need an in-app or email notification system for these events.

### 6.5 Sharing

- One-tap share buttons on every artifact page for LinkedIn and X, using share-intent links (pre-filled compose windows), not native OAuth posting. Exact URL formats are specified in the technical handoff.
- The link shared must resolve to a rich preview (Open Graph / Twitter Card) showing the auto-generated screenshot, title, and description — a bare link with no preview defeats the purpose of this feature.

**Acceptance criteria:**
- Pasting an artifact link into LinkedIn's or X's own composer (independent of our share buttons) shows a proper image + title preview, not a blank/broken card.

### 6.6 Baseline safety infrastructure (ships with 6.3/6.4, not deferred)

This is infrastructure, not a "moderation team" — but it's not optional for Phase 1 given comments and follows are live from day one:

- Report/flag button on every artifact and every comment.
- Rate limits on posting, commenting, and following actions (specific thresholds are an engineering call — see technical handoff).
- Artifacts render inside a sandboxed iframe with a strict Content Security Policy and no access to the parent site's cookies or localStorage — this is a security requirement, not a content-moderation one, and must be in place before the first artifact is ever publicly rendered.

**Explicitly deferred to Phase 2:** a moderation review queue/dashboard, admin mute/ban tooling, and automated spam/abuse detection. Phase 1 relies on manual review of reported content.

---

## 7. Scope — Phase 2 (post-launch)

Each of these gets its own detailed spec when Phase 1 is stable; listed here at a level sufficient for planning and sequencing.

- **MCP push.** An MCP server exposing a tool (e.g. `push_artifact`) so a user can publish directly from a Claude conversation (or other MCP-compatible assistant) using an auth token tied to their account. See technical handoff for a draft tool schema.
- **Full moderation tooling.** Admin review queue for reported content, mute/ban actions, automated spam and abuse detection, rate-limit tuning based on real abuse patterns observed post-launch.
- **Notifications.** In-app and/or email notifications for comments, follows, and likes.
- **Remix / fork.** Let a user create their own copy of someone else's artifact as a starting point, in the CodePen tradition — with clear attribution back to the original.
- **Creator analytics.** View counts, engagement trends, and referral sources visible to the artifact's creator.
- **AI-generated avatars.** Revisit once the core loop is validated — genuinely useful for creators without a professional photo, but adds visual-quality risk if done early. Not committed as a roadmap item, just not ruled out.

---

## 8. Success metrics

Phase 1 should be evaluated primarily on whether the core loop actually gets used, not on scale:

- **Activation:** % of signups who publish at least one artifact within their first session.
- **Return posting:** % of creators who publish a second artifact within 30 days (the strongest signal that this is a "portfolio I maintain" rather than a one-off upload).
- **Outbound sharing:** share-button click-through rate, and (if trackable) referral traffic from LinkedIn/X back to artifact pages.
- **Feed engagement:** likes/comments per artifact, follows per active creator — secondary to the two above, since portfolio-style products generally see lower day-to-day engagement than pure social apps (see Risks).

---

## 9. Risks

- **Platform risk.** The content supply depends entirely on Anthropic's (and potentially other vendors') artifact features remaining available and not building this exact profile/feed layer natively — Anthropic already shipped a public gallery and persistent artifact storage in the recent past, which is a plausible direction for them to keep extending.
- **Engagement model mismatch.** Portfolio-style products (CodePen, Dribbble, Behance) are typically goal-driven, lower-frequency visits compared to true social feeds — plan for a loyal-but-modest usage pattern rather than assuming viral daily engagement.
- **Content quality dilution.** A low posting barrier means high volume of low-effort artifacts; the Trending feed's ranking needs to surface quality or the feed becomes unusable fast (mitigated by the engagement-weighted ranking in 6.3, but worth monitoring closely post-launch).
- **Security surface.** Hosting arbitrary user-submitted HTML/JS is a real and ongoing security responsibility (XSS, phishing pages, credential exfiltration attempts) — the sandboxing requirements in 6.6 are non-negotiable, not a nice-to-have.
- **Trust & safety exposure.** Comments and follows live from day one mean harassment and spam are possible from day one; the baseline safety items in 6.6 are the minimum, not the ceiling — be ready to invest in Phase 2 moderation sooner than planned if abuse shows up early.

---

## 10. Open questions (not blockers for starting Phase 1, but need answers before Phase 2)

- What's the actual content moderation policy/threshold — what gets an artifact removed, and who decides?
- Do we want any form of creator verification (e.g., a badge for a verified GitHub account) to help with trust signals in the feed?
- What's the plan if Anthropic (or another AI vendor) ships a directly competing native feature?
- Should artifacts support any private/unlisted state eventually, or does that undermine the "public portfolio" premise?
- Retention/storage policy for reported and removed content (needed before moderation tooling is built).
