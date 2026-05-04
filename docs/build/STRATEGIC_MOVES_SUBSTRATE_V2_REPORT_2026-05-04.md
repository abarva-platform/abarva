# Strategic Moves · Substrate v2 report (Wave 2b)

- **Generated:** 2026-05-04T21:52:35.457Z
- **Run mode:** APPLY (committed)
- **Migrations executed:** 3
- **Total scope-leak rows (non-demo tenants stamped):** 0 ✅

## Summary, pre → post

| Metric | Pre | Post |
|---|---:|---:|
| Total demo moves | 50 | 50 |
| Prior-stamp milestones (to be replaced) | 0 | 0 |
| v2 milestones (this run) | 290 | 290 |
| Moves with a steward participant | 50 | 50 |
| Moves with team_members | — | 45 |
| milestone_completed audit rows | 80 | 80 |
| sponsor_review_held audit rows | 43 | 43 |

## Per-migration stamp counts

| # | Migration | Target table | Stamped rows | Duration |
|---|---|---|---:|---:|
| A_milestones_v2 | Milestones v2 (replacement) (replacement) | `program_milestones` | 290 | 31ms |
| B_audit_addendum | Audit log addendum | `program_audit_log` | 123 | 8ms |
| C_participants_expansion | Participants expansion | `engagement_participants` | 101 | 22ms |

## Milestones v2 per demo client

| Client | Moves | Milestones | Avg / move |
|---|---:|---:|---:|
| Apex Retail | 21 | 119 | 5.7 |
| First Capital | 9 | 55 | 6.1 |
| Keystone Energy Holdings | 6 | 34 | 5.7 |
| Meridian Health | 14 | 82 | 5.9 |

## Milestones v2 per archetype (expected 5–7 per move)

| Archetype | Moves | Milestones | Avg / move |
|---|---:|---:|---:|
| platform_modernization | 11 | 77 | 7.0 |
| ai_product_enablement | 12 | 72 | 6.0 |
| operational_optimization | 8 | 40 | 5.0 |
| (null) | 8 | 40 | 5.0 |
| strategic_transformation | 6 | 36 | 6.0 |
| workflow_automation | 5 | 25 | 5.0 |

## Scope-leak check

| # | Migration | Leaked rows |
|---|---|---:|
| A_milestones_v2 | Milestones v2 (replacement) | 0 ✅ |
| B_audit_addendum | Audit log addendum | 0 ✅ |
| C_participants_expansion | Participants expansion | 0 ✅ |

## Reversal

```sql
-- A · milestones v2 (wipes v2 stamp; optional pair with re-running the PR-4 base seed)
DELETE FROM program_milestones
WHERE description LIKE '[demo_milestones_v2_2026_05_04]%';

-- B · audit addendum
DELETE FROM program_audit_log
WHERE rationale LIKE '[demo_audit_addendum_2026_05_04]%';

-- C · participants expansion
DELETE FROM engagement_participants
WHERE notification_preferences->>'source' = 'participants_expansion_2026_05_04';
```

## Hard-rule verification

| Rule | Result |
|---|---|
| Non-destructive for unstamped data | ✅ Migration A is a replacement but scoped to stamped rows only; B + C are INSERT-only with stamp-based WHERE NOT EXISTS |
| Scoped to 5 demo clients | ✅ |
| Idempotent | ✅ A wipes its own v2 stamp before re-inserting; B and C use stamp-based NOT EXISTS |
| Deterministic | ✅ hashtext(id) + fixed per-archetype / per-phase offsets; no random() |
| Reversible | ✅ Stamped selectors per migration — see Reversal section |

