# Tower Standardized v1 Template Schema

This package is file-only and reversible. It does not mutate source files, databases, ACA jobs, or deployments.

## Naming convention

- snake_case only
- Units are explicit: _usd, _pct, _count
- Period is explicit where relevant: _fy26, _ytd, _monthly
- Fixed spend_category vocabulary: labor, vendor_license, cloud_infra, si_services, not_applicable
- Fixed amount_type vocabulary: opex, capex, run, change, none
- Fixed view vocabulary: it_budget, vendor_contract, app_run_cost, org_budget, initiative_budget, value
- Fixed basis vocabulary: committed, actual, forecast
- Fixed period vocabulary: fy26, ytd, monthly

## Canonical outputs

- Standardized source copies preserve original grain and add source_file, source_row, value_source.
- Key Tower files are mapped to canonical schemas: F12, T08, T01, T07, F17, F14.
- Each tenant also gets derived/tower_financial_amounts.csv, a normalized governance ledger for financial amounts.

## Holding company / portfolio-company fields

For holding-company tenants, Tower templates must preserve the entity spine on every row that can be sliced in the dashboard:

- entity_id
- entity_name
- entity_scope
- parent_entity_id
- parent_entity_name
- portfolio_company_id
- portfolio_company_name

Use entity_scope = holdco for the parent corporate entity and entity_scope = portfolio_company for operating companies. Corporate shared-service systems should stay attached to the holdco entity and list the served portfolio companies. OpCo-local systems, initiatives, owners, vendors, and budget rows should stay attached to the relevant portfolio company. Tower must not infer this hierarchy from display names.

## Governance rule

Every dollar row in derived/tower_financial_amounts.csv answers: what type am I, which view am I authoritative in, what am I a component or aggregate of, and where did I come from.

## Real Client Capture Guidance

See REAL_WORLD_CAPTURE_GUIDE.md and REAL_WORLD_CAPTURE_GUIDE.csv. These files explain how each synthetic/demo field should be captured in a real client scenario, which source systems usually provide it, and what Tower must do when it is missing.
