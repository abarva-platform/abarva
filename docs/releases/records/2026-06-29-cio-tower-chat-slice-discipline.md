# 2026-06-29-cio-tower-chat-slice-discipline — Tower chat slice discipline

## Release ID

`2026-06-29-cio-tower-chat-slice-discipline`

## Status

`candidate`

## Plain-English Summary

Tower chat now tells Claude exactly which Tower slice it is answering from before Claude writes the visible answer. This prevents total-spend answers from blending enterprise budget, function/platform budget lines, and initiative/program budgets into one mislabeled explanation.

## Layer Impact

- `global-control-lane`: Updates the shared Tower CIO answer prompt contract for all tenants. The renderer still places Claude's returned JSON strings exactly; the change is in the deterministic prompt package and validation test.

## Client Applicability

- All clients: Yes, all tenants using the Tower CIO chat path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: Adds dashboard slice-discipline instructions to the Tower Claude prompt.
- `src/lib/cio-tower/__tests__/answer.test.ts`: Adds regression coverage so total-spend prompts cannot silently allow function/platform lines to be mislabeled as programs, initiatives, or spending towers.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` — passed, 5/5 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts` — passed.
- Pre-fix live browser check after Azure refresh: Lakeshore dashboard displayed `$877.9M` FY26 IT spend, but chat used inconsistent wording for largest slices. This release targets that prompt-packaging issue.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deployment lane, then verify `https://app.abarva.ai/tower` with a signed-in Tower chat question for Lakeshore and SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower chat must answer total IT spend without mixing budget slices.

## Rollback Plan

Revert this commit and redeploy the prior approved main image through the repo-owned ACA deploy lane. No data rollback is required.

## Audit Evidence

- PR URL: To be added when opened.
- Tests: Targeted Jest and ESLint outputs from local validation.
- Live proof: To be added after deploy.

## Known Gaps

This does not add missing source data. If a dashboard slice is unavailable because source files do not provide that cut, Tower must continue showing an explicit gap rather than inventing values.
