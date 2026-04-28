# DEMO1 - Apex Retail Demo Storyline Catalog

Slice ID: DEMO1
Slice name: Apex Retail demo storyline catalog
Category: demo
Status: code_complete
Authored: 2026-04-28
Primary agent: Atlas
Depends on: none

## Purpose

Define a single operational 30-minute Apex Retail demo story that links Programs, Source, commercial decisions, evidence posture, agent narrative, and production caveats without over-claiming live capability.

Primary question answered:

How do we demo AbarVa coherently for 30 minutes?

## Route Sequence and Story Arc (30 minutes)

1. `Home` (2 min)
- Position Apex Retail context, tenant, and objective.

2. `Programs` - `APX-CDP-2026` (6 min)
- Show active workstream, workflow state, known blockers, and next action owner.
- Narrative: program intent and commercial relevance.

3. `Program Workshop Mode` (5 min)
- Show working decisions, pending approvals, and evidence-linked rationale.
- Narrative: human-in-the-loop execution over dashboard-only observation.

4. `Source` - Apex AMS event context (8 min)
- Show event lifecycle stage, missing inputs, blocked items, and operator next action.
- Narrative: how known/missing/blocked drives confidence and timing.

5. `Intelligence` + `Control Tower` (6 min)
- Show synthesized signal, caveated recommendations, and disclosed certainty limits.
- Narrative: deterministic read model today, live/streaming maturity tomorrow.

6. `Production Readiness` close (3 min)
- Show current readiness state and explicit non-GA caveats.
- Narrative: what is production-ready now vs deferred.

## Talk Track Contract by Stop

For each stop, presenter must state:

- Known now
- Missing now
- Blocked now
- Next action (owner + intended timing)
- Deterministic vs live caveat (if applicable)

## Data and Evidence Contract

- Use only seeded/demo data currently present in product surfaces.
- Do not fabricate source evidence, approvals, or telemetry.
- If a referenced data point is absent, downgrade confidence explicitly and continue with caveated narrative.
- Seed/demo entities must map to plausible live equivalents (tenant, program, source event, artifact, decision owner).

## Demo Caveats (Must Say, Not Optional)

- This storyline uses deterministic read models where live orchestration is not yet wired.
- Some evidence and approvals are represented by seeded records.
- Production readiness and environment maturity are reported separately from demo coherence.
- No claim of full live automation, model autonomy, or production deployment should be made unless independently verified in that environment.

## Acceptance Mapping

- Workflow-oriented: yes; all stops require known/missing/blocked/next action.
- Coherent 30-minute narrative: yes; single end-to-end route with timing budget.
- Deterministic vs live honesty: yes; required caveat at each applicable stop.
- No false production/live claims: yes; explicit caveat contract and closeout framing.

## Files in This Slice

- `docs/build/slices/DEMO1_APEX_RETAIL_STORYLINE_CATALOG.md` (this artifact)
- `docs/build/build-slices.json` (DEMO1 manifest metadata update)

## Exclusions

- No runtime code changes
- No test changes
- No env/deploy changes
- No model/provider calls
