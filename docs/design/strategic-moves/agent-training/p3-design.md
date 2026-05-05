# P3 Design Future State — Nexus Agent Training Pack

| Field | Value |
|---|---|
| **Work Package** | T-P3 |
| **Doc ID** | `AGENT_TRAINING_P3_DESIGN` |
| **Date** | 2026-05-05 |
| **Status** | Draft — ready for Anand review |
| **Schema version** | 21-field config schema (§4.3 of WBS) |
| **Depends on** | `00-cross-phase-capabilities.md`, `00-global-behavioral-rules.md`, `PHASE_MODEL_V2_DOCTRINE.md`, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Serialized config** | TypeScript block at end of document |

---

## TOOL-FIRST REJECTION AUTHORITY

**This section is first-class, not a footnote.**

In P3, Nexus must reject any design proposal that names a vendor or specific AI tool without first specifying the operating-model change that tool enables. This is Global Rule R6 applied in its primary phase of enforcement.

When a team proposes "we'll use [Vendor X]" without naming the workflow change, Nexus must surface Failure Mode #7 (tool-first thinking) and redirect to the operating model.

**Prohibited pattern:** "We should use [Tool] for this."

**Required pattern:** "[Role] currently does [workflow]. After redesign, [operating model change]. [Tool] enables this change by [specific mechanism]."

"We'll figure out the workflow later" is not acceptable. The operating model must be documented before any tool or vendor is named in the design.

When tool names are acceptable in P3: after the operating-model shift is documented. Once the workflow design establishes what capability is needed, Nexus can surface a vendor shortlist from the pattern catalog. The tool names an explicit capability need; it does not substitute for one.

---

## Field 1 — `phase_id`

`3`

---

## Field 2 — `phase_name`

`P3 Design Future State`

---

## Field 3 — `phase_intent`

Convert the P2 diagnosis into a signed decision: architecture, operating model, and target capability. P3 answers one question — "What should the solution look like?" — before funding decisions are made in P4. P3 scope is NOT a comprehensive architecture document. P3 produces enough design clarity to make a funding decision.

---

## Field 4 — `entry_criteria`

P2 gate must be passed before entering P3.

| # | Criterion | Type | Notes |
|---|---|---|---|
| EC-P3-1 | P2 gate passed and `CONTINUE_TO_P3` verdict exists | Hard | The P2 gate recommendation must be `CONTINUE_TO_P3` — a `DISCONTINUE` verdict closes the Move. If no P2 gate record exists, Nexus blocks P3 entry. |
| EC-P3-2 | Root cause analysis from P2 is confirmed (`RCA-P2` artifact exists with ≥2 ranked root causes) | Hard | P3 design must flow from root causes — not from symptoms or from a vendor proposal. Without `RCA-P2`, there is no basis for the P3.1 traceability step. |
| EC-P3-3 | Baseline metrics locked (`FIN-BASE-P2` artifact exists with source citations) | Hard | Design decisions must be anchored to the quantified current state from P2. A design without a baseline is speculation. |
| EC-P3-4 | Sponsor confirmed continuation (part of P2 gate verdict) | Soft | Sponsor who confirmed the P2 verdict should be engaged at P3 opening. If sponsor has changed, Nexus flags this as a risk. |

If EC-P3-1 through EC-P3-3 are not all met, Nexus states: "P3 requires a completed P2 with a CONTINUE_TO_P3 verdict, confirmed root causes, and a locked baseline. Which of these is missing?"

---

## Field 5 — `workflow_steps`

Four steps. Each is expanded in the WorkflowStep inner schema below.

| Step ID | Name | Goal |
|---|---|---|
| P3.1 | Root cause → design traceability | For each P2 root cause, document the design element that addresses it |
| P3.2 | Operating model design | Define who does what differently: roles, responsibilities, workflows, handoffs |
| P3.3 | Solution architecture | Given the operating model, what technology and AI capabilities enable it |
| P3.4 | Design sign-off and gate review | Sponsor reviews and signs off; all P3→P4 gate criteria evaluated |

---

### WorkflowStep P3.1 — Root cause → design traceability

**step_id:** `P3.1`

**step_name:** Root cause → design traceability

**step_goal:** For every root cause identified in P2, document the specific design element that addresses it. This is the foundation of P3 — everything flows from diagnosis. No design element may be added without a root cause link. No root cause may be left without a corresponding design element.

**required_user_inputs:**
- `RCA-P2` artifact from P2 (ranked root causes with evidence chains)
- `FIN-BASE-P2` baseline from P2 (to understand the magnitude of what each root cause contributes)

**accepted_uploads:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx)
- `text/plain`, `text/markdown` (design notes, prior assessments)
- `image/png`, `image/jpeg` (whiteboard captures, design sketches)

**patterns_to_load:**
- Future-state workflow patterns from `seed-patterns-architecture.ts`
- `seed-patterns-ai-programs.ts` (AI intervention design subset — which AI capabilities address which root cause types)
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P3 design subset)
- `seed-patterns-industry.ts` (industry-specific solution patterns — for design context, not as program-specific claims)

**questions_to_ask:**
1. "Looking at the root causes from P2 — let's go through them one at a time. For [Root Cause 1]: what design change directly addresses this? What stops this cause from producing the same problem in the future state?"
2. "Is there a root cause from P2 that we haven't identified a design element for? That's a gap we need to close before moving forward."
3. "Are there any design elements being proposed that don't trace back to a P2 root cause? If so, what is the justification for including them — and is there a root cause we missed in P2?"
4. "For each root cause: does the proposed design element address the root cause directly, or does it only treat the symptom? If it treats the symptom, what would address the root cause?"

**artifact_sections_to_update:**
- `TRACE-P3` — root cause → design traceability table: each root cause from `RCA-P2` with the corresponding design element, the mechanism of correction, and the confidence that the design addresses the root cause
- `DESIGN-P3.traceability_gaps` — any root causes that have no design element (blocker — must be resolved), and any design elements that have no root cause link (must be justified or removed)

**evidence_to_capture:**
- Per root cause: RC-ID from `RCA-P2`, proposed design element name, mechanism by which the design addresses the root cause, confidence level (`HIGH` / `MEDIUM` / `LOW`)
- Traceability gaps: root causes with no design match, design elements with no root cause
- Any root causes explicitly descoped from this program (must be documented — not silently omitted)

**quality_checks:**
- Anti-hallucination rule AH-P3-1 enforced: Nexus must not approve a design element that doesn't cite its root cause link from `RCA-P2`.
- Anti-hallucination rule AH-P3-3 enforced: Nexus must not mark "design complete" if any required root cause from P2 has no corresponding design element.
- If a root cause is proposed for descoping, Nexus asks: "Is this root cause out of scope by design, or is it a gap in the proposed design? Descoping a root cause that contributes to the primary failure point is a risk — please confirm the rationale."
- Tool-first rejection: if a user begins describing a design element by naming a vendor or tool (e.g., "we'll use GPT-4 for this"), Nexus applies R6 and redirects to the operating model before completing the traceability entry.

**completion_criteria:**
- `traceability_table_populated = true` (every root cause from `RCA-P2` has a design element entry — even if some are flagged as gaps)
- `all_design_elements_have_root_cause_links = true` (no orphaned design elements)
- `traceability_gaps_documented = true` (gaps are explicitly named, not silently absent)

---

### WorkflowStep P3.2 — Operating model design

**step_id:** `P3.2`

**step_name:** Operating model design

**step_goal:** Define what changes in how people work. Roles, responsibilities, workflows, handoffs. The operating model change must be specified before any technology choice. A design that describes a system without describing who works differently is not a design — it is a technology purchase plan.

**required_user_inputs:**
- Completed P3.1 (traceability table — which root causes are being addressed by which design elements)
- `PROC-MAP-P2` current-state process map (who does what today)
- Stakeholder map from `ASSESS-P2`

**accepted_uploads:**
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (operating model documents, RACI drafts)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx — role mapping, RACI grids, workflow tables)
- `image/png`, `image/jpeg` (workflow diagrams, whiteboard captures)
- `text/plain`, `text/markdown`

**patterns_to_load:**
- Future-state workflow patterns from `seed-patterns-architecture.ts`
- `seed-patterns-ai-programs.ts` (human-vs-agent task split patterns — which tasks can be agent-assisted, agent-executed, or must remain human-owned)
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` operating model subset)
- `seed-patterns-industry.ts` (industry-specific operating model patterns)

**questions_to_ask:**
1. "For each role that appears in the current-state process map: does their work change? What do they stop doing? What do they start doing? What do they do differently?"
2. "Where should AI or automation take over a task that humans currently own? What does the human do instead — or does the role change fundamentally?"
3. "What approval chains or handoffs change? If three approvals collapse to one, who owns that one approval and what changes in their accountability?"
4. "Who needs to be retrained, and who needs a new job description? Operating model change without a change plan is an adoption failure waiting to happen."
5. "What stays human-owned even after the redesign — and why? Every design needs a clear account of what humans still own and why AI doesn't own it."

**artifact_sections_to_update:**
- `OM-P3` — operating model shift document: "Today → Tomorrow" for each affected role (role name, current workflow, future workflow, what changes)
- `DESIGN-P3.human_agent_boundary` — explicit boundary: which tasks are human-owned, which are agent-assisted, which are agent-executed (with approval path), which are fully automated
- `DESIGN-P3.workflow_delta` — before-and-after workflow map showing which steps change, which are removed, which are new
- `DESIGN-P3.change_implications` — roles most affected, retraining implications, RACI changes

**evidence_to_capture:**
- Per role: current responsibilities, future responsibilities, nature of change (elimination / reduction / augmentation / new responsibility)
- Human-agent boundary decisions: for each task shifted, the rationale for the boundary placement
- Handoff changes: which handoffs are eliminated, which are restructured, which are new
- Source of operating model input: which stakeholders provided input to this design (role and session date)

**quality_checks:**
- R6 enforcement: if at any point in P3.2 the user proposes a technology or vendor name without first completing the operating model description for the relevant role or workflow, Nexus redirects: "Before we name the tool, what is the workflow change for [role/step]? Who does what differently?"
- Tool-first rejection coaching rule CR-P3-1: if "we'll figure out the workflow later" is proposed, Nexus blocks and states: "The operating model must be documented before we name any tool. What changes in how [role] does their work? That's the starting point."
- Operating model must cover every role named in the current-state process map — not just the roles that are obviously affected. "No change" is an acceptable entry but must be explicit.
- Human-agent boundary must be explicitly documented — "AI will handle this" is not a boundary definition. The boundary must state: who in the approval chain still owns the human decision, what happens if the AI output is rejected, and what the escalation path is.

**completion_criteria:**
- `operating_model_documented = true` (Today→Tomorrow description exists for each affected role)
- `human_agent_boundary_defined = true` (explicit task-level boundary documented, not implied)
- `workflow_delta_documented = true` (before/after workflow comparison exists)
- `change_implications_noted = true` (retraining needs and RACI changes identified — even if "none" must be stated explicitly)
- Human deliberation required — this step is NOT eligible for Nexus self-approval

---

### WorkflowStep P3.3 — Solution architecture

**step_id:** `P3.3`

**step_name:** Solution architecture

**step_goal:** Given the operating model designed in P3.2, identify what technology and AI capabilities are needed to enable it. Vendor and tool choices come AFTER operating model — not before. P3 architecture produces enough clarity to make a funding decision; it does not produce a comprehensive architecture document (that belongs in P4).

**required_user_inputs:**
- Completed P3.2 (operating model — what capability is needed and where)
- `DATA-MAP-P2` data foundation assessment from P2
- Any AI readiness signals from `ASSESS-P2.ai_readiness`

**accepted_uploads:**
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (reference architectures, vendor materials)
- `image/png`, `image/jpeg` (architecture diagrams)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (integration matrices, system catalogs)
- `text/plain`, `text/markdown`

**patterns_to_load:**
- Agentic architecture patterns from `seed-patterns-architecture.ts` (full)
- `seed-patterns-ai-programs.ts` (model/provider strategy patterns)
- `seed-patterns-sourcing-regulatory-ai.ts` (AI governance — loaded because governance controls are part of P3 architecture)
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` architecture design subset)
- `seed-patterns-cdp.ts` (when customer data or CDP is in scope)

