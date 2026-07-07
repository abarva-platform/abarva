# 2026-06-01-source-governance-enforcement — Source Gate Enforcement

## Release ID

`2026-06-01-source-governance-enforcement`

## Status

`candidate`

## Plain-English Summary

The Source event canvas now treats sourcing gates as enforceable controls instead of checklist toggles. A user cannot mark a gate met without a human reason, committed linked artifact content, and required evidence readiness. Stage promotion is limited to the next lifecycle stage and requires an explicit human reason. Empty artifact stubs can no longer be marked complete.

## Layer Impact

`global-control-lane`: Source gate and stage controls are shared workflow behavior for all clients. This release changes both browser controls and API enforcement so direct network calls cannot bypass the governance rules.

## Client Applicability

- All clients: Applies to Source events for every authenticated client.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No feature flag.

## Changes Included

- Added shared Source governance validation for approval reasons, linked artifact readiness, evidence readiness, and adjacent stage promotion.
- Updated Source gate criterion API to reject `met` transitions when approval reason, artifacts, or evidence are missing.
- Updated Source stage API to reject non-adjacent stage jumps and promotion with open required criteria.
- Updated Source artifact status API to reject completion of empty stubs.
- Updated Source canvas UI to require gate and promotion reasons and lock future stage rail navigation.
- Updated Source activity log synthesis to show persisted gate approvals with approver, timestamp, and reason.
- Added focused unit coverage for Source governance enforcement.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts --runInBand` — PASS, 28 tests.
- `npx tsc --noEmit --pretty false` — PASS.
- `git diff --check` — PASS.

## Rollout Plan

Merge to `main` after CI is green. The controls become active on the next Vercel deployment because this is runtime application code only; no database migration is included.

## Rollback Plan

Revert the release commit or roll back the Vercel deployment. No migration rollback is required.

## Audit Evidence

- PR diff for Source API routes, Source canvas components, and Source governance validator.
- Focused Jest output proving gate/stage negative and positive cases.
- TypeScript validation output.
- Post-deploy browser retest should repeat the Meridian/Apex L6 Source audit with specific focus on gate bypass, future-stage navigation, empty-stub completion, and visible approval log.

## Known Gaps

This release does not rotate Clerk keys and does not resolve reported RSC 503 prefetch behavior. It does not add a new durable activity table; gate approval audit visibility is derived from existing persisted gate criterion rows.
