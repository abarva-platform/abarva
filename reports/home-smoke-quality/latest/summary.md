# Home Full Smoke And Content Quality Audit

Generated: `2026-07-14T16:15:07.231Z`

Status: **Home full smoke/content QA passed**

This audit is read-only. It does not mutate tenant data, promote candidates, update Active Tenant Access, change module runtime behavior, or treat candidate data as default Home truth.

## Coverage

- Tenants audited: 6
- Dimensions audited: 42
- Tabs audited: 210
- aVa prompts tested: 10
- P0/P1/P2: 0 / 0 / 0

## Tenant Results

| Tenant | Key | Source mode | Records | Relationships validated/candidate | Browser | aVa | Verdict |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| SkyHarbor Air | skyharbor-air | active_tenant_access | 60 | 0 / 0 | tested | tested | pass |
| Meridian Health | meridian-health | active_tenant_access | 62 | 0 / 0 | skipped (No signed-in storageState found locally.) | skipped | pass |
| Apex Retail | apex-retail | active_tenant_access | 58 | 0 / 0 | skipped (No signed-in storageState found locally.) | skipped | pass |
| First Capital Financial | first-capital-financial | active_tenant_access | 58 | 0 / 0 | skipped (No signed-in storageState found locally.) | skipped | pass |
| Lakeshore Holdings | lakeshore-holdings | active_tenant_access | 58 | 0 / 0 | tested | tested | pass |
| Lakeshore Industries | lakeshore-industries | active_tenant_access | 66 | 0 / 0 | skipped (No dedicated signed-in automation persona is available yet. Server/module-context proof is still required.) | skipped | pass |

## Highest-Risk Findings

- None

## Truth Split

- Server/module-context proof runs for all registry-active tenants listed here.
- Browser proof runs only where signed-in storageState/personas are available.
- Lakeshore Industries is intentionally server/module-context proof only until a dedicated automation persona exists.
- Home is not CXO-ready if P0 issues are present. P1/P2 items are watch/polish/remediation backlog unless they reflect product-truth risk.
