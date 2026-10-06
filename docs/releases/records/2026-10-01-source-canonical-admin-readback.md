# Source canonical-admin event readback

## Release ID

`2026-10-01-source-canonical-admin-readback`

## Status

`candidate`

## Plain-English Summary

The Source event canvas can project persisted facts for an authorized canonical admin whose client-row lookup is unavailable. It rechecks the exact persisted event and its tenant alias before enabling live reads. Other users and unrelated events remain on the fail-closed sample path.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema, fact or approval write.
- Layer 4 Source: event-page read projection and authorized query only.

## Client Applicability

- All clients using the Source event canvas where a rostered canonical admin is allowed to read a persisted event but has no active client row.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source canvas exposure; no new flag.

## Changes Included

- Resolve a read client through the existing canonical-admin roster only when the ordinary active-client and tenancy contexts are unavailable.
- Require an exact persisted event ID and a matching tenant alias before any fact projection.
- Keep seed-only, unrostered and unrelated-tenant reads unavailable.

## QA / Validation

- Red-first mounted page and query tests reproduced the missing-client-row case and failed before implementation.
- Negative tests cover a foreign adapter row, an unrostered user, a seed-only event and a mismatched event ID.
- Removing the tenant-alias check caused the foreign-row test to fail; removing the page's exact-event check caused its mismatch test to fail. Both guards were restored.
- Two focused suites passed 28 tests after restoration. Typecheck with an 8 GB Node heap, scoped ESLint and release check passed. Diff check is required before PR.
- Official deployment, immutable runtime proof and signed-in readback are still required; no live acceptance is claimed here.

## Rollout Plan

Squash merge through the repository PR after applicable checks and review. Only `.github/workflows/aca-main-deploy.yml` may update shared ACA traffic. No migration, data build or feature-flag change applies.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Runtime proof: immutable web template digest, sole healthy 100%-traffic revision, and matching required worker images.
- Live signed-in proof: reload the exact persisted event, observe the fact-backed checklist, and confirm that independent legal and artifact requirements still block stage approval.

## Rollback Plan

Revert by PR and allow the repo-owned main workflow to deploy the revert. No schema or fact rollback is needed.

## Audit Evidence

Focused test output, PR/CI, official workflow, runtime readback, and private signed-in smoke ledger will be recorded separately.

## Known Gaps

This change does not approve a commercial template, accept an artifact, issue a package, contact a supplier or bypass a gate criterion.
