# AbarVa Environment Factory Baseline

## Purpose

This document turns the three-environment operating model into an executable subscription factory baseline. It applies to AbarVa product development environments first, and to each future client private data plane when a pilot or production client is provisioned.

The machine-readable companion is `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`. The verifier is `npm run azure:environment-factory:verify`.

## Product Development Subscriptions

AbarVa product development uses three distinct Azure subscriptions:

| Environment     | Subscription role     | Primary purpose                                                  | Data rule                                                 |
| --------------- | --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| Product Dev     | `product-development` | Fast engineering integration and non-client experimentation      | synthetic, fixture, engineering-test only                 |
| Product Preview | `product-preprod`     | Release-candidate validation, signed-in QA, pilot-demo readiness | synthetic, pilot-reference, client-approved-redacted only |
| Product Prod    | `product-production`  | Shared product control plane for approved releases               | production control-plane metadata only                    |

Product Prod must not become a client private data plane. Client private documents, raw client source files, and client-specific retrieval stores belong in client subscriptions.

## Client Private Data-Plane Pattern

Each pilot or production client receives two distinct Azure subscriptions:

| Environment    | Subscription role | Purpose                                                                        |
| -------------- | ----------------- | ------------------------------------------------------------------------------ |
| Client Preprod | `client-preprod`  | Client validation, ingestion rehearsal, retrieval proof, acceptance testing    |
| Client Prod    | `client-prod`     | Client private production data plane and production retrieval/runtime evidence |

This keeps AbarVa product delivery agile while preventing product development resources from becoming a mixed client-data estate.

## Hard Data Rules

- PHI is not accepted.
- PII is not accepted.
- Business names and emails are not treated casually. Production defaults to title/role-first org charts. Named executives require client-approved business-contact classification, source basis, confidence, and tenant scope.
- Synthetic data is a reference showcase, not a shortcut path. Synthetic reference tenants should use the same governed templates and Admin bulk/load processes expected from pilot clients.
- Uploads must produce ingestion receipts: original source, parser used, row/page/sheet/cell citation where applicable, committed facts/chunks, search indexing, retrieval proof, and context-bundle trace when agent use is claimed.
- `agent_ready` is never auto-promoted by ingestion. It is earned after policy validation, retrievability, citation-render proof, and the governed promotion workflow.

## Required Subscription Baseline

Every subscription created by the factory must start with:

- Azure Policy assignments for no public blob access, no public Postgres, no public Key Vault, required private endpoints for data services, required tags, required budgets, diagnostic settings, and purge protection.
- Managed identities for runtime and operator jobs.
- Least-privilege RBAC, with agent/operator access time-boxed and auditable.
- Private networking for data services, private DNS, and VNet-integrated Container Apps jobs where private DB/search access is required.
- Log Analytics, Application Insights, activity-log alerts, and budget alerts.

## Required Promotion Gates

Before any release moves toward Product Prod or a client Prod data plane, the PR/runbook must show:

- release record
- production-readiness gate
- context/corpus governance gate
- no Vercel production-runtime automation
- runtime Supabase guard
- tenant-purity guard
- fresh migration replay
- destructive migration guard
- ingestion receipt or explicit no-data-change statement
- signed-in browser QA
- context-bundle trace for agent surfaces
- rollback plan
- budget policy check

## Operating Model After Cutover

Developers keep speed by working in small, additive PRs with strong automated gates. Product Dev remains fast and forgiving for engineering iteration, Product Preview becomes the real release-candidate proving ground, and Product Prod receives only evidence-backed releases. Client Preprod and Client Prod are provisioned from the same factory baseline so pilots do not become one-off infrastructure projects.

The rule is simple: move quickly in Product Dev, prove in Product Preview, release carefully to Product Prod, and keep every client private data plane isolated.
