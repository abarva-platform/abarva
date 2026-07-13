# 2026-07-13-home-content-accuracy-dimensions — Home Content Accuracy Dimension Rollups

## Release ID

`2026-07-13-home-content-accuracy-dimensions`

## Status

`candidate`

## Plain-English Summary

Home Enterprise Knowledge now rolls each context area up from the correct source-browser dimensions instead of using a broad text heuristic that could accidentally clone tenant-wide totals across every area. The release also adds a deterministic all-tenant content accuracy report that checks Home by tenant, dimension, and tab.

## Layer Impact

- `global-control-lane`: Fixes the deterministic Home Summary Snapshot builder used by Home artifacts and UI-ready data.
- `internal-admin`: Adds a repeatable Home content-accuracy audit report for release proof and operator review.

## Client Applicability

- All clients: Applies to every active Home tenant snapshot generated from the governed source-browser dimensions.
- Specific clients: Airline Demo/SkyHarbor, Healthcare Demo/Meridian, Lakeshore Holdings, Financial Services Demo/First Capital, and Retail Demo/Apex are covered by the proof artifact.
- Internal only: The new `scripts/qa/home-content-accuracy-audit.ts` report is an operator proof artifact.
- Public/demo only: No public route change.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-summary-snapshot.ts`: replaces broad label regex matching with explicit context-area-to-source-dimension mapping and de-duplicates repeated preview views of the same source file.
- `src/lib/home/__tests__/home-summary-snapshot.test.ts`: adds a SkyHarbor regression test for dimension-specific rollups.
- `scripts/qa/home-content-accuracy-audit.ts`: adds deterministic all-tenant, all-dimension, all-tab Home content accuracy proof.
- `reports/home-content-accuracy/latest/`: generated proof bundle with JSON, Markdown, and HTML report.
- `reports/home-summary-snapshot/latest/`: regenerated Home Summary Snapshot artifacts.

## QA / Validation

- `npm run audit:home-summary-snapshot` — Pass.
- `npx tsx scripts/qa/home-content-accuracy-audit.ts` — Pass, `397 pass / 0 watch / 0 fail`.
- `npx jest src/lib/home/__tests__/home-summary-snapshot.test.ts --runInBand` — Pass, 5 tests.
- `npm run audit:enterprise-naming` — Pass.
- `npm run release:check` — Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Merge through the standard PR path. After merge, deploy through the repo-owned Azure Container Apps main workflow so the live Home runtime uses the corrected Home Summary Snapshot builder and regenerated artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the deploy workflow reports worker image checks.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, standard post-deploy crawl plus Home route check.

## Rollback Plan

Revert this release commit to restore the previous Home Summary Snapshot matching logic and remove the content-accuracy audit artifact. No tenant data, production data, candidates, or Active Tenant Access state is mutated by this release.

## Audit Evidence

- `reports/home-content-accuracy/latest/home-content-accuracy.md`
- `reports/home-content-accuracy/latest/home-content-accuracy.json`
- `reports/home-content-accuracy/latest/home-content-accuracy.html`
- Local validation commands listed above.

## Known Gaps

Relationships still show as `not_available_yet` where graph relationship projection has not been validated. This release makes that gap explicit; it does not create new relationship projection or promote candidate data.
