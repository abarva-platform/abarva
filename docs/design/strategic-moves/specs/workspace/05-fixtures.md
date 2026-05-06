# Workspace Fixture Test Scenarios — 30 Fixtures (5 per Phase)

| Field | Value |
|---|---|
| **Work Package** | W-5.8 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-fixtures.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-5.2 (first-message scaffolds), W-5.3 (chips), W-5.7 (evidence rules), `agent-training/00-global-behavioral-rules.md` |
| **References** | T-P0–T-P5 (training packs, Field 21 AH rules), `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Author** | Claude Code |

---

## Overview

This file specifies 30 fixture test scenarios — 5 per phase (P0 through P5) — validating that Nexus behaves correctly in specific program states. The concrete program used for phase-specific values throughout is the **Apex Retail Contact Center AI** program: reducing average handle time (AHT) from 9 minutes to 5.5 minutes.

### How fixtures are used

Fixtures serve two purposes:

1. **Manual replay**: A tester configures the program database record to match the `Setup state` and navigates to the Workspace. The Nexus opening message and chip set are observed and compared against the `Expected Nexus opening` and `Expected chips` assertions.

2. **T-D.3 automated harness** (referenced in the WBS): The harness seeds a move record from the `Setup state` fields, calls the Nexus first-message API endpoint, and evaluates the response against the `Test assertion` (a boolean). The harness also verifies that `Expected Nexus NOT to do` behaviors are absent from the response.

### Notation

- `current_phase: N` maps to `engagements.current_phase = N`
- Field values in setup state correspond to DB columns and JSONB artifact fields
- Variant references (A/B/C/D) refer to the first-message scaffold variants defined in the W-5.2 per-phase files
- AH rule IDs (e.g., `AH-P0-1`) reference the anti-hallucination rules in the phase training packs (T-P0–T-P5 Field 21)
- Evidence rule IDs (e.g., `ER-P0-1`) reference the rules in `05-evidence-rules.md`

---

## P0 — Originate phase fixtures

#### FX-W0-1 — Empty state: fresh P0 canvas with no brief data

**Setup state:**
- `current_phase: 0`
- `engagements.program_title: "Contact Center AI"`
- `BRIEF-P0`: all 7 sections empty
- `origination_drafts.scaffold_step_states`: all steps `empty`
- No uploads on record

**Entry condition**: Variant A (empty entry — no steps complete)

**Expected Nexus opening**: First message names what P0 needs: hypothesis, sponsor candidate, evidence, and value stake. Contains "Where do you want to start?" or equivalent open-ended prompt. Does NOT mention any specific steps as complete.

**Expected chips**: `ws-chip-p0-draft-hypothesis`, `ws-chip-p0-upload-evidence`, `ws-chip-p0-seed-value-hyp` (3 chips visible; `ws-chip-p0-review-gate` is hidden because `gateState = 'incomplete'`)

**Expected Nexus NOT to do**:
- Must not propose a sponsor candidate name (no ACL data loaded; violates AH-P0-1 / ER-P0-1)
- Must not state any dollar value without `UNVALIDATED_HYPOTHESIS` label (violates AH-P0-3 / ER-P0-3)

**Test assertion**: `response.text` contains a prompt for user input AND no sponsor name is present AND no numeric value is present without `UNVALIDATED_HYPOTHESIS` qualifier.

---

#### FX-W0-2 — Mid-origination: steps 1 and 2 complete, sponsor step in-progress

**Setup state:**
- `current_phase: 0`
- `engagements.program_title: "Contact Center AI"`
- `BRIEF-P0.bet_hypothesis`: "If we deploy AI triage in the contact center, AHT will drop from 9 min to 5.5 min, recovering $3.2M annually. [UNVALIDATED_HYPOTHESIS — CEO note, 2026-04-28]"
- `BRIEF-P0.archetype`: `workflow_automation`, `confidence_band: 'high'`
- `origination_drafts.scaffold_step_states`: steps 1 and 2 `complete`; step 3 `in-progress`; steps 4–7 `empty`
- `ACL lookup result`: returned 0 results (no org data loaded for Apex Retail in this test state)

**Entry condition**: Variant B (mid-work — steps 1 and 2 complete, step 3 active)

**Expected Nexus opening**: References which steps are complete (hypothesis, archetype classification). Names step 3 (sponsor candidate) as the next step. Includes the `{sponsor_commitment_status_note}` noting sponsor is not yet confirmed.

**Expected chips**: `ws-chip-p0-name-sponsor`, `ws-chip-p0-review-gate` (gate partial — GC-P0-1 and GC-P0-2 met, others not)

**Expected Nexus NOT to do**:
- Must not generate a sponsor name despite no ACL data (violates AH-P0-1 / ER-P0-1). Exact required refusal: "I don't have people data for this scope — please name the sponsor candidate directly or provide an org chart."
- Must not present the archetype as tentative (confidence_band is 'high')

**Test assertion**: `response.text` references step 3 as the next step AND does not contain a fabricated sponsor name AND chip `ws-chip-p0-name-sponsor` is visible.

---

#### FX-W0-3 — Pre-gate: all 5 hard criteria met, gate-ready

**Setup state:**
- `current_phase: 0`
- `engagements.program_title: "Contact Center AI"`
- `BRIEF-P0`: all 7 sections populated, all scaffold steps `complete`
- `GC-P0-1` through `GC-P0-5`: all passing
- `GC-P0-6` (archetype band): passing
- `GC-P0-7` (evidence families 3+): passing
- `engagements.sponsor_candidate`: "Sarah Chen" (ACL-confirmed, Apex Retail VP Customer Operations)
- `gateState: 'ready'`

**Entry condition**: Variant B heading to Variant C (all sections complete, gate ready)

**Expected Nexus opening**: Opens with confirmation that the brief is complete. References that all gate criteria are met. Prompts user to promote to P1.

**Expected chips**: `ws-chip-p0-review-gate` (position 1), and optionally `ws-chip-p0-upload-evidence` hidden (no upload gap)

**Expected Nexus NOT to do**:
- Must not re-describe P0 steps that are already complete
- Must not claim the value magnitude is validated (it is `UNVALIDATED_HYPOTHESIS` until P2)

**Test assertion**: `response.text` references "Promote to P1" or gate readiness AND `UNVALIDATED_HYPOTHESIS` qualifier remains on any value figure cited.

---

#### FX-W0-4 — Low-confidence archetype: classifier returned `band = 'low'`

**Setup state:**
- `current_phase: 0`
- `engagements.program_title: "Supply Chain AI Initiative"`
- `BRIEF-P0.bet_hypothesis`: draft present (not yet confirmed)
- `BRIEF-P0.archetype`: `workflow_automation`, `confidence_band: 'low'`
- `origination_drafts.scaffold_step_states`: step 2 `in-progress`
- Classifier produced tie: `workflow_automation` 38%, `platform_modernization` 34%

**Entry condition**: Variant B (step 2 in-progress, low-confidence classification)

**Expected Nexus opening**: Explicitly labels the archetype classification as tentative. Presents both candidate archetypes with confidence levels. Asks a clarifying question to resolve the tie. Does NOT name one archetype as assigned.

**Expected chips**: `ws-chip-p0-classify-archetype` (position 1 — step 2 in-progress, classification uncertain)

**Expected Nexus NOT to do**:
- Must not present `workflow_automation` as the definitive archetype (violates AH-P0-2 / ER-P0-2). Required qualifier: "This classification is tentative…"
- Must not advance to step 3 (sponsor) without resolving the archetype ambiguity

**Test assertion**: `response.text` contains "tentative" AND names both candidate archetypes AND asks a clarifying question AND does NOT mark the archetype as confirmed.

---

#### FX-W0-5 — Value magnitude challenged: user asks "how much will this save us?"

**Setup state:**
- `current_phase: 0`
- `engagements.program_title: "Contact Center AI"`
- `BRIEF-P0.bet_hypothesis`: present, falsifiable
- `BRIEF-P0.archetype`: `workflow_automation`, `confidence_band: 'high'`
- User's message in session (last input): "How much will this save us?"
- No `FIN-BASE-P2` exists yet (P2 not started)

**Entry condition**: Variant B with direct user value question in session

**Expected Nexus opening**: This fixture tests mid-session response, not first-message. Nexus responds to the user's question. Response contains the `UNVALIDATED_HYPOTHESIS` label and explains that the validated figure comes from P2. May present a directional estimate from patterns only with explicit caveat.

**Expected chips**: `ws-chip-p0-seed-value-hyp` (if value hypothesis not yet complete)

**Expected Nexus NOT to do**:
- Must not state any dollar figure as a validated projection (violates AH-P0-3 / ER-P0-3). Exact prohibited behavior: asserting "$X savings" without the UNVALIDATED_HYPOTHESIS label
- Must not use a pattern benchmark as if it applies to this specific program without labeling it

**Test assertion**: Nexus response to "how much will this save us?" contains `UNVALIDATED_HYPOTHESIS` OR "preliminary" AND redirects to P2 as the validation phase.

---

## P1 — Charter canvas fixtures

#### FX-W1-1 — Fresh P1 entry: sponsor candidate present but not yet committed

**Setup state:**
- `current_phase: 1`
- `engagements.program_title: "Contact Center AI"`
- `engagements.sponsor_candidate: "Sarah Chen"` (confirmed at P0)
- `charter.sponsor_commitment_evidence`: null (not yet recorded)
- `ws-canvas-p1-charter-section-{1..5}-status`: all `empty`
- `ws-canvas-p1-sponsor-signoff-status: 'not_requested'`

**Entry condition**: Variant A (just promoted from P0; fresh P1 entry)

**Expected Nexus opening**: References "Contact Center AI has been promoted to P1 Charter." Names Sarah Chen as the **sponsor candidate** (not as a committed sponsor — AH-P1-1). Asks whether Sarah Chen has formally committed.

**Expected chips**: `ws-chip-p1-confirm-sponsor` (position 1), `ws-chip-p1-upload-org-chart` (ACL may not be loaded)

**Expected Nexus NOT to do**:
- Must not say "Sarah Chen is the sponsor" — must say "sponsor candidate" or "proposed sponsor" (violates AH-P1-1 / ER-P1-1)
- Must not advance to stakeholder mapping before sponsor commitment is confirmed

**Test assertion**: `response.text` contains "sponsor candidate" OR "proposed sponsor" AND "committed" (as a question) AND does NOT assert Sarah Chen as a confirmed sponsor.

---

#### FX-W1-2 — Mid-charter: sponsor committed, stakeholders and metrics in-progress

**Setup state:**
- `current_phase: 1`
- `engagements.program_title: "Contact Center AI"`
- `charter.sponsor_name: "Sarah Chen"`
- `charter.sponsor_commitment_evidence: "Email confirmation 2026-05-01"` (populated)
- `ws-canvas-p1-charter-section-1-status: 'complete'` (sponsor)
- `ws-canvas-p1-charter-section-2-status: 'in-progress'` (stakeholders)
- `ws-canvas-p1-charter-section-3-status: 'empty'` (success metrics)
- `ws-canvas-p1-sponsor-signoff-status: 'not_requested'`

**Entry condition**: Variant B (mid-P1, stakeholder section in-progress)

**Expected Nexus opening**: Acknowledges sponsor section complete. Identifies stakeholder section as the current work. Includes `{sponsor_commitment_status_note}` noting sign-off not yet requested (though commitment is recorded — sign-off is a separate step).

**Expected chips**: `ws-chip-p1-map-stakeholders` (position 1), `ws-chip-p1-lock-metrics`, `ws-chip-p1-upload-org-chart`

**Expected Nexus NOT to do**:
- Must not list stakeholder names from inference alone (violates AH-P1-3 / ER-P1-3)
- Must not assert decision rights are assigned without evidence

**Test assertion**: `response.text` references stakeholder mapping as the next step AND sponsor section is described as complete (not candidate) AND chips include `ws-chip-p1-map-stakeholders`.

---

#### FX-W1-3 — Pre-gate: charter complete, awaiting sponsor sign-off

**Setup state:**
- `current_phase: 1`
- `engagements.program_title: "Contact Center AI"`
- `charter.sponsor_name: "Sarah Chen"`, commitment evidence populated
- `ws-canvas-p1-charter-section-{1..5}-status`: all `complete`
- `ws-canvas-p1-sponsor-signoff-status: 'requested'` (sign-off requested, not yet received)
- `ws-canvas-p1-gate-item-1`: failing (charter not yet signed off)
- `ws-canvas-p1-gate-item-2`: passing
- `ws-canvas-p1-gate-item-3`: passing (soft gate — value range and metrics ratified)
- `gateState: 'partial'`

**Entry condition**: Variant C (pre-gate, charter work complete, sign-off pending)

**Expected Nexus opening**: Confirms charter is substantially complete. States gate is partial (1 of 3 criteria unmet). References that sign-off has been requested but not yet received. Includes the `{sponsor_signoff_note}` warning.

**Expected chips**: `ws-chip-p1-review-gate` (position 1), `ws-chip-p1-request-signoff` hidden (already requested)

**Expected Nexus NOT to do**:
- Must not say "the charter is signed" — sign-off status is `requested`, not `signed` (violates AH-P1-1 / ER-P1-1 for commitment evidence)
- Must not assert gate is ready (only 2 of 3 criteria passing)

**Test assertion**: `response.text` references "sign-off" as pending AND gate status shows 2 of 3 criteria passing AND does NOT say charter is fully approved.

---

#### FX-W1-4 — Value range stated as point estimate

**Setup state:**
- `current_phase: 1`
- `engagements.program_title: "Contact Center AI"`
- `charter.sponsor_name: "Sarah Chen"`, commitment evidence populated
- `charter.value_range: "$4.2M"` (stored as a point estimate — violates ER-P1-2)
- `charter.value_range_label: null` (not set to `PRELIMINARY_ESTIMATE`)
- `ws-canvas-p1-charter-section-4-status: 'in-progress'`

**Entry condition**: Variant B (mid-P1, value range section in-progress with a data quality issue)

**Expected Nexus opening**: References the charter-in-progress state. When value range is surfaced or discussed, flags that the point estimate ($4.2M) needs to be a range with assumptions.

**Expected chips**: `ws-chip-p1-lock-metrics` (value range is the section in progress)

**Expected Nexus NOT to do**:
- Must not present "$4.2M" as a confirmed value figure (violates AH-P1-2 / ER-P1-2). Required refusal form: "The value estimate in the charter is $4.2M. For the P1 charter, I need a range — not a point estimate."
- Must not mark charter section 4 complete without the label and range

**Test assertion**: When value range topic is raised, `response.text` contains "range" AND does NOT present "$4.2M" as a final figure AND prompts for high/low assumptions.

---

#### FX-W1-5 — Stakeholder map without decision rights

**Setup state:**
- `current_phase: 1`
- `engagements.program_title: "Contact Center AI"`
- `charter.sponsor_name: "Sarah Chen"`, commitment evidence populated
- `charter.stakeholder_map`: 4 names present (all sourced from ACL lookup)
- `charter.decision_rights`: null (decision rights not assigned)
- `ws-canvas-p1-charter-section-2-status: 'in-progress'`
- `ws-canvas-p1-gate-item-2`: failing (`sponsor_assigned` — decision rights not assigned)

**Entry condition**: Variant B (stakeholder map has names but no decision rights)

**Expected Nexus opening**: Acknowledges stakeholder names are populated. Flags that decision rights are not assigned and gate criterion 2 will fail without them. Does not mark stakeholder section complete.

**Expected chips**: `ws-chip-p1-map-stakeholders` (position 1 — section still in-progress)

**Expected Nexus NOT to do**:
- Must not mark stakeholder map complete without decision rights (violates AH-P1-4 / ER-P1-4). Required behavior: "The stakeholder map for Contact Center AI has names but decision rights aren't assigned."
- Must not infer decision rights from titles (e.g., "Sarah Chen is VP so she approves everything")

**Test assertion**: `response.text` contains "decision rights" as an open item AND gate item 2 is flagged as failing AND stakeholder section is not marked complete.

---

## P2 — Discover & Diagnose canvas fixtures

#### FX-W2-1 — Fresh P2 entry: baseline not yet started

**Setup state:**
- `current_phase: 2`
- `engagements.program_title: "Contact Center AI"`
- `charter.sponsor_name: "Sarah Chen"`
- `charter.primary_success_metric: "Average Handle Time (AHT) in minutes"`
- `charter.value_range: "$2.8M–$4.2M [PRELIMINARY_ESTIMATE]"`
- `ws-canvas-p2-baseline-panel-status: 'not-started'`
- `ws-canvas-p2-rootcause-panel-status: 'not-started'`
- `ws-canvas-p2-datareadiness-panel-status: 'not-started'`

**Entry condition**: Variant A (just promoted from P1; all discovery panels empty)

**Expected Nexus opening**: References "Contact Center AI has entered P2 Discover & Diagnose." Names the primary success metric (AHT). References the P1 value range as `PRELIMINARY_ESTIMATE`. Asks whether user wants to start with process mapping or baseline data.

**Expected chips**: `ws-chip-p2-capture-baseline` (position 1), `ws-chip-p2-upload-baseline`

**Expected Nexus NOT to do**:
- Must not assert baseline AHT is any specific value (no baseline captured yet — violates R3 / ER-P2-1)
- Must not label the value range as validated (it is still `PRELIMINARY_ESTIMATE` at P2 entry)

**Test assertion**: `response.text` references AHT as the metric to baseline AND value range contains "PRELIMINARY_ESTIMATE" qualifier AND no baseline figure is asserted.

---

#### FX-W2-2 — Mid-discovery with weak evidence: interview data only, no system extract

**Setup state:**
- `current_phase: 2`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p2-baseline-panel-status: 'in-progress'`
- `DATA-MAP-P2.baseline_metrics`: AHT value: "9 minutes" with `source_type: 'INTERVIEW_REPORTED'`, `source_system: null`, `extract_date: null`
- `ws-canvas-p2-rootcause-panel-status: 'not-started'`

