# Defensive Publication Draft: Workflow-Anchored Agent Pattern

Date: 2026-06-03
Status: ready for external publication review
Audience: founder, patent counsel, product leadership, product architecture reviewers

This document is a defensive-publication draft. It is not legal advice and it
is not itself a public defensive publication while this repository remains
private. To complete the defensive-publication backlog item, publish a reviewed
version through a public channel and record the public URL.

## Abstract

AbarVa uses a workflow-anchored agent pattern in which named agents such as
Sentinel, Nexus, Atlas, and Steward are conversational fronts for work surfaces,
while primary navigation, page headers, permissions, artifacts, and action
gates are organized around business workflows. Users do not navigate by agent
persona. They navigate by durable work objects such as Intelligence, Moves,
Source, Tower, Setup/Admin, approvals, artifacts, evidence, data sources,
release controls, and audit trails. Agents operate inside these workflow
surfaces, bind responses to the current work object, and inherit the controls
attached to that workflow.

## Problem

Enterprise AI applications that expose agent personas as the main product
structure create several operational risks:

- users must learn which agent owns which action instead of following their
  work process;
- agent-branded routes can obscure who approved, changed, or released a work
  object;
- governance controls become scattered across chat surfaces rather than
  attached to durable workflow states;
- agent capability changes can alter product information architecture;
- audit reviewers see persona names instead of business-control names.

The disclosed pattern keeps agents visible as assistants while making workflow
objects the durable control plane.

## Disclosure

The workflow-anchored agent pattern has these properties:

1. Product surfaces are named for business workflows or work objects, not agent
   personas.
2. Agents can front the surface through chat, synthesis, recommendations, or
   triage, but they do not become the primary navigation hierarchy.
3. Each agent response is bound to the current surface, work object, tenant,
   stage, and permitted action set.
4. Approval, evidence, export, release, and audit controls are attached to the
   workflow action, not to the agent persona.
5. A route can change the agent implementation behind a workflow without
   changing the user's control model.
6. Governance labels use nouns such as approval, evidence, artifact, policy,
   source, ledger, release, and audit rather than agent brand names.
7. Architecture docs and CI checks can detect regressions where agent-named
   routes or labels replace workflow-anchored controls.

## Implementation Evidence

The current repository contains these concrete implementation points:

| Evidence | Path | What It Shows |
| --- | --- | --- |
| Specialist catalog | `docs/architecture/specialist-catalog.md` | States that primary UI navigation and page headers use workflow verbs and outcomes, while agents remain front-stage assistants. |
| Admin shell config | `src/lib/admin/admin-shell-config.ts` | Documents that admin routes are workflow-anchored and function-named rather than agent-anchored. |
| Setup audit | `docs/build/SETUP_AUDIT_2026-05-06.md` | Records that Setup is already workflow-anchored across connectors, users, policies, data-trust, and audit. |
| Page workflow catalog | `docs/product/page-workflow-catalog/00_PAGE_WORKFLOW_CATALOG_MASTER.md` | Defines product pages by workflow surfaces rather than agent personas. |
| Experience system | `docs/platform-design/experience-system/07_AGENTIC_INTERACTION_PATTERNS.md` | Describes how agentic interactions appear inside product workflows. |
| Source portfolio filter | `src/components/source/portfolio/PortfolioFilterSidebar.tsx` | Contains implementation guidance that workflow surfaces and filters remain workflow-anchored. |

## Example Control Shape

The durable control record is attached to the workflow action:

```ts
type WorkflowAnchoredAgentAction = {
  surface: 'intelligence' | 'moves' | 'source' | 'tower' | 'setup-admin';
  workObjectId: string;
  workflowStage: string;
  agentFront: 'Sentinel' | 'Nexus' | 'Atlas' | 'Steward';
  requestedAction: string;
  requiredEvidenceIds: string[];
  humanApprovalRequired: boolean;
  auditRecordId: string;
};
```

The agent name helps explain who assisted. The workflow fields decide what can
happen, what evidence is required, and what audit trail must be retained.

## Novelty Framing For Counsel Review

This draft does not claim that chat agents, workflow software, or approval
systems are novel by themselves. The differentiating combination to evaluate is:

- agent personas are intentionally subordinate to workflow surfaces;
- controls bind to workflow actions rather than agent identities;
- the same workflow object carries context, evidence, approval, export, and
  audit state;
- agent implementation can evolve without changing the user's control plane;
- navigation, documentation, and route policy all reinforce the workflow model.

## Publication Notes

Before public posting, review for confidential implementation details and remove
non-public customer names, credentials, and pricing. Suggested public-publication
record fields:

- publication channel;
- public URL;
- publication timestamp;
- reviewer;
- version or commit hash;
- confidentiality review result.

## Related Internal Documents

- `docs/gtm/D3-PATENT-DECISION-MEMO.md`
- `docs/ip/ABARVA_PATENT_DISCLOSURE_PACKET_2026-05-14.md`
- `docs/architecture/specialist-catalog.md`