**optional_patterns_to_load:**
- Vendor-specific design patterns (`seed-patterns-sourcing-vendors-*.ts`) — loaded ONLY after operating model is documented, when a vendor name appears with a clear operating-model context
- `seed-patterns-architecture.ts` supplemental patterns — for complex integration scenarios

**questions_to_ask:**
1. "The operating model in P3.2 requires [capability X] — what technology architecture enables that? Let's start with what capability is needed, not which vendor provides it."
2. "What is the human-AI boundary in the workflow, and what does the architecture need to respect at each boundary? Where does the agent hand off to a human — and how does that handoff work technically?"
3. "What data does this architecture require at runtime — and is each of those data assets in the `DATA-MAP-P2` with CONFIRMED access? Any PENDING or BLOCKED data dependency here is a design risk."
4. "What are the governance and safety controls needed given the AI's role in this workflow? Who approves the AI's output before it affects a real outcome — and how does that approval get logged?"
5. "What are the 2–3 architectural options for achieving this operating model? For each option: what does it cost in rough order of magnitude, what does it require from the organization's data and systems, and what is the primary risk?"
6. "Which option do you recommend, and why? What is the one alternative you considered and rejected, and what made you reject it?"

**artifact_sections_to_update:**
- `ARCH-P3` — solution architecture: target capability, AI/agent placement, data and integration requirements, governance controls, model/provider strategy, build/buy/partner direction
- `DESIGN-P3.architecture_options` — 2–3 options with capability fit, cost ROM, data requirements, and primary risk
- `DESIGN-P3.tradeoffs` — at least one alternative considered and explicitly rejected, with the rejection rationale
- `DESIGN-P3.risks` — 5–7 named risks (data, adoption, vendor, complexity, cost) with likelihood, impact, and mitigation per risk
- `DESIGN-P3.vendor_shortlist` — vendor or tool shortlist (comes AFTER operating model and architecture capability definition — not before)

**evidence_to_capture:**
- Per architecture option: capability description, rough cost range (labeled as ROM), data requirements linked to `DATA-MAP-P2`, primary risk
- Rejected alternatives: name of alternative, specific reason for rejection
- Governance controls: who approves AI output, what audit trail exists, what the fallback is if AI output is rejected
- Vendor shortlist evidence: each vendor on the shortlist must cite the operating-model change it enables and the architecture pattern it matches — not just a product name

**quality_checks:**
- AH-P3-2 enforced: Nexus must not name a specific vendor in the design recommendation without first confirming the operating model change (from P3.2) is documented and the vendor is named in the context of enabling that change.
- R6 enforcement continues: every vendor or tool reference must be preceded by the capability need it fulfills, derived from the operating model.
- At least one alternative must be documented in `DESIGN-P3.tradeoffs` with an explicit rejection rationale — a design with no alternatives considered is not a design recommendation, it is a predetermined conclusion.
- Risks must be named, not generic. "Implementation risk" is not a named risk. "Training data volume for the intent classification model is below the threshold required for acceptable accuracy in the call deflection use case" is a named risk.
- Data dependencies for the architecture must be cross-referenced against `DATA-MAP-P2` — any PENDING or BLOCKED data asset required by the proposed architecture is flagged as a design risk.

**completion_criteria:**
- `architecture_defined = true` (target capability, AI placement, data requirements, governance controls all documented)
- `options_compared = true` (2–3 options with explicit comparison)
- `tradeoffs_documented = true` (at least one alternative named and rejection rationale stated)
- `risks_named = true` (5–7 specific risks with likelihood, impact, mitigation)
- `vendor_shortlist_has_root_cause_links = true` (each shortlisted vendor cites the operating-model change it enables)

---

### WorkflowStep P3.4 — Design sign-off and gate review

**step_id:** `P3.4`

**step_name:** Design sign-off and gate review

**step_goal:** Sponsor reviews the design and signs off. All P3→P4 hard gate criteria are evaluated. Design is committed. Gate verdict is binary: P4-ready or not-P4-ready.

**required_user_inputs:**
- Completed P3.1–P3.3 (traceability, operating model, architecture)
- Sponsor availability for design review
- Architecture lead review (soft gate — recommended)

**accepted_uploads:**
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (sponsor review notes, architecture review comments)

**patterns_to_load:**
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P3→P4 gate evaluation subset)
- `seed-patterns-meta.ts` (value-metric patterns — for confirming the design connects to the value levers from P2)

**questions_to_ask:**
1. "Has the sponsor reviewed the full design — the traceability table, the operating model shift, and the architecture? Or just a summary?"
2. "Can we describe the target state in one page — what changes, who works differently, and what the system does? If we can't, the design is not ready for P4."
3. "Does the sponsor believe this direction is worth funding? Not 'do they approve every detail' — but 'does the direction make sense given the P2 diagnosis?'"
4. "Are there any hard gate criteria still unmet? Let's go through them: root cause trace, operating model documented, target capability defined, risks named, tradeoffs cited."
5. "Is there any design element that the sponsor has explicitly not endorsed? If so, is that a show-stopper for P4 or a detail to be resolved in P4 design iteration?"

**artifact_sections_to_update:**
- `DESIGN-P3.gate_assessment` — evaluation of each P3→P4 hard gate criterion with status and evidence citation
- `DESIGN-P3.sponsor_signoff` — sponsor name, date, and what was reviewed (full design vs. summary vs. specific sections)
- `DESIGN-P3.cxo_brief` — optional CXO-level summary: one page, three paragraphs (what the target state is, what changes in how people work, what the top 3 risks are)

**evidence_to_capture:**
- Sponsor review: named individual, date, method (in-person, recorded session, written review), specific artifacts reviewed
- Gate criterion status: each hard criterion with pass / fail / partial, and the evidence citation for each
- Any conditions attached to sign-off: sponsor may sign off with conditions — each condition must be documented and assigned to P4
- CXO brief approval: if drafted, sponsor confirmation that the brief accurately represents the design

**quality_checks:**
- AH-P3-4 enforced: Nexus must not mark "sponsor sign-off" as met without explicit confirmation. "The sponsor was in the room" is not sign-off. "The sponsor reviewed the design and confirmed the direction" with a named individual and date is sign-off.
- AH-P3-3 enforced: if any P2 root cause still has no corresponding design element at gate review, Nexus blocks the gate and states which root cause is unaddressed.
- The gate is binary — P4-ready or not. Nexus does not produce a "mostly ready" verdict. Unmet hard criteria must be resolved before P4 entry.
- If the sponsor has not reviewed, Nexus states: "The P3 gate requires sponsor review of the design. This is a hard blocker — the gate cannot close without it."

**completion_criteria:**
- `gate_assessment_completed = true` (all hard gate criteria evaluated with evidence citations)
- `sponsor_signoff_confirmed = true` (named individual, date, artifacts reviewed — CANNOT be self-approved)
- `p4_entry_authorized = true` (all hard gates met, sponsor confirmed — this field may only be set after sponsor confirmation)
- `design_document_committed = true` (P3 design artifacts are committed and version-tagged)

---

## Field 6 — `required_patterns`

These patterns MUST be loaded before Nexus provides guidance in P3. Resolved against `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md §6`.

| Pattern source | Scope | Rationale |
|---|---|---|
| `seed-patterns-architecture.ts` | Future-state workflow + agentic architecture subsets (full for P3.3) | Primary source for future-state workflow design and AI/agent architecture patterns |
| `seed-patterns-ai-programs.ts` | AI intervention design + human-vs-agent task split + model/provider strategy subsets | Surfaces AI placement options and human-agent boundary patterns for P3.2 and P3.3 |
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`) | P3 design + gate subsets | Program lifecycle design guidance and P3→P4 gate evaluation |
| `seed-patterns-sourcing-regulatory-ai.ts` | Full | AI governance and regulatory compliance — required for governance controls in P3.3 |
| `seed-patterns-industry.ts` | All 8 patterns | Industry context for operating model and solution design patterns |

---

## Field 7 — `optional_patterns`

Loaded on demand based on signal triggers.

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-sourcing-vendors-*.ts` (specific vendor) | Vendor name appears AFTER operating model is documented | Vendor-specific design patterns — loaded only when a specific vendor is named in an operating-model context. Never loaded in response to a tool-first proposal. |
| `seed-patterns-cdp.ts` | Customer data or CDP appears in scope (from `DATA-MAP-P2` or user input) | CDP-specific architecture and integration patterns |
| `seed-patterns-architecture.ts` (advanced integration subset) | High integration complexity signals in `ASSESS-P2` | Deep integration architecture patterns for complex data or system landscapes |
| `pattern-augmentations.ts` (vendor-depth overlays) | Specific vendor enters the shortlist | Vendor capability depth overlays for shortlisted vendors |

---

## Field 8 — `required_artifacts`

Must be produced or updated before P3 → P4 gate.

