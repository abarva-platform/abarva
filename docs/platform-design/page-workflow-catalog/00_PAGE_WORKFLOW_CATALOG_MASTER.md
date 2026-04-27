# Page & Workflow Catalog · Master Index

Status: Canonical (CAT1)
Authored: 2026-04-25
Author: Code (sole)
Type: Product specification / catalog. Documentation only — no
application code, no runtime modification, no migrations, no model
calls.

This document is the canonical product catalog of every page and
every workflow that AbarVa renders to its operators. It integrates
the platform-design source and the build-slice contracts into a
single index that engineering, design, and founder review share.
Every page in this catalog must answer a clear user question, must
be backed by a data / read-model contract, must expose what its
agent knows and what it is missing, and must defer detail to an
explicit drill-down.

---

## A. Product rules (non-negotiable)

These five rules govern every page in this catalog. Each per-page
file inherits and re-asserts them; nothing in the product surface
may violate them.

1. **Every page must answer a clear user question.** The page
   exists because an operator needs an answer. The question is
   stated explicitly at the top of every per-page file. If a page
   does not have a clear primary user question, it must be
   collapsed into another page or removed.
2. **Every page must be backed by a data / read-model contract.**
   No page renders speculative or fabricated data. Each page cites
   the canonical contract or read model that produces its content
   (S8 / S9 / PDEL / I1 / I2 / I3 / I4 / ACT1 / ADM1 / ADM3 / ADM4
   / MW1 / MW2 / PF2 / SOL1 / SOL2). Where a contract does not yet
   exist, the page declares it as **to be defined** and the
   missing contract is enumerated.
3. **Every page must expose what the agent knows, what is missing,
   and what action should happen next.** The three facets are
   non-optional. "What the page knows" lists the deterministic
   inputs the agent has composed. "What the page is missing"
   lists the inputs the agent does not yet have. "Key user
   actions" / "Agent actions" name the next move. Hiding any
   facet hides the agent.
4. **Details are hidden by default — revealed via click /
   drill-down / drawer / same-canvas.** The index of every page
   reads calm. Detail expands inline (drawer, same-canvas tab
   swap, row drill-down) — never via a new page when the operator's
   mental thread is unbroken. Modal dialogs are not used as
   detail surfaces.
5. **Agents are anchors, not clutter.** Each surface has a single
   primary agent (Nexus / Sentinel / Atlas / Steward) named at the
   top and rendered through the canon `AgentBriefPanel`. There are
   no avatars, no chat bubbles, no spark-line walls. Secondary
   agents appear only as honest handoff chips when the primary
   agent escalates.

---

## B. Canonical agent partition

| Agent | Role | Primary surface |
| --- | --- | --- |
| **Nexus** | Program mastermind. Composes Context Bundles, runs portfolio orchestration, prepares Maestro for workshops, drafts solution architecture. | Programs · Program Workshop Mode |
| **Sentinel** | Pattern detector. Surfaces internal-basis and external-basis patterns over portfolio signals. | Intelligence |
| **Atlas** | Executive editor. Composes the boardroom-ready operating brief over Nexus / Sentinel / Steward output. | AI Control Tower |
| **Steward** | Governance + readiness. Owns identity, dataset domains, evidence usability, gate signature. | Setup / Admin · evidence states across every page |

Nexus is the program agent; Sentinel is the pattern agent; Atlas is
the executive agent; Steward is the governance agent. No fifth
agent. No agent stacks.

---

## C. Canonical six-phase journey + four hard gates

Every program flows through six canonical phases with four hard
gates between them. There is no G5 after Verify.

| # | Phase | Owner | Closing gate |
| --- | --- | --- | --- |
| 1 | Origination | Maestro + Nexus | G1 (Origination → Plan) |
| 2 | Plan | Maestro | G2 (Plan → Build) |
| 3 | Build | Engineering | G3 (Build → Pilot) |
| 4 | Pilot | Maestro + Steward | G4 (Pilot → Execute) |
| 5 | Execute | Operations | — |
| 6 | Verify | Steward | — |

Gates carry a tri-state partition: `signed` → NAVY, `missing_inputs`
→ AMBER, `not_wired` → MUTED. Every gate cap renders honestly —
`not_wired` is never softened to look ready.

---

## D. Canonical evidence lifecycle (9 states)

Evidence states flow through the canonical lifecycle:

`loaded → parseable → discoverable → indexed → cited →
quality_checked → usable_as_evidence` — with `partial` (mid-state)
and `blocked` (red exit lane) as honest off-ramps.

The shorthand "loaded → available → usable" maps to:

- **Loaded** — artifact exists in tenant storage.
- **Available** — artifact is parseable, discoverable, indexed,
  shape-confirmed by Steward.
- **Usable as evidence** — quality-checked and bound to an `E-###`
  evidence id.

Invariant: `loaded ≥ available ≥ usable`. Every page that exposes
counts must enforce the invariant visibly.

---

## E. Page index

Each page below carries: route(s), primary agent, primary user
question, MVP / V1 / V2 priority, and the read-model contract that
backs it. Detail per page lives in the linked file.

