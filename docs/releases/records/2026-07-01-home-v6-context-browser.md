# 2026-07-01-home-v6-context-browser — Home V6 Context Browser

## Release ID

`2026-07-01-home-v6-context-browser`

## Status

`candidate`

## Plain-English Summary

Home now treats the right-side context area as a real context browser instead of a summary-only dashboard. When a user selects a loaded context dimension, Home can show a simplified preview of the underlying V6 records, including source file names, row counts, data-thin gaps, and representative rows. Home answers also avoid showing the same table twice when Claude already included a table in the visible answer.

## Layer Impact

- `global-control-lane`: Updates shared Home UI behavior and server-side V6 preview assembly for all clients with generated V6 template files.
- `public/demo`: Improves demo clarity by showing what was actually loaded for a tenant instead of abstract “signals” language.

## Client Applicability

- All clients: Applies to Home when the tenant maps to generated V6 template files.
- Specific clients: Validated against Industrial Demo / Lakeshore and Airline Demo / SkyHarbor local V6 files.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/home/v6-context-browser.ts`: adds the V6 context-browser assembler for Home dimensions.
- `src/app/(maestro)/home/page.tsx`: passes the V6 browser packet into Home.
- `src/components/home/HomeSurface.tsx`: renders selected-dimension V6 table previews, source file chips, and data-thin gap chips.
- `src/components/home/know/HomeKnowAnswerRenderer.tsx`: de-duplicates structured tables when the visible answer already contains the same Markdown table.
- Focused tests for V6 preview assembly, Home dimension rendering, and answer table de-duplication.

## QA / Validation

- `npx jest src/lib/home/__tests__/v6-context-browser.test.ts src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx --runInBand` passed.
- `npx eslint src/lib/home/v6-context-browser.ts src/app/'(maestro)'/home/page.tsx src/components/home/HomeSurface.tsx src/lib/home/__tests__/v6-context-browser.test.ts src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/HomeKnowAnswerRenderer.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx` passed.
- V6 coverage probe confirmed 19/19 Home dimensions have preview rows for Industrial Demo and Airline Demo local V6 generated files.
- Full TypeScript check was attempted with increased heap. It reported pre-existing missing dependency/type issues outside this change; no errors were reported for touched Home/V6 files.
- Local signed-in browser proof was attempted but blocked by local Azure/Postgres tenant lookup and Responsible AI acknowledgment ledger connectivity, so production proof is still required after ACA deploy.

## Rollout Plan

Merge to `main`, build and deploy the exact git SHA through the approved Azure Container Apps lane, then verify `https://app.abarva.ai/home` signed in for Industrial Demo and Airline Demo. Confirm the selected Home dimension renders V6 row previews and that duplicate answer tables do not appear.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / Azure Container Apps runbook.
- Shared runtime mutators: None beyond the web image.
- Approved image digest: To be captured during ACA deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must run the image built from the merged SHA with 100% traffic assigned to the healthy revision.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback to the prior healthy ACA web revision or revert the Home V6 context-browser commit and redeploy through the approved ACA lane. No schema migration or data rollback is required.

## Audit Evidence

- Focused Jest output.
- Focused ESLint output.
- V6 coverage probe output for Industrial Demo and Airline Demo.
- Post-deploy ACA revision/digest evidence and signed-in Home screenshots must be added before marking released.

## Known Gaps

- Not production-proven yet.
- Local signed-in proof was blocked by Azure/Postgres and acknowledgment ledger connectivity from the developer workstation.
