# Security Questionnaire Canonical Answers

Status: draft for security review reuse
Owner: AbarVa platform owner
Last updated: 2026-06-02
Backlog row: T018

## Purpose

This document is the canonical answer pack for SIG Lite, CAIQ Lite, vendor-risk,
and customer security questionnaires. Use it as the first-pass source before a
customer-specific response is drafted.

It is a self-assessment, not a SOC 2, ISO 27001, HIPAA, or CSA certification.
Answers must stay tied to repository evidence and should not be strengthened
unless the evidence exists for the customer, deployment lane, and date in
question.

## Response Rules

- Do not claim completed private data-plane, BYOK, SOC 2, third-party pen-test,
  SIEM streaming, SAST/DAST, or customer-specific retention evidence unless the
  customer packet includes that proof.
- Use `clients` / `client_id` vocabulary for new schema-facing responses.
- Describe Azure Container Apps as the current shared SaaS control-plane
  runtime and Azure/Postgres as the data-plane adapter target. Do not describe
  Vercel as a current production runtime.
- Say "planned" or "partial" where the evidence is a runbook, lab, backlog item,
  or target posture rather than a live customer control.
- Link the public `/subprocessors`, `/responsible-ai`, `/model-card`, and
  `/known-limitations` pages when a reviewer asks for customer-visible trust
  material.

## Canonical Answers

