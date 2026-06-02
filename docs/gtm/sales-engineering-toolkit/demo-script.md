# Sales Engineering Demo Script

Status: sales-engineering draft
Audience: enterprise champion plus technical evaluator
Default length: 30 minutes

This script is the technical-buyer version of the boardroom demo. It is shorter
than a product deep dive and more explicit about architecture, caveats, and
pilot readiness.

## Pre-Demo Checklist

| Check | Owner | Required outcome |
| --- | --- | --- |
| Demo route works | Demo driver | App loads and expected tenant/demo data is visible. |
| Auth posture known | Demo driver | Know whether the demo is public, Clerk-protected, or using a test account. |
| Runtime caveats current | Demo driver | Know whether model calls, evidence retrieval, exports, and ingestion are seeded or live. |
| Buyer persona confirmed | Founder | CIO/CISO/CFO/COO/CDO/AI lead lens selected. |
| Security source docs ready | Founder | Links to security posture, controls matrix, and architecture docs ready. |

## 30-Minute Run Of Show

| Time | Stop | Route or artifact | Objective |
| --- | --- | --- | --- |
| 0:00-0:03 | Frame | Narrative | Establish AbarVa as a tenant-grounded decision OS, not a generic assistant. |
| 0:03-0:07 | Architecture map | Reference architecture deck slides 1-3 | Explain control plane, data plane, and evidence movement. |
| 0:07-0:11 | Setup / Steward | Admin/setup route if available | Show readiness, dataset/domain posture, and governance controls. |
| 0:11-0:16 | Intelligence / Sentinel | Intelligence route | Show pattern, basis, confidence, citation, and handoff discipline. |
| 0:16-0:21 | Moves / Nexus | Programs/Moves route | Show phase-gated human decision flow and evidence-backed program movement. |
| 0:21-0:25 | Tower / Atlas | Tower route | Show executive portfolio posture and board-ready accountability. |
| 0:25-0:28 | Security posture | Security one-pager | Answer where data lives, what is controlled, and what gaps remain. |
| 0:28-0:30 | Close | Pilot ask | Confirm data-plane, identity, datasets, and decision-owner next step. |

## Opening Script

"AbarVa is the tenant-grounded decision OS for the C-suite. The important
architecture point is that we separate the shared application/control plane from
the customer data plane, and we treat AI output as decision support that needs
evidence, citations, and human approval. Today I will show the loop from pattern
to move to portfolio brief, then close with the controls we would validate for a
pilot."

## Caveats To Say Out Loud

Use these when the demo environment is seed-driven:

- "This demo tenant uses deterministic synthetic data. We use it to show the
  workflow and buyer experience without implying live customer data is loaded."
- "If live model calls are not enabled in this environment, agent language here
  is seeded or deterministic. The production contract routes model interaction
  through the governed model gateway and context broker."
- "Where exports, uploads, or ingestion are shown as product direction, I will
  distinguish what is live today from what is in active backlog."
- "AbarVa is not claiming SOC 2 certification or completed external pen test
  unless those appear in the current security source documents."

## Talk Tracks By Stop

### 1. Architecture Map

What to show:
- SaaS control plane.
- Client-scoped data plane.
- `AgentContextBroker`.
- Evidence and human approval path.

Talk track:
"This architecture is designed to keep the business workflow in one product
while preventing raw enterprise data from becoming an uncontrolled prompt
payload. The application asks for context through a broker. The broker enforces
tenant scope and returns evidence bundles. The agent can draft or recommend, but
the workflow records the human decision."

### 2. Setup / Steward

What to show:
- Data/domain readiness.
- User/access posture.
- Production-readiness or setup controls.
- Any available evidence/data-quality panel.

Talk track:
"Steward is the governance surface. Before the buyer trusts a pattern or a
brief, they need to know whether the substrate is loaded, which domains are
usable as evidence, and which approvals are missing."

### 3. Intelligence / Sentinel

What to show:
- Pattern cards.
- Basis/confidence labels.
- Citations/evidence ids.
- Recommended action and handoff.

Talk track:
"Sentinel does not exist to produce a loose insight. It surfaces a pattern, says
what evidence it is based on, declares confidence, and hands the action to the
right operating surface."

### 4. Moves / Nexus

What to show:
- Program phase/gate state.
- Evidence bundle.
- Human decision or approval state.
- Deliverable or artifact state if present.

Talk track:
"Nexus converts the pattern into a move. This is where the liability posture
matters: the system can recommend and draft, but a person owns the decision,
the reason, and the approval."

### 5. Tower / Atlas

What to show:
- Executive brief.
- Scorecards / pressure cards.
- Portfolio-level risk or value posture.

Talk track:
"Atlas is the portfolio read. It lets a buyer see whether the program estate is
moving, stuck, over-concentrated, or missing evidence."

### 6. Security Close

What to show:
- Security one-pager.
- Known gaps.
- Pilot-specific architecture ask.

Talk track:
"The right next step is not a generic demo follow-up. It is a pilot architecture
decision: identity provider, datasets, data-plane posture, approval evidence,
and who signs off."

## Questions To Ask The Buyer

| Topic | Question |
| --- | --- |
| Identity | "Which IdP and groups would need to map into the pilot?" |
| Data scope | "Which datasets are allowed in the pilot, and which are explicitly excluded?" |
| Data residency | "Does the pilot require a private Azure data plane from day one?" |
| Approval | "Which decisions require named human approval and audit evidence?" |
| Procurement | "Which security artifacts are mandatory before legal review?" |
| Success metric | "Which outcome would make the pilot worth expanding?" |

## Close

"The pilot decision is whether AbarVa should run as the operating layer for one
high-value decision loop. If yes, the next artifact is a pilot architecture
packet: identity, data scope, approval flow, security evidence, and success
metrics."
