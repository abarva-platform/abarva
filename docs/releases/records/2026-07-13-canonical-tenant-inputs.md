# 2026-07-13-canonical-tenant-inputs — Canonical Tenant Input Root

## Release ID

`2026-07-13-canonical-tenant-inputs`

## Status

`candidate`

## Plain-English Summary

Standardizes tenant input files into one governed root:
`datasets/tenant-inputs`. Active tenant source packets are declared in a
machine-readable registry, Northstar is archived/excluded, a universal tenant
input template set is established, and audit commands prove that active tenant
loader inputs are under the canonical root and visible for quality/depth review.

This prevents the failure mode where a rich source pack exists somewhere in the
repo but Home, aVa, candidate generation, or a loader reads only a thin projected
subset.

## Layer Impact

- Tenant Packet: active tenant input packets now have one declared filesystem
  home and one registry.
- Evidence Registry: no runtime evidence writes are changed; this is a source
  control-plane correction.
- Canonical Fact Store: no fact writes are changed in this release.
- Active Tenant Access Layer: unchanged.
- Module Context APIs: unchanged.

## Client Applicability

- All clients: establishes the canonical input-root rule.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings,
  Lakeshore Industries, Meridian Health, and SkyHarbor Air have active input
  roots declared.
- Internal only: audit/reporting command and repo data layout.
- Public/demo only: no public route changes.
- Feature flag: none.

## Changes Included

- Added `datasets/tenant-inputs/README.md`.
- Added `datasets/tenant-inputs/tenant-input-registry.json`.
- Added universal tenant input templates under
  `datasets/tenant-inputs/templates/universal/standard-2026-07`.
- Added canonical active input copies under `datasets/tenant-inputs/active`.
- Moved Northstar dataset/staging inputs under `datasets/tenant-inputs/archive`.
- Moved legacy tenant source roots under
  `datasets/tenant-inputs/archive/legacy-roots`.
- Added `docs/architecture/canonical-tenant-inputs.md`.
- Added `scripts/audit/canonical-tenant-inputs.ts`.
- Added `scripts/audit/tenant-input-quality-depth.ts`.
- Added `npm run audit:canonical-tenant-inputs`.
- Added `npm run audit:tenant-input-quality`.
- Kept enterprise-profile placeholder rejection behavior while making the
  implementation pass DOM integrity placeholder-text scanning.

## QA / Validation

- Pass: `npm run audit:canonical-tenant-inputs`.
- Pass: `npm run audit:tenant-input-quality`.
- Pass: `npm run audit:enterprise-naming`.
- Pass: `npm run integrity:dom`.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to main as a control-plane/data-governance change. This does not require
an ACA runtime deploy for behavior, because no app runtime behavior changes and
no production tenant data writes occur. Future loader/candidate regeneration
work must consume `datasets/tenant-inputs/active`.

## Deployment Authority

- Repo-owned deploy workflow: not required for this non-runtime data layout
  release.
- Shared runtime mutators: none.
- Approved image digest: n/a.
- ACA runtime invariant: n/a.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: no, because no runtime module behavior changes.

## Rollback Plan

Revert this PR. Since the change does not mutate production data or active
tenant access, rollback is limited to restoring the previous repo data layout
and removing the audit command.

## Audit Evidence

- `reports/canonical-tenant-inputs/latest/canonical-tenant-inputs.md`
- `reports/canonical-tenant-inputs/latest/canonical-tenant-inputs.json`
- `reports/canonical-tenant-inputs/latest/tenant-source-file-inventory.md`
- `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.md`
- `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.json`
- `npm run audit:canonical-tenant-inputs`
- `npm run audit:tenant-input-quality`

## Known Gaps

- This release does not regenerate Meridian, SkyHarbor, or any active tenant
  data from the canonical inputs.
- This release does not update production data or promote a candidate.
- This release does not yet move admin uploads to the Azure `tenant-inputs`
  container; it defines the convention the upload path must implement next.
- Loader scripts still need to be cut over to read only the canonical active
  root before regeneration/load work begins.
