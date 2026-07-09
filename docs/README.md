# Handoff package — AI artifact portfolio platform

**Working title:** Artifacts Hub (placeholder — needs a real name before launch)
**Status:** Concept validated through product brainstorming. Not yet built. No code, no design files, no market testing beyond desk research.
**This package contains:**
- `PRD.md` — what we're building, for whom, and why. Product scope, feature requirements, success metrics, risks.
- `TECHNICAL_HANDOFF.md` — how to build it. Architecture, data model, sandboxing approach, third-party integrations, suggested stack, build sequencing.

## One-paragraph pitch

A place for people who make things with AI tools (Claude, and eventually others) to publish a public, personal profile and share the single-page HTML artifacts they've built — like a CodePen crossed with a personal portfolio site, but built around a real social feed (follows, comments, likes) instead of a curated directory, and eventually a one-command way to publish straight from an AI chat via MCP.

## Why this concept, in one paragraph

Desk research (see "Competitive landscape" in the PRD) found plenty of adjacent products — Anthropic's own curated artifact gallery, a couple of indie "vibe coding" project directories, and a large category of AI-generated personal portfolio sites — but nothing that combines a real person-centric social profile, a genuine feed (not a submission queue), single-file HTML artifacts specifically, and a push-from-chat integration. That combination is the bet.

## How to use this package

1. Read the PRD first — it has the product reasoning, not just a feature list. The "Non-goals" and "Risks" sections matter as much as the feature scope.
2. Read the technical handoff second — it assumes the PRD's scope and gets specific about implementation.
3. Both docs have an "Open questions" section. Nothing in there is a blocker to starting Phase 1 work, but they should get answered before Phase 2.
4. Everything under "Phase 1" is meant to ship as the first release — a working, usable core loop. "Phase 2" items are explicitly deferred and shouldn't creep into the first build.

## Key decisions already made (don't relitigate these without a reason)

- **No AI-generated imagery in Phase 1** — real photo upload or a simple initials/color avatar only.
- **Comments and follows ship in Phase 1**, not deferred — but only alongside the baseline safety items listed in the PRD (report button, rate limits, sandboxing). Full moderation tooling (review queues, admin actions) is Phase 2.
- **Sharing uses share-intent links** (LinkedIn/X compose windows pre-filled with text + URL), not native OAuth posting. This was a deliberate simplicity/risk tradeoff — see the technical handoff for exact URL formats.
- **MCP push is Phase 2**, not Phase 1 — it's a strong differentiator but not required to validate the core loop.
- **GitHub gets real integration** (pull public profile data); LinkedIn and Instagram are outbound link fields only, since their APIs don't realistically allow more.
