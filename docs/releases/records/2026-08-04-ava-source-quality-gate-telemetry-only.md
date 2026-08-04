# 2026-08-04-ava-source-quality-gate-telemetry-only — Stream Source aVa event-scoped answers live; quality gate becomes telemetry-only

## Release ID

`2026-08-04-ava-source-quality-gate-telemetry-only`

## Status

`candidate`

## Plain-English Summary

Source's chat backend (`/api/chat/agent`) streams token-by-token for almost every turn — except
event-scoped answers in the 14 Phase A/B modes (event status, workflow how-to, evidence readiness,
RFP, BAFO, pricing, and related stage-gate modes). For those, a deliberate design (a 12-check
deterministic quality gate — `$` traceability to grounding, banned language, no raw internal IDs,
evidence-gap disclosure, etc.) held the entire generated answer in memory, ran the gate, and only then
flushed the (possibly repaired) text to the client in one shot. That gate was well-engineered and
reviewed at the time it was built, but the practical cost was 20-30+ seconds of visible silence before
any text appeared on exactly the highest-stakes commercial conversations (RFP/BAFO/pricing) — reported
as a live usability problem this session.

This release keeps the gate's 12 checks running exactly as before, but makes it telemetry-only: the
answer now streams live to the client as it generates, identically to every other Source turn, and the
gate's pass/fail result is logged (unresolved checks recorded via `console.warn`) rather than used to
hold or rewrite the response. The user explicitly chose this tradeoff over two alternatives (narrow the
hold to only the highest-risk financial modes; or keep holding and instead optimize pipeline latency)
given that this session's separate grounding fixes
(`2026-08-04-ava-source-portfolio-grounding-fix`, `2026-08-04-ava-source-scope-boundary-and-selection-awareness`)
have substantially cut the underlying fabrication risk the gate exists to catch.

## Layer Impact

- `global-control-lane`: `src/app/api/chat/agent/route.ts` is the shared chat backend for every agent
  surface. The change is isolated to the `sourceAvaQualityGateActive` branch inside the streaming
  `ReadableStream` handler — every other surface's streaming behavior (already token-by-token) is
  unchanged. The gate function itself (`runSourceAnswerQualityGate`, `src/lib/source/ava/answer-quality-gate.ts`)
  is not modified; only how its result is used changed (log, don't hold/rewrite).

## Client Applicability

- All clients using Source's aVa chat on event-scoped conversations (RFP, BAFO, pricing, and related
  stage-gate modes). Non-Source surfaces and Source portfolio-level questions (no active sourcing
  event) were already streaming and are unaffected.

## Changes Included

- `src/app/api/chat/agent/route.ts`:
  - `flushAgentOutput`/`writer.write`: always `controller.enqueue` immediately (live streaming), while
    still accumulating `heldAgentText` so the gate can check the full answer afterward.
  - The `finally` block's gate section: runs `runSourceAnswerQualityGate` on the accumulated text as
    before, but no longer enqueues `gateResult.finalText` or the raw held text — the answer already
    shipped live. On `!gateResult.passed`, logs `unresolvedChecks` via `console.warn` for telemetry,
    same signal as before, just without the "after repair" framing since no repair is shipped now.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` (clean worktree off `origin/main`)
- PASS: `npx eslint src/app/api/chat/agent/route.ts`
- PASS: `npx jest src/app/api/chat/agent/__tests__/ src/lib/source/ava/__tests__/ src/lib/source/data-model/__tests__/ src/lib/source/facts/view/__tests__/`
  (387/393; the 6 failures across 3 suites are pre-existing static string-matching assertions on
  `route.ts`'s raw source text — confirmed to fail identically, byte-for-byte, on a fresh unmodified
  `origin/main` checkout at the same commit, i.e. not a regression from this diff)
- `src/lib/source/ava/__tests__/answer-quality-gate.test.ts` (unit tests against
  `runSourceAnswerQualityGate` directly) is unaffected — the gate function itself is unchanged, only
  route.ts's use of its result changed.
- Live signed-in proof: pending post-deploy — ask an event-scoped Phase A/B question (e.g. an RFP or
  BAFO question inside an active sourcing event) against the deployed endpoint and confirm text begins
  appearing within a normal streaming cadence, not after a 20-30s pause.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — behavioral change to an existing code path only.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation, no schema change — reverting restores the prior
hold-and-repair behavior (and its latency cost) exactly.

## Audit Evidence

- Live user report (this session) of 20-30+ second silent waits on event-scoped Source aVa
  conversations, traced in code to the `sourceAvaQualityGateActive` hold-and-flush path.
- This PR's diff and CI run.
- Post-deploy: live signed-in re-test of an event-scoped Phase A/B question, confirming streaming
  cadence and that gate telemetry still logs correctly on a deliberately induced violation if tested.

## Known Gaps

- The quality gate's repair capability (rewriting a violating answer before it reaches the user) is
  fully retired by this change, not narrowed — the user explicitly chose the "stream live everywhere,
  telemetry-only" option over the narrower "hold only the highest-risk financial modes" alternative.
  If gate telemetry shows a real, recurring violation pattern post-deploy (not just occasional
  false-positives), re-introducing a narrower, faster hold-and-repair path for just the financial
  traceability check would be worth revisiting — not done here.
- No dashboard or alerting was added on the `console.warn` telemetry signal in this release; it relies
  on existing log-based observability. A structured metric/alert on `unresolvedChecks` frequency is
  separate follow-on work if the team wants proactive visibility rather than log-search.
