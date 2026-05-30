# 2026-05-30 Atlas Fix C — determinism + truncation + honest synthesis timeout

## Release ID

`2026-05-30-atlas-fix-c-determinism-truncation-timeout`

## Status

`candidate`

## Plain-English Summary

The Atlas CXO-quality audit (PR #2562,
`docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`) found three
structural problems on the Atlas chat surface and the Tower portfolio
synthesis surface:

1. **Atlas was non-deterministic.** Neither the Atlas chat path
   (`src/lib/atlas/llm.ts`) nor the Tower synthesis path
   (`src/app/api/tower/synthesis/route.ts`) set a `temperature` on the
   Anthropic call, so the SDK default (~1.0) applied. The same
   `signal:<id>` rendered as "critical-severity" on one read and
   "93rd-percentile outlier" on the next. A CIO seeing contradictions
   on consecutive refreshes loses trust in the read.

2. **Atlas truncated long responses mid-sentence.** The chat call
   capped at `max_tokens: 500`, which cut industry-context responses
   mid-thought (the audit's recorded example ended at
   `"...vs peer median."`).

3. **Atlas could hang silently.** The Tower synthesis stream had no
   `AbortController`, so when the upstream Anthropic call stalled the UI
   sat indefinitely at "Atlas is thinking…" — no progress, no honest
   failure.

This PR closes all three:

- Both Anthropic call sites now pass `temperature: 0` (exported as
  `ATLAS_TEMPERATURE` and `TOWER_SYNTHESIS_TEMPERATURE` for test
  pinning). Same input → same output.
- The Atlas chat cap is now `ATLAS_MAX_TOKENS = 2000`, which covers the
  canonical CXO response shapes (3–7 line briefs, lead-tables, 12–20
  line industry-context reads) with headroom.
- The Tower synthesis stream now wraps the Anthropic call in an
  `AbortController` with a 30-second timeout
  (`TOWER_SYNTHESIS_TIMEOUT_MS`). On timeout the route emits an honest,
  user-facing message — *"Atlas couldn't complete that response in
  time. Try again or pick a narrower question."* — either as a 504
  body (non-streaming, restricted-output branch) or appended to the
  partial stream (streaming branch). Never silence.

## Layer Impact

- **Runtime / app-lane:**
  - `src/lib/atlas/llm.ts` — `messages.create` now passes
    `temperature: 0` and `max_tokens: ATLAS_MAX_TOKENS` (was
    `max_tokens: 500` with no temperature). New exported constants
    `ATLAS_TEMPERATURE` and `ATLAS_MAX_TOKENS` so tests pin the levers.
  - `src/app/api/tower/synthesis/route.ts` — `messages.stream` now
    passes `temperature: 0` and is wrapped in an `AbortController` with
    a 30 s deadline. On abort the non-streaming branch returns 504 with
    the honest message; the streaming branch appends the message to
    whatever partial text it accumulated and closes cleanly. New
    exported constants `TOWER_SYNTHESIS_TEMPERATURE`,
    `TOWER_SYNTHESIS_TIMEOUT_MS`, `TOWER_SYNTHESIS_TIMEOUT_MESSAGE`.
- **Data-plane lane:** no schema changes; no migrations.
- **QA-validation lane:** 7 new tests in 2 suites
  (`src/lib/atlas/llm-determinism.test.ts`,
  `src/app/api/tower/synthesis/route-fix-c.test.ts`) — all pass.
  `npm run test:behaviors` shows no new regressions.
- **Broker boundary:** unchanged — no Supabase or vector-store writes
  in this PR.

## Client Applicability

- All clients: Yes — applies to every tenant immediately on deploy.
  Determinism and the honest timeout apply uniformly; raising
  `max_tokens` only matters when the model would otherwise have
  truncated, so existing short answers are unaffected.
- Specific clients: None.
- Internal only: No — pilot tenants benefit immediately.
- Public/demo only: No.
- Feature flag: None. Both fixes are pure quality wins with no
  rollout risk.

## Changes Included

### New files

- `src/lib/atlas/llm-determinism.test.ts` — pins `ATLAS_TEMPERATURE=0`,
  `ATLAS_MAX_TOKENS>=1500`, and source-level wiring at the call site.
- `src/app/api/tower/synthesis/route-fix-c.test.ts` — pins
  `TOWER_SYNTHESIS_TEMPERATURE=0`, a finite timeout in [5 s, 60 s],
  honest message phrasing, and `AbortController` wiring.
- `docs/releases/records/2026-05-30-atlas-fix-c-determinism-truncation-timeout.md`
  (this file).

### Modified files

- `src/lib/atlas/llm.ts` — exported the two new constants; updated the
  `messages.create` call to pass them and to drop the literal
  `max_tokens: 500`.
- `src/app/api/tower/synthesis/route.ts` — exported the three new
  constants; updated the `messages.stream` call to pass
  `temperature: TOWER_SYNTHESIS_TEMPERATURE` and a `signal:
  abortController.signal`; wrapped both the restricted-output branch
  and the streaming branch in `try/finally` so the timeout handle is
  always cleared and abort is honored.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx jest src/lib/atlas/llm-determinism.test.ts src/app/api/tower/synthesis/route-fix-c.test.ts`
  — **7 / 7 pass**.
- `npm run test:behaviors` — 85 / 90 pass; the 5 failures are in
  `src/__tests__/behaviors/tenant-onboarding.test.ts` and are
  pre-existing on `main` (verified by `git stash` baseline run). No
  Fix-C-related regressions.

## Rollout Plan

1. Merge to `main`.
2. Vercel preview / production deploy — pure app-tier change, no
   migration or env-var step.
3. No feature flag, no manual runbook.

## Rollback Plan

- App-tier rollback: revert this PR. The five constants and the
  `AbortController` wrap disappear; the Atlas surface returns to its
  pre-PR behaviour (non-deterministic + 500-token cap + open-ended
  upstream wait). No downstream system depends on the new behaviour, so
  rollback is safe at any time.
- No DB rollback required.

## Audit Evidence

- Source audit: `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`
  (delivered in PR #2562). Findings:
  - §3 P1 *Non-determinism is structural* — closed here.
  - §3 P1/P2 *Truncation at 500 tokens* — closed here.
  - §3 P2 *No synthesis timeout / stuck state* — closed here.
- Source PR: #2562 (audit doc).
- Implementation PR: this PR.
- The audit's sibling fixes A (retrieval) and B (response-shape) are
  intentionally out of scope; this PR is Fix C only, in line with the
  audit's three-PR plan.

## Known Gaps

- The shared `streamAgentTurn` infrastructure in
  `src/lib/agent/stream.ts` is used by non-Atlas surfaces (Intelligence
  Ask, Programs Nexus draft, Sentinel orchestrator, Engagement turn,
  etc.) and was NOT modified — those surfaces still run at the SDK
  default temperature. If the audit pattern recurs there, a follow-up
  PR per surface (or a careful default-change with per-surface
  override) is the right path; doing it here would have widened the
  blast radius beyond the audit's scope.
- The 30 s timeout is hard-coded; if pilot traffic shows a different
  upstream latency distribution we may want to expose it as an env var.
  Not done here because no current operator surface needs it.
- The streaming-branch timeout response is text appended to whatever
  partial output we already streamed. A future iteration could
  surface a typed control frame (e.g. a sentinel marker the client
  parses) instead of inline text; today's UI treats partial text +
  a closing sentence correctly, so this is good enough for pilot.
