# 2026-08-19-enterprise-thesis-bounded-thinking — separate extended-thinking budget from the output ceiling

## Release ID

`2026-08-19-enterprise-thesis-bounded-thinking`

## Status

`candidate`

## Plain-English Summary

A live ACA Job run of `2026-08-19-enterprise-thesis-targeted-repair` reproduced the empty-response
failure this generator has hit twice before, on both tenants, at the new lower ceiling: one tenant's
call spent its entire 6,000-token budget on the model's internal reasoning and returned no visible
text at all; the other got enough room for reasoning plus partial content, but not enough to finish,
truncating mid-JSON.

The root cause, confirmed against the SDK's own documentation this time rather than guessed at: this
model engages extended thinking regardless of whether it is explicitly requested, and that thinking
spend counts against the same `max_tokens` ceiling as the visible response. Raising `max_tokens`
alone — the fix applied on both previous occurrences of this failure — only enlarges a shared pool
that thinking can still consume unpredictably; it does not reserve anything for the answer.

The fix gives thinking an explicit, capped budget (`thinking: { type: "enabled", budget_tokens }`)
on every call this script makes, and sizes `max_tokens` as that budget plus the actual content
ceiling the call needs, so the two no longer compete: main generation call 2,000 thinking + 6,000
content = 8,000 total; verifier and repair calls 1,024 thinking + up to ~2,000 content = 3,072
total each (unchanged ceiling, now with a guaranteed floor for the answer instead of a shared race).

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

- `scripts/data-build/build-enterprise-thesis.ts` — `callClaude` takes an explicit
  `thinkingBudget` parameter and passes `thinking: { type: "enabled", budget_tokens }` on every
  request; all three call sites (main generation, verifier, repair) updated with an explicit
  thinking budget and a `max_tokens` ceiling sized to (thinking budget + content need) instead of
  a single undifferentiated number.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint scripts/data-build/build-enterprise-thesis.ts` — PASS, 0 errors.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` — PASS, 20/20 (unchanged by this fix; these
  cover the structural validator, not live model calls).
- Root cause confirmed against a real ACA Job run's captured log (both tenants), not a guess:
  `stop_reason=max_tokens blocks=[thinking] output_tokens=6000 max_tokens=6000` on one tenant,
  truncated-mid-JSON parse failure on the other, at the exact ceiling introduced by the prior
  release in this stretch.
- Live re-run against both tenants under this fix is the next step, tracked as a follow-up job
  execution before drawing any conclusion about repair-path behavior or content quality.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. A fresh
`data-build:enterprise-thesis:plan` job run (no DB write) against both tenants is the actual proof
this fix holds; only after that succeeds does the earlier release's still-open verification (does
`OVERSTATED` repair actually fire and produce good output) get a first real data point.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR; follow-up is a plan-only ACA Job run, no
  product surface reads this artifact type yet.

## Rollback Plan

Revert the commit. No DB row has been written under either this or the prior release's script
version yet (`THESIS_WRITE` has not been enabled for any run since the repair-architecture change
landed), so rollback is a pure code revert with no data migration needed.

## Audit Evidence

PR link recorded at merge. The reproducing job's captured log is retained locally at
`/tmp/enterprise-thesis-sky/04-logs.txt` from this session pending inclusion in the follow-up
job's evidence bundle.

## Known Gaps

Live re-run against both tenants under the bounded-thinking fix has not happened yet as of this
record — tracked as the immediate next step. Whether 2,000 thinking tokens is enough headroom for
the model to reason well across a 40+ signal packet, or whether it needs adjusting again after a
live look at the reasoning it actually produces, is unverified until that run completes.
