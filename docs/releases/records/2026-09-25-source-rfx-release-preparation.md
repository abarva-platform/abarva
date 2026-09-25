# 2026-09-25 Source RFx Release Preparation

## Release ID

`2026-09-25-source-rfx-release-preparation`

## Status

`candidate`

## Plain-English Summary

Adds a canonical supplier-contact identity and an evidenced, event-specific approval to approach that person. It also defines an immutable, versioned snapshot of a prepared RFx package, including exact artifact bytes and named recipients. Preparation does not issue a package, contact a supplier, or record a receipt.

## Layer Impact

- Release lane: `client-data-lane` because this authors tenant-scoped schema and read contracts, without applying the migration or loading data.
- Layer 3: `source.vendor_contact` records declared supplier-contact identity with upstream source and evidence references.
- Control plane: event contact approvals and prepared package versions bind a tenant and event to canonical supplier identity, current artifact bytes, and NDA or waiver authority.
- Layer 4: no product route or view changes in this release.

## Client Applicability

- All clients: the schema is available after a separately approved migration apply; no rows are populated.
- Specific clients: none.
- Internal only: preparation and validation paths are not supplier-facing.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260925160000_source_event_rfx_release_authority.sql` authors the contact and prepared-package authority schema, tenant read policies, insertion checks, and immutability guards.
- The contact read repository and pure snapshot preparation helper fail closed on missing, mismatched, retired, or stale authority.
- Focused behavioral and storage-contract tests cover tenant/event identity, named contacts, artifact hashes, and the prepared-only state.

## QA / Validation

- Pass: focused repository, snapshot, and storage-contract tests.
- Pass: red-first storage tests before the package-version schema was added; removing the retired-contact predicate made the focused contract fail, and restoring it returned green.
- Pass: PR CI fresh PostgreSQL migration replay and full sequence against isolated PostgreSQL. This is test-database execution only, not a shared-tenant apply.
- Not run: shared-tenant migration apply. It requires a separate operator decision.
- Not run: positive signed-in Stage 06 release readback; there is no issuance route or populated recipient authority.

## Rollout Plan

Merge the code through a reviewed PR. The repo-owned ACA main workflow may deploy the code image, but the new schema remains unapplied and no tenant rows or supplier communications occur. A separate controlled migration review and apply is required before any source-backed prepared-package write can function.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: determined and checked after merge by the workflow.
- ACA runtime invariant: verify template, sole 100%-traffic revision, and required workers at the same digest.
- Worker image invariant: verify both required jobs independently.
- Feature/env flag update path: none.
- Live signed-in proof required: no positive Stage 06 claim from this preparatory release; the governed journey remains separately gated.

## Rollback Plan

Revert the application commit through a PR if the preparatory code regresses. No database rollback is needed before schema apply. After a separately approved apply, preserve immutable snapshot history and use a reviewed forward repair rather than dropping evidence tables or rewriting issued records.

## Audit Evidence

- Focused test logs and mutation result in the PR.
- PR review and CI, if opened; ACA runtime proof only after the repo-owned workflow completes.

## Known Gaps

- Schema passed isolated PostgreSQL replay; applying it to a shared tenant remains separately authorized work.
- No source-backed transaction creates a package version, no human issuance action exists, and no receipt or external delivery is represented.
- A genuine signed sponsor commitment and named Scope reviews remain prerequisites for the frozen journey; this release does not bypass them.
