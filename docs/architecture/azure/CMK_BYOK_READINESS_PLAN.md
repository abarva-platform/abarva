# CMK/BYOK Readiness Plan

Status: architecture plan only
Owner: AbarVa founder / architecture
Release lane: global-control-lane
Last updated: 2026-06-03

## Purpose

This document is the readiness path for customer-managed keys (CMK) and bring-your-own-key (BYOK) support in AbarVa. It exists so AbarVa can answer enterprise security reviews truthfully without building a premature key-management feature before a customer requires it.

The current product posture remains:

- **Encryption at rest:** provided by Azure-managed service encryption where Azure services are used.
- **Customer key custody today:** available through the customer-owned Private Data Plane model, where the customer owns the Azure subscription and Key Vault.
- **Managed SaaS BYOK:** planned, not implemented, and not to be claimed as supported until the gates in this plan pass.

## Vocabulary

| Term | Meaning in AbarVa |
|---|---|
| Microsoft-managed keys | Default Azure service-managed encryption keys. This is the current managed-SaaS posture unless a service-specific CMK binding is implemented. |
| CMK | Customer-managed key used by an Azure service for encryption at rest. The key usually lives in Azure Key Vault or Managed HSM. |
| BYOK | Customer brings/imports key material or controls the key lifecycle. In AbarVa, this includes customer-created keys in a customer-owned Key Vault. |
| Key custody | The party that can create, disable, rotate, recover, or destroy the key that protects customer data. |
| Cryptographic erasure | Rendering data unreadable by disabling/deleting key material, subject to service backup and retention constraints. |

## Two Supported Readiness Lanes

### Lane 1: Customer-Owned Private Data Plane

This is the first supported enterprise key-custody path.

| Capability | Readiness posture |
|---|---|
| Subscription | Customer-owned Azure subscription. |
| Key Vault | Customer-owned Key Vault or Managed HSM. |
| Data stores | Customer-owned Postgres, Blob/ADLS, search/index services, logs, and backups. |
| AbarVa access | No standing Key Vault access. Any support access is just-in-time, role-scoped, time-boxed, and customer audited. |
| Data boundary | Raw client data remains inside the customer subscription. Control plane receives only approved manifests, metadata, or excerpts allowed by the customer contract. |
| Claim allowed today | AbarVa has a documented private data-plane key-custody architecture. |
| Claim not allowed today | AbarVa has completed live customer BYOK deployment and operational proof. |

### Lane 2: Managed SaaS BYOK

This remains planned until implemented and tested.

| Capability | Required before support claim |
|---|---|
| Storage | Azure Storage account encrypted with a customer-managed key for customer content containers, with private endpoint access and diagnostic logs. |
| Database | Database service supports customer-managed key binding for the customer data plane, including backup and restore behavior. |
| Search/index | Any customer-content index uses a CMK-capable service and key binding. |
| Model gateway | No key material is sent to model providers. Provider-side data retention and no-training terms remain separately documented. |
| Audit | Every key lifecycle event relevant to AbarVa data is captured in customer-visible logs or AbarVa audit evidence. |
| Support | Runbooks exist for key rotation, key disable, accidental disable recovery, customer offboarding, incident response, and emergency read-only posture. |

## Target Azure Services

| AbarVa surface | Azure service | CMK/BYOK readiness note |
|---|---|---|
| Object uploads and evidence files | Azure Storage Blob / ADLS Gen2 | Use customer-managed keys for storage-account or scoped encryption where available. Require private endpoint, public network disabled, soft delete, versioning, and immutable audit settings where contractually required. |
| Tenant relational data | Azure Database for PostgreSQL Flexible Server or customer-selected Postgres target | Confirm CMK support, backup encryption behavior, geo-replication constraints, and restore procedure before claiming BYOK. |
| Retrieval indexes | Azure AI Search or customer-owned search target | Confirm CMK support for indexes containing customer-derived content. Separate shared public corpus indexes from tenant/customer indexes. |
| Secrets and signing material | Azure Key Vault / Managed HSM | Use RBAC authorization, purge protection, soft delete, private endpoint, diagnostic settings, and named key owners. |
| App/runtime access | Managed Identity | Runtime identity receives least-privilege access to keys/secrets; no client secret literals in app settings. |
| Logs and audit | Log Analytics, Activity Log, Diagnostic Settings, optional Microsoft Sentinel | Capture Key Vault key operations, denied access, key disable/delete, storage/database/search diagnostics, and deployment changes. |
| Policy enforcement | Azure Policy / Defender for Cloud | Enforce private endpoints, no public data stores, Key Vault purge protection, diagnostics, approved regions, and CMK-required policies for BYOK tenants. |

## Readiness Gates

Do not mark managed SaaS BYOK as supported until every gate below is green for a representative tenant.

