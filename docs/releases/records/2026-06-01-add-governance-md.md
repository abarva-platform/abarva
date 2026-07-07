# 2026-06-01-add-governance-md — Add Governance Index

## Release ID

`2026-06-01-add-governance-md`

## Status

`candidate`

## Plain-English Summary

This change adds a root-level governance index so maintainers can find the source of truth for coding standards, AI tool instructions, code ownership, pull request expectations, architecture decisions, runbooks, and release records from one page.

## Layer Impact

Ops-release-lane documentation only. The change clarifies where governance standards live and does not change runtime behavior, product UI, data access, authentication, or infrastructure.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa maintainers and AI-assisted development workflows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `GOVERNANCE.md`
- `docs/releases/records/2026-06-01-add-governance-md.md`

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No runtime rollout, migration, feature flag, or manual data operation is required.

## Rollback Plan

Revert the documentation commit to remove the governance index and its release record.

## Audit Evidence

- Pull request for `codex/governance-index`
- Local validation commands listed above
- CI checks on the pull request

## Known Gaps

No runtime controls change in this PR; this is an index of governance files only.
