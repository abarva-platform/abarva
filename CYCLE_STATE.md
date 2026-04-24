# Cycle State · Cycle 2 · Crawler Findings Sweep

## Meta
- Cycle started: 2026-04-24T07:55:00-05:00
- Cycle owner: codex
- Cycle scope: backend and infrastructure fixes from the April 24 crawler findings reports (Marcus T · Apex Retail CFO, Dr. L · Meridian CMIO). Start with the severity-critical tenant isolation defect, then continue through the committed queue in order.
- Out of scope until this queue closes: broad redesign work, copy polish unrelated to findings, and net-new feature work outside the enumerated findings queue.
- Continuation default: after every merged PR, every cleared blocker, and every verification pass, execute the next committed item without waiting for user input unless blocked per Section 19.5.
- Status cadence: every PR merged, every CI failure, every item moved to blocked, every queue mutation, and every 30 minutes during active execution.

## Committed queue (ordered — do not reorder without updating this file)

1. C2-1-tenant-isolation — Enforce backend membership checks on every `/tenant/{slug}/*` route, including programs, deliverables, patterns, tower, and evidence. Non-admin cross-tenant reads return 403, not content. `LOCAL COMPLETE · validated`
2. C2-2-clerk-rebinding — Fix demo-account re-auth so `demo-apexretail+clerk_test` and `demo-meridian+clerk_test` do not rebound to the wrong tenant or lose valid `?client=` state because of stale/incomplete claims. `LOCAL COMPLETE · validated`
3. C2-3-tower-open-routing — Resolve or remove the broken Tower pressure-card `OPEN → /engagements/892a57af-*` path. `LOCAL COMPLETE · validated`
4. C2-4-atlas-free-text-runtime — Replace Atlas echo/redirect behavior with a real Stage 1-6 backed free-text path, same honesty contract as Sentinel.
5. C2-5-nexus-discoverability — Make Nexus/Programs chat discoverable from program detail pages.
6. C2-6-phase-source-of-truth — Align Morrison phase state across home, program detail, and any other surfaced cards.
7. C2-7-approve-tenant-gate — Ensure `APPROVE DECISION` and related write paths are tenant-gated and cannot mutate cross-tenant state.
8. C2-8-strip-vercel-toolbar — Remove Vercel dev toolbar from production.
9. C2-9-strip-design-note — Remove internal “Design note” copy from customer-facing home surfaces.
10. C2-10-queue-identity — Address queue headers by stakeholder/persona identity rather than generic account display name when a modeled stakeholder exists.
11. C2-11-financial-citation-targets — Populate D16 E51-E55 target artifacts or remove the dead stub labels.
12. C2-12-pattern-inline-links — Render in-prose pattern references as links instead of plain text.
13. C2-13-deliverable-surface-count — Surface all deliverables on the program detail page or fix the counter to match what is actually shown.
14. C2-14-deliverable-pattern-ui-wiring — Complete deliverable → pattern UI linking so bidirectional wiring works at the UI layer, not just pattern → deliverable.

## Current position

- Current item: C2-4-atlas-free-text-runtime
- Current step within item: C2-3 validated via UUID/graph-id fallback regression test; Atlas Stage 1-6 bridge is next
- Started item at: 2026-04-24T09:49:00-05:00
- Expected next action ETA: same session

## Complete this cycle

- Cycle 1 Codex lane closed: PR `#156` merged to `main` and production-verified.
- Cycle 1 Code lane closed: PR `#157` merged to `main`.
- Cycle 1 legacy deliverable follow-up closed: PR `#159` merged to `main`, production deploy green, legacy D01/D17 route verification passed for Apex and Meridian.

## Blocked or escalated

- (none yet)

## Notes and discoveries

