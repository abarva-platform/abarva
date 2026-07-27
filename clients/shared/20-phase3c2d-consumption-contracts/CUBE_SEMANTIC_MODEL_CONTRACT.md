# Cube Semantic Model Contract

Status: contract only. Cube must sit on `consumption.*` views and published metric definitions. It must never query raw sources, working candidates, restricted evaluator data, hidden truth, unpublished facts, legacy module tables, old Home packs, old V6/V7 demo packs, current Tower marts, current Source operational tables or current Moves workflow tables.

## Initial domains

EnterpriseKnowledge, ApplicationPortfolio, TechnologyEstate, DataAnalyticsEstate, VendorContractPortfolio, ProgramPortfolio, RiskControlPortfolio, SourceEvent, TowerOutcomes and KnowledgeCoverage.

## Measure requirements

Every measure must declare definition, owner, SQL source, dimensions, numerator/denominator, null behavior, unit, effective period, publication version, authority minimum and evidence/readiness requirements.

## Tenant isolation

The semantic model package may be shared. Data-source configuration, credentials and network route must be tenant-bound and fail closed. Real client private planes should use a per-client semantic service unless a future approval explicitly permits another isolation model.
