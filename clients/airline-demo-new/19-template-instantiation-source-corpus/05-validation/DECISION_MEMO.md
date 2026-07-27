# Decision Memo: Airline Demo New Source Corpus Design

## Recommendation

Hold this package as the Airline Demo New template instantiation and source-corpus design candidate. It reuses the universal Knowledge factory and creates a tenant-specific airline + technology-procurement population plan without copying completed tenant data, but independent semantic audit found P0 issues that must be remediated before treating it as the frozen synthetic-source foundation.

## What changed

- Created a tenant-specific Airline Demo New package under `clients/airline-demo-new/19-template-instantiation-source-corpus/`.
- Instantiated universal enterprise templates, airline overlay, technology-procurement overlay, field dictionary, interview architecture, KPI catalog, relationship dictionary, source request list and parity matrix.
- Defined separate operational and restricted evaluator storage reservations and a dedicated database reservation.
- Documented hidden truth, parser-visible source corpus and restricted crosswalk separation.

## What did not happen

No Azure resource was provisioned. No database was created. No migration was applied. No parser was run. No source file was loaded. No product runtime or module read model was changed.

## Next gate

Remediate the independent semantic audit blockers, regenerate the affected source samples, then rerun semantic review before any governed Azure job is run.

## Scale-depth correction

The package now models a large global-carrier-style technology estate, not just a sourcing event. It includes 1,495 applications/platforms, 6,200 integrations, 1,250 data products/stores, 6,200 BI reports, 10,000 infrastructure/cloud/mainframe rows, 420 vendors, 820 active contracts/SOWs and 60,000 relationship candidates. This gives Source a credible enterprise backdrop for supplier decisions.
