# Meridian Health Finance Analytics Depth Cluster

This proof cluster is generated to support the required finance analytics answer without relying on a thin row.

## Systems

- Oracle ERP Finance: Supports GL/AP/AR/budget/vendor spend reporting, close analytics, FP&A dashboards with operational workflow, reporting, controls, or modernization capability. Capacity: 20 interfaces or reports; 5 batch/API jobs; platform capacity and SLA require validation
- SQL Server Finance Mart: Finance reporting mart for GL/AP/AR/budget/vendor spend reporting and month-end close analytics. Capacity: Approximately 500 tables; 200 ETL jobs; 1,000 reports; 800 BI users; nightly refresh with month-end spikes
- Netezza Finance Subject Area: Legacy finance subject area for historical finance analytics and cross-domain warehouse joins. Capacity: Legacy subject area capacity and workload slots require validation; performance contention during close
- Informatica Finance ETL: Loads ERP and workforce finance data into finance marts and reconciliation feeds. Capacity: Capacity requires source extract validation
- Tableau Finance Dashboards: Finance dashboards and self-service reporting for FP&A, close, vendor spend, and budget analytics. Capacity: Capacity requires source extract validation
- Power BI Finance Workspace: Finance dashboards and self-service reporting for FP&A, close, vendor spend, and budget analytics. Capacity: Capacity requires source extract validation
- Databricks Finance Gold Data Product: Target Finance Gold Data Product for certified, governed finance analytics in the lakehouse. Capacity: Bronze/silver/gold layers not yet certified; capacity depends on AWS landing zone and Unity Catalog controls

## Data Assets

- Finance Mart GL AP AR Subject Area: Supports finance analytics across GL/AP/AR/budget/vendor spend reporting, close reconciliation, and FP&A decision support. Refresh: Nightly refresh; month-end close spike; target near-real-time certification TBD
- Vendor Spend and Contract Analytics Dataset: Supports finance analytics across GL/AP/AR/budget/vendor spend reporting, close reconciliation, and FP&A decision support. Refresh: Nightly refresh; month-end close spike; target near-real-time certification TBD
- Month-End Close Reconciliation Workbook: Supports finance analytics across GL/AP/AR/budget/vendor spend reporting, close reconciliation, and FP&A decision support. Refresh: Nightly refresh; month-end close spike; target near-real-time certification TBD
- Databricks Finance Gold Data Product: Supports finance analytics across GL/AP/AR/budget/vendor spend reporting, close reconciliation, and FP&A decision support. Refresh: Nightly refresh; month-end close spike; target near-real-time certification TBD

## Required Answer Support

Finance analytics uses Oracle ERP Finance, Workday workforce/cost-center data, SQL Server Finance Mart, Netezza Finance Subject Area, Informatica ETL, Tableau/Power BI finance dashboards, and a target Databricks Finance Gold Data Product. The generated rows explicitly include approximately 500 tables, 200 ETL jobs, 1,000 finance reports, 800 BI users, nightly refreshes, month-end close workload spikes, duplicate reports, slow dashboards, manual reconciliations, inconsistent vendor spend definitions, and incomplete lineage.
