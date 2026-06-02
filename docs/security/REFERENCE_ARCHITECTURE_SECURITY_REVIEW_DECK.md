# AbarVa Reference Architecture Deck For Security Reviews

Status: security-review ready draft
Audience: CISO, security architect, enterprise architecture, third-party risk
Backlog task: T050 - Build reference architecture deck for security reviews

Use this as a 15-slide leave-behind or as the source for a PowerPoint build.
It is intentionally written for security review, not a product demo. Claims
must stay aligned with `docs/security/INFOSEC-ACCELERATOR.md`,
`docs/architecture/adr/`, `docs/releases/records/`, and the current release
tracker.

## Slide 1 - Architecture Position

Message:
AbarVa is a tenant-grounded decision operating system with a shared SaaS
control plane and a client-scoped private data-plane target for enterprise
context, evidence, retrieval, and governed AI workflows.

Show:
- Control plane: app shell, identity handoff, workflow, release controls.
- Data plane: customer-scoped storage, database, parser, retrieval, audit.
- Agent plane: Sentinel, Nexus, Source, Atlas, and Steward mediated through a
  broker boundary.

Speaker note:
Do not position AbarVa as a generic document chatbot. The security model is
based on scoped context assembly, evidence receipts, and human-controlled
decisions.

## Slide 2 - Trust Boundaries

Message:
The architecture separates identity, app workflow, tenant data, model calls,
and audit evidence so each boundary can be reviewed independently.

Show:
- Browser and user session.
- Next.js application tier.
- Clerk identity and organization metadata.
- AgentContextBroker.
- Tenant data stores and retrieval adapters.
- Model providers.
- Release and audit evidence.

Speaker note:
The buyer should be able to ask which boundary owns each risk: authentication,
authorization, retrieval, model use, data retention, or release control.

## Slide 3 - Plane Model

Message:
AbarVa separates shared product behavior from tenant-owned or tenant-scoped
data operations.

Show:
- SaaS control plane: Next.js app, product workflows, governance metadata,
  release controls.
- Private data-plane target: Azure Blob Storage, Azure Postgres, Azure AI
  Search, Key Vault, processing jobs.
- Model plane: governed LLM calls with broker-mediated context.

Speaker note:
Private data-plane implementation remains a pilot-readiness workstream. The
deck should make the target architecture clear without claiming every target
capability is already live for each client.

## Slide 4 - Identity And Access

Message:
Access starts with authenticated identity, then narrows through tenant, role,
surface, and data-layer controls.

Show:
- Clerk authentication.
- Organization and role metadata.
- Admin, operator, and viewer paths.
- SAML/OIDC and SCIM as enterprise pilot configuration targets.
- Per-user and tenant-scoped data access.

Speaker note:
Be explicit about dependencies. Enterprise SSO requires coordination with the
customer identity-provider team and production Clerk configuration.

## Slide 5 - Tenant Isolation

Message:
Tenant isolation is enforced at route, broker, and data-layer boundaries, not
only in prompt text.

Show:
- Server-side tenant resolution.
- No URL/body tenant rebinding.
- Broker-scoped tenant key.
- Row-level security and tenant filters where data-backed paths are wired.
- Regression tests and CI checks.

Speaker note:
The important promise is deny-by-default behavior: missing, unknown, or
unauthorized tenant context should produce a blocked or denied response rather
than synthetic fallback content.

## Slide 6 - Agent Context Broker Boundary

Message:
Application surfaces retrieve agent context through the broker boundary rather
than directly importing data-room, tenant-data, vector, graph, or retrieval
internals.

Show:
- Surface request.
- `AgentContextBroker` / context broker.
- Typed context bundle.
- Evidence citations and warnings.
- Agent prompt and tool policy.

Speaker note:
Reference `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`.
The dependency-cruiser architecture boundary enforces this import discipline in
CI.

## Slide 7 - Data Ingestion And Processing

Message:
Customer content should enter through governed upload, validation, parse,
approval, and commit paths rather than ad hoc model uploads.

Show:
- Upload or connector event.
- Sensitive-data scan and quarantine decision.
- Parser / normalizer / cache.
- Clarification queue for schema anomalies.
- Human approval before commit.
- Database and search-index update.

Speaker note:
This slide describes the target operating pattern for pilot data loading. If a
specific workflow is still in backlog, say so plainly and point to the active
private data-plane plan.

