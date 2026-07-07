# 2026-07-07-home-cxo-visible-wording-sanitizer — Home CXO Visible Wording Cleanup

## Release ID

`2026-07-07-home-cxo-visible-wording-sanitizer`

## Status

`candidate`

## Plain-English Summary

Home now cleans two remaining CXO-visible wording defects found in the live Lakeshore quality audit: variant duplicate tenant openings and the phrase "implementation detail." The answer content is unchanged; the visible prose reads more like an executive context explanation.

## Layer Impact

- `global-control-lane`: visible Home KNOW response shaping for the shared `/home` context browser. No data schema, ingestion, auth, tenant-fence, model-provider, or routing changes.

## Client Applicability

- All clients: yes, for Home KNOW answers.
- Specific clients: validated against the Lakeshore live audit that showed "For Lakeshore Holdings Industries, For Lakeshore Holdings..." and "implementation detail" in visible answer prose.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/know/home-demo-safe-response.ts`: collapses variant duplicate opening phrases and rephrases "implementation detail" as "source trail and evidence ownership."
- `src/lib/home/know/__tests__/home-demo-safe-response.test.ts`: adds regression coverage for both live-audit patterns.

## QA / Validation

- Pass: `npx eslint src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts`.
- Pass: `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand` — 6 tests passed; existing duplicate manual mock warnings are unrelated repo baseline noise.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow will build and deploy the updated shared web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the main deploy workflow after merge.
- ACA runtime invariant: required after merge/deploy before claiming live.
- Worker image invariant: managed by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun the Lakeshore Home CXO quality audit after deploy.

## Rollback Plan

Revert the PR or redeploy the previous good `main` SHA through the approved ACA main deploy workflow.

## Audit Evidence

- Triggering live audit: `/Users/anand/Projects/nexus/proof/home-cxo-quality-live-sanitized-2026-07-07T14-32-32-504Z/quality-audit.json`.
- PR URL: https://github.com/abarva-platform/abarva/pull/4536
- Focused validation: `npx eslint src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts`; `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand`; `git diff --check`; `npm run release:check`.

## Known Gaps

This is visible wording cleanup only. It does not load the Lakeshore V7 pack or alter Home routing.
