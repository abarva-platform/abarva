# 2026-07-07-home-visible-markdown-sanitizer — Home Visible Markdown Cleanup

## Release ID

`2026-07-07-home-visible-markdown-sanitizer`

## Status

`candidate`

## Plain-English Summary

Home now strips raw markdown emphasis and heading markers from user-visible KNOW answer payloads before display. This keeps CXO-facing answers readable when Claude returns bullets like `**What this means:**` while preserving the underlying answer content and traceability.

## Layer Impact

- `global-control-lane`: visible Home KNOW response shaping for the shared `/home` context browser. No data schema, ingestion, auth, tenant-fence, or model-provider changes.

## Client Applicability

- All clients: yes, for Home KNOW answers.
- Specific clients: validated against the Lakeshore live audit that found literal markdown in six of twelve answers.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/know/home-demo-safe-response.ts`: extends the existing visible payload sanitizer to remove markdown emphasis and heading markers from non-technical visible strings.
- `src/lib/home/know/__tests__/home-demo-safe-response.test.ts`: adds regression coverage for the live `- **What this means:**` pattern.

## QA / Validation

- Pass: `npx eslint src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts`.
- Pass: `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand` — 4 tests passed; existing duplicate manual mock warnings are unrelated repo baseline noise.
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

- Triggering live audit: `/Users/anand/Projects/nexus/proof/home-cxo-quality-live-final-2026-07-07T14-14-24-768Z/quality-audit.json`.
- PR URL: https://github.com/abarva-platform/abarva/pull/4534
- Focused validation: `npx eslint src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts`; `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand`; `git diff --check`; `npm run release:check`.

## Known Gaps

This does not change the underlying V6 fallback availability for Lakeshore. It cleans the user-visible Home answer surface while V6 remains the live fallback.
