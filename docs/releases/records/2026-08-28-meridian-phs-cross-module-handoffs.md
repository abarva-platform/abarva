# 2026-08-28-meridian-phs-cross-module-handoffs — Meridian Demo Handoff Rows

## Release ID

`2026-08-28-meridian-phs-cross-module-handoffs`

## Status

`candidate`

## Plain-English Summary

This release extends the Meridian demo activation package so each activated Move has the rows needed for the cross-module trace to join across Moves, Source, Tower, and Intelligence. The rows prove handoff visibility and measurement need; they do not create claimable value.

## Layer Impact

- Release lane: `public-demo` with a Meridian-scoped `client-data-lane` operator load after merge.
- Layer 2 source adapters / operator package: the activation SQL now writes deterministic Source event, outcome-ledger, and Intelligence evidence rows for each activated Move.
- Layer 4 product projections: the Moves trace can render linked handoff steps when those rows are present.
- Reporting: the demo-readiness status writer can read an executed load summary as well as a plan-only summary.

## Client Applicability

- All clients: no.
- Specific clients: Meridian synthetic demo tenant only.
- Internal only: no.
- Public/demo only: yes.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_meridian_phs_moves_activation_plan.mjs`
- `scripts/ecl/execute_meridian_phs_moves_activation_load.mjs`
- `scripts/ecl/write_meridian_phs_handoff_proof.mjs`
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `src/lib/programs/cross-module-trace-view.ts`
- Focused tests for activation planning, activation execution, and trace rendering.

## QA / Validation

- `npm run test:ecl-meridian-phs-moves-activation` passed.
- `npm run test:ecl-meridian-phs-moves-activation-execute` passed.
- `jest --runTestsByPath src/lib/programs/__tests__/cross-module-trace-view.test.ts --runInBand` passed with the shared installed dependency tree.
- `node --check` passed for the modified ECL scripts.
- `git diff --check` passed.
- Local dense source-room generation passed zero realism failures before the activation plan was generated.

## Rollout Plan

Open a PR, squash merge to `main`, deploy through the repo-owned Azure Container Apps workflow if the product trace change is included, then rerun the governed Meridian Moves activation job. After the job, write the handoff proof from the executed readback summary and run signed-in browser proof on the Moves trace route.

## Deployment Authority

- Repo-owned deploy workflow: required for the product trace text change.
- Shared runtime mutators: not used directly.
- Approved image digest: produced by the repo-owned ACA workflow after merge.
- ACA runtime invariant: required before claiming the trace change is live.
- Worker image invariant: required before claiming the operator package ran on the new code.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for `/strategic-moves/[moveId]/trace`.

## Rollback Plan

Revert the PR and redeploy the prior ACA digest if the product trace renders incorrectly. The generated data rows are deterministic upserts keyed by stable ids; rerunning the previous activation package will not delete them, so rollback proof should focus on route behavior unless a follow-up cleanup job is explicitly approved.

## Audit Evidence

- PR URL after opening.
- ACA deploy workflow after merge.
- Governed operator job summary for the Meridian activation load.
- Handoff proof JSON generated from executed readback.
- Signed-in browser screenshot of the trace route showing four linked steps.

## Known Gaps

- This is read-side cross-module handoff proof. It does not implement a Tower action workflow that writes back to Moves.
- Browser proof and Azure readback are pending until the PR is merged, deployed, and the governed activation job is rerun.
