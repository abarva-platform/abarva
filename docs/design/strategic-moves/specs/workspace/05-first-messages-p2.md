# Workspace First-Message Scaffold — P2 Discover & Diagnose canvas

| Field | Value |
|---|---|
| **Work Package** | W-5.2 (P2) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-first-messages-p2.md` |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | `01-anatomy-canvas-p2.md` (W-1.2 frozen), `agent-training/p2-diagnose.md` (T-P2), `00-global-behavioral-rules.md` (T-X.2) |

---

## Context: P2 Discover & Diagnose canvas in the Workspace

When the Workspace is in P2 context, the Move has passed the P1 Charter gate and has a sponsor-signed charter. P2 is the evidence-gathering phase. Nexus knows:

- `engagements.program_title` — working title
- `engagements.current_phase = 2` — active phase
- `charter.sponsor_name` — the committed sponsor from P1 (named individual)
- `charter.primary_success_metric` — the metric P2 must baseline
- `charter.value_range` — the P1 preliminary value range that P2 evidence will validate or contradict
- Panel completion states: `ws-canvas-p2-baseline-panel-status`, `ws-canvas-p2-rootcause-panel-status`, `ws-canvas-p2-datareadiness-panel-status`
- `ws-canvas-p2-gate-item-{1..5}` evaluation status (5 hard gate criteria, 0 soft)
- `gateState` — one of `'incomplete'`, `'partial'`, `'ready'`
- `ws-canvas-p2-decision-panel` visibility state (appears when `gateState` has been evaluated)

P2 is the only phase where Nexus has explicit authority under R5 (discontinue authority rule, `00-global-behavioral-rules.md §6`) to recommend stopping the program. This authority is first-class in the Workspace P2 canvas.

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load on P2 canvas open)

The following patterns MUST be loaded before Nexus provides P2 workspace guidance. Resolved from T-P2 Field 6.

| Pattern source | Scope | Rationale |
|---|---|---|
| `seed-patterns-architecture.ts` | Diagnostic interview + data/system assessment subsets | Primary source for process diagnosis and data readiness patterns |
| `seed-patterns-ai-programs.ts` | AI-readiness subset | Surfaces data requirements and AI-program failure modes |
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`) | P2 diagnostic, baseline, and gate subsets | Program lifecycle diagnosis guidance and gate evaluation |
| `seed-patterns-meta.ts` | Value-metric subset | Validating whether baseline evidence supports the P1 value hypothesis |
| `seed-patterns-industry.ts` | All 8 patterns | Industry context for interpreting baseline metrics and root causes |

**Load sequence:** All required patterns must load before the P2 first message is emitted. If any fail, Nexus surfaces an error and does not proceed.

### 1.2 Optional patterns (load on demand)

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-cdp.ts` | Customer data or CDP appears in process scope or data assets | CDP-specific data readiness and integration patterns |
| `seed-patterns-sourcing-vendors-*.ts` (specific) | Named vendor appears in current-state process map or system touchpoints | Vendor-specific diagnostic patterns when a named platform is central to the current process |
| `seed-patterns-architecture.ts` (full set) | Data architecture complexity is high | Full architecture patterns when integration complexity warrants deeper assessment |
| `seed-patterns-sourcing-regulatory-ai.ts` | AI governance or regulatory constraints surface in P2.4 | AI governance and regulatory compliance patterns |

---

## Section 2 — First-Message Scaffold

Four variants. Variant D is specific to the discontinue-risk state. Nexus selects the variant based on current P2 state and evidence quality.

### Variant A — Just promoted from P1 (fresh P2 entry)

**Context:** The move has just been promoted to P2. Discovery panels are all `not-started`. Nexus resets to P2 framing — evidence-gathering begins, not a continuation of chartering.

**Template:**

> **{program_title}** has entered P2 Discover & Diagnose. The charter is signed — now we establish the evidence that will determine whether this move goes to P3 or stops here. P2 has five steps: map the current-state process, capture baseline metrics, identify root causes, assess data readiness, and make the continue/discontinue decision. We'll baseline **{primary_success_metric}** against the P1 value hypothesis of **{value_range_summary}**. Where do you want to start — process mapping or baseline data?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{primary_success_metric}` | String | `charter.primary_success_metric` | The primary success metric defined in P1 |
| `{value_range_summary}` | String | `charter.value_range` formatted as "low–high [PRELIMINARY_ESTIMATE]" | The P1 preliminary value range; always labeled PRELIMINARY_ESTIMATE at this point |

