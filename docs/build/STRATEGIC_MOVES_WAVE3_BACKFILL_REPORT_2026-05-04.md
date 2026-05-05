# Strategic Moves · Wave 3 backfill report (artifact spine)

- **Generated:** 2026-05-05T00:22:26.879Z
- **Run mode:** APPLY (committed)
- **Migrations executed:** 3
- **Scope-leak rows (3a, non-demo tenants stamped):** 0 ✅

## Summary, pre → post

| Metric | Pre | Post |
|---|---:|---:|
| Total demo moves | 50 | 50 |
| Total deliverables_v2 (demo) | 541 | 733 |
| Moves with zero deliverables | 20 | 0 |
| engagement_deliverables total | 12 | 12 |
| engagement_deliverables with engagement_id | 0 | 0 |

## Per-migration detail

| # | Migration | Target | Stamped / status | Duration |
|---|---|---|---|---:|
| 3a | deliverables_v2 backfill (20 zero-coverage moves) | `deliverables_v2` | 192 stamped rows | 14ms |
| 3b | engagement_deliverables engagement_id column | `engagement_deliverables` | column added ✅ | 6ms |
| 3c | move_artifact_index VIEW | `move_artifact_index` | 765 rows in view ✅ | 8ms |

## 3a · deliverables_v2 backfill per demo client

| Client | Moves | New deliverables | Avg / move |
|---|---:|---:|---:|
| Apex Retail | 21 | 83 | 4.0 |
| First Capital | 9 | 36 | 4.0 |
| Keystone Energy Holdings | 6 | 24 | 4.0 |
| Meridian Health | 14 | 49 | 3.5 |

## 3c · move_artifact_index distribution (demo clients)

| Artifact type | Count |
|---|---:|
| deliverable | 733 |
| attachment | 16 |
| evidence | 16 |

## Scope-leak check

| Migration | Leaked rows |
|---|---:|
| 3a deliverables_v2 backfill | 0 ✅ |
| 3b engagement_deliverables | n/a (DDL only) |
| 3c move_artifact_index | n/a (VIEW only) |

## Reversal

```sql
-- 3c (must drop first since it depends on 3b column)
DROP VIEW IF EXISTS move_artifact_index;

-- 3b
ALTER TABLE engagement_deliverables DROP COLUMN IF EXISTS engagement_id;

-- 3a
DELETE FROM deliverables_v2
WHERE title LIKE '[wave3a_2026_05_04]%';
```

## Hard-rule verification

| Rule | Result |
|---|---|
| Non-destructive | ✅ 3a is INSERT-only with stamp; 3b is ADD COLUMN IF NOT EXISTS; 3c is CREATE OR REPLACE VIEW |
| Scoped to 5 demo clients | ✅ |
| Idempotent | ✅ 3a uses WHERE NOT EXISTS on stamp; 3b uses ADD COLUMN IF NOT EXISTS; 3c uses CREATE OR REPLACE |
| Deterministic | ✅ hashtext(engagement_id || type_key) for ordering; no random() |
| Reversible | ✅ Stamped selectors per migration — see Reversal section |

