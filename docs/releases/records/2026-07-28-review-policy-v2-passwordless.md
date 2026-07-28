# 2026-07-28-review-policy-v2-passwordless — Review policy v2 + passwordless review auth

## Release ID

`2026-07-28-review-policy-v2-passwordless`

## Status

`candidate`

## Plain-English Summary

Refines the knowledge review-decision policy (v2) so it stops sending 100% of
candidates to individual review, and delivers the passwordless (Entra) database
bridge for the Airline review job. The prior v1 policy matched marker patterns
against the entire raw candidate row, so field names (notably every
relationship's `current_target_state`) tripped the KPI/target reasons and
collapsed everything to individual review. v2 matches semantic content only,
separates deterministic source-derived candidates (auto/batch) from
judgment-dependent ones (individual), adds explicit evidence inheritance for
entities, and splits batches across the governed review dimensions. Governance is
not weakened. Also adds the least-privilege managed-identity DB role + IaC plan so
the review job never uses the PostgreSQL admin password.

## Layer Impact

Release lanes: **`experimental`** and **`internal-admin`**. Not
`global-control-lane`, `client-data-lane`, or `public-demo`.

- **Governed pipeline (layer 2/3 tooling):** the review-classification policy that
  governs candidate → decision routing (dry-run only; writes no decisions).
- No product-runtime read-path change. No schema/migration applied by this change
  (the Entra role migration is delivered as code; applying it is a governed step).

## Client Applicability

- Internal only (airline-demo-new pilot lab). No tenant activation, no client-facing
  change.

## Changes Included

- `scripts/knowledge/processing/review-decision-policy.mjs` — v2 classifier +
  batch dimensions + evidence inheritance + reason/dimension distributions.
- `scripts/knowledge/__tests__/run-review-decision-policy-v2-tests.mjs` (+ package
  script `test:review-policy-v2`); updated executor test reason vocabulary.
- `clients/airline-demo-new/22-passwordless-review-auth/001_review_role_entra.sql`
  — least-privilege Entra-mapped review role (SELECT only; no publication/baseline).
- `clients/airline-demo-new/22-passwordless-review-auth/README.md` — IaC + apply
  plan for enabling Entra auth and the MI token bridge (no admin password, no KV
  secret-read for DB credentials).

## QA / Validation

- 13 v2 policy tests + full knowledge-process-executor suite green (governance
  invariants preserved: dry-run proposes no accepts; evidence-less entities never
  auto-accept; approved-batch/hash/reviewer guards intact).
- ESLint 0 problems.

## Rollout Plan

Squash-merge to `main` (builds the v2 image on ACR). Regenerating the Airline
review dry-run package is a governed step: enable Entra auth on the lab PG server
(IaC, one admin-principal decision), apply `001_review_role_entra.sql` as the
Entra admin, then run the review job with the v2 image using the MI token. Dry-run
only; no decisions written. Applying review decisions remains human-gated (step D).

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none from this change.
- Feature/env flag update path: `home_knowledge_vnext` stays OFF.
- Live signed-in proof required: n/a (no tenant activation).

## Rollback Plan

Revert the PR. The policy change affects dry-run classification only; the Entra
role migration is unapplied code. No data/runtime rollback needed.

## Audit Evidence

- This record; `clients/airline-demo-new/22-passwordless-review-auth/README.md`;
  policy tests.

## Known Gaps

- Passwordless bridge is currently BLOCKED: Entra auth is Disabled on the lab PG
  server. Enabling it needs one decision (the Entra admin principal) and a
  deliberate IaC apply, after which `001_review_role_entra.sql` and the regenerated
  v2 dry-run package can run.
- The revised package (counts/samples/hashes) is produced by that governed run;
  the policy logic that shapes it is complete and tested here.
