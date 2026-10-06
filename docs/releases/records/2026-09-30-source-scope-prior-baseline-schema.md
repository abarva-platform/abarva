# Source prior-baseline applicability storage

## Release ID

`2026-09-30-source-scope-prior-baseline-schema`

## Status

`candidate`

## Plain-English Summary

The Scope workflow can ask an Event Owner to record that no prior contract or verified run-cost baseline exists, but the database still rejects that named applicability decision. This migration adds only the prior-baseline requirement to the existing absence allowlist. It does not mark evidence ready, create a commercial value, or decide the Scope gate.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3: No supplier, contract, spend, pricing, or other canonical commercial fact is created or changed.
- Source evidence storage: One CHECK constraint is replaced transactionally. Existing evidence states and the append-only applicability audit remain unchanged.
- Layer 4: No new UI or route behavior; the already deployed authenticated workflow can persist its named decision after the migration is applied.

## Client Applicability

- All clients: Source New events with a prior-baseline evidence requirement.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add `EVID-SRC-SCOPE-FY-CONTRACT` to the existing database allowlist for an accountable `not_applicable` decision.
- Retain the exact existing checks for `Not Requested`, no source artifact, substantial rationale, actor and decision timestamp.
- Add a contract test comparing the complete old and new CHECK expressions, allowing only the named identifier addition and verifying alignment with the application allowlist.

## QA / Validation

- Pass: The new test failed before the migration and passed after it.
- Pass: Removing the new identifier failed the contract test; removing the no-artifact condition also failed. Both mutations were restored and the test passed again.
- Not run: Production migration apply, database readback and signed-in decision retry. These require a separately authorized data-plane operation.

## Rollout Plan

Squash-merge after applicable CI and review. The repo-owned ACA main workflow may deploy the release SHA; that does not apply the SQL migration. Apply the migration only through a specifically authorized, governed operator path, then read back the constraint and audit behavior before replaying the signed-in Scope action. Keep code merge, runtime, schema apply, data readback and stage acceptance separate.

## Deployment Authority

- Repo-owned web deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Database migration apply: Separate specific authorization required; no agent-side direct apply in this release candidate.
- Shared runtime mutators: None from this branch.
- ACA runtime invariant: Verify the web template, 100%-traffic revision and both delivery workers use one approved digest after the main workflow.
- Live signed-in proof required: Yes, after schema readback.

## Rollback Plan

Revert the application allowance through a new PR and main deployment if necessary. Do not drop the expanded database constraint while decisions using the new identifier exist; reconcile those records under a separate governed operation first. The append-only audit must be preserved.

## Audit Evidence

Signed-in constraint rejection, red/green contract test and mutation proof, PR checks, official deploy, separately authorized schema readback, and private journey ledger.

## Known Gaps

Until the migration is explicitly applied, the signed-in prior-baseline absence action will still fail at the database constraint and Scope Step 3 remains locked. Other Scope evidence, Client Finals and gate criteria remain separate.
