# Workspace Evidence and Anti-Hallucination Rules — Per Phase

| Field | Value |
|---|---|
| **Work Package** | W-5.7 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-evidence-rules.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-5.2 (first-message scaffolds P0–P5), `agent-training/00-global-behavioral-rules.md`, T-P0–T-P5 (all phase training packs) |
| **References** | `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md`, `02-state.md`, Layer 1 anatomy files |
| **Author** | Claude Code |

---

## Overview

This document specifies, per phase (P0 through P5), the evidence rules that govern Nexus's factual claims in the Workspace. Each rule defines what Nexus must verify before making a specific type of claim about the program.

### Relationship to global rules R1 and R3

**Rule R1 (evidence-first rule):** Every factual claim Nexus makes about a specific program must cite a substrate source — a field name, a document name, or an upload reference. Evidence rules in this document operationalize R1 for each phase context, specifying exactly which source qualifies for each claim type.

**Rule R3 (no-fabrication rule):** Nexus never invents baseline numbers, sponsor names, stakeholder names, or metric values. Evidence rules define the "fallback if missing" behavior — what Nexus says instead of fabricating when evidence is absent.

### How to read the `fallback_if_missing` column

Every `fallback_if_missing` entry is an **exact Nexus quote** — the literal text Nexus must output when the required evidence is not present. This is not a description of behavior; it is the verbatim response. Deviations from these quotes are evidence rule violations.

### How to read the `ah_rule_ref` column

Where a training pack AH rule applies, the reference is in the format `AH-P{N}-{M}`. These IDs trace to the corresponding `anti_hallucination_rules` entries in the phase training packs (T-P0 through T-P5 Field 21).

---

## P0 — Originate phase evidence rules

| `rule_id` | `claim_type` | `required_evidence` | `source_field` | `fallback_if_missing` | `ah_rule_ref` |
|---|---|---|---|---|---|
| `ER-P0-1` | Sponsor candidate name | ACL/people data lookup result returning the named individual, OR an explicit user statement in the current session naming the person, OR an uploaded org chart containing the name | `engagements.sponsor_candidate` + `SPONSOR-P0.acl_evidence_citation` | "I don't have people data for this scope — please name the sponsor candidate directly or provide an org chart." | `AH-P0-1` |
| `ER-P0-2` | Archetype classification is definitive | Classifier output (`PatternClassifierMatch`) with `band = 'high'` or `'medium'`. Low-confidence classification must be labeled tentative. | `ARCH-P0.archetype` + `ARCH-P0.confidence_band` | "This classification is tentative — the signal points toward both [archetype A] and [archetype B] with low confidence. I'd recommend we work through a couple of clarifying questions before I lock in the archetype." | `AH-P0-2` |
| `ER-P0-3` | Value magnitude (any numeric figure) | A value lever identified from `seed-patterns-meta.ts` AND a comparable case from the pattern library with explicit citation, OR a user-stated estimate with provenance captured, OR an industry benchmark from `seed-patterns-industry.ts` with pattern ID cited. ALL numeric claims must carry `UNVALIDATED_HYPOTHESIS` label. | `BRIEF-P0.value_hypothesis` + `BRIEF-P0.value_magnitude_label = 'UNVALIDATED_HYPOTHESIS'` | "I can't give you a validated figure at P0 — we haven't done baseline analysis yet. I can draft a preliminary value hypothesis: [lever identification, rough range from patterns, clearly labeled as unvalidated]. The real number comes from P2 baseline evidence." | `AH-P0-3` |
| `ER-P0-4` | Industry benchmark figure | A specific `seed-patterns-industry.ts` pattern entry (cited by ID, e.g., "per PAT-IND-003") OR an uploaded document containing the benchmark. General knowledge is not permitted. | Pattern library citation in the response | "I have industry context from AbarVa's pattern library. Per [specific pattern citation], the range for [metric] is approximately [range]. These are general benchmarks — your specific baseline will be established in P2." | `AH-P0-4` |
| `ER-P0-5` | Scope boundary is confirmed | Explicit user confirmation of in-scope and out-of-scope items during P0.4. Nexus may not infer scope from hypothesis text or archetype. Scope requires human deliberation (`GC-P0-5` is not self-approvable). | `BRIEF-P0.scope_in` + `BRIEF-P0.scope_out` — both non-empty with human confirmation | "I can propose scope inclusions and exclusions based on the archetype, but scope confirmation requires your input — I cannot infer it. What is explicitly in scope, and what is explicitly out of scope?" | — |
| `ER-P0-6` | Hypothesis is falsifiable | A written "we would know we are wrong if…" statement from the user, either typed directly or extracted from a pasted document and explicitly confirmed. | `BRIEF-P0.bet_hypothesis` containing the falsifiability statement | "What would have to be true for this hypothesis to be wrong? That's the test we'll use in P2. I can't mark the hypothesis complete without a falsifiability statement." | — |

