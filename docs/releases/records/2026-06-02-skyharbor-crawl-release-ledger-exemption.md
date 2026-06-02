# 2026-06-02-skyharbor-crawl-release-ledger-exemption - SkyHarbor Crawl Release Ledger Exemption

## Release ID

`2026-06-02-skyharbor-crawl-release-ledger-exemption`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor post-deploy crawl guard now ignores the release ledger page when scanning for the healthcare/Meridian terms from the June 2 QA report. The prior guard correctly expanded SkyHarbor coverage, but the production crawl failed because `/admin/releases` displayed the guard's own release record, which intentionally repeated those terms as audit evidence. Product surfaces remain guarded.

## Layer Impact

`qa-validation-lane`: Narrows the post-deploy crawl comparison rule so release-audit pages do not self-trigger tenant leakage findings.

`global-control-lane`: Shared release infrastructure only. No product runtime behavior, client data, schema, ingestion, or rendering data is changed.

## Client Applicability

- All clients: Indirectly, through a more precise production crawl.
- Specific clients: SkyHarbor Air crawl findings are affected.
- Internal only: Release operators and QA reviewers.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/crawl/baseline-compare.ts` skips tenant-specific forbidden-term checks on `admin-releases`.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` adds a regression test proving release-ledger audit text is not treated as product leakage.

## QA / Validation

- PASS: `npm ci`
- PASS: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- PASS: `npx eslint src/lib/crawl/baseline-compare.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The next post-deploy crawl will continue to test SkyHarbor product surfaces but will not fail because the release ledger repeats historical finding terms in audit records.

## Rollback Plan

Revert the PR to restore the broader guard. No runtime data or migration rollback is required.

## Audit Evidence

PR URL: https://github.com/anandsundaram-hash/abarva/pull/2827

CI run: To be added after CI completes.

Production crawl evidence: Run `26828522949` failed with 2 P0 findings on `skyharbor-cto__admin-releases` and `skyharbor-cio__admin-releases`; snippets showed the terms came from the guard release record, not SkyHarbor product content.

## Known Gaps

This release does not reload SkyHarbor datasets or clear any real product-surface findings. If the next crawl finds the same terms on Intelligence, Tower, Source, Moves, or other product surfaces, that remains a true P0/HOLD until the Azure-native SkyHarbor reload path clears it.
