# Meridian Runtime Module Access Proof

Generated: `2026-07-17T11:49:05.348Z`

Status: **Pass**

Active Tenant Access version: `candidate:meridian-health:7af66450ac65`

This proves Home, Intelligence, and Tower can request Meridian context through
the governed module-context serving contract. It does not write physical
Postgres tables, consume candidate data by default, alter module runtime
behavior, or claim the legacy Tower dashboard read model has been migrated.

| Module | Source mode | Records | Evidence refs | Readiness | Completeness | Candidate consumed |
| --- | --- | ---: | ---: | --- | --- | --- |
| home | active_tenant_access | 74 | 74 | agent_ready | Good | false |
| intelligence | active_tenant_access | 74 | 74 | agent_ready | Good | false |
| tower | active_tenant_access | 74 | 74 | agent_ready | Good | false |

## Truth Split

- Production tenant data written: false
- Physical Postgres tables written: false
- Candidate data consumed by default: false
- Module runtime behavior changed: false
- Tower legacy runtime mutation claimed: false
- Intelligence default ask migration claimed: false