| Topic                     | Standard answer                                                                                                                                                                                                       | Status                                         | Evidence                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product scope             | AbarVa is an enterprise decision-support platform for AI and business-program governance. It is not intended to process PHI, full PII, payment-card numbers, bank-account numbers, or regulated personal identifiers. | In place                                       | `docs/security/INFOSEC-ACCELERATOR.md`, `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`                                                                                      |
| Customer data boundary    | Client-scoped facts, records, evidence, retrieval chunks, and persistence should flow through data-plane adapters rather than direct application-tier storage calls.                                                  | In place / cutover ongoing                     | `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`, `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`, `src/lib/data-plane/read-adapters/resolveDataPlane.ts`  |
| Control-plane hosting     | The shared SaaS control plane is a Next.js application deployed on Azure Container Apps. It owns routing, rendering, Clerk sessions, release behavior, and orchestration.                                             | In place                                       | `Dockerfile`, `docs/deployment/migrations.md`, `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_DNS_CUTOVER.md`                                                                   |
| Private data-plane option | AbarVa has an Azure private data-plane target and lab/runbook evidence. Customer-specific private lanes require a separate provisioned evidence pack before they are represented as live.                             | Partial / customer-specific                    | `docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md`, `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`, `docs/architecture/azure/PILOT-PRIVATE-DATA-LANE-RUNBOOK-2026-05-22.md` |
| Authentication            | Clerk handles authentication, sessions, organizations, MFA capability, and role metadata. Most app routes require a Clerk session.                                                                                    | In place                                       | `AGENTS.md`, `src/proxy.ts`, `docs/pilot/SECURITY_POSTURE.md`                                                                                                                              |
| SSO                       | Enterprise SSO is handled through Clerk organization/federation configuration when contracted. Production customer SSO must be evidenced per customer before being marked complete.                                   | Planned / customer-specific                    | `docs/pilot/TENANT_SETUP_RUNBOOK.md`, `AGENTS.md`                                                                                                                                          |
| Authorization             | Route and API access are guarded through middleware, role checks, tenant access helpers, and data-plane/broker boundaries. Missing or mismatched tenant context should deny access rather than fall through.          | In place / continually tested                  | `src/proxy.ts`, `src/lib/auth/tenant-access.ts`, `src/lib/auth/access-routing.ts`                                                                                                          |
| Row-level isolation       | Per-user and tenant-scoped RLS are part of the data-tier isolation posture. Several documents still mention legacy Supabase-era proof; new runtime work should use Azure/Postgres data-plane adapters.                | In place / adapter migration ongoing           | `docs/architecture/adr/ADR-0004-per-user-rls.md`, `docs/security/RLS-REGRESSION-RUNBOOK.md`, `AGENTS.md`                                                                                   |
| Data-access broker        | App-tier AI and retrieval code must go through `AgentContextBroker`; direct imports of EnterpriseDataRoom/vector/graph data paths are disallowed by architecture doctrine.                                            | In place                                       | `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`, `docs/ip/defensive-publications/2026-06-02-agent-context-broker-boundary-contract.md`                                   |
| AI decisioning            | AbarVa provides AI-assisted decision support. It does not make final business, procurement, financial, legal, employment, healthcare, credit, insurance, safety, or regulated decisions.                              | In place                                       | `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`, `docs/architecture/adr/ADR-0006-ai-as-advisor.md`, public `/responsible-ai` page                                                             |
| Human approval            | Consequential actions should have a human decision owner, explicit approval, justification, and evidence packet. Some module retrofits remain in progress and must be scoped honestly.                                | Partial / expanding                            | `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`, `src/lib/ai-liability/human-decision-controls.ts`, `docs/releases/records/2026-06-01-ai-liability-controls.md`                            |
| Model providers           | Anthropic and OpenAI may be used for governed LLM inference, drafting, reasoning, and embeddings where enabled. Optional services degrade gracefully when provider keys are absent.                                   | Optional / configured by path                  | `AGENTS.md`, `src/app/api/chat/agent/route.ts`, `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`                                                                                               |
| No model training         | Contract language and provider configuration should state that customer data is not used to train foundation models unless a separate written agreement says otherwise.                                               | Required contract posture                      | `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`, `docs/security/INFOSEC-ACCELERATOR.md`                                                                                      |
| Upload data restrictions  | Live client files require legal/data-use readiness, upload attestation, sensitive-data screening, and quarantine handling for prohibited or suspected regulated data.                                                 | Partial / stronger private lane planned        | `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`, `docs/security/B5b-PURVIEW-INTEGRATION-DESIGN.md`, `src/lib/security/sensitive-upload-guard.ts`                             |
| Encryption in transit     | Azure Container Apps managed ingress provides public TLS for the control plane. Azure/Postgres code paths configure SSL for non-local Postgres connection strings unless SSL is explicitly disabled.                  | In place with hardening item                   | `docs/security/encryption-posture.md`, `src/lib/data-plane/postgresCompat.ts`, `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`                                              |
| Encryption at rest        | Storage and database encryption are inherited from the relevant cloud services. Managed-SaaS BYOK is not generally available unless separately implemented and evidenced.                                             | In place / BYOK planned                        | `docs/security/encryption-posture.md`, `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`                                                                                           |
| Secrets management        | Server secrets are environment-driven and must not be committed. Azure lab evidence exists for Key Vault projection into Container Apps.                                                                              | In place / customer-specific evidence required | `docs/security/encryption-posture.md`, `docs/deployment/DOCKER_RUNTIME_PACKAGING.md`, `docs/architecture/azure/AZLAB20-app-parallel-runtime-smoke.md`                                      |
| Logging and audit         | The product has security, release, and AI-control evidence foundations. Full customer SIEM streaming and self-service export are planned or customer-specific.                                                        | Partial                                        | `docs/security/INFOSEC-ACCELERATOR.md`, `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`, `docs/releases/RELEASE_CONTROL_POLICY.md`                                                            |
| Incident response         | Incident-response foundations exist in repo documentation and security modules, but named customer runbooks and external notification commitments should be contract-specific.                                        | Partial                                        | `docs/pilot/SUPPORT-MODEL.md`, `docs/security/INFOSEC-ACCELERATOR.md`                                                                                                                      |
| Business continuity       | Azure Container Apps revisions are image-based and rollback-capable. Database PITR and backup posture depend on the selected data-plane deployment and require customer-lane evidence.                                | Partial / deployment-specific                  | `docs/pilot/SECURITY_POSTURE.md`, `docs/security/encryption-posture.md`, `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`                                                         |
| Change management         | Production changes are managed through GitHub PRs, CI, release records for release-relevant changes, Azure image/revision rollout, and post-deploy QA evidence.                                                       | In place                                       | `AGENTS.md`, `docs/releases/RELEASE_CONTROL_POLICY.md`, `.github/workflows/`, `docs/deployment/migrations.md`                                                                              |
| CI and QA gates           | Current CI includes release control, secret scanning, migration drift, hygiene, lint/typecheck, accessibility, browser matrix, bundle, Lighthouse, and other guardrails.                                              | In place                                       | `.github/workflows/`, `docs/runbooks/browser-matrix-smoke.md`, `docs/releases/records/2026-06-02-browser-matrix-smoke.md`                                                                  |
| Dependency security       | CI runs npm audit reporting and secret scanning. Full SAST/DAST and formal vendor security review are still not certified as complete unless a later release record proves them.                                      | Partial                                        | `docs/pilot/SECURITY_CONTROLS_MATRIX.md`, `.github/workflows/`, `docs/releases/records/2026-06-01-secret-scanning.md`                                                                      |
| Subprocessors             | The public subprocessor/service-provider inventory is published at `/subprocessors`. Customer contracts can narrow the provider set.                                                                                  | In place                                       | `src/app/(public)/subprocessors/page.tsx`, `src/lib/public-site/subprocessors-content.ts`, `docs/releases/records/2026-06-02-subprocessors-public-page.md`                                 |
| SOC 2 / ISO certification | AbarVa is not currently claiming SOC 2 Type 1/2 or ISO 27001 certification. Use current self-assessment and roadmap language only.                                                                                    | Planned                                        | `docs/pilot/SECURITY_CONTROLS_MATRIX.md`, `docs/security/INFOSEC-ACCELERATOR.md`                                                                                                           |
| Third-party pen-test      | Self-audit and regression evidence exist. Independent third-party pen-test should be scheduled before first production contract and cannot be claimed complete today.                                                 | Planned                                        | `docs/security/INFOSEC-ACCELERATOR.md`, `docs/security/RLS-REGRESSION-RUNBOOK.md`                                                                                                          |
| Customer deletion         | Customer deletion is supported operationally; self-service deletion UI and per-customer retention/deletion evidence are planned/customer-specific.                                                                    | Partial                                        | `docs/security/INFOSEC-ACCELERATOR.md`, `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`                                                                                      |
| Data export               | Audit and evidence export capabilities are emerging across modules. Treat any customer-export claim as module-specific unless the route and tests are cited.                                                          | Partial                                        | `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`, `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`                                                                                              |

