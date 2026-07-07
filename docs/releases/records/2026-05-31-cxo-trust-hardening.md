# 2026-05-31-cxo-trust-hardening — CXO Trust Hardening

## Release ID

`2026-05-31-cxo-trust-hardening`

## Status

`candidate`

## Plain-English Summary

This release tightens the visible CXO experience after production screenshots showed three trust breaks: machine-readable signal IDs in answers, timeout copy that sounded like a system failure, and customer-admin surfaces that could fall into a generic error state. The update makes Atlas/Tower copy more understandable, keeps raw signal IDs out of shaped answers, and ensures Customer Admin does not load tenant admin panels until access is proven.

## Layer Impact

- `global-control-lane`: Shared Atlas/Tower response hygiene and shared AgentDock language.
- `internal-admin`: Customer Admin page-view safety for tenant-admin-only panels.
- Runtime behavior: Atlas timeout fallback text and AgentDock suggestion labels change for all surfaces that use the shared dock.

## Client Applicability

- All clients: Atlas/Tower answer shaping and AgentDock label changes.
- Specific clients: Customer Admin safety applies to every tenant using `/admin/customer`.
- Internal only: Customer Admin is a tenant-admin/internal setup surface.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`
- `src/components/atlas/AtlasRail.tsx`
- `src/components/tower/TowerIndexPage.tsx`
- `src/lib/agent/response-shape.ts`
- `src/lib/admin/customer-admin-read-model.ts`
- Regression tests for response shaping, Atlas timeout copy, Source/AgentDock rendering, and Customer Admin tenant-panel safety.

## QA / Validation

- Pass: targeted Jest tests for Customer Admin safety, AgentDock label rendering, Atlas timeout copy, and Tower response-shape ID scrubbing.
- Pass: `npx jest src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts src/lib/admin/__tests__/customer-admin-read-model.test.ts src/lib/agent/__tests__/response-shape.test.ts src/components/atlas/__tests__/atlas-timeout-contract.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand` (73 tests passed).
- Pass: `npm run test:behaviors` (90 tests passed).
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pending: CI will run on PR.

## Rollout Plan

Merge to main and deploy through the normal Vercel production flow. No migration or feature flag is required.

## Rollback Plan

Revert this PR. The rollback restores previous copy and Customer Admin read-model behavior; no database state is changed.

## Audit Evidence

- PR URL and CI run once opened.
- Jest output for targeted tests.
- Release record in this file.

## Known Gaps

This release hardens the visible trust breaks. It does not replace the broader three-tenant live login/logout E2E campaign; that should run next as the validation wave.
