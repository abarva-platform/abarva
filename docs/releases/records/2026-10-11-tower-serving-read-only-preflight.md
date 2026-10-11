# 2026-10-11 Tower serving read-only preflight

## Release ID

`2026-10-11-tower-serving-read-only-preflight`

## Status

`candidate`

## Plain-English Summary

Adds one operator command that checks which Tower serving migrations are recorded, whether the four row functions enforce the active generation and page filters, and how many rows each Tower page can read. It blocks on rows from an inactive generation or a mismatch between active AI page rows and the matching serving view. A valid selector fallback is reported as a warning. It reports gaps without changing data. Identifiers are replaced with labels so operator output does not expose client or assessment names.

## Layer Impact

Release lane: `internal-admin`. Layer 4 operations only. The command reads the Tower projection and serving views. It changes no source intake, adapters, canonical records, projections, migrations, or product screens.

## Client Applicability

- All clients: Available to operators for any tenant represented in the database being inspected.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ops/probe-tower-serving-preflight.mjs`
- `scripts/ops/__tests__/run-tower-serving-preflight-tests.mjs`
- `package.json` command entries.

## QA / Validation

- `npm run test:tower-serving-preflight`: passed with synthetic in-process database responses, including missing migration, omitted page filter, lifecycle fallback, inactive view rows, AI page count mismatch, nine views, and identifier redaction.
- `node --check scripts/ops/probe-tower-serving-preflight.mjs`: passed.
- No private database or Azure execution in this candidate.

## Rollout Plan

Merge through a PR. The operator command becomes available in the next main image. Run it through the private ACA operator job with a read-only database credential as a separate, approved operational step. This release does not apply migrations or reload data.

## Deployment Authority

- Repo-owned deploy workflow: Main ACA workflow only.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Resolve from the deployed main release at operation time.
- ACA runtime invariant: Existing main deploy workflow verifies it.
- Worker image invariant: Use the approved digest for any future operator run.
- Feature/env flag update path: None.
- Live signed-in proof required: Only for a later data or product change, not this offline diagnostic command.

## Rollback Plan

Revert the script and package command in a PR. No data rollback is needed.

## Audit Evidence

PR diff and local test result. A future private operator run should retain its own output and proof bundle outside the public repository.

## Known Gaps

Live migration and row states remain unverified until the command is run in the private data plane.
