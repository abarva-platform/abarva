# 2026-06-20-scb-golden-evals — Golden-question eval framework (W5.2)

## Release ID

`2026-06-20-scb-golden-evals`

## Status

`candidate`

## Plain-English Summary

Adds the eval framework for the Consilium faculty: one representative CXO question per expert (35 fixtures) plus a deterministic runner that scores the parts verifiable without the model — does the router summon the right expert, and does the grounding block carry that expert's authored content (name, planning-range benchmark, honest odds, hedge language)? The model-answer quality scoring (does the prose use the benchmarks / hedge correctly) layers on top later via the W5.1 runner + live env. **Additive and dormant — pure functions, no runtime call site.**

## Layer Impact

- **global-control-lane (additive, dormant):** new pure eval modules under `src/lib/intelligence/answer/evals/`. No runtime route imports them.

## Client Applicability

- All clients: No runtime change — dormant eval code.
- Specific clients: None.
- Internal only: Yes — build/QA tooling.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/answer/evals/golden-questions.ts` — 35 golden fixtures (one per expert).
- `src/lib/intelligence/answer/evals/golden-eval.ts` — `runGoldenEval()` deterministic scorer.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean. `runGoldenEval()` result: **35/35 pass** (routing 35/35, grounding 35/35, content 35/35) — every expert routes correctly from its golden question and its grounding block carries name + odds + hedge + benchmark. Automated unit tests: not-run as jest yet (the runnable check is the inline tsx run captured here; a jest wrapper can follow with the W5.1 harness).

## Rollout Plan

Merge to `main`. No runtime rollout — dormant eval code.

## Deployment Authority

Not applicable — additive build-time code with no runtime call sites.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR — no runtime call sites.

## Known Gaps

- Scores the deterministic layer only (routing + grounding). Model-answer quality (prose uses benchmarks, hedges correctly, no fabrication, cites experts) needs the W5.1 runner + live env (`ANTHROPIC_API_KEY`/DB).
- One golden question per expert; can be deepened to several per expert.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-evals` → `main`.
- CI: `npm run release:check`, `tsc` clean, `runGoldenEval()` 35/35 output in PR description.
