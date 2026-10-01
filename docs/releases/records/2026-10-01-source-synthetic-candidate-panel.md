# 2026-10-01-source-synthetic-candidate-panel - Synthetic candidate coverage

## Release ID

`2026-10-01-source-synthetic-candidate-panel`

## Status

`candidate`

## Plain-English Summary

The governed synthetic candidate registry package now has five distinct managed-services candidate profiles for lab sourcing workflow testing. These are fictional research candidates, not supplier representations, quotes, invitations, or bids.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 canonical supplier identity receives additional rows only if the separate, approved operator import runs. Layer 4 Source continues to read and accept candidates through its existing workflow; no product behavior changes in this release.

## Client Applicability

- All clients: No.
- Specific clients: One named synthetic lab tenant through an explicitly approved import only.
- Internal only: Yes, for controlled workflow testing.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The synthetic candidate CSV adds three managed-services identities and differentiates all five managed-services profiles by delivery, geography, commercial posture, risk, assumptions, and exclusions. The dataset manifest declares canonical tenant scope and the approved operator job path. The package test asserts five eligible managed-services rows while retaining the five fail-closed negative controls.

## QA / Validation

- Red-first package test failed at 20 versus 23 eligible candidates before the data update.
- Focused Jest package suite: 3/3 passed after the update.
- Loader integration suite: fixture-count and fail-closed mutation assertions updated for the expanded package; CI rerun pending.
- Context/corpus manifest validator: passed.
- Package validator: passed with 28 rows, 23 eligible, 5 negative controls, and 5 managed-services candidates.
- Typecheck: passed on Node 24 with an 8 GB heap.
- Full release check, CI, operator dry-run, and signed-in readback: pending at candidate status.

## Rollout Plan

Merge through a reviewed PR. The repo-owned main ACA workflow builds the dataset into a digest-pinned image. A separate exact-hash dry-run must pass before a named-approval apply of the existing candidate-registry ACA operator job. No supplier contact or event acceptance occurs during the import.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from this release branch.
- Approved image digest: To be proven after main deploy.
- ACA runtime invariant: Web template, 100-percent revision, and worker images must match.
- Worker image invariant: Must match the deployed approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, candidate suggestions and subsequent event acceptance are separate checks.

## Rollback Plan

The data package can be reverted by a follow-up PR and redeploy before import. After an import, do not delete supplier identities or alter accepted-event records without a separately reviewed data correction plan; stop further selection and use the operator proof to identify exact inserted rows.

## Audit Evidence

The PR, package validator SHA-256 and coverage matrix, manifest validation, CI, ACA deploy run, operator dry-run/apply proof bundles, read-only canonical-row check, and signed-in Source readback form the evidence chain. Each must be recorded separately as completed.

## Known Gaps

Candidate registry presence does not imply qualification, NDA execution, invitation, bid, shortlist approval, or RFP stage exit. Those remain separate product actions.