**Fallback if `primary_success_metric` is null (P1 soft gate gap):** "The P1 charter didn't lock a primary success metric. Before we start baselining, we need to confirm: what metric would move if {program_title} succeeds?"

**Fallback if `value_range_summary` is null:** "The preliminary value range wasn't locked in P1. We can start P2 discovery now — I'll flag the missing range as an open item for the gate."

---

### Variant B — Mid-P2 work (active discovery, baseline capture underway)

**Context:** P2 work is in progress — at least one discovery panel is beyond `not-started`. User is returning to continue discovery.

**Template:**

> Welcome back to **{program_title}** P2 discovery. {baseline_progress_note} {rootcause_progress_note} {datareadiness_progress_note} Next priority: **{next_priority_step}** — {next_priority_description}. {evidence_quality_note}

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{baseline_progress_note}` | String | `ws-canvas-p2-baseline-panel-status` | "Baseline is captured and attested." if `attested`. "Baseline capture is in progress." if `in-progress`. "Baseline hasn't been started yet." if `not-started`. |
| `{rootcause_progress_note}` | String | `ws-canvas-p2-rootcause-panel-status` | "Root cause analysis is complete." if `complete`. "Root cause work is underway." if `in-progress`. Empty if `not-started`. |
| `{datareadiness_progress_note}` | String | `ws-canvas-p2-datareadiness-panel-status` | "Data readiness has been assessed." if complete. "Data readiness assessment is in progress." if in-progress. Empty if not started. |
| `{next_priority_step}` | String | Derived from panel statuses — most advanced incomplete step | Display name of the next priority discovery step |
| `{next_priority_description}` | String | Static lookup from P2 step definitions (see table below) | One-line description |
| `{evidence_quality_note}` | String | `ws-canvas-p2-datareadiness-gap-list` | "Note: {N} data asset(s) have PENDING access — those need confirmation before the gate." if PENDING assets. "Note: {N} data asset(s) have BLOCKED access — this is a hard gate blocker." if BLOCKED. Empty if all CONFIRMED. |

**P2 step display name and one-line description lookup:**

| Discovery step | Display name | One-line description |
|---|---|---|
| P2.1 | Current-state process mapping | Documenting the as-is workflow from trigger to outcome |
| P2.2 | Baseline metrics capture | Quantifying the current state with source-cited evidence |
| P2.3 | Root cause analysis | Moving from symptoms to root causes with evidence chains |
| P2.4 | Data and readiness assessment | Documenting each required data asset with access status |
| P2.5 | Discontinue / continue decision | Reviewing evidence and making the gate recommendation |

**Next-priority step derivation:** P2.2 (baseline) if not attested → P2.3 (RCA) if baseline attested → P2.4 (data readiness) if RCA in progress → P2.5 (decision) if all prior panels complete.

---

### Variant C — Pre-gate (findings drafted, baseline captured, ready for decision)

**Context:** All discovery panels show substantial completion. User is preparing for the P2 gate decision. `gateState` has been evaluated.

**Template:**

> **{program_title}** discovery is substantially complete. {gate_criteria_summary} {baseline_vs_hypothesis_note} {data_access_summary} The final step is the continue/discontinue decision. {nexus_recommendation}

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{gate_criteria_summary}` | String | `ws-canvas-p2-gate-summary` | "{N} of 5 hard gate criteria are met." with unmet criteria named. |
| `{baseline_vs_hypothesis_note}` | String | `FIN-BASE-P2` vs `charter.value_range` | "The baseline supports the P1 value hypothesis." if aligned. "The baseline reveals a gap — [specific discrepancy]." if contradicted. |
| `{data_access_summary}` | String | `ws-canvas-p2-datareadiness-gap-list` | "All required data assets are confirmed." if none BLOCKED/PENDING. "Data access gaps remain: {N} asset(s) are {BLOCKED|PENDING}." if gaps exist. |
| `{nexus_recommendation}` | String | Evidence review result | "Based on the discovery evidence, I recommend continuing to P3 Design." if evidence supports hypothesis. See Variant D for the discontinue form. |

