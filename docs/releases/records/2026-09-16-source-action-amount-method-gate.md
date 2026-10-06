# Source action amount method gate

## Release ID

`2026-09-16-source-action-amount-method-gate`

## Status

`candidate`

## Plain-English Summary

Keep optimization candidate actions visible while excluding amounts that lack a recorded sizing method or are still signal-stage from executive totals. A missing or conflicting sizing claim leaves that optimization candidate amount unset rather than treating an authored number as calculated value.

## Layer Impact

`client-data-lane`. The Layer 4 Source optimization-opportunity projection changes its eligibility rule for candidate amounts. Layer 1 source files and Layer 3 records are unchanged.

## Client Applicability

- All clients: the view rule applies after the governed Layer 4 refresh.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Require a recorded calculation or benchmark method, evidence references, and a sized opportunity state before an amount enters the action projection.
- Retain unsized candidate rows with an unset amount.
- Add focused projection behavior tests, including conflicting sizing claims.

## QA / Validation

- A focused behavior test failed on the previous projection because signal and unmethoded authored amounts entered the total.
- Focused tests, typecheck, lint, release gate, and disposable PostgreSQL view compile are required before merge; final results are recorded with the pull request.
- Live candidate counts and totals have not been read back.

## Rollout Plan

Merge through a protected pull request. A web deployment does not refresh this database view. Apply the governed Layer 4 projection job after separate data-plane authorization, then reconcile candidate row counts and totals before claiming the change live.

## Deployment Authority

- Repo-owned deploy workflow: only the repository main deploy workflow may update shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: verify if the main workflow deploys.
- ACA runtime invariant: verify if the main workflow deploys.
- Worker image invariant: verify before any governed projection job.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, after the governed view refresh and readback.

## Rollback Plan

Preserve canonical records. Restore the prior version of the projection through a governed Layer 4 job only if a reconciled rollback is approved; do not rewrite source files or opportunity rows as a rollback shortcut.

## Audit Evidence

Inspect the pull request, focused test and mutation result, SQL compile, release-check output, governed projection-job proof bundle, row-count reconciliation, and signed-in Source readback.

## Known Gaps

The canonical opportunity ownership and loader reconciliation are separate work. This rule does not govern the independent sourcing-opportunity branch, and it does not turn an authored amount into a reproducible calculation or finance-confirmed value.