## Slide 8 - Sensitive Data Boundary

Message:
AbarVa is designed to reject or quarantine PHI/PII and other out-of-scope
regulated personal data before it becomes agent context.

Show:
- Sensitive upload guard.
- Quarantine state.
- Reviewer decision.
- Release or hard-delete.
- Audit evidence.

Speaker note:
Do not claim AbarVa is a PHI system of record. The current posture is to avoid
and quarantine regulated personal data unless a separately approved deployment
model is established.

## Slide 9 - Evidence And Decision Accountability

Message:
AbarVa treats AI as decision support. Consequential actions require human
ownership, evidence, attestation, and approval.

Show:
- Decision owner.
- Evidence bundle.
- Missing-data banner.
- Human approval reason.
- Override disposition.
- Release/audit record.

Speaker note:
This supports legal, procurement, and model-risk review: the system can draft,
recommend, and summarize, but accountable humans approve consequential actions.

## Slide 10 - Model And Tool Governance

Message:
Model calls and tools are constrained by surface, tenant context, evidence
quality, and no-autonomous-action rules.

Show:
- Agent mission.
- Context bundle.
- Model gateway / provider call.
- Tool policy.
- Output sanitizer.
- Human gate for high-risk actions.

Speaker note:
The review should distinguish response generation from tool execution. Output
language must not imply autonomous legal, financial, hiring, clinical, or
procurement decisions.

## Slide 11 - Audit, Logs, And Evidence

Message:
Security reviewers need inspectable evidence, not just claims.

Show:
- Release records.
- CI job history.
- Pull request trail.
- Approval packets.
- Upload and quarantine logs.
- Decision/event evidence.

Speaker note:
For any control claim, provide the canonical document, release record, route or
test path, and current status. Avoid unsupported "certified" language.

## Slide 12 - Release And Change Control

Message:
AbarVa operates software changes through controlled release lanes and enforced
CI gates.

Show:
- PR template.
- Release record.
- Required CI checks.
- Architecture boundary.
- Secret scanning.
- Browser matrix smoke.
- Rollback runbooks.

Speaker note:
Reference `GOVERNANCE.md`, `AGENTS.md`, and `docs/releases/records/`. This is
pre-certification operational discipline, not a substitute for SOC 2.

## Slide 13 - Deployment Options

Message:
Security posture can start with managed SaaS and mature toward stricter
enterprise deployment options.

Show:
- Managed SaaS control plane.
- Per-client Azure data plane.
- Customer-owned Azure subscription option.
- Customer-managed keys and network controls as target-state options.

Speaker note:
Keep "available today", "pilot target", and "production target" distinct. Do
not imply all options are ready for every customer without a signed deployment
plan.

## Slide 14 - Known Gaps And Readiness

Message:
The architecture review should include explicit gaps, owners, and pilot impact.

Show:
- SOC 2 certification status.
- Independent pen-test status.
- SSO/SCIM setup.
- Private data-plane setup workflows.
- BYOK/CMK posture.
- Quarantine and data-load workflow maturity.

Speaker note:
This slide builds trust. Use it to separate blockers from acceptable pilot
risks, and to identify which controls must be complete before real client data
is loaded.

## Slide 15 - Security Review Ask

Message:
The architecture review should end with a concrete pilot security decision.

Ask:
- Which identity provider, groups, and roles are required?
- Which data categories are allowed and out of scope?
- Which data-plane option is required before pilot start?
- Which approval and audit artifacts must procurement receive?
- Which gaps block pilot start, and which can be handled as roadmap items?
- Who signs off on the security architecture decision?

Leave-behind:
- `docs/security/INFOSEC-ACCELERATOR.md`
- `docs/gtm/sales-engineering-toolkit/security-one-pager.md`
- `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`
- `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`
- `docs/releases/records/`

## Source Anchors

| Topic | Canonical Source |
| --- | --- |
| Security posture and CAIQ-style controls | `docs/security/INFOSEC-ACCELERATOR.md` |
| Control plane vs data plane | `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md` |
| AgentContextBroker boundary | `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md` |
| Release lanes and records | `AGENTS.md`, `GOVERNANCE.md`, `docs/releases/records/` |
| AI decision accountability controls | `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md` |
| Browser matrix and public smoke testing | `docs/runbooks/browser-matrix-smoke.md` |
| Disaster scenario drills | `docs/runbooks/disaster-scenario-drills.md` |