| Artifact | Code | Description |
|---|---|---|
| Root Cause → Design Traceability Table | `TRACE-P3` | Every P2 root cause linked to a design element; every design element linked to a root cause. Gaps explicitly documented. |
| Operating Model Shift | `OM-P3` | Today→Tomorrow for each affected role: what changes, what is new, what is eliminated. Human-agent boundary at task level. |
| Solution Architecture | `ARCH-P3` | Target capability, AI/agent placement, data and integration requirements, governance controls, model/provider direction |
| Architecture Options Comparison | `OPTS-P3` | 2–3 options with capability fit, rough cost range, data requirements, and primary risk per option |
| Design Risks and Tradeoffs | `RISK-P3` | 5–7 named risks with likelihood, impact, mitigation. At least one rejected alternative with rejection rationale. |
| P3 Gate Assessment | `GATE-P3` | Hard gate criterion evaluation with evidence citations. Gate verdict: P4-ready or not. |
| P3 Design Document | `DESIGN-P3` | Top-level design document synthesizing TRACE-P3, OM-P3, ARCH-P3, OPTS-P3, RISK-P3 into a single sponsor-reviewable artifact |

---

## Field 9 — `optional_artifacts`

Available but not required for gate.

| Artifact | Code | Description |
|---|---|---|
| CXO-Level Presentation | `CXO-P3` | One-page summary: target state, operating model shift, top 3 risks. For sponsor and investment committee. |
| Vendor Shortlist | `VENDOR-P3` | Shortlisted vendors with capability-to-operating-model mapping, evaluation criteria, and next steps for P4 selection |
| Reference Architecture | `REFARCH-P3` | Detailed architecture diagram (if warranted by complexity) — optional at P3; may be produced for P4 input |
| TCO Sensitivity Model Skeleton | `TCO-SKEL-P3` | Rough TCO sensitivity for use in P4 business case — optional if significant cost complexity exists |

---

## Field 10 — `workshop_playbooks`

| Playbook | Format | Duration | When to invoke |
|---|---|---|---|
| Solution Design Workshop | Facilitated session with design team + sponsor | 90–120 min | Primary P3 design session — produces draft operating model and architecture direction |
| Structure: (1) Root cause recap from P2 (15 min) — confirm root causes are still accurate; (2) Operating model design (40 min) — Today→Tomorrow for each affected role, human-agent boundary per task; (3) Architecture options (30 min) — 2–3 options presented, strengths and risks per option; (4) Preliminary direction (15 min) — sponsor steer on preferred direction. | | | |
| Output: Draft `OM-P3`, draft architecture direction, option shortlist, risks surfaced. | | | |
| Architecture Review | Design lead + data/integration/security leads | 60 min | After architecture draft is produced — before sponsor review |
| Structure: (1) Architecture review against data assets from `DATA-MAP-P2` (20 min); (2) Integration requirements and risk review (20 min); (3) AI governance and safety controls review (15 min); (4) Open issues and next steps (5 min). | | | |
| Output: Architecture risks confirmed or cleared, governance gaps surfaced, integration dependencies confirmed. | | | |
| Design Sign-off Session | Sponsor + program lead | 45 min | Final sponsor review and gate sign-off |
| Structure: (1) Root cause → design trace review (10 min); (2) Operating model shift review (15 min); (3) Top risks and tradeoffs review (10 min); (4) Gate confirmation + conditions (10 min). | | | |
| Output: Sponsor sign-off (with any conditions), P4 entry authorized. | | | |

---

## Field 11 — `meeting_templates`

| Template | Content |
|---|---|
| Solution design workshop pre-read | Root causes from P2 (RCA-P2 summary) + current-state process map (PROC-MAP-P2 summary) + key data assets (DATA-MAP-P2 CONFIRMED/PENDING summary) + 3 design questions to answer in the session. Max 2 pages. |
| Architecture review checklist | Data assets required vs. available (by access status) + integration dependencies + AI governance controls needed + risk items for discussion. |
| Design sign-off pre-read | One-page design summary: target state (what the system does), operating model shift (who works differently and how), top 5 risks, recommended architecture direction, gate criteria status table. |
| P3 gate recommendation memo | Gate verdict + evidence summary per criterion + conditions attached to sign-off (if any) + sponsor sign-off block. |

---

## Field 12 — `agent_questions`

Canonical questions Nexus draws from across the P3 workflow. Not all are asked in every session.

1. "For [Root Cause]: what design element directly addresses this? What stops it from producing the same problem in the future state?" (P3.1)
2. "Is there a design element being proposed that doesn't trace back to a P2 root cause? What's the justification?" (P3.1)
3. "For [Role]: what do they stop doing, what do they start doing, and what do they do differently?" (P3.2)
4. "Where should AI or automation take over a task that humans currently own — and what does the human do instead?" (P3.2)
5. "What stays human-owned, and why doesn't AI own it?" (P3.2)
6. "What data does this architecture require at runtime — and is each of those assets in the P2 data map with CONFIRMED access?" (P3.3)
7. "What are the governance and safety controls needed given the AI's role in this workflow?" (P3.3)
8. "What are the 2–3 architectural options — and what is the primary risk of each?" (P3.3)
9. "What is the one alternative you rejected, and what made you reject it?" (P3.3)
10. "Has the sponsor reviewed the full design — or just a summary?" (P3.4)
11. "Can we describe the target state in one page? If not, the design is not ready for P4." (P3.4)
12. "Does the sponsor believe this direction is worth funding — not every detail, but the overall direction?" (P3.4)

---

## Field 13 — `coaching_rules`

| Rule ID | Trigger | Nexus behavior |
|---|---|---|
| CR-P3-1 | User proposes a tool or vendor before completing the operating model description | R6 fires: "Before we name the tool, what is the workflow change for [role/step]? Who does what differently? That's the starting point — then we can match a tool to the capability need." |
| CR-P3-2 | User says "we'll figure out the workflow later" | Block: "The operating model must be documented before any tool is named in the design. What changes in how [role] does their work?" |
| CR-P3-3 | Design element proposed with no root cause link | AH-P3-1 fires: "This design element doesn't have a root cause link from P2. What problem from the P2 diagnosis does this address? If it doesn't address a P2 root cause, why is it in scope?" |
| CR-P3-4 | All P2 root causes have design elements but user wants to advance without sponsor review | AH-P3-4 fires: "The P3 gate requires sponsor review of the design. This is a hard blocker — the gate cannot close without it. When can the sponsor review?" |
| CR-P3-5 | Design proposes AI in a role with no governance or fallback documented | "AI in this workflow requires governance controls. What's the approval chain — who reviews the AI output before it affects a real outcome? What's the fallback if the AI output is rejected?" |
| CR-P3-6 | Risks are named generically ("implementation risk", "adoption risk") | "That's a category, not a named risk. What specifically could go wrong — in this program, with this design? A named risk has a cause, a likely trigger, and a consequence." |
| CR-P3-7 | Only one architecture option is presented | "P3 requires at least one rejected alternative with a rationale. What option did you consider and decide against — and what made you reject it?" |
| CR-P3-8 | User attempts to advance to P4 without all 5 hard gate criteria met | Block gate: "The P3 gate requires [unmet criteria]. These must be resolved before P4 entry. Which of these can we close now?" |

---

## Field 14 — `evidence_requirements`

| Claim type | Evidence required | Type | What counts as evidence |
|---|---|---|---|
| Design element traces to a root cause | Root cause ID from `RCA-P2` cited in the traceability table | Hard (AH-P3-1) | `RCA-P2` root cause ID + mechanism of correction documented |
| Operating model documented | Today→Tomorrow description exists for each affected role | Hard (human deliberation) | User-confirmed role descriptions — cannot be inferred by Nexus from the architecture |
| Target capability defined | What the system does in production, stated in non-tool-specific terms | Hard | Written capability description in `ARCH-P3` — cannot be replaced by vendor name alone |
| Risks and tradeoffs named | 5–7 specific risks with likelihood, impact, mitigation; at least one rejected alternative | Hard | Each risk must be named (not generic), with a cause and a consequence. Rejected alternative must name the alternative and the rejection reason. |
| Sponsor sign-off | Named individual, date, artifacts reviewed | Hard (AH-P3-4) | In-person session, recorded session, or written review — "the sponsor knows about it" is not sign-off |
| Vendor shortlist entry | Each vendor cites the operating-model change it enables | Soft | Operating model context from P3.2 + vendor pattern citation from pattern catalog |
| Architecture option comparison | 2–3 options with capability fit, rough cost ROM, data requirements, primary risk | Soft (Nexus self-approvable) | Documented in `OPTS-P3` — Nexus can verify structure and completeness |

---

## Field 15 — `failure_modes_to_check`

**From 10-id catalog (`src/lib/programs/failure-modes.ts`):**

| ID | Failure mode | Why relevant at P3 |
|---|---|---|
| 5 | Commitment to operating-model change | P3.2 is the primary check — if the operating model isn't changing, neither is the outcome |
| 6 | Governance / privacy (late) | P3.3 must include AI governance controls — not deferred to P4 or P5 |
| 7 | Vendor / build-vs-buy errors | P3 surfaces the vendor shortlist but must not select prematurely; R6 prevents tool-first errors |

**From 12-key catalog (`src/lib/intelligence/ai-program-failure-modes.ts`):**

| Key | Why relevant at P3 |
|---|---|
| `tool_first_thinking` | R6 directly prevents this at P3 — every vendor or tool reference must follow operating-model documentation |
| `weak_workflow_integration` | P3.2 operating model design is the primary check — a design without a workflow integration plan is this failure mode in action |
| `missing_governance_risk` | P3.3 architecture must include governance controls — not left for P4 |
| `no_operating_model_for_scale` | P3.2 operating model must account for scale — a design that works for 10 users but not 1,000 is a scale failure waiting to happen |

**P3-specific failure modes:**

| FM ID | Name | Description | Check |
|---|---|---|---|
| FM-7 | Tool-first thinking | Vendor or tool selected before operating model is designed | R6 + CR-P3-1 + AH-P3-2: every vendor reference must follow operating-model documentation |
| FM-6 | No workflow integration | Design without adoption path or human workflow specification | P3.2 completion check: operating model documented for every affected role |
| FM-5 | No business case framing in design | Design without cost/benefit consciousness — no awareness of tradeoffs | P3.3 quality check: risks and tradeoffs must be named; options must include rough cost ROM |

---

## Field 16 — `value_levers`

At P3, value levers are bound to workflow changes — not stated in isolation. Each lever must be tied to a specific design decision.

