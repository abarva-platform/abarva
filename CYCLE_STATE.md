# Cycle State · Cycle 2 · Crawler Findings Sweep

## Meta
- Cycle started: 2026-04-24T07:55:00-05:00
- Cycle owner: codex
- Cycle scope: backend and infrastructure fixes from the April 24 crawler findings reports (Marcus T · Apex Retail CFO, Dr. L · Meridian CMIO). Start with the severity-critical tenant isolation defect, then continue through the committed queue in order.
- Out of scope until this queue closes: broad redesign work, copy polish unrelated to findings, and net-new feature work outside the enumerated findings queue.
- Continuation default: after every merged PR, every cleared blocker, and every verification pass, execute the next committed item without waiting for user input unless blocked per Section 19.5.
- Status cadence: every PR merged, every CI failure, every item moved to blocked, every queue mutation, and every 30 minutes during active execution.

## Committed queue (ordered — do not reorder without updating this file)

1. C2-1-tenant-isolation — Enforce backend membership checks on every `/tenant/{slug}/*` route, including programs, deliverables, patterns, tower, and evidence. Non-admin cross-tenant reads return 403, not content. `MERGED via #161 · deployed`
2. C2-2-clerk-rebinding — Fix demo-account re-auth so `demo-apexretail+clerk_test` and `demo-meridian+clerk_test` do not rebound to the wrong tenant or lose valid `?client=` state because of stale/incomplete claims. `MERGED via #161 · deployed`
3. C2-3-tower-open-routing — Resolve or remove the broken Tower pressure-card `OPEN → /engagements/892a57af-*` path. `MERGED via #161 · deployed`
4. C2-4-atlas-free-text-runtime — Replace Atlas echo/redirect behavior with a real Stage 1-6 backed free-text path, same honesty contract as Sentinel. `MERGED via #163 · deployed`
5. C2-5-nexus-discoverability — Make Nexus/Programs chat discoverable from program detail pages. `MERGED via #162 · deployed`
6. C2-6-phase-source-of-truth — Align Morrison phase state across home, program detail, and any other surfaced cards. `MERGED via #162 · deployed`
7. C2-7-approve-tenant-gate — Ensure `APPROVE DECISION` and related write paths are tenant-gated and cannot mutate cross-tenant state. `MERGED via #161 · deployed`
8. C2-8-strip-vercel-toolbar — Remove Vercel dev toolbar from production. `EXTERNAL COMPLETE · Vercel project setting updated on nexus + abarva`
9. C2-9-strip-design-note — Remove internal “Design note” copy from customer-facing home surfaces. `MERGED via #162 · deployed`
10. C2-10-queue-identity — Address queue headers by stakeholder/persona identity rather than generic account display name when a modeled stakeholder exists. `MERGED via #162 · deployed`
11. C2-11-financial-citation-targets — Populate D16 E51-E55 target artifacts or remove the dead stub labels. `VERIFIED COMPLETE · authored citations present + integrity:evidence-citations green`
12. C2-12-pattern-inline-links — Render in-prose pattern references as links instead of plain text. `MERGED via #162 · deployed`
13. C2-13-deliverable-surface-count — Surface all deliverables on the program detail page or fix the counter to match what is actually shown. `MERGED via #162 · deployed`
14. C2-14-deliverable-pattern-ui-wiring — Complete deliverable → pattern UI linking so bidirectional wiring works at the UI layer, not just pattern → deliverable. `MERGED via #162 · deployed`

## Current position

- Current item: Cycle 2 queue closed
- Current step within item: Repo fixes merged + deployed; external follow-ups closed; awaiting next user-directed queue or optional live recrawl
- Started item at: 2026-04-24T07:55:00-05:00
- Expected next action ETA: on next user direction

## Complete this cycle

- Cycle 1 Codex lane closed: PR `#156` merged to `main` and production-verified.
- Cycle 1 Code lane closed: PR `#157` merged to `main`.
- Cycle 1 legacy deliverable follow-up closed: PR `#159` merged to `main`, production deploy green, legacy D01/D17 route verification passed for Apex and Meridian.
- Cycle 2 repo lane closed: PR `#161`, PR `#162`, and PR `#163` all merged to `main`; production deploys green.
- Cycle 2 external/platform follow-up closed: Vercel Toolbar explicitly disabled at the project level for `nexus` and `abarva`.
- Cycle 2 citation verification closed: Morrison D16 authored evidence `E51-E55` present and `npm run integrity:evidence-citations` reports `unresolved=0`.

## Blocked or escalated

- none

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
- 2026-04-24T13:55:00-05:00 · ESCALATIONS (§19.5) raised at the time:
  - C2-8 Vercel toolbar → Vercel dashboard config (later resolved at the project level)
  - C2-11 D16 E51-E55 stub citations → content authoring (later superseded by authored Morrison content + citation-integrity verification)
- 2026-04-24T15:07:00-05:00: C2-4 local validation passed: `jest src/__tests__/integration/atlas-ask-route.test.ts tests/unit/engagement-db.test.ts tests/unit/access-routing.test.ts tests/unit/tenant-access.test.ts`, `tsc --noEmit`, and focused `eslint` on the Atlas ask route, rendered-response assembler, preview tower shell, and route test files. `/preview/tower` now routes free-text and guided choices through `/api/v1/atlas/ask` with rendered responses, honest sparse-evidence framing, and explicit Nexus/Sentinel handoffs instead of canned echo text.
- 2026-04-24T15:18:00-05:00: PR #163 CI failure reproduced locally: `integrity:disclaimers` was pulling Clerk auth into the static disclaimer audit via tenant evidence routes after the tenant-isolation hardening. Scoped fix: mock `assertTenantAccess` inside `src/__tests__/integration/composite-disclaimer-presence.test.ts` so the audit remains focused on disclaimer presence. Re-ran `npm run integrity:disclaimers`, the Atlas regression suite, `tsc --noEmit`, and focused `eslint` — all green.
- 2026-04-24T09:27:12-05:00: PR #161, PR #162, and PR #163 are all merged; production deploys are green. Cycle 2 repo-code items are no longer awaiting merge.
- 2026-04-24T09:27:12-05:00: Vercel Toolbar disabled at the project level for both `nexus` (`prj_ni9Pi0Ob4pjnWieBxey8evHlrMmY`) and `abarva` (`prj_op1Of34mjYoFdUS0PA0EMJFJ6DB7`) by setting `enablePreviewFeedback=false` and `enableProductionFeedback=false` through the Vercel Projects API.
- 2026-04-24T09:27:12-05:00: Morrison D16 evidence citations `E51-E55` are authored in `src/content/deliverables/apex-retail/morrison/_evidence-base.json`, referenced from `d16-business-case.md`, and `npm run integrity:evidence-citations` passed with `unresolved=0`.

## Last status emission

- 2026-04-24T09:27:12-05:00 · Cycle 2 closed: repo-code queue merged/deployed, Vercel-toolbar follow-up completed at the platform layer, and D16 citation verification closed with zero unresolved references
