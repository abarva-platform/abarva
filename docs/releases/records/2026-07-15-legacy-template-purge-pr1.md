# 2026-07-15-legacy-template-purge-pr1 — Remove Legacy Tenant Templates From Loader-Visible Paths

## Release ID

`2026-07-15-legacy-template-purge-pr1`

## Status

`candidate`

## Plain-English Summary

This release removes old V-named tenant template/source packs from loader-visible repository paths and makes the universal tenant input standard v3 the only approved repo-resident tenant input/template standard. It also adds a guardrail audit so old V4/V5/V6/V7, current-state-pack, rich-pack, upgrade-candidate, staging, and old public workbook paths cannot quietly return as active inputs.

## Layer Impact

- `client-data-lane`: Removes legacy tracked source/template files and old loader commands that could be mistaken for current tenant inputs.
- `global-control-lane`: Adds `audit:no-legacy-tenant-inputs` and wires it into `release:check` so the repo rejects legacy tenant-input drift.
- `internal-admin`: Retires old public setup-template download links from the Admin Data Trust composer because tenant intake must use the universal v3 standard.

## Client Applicability

- All clients: Yes. This standard applies to every tenant input/load path.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings, Lakeshore Industries, Meridian Health, SkyHarbor Air, and future tenants.
- Internal only: The purge audit and proof bundle are internal/operator controls.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deleted legacy tracked input/template roots:
  - `datasets/tenant-inputs/archive`
  - `datasets/enterprise-intelligence-template-pack-v6`
  - `datasets/client-load-staging`
  - `datasets/lakeshore-kyriba-synthetic-v1`
  - `datasets/tenant-inputs/templates/universal/standard-2026-07`
  - `public/setup-templates`
  - old top-level public client workbooks under `public/templates/*.xlsx`
- Deleted legacy V6/V7 loader/generator scripts and package commands.
- Updated `datasets/tenant-inputs/tenant-input-registry.json` to point at `datasets/tenant-inputs/templates/universal/standard-2026-07-v3`.
- Copied neutral CSV schemas and quality-depth rules into the v3 template folder so the active CSV build path uses one approved template location.
- Added `scripts/audit/check-no-legacy-tenant-inputs.mjs`.
- Added `npm run audit:no-legacy-tenant-inputs`.
- Wired the purge audit into `npm run release:check`.
- Updated canonical tenant input docs and data-layer operating docs.
- Hardened `scripts/audit/architecture-rules.mjs` so large deletion PRs scan only changed code files instead of materializing the full repository patch.

## QA / Validation

- Pass: `npm run audit:no-legacy-tenant-inputs`
- Pass: `npm run audit:canonical-tenant-inputs`
- Pass: `npm run audit:tenant-input-quality`
- Pass: `git diff --check`
- Pass: `npm run audit:enterprise-knowledge-layer`
- Pass: `npm run audit:enterprise-knowledge-cache`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for `scripts/audit/canonical-tenant-inputs.ts`
- Pass: `npm run audit:architecture-rules -- --base=origin/main --head=HEAD`
- Pass: `npm run audit:architecture-rules:self-test`
- Not run: production browser crawl. This release does not change runtime behavior by itself.

## Rollout Plan

Merge through the standard PR path. No database migration, data build, Active Tenant Access promotion, feature flag change, or runtime rollout is required for the purge itself. If deployed, the ACA main workflow may package the removed files, updated docs, and audit script into the next runtime image, but no module behavior changes are expected.

## Deployment Authority

- Repo-owned deploy workflow: Required only if this is deployed as part of a normal main ACA release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable until merged/deployed by the ACA main workflow.
- ACA runtime invariant: Not required for repository-only purge proof; required if deployed.
- Worker image invariant: Not required.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for repository-only purge proof; no user-facing runtime route changes are intended.

## Rollback Plan

Revert this PR to restore the removed legacy files and scripts. Because no production tenant data is mutated and no Active Tenant Access Layer is updated, rollback is a code/repo revert only.

## Audit Evidence

- `reports/data-standard/legacy-purge/summary.md`
- `reports/data-standard/legacy-purge/summary.json`
- `reports/data-standard/legacy-purge/deleted-legacy-files.csv`
- `reports/data-standard/legacy-purge/remaining-allowed-legacy-references.csv`
- `reports/data-standard/legacy-purge/blocked-loader-paths.json`
- `reports/data-standard/legacy-purge/no-legacy-tenant-inputs-proof.html`
- `reports/canonical-tenant-inputs/latest/canonical-tenant-inputs.md`
- `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.md`

## Known Gaps

- Historical docs and generated reports may still mention old source names as historical audit evidence; the purge audit records those as allowed non-loader references.
- This release does not purge historical rows from production databases or Azure Blob archives.
- This release does not run a new canonical data build, candidate promotion, or Active Tenant Access update.