## Common Buyer Questions

### Are you SOC 2 certified?

No. AbarVa currently provides self-assessment evidence, release-control records,
security posture documentation, and CI/security gates. SOC 2 Type 1 and Type 2
should be described as planned unless a later auditor report exists.

### Can AbarVa process PHI or regulated PII?

Not by default. The standard product posture is to reject or quarantine
suspected PHI/PII and regulated personal identifiers. If a customer needs that
scope, it requires a separate legal, security, and private-data-lane decision.

### Where does customer data live?

For shared SaaS pilots, the control plane runs on Azure Container Apps and
client-scoped persistence should route through Azure/Postgres data-plane
adapters. For customer private lanes, Azure remains the target data plane and
each customer lane requires its own resource, network, key, retention, and
smoke-test evidence pack.

### Do model providers train on customer data?

The required product and contract posture is no customer-data training by model
providers unless a separate written agreement says otherwise. Customer-specific
contracts should include that term before live client files are loaded.

### Can we opt out of optional services?

Yes, where the service is optional and not required for the contracted product
path. Email, analytics, billing, and model-provider choices should be finalized
in the order form, DPA, or security exhibit.

## Required Attachments For A Security Review

- `docs/security/INFOSEC-ACCELERATOR.md`
- `docs/pilot/SECURITY_CONTROLS_MATRIX.md`
- `docs/security/encryption-posture.md`
- `docs/security/REFERENCE_ARCHITECTURE_SECURITY_REVIEW_DECK.md`
- `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`
- `docs/legal/contract-redline-brief.md`
- Public `/subprocessors`, `/responsible-ai`, `/model-card`, and
  `/known-limitations` pages.

## Known Gaps

The following should remain explicit in questionnaires until later evidence
exists:

- SOC 2 and ISO 27001 certification are not complete.
- Independent third-party pen-test is not complete.
- Managed-SaaS BYOK is not generally available.
- Customer-specific private data-plane lanes need per-lane evidence.
- Full SAST/DAST and customer SIEM streaming are not broadly complete.
- Self-service deletion, audit-log export, and retention evidence are still
  module- or customer-specific.