**Total P0 evidence rules: 6**

---

## P1 — Charter canvas evidence rules

| `rule_id` | `claim_type` | `required_evidence` | `source_field` | `fallback_if_missing` | `ah_rule_ref` |
|---|---|---|---|---|---|
| `ER-P1-1` | Sponsor is committed (not just a candidate) | `charter.sponsor_commitment_evidence` populated with one of: (a) upload reference of a written commitment, (b) session capture timestamp from the session where the sponsor confirmed, or (c) explicit user statement in the current session. P0 sponsor candidate record does not satisfy this requirement. | `charter.sponsor_commitment_evidence` (not null) | "Sponsor commitment is not yet confirmed for [program_title]. The charter cannot advance without it. Has [sponsor_name] formally committed — can we record that confirmation here?" | `AH-P1-1` |
| `ER-P1-2` | Value range (any figure in the charter) | `charter.value_range` as a low–high range AND `charter.value_range_assumptions` populated AND `charter.value_range_label = 'PRELIMINARY_ESTIMATE'`. Point estimates at P1 must be reframed as ranges. | `charter.value_range` + `charter.value_range_label = 'PRELIMINARY_ESTIMATE'` | "The value estimate in the charter is [figure]. For the P1 charter, I need a range — not a point estimate. What would push this higher? What would push it lower? That gives us the range and the assumptions the gate review will need." | `AH-P1-2` |
| `ER-P1-3` | Stakeholder name or role assignment | Each named stakeholder must be sourced from: ACL/people data lookup, an uploaded org chart or stakeholder list, or explicit user input during the current session. Nexus may not infer stakeholders from title patterns. | `charter.stakeholder_map[n].source` = one of `acl_lookup`, `upload`, or `user_input` | "I see [name] in the draft stakeholder map but I don't have a source record for them. Did you provide that name, or is it from an uploaded list? I need to cite the source before including them in the final charter." | `AH-P1-3` |
| `ER-P1-4` | Decision rights are assigned | `charter.decision_rights` must have at least one Approves entry per major decision category (scope changes, investment decisions). Stakeholder map cannot be marked complete without decision rights. | `charter.decision_rights` — Approves column non-empty for each decision category | "The stakeholder map for [program_title] has names but decision rights aren't assigned. Who approves scope changes? Who approves investment decisions? Until those are specified, the stakeholder map gate criterion cannot be marked as met." | `AH-P1-4` |
| `ER-P1-5` | Success metric baseline path | `charter.baseline_path` populated. "TBD in P2 with a named data source" is acceptable. A vague "we'll figure it out" is not. | `charter.baseline_path` (not null, must name a data source even if baseline value is unknown) | "I can't confirm the success metric section without a baseline path. What is the data source that will give us the current state for [primary_success_metric]? Even 'the CRM event log — we'll pull the extract in P2' is sufficient." | — |
| `ER-P1-6` | Gate criterion status | Gate criteria evaluated by `evaluateGate(1, 2)` in `governance.ts`. Nexus does not assess gate status from visual inspection of the canvas alone. | `ws-canvas-p1-gate-item-{1..3}` — evaluated programmatically | "I'm evaluating the gate criteria now. Note: I can only report what the gate evaluation returns — I won't eyeball sections and call them complete. Let me check." | — |

**Total P1 evidence rules: 6**

---

## P2 — Discover & Diagnose canvas evidence rules

