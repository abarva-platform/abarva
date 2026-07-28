# 2026-07-28-airdn-passwordless-review-auth — Passwordless Entra review-DB bridge

## Release ID

`2026-07-28-airdn-passwordless-review-auth`

## Status

`candidate`

## Plain-English Summary

Delivers the passwordless (Microsoft Entra) database bridge so the Airline Demo
New review job reaches the lab PostgreSQL with a managed-identity token instead of
the PostgreSQL administrator password or a Key Vault credential read. Verified
read-only that the lab PG server currently has Entra auth DISABLED, so this is the
bridge to enable it: a least-privilege Entra-mapped review role (SELECT only on
candidate/evidence structures; no publication, baseline, or writes) plus the IaC
and apply plan.

## Layer Impact

Release lanes: **`internal-admin`** (airline-demo-new pilot lab operations).
No product-runtime or client-data change.

## Client Applicability

- Internal only (airline-demo-new pilot lab). No tenant activation.

## Changes Included

- `clients/airline-demo-new/22-passwordless-review-auth/001_review_role_entra.sql`
- `clients/airline-demo-new/22-passwordless-review-auth/README.md`

## QA / Validation

- Read-only verification of the lab PG server auth config (Entra Disabled today).
- Migration is delivered as code; applying it is a governed step (see README).

## Rollout Plan

Merge to `main`. Applying the bridge is a deliberate governed step: enable Entra
auth on the lab PG server (one decision — the Entra admin principal), apply
`001_review_role_entra.sql` as the Entra admin, then the review job uses the MI
token. Dry-run review-package generation writes nothing; applying review decisions
stays human-gated.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none from this change (SQL is unapplied code).
- Live signed-in proof required: n/a.

## Rollback Plan

Revert the PR (unapplied code). If already applied, drop the review role and
revert the server Entra-auth change per the README.

## Audit Evidence

- This record + the README + the SQL migration.

## Known Gaps

- Entra auth must be enabled on the lab PG server before the role migration can
  apply; the one input is the Entra admin principal.
