# IT-Productivity Gold Path Demo

Audience: Apex Retail CTO persona
Target length: 6 minutes, hard stop at 7 minutes
Environment: Apex Retail authenticated demo tenant
Question: "How do I improve productivity of IT resources by leveraging AI-powered SDLC/Product development lifecycle?"

## Preflight

- Sign in with an Apex CTO or admin demo account.
- Confirm `/intelligence/ask` opens with tenant name "Apex Retail Group".
- Confirm `/tower/portfolio-dag` opens or redirects to sign-in when unauthenticated.
- Confirm `/source/events/apex-retail-ams-outsourcing-2026` or `/source/events` has an AMS Optimization event available.
- Open backup public pages in separate tabs:
  - `/how-it-works/it-productivity-comparison`
  - `/how-it-works/frameworks/ai-it-productivity`

## Six-Minute Run Of Show

| Time | Route | Action | Talk track |
|---:|---|---|---|
| 0:00-0:35 | `/intelligence/ask` | Open Intelligence Enterprise Context for Apex CTO. | "We start where a CTO would start: one high-stakes productivity question, not a feature prompt. Apex context is already loaded: app portfolio, org topology, DORA baseline, AI tool footprint, vendor contracts, and value state." |
| 0:35-1:10 | `/intelligence/ask` | Ask the IT-productivity question. | "A generic model can give plausible advice. Sentinel has to form an operating view using Apex context, the versioned corpus, and the Move/Source templates." |
| 1:10-2:05 | `/intelligence/ask` | Walk the six Sentinel cards. | "The answer is structured: clarify outcome, alignment check, TIME x AI-fit segmentation, TOM recommendation, tooling and governance, sibling Move portfolio. Watch the citations and dissent block: this is not a neutral list of tools." |
| 2:05-2:45 | `/intelligence/ask` | Click "Shape Moves". | "This is the turn from answer to execution. Sentinel is not done when the paragraph is done. It shapes the IT-Productivity Move, sibling Moves, and the Source workflows needed to make the answer governable." |
| 2:45-3:25 | `/tower/portfolio-dag` | Show portfolio DAG. | "The DAG separates dependency from narrative. Data Foundation, AI Governance, Portfolio Rationalization, Talent Strategy, and Mainframe Modernization are sibling Moves. AMS Optimization is Source, not a Move gate, and it informs the productivity program." |
| 3:25-4:35 | `/tower/programs/[programId]/value` | Open IT-Productivity Move value page. | "The Move has 9 gates and 8 value layers: adoption, DORA delta, hours saved, hours reallocated, license spend, realized value, process changes shipped, kill criteria. Every value line is projected, tracked, or verified. CFOs care about that tri-state." |
| 4:35-5:35 | `/source/events/apex-retail-ams-outsourcing-2026` | Open AMS Optimization Source workflow. | "Managed services optimization is a separate workflow with different sponsors: Procurement, GC, CFO, CIO. Source runs the vendor portfolio diagnostic: concentration, leakage, renegotiation posture, outcome clauses, AI fluency, and IP scan cleanliness." |
| 5:35-6:00 | `/how-it-works/it-productivity-comparison` | Optional public fallback close. | "The contrast is visible: same question, generic answer versus AbarVa answer. Citation density, dissent, Move workflow, version-pinned audit, and AI Egress Control Plane are the reason this is enterprise software, not a chatbot." |

## What To Point At

- Sentinel card count: six cards plus dissent, "what would change my view", and audit trail.
- Shape Moves button: the visible hinge between reasoning and execution.
- DAG nodes: IT-Productivity parent, five sibling Moves, AMS Source workflow.
- Move gate list: 0, 0.5, 1-9. Emphasize Wave 0 and dependency check before tooling.
- Tower value tri-state: projected, tracked, verified. Say "verified requires attestation."
- Source workflow: Inventory -> Diagnostic -> Strategy -> Execution -> Steady-state.
- AI Egress banner: tenant policy, data sensitivity, redaction, audit logging.

## Failure-Mode Notes

| If this breaks | Do this live | Do not say |
|---|---|---|
| Clerk redirects or session expires | Use the public comparison page and narrate the authenticated path from the script. Then re-authenticate off-screen. | Do not say the authenticated flow is live if you cannot show it. |
| Sentinel answer stream fails | Use the cached comparison page; show the six Sentinel cards there and say the public page is a static replay of the intended answer shape. | Do not improvise missing citations. |
| "Shape Moves" does not create edges | Open `/tower/portfolio-dag` and show the deterministic DAG fallback; state that the acceptance smoke checks public pages and the auth segment is gated by Clerk credentials. | Do not claim a new Move was created unless you see it. |
| Portfolio DAG is empty | Use the verbal dependency list: five sibling Moves plus AMS Source workflow. Then jump to the public framework page. | Do not call an empty graph a pass. |
| IT-Productivity value page cannot identify `moveId` | Stay on DAG, name the 8 value layers from the script, and avoid clicking into a broken dynamic route. | Do not make up a move URL. |
| Source event missing | Use `/source/events` and search for AMS. If unavailable, show the Source workflow stages from this document. | Do not claim vendor submissions are live data. |
| Production/public page stale | Use local or preview URL and say production is pending smoke/deploy. | Do not blend preview with production. |

## Acceptance Smoke Boundary

Public deterministic smoke covers:

- `/how-it-works/it-productivity-comparison` loads with both populated columns.
- `/how-it-works/frameworks/ai-it-productivity` loads with six headline patterns and the login CTA.
- The comparison page exposes the AI Egress Control Plane language.

Authenticated smoke is documented but environment-gated when Clerk credentials are unavailable:

- `/intelligence/ask` answer stream.
- Shape Moves creation.
- `/tower/portfolio-dag` and `/tower/programs/[programId]/value` for the created Move.
- `/source/events/...` AMS workflow.