| Gate | Acceptance evidence |
|---|---|
| Key ownership | Named customer key owner exists; key lifecycle owner is not AbarVa. |
| Key protection | Soft delete and purge protection enabled; public network access disabled unless a time-boxed exception is approved. |
| Private access | Runtime reaches Key Vault and data stores through private endpoints or approved private network path. |
| Service binding | Blob, database, and search/index services containing customer content are actually bound to the CMK. |
| Rotation | Planned rotation completes without data loss; application returns to healthy state without hardcoded key references. |
| Disable test | Disabling the key blocks reads/writes as expected and raises alerts. |
| Restore test | Re-enabling/restoring key access returns service to healthy state inside the documented RTO. |
| Backup/restore | Backup encryption, restore, geo-restore, and PITR constraints are documented and tested. |
| Observability | Diagnostic logs capture key read/use failures, key lifecycle changes, and service encryption status changes. |
| Offboarding | Customer data deletion and key revocation path is documented, including backup retention limits. |
| Support runbook | Support can triage key-disabled, key-rotated, permission-denied, and private-DNS failure scenarios without asking for customer secrets. |
| Security review | `docs/security/INFOSEC-ACCELERATOR.md` updated with exact status and PR evidence. |

## Implementation Sequence

1. **Contract first.** Record the customer requirement in the SoW or security addendum: lane, key owner, affected data classes, regions, recovery expectations, support model, and whether cryptographic erasure is required.
2. **Private Data Plane default.** If the customer needs key custody from day one, use the customer-owned Private Data Plane lane before attempting managed SaaS BYOK.
3. **Service inventory.** Enumerate every customer-content store: Blob/ADLS, Postgres, Search, audit logs, parse cache, generated artifacts, backups, and exports.
4. **Key design.** Decide one key per customer, per environment, or per service. Default recommendation: per customer and environment; split by service only if the customer requires separate duties.
5. **IaC module.** Add parameters for Key Vault URI, key name, key version policy, managed identity principal id, and diagnostic workspace id. Do not place key material in repo, environment files, PR comments, logs, or release records.
6. **Smoke tests.** Add automated checks that prove service encryption is configured, private endpoint DNS resolves, runtime identity can use the key, and key disable behaves as expected.
7. **Operational drill.** Run rotation, accidental disable, and offboarding drills before declaring the lane supported.
8. **Security-doc update.** Update customer-facing security posture docs only after evidence exists.

## Customer Questionnaire Answer

Use this wording until managed SaaS BYOK is implemented:

> AbarVa encrypts data at rest using Azure-managed encryption by default. For customers that require direct key custody from day one, AbarVa supports a customer-owned Private Data Plane architecture where the customer owns the Azure subscription, Key Vault, logs, and data stores. Managed SaaS customer-managed keys are on the architecture roadmap and will not be represented as supported until the storage, database, search, logging, key lifecycle, and support-readiness gates are complete.

## What Not To Claim

- Do not claim managed SaaS BYOK is live.
- Do not claim cryptographic erasure unless backup, PITR, replica, cache, and generated-artifact behavior has been tested.
- Do not claim AbarVa never accesses data in all deployment modes; this is true for the customer-owned Private Data Plane raw-data boundary, not for every managed SaaS workflow.
- Do not promise per-record or per-file keys until the data model and cost/latency impact are explicitly designed.
- Do not store or paste customer key material into GitHub, Vercel, `.env`, logs, screenshots, spreadsheets, or support tickets.

## Open Implementation Backlog

| ID | Work item | Done when |
|---|---|---|
| CMK-1 | IaC parameter contract for customer Key Vault and key identifiers | Bicep/Terraform plan accepts customer key references without key material and validates required RBAC. |
| CMK-2 | Storage CMK binding smoke | Test proves Blob/ADLS encryption scope or account-level CMK is active for customer-content containers. |
| CMK-3 | Database CMK proof | Test proves customer-data database encryption and restore behavior under CMK constraints. |
| CMK-4 | Search/index CMK proof | Customer-derived index is bound to CMK-capable search service and separated from public corpus indexes. |
| CMK-5 | Rotation and disable drill | Automated or operator-run script records pass/fail evidence for rotate, disable, restore, and alerting. |
| CMK-6 | Support runbook | Runbook covers key-disabled, permission-denied, private-DNS failure, accidental purge request, and offboarding. |
| CMK-7 | Security posture promotion | `docs/security/INFOSEC-ACCELERATOR.md` updates EKM-02 from planned only after implementation evidence exists. |

## References

- `docs/architecture/adr/ADR-0012-cmk-byok-readiness.md`
- `docs/architecture/azure/AZLAB9-scale-test-foundation-baseline.md`
- `docs/architecture/azure/AZLAB7-private-data-plane-design.md`
- `docs/security/INFOSEC-ACCELERATOR.md`
