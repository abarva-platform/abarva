# Product Prod IaC Scaffold

Status: scaffold-ready, not deployed

Product Prod is the shared AbarVa product/control-plane production environment. It is not a client private data-plane environment.

## Parameter Placeholders

- environment key: `product-prod`
- subscription id: `<product-prod-subscription-id-after-approval>`
- region: `eastus`
- required tags from `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.json`
- budget placeholder: monthly Product Prod budget
- RBAC group placeholders: platform maintainer, release operator, breakglass
- policy assignment placeholders: public access denial, required tags, diagnostics, private endpoints for data services
- Key Vault placeholder: environment-scoped, managed identity access
- rollback placeholder: previous revision or pinned digest

## Data Boundary

Approved product control-plane data only. No PHI. No PII. No client private production data. No raw client private documents.

## Deployment Rule

This scaffold does not deploy. Product Prod requires Product Preview evidence, explicit public cutover approval, and rollback readiness.
