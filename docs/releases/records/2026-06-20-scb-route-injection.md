# 2026-06-20-scb-route-injection — Intelligence ask route-injection (flag-gated, dormant)

## Release ID

`2026-06-20-scb-route-injection`

## Status

`candidate`

## Plain-English Summary

Wires the Consilium expert faculty into the live Intelligence "Ask" path, behind the default-OFF `scb_shared_engine_intelligence` flag. When the flag is on for a tenant, the ask path summons the routed expert(s) for the question and injects their authored grounding (scope, planning-range benchmarks, AI plays, honest odds, hedge language) into the synthesizer, and emits a `contributing-experts` event naming the experts. **When the flag is off (every tenant today), the path is byte-identical to before — no behavior change.** Single-file change to `src/lib/intelligence/ask/index.ts`.

## Layer Impact

- **global-control-lane (flag-gated, dormant):** `askIntelligence` gains a flag-gated branch that enriches the synthesizer prompt with expert grounding and yields a new `contributing-experts` event. Default-off → no client sees any change until the flag is flipped per tenant.

## Client Applicability

- All clients: No runtime change — flag off for every tenant.
- Specific clients: None yet (the flag will be flipped per-tenant during the staged rollout, with its own proof).
- Internal only: No.
- Public/demo only: None.
- Feature flag: `scb_shared_engine_intelligence` (default OFF) now has its first consumer.

## Changes Included

- `src/lib/intelligence/ask/index.ts` — flag-gated expert grounding injection + `contributing-experts` event on `AskEvent`.

## QA / Validation

Validation: Pass (static). `tsc --noEmit` clean on `index.ts` and its import graph (0 errors). The branch is logically dormant: with the flag off, `summonExpertsForQuery` is not called, `groundedFactBlock === factAvailabilityBlock`, and no new event is yielded — i.e. byte-identical to the prior path. Runtime/end-to-end proof (flag on for a tenant, signed-in answer naming experts) is **not-run** here — it requires the live environment (`ANTHROPIC_API_KEY` + private DB + deploy) and is the deferred rollout/demo step.

## Rollout Plan

Merge to `main` (dormant). Activation is a later, separate change: flip `scb_shared_engine_intelligence` for one tenant (`includeTenants`), deploy to ACA, and verify a signed-in answer cites the contributing experts. No image build, migration, or flag flip happens in THIS release.

## Deployment Authority

Not applicable to this merge — flag is off everywhere, so no runtime behavior changes. The later per-tenant flip + deploy is the change that will carry deployment authority + live signed-in proof.

- Repo-owned deploy workflow: n/a for this merge
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: `scb_shared_engine_intelligence` `includeTenants` (later change)
- Live signed-in proof required: Yes — at flag-flip time, not for this dormant merge.

## Rollback Plan

Revert the PR. Safe — the change is flag-gated and off; reverting restores the prior `index.ts` exactly.

## Known Gaps

- Not runtime-proven (deferred to the env/rollout step).
- Grounding rides the `factAvailabilityBlock` channel into the synthesizer (functional + minimal-touch); a dedicated `expertGroundingBlock` synthesizer arg is a possible later refinement.
- Structured channels (tables/charts) are not yet streamed — prose-grounded only until W4 renderers land.
- Router precision is v1 keyword-overlap.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-route-injection` → `main`.
- CI: `npm run release:check`, `tsc` clean (0 errors on `index.ts`).