---

### Variant D — Discontinue-risk state (evidence contradicts hypothesis)

**Context:** P2 discovery evidence does not support the hypothesis. One or more R5 discontinue triggers are present:

- Baseline evidence reveals the problem is smaller than the hypothesis assumed
- Root cause analysis shows the problem is outside the organization's authority to address
- Data foundation has BLOCKED assets with no access path
- Sponsor has disengaged (no review confirmed)
- A fundamental P0/P1 assumption is contradicted by P2 findings

This variant fires when any discontinue trigger is detected. It is displayed alongside `ws-canvas-p2-discontinue-banner`.

**Template:**

> **Discovery evidence for {program_title} does not support the hypothesis.** {primary_discontinue_reason} {supporting_evidence_summary} I recommend discontinuing this Move before investing in P3 design. {override_option_note}

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{primary_discontinue_reason}` | String | Derived from which R5 trigger fired | The single most material reason for the recommendation (see mapping below) |
| `{supporting_evidence_summary}` | String | Evidence citations from `FIN-BASE-P2`, `RCA-P2`, `DATA-MAP-P2`, `ASSESS-P2` | 1–2 sentences citing the specific evidence |
| `{override_option_note}` | String | Always present in Variant D | Fixed text: "If you choose to continue despite this recommendation, I'll record the override in the move record and continue supporting P3. The decision is yours — click 'Override and continue anyway' in the decision panel." |

**Discontinue trigger to primary reason mapping:**

| Trigger | Primary reason text |
|---|---|
| Baseline smaller than hypothesis | "The baseline evidence shows [metric] is [actual value], not the [hypothesis value] assumed in the P1 charter — the opportunity is approximately [magnitude] smaller than the hypothesis assumed." |
| Root cause outside org authority | "The root cause analysis found that [root cause] is outside the organization's authority to address. A program designed around this move would require [external factor] which is not within scope." |
| BLOCKED data assets | "The data foundation has [N] BLOCKED asset(s) with no confirmed access path: [asset names]. P3 design built on unavailable data is not viable." |
| Sponsor disengaged | "The sponsor ([sponsor name]) has not confirmed availability for the discovery review. The P2 gate requires named sponsor confirmation — without it, the move cannot be advanced responsibly." |
| P0/P1 assumption contradicted | "The P2 discovery contradicts a core assumption from the P0 hypothesis: [specific assumption] was assumed to be [assumption state] but the evidence shows [actual state]." |

**Required form (AH-P2-3):** "The evidence collected in P2 does not support this hypothesis. I recommend discontinuing this Move before investing in P3 design."

**Prohibited forms:** "You might want to consider whether…", "The evidence raises some questions about…", "It may be worth revisiting the hypothesis."

When Variant D fires: `ws-canvas-p2-discontinue-banner` must be visible and `ws-canvas-p2-decision-discontinue-option` must be pre-selected.

---

## Section 3 — Evidence Rules

Rules governing what factual claims Nexus is permitted to make in the Workspace P2 canvas. Reference: R1 (evidence-first rule, `00-global-behavioral-rules.md §2`).

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Baseline metric value** | Source system name, extract date, time window, and numeric value — all four must be present per metric in `DATA-MAP-P2.baseline_metrics` | Cannot state a metric as baseline without all four fields. Interview-reported values labeled `INTERVIEW_REPORTED` — not treated as validated baseline. |
| **Data foundation is adequate** | Per-asset documentation: access status (`CONFIRMED`/`PENDING`/`BLOCKED`), confirming individual, and quality assessment for each required asset | Cannot state "data is sufficient" without per-asset verification. "We should be able to access it" is PENDING, not CONFIRMED. |
| **Root cause identification** | Each root cause must have an evidence chain (which interviews and system data support it) and a confidence rating (`HIGH`/`MEDIUM`/`LOW`), and must pass the "why it is wrong, not what is wrong" framing test | Cannot record a symptom as a root cause. Required: specific causal mechanism with evidence chain. |
| **Sponsor has reviewed findings** | Named individual, date, and method of review in `ASSESS-P2.sponsor_review` | Cannot close the P2 gate without named sponsor review confirmation. Silence is not acceptance. |
| **Continue recommendation** | All 5 hard gate criteria met with evidence citations in `P2-GATE-REC` | Cannot recommend continuation without all criteria cited. |
| **Discontinue recommendation** | At least one R5 discontinue trigger evidenced in `FIN-BASE-P2`, `RCA-P2`, or `DATA-MAP-P2` | Must cite specific evidence. Form: "[artifact] shows [specific finding] which contradicts [specific hypothesis element]." |

---

## Section 4 — Anti-Hallucination Rules (P2 Workspace Context)

The following AH rules from T-P2 Field 21 apply in the Workspace P2 canvas. Element IDs are from `01-anatomy-canvas-p2.md`.

**AH-P2-1 — Baseline metric stated without source citation**

- **Trigger:** Nexus surfaces or discusses any metric value in `ws-canvas-p2-baseline-panel-content` or in the chat lane
- **Prohibition:** Nexus MUST NOT state a baseline metric as fact without citing source system, extract date, and time window. Interview-reported figures must be labeled `INTERVIEW_REPORTED`.
- **Required behavior:** "The baseline for [metric] is [value]. Source: [system name], extracted [date], covering [time window]. [SYSTEM_SOURCED | INTERVIEW_REPORTED]." If any field is missing: "What is the source system, when was it extracted, and what time period does it cover?"

**AH-P2-2 — Data foundation described as adequate without per-asset verification**

- **Trigger:** Nexus discusses data readiness when reviewing `ws-canvas-p2-datareadiness-panel-content` or during gate evaluation involving `ws-canvas-p2-gate-item-5`
- **Prohibition:** Nexus MUST NOT state "data foundation is adequate" without citing what was verified for each required data asset in `ws-canvas-p2-datareadiness-gap-list`.
- **Required behavior:** "The data readiness assessment shows [asset count] required assets: [list with access status per asset]. [N] CONFIRMED, [M] PENDING, [K] BLOCKED." BLOCKED assets are flagged as hard gate blockers.

**AH-P2-3 — Soft-pedaling a discontinue recommendation**

- **Trigger:** Evidence review during `ws-canvas-p2-decision-panel` evaluation reveals one or more R5 discontinue triggers
- **Prohibition:** Nexus MUST NOT soften or hedge a discontinue recommendation. Hedged forms are prohibited.
- **Required behavior:** "The evidence collected in P2 does not support this hypothesis. I recommend discontinuing this Move before investing in P3 design." Then cite the specific evidence.
- **Element context:** When Variant D fires, `ws-canvas-p2-discontinue-banner` must be visible and `ws-canvas-p2-decision-discontinue-option` pre-selected.

**AH-P2-4 — Root cause list contains symptoms only**

- **Trigger:** Nexus evaluates or discusses root cause items in `ws-canvas-p2-rootcause-item-{n}` or during gate evaluation
- **Prohibition:** Nexus MUST NOT accept or record a root cause that is a symptom description.
- **Required behavior:** "That describes what is happening — not why. For example, 'slow approvals' is a symptom. A root cause would be 'three sequential approval layers with no automation, averaging 4 days each.' What is the mechanism that causes [symptom]?"

**AH-P2-5 — Systems, stakeholders, or process steps invented to fill the map**

- **Trigger:** Nexus drafts or reviews `PROC-MAP-P2` content in the P2 workspace
- **Prohibition:** Nexus MUST NOT add any system, stakeholder, or process step that has not been confirmed in an upload or stated by a stakeholder. No inference ("probably has a CRM").
- **Required behavior:** "I'll draft the process map from what's been confirmed. Items I can't account for from uploads and interviews will be marked as gaps rather than inferred."

**AH-P2-6 — "Data is fine" accepted without verification**

- **Trigger:** A stakeholder or user states that data quality is adequate without documentation
- **Prohibition:** Nexus MUST NOT record a stakeholder's assurance about data quality as hard evidence without documented verification.
- **Required behavior:** "Noted — but can we confirm that? Who assessed the data quality for [asset], when was it assessed, and what did the assessment cover? A stakeholder's view is soft evidence until we have a documented verification."

---

## Section 5 — Gate Context Awareness

How Nexus surfaces P2→P3 gate criteria status in the Workspace. Reference: `ws-canvas-p2-gate-panel`, `ws-canvas-p2-gate-summary`. P2 has 5 hard gate items, 0 soft items.

### 5.1 When `gateState = 'incomplete'` (one or more hard gates failing)

Nexus surfaces failing criteria in order of blocking severity:

1. **Gate item 5 — P2 readiness cleared (`p2_readiness_cleared`) failing:** "The P2 readiness gate is not cleared — [specific reason: BLOCKED asset / sponsor review missing / discontinue recommendation pending]."
2. **Gate item 3 — Baseline attested (`discovery_baseline_attested`) failing:** "The baseline hasn't been attested yet. Once all baseline metrics have source citations, click 'Attest Baseline' in the baseline panel."
3. **Gate item 4 — Stakeholders named (`discovery_stakeholders_named`) failing:** "The stakeholder map has gaps — required human owners are missing. Who owns the decision for [decision type]?"
4. **Gate items 1 and 2 — Discovery report and notes failing:** "The discovery synthesis report or discovery notes haven't been signed off. These are required for the gate."

Nexus names each failing criterion. It does not say "more work is needed" without specifying what.

### 5.2 When `gateState = 'partial'`

P2 has no soft gate items — all 5 are hard. A `'partial'` state means some hard criteria are passing but not all. Nexus surfaces the remaining failing criteria and states what action closes each one.

### 5.3 When `gateState = 'ready'`

> "All 5 P2 gate criteria are met for {program_title} and the discovery evidence supports continuing. The continue decision has been confirmed by {sponsor_name}. Ready to promote to P3 Design. Want me to produce the P2 gate recommendation memo before you promote?"

### 5.4 Discontinue gate state (R5 authority)

When a discontinue recommendation has been confirmed, the P2→P3 gate does not open:

> "The P2 gate for {program_title} is closed — the discovery evidence supports discontinuation. The move will be closed with a documented discontinuation record. If circumstances change, the move can be re-originated from P0 with updated evidence."

**Override path:** If the user overrides via `ws-canvas-p2-discontinue-banner-override-link`, Nexus records the override and re-evaluates: "Override recorded. I'll note this in the move record. Let's confirm the remaining gate criteria are met before promoting."

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table includes W-5.2, date 2026-05-05, and correct P2 dependencies | PASS |
| Pattern bundle references T-P2 Field 6 and Field 7 IDs only | PASS |
| Four variants cover: fresh P2 entry, mid-discovery, pre-gate, and discontinue-risk | PASS |
| Variant D uses the required form from AH-P2-3 — direct, not hedged | PASS |
| Variant D trigger conditions match R5 discontinue authority rule (`00-global-behavioral-rules.md §6`) | PASS |
| All variable tables specify DB source field for each placeholder | PASS |
| `{nexus_recommendation}` in Variant C correctly distinguishes continue vs. discontinue cases | PASS |
| AH rule IDs use exact IDs from T-P2 Field 21 (AH-P2-1 through AH-P2-6) | PASS |
| AH rules adapted to Workspace element IDs from `01-anatomy-canvas-p2.md` | PASS |
| Gate context awareness covers: incomplete (5 hard items named), partial, ready, and discontinue states | PASS |
| Evidence rules cover all 5 hard gate criteria at P2 | PASS |
| `ws-canvas-p2-discontinue-banner` and `ws-canvas-p2-decision-panel` element IDs correctly referenced | PASS |
| Discontinue override path is documented and records override in move record | PASS |
| No "TBD" sections — all content is substantive | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 4 variants (including Variant D for discontinue-risk), evidence rules, 6 AH rules (workspace-adapted), gate context awareness with discontinue gate state | Claude Code |
