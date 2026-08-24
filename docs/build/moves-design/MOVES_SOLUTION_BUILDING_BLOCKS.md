# Moves — Solution Building Blocks (the canonical model)

> Supersedes the "classify each Move into one of 8 archetypes" framing. A Move is **not** one archetype — it is a **composed bundle of reusable building blocks**. This doc is the governed reference for `MOVES_ANALYTICS_LAYER_SPEC.md` and `MOVES_REDESIGN_CLAUDE_DESIGN_BRIEF.md`.

## 1. Principle

- AbarVa has **~10 reusable solution building blocks**. Not hundreds. Not one per use case. Not one per industry.
- **The purpose is not labeling — it is a reusable advisory playbook.** The blocks help AbarVa consistently answer, per Move: *What work must change? What evidence is needed? What do we build/configure? What controls are required? What value can be expected? What should be sequenced first? What is unsafe or premature?*
- **A Move is a composed solution** — it selects **3–6 blocks**, not one. The blocks are the reusable parts that make each solution specific, governed, and executable.
- **Keep the governed list under 10–12.** If more detail is needed, add **subtypes**, never new top-level blocks. The top level stays stable.

## 2. The 10 building blocks

| # | Building block | What it means |
|---|---|---|
| 1 | **Process redesign** | Redesign the workflow, roles, handoffs, approvals, exception paths |
| 2 | **Data readiness / remediation** | Clean, standardize, enrich, reconcile, govern data before AI can work |
| 3 | **Knowledge / retrieval copilot** | Search, Q&A, summarization, citations across documents/knowledge bases |
| 4 | **AI-assisted decision support** | AI recommends, scores, drafts, classifies, prioritizes; human decides |
| 5 | **Workflow automation** | Route, notify, assign, update status, enforce SLAs, trigger next steps |
| 6 | **Human-in-the-loop agent** | AI performs multi-step work but pauses for human review/approval at key points |
| 7 | **Analytics / intelligence layer** | Dashboards, metrics, insights, forecasting, portfolio/decision intelligence |
| 8 | **System / platform implementation** | Configure/build/extend a platform — CLM, CRM, ITSM, ERP, workflow, data platform |
| 9 | **Controls / governance / risk model** | Human approval, audit trail, policy compliance, evals, security, model-risk controls |
| 10 | **Value tracking / operating cadence** | Tower metrics, ownership, baselines, targets, review cadence, realization tracking |

### Subtypes (example — top level stays stable)
`AI-assisted decision support` → triage recommendation · risk scoring · prioritization · next-best-action.

## 3. The per-block playbook (14 fields)

Each block stores a small, reusable playbook — **not** a giant document. This is what makes P2/P3/P4/P5/Tower guidance specific:

1. Purpose · 2. When to use · 3. When **not** to use · 4. Evidence needed · 5. Readiness requirements · 6. Controls required · 7. Typical deliverables · 8. Common traps · 9. Value mechanisms · 10. Metrics · 11. Implementation tasks · 12. Phase relevance · 13. Questions aVa should ask · 14. Demo examples.

## 4. Block playbooks (seed content)

**1 · Process redesign** — *Purpose:* fix broken work before adding AI. *Evidence:* process map, work queue, handoff points, cycle time, approvals, exceptions. *Questions:* where does work enter / wait / get approved / where do exceptions happen / what can be eliminated? *Deliverables:* current- & future-state workflow, role/handoff model. *Metrics:* cycle time, rework, queue age, handoff count, SLA misses. *Trap:* automating a broken process.

**2 · Data readiness / remediation** — *Purpose:* make data usable enough for AI/analytics. *Evidence:* source inventory, data quality, required fields, ownership, lineage, missing values. *Questions:* which fields missing / system of record / who owns quality / what data is trusted? *Deliverables:* data gap assessment, remediation backlog, source-of-truth map. *Metrics:* completeness, accuracy, duplicate rate, match rate, freshness. *Trap:* launching AI before the data substrate is reliable.

**3 · Knowledge / retrieval copilot** — *Purpose:* help users search/ask across trusted content. *Evidence:* documents, permission model, taxonomy, citation requirements, freshness rules. *Questions:* what content in scope / who sees what / what needs citation / what should not be answered? *Deliverables:* knowledge corpus plan, retrieval design, permissions model. *Metrics:* search-time reduction, answer helpfulness, citation accuracy, adoption. *Trap:* answering from ungoverned or stale documents.

**4 · AI-assisted decision support** — *Purpose:* recommend/prioritize while humans decide. *Evidence:* decision criteria, historical cases, outcomes, approval rules, exception history. *Questions:* what decision is supported / what inputs matter / who approves / what escalates? *Deliverables:* decision-support model, recommendation rules, review workflow. *Metrics:* decision cycle time, accuracy, override rate, exception rate. *Trap:* confusing recommendations with approvals.

**5 · Workflow automation** — *Purpose:* move work through the process consistently. *Evidence:* workflow states, routing rules, SLA rules, owners, triggers, exceptions. *Questions:* what triggers next step / who owns each state / what on SLA miss / what needs notification? *Deliverables:* workflow design, routing rules, SLA model. *Metrics:* queue aging, SLA compliance, throughput, status-inquiry reduction. *Trap:* automating routing without fixing ownership.

**6 · Human-in-the-loop agent** — *Purpose:* let AI execute multi-step tasks with human checkpoints. *Evidence:* task steps, allowed actions, approval points, audit requirements, failure modes. *Questions:* what can AI do alone / where must it stop / who approves / what is logged / how to reverse? *Deliverables:* agent task design, human approval model, audit-trail design. *Metrics:* touch reduction, approval time, override rate, error rate. *Trap:* giving the agent more authority than controls support.

