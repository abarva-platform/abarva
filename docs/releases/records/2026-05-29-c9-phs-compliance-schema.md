# 2026-05-29-c9-phs-compliance-schema — C9 PHS Compliance Schema

## Release ID

`2026-05-29-c9-phs-compliance-schema`

## Status

`candidate`

## Plain-English Summary

This release adds tenant-level compliance metadata for future PHS pilot tracking.
The schema can represent BAA execution status/date, HIPAA risk assessment
status/date, compliance owner, notes, and an evidence pointer without claiming
that any agreement or assessment has already been completed.

## Layer Impact

- client-data-lane: extends deterministic tenant config metadata only.
- release-governance-lane: adds this release record and audit trail.
- runtime-app-lane: no route, Ask, retrieval, session-pool, observability, DB,
  migration, or RLS change.

## Client Applicability

- Specific clients: Meridian Health receives a healthcare-provider placeholder
  for future PHS compliance tracking.
- All clients: tenants without regulated healthcare posture receive default
  not-required compliance metadata through the helper.
- Internal only: yes, this is config/schema groundwork.
- Public/demo only: no user-facing copy changes.
- Feature flag: none.

## Changes Included

- Extends `src/config/tenants/CANONICAL_TENANTS.ts` with typed compliance
  metadata and helper defaults.
- Adds Meridian placeholder metadata with BAA status `not_started`, BAA
  execution date `null`, HIPAA risk assessment status `not_started`, and
  assessment date `null`.
- Adds focused tests guarding defaults and no false claims.

## QA / Validation

Validation performed:

```text
npx jest src/config/tenants/__tests__/tenant-compliance.test.ts
npx eslint --max-warnings=0 src/config/tenants/CANONICAL_TENANTS.ts src/config/tenants/__tests__/tenant-compliance.test.ts
npm run release:check -- --base origin/main --head HEAD
git diff --check
```

Results:

- Focused Jest: pass, 1 suite / 3 tests.
- Touched-file ESLint: pass.
- Release control gate: pass.
- Diff whitespace check: pass.

## Rollout Plan

Merge after PR checks pass. No Vercel production deploy, database migration, RLS
change, or feature flag is required.

## Rollback Plan

Revert the merge commit to remove the compliance metadata helpers, Meridian
placeholder, tests, and release record. There is no data rollback.

## Audit Evidence

- Schema/config:
  `src/config/tenants/CANONICAL_TENANTS.ts`
- Focused tests:
  `src/config/tenants/__tests__/tenant-compliance.test.ts`
- Release record:
  `docs/releases/records/2026-05-29-c9-phs-compliance-schema.md`

## Known Gaps

- No database table, migration, or RLS policy was added. If compliance state
  needs runtime editing, audit history, or tenant-admin workflows, that should
  be planned as a separate DB/schema slice.
