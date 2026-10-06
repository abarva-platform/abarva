# 2026-09-08-source-strategy-temporal-gate - Evidence-Bound Strategy Dates

## Release ID

`2026-09-08-source-strategy-temporal-gate`

## Status

`candidate`

## Plain-English Summary

Source strategy and value drafts now fail their deterministic quality gate when they introduce an unsupported date, duration, external comparison, or internal artifact identifier. Strategy instructions also require calendar claims to remain open until a governed schedule supplies the derived dates.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Source narrative generation and its quality gate reject unsupported temporal and comparative claims before a draft can pass review.

## Client Applicability

- All clients: Yes, for generated Source strategy and value artifacts.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Compare generated calendar dates and durations with the bound event evidence.
- Reject unsupported typical-event comparisons and market-divergence generalizations.
- Reject leaked internal artifact identifiers in client-facing strategy and value drafts.
- Instruct the strategy author to leave derived calendar dates open until a deterministic schedule artifact provides them.

## QA / Validation

- Source quality-review and prompt-registry tests: 58 passed.
- ESLint for touched files: pass.
- `git diff --check`: pass.
- TypeScript no-emit validation: pass.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. Regenerate a controlled Source strategy artifact and verify that unsupported dates, durations, comparisons, and identifiers cannot pass the quality gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: captured after deployment
- ACA runtime invariant: template image, 100% traffic revision, and required workers must use the approved digest
- Worker image invariant: verify after deployment
- Feature/env flag update path: none
- Live signed-in proof required: Yes

## Rollback Plan

Revert the squash commit through a new PR and deploy the revert SHA. No schema or tenant-data rollback is required.

## Audit Evidence

- PR, merge SHA, and ACA deployment run
- Focused Jest, TypeScript, ESLint, and release-check output
- Controlled generation response showing the deterministic gate verdict
- Signed-in artifact readback

## Known Gaps

- This gate validates claim support. It does not calculate a sourcing calendar; a deterministic schedule artifact remains the owner of derived milestone dates.
