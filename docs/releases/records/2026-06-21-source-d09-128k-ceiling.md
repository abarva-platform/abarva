# 2026-06-21-source-d09-128k-ceiling — d09 max_tokens 200k → 128k (model cap)

## Release ID

`2026-06-21-source-d09-128k-ceiling`

## Status

`candidate`

## Plain-English Summary

PR #3756 set d09 `max_tokens` to 200,000 to prevent truncation. Live testing revealed
the production model (`claude-sonnet-4-6`, controlled by `ABARVA_SOURCE_BOARD_GRADE_MODEL`
env) has a hard API cap of 128,000 output tokens. The Anthropic API returned:
`max_tokens: 200000 > 128000, which is the maximum allowed number of output tokens
for claude-sonnet-4-6`. This corrects the ceiling to 128,000 — the true maximum
for the live model, which is still far above what a complete 11-section RFP requires
(typically 20k–40k tokens).

## Layer Impact

**Lane:** `global-control-lane` — prompt registry constant change only.

- `src/lib/source/agent-generation/prompt-registry.ts`: d09 `maxTokens` 200k → 128k.

## Client Applicability

All clients: yes — every Source d09 RFP Package generation call.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `docs/releases/records/2026-06-21-source-d09-128k-ceiling.md`

## QA / Validation

- Live acceptance test: d09 generation on event `17e32d94-1e22-49c9-ac5d-9ffd76d98e01`
  (MDR & SOC Outsourcing 2026) after deploy; confirm generation completes with
  quality gate passing (no `max_tokens` API error).
- ESLint / tsc: constant-only change, expected PASS.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys via `aca-main-deploy`.
3. Retry d09 generation immediately after deploy.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- No migration; no feature flag; no env var change required.
- Live signed-in proof required: d09 generation post-deploy on at least one event.

## Known Gaps

- The production model is `claude-sonnet-4-6` (set via `ABARVA_SOURCE_BOARD_GRADE_MODEL`),
  not `claude-opus-4-8` (the code default). If the env var changes to Opus 4.8, its
  output token limit should be verified before raising the ceiling again.
- 128k tokens for a complete RFP is generous; in practice generation stops at ~20k–40k
  tokens at end-turn. No truncation risk at 128k for any current archetype.

## Rollback Plan

Revert the commit. Constant-only change; no persisted state affected.

## Audit Evidence

- Live API error: `400 {"type":"error","error":{"type":"invalid_request_error",
  "message":"max_tokens: 200000 > 128000, which is the maximum allowed number of
  output tokens for claude-sonnet-4-6"}}` — confirmed after PR #3756 deploy.
- Branch: `fix/source-d09-128k`
