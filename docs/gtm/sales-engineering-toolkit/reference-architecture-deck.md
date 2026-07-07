# Reference Architecture Deck Outline

Status: sales-engineering draft
Audience: CIO, CISO, enterprise architecture, platform engineering
Format: 10-12 slide outline for a customer-facing architecture review

Use this as a deck script or as the source for a slide build. Keep technical
claims tied to the source anchors in `README.md`.

## Slide 1 - AbarVa Architecture In One Sentence

Message:
AbarVa is a tenant-grounded decision OS with a shared SaaS control plane and a
client-scoped data plane pattern for enterprise data, evidence, and retrieval.

Show:
- Control plane: application shell, governance workflow, release controls.
- Data plane: customer-scoped storage, Postgres, retrieval, and processing.
- Agent layer: Sentinel, Nexus, Atlas, Steward mediated through the
  `AgentContextBroker`.

Speaker note:
This is not a generic chatbot architecture. The product boundary is the
decision workflow, and the technical boundary is the context broker plus the
tenant-scoped data plane.

## Slide 2 - Buyer Problem

Message:
Enterprise AI programs fail when decisions, evidence, spend, and accountability
are split across decks, spreadsheets, ad hoc agents, and one-off vendor tools.

Show:
- AI portfolio decisions.
- Source/vendor events.
- Pattern intelligence.
- Board/operating cadence.
- Audit and approval trail.

Speaker note:
AbarVa turns those into one governed loop: pattern -> move -> source event ->
portfolio brief -> human-approved decision.

## Slide 3 - Plane Model

Message:
AbarVa separates shared product logic from customer data operations.

Show:
- SaaS control plane: Next.js app, Clerk auth, Vercel deployment, release
  gates, governance docs.
- Private data plane option: Azure storage, Azure Postgres, Key Vault, parser
  and retrieval services in customer-scoped infrastructure.
- Metadata exchange: manifests, evidence ids, and approval state.

Speaker note:
The control plane can operate without owning raw customer data. The stronger
enterprise posture is a client-owned or client-scoped Azure data plane.

## Slide 4 - Identity And Access

Message:
Authentication and authorization start at identity, then continue through
tenant-scoped access and data-layer controls.

Show:
- Clerk authentication and organization membership.
- SAML/OIDC/SCIM target path for enterprise pilots.
- Role mapping into application permissions.
- Per-user and tenant-scoped data access.

Speaker note:
For pilot readiness, explain what is live, what is configured per customer, and
what requires the customer's identity provider team.

## Slide 5 - Agent Governance Boundary

Message:
Application surfaces must go through the `AgentContextBroker` instead of
directly importing data-room, vector, graph, or retrieval internals.

Show:
- Surface request.
- Agent context broker.
- Tenant context bundle.
- Model gateway / tool plane.
- Decision-support output with citations and human approval requirements.

Speaker note:
The boundary gives the team a single place to enforce tenant context, evidence
requirements, citation discipline, and no-autonomous-action rules.

## Slide 6 - Evidence And Decision Accountability

Message:
AbarVa treats AI output as decision support, not autonomous decision-making.

Show:
- Evidence bundle.
- Missing-data banner.
- Decision owner.
- Human attestation.
- Override disposition.
- Release/audit evidence.

Speaker note:
The buyer should leave knowing that the system can recommend, draft, and
surface patterns, but accountable humans approve consequential actions.

## Slide 7 - Data Load And Retrieval Path

Message:
Customer content is loaded, processed, and retrieved through governed data-plane
services rather than direct ad hoc model uploads.

Show:
- Upload or connector event.
- Pre-ingest policy checks.
- Parse / normalize / cache.
- Store structured outputs.
- Retrieve evidence for product surfaces.

Speaker note:
If the private data-plane setup workflow is still being implemented, say so
plainly and point to the active backlog/runbook rather than treating it as done.

## Slide 8 - Product Surface Map

Message:
The four primary surfaces are one operating loop, not four disconnected apps.

Show:
- Intelligence / Sentinel: pattern detection and evidence.
- Moves / Nexus: phase-gated decisions and program execution.
- Source: sponsor/vendor/procurement events and artifacts.
- Tower / Atlas: portfolio posture and executive brief.
- Setup / Steward: readiness, governance, and data quality.

Speaker note:
Use this slide to orient the demo. Do not spend the architecture meeting inside
every route.

## Slide 9 - Deployment Options

Message:
AbarVa can start with the shared SaaS posture and mature toward stricter
enterprise deployment options.

Show:
- Shared SaaS control plane.
- Per-client Azure data plane.
- Per-customer Vercel option where required.
- Client-owned Azure subscription path.

Speaker note:
Keep the distinction clear: deployment options are architectural choices, not a
claim that every option is currently provisioned for every pilot.

## Slide 10 - Operational Controls

Message:
Release and runtime controls are built into how AbarVa changes software.

Show:
- Release lanes.
- Required CI gates.
- Release records.
- CODEOWNERS and PR template.
- Runbooks and ADRs.

Speaker note:
For procurement, this is evidence that the product is being operated with a
controlled-release mindset even before formal certification.

## Slide 11 - Known Gaps And Roadmap

Message:
AbarVa is explicit about maturity gaps.

Show:
- Security posture known gaps.
- SSO/SCIM configuration dependencies.
- External pen test status.
- SOC 2 target path.
- Private data-plane setup work.

Speaker note:
This slide builds trust. Do not hide gaps; explain owner, timeline, and whether
the buyer needs the control before pilot start.

## Slide 12 - Pilot Architecture Ask

Message:
The next step is a concrete pilot architecture decision.

Ask:
- Which identity provider and groups should map into AbarVa?
- Which datasets are in scope, and which are explicitly out of scope?
- Which data-plane option is required for pilot start?
- Which approval and audit evidence does procurement require?
- Who signs the pilot architecture decision?

Leave-behind:
- `docs/gtm/sales-engineering-toolkit/security-one-pager.md`
- `docs/pilot/SECURITY_POSTURE.md`
- `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md`
- `docs/architecture/adr/README.md`
