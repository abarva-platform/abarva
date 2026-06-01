# 2026-06-01-pilot-private-data-plane-runbook — Pilot Private Data Plane Runbook Authority

## Release ID

`2026-06-01-pilot-private-data-plane-runbook`

## Status

`candidate`

## Plain-English Summary

Adds the next governed mini-wave for the pilot private data plane. The release
locks the Azure provisioning sequence, SSO/SCIM role model, private-data
rehearsal stages, and processing-service decisions for rows T353-T356. It does
not create Azure resources or change customer data; it creates a tested
authority model and operator runbook so implementation can proceed without
guessing.

## Layer Impact

- `client-data-lane`: Defines the private data-plane environment, role model,
  and processing-service boundaries needed before live pilot data loads.
- `internal-admin`: Adds admin-owned runbook authority used by Setup/Data Loads
  planning and future implementation.
- `global-control-lane`: No runtime behavior changes; shared docs and tests
  become governance evidence.

## Client Applicability

- All clients: Applies to any future pilot private data-plane lane.
- Specific clients: Apex Retail, Meridian, SkyHarbor, and First Capital are not
  changed by this release.
- Internal only: Yes. This is an implementation authority/runbook slice.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/pilot-private-data-plane-runbook.ts` adds deterministic
  authority data for T353-T356.
- `src/lib/admin/__tests__/pilot-private-data-plane-runbook.test.ts` locks the
  required provisioning layers, SSO roles, rehearsal stages, and service
  decisions.
- `docs/architecture/azure/PILOT-PRIVATE-DATA-PLANE-REHEARSAL-RUNBOOK-2026-06-01.md`
  documents the operator runbook.
- `docs/build/PILOT_PRIVATE_DATA_PLANE_FULL_SCOPE_BACKLOG_2026-06-01.md`
  now points T353-T356 to the new authority artifacts.

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/pilot-private-data-plane-runbook.test.ts --runInBand`
- PASS: `npx eslint src/lib/admin/pilot-private-data-plane-runbook.ts src/lib/admin/__tests__/pilot-private-data-plane-runbook.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after green CI. No runtime deploy dependency, migration, Azure
resource creation, or feature flag is required. The runbook becomes the
authority for the next implementation slices T357-T368.

## Rollback Plan

Revert the PR. Rollback removes only the authority model, tests, and runbook
docs; no runtime data or infrastructure rollback is required.

## Audit Evidence

- PR URL and CI run once opened.
- Local Jest, ESLint, diff, and release-check output.
- Source files listed in Changes Included.

## Known Gaps

This release does not implement the durable ingestion schema, idempotency,
template version persistence, rollback/unload, malware scanning implementation,
encryption/key policy execution, retention/deletion policy, audit export UI/API,
observability/cost alerts, tenant isolation test pack, legal/data-use policy, or
end-to-end pilot smoke. Those remain T357-T368 execution items.