- 2026-04-24T07:58:00-05:00: `/tenant/[tenantSlug]/*` read routes are currently unguarded server component pages. They resolve seeded tenant/program/deliverable content directly from route params without checking the signed-in user’s tenant membership.
- 2026-04-24T08:01:00-05:00: The seeded approval write path is separate from the v1 program APIs. `src/app/api/programs/approve/route.ts` currently writes to the local approvals ledger with no tenant membership check and no program→tenant authorization.
- 2026-04-24T08:05:00-05:00: Explorer findings for C2-2 show demo-account fallback auth still classifies `demo-meridian` and `demo-apexretail` as `maestro` in fallback paths, which likely contributes to wrong-tenant rebind and premature `?client=` stripping.
- 2026-04-24T08:07:00-05:00: Explorer findings for C2-4 show Atlas free-text still runs through `src/app/api/v1/atlas/chat/route.ts` + `src/lib/atlas/orchestrator.ts` one-shot response plumbing rather than the Stage 1-6 SSE contract used by Nexus/Sentinel.
- 2026-04-24T08:09:00-05:00: For Cycle 2 item 1, safest membership model is “admin may roam; all other roles are pinned.” This matches the user instruction that all users should be locked to one account except admin.
- 2026-04-24T09:13:00-05:00: C2-1 local validation passed: `jest tests/unit/tenant-access.test.ts tests/unit/access-routing.test.ts`, `tsc --noEmit`, and focused `eslint` on auth/test files.
- 2026-04-24T09:15:00-05:00: Sidecar route sweep found additional tenant-shaped APIs to audit after the core `/tenant/*` leak path: `/api/engage/[engagementId]/turn`, `/api/engagements/create/turn`, `/api/data/upload`, `/api/data/turn`, `/api/tower/upload`, `/api/tower/seed-demo`, and `/api/v1/sentinel/query`.
- 2026-04-24T09:33:00-05:00: C2-2 local validation passed: `jest tests/unit/access-routing.test.ts tests/unit/tenant-access.test.ts`, `tsc --noEmit`, and focused `eslint` on access-routing, active-client, sign-in, AppChrome, and auth test helpers.
- 2026-04-24T09:48:00-05:00: C2-3 local validation passed: `jest tests/unit/engagement-db.test.ts`, `tsc --noEmit`, and focused `eslint` on engagement route + test files. UUID-backed Tower pressure-card paths now resolve through `/engagements/[engagementId]`.

- 2026-04-24T13:55:00-05:00 · Code lane follow-up: items C2-5, C2-6, C2-9, C2-10, C2-12, C2-13, C2-14 all landed on PR #162 (stacked on PR #161). Type + build clean.
  - C2-5 · NexusProgramRail mounted on SeedProgramOverview
  - C2-6 · ProgramsGrid phase labels aligned to spec-phase (P1-P5) matching detail page
  - C2-9 · Internal "Design note" stripped from /home
  - C2-10 · Queue page uses persons.name via getCurrentUser, Clerk fallback preserved
  - C2-12 · PatternProse linkifies in-prose pattern_* tokens; reads manifest JSON directly to avoid pulling fs-dependent evidence-registry into client bundle
  - C2-13 · SeedProgramOverview renders all deliverables, not `.slice(0, 12)`
  - C2-14 · DeliverableTable cell type widened to support `{text, href}`; Pattern + Program cells now clickable
- 2026-04-24T13:55:00-05:00 · ESCALATIONS (§19.5):
  - C2-4 Atlas free-text runtime → Codex lane (Stage 5 Claude invocation is Codex-owned; Code will wire `rendered_response` consumer once Codex ships /api/v1/programs/.../atlas/ask)
  - C2-8 Vercel toolbar → Vercel dashboard config (no toolbar package in repo; injected by platform; requires project setting toggle)
  - C2-11 D16 E51-E55 stub citations → content authoring (labels need real payloads; Morrison Tier C task #123 owns this)

## Last status emission

- 2026-04-24T13:55:00-05:00 · Code lane 11 of 14 items merged-or-staged on PRs #160/#161/#162 · 3 items escalated
