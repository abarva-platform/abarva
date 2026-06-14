# Product Preview IaC Scaffold

Status: scaffold-ready, not deployed

Product Preview is an AbarVa product/control-plane release-candidate environment. It is not Client Preprod.

## Parameter Placeholders

- environment key: `product-preview`
- subscription id: `<product-preview-subscription-id-after-approval>`
- region: `eastus`
- required tags from `docs/azure/PRODUCT_PREVIEW_PROVISIONING_PACKET_2026-06.json`
- budget placeholder: monthly Product Preview budget
- RBAC group placeholders: platform maintainer, release operator, breakglass
- policy assignment placeholders: public access denial, required tags, diagnostics, private endpoints for data services
- Key Vault placeholder: environment-scoped, managed identity access
- diagnostics/logging placeholder: Log Analytics, health proof, release-candidate evidence

## Data Boundary

Synthetic, pilot-reference, and client-approved redacted data only. No PHI. No PII. No raw client private documents.

## Deployment Rule

This scaffold does not deploy. Use Product Preview what-if and release-candidate gates before any approved mutation.
