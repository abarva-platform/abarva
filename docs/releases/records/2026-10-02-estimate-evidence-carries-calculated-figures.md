# 2026-10-02 — The Reviewed Estimate Is Cited With Its Calculated Figures

## Release ID

`2026-10-02-estimate-evidence-carries-calculated-figures`

## Status

`candidate`

## Plain-English Summary

A roadmap and a business case present an estimate: effort and cost by work package, and totals for each delivery case. Those figures are not written by the model. A reviewer enters hours, rates and assumptions; the product calculates the adjusted hours, costs and totals; and the writer is told those calculated figures are authoritative and must be reproduced exactly.

Every figure in a deliverable must also trace to governed evidence, and a figure that does not is blocked. Saved inputs are part of that evidence. But the estimate was held there as it was saved — the reviewer's inputs only. The calculated costs and totals appeared in no evidence at all. So when a roadmap reproduced the totals correctly, the check could not trace them to anything and blocked the roadmap and the business case as carrying unsupported figures.

The estimate is now held in evidence as its calculated rendering — the same text the writer is given. A figure reproduced from the reviewed estimate can be traced and cited. The check itself is unchanged: a figure that is altered, or derived by arithmetic on the estimate's figures, is in no evidence and is still blocked. An estimate that has not been reviewed and confirmed contributes no calculated figures.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable evidence:** What the evidence statement for a saved, reviewed estimate contains.
- **Numeric-lineage gate:** Unchanged. Same rule: every figure must match governed evidence exactly, carry a declared assumption, or be an open input.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on roadmap-phase deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/estimate-capture-evidence.ts` (new): the evidence statement for a reviewed estimate.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: use it for the estimate section; every other saved input is unchanged.
- Tests.

## QA / Validation

- Targeted Jest: pass — deliverable orchestrator suites, `33 suites, 466 tests`, 5 new.
- The tests pin both directions: a table of the calculated totals is traced and cited; a total changed by one, and a difference derived by subtraction, stay unsupported.
- Mutation check: with the saved inputs used as the statement (the previous behavior), 2 tests fail.
- Scoped typecheck of the changed files: clean. Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Full typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow with a reviewed estimate whose calculated totals matched the reference figures exactly, the roadmap and the business case were both blocked for unsupported figures; the flagged items were the estimate tables.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the roadmap-phase deliverables of the synthetic workflow and confirm the estimate tables are cited to the reviewed estimate and the figures match it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation result: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Tracing matches figures in the forms the lineage check recognises: currency amounts, comma-grouped numbers, percentages and dates. An hours figure with no separator is not a figure the check examines, in either direction.
- A table is traced as a whole. One untraceable figure in it leaves the whole table unsupported; the message names the table, not the figure.
- The value model and any other calculated input are not covered; only the estimate.
- The individual estimate fields are no longer separate evidence items; the estimate is one item.
