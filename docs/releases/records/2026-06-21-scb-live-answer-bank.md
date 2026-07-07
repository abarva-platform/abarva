# 2026-06-21-scb-live-answer-bank — Live model-answer eval bank (depth + adversarial honesty)

## Release ID

`2026-06-21-scb-live-answer-bank`

## Status

`candidate`

## Plain-English Summary

Adds the **live model-answer eval bank** — the corpus the env-gated W5.1 live runner scores once it produces real Ava answers. Where the deterministic golden set proves routing + grounding, this bank tests the thing only the live model produces: the actual prose. It is **349 cases** — ~5 per expert across all 67 packs (3 positive depth + 2 adversarial each) plus 14 global probes — with **per-case expected behaviors** (cite_benchmark, hedge_uncertainty, surface_stuck_point, no_fabrication, refuse_cross_tenant, scope_down, require_evidence, output shape). 148 (42%) are adversarial: fake-precision traps, no-evidence traps, cross-tenant fence probes (asking Ava to pull another named tenant's actuals), and out-of-domain scope-down probes. Ships with a structural validator + a behavior-checker spec the live runner calls, both running in CI without the model.

## Layer Impact

- **global-control-lane (additive, dormant):** new `answer/evals/live-answer/` module — types, structural validator, behavior-checker spec, 349-case corpus, and a CI test. No runtime answer-path change; the live scoring is consumed by the (env-gated) W5.1 runner. Does NOT modify the W5.1 harness, the registry, or any runtime/plumbing.

## Client Applicability

- All clients: No runtime change — eval design/fixtures.
- Specific clients: None (cross-tenant probes reference synthetic demo tenants by design).
- Internal only: Yes — build-time eval corpus.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/answer/evals/live-answer/types.ts` (LiveAnswerCase, behavior + adversarial taxonomy)
- `src/lib/intelligence/answer/evals/live-answer/validate.ts` (structural validator; adversarial-consistency rules)
- `src/lib/intelligence/answer/evals/live-answer/check.ts` (per-behavior checker spec the live runner calls; deterministic vs model-judged)
- `src/lib/intelligence/answer/evals/live-answer/index.ts` (LIVE_ANSWER_CASES aggregate + exports)
- `src/lib/intelligence/answer/evals/live-answer/cases/*.ts` (7 domain clusters + global-adversarial)
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts` (CI gate)

## QA / Validation

Validation: Pass.
- **349 cases**; `validateLiveAnswerBank` ok (id uniqueness, valid behaviors, adversarial-consistency: every adversarial kind requires its defining honesty behavior); **67/67 experts covered** (>=5 cases each, >=1 adversarial each).
- **148 adversarial (42%)** spanning fake-precision, no-evidence, cross-tenant, out-of-domain.
- **343/343** owned cases route top-1 to their expected expert (out-of-domain cases carry expectedExpertId "" by design).
- `tsc --noEmit` clean over the bank modules.
- Jest `live-answer-bank.test.ts` → **5/5 pass** (structural validity, depth+adversarial balance, routing alignment, fence/scope-down consistency, behavior-checker sanity).

## Rollout Plan

Merge to `main`. No runtime rollout — the corpus + checker are consumed by the env-gated W5.1 live runner (Codex lane). The structural validator/test run in CI now.

## Deployment Authority

Not applicable — additive eval design, no default-on runtime call sites.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No (the live scoring itself is the env-gated W5.1 step).

## Rollback Plan

Revert the PR — eval module + test only, no migration, no runtime call sites.

## Audit Evidence

- Aggregate verify: 349 cases, 67/67 experts, validate ok, 343/343 owned routed top-1, 148 adversarial.
- `live-answer-bank.test.ts` 5/5 pass.

## Known Gaps

- Covers the 67 packs on `main`. The 8 staged experts (#3806/#3807) will need live-answer cases too.
- The model-answer *scoring itself* (running real Ava + judging the model-judged behaviors like no_fabrication) is the env-gated W5.1 layer (Codex), not exercised in CI.
