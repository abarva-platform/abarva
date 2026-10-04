# Source NDA Contact Storage Key

## Release ID

`2026-10-04-source-nda-contact-storage-key`

## Status

`candidate`

## Plain-English Summary

The approved lab contact intake identifies its tenant with the canonical registry key. Source supplier records use the declared application storage key for that same tenant. Map to that key at the database boundary so contacts join existing supplier identities without creating duplicate suppliers.

## Layer Impact

- Release lane: `client-data-lane`; synthetic lab operator only.
- Layer 1: no fixture or approval change.
- Layer 2: resolve the declared tenant alias before canonical contact database access.
- Layer 3: no rows change on deployment. A separately authorized operator apply can insert only the four hash-pinned fictional contact rows into the existing supplier partition.
- Layer 4: no product route or UI change.

## Client Applicability

- All clients: the deployed code includes the loader, but no client data changes on deployment.
- Specific clients: none.
- Internal/lab: only the declared synthetic tenant can invoke apply after the existing exact-hash authorization.
- Public/demo: no route or surface changes.
- Feature flag: none; the manual operator workflow is dry-run by default.

## Changes Included

- Resolve the canonical tenant identifier through the existing alias registry at the Source database boundary.
- Use its declared application key for the session tenant, supplier identity check, contact insert, and idempotent readback.
- Add a regression test that refuses a supplier row in the wrong storage partition.

## QA / Validation

- The behavior test failed red with `canonical_supplier_mismatch` when the fixture's canonical key was used for the supplier lookup, then passed using the declared app storage key.
- Mutating the key back to the canonical value reproduced the same failure; restoring the mapping returned the test to green.
- Focused tests also retain wrong-tenant, wrong-hash, identity mismatch, rollback and exact-replay checks.
- Node 24 typecheck, scoped lint, release check and diff check are required before PR merge.
- Runtime, data apply, database readback and signed-in acceptance are separate post-merge checks, not implied by local validation.

## Rollout Plan

Squash merge through a reviewed PR, then allow only the repo-owned ACA main workflow to deploy a digest-pinned image. After runtime proof, replay the existing exact-hash, named-person-authorized four-contact apply through the manual private operator workflow. Verify the committed contact IDs in a read-only query and replay the affected signed-in Source step. Do not run a supplier-registry import for this fix.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this PR.
- Approved image digest: verify after the official main deploy.
- Runtime invariant: web template, 100%-traffic revision and required workers must match the approved digest.
- Live proof: committed contact readback and signed-in Stage 04/05 replay are separate from deployment.

## Rollback Plan

Revert code through a PR and the same main deploy workflow. If the separately approved data job has already committed, handle those exact contact IDs through a separately authorized reconciliation; code rollback does not remove data.

## Audit Evidence

- Approved input and person remain in the existing dataset manifest; this release does not broaden the authorization.
- Failed first apply was transactional and read back zero contact rows. The next apply and readback must be recorded independently.

## Known Gaps

- No contact rows or event-specific contact approvals are established by this code release alone.
- The Stage 04 read model may not yet include the canonical contact table; verify after apply rather than assuming it does.
- No provider send, signature, executed NDA authority or NDA stage exit is claimed.
