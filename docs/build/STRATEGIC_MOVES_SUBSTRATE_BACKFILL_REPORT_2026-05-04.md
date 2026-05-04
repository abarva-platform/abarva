# Strategic Moves · Substrate backfill report (Wave 2)

- **Generated:** 2026-05-04T21:02:53.265Z
- **Run mode:** APPLY (committed)
- **Migrations executed:** 4
- **Total scope-leak rows (non-demo tenants stamped):** 0 ✅

## Coverage, pre → post

| Metric | Pre | Post | Δ |
|---|---:|---:|---:|
| Moves with program_archetype | 42/50 | 42/50 | +0 |
| Moves with a sponsor participant | 50/50 | 50/50 | +0 |
| Moves with a lead (approver) participant | 50/50 | 50/50 | +0 |
| Moves with at least 1 milestone | 50/50 | 50/50 | +0 |
| Moves with at least 1 audit log entry | 50/50 | 50/50 | +0 |

## Per-migration stamp counts

| # | Migration | Target table | Stamped rows | Duration |
|---|---|---|---:|---:|
| A_archetype | Archetype backfill | `engagements` | 12 | 5ms |
| B_participants | Participants top-up | `engagement_participants` | 83 | 21ms |
| C_milestones | Milestones backfill | `program_milestones` | 234 | 6ms |
| D_audit | Audit log activity stub | `program_audit_log` | 306 | 6ms |

## Per-client coverage (post)

| Client | Moves | Archetype | Sponsor | Lead | Milestones | Audit |
|---|---:|---:|---:|---:|---:|---:|
| Apex Retail | 21 | 19/21 | 21/21 | 21/21 | 21/21 | 21/21 |
| First Capital | 9 | 8/9 | 9/9 | 9/9 | 9/9 | 9/9 |
| Helix Therapeutics | 0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 |
| Keystone Energy Holdings | 6 | 4/6 | 6/6 | 6/6 | 6/6 | 6/6 |
| Meridian Health | 14 | 11/14 | 14/14 | 14/14 | 14/14 | 14/14 |

## Archetype distribution (post)

| Archetype | Moves |
|---|---:|
| ai_product_enablement | 12 |
| platform_modernization | 11 |
| operational_optimization | 8 |
| (null) | 8 |
| strategic_transformation | 6 |
| workflow_automation | 5 |

## Scope-leak check (non-demo tenants stamped)

| # | Migration | Leaked rows |
|---|---|---:|
| A_archetype | Archetype backfill | 0 ✅ |
| B_participants | Participants top-up | 0 ✅ |
| C_milestones | Milestones backfill | 0 ✅ |
| D_audit | Audit log activity stub | 0 ✅ |

## Reversal

Each migration is reversible via a single stamped-selector statement:

```sql
-- A · archetype backfill
UPDATE engagements
SET program_archetype = NULL,
    baseline_metrics = baseline_metrics - 'archetype_backfill_source' - 'archetype_backfilled_at'
WHERE baseline_metrics->>'archetype_backfill_source' = 'name_heuristic_2026_05_04';

-- B · participants top-up
DELETE FROM engagement_participants
WHERE notification_preferences->>'source' = 'participants_topup_2026_05_04';

-- C · milestones backfill
DELETE FROM program_milestones
WHERE description LIKE '[demo_milestones_backfill_2026_05_04]%';

-- D · audit log stub
DELETE FROM program_audit_log
WHERE rationale LIKE '[demo_audit_stub_2026_05_04]%';
```

## Hard-rule verification

| Rule | Result |
|---|---|
| Non-destructive | ✅ All four migrations are INSERT/UPDATE-on-NULL only; no existing data modified |
| Scoped to 5 demo clients | ✅ |
| Idempotent | ✅ All WHERE clauses filter already-stamped or non-empty rows |
| Deterministic | ✅ All randomness derived from hashtext(id) or fixed offsets; no random() |
| Reversible | ✅ Stamped selectors per migration — see reversal section |