| # | Page | Route(s) | Primary agent | Primary user question | MVP/V1/V2 |
| --- | --- | --- | --- | --- | --- |
| 1 | [Home — Executive Entry](./01_HOME_EXECUTIVE_ENTRY.md) | `/home` · `/(maestro)/home` | Atlas (with Nexus follow-up) | "Where does my AbarVa stand right now?" | MVP |
| 2 | [Setup / Admin](./02_SETUP_ADMIN.md) | `/(maestro)/platform/admin` · `/(maestro)/platform/users` · `/(maestro)/platform/data` | Steward | "Is this tenant ready, and what is the most leveraged thing to fix next?" | MVP |
| 3 | [Programs](./03_PROGRAMS.md) | `/tenant/[tenantSlug]/programs` · `/(maestro)/engagements` · legacy `/programs` | Nexus | "What is the state of the program portfolio, and where do I act next?" | MVP |
| 4 | [Program Workshop Mode](./04_PROGRAM_WORKSHOP_MODE.md) | `/tenant/[tenantSlug]/programs/[programSlug]` · `/(maestro)/tenant/[tenantSlug]/programs/[programSlug]` | Nexus (with Steward at gates) | "What do I need to walk into this workshop fully prepared, and what gets captured after?" | MVP |
| 5 | [Source](./05_SOURCE.md) | `/(maestro)/source` · `/(maestro)/source/events` | Nexus (with Sentinel detection) | "What are sponsors saying, and what should I act on?" | V1 |
| 6 | [Source · Artifacts, Reviews, Approvals](./06_SOURCE_ARTIFACTS_REVIEWS_APPROVALS.md) | `/(maestro)/source/events/[eventId]` · `/sponsor/[engagementId]` | Steward (with Nexus) | "Which artifacts are still missing review, and who blocks them?" | V1 |
| 7 | [Vendor Evaluation](./07_VENDOR_EVALUATION.md) | `/(maestro)/tower/onboard` (vendor lens) · future `/(maestro)/vendors` | Atlas (with Sentinel concentration patterns) | "Which vendors are concentrated, contract-risky, or substitutable?" | V2 |
| 8 | [Intelligence](./08_INTELLIGENCE.md) | `/intelligence` · `/(maestro)/intelligence` · `/(maestro)/intelligence/patterns` · `/(maestro)/intelligence/briefing` · `/(maestro)/intelligence/library` · `/(maestro)/intelligence/topics` · `/(maestro)/intelligence/people` · `/(maestro)/intelligence/kpis` · `/(maestro)/intelligence/ask` | Sentinel | "What patterns are active, what is the strongest signal, and what should I act on?" | MVP |
| 9 | [AI Control Tower](./09_AI_CONTROL_TOWER.md) | `/(maestro)/tower` · `/(maestro)/tower/onboard` · `/(maestro)/tower/projects` · `/(maestro)/tower/staff-aug` · `/(maestro)/tower/tech-stack` · `/(maestro)/tower/volumetrics` | Atlas | "Where does the AI portfolio stand, where is it at risk, and what is the next steering decision?" | MVP |
| 10 | [Data, Evidence, Knowledge Layer](./10_DATA_EVIDENCE_KNOWLEDGE_LAYER.md) | `/(maestro)/platform/data` · `/(maestro)/intelligence/library` · evidence views inside Programs / Tower | Steward (with Nexus retrieval) | "Where does the agent's claim come from, and is the source usable?" | V1 |

Cross-page contract and roadmap files:

| File | Role |
| --- | --- |
| [Page Data Contract Standard](./11_PAGE_DATA_CONTRACT_STANDARD.md) | The shape every page-level read model must satisfy. |
| [Wireframe Requirements by Page](./12_WIREFRAME_REQUIREMENTS_BY_PAGE.md) | The minimum render contract for each page wireframe. |
| [MVP / V1 / V2 Page Roadmap](./13_MVP_V1_V2_PAGE_ROADMAP.md) | Slice-by-slice page activation plan. |

---

## F. Reading order for new contributors

- Founder reviewers: read this file → `13_MVP_V1_V2_PAGE_ROADMAP.md`
  → individual page files in priority order.
- Engineering: read `11_PAGE_DATA_CONTRACT_STANDARD.md` first, then
  the page file you are landing, then the cited slice contracts in
  `docs/build/slices/`.
- Design: read this file → `12_WIREFRAME_REQUIREMENTS_BY_PAGE.md`
  → `docs/design/ABARVA_VISUAL_CANON.md` →
  `docs/design/pages/*_PAGE_BLUEPRINT.md`.

---

## G. What this catalog is **not**

- Not a UI implementation spec. Implementation lives in the slice
  contracts under `docs/build/slices/` and in the visual blueprints
  under `docs/design/pages/`.
- Not an agent runtime spec. Agent behavior contracts live in the
  pattern operating model and the per-agent slice contracts.
- Not a database / migration plan. No migrations are introduced by
  this catalog or its referenced files.
- Not a marketing surface. Marketing pages live outside this
  catalog and are not subject to the five product rules above.
