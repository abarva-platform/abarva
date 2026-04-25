# AbarVa Page And Workflow Catalog Master

## Purpose

This catalog defines the page and workflow contract for AbarVa surfaces. Every page must have a clear purpose, agent anchor, workflow state, data contract, seed-data path for today, real-data path for tomorrow, and implementation classification.

No page should show magic UI that cannot later be backed by real data, evidence, workflow state, or pattern context.

## Catalog Categories

1. Home / Executive Entry: `pages/01_HOME_EXECUTIVE_ENTRY.md`
2. Setup / Admin: `pages/02_SETUP_ADMIN.md`
3. Programs: `pages/03_PROGRAMS.md`
4. Program Journey / Workshop Mode: `pages/04_PROGRAM_WORKSHOP_MODE.md`
5. Source / Outsourcing: `pages/05_SOURCE_OUTSOURCING.md`
6. Source Artifacts / Reviews / Approvals: `pages/06_SOURCE_ARTIFACTS_REVIEWS_APPROVALS.md`
7. Vendor Evaluation: `pages/07_VENDOR_EVALUATION.md`
8. Intelligence: `pages/08_INTELLIGENCE.md`
9. Control Tower: `pages/09_CONTROL_TOWER.md`
10. Data / Evidence / Knowledge Layer: `pages/10_DATA_EVIDENCE_KNOWLEDGE_LAYER.md`
11. Cross-Product Agent Interactions: this master file and `contracts/PAGE_DATA_CONTRACT_STANDARD.md`
12. Data Contract Rules: `contracts/PAGE_DATA_CONTRACT_STANDARD.md`
13. MVP / V1 / V2 Page Roadmap: `11_MVP_V1_V2_PAGE_ROADMAP.md`

## Required Page Fields

Each page file must define:

- Page/category name.
- Purpose.
- Primary user question.
- Agent anchor.
- Journey/workflow state.
- UI zones.
- Data required.
- Seed data today.
- Real data tomorrow.
- Actions supported.
- Missing-data behavior.
- MVP / V1 / V2 classification.
- Dependencies.
- Wireframe required yes/no.
- What not to show if data is missing.

## Data Principle

Every page needs a data contract. Seed data today must map to real data tomorrow. Demo surfaces can use fixtures, but each fixture must represent a future source of truth such as tenant state, program state, Source event state, vendor response data, parsed evidence, pattern context, workflow validation, or audit history.

## Cross-Product Agent Interaction Rules

Agents are anchored to product work, not floating chat. Nexus, Sentinel, Atlas, and Steward can appear across surfaces only when the page has enough context to explain what the agent knows, what it does not know, and what action it is recommending.

Cross-product agent interactions must show:

- The work object in scope.
- Context used.
- Confidence or readiness.
- Missing context when applicable.
- The next useful action.
- Handoff target when another agent or workflow owns the next step.

Do not show generic chat, model output, or free-floating recommendations when page context is missing.

## Implementation Classification

MVP pages must expose the minimum truthful workflow state and data contract. V1 pages may add richer collaboration, handoffs, and evidence review. V2 pages may add optimization, simulation, automation, and advanced orchestration after the data and governance layers are proven.

## Review Packet

Use `PAGE_WORKFLOW_CATALOG_REVIEW_PACKET.md` when reviewing page work against this catalog.
