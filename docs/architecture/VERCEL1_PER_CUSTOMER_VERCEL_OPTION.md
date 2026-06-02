# VERCEL1 - Per-Customer Vercel Deployment Option

Slice ID: VERCEL1
Document type: Architecture / premium deployment option
Status: candidate
Authored: 2026-06-02
Release lane: internal-admin
Type: Specification / contract document only. No application code, no runtime
modification, no migrations, no infrastructure-as-code, no provisioning.

This document records the premium option to run AbarVa's current Vercel-hosted
control plane as a per-customer Vercel project. It does not change the default
deployment posture in ADR-0007: shared Vercel control plane, Azure/Postgres
client data-plane adapters, and private data-plane work only where separately
contracted and implemented.

---

## 1. Purpose

Some enterprise customers may accept an AbarVa-managed SaaS control plane, but
still require stronger operational separation than the default shared Vercel
project provides. The per-customer Vercel option gives that customer a
dedicated Vercel project and deployment environment while preserving the same
product codebase, release governance, and data-plane adapter boundaries.

This option is useful when the customer needs:

- a dedicated app runtime project for security review or procurement;
- customer-specific preview, staging, and production URLs;
- project-scoped Vercel environment variables and deployment history;
- project-scoped Vercel logs and observability evidence;
- customer-specific release windows or deployment approvals;
- a dedicated custom domain and SSO callback posture;
- a cleaner audit packet showing which app deployment served that customer.

## 2. What This Option Is Not

Per-customer Vercel hosting is not the same thing as a private data plane.

It does not, by itself:

- move client records, evidence, retrieval chunks, or audit rows into the
  customer's Azure subscription;
- provide customer-owned keys, Key Vault custody, private endpoints, or BYOK;
- replace the Azure/Postgres data-plane adapters;
- make the customer responsible for operating the AbarVa application;
- satisfy Tier 3 or Tier 4 requirements without the separate private-data or
  self-managed deployment work.

The option is a premium control-plane isolation mode. Data-plane residency,
storage, model egress, audit retention, and key custody are still governed by
the customer's selected deployment tier.

## 3. Target Topology

| Surface | Default shared Vercel | Per-customer Vercel option |
| --- | --- | --- |
| Codebase | One AbarVa repository | Same repository |
| Vercel project | Shared AbarVa project | Dedicated AbarVa-managed project per customer |
| Domains | Shared app domain and previews | Customer-specific preview and production domains |
| Environment variables | Shared project scopes | Project-scoped customer environment inventory |
| App runtime | Shared Vercel deployment | Customer-dedicated Vercel deployment |
| Auth callbacks | Shared Clerk/route posture | Customer-specific callback allowlist where needed |
| Data plane | Tier-dependent | Tier-dependent; not implied by Vercel isolation |
| Logs and deploy history | Shared project evidence | Customer-specific project evidence |
| Release process | Standard release train | Standard release train with customer window option |

The dedicated project should still deploy the same application artifact from
the same release-controlled repository. Divergent customer forks are out of
scope unless a future ADR approves them.

## 4. Tier Mapping

| Deployment tier | Relationship to per-customer Vercel |
| --- | --- |
| Tier 1 - Shared SaaS | Default. One shared Vercel project serves many customers. |
| Tier 2 - Dedicated Tenant | Eligible premium option. Dedicated Vercel project can pair with dedicated AbarVa-managed data and gateway namespaces. |
| Tier 3 - Private Data Plane | Optional control-plane enhancement only. Client data-plane work remains separate and must be proven in Azure/private-lane gates. |
| Tier 4 - Self-Managed | Not the target. Tier 4 means the customer operates the stack, not AbarVa-managed per-customer Vercel. |

## 5. Required Readiness Gates Before Offering

A per-customer Vercel project should not be sold or activated as a production
control plane until these gates exist as runbook evidence:

1. Tenant registry mapping from `client_id` to the target Vercel project,
   domain, Clerk organization or IdP binding, and data-plane route.
2. Project-scoped environment inventory covering Clerk, database/data-plane
   routing, model provider keys or gateway configuration, Resend, Stripe,
   PostHog, and any feature flags used by the customer.
3. SSO callback and allowed-origin review for the customer-specific production
   and preview domains.
4. Data-plane routing proof that customer content still flows through the
   adapter boundary and does not persist in the Vercel control plane.
5. Release promotion runbook covering preview, staging if used, production,
   customer approval, and rollback.
6. Observability evidence showing how Vercel project logs, deployment records,
   app events, and customer support packets are separated.
7. Branch protection and release record evidence for any code change that
   affects the customer project.
8. Disaster recovery and rollback references linked to the customer project.
9. Admin ownership model naming who can rotate env vars, approve production
   deploys, view logs, and disable the project in an incident.
10. Contract language making clear whether the customer bought control-plane
    isolation only, a dedicated data plane, or a private data plane.

## 6. Operating Model

AbarVa operates the per-customer Vercel project unless a future self-managed
contract says otherwise. The customer may own DNS approval, SSO configuration,
security review, and production change-window approval. AbarVa owns the app
runtime, release artifacts, deployment execution, incident response, rollback,
and evidence packet generation.

The operating model should preserve one release train. Customer-specific
deployment timing is allowed, but customer-specific source edits are not part of
this option.

## 7. Decision Matrix

| Option | Best fit | Tradeoff |
| --- | --- | --- |
| Shared Vercel control plane | Pilots and standard SaaS customers | Lowest operational burden, weakest app-project isolation |
| Per-customer Vercel project | Premium SaaS customers needing app-runtime and evidence separation | More env, domain, log, and deployment operations |
| Azure private data plane | Regulated customers needing customer-cloud data custody | Larger implementation and customer-platform dependency |
| Fully self-managed | Customers requiring complete operational ownership | Highest customer burden and separate release packaging |

## 8. Rollback and Exit

The fastest rollback from a per-customer Vercel deployment should be project
promotion rollback inside Vercel when the customer remains on that project. If
the issue is specific to the dedicated project configuration, the fallback is a
controlled return to the shared SaaS project only when the contract, data-plane
routing, DNS, SSO callbacks, and tenant isolation evidence allow it.

Offboarding should revoke custom domains, rotate customer-specific secrets,
disable project deployments, preserve contracted audit evidence, and disconnect
the tenant registry mapping.

## 9. References

- `AGENTS.md`
- `Dockerfile`
- `vercel.ts`
- `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`
- `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md`
- `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md`
- `docs/architecture/TEN3_DEDICATED_TENANT_DEPLOYMENT_BLUEPRINT.md`
- `docs/deployment/DOCKER_RUNTIME_PACKAGING.md`
- `docs/deployment/migrations.md`
- `docs/runbooks/disaster-recovery.md`
- `docs/runbooks/rollback.md`
