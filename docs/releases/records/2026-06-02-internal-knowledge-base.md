# 2026-06-02-internal-knowledge-base - Internal Knowledge Base

## Release ID

`2026-06-02-internal-knowledge-base`

## Status

`candidate`

## Plain-English Summary

Added an in-repo internal knowledge-base home so operators, engineers, founder
staff, sales engineering, and security reviewers can find standards, runbooks,
ADRs, release records, customer/pilot material, and architecture decisions from
one place. This fulfills the operational-readiness preference for a repo-based
wiki instead of scattering source-of-truth material across untracked documents.

## Layer Impact

Release lane: `internal-admin`. Adds documentation navigation and ownership
rules for internal operations. No runtime application behavior, product UI,
data layer, authentication, migrations, or cloud infrastructure changed.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: None.
- Internal only: AbarVa team members and reviewers using in-repo operational
  documentation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/internal/README.md`.
- Added this release record.

## QA / Validation

- Passed: Verified existing referenced local paths before writing the index.
- Passed: `git diff --check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`.
- Not run: Runtime tests, because this is a documentation-only change with no
  application code, migrations, model calls, or infrastructure changes.

## Rollout Plan

Merge to `main`. No Vercel production deploy, Azure deploy, migration, feature
flag, or runtime activation is required.

## Rollback Plan

Revert the documentation PR if the internal knowledge-base structure needs to
be withdrawn or materially rewritten. No runtime rollback is required.

## Audit Evidence

- Internal knowledge-base index: `docs/internal/README.md`
- Release record:
  `docs/releases/records/2026-06-02-internal-knowledge-base.md`
- Local validation commands listed in this record.

## Known Gaps

This release creates an in-repo index only. It does not create a Notion
workspace, change repository permissions, or replace the pilot readiness
tracker workbook.
