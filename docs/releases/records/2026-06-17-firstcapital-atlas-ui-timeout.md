# 2026-06-17-firstcapital-atlas-ui-timeout - First Capital Atlas UI Timeout

## Release ID

`2026-06-17-firstcapital-atlas-ui-timeout`

## Status

`candidate`

## Plain-English Summary

The redesigned AI Control Tower Atlas pane was still aborting live Atlas answers after 18 seconds. First Capital's signed-in live Atlas API answers are returning in roughly 18-21 seconds, so the page showed a timeout even when the authenticated API returned a valid answer.

This release aligns the redesigned AI Control Tower page with the existing Atlas timeout contract: allow 45 seconds before showing the honest timeout copy.

## Layer Impact

`global-control-lane`: Updates shared AI Control Tower UI behavior for all tenants using the redesigned page.

`client-data-lane`: First Capital is the live proof case; no schema, seed, or data-plane mutation is included in this patch.

## Client Applicability

- All clients: Atlas pane timeout behavior improves on the redesigned AI Control Tower page.
- Specific clients: First Capital Financial was the live reproduced failure.
- Internal only: Not applicable.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `src/components/tower/AiControlTowerPage.tsx`: increases the Atlas fetch abort window from 18 seconds to 45 seconds and replaces terse timeout text with the existing honest Atlas timeout copy.
- `src/components/atlas/__tests__/atlas-timeout-contract.test.ts`: extends the timeout regression contract to cover the redesigned AI Control Tower page, not only `TowerIndexPage` and `AtlasRail`.

## QA / Validation

- PASS: Live signed-in First Capital API QA before this patch proved `/api/v1/atlas/ask` returns valid `x-atlas-mode: live` answers in 18-21 seconds for `anand.sundaram+firstcapital@thesundaram.com` with client `arcturus`.
- FAIL, root cause found: Live signed-in First Capital `/tower` UI timed out in the Atlas pane because `AiControlTowerPage.tsx` aborted at 18 seconds.
- PASS: Focused regression test will be run before merge.

## Rollout Plan

Merge to `main` and deploy through the normal app pipeline. No data load, migration, or operator action is required.

## Rollback Plan

Revert this UI timeout patch to restore the previous 18-second abort. Data-plane state and First Capital context remain unchanged.

## Audit Evidence

- Live API QA report: `/tmp/firstcapital-signed-in-qa-20260617/report.json`.
- Live UI timeout reproduction screenshot: `/tmp/firstcapital-signed-in-qa-20260617/tower-atlas-ui-answer.png`.
- Clerk user used: `anand.sundaram+firstcapital@thesundaram.com`.
- Active client used: `arcturus`.

## Context Ingestion Evidence

- Local artifact generated: No new client data artifact generated.
- Local parse/preflight passed: Not applicable.
- Product loader/API accepted upload: Not applicable.
- Azure Blob/object storage staged original files: Not applicable.
- Queue/private worker handoff happened: Not applicable.
- Parser extracted text/tables/facts with source citations: Not changed.
- Review/approval queue received evidence: Not changed.
- Context rows/facts/chunks committed to the client data plane: Already proven by First Capital refresh run `27703561448`.
- Embeddings/search index refreshed: Already proven by First Capital refresh run `27703561448`.
- Live signed-in retrieval or answer QA proved context is usable: API route proved usable; UI pane proof is pending deployment of this timeout fix.

## Known Gaps

After deployment, rerun the signed-in `/tower` pane test and confirm the answer renders in the Atlas pane without timeout text.
