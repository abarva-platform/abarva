# Meridian Health - Finance Analytics Semantic Proof

## Pain Points

- Month-end close dashboards slow down because 38 priority reports refresh from five SQL Server finance schemas during the same overnight load window.
- Vendor spend differs across AP, procurement, and contract repository extracts, so sourcing questions need a reconciled vendor-master rule before Source uses the data.
- FP&A trusts 42 certified dashboards, but business-unit teams still use 300+ Excel extracts copied from legacy Tableau views.
- Informatica job failures are resolved manually because the finance mart lacks clear lineage from Oracle ERP subledger jobs to report-level consumers.
- Databricks Finance Gold is the target path, but cost-center hierarchy, vendor master harmonization, and audit signoff are unresolved.

## Evidence Items

- Oracle ERP Finance GL/AP/AR extract as of 2026-06 synthetic close cycle.
- SQL Server Finance Mart schema inventory showing GL, AP, AR, budget, vendor spend, and cost-center schemas.
- Informatica finance ETL inventory with 200 nightly jobs and close-window failure notes.
- Tableau and Power BI finance dashboard inventory with certified vs shadow-report split.
- Finance Gold Data Product design notes for Databricks target certification.

## Metrics

- Close report refresh completion by 6:00 AM CT
- Certified finance dashboard adoption
- Manual reconciliation hours per close cycle

## Data Quality / Performance Issues

- inconsistent vendor spend definitions
- slow close-window dashboards
- incomplete lineage from ERP to BI

## Modernization Dependencies

- Databricks Finance Gold certification
- vendor master harmonization
- cost-center hierarchy stewardship

## Gate

PASS
