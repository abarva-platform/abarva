# 2026-09-25 Source RFx Prepared Readback

## Release ID

`2026-09-25-source-rfx-prepared-readback`

## Status

`candidate`

## Plain-English Summary

Adds read-only inspection of prepared RFx package versions. The reader verifies the stored snapshot's exact SHA-256 bytes and tenant, event, version and approval metadata before returning counts and identifiers. It never returns recipient names or addresses and never treats a prepared package as issued.

## Layer Impact

- Release lane: `client-data-lane` because the reader accesses tenant-scoped prepared-package records.
- Layer 3: no canonical object or intake change.
- Control plane: verifies historical prepared-version storage; does not confer current approval or supplier-contact authority.
- Layer 4: no product route or view change.

## Client Applicability

- All clients: readback becomes available when the separately authorized authority schema is applied and populated.
- Specific clients: none.
- Internal only: the inspection command is operator-facing and read-only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- A tenant/event-scoped reader validates the exact stored snapshot bytes and metadata, fails closed on malformed or conflicting rows, and distinguishes an empty available register from an unavailable one.
- A read-only operator command reports version metadata and counts without exposing recipient identities.
- Focused behavior tests cover exact readback and negative tenant, event, state, metadata and digest cases.

## QA / Validation

- Pass: focused tests went from two behavioral failures against the stub to 10/10 passing.
- Pass: replacing the digest comparison with a length-only check made both changed-digest and changed-content cases fail, then restoring the comparison returned green.
- Pass: all four focused RFx suites (41 tests), TypeScript, targeted ESLint, orphan-module reachability, generated CI coverage census and release gate.
- Not run: shared-tenant schema apply, row population or positive live readback. Those remain separately governed.

## Rollout Plan

Merge through a reviewed PR and let only the repo-owned ACA main workflow deploy the code image. The existing prepared-package schema remains unapplied; this release performs no tenant write or package issuance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: determined and checked after merge by the workflow.
- ACA runtime invariant: verify template, sole 100%-traffic revision, and required workers at the same digest.
- Worker image invariant: verify both required jobs independently.
- Feature/env flag update path: none.
- Live signed-in proof required: frozen Scope replay remains separate from this operator readback.

## Rollback Plan

Revert the read-only code through a PR. No database rollback or data deletion is needed.

## Audit Evidence

- Focused red/green test and digest mutation proof.
- PR review and CI, if opened; ACA runtime proof only after the repo-owned workflow completes.

## Known Gaps

- No live prepared row has been read. A missing relation reports unavailable, not empty.
- A historical prepared snapshot does not prove its source authorities remain current and cannot be treated as an issued RFx or receipt.
- The frozen journey still requires a genuine signed sponsor commitment and named Scope reviews before later-stage acceptance.
