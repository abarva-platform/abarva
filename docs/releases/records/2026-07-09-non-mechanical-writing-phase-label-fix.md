# 2026-07-09-non-mechanical-writing-phase-label-fix — Stop leaking internal phase labels into the model prompt

## Release ID

`2026-07-09-non-mechanical-writing-phase-label-fix`

## Status

`candidate`

## Plain-English Summary

Live diagnostic logging (previous release) captured the exact cause of the residual `non_mechanical_writing` block affecting `execution_roadmap`, `business_case`, and `tower_metrics_plan` in the same generation batch: `POST /api/v1/deliverables/generate-phase` builds each deliverable's `decisionContext` — which is sent verbatim to the model — using the registry's internal `phaseLabel` (e.g. `"P4 Roadmap & Business Case"`). The model, faithfully following its own instructions, echoes the internal phase label back into the client-facing narrative (observed live: *"...at this stage of the P4 roadmap..."*), and the machinery-vocabulary gate then (correctly) blocks the leak it was designed to catch. This is the same root-cause class as the `FIN-BASE-P2` bug fixed in #4623 — a prompt input containing literal internal-phase vocabulary that the gate is guaranteed to catch on output — just via a different field (`decisionContext`/`phaseLabel` instead of `generationPromptHint`). Fix: strip the leading `"P<n>"` token from the phase label before it is interpolated into `decisionContext`; the route's own response still returns the original `phaseLabel` unchanged (that's internal/ops-facing, not model input).

## Layer Impact

- `global-control-lane`: `POST /api/v1/deliverables/generate-phase` is shared infrastructure for every Moves "Approve & Build" batch generation, for every tenant.

## Client Applicability

- All clients: yes.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts`: derive a `clientSafePhaseLabel` (strip the leading `P\d+` token) and use it — not the raw `phaseLabel` — when building `decisionContext`.
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`: regression test asserting no enqueued `decisionContext` contains a standalone `P<digit>` token, using the exact phase (4) and deliverable shape that leaked live.

## QA / Validation

- `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — 7/7 passed (including the new regression test).
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .` — 0 errors.
- `npx eslint` on changed files — 0 errors.
- Root cause confirmed from live ACA logs (Log Analytics, `ContainerAppConsoleLogs_CL`), not guessed: three deliverable types in the same batch (`execution_roadmap`, `business_case`, `tower_metrics_plan`) all showed `matchedTerm` values of `P1`/`P2`/`P3`/`P4`, and the `business_case` snippet showed the model's own prose: `"...at this stage of the P4 roadmap..."` — confirming the leak originates from what the model was told, not from an unrelated model quirk.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → re-run the same live generation batch (`execution_roadmap` + `business_case`, Lakeshore Move `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`, phase 4) → confirm neither blocks on `non_mechanical_writing` anymore (or blocks for a new, different, documented reason).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: the deliverable worker (`job-abarva-deliv-worker`) ships the same web image; verified by the same check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — re-run the same batch post-deploy.

## Rollback Plan

Revert the commit; the change only affects the string passed as `decisionContext` for newly-enqueued runs — no migration, no data mutation, no flag.

## Audit Evidence

- To be added once merged/deployed and the live re-run confirms the fix.

## Known Gaps

- This fix addresses the confirmed leak path (`generate-phase` route → `decisionContext` → model prompt). The temporary diagnostic logging added in the prior release remains in place for now, in case another distinct leak surfaces; it should be removed or reduced once confidence is established.
- `financial_model`'s `deliverable-registry.ts` prompt hint still contains a bare `"P2"` reference ("baseline data from P2") for a different deliverable type not exercised in this batch — not fixed here since it wasn't observed live and may be intentional internal guidance rather than model-facing text; flagged for a follow-up audit of every `generationPromptHint`/`decisionContext` input for the same class of leak.
