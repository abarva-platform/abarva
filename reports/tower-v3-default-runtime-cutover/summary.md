# Tower V3 Default Runtime Cutover Proof

Verdict: PASS

## What Changed

Meridian default Tower tabs now classify as v3 context-derived or v3 projection-derived. The old `cio_tower` read model remains bridge fallback / diagnostics only.

## Counts

- Metric records: 140
- Value records: 79
- Value claims: 79
- Evidence refs: 410
- Context gaps: 410
- Executive insights: 4

## Tab Classification

- Overview: tower_context_pack_v3_derived (219 rows) — v3 context-derived measurement and readiness view
- Value: tower_projection_v3_derived (8 rows) — value hypotheses from active v3 program context
- Budget: tower_projection_v3_derived (24 rows) — spend and value signals from v3 spend/value context
- Portfolio: tower_projection_v3_derived (79 rows) — program and initiative records from active v3 context
- Benchmark: tower_context_pack_v3_derived (6 rows) — benchmark context and blocker themes only
- Evidence: tower_context_pack_v3_derived (820 rows) — evidence refs, context gaps, and claim gates from TowerContextPack
- Insights: tower_projection_v3_derived (4 rows) — role-specific executive insights derived from the same v3 pack

## Claim Gate

- Allowed: 0
- Caveated: 79
- Blocked: 0
- Unsupported outcome-language hits: 0

## Browser Proof

Not run in this deterministic audit. Do not claim signed-in proof until the deployed Meridian route is crawled.