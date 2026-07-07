# 2026-06-24-intelligence-answer-quality-polish — Intelligence Answer Quality Polish

## Release ID

`2026-06-24-intelligence-answer-quality-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the live Intelligence answer experience after browser crawl findings. It removes remaining visible `Ask Ava` page chrome on the Intelligence Ask page, prevents raw app/entity IDs from leaking into prose, removes the phrase `the cited record`, and stops chart/graph prompts from rendering generic evidence tables when the backend does not have valid visual data.

## Layer Impact

- `global-control-lane`: shared Intelligence UI copy and answer-rendering safety.
- No database migration.
- No tenant data changes.
- No model-provider or retrieval-service changes.

## Client Applicability

- All clients: yes, for Intelligence Ask responses and visible Intelligence Ask page chrome.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/intelligence/ask/page.tsx`: updates visible Intelligence Ask page copy from `Ava` to `aVa`.
- `src/lib/intelligence/answer/answer-safety.ts`: expands raw ID suppression to IDs such as `APP-00002` and replaces unsafe IDs with source-specific readable fallback labels instead of `the cited record`.
- `src/lib/intelligence/ask/response-policy.ts`: expands raw ID suppression for ask prose and replaces raw IDs with `the referenced evidence`.
- `src/lib/intelligence/answer/structured-exhibits.ts`: removes the generic `Decision Evidence` fallback table for chart/graph requests. If a visual cannot be built from structured rows or explicit table data, the answer now returns an evidence-gap sentence and no fake visual/table.
- Tests updated for the safer contract.

## QA / Validation

- `passed`: `npx jest --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` — 3 suites / 32 tests passed. Existing duplicate manual mock warnings remain unrelated.
- `passed`: focused ESLint for the changed files.
- `passed`: `npm run release:check`.
- `passed`: `npm run audit:ai-surface-controls`.
- `passed`: `git diff --check`.
- `pending`: PR CI.
- `pending`: ACA deploy and signed-in browser crawl against the deployed revision.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then rerun the signed-in Intelligence browser crawl against `https://app.abarva.ai/intelligence/ask`.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: no branch/local deploy path is authorized.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved main digest.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest through the ACA main workflow. No data rollback is required.

## Audit Evidence

- Current-live crawl before this fix: `reports/intelligence-current-live-crawl-20260624/`.
- PR URL: https://github.com/abarva-platform/abarva/pull/3930
- CI run: pending.
- Deployment evidence: pending.
- Browser proof: pending.

## Known Gaps

This release prevents misleading fallback visuals and raw-ID leakage. It does not create missing source relationships or numeric chart rows; those still require the semantic/data layer to provide structured source rows or relationship edge pairs.
