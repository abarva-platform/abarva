# Workspace Layer 5 — First-Message Scaffold · P4 Roadmap & Business Case

| Field | Value |
|---|---|
| **Work Package** | W-5.2 (P4) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-first-messages-p4.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-1.2 P4 (`01-anatomy-canvas-p4.md`), T-P4 (`agent-training/p4-roadmap.md`), T-X.2 (`agent-training/00-global-behavioral-rules.md`) |
| **References** | `PHASE_MODEL_V2_DOCTRINE.md` §P4, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Author** | Claude Code |

---

## Overview

This document specifies Nexus's knowledge surfacing behavior when a user opens the P4 Roadmap & Business Case canvas in the Workspace. P4 carries the Tower Metric Plan Authority (T-P4), the single most important behavioral rule in this phase: Nexus must proactively surface the Tower metric plan requirement before the team is deep into roadmap or business case work. This is not deferred to gate time.

This document covers:

- What patterns load when P4 canvas activates (§1)
- What Nexus says on page open — four entry variants (§2)
- Evidence rules specific to P4 (§3)
- Anti-hallucination rules (§4)
- Gate context awareness (§5)
- Tower Metric Plan Authority proactive surfacing (§6)

All element IDs referenced are defined in `01-anatomy-canvas-p4.md`.

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load when P4 canvas activates)

All required patterns MUST be loaded before Nexus emits its first P4 message.

| Pattern source | File | Rationale |
|---|---|---|
| `PAT-PRG-001` (P4 roadmap + business case subset) | `src/lib/intelligence/program-lifecycle-patterns.ts` | Roadmap construction guidance: workstream sequencing, RACI patterns, critical path analysis |
| `seed-patterns-delivery.ts` | `src/lib/intelligence/seed-patterns-delivery.ts` | Workstream sequencing, dependency management, delivery RACI patterns |
| `seed-patterns-ai-programs.ts` | `src/lib/intelligence/seed-patterns-ai-programs.ts` | AI program delivery sequencing: data readiness before model training, model training before UAT, UAT before go-live |
| `seed-patterns-meta.ts` (value-metric subset) | `src/lib/intelligence/seed-patterns-meta.ts` | Value delivery timelines matched to roadmap milestones; required for Tower metric plan derivation |
| `seed-patterns-industry.ts` | `src/lib/intelligence/seed-patterns-industry.ts` | Industry ROI benchmarks for ROM validation (labeled as benchmarks, not program-specific claims) |
| `seed-patterns-change-management.ts` | `src/lib/intelligence/seed-patterns-change-management.ts` | Organizational readiness and change management plan patterns |

**Load trigger:** Pattern bundle loads when `ws-canvas-p4` becomes the active canvas zone.

### 1.2 Optional patterns (loaded on demand)

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-sourcing-vendors-{name}.ts` | A specific vendor is confirmed in the P4 roadmap (post-P3 selection) | Load vendor pattern to inform delivery workstream sequencing for that vendor's implementation |
| `seed-patterns-architecture.ts` | Technical infrastructure workstreams appear in roadmap | Architecture sequencing guidance for infrastructure-dependent workstreams |

---

## Section 2 — First-Message Scaffold

Four variants based on context when user opens the P4 canvas.

---

### Variant A — Just promoted from P3 (fresh P4 entry)

**Context:** Move was just promoted to P4. `GATE-P3` record has a fresh `CONTINUE_TO_P4` verdict. This is the user's first open of the P4 canvas.

**CRITICAL — Tower Metric Plan Authority:** This is the entry point at which Nexus MUST surface the Tower metric plan requirement prominently. It is NOT deferred to gate time. Per T-P4: "Before we complete the business case, we need to define the Tower metric plan." This belongs in the opening message of a fresh P4.

**Template:**

> P3 design is signed off — {p3_design_element_count} design element{p3_design_plural}, all traced to root causes. P4 builds the plan and the economics.
>
> Before we start the roadmap, one thing: we need to define the Tower metric plan — the measurable signals that confirm this program is succeeding post-handoff. Without it, we're measuring at gate, not at execution. We'll lock these alongside the business case, not after.
>
> P4 has four steps: roadmap construction from the P3 design, business case economics, Tower metric plan, and gate review. Ready to start with the roadmap?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{p3_design_element_count}` | Integer | Count of items in `ws-canvas-p3-rootcause-trace-panel` with `traced` or `approved` status | Number of design elements from P3 to plan in P4 |
| `{p3_design_plural}` | String | Derived: `""` if count = 1, `"s"` if count > 1 | Grammatical plural |

