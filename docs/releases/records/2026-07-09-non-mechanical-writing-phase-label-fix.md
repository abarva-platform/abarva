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

- PR: [#4635](https://github.com/abarva-platform/abarva/pull/4635), 21/21 CI checks passed, squash-merged as `255464df`.
- Deploy: workflow run [29024338974](https://github.com/abarva-platform/abarva/actions/runs/29024338974), succeeded. (A later, unrelated deploy — commit `0c11a7e3` — is now the active ACA revision; since it is later on `main`, it necessarily includes this fix.)
- ACA runtime invariant: passed post-deploy.
- Live re-run against the same Lakeshore Move (`908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`, phase 4, `risk_control` archetype), enqueued ~14:24 UTC, processed by the `14:40:00` worker tick:
  - `execution_roadmap` (run `6244ab4b-0708-4b68-b68e-6976e60797c1`): **`status: "succeeded"`**, `goldenBarStatus: "Passed quality check"`, `blockers: []`, real `artifactId` produced. The phase-label leak fix is fully confirmed — this deliverable now completes cleanly end-to-end.
  - `business_case` (run `90565c02-049f-4c76-a08e-fb28e341da1f`): still `blocked` — `blocked_quality: non_mechanical_writing`. Diagnostic log shows this is a **different, third** root cause, not a regression of the phase-label fix: `matchedTerm="source register ×6"`, snippet shows the artifact's own required "Appendix A — Source Register" heading. `business_case`'s profile sets `sourceRegisterPolicy: "appendix_only"` — an appendix literally titled "Source Register" is required, legitimate behavior for this deliverable type, but `scanMachinery`'s ban list has no heading-vs-prose distinction and blocks the bare string anywhere in the narrative, including the profile's own required appendix title.
- Net result: the phase-label leak (this release's target) is fully fixed and confirmed live. A third, distinct false-positive (source-register appendix heading) remains open and is tracked as a new follow-up, not silently folded into this release's scope.

## Known Gaps

- This fix addresses the confirmed leak path (`generate-phase` route → `decisionContext` → model prompt) and is fully live-confirmed for `execution_roadmap`. The temporary diagnostic logging added in the prior release remains in place, which is what surfaced the next root cause below.
- **New, root-caused but not yet fixed**: `scanMachinery`'s ban on the literal string `"source register"` has no exemption for a profile's own required appendix heading (`sourceRegisterPolicy: "appendix_only"`), so `business_case` (and likely any other profile with the same policy) is structurally guaranteed to block on its own required "Appendix — Source Register" section title. Follow-up: exempt the term when it appears specifically as a heading matching the profile's designated appendix title pattern, not when it appears in body prose (narrow fix, same discipline as this release — do not broaden the exemption beyond the heading case).
- `financial_model`'s `deliverable-registry.ts` prompt hint still contains a bare `"P2"` reference ("baseline data from P2") for a different deliverable type not exercised in this batch — not fixed here since it wasn't observed live and may be intentional internal guidance rather than model-facing text; flagged for a follow-up audit of every `generationPromptHint`/`decisionContext` input for the same class of leak.
