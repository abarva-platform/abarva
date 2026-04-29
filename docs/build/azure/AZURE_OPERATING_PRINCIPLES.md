# Azure Operating Principles

## Scope
Applies to `abarva-lab-sub` and associated lab RGs until superseded by a production governance document.

## Principles
1. Synthetic data only in lab subscription.
2. No client data, no Accenture data, no production secrets ever in this subscription.
3. Single region for lab is East US; production region strategy is deferred to a separate decision record.
4. All resources must be tagged per `docs/build/azure/AZURE_TAGGING_POLICY.md`.
5. Bicep is the authorized provisioning path; ad hoc portal-created resources are not accepted for production-bound environments.
6. Soft-delete and purge protection are mandatory for every production Key Vault.
7. Diagnostic settings from every critical resource must route to the observability Log Analytics workspace.

## Implementation Notes
- This lab currently keeps Key Vault purge protection disabled to support controlled teardown/rebuild cycles.
- That lab exception is not transferable to production.
- Where an Azure service needs preview APIs for a feature, document the exception explicitly before merge.

## Operational Discipline
- Every infra change requires a runbook update and post-deployment validation evidence.
- Rollback instructions must be present before deployment execution.
- Identity/RBAC changes must follow least-privilege and be reviewed before apply.
