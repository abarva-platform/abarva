# 2026-06-20-scb-w1-engine-spine — Shared Context Brain answer-engine spine (W1.2/W1.3)

## Release ID

`2026-06-20-scb-w1-engine-spine`

## Status

`candidate`

## Plain-English Summary

Adds the server-side answer-engine spine for the Shared Context Brain: a single flow that routes a question to the right expert(s), assembles a context bundle, synthesizes an answer, applies the cross-tenant fence, and shapes the result into the universal `AgentAnswer`. **Additive and dormant — no product route calls it yet.** The broker and the model call are dependency-injected, so this module has no hard dependency on the DB or the AI client and does not change any live behavior. Wiring it into `/api/intelligence/ask` behind a default-off flag is a later release.

## Layer Impact

- **global-control-lane (additive, dormant):** new module `src/lib/intelligence/answer/engine.ts` with zero runtime call sites. No behavior change for any client until a later flag-gated wiring release.

## Client Applicability

- All clients: No runtime change — dormant module, nothing wired.
- Specific clients: None.
- Internal only: Yes — build-time engine code used by later wiring.
- Public/demo only: None.
- Feature flag: None in this release (the `scb_shared_engine_*` flags arrive with W6.1/wiring, default-off).

## Changes Included

- `src/lib/intelligence/answer/engine.ts` — `answerWithSharedBrain()` orchestrator (injected broker + synthesizer) + pure `assembleAgentAnswer()` shaping (groundingMode, confidence banding, citation mapping, cross-tenant fence).
- `docs/build/SCB_EXECUTION_TRACKER.md` — W1.2/W1.3 status.

## QA / Validation

- `tsc --noEmit` clean on the engine module.
- Behavioral test (stub deps) PASS across all paths: tenant-grounded → `mixed`/`medium`/2 citations; industry-only → `industry-pattern`/`low`; cross-tenant → prose + citations blanked.

## Rollout Plan

Merge to `main`. No runtime rollout — no route imports the engine, so no image build, ACA deploy, migration, or flag flip is required or triggered.

## Deployment Authority

Not applicable — additive build-time code with no call sites; cannot affect ACA, deploy workflows, images, flags, env, workers, traffic, or DNS.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. Safe with no constraints — no runtime call sites, no migration.

## Known Gaps

- Not wired to any route — `answerWithSharedBrain` is unused until the flag-gated live-route slice.
- Real deps (AgentContextBroker.assemble, Claude synthesizer, cross-tenant fence) are injected at the call site later, not in this release.
- Router precision is v1 keyword-overlap; sharpens later with model/embeddings.

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-w1-engine` → `main`.
- Commit: `935977394`.
- CI: `npm run release:check`, `tsc` clean, engine behavioral test output in the PR description.
