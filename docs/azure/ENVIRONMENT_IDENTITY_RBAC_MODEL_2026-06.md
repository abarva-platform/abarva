# AbarVa Environment Identity and RBAC Model

## Purpose

This document defines the identity and access model for AbarVa's product-development environments and future client private data-plane environments before any subscription vending or broad Azure role assignment happens.

It is intentionally non-mutating. It does not assign Azure roles, create service principals, create subscriptions, or change access. It defines the standard that future Azure execution must follow.

Machine-readable companion: `docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.json`.

Verifier: `npm run azure:environment-rbac:verify`.

## Scope

Product environments:

- Product Dev
- Product Preview
- Product Prod

Client private data-plane pattern:

- Client Preprod
- Client Prod

This model applies to human operators, agent operators, managed identities, Container Apps jobs, CI/CD identities, breakglass accounts, and read-only auditors.

## Core Principles

- Least privilege first.
- Managed identity first for runtime and jobs.
- No persistent agent Owner access.
- No agent User Access Administrator access.
- Breakglass exists, but is documented, alerted, and reviewed.
- Broad RBAC changes require explicit human approval.
- Client private planes are isolated from product-development subscriptions.
- PHI is not accepted.
- PII is not accepted.
- Operator jobs must be auditable through job execution id, logs, image tag/digest, and execution ledger entry.

## Role Model

| Role                | Purpose                                           |             Persistence | Default Scope                              |
| ------------------- | ------------------------------------------------- | ----------------------: | ------------------------------------------ |
| Breakglass Owner    | Emergency recovery only                           |  Persistent but alerted | Subscription                               |
| Platform Maintainer | Routine product platform operations               |              Persistent | Resource group or constrained subscription |
| Release Operator    | Product release/deploy execution                  |               Timeboxed | Product Preview / Product Prod             |
| Data Plane Operator | Client data-plane migrations and health checks    |               Timeboxed | Client resource group                      |
| Ingestion Operator  | Governed ingestion, indexing, receipts            |               Timeboxed | Client Preprod first                       |
| Read-only Auditor   | Evidence review and health checks                 | Persistent or timeboxed | Subscription/resource group                |
| Agent Operator      | Pre-approved read-only jobs and report generation |               Timeboxed | Job/resource group limited                 |

## Environment Matrix

| Environment     | Persistent Access                      | Timeboxed Access                                        | Approval Required For                                                    |
| --------------- | -------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Product Dev     | Platform Maintainer, Read-only Auditor | Agent Operator, Release Operator                        | Broad RBAC, breakglass, subscription move                                |
| Product Preview | Platform Maintainer, Read-only Auditor | Agent Operator, Release Operator, Ingestion Operator    | Release operator elevation, traffic shift, client-approved redacted data |
| Product Prod    | Platform Maintainer, Read-only Auditor | Release Operator                                        | Production deploy, traffic shift, DNS, breakglass                        |
| Client Preprod  | Read-only Auditor                      | Data Plane Operator, Ingestion Operator, Agent Operator | Client data load, migration, index refresh                               |
| Client Prod     | Read-only Auditor                      | Data Plane Operator                                     | Any client prod data action, migration, index refresh, breakglass        |

## Agent Access Standard

Agents may prepare reports, generate commands, run local validators, and run pre-approved read-only jobs inside Azure Container Apps when the job and scope already exist.

Agents must stop for human approval before:

- creating subscriptions
- moving subscriptions between management groups
- assigning Owner or User Access Administrator
- changing DNS
- deploying to Product Prod
- shifting Product Prod traffic
- mutating Client Prod data
- running Client Prod migrations
- refreshing Client Prod indexes
- using breakglass
- creating any PHI/PII exception

Agents must never receive persistent Owner or User Access Administrator.

## Managed Identity Standard

Runtime and job access should be granted to managed identities, not laptop credentials.

Required identities:

- `aca-web-runtime`: pulls images, reads runtime secrets, writes app logs.
- `aca-operator-job`: runs private VNet jobs, reads named Key Vault secrets, connects to private data plane, writes job logs.
- `ingestion-worker`: reads staged blobs, writes governed context rows, refreshes search, writes ingestion receipts.

Managed identities must not receive Owner, User Access Administrator, or direct database administrator rights unless a separate breakglass record is approved.

## Evidence Required

Every environment must retain:

- role assignment export
- managed identity assignment export
- Key Vault RBAC/access proof
- approval record for broad or timeboxed access
- execution ledger entry
- Azure Activity Log entry
- rollback or access-removal step

## What This Does Not Do

This document does not create any Azure resources. It does not grant access. It does not change product runtime. It is the enforced access model that future provisioning and migration PRs must obey.
