# Enterprise IT Landscape Template Pack v1

Purpose: capture enough technical, financial, operational, and ownership detail for a large enterprise context layer to reason like a CIO/CTO/CFO infrastructure review, not just an application inventory.

These files are templates, not loaded seed data. Keep the header rows intact and fill one row per system, workload, hosting environment, integration, contract, or control. Do not upload raw secrets, IP addresses, PHI/PII, credentials, or unmasked hostnames unless the governed client data process explicitly permits that classification.

## Minimum Intake Set

1. `01_application_system_inventory.template.csv`
2. `02_hosting_and_platform_topology.template.csv`
3. `03_workload_volumetrics.template.csv`
4. `04_infrastructure_estate.template.csv`
5. `05_integration_and_dataflow_topology.template.csv`
6. `06_system_cost_and_budget.template.csv`
7. `07_resilience_security_controls.template.csv`
8. `08_data_platform_and_storage.template.csv`

## Why This Exists

The application portfolio tells us what software exists. It does not prove where it runs, what volumes it carries, how it is architected, what it costs, or what breaks if it moves. This template pack closes that gap by collecting:

- Business function and owner accountability.
- Hosting model: on-prem, colocation, private cloud, public cloud, SaaS, managed service, mainframe.
- Compute architecture: x86, ARM, mainframe, Kubernetes, VMware, Linux, Windows, Unix, database appliances.
- Data center and private cloud footprint.
- Volumetrics: users, transactions, jobs, interfaces, data size, growth, SLA windows.
- System/function budget: run cost, license, infra, labor, cloud, storage, network, depreciation, project spend.
- Resilience, DR, security zone, control owner, and audit evidence.

## Load Rule

Rows from these templates should not be called "loaded" until the product loader accepted them, source files were registered, facts/chunks were committed with tenant/client id, embeddings/search were refreshed where applicable, and tenant-scoped QA can retrieve the facts.
