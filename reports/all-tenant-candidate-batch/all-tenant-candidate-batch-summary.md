# All-Tenant Candidate Batch Dry-Run

Generated: `2026-07-12T00:00:00.000Z`

This report is non-destructive. It does not write production tenant data, update
active tenant access, promote candidates, write physical tables, change module
runtime behavior, make modules read candidate data by default, or claim realized
value.

## Rollup

- Tenants scanned: 7
- Eligible tenants: 1
- Partially eligible tenants: 3
- Blocked tenants: 3
- Not enough evidence tenants: 0
- Source packs found: 66
- Candidate records generated: 53
- Planned target operations: 106
- Unmapped fields: 18
- Quarantined records: 0
- Stranded intelligence records: 107

## Tenant Eligibility

<!-- prettier-ignore -->
| Tenant | Readiness | Source packs | Candidate metadata | Source shadow | Moves shadow | Candidate records | Target ops | Blockers |
| --- | --- | ---: | --- | --- | --- | ---: | ---: | --- |
| skyharbor-air | eligible | 12 | eligible | eligible | not_available | 53 | 106 | Promotion execution is disabled by default in PR9.; Operator approval has not been requested or granted.; Active Tenant Access Layer pointer update remains unavailable in this release.; Module runtime consumption remains unchanged and disabled for candidate data.; No module reads candidate data by default. |
| lakeshore-holdings | partially_eligible | 12 | blocked | blocked | not_available | 0 | 0 | Required packet projection and mapping profile configuration is not available yet.; Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added. |
| meridian-health | partially_eligible | 12 | blocked | blocked | not_available | 0 | 0 | Required packet projection and mapping profile configuration is not available yet.; Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added. |
| first-capital | blocked | 12 | blocked | blocked | not_available | 0 | 0 | No Moves artifacts discovered in the repository inventory.; Required packet projection and mapping profile configuration is not available yet.; Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added. |
| apex-retail | partially_eligible | 12 | blocked | blocked | not_available | 0 | 0 | Required packet projection and mapping profile configuration is not available yet.; Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added. |
| northstar | blocked | 4 | blocked | blocked | not_available | 0 | 0 | No Moves artifacts discovered in the repository inventory.; Required packet projection and mapping profile configuration is not available yet.; Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added. |
| morgan-street | blocked | 2 | blocked | blocked | not_available | 0 | 0 | Morgan Street appears as a Lakeshore operating-unit access boundary, not as a standalone candidate packet.; No standalone Tenant Packet manifest or candidate mapping profile is available yet. |

## Top Blockers

- Current all-tenant batch is inventory/remediation only for this tenant until packet projection and mapping profiles are added. (5)
- Required packet projection and mapping profile configuration is not available yet. (5)
- No Moves artifacts discovered in the repository inventory. (2)
- Active Tenant Access Layer pointer update remains unavailable in this release. (1)
- Module runtime consumption remains unchanged and disabled for candidate data. (1)
- Morgan Street appears as a Lakeshore operating-unit access boundary, not as a standalone candidate packet. (1)
- No module reads candidate data by default. (1)
- No standalone Tenant Packet manifest or candidate mapping profile is available yet. (1)

## Top Remediation Actions

- Add tenant-specific source adapter mapping profiles. (6)
- Create a standardized Tenant Packet manifest for this tenant. (6)
- Map discovered source files to canonical source classes. (6)
- Re-run the dry-run after missing evidence classes are supplied. (6)
- Add or link Moves artifacts for current strategic initiatives. (3)
- Add or link Tower value baseline and outcome metric evidence. (1)
- Keep SkyHarbor inactive until a future explicit operator promotion gate is enabled. (1)
- Run Moves shadow proof before active promotion preview. (1)
