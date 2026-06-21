# 2026-06-21-scb-live-answer-eval-runner — SCB Live Answer Eval Runner

## Release ID

`2026-06-21-scb-live-answer-eval-runner`

## Status

`candidate`

## Plain-English Summary

Adds the missing executable runner for the Shared Context Brain live-answer bank. The existing deterministic golden eval proves routing and authored-pack grounding; this runner signs in as an agent persona, calls the live `/api/intelligence/ask` path, and scores real Ava prose plus structured outputs against the live-answer behavior bank.

## Layer Impact

- `internal-admin`: Adds a manual GitHub Actions eval workflow and script.
- `global-control-lane`: No product behavior change; the runner exercises the existing live Intelligence API.

## Client Applicability

- All clients: No runtime behavior changes.
- Specific clients: The manual eval defaults to the Meridian agent persona but can run with any provisioned agent persona.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/intelligence/scb-live-answer-eval-runner.ts` runs the live-answer bank against real signed-in Ava answers.
- `.github/workflows/scb-live-answer-eval.yml` exposes the runner as a manual workflow using existing crawl/Clerk secrets.
- `package.json` adds `npm run scb:live-answer-eval`.

## QA / Validation

- `npm run scb:golden-eval -- --out=reports/scb/w5-1-agent-answer-golden-eval-2026-06-21-closeout.json` — passed 335/335 before this change.
- Focused validation to be run before merge:
  - `npx eslint src/scripts/intelligence/scb-live-answer-eval-runner.ts`
  - `npm run release:check`
  - `npm run scb:live-answer-eval -- --help` is not supported; live execution requires Clerk/crawl secrets through the workflow.

## Rollout Plan

Merge to `main`. The workflow is manual-only; no client-facing route, flag, schema, or deploy setting changes.

## Deployment Authority

- Repo-owned deploy workflow: Main deploy may run because this is a main merge, but the app image behavior is unchanged.
- Shared runtime mutators: None.
- Feature/env flag update path: None.
- Live signed-in proof required: Run the manual `SCB live answer eval` workflow after merge.

## Rollback Plan

Revert this PR to remove the workflow and script.

## Audit Evidence

- Manual workflow run URL after merge.
- Uploaded `scb-live-answer-eval` report artifact.

## Known Gaps

The runner records behaviors that still need a separate model-judge layer as `modelJudgedPendingCount`. It can fail on that with `require_model_judge=true`, but this PR does not add an LLM judge implementation.
