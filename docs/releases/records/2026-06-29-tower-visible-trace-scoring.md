# 2026-06-29-tower-visible-trace-scoring — Tower Visible Trace Scoring

## Release ID

`2026-06-29-tower-visible-trace-scoring`

## Status

`candidate`

## Plain-English Summary

Tower answer traces now separate the raw Claude JSON response from the visible answer text that aVa renders. The right-answer scorer also scores the visible contract text instead of treating the raw JSON wrapper as the user-visible answer. This makes the Tower quality harness truthful: it can distinguish raw model output, visible rendered prose/tables, and validation artifacts.

## Layer Impact

- `global-control-lane`: Updates shared Tower answer tracing and server-side answer scoring for all tenants.
- `client-data-lane`: No schema migration or client data mutation. Existing trace rows remain readable; new trace rows persist cleaner visible text.

## Client Applicability

- All clients: Tower answer tracing/scoring behavior applies globally.
- Specific clients: None.
- Internal only: QA/scoring scripts use this for internal release proof.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: persist parsed visible answer text in `rendered_response` while keeping raw Claude output in `raw_model_response`.
- `src/lib/cio-tower/answer-contract.ts`: score visible contract text preferentially and tighten raw-ID detection for `T01-R05`-style IDs.
- `src/lib/cio-tower/__tests__/answer-contract.test.ts`: regression coverage for raw Tower row/display IDs.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`: passed.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/answer-contract.ts scripts/qa/tower-answer-contract-server-runner.ts scripts/qa/tower-answer-contract-executor.ts`: passed.
- VNet evidence before this fix showed the deployed executor created 18 SkyHarbor traces: 11 passed and 7 failed at visible-contract parse. The scorer incorrectly reported 18/18 failed because it scored raw JSON stored in `rendered_response`; this release fixes that scorer truth gap for future runs.

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, rerun the Tower executor and scorer in the private VNet against the approved ACA image.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None introduced.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Active revision, template image, and 100% traffic must match the approved main image digest.
- Worker image invariant: Private operator job must be restored to the parked image after VNet proof runs.
- Feature/env flag update path: None.
- Live signed-in proof required: Not sufficient alone; VNet trace/scorer proof is required first.

## Rollback Plan

Revert this PR and redeploy the previous approved main image. This does not require data rollback; it only changes how new trace rows are persisted and how the scorer evaluates visible text.

## Audit Evidence

- PR: to be added.
- CI: to be added.
- VNet proof rerun: to be added after deploy.

## Known Gaps

- This does not fix the 7 real visible-contract parse failures observed in the SkyHarbor 18-question executor run. It fixes the trace/scorer truth layer so those failures can be measured correctly.
- Existing historical rows may still have raw JSON in `rendered_response`; the scorer now prefers structured visible contract text when present.
