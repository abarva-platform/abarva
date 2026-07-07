# 2026-07-02-home-v6-source-preview-scroll — Home V6 Source Preview And Scroll

## Release ID

`2026-07-02-home-v6-source-preview-scroll`

## Status

`candidate`

## Plain-English Summary

Home's V6 context detail view now scrolls inside the shared aVa workspace pane and shows source-backed loaded rows instead of leading with fields that only say "Needs evidence." The score label is now "Coverage" because the percentage measures answerability coverage, not certainty that every loaded field is complete.

## Layer Impact

- `global-control-lane`: Updates shared Home UI behavior and the V6 context-browser preview model.
- No database, ingestion, migration, or tenant data-plane change.

## Client Applicability

- All clients: Applies to tenants using the Home V6 context browser.
- Specific clients: SkyHarbor was the reported symptom tenant and is covered by the regression test.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`: Adds Home pane scrolling, preserves source lineage strings, relabels confidence to coverage, and updates preview copy.
- `src/lib/home/v6-context-browser.ts`: Prepends loaded-record/source-family/source-basis columns and ranks preview rows by available loaded evidence.
- `src/components/home/__tests__/HomeSurface.test.tsx`: Proves visible lineage, coverage wording, and source preview copy.
- `src/lib/home/__tests__/v6-context-browser.test.ts`: Proves source-aware columns and SkyHarbor financial rows show richer loaded facts first.

## QA / Validation

- `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand` passed.
- `npx jest src/lib/home/__tests__/v6-context-browser.test.ts --runInBand` passed.
- `npx eslint src/lib/home/v6-context-browser.ts src/components/home/HomeSurface.tsx src/lib/home/__tests__/v6-context-browser.test.ts src/components/home/__tests__/HomeSurface.test.tsx` passed.
- Jest emitted pre-existing duplicate manual mock warnings for markdown/GFM mocks; tests still completed and passed.

## Rollout Plan

Merge to `main`, build the exact commit into the approved Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, route 100% traffic to the healthy revision, then verify `https://app.abarva.ai/home` in a signed-in browser for SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None introduced.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the merged SHA image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Home right pane scroll and SkyHarbor V6 source preview visible in browser.

## Rollback Plan

Revert this PR and redeploy the previous healthy ACA image. No data rollback is required because this release changes only rendering and preview row selection.

## Audit Evidence

- PR URL: To be added when opened.
- Test evidence: focused Jest and ESLint outputs from this branch.
- Live evidence: Signed-in SkyHarbor browser screenshot after deployment.

## Known Gaps

Live browser proof is pending deployment.
