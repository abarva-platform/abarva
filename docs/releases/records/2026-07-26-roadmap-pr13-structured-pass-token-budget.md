# 2026-07-26-roadmap-pr13-structured-pass-token-budget — PR13: raise the structured-pass token budget

## Release ID

`2026-07-26-roadmap-pr13-structured-pass-token-budget`

## Status

`candidate`

## Plain-English Summary

The PR12 live Meridian build proved the dedicated structured pass runs and fails honestly, but it
failed with `structured_output_malformed` because the model's JSON was truncated mid-string (live run
`ffb9942a`, "Unterminated string in JSON at position 5113"). Root cause: the structured pass requested
only `maxTokens: 2000`, and `maxTokensForRequest` uses `max(env, requested)`, so 2000 was the effective
cap — too small for the full 4-horizon × ≤6-workstream JSON contract. PR13 raises the structured-pass
budget to `8000`, which is ample for the bounded JSON payload. One-line change.

## Layer Impact

- **global-control-lane** (flag-gated): a token-budget constant on the governed roadmap build path.

## Client Applicability

- Gated behind the **feature flag** `moves_governed_roadmap_downloads` (Meridian first). No other change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. ACA runtime invariant verified
  after deploy. Live signed-in proof required: yes — re-run the Meridian build + download success.

## Changes Included

- `src/lib/deliverables/run-governed-roadmap-build.ts` — structured-pass `maxTokens` 2000 → 8000.

## QA / Validation

- Status: **pass** — existing PR12 unit tests unaffected (`tsc` 0, `eslint` clean). This is a runtime
  budget constant; its effect is proven by the post-deploy live re-run (below).

## Audit Evidence

- PR: to be opened. Follows PR12 #5645. Live diagnosis: build run `ffb9942a` on Meridian Move
  `3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6` returned `structured_output_malformed` (truncation).

## Rollout Plan

Squash-merge to `main`; deploy via ACA; re-run the Meridian build and capture the success path.

## Rollback Plan

Revert the one-line change, or disable the flag. No schema/data change.

## Known Gaps

Same as PR12: after this deploy, capture the live Meridian success (build → dedicated pass succeeds →
contract persisted → `current/{html,docx,pptx}` all 200, same content hash). Durable-worker migration

- status endpoint/UI, orchestrator parity, and PowerPoint acceptance remain staged. If the pass still
  fails after the budget bump, the failure remains persisted and visible — report it, do not manufacture
  a contract.
