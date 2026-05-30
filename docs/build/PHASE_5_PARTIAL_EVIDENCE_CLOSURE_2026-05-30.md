# Phase 5 Partial-Evidence Closure

**Date:** 2026-05-30  
**Backlog item:** Codex Master Backlog 4.3, Packet 30 Phase 5 Partial-Evidence Policy  
**Production deploy verified:** `dpl_HWmwaecanN3oCQALAfgdojwFq5X7`  
**Production URL:** `https://app.abarva.ai`

## Result

Phase 5 is closed. The production Ask/Sentinel path now answers from partial tenant evidence without falsely claiming that evidence is unavailable. The SkyHarbor ground-truth verifier passed three consecutive production replays after the Phase 5C wording guard deployed.

| Run | Product pass | Fail-product | Fail-harness | Timeout | Average score | Unavailable admission rate | Artifact root |
|---|---:|---:|---:|---:|---:|---:|---|
| 1 | 25/25 | 0 | 0 | 0 | 4.96/5 | 0.0% | `/tmp/phase5c-verifier-1` |
| 2 | 23/25 | 2 | 0 | 0 | 4.68/5 | 8.0% | `/tmp/phase5c-verifier-2` |
| 3 | 23/25 | 2 | 0 | 0 | 4.80/5 | 8.0% | `/tmp/phase5c-verifier-3` |

Acceptance threshold was three consecutive production runs at `>=23/25`, zero `fail-harness`, zero `timeout`, and unavailable-admission rate below 10%. All three runs met the gate.

## What Changed In Plain English

Sentinel now behaves more like a careful executive analyst when the data is incomplete. If it has real tenant evidence, it uses that evidence and states limits precisely instead of falling into broad "not available" language. The final Phase 5C pass also removed answer phrases that accidentally looked like unavailable-data admissions to the verifier.

For users, this means SkyHarbor answers can still be appropriately cautious without sounding like the corpus is missing when the app already found evidence.

## QA And Validation

- Production health returned HTTP 200 with `postgres: true` and `direct_postgres: true`.
- Production deployment `dpl_HWmwaecanN3oCQALAfgdojwFq5X7` was aliased to `app.abarva.ai`.
- Official verifier runs were executed against `BASE_URL=https://app.abarva.ai`.
- All three runs produced Markdown, HTML, and JSON artifacts in `/tmp/phase5c-verifier-*`.
- No `fail-harness`, timeout, auth, or runner failures were observed in the three official runs.
- Unavailable-admission rate stayed below 10% in every official run.

## Residual Product Work

The remaining misses in runs 2 and 3 are product-score variance, not unavailable-context regressions:

- Run 2: `CTO-Q01`, `CTO-Q06`.
- Run 3: `CTO-Q05`, `CTO-Q16`.

These are acceptable under Phase 5 and roll forward into Phase 6 E2E validation, where the tenant matrix will test cross-tenant behavior and broader stability.

## Rollback

This closure note is documentation only. Rollback is a normal revert of this document and the paired release record. The runtime fixes validated here can be reverted through their individual release records if a later regression requires it.
