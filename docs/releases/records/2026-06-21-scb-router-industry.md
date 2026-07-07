# 2026-06-21-scb-router-industry — Fence the router to the tenant's industry

## Release ID

`2026-06-21-scb-router-industry`

## Status

`candidate`

## Plain-English Summary

Stops the expert router from summoning an industry-specific expert from the WRONG industry — e.g. the Airline Loyalty expert showing up for a retail tenant's loyalty question (observed live on Apex). When the tenant's industry is known, the router now excludes industry-specific experts from other industries; cross-cutting experts stay eligible for everyone, and same-industry experts still get their bonus. The ask path derives the tenant industry from its client key via a code→token bridge over the existing `CLIENT_KEY_TO_INDUSTRY_CODE`. Tenants with no clean industry match (MEDTECH, DIVERSIFIED) get no fence — cross-cutting experts rank on merit rather than being forced into one vertical.

## Layer Impact

- **global-control-lane:** router scoring (`router.ts`) gains an out-of-industry exclusion; `expert-grounding.ts` resolves industry from client key; the ask path passes the client key. Behaviour changes only when an industry is resolvable AND the shared-engine flag is on (today: `apexretail`).

## Client Applicability

- All clients: Logic is global, but only affects answers where the shared-engine flag is on (today `apexretail`). With the flag off, `summonExpertsForQuery` is not called → no change.
- Specific clients: `apexretail` — retail answers no longer cite the airline expert.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Gated by `scb_shared_engine_intelligence` (the consumer); the router change itself is unconditional but inert unless the router is given an industry.

## Changes Included

- `src/lib/intelligence/answer/router.ts` — exclude out-of-industry industry-specific experts when industry is known.
- `src/lib/intelligence/answer/expert-grounding.ts` — `expertIndustryForClientKey` (code→ExpertPack-token bridge) + `clientKey` input on `summonExpertsForQuery`.
- `src/lib/intelligence/ask/index.ts` — pass `clientKey` into the summon call.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean (0 errors). Verified: retail tenant (`apexretail`) loyalty question now returns `customer-loyalty-personalization` + `retail.store-operations` and NO airline expert; airline tenant (`skyharbor`) still returns `airline.loyalty-customer`; an unknown/diversified tenant gets no fence (backward-compatible); industry resolution apexretail→retail, skyharbor→airline, lakeshore→undefined. The W5.2 golden eval still passes 35/35 (no routing regression).

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Re-prove on Apex that the retail loyalty answer no longer cites the airline expert.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: web app serves updated routing after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — re-prove on Apex (experts row excludes airline).

## Rollback Plan

Revert the PR — restores the prior router (industry bonus only, no exclusion). No data/migration.

## Known Gaps

- The code→token bridge covers the 5 industry-specific clusters (retail/airline/healthcare_provider/financial_services_banking/energy); new industry experts need an entry to be fenceable.
- Re-proof on Apex pending deploy.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-router-industry` → `main`.
- CI: `npm run release:check`, `tsc` clean, retail/airline/unknown routing probes + 35/35 golden.
