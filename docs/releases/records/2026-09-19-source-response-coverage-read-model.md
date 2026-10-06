# 2026-09-19-source-response-coverage-read-model - Deterministic Source Response Coverage Guard

## Release ID

`2026-09-19-source-response-coverage-read-model`

## Status

`candidate`

## Plain-English Summary

Source now has a deterministic response-coverage read model for the Responses stage. It reads already-normalized vendor response artifacts and optional response-coverage facts, separates production evidence from synthetic or test responses, reports answered, missing, and not-comparable requirements, and refuses completeness or ranking claims when critical required fields are absent.

## Layer Impact

Layer 4 product projection only. This ships in `global-control-lane`: it adds a pure Source read model and a narrow route consumer for shared Source behavior. It does not create schema, migrations, data writes, tenant loads, benchmark corpora, or signed-in/live claims.

## Client Applicability

- All clients: Source event response coverage uses the same deterministic guard when normalized response packages are present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/response-coverage-read-model.ts`: pure read model for production versus synthetic/test response coverage and claim guards.
- `src/lib/source/__tests__/response-coverage-read-model.test.ts`: behavior coverage for evidence separation, answered/missing/not-comparable categories, and refusal when critical fields are absent.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: route-level consumer that keeps synthetic parsed response packages out of the existing production completeness input.

## QA / Validation

- Red-first behavior test: **pass**. The new test initially failed because `src/lib/source/response-coverage-read-model.ts` did not exist.
- `npm test -- --runTestsByPath src/lib/source/__tests__/response-coverage-read-model.test.ts --runInBand`: **pass**.
- `npm run test:behaviors`: **pass** — 25 suites / 265 tests.
- `npx eslint src/lib/source/response-coverage-read-model.ts src/lib/source/__tests__/response-coverage-read-model.test.ts src/app/\(maestro\)/source/events/\[eventId\]/page.tsx`: **pass**.
- Mutation proof: **pass**. Temporarily disabling the no-production-vendor critical-field guard caused the focused test to fail, then the mutation was reverted.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: **pass**.
- `git diff --check`: **pass**.
- `npm run release:check`: **pass**.
- Signed-in acceptance: **not run**; not in scope for this read-model slice.

## Rollout Plan

Squash-merge through PR after local validation and required checks. Runtime activation rides the repo-owned Azure Container Apps main deploy workflow; no manual data-plane work or environment mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: To be produced by the repo-owned main deploy workflow after merge.
- ACA runtime invariant: Must be checked after the repo-owned deploy before anyone claims the change is live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this H2 slice; no signed-in claim is made.

## Rollback Plan

Revert the PR. No database rollback, tenant data repair, or artifact regeneration is required.

## Audit Evidence

Inspect the PR, local test output, mutation output, TypeScript output, release-check output, the main deploy workflow run, and post-deploy ACA runtime invariant readback.

## Known Gaps

- This does not parse new vendor documents or create a benchmark corpus.
- This does not add a new UI panel; the existing route consumes the model only to avoid mixing synthetic/test responses into production completeness inputs.
- This does not claim live signed-in behavior.
