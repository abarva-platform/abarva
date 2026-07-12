# Tenant Candidate Eligibility Matrix

This inventory is non-destructive. It does not perform all-tenant active promotion, write
production tenant data, update active tenant access, or change module runtime consumption.

<!-- prettier-ignore -->
| Tenant | Source packs found | Source data | Moves data | Tower data | Required mappings | Candidate generation status | Blockers |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| skyharbor-air | 12 | true | true | true | true | passed | None |
| lakeshore-holdings | 12 | true | true | true | false | inventory_only | Required packet projection and mapping profile configuration is not available yet.; PR10 inventories this tenant only; full candidate generation remains future work. |
| meridian-health | 12 | true | true | true | false | inventory_only | Required packet projection and mapping profile configuration is not available yet.; PR10 inventories this tenant only; full candidate generation remains future work. |
| first-capital | 12 | true | false | true | false | inventory_only | No Moves artifacts discovered in the repository inventory.; Required packet projection and mapping profile configuration is not available yet.; PR10 inventories this tenant only; full candidate generation remains future work. |
| apex-retail | 12 | true | true | true | false | inventory_only | Required packet projection and mapping profile configuration is not available yet.; PR10 inventories this tenant only; full candidate generation remains future work. |
| northstar | 4 | true | false | true | false | inventory_only | No Moves artifacts discovered in the repository inventory.; Required packet projection and mapping profile configuration is not available yet.; PR10 inventories this tenant only; full candidate generation remains future work. |
