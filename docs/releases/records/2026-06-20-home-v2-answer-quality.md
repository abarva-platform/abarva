# 2026-06-20-home-v2-answer-quality — Home v2 Ask Answer Quality

## Release ID

`2026-06-20-home-v2-answer-quality`

## Status

`candidate`

## Plain-English Summary

This release improves the Home v2 ask bar so questions like "tell me about my Epic spend" answer from matching tenant evidence rows instead of only routing to a dimension and naming the backing CSV. The page still stays deterministic and tenant-bound, but the first response now provides the relevant row-level business facts and can include a second corroborating row from another Home section before showing the broader assessment.

## Layer Impact

- `global-control-lane`: changes the shared authenticated `/home` Home v2 browser experience for all clients.
- `client-data-lane`: no data migration; the answer layer reads the same existing tenant data packs already used by Home v2.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no.

## Changes Included

- Adds row-level `askFacts` to the Home v2 generated data script.
- Updates `public/home-v2/app.js` so ask responses choose the closest matching sourced rows across Home v2 sections before falling back to a dimension-level read.
- Weights entity-name hits above generic row-text hits so a query like "Epic spend" prefers the Epic budget and Epic vendor rows instead of another budget row that merely mentions spend.
- Adds a cost-intent tie-breaker so spend/cost questions prefer budget and vendor rows over application rows when the same entity appears in multiple sections.
- Adds regression coverage for Meridian Epic spend budget and vendor-contract evidence.

## QA / Validation

- Pass: `npx jest src/__tests__/integration/home/home-v2-all-client-binding.test.ts --runInBand`.
- Pass: `npx eslint public/home-v2/app.js src/lib/home-v2/data.ts src/__tests__/integration/home/home-v2-all-client-binding.test.ts` with existing standalone-frame warnings only.
- Pass: Home v2 asset reference audit; 16 font refs, 0 missing files.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npm run audit:control-plane-purity:check`.
- Partial: `npm run build` compiled successfully, then the TypeScript phase went idle and was stopped after the build process showed no CPU progress.
- Live finding before ranking correction: signed-in Meridian `/home` proved the first Epic budget row rendered, but the second corroborating row selected a generic spend match. This PR corrects that scorer.
- Live finding before cost-intent correction: signed-in Meridian `/home` then selected the Epic application row before the Epic vendor row. This PR corrects that cost-question tie-breaker.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the image. No data migration, DNS change, feature flag, or environment-variable rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: repo-owned deploy workflow only.
- Approved image digest: captured after deploy.
- ACA runtime invariant: template image, 100% traffic revision image, and active revision image must agree after deploy.
- Worker image invariant: main deploy should keep worker images aligned with the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian `/home` ask proof for "Epic spend" after deploy.

## Rollback Plan

Revert this PR and deploy the previous approved main image. Since no data migration is included, rollback is route/static-code only.

## Audit Evidence

- PR URL and merge commit.
- Focused Jest output.
- Focused ESLint output.
- Release gate output.
- Post-deploy ACA digest/revision evidence.
- Signed-in browser proof for Meridian Home v2 ask response.

## Known Gaps

The ask bar remains deterministic and row-backed; it is not a full LLM retrieval experience. Questions with no row-level match fall back to the dimension-level read.