**Fallback:** If P3 design data is not accessible, emit: "P3 design is confirmed. P4 builds the plan and economics. Before anything else: we need to define the Tower metric plan — the signals that confirm the program is succeeding post-handoff. This is not a gate-time item. Let's lock it alongside the business case. Ready to start with roadmap construction?"

---

### Variant B — Mid-P4 with Tower metric plan NOT yet drafted

**Context:** User returns to a P4 canvas where `ws-canvas-p4-roadmap-panel-status` is `in-progress` or later, but `ws-canvas-p4-towermetric-panel-status = not-started`. Tower metric plan has been deferred.

**CRITICAL — Tower Metric Plan Authority:** This is the mid-P4 proactive surface trigger. Nexus MUST bring up the Tower metric plan in this message regardless of whether the team has raised it. Per T-P4 mandatory behavior, this surfacing is not optional.

**Template:**

> Roadmap is {roadmap_status}; business case is {biz_case_status}. {workstream_summary}
>
> The Tower metric plan has not been started. This needs to happen now — before the business case is complete. The Tower metric plan defines what Atlas tracks from handoff day. A business case that claims "{value_lever_example}" without a Tower metric tracking that outcome is an estimate with no accountability mechanism. Let's define the signals.
>
> For each value lever in the business case, we need: the measurable signal, the data source, the baseline, the target, and the timeline. Which value lever do you want to start with?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{roadmap_status}` | String | `ws-canvas-p4-roadmap-panel-status` | One of: "underway", "complete" |
| `{biz_case_status}` | String | `ws-canvas-p4-businesscase-panel-status` | One of: "not started", "underway", "approved" |
| `{workstream_summary}` | String | Count of `ws-canvas-p4-roadmap-milestone-{n}` items | "{N} milestones defined. " or `""` if no milestones yet |
| `{value_lever_example}` | String | First KPI entry from `ws-canvas-p4-valueplan-kpi-{1}-metric` if present; otherwise static: "$X in savings" | Concrete value lever from the value plan to anchor the accountability point |

---

### Variant C — Mid-P4 with Tower metric plan drafted (business case underway)

**Context:** `ws-canvas-p4-towermetric-panel-status = in-progress` or `complete`. Business case economics are underway. Tower metric plan exists.

**Template:**

> Tower metric plan is in progress — {tower_kpi_count} signal{tower_kpi_plural} defined so far. Business case is {biz_case_status}. {hard_criteria_summary}
>
> {business_case_anchor_check}Next: {next_step_name} — {next_step_description}. Where do you want to continue?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{tower_kpi_count}` | Integer | Count of `ws-canvas-p4-towermetric-kpi-{n}` items | Number of Tower KPIs defined so far |
| `{tower_kpi_plural}` | String | Derived | `""` if count = 1, `"s"` if count > 1 |
| `{biz_case_status}` | String | `ws-canvas-p4-businesscase-panel-status` | One of: "underway", "approved" |
| `{hard_criteria_summary}` | String | Count of `ws-canvas-p4-gate-item-{1..5}` passing | "{N} of 5 hard gate criteria passing. " |
| `{business_case_anchor_check}` | String | Check if `ws-canvas-p4-businesscase-panel-content` references `FIN-BASE-P2` | If no baseline anchor detected: "Quick check: every value claim in the business case must anchor to the P2 financial baseline (`FIN-BASE-P2`). Let me know if you need to verify the anchor. " Otherwise: `""` |
| `{next_step_name}` | String | Derived from incomplete P4 panels | Display name of the highest-priority incomplete step |
| `{next_step_description}` | String | Static lookup — see table below | One-line description |

**Next step descriptions:**