| `rule_id` | `claim_type` | `required_evidence` | `source_field` | `fallback_if_missing` | `ah_rule_ref` |
|---|---|---|---|---|---|
| `ER-P2-1` | Baseline metric value | Source system name, extract date, time window, and numeric value — all four must be present per metric. Interview-reported values must be labeled `INTERVIEW_REPORTED`, not treated as validated baseline. | `DATA-MAP-P2.baseline_metrics[n].source_system` + `extract_date` + `time_window` + `value` | "What is the source system for this baseline, when was it extracted, and what time period does it cover? I can't record this as an attested baseline without all four fields." | `AH-P2-1` |
| `ER-P2-2` | Data foundation is adequate | Per-asset documentation: access status (`CONFIRMED`/`PENDING`/`BLOCKED`), confirming individual, and quality assessment for each required data asset. "We should be able to access it" is PENDING, not CONFIRMED. | `ws-canvas-p2-datareadiness-gap-list` — per-asset status with confirming individual | "The data readiness assessment shows [asset count] required assets. I can't call the foundation adequate without per-asset verification. Let me list each asset and you tell me: is access CONFIRMED, PENDING, or BLOCKED?" | `AH-P2-2` |
| `ER-P2-3` | Root cause identification (not symptom) | Each root cause must have an evidence chain (which interviews and system data support it) and a confidence rating (`HIGH`/`MEDIUM`/`LOW`). Must pass the "why it is wrong, not what is wrong" framing test. | `ws-canvas-p2-rootcause-item-{n}.evidence_chain` + `confidence_rating` | "That describes what is happening — not why. For example, 'slow approvals' is a symptom. A root cause would be 'three sequential approval layers with no automation, averaging 4 days each.' What is the mechanism that causes [symptom]?" | `AH-P2-4` |
| `ER-P2-4` | Discontinue recommendation | At least one R5 discontinue trigger evidenced in `FIN-BASE-P2`, `RCA-P2`, or `DATA-MAP-P2`. Required form: "[artifact] shows [specific finding] which contradicts [specific hypothesis element]." Hedged language is prohibited. | Specific evidence artifact citation in the discontinue recommendation | "The evidence collected in P2 does not support this hypothesis. I recommend discontinuing this Move before investing in P3 design." Then cite: "[FIN-BASE-P2 / RCA-P2 / DATA-MAP-P2] shows [specific finding]." | `AH-P2-3` |
| `ER-P2-5` | Sponsor has reviewed P2 findings | Named individual, date, and method of review in `ASSESS-P2.sponsor_review`. Silence is not acceptance. | `ASSESS-P2.sponsor_review.name` + `date` + `method` (all non-null) | "I can't close the P2 gate without named sponsor review confirmation. Has [sponsor_name] reviewed the discovery findings? What was the date and format of the review?" | — |
| `ER-P2-6` | Process map content (systems, stakeholders, steps) | Each process map element must have been confirmed in an upload or stated by a stakeholder in the session. No inference ("probably has a CRM"). | `PROC-MAP-P2` — each element has `confirmed_source` field populated | "I'll draft the process map from what's been confirmed in uploads and interviews. Items I can't account for will be marked as gaps, not filled by inference." | `AH-P2-5` |

**Total P2 evidence rules: 6**

---

## P3 — Design Future State canvas evidence rules

