# 2026-06-03-ofac-screening — Customer OFAC Screening Foundation

## Release ID

`2026-06-03-ofac-screening`

## Status

`candidate`

## Plain-English Summary

Adds a customer sanctions-screening foundation for operational readiness. New
customers must be screened against OFAC sanctions data before onboarding.
Possible matches fail closed until manual compliance review records a
disposition.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: operational readiness, compliance posture, and customer
  onboarding governance.
- Runtime impact: deterministic evaluator and compliance posture only; no live
  OFAC API, database writes, or onboarding workflow changes.

## Client Applicability

- All clients: future customer onboarding uses this control.
- Specific clients: none.
- Internal only: compliance posture and screening model.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/compliance/ofac-screening.ts`
- `src/lib/compliance/__tests__/ofac-screening.test.ts`
- `src/lib/admin/compliance-config.ts`
- `src/lib/admin/broker/compliance-posture-broker.ts`
- `src/lib/admin/broker/__tests__/compliance-posture-broker.test.ts`
- `src/components/admin/CompliancePostureGrid.tsx`
- `src/components/admin/__tests__/CompliancePostureGrid.test.tsx`
- `scripts/compliance/verify-ofac-screening.mjs`
- `docs/runbooks/ofac-screening.md`
- `docs/build/OFAC_SCREENING_2026-06-03.md`

## QA / Validation

- Pass: `node scripts/compliance/verify-ofac-screening.mjs`
- Pass: `npx jest src/lib/compliance/__tests__/ofac-screening.test.ts src/lib/admin/broker/__tests__/compliance-posture-broker.test.ts src/components/admin/__tests__/CompliancePostureGrid.test.tsx --runInBand`
- Pass: focused ESLint for evaluator, tests, verifier, config, broker, and
  compliance UI grid.
- Blocked: `npx tsc --noEmit --pretty false` stops on pre-existing
  `tests/accessibility/public-axe.spec.ts` missing `@axe-core/playwright`
  types in this local worktree; PR CI typecheck is the authoritative gate for
  this branch.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked/not run: live OFAC API integration or manual screening evidence store
  remains future operational work.

## Rollout Plan

Merge to `main`. The compliance posture and deterministic evaluator become the
foundation for a live customer-onboarding screening workflow.

## Rollback Plan

Revert this PR. No data rollback is required.

## Audit Evidence

- This release record.
- Build manifest.
- Unit test output.
- Verifier output.
- Pull request and CI checks.

## Known Gaps

T121 remains `In progress` until a live screening workflow or approved manual
process stores the screening evidence for new customers.