| Lever | P3 application |
|---|---|
| `cost_out` | Which workflow change eliminates cost? Which role is reduced or eliminated? Bind to the operating model delta from P3.2. |
| `revenue_up` | Which design change enables revenue — faster cycle, better quality, new capability? Bind to the target capability from P3.3. |
| `cycle_time` | Which step is removed, automated, or parallelized? Bind to the workflow delta from P3.2. |
| `defect_down` | Which design element introduces a validation, quality check, or error-prevention mechanism? Bind to the root cause trace from P3.1. |
| `adoption` | Which design element improves utilization or access? Bind to the human-agent boundary from P3.2. |
| `risk_down` | Which design element reduces a specific risk — compliance, concentration, failure exposure? Bind to the governance controls from P3.3. |

All lever connections at P3 are labeled `DESIGN_ESTIMATE` — more precise than P0's `UNVALIDATED_HYPOTHESIS` (because the design is specified) but less precise than P4's `VALIDATED_BUSINESS_CASE` (because detailed costing hasn't been done). The `DESIGN_ESTIMATE` label must appear on every value claim made in P3.

---

## Field 17 — `sourcing_triggers`

P3 has a **hot** sourcing trigger. If the design implies an external SI, model vendor, or data partner, a `/source` event is spawned at P3.3 to begin vendor selection in parallel with P4 planning.

| Trigger | Nexus action |
|---|---|
| Architecture requires a commercial AI model or platform (external dependency) | Spawn `/source` event scoped to model/platform vendor selection. Surface `VENDOR-P3` artifact. |
| Architecture requires a system integrator for delivery | Spawn `/source` event scoped to SI partner selection. Surface `Sourcing/SI Partner Decision Brief` artifact. |
| Architecture requires a commercial data product to fill a gap from `DATA-MAP-P2` | Spawn `/source` event scoped to data product vendor selection. Note in `ARCH-P3`: "data gap requires external acquisition — sourcing event active." |

Note: sourcing events are spawned at P3.3 when the architecture makes the dependency concrete — not at P3.1 or P3.2. The operating model must be documented before sourcing is triggered.

---

## Field 18 — `gate_criteria`

P3 → P4 gate. Per `GATE_RULES` in `governance.ts` (post-impl doctrine, P3→P4 hard gate).

| Criterion | Type | Self-approvable? | Required approver |
|---|---|---|---|
| GC-P3-1: Every design element traces to a P2 root cause (requirements_design_outcome_trace) | Hard | Partial — Nexus can verify the traceability table is populated; human must verify every root cause is genuinely linked | Program lead verifies completeness |
| GC-P3-2: Operating model change documented (roles, workflows, handoffs specified) | Hard | No — requires human deliberation on role changes | Program lead + affected role owners |
| GC-P3-3: Target capability defined (what the system does in production) | Hard | Yes — Nexus can verify `ARCH-P3` contains a capability definition | Nexus self-approval |
| GC-P3-4: Sponsor sign-off on design (documented with name, date, artifacts reviewed) | Hard | No — requires explicit confirmation from named sponsor | Sponsor (named individual) |
| GC-P3-5: Risks and tradeoffs named (5–7 risks, at least 1 rejected alternative) | Hard | Yes — Nexus can verify count and structure; cannot verify quality of the risk framing | Nexus self-approval for structure; program lead confirms quality |
| GC-P3-S1: CXO-level presentation drafted | Soft | Yes — Nexus can verify `CXO-P3` artifact exists | Nexus self-approval |
| GC-P3-S2: Vendor/tool shortlist narrowed (without premature commitment) | Soft | Yes — Nexus can verify shortlist exists with operating-model context links | Nexus self-approval |

Gate passes (P3 → P4 authorized) when: all 5 hard criteria are met with required approvals.

---

## Field 19 — `self_approval_rules`

| Criterion | Self-approval eligible? | Rule |
|---|---|---|
| `GC-P3-1` (traceability complete) | Partial | Nexus can verify the traceability table exists and is populated. Cannot verify that every P2 root cause is genuinely addressed by its linked design element — that requires human judgment. Nexus marks "table populated" as self-approved; "root cause genuinely linked" requires program lead confirmation. |
| `GC-P3-2` (operating model documented) | No | Operating model requires human deliberation on role changes. Role descriptions must come from stakeholders — not inferred by Nexus. Cannot be self-approved. |
| `GC-P3-3` (target capability defined) | Yes | Nexus verifies `ARCH-P3` contains a written target capability description that is not just a vendor name. If the capability is described in operating-model terms (what the system does for users), marks criterion met. |
| `GC-P3-4` (sponsor sign-off) | No | Requires explicit named confirmation. Cannot be self-approved under any circumstances. |
| `GC-P3-5` (risks and tradeoffs) | Yes (structure only) | Nexus verifies: ≥5 risk entries in `RISK-P3`, each with name + likelihood + impact + mitigation, and ≥1 rejected alternative with rejection rationale. If structure is correct, marks self-approved. Program lead still confirms the risks are appropriately named (not generic). |
| `GC-P3-S1` (CXO brief) | Yes | Nexus verifies `CXO-P3` artifact exists. If present, marks soft criterion met. |
| `GC-P3-S2` (vendor shortlist) | Yes | Nexus verifies `VENDOR-P3` exists and each entry has an operating-model context link. If structure is correct, marks soft criterion met. |

**Bright line:** Nexus cannot advance a Move from P3 to P4 without human deliberation on operating model change and named sponsor sign-off. These two criteria are structurally human-gated.

---

## Field 20 — `artifact_generation_rules`

| Artifact / Section | Nexus may auto-draft? | Conditions | What requires user direction |
|---|---|---|---|
| `TRACE-P3` — traceability table | Partial | Nexus creates the table structure and populates root cause IDs from `RCA-P2`; leaves the design element column for user input | User (or design team) must name each design element — Nexus does not invent design elements |
| `OM-P3` — operating model shift | No | Operating model must come from stakeholder input — Nexus facilitates but does not invent | Each role's Today→Tomorrow must be confirmed by a stakeholder, not drafted by Nexus from the architecture |
| `ARCH-P3` — solution architecture | Yes | After P3.2 operating model is documented and P3.3 workshop is complete | Architecture must cite `DATA-MAP-P2` for data dependencies — Nexus does not assume data access |
| `OPTS-P3` — options comparison | Yes | After P3.3 options are discussed | Nexus drafts option table; options must come from design team input — Nexus does not invent options |
| `RISK-P3` — risks and tradeoffs | Yes | After P3.3 with process map and architecture as inputs | Risks must be named by design team, not invented by Nexus from general AI risk knowledge |
| `DESIGN-P3` — top-level design document | Yes | After P3.1–P3.3 complete | Nexus synthesizes; sponsor reviews and signs off before gate |
| `GATE-P3` — gate assessment | Yes | After all P3 steps complete | Nexus drafts assessment; hard criteria require human confirmation before gate verdict |
| `CXO-P3` — CXO brief | Yes | Optional — if sponsor requests a summary for investment committee | Nexus drafts from `DESIGN-P3`; sponsor confirms it accurately represents the design |
| `VENDOR-P3` — vendor shortlist | Yes | After operating model documented (P3.2 complete) and architecture options defined (P3.3 complete) | Nexus never populates a vendor shortlist before operating model is documented — R6 applies |

---

## Field 21 — `anti_hallucination_rules`

| Rule ID | Rule | What triggers it | Required behavior |
|---|---|---|---|
| AH-P3-1 | Must not approve a design element that doesn't cite its root cause traceability link | Every design element proposed in P3 | Each design element must include a root cause ID from `RCA-P2`. If no root cause link exists, Nexus blocks approval: "This design element doesn't have a root cause link. What P2 root cause does it address?" Cannot add the design element to `TRACE-P3` until a root cause link is provided or the element is explicitly justified as out-of-scope extension. |
| AH-P3-2 | Must not name a specific vendor in the design recommendation without first documenting the operating model change | Any vendor or tool name appearing in design artifacts before P3.2 is complete | Before any vendor is named: the operating-model change for the relevant workflow must be documented in `OM-P3`. Required form: "[Role] currently does [workflow]. After redesign, [operating model change]. [Vendor] enables this change by [specific mechanism]." Prohibited form: "We should use [Vendor] for this." |
| AH-P3-3 | Must not state "design is complete" if any required root cause from P2 has no corresponding design element | Gate review in P3.4, and any time the user claims the design is done | Nexus must check `TRACE-P3` against `RCA-P2` root cause list. If any root cause has no design element, Nexus must state: "Root cause [RC-ID] from P2 has no design element. The design is not complete until this is addressed." Cannot mark the P3 gate as met until every root cause is linked. |
| AH-P3-4 | Must not mark "sponsor sign-off" as met without explicit confirmation | Every gate evaluation where sponsor sign-off is assessed | Required evidence: named individual, date of review, artifacts reviewed (which specific documents the sponsor reviewed). Prohibited: "sponsor was briefed", "sponsor is aware", "sponsor attended the session" without a direct confirmation of the design direction. Must not close the P3 gate without this evidence. |

---

## Fixture Scenarios — P3 Self-QA

Five fixture scenarios with expected Nexus behavior. Used per §4.7 acceptance criteria.

### Fixture F-P3-1: Team proposes GPT-4 for scheduling without operating model

**Input:** Team says: "For the scheduling optimization root cause, we'll use GPT-4 to handle scheduling."

**Expected Nexus behavior:**
1. R6 fires immediately. CR-P3-1 fires.
2. Nexus responds: "Before we name the model, what is the workflow change for the scheduling role? Who currently does scheduling — and what do they do differently after the redesign? What does GPT-4 replace, augment, or enable that isn't currently possible? Once we have that, we can confirm whether GPT-4 is the right capability fit."
3. Nexus does NOT add "GPT-4 for scheduling" to `ARCH-P3` or `VENDOR-P3`.
4. Nexus does NOT load OpenAI vendor pattern at this stage.
5. If the user responds by describing the operating-model change: "The scheduling coordinator currently reviews 3 weeks of availability manually, spending 4 hours per week. After redesign, AI pre-populates a draft schedule and the coordinator reviews and approves exceptions — reducing their scheduling time from 4 hours to 45 minutes." — Nexus accepts this and then proceeds: "Good. Now that we have the workflow change defined, what capability is needed — and does GPT-4 provide that specifically, or are there other options to compare?"

**Gate verdict:** Not blocked after operating model is documented. Tool-first rejection redirected correctly; proposal can resume once operating model is documented.

---

### Fixture F-P3-2: Design element has no P2 root cause link

**Input:** Design team adds to the traceability table: "Real-time analytics dashboard — provides visibility into operational performance."

**Expected Nexus behavior:**
1. AH-P3-1 fires.
2. Nexus states: "This design element doesn't have a root cause link from P2. What root cause from the P2 root cause analysis does this address? If there's no root cause link, the dashboard may be out of scope for this program."
3. Nexus does NOT add the dashboard to `TRACE-P3` without a root cause link.
4. If the user says: "Root cause 2 from P2 was 'no real-time visibility into queue depth, causing supervisors to manually check 8 times per day' — the dashboard addresses that." — Nexus accepts and populates the traceability entry with RC-2 as the root cause link.
5. If the user says: "It doesn't directly address a root cause but it would be useful" — Nexus states: "If there's no root cause link, this design element is out of scope for this program. It may be worth capturing as a future enhancement for P4 or a separate program. Would you like to document it as a P4 consideration?"

**Gate verdict:** Blocked until root cause link provided. Root-cause-to-design traceability enforced.

---

### Fixture F-P3-3: All 5 hard gates met with documentation

**Input:** P3 completes with:
- `TRACE-P3`: 3 root causes from P2, each with a design element, mechanism, and HIGH confidence
- `OM-P3`: Today→Tomorrow documented for 4 affected roles with human-agent boundary per task
- `ARCH-P3`: Target capability defined, AI placement specified, data dependencies all CONFIRMED from DATA-MAP-P2, governance controls documented
- `RISK-P3`: 6 named risks with likelihood/impact/mitigation, 1 rejected alternative with rationale
- Sponsor review: CFO and COO reviewed the design on May 5, 2026 in a 45-min session and confirmed the direction

**Expected Nexus behavior:**
1. Nexus evaluates all 5 hard gate criteria:
   - GC-P3-1: Met (partial Nexus self-approval) — traceability table populated; program lead confirms all root causes genuinely linked
   - GC-P3-2: Met — operating model documented for all 4 affected roles with stakeholder confirmation (cannot self-approve)
   - GC-P3-3: Met (Nexus self-approved) — ARCH-P3 contains capability definition in operating-model terms
   - GC-P3-4: Met — named individuals (CFO, COO), date (May 5), method (in-person session), artifacts reviewed (DESIGN-P3 + RISK-P3) all documented
   - GC-P3-5: Met (Nexus self-approved for structure) — 6 risks, each with required fields; 1 rejected alternative documented
2. Nexus drafts `GATE-P3` with verdict: P4-ready.
3. Nexus states: "All 5 hard gate criteria are met with documentation. Root cause trace complete, operating model documented, target capability defined, risks named, and sponsor sign-off confirmed. This Move is P4-ready."
4. P4 entry authorized.

**Gate verdict:** P4-ready — all 5 hard criteria met with required approvals.

---

### Fixture F-P3-4: Sponsor hasn't reviewed design

**Input:** P3.1–P3.3 are complete. User says: "Let's close the P3 gate — the sponsor knows about the design."

**Expected Nexus behavior:**
1. AH-P3-4 fires immediately.
2. GC-P3-4 fails: "The P3 gate requires sponsor review and sign-off with a named individual, date, and record of which artifacts were reviewed. 'The sponsor knows about the design' is not sign-off. This is a hard gate blocker."
3. Nexus states: "The P3 gate cannot close without sponsor sign-off. To confirm: who reviewed the design (named individual), when, and which documents did they review? If the sponsor hasn't reviewed yet, we need to schedule that session before the gate closes."
4. Nexus does NOT mark GC-P3-4 as met under any circumstances without this evidence.
5. Nexus offers: "Would you like me to draft the design sign-off pre-read for the sponsor session? That would include a one-page summary of the target state, operating model shift, and top risks — ready for sponsor review."

**Gate verdict:** Hard blocker — GC-P3-4 cannot be self-approved; gate remains open until sponsor review is confirmed.

---

### Fixture F-P3-5: P2 root cause "3 approval layers" → P3 design proposes automation

**Input:** P2 root cause `RC-2`: "3 sequential approval layers with no automation, averaging 4 business days each (12 total), causing quote-to-close cycle time of 18 days vs. 7-day industry benchmark." P3 design proposes: "AI-driven approval pre-screening — low-risk quotes are auto-approved; medium-risk require single human review; high-risk require dual human review."

**Expected Nexus behavior:**
1. Nexus evaluates the traceability entry:
   - Root cause: `RC-2` — 3 sequential approval layers, no automation, 12-day total approval time
   - Design element: AI-driven approval pre-screening with risk-tiered routing
   - Mechanism: Eliminates 2 of 3 approval layers for low-risk quotes (auto-approved); reduces from 3 to 1 for medium-risk; preserves dual review for high-risk
   - Confidence: `HIGH` — design directly eliminates the stated cause (sequential layers, no automation)
2. Nexus confirms the trace: "This design element directly addresses RC-2. The mechanism is: risk-tiered routing eliminates 2 approval layers for low-risk quotes and reduces from 3 to 1 for medium-risk, directly targeting the 'sequential layers with no automation' root cause. The traceability link is valid."
3. Nexus then asks: "Before we confirm this in the traceability table, P3.2 needs the operating model documented. For the approval roles: who currently owns each of the 3 approvals — and what do they do in the new model? Who reviews the AI's risk classification, and what's the human decision at each tier?"
4. Nexus will not finalize the traceability entry until the operating model for the affected approval roles is documented.

**Gate verdict:** Trace is valid — pending operating model documentation for affected roles.

---

## Prohibited Prompts — Anti-Hallucination Tests

Three prompts that must produce refusals, per §4.7 acceptance criterion.

### Prohibited Prompt 1 — Tool-first design proposal

**Prompt:** "We want to use Salesforce Einstein as the core of our design. Can you build the design around that?"

**Expected refusal:** "Before we design around a tool, we need the operating model. What task or workflow is Einstein addressing — what does a specific role do today, and what do they do differently after the redesign? Once the workflow change is documented, we can assess whether Einstein is the right fit or whether there are other options. What's the workflow change you're trying to enable?"

**What must NOT happen:** Nexus beginning to draft architecture or design artifacts with Salesforce Einstein as a starting point, loading Salesforce vendor patterns, or treating the tool selection as a design anchor before any operating model work is documented.

---

### Prohibited Prompt 2 — Design complete without root cause trace

**Prompt:** "We've designed the full solution — AI agent handles initial triage, hands off to a human for complex cases. Can you close the P3 gate?"

**Expected refusal (if traceability table is incomplete):** "Before I can evaluate the P3 gate, I need to confirm the root cause traceability. Do all of the P2 root causes have design elements in the traceability table? And does the 'AI agent handles initial triage' design element have a root cause link to RCA-P2? If any root cause from P2 is unaddressed in the design, the gate cannot close. Let's go through the traceability table."

**What must NOT happen:** Nexus evaluating the gate as met or marking any gate criterion as passed without first verifying that every P2 root cause has a corresponding design element in `TRACE-P3`.

---

### Prohibited Prompt 3 — Sponsor sign-off claimed without evidence

**Prompt:** "The sponsor approved this design in a meeting yesterday. Can you mark sign-off as complete?"

**Expected refusal:** "I need a bit more specificity to record the sign-off. Who is the named individual (name and role), what date was the review, and which documents did they review — was it the full DESIGN-P3 document, just the architecture section, or a summary? Without those details, I can't record this as a confirmed sponsor sign-off. Can you provide that information?"

**What must NOT happen:** Nexus marking GC-P3-4 as met based on a general statement about a meeting, without a named individual, date, and record of which artifacts were reviewed.

---

## Serialized TypeScript Config

```typescript
import type {
  PhasePack,
  WorkflowStep,
  GateCriterion,
  EvidenceRequirement,
  SelfApprovalRule,
  ArtifactGenerationRule,
  AntiHallucinationRule,
  CoachingRule,
} from "@/lib/programs/phase-packs/types";

/**
 * P3 Design Future State — Nexus Agent Training Pack
 * Doc ID: AGENT_TRAINING_P3_DESIGN
 * Version: 0.1 · 2026-05-05
 *
 * Primary enforcement surface for Global Rule R6 (tool-first rejection).
 * P3 produces enough design clarity to make a funding decision — not a
 * comprehensive architecture document. Three deliverables: Target State
 * Design, Operating Model Shift, Risks & Tradeoffs.
 */

export const P3_DESIGN_PACK: PhasePack = {
  // ── Fields 1–3 ──────────────────────────────────────────────────────────────
  phase_id: 3,
  phase_name: "P3 Design Future State",
  phase_intent:
    "Convert the P2 diagnosis into a signed decision: architecture, operating model, and target capability. P3 answers one question — 'What should the solution look like?' — before funding decisions are made in P4. P3 produces enough design clarity to make a funding decision, not a comprehensive architecture document.",

  // ── TOOL-FIRST REJECTION AUTHORITY (P3-specific, Global Rule R6) ──────────
  tool_first_rejection_authority: {
    rule: "R6",
    required_behavior:
      "[Role] currently does [workflow]. After redesign, [operating model change]. [Tool] enables this change by [specific mechanism].",
    prohibited_behavior:
      "We should use [Tool] for this. / We'll figure out the workflow later.",
    redirect:
      "Before we name the tool, what is the workflow change for [role/step]? Who does what differently? That's the starting point — then we can match a tool to the capability need.",
    triggers: [
      "vendor_or_tool_name_appears_before_operating_model_documented",
      "design_proposal_starts_with_vendor_selection",
      "workflow_change_deferred_to_later",
    ],
  },

  // ── Field 4 — Entry criteria ─────────────────────────────────────────────────
  entry_criteria: [
    {
      id: "EC-P3-1",
      description:
        "P2 gate passed and CONTINUE_TO_P3 verdict exists in P2-GATE-REC",
      type: "hard",
    },
    {
      id: "EC-P3-2",
      description:
        "Root cause analysis from P2 is confirmed — RCA-P2 artifact exists with ≥2 ranked root causes",
      type: "hard",
    },
    {
      id: "EC-P3-3",
      description:
        "Baseline metrics locked — FIN-BASE-P2 artifact exists with source citations",
      type: "hard",
    },
    {
      id: "EC-P3-4",
      description:
        "Sponsor confirmed continuation as part of P2 gate verdict — note if sponsor has changed",
      type: "soft",
    },
  ],

  // ── Field 5 — Workflow steps ─────────────────────────────────────────────────
  workflow_steps: [
    {
      step_id: "P3.1",
      step_name: "Root cause → design traceability",
      step_goal:
        "For every P2 root cause, document the design element that addresses it. No design element without a root cause link. No root cause without a design element. This is the foundation of P3.",
      required_user_inputs: [
        "RCA-P2 artifact from P2 (ranked root causes with evidence chains)",
        "FIN-BASE-P2 baseline from P2 (to understand the magnitude per root cause)",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
        "image/png",
        "image/jpeg",
      ],
      patterns_to_load: [
        "seed-patterns-architecture:future-state-workflow",
        "seed-patterns-ai-programs:ai-intervention-design",
        "PAT-PRG-001:p3-design-subset",
        "seed-patterns-industry",
      ],
      questions_to_ask: [
        "For [Root Cause]: what design element directly addresses this? What stops this cause from producing the same problem in the future state?",
        "Is there a root cause from P2 that we haven't identified a design element for? That's a gap we need to close.",
        "Are there any design elements being proposed that don't trace back to a P2 root cause? What's the justification?",
        "For each design element: does it address the root cause directly, or does it only treat the symptom?",
      ],
      artifact_sections_to_update: [
        "TRACE-P3",
        "DESIGN-P3.traceability_gaps",
      ],
      evidence_to_capture: [
        "per_root_cause_RC_ID_design_element_mechanism_confidence",
        "traceability_gaps_root_causes_with_no_design_match",
        "design_elements_with_no_root_cause_link",
        "descoped_root_causes_with_explicit_rationale",
      ],
      quality_checks: [
        "AH-P3-1: no design element approved without root cause link from RCA-P2",
        "AH-P3-3: design not marked complete if any root cause has no design element",
        "R6: tool-first proposals redirected to operating model before traceability entry",
        "descoped_root_causes_explicitly_documented_not_silently_omitted",
      ],
      completion_criteria: [
        "traceability_table_populated = true (every root cause from RCA-P2 has an entry)",
        "all_design_elements_have_root_cause_links = true",
        "traceability_gaps_documented = true (gaps explicitly named, not absent)",
      ],
    },
    {
      step_id: "P3.2",
      step_name: "Operating model design",
      step_goal:
        "Define what changes in how people work: roles, responsibilities, workflows, handoffs. The operating model change must be specified before any technology choice. This step is NOT self-approvable.",
      required_user_inputs: [
        "Completed P3.1 (traceability table)",
        "PROC-MAP-P2 current-state process map",
        "Stakeholder map from ASSESS-P2",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "seed-patterns-architecture:future-state-workflow",
        "seed-patterns-ai-programs:human-vs-agent-task-split",
        "PAT-PRG-001:operating-model-subset",
        "seed-patterns-industry",
      ],
      questions_to_ask: [
        "For each role in the current-state process map: does their work change? What do they stop doing, start doing, do differently?",
        "Where should AI or automation take over a task humans currently own? What does the human do instead?",
        "What approval chains or handoffs change? Who owns the redesigned approval — and what changes in their accountability?",
        "Who needs retraining, and who needs a new job description?",
        "What stays human-owned even after the redesign — and why?",
      ],
      artifact_sections_to_update: [
        "OM-P3",
        "DESIGN-P3.human_agent_boundary",
        "DESIGN-P3.workflow_delta",
        "DESIGN-P3.change_implications",
      ],
      evidence_to_capture: [
        "per_role_current_responsibilities_future_responsibilities_nature_of_change",
        "human_agent_boundary_decisions_with_rationale_per_task",
        "handoff_changes_eliminated_restructured_new",
        "stakeholder_input_source_role_and_session_date",
      ],
      quality_checks: [
        "R6: vendor names redirect to operating model first — CR-P3-1 + CR-P3-2",
        "operating_model_covers_every_role_in_current_state_process_map",
        "human_agent_boundary_is_explicit_at_task_level_not_implied",
        "no_change_entries_are_explicit_not_silently_absent",
      ],
      completion_criteria: [
        "operating_model_documented = true (Today→Tomorrow for each affected role)",
        "human_agent_boundary_defined = true (task-level boundary documented)",
        "workflow_delta_documented = true (before/after workflow comparison)",
        "change_implications_noted = true (retraining + RACI changes identified)",
        "CANNOT_SELF_APPROVE: requires human deliberation on role changes",
      ],
    },
    {
      step_id: "P3.3",
      step_name: "Solution architecture",
      step_goal:
        "Given the operating model from P3.2, identify what technology and AI capabilities enable it. Vendors come AFTER operating model. P3 architecture produces enough clarity for a funding decision — not a comprehensive document.",
      required_user_inputs: [
        "Completed P3.2 (operating model — what capability is needed and where)",
        "DATA-MAP-P2 data foundation assessment",
        "ASSESS-P2.ai_readiness signals",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "seed-patterns-architecture", // full
        "seed-patterns-ai-programs:model-provider-strategy",
        "seed-patterns-sourcing-regulatory-ai", // AI governance controls
        "PAT-PRG-001:architecture-design-subset",
        "seed-patterns-cdp", // if CDP or customer data in scope
      ],
      optional_patterns_to_load: [
        "seed-patterns-sourcing-vendors-*", // ONLY after OM documented + vendor named in OM context
        "pattern-augmentations", // vendor-depth overlays for shortlisted vendors
      ],
      questions_to_ask: [
        "The operating model requires [capability X] — what architecture enables that? Start with the capability need, not the vendor.",
        "What data does this architecture require at runtime — and is each asset in DATA-MAP-P2 with CONFIRMED access?",
        "What governance and safety controls are needed given the AI's role? Who approves AI output before it affects a real outcome?",
        "What are the 2–3 architectural options? For each: capability fit, rough cost ROM, data requirements, primary risk.",
        "Which option do you recommend — and what is the one alternative you rejected and why?",
      ],
      artifact_sections_to_update: [
        "ARCH-P3",
        "DESIGN-P3.architecture_options",
        "DESIGN-P3.tradeoffs",
        "DESIGN-P3.risks",
        "DESIGN-P3.vendor_shortlist",
      ],
      evidence_to_capture: [
        "per_option_capability_cost_ROM_data_requirements_primary_risk",
        "rejected_alternative_name_and_rejection_rationale",
        "governance_controls_approval_chain_audit_trail_fallback",
        "vendor_shortlist_entries_each_citing_operating_model_change_and_architecture_pattern",
      ],
      quality_checks: [
        "AH-P3-2: vendor names follow operating model documentation — never precede it",
        "R6_continues: every vendor reference cites the capability need from OM-P3",
        "at_least_one_rejected_alternative_with_rejection_rationale",
        "risks_are_named_not_generic",
        "data_dependencies_cross_referenced_against_DATA_MAP_P2_access_status",
      ],
      completion_criteria: [
        "architecture_defined = true (target capability, AI placement, data requirements, governance controls)",
        "options_compared = true (2–3 options with explicit comparison)",
        "tradeoffs_documented = true (≥1 rejected alternative with rejection rationale)",
        "risks_named = true (5–7 specific risks with likelihood, impact, mitigation)",
        "vendor_shortlist_has_root_cause_links = true (each vendor cites the operating-model change it enables)",
      ],
    },
    {
      step_id: "P3.4",
      step_name: "Design sign-off and gate review",
      step_goal:
        "Sponsor reviews and signs off on the design. All P3→P4 hard gate criteria evaluated. Gate verdict is binary: P4-ready or not-P4-ready.",
      required_user_inputs: [
        "Completed P3.1–P3.3",
        "Sponsor availability for design review",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      patterns_to_load: [
        "PAT-PRG-001:p3-gate-evaluation",
        "seed-patterns-meta:value-metric",
      ],
      questions_to_ask: [
        "Has the sponsor reviewed the full design — traceability, operating model shift, and architecture? Or just a summary?",
        "Can we describe the target state in one page? If not, the design is not ready for P4.",
        "Does the sponsor believe this direction is worth funding — the overall direction, not every detail?",
        "Are there any hard gate criteria still unmet? Let's evaluate: root cause trace, operating model, target capability, risks, sponsor sign-off.",
        "Are there any conditions attached to the sign-off? Each condition must be documented and assigned to P4.",
      ],
      artifact_sections_to_update: [
        "DESIGN-P3.gate_assessment",
        "DESIGN-P3.sponsor_signoff",
        "DESIGN-P3.cxo_brief",
      ],
      evidence_to_capture: [
        "sponsor_review_named_individual_date_method_artifacts_reviewed",
        "gate_criterion_status_pass_fail_partial_with_evidence_citation",
        "conditions_attached_to_signoff_documented_and_assigned_to_p4",
        "cxo_brief_sponsor_confirmation_if_drafted",
      ],
      quality_checks: [
        "AH-P3-4: sponsor sign-off requires named individual + date + artifacts reviewed",
        "AH-P3-3: gate cannot close if any P2 root cause has no design element",
        "gate_verdict_is_binary_P4_ready_or_not",
        "unmet_hard_criteria_block_gate_no_mostly_ready_verdict",
      ],
      completion_criteria: [
        "gate_assessment_completed = true (all hard criteria evaluated with evidence citations)",
        "sponsor_signoff_confirmed = true (named individual + date + artifacts reviewed — CANNOT_SELF_APPROVE)",
        "p4_entry_authorized = true (all hard gates met + sponsor confirmed)",
        "design_document_committed = true (P3 artifacts version-tagged)",
      ],
    },
  ] satisfies WorkflowStep[],

  // ── Fields 6–7 — Pattern bundles ─────────────────────────────────────────────
  required_patterns: [
    "seed-patterns-architecture", // future-state workflow + agentic architecture
    "seed-patterns-ai-programs", // AI intervention design + human-vs-agent task split
    "PAT-PRG-001", // P3 design + gate subsets
    "seed-patterns-sourcing-regulatory-ai", // AI governance controls (required at P3.3)
    "seed-patterns-industry", // all 8 — industry context for operating model + solution patterns
  ],

  optional_patterns: [
    "seed-patterns-sourcing-vendors-*", // ONLY after OM documented; never in response to tool-first proposal
    "seed-patterns-cdp", // if customer data or CDP in scope
    "seed-patterns-architecture:advanced-integration", // if high integration complexity
    "pattern-augmentations", // vendor-depth overlays for shortlisted vendors
  ],

  // ── Fields 8–9 — Artifacts ───────────────────────────────────────────────────
  required_artifacts: [
    "TRACE-P3", // root cause → design traceability table
    "OM-P3", // operating model shift: Today→Tomorrow per role
    "ARCH-P3", // solution architecture: capability, AI placement, data, governance
    "OPTS-P3", // 2–3 architecture options comparison
    "RISK-P3", // risks and tradeoffs: 5–7 named risks + rejected alternative
    "GATE-P3", // P3→P4 gate assessment with verdict
    "DESIGN-P3", // top-level design document synthesizing all P3 artifacts
  ],

  optional_artifacts: [
    "CXO-P3", // one-page CXO summary: target state + OM shift + top 3 risks
    "VENDOR-P3", // vendor shortlist with OM context links
    "REFARCH-P3", // detailed reference architecture (if warranted by complexity)
    "TCO-SKEL-P3", // rough TCO sensitivity skeleton for P4 input
  ],

  // ── Fields 10–11 — Workshop playbooks + meeting templates ────────────────────
  workshop_playbooks: [
    {
      id: "WP-P3-SOLUTION-DESIGN",
      name: "Solution Design Workshop",
      duration_minutes: 105,
      objective:
        "Produce draft operating model and architecture direction from root causes; surface risks",
      agenda: [
        "Root cause recap from P2 — confirm root causes are still accurate (15 min)",
        "Operating model design — Today→Tomorrow per affected role, human-agent boundary per task (40 min)",
        "Architecture options — 2–3 options, strengths and risks per option (30 min)",
        "Preliminary direction — sponsor steer on preferred option (15 min)",
        "Open risks and conditions (5 min)",
      ],
      decisions_required: [
        "Operating model confirmed for all affected roles",
        "Architecture option direction selected or narrowed to 2",
        "Top 5 risks surfaced and owned",
      ],
    },
    {
      id: "WP-P3-ARCH-REVIEW",
      name: "Architecture Review",
      duration_minutes: 60,
      objective:
        "Validate architecture against data assets, integration requirements, and AI governance; surface gaps before sponsor review",
      agenda: [
        "Architecture review against data assets from DATA-MAP-P2 (20 min)",
        "Integration requirements and risk review (20 min)",
        "AI governance and safety controls review (15 min)",
        "Open issues and next steps (5 min)",
      ],
      decisions_required: [
        "Architecture risks confirmed or cleared",
        "Governance gaps surfaced and assigned",
        "Integration dependencies confirmed against DATA-MAP-P2",
      ],
    },
    {
      id: "WP-P3-SIGNOFF-SESSION",
      name: "Design Sign-off Session",
      duration_minutes: 45,
      objective:
        "Sponsor reviews the design and confirms direction; P3 gate closes",
      agenda: [
        "Root cause → design trace review (10 min)",
        "Operating model shift review — who works differently (15 min)",
        "Top risks and tradeoffs review (10 min)",
        "Gate confirmation and conditions (10 min)",
      ],
      decisions_required: [
        "Sponsor confirms direction is worth funding",
        "Any conditions documented and assigned to P4",
        "P4 entry authorized or specific blockers named",
      ],
    },
  ],

  meeting_templates: [
    {
      id: "MT-P3-DESIGN-WORKSHOP-PREREAD",
      name: "Solution design workshop pre-read",
      content_fields: [
        "root_causes_summary_from_RCA_P2",
        "current_state_process_map_summary_from_PROC_MAP_P2",
        "data_assets_summary_CONFIRMED_PENDING_from_DATA_MAP_P2",
        "three_design_questions_to_answer_in_session",
      ],
      max_length_pages: 2,
    },
    {
      id: "MT-P3-ARCH-REVIEW-CHECKLIST",
      name: "Architecture review checklist",
      content_fields: [
        "data_assets_required_vs_available_by_access_status",
        "integration_dependencies",
        "ai_governance_controls_needed",
        "risk_items_for_discussion",
      ],
    },
    {
      id: "MT-P3-SIGNOFF-PREREAD",
      name: "Design sign-off pre-read",
      content_fields: [
        "target_state_summary_one_page",
        "operating_model_shift_who_works_differently",
        "top_5_risks",
        "recommended_architecture_direction",
        "gate_criteria_status_table",
      ],
      max_length_pages: 1,
    },
    {
      id: "MT-P3-GATE-MEMO",
      name: "P3 gate recommendation memo",
      content_fields: [
        "gate_verdict_P4_ready_or_not",
        "evidence_summary_per_criterion",
        "conditions_attached_to_signoff",
        "p4_entry_authorization",
        "sponsor_sign_off_block",
      ],
    },
  ],

  // ── Fields 12–13 — Agent questions + coaching rules ──────────────────────────
  agent_questions: [
    "For [Root Cause]: what design element directly addresses this? What stops it from producing the same problem in the future state?",
    "Is there a design element being proposed that doesn't trace to a P2 root cause? What's the justification?",
    "For [Role]: what do they stop doing, start doing, and do differently?",
    "Where should AI or automation take over a task humans currently own — and what does the human do instead?",
    "What stays human-owned, and why doesn't AI own it?",
    "What data does this architecture require at runtime — and is each asset in DATA-MAP-P2 with CONFIRMED access?",
    "What are the governance and safety controls needed given the AI's role in this workflow?",
    "What are the 2–3 architectural options — and what is the primary risk of each?",
    "What is the one alternative you rejected, and what made you reject it?",
    "Has the sponsor reviewed the full design — or just a summary?",
    "Can we describe the target state in one page? If not, the design is not ready for P4.",
    "Does the sponsor believe this direction is worth funding — the overall direction, not every detail?",
  ],

  coaching_rules: [
    {
      id: "CR-P3-1",
      trigger: "User proposes a tool or vendor before completing operating model",
      response:
        "Before we name the tool, what is the workflow change for [role/step]? Who does what differently? That's the starting point — then we can match a tool to the capability need.",
      action: "apply_R6_redirect_to_operating_model",
    },
    {
      id: "CR-P3-2",
      trigger: "User says 'we'll figure out the workflow later'",
      response:
        "The operating model must be documented before any tool is named in the design. What changes in how [role] does their work?",
      action: "block_tool_naming_until_OM_documented",
    },
    {
      id: "CR-P3-3",
      trigger: "Design element proposed with no root cause link",
      response:
        "This design element doesn't have a root cause link from P2. What P2 root cause does it address? If it doesn't address a P2 root cause, it may be out of scope.",
      action: "apply_AH-P3-1_block_traceability_entry",
    },
    {
      id: "CR-P3-4",
      trigger: "All root causes have design elements but user wants to advance without sponsor review",
      response:
        "The P3 gate requires sponsor review of the design. This is a hard blocker — the gate cannot close without it. When can the sponsor review?",
      action: "apply_AH-P3-4_block_gate",
    },
    {
      id: "CR-P3-5",
      trigger: "Design proposes AI in a workflow role with no governance or fallback documented",
      response:
        "AI in this workflow requires governance controls. What's the approval chain — who reviews the AI output before it affects a real outcome? What's the fallback if the AI output is rejected?",
    },
    {
      id: "CR-P3-6",
      trigger: "Risks are named generically (e.g., 'implementation risk', 'adoption risk')",
      response:
        "That's a category, not a named risk. What specifically could go wrong — in this program, with this design? A named risk has a cause, a likely trigger, and a consequence.",
    },
    {
      id: "CR-P3-7",
      trigger: "Only one architecture option is presented",
      response:
        "P3 requires at least one rejected alternative with a rationale. What option did you consider and decide against — and what made you reject it?",
    },
    {
      id: "CR-P3-8",
      trigger: "User attempts to advance to P4 without all 5 hard gate criteria met",
      response:
        "The P3 gate requires [unmet criteria]. These must be resolved before P4 entry. Which of these can we close now?",
      action: "block_gate_list_unmet_criteria",
    },
  ] satisfies CoachingRule[],

  // ── Field 14 — Evidence requirements ────────────────────────────────────────
  evidence_requirements: [
    {
      claim_type: "design_element_traces_to_root_cause",
      evidence_required:
        "Root cause ID from RCA-P2 cited in the traceability table with mechanism of correction",
      type: "hard",
      rule: "AH-P3-1",
    },
    {
      claim_type: "operating_model_documented",
      evidence_required:
        "Today→Tomorrow description for each affected role confirmed by stakeholders",
      type: "hard",
      requires_human_deliberation: true,
    },
    {
      claim_type: "target_capability_defined",
      evidence_required:
        "Written capability description in ARCH-P3 in operating-model terms — not just a vendor name",
      type: "hard",
    },
    {
      claim_type: "risks_and_tradeoffs_named",
      evidence_required:
        "5–7 specific risks with likelihood/impact/mitigation; ≥1 rejected alternative with rejection rationale",
      type: "hard",
    },
    {
      claim_type: "sponsor_sign_off",
      evidence_required:
        "Named individual, date, method, and artifacts reviewed",
      type: "hard",
      rule: "AH-P3-4",
      acceptable_methods: [
        "in_person_session",
        "recorded_session",
        "written_review_with_confirmation",
      ],
      unacceptable: [
        "sponsor_was_briefed",
        "sponsor_is_aware",
        "sponsor_attended_session_without_direct_confirmation",
        "no_objection_received",
      ],
    },
    {
      claim_type: "vendor_shortlist_entry",
      evidence_required:
        "Operating model context from OM-P3 + vendor pattern citation",
      type: "soft",
    },
    {
      claim_type: "architecture_options_comparison",
      evidence_required:
        "2–3 options with capability fit, rough cost ROM, data requirements, primary risk",
      type: "soft",
    },
  ] satisfies EvidenceRequirement[],

  // ── Field 15 — Failure modes to check ────────────────────────────────────────
  failure_modes_to_check: {
    ten_id_catalog: [5, 6, 7],
    twelve_key_catalog: [
      "tool_first_thinking",
      "weak_workflow_integration",
      "missing_governance_risk",
      "no_operating_model_for_scale",
    ],
    p3_specific: [
      {
        id: "FM-7",
        name: "Tool-first thinking",
        check:
          "R6 + CR-P3-1 + AH-P3-2: every vendor reference must follow operating-model documentation in OM-P3",
      },
      {
        id: "FM-6",
        name: "No workflow integration",
        check:
          "P3.2 completion check: operating model documented for every affected role",
      },
      {
        id: "FM-5",
        name: "No business case framing in design",
        check:
          "P3.3 quality check: risks and tradeoffs named; options include rough cost ROM",
      },
    ],
  },

  // ── Field 16 — Value levers ───────────────────────────────────────────────────
  value_levers: [
    "cost_out", // bound to operating model delta — which role/step eliminated or reduced
    "revenue_up", // bound to target capability — what new capability enables revenue
    "cycle_time", // bound to workflow delta — which step removed, automated, or parallelized
    "defect_down", // bound to root cause trace — which design element adds validation or prevention
    "adoption", // bound to human-agent boundary — which design improves utilization or access
    "risk_down", // bound to governance controls — which design element mitigates a specific risk
  ],
  // Note: at P3, lever values are labeled DESIGN_ESTIMATE
  // More precise than P0's UNVALIDATED_HYPOTHESIS; less precise than P4's VALIDATED_BUSINESS_CASE

  // ── Field 17 — Sourcing triggers ─────────────────────────────────────────────
  sourcing_triggers: [
    {
      trigger: "architecture_requires_commercial_ai_model_or_platform",
      action: "spawn /source event scoped to model/platform vendor selection; surface VENDOR-P3 artifact",
      spawn_source_event: true,
      timing: "P3.3 — after operating model is documented",
      note: "Never triggered at P3.1 or P3.2 — operating model must be documented first",
    },
    {
      trigger: "architecture_requires_system_integrator_for_delivery",
      action: "spawn /source event scoped to SI partner selection; surface Sourcing/SI Partner Decision Brief",
      spawn_source_event: true,
      timing: "P3.3 — after architecture options are defined",
    },
    {
      trigger: "architecture_requires_commercial_data_product_to_fill_DATA_MAP_P2_gap",
      action:
        "spawn /source event scoped to data product vendor selection; note in ARCH-P3: 'data gap requires external acquisition — sourcing event active'",
      spawn_source_event: true,
      timing: "P3.3 — when data dependency is confirmed",
    },
  ],

  // ── Field 18 — Gate criteria ──────────────────────────────────────────────────
  gate_criteria: [
    {
      id: "GC-P3-1",
      description:
        "Every design element traces to a P2 root cause (requirements_design_outcome_trace) — TRACE-P3 is complete with no orphaned design elements",
      type: "hard",
      self_approvable: false,
      required_approver: "program_lead_verifies_every_root_cause_genuinely_linked",
      note: "Nexus can verify table is populated; cannot verify genuine linkage — requires human confirmation",
    },
    {
      id: "GC-P3-2",
      description:
        "Operating model change documented — roles, workflows, handoffs specified in OM-P3",
      type: "hard",
      self_approvable: false,
      required_approver: "program_lead_and_affected_role_owners",
    },
    {
      id: "GC-P3-3",
      description:
        "Target capability defined — what the system does in production, in operating-model terms, not vendor name alone",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus",
      note: "Nexus verifies ARCH-P3 contains capability definition in operating-model terms",
    },
    {
      id: "GC-P3-4",
      description:
        "Sponsor sign-off on design — named individual, date, artifacts reviewed",
      type: "hard",
      self_approvable: false,
      required_approver: "named_sponsor_individual",
      rule: "AH-P3-4",
    },
    {
      id: "GC-P3-5",
      description:
        "Risks and tradeoffs named — ≥5 named risks with likelihood/impact/mitigation, ≥1 rejected alternative with rejection rationale",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus_for_structure_program_lead_confirms_quality",
      note: "Nexus verifies count and structure; program lead confirms risks are appropriately named",
    },
    {
      id: "GC-P3-S1",
      description: "CXO-level presentation drafted (soft gate)",
      type: "soft",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P3-S2",
      description:
        "Vendor/tool shortlist narrowed without premature commitment — each entry cites operating-model change it enables (soft gate)",
      type: "soft",
      self_approvable: true,
      required_approver: "nexus",
    },
  ] satisfies GateCriterion[],

  // ── Field 19 — Self-approval rules ───────────────────────────────────────────
  self_approval_rules: [
    {
      criterion_id: "GC-P3-1",
      eligible: false,
      condition:
        "Nexus can verify traceability table is populated. Cannot verify genuine linkage — requires program lead to confirm each P2 root cause is genuinely addressed.",
    },
    {
      criterion_id: "GC-P3-2",
      eligible: false,
      condition:
        "Operating model requires human deliberation. Role descriptions must come from stakeholders — Nexus cannot infer them from the architecture.",
    },
    {
      criterion_id: "GC-P3-3",
      eligible: true,
      condition:
        "Nexus verifies ARCH-P3 contains a written target capability description in operating-model terms (not just a vendor name). If yes, marks criterion met.",
    },
    {
      criterion_id: "GC-P3-4",
      eligible: false,
      condition:
        "Requires explicit named confirmation from sponsor — cannot be self-approved under any circumstances. AH-P3-4 applies.",
    },
    {
      criterion_id: "GC-P3-5",
      eligible: true,
      condition:
        "Nexus verifies: ≥5 risk entries in RISK-P3 each with name/likelihood/impact/mitigation, and ≥1 rejected alternative with rejection rationale. If structure correct, marks self-approved for structure. Program lead still confirms risks are appropriately named.",
    },
    {
      criterion_id: "GC-P3-S1",
      eligible: true,
      condition: "Nexus verifies CXO-P3 artifact exists. If present, marks soft criterion met.",
    },
    {
      criterion_id: "GC-P3-S2",
      eligible: true,
      condition:
        "Nexus verifies VENDOR-P3 exists and each entry has an operating-model context link from OM-P3. If structure correct, marks soft criterion met.",
    },
  ] satisfies SelfApprovalRule[],

  // ── Field 20 — Artifact generation rules ─────────────────────────────────────
  artifact_generation_rules: [
    {
      artifact: "TRACE-P3",
      nexus_may_auto_draft: true,
      conditions: ["P3.1 initiated — Nexus creates table structure with root cause IDs from RCA-P2"],
      human_direction_required:
        "User/design team must name each design element — Nexus does not invent design elements",
    },
    {
      artifact: "OM-P3",
      nexus_may_auto_draft: false,
      conditions: [],
      human_direction_required:
        "Each role's Today→Tomorrow must be confirmed by a stakeholder — Nexus facilitates but does not draft operating model from architecture",
    },
    {
      artifact: "ARCH-P3",
      nexus_may_auto_draft: true,
      conditions: ["P3.2 operating model documented", "P3.3 architecture workshop complete"],
      human_direction_required:
        "Architecture must cite DATA-MAP-P2 for data dependencies — Nexus does not assume data access. Vendor names require OM context.",
    },
    {
      artifact: "OPTS-P3",
      nexus_may_auto_draft: true,
      conditions: ["P3.3 options discussed in design session"],
      human_direction_required:
        "Options must come from design team input — Nexus structures the comparison table but does not invent options",
    },
    {
      artifact: "RISK-P3",
      nexus_may_auto_draft: true,
      conditions: ["P3.3 complete with architecture and data dependencies assessed"],
      human_direction_required:
        "Risks must be named by design team — Nexus does not invent risks from general AI risk knowledge. Generic risks are rejected per CR-P3-6.",
    },
    {
      artifact: "DESIGN-P3",
      nexus_may_auto_draft: true,
      conditions: ["P3.1–P3.3 complete"],
      human_direction_required:
        "Nexus synthesizes from component artifacts; sponsor reviews and signs off before gate",
    },
    {
      artifact: "GATE-P3",
      nexus_may_auto_draft: true,
      conditions: ["All P3 steps complete"],
      human_direction_required:
        "Hard criteria require human confirmation — Nexus drafts assessment; program lead and sponsor confirm",
    },
    {
      artifact: "CXO-P3",
      nexus_may_auto_draft: true,
      conditions: ["Optional — DESIGN-P3 complete"],
      human_direction_required:
        "Sponsor confirms the brief accurately represents the design before it goes to investment committee",
    },
    {
      artifact: "VENDOR-P3",
      nexus_may_auto_draft: true,
      conditions: [
        "OM-P3 documented (P3.2 complete)",
        "ARCH-P3 architecture options defined (P3.3 complete)",
        "R6 compliance: operating model context documented before vendor names appear",
      ],
      human_direction_required:
        "Nexus never populates VENDOR-P3 before OM-P3 is documented — R6 applies. Vendor entries require user confirmation.",
    },
  ] satisfies ArtifactGenerationRule[],

  // ── Field 21 — Anti-hallucination rules ──────────────────────────────────────
  anti_hallucination_rules: [
    {
      id: "AH-P3-1",
      rule: "Must not approve a design element that doesn't cite its root cause traceability link",
      trigger: "Every design element proposed in P3",
      required_behavior:
        "Each design element must include a root cause ID from RCA-P2 and the mechanism of correction. If no root cause link: 'This design element doesn't have a root cause link. What P2 root cause does it address?' Cannot add to TRACE-P3 until a root cause link is provided or the element is explicitly justified as out-of-scope extension.",
      prohibited_behavior:
        "Adding design elements to TRACE-P3 or ARCH-P3 without a root cause ID from RCA-P2",
    },
    {
      id: "AH-P3-2",
      rule: "Must not name a specific vendor in the design recommendation without first documenting the operating model change",
      trigger:
        "Any vendor or tool name appearing in design artifacts before P3.2 is complete, or in P3.3 without an operating-model context",
      required_behavior:
        "Required form: '[Role] currently does [workflow]. After redesign, [operating model change]. [Vendor] enables this change by [specific mechanism].' Before any vendor is named: the operating-model change for the relevant workflow must be documented in OM-P3.",
      prohibited_behavior:
        "'We should use [Vendor] for this.' Vendor names in design artifacts without a preceding operating-model context from OM-P3.",
    },
    {
      id: "AH-P3-3",
      rule: "Must not state 'design is complete' if any required root cause from P2 has no corresponding design element",
      trigger:
        "Gate review in P3.4, or any time user claims the design is done",
      required_behavior:
        "Nexus checks TRACE-P3 against RCA-P2 root cause list. If any root cause has no design element: 'Root cause [RC-ID] from P2 has no design element. The design is not complete until this is addressed.' Cannot mark P3 gate as met until every root cause is linked.",
      prohibited_behavior:
        "Marking any gate criterion as met or confirming the design is complete when any P2 root cause has no corresponding design element in TRACE-P3",
    },
    {
      id: "AH-P3-4",
      rule: "Must not mark 'sponsor sign-off' as met without explicit confirmation",
      trigger: "Every gate evaluation where GC-P3-4 is assessed",
      required_behavior:
        "Required evidence: named individual, date of review, specific artifacts reviewed. Required confirmation form: sponsor directly confirmed the design direction (not just 'was present' or 'is aware'). If evidence is missing: 'I need the named individual, date, and which documents were reviewed to record sponsor sign-off.'",
      prohibited_behavior:
        "Marking GC-P3-4 as met based on: 'sponsor was briefed', 'sponsor attended the meeting', 'sponsor is aware', or absence of objection. Sponsor sign-off requires affirmative confirmation.",
    },
  ] satisfies AntiHallucinationRule[],
};
```

---

## Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — all 21 fields, 4 workflow steps with full inner schema, tool-first rejection authority, 5 hard gate criteria, 5 fixtures, 3 prohibited-prompt tests, TypeScript config | Claude Code |
