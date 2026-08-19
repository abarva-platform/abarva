# 2026-08-19-enterprise-thesis-adaptive-thinking — match the model's actual thinking-control contract

## Release ID

`2026-08-19-enterprise-thesis-adaptive-thinking`

## Status

`candidate`

## Plain-English Summary

The immediately prior release (`2026-08-19-enterprise-thesis-bounded-thinking`) added an explicit
`thinking: { type: "enabled", budget_tokens }` parameter to fix a live-reproduced empty-response
bug. A fresh ACA Job run under that fix failed outright with a 400 from the API: `"thinking.type.
enabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort"
to control thinking behavior.` The locally installed SDK's TypeScript types describe both shapes,
so the code compiled cleanly; only a live call against the real API surfaced that this model
requires the newer contract.

This release switches to the contract the model actually accepts: `thinking: { type: "adaptive" }`
plus a top-level `output_config: { effort }`, where `effort` is one of the model's standard
reasoning-effort tiers (`low | medium | high | xhigh | max`) rather than a token count the caller
reserves. Because effort no longer lets the caller carve out a precise token split between
reasoning and content, `max_tokens` on each call is set as a generous ceiling instead of a
precise (thinking budget + content) sum, and the empty-response diagnostic now also reports the
`output_tokens_details.thinking_tokens` split the API returns, so if a ceiling proves too low
again the actual cause is visible in the log rather than requiring another guess.

Effort tiers chosen: `medium` for the main thesis generation call (genuine cross-domain synthesis
across a 40+ signal packet), `low` for the verifier and repair calls (each judges or rewrites one
already-scoped claim).

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) generation tooling — one script,
`scripts/data-build/build-enterprise-thesis.ts`. No canonical model or adapter changes.

## Client Applicability

- All clients: applies to any tenant this generator is run against.
- Specific clients: none.
- Internal only: yes — data-build script, not a served route.
- Public/demo only: no.
- Feature flag: none new; existing `THESIS_WRITE`/`THESIS_WRITE_APPROVED` gate unchanged.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` — `callClaude`'s `thinkingBudget: number`
  parameter replaced with `effort: ReasoningEffort`; request body changed from
  `thinking: {type: "enabled", budget_tokens}` to `thinking: {type: "adaptive"}` +
  `output_config: {effort}`; empty-response diagnostic now also logs
  `output_tokens_details.thinking_tokens`; all three call sites updated with an effort tier and a
  generous `max_tokens` ceiling (main 10000/medium, verifier 4096/low, repair 4096/low).

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors
  (confirms the new request shape matches the installed SDK's `ThinkingConfigAdaptive` /
  `OutputConfig` types).
- `npx eslint scripts/data-build/build-enterprise-thesis.ts` — PASS, 0 errors.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` — PASS, 20/20 (structural validator only, no
  live model calls).
- Root cause confirmed against a real ACA Job run's captured stderr — a 400 `invalid_request_error`
  with the exact required-parameter message quoted above, not a guess.
- Live re-run against both tenants under this fix is the next step, tracked as a follow-up job
  execution. This is now the third generation-mechanics fix in this stretch; each was driven by a
  live failure's actual error text or diagnostic output, not by re-guessing the same parameter.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. A fresh
`data-build:enterprise-thesis:plan` job run (no DB write) against both tenants is the actual proof
this holds — the targeted-repair architecture from the first release in this stretch has not yet
had a single successful live generation to validate its repair path against.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR; follow-up is a plan-only ACA Job run, no
  product surface reads this artifact type yet.

## Rollback Plan

Revert the commit. No DB row has been written under any script version in this stretch
(`THESIS_WRITE` has not been enabled for a run since the repair-architecture change landed), so
rollback is a pure code revert with no data migration needed.

## Audit Evidence

PR link recorded at merge. The failing job's captured stderr (full 400 response body) is retained
locally at `/tmp/enterprise-thesis-v2/04-logs.txt` from this session pending inclusion in the
follow-up job's evidence bundle.

## Known Gaps

Live re-run against both tenants has not happened yet as of this record. The effort tiers chosen
(`medium` for generation, `low` for verify/repair) are a first reasonable guess at what this
model's adaptive-thinking tiers actually cost in tokens and produce in quality for this workload —
unverified until a live run's `thinking_tokens` and content quality can be inspected directly.
