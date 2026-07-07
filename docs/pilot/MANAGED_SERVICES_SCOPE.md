# Pilot Managed Services Scope

Status: candidate
Owner: AbarVa pilot operations
Audience: client sponsor, procurement, legal, security, AbarVa operations
Backlog task: T053

## Purpose

This document defines what AbarVa operates during a pilot and what remains the
client's responsibility. It is intended to become SOW source material.

## In Scope

| Area | AbarVa responsibility |
| --- | --- |
| Product operation | Operate the AbarVa application, release process, support model, and admin surfaces used in the pilot. |
| Pilot configuration | Configure pilot users, roles, client scope, workflow defaults, and approved pilot modules. |
| Data intake support | Provide templates, metadata guidance, upload workflow support, sensitive-data quarantine process, and clarification workflow. |
| Data processing support | Run or supervise approved ingestion, parsing, indexing, and evidence-quality checks for pilot data. |
| Agent governance | Maintain AI labels, citations, answer-quality checks, human approval gates, and no-auto-action controls. |
| Weekly reporting | Provide pilot digest, blockers, adoption signal, agent-quality findings, and next-step recommendations. |
| Incident response | Follow AbarVa incident, rollback, and disaster-scenario runbooks for product or platform incidents. |
| Security evidence | Maintain release records, access-review evidence, data handling notes, and audit/export artifacts in scope for the pilot. |

## Out of Scope Unless Separately Contracted

| Area | Exclusion |
| --- | --- |
| Client source-system ownership | AbarVa does not own the accuracy, availability, or permissions of the client's source systems. |
| Client data cleansing | AbarVa can identify data-quality gaps, but the client owns source correction and business meaning. |
| Legal advice | AbarVa provides product controls and draft artifacts, not legal advice. Counsel must review contract/legal decisions. |
| Security operations center | AbarVa does not provide 24x7 managed SOC service unless separately contracted. |
| Enterprise integration buildout | Custom ERP/CRM/HCM/API integrations beyond pilot intake templates require separate scope. |
| Change management program | Training and adoption support are included at pilot scale; enterprise transformation/change management is separate. |
| Autonomous external action | AbarVa agents do not send client communications, commit contracts, trigger payments, or mutate client systems without explicit human approval and separately approved integration scope. |
| Production data migration | Bulk migration, archival, and enterprise data warehouse modernization are separate programs. |

## Client Responsibilities

| Area | Client responsibility |
| --- | --- |
| Executive sponsor | Name the sponsor, value owner, and decision authority. |
| Admin owner | Name the client admin who approves users, roles, data use, and upload policy. |
| Data steward | Provide templates, metadata, field definitions, source-system meaning, and data-quality decisions. |
| Sensitive data | Identify prohibited or restricted data, approve exceptions, and participate in quarantine decisions. |
| Source access | Provide approved files, APIs, extracts, or credentials through agreed channels. |
| Business validation | Validate AI-assisted recommendations before action. |
| Security coordination | Support SSO, access review, network review, and client-side approvals. |

## Service Boundaries

| Request | Default handling |
| --- | --- |
| Add a new pilot user | In scope if within agreed user count and role model. |
| Add a new template in an existing dimension | In scope if metadata is provided and no custom connector is needed. |
| Load a non-standard PDF/document bundle | In scope for review/clarification; heavy custom extraction may require change order. |
| Build a new API connector | Out of scope unless listed in SOW. |
| Write final client policy or legal position | Out of scope; AbarVa may provide draft decision-support material. |
| Run after-hours P1 support | Governed by `docs/pilot/SUPPORT-MODEL.md` and SOW service levels. |

## Change-Order Triggers

A change order is required when:

- a new module or major workflow is added,
- a new client system connector is required,
- custom data transformation exceeds pilot template support,
- service hours exceed agreed support window,
- data residency or regional architecture changes materially,
- legal/security review adds obligations not included in the SOW,
- the client requests production-grade migration or managed-services support
  beyond pilot operations.

## SOW Insert

> AbarVa will provide pilot-scale managed services for configuration, governed
> data intake support, AI decision-support controls, weekly pilot reporting,
> and product support as described in the pilot support model. Client remains
> responsible for source-system access, data accuracy, sensitive-data
> approvals, business validation, and final decisions. Any custom integration,
> enterprise data migration, legal advisory, SOC operation, or out-of-hours
> managed service beyond the agreed support model requires a written change
> order.
