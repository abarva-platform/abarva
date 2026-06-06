# SkyHarbor Reset/Load Pass - 07 Post-Load Verification

Created: 2026-06-06

## Post-Load Verdict

Not run. No real load was executed.

## Required Verification Matrix

| Verification | Expected after successful load | Observed this pass |
|---|---|---|
| `clients` row for `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | 1 | not checked; DB unreachable |
| `enterprise_context_source_files` for `skyharbor-air` | either 0 with loader skip explanation or 1 if upstream FK rows exist | not checked; DB unreachable |
| `enterprise_context_chunks` for `skyharbor-air` | 3,240 | not checked; DB unreachable |
| Main tenant chunks | 480 | not checked; DB unreachable |
| Airline overlay chunks | 2,760 | not checked; DB unreachable |
| `applications` for client id | 92 | not checked; DB unreachable |
| `ai_initiatives` for client id | 38 | not checked; DB unreachable |
| `vendor_contracts` for client id | 52 | not checked; DB unreachable |
| Embedding status | all embedded or intentionally pending with reason | not checked; no load |
| `ai_egress_audit` | rows only if embedding calls executed | not checked; no load |
| Retrieval smoke | Sentinel returns SkyHarbor-specific citations | not run |
| Tenant isolation | no Apex/Meridian/Lakeshore bleed | not run |

## SQL To Run From Private Runtime

```sql
select count(*) from clients where id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select count(*) from enterprise_context_chunks where tenant_key = 'skyharbor-air';
select source_segment_id, count(*) from enterprise_context_chunks where tenant_key = 'skyharbor-air' group by source_segment_id order by 2 desc;
select embedding_status, count(*) from enterprise_context_chunks where tenant_key = 'skyharbor-air' group by embedding_status;
select count(*) from applications where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select count(*) from ai_initiatives where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select count(*) from vendor_contracts where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
```
