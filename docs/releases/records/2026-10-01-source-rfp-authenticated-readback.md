# Source RFP authenticated readback

## Release ID

`2026-10-01-source-rfp-authenticated-readback`

## Status

`candidate`

## Plain-English Summary

The event page can now render persisted RFP checklist facts when an authorized event has no active `clients` row in a separate lookup. It revalidates the exact event under the signed-in tenant before reading facts. An unrelated tenant cannot use this fallback.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema, fact, or approval write.
- Layer 4 Source: event-page projection only; no change to RFP decision semantics or release authority.

## Client Applicability

- All clients using the Source event canvas with an authenticated, tenant-bound event.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source analytics exposure; no new flag.

## Changes Included

- Reuse the page's authenticated tenancy context when its independent active-client-row lookup is unavailable.
- Revalidate the exact event with the existing tenant- and policy-scoped Source query before enabling fact-backed stage projection.
- Keep an unrelated or unreadable event on the fail-closed sample path.

## QA / Validation

- Red-first mounted route test reproduced an authorized event with a missing client-row lookup and persisted zero-decision checklist.
- Negative route test refused a tenant unable to read that event; removing exact-event validation caused the negative to fail.
- Two focused Source integration suites: 7/7 tests passed. A broader seeded-event pair reported 13 null-fixture failures; the same 13 cases failed on the prior untouched worktree, so they are not counted as this change passing.
- Typecheck with an 8 GB Node heap, scoped ESLint, `npm run release:check`, and `git diff --check` passed. The release check regenerated unrelated legacy-report metadata, which is excluded from this candidate.
- Signed-in readback remains required after the official main deployment.

## Rollout Plan

Squash merge through the repository PR. Only `.github/workflows/aca-main-deploy.yml` may update shared ACA traffic. No migration, data build, or feature-flag change applies.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Runtime proof: immutable web template digest, sole healthy 100%-traffic revision, and matching required worker images.
- Live signed-in proof: reload the same event RFP stage, observe persisted checklist completion and fact provenance, and confirm the separate approval gate remains locked until its other requirements are satisfied.

## Rollback Plan

Revert by PR and allow the repo-owned main workflow to deploy the revert. No schema or fact rollback is needed.

## Audit Evidence

Focused test output, PR/CI, official workflow, runtime readback, and private signed-in smoke ledger will be recorded separately.

## Known Gaps

This does not approve a commercial template, issue a package, contact suppliers, or bypass any gate criterion.
