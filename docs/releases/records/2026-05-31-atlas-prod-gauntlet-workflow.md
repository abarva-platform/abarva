# 2026-05-31-atlas-prod-gauntlet-workflow — Atlas Production CXO Gauntlet Workflow

## Release ID

`2026-05-31-atlas-prod-gauntlet-workflow`

## Status

`candidate`

## Plain-English Summary

Makes the comprehensive Atlas production CXO gauntlet a scheduled and manually runnable GitHub Actions workflow. The workflow runs the existing live-production harness across Apex Retail, Meridian Health, and SkyHarbor Air; captures the full HTML and raw JSON evidence; and fails when Atlas regresses on tenant isolation, fallback mode, four-section composition, plain-language answer quality, or clean login/logout.

## Layer Impact

- `global-control-lane`: adds a production QA workflow for Atlas answer quality and tenant-boundary verification.
- `internal-admin`: improves operator evidence by uploading the full gauntlet report as a GitHub Actions artifact.
- Runtime product behavior: no customer-facing UI or API behavior changes.
- Data plane: no schema, migration, seed, or client data changes.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: the workflow currently tests the three signature production tenants: Apex Retail, Meridian Health, and SkyHarbor Air.
- Internal only: yes, this is an AbarVa operator QA workflow.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/atlas-prod-comprehensive-surface.yml`: adds the scheduled/manual Atlas production CXO gauntlet workflow.
- `scripts/qa/atlas-prod-comprehensive-surface.ts`: allows the report directory to be set with `ATLAS_GAUNTLET_REPORT_DIR` for CI artifacts.
- `package.json`: removes the hardcoded production URL from `qa:atlas-prod-comprehensive` so the workflow input can select the target URL.
- `docs/releases/records/2026-05-31-atlas-prod-gauntlet-workflow.md`: release record.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass from prior harness execution: production gauntlet completed 168/168 Atlas turns across Apex Retail, Meridian Health, and SkyHarbor Air, with 0 fallback responses, 0 tenant leaks, 0 timeout/system-copy turns, 0 weak implementation-copy turns, and 3/3 clean login/logout sessions.
- Not run in this PR: the full live workflow execution, to avoid duplicating the already completed production gauntlet during workflow-wiring validation.

## Rollout Plan

Merge to `main`. The workflow becomes available in GitHub Actions as `Atlas production CXO gauntlet` and runs on the configured daily schedule. Operators can also run it manually with a selected production URL.

## Rollback Plan

Revert this PR to remove the workflow and restore the previous hardcoded npm script behavior. No database rollback is required.

## Audit Evidence

- GitHub Actions workflow artifact: `atlas-prod-comprehensive-surface`
- Report files in artifact: `index.html` and `raw.json`
- Prior live production report: `reports/2026-05-31-atlas-prod-comprehensive-surface/index.html`

## Known Gaps

The workflow depends on repository secret `CLERK_SECRET_KEY`. If that secret is missing or rotated without replacement, the workflow fails closed before running the gauntlet.
