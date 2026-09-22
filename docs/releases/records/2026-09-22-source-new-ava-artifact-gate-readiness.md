# 2026-09-22-source-new-ava-artifact-gate-readiness — Source New aVa Artifact Gate Readiness

## Release ID

`2026-09-22-source-new-ava-artifact-gate-readiness`

## Status

`candidate`

## Plain-English Summary

When an operator asks what blocks a Source New phase, aVa now uses the same required-artifact gate
as the mounted approval workspace. The answer identifies the recorded artifact review gaps and
directs the operator to Files instead of reporting that no phase blocker exists.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: consolidates a read-only Source New artifact-readiness projection used by the
  event workspace and aVa answer path.
- Layers 1-3: no intake, adapter, canonical data, schema, or tenant-data behavior changed.

## Client Applicability

- All clients: yes, wherever Source New and its event-scoped aVa surface are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source New availability controls apply.

## Changes Included

- `src/lib/source/stage-artifact-readiness.ts` owns the shared required/gate artifact evaluation.
- `src/lib/source/source-event-shell-v2.ts` consumes the shared evaluator for the mounted workspace.
- `src/lib/source/ava/evidence-readiness-governed-answer.ts` consumes the same evaluator for
  stage-completion answers.
- The event ask route passes the canonical current-stage key into the governed answer builder.
- Focused tests cover the exact completion prompt, four distinct artifact states, and route wiring.
- No migrations, data writes, approvals, lifecycle transitions, uploads, or external sends.

## QA / Validation

- Red-first library test failed because the answer said completion was unproven and reported no
  blocker while four required/gate artifact gaps were recorded.
- Focused Source event shell and aVa suites passed: 37 tests.
- Focused event ask route suite passed: 2 tests.
- Scoped ESLint passed.
- TypeScript passed with `npm run typecheck`.
- Mutation proof: removing the stage key from the ask route failed the focused route regression;
  restoring the wire returned the suite to green.
- Release control: `npm run release:check` pending before PR.

## Rollout Plan

Merge through PR into `main`. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the digest-pinned image. Verify the runtime invariant and then repeat the exact signed-in
Source New completion prompt.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: pending after merge/deploy.
- ACA runtime invariant: pending after merge/deploy.
- Worker image invariant: pending after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes before claiming the answer behavior accepted.

## Rollback Plan

Revert the PR. This restores the separate workspace and aVa artifact-readiness projections. No
database rollback or tenant-data cleanup is required.

## Audit Evidence

PR URL, red/green focused Jest output, scoped ESLint output, TypeScript output, release-check
output, mutation result, repo-owned deploy run, ACA runtime invariant readback, and signed-in exact
prompt response.

## Known Gaps

- Signed-in acceptance remains pending until the change is deployed.
- Artifact review and client-final acceptance remain human-governed actions; this change does not
  perform either action.
