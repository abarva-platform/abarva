# 2026-06-21-scb-w14-home-wiring — W1.4 Home onto the shared engine (last surface)

## Release ID

`2026-06-21-scb-w14-home-wiring`

## Status

`candidate`

## Plain-English Summary

Wires the Home surface onto the Shared Context Brain — the last of the five surfaces. When `scb_shared_engine_home` is on for the tenant, the Home agent answer (`/api/chat/agent`, surface `/home`) summons the Consilium expert(s) for the question and grounds Ava's answer in their authored content, the same dormant-until-flipped pattern already live (flag-gated) on Intelligence (ask), Tower (`/api/tower/ask`), Source (`/api/source/synthesis`), and Moves (`/api/programs/synthesis`). Completes W1.4 surface wiring.

## Layer Impact

- **global-control-lane (flag-gated, default OFF):** `src/app/api/chat/agent/route.ts` adds a `homeConsiliumBlock` to the system prompt, computed only when surface is `/home`, there is a question, and `scb_shared_engine_home` is enabled for the tenant. The prompt is byte-identical when the flag is off / off-Home / no question.

## Client Applicability

- All clients: No behavior change while the flag is OFF (default).
- Specific clients: Whichever tenants get `scb_shared_engine_home` flipped on (none yet).
- Internal only: No.
- Public/demo only: None.
- Feature flag: `scb_shared_engine_home` (tenant policy, default OFF, includeTenants allowlist).

## Changes Included

- `src/app/api/chat/agent/route.ts` (+2 imports; `homeConsiliumBlock` compute + insertion into `systemPrompt`)

## QA / Validation

Validation: Pass. Scoped `tsc --noEmit` on the route clean. Mirrors the proven Intelligence/Tower/Source/Moves wiring (same `isFeatureEnabled` + `summonExpertsForQuery` contract). Default-OFF ⇒ prompt byte-identical until a tenant flag flip; live signed-in proof is the flip step (separate).

## Rollout Plan

Merge to `main` once the deploy lane is clear (avoid racing an in-flight deploy — main auto-deploys on push). Dormant until `scb_shared_engine_home` is flipped per tenant.

## Deployment Authority

- Repo-owned deploy workflow: aca-main-deploy (auto on push to main)
- Shared runtime mutators: none
- Approved image digest: n/a (built on deploy)
- ACA runtime invariant: prompt byte-identical with flag off
- Worker image invariant: n/a
- Feature/env flag update path: `ABARVA_FEATURE_SCB_SHARED_ENGINE_HOME_TENANTS` (ACA env), default empty
- Live signed-in proof required: Yes — at flip time, prove a grounded Home answer for the enabled tenant.

## Rollback Plan

Revert the PR, or simply leave `scb_shared_engine_home` off (the change is inert while off).

## Audit Evidence

- Scoped tsc clean on the route.
- Wiring mirrors the four already-wired surfaces' flag-gated pattern.

## Known Gaps

- Live proof is the flag-flip step (D in the closeout), not exercised here.
