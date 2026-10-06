# 2026-10-05 — Report unrouted Source archetypes

## Release ID

`2026-10-05-source-unrouted-archetype-report`

## Status

`candidate`

## Plain-English Summary

The synthetic supplier validator now reports registered sourcing archetypes that cannot be reached from a classifier category. It keeps routed supplier coverage and unrouted registration as separate measures rather than silently omitting the latter.

## Layer Impact

Release lane: `public-demo`. Layer 1 validation output gains an additive diagnostic. Layer 3 canonical supplier records and Layer 4 product behavior are unchanged.

## Client Applicability

Public/demo synthetic supplier fixture only. No real-client data or configuration is changed.

## Changes Included

Candidate-supplier package validator output and an owned unit-suite behavioral test. No category route, supplier identity, contact authority, or NDA state is added.

## QA / Validation

Pass: red-first unit test and a mutation that reinstated the old filter before counting registered archetypes. The mutation produced 10 instead of 11 and failed the test. Pass/fail status for focused tests, Node 24 typecheck, lint, release-check and hosted CI is recorded with the PR before merge.

## Rollout Plan

Merge through a PR. The repo-owned ACA main workflow may deploy the updated validator in the image; no data job runs automatically. A subsequent operator dry run can read the new diagnostic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: established after merge by the main workflow.
- ACA runtime invariant: verify separately before a deployed claim.
- Worker image invariant: verify separately before a deployed claim.
- Feature/env flag update path: none.
- Live signed-in proof required: no product UI change; a separate governed data load and replay would be required for product acceptance.

## Rollback Plan

Revert this additive diagnostic through a PR if it misreports registration. No canonical rows or migrations need rollback.

## Audit Evidence

PR checks, focused test output, and the validator dry-run summary showing the routed and unrouted counts.

## Known Gaps

The registered-but-unrouted archetype remains unavailable from classifier routing. This record does not select a new category mapping or assert supplier eligibility for it.
