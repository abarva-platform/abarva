# 2026-06-02-skyharbor-erase-reload-runbook - SkyHarbor Erase / Reload Runbook

## Release ID

`2026-06-02-skyharbor-erase-reload-runbook`

## Status

`candidate`

## Plain-English Summary

This release updates the SkyHarbor Azure private load runbook for the upcoming Azure-native erase/reload uploader process. The runbook now makes clear that operators must not hand-patch SkyHarbor data, must export evidence before erasing, must keep erases scoped to SkyHarbor-owned rows, must validate every upload dimension, and must run tenant-leak and CXO crawl checks before calling the reload complete.

## Layer Impact

`ops-release-lane`: Adds operational release discipline for the SkyHarbor data reload path, including evidence, hold, rollback, and crawl requirements.

`client-data-lane`: Documentation only. The runbook governs future SkyHarbor data-plane operations, but this PR does not change runtime code, database schema, migrations, seed data, or live data.

## Client Applicability

- All clients: No direct runtime or data impact.
- Specific clients: SkyHarbor Air operators and QA reviewers use this runbook.
- Internal only: AbarVa release, data-plane, and CXO crawl operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/skyharbor/AZURE_PRIVATE_LOAD_RUNBOOK.md` is updated to become the SkyHarbor Azure private erase/reload runbook.
- `docs/releases/records/2026-06-02-skyharbor-erase-reload-runbook.md` records the docs-only runbook release.

## QA / Validation

- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. No runtime rollout, Vercel deploy, migration, Azure data change, or uploader execution is included in this PR. Operators should use the updated runbook when the Azure-native uploader reload window is scheduled.

## Rollback Plan

Revert the PR to restore the previous shorter SkyHarbor load runbook. No data rollback, migration rollback, or runtime rollback is required because this release changes documentation only.

## Audit Evidence

PR URL: https://github.com/anandsundaram-hash/abarva/pull/2837

Validation evidence: local `git diff --check` and `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

This release does not implement the Azure-native uploader, execute an erase, reload SkyHarbor data, run production tenant-leak probes, or clear any current production crawl findings. Those actions remain gated by the runbook evidence and hold criteria.
