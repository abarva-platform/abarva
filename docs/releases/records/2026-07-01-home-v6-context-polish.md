# 2026-07-01-home-v6-context-polish — Home V6 Context Polish

## Release ID

`2026-07-01-home-v6-context-polish`

## Status

`candidate`

## Plain-English Summary

Home’s context browser is polished for demo use after the first V6 table release. The pinned aVa questions now teach users what Home is for, the V6 preview is labeled as a source preview, and missing V6 cells render as “Needs evidence” chips instead of raw missing-data phrases.

Follow-up polish also collapses repeated tenant openings in Home aVa synthesis, so a live model response such as “For Airline Demo, For Airline Demo,” is normalized before display.

Final visible-payload polish applies the same collapse after demo-safe tenant-name sanitization, which is the last boundary before Home aVa text reaches the browser.

## Layer Impact

- `global-control-lane`: Updates shared Home UI copy, preview styling, and V6 gap display behavior.
- `public/demo`: Improves the signed-in demo experience for Home by making context browsing and aVa prompts more executive-friendly.

## Client Applicability

- All clients: Applies to Home for every tenant using the shared Home surface.
- Specific clients: Validated locally against Industrial Demo and Airline Demo fixtures; production crawl required after ACA deploy.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`: updates pinned questions, V6 preview layout, and evidence-gap display styling.
- `src/lib/home/v6-context-browser.ts`: maps `data_thin:` cells to the user-facing label `Needs evidence`.
- `src/components/home/__tests__/HomeSurface.test.tsx`: adds regression coverage for improved pinned questions and V6 preview/gap rendering.
- `src/lib/home/know/home-v6-executive-synthesis.ts`: collapses repeated tenant-safe answer openings in Home aVa responses.
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`: adds regression coverage for duplicate tenant-opening normalization.
- `src/lib/home/know/home-demo-safe-response.ts`: collapses repeated tenant openings after final demo-safe visible-payload sanitization.
- `src/lib/home/know/__tests__/home-demo-safe-response.test.ts`: adds regression coverage for the final visible-payload boundary.

## QA / Validation

- `npx jest src/lib/home/__tests__/v6-context-browser.test.ts src/components/home/__tests__/HomeSurface.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx --runInBand` passed.
- `npx eslint src/lib/home/v6-context-browser.ts src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx` passed.
- Follow-up aVa polish: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed.
- Follow-up aVa polish: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts` passed.
- Final sanitizer polish: `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand` passed.
- Final sanitizer polish: `npx eslint src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts` passed.
- Pre-change production crawl confirmed all 19 Home dimensions render V6 rows, tables, and file chips for Industrial Demo and Airline Demo.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps lane, then rerun signed-in browser proof for Industrial Demo and Airline Demo. Post-deploy proof must cover all 19 dimensions per tenant and at least a small set of Home aVa questions.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / Azure Container Apps runbook.
- Shared runtime mutators: None beyond the web image.
- Approved image digest: To be captured during ACA deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must run the image built from the merged SHA with 100% traffic assigned to the healthy revision.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback to the prior healthy ACA web revision or revert this polish commit and redeploy. No schema, data-plane, or worker rollback is required.

## Audit Evidence

- Focused Jest and ESLint outputs.
- Release check output.
- Post-deploy 38-dimension browser crawl report.
- Post-deploy Home aVa question proof report.
- Signed-in screenshots for Industrial Demo and Airline Demo.

## Known Gaps

- Candidate only until ACA deploy and signed-in production proof are complete.
