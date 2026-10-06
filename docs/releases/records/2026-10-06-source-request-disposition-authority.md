# 2026-10-06-source-request-disposition-authority — Request-Level Decisions

## Release ID

`2026-10-06-source-request-disposition-authority`

## Status

`candidate`

## Plain-English Summary

Adds a durable, append-only authority for accepting, returning, merging or declining an imported sourcing request. This is separate from the existing decision about how imported fields map to categories and archetypes. A merge names a surviving request without deleting the original.

## Layer Impact

Release lane: `client-data-lane`. The request authority is a tenant-scoped canonical workflow record over immutable imported request versions. Source New may project it later, but this change does not make a Source UI or generated narrative the owner of supplier, commercial or contract facts.

## Client Applicability

All clients using the imported Source request authority after the separately approved migration is applied. Deployment of code alone inserts no rows and changes no request decisions.

## Changes Included

One additive migration for `source.intake_request_disposition` and a focused schema contract test. There is no product route or UI change in this slice.

## QA / Validation

The focused test failed before the migration existed and passes after it. A deliberate mutation allowing a request to name itself as merge survivor fails the test, then the correct guard is restored. A disposable local PostgreSQL cluster applied the existing intake migration followed by this candidate. It accepted all four dispositions and refused whitespace-only decline rationale, missing/self/cross-tenant merge survivors, survivor fields on a non-merge, and update/delete attempts. Typecheck, lint, release control and hosted CI are recorded separately in the PR when run.

## Rollout Plan

Review and squash-merge the authored migration. The repo-owned ACA main workflow is the only shared runtime deployment path. **Do not apply this migration to a shared database without separate exact-file authorization and pending-set preflight.** A later, separately reviewed route and operator surface must read and write this authority before any live workflow is called complete.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: record after official deployment
- ACA runtime invariant: verify web template and sole healthy 100%-traffic revision
- Worker image invariant: verify both required worker jobs match the web digest
- Feature/env flag update path: none
- Live signed-in proof required: yes, after the separately delivered operator path and authorized schema apply

## Rollback Plan

Before apply, revert the migration file through a PR. After apply, preserve any recorded decisions and use a reviewed forward migration; do not drop authority rows or silently rewrite them.

## Audit Evidence

Focused test and disposable PostgreSQL positive/negative run, PR and CI, official deploy run and immutable digest, separately authorized migration ledger/readback, then signed-in request-disposition acceptance.

## Known Gaps

The request route, read model, operator controls, shared migration apply and signed-in acceptance are outside this storage slice. No request disposition was recorded in a shared environment.