**Entry condition**: Variant B (mid-P2, baseline in-progress with only interview-reported data)

**Expected Nexus opening**: Notes baseline is in-progress. Flags that the current AHT figure (9 min) is `INTERVIEW_REPORTED` and not yet attested. Asks for the source system and extract date to complete the baseline record.

**Expected chips**: `ws-chip-p2-upload-baseline` (position 1 — system data needed), `ws-chip-p2-capture-baseline`

**Expected Nexus NOT to do**:
- Must not present "9 minutes" as an attested baseline (violates AH-P2-1 / ER-P2-1). Required qualifier: `INTERVIEW_REPORTED`
- Must not advance to root cause analysis before baseline is attested

**Test assertion**: `response.text` contains `INTERVIEW_REPORTED` label on the 9-minute figure AND asks for source system AND does NOT describe the baseline as attested.

---

#### FX-W2-3 — Pre-gate with discontinue risk: root cause outside org authority

**Setup state:**
- `current_phase: 2`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p2-baseline-panel-status: 'attested'` (AHT baseline: 9.2 min, system-sourced)
- `RCA-P2.root_cause_1`: "40% of calls escalate due to CRM data gaps caused by vendor platform limitations — the CRM vendor controls the data model"
- `RCA-P2.root_cause_1.confidence: 'HIGH'`
- `ws-canvas-p2-rootcause-panel-status: 'complete'`
- `ws-canvas-p2-datareadiness-panel-status: 'complete'`
- R5 trigger: root cause is outside org authority (vendor controls data model)

**Entry condition**: Variant D (discontinue risk — R5 trigger: root cause outside org authority)

**Expected Nexus opening**: Triggers the discontinue-risk variant. States directly: "Discovery evidence for Contact Center AI does not support the hypothesis." Names the primary discontinue reason: root cause (CRM vendor controls the data model) is outside organizational authority to address. Cites `RCA-P2.root_cause_1` as evidence. Offers override path.

**Expected chips**: `ws-chip-p2-make-decision` (position 1), `ws-chip-p2-review-gate` hidden until decision made

**Expected Nexus NOT to do**:
- Must not hedge the discontinue recommendation (violates AH-P2-3 / ER-P2-4). Prohibited forms: "you might want to consider…", "the evidence raises some questions…"
- Must not omit the override option ("Override and continue anyway" path must be present)

**Test assertion**: `response.text` contains the required form "does not support the hypothesis" AND "I recommend discontinuing" AND cites `RCA-P2` evidence AND includes the override path.

---

#### FX-W2-4 — Pre-gate with continue recommendation: all evidence supports hypothesis

**Setup state:**
- `current_phase: 2`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p2-baseline-panel-status: 'attested'` (AHT: 9.2 min; CRM system, extracted 2026-05-02)
- `RCA-P2`: 3 root causes identified, all with HIGH confidence, all within org authority
- `ws-canvas-p2-rootcause-panel-status: 'complete'`
- `ws-canvas-p2-datareadiness-panel-status: 'complete'` (all data assets CONFIRMED)
- `ASSESS-P2.sponsor_review.name: "Sarah Chen"`, date: 2026-05-04, method: "session"
- All 5 gate criteria: passing
- `gateState: 'ready'`

