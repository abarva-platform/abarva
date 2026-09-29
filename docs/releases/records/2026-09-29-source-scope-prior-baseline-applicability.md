# Source Scope prior-baseline applicability

## Release ID

`2026-09-29-source-scope-prior-baseline-applicability`

## Status

`candidate`

## Plain-English Summary

A new sourcing event can have no prior contract or verified run-cost baseline. The Scope workflow now asks the Event Owner to review an existing baseline or record its absence with a reason. It no longer asks for supplier proposal terms before the market event. An absence is an auditable applicability decision, not a zero-valued commercial fact or an uploaded agreement.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical facts: No schema, migration, canonical contract, spend, or vendor-fact write.
- Layer 4 Source workflow: Aligns one Scope step with its existing evidence requirement and permits a narrowly scoped accountable absence. Other Scope requirements remain mandatory.

## Client Applicability

- All clients: Source New events at the Scope prior-baseline step.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replace the premature supplier-commercials task with a prior commercial-baseline review bound to the existing prior-contract requirement.
- Reuse the authenticated Event Owner/client-admin applicability route for this one requirement. It records actor, timestamp and substantial rationale without changing evidence readiness.
- Complete the step only from source-backed evidence at the required readiness or a valid audited absence; a stored file, unrelated numeric fact, wrong requirement or unaccountable declaration cannot complete it.
- Show the absence decision beside the active requirement, while retaining the normal upload and Files review path.

## QA / Validation

- Pass: Red-first authority, route, task-hydration and mounted-step tests failed on the prior behavior and pass after the change.
- Pass: Removing the new permission failed the route/authority tests; removing hydration failed the persisted-step test; removing the active-step control failed the mounted UI test. All mutations were restored.
- Pass: Scope gate test accepts only the audited prior-baseline absence and still rejects a missing workforce requirement.
- Pass: 125 Source suites / 1,243 tests, scoped ESLint and TypeScript with an 8 GB heap. The default 4 GB TypeScript run exhausted Node heap and was rerun successfully.
- Not run: PR CI, official ACA deploy/runtime, and signed-in step replay until those stages.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repo-owned ACA main workflow may deploy to shared Product/Lab. Verify the web template, sole 100%-traffic revision and required workers use the approved immutable digest; then replay the exact signed-in Scope step and inspect persisted evidence/step readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None from this branch.
- Approved image digest: Pending main workflow.
- ACA runtime invariant: Template and 100%-traffic revision must match.
- Worker image invariant: Required delivery jobs must match.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a new PR and the repo-owned main workflow. No migration or data rollback is required; recorded applicability decisions remain auditable and can be restored to applicable through the product.

## Audit Evidence

Focused red/green and mutation output, broader Source suite, PR checks, exact main deployment, immutable runtime readback, and private signed-in journey ledger.

## Known Gaps

Other Scope evidence, Client Finals and gate criteria remain separate. This does not create supplier offers, current SOWs, SLA baselines, workforce records, or a Scope stage exit.
