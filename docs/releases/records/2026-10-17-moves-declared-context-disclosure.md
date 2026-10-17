# Moves declared design identity and data disclosure

## Release ID

`2026-10-17-moves-declared-context-disclosure`

## Status

`candidate`

## Plain-English Summary

When a readiness read is unavailable, architecture options could fall back to vocabulary matching even though the Move declares its archetype. Options now retain the declared design identity independently of readiness. Readiness remains unavailable; this change does not turn missing evidence into a pass.

The synthetic-data notice now comes from the authenticated tenant's active input declarations. Unclassified, mixed, and non-synthetic packets do not receive a synthetic notice.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product projection only. Layer 1 declarations and canonical Move identity remain authoritative. Source owners provide inputs; adapters and canonical records are unchanged. Option selection and disclosure are deterministic; no generated facts are introduced. The product owns presentation, not source data.

## Client Applicability

All clients using the existing Moves step-page flags. The notice appears only for registry-declared synthetic tenants. No new flag, tenant exception, schema, data load, or access grant.

## Changes Included

- Read the Move's declared archetype through the existing declaration resolver before falling back to readiness or text-based option selection.
- Resolve the disclosure server-side from canonical tenancy and pass it to the Files, Record, P0/P1, and P2 step-page headers.
- Add regression checks for unavailable readiness and presence/absence of the synthetic notice.

## QA / Validation

- PASS: 492 tests across six option-assembly, phase-page, P4/P5 and tenant-declaration suites.
- PASS: TypeScript type checking and scoped ESLint.
- PASS: All 11 release-control gates, including the release record contract.
- NOT-RUN: signed-in live proof of this candidate; required after main deployment.

## Rollout Plan

Squash merge through a PR. The repo-owned main deploy builds and promotes the image. Recheck the declared option set and notice in a signed-in session, then run the existing Moves live walk.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: recorded by the main deploy run.
- ACA runtime invariant: template and 100%-traffic revision must match the approved digest.
- Worker image invariant: required delivery jobs must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: correct architecture options and declared disclosure.

## Rollback Plan

Revert the squash commit through a PR and redeploy through the main workflow. No database rollback is needed.

## Audit Evidence

PR, local test output, main deploy evidence and signed-in live walk.

## Known Gaps

A failing readiness source still reports unavailable. A declaration proves identity and data classification, not evidence completeness, implementation readiness, or value realization.