**7 · Analytics / intelligence layer** — *Purpose:* turn operational data into management insight. *Evidence:* KPIs, dimensions, baseline data, owners, refresh cadence, dashboard consumers. *Questions:* what decisions need metrics / who owns each KPI / what is baseline / target / review cadence? *Deliverables:* metric model, dashboard design, insight canvas. *Metrics:* baseline coverage, decision usage, forecast accuracy, value visibility. *Trap:* dashboards without ownership or action cadence.

**8 · System / platform implementation** — *Purpose:* build/configure the underlying platform capability. *Evidence:* system inventory, gaps, integrations, security, vendor constraints, data flows. *Questions:* can current platform support this / build-buy-configure-integrate / dependencies / vendor role? *Deliverables:* platform design, integration plan, vendor/build plan. *Metrics:* implementation milestones, defect rate, adoption, cost. *Trap:* treating platform configuration as transformation.

**9 · Controls / governance / risk model** — *Purpose:* make the solution safe, auditable, compliant. *Evidence:* policies, control requirements, legal/security/privacy constraints, audit needs. *Questions:* what must be approved / logged / what data is sensitive / what cannot be automated / what evals required? *Deliverables:* control matrix, approval model, risk register, eval plan. *Metrics:* policy exceptions, audit findings, approval compliance, incident rate. *Trap:* adding AI before control boundaries are clear.

**10 · Value tracking / operating cadence** — *Purpose:* ensure promised value is measured and governed after launch. *Evidence:* baseline, target, formula, data owner, business owner, review cadence. *Questions:* what metric proves value / who owns it / baseline / target / what if value doesn't show? *Deliverables:* Tower metric contract, value-realization cadence, escalation model. *Metrics:* realized value, adoption, metric freshness, variance to target. *Trap:* approving a roadmap without measurement ownership.

## 5. Composition — a Move is a bundle

A Move **selects** 3–6 blocks. Example — **AI for contracts**:

| Building block | Needed? | Why |
|---|---|---|
| Process redesign | Yes | Intake/routing/obligation ownership is broken |
| Data readiness | Yes | Contract metadata & obligation data incomplete |
| Knowledge / retrieval copilot | Maybe | Users may need Q&A over contracts |
| AI-assisted decision support | Yes | Suggest risk tier, missing info, obligation candidates |
| Workflow automation | Yes | Routing/status/approvals inside CLM/workflow |
| Human-in-the-loop agent | Yes | AI prepares review packet; Legal approves |
| Analytics / intelligence layer | Yes | Contract portfolio, renewals, obligations, risk dashboards |
| System / platform implementation | Yes | CLM/workflow/data integration |
| Controls / governance / risk | Yes | Legal judgment, non-standard terms, privacy/indemnity approvals |
| Value tracking / operating cadence | Yes | Tower tracks cycle time, obligation capture, missed renewals, value |

The solution is the **bundle**, not one archetype.

## 6. What the blocks DO in Moves (per-phase guidance)

> **Full phase-flow build spec: `MOVES_BUILDING_BLOCK_SPINE.md`** — each block is a *lane* that runs P2→P3→P4→P5→Tower, shaping the current phase and pre-populating the next (a phase never starts blank).

- **P2 Discover** — the selected blocks tell aVa **what evidence to ask for** (e.g., Data Readiness → data quality, source-of-truth, missing fields, ownership; Process Redesign → workflow, handoffs, queue aging, approvals).
- **P3 Solution Design** — the blocks tell aVa **what options to compare** (A: process redesign only · B: CLM-embedded AI-assisted decision support · C: new workflow orchestration platform).
- **P4 Plan / Business Case** — the blocks become **workstreams** (intake redesign · metadata remediation · CLM workflow config · AI-assisted triage · governance & controls · Tower metrics).
- **P5 Operate** — the blocks become **ownership / RACI** (Legal Ops → process redesign · Data owner → remediation · IT → CLM integration · Legal → control approval · Tower owner → measurement).
- **Tower** — the blocks become **metric groups** (process · data-quality · AI-adoption · control · value).

## 7. UI — a simple card, not a taxonomy

**Recommended solution building blocks** — *"For this Move, AbarVa recommends:"*
1. Redesign the intake process · 2. Clean up contract metadata · 3. Add AI-assisted triage · 4. Configure workflow inside CLM · 5. Keep attorney approval controls · 6. Track value in Tower.

**Not recommended yet:** *Fully autonomous contract review — reason: legal/control readiness is not high enough.* (This is the `ambition ≤ readiness` guardrail made visible.)

## 8. Reconciliation with existing code

- **Reuse `src/lib/programs/taxonomy/solution-archetype-taxonomy.ts`** — its 8 shapes are the AI-shape subset of these blocks (process_redesign, data_remediation, retrieval_copilot, human_in_loop_agent, assistant→decision-support, automation→workflow). Keep its `readinessGates` (data/control/eval) and `antiPatterns` — they become the blocks' *readiness requirements* and *common traps*.
- **Promote 3 enabling blocks to first-class** (not in the current taxonomy): analytics/intelligence layer, controls/governance/risk, value-tracking/operating-cadence.
- **Change from single-pick to multi-select bundle.** `src/lib/programs/suitability/agentic-suitability.ts` becomes the **bundle recommender** — recommends the set of blocks + the "not recommended yet" (over-reach). It no longer returns a single `recommendedArchetype` only; it returns a recommended **bundle** + rationale + readiness gaps.

## 9. Bottom line
The purpose is **not to label the Move** — it is to give AbarVa a reusable advisory playbook: what to ask for, what evidence matters, what options to compare, what controls are needed, what workstreams to create, what metrics to track, what traps to avoid. A Move is a composed solution; the building blocks are the reusable parts.