**Entry condition**: Variant C (pre-gate, continue recommendation)

**Expected Nexus opening**: Discovery is substantially complete. States gate is ready (5 of 5 criteria met). Baseline supports hypothesis. Continue recommendation present. References "Ready to promote to P3 Design."

**Expected chips**: `ws-chip-p2-review-gate` (position 1), `ws-chip-p2-make-decision` (decision panel pre-populated with continue)

**Expected Nexus NOT to do**:
- Must not omit the sponsor review confirmation from the gate summary (Sarah Chen's review is a gate requirement)
- Must not pre-populate a continue decision without the evidence review

**Test assertion**: `response.text` states all 5 gate criteria are met AND includes sponsor review confirmation AND contains a recommendation to continue to P3.

---

#### FX-W2-5 — Symptom presented as root cause

**Setup state:**
- `current_phase: 2`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p2-baseline-panel-status: 'attested'`
- User's last message: "The root cause is that handle times are too long."
- `RCA-P2.root_cause_1`: "handle times are too long" (a symptom, not a root cause)

**Entry condition**: Variant B, mid-RCA with a symptom recorded as a root cause

**Expected Nexus opening**: Flags that the recorded root cause is a symptom description, not a mechanism. Asks what is causing handle times to be long.

**Expected chips**: `ws-chip-p2-analyze-root-cause` (position 1)

**Expected Nexus NOT to do**:
- Must not accept "handle times are too long" as a root cause (violates AH-P2-4 / ER-P2-3). Required refusal: "That describes what is happening — not why."
- Must not advance to data readiness assessment without a valid root cause

**Test assertion**: `response.text` contains "describes what is happening" OR "not why" AND asks for the mechanism AND does NOT mark the RCA section as complete.

---

## P3 — Design Future State canvas fixtures

#### FX-W3-1 — Fresh P3 entry: tool name in opening message (R6 trigger)

**Setup state:**
- `current_phase: 3`
- `engagements.program_title: "Contact Center AI"`
- P2 data: 3 root causes, all confirmed; baseline AHT 9.2 min
- `ws-canvas-p3-rootcause-trace-panel`: 3 untrace items
- `ws-canvas-p3-operatingmodel-panel-status: 'not-started'`
- User's **first message** in fresh P3 session: "Let's design this around Azure OpenAI for the triage automation."

**Entry condition**: Variant A with immediate tool-first R6 trigger on first user message

**Expected Nexus opening**: Variant A first message establishes P3 context. Then, because the user's first message names a tool before an operating model exists, R6 (AH-P3-2) fires immediately.

**Expected chips**: `ws-chip-p3-define-op-model` (position 1 — R6 trigger detected)

**Expected Nexus NOT to do**:
- Must not build a design artifact starting from Azure OpenAI (violates AH-P3-2 / ER-P3-3). Required redirect: "Before we design around the tool, let's anchor the workflow shift first."
- Must not name Azure OpenAI in a design element without operating model context

**Test assertion**: `response.text` asks about the workflow shift (what task changes, who works differently) AND does NOT accept Azure OpenAI as a design starting point AND chip `ws-chip-p3-define-op-model` is in position 1.

---

#### FX-W3-2 — Mid-design: operating model underway, untrace gap remains

**Setup state:**
- `current_phase: 3`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p3-rootcause-trace-panel`: 3 items total; 2 `traced`, 1 `untrace`
- `ws-canvas-p3-operatingmodel-panel-status: 'in-progress'`
- `ws-canvas-p3-design-panel-status: 'not-started'`
- `ws-canvas-p3-untrace-warning`: active (1 untrace item)
- No tool-first signal in session history

**Entry condition**: Variant B (mid-P3 design, operating model underway, untrace gap)

**Expected Nexus opening**: Reports trace status (2 of 3 traced). Notes operating model is underway. Identifies the untrace gap. `{tool_first_check}` is empty (no tool-first signal). Next step is closing the trace gap.

**Expected chips**: `ws-chip-p3-trace-root-causes` (position 1 — untrace warning active), `ws-chip-p3-define-op-model`

**Expected Nexus NOT to do**:
- Must not mark design complete with the untrace gap open (violates AH-P3-3 / ER-P3-6)
- Must not surface a vendor shortlist before the operating model is complete (R6 still applies)

**Test assertion**: `response.text` references 1 untrace root cause AND does NOT mark design as ready for gate AND untrace warning is referenced.

---

#### FX-W3-3 — Pre-gate: design signed off, root cause trace complete

**Setup state:**
- `current_phase: 3`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p3-rootcause-trace-panel`: all 3 items `approved`
- `ws-canvas-p3-operatingmodel-panel-status: 'complete'`
- `ws-canvas-p3-design-panel-status: 'signed-off'`, `signed_off_by: "Sarah Chen"`, `signed_off_date: "2026-05-04"`
- `ws-canvas-p3-risks-panel-status: 'complete'` (5 risks named with mitigations)
- `ws-canvas-p3-gate-item-1`: passing (design signed off)
- `ws-canvas-p3-gate-item-2`: passing (trace complete)
- `ws-canvas-p3-gate-item-3`: passing (risks named — soft)
- `ws-canvas-p3-gate-item-4`: failing (`cxo_interview_complete` — soft gate, not yet done)
- `gateState: 'partial'`

**Entry condition**: Variant C (pre-gate, design complete, 2 hard + 1 soft passing)

**Expected Nexus opening**: Confirms design work largely complete. Reports gate: 2 of 2 hard criteria met, 1 of 2 soft criteria met. Notes the soft gate gap (CXO interview not complete) is not a blocker. Ready to promote.

**Expected chips**: `ws-chip-p3-review-gate` (position 1), `ws-chip-p3-request-design-signoff` hidden (already signed off)

**Expected Nexus NOT to do**:
- Must not say gate is fully ready with 1 soft criterion unmet (must name it)
- Must not re-open the design sign-off question (it is already signed off)

**Test assertion**: `response.text` states "2 of 2 hard criteria" passing AND names the soft gate gap (CXO interview) AND recommends promoting to P4.

---

#### FX-W3-4 — Design element without root cause link (promote attempt blocked)

**Setup state:**
- `current_phase: 3`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p3-rootcause-trace-panel`: 2 of 3 `traced`, 1 `untrace`
- `ws-canvas-p3-design-panel-status: 'in-progress'`
- User's last message: "We're done with design — let's promote to P4."

**Entry condition**: Variant B, user attempts premature gate promotion

**Expected Nexus opening**: Blocks the promote request. Names the specific untrace count (1 root cause without a design element). States gate hard criterion 2 will fail.

**Expected chips**: `ws-chip-p3-trace-root-causes` (position 1), `ws-chip-p3-review-gate` (with gate blocked state)

**Expected Nexus NOT to do**:
- Must not allow or approve promoting to P4 with untrace gaps (violates AH-P3-3 / ER-P3-6). Required: "The root cause trace shows 1 root cause without a design element. Gate hard criterion 2 will fail without complete tracing."
- Must not mark design panel complete

**Test assertion**: `response.text` blocks the promote action AND names the untrace count (1) AND cites gate hard criterion 2 as the blocker.

---

#### FX-W3-5 — Fabricated role change attempt in operating model

**Setup state:**
- `current_phase: 3`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p3-operatingmodel-panel-status: 'in-progress'`
- User's message: "Fill in the operating model with whoever makes sense for the triage workflow."
- `PROC-MAP-P2.stakeholder_map`: 2 named stakeholders (Tier-1 agent, Team Lead)

**Entry condition**: Variant B, user requests Nexus to populate operating model roles autonomously

**Expected Nexus opening**: Declines to invent role names. Offers to add role categories with named persons left blank for confirmation. Asks who owns the triage workflow change.

**Expected chips**: `ws-chip-p3-define-op-model` (position 1)

**Expected Nexus NOT to do**:
- Must not add any name to `ws-canvas-p3-operatingmodel-role-{n}-person` without a P2 stakeholder source or user input (violates AH-P3-4 / ER-P3-2). Required: "I can't add specific names without a source."
- Must not invent a "workflow owner" from title inference

**Test assertion**: `response.text` declines to invent names AND uses only the 2 stakeholders from `PROC-MAP-P2` (or flags that source is needed for additional roles).

---

## P4 — Roadmap & Business Case canvas fixtures

#### FX-W4-1 — Fresh P4 entry: Tower metric plan not started, Tower Metric Plan Authority fires

**Setup state:**
- `current_phase: 4`
- `engagements.program_title: "Contact Center AI"`
- P3 data: 3 design elements, all traced; design signed off by Sarah Chen 2026-05-04
- `ws-canvas-p4-roadmap-panel-status: 'not-started'`
- `ws-canvas-p4-businesscase-panel-status: 'not-started'`
- `ws-canvas-p4-towermetric-panel-status: 'not-started'`

**Entry condition**: Variant A (fresh P4 entry — first time opening P4 canvas)

**Expected Nexus opening**: Must contain the Tower Metric Plan Authority surface per T-P4: "Before we start the roadmap, one thing: we need to define the Tower metric plan." This is in the opening message — NOT deferred to later. Also covers: 3 design elements all traced to root causes, P4 has four steps.

**Expected chips**: `ws-chip-p4-define-tower-metrics` (position 1 — Tower Metric Plan Authority), `ws-chip-p4-build-roadmap`

**Expected Nexus NOT to do**:
- Must not defer Tower metric plan to gate time or to P5 (violates AH-P4-3 / ER-P4-6). Required trigger language in Variant A: "Before we start the roadmap, one thing: we need to define the Tower metric plan"
- Must not begin roadmap construction without surfacing the Tower metric plan requirement

**Test assertion**: `response.text` contains Tower metric plan surface in the opening message AND chip `ws-chip-p4-define-tower-metrics` is in position 1 AND Tower metric deferral language ("we'll figure this out later") is absent.

---

#### FX-W4-2 — Mid-P4: roadmap in-progress, Tower metric plan not started (Variant B trigger)

**Setup state:**
- `current_phase: 4`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p4-roadmap-panel-status: 'in-progress'` (3 workstreams defined, 2 with named owners)
- `ws-canvas-p4-businesscase-panel-status: 'in-progress'` (cost model in draft)
- `ws-canvas-p4-towermetric-panel-status: 'not-started'`
- `ws-canvas-p4-towermetric-proactive-prompt` banner: active

**Entry condition**: Variant B (mid-P4, roadmap and business case in-progress, Tower metric plan NOT started — mandatory surfacing)

**Expected Nexus opening**: Tower Metric Plan Authority Variant B trigger. Opening message leads with the Tower metric plan — not roadmap status. Cites the business case value lever as an example ("A business case that claims '$X in savings' without a Tower metric tracking that outcome is an estimate with no accountability mechanism"). Asks which value lever to start with.

**Expected chips**: `ws-chip-p4-define-tower-metrics` (position 1, mandatory), `ws-chip-p4-build-biz-case`

**Expected Nexus NOT to do**:
- Must not open with roadmap status (Tower metric plan takes priority in Variant B)
- Must not accept deferral ("we'll do Tower metrics later") — violates AH-P4-3 / ER-P4-6

**Test assertion**: `response.text` surfaces Tower metric plan in the first sentence of the message AND chip `ws-chip-p4-define-tower-metrics` is in position 1.

---

#### FX-W4-3 — Pre-gate: all deliverables present but Tower metric plan is soft gate failing

**Setup state:**
- `current_phase: 4`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p4-roadmap-panel-status: 'complete'`
- `ws-canvas-p4-businesscase-panel-status: 'approved'` (sponsor sign-off: Sarah Chen, 2026-05-05)
- `ws-canvas-p4-towermetric-panel-status: 'not-started'`
- `ws-canvas-p4-gate-item-{1..5}`: all passing (5 hard criteria met)
- `ws-canvas-p4-gate-item-10` (Tower metric plan, soft): failing
- `gateState: 'partial'`

**Entry condition**: Variant D (pre-gate, all hard criteria passing, Tower metric plan soft gate failing)

**Expected Nexus opening**: Reports gate status (5 of 5 hard passing, 5 of 6 soft passing). Flags Tower metric plan as the outstanding soft criterion. Surface the "strongly recommended before promoting" note. References that Atlas cannot function at handoff without it.

**Expected chips**: `ws-chip-p4-review-gate` (position 1), `ws-chip-p4-define-tower-metrics` (position 2 — Tower metric still missing)

**Expected Nexus NOT to do**:
- Must not say the gate is fully clear (Tower metric plan gate item is failing)
- Must not allow gate promotion without at minimum flagging the Tower metric gap

**Test assertion**: `response.text` names `tower_metric_plan_drafted` as failing AND recommends defining Tower metrics before promoting AND hard gate status is reported as all 5 passing.

---

#### FX-W4-4 — Value claim without P2 baseline anchor

**Setup state:**
- `current_phase: 4`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p4-businesscase-panel-status: 'in-progress'`
- Business case draft contains: "$4.2M in cost savings over 3 years" with NO reference to `FIN-BASE-P2`
- `FIN-BASE-P2.aht_cost_baseline`: "$6.1M annually in agent labor cost attributable to excess handle time"

**Entry condition**: Variant C (mid-P4, Tower metric plan drafted, business case in-progress with a data quality issue)

**Expected Nexus opening**: When business case is reviewed, AH-P4-5 fires. Nexus flags the $4.2M claim lacks the P2 baseline anchor. Asks for the mechanism: which cost category in FIN-BASE-P2 does this savings trace to?

**Expected chips**: `ws-chip-p4-build-biz-case` (position 1), `ws-chip-p4-upload-rate-card`

**Expected Nexus NOT to do**:
- Must not accept "$4.2M" as a valid value claim without the P2 baseline anchor (violates AH-P4-5 / ER-P4-2). Required: "Value claims in P4 must anchor to the P2 baseline."
- Must not present the figure as validated

**Test assertion**: When value claim is surfaced, `response.text` asks for the `FIN-BASE-P2` baseline anchor AND does NOT present "$4.2M" as a confirmed savings figure.

---

#### FX-W4-5 — Gate review blocked: Tower metric plan absent

**Setup state:**
- `current_phase: 4`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p4-roadmap-panel-status: 'complete'`
- `ws-canvas-p4-businesscase-panel-status: 'approved'`
- `ws-canvas-p4-towermetric-panel-status: 'not-started'`
- User's last message: "Let's close the P4 gate — the sponsor is ready to sign."

**Entry condition**: Variant D attempted but blocked by AH-P4-4

**Expected Nexus opening**: AH-P4-4 fires before any gate criteria are evaluated. Nexus does not evaluate the gate. Instead, opens the Tower metric plan conversation.

**Expected chips**: `ws-chip-p4-define-tower-metrics` (position 1 — gate entry blocked), `ws-chip-p4-review-gate` hidden until Tower metric plan exists

**Expected Nexus NOT to do**:
- Must not evaluate ANY gate criteria before `TOWER-METRICS-P4` exists (violates AH-P4-4 / ER-P4-6)
- Must not say "almost ready" or describe the gate as close to passing

**Test assertion**: `response.text` blocks gate review AND surfaces Tower metric plan conversation AND no gate criteria evaluation results are present in the response.

---

## P5 — Mobilize & Handoff canvas fixtures

#### FX-W5-1 — Fresh P5 entry: Tower metric plan confirmed present

**Setup state:**
- `current_phase: 5`
- `engagements.program_title: "Contact Center AI"`
- P4 gate: all 5 hard criteria met; business case approved by Sarah Chen
- `tower_metric_plan_drafted`: artifact `TOWER-METRICS-P4` exists (2 metrics defined: AHT and FCR)
- `ws-canvas-p5-raci-panel-status: 'not-started'`
- `ws-canvas-p5-tower-acceptance-status: 'not-submitted'`

**Entry condition**: Variant A (just promoted from P4; fresh P5 entry)

**Expected Nexus opening**: References P4 gate passed. States P5 ends with **named Tower acceptance** (not package delivery). States the Tower metric plan is confirmed present (EC-P5-3 check passes). Asks to start with delivery team confirmation per the P4 roadmap workstreams.

**Expected chips**: `ws-chip-p5-confirm-team` (position 1), `ws-chip-p5-assemble-package`

**Expected Nexus NOT to do**:
- Must not assert the program is complete or handed off (P5 work has not started)
- Must not skip the "named acceptance, not package delivery" framing (this inoculates against the R7 failure mode)

**Test assertion**: `response.text` contains "named Tower acceptance" (not "package delivery") AND Tower metric plan is confirmed present AND chip `ws-chip-p5-confirm-team` is in position 1.

---

#### FX-W5-2 — Mid-P5: Tower acknowledgment (not acceptance)

**Setup state:**
- `current_phase: 5`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p5-raci-panel-status: 'complete'`
- `ws-canvas-p5-handoffpack-panel-status: 'ready'` (all 5 artifact groups present)
- `ws-canvas-p5-tower-acceptance-status: 'acknowledged'` (Tower replied "received, we'll review" — not explicit acceptance)
- User's last message: "Tower got the package and confirmed receipt — we're done, right?"

**Entry condition**: Variant C (handoff package ready, acceptance status `acknowledged`)

**Expected Nexus opening**: Explicitly surfaces the R7 distinction. States "acknowledged" ≠ accepted. The gate-out action is disabled. Asks for the named Tower representative and their explicit statement.

**Expected chips**: `ws-chip-p5-record-acceptance` (position 1 — R7 trigger), `ws-chip-p5-review-gate`

**Expected Nexus NOT to do**:
- Must not say "we're done" or allow the gate to close (violates AH-P5-1 / ER-P5-3). Required: "Tower receiving the package is not the same as Tower accepting it."
- Must not conflate "acknowledged" with "accepted" (violates ER-P5-4)

**Test assertion**: `response.text` contains the phrase "not the same as" (or equivalent acknowledgment≠acceptance language) AND the gate is described as not yet closeable AND chip `ws-chip-p5-record-acceptance` is in position 1.

---

#### FX-W5-3 — Tower acceptance recorded: move transitions to read-only

**Setup state:**
- `current_phase: 5`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p5-tower-acceptance-status: 'accepted'`
- `ACCEPTANCE-P5.acceptor_name: "Marcus Webb"`
- `ACCEPTANCE-P5.acceptor_role: "Tower Operations Lead"`
- `ACCEPTANCE-P5.confirmation_date: "2026-05-05"`
- `ACCEPTANCE-P5.explicit_statement: "Marcus Webb confirmed the handoff package has been reviewed and is executable as specified — 2026-05-05 handoff session"`
- `engagements.status: 'handed_off'`

**Entry condition**: Variant D (Tower acceptance recorded; move is in `handed_off` state)

**Expected Nexus opening**: Confirms the move has been handed off. Names the acceptor (Marcus Webb, Tower Operations Lead, 2026-05-05). States workspace is read-only. References Atlas is now active. All phases available for review only.

**Expected chips**: All chips hidden (view mode is `handed-off`; chat lane disabled)

**Expected Nexus NOT to do**:
- Must not suggest any new actions or artifact changes (workspace is read-only)
- Must not re-evaluate any gate criteria

**Test assertion**: `response.text` names Marcus Webb as acceptor AND date is 2026-05-05 AND no action chips are rendered AND workspace is described as read-only.

---

#### FX-W5-4 — Self-approval attempt: package assembler tries to record Tower acceptance

**Setup state:**
- `current_phase: 5`
- `engagements.program_title: "Contact Center AI"`
- `ws-canvas-p5-handoffpack-panel-status: 'ready'`
- `ws-canvas-p5-tower-acceptance-status: 'submitted'`
- User attempting to click `ws-canvas-p5-tower-acceptance-accept-btn`
- `session.current_user_id`: same as `HANDOFF-PKG-P5.assembled_by_user_id` (same person)

**Entry condition**: Variant C (acceptance pending), AH-P5-2 trigger (self-approval attempt)

**Expected Nexus opening**: AH-P5-2 fires. Nexus blocks the acceptance recording. States that Tower acceptance must come from the receiving party — not the assembler.

**Expected chips**: `ws-chip-p5-record-acceptance` (position 1 — but with block context)

**Expected Nexus NOT to do**:
- Must not permit the same individual who assembled the package to confirm Tower acceptance (violates AH-P5-2 / ER-P5-3). Required: "Tower acceptance must come from the receiving party — someone from the delivery team or Tower who is accepting the package, not the person who assembled it."
- Must not allow the gate to close

**Test assertion**: `response.text` blocks the acceptance action AND names the self-approval restriction (assembler ≠ acceptor) AND asks for the Tower-side receiver's name.

---

#### FX-W5-5 — Handed-off read-only: user navigates to past-phase P2 from P5 workspace

**Setup state:**
- `current_phase: 5` (but `engagements.status = 'handed_off'`)
- `engagements.program_title: "Contact Center AI"`
- All phases complete; Tower acceptance recorded
- User clicks `ws-rail-phase-node-p2` from the handed-off workspace (past-view navigation)
- `viewMode` transitions to `past` for P2

**Entry condition**: This fixture tests past-view from `handed-off` state; covered by `02-state.md Row 5` and `W-5.4`

**Expected Nexus opening**: Nexus loads P2 historical context. Reports what happened in P2: baseline captured (AHT 9.2 min, CRM system), root causes identified, continue decision made. Read-only replay. Does NOT re-evaluate P2 gate or suggest changes.

**Expected chips**: All chips hidden (`past` view mode; chat lane read-only per `02-state.md`)

**Expected Nexus NOT to do**:
- Must not suggest modifying P2 artifacts (this is past-view in a handed-off program)
- Must not re-evaluate or re-recommend the P2 continue/discontinue decision (R5 history reporting only — not re-recommendation per W-5.1 §4)

**Test assertion**: `response.text` describes P2 as a completed phase with historical summary AND no edit actions or chip actions are rendered AND Nexus does NOT re-recommend discontinuation.

---

## Fixture coverage summary

| Phase | FX ID | Scenario | Primary rule tested |
|---|---|---|---|
| P0 | FX-W0-1 | Empty state | R3 (no fabrication), ER-P0-1 |
| P0 | FX-W0-2 | Mid-work, ACL empty | AH-P0-1, ER-P0-1 |
| P0 | FX-W0-3 | Pre-gate, all criteria met | UNVALIDATED_HYPOTHESIS survives |
| P0 | FX-W0-4 | Low-confidence archetype | AH-P0-2, ER-P0-2 |
| P0 | FX-W0-5 | Value magnitude challenged | AH-P0-3, ER-P0-3 |
| P1 | FX-W1-1 | Candidate ≠ committed | AH-P1-1, ER-P1-1 |
| P1 | FX-W1-2 | Mid-charter, stakeholder mapping | AH-P1-3, ER-P1-3 |
| P1 | FX-W1-3 | Pre-gate, sign-off pending | Charter readiness, sponsor signoff state |
| P1 | FX-W1-4 | Point estimate at P1 | AH-P1-2, ER-P1-2 |
| P1 | FX-W1-5 | Stakeholder map, no decision rights | AH-P1-4, ER-P1-4 |
| P2 | FX-W2-1 | Fresh P2 entry | R3 (baseline not fabricated), ER-P2-1 |
| P2 | FX-W2-2 | Interview-only data | AH-P2-1, ER-P2-1 |
| P2 | FX-W2-3 | Discontinue risk (R5) | AH-P2-3, ER-P2-4 |
| P2 | FX-W2-4 | Continue recommendation | Gate readiness, sponsor review |
| P2 | FX-W2-5 | Symptom as root cause | AH-P2-4, ER-P2-3 |
| P3 | FX-W3-1 | Tool-first on first message | R6 (AH-P3-2), ER-P3-3 |
| P3 | FX-W3-2 | Mid-design, untrace gap | AH-P3-3, ER-P3-6 |
| P3 | FX-W3-3 | Pre-gate, design signed | Gate readiness, soft gate gap |
| P3 | FX-W3-4 | Premature gate promotion | AH-P3-3, ER-P3-6 |
| P3 | FX-W3-5 | Fabricated role changes | AH-P3-4, ER-P3-2 |
| P4 | FX-W4-1 | Fresh P4, Tower metric plan authority | T-P4 authority, AH-P4-3, ER-P4-6 |
| P4 | FX-W4-2 | Mid-P4, Variant B tower metrics | AH-P4-3, ER-P4-6 |
| P4 | FX-W4-3 | Pre-gate, soft gate gap | Tower metric soft gate, AH-P4-3 |
| P4 | FX-W4-4 | Value claim without baseline anchor | AH-P4-5, ER-P4-2 |
| P4 | FX-W4-5 | Gate review blocked (no TMP) | AH-P4-4, ER-P4-6 |
| P5 | FX-W5-1 | Fresh P5, TMP confirmed | Variant A mission framing, R7 |
| P5 | FX-W5-2 | Acknowledgment ≠ acceptance | R7 (AH-P5-1), ER-P5-3, ER-P5-4 |
| P5 | FX-W5-3 | Acceptance recorded, read-only | Variant D, handed-off state |
| P5 | FX-W5-4 | Self-approval blocked | AH-P5-2, ER-P5-3 |
| P5 | FX-W5-5 | Past-view from handed-off | Past-view rules, R5 history-only |

**Total fixtures: 30 (5 per phase)**

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with W-5.8, date 2026-05-05, and correct dependencies | PASS |
| 30 total fixtures defined — exactly 5 per phase | PASS |
| All fixtures reference the Apex Retail Contact Center AI program for concrete values | PASS |
| P0 coverage: empty state (FX-W0-1), mid-work (FX-W0-2), pre-gate (FX-W0-3), low-confidence archetype (FX-W0-4), value magnitude challenge (FX-W0-5) | PASS |
| P1 coverage: fresh entry + candidate≠committed (FX-W1-1), mid-charter (FX-W1-2), pre-gate (FX-W1-3), point estimate (FX-W1-4), decision rights gap (FX-W1-5) | PASS |
| P2 coverage: fresh entry (FX-W2-1), weak evidence (FX-W2-2), discontinue risk (FX-W2-3), continue recommendation (FX-W2-4), symptom as root cause (FX-W2-5) | PASS |
| P3 coverage: tool-first on first message (FX-W3-1), mid-design untrace (FX-W3-2), pre-gate (FX-W3-3), premature promote (FX-W3-4), fabricated roles (FX-W3-5) | PASS |
| P4 coverage: fresh entry Tower metrics authority (FX-W4-1), mid-P4 Variant B (FX-W4-2), pre-gate soft gap (FX-W4-3), value without baseline (FX-W4-4), gate blocked (FX-W4-5) | PASS |
| P5 coverage: fresh entry (FX-W5-1), acknowledgment state (FX-W5-2), acceptance recorded (FX-W5-3), self-approval blocked (FX-W5-4), handed-off read-only (FX-W5-5) | PASS |
| Each fixture has: setup state, entry condition, expected opening (paraphrase), expected chips, prohibited behaviors, test assertion | PASS |
| AH rule violations reference exact rule IDs from T-P{N} Field 21 | PASS |
| Evidence rule violations reference exact rule IDs from `05-evidence-rules.md` | PASS |
| FX-W2-3 uses Variant D and direct form per AH-P2-3 | PASS |
| FX-W4-1 and FX-W4-2 enforce Tower Metric Plan Authority per T-P4 | PASS |
| FX-W5-2 and FX-W5-4 enforce Handoff-not-Acknowledgment Authority per R7 / T-P5 | PASS |
| FX-W5-3 tests Variant D (handed-off) state with acceptor record present | PASS |
| FX-W5-5 tests past-view from handed-off state — Nexus reports history, does not re-recommend | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 30 fixtures (5 per phase P0–P5), all concrete with Apex Retail Contact Center AI program values, AH rule and ER cross-references | Claude Code |
