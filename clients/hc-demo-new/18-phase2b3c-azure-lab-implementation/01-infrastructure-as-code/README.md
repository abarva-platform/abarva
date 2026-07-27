# Infrastructure-as-Code Gate

No IaC apply is generated in this package because the approved manifest does not freeze resource group, VNet, subnet, Container Apps environment, or Log Analytics names.

The next PR should add these exact values to the approved manifest, then create a plan-only IaC artifact that provisions:

- private PostgreSQL Flexible Server `pg-abarva-hc-demo-new-lab-eus-001`;
- database `abarva_hc_demo_new_knowledge_lab`;
- private storage account `stabhcdemonewlab001` with required containers;
- Key Vault `kv-abarva-hcdn-lab-001`;
- Service Bus `sb-abarva-hcdn-lab-001`;
- managed identities `mi-hcdn-ingest-lab-001`, `mi-hcdn-publish-lab-001`, `mi-hcdn-read-lab-001`, `mi-hcdn-admin-lab-001`;
- Container Apps jobs from `03-container-app-jobs/JOB_STAGE_MAP.csv`;
- private endpoints, private DNS, diagnostic settings, and workload logs.

Plan-only must pass before any apply.
