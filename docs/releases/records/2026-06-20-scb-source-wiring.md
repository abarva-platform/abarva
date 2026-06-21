# 2026-06-20-scb-source-wiring — Source synthesis grounded in the faculty (flag-gated) + module flags

## Release ID

`2026-06-20-scb-source-wiring`

## Status

`candidate`

## Plain-English Summary

Wires the Consilium faculty into the Source synthesis path, behind the default-OFF `scb_shared_engine_source` flag. When on for a tenant, `/api/source/synthesis` summons the Consilium expert(s) for the sourcing event (e.g. an AMS vendor-consolidation event routes to the IT Outsourcing & Managed Services expert) and injects their authored grounding into the synthesis prompt. Also adds a placeholder `scb_shared_engine_tower` flag (Tower answers in-browser today and needs a server endpoint — Codex W1.4 — before it has a consumer). **When the flags are off (every tenant today) the Source path is byte-identical to before — no behavior change.**

## Layer Impact

- **global-control-lane (flag-gated, dormant):** `/api/source/synthesis/route.ts` gains a flag-gated expert-grounding injection; two new feature-flag definitions (default off). Off → no client behavior changes.

## Client Applicability

- All clients: No runtime change — both flags off for every tenant.
- Specific clients: None yet (flags flip per tenant during staged rollout with their own proof).
- Internal only: No.
- Public/demo only: None.
- Feature flag: `scb_shared_engine_source` (default OFF) now has its first consumer; `scb_shared_engine_tower` (default OFF) is a placeholder with no consumer yet.

## Changes Included

- `src/app/api/source/synthesis/route.ts` — flag-gated expert grounding injected into the synthesis user message.
- `src/lib/features/registry.ts` — `scb_shared_engine_source` + `scb_shared_engine_tower` flags.
- `docs/build/SCB_EXECUTION_TRACKER.md` — handshake note (Tower = Codex W1.4).

## QA / Validation

Validation: Pass (static). `tsc --noEmit` clean on the route + registry (0 errors). Dormant when off: `summonExpertsForQuery` is not called, `groundedUserMessage === userMessage`, and the prompt is unchanged. Runtime/end-to-end proof (flag on for a tenant, signed-in source synthesis citing experts) is not run — it requires the live environment and is the deferred rollout/demo step.

## Rollout Plan

Merge to `main` (dormant). Activation is a later, separate change: flip `scb_shared_engine_source` for one tenant + deploy + verify a signed-in source synthesis grounds in the expert. No image build, migration, or flag flip happens in THIS release.

## Deployment Authority

Not applicable to this merge — flags off everywhere, so no runtime behavior changes. The later per-tenant flip + deploy carries deployment authority + live signed-in proof.

- Repo-owned deploy workflow: n/a for this merge
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: `scb_shared_engine_source` includeTenants (later change)
- Live signed-in proof required: Yes — at flag-flip time, not for this dormant merge.

## Rollback Plan

Revert the PR. Safe — flag-gated and off; reverting restores the prior route exactly.

## Known Gaps

- Not runtime-proven (deferred to env/rollout).
- The source synthesis cache key does not vary by the flag — clear the cache (or add the flag to the key) when flipping per tenant, to avoid serving a pre-grounding cached response.
- Tower is not wired — it needs a server answer endpoint (Codex W1.4); the `scb_shared_engine_tower` flag is a placeholder.
- Source routing uses the event `name` (current AMS instance routes correctly); broader event types should be validated as Source patterns expand.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-source-wiring` → `main`.
- CI: `npm run release:check`, `tsc` clean (0 errors).
