# Workspace Layer 5 — First-Message Scaffold · P3 Design Future State

| Field | Value |
|---|---|
| **Work Package** | W-5.2 (P3) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-first-messages-p3.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-1.2 P3 (`01-anatomy-canvas-p3.md`), T-P3 (`agent-training/p3-design.md`), T-X.2 (`agent-training/00-global-behavioral-rules.md`) |
| **References** | `PHASE_MODEL_V2_DOCTRINE.md` §P3, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Author** | Claude Code |

---

## Overview

This document specifies Nexus's knowledge surfacing behavior when a user opens the P3 Design Future State canvas in the Workspace. It covers:

- What patterns load when P3 canvas activates (§1)
- What Nexus says on page open — three entry variants (§2)
- Evidence rules specific to P3 (§3)
- Anti-hallucination rules (§4)
- Gate context awareness (§5)
- Tool-first rejection authority in first-message context (§6)

All element IDs referenced are defined in `01-anatomy-canvas-p3.md`.

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load when P3 canvas activates)

All required patterns MUST be loaded before Nexus emits its first P3 message. A missing required pattern is a silent failure — Nexus must surface a system error and not proceed if any pattern fails to load.

| Pattern source | File | Rationale |
|---|---|---|
| `seed-patterns-architecture.ts` | `src/lib/intelligence/seed-patterns-architecture.ts` | Future-state workflow design patterns; provides design vocabulary for target state and operating model |
| `seed-patterns-ai-programs.ts` | `src/lib/intelligence/seed-patterns-ai-programs.ts` | AI intervention design patterns: which AI capabilities address which root cause types; required for P3.3 solution architecture |
| `PAT-PRG-001` (P3 design subset) | `src/lib/intelligence/program-lifecycle-patterns.ts` | P3 phase lifecycle guidance: design traceability, operating model framing, sponsor sign-off flow |
| `seed-patterns-industry.ts` | `src/lib/intelligence/seed-patterns-industry.ts` | Industry-specific solution patterns; for design context only, not program-specific claims without citation |

**Load trigger:** Pattern bundle loads when `ws-canvas-p3` becomes the active canvas zone. It does not wait for user interaction.

### 1.2 Optional patterns (loaded on demand)

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-sourcing-vendors-{name}.ts` | A vendor or product name appears in user input in the P3 chat session | Load the matching vendor pattern; vendor names are acceptable in P3 ONLY after operating-model shift is documented per R6 |
| `seed-patterns-cdp.ts` | Archetype is `platform_modernization` AND "CDP" / "data platform" keywords appear | CDP-specific design context for P3 solution architecture step |

---

## Section 2 — First-Message Scaffold

Three variants based on context when user opens the P3 canvas.

---

### Variant A — Just promoted from P2

**Context:** Move was just promoted to P3. The `GATE-P2` record has a fresh `CONTINUE_TO_P3` verdict. This is the user's first open of the P3 canvas.

**Template:**

> P2 diagnosis is confirmed — {p2_root_cause_count} root cause{p2_root_cause_plural} identified, baseline locked. P3 starts here: for each root cause, we need to define the design element that addresses it. That traceability is the foundation. Once all root causes have a design counterpart, we'll work through the operating model shift and solution architecture. Ready to start with the first root cause?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{p2_root_cause_count}` | Integer | `ws-canvas-p2-rootcause-item-{n}` count from P2 canvas data | Number of P2 root causes to trace in `ws-canvas-p3-rootcause-trace-panel` |
| `{p2_root_cause_plural}` | String | Derived: `""` if count = 1, `"s"` if count > 1 | Grammatical plural |

**Fallback:** If `p2_root_cause_count` cannot be resolved (P2 canvas data not accessible), emit: "P2 diagnosis confirmed — let's begin P3 design. The first step is tracing each P2 root cause to a design element. Can you confirm the root causes from P2 so we can begin the trace?"

---

### Variant B — Mid-P3 design (operating model in progress)

**Context:** User returns to an in-progress P3 canvas where `ws-canvas-p3-design-panel-status` is `in-progress` or `ws-canvas-p3-operatingmodel-panel-status` is `in-progress`. P3.1 trace work has begun; design or operating model is underway.

**Template:**

> Design is in progress. Root cause trace: {traced_count} of {total_rc_count} traced. {panel_status_summary}. {tool_first_check}Next up: {next_step_name} — {next_step_description}. Where do you want to continue?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{traced_count}` | Integer | `ws-canvas-p3-rootcause-trace-summary` | Count of root causes with `traced` or `approved` trace status |
| `{total_rc_count}` | Integer | Total trace item count in `ws-canvas-p3-rootcause-trace-panel` | Total root causes requiring traces |
| `{panel_status_summary}` | String | Derived from `ws-canvas-p3-operatingmodel-panel-status` and `ws-canvas-p3-design-panel-status` | One of: "Target state design underway", "Operating model shift underway", "Both panels in progress" |
| `{tool_first_check}` | String | Inspect last 5 user messages in session history for vendor/tool names without operating-model context | If tool-first signals detected: "One note: we have a tool name in discussion but haven't locked the operating model shift yet — let's anchor the workflow change first. " Otherwise: `""` (empty string) |
| `{next_step_name}` | String | Derived from incomplete panels in order: trace → operating model → solution architecture → risks | Display name of the next incomplete step |
| `{next_step_description}` | String | Static lookup — see table below | One-line description |

**Next step descriptions (static lookup):**

| Step | Name | Description |
|---|---|---|
| P3.1 | Root cause trace | Link each remaining P2 root cause to the design element that addresses it |
| P3.2 | Operating model shift | Define who works differently — roles, handoffs, responsibilities — before naming technology |
| P3.3 | Solution architecture | With operating model defined, specify what AI/technology enables the shift |
| P3.4 | Risks & tradeoffs | Name 5–7 risks with likelihood, impact, and mitigation before sponsor sign-off |

---

### Variant C — Pre-gate (design complete, awaiting sponsor sign-off)

**Context:** All three P3 deliverables have content; `ws-canvas-p3-design-panel-status = in-progress` or `complete`, `ws-canvas-p3-operatingmodel-panel-status = in-progress` or `complete`, `ws-canvas-p3-risks-panel-status = complete`. User is approaching or reviewing the P3→P4 gate.

**Template:**

> Design work is largely complete. Gate status: {hard_met} of 2 hard criteria met, {soft_met} of 2 soft criteria met. {gate_blocker_summary} {sign_off_status} To promote to P4, both hard criteria must pass: design and operating model signed off, and root cause trace complete. Want to review what's outstanding?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{hard_met}` | Integer (0–2) | Count of `ws-canvas-p3-gate-item-{1,2}` with passing status | Number of hard gate criteria currently passing |
| `{soft_met}` | Integer (0–2) | Count of `ws-canvas-p3-gate-item-{3,4}` with passing status | Number of soft gate criteria currently passing |
| `{gate_blocker_summary}` | String | Derived from failing hard criteria | If both hard failing: "Both hard criteria are unmet. " If one failing: "Hard criterion [name] is still unmet. " If none failing: `""` (empty) |
| `{sign_off_status}` | String | `ws-canvas-p3-design-panel-status` | If `signed-off`: "Design is signed off. " If not: "Design sign-off is still required from the sponsor. " |

---

## Section 3 — Evidence Rules

Rules governing what claims Nexus may make in the P3 canvas context.

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Root cause → design traceability** | Each trace entry in `ws-canvas-p3-rootcause-trace-panel` must cite the source P2 root cause ID (`ws-canvas-p2-rootcause-item-{n}`) and the design element that addresses it. No design element may be presented as addressing a root cause without a named link. | Nexus may not mark a trace item `traced` without the explicit P2 root cause ID. Ask: "Which P2 root cause does this design element address? I need the specific root cause from P2 to complete the trace." |
| **Operating model shift claim** | A "today → tomorrow" statement for each affected role, with the role name sourced from P2 stakeholder map or user input during P3.2. | Nexus may not populate `ws-canvas-p3-operatingmodel-role-{n}` with a named role without that role appearing in `PROC-MAP-P2` or explicit user input. |
| **Vendor/tool shortlist** | Tool names are only surfaced after the operating model shift for that workflow is documented in `ws-canvas-p3-operatingmodel-panel`. R6 enforced — see §6. | If operating model is not documented, Nexus declines to surface a vendor shortlist and redirects to the operating model. |
| **Design sign-off claim** | `ws-canvas-p3-design-panel-status = signed-off` with sponsor name and date recorded. | Cannot claim design is signed off without the signed-off status and a named sponsor. |
| **Risk magnitude** | Risk likelihood and impact drawn from: (a) P2 evidence (e.g., change resistance signals from `ASSESS-P2`), (b) pattern library precedent with citation, or (c) explicit user input. | Cannot state a risk is `HIGH` impact without grounding. State as "unverified — needs team input" until evidence is provided. |

---

## Section 4 — Anti-Hallucination Rules

Rules specific to the P3 workspace context, sourced from T-P3.

---

**Rule AH-P3-1** (Design element without root cause link)

- **Trigger:** Nexus is about to populate `ws-canvas-p3-rootcause-trace-item-{n}-design` or mark a trace item `traced`
- **Prohibition:** Nexus MUST NOT approve a design element that does not cite its root cause link from `RCA-P2`. Every design element must be traceable.
- **Test prompt:** "Just add this design element — we'll trace it to a root cause later."
- **Expected refusal behavior:** "I can draft the design element, but I can't mark it traced without a root cause link. Which P2 root cause does this address? We can also flag it as an untrace gap and resolve it before gate."

---

**Rule AH-P3-2** (Tool name before operating model)

- **Trigger:** User names a specific vendor, product, or AI tool in the chat session AND `ws-canvas-p3-operatingmodel-panel-status` is `not-started` for the relevant workflow
- **Prohibition:** Nexus MUST NOT build a design artifact starting from a vendor/tool name without the operating model change documented first. This is R6 applied in the first-message context — see §6.
- **Test prompt:** "Let's design this around Salesforce Einstein" or "We'll use GPT-4 for the triage step."
- **Expected refusal behavior:** "Before we name the tool, what task is shifting from human to agent for that workflow, and who works differently? That determines whether [tool] is the right fit. What's changing in the workflow?"

---

**Rule AH-P3-3** (Design complete without full trace)

- **Trigger:** Nexus is about to mark P3 design complete or recommend gate promotion
- **Prohibition:** Nexus MUST NOT mark design complete or surface the promote action if any required root cause from P2 has no corresponding design element.
- **Test prompt:** "We're done with design — let's promote to P4."
- **Expected refusal behavior:** "The root cause trace shows {untrace_count} root cause(s) without a design element. Gate hard criterion 2 (`requirements_design_outcome_trace`) will fail without complete tracing. Let's close the gaps before promoting."

---

**Rule AH-P3-4** (Fabricated role changes)

- **Trigger:** Nexus is about to populate `ws-canvas-p3-operatingmodel-role-{n}-person` with a specific person's name
- **Prohibition:** Nexus MUST NOT name a specific individual as owning a role change without that person appearing in P2 stakeholder data or explicit user input.
- **Test prompt:** "Fill in the operating model with whoever makes sense."
- **Expected refusal behavior:** "I can't add specific names without a source. I can add the role category and leave the named person blank for you to confirm. Who owns this workflow change on the business side?"

---

## Section 5 — Gate Context Awareness

How Nexus surfaces P3→P4 gate status during the canvas session.

**Gate structure (from `governance.ts`):**
- Hard (2): `design_approved`, `requirements_design_outcome_trace`
- Soft (2): `phase_3_findings_written`, `cxo_interview_complete`
- Total: 4 checks — both hard must pass for promotion

**Proactive gate surfacing rules:**

| Trigger | Nexus behavior |
|---|---|
| User asks "are we ready for P4?" | Surface `ws-canvas-p3-gate-summary` status: "Gate is at {hard_met}/2 hard, {soft_met}/2 soft. {specific_missing_items_list}." Never say "almost there" without naming exactly what is missing. |
| `ws-canvas-p3-rootcause-untrace-warning` banner is active | Nexus proactively references the untrace count when the user asks about gate readiness. Does not wait to be asked about traceability specifically. |
| User clicks `ws-canvas-p3-gate-promote-btn` when hard criteria failing | Nexus blocks and states: "The promote button is disabled — {hard_criterion_name} is not yet passing. {what_is_needed}." |
| Hard criterion 1 (`design_approved`) passes | Nexus acknowledges: "Design and operating model are signed off — hard criterion 1 passes. Next: root cause trace must be complete for hard criterion 2." |

**Gate item reference:**

| Gate item | Canvas element | Type | Criterion |
|---|---|---|---|
| 1 | `ws-canvas-p3-gate-item-1` | Hard | Future-state design and operating-model shift signed off |
| 2 | `ws-canvas-p3-gate-item-2` | Hard | Requirements-to-design-to-outcomes traceability captured |
| 3 | `ws-canvas-p3-gate-item-3` | Soft | Risks and tradeoffs named with mitigations |
| 4 | `ws-canvas-p3-gate-item-4` | Soft | Operating-model owners interviewed |

---

## Section 6 — Tool-First Rejection Authority (R6) in First-Message Context

Rule R6 is P3's primary enforcement authority. This section specifies how R6 manifests in the first-message scaffold and subsequent P3 conversation.

### 6.1 Detection in Variant B (mid-P3)

When computing `{tool_first_check}` for Variant B, Nexus scans the session history for the following signals:
- A vendor name (from `seed-patterns-sourcing-vendors-{name}.ts` key list) appears in the last 5 user messages
- The operating model panel (`ws-canvas-p3-operatingmodel-panel`) has `not-started` status for the workflow that vendor applies to
- No "today → tomorrow" role change entry exists for that workflow

If all three conditions are met, `{tool_first_check}` is populated with the redirect statement (see §2, Variant B).

### 6.2 Tool-first detection in the opening message itself

If the user's **first message** in a fresh P3 session names a specific vendor or tool without a workflow context, Nexus responds per AH-P3-2 before any design work begins. This overrides any initial acknowledgment.

**Example first-message tool-first exchange:**

User: "Let's kick off P3 — we're going to use Azure OpenAI for the triage automation."

Nexus response: "Before we design around the tool, let's anchor the workflow shift first. For the triage automation: what does the current triage step look like — who does it, how long does it take, what are the handoffs? Once we have the operating model change documented, I can surface what Azure OpenAI specifically enables and where it fits."

### 6.3 When tool names are acceptable

Tool names are acceptable in P3 when:
1. `ws-canvas-p3-operatingmodel-role-{n}` entries exist for the relevant workflow (operating model documented)
2. A specific capability need has been articulated (e.g., "we need a model that processes unstructured text in real time")

At that point, Nexus may proactively surface a vendor shortlist from the pattern catalog. The tool names an explicit capability need; it does not substitute for one.

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with work package, date, status, dependencies | PASS |
| Pattern bundle references valid pattern IDs from binding matrix | PASS |
| All three first-message variants cover distinct entry contexts | PASS — A (fresh P3), B (mid-design), C (pre-gate) |
| Variant A uses P2 root cause count as dynamic variable | PASS |
| Variant B includes `{tool_first_check}` variable — R6 surface in mid-P3 | PASS |
| Variant C references gate hard/soft counts from anatomy | PASS |
| All variables have source and fallback defined | PASS |
| R6 (tool-first rejection) is first-class in §6, not a footnote | PASS |
| AH rules use AH-P3-{N} IDs from T-P3 | PASS — AH-P3-1 through AH-P3-4 |
| Each AH rule has trigger, prohibition, test prompt, expected refusal | PASS |
| Gate awareness section references all 4 gate criteria (2 hard + 2 soft) | PASS |
| Gate element IDs match `01-anatomy-canvas-p3.md` | PASS |
| Evidence rules cover: trace, operating model, tool/vendor, sign-off, risk | PASS |
| No "TBD" or vague sections | PASS |
| Content is workspace-context (existing move), not originate-context | PASS |
