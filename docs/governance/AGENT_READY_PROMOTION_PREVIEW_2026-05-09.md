# Agent-Ready Promotion Preview (PR-P1 · read-only) — 2026-05-09

> Generated 2026-05-09 (live operator-job, image sha256:eff23224) by `src/scripts/governance/promotion-preview.ts` over the
> `governed_object_readiness` sidecar. **READ-ONLY: no source rows mutated, no promotions performed.**
> Recommendations mirror `evaluateGovernedObject` / `computeProposedReadiness`. agent_ready is an
> earned, evidenced transition (PR-P2) — never automatic.

## Totals

- **Total rows evaluated: 59753**

## By recommendation

| Recommendation | Count |
|---|---:|
| remain_not_reviewed | 59753 |

## By tenant / client

| Client | Count |
|---|---:|
| corpus_global | 43593 |
| apex-retail | 6498 |
| meridian-health | 3548 |
| skyharbor-air | 3294 |
| lakeshore-holdings | 1542 |
| northstar-clinical | 878 |
| first-capital | 400 |

## By object type

| Object table | Count |
|---|---:|
| genome_patterns | 43436 |
| enterprise_context_chunks | 16063 |
| knowledge_sources | 136 |
| ai_initiatives | 81 |
| pattern_packs | 21 |
| deliverables_v2 | 16 |

## Recommendation by tenant

| Client | agent_ready | restricted | blocked | remain_not_reviewed |
|---|---:|---:|---:|---:|
| apex-retail | 0 | 0 | 0 | 6498 |
| corpus_global | 0 | 0 | 0 | 43593 |
| first-capital | 0 | 0 | 0 | 400 |
| lakeshore-holdings | 0 | 0 | 0 | 1542 |
| meridian-health | 0 | 0 | 0 | 3548 |
| northstar-clinical | 0 | 0 | 0 | 878 |
| skyharbor-air | 0 | 0 | 0 | 3294 |

## Failure reasons (why rows are not agent_ready)

| Reason | Count |
|---|---:|
| missing source_basis | 59753 |
| missing confidence_level | 59753 |
| missing provenance | 59753 |
| not retrievable (retrievability=…) | 59753 |
| not cite-render-verified end-to-end | 59753 |
| no valid applicable_agents | 59753 |

## SkyHarbor Air (tenant-specific)

- Rows: **3294**
- By recommendation:

| Recommendation | Count |
|---|---:|
| remain_not_reviewed | 3294 |

- By object type:

| Object table | Count |
|---|---:|
| enterprise_context_chunks | 3240 |
| ai_initiatives | 38 |
| deliverables_v2 | 16 |

## Top 0 rows recommended for promotion (agent_ready)

| Object table | Object id | Client | Source layer |
|---|---|---|---|
| _(none — no row currently clears the cite-render gate; expected pre-PR-P2)_ | | | |

## Top 0 blocked rows with reasons

| Object table | Object id | Client | Reason |
|---|---|---|---|
| _(none blocked)_ | | | |

## SQL / update plan PR-P2 WOULD use (NOT executed here)

Promotion is gated, stamped, reversible. For each row the evaluator returns `agent_ready`
(every required criterion true), PR-P2 runs inside a transaction, idempotent, capturing the
reverse statement first. Never promotes restricted/blocked/quarantined/PHI/PII rows.

```sql
-- forward (only rows passing ALL criteria)
UPDATE public.governed_object_readiness
   SET agent_readiness_status = 'agent_ready', policy_version = $1,
       promoted_at = now(), promoted_by_job = $2,
       promotion_reason = 'grounded, retrievable, cite-render-verified'
 WHERE id = $3 AND agent_readiness_status = 'not_reviewed'
   AND cited_render_verified_at IS NOT NULL
   AND retrievability IN ('fts_indexed','search_indexed')
   AND source_basis IS NOT NULL AND confidence_level IS NOT NULL;
-- reverse (captured per row before forward)
UPDATE public.governed_object_readiness SET agent_readiness_status = 'not_reviewed',
       promoted_at = NULL, promoted_by_job = NULL, promotion_reason = NULL WHERE id = $1;
```

`promoted_at` / `promoted_by_job` / `promotion_reason` columns are added by the PR-P2 migration;
they do not exist yet (this preview performs no DDL and no writes).
