# Product Dev IaC Scaffold

Status: scaffold-ready, not deployed

Product Dev is an AbarVa product/control-plane environment for fast engineering integration and non-client experimentation.

## Parameter Placeholders

- environment key: `product-dev`
- subscription id: `<product-dev-subscription-id-after-approval>`
- region: `eastus`
- required tags from `docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.json`
- budget placeholder: monthly Product Dev budget
- RBAC group placeholders: platform maintainer and breakglass
- policy assignment placeholders: public access denial, required tags, diagnostics
- Key Vault placeholder: environment-scoped, managed identity access
- diagnostics/logging placeholder: Log Analytics and activity logs

## Data Boundary

Synthetic, fixture, and engineering-test data only. No PHI. No PII. No client private raw documents.

## Deployment Rule

This scaffold does not deploy. Run validation-only packet checks first and pause for approval before any Azure mutation.