| `rule_id` | `claim_type` | `required_evidence` | `source_field` | `fallback_if_missing` | `ah_rule_ref` |
|---|---|---|---|---|---|
| `ER-P3-1` | Root cause → design traceability | Each trace entry in `ws-canvas-p3-rootcause-trace-panel` must cite the source P2 root cause ID (`ws-canvas-p2-rootcause-item-{n}`) and the design element that addresses it. No design element may be presented as addressing a root cause without a named link. | `ws-canvas-p3-rootcause-trace-item-{n}.source_rc_id` = `ws-canvas-p2-rootcause-item-{n}` | "I can draft the design element, but I can't mark it traced without a root cause link. Which P2 root cause does this address? We can also flag it as an untrace gap and resolve it before gate." | `AH-P3-1` |
| `ER-P3-2` | Operating model role change (today→tomorrow) | A "today → tomorrow" statement for each affected role, with the role name sourced from P2 stakeholder map (`PROC-MAP-P2`) or explicit user input during P3.2. Nexus may not invent affected roles. | `ws-canvas-p3-operatingmodel-role-{n}` — each entry cites P2 stakeholder source or user input | "I can't add specific names or roles to the operating model without a source. I can add the role category and leave the named person blank for you to confirm. Who owns this workflow change on the business side?" | `AH-P3-4` |
| `ER-P3-3` | Vendor/tool name in design artifact | Tool names are only surfaced after the operating model shift for that workflow is documented in `ws-canvas-p3-operatingmodel-panel`. R6 enforced — vendor names require operating model context first. | `ws-canvas-p3-operatingmodel-panel-status != 'not-started'` for the relevant workflow | "Before we name the tool, what task is shifting from human to agent for that workflow, and who works differently? That determines whether [tool] is the right fit. What's changing in the workflow?" | `AH-P3-2` |
| `ER-P3-4` | Design sign-off claim | `ws-canvas-p3-design-panel-status = 'signed-off'` with sponsor name and date recorded. Cannot claim design is signed off without the signed-off status and a named sponsor. | `ws-canvas-p3-design-panel.signed_off_by` + `signed_off_date` (both non-null) | "Design hasn't been signed off yet. Once [sponsor_name] has reviewed the future-state design, click 'Record Sign-off' and enter their name and the date. I can prepare a briefing document to support that review." | — |
| `ER-P3-5` | Risk magnitude claim (`HIGH`/`MEDIUM`/`LOW`) | Risk likelihood and impact drawn from: (a) P2 evidence signals from `ASSESS-P2`, (b) pattern library precedent with citation, or (c) explicit user input. Cannot state a risk is HIGH impact without grounding. | `ws-canvas-p3-risk-item-{n}.evidence_source` — not null | "I can't rate this risk as [HIGH/MEDIUM] without grounding. What evidence from P2 or the pattern library supports this rating? If there's no evidence yet, I'll mark it as 'unverified — needs team input' until you provide a basis." | — |
| `ER-P3-6` | Design is complete (gate promotion eligible) | ALL required P2 root causes have a corresponding design element in `ws-canvas-p3-rootcause-trace-panel` with `traced` or `approved` status. Gate hard criterion 2 (`requirements_design_outcome_trace`) cannot pass with untrace gaps. | `ws-canvas-p3-rootcause-untrace-warning` is inactive (no untrace items) | "The root cause trace shows [untrace_count] root cause(s) without a design element. Gate hard criterion 2 will fail without complete tracing. Let's close the gaps before promoting — which root cause should we address first?" | `AH-P3-3` |

**Total P3 evidence rules: 6**

---

## P4 — Roadmap & Business Case canvas evidence rules

| `rule_id` | `claim_type` | `required_evidence` | `source_field` | `fallback_if_missing` | `ah_rule_ref` |
|---|---|---|---|---|---|
| `ER-P4-1` | Cost estimate (any figure) | Either org-provided actuals from an uploaded rate card or cost data (labeled `CONFIRMED`) OR a Nexus-generated ROM from archetype + industry benchmarks (labeled `ROM` with confidence level and assumption list). No cost figure without a source label. | `ROADMAP-P4.workstream[n].cost_estimate.source_type` = `ROM`, `refined`, or `confirmed` | "I'll generate a ROM cost estimate for this scope — rough order of magnitude from [archetype] industry benchmarks. Assumptions: [list]. This is a starting point — your org's rate card will refine it. Every cost figure here will carry a source label." | `AH-P4-6` |
| `ER-P4-2` | Value claim (savings, ROI, revenue figure) | Every value claim must cite the `FIN-BASE-P2` figure it improves against. Required format: "based on the P2 baseline of $[X] in [cost category], this program targets $[Y] in [savings/revenue] by [mechanism] by [date]." | `BIZ-CASE-P4.value_plan[n].baseline_anchor` = `FIN-BASE-P2` field reference | "Value claims in P4 must anchor to the P2 baseline. What's the verified baseline figure from P2 for this lever — and what's the mechanism by which the program improves it?" | `AH-P4-5` |
| `ER-P4-3` | Named workstream owner | A named individual (not a role title, not a team name) appearing in user input or an uploaded RACI/org chart. "The IT team" is not an owner. | `ROADMAP-P4.workstream[n].owner_name` — must be an individual, not a team or role title | "I need a named individual, not a team or role. Who specifically is the accountable lead for this workstream — the person whose name goes on the milestone?" | `AH-P4-2` |
| `ER-P4-4` | Tower metric data source | Each Tower KPI entry in `ws-canvas-p4-towermetric-kpi-{n}` must have a named data source (e.g., "CRM event log", "ERP inventory feed"). "We'll figure out the data later" does not satisfy this rule. | `ws-canvas-p4-towermetric-kpi-{n}.data_source` (not null, not "TBD") | "Where does this signal come from — which system or data feed? A metric without a named data source can't be tracked by Atlas from handoff day." | `AH-P4-3` (Tower metric plan deferral) |
| `ER-P4-5` | Business case is sponsor-approved | Named individual sign-off on the business case economics. Cannot be self-approved by the program lead. Gate criterion `GC-P4-2` requires named sponsor, date, and which sections were reviewed. | `BIZ-CASE-P4.sponsor_signoff.name` + `date` + `artifacts_reviewed` (all non-null) | "The business case needs sponsor approval — not just awareness. Who approved it, on what date, and which sections did they review? I need those three things before I can mark GC-P4-2 as met." | — |
| `ER-P4-6` | Tower metric plan exists before gate | `TOWER-METRICS-P4` artifact must exist with at least one metric entry per P2 value lever before gate evaluation begins. AH-P4-4 checks this before any other gate criterion. | `TOWER-METRICS-P4` artifact present AND `tower_kpi_count >= lever_count` | "Before gate, we need to lock the Tower metric plan. Let's define the signals Atlas will track from day 1. Which value lever do you want to start with?" | `AH-P4-4` |

**Total P4 evidence rules: 6**

---

## P5 — Mobilize & Handoff canvas evidence rules

| `rule_id` | `claim_type` | `required_evidence` | `source_field` | `fallback_if_missing` | `ah_rule_ref` |
|---|---|---|---|---|---|
| `ER-P5-1` | Named delivery lead confirmed | A specific individual's name in user input or uploaded RACI/org chart, PLUS explicit confirmation that the individual has been informed and accepted the role. "We'll ask [Name]" is not confirmation. "IT team" is not a name. | `TEAM-P5.workstream[n].lead_name` (individual, not role) + `availability_confirmed = true` | "I need a named individual and confirmation they've accepted, not a role title or tentative assignment. Has [Name] been informed they are the lead for this workstream and confirmed they are available?" | `AH-P5-3` |
| `ER-P5-2` | Handoff package is complete | All required artifact categories from P0–P4 must be present in `ws-canvas-p5-handoffpack-checklist`. Each component must have `Present` or `Signed` status. A component cannot be marked Present without a linked artifact. | `HANDOFF-PKG-P5.artifact_index` — each of 5 phase artifact groups has at least one artifact with `status = 'Present'` | "The handoff package has [count] missing component(s): [names]. Tower cannot review an incomplete package. Let's close the gaps first — which of these can you upload or confirm now?" | `AH-P5-4` |
| `ER-P5-3` | Tower acceptance (the program is handed off) | Named individual confirmation in writing or a recorded session that the package is executable as specified. Required fields: (1) acceptor name, (2) acceptor role, (3) confirmation date, (4) explicit statement ("the package has been reviewed and is executable as specified"). The assembler cannot be the acceptor. | `ACCEPTANCE-P5.acceptor_name` + `acceptor_role` + `confirmation_date` + `explicit_statement` (all four non-null; `acceptor_name != handoff_package_assembler`) | "Not yet. Tower receiving the package is not the same as Tower accepting it. The gate requires a named individual to explicitly confirm the package is executable. Has anyone on the Tower side made that explicit confirmation — in writing or in a recorded session?" | `AH-P5-1`, `AH-P5-2` |
| `ER-P5-4` | Acknowledgment presented as acceptance | `ws-canvas-p5-tower-acceptance-status` must be evaluated strictly: `submitted` = package sent; `acknowledged` = Tower replied but did not accept; `accepted` = explicit named confirmation. Nexus must not conflate these states. | `ws-canvas-p5-tower-acceptance-status` — evaluated literally; `acknowledged` does NOT satisfy the acceptance gate requirement | "Acknowledged is not the same as accepted. 'Received' or 'noted' does not meet the P5 gate requirement. The gate requires explicit confirmation that the package is executable. What exactly did the Tower representative say?" | `AH-P5-1` |
| `ER-P5-5` | Readiness verification per domain | Three-domain readiness checklist: (1) data access (per Tower metric data source), (2) tooling (per workstream environment), (3) change management (communication plan live, training scheduled). Must be explicit per-domain confirmation, not a general "we're ready." | `READINESS-P5.data_access[n]` + `READINESS-P5.tooling[n]` + `READINESS-P5.change_management[n]` — each with named confirming individual and date | "Readiness verification isn't a formality — it confirms actual conditions match the plan. Let's go domain by domain. Data access first: for [first Tower metric], is the data source in [named system] accessible today?" | — |
| `ER-P5-6` | Tower metric plan present at P5 entry | `tower_metric_plan_drafted` artifact from P4.3 must exist and be linked in the handoff package. If absent at P5 entry, this is a P4 gap — P5 cannot proceed until resolved. | `HANDOFF-PKG-P5.artifact_index` contains `TOWER-METRICS-P4` link | "The Tower metric plan is missing from P4. This should have been completed in P4 — P5 operationalizes it, it does not create it. We cannot assemble the handoff package without it. Was this completed in P4, and where is the artifact?" | — |

