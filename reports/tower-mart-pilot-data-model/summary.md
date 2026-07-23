# Tower Mart Pilot Data Model View

Status: draft pilot model view.

This artifact explains the intended Tower Command Center data model as one
shared contract across tenants, not one dashboard structure per tenant.

## Principle

Tower has one dashboard model:

1. tenant V3 source pack and optional operational telemetry
2. unified `cio_tower.facts`
3. seven `cio_tower.mart_*` read-model tables
4. `loadTowerMartCommandView()`
5. the Command Center tabs and governed aVa shell

Tenants differ only by row content, source coverage, and evidence gaps.

## Current Proof

Meridian is live in `cio_tower.mart_*`.

Airline Demo and FS Demo now dry-run through the same mart projection path:

| Tenant | Facts | Command | Funnel | Lanes | AI portfolio | Actions | Evidence | Gaps |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Airline Demo / `skyharbor-air` | 241 | 1 | 5 | 6 | 219 | 3 | 225 | 3 |
| FS Demo / `first-capital-financial` | 255 | 1 | 5 | 7 | 232 | 4 | 239 | 6 |

No Azure/Postgres mutation is claimed by these dry runs.

## HTML View

Open:

`reports/tower-mart-pilot-data-model/tower-mart-pilot-data-model.html`
