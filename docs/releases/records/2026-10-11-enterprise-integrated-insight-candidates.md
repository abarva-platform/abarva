# Integrated Enterprise Insight Candidates

## Release ID

`2026-10-11-enterprise-integrated-insight-candidates`

## Status

`candidate`

## Plain-English Summary

Adds an operator-only candidate insight layer that derives reproducible findings from canonical
records and explicit relationships. It preserves source, object, relationship, measure and Cube
lineage without changing canonical facts or the record served by a product.

## Layer Impact

Release lane: `client-data-lane`. Reusable operator code is shared, but every schema/load operation
is separately scoped and does not change any product's serving state.

- Canonical model: read-only, explicitly tenant- and assessment-bound input.
- Product projections: additive derived candidate storage and a tenant-fenced candidate view.
- Governance: a dataset declaration with no load or serving approval; candidates cannot become
  agent-ready automatically.
- Operations: private ACA inventory, plan and exact-version apply jobs with proof artifacts.

## Client Applicability

- All clients: reusable code only; no automatic loading or rollout.
- Specific clients: a manifest-bound reference scope is declared for planning only.
- Internal only: candidate inventory, planning and review.
- Public/demo only: no new public surface.
- Feature flag: no existing product flag or active assessment is changed.

## Changes Included

- `src/lib/ecl/insights/` deterministic rules, canonical read and candidate store.
- `scripts/ecl/integrated_insights_job.ts` operator job.
- `20261011210000_enterprise_integrated_insight_candidates.sql` additive schema.
- Dataset declaration and operator runbook.

## QA / Validation

- PASS: 43 deterministic rule, source-boundary and approval tests.
- PASS: 51-test combined rule and disposable Postgres run, including real migration,
  persistence, independent readback, idempotency, composite FKs and RLS.
- PASS: six Jest foundation tests, TypeScript, lint and dataset manifest validation;
  declaration remains visibly unapproved.
- PASS: all 11 release-check gates and npm-script target reconciliation.
- NOT-RUN: private data-plane apply and signed-in serving proof; no loaded/live claim.

Local fixture evidence is not live data-plane proof.

## Rollout Plan

Merge a validated PR and build the approved image only through ACA main deploy. Apply the exact
additive migration through the governed private operator lane, then run inventory and planning.
Loading requires a human-recorded manifest approval bound to the exact candidate version and
count. Product serving and agent retrieval are intentionally not part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: no new web mutator; jobs use the shared operator wrapper.
- Approved image digest: captured from the approved main deploy before operator execution.
- ACA runtime invariant: required before any claim that code is deployed.
- Worker image invariant: existing ACA workflow invariant remains mandatory.
- ACR build policy: shared web builds only through the repo-owned main workflow; preserve Premium
  SKU, Buildx and GitHub Actions cache. No ad-hoc ACR build, push or traffic changes.
- Feature/env flag update path: none.
- Live signed-in proof required: before any future product-serving claim, not established here.

## Rollback Plan

No product pointer changes. Stop candidate jobs and retain existing releases for audit. Revert
code through a PR if needed. Do not delete candidate or canonical rows as part of rollback.

## Audit Evidence

PR/CI, disposable database tests, exact-version plan/apply proofs and operator idle restoration.
Tenant-specific results remain in private proof storage, not in this public release record.

## Known Gaps

Human load approval, private schema/readback proof, product-serving review and agent readiness
are not established by this code release. Unavailable or incompatible industry references abstain;
the release does not generate new external benchmarks or model-authored narrative.
