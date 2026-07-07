# 2026-06-21-scb-moves-wiring — Wire Moves synthesis to the faculty (flag-gated)

## Release ID

`2026-06-21-scb-moves-wiring`

## Status

`candidate`

## Plain-English Summary

Wires the Moves (Programs) synthesis path to the Consilium expert faculty, behind the default-OFF `scb_shared_engine_moves` flag — mirroring the merged Source wiring. When on for a tenant, `/api/programs/synthesis` summons the Consilium expert(s) for the program subject (industry-fenced via the tenant client key) and injects their authored grounding into the synthesis prompt. **Flag off (every tenant today) = byte-identical** to before. This advances W1.4 (surfaces onto the shared engine): Intelligence, Source, and now Moves are wired (Tower still needs a server endpoint).

## Layer Impact

- **global-control-lane (flag-gated, dormant):** `/api/programs/synthesis/route.ts` gains a flag-gated expert-grounding injection; one new feature-flag definition (`scb_shared_engine_moves`, default off). Off → no client behavior change.

## Client Applicability

- All clients: No runtime change — flag off for every tenant.
- Specific clients: None yet (per-tenant flip during staged rollout with its own proof).
- Internal only: No.
- Public/demo only: None.
- Feature flag: `scb_shared_engine_moves` (default OFF).

## Changes Included

- `src/app/api/programs/synthesis/route.ts` — flag-gated expert grounding prepended to the synthesis user message (both preflight prompt + model call); query = program name, `clientKey` passed for industry fencing.
- `src/lib/features/registry.ts` — `scb_shared_engine_moves` flag (policy tenant, includeTenants []).

## QA / Validation

Validation: Pass (static). `tsc --noEmit` clean on the route + registry. Dormant when off: `summonExpertsForQuery` not called, grounded message === original, prompt unchanged; flag resolves FALSE for `apexretail` and null. Runtime/end-to-end proof (flag on for a tenant, signed-in Moves synthesis citing experts) deferred to env/rollout.

## Rollout Plan

Merge to `main` (dormant). Activation is a later, separate change: flip `scb_shared_engine_moves` for one tenant + deploy + verify a signed-in Moves synthesis grounds in the expert. No flag flip happens in THIS release.

## Deployment Authority

Not applicable to this merge — flag off everywhere, no runtime behavior change. The later per-tenant flip + deploy carries deployment authority + live signed-in proof.

- Repo-owned deploy workflow: n/a for this merge
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: `scb_shared_engine_moves` includeTenants (later change)
- Live signed-in proof required: Yes — at flag-flip time, not for this dormant merge.

## Rollback Plan

Revert the PR. Safe — flag-gated and off; reverting restores the prior route exactly.

## Known Gaps

- Not runtime-proven (deferred to env/rollout).
- Like Source: the synthesis cache key does not vary by the flag — clear the cache (or add the flag to the key) when flipping per tenant.
- Tower still not wired (needs a server answer endpoint).

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-moves-wiring` → `main`.
- CI: `npm run release:check`, tsc clean, flag-resolution check (default off).
