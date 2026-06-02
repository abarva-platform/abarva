# 2026-06-02-control-plane-tenant-purity-ratchet — Control-Plane Tenant Purity Ratchet

## Release ID

`2026-06-02-control-plane-tenant-purity-ratchet`

## Status

`candidate`

## Plain-English Summary

This release tightens the control-plane tenant-purity guardrail so client names do not quietly spread through shared app code. It lowers the scanner baseline from 1,114 to 1,079 allowed references, restores the Northstar hard floor to zero, and documents the narrow places where tenant-tagged fixture or internal admin data is intentionally allowed.

## Layer Impact

`global-control-lane`: Strengthens a shared quality gate used across the app so future work cannot add new hardcoded tenant names without an explicit allowlist decision.

`internal-admin`: Keeps internal release-ledger and admin-governance paths covered by named allowlists where cross-tenant references are expected and audited.

## Client Applicability

- All clients: Benefit from stricter tenant-purity guardrails in shared control-plane code.
- Specific clients: Northstar Clinical Technologies now has a zero-reference hard floor in the scanner baseline.
- Internal only: Admin audit and governance pages remain intentionally allowlisted as internal cross-tenant surfaces.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- Updated `scripts/audit/control-plane-tenant-purity.mjs` allowlists and baseline.
- Updated `src/lib/__tests__/control-plane-tenant-purity.test.ts` to pin the same allowlist policy.
- Replaced remaining Northstar display-name literals in shared code with canonical client-registry lookups.
- Narrowed release-ledger sanitization literals behind internal audit allowlisting.

## QA / Validation

- `node scripts/audit/control-plane-tenant-purity.mjs --check` — passed.
- `npx jest src/lib/__tests__/control-plane-tenant-purity.test.ts --runInBand` — passed.
- Focused `npx eslint` over the changed scanner/test/runtime files — passed.
- `git diff --check` — passed.
- `npx tsc --noEmit --pretty false --incremental false` — blocked by pre-existing missing `@axe-core/playwright` types in `tests/accessibility/public-axe.spec.ts`; this release did not touch that test or package wiring.

## Rollout Plan

Merge to main. The tighter baseline becomes active through the existing tenant-purity scanner and release checks; no database migration, feature flag, or runtime rollout step is required.

## Rollback Plan

Revert the PR to restore the previous scanner baseline and literal handling. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2806
- Tenant-purity scanner output showing total references lowered from 1,114 to 1,079 and Northstar restored to zero.
- Focused Jest, ESLint, and whitespace validation logs from the PR branch.

## Known Gaps

Full-project TypeScript validation currently depends on resolving the existing `@axe-core/playwright` type gap in the accessibility test suite.