| Incomplete panel | Name | Description |
|---|---|---|
| `ws-canvas-p4-roadmap-panel-status != complete` | Roadmap construction | Ensure all P3 design elements have delivery workstreams with named owners |
| `ws-canvas-p4-businesscase-panel-status != approved` | Business case | Complete cost model and value plan anchored to P2 baseline |
| `ws-canvas-p4-towermetric-panel-status != complete` | Tower metric plan | Define the remaining Tower monitoring signals for all value levers |
| Gate criteria unmet | Gate review | Evaluate all 11 criteria (5 hard + 6 soft) before promoting to P5 |

---

### Variant D — Pre-gate (all deliverables present, gate review)

**Context:** Roadmap, business case, value plan, and Tower metric plan panels all have content. User is approaching the P4→P5 gate review. All 11 criteria being evaluated.

**Template:**

> P4 deliverables are assembled. Gate: {hard_met} of 5 hard criteria met, {soft_met} of 6 soft criteria met. {hard_blocker_summary}
>
> {tower_metric_gate_check}To promote to P5, all 5 hard criteria must pass. {soft_advisory} Review the gate panel and address any outstanding items. Ready to work through what's missing?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{hard_met}` | Integer (0–5) | Count of `ws-canvas-p4-gate-item-{1..5}` with passing status | Hard criteria currently passing |
| `{soft_met}` | Integer (0–6) | Count of `ws-canvas-p4-gate-item-{6..11}` with passing status | Soft criteria currently passing |
| `{hard_blocker_summary}` | String | Names of failing hard gate items | If all 5 pass: "All hard criteria pass." If any fail: list the failing criterion names, e.g., "Business case approval is outstanding." |
| `{tower_metric_gate_check}` | String | `ws-canvas-p4-gate-item-10` status (Tower metric plan drafted — soft) | If failing: "Tower metric plan (gate item 10) is not yet drafted — this is a soft criterion but Atlas cannot function at handoff without it. Strongly recommended before promoting. " If passing: `""` |
| `{soft_advisory}` | String | Count of failing soft criteria | If 0 failing: `""` If 1–2 failing: "Note: {count} soft criterion/criteria unmet — these don't block promotion but should be addressed before P5 begins." |

---

## Section 3 — Evidence Rules

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Roadmap workstream cost** | Either org-provided actuals from upload (labeled `CONFIRMED`) or Nexus-generated ROM from archetype + industry benchmarks (labeled `ROM`). Source must be explicit for every cost line. | Nexus may not state a cost figure without a source. ROM is permissible in P4 with explicit ROM label and confidence level. |
| **Value claim** | Every value claim must cite the `FIN-BASE-P2` figure it improves against. Required format: "based on the P2 baseline of ${X} in [cost category], this program targets ${Y} in savings by [mechanism] by [date]." | Cannot state a value figure without the P2 baseline anchor. Ask: "What is the P2 financial baseline for this value lever?" |
| **Named workstream owner** | A named individual (not role title) appearing in user input or an uploaded RACI/org chart. "The IT team" is not an owner. | Cannot populate `ROADMAP-P4` workstream owner field with a role title. Ask for a named individual. |
| **Tower metric data source** | Each Tower KPI entry in `ws-canvas-p4-towermetric-kpi-{n}` must have a named data source (e.g., "CRM event log", "ERP inventory feed"). | Cannot define a Tower metric without a data source. Ask: "Where does this signal come from — which system or data feed?" |
| **ROM estimate (P4 exception)** | P4 is the only phase where Nexus is authorized to generate ROM cost estimates using AbarVa methodology (archetype + industry benchmarks + scope indicators). All ROM estimates must be labeled `ROM` with confidence level and assumption list. | Must label explicitly. Cannot present a ROM as a confirmed figure. |

---

## Section 4 — Anti-Hallucination Rules

---

**Rule AH-P4-1** (Cost estimate before roadmap scope)

- **Trigger:** User asks for cost estimates during roadmap construction (P4.1), before `ROADMAP-P4` workstreams are defined
- **Prohibition:** Nexus MUST NOT generate cost estimates before the roadmap scope (workstreams, effort estimates, RACI) is established
- **Test prompt:** "What will this cost?" asked before workstreams are defined
- **Expected refusal behavior:** "Cost modeling follows roadmap construction. Let's finish the workstream plan first — then P4.2 builds the cost model from the scope we define here. What workstreams are still undefined?"

---

**Rule AH-P4-2** (Timeline without named owner)

- **Trigger:** Nexus is about to record a timeline commitment for a workstream that has no named individual owner
- **Prohibition:** Nexus MUST NOT commit a milestone date to a workstream without a named individual owner
- **Test prompt:** "Add a go-live milestone for the data pipeline workstream" when that workstream has no named owner
- **Expected refusal behavior:** "I can add the milestone, but I'll flag it as provisional — the data pipeline workstream has no named owner yet. Timeline estimates without owners are at risk. Who is accountable for this workstream?"

---

**Rule AH-P4-3** (Tower metric plan deferral)

- **Trigger:** User states they will define Tower metrics later / in P5 / after gate
- **Prohibition:** Nexus MUST NOT accept deferral of the Tower metric plan to P5 or to gate time
- **Test prompt:** "We'll define success metrics when we get to Tower" or "We'll figure out what to track in P5"
- **Expected refusal behavior:** "The Tower metric plan belongs in P4. P5 is for operationalizing it — setting up the dashboards, connecting the data feeds. Defining the signals now ensures Atlas has real measurement from handoff day. What does success look like in numbers?"

---

**Rule AH-P4-4** (ROM presented as confirmed)

- **Trigger:** Nexus is about to display or reference a cost estimate it generated
- **Prohibition:** Nexus MUST NOT present a Nexus-generated ROM as a confirmed or org-validated figure
- **Test prompt:** "What's the total cost?" after Nexus generates a ROM
- **Expected refusal behavior:** Display the ROM with explicit label: "ROM estimate: ${low}–${high} (rough order of magnitude, based on [archetype] + [scope] + AbarVa benchmark data). Assumptions: [list]. This is a starting point — your org-specific rate card will refine it."

---

**Rule AH-P4-5** (Value claim without P2 baseline anchor)

- **Trigger:** Nexus is about to state a value magnitude in the business case or chat session
- **Prohibition:** Nexus MUST NOT state any value figure ("this program will save $X") without citing the `FIN-BASE-P2` figure it improves against
- **Test prompt:** "What's the expected ROI?" or "How much will this save?"
- **Expected refusal behavior:** "Based on the P2 baseline of [FIN-BASE-P2 figure] in [cost category], and the improvements identified in P3 design for [root causes], the value model projects [range] by [mechanism] by [date]. Every figure here traces to the P2 baseline — not to a benchmark."

---

## Section 5 — Gate Context Awareness

**Gate structure (from `governance.ts`):**
- Hard (5): `execution_roadmap_drafted`, `business_case_approved`, `execution_milestones_defined`, `execution_success_criteria_defined`, `readiness_and_change_plan_signed_off`
- Soft (6): `funding_approval_recorded`, `sponsor_alignment_confirmed`, `delivery_raci_named`, `vendor_selection_approved`, `tower_metric_plan_drafted`, `tower_handoff_plan_accepted`
- Total: 11 checks — all 5 hard must pass for promotion

**Gate element reference:**

| Gate item | Canvas element | Type | Criterion |
|---|---|---|---|
| 1 | `ws-canvas-p4-gate-item-1` | Hard | Execution roadmap drafted |
| 2 | `ws-canvas-p4-gate-item-2` | Hard | Business case approved |
| 3 | `ws-canvas-p4-gate-item-3` | Hard | Execution milestones defined |
| 4 | `ws-canvas-p4-gate-item-4` | Hard | Success criteria defined |
| 5 | `ws-canvas-p4-gate-item-5` | Hard | Change readiness and adoption plan signed off |
| 6 | `ws-canvas-p4-gate-item-6` | Soft | Funding approval recorded |
| 7 | `ws-canvas-p4-gate-item-7` | Soft | Sponsor alignment confirmed |
| 8 | `ws-canvas-p4-gate-item-8` | Soft | Delivery RACI named |
| 9 | `ws-canvas-p4-gate-item-9` | Soft | Vendor selection approved (if applicable) |
| 10 | `ws-canvas-p4-gate-item-10` | Soft | Tower metric plan drafted |
| 11 | `ws-canvas-p4-gate-item-11` | Soft | Tower handoff plan drafted |

**Proactive gate surfacing rules:**

| Trigger | Nexus behavior |
|---|---|
| `ws-canvas-p4-towermetric-proactive-prompt` banner is visible (roadmap + biz case both in-progress, tower metric not started) | Nexus MUST reference the Tower metric plan in the next message. The banner is a trigger for the Variant B mandatory surfacing. |
| User asks "are we ready for P5?" | Report gate status: "{hard_met}/5 hard, {soft_met}/6 soft. {list of failing items}." Never say "almost" without naming what's missing. |
| User attempts `ws-canvas-p4-gate-promote-btn` with failing hard criteria | Block and state specifically which hard criterion is failing and what is required. |
| Gate item 10 (Tower metric plan) is `failing` at gate review | Surface explicitly: "Tower metric plan is unmet. This is a soft criterion but critical for Atlas activation at handoff. Strongly recommend closing this before promoting." |

---

## Section 6 — Tower Metric Plan Authority: Proactive Surfacing Specification

This section is first-class. It defines how the Tower Metric Plan Authority from T-P4 is enforced across all Variant A and Variant B scenarios.

### 6.1 What the Tower Metric Plan Authority requires

Per T-P4: Nexus must proactively open the Tower metric plan conversation when both the roadmap draft and the business case draft exist. This is not gated on the team asking about metrics. Nexus initiates it.

The mandatory Nexus trigger message (from T-P4): "Before we complete the business case, we need to define the Tower metric plan — the measurable signals that will confirm the program is succeeding post-handoff. Without this, we are measuring at gate, not at execution. Let's define what Atlas tracks from day one."

### 6.2 When this trigger fires

| Condition | Variant | When Nexus surfaces Tower metric plan |
|---|---|---|
| First open of P4 canvas (fresh promotion from P3) | Variant A | In the opening message — immediately, before roadmap construction begins |
| Roadmap and business case both have content; Tower metric panel is `not-started` | Variant B | In the first message of the session — before any other topic |
| User explicitly defers Tower metrics to P5 or later | Any | Immediate redirect per AH-P4-3 |
| Pre-gate review; Tower metric plan gate item is failing | Variant D | Named in the gate status summary with "strongly recommended" flag |

### 6.3 Required format for Tower metric plan entry

Each Tower metric plan entry in `ws-canvas-p4-towermetric-kpi-{n}` requires four fields. Nexus must ask for all four before considering a metric "defined":

1. **Measurable signal** — what is the observable outcome? (e.g., "Average Handle Time in minutes")
2. **Data source** — where does the signal come from? (e.g., "CRM event log", "ERP inventory feed")
3. **Baseline and target** — current state vs. goal (anchored to `FIN-BASE-P2`)
4. **Timeline** — when should the signal reach target? (matched to roadmap milestone dates)

A metric entry without all four fields is `in-progress`, not `complete`. Nexus does not mark a Tower metric complete with any field missing.

### 6.4 Prohibited deferral patterns

Nexus MUST redirect any of the following statements:
- "We'll define success metrics when we get to Tower"
- "We'll figure out what to track in P5"
- "The team can set up monitoring after handoff"
- "We'll add metrics to the business case as a footnote"

The redirect is per AH-P4-3. No exceptions.

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with work package, date, status, dependencies | PASS |
| Pattern bundle includes delivery, meta (value-metric), change management patterns | PASS |
| Four variants cover: fresh P4, mid-P4 no TMP, mid-P4 TMP drafted, pre-gate | PASS |
| Variant A opening message surfaces Tower metric plan prominently — first-class, not a footnote | PASS |
| Variant B includes mandatory Tower metric plan surfacing per T-P4 authority | PASS |
| Tower Metric Plan Authority is its own section (§6) with trigger table and format spec | PASS |
| AH-P4-3 (Tower metric plan deferral refusal) explicitly coded | PASS |
| AH rules use AH-P4-{N} IDs from T-P4 | PASS — AH-P4-1 through AH-P4-5 |
| All 11 gate criteria (5 hard + 6 soft) referenced in §5 | PASS |
| Evidence rules cover: ROM labeling, value claim baseline anchor, named owners, Tower metric data source | PASS |
| Variables table for all variants — each variable has type, source, description | PASS |
| No "TBD" or vague sections | PASS |
| Context is workspace (existing move at P4), not originate | PASS |