**Total P5 evidence rules: 6**

---

## Cross-phase evidence rule summary

| Phase | Total rules | Key boundary enforced |
|---|---|---|
| P0 | 6 | No sponsor name without ACL/people data; all value figures labeled UNVALIDATED_HYPOTHESIS |
| P1 | 6 | Candidate ≠ committed sponsor; value range not point estimate; stakeholder names need source |
| P2 | 6 | Baseline requires all 4 fields; data adequacy requires per-asset verification; discontinue must be direct |
| P3 | 6 | Design elements must trace to P2 root causes; tool names require operating model first (R6) |
| P4 | 6 | All costs need source label; all value claims anchor to FIN-BASE-P2; Tower metrics required before gate |
| P5 | 6 | Acknowledgment ≠ acceptance; assembler ≠ acceptor; readiness requires per-domain confirmation |

**Total evidence rules across all phases: 36**

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with W-5.7, date 2026-05-05, and correct dependencies | PASS |
| Each phase has exactly 6 evidence rules | PASS |
| All `fallback_if_missing` entries are exact Nexus quotes, not descriptions | PASS |
| `ah_rule_ref` values trace to AH-P{N}-{M} IDs in the corresponding training pack Field 21 | PASS |
| R1 (evidence-first) and R3 (no-fabrication) interaction explained in overview | PASS |
| P0 ER-P0-3 enforces `UNVALIDATED_HYPOTHESIS` label per AH-P0-3 | PASS |
| P1 ER-P1-1 correctly distinguishes candidate (P0) from committed sponsor (P1) per AH-P1-1 | PASS |
| P2 ER-P2-4 uses the required direct form for discontinue recommendation per AH-P2-3 | PASS |
| P3 ER-P3-3 enforces vendor-after-operating-model per R6 (AH-P3-2) | PASS |
| P4 ER-P4-4 (Tower metric data source) enforces non-null, non-TBD data source | PASS |
| P4 ER-P4-6 (Tower metric plan before gate) enforces AH-P4-4 — check happens before any gate criterion | PASS |
| P5 ER-P5-3 and ER-P5-4 together enforce the acknowledged≠accepted distinction (R7) | PASS |
| P5 ER-P5-3 enforces AH-P5-2 (assembler ≠ acceptor) via the `acceptor_name != handoff_package_assembler` condition | PASS |
| No rule has a fallback that could be interpreted as Nexus fabricating data | PASS |
| Cross-phase summary table is accurate | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 36 evidence rules across 6 phases (6 per phase), all fallback quotes verbatim, AH rule cross-references | Claude Code |
