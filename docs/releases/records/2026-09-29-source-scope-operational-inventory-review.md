# Source Scope operational inventory review

## Release ID

`2026-09-29-source-scope-operational-inventory-review`

## Status

`candidate`

## Plain-English Summary

Source Scope can accept a sourced application or service inventory without requiring unrelated application cost figures. The file must have stable service identities, explicit boundaries, ownership, criticality, lifecycle, source basis and dates. A human reviews the stored file before its evidence becomes usable; uploading alone never completes the workflow step.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical facts: No schema or canonical fact writes. Financial amounts remain governed separately and are never inferred from this inventory.
- Layer 4 Source projection: The inventory template, file validation, evidence review and task readback are updated.

## Client Applicability

- All clients: Source New Scope events using the application/service inventory requirement.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- A structured operational-inventory validator reads CSV or the Intake worksheet in XLSX and verifies its registered file hash and required row fields.
- The existing tenant-scoped evidence review route checks the exact linked artifact, then records a source-bound Usable Evidence receipt and audit activity.
- Scope task hydration requires the persisted review receipt, and upload no longer marks the step complete locally.
- The downloadable input template and step copy use operational fields; cost is a separate evidence concern.
- No migration, data build, supplier contact or external release is included.

## QA / Validation

- Pass: Red-first behavioral tests reproduced the missing validated review, unsupported finance-template requirement and premature local task completion.
- Pass: Same-tenant/event positive and wrong-tenant, wrong-event, wrong-stage, unparsed, hash-mismatch, malformed-row, duplicate-ID, missing-field and invalid-date negatives.
- Pass: 95 adjacent Source suites / 1,072 tests, exact upload/review route suites, TypeScript, scoped ESLint, release check and diff check before PR.
- Not run: PR CI, deployment and live signed-in replay until the candidate merges.

## Rollout Plan

Squash-merge only after applicable CI and review. The repo-owned ACA main workflow builds and deploys the merged SHA. Verify the digest-pinned web template, 100% traffic revision and both required worker images, then replay the exact Scope step signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None from this branch.
- Approved image digest: To be recorded after the main workflow deploy.
- ACA runtime invariant: Template and 100% traffic revision must match the approved digest.
- Worker image invariant: Both required delivery jobs must match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, file upload, explicit review, persisted task readback and locked stage gate.

## Rollback Plan

Revert the squash through a new PR and the repo-owned main deploy workflow. No database rollback is needed; existing reviewed evidence retains its audit record.

## Audit Evidence

Focused test output and mutation proof, PR/CI, exact main deploy run, immutable ACA runtime readback and the private signed-in Source journey ledger.

## Known Gaps

This slice does not supply missing finance, contract, SLA or workforce evidence, accept Scope client-final artifacts, or exit the Scope gate. Search indexing and generic document parsing remain separate from the structured inventory review.
