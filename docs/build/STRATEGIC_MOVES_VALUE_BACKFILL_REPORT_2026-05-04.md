# Strategic Moves · Value-at-stake backfill report

- **Generated:** 2026-05-04T20:48:53.454Z
- **Run mode:** APPLY (committed)
- **Migration:** `supabase/migrations/20260504200000_strategic_moves_demo_value_backfill.sql`
- **Source tag:** `strategic_moves_demo_value_backfill_2026_05_04`
- **Scope leak check (non-demo tenants stamped):** 0 ✅

## Per-client breakdown

| Client | Moves | Projection coverage (pre → post) | Verified coverage (pre → post) | Backfilled this run | Σ projected low | Σ projected high | Σ verified |
|---|---:|---:|---:|---:|---:|---:|---:|
| Apex Retail | 21 | 21/21 → 21/21 | 3/21 → 3/21 | 21 | $177.20M | $388.30M | $28.80M |
| First Capital | 9 | 9/9 → 9/9 | 2/9 → 2/9 | 9 | $93.20M | $199.10M | $30.00M |
| Helix Therapeutics | 1 | 0/1 → 0/1 | 0/1 → 0/1 | 0 | $0 | $0 | $0 |
| Keystone Energy Holdings | 6 | 6/6 → 6/6 | 0/6 → 0/6 | 6 | $45.90M | $104.10M | $0 |
| Meridian Health | 14 | 14/14 → 14/14 | 2/14 → 2/14 | 14 | $159.70M | $337.70M | $40.80M |

**Portfolio totals:** 50 moves backfilled · Σ projected $476.00M – $1.03B · Σ verified $99.60M.

## Archetype distribution after the name-heuristic pass

| Effective archetype | Source | Moves | Σ projected low | Σ projected high |
|---|---|---:|---:|---:|
| (null-after-heuristic) | default | 8 | $40.50M | $96.80M |
| ai_product_enablement | name_heuristic | 3 | $27.80M | $62.60M |
| operational_optimization | name_heuristic | 1 | $6.00M | $13.90M |
| platform_modernization | name_heuristic | 3 | $30.50M | $63.70M |
| strategic_transformation | name_heuristic | 5 | $117.20M | $234.40M |
| ai_product_enablement | program_archetype | 9 | $71.10M | $160.30M |
| operational_optimization | program_archetype | 7 | $41.10M | $95.80M |
| platform_modernization | program_archetype | 8 | $100.90M | $210.10M |
| strategic_transformation | program_archetype | 1 | $21.40M | $42.80M |
| workflow_automation | program_archetype | 5 | $19.50M | $48.80M |

## Defaulted rows (archetype heuristic fell through, used $5M–$12M band)

| Move | Client | Phase | Projected low | Projected high |
|---|---|---:|---:|---:|
| 8.1 · Enterprise systems | Apex Retail | P4 | $3.80M | $9.00M |
| Apex Intelligent Store Operations and Inventory Accuracy - E2E 2026-05-02 | Apex Retail | P6 | $5.70M | $13.60M |
| 8.2 · Program: Wealth Acquisition Integration Diagnostic | First Capital | P4 | $6.20M | $14.80M |
| 9.1 · Engagement zero — Phase 0 Intake (notional, for test drive) | Keystone Energy Holdings | P4 | $6.20M | $14.90M |
| 9.2 · Forward state placeholder initiatives | Keystone Energy Holdings | P4 | $5.20M | $12.50M |
| 8.1 · Program: Physician Compensation Redesign | Meridian Health | P4 | $3.80M | $9.10M |
| 8.2 · Program: Health Plan Member Experience Diagnostic | Meridian Health | P4 | $5.50M | $13.10M |
| Meridian Value-Based Care Progression Diagnostic | Meridian Health | P0 | $4.10M | $9.80M |

## Top 5 highest-projected moves

| # | Move | Client | Phase | Archetype (effective) | Projected low | Projected high | Verified |
|---:|---|---|---:|---|---:|---:|---:|
| 1 | Meridian Ambient Documentation Vendor Strategy | Meridian Health | P0 | strategic_transformation | $24.90M | $49.80M | — |
| 2 | 8.1 · Program: Commercial Lending Analytics Strategy | First Capital | P4 | strategic_transformation | $24.90M | $49.80M | — |
| 3 | 9.2 · Program: Digital Personalization Strategy | Apex Retail | P4 | strategic_transformation | $24.60M | $49.20M | — |
| 4 | Meridian Ambient Documentation Vendor Strategy | Meridian Health | P1 | strategic_transformation | $24.10M | $48.20M | — |
| 5 | Clinical Documentation AI Governance | Meridian Health | P0 | strategic_transformation | $21.40M | $42.80M | — |

## Bottom 5 lowest-projected moves

| # | Move | Client | Phase | Archetype (effective) | Projected low | Projected high | Verified |
|---:|---|---|---:|---|---:|---:|---:|
| 1 | Fraud Detection Modernization | First Capital | P2 | workflow_automation | $3.30M | $8.20M | — |
| 2 | Store Associate Productivity | Apex Retail | P1 | workflow_automation | $3.40M | $8.60M | — |
| 3 | 8.1 · Enterprise systems | Apex Retail | P4 | (null) | $3.80M | $9.00M | — |
| 4 | 8.1 · Program: Physician Compensation Redesign | Meridian Health | P4 | (null) | $3.80M | $9.10M | — |
| 5 | Returns Fraud Detection | Apex Retail | P3 | workflow_automation | $3.70M | $9.30M | — |

## Reversal

If any part of this backfill needs to be undone, the following **single statement** fully reverses it. It is safe to re-run (no-op if nothing is stamped).

```sql
UPDATE engagements
SET
  value_projected_low_usd  = NULL,
  value_projected_high_usd = NULL,
  value_verified_usd       = NULL,
  value_verified_status    = NULL,
  value_assumptions_jsonb  = NULL
WHERE value_assumptions_jsonb->>'source' = 'strategic_moves_demo_value_backfill_2026_05_04';
```

## Hard-rule verification

| Rule | Check | Result |
|---|---|---|
| Non-destructive | Only rows with `value_projected_high_usd IS NULL` updated | ✅ (`WHERE` clause in migration step 2) |
| Scoped to 5 demo clients | No rows outside demo clients stamped | ✅ |
| Idempotent | Re-run would be no-op (no rows match `value_projected_high_usd IS NULL` AND demo-client anymore) | ✅ (structural) |
| Deterministic | All values derived from `hashtext(id)` and archetype; no `random()` in migration | ✅ (inspected) |
| Reversible | Single stamped `source` key; reversal SQL above | ✅ |

