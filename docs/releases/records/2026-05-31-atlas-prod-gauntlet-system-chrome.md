# 2026-05-31-atlas-prod-gauntlet-system-chrome — Atlas Gauntlet System Chrome Runner

## Release ID

`2026-05-31-atlas-prod-gauntlet-system-chrome`

## Status

`candidate`

## Plain-English Summary

Switches the Atlas production CXO gauntlet workflow from installing a Playwright-managed Chromium browser during every run to using the GitHub runner's system Chrome. The first manual workflow dispatch showed the install step could hang before the actual gauntlet began; this change makes the workflow use the same faster browser pattern as the existing post-deploy crawler.

## Layer Impact

- `global-control-lane`: improves reliability and startup time for the Atlas production QA workflow.
- Runtime product behavior: no customer-facing UI or API behavior changes.
- Data plane: no schema, migration, seed, or client data changes.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: the workflow still tests Apex Retail, Meridian Health, and SkyHarbor Air production sessions.
- Internal only: yes, this is an AbarVa operator QA workflow improvement.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/qa/atlas-prod-comprehensive-surface.ts`: honors `PLAYWRIGHT_CHROMIUM_CHANNEL` when launching Chromium.
- `.github/workflows/atlas-prod-comprehensive-surface.yml`: verifies system Chrome instead of running `npx playwright install chromium --with-deps`.
- `docs/releases/records/2026-05-31-atlas-prod-gauntlet-system-chrome.md`: release record.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Fail before fix: manual workflow dispatch `26727408955` remained in the Chromium install step and never reached the Atlas gauntlet.
- Pending after merge: manual workflow dispatch should be rerun to confirm the system-Chrome path starts the gauntlet.

## Rollout Plan

Merge to `main`. The next scheduled or manually dispatched `Atlas production CXO gauntlet` run uses system Chrome.

## Rollback Plan

Revert this PR to restore the Playwright-managed Chromium install step. No database rollback is required.

## Audit Evidence

- Canceled/hung manual workflow run: `26727408955`
- Follow-up workflow run URL once manually dispatched after merge.

## Known Gaps

The full gauntlet result is not produced by this patch itself; the workflow must be manually rerun after merge to confirm end-to-end production execution.
