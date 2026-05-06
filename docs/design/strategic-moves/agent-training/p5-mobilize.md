# P5 Mobilize & Handoff — Nexus Agent Training Pack

| Field | Value |
|---|---|
| **Work Package** | T-P5 |
| **Doc ID** | `AGENT_TRAINING_P5_MOBILIZE` |
| **Date** | 2026-05-05 |
| **Status** | Draft — ready for Anand review |
| **Schema version** | 21-field config schema (§4.3 of WBS) |
| **Depends on** | `00-cross-phase-capabilities.md`, `00-global-behavioral-rules.md`, `PHASE_MODEL_V2_DOCTRINE.md`, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Serialized config** | TypeScript block at end of document |

---

## HANDOFF-NOT-ACKNOWLEDGMENT AUTHORITY

**This section is first-class, not a footnote.**

P5's primary authority rule: "noted" or "received" by the Tower team is **not acceptance**. Nexus must distinguish explicit acceptance — a named individual confirming readiness — from passive acknowledgment (attendance, silence, general approval).

This is the most consequential distinction in P5. A move that is acknowledged but not truly accepted arrives in Tower with an execution team that is not committed. That is a program mortality event. P5 exists to prevent it.

### What counts as explicit acceptance

- Named delivery owner confirms **in writing or in a recorded session** that they have reviewed the handoff package and accept it
- Named Tower receiver explicitly states the move is **executable as handed off**
- The P5 gate record includes: **name, role, confirmation date, and explicit statement**

### What does NOT count as acceptance

| Claim | Why it fails |
|---|---|
| "Tower team was sent the handoff package" | Sending ≠ accepting |
| "Tower team was in the room for the handoff session" | Attendance ≠ acceptance |
| "We've heard no objections from Tower" | Silence ≠ acceptance |
| "The sponsor said it looks good" | General approval ≠ named Tower acceptance |
| "The handoff was acknowledged" | Acknowledgment ≠ acceptance |

### Required pattern

> "[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified."

### Prohibited pattern

> "The handoff was acknowledged."

### Gate block

If the team attempts to mark `tower_acceptance_confirmed` before a named explicit statement exists, Nexus must respond:

> "Tower acceptance requires a named individual to confirm the package is executable. Who has confirmed, and what exactly did they say?"

This block cannot be bypassed by the team's characterization of the exchange. Nexus requires the literal statement or a direct quotation from the confirmation session.

### Additional constraint: no self-approval of tower_acceptance_confirmed

The person who assembled the handoff package cannot be the same person who confirms Tower acceptance. The acceptance must come from the **receiving party** — a delivery team member or Tower-side stakeholder who is accepting the package, not the person who built it. If the same user attempts to mark both `handoff_package_complete` and `tower_acceptance_confirmed`, Nexus blocks:

> "Tower acceptance must come from the receiving party — someone from the delivery team or Tower who is accepting the package, not the person who assembled it. Who on the Tower side has reviewed and accepted?"

---

## Field 1 — `phase_id`

`5`

---

## Field 2 — `phase_name`

`P5 Mobilize & Handoff`

---

## Field 3 — `phase_intent`

Prepare the delivery team and hand off to Tower. P5 answers one question: **Is the execution team truly ready?**

P5 is not a project kickoff. It does not design the program, define the metrics, or build the business case — all of that was locked in P0 through P4. P5 produces a complete handoff package, confirms delivery team readiness against every workstream from the P4 roadmap, and requires explicit named acceptance from Tower before the move transitions.

P5 ends with `engagements.status = 'handed_off'` and Atlas agent activation. It does not end with a meeting where everyone nodded.

The move is not handed off until a named delivery owner says the package is executable. That is the entire mission of P5.

---

## Field 4 — `entry_criteria`

P5 requires all three hard criteria. Nexus blocks P5 entry if any is missing.

| # | Criterion | Type | Notes |
|---|---|---|---|
| EC-P5-1 | P4 gate passed — `CONTINUE_TO_P5` verdict exists in `GATE-P4` | Hard | The P4 gate recommendation must be `CONTINUE_TO_P5`. A `DISCONTINUE` verdict closes the Move. If no P4 gate record exists, Nexus blocks P5 entry and asks which P4 artifacts are outstanding. |
| EC-P5-2 | Approved business case exists — sponsor-signed `business_case_approved` artifact with named sponsor (name, date, artifacts reviewed) | Hard | P5 team assembly and handoff package are grounded in the approved business case scope. Without sponsor sign-off, P5 has no authorized scope boundary. Nexus does not facilitate handoff for an unauthorized program. |
| EC-P5-3 | Tower metric plan locked — `tower_metric_plan_drafted` artifact exists from P4.3 with measurable signals, data sources, baselines, targets, and timelines | Hard | The Tower metric plan was defined and locked in P4. P5 operationalizes it. If `tower_metric_plan_drafted` is absent at P5 entry, this is a P4 gap — Nexus flags: "The Tower metric plan is missing. This should have been completed in P4. We cannot proceed with P5 handoff package assembly without it. Can you provide the Tower metric plan from P4, or do we need to return to P4 to complete it?" |
| EC-P5-4 | Sponsor confirmed continuation as part of P4 gate verdict | Soft | Sponsor who signed the business case in P4 should be engaged at P5 opening for sponsor farewell and lessons-learned participation. If sponsor has changed, Nexus flags as a transition risk and asks for a handoff confirmation. |

If EC-P5-1 through EC-P5-3 are not all met, Nexus states: "P5 requires a completed P4 gate, a sponsor-approved business case, and a locked Tower metric plan. Which of these is missing?"

---

## Field 5 — `workflow_steps`

Five steps. Each is expanded in the WorkflowStep inner schema below.

| Step ID | Name | Goal |
|---|---|---|
| P5.1 | Team assembly & RACI confirmation | Named lead per workstream; RACI finalized with confirmed availability |
| P5.2 | Handoff package assembly | Assemble all phase artifacts into Tower-formatted handoff package |
| P5.3 | Readiness verification | Confirm data access, tooling, change management, no open blockers |
| P5.4 | Explicit Tower acceptance (R7) | Named delivery owner explicitly accepts; R7 enforced; no self-approval |
| P5.5 | Gate-out & handoff | All 4 hard criteria met; status = `handed_off`; Atlas activated |

---

### WorkflowStep P5.1 — Team assembly & RACI confirmation

**step_id:** `P5.1`

**step_name:** Team assembly & RACI confirmation

**step_goal:** Every workstream from the P4 roadmap (`ROADMAP-P4`) must have a named delivery lead confirmed for P5 execution. RACI is finalized with confirmed availability — not theoretical capacity. Nexus cross-checks each workstream against the delivery team roster and flags any workstream without a named lead as an unresolved gap. A workstream with a role title but no named individual does not count as assembled.

**required_user_inputs:**
- `ROADMAP-P4` — the complete list of workstreams (source of all team assembly requirements)
- Named individual confirmed as lead per workstream — not role titles, not department names
- Availability confirmation for each named lead (full-time, part-time, or defined FTE commitment)
- Any changes to RACI since P4 was approved (people changes, role changes, org changes)

**accepted_uploads:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx — org charts, team rosters, staffing plans)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx — RACI grids, capacity matrices)
- `text/plain`, `text/markdown`

**patterns_to_load:**
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P5 team assembly subset)
- `seed-patterns-delivery.ts` (RACI finalization, delivery team confirmation patterns)

**questions_to_ask:**
1. "Let's go through every workstream from the P4 roadmap. For [Workstream]: who is the named delivery lead — the individual who will be accountable for this workstream through execution?"
2. "For [Named Lead]: what is their confirmed availability — full-time, half-time, or defined percentage? Availability must be confirmed, not assumed."
3. "Are there any workstreams from the P4 roadmap that don't have a named lead yet? Those are team assembly gaps — let's close them before we proceed to handoff package assembly."
4. "Have there been any changes to the RACI since P4 was approved — people who have left, roles that have changed, new workstreams added? Any changes must be documented here."
5. "For the Accountable role per workstream: is it still the same individual named in the P4 RACI, or has that changed? If it's changed, we need the new name and confirmation."
6. "Is there any workstream where the confirmed availability is below what the P4 roadmap assumed? That's a delivery risk that must be surfaced now — not discovered after handoff."
7. "Who is the named delivery program manager — the single point of contact Tower can escalate to after handoff day?"

**artifact_sections_to_update:**
- `TEAM-P5` — delivery team roster: per workstream, named lead, confirmed availability, RACI (Responsible/Accountable/Consulted/Informed)
- `TEAM-P5.gaps` — any workstream without a named lead, with resolution plan and target date
- `TEAM-P5.changes_from_p4` — any RACI changes from the P4-approved RACI, with rationale and impact assessment

**evidence_to_capture:**
- Per workstream: named lead (individual, not role), confirmed availability (FTE %, full/part-time), RACI roles populated with named individuals
- Delivery program manager: named individual, contact, escalation role
- RACI changes from P4: old assignment, new assignment, reason, impact on delivery timeline
- Availability gaps: workstream, gap description, resolution action and owner

**quality_checks:**
- AH-P5-3 enforced: cannot confirm team assembly without named individuals per workstream. If a workstream has no named lead, Nexus flags it as a P5.1 gap.
- Every workstream in `ROADMAP-P4` must appear in `TEAM-P5`. No workstreams may be dropped without sponsor-approved scope change.
- Availability confirmed means the individual has been notified and has confirmed. Nexus asks: "Has [Named Lead] been informed they are the lead for this workstream and confirmed they are available?"
- Workstreams with availability below P4 assumption must be flagged with `AVAILABILITY_RISK: HIGH/MEDIUM/LOW` and a mitigation plan.

**completion_criteria:**
- `delivery_team_assembled = true` — all workstreams from `ROADMAP-P4` have a named lead with confirmed availability
- `raci_finalized = true` — R and A populated with named individuals per workstream
- `delivery_pm_named = true` — single point of contact for Tower post-handoff is named
- `team_gaps_resolved = true` — all P5.1 gaps either resolved (named lead confirmed) or sponsor-acknowledged with risk notation

---

### WorkflowStep P5.2 — Handoff package assembly

**step_id:** `P5.2`

**step_name:** Handoff package assembly

**step_goal:** Assemble all phase artifacts from P0 through P4 into the Tower-formatted handoff package. The handoff package is not a summary — it is the complete record that Atlas and the Tower team will work from post-handoff. It must contain every artifact required for Atlas agent activation and must be formatted for Atlas consumption per the P4.3 handoff package specification (`HANDOFF-PKG-P4`).

**required_user_inputs:**
- All phase artifacts confirmed present:
  - P0: Move brief (`BRIEF-P0`)
  - P1: Program charter (`CHARTER-P1`)
  - P2: Financial baseline and diagnostic report (`FIN-BASE-P2`, `DIAG-P2`)
  - P3: Signed design artifact (`DESIGN-P3`)
  - P4: Execution roadmap, business case, Tower metric plan, success criteria, handoff package spec (`ROADMAP-P4`, `BIZ-CASE-P4`, `TOWER-METRICS-P4`, `SUCCESS-CRITERIA-P4`, `HANDOFF-PKG-P4`)
- P5.1 complete: `TEAM-P5` roster with named leads
- Tower metric plan from P4.3 locked and verified accessible
- Risk register from prior phases (P2 risks, P4 delivery risks) for handoff

**accepted_uploads:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `text/plain`, `text/markdown`

**patterns_to_load:**
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P5 handoff package assembly subset)
- `seed-patterns-tower-handoff.ts` (Atlas handoff package patterns — format, data quality, signal expectations)

**questions_to_ask:**
1. "Let's verify all phase artifacts are present before we assemble the handoff package. Starting with P0: is the Move brief (`BRIEF-P0`) in the system with the original bet hypothesis and strategic framing?"
2. "P1 charter: is `CHARTER-P1` present with sponsor name, scope, bet hypothesis confirmation, and gate authorization? This is the governing document the delivery team will reference."
3. "P2 baseline and diagnostic: are `FIN-BASE-P2` and `DIAG-P2` present? The Tower metric plan depends on these baselines — if they're missing from the package, Atlas cannot measure improvement."
4. "P3 design: is `DESIGN-P3` present with sponsor sign-off — named individual, date, and design elements listed? The delivery team builds from this document."
5. "P4 artifacts: are all six P4 artifacts present — roadmap, business case, Tower metric plan, success criteria, handoff package spec, and change plan? The handoff package is incomplete if any of these is missing."
6. "Is the risk register current? P2 identified diagnostic risks; P4 identified delivery risks. Both sets need to be consolidated and handed off so Tower is not discovering risks on day one."
7. "Are there any open decisions from prior phases that were deferred to execution? Those need to be documented in the handoff package with a named decision owner and target resolution date — not handed off as undocumented assumptions."

**artifact_sections_to_update:**
- `HANDOFF-PKG-P5` — complete Tower handoff package: all phase artifacts verified present, Atlas-formatted, artifact index with version and verification date
- `HANDOFF-PKG-P5.artifact_index` — per artifact: code, version, verification date, verification method (Nexus-verified structure vs. human-confirmed content)
- `HANDOFF-PKG-P5.risk_register` — consolidated risk register from P2 and P4 delivery risks: risk description, likelihood, impact, current mitigation status, handoff owner
- `HANDOFF-PKG-P5.open_decisions` — any decisions deferred from prior phases: decision description, context, options, decision owner, target resolution date
- `HANDOFF-PKG-P5.atlas_activation` — what Atlas receives on activation: metric list, data format, quality standards, day-1 vs. pipeline-dependent classification (per `HANDOFF-PKG-P4`)

**evidence_to_capture:**
- Per artifact: presence confirmed, version, verification method, any gaps noted
- Risk register: each risk from P2 and P4 carried forward with updated status, mitigation, and owner at handoff
- Open decisions: description, history, options, who must decide, when
- Atlas activation: metrics available day-1, metrics requiring pipeline setup (named dependency, timeline, interim proxy)

**quality_checks:**
- AH-P5-2 enforced: all five phase artifact groups (P0 through P4) must be verified present before `handoff_package_complete` is marked. If any artifact is missing, Nexus blocks: "The handoff package is missing [artifact]. Completing P5 without it means Tower/Atlas will have an incomplete picture."
- Nexus verifies presence and structure for each artifact. Content verification (e.g., confirming the business case numbers are correct) is the program lead's responsibility — Nexus confirms structure, not truth.
- Open decisions must be documented — cannot be implied by a "no open decisions" assertion without Nexus checking. Nexus asks explicitly: "Were there any decisions that were deferred from P3 or P4 design sessions? Even small open items must be documented."
- Risk register consolidation is mandatory. Nexus does not allow the handoff package to be marked complete without a consolidated risk register.

**completion_criteria:**
- `handoff_package_complete = true` — all 5 phase artifact groups verified present; artifact index complete
- `risk_register_present = true` — consolidated P2 + P4 risks documented with current status and owner
- `open_decisions_documented = true` — all deferred decisions listed with owner and target date (or confirmed none exist)
- `atlas_activation_ready = true` — Atlas activation section complete: day-1 metrics, pipeline-dependent metrics with dependencies named

---

### WorkflowStep P5.3 — Readiness verification

**step_id:** `P5.3`

**step_name:** Readiness verification

**step_goal:** Verify that the execution environment is ready for Tower-day-one operation. This is not a checklist to be signed by the same people who assembled the package — it is a verification of actual conditions. Three domains must be confirmed: (1) **data access** — the signals the Tower metric plan depends on are accessible in the named systems; (2) **tooling** — environments are provisioned and delivery team access is confirmed; (3) **change management** — the communication plan is live, training is scheduled, and no critical change management activities are blocked.

**required_user_inputs:**
- `TOWER-METRICS-P4` — Tower metric plan with named data sources (readiness verification confirms these are accessible)
- `CHANGE-PLAN-P4` — change management plan (readiness verification confirms activities are underway or scheduled)
- Tooling environment status: provisioned, access confirmed for named delivery leads
- Any open blockers that would prevent Tower-day-one execution

**accepted_uploads:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (environment readiness docs, change management status reports)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (readiness checklists, environment access logs)
- `text/plain`, `text/markdown`

**patterns_to_load:**
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P5 readiness verification subset)
- `seed-patterns-delivery.ts` (execution readiness patterns — environment, access, change management confirmation)

**questions_to_ask:**
1. "For each Tower metric in `TOWER-METRICS-P4`: is the data source accessible today — can the named system be queried, and is Atlas's access provisioned? Or is this still pending?"
2. "Are there any Tower metrics where the data pipeline is not yet established? Those were classified as 'pipeline-dependent' in P4.3 — what is the current status and expected availability date?"
3. "Are the execution environments provisioned? For each named workstream that requires a technical environment: has the environment been stood up, and do the named delivery leads have access?"
4. "Is the communication plan from `CHANGE-PLAN-P4` live? Has the affected population been notified that the program is moving to execution?"
5. "Is training scheduled for affected roles? Per the change plan, training was planned for [roles/timeline] — what is the current scheduling status?"
6. "Are there any open blockers to Tower-day-one execution? Not risks — actual blockers: things that, if unresolved, would prevent the delivery team from starting on handoff day."
7. "Has the change management owner confirmed that no critical change management activities are blocked or delayed beyond the planned timeline?"

**artifact_sections_to_update:**
- `READINESS-P5` — readiness checklist: data access, tooling, change management confirmation; status per item (CONFIRMED / PENDING / BLOCKED)
- `READINESS-P5.data_access` — per Tower metric: system accessible (yes/no), Atlas access provisioned (yes/no), status for pipeline-dependent metrics
- `READINESS-P5.tooling` — per workstream requiring environment: environment name, provisioning status, named lead access confirmed
- `READINESS-P5.change_management` — communication plan status, training scheduling status, change owner confirmation, any blocked activities
- `READINESS-P5.blockers` — any open blockers with description, impact on handoff date, resolution owner, target date

**evidence_to_capture:**
- Per Tower metric data source: system name, access confirmed by whom, date confirmed, Atlas access status
- Per tooling environment: environment name, provisioned date, access confirmed by named lead, confirmation date
- Change management status: communication plan live (yes/no, date), training scheduled (yes/no, dates, affected roles), change owner sign-off
- Open blockers: description, impact severity, resolution owner, target resolution date

**quality_checks:**
- Readiness verification is not a self-certification. If the program lead says "everything is ready," Nexus asks the verification questions anyway — confidence without evidence is not readiness.
- Pipeline-dependent Tower metrics (classified in P4.3) must have a status update: are they still pipeline-dependent, or have they been established? If still pending, is the dependency on track?
- Open blockers must be named specifically. "No blockers" is acceptable only after Nexus has asked explicitly about each readiness domain (data, tooling, change management).
- If any blocker is rated HIGH impact on handoff date, Nexus flags: "This blocker may prevent Tower-day-one execution. It must be resolved before `tower_acceptance_confirmed` can be recorded. Who owns this blocker, and what is the resolution path?"
- AH-P5-5 enforced: the Tower metric plan cannot be modified in P5. If a readiness gap reveals that a Tower metric's data source is not accessible, the resolution is to establish access — not to change the metric. Nexus redirects any attempt to modify the Tower metric plan to a P4 amendment process.

**completion_criteria:**
- `readiness_checklist_signed = true` — all three readiness domains confirmed: data access, tooling, change management
- `data_access_confirmed = true` — all day-1 Tower metrics have confirmed data access; pipeline-dependent metrics have a status update
- `tooling_ready = true` — all required environments provisioned, named delivery leads have access
- `change_management_underway = true` — communication plan live, training scheduled (or confirmed not required), change owner has confirmed
- `no_high_impact_blockers = true` — no open blockers rated HIGH impact on handoff date; all blockers have named owners and resolution plans

---

### WorkflowStep P5.4 — Explicit Tower acceptance (R7)

**step_id:** `P5.4`

**step_name:** Explicit Tower acceptance (R7)

**step_goal:** Obtain a named explicit acceptance of the handoff package from the Tower-side receiver. R7 (Handoff-not-acknowledgment rule) is the governing authority. The delivery team receiving the package must confirm in writing or in a recorded session that they have reviewed the complete handoff package and accept it as executable. Nexus requires a specific statement — not a general "looks good."

This step cannot be self-approved by the person who assembled the handoff package. The accepting party must be a delivery team member or Tower-side stakeholder who is **receiving** the package, not the team that built it.

**required_user_inputs:**
- Completed P5.2 handoff package (`HANDOFF-PKG-P5`)
- Completed P5.3 readiness checklist (`READINESS-P5`) — acceptance cannot be requested before readiness is confirmed
- Named Tower receiver: who will review and accept the handoff package?
- The explicit acceptance statement from the named receiver

**accepted_uploads:**
- `application/pdf` (written acceptance letters, signed readiness confirmations)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (acceptance documentation)
- `text/plain`, `text/markdown`

**patterns_to_load:**
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P5 Tower acceptance subset)
- `seed-patterns-tower-handoff.ts` (Atlas handoff acceptance patterns)

**questions_to_ask:**
1. "Who is the named Tower receiver — the individual who will review the handoff package and accept it on behalf of the execution team? I need a name and role."
2. "Has [Named Tower Receiver] reviewed the complete handoff package — all five phase artifact groups plus the P5 team roster and readiness checklist? Or only part of the package?"
3. "What did [Named Tower Receiver] say when they confirmed the package? I need the specific statement — the exact words confirming the move is executable as handed off."
4. "Did the confirmation happen in writing, in a recorded session, or verbally? Written or recorded is preferred — verbal confirmation must be captured in the session record now."
5. "Did [Named Tower Receiver] raise any conditions or qualifications to their acceptance — anything they said must be resolved before they consider it executable? If so, those conditions must be documented and closed."
6. "Is the confirming party different from the person who assembled the handoff package? If the same person is both assembling and accepting, Tower acceptance cannot be confirmed — we need someone from the receiving side."
7. "Are there multiple workstreams with separate Tower receivers? If so, each receiver must confirm individually — a single sign-off for a multi-receiver handoff is insufficient."

**artifact_sections_to_update:**
- `ACCEPTANCE-P5` — Tower acceptance record: named receiver(s), role(s), confirmation date(s), explicit statement(s), confirmation method (written / recorded / session-captured)
- `ACCEPTANCE-P5.conditions` — any conditions or qualifications attached to acceptance: description, resolution owner, target date, resolution status
- `GATE-P5.tower_acceptance_confirmed` — gate criterion evidence: name, role, date, statement; cannot be marked met without this record

**evidence_to_capture:**
- Named receiver: individual name (not role title), role, contact
- Explicit statement: verbatim or close paraphrase of the confirmation ("I have reviewed the handoff package and confirm the move is executable as specified")
- Confirmation method: written (document reference), recorded session (session ID/date), session-captured (Nexus session reference)
- Conditions: any qualifications, resolution owner, target date, resolution status
- Date: confirmation date per named receiver

**quality_checks:**
- R7 enforced (primary): every characterization of the exchange as "acceptance" must be verified against the R7 checklist. Nexus does not accept "they reviewed it and were fine with it" as evidence — it asks for the specific statement.
- AH-P5-1 enforced: `tower_acceptance_confirmed` cannot be marked met without a named individual + explicit statement. Prohibited: "the handoff was acknowledged." Required: "[Name, Role] confirmed on [date] that the handoff package has been reviewed and is executable as specified."
- AH-P5-6 enforced: the confirming party cannot be the same person who assembled the package.
- AH-P5-4 enforced: silence is not acceptance. If the team reports "we haven't heard any objections from Tower," Nexus responds: "Silence is not acceptance. Who has explicitly confirmed the package is executable? We need a positive confirmation statement, not the absence of objection."
- Conditions attached to acceptance must be documented and resolved before `tower_acceptance_confirmed` is marked met — a conditional acceptance is not acceptance.

**completion_criteria:**
- `tower_acceptance_confirmed = true` — named receiver, explicit statement, confirmation date, and confirmation method all recorded in `ACCEPTANCE-P5`
- `named_individual_not_assembler = true` — confirming party is distinct from the package assembler
- `conditions_resolved = true` — all conditions attached to acceptance are either resolved or documented as acceptable deferral (sponsor-acknowledged)
- `acceptance_method_documented = true` — confirmation method specified: written, recorded, or session-captured

---

### WorkflowStep P5.5 — Gate-out & handoff

**step_id:** `P5.5`

**step_name:** Gate-out & handoff

**step_goal:** Evaluate all 7 gate checks. All 4 hard criteria must be met. Set `engagements.status = 'handed_off'`. Activate the Atlas agent. Notify the sponsor. Capture lessons learned. The gate is binary — handed off or not. A move that has 3 of 4 hard criteria met is not "mostly ready." It is not ready.

**required_user_inputs:**
- All P5.1–P5.4 artifacts complete: `TEAM-P5`, `HANDOFF-PKG-P5`, `READINESS-P5`, `ACCEPTANCE-P5`
- Sponsor available for farewell acknowledgment and lessons-learned input
- Lessons-learned session notes (or willingness to complete now)
- Confirmation of Atlas activation readiness

**accepted_uploads:**
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (lessons-learned documents, sponsor farewell communications)

**patterns_to_load:**
- `program-lifecycle-patterns.ts` (`PAT-PRG-001` P5 gate evaluation and handoff subset)
- `seed-patterns-governance.ts` (lessons-learned patterns, handoff governance)

**questions_to_ask:**
1. "Let's go through all 7 gate criteria. Starting with the four hard criteria: are `delivery_team_assembled`, `handoff_package_complete`, `readiness_checklist_signed`, and `tower_acceptance_confirmed` all met with documentation?"
2. "For Tower acceptance: do we have the `ACCEPTANCE-P5` record with named receiver, explicit statement, and date? If not, we cannot proceed."
3. "Has the sponsor been informed that the move is completing P5 and transitioning to Tower? Sponsor farewell acknowledgment is a soft gate criterion — not required to close, but important for program continuity."
4. "Has a lessons-learned session been completed or scheduled? For moves of this scale, lessons learned should capture at least: what worked well, what we would do differently, and the top three insights for future programs."
5. "Is Atlas activation confirmed — has the Tower/Atlas product owner confirmed that Atlas is ready to receive the handoff package in the specified format?"
6. "Is the risk register from the handoff package confirmed transferred to Tower? The delivery team should not be discovering risks that were documented in P2 and P4."
7. "Is there anything that would cause the delivery team to come back to the program team after handoff day — open decisions, unresolved risks, dependencies that haven't been handed off? If yes, those must be documented before the gate closes."

**artifact_sections_to_update:**
- `GATE-P5` — P5 gate assessment: evaluation of all 7 gate criteria with status and evidence citation per criterion; gate verdict; Atlas activation record
- `GATE-P5.gate_verdict` — HANDED_OFF or NOT_READY with specific unmet criteria listed
- `GATE-P5.atlas_activation` — Atlas agent activation record: activation date, Tower receiver confirmed, handoff package format accepted
- `GATE-P5.sponsor_farewell` — sponsor farewell acknowledgment: named sponsor, date, format (session, email, recorded)
- `GATE-P5.lessons_learned` — lessons learned: what worked, what to do differently, top insights for future programs, named contributor(s)
- `GATE-P5.risk_register_transfer` — confirmation that consolidated risk register was transferred to Tower with acknowledgment

**evidence_to_capture:**
- Gate criterion status per criterion: PASS / FAIL / N/A with evidence citation
- Atlas activation: activation date, Tower receiver name, handoff package format accepted confirmation
- Sponsor farewell: named sponsor, date, format
- Lessons learned: minimum three insights per category (what worked, what to improve, top insights)
- Risk register transfer: delivery team acknowledgment of risk register receipt, date

**quality_checks:**
- Gate is binary: HANDED_OFF or NOT_READY. Nexus does not produce a "mostly ready" verdict. Unmet hard criteria must be resolved before the gate closes.
- R9 enforced: pilot allows self-approval by any authenticated user; production requires admin/maestro only (B-119 `GATE_APPROVAL_STRICT_MODE`). Exception: `tower_acceptance_confirmed` has an additional content requirement regardless of tier — the acceptance must come from the Tower-side receiver, not the assembler.
- Lessons learned must be captured before or concurrent with the gate-out — not deferred to a "post-handoff retrospective" that never happens.
- Atlas activation is confirmed by a named Tower/Atlas owner, not assumed from the handoff package delivery.

**completion_criteria:**
- `gate_assessment_completed = true` — all 7 criteria evaluated with evidence citations
- `all_4_hard_criteria_pass = true` — no exceptions; all four required with appropriate approvals
- `engagements_status_set_to_handed_off = true` — status field updated; audit log entry created
- `atlas_agent_activated = true` — Tower/Atlas product owner confirmed activation
- `sponsor_notified = true` — sponsor farewell acknowledgment recorded (soft criterion)
- `lessons_learned_captured = true` — minimum session completed or documented (soft criterion)

---

## Field 6 — `required_patterns`

These patterns MUST be loaded before Nexus provides guidance in P5. Resolved against `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md §6`.

| Pattern source | Scope | Rationale |
|---|---|---|
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`) | P5 team assembly, handoff package, readiness, acceptance, gate subsets | Primary source for P5 delivery team confirmation, handoff package structure, and P5 gate evaluation |
| `seed-patterns-delivery.ts` | RACI finalization, delivery team confirmation, execution readiness | Delivery readiness patterns — required for P5.1 team assembly and P5.3 readiness verification |
| `seed-patterns-tower-handoff.ts` | Atlas handoff package patterns — format, data quality, signal expectations, acceptance criteria | Required for P5.2 handoff package assembly and P5.4 Tower acceptance. The acceptance format Atlas expects must be followed exactly — mis-formatted handoff packages cause day-1 Atlas failures. |

---

## Field 7 — `optional_patterns`

Loaded on demand based on signal triggers.

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-governance.ts` | Lessons-learned session initiated, sponsor farewell mentioned, or audit log discussion | Governance patterns for lessons-learned structure, sponsor farewell format, and program closure governance |
| `seed-patterns-change-management.ts` | Change management readiness gap identified in P5.3, or change plan questions surface | Change management verification patterns — loaded when readiness domain gaps appear; not default-loaded since P4 already built the change plan |
| `seed-patterns-industry.ts` | Industry-specific readiness benchmarks requested for context | Industry context only — never for program-specific claims. Loaded if team asks "what does good readiness look like for a program of this type?" |
| `seed-patterns-ai-programs.ts` | AI-specific execution readiness checks surface (data pipeline readiness, model access, inference environment) | AI program delivery readiness patterns — loaded when AI-specific technical readiness questions arise in P5.3 |

---

## Field 8 — `required_artifacts`

Must be produced or updated before P5 gate.

| Artifact | Code | Description |
|---|---|---|
| Delivery Team Roster | `TEAM-P5` | Named leads per workstream with confirmed availability, RACI (R/A per workstream), delivery program manager named, changes from P4 RACI documented |
| Handoff Package | `HANDOFF-PKG-P5` | All five phase artifact groups verified present, artifact index with verification dates, consolidated risk register, open decisions, Atlas activation section |
| Readiness Checklist | `READINESS-P5` | Three-domain readiness confirmation: data access (per Tower metric), tooling (per workstream), change management (communication + training + change owner sign-off). Open blockers documented with owners and resolution dates |
| Tower Acceptance Record | `ACCEPTANCE-P5` | Named receiver(s), explicit statement(s), confirmation method, date(s), any conditions with resolution status |
| P5 Gate Assessment | `GATE-P5` | Evaluation of all 7 gate criteria with evidence citations; gate verdict (HANDED_OFF / NOT_READY); Atlas activation record; sponsor farewell record; lessons-learned record |

---

## Field 9 — `optional_artifacts`

Available but not required for gate.

| Artifact | Code | Description |
|---|---|---|
| Sponsor Farewell Communication | `FAREWELL-P5` | Formal sponsor farewell acknowledgment: program summary, team recognition, transition narrative, sponsor statement. For programs where sponsor communications have organizational visibility. |
| Lessons Learned Report | `LL-P5` | Structured lessons-learned output: what worked, what to improve, top insights, annotated artifact index for future programs to reference. For programs that want a referenceable lessons-learned record beyond the gate capture. |
| Atlas Activation Runbook | `ATLAS-RB-P5` | Step-by-step Atlas activation instructions: data source connections, metric configuration, alert thresholds, day-1 reporting setup. For programs where Atlas activation requires coordination across multiple technical teams. |
| Execution Bridge Document | `BRIDGE-P5` | P5 → Tower execution bridge: first-30-days plan, top 5 watch items, open risks in priority order, named escalation path. For programs where there is a material gap between handoff day and first Tower review. |

---

## Field 10 — `workshop_playbooks`

| Playbook | Format | Duration | When to invoke |
|---|---|---|---|
| Team Assembly Session | Program lead + delivery workstream leads + RACI stakeholders | 60–90 min | P5.1 — primary team confirmation session. Produces confirmed `TEAM-P5` roster. |
| Structure: (1) P4 roadmap workstream review — confirm each workstream is still in scope (10 min); (2) Named lead confirmation — for each workstream, confirm named lead and availability (30 min); (3) RACI finalization — R and A per workstream, confirm individuals, not roles (20 min); (4) Changes from P4 RACI documented (10 min). | | | |
| Output: Completed `TEAM-P5` roster with named leads, confirmed availability, RACI, and any P4 changes documented. | | | |
| Handoff Package Review | Program lead + delivery leads + Tower receiver | 90 min | P5.2 — artifact completeness review. Confirms all phase artifacts are present and Atlas activation section is complete. |
| Structure: (1) Artifact index walk-through — each of the 5 phase artifact groups verified present (30 min); (2) Risk register review — P2 and P4 risks consolidated and current status confirmed (20 min); (3) Open decisions review — any deferred items documented (15 min); (4) Atlas activation section review — day-1 vs. pipeline-dependent metrics confirmed (25 min). | | | |
| Output: Completed `HANDOFF-PKG-P5` with artifact index, risk register, open decisions, and Atlas activation section. | | | |
| Readiness Verification Session | Program lead + data/analytics owner + tooling lead + change management owner | 60 min | P5.3 — three-domain readiness confirmation. Verifies actual conditions, not self-certification. |
| Structure: (1) Data access domain — per Tower metric, data source accessibility and Atlas access confirmation (20 min); (2) Tooling domain — environment provisioning and named lead access (20 min); (3) Change management domain — communication plan status, training scheduling, change owner sign-off (20 min). | | | |
| Output: Completed `READINESS-P5` checklist with confirmed status per domain and any open blockers documented. | | | |
| Tower Acceptance Session | Program lead + Tower receiver + sponsor (optional) | 60 min | P5.4 — explicit handoff acceptance per R7. R7 authority governs this session. |
| Structure: (1) Handoff package walk-through — Tower receiver reviews key sections (20 min); (2) Readiness checklist review — Tower receiver confirms readiness domain confirmations are satisfactory (15 min); (3) Explicit acceptance statement — Tower receiver states the move is executable as handed off; statement captured verbatim (15 min); (4) Conditions or qualifications documented if any (10 min). | | | |
| Output: `ACCEPTANCE-P5` record with named receiver, explicit statement, date, and confirmation method. | | | |
| Gate Review and Handoff Session | Sponsor + program lead + Tower receiver + Atlas/Tower product owner | 45–60 min | P5.5 — final gate evaluation and handoff confirmation. |
| Structure: (1) Gate criteria walk-through — all 7 criteria with evidence citations (20 min); (2) Atlas activation confirmation (10 min); (3) Sponsor farewell acknowledgment (10 min); (4) Lessons learned — rapid capture of top insights (15 min). | | | |
| Output: Completed `GATE-P5` with verdict, Atlas activation record, sponsor farewell, and lessons learned. | | | |

---

## Field 11 — `meeting_templates`

| Template | Content |
|---|---|
| Team assembly session pre-read | P4 roadmap workstream list (all workstreams from `ROADMAP-P4`) + current RACI from P4 + personnel changes since P4 approval + availability constraints to discuss. Max 2 pages. |
| Handoff package review pre-read | Artifact index template (pre-populated with expected artifacts from P0–P4) + risk register from P4 delivery risks + open decisions log (from prior sessions) + Atlas activation spec from P4.3 `HANDOFF-PKG-P4`. Max 2 pages. |
| Readiness verification pre-read | Tower metric data source list (from `TOWER-METRICS-P4`) + tooling environment requirements (from P4.1 workstreams) + change management plan status (from `CHANGE-PLAN-P4`) + current known blockers. Max 1 page. |
| Tower acceptance session pre-read | Handoff package summary (one-page artifact index + key metrics + team roster) + readiness checklist summary + explicit acceptance requirement statement ("this session requires [Named Receiver] to confirm the move is executable as handed off"). Max 1 page. |
| Gate review and handoff pre-read | Seven gate criteria status table (pre-filled by program lead) + Tower acceptance record summary + Atlas activation status + lessons-learned prompts. Max 2 pages. |

---

## Field 12 — `agent_questions`

Canonical questions Nexus draws from across the P5 workflow. Not all are asked in every session.

1. "For [Workstream]: who is the named delivery lead — the individual accountable for this workstream through execution?" (P5.1)
2. "Has [Named Lead] confirmed they are available and have been informed they are the lead for this workstream?" (P5.1)
3. "Are there any workstreams from the P4 roadmap without a named lead? Those are team assembly gaps." (P5.1)
4. "Is `BRIEF-P0` present — the original Move brief with bet hypothesis?" (P5.2)
5. "Are all six P4 artifacts present — roadmap, business case, Tower metric plan, success criteria, handoff package spec, and change plan?" (P5.2)
6. "Is the risk register current and consolidated from P2 and P4 delivery risks?" (P5.2)
7. "For each Tower metric: is the data source accessible today? Has Atlas's access been provisioned?" (P5.3)
8. "Are there any open blockers to Tower-day-one execution — not risks, actual blockers?" (P5.3)
9. "Is the communication plan from the change plan live? Has the affected population been notified?" (P5.3)
10. "Who is the named Tower receiver — the individual who will accept the handoff on behalf of the execution team?" (P5.4)
11. "What did [Named Tower Receiver] say specifically when they confirmed the package? I need the exact statement." (P5.4)
12. "Is the confirming party different from the person who assembled the handoff package?" (P5.4)
13. "Have no objections been raised — or has an explicit positive confirmation been given? These are different things." (P5.4)
14. "Are all four hard gate criteria met with documentation — `delivery_team_assembled`, `handoff_package_complete`, `readiness_checklist_signed`, `tower_acceptance_confirmed`?" (P5.5)
15. "Has Atlas activation been confirmed by the Tower/Atlas product owner?" (P5.5)

---

## Field 13 — `coaching_rules`

| Rule ID | Trigger | Nexus behavior |
|---|---|---|
| CR-P5-1 | User says "everyone is confirmed" for team assembly without naming individuals | AH-P5-3 fires: "I need named individuals, not a general confirmation. Who is the lead for [Workstream]? A RACI with role titles instead of names cannot be verified at the P5 gate." |
| CR-P5-2 | User attempts to mark `handoff_package_complete` before all phase artifacts are verified | AH-P5-2 fires: "Before marking the package complete, let's verify all five artifact groups are present. Which P4 artifacts have we confirmed?" |
| CR-P5-3 | User characterizes the Tower exchange as "they acknowledged it" or "they received it" | R7 fires: "Acknowledged is not the same as accepted. Who explicitly confirmed the package is executable — what did they say?" |
| CR-P5-4 | User says "we haven't heard any objections from Tower" | AH-P5-4 fires: "Silence is not acceptance. Who has explicitly confirmed the package is executable? We need a positive statement, not an absence of objection." |
| CR-P5-5 | User attempts to mark `tower_acceptance_confirmed` before `readiness_checklist_signed` | Block: "Tower acceptance should come after the readiness checklist is complete — we need to confirm the execution environment is actually ready before Tower reviews and accepts. What's the status of the three readiness domains?" |
| CR-P5-6 | Same user who assembled the handoff package attempts to confirm Tower acceptance | AH-P5-6 fires: "Tower acceptance must come from the receiving party. Who on the Tower or delivery side has reviewed the package? It cannot be confirmed by the same person who assembled it." |
| CR-P5-7 | User asks to modify a Tower metric because a data source is inaccessible | AH-P5-5 fires: "The Tower metric plan was locked in P4. P5 is for operationalizing it — if a data source is inaccessible, the resolution is to establish access, not change the metric. Who owns the data access issue? Let's address it as a P5.3 readiness gap." |
| CR-P5-8 | Team attempts to close the P5 gate with unmet hard criteria | Block gate: "The P5 gate requires all four hard criteria. [Unmet criteria] must be resolved before the handoff can be authorized. Which of these can we close now?" |
| CR-P5-9 | User describes acceptance as "the sponsor approved the overall program" | R7 fires: "Sponsor approval of the program is different from Tower acceptance of the handoff package. The sponsor approved the business case in P4. P5 requires the named delivery team receiver to accept the handoff package as executable. Who is the Tower receiver?" |
| CR-P5-10 | User asks to "fast-track" readiness verification because "everyone knows it's ready" | "Readiness verification isn't a formality — it's confirmation that actual conditions match the plan. Assumptions about readiness discovered post-handoff become Tower's problem. Let's run through the three domains: data access, tooling, and change management. It takes 15 minutes and it's the last quality check before the gate." |

---

## Field 14 — `evidence_requirements`

| Claim type | Evidence required | Type | What counts as evidence |
|---|---|---|---|
| Team is assembled | Named lead per workstream in `TEAM-P5` with availability confirmed | Hard (AH-P5-3) | Named individual (not role title), availability commitment (FTE %), confirmation that individual has been informed and accepted. "IT team is assigned" is not evidence. |
| Handoff package is complete | All five artifact groups verified present in `HANDOFF-PKG-P5.artifact_index` | Hard (AH-P5-2) | Nexus-verified structure per artifact group. Program lead confirms content accuracy. Cannot be self-asserted without artifact-level check. |
| Readiness is confirmed | Three-domain readiness checklist in `READINESS-P5` with status per item | Hard | Per domain: named individual confirmed status, date of confirmation. "We're ready" without domain-level evidence is not a confirmed checklist. |
| Tower has accepted the handoff | Named receiver, explicit statement, date in `ACCEPTANCE-P5` | Hard (R7, AH-P5-1) | Verbatim or close-paraphrase of the acceptance statement. Confirmation method specified. Confirming party is not the package assembler. Cannot be inferred from absence of objection. |
| Atlas is activated | Tower/Atlas product owner confirmation in `GATE-P5.atlas_activation` | Hard (gate) | Named Tower/Atlas owner, activation date, format acceptance confirmed. Cannot be assumed from handoff package delivery. |
| Lessons learned captured | Minimum session captured in `GATE-P5.lessons_learned` with contributor(s) | Soft | Named contributor(s), date, at least 3 insights per category (what worked, what to improve). Cannot be deferred to post-handoff. |
| Sponsor farewell recorded | Named sponsor acknowledgment in `GATE-P5.sponsor_farewell` | Soft | Named sponsor, date, format (session / email / recorded). General awareness that the program is transitioning is not a farewell record. |
| Risk register handed off | Delivery team acknowledgment in `HANDOFF-PKG-P5.risk_register` | Soft | Named delivery team receiver acknowledged the risk register, date. Prevents discovery of known risks post-handoff. |

---

## Field 15 — `failure_modes_to_check`

**From 10-id catalog (`src/lib/programs/failure-modes.ts`):**

| ID | Failure mode | Why relevant at P5 |
|---|---|---|
| 1 | No executive sponsor | P5.5 gate requires sponsor farewell acknowledgment. A sponsor who has disengaged before P5 is a continuity risk — Nexus surfaces this if sponsor confirmation cannot be obtained and flags it as a handoff risk. |
| 5 | Commitment to operating-model change | P5.3 readiness verification confirms that change management activities are underway. A readiness check that shows "communication plan not yet live" at P5 is this failure mode in early expression. |
| 8 | ROI expectation mismatch | P5 does not define Tower metrics — but readiness verification confirms Atlas can measure them. If data access is not confirmed for the Tower metrics that define program success, the ROI measurement will be impossible. |

**From 12-key catalog (`src/lib/intelligence/ai-program-failure-modes.ts`):**

| Key | Why relevant at P5 |
|---|---|
| `no_measurement_plan` | P5.2 includes the Tower metric plan in the handoff package. If `TOWER-METRICS-P4` is missing at P5 entry, this failure mode is active — Nexus blocks P5 and surfaces the P4 gap. |
| `weak_workflow_integration` | P5.3 change management readiness check: if the communication plan is not live and training is not scheduled, the workflow changes designed in P3 are not being operationalized. This is weak workflow integration at the execution stage. |
| `no_operating_model_for_scale` | Team assembly (P5.1) confirms that workstream leads are in place for change management and adoption workstreams — not just technical delivery. If adoption workstreams have no named leads, this failure mode is predicted. |

**P5-specific failure modes:**

| FM ID | Name | Description | Check |
|---|---|---|---|
| FM-P5-1 | Passive handoff | Move transitions to Tower with "acknowledged" status rather than explicit named acceptance — delivery team is not actually committed | R7 Handoff-not-acknowledgment authority: block `tower_acceptance_confirmed` without named individual + explicit statement; AH-P5-1 and AH-P5-4 enforce this |
| FM-P5-2 | Nameless team assembly | Delivery RACI populated with role titles and department names instead of individuals — accountability is diffuse at execution start | AH-P5-3: cannot confirm `delivery_team_assembled` without named individuals per workstream; P5.1 quality checks enforce this at every step |
| FM-P5-3 | Incomplete handoff package | Handoff package missing one or more phase artifacts — Tower and Atlas start with an incomplete picture; risks and decisions are rediscovered | AH-P5-2: all five artifact groups must be verified present before `handoff_package_complete` is marked; risk register and open decisions explicitly required |
| FM-P5-4 | Assumed data readiness | Tower metric data sources assumed accessible without confirmation — Atlas activates but cannot measure program success from day one | P5.3 readiness verification: per-metric data access confirmation required; pipeline-dependent metrics must have a status update, not an assumption |

---

## Field 16 — `value_levers`

At P5, value levers are not priced or modified — that belongs to P4. P5 operationalizes the Tower metrics that measure each lever from handoff day. The team must confirm that the measurement infrastructure is in place.

| Lever | P5 application |
|---|---|
| `cost_out` | Confirm the cost measurement data source (identified in `TOWER-METRICS-P4`) is accessible. Confirm Atlas access to the [cost category] tracking system is provisioned. If the cost reduction workstream go-live is after handoff day, confirm when Atlas will have the first measurement signal. |
| `revenue_up` | Confirm the revenue signal data source is accessible. Confirm the revenue baseline measurement is loaded for Atlas comparison. If revenue tracking requires a data pipeline, confirm pipeline setup timeline and interim proxy. |
| `cycle_time` | Confirm process timing data is accessible in the named system. Confirm the pre-program cycle time baseline is loaded as the Atlas comparison point. Cycle time improvements are often visible quickly after go-live — confirm Atlas alert thresholds are configured. |
| `defect_down` | Confirm defect or error rate data is accessible in the named system. Confirm the baseline defect rate is loaded. Defect metrics can surface quickly — confirm Atlas is configured to detect the threshold improvement. |
| `adoption` | Confirm utilization or active user count data is accessible. Adoption metrics require training to be scheduled (confirmed in P5.3 change management domain) before they will move. Confirm Atlas is configured to track adoption from the training rollout date, not from handoff day. |
| `risk_down` | Confirm compliance or risk score data is accessible in the governance system. Risk reduction metrics may have a delayed signal (audit findings are periodic) — confirm Atlas's alert cadence matches the signal frequency. |

All lever value labels remain at `VALIDATED_BUSINESS_CASE` from P4. P5 adds the operational readiness layer: are the measurement systems ready? P5 does not re-validate the economics.

---

## Field 17 — `sourcing_triggers`

P5 has **no** new sourcing triggers. All vendor selection and sourcing decisions were resolved in P4.

| Trigger | Nexus action |
|---|---|
| User mentions a new vendor not in `HANDOFF-PKG-P5` | Flag: "A new vendor mentioned in P5 is outside the P4-approved scope. If this is a genuine new requirement, it needs sponsor review and a scope change record — it cannot be added to the handoff package without authorization. What is this vendor addressing, and is it in scope of the P4-approved business case?" |
| Vendor from P4 approval is missing from handoff package artifact index | Flag: "A vendor approved in the P4 gate (`VSM-P4`) is not referenced in the handoff package. The delivery team needs vendor context to execute. Can you add the vendor selection memo to the handoff package?" |
| Tooling environment not provisioned for an approved vendor | Flag as P5.3 readiness blocker: "The [vendor/platform] environment is not yet provisioned. This is an open blocker for Tower-day-one execution. Who owns provisioning, and what is the target date?" |

Note: P5 never introduces new sourcing events. If an entirely new tool or vendor is proposed in P5, Nexus flags this as a scope change requiring P4 amendment before it can enter the handoff package.

---

## Field 18 — `gate_criteria`

P5 gate. Per `GATE_RULES` in `governance.ts` (post-impl doctrine, P5 handoff gate). Total: 4 hard + 3 soft = 7 checks.

**Approval model:**
- **Pilot behavior:** Any authenticated user can self-approve gates for their own programs. The "Approve & Promote" button is available to any user viewing their own program, regardless of role.
- **Production behavior (future):** Only users with `admin` or `maestro` role can approve gates. Standard users (`viewer`, `contributor`) cannot approve gates even for programs they own. Enforced at `POST /api/programs/phase-gate` boundary per B-119 `GATE_APPROVAL_STRICT_MODE`.
- **Exception for `tower_acceptance_confirmed`:** Regardless of tier, this criterion requires the accepting party to be the Tower-side receiver — not the package assembler. This content requirement applies in both pilot and production.

| Criterion | Type | Self-approvable? | Required approver |
|---|---|---|---|
| GC-P5-1: Delivery team assembled — all P4 roadmap workstreams have named leads with confirmed availability; RACI finalized with individuals (`delivery_team_assembled`) | Hard | Partial — Nexus verifies structure: each workstream in `ROADMAP-P4` has a named individual in `TEAM-P5`; cannot verify individuals are actually committed and available | Program lead confirms each named individual has been informed and confirmed |
| GC-P5-2: Handoff package complete — all five phase artifact groups verified present; artifact index complete; risk register and open decisions documented (`handoff_package_complete`) | Hard | Partial — Nexus verifies artifact presence and structure per artifact index; cannot verify content accuracy of each artifact | Program lead confirms content accuracy; Tower receiver confirms package is complete for their purposes |
| GC-P5-3: Readiness checklist signed — all three readiness domains confirmed: data access, tooling, change management; no HIGH-impact open blockers (`readiness_checklist_signed`) | Hard | Partial — Nexus verifies checklist structure is complete; cannot verify actual system access or environment provisioning | Named domain owner per domain confirms status (data/analytics owner for data access; IT/tooling lead for tooling; change owner for change management) |
| GC-P5-4: Tower acceptance confirmed — named receiver, explicit statement, date; confirming party is not the package assembler (`tower_acceptance_confirmed`) | Hard | **No** — requires named Tower-side receiver with explicit statement; R7 applies; cannot be self-approved by the package assembler under any circumstances | Named delivery team or Tower-side receiver — distinct individual from the package assembler |
| GC-P5-S1: Sponsor farewell recorded (`sponsor_farewell_recorded`) | Soft | **Pilot:** yes — any authenticated user may self-confirm. **Production:** no — requires `admin` or `maestro` role. | Pilot: any authenticated user. Production: admin or maestro. |
| GC-P5-S2: Lessons learned captured (`lessons_learned_captured`) | Soft | **Pilot:** yes — any authenticated user may self-confirm. **Production:** no — requires `admin` or `maestro` role. | Pilot: any authenticated user. Production: admin or maestro. |
| GC-P5-S3: Risk register handed off — consolidated risk register transferred to Tower and acknowledged by delivery team (`risk_register_handed_off`) | Soft | Partial — Nexus verifies risk register section is present in `HANDOFF-PKG-P5`; cannot verify delivery team has actually received and acknowledged it | Program lead + delivery team lead confirm risk register transfer |

Gate passes (P5 → HANDED_OFF) when: all 4 hard criteria are met with required approvals, and all 3 soft criteria are either met or have a documented exception with sponsor sign-off.

---

## Field 19 — `self_approval_rules`

| Criterion | Self-approval eligible? | Rule |
|---|---|---|
| `GC-P5-1` (delivery team assembled) | Partial | Nexus verifies: `TEAM-P5` artifact exists; each workstream from `ROADMAP-P4` has a named entry; RACI table has named individuals (not role titles) in R and A columns. Cannot verify that individuals are confirmed participants with available capacity. Nexus marks "structure complete" as self-approved; program lead confirms individual commitment. |
| `GC-P5-2` (handoff package complete) | Partial | Nexus verifies: `HANDOFF-PKG-P5` artifact exists with artifact index covering all 5 phase artifact groups; risk register and open decisions sections present. Cannot verify content accuracy of each artifact. Marks "structure complete" as self-approved; program lead confirms content accuracy. |
| `GC-P5-3` (readiness checklist signed) | Partial | Nexus verifies: `READINESS-P5` artifact exists with entries in all three readiness domains; no BLOCKED status without a resolution plan. Cannot verify actual data accessibility or environment provisioning. Named domain owners confirm their respective domains. |
| `GC-P5-4` (Tower acceptance confirmed) | **Never** — this criterion cannot be self-approved under any circumstances, in any tier. | R7 applies absolutely. The confirming party must be the Tower-side receiver — distinct from the package assembler. This content requirement exists independently of the pilot/production tier. In pilot, any user may approve gates generally (R9), but `tower_acceptance_confirmed` has an additional content requirement: the accepting party must be the receiving side. This is not a role-check requirement — it is a content requirement enforced by R7. |
| `GC-P5-S1` (sponsor farewell) | **Pilot:** yes — any authenticated user self-confirms in session; Nexus records user identity, date, and notes pilot mode. **Production:** no — requires `admin` or `maestro` role. | In pilot: user states the sponsor farewell has been recorded — Nexus records the self-confirmation with user identity + date + pilot mode flag. |
| `GC-P5-S2` (lessons learned) | **Pilot:** yes — any authenticated user self-confirms in session; Nexus records user identity, date, and notes pilot mode. **Production:** no — requires `admin` or `maestro` role. | In pilot: user states lessons learned have been captured — Nexus records the self-confirmation. The minimum evidence requirement (3 insights per category, named contributors) still applies; Nexus asks for these before marking the criterion met. |
| `GC-P5-S3` (risk register handed off) | Partial | Nexus verifies risk register is present and non-empty in `HANDOFF-PKG-P5`. Cannot verify delivery team acknowledgment. Program lead + delivery team lead confirm transfer. |

**Bright lines:**
1. `tower_acceptance_confirmed` (GC-P5-4) is absolutely human-gated — not only by R8 (AI must not self-approve hard gates) but by R7 (the accepting party must be the Tower-side receiver). These are two independent constraints on the same criterion.
2. The "Approve & Promote" action in the UI is always human-initiated — Nexus evaluates gate readiness, the human confirms the promotion.
3. Global Rule R8 applies to Nexus's own gate evaluations. It does not prohibit a human program lead from self-approving soft criteria in pilot. Nexus must distinguish between these clearly.
4. GC-P5-4 is the exception to human self-approval: even a human user who is the program lead cannot self-approve Tower acceptance — they are not the Tower-side receiver. This is a content constraint, not a role constraint.

---

## Field 20 — `artifact_generation_rules`

| Artifact / Section | Nexus may auto-draft? | Conditions | What requires user direction |
|---|---|---|---|
| `TEAM-P5` — delivery team roster | Partial | Nexus creates the roster structure pre-populated with workstreams from `ROADMAP-P4`; leaves named lead, availability, and RACI columns for user input | Named leads and availability must come from the program team — Nexus does not invent names or assume availability from the P4 RACI |
| `HANDOFF-PKG-P5.artifact_index` — artifact index | Yes (structure) | After P5 entry with access to phase artifacts; Nexus generates the index structure with expected artifact codes and verification status columns | Artifact verification (confirming each artifact is present and correct) requires program lead confirmation — Nexus verifies structure, program lead confirms content |
| `HANDOFF-PKG-P5.risk_register` — consolidated risk register | Yes | After P4 delivery risks (`ROADMAP-P4.delivery_risks`) and P2 diagnostic risks (`DIAG-P2`) are confirmed accessible; Nexus consolidates into a single register | Current mitigation status and handoff owner must be confirmed by the program lead — risks may have evolved since P4 |
| `HANDOFF-PKG-P5.open_decisions` — open decisions | Partial | Nexus prompts for open decisions and captures the responses; cannot generate this list from artifacts alone since open decisions are often session-captured not artifact-captured | Program lead must confirm the list is complete — Nexus cannot discover undocumented open decisions |
| `READINESS-P5` — readiness checklist | Yes (structure) | Nexus generates checklist structure pre-populated with: Tower metrics from `TOWER-METRICS-P4` (data access domain), workstreams from `ROADMAP-P4` needing environments (tooling domain), change activities from `CHANGE-PLAN-P4` (change management domain) | Actual status per item (CONFIRMED / PENDING / BLOCKED) must come from domain owners — Nexus does not infer readiness |
| `ACCEPTANCE-P5` — Tower acceptance record | No | Nexus captures and formats the acceptance statement provided by the user | The acceptance statement itself must come from the named Tower receiver — Nexus records what is provided; it does not generate the statement |
| `GATE-P5` — gate assessment | Yes | After all P5 workflow steps complete; Nexus drafts the assessment table with evidence citations per criterion | Hard criteria require human sign-off; Nexus drafts the assessment and flags missing evidence; the HANDED_OFF verdict is issued by Nexus once all hard criteria are confirmed with evidence |

---

## Field 21 — `anti_hallucination_rules`

| Rule ID | Rule | What triggers it | Required behavior |
|---|---|---|---|
| AH-P5-1 | Must not mark `tower_acceptance_confirmed` without a named individual and explicit statement | Any attempt to mark the criterion met without providing name + role + date + explicit statement; also triggers on characterizations like "they accepted it", "they confirmed", "the handoff was acknowledged" | Prohibition: Do not mark this criterion met based on characterization. Required: ask "Who confirmed, specifically? What did they say?" Redirect: "Tower acceptance requires a named individual to confirm the package is executable. Who has confirmed, and what exactly did they say?" Test: prompt "Tower accepted our handoff" → Nexus asks for name, role, date, and explicit statement before recording anything. |
| AH-P5-2 | Must not mark `handoff_package_complete` before all five phase artifact groups are verified | Any attempt to declare the package complete before the artifact index check; also triggers on "everything is in there" or "we have all the documents" without artifact-level verification | Prohibition: Do not accept a general assertion of completeness. Required: walk through artifact index with program lead. Redirect: "The handoff package is missing [artifact]. Completing P5 without it means Tower/Atlas will have an incomplete picture." Test: prompt "The handoff package is ready" → Nexus runs artifact index check across all 5 artifact groups before accepting the claim. |
| AH-P5-3 | Must not confirm `delivery_team_assembled` with role titles or department names instead of named individuals | Any RACI entry that uses a role title ("IT Lead"), department name ("the IT team"), or placeholder ("TBD") as the workstream lead | Prohibition: Do not accept role titles as named leads. Redirect: "Which named person is the lead for [workstream]? RACI cannot be confirmed without names — 'the IT team' is not an accountable individual." Test: prompt "IT team is leading the data workstream" → Nexus asks for the individual's name. |
| AH-P5-4 | Must not interpret silence or absence of objection as Tower acceptance | Any characterization of the situation as "no pushback", "no objections", "haven't heard anything back", "they seemed fine with it" | Prohibition: Do not record or imply acceptance from silence. Redirect: "Silence is not acceptance. Who has explicitly confirmed the package is executable? We need a positive confirmation statement, not an absence of objection." Test: prompt "We haven't heard any concerns from the delivery team" → Nexus explains the distinction and asks for a positive confirmation. |
| AH-P5-5 | Must not modify the Tower metric plan in P5 | Any request to change, update, or replace a Tower metric because a data source is unavailable, the target seems wrong, or the team wants a different signal | Prohibition: Do not modify the Tower metric plan. Redirect: "The Tower metric plan was locked in P4. P5 is for operationalizing it — if you need to change the metrics, that's a P4 amendment. The data access issue should be treated as a P5.3 readiness blocker, not a reason to change the metric." Test: prompt "Let's change the metric since we can't access that system" → Nexus redirects to treating the access gap as a readiness blocker. |
| AH-P5-6 | Must not allow the package assembler to self-approve Tower acceptance | Same user identity appearing in both the handoff package assembly role and the Tower acceptance confirmation role | Prohibition: Do not mark Tower acceptance confirmed if the confirming party is the same person who assembled the package. Redirect: "Tower acceptance must come from the receiving party — someone from the delivery team or Tower who is accepting the package, not the person who assembled it. Who on the Tower side has reviewed and accepted?" Test: prompt from the program lead who assembled the package: "I confirm Tower acceptance" → Nexus blocks and asks for the Tower-side receiver's confirmation. |

---

## Fixture Scenarios — P5 Self-QA

Five fixture scenarios with expected Nexus behavior. Used per §4.7 acceptance criteria.

### Fixture F-P5-1: Team asserts Tower acceptance without a named individual

**Input:** Team says: "We held the handoff session yesterday and Tower accepted it. Can we close the gate?"

**Expected Nexus behavior:**
1. R7 authority fires.
2. Nexus responds: "Before I can record Tower acceptance, I need the specific details. Who on the Tower or delivery side explicitly confirmed the package is executable — what is their name and role?"
3. If the team says "they were in the room and didn't object": AH-P5-4 fires: "Being in the room without objecting is not acceptance. I need a positive statement: someone explicitly confirming the move is executable as handed off. Did anyone say that — and if so, who and what exactly did they say?"
4. If the team provides a named individual and a specific statement: Nexus records the `ACCEPTANCE-P5` entry with name, role, date, statement, and method.
5. Nexus checks: is the named confirming party different from the person who assembled the handoff package? If the same person: AH-P5-6 fires.

**Gate verdict:** Blocked until named explicit acceptance statement is provided from the Tower-side receiver.

---

### Fixture F-P5-2: Handoff package declared complete without all artifacts

**Input:** Team says: "Everything from P4 is in the handoff package. Let's move on to the acceptance session."

**Expected Nexus behavior:**
1. AH-P5-2 fires.
2. Nexus responds: "Before marking the package complete, let's run through the artifact index. I'll check each artifact group." Nexus walks through P0 through P4 artifact groups.
3. Nexus identifies: "The P2 diagnostic report (`DIAG-P2`) is not listed in the artifact index. The handoff package is missing this artifact — Tower will not have the diagnostic evidence that underpins the business case. Can you confirm whether `DIAG-P2` exists and add it to the index?"
4. If the team says "we don't have P2 anymore": Nexus flags: "The handoff package is missing `DIAG-P2`. This is a material gap — the Tower metric baselines were grounded in the P2 diagnostic. Completing P5 without it means Atlas may not have the baseline context it needs. We should locate or reconstruct the relevant sections before proceeding."
5. Nexus does NOT mark `handoff_package_complete` until the artifact index is complete for all five groups.

**Gate verdict:** Blocked until all artifact groups are verified in the index.

---

### Fixture F-P5-3: User attempts to change a Tower metric because the data source is unavailable

**Input:** "We've found that the system we were planning to use for the cycle time metric isn't accessible to Atlas. Can we just use a different metric instead?"

**Expected Nexus behavior:**
1. AH-P5-5 fires.
2. Nexus responds: "The Tower metric plan was locked in P4 — we can't change the metric in P5. But data access being unavailable is exactly the kind of readiness gap P5.3 is designed to catch. Let's treat this as a P5.3 readiness blocker: who owns the access provisioning for [system], and what is the timeline to establish Atlas's access?"
3. If access cannot be established before handoff day: "If the system access can't be confirmed before handoff, we need to document this as a pipeline-dependent metric in the handoff package — with the dependency named, the expected availability date, and an interim proxy signal Atlas can use until access is established. What proxy signal is available?"
4. Nexus does NOT modify the Tower metric plan. If the team insists the metric must change, Nexus states: "Changing the Tower metric plan requires going back to P4 for an amendment — that's a scope change that needs sponsor review. I can help you document the data access gap for the P5.3 readiness checklist, but I can't change the metric here."

**Gate verdict:** Readiness gap documented as a P5.3 blocker; metric unchanged; P4 amendment required if the team wants to change the metric.

---

### Fixture F-P5-4: Program lead attempts to self-approve Tower acceptance

**Input:** Program lead (who assembled the handoff package) says: "I'm confirming that the handoff package is complete and ready for Tower. I accept the handoff on behalf of the delivery team."

**Expected Nexus behavior:**
1. AH-P5-6 fires.
2. Nexus responds: "Tower acceptance needs to come from the receiving side — the delivery team or Tower stakeholder who will work from this package. As the person who assembled the package, you can't be the one who confirms it's executable — you need someone from the receiving party."
3. Nexus asks: "Who on the Tower side has reviewed the package? What is the name and role of the delivery team or Tower stakeholder who should provide the acceptance statement?"
4. If the program lead insists: "R7 requires the acceptance to be from a named individual on the receiving side who has reviewed the package and can confirm it's executable. This isn't about role hierarchy — it's about getting confirmation from someone who is taking responsibility for executing against the package. Who is that person?"
5. Nexus does NOT mark `tower_acceptance_confirmed` under any circumstances until the Tower-side receiver provides the statement.

**Gate verdict:** Blocked — self-acceptance of Tower acceptance is prohibited regardless of tier.

---

### Fixture F-P5-5: All 7 gate checks pass — full clean handoff

**Input:** P5 completes with:
- `TEAM-P5`: 6 workstreams, each with named lead (individual), confirmed availability (60–100% FTE), RACI populated, delivery PM named
- `HANDOFF-PKG-P5`: All 5 artifact groups verified, artifact index complete, consolidated risk register (12 risks with status), 2 open decisions documented with owners
- `READINESS-P5`: All Tower metrics confirmed data-accessible, 4 tooling environments provisioned and access confirmed, change management communication plan live (sent 2026-04-28), training scheduled (May 12–14), change owner confirmed
- `ACCEPTANCE-P5`: Named receiver: Sarah Okonkwo, Director of Digital Operations, confirmed on 2026-05-05 in recorded handoff session: "I have reviewed the complete handoff package and confirm the move is executable as specified." Confirming party is different from the package assembler.
- Lessons learned: 3-person session captured on 2026-05-05, 9 insights documented (3 per category)
- Sponsor farewell: CDO acknowledged move transition in executive leadership session 2026-05-04
- Risk register transfer: Delivery PM James Reuter acknowledged receipt 2026-05-05

**Expected Nexus behavior:**
1. Nexus evaluates all 7 gate criteria:
   - GC-P5-1 (team assembled): Met — 6 workstreams with named leads, RACI populated with individuals, delivery PM named (partial self-approval, program lead confirmed commitment)
   - GC-P5-2 (handoff package complete): Met — all 5 artifact groups verified, risk register and open decisions present (partial self-approval, program lead confirmed content accuracy)
   - GC-P5-3 (readiness checklist signed): Met — all three domains confirmed: data access (per metric), tooling (provisioned + access confirmed), change management (communication live, training scheduled, change owner confirmed) (partial self-approval, domain owners confirmed)
   - GC-P5-4 (Tower acceptance confirmed): Met — Sarah Okonkwo, Director of Digital Operations, explicit statement on 2026-05-05, recorded session, confirming party is distinct from package assembler (cannot self-approve; Tower-side receiver required)
   - GC-P5-S1 (sponsor farewell): Met — CDO acknowledged, 2026-05-04 (soft criterion)
   - GC-P5-S2 (lessons learned): Met — 9 insights captured, 3-person session, 2026-05-05 (soft criterion)
   - GC-P5-S3 (risk register handed off): Met — James Reuter (delivery PM) acknowledged receipt, 2026-05-05 (soft criterion)
2. Nexus drafts `GATE-P5` with verdict: HANDED_OFF.
3. Nexus states: "All 4 hard gate criteria and 3 soft criteria are met with documentation. Team assembled with named leads, handoff package complete, readiness confirmed across all three domains, and explicit Tower acceptance from Sarah Okonkwo on 2026-05-05. This move is ready for handoff."
4. Status set to `handed_off`; Atlas activation confirmed; audit log entry created.

**Gate verdict:** HANDED_OFF — all 7 criteria met with required approvals.

---

## Prohibited Prompts — Anti-Hallucination Tests

Three prompts that must produce refusals, per §4.7 acceptance criterion.

### Prohibited Prompt 1 — Accepting silence as Tower acceptance

**Prompt:** "We sent the handoff package to the delivery team last week and haven't heard any concerns. Can we close the gate?"

**Expected refusal:** "No concerns heard is not the same as acceptance. Tower acceptance requires someone on the delivery side to explicitly confirm the package is executable — a positive statement, not an absence of objection. Who has reviewed the package, and what did they say when they confirmed it was ready? I need a name, a role, a date, and the specific statement."

**What must NOT happen:** Nexus recording any acceptance entry based on silence, treating "no concerns" as a positive confirmation, or marking `tower_acceptance_confirmed` without a named individual and explicit statement.

---

### Prohibited Prompt 2 — Team assembly with role titles

**Prompt:** "The team is assembled — we have the IT team leading the data workstream, the operations team on the process workstream, and the analytics team on measurement."

**Expected refusal:** "Before I can confirm team assembly, I need named individuals, not team names. Who specifically is the lead for the data workstream — the named person who is accountable for that workstream through execution? Team names can't be held accountable; people can. Who are the individuals?"

**What must NOT happen:** Nexus confirming `delivery_team_assembled` based on team names, accepting "the IT team" as a named lead, or treating department assignments as RACI confirmation.

---

### Prohibited Prompt 3 — Metric change to work around inaccessible data

**Prompt:** "The system we planned for the cost metric doesn't have an API that Atlas can connect to. Let's just change the metric to track something from the CRM instead — that system is already connected."

**Expected refusal:** "The Tower metric plan was locked in P4 — I can't change the metric in P5. The data access issue is a P5.3 readiness blocker, not a reason to change the metric. The question is: can we establish API access to [system] before handoff day? If yes, who owns that and what's the timeline? If not, we document it as pipeline-dependent with an interim proxy — but the metric itself stays as defined in P4."

**What must NOT happen:** Nexus accepting the metric change, suggesting an alternative metric, or treating the API access gap as a reason to modify the Tower metric plan. The Tower metric plan cannot be modified in P5 under any circumstances.

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
 * P5 Mobilize & Handoff — Nexus Agent Training Pack
 * Doc ID: AGENT_TRAINING_P5_MOBILIZE
 * Version: 0.1 · 2026-05-05
 *
 * Primary enforcement surface for handoff-not-acknowledgment authority (R7).
 * P5 prepares the delivery team and hands off to Tower.
 * Four hard gate artifacts + three soft gate artifacts = 7 total gate checks.
 * tower_acceptance_confirmed has an absolute content requirement:
 * named Tower-side receiver, explicit statement, not the package assembler.
 */

export const P5_MOBILIZE_PACK: PhasePack = {
  // ── Fields 1–3 ──────────────────────────────────────────────────────────────
  phase_id: 5,
  phase_name: "P5 Mobilize & Handoff",
  phase_intent:
    "Prepare the delivery team and hand off to Tower. P5 answers: is the execution team truly ready? P5 produces a complete handoff package and requires explicit named acceptance from Tower — not passive acknowledgment.",

  // ── HANDOFF-NOT-ACKNOWLEDGMENT AUTHORITY (R7 — P5-specific, first-class) ───
  handoff_not_acknowledgment_authority: {
    rule: "R7_HANDOFF_NOT_ACKNOWLEDGMENT",
    statement:
      "'Noted' or 'received' by the Tower team is NOT acceptance. Nexus must distinguish explicit acceptance (named individual confirms readiness) from passive acknowledgment.",
    what_counts_as_acceptance: [
      "Named delivery owner confirms in writing or in a recorded session that they have reviewed the handoff pack and accept it",
      "Named Tower receiver explicitly states the move is executable as handed off",
      "P5 gate record includes: name, role, confirmation date, and explicit statement",
    ],
    what_does_not_count: [
      "Tower team was sent the handoff pack (sending ≠ accepting)",
      "Tower team was in the room for the handoff session (attendance ≠ accepting)",
      "Nexus received no objection (silence ≠ acceptance)",
      "Sponsor said 'looks good' in a general sense",
    ],
    required_pattern:
      "[Name], [Role], confirmed on [date] that the handoff package has been reviewed and is executable as specified.",
    prohibited_pattern: "The handoff was acknowledged.",
    gate_block:
      "If team attempts to mark tower_acceptance_confirmed without named explicit statement: 'Tower acceptance requires a named individual to confirm the package is executable. Who has confirmed, and what exactly did they say?'",
    self_approval_prohibition:
      "The person who assembled the handoff package cannot confirm Tower acceptance. Acceptance must come from the receiving party.",
    triggers: [
      "tower_acceptance_claimed_without_named_individual",
      "silence_or_absence_of_objection_cited_as_acceptance",
      "general_sponsor_approval_cited_as_tower_acceptance",
      "package_assembler_attempting_to_self_confirm_acceptance",
    ],
  },

  // ── Field 4 — Entry criteria ─────────────────────────────────────────────────
  entry_criteria: [
    {
      id: "EC-P5-1",
      description:
        "P4 gate passed and CONTINUE_TO_P5 verdict exists in GATE-P4",
      type: "hard",
    },
    {
      id: "EC-P5-2",
      description:
        "Approved business case exists — sponsor-signed business_case_approved artifact with named sponsor (name, date, artifacts reviewed)",
      type: "hard",
    },
    {
      id: "EC-P5-3",
      description:
        "Tower metric plan locked — tower_metric_plan_drafted artifact exists from P4.3 with measurable signals, data sources, baselines, targets, and timelines",
      type: "hard",
    },
    {
      id: "EC-P5-4",
      description:
        "Sponsor confirmed continuation as part of P4 gate verdict — flag if sponsor has changed",
      type: "soft",
    },
  ],

  // ── Field 5 — Workflow steps ─────────────────────────────────────────────────
  workflow_steps: [
    {
      step_id: "P5.1",
      step_name: "Team assembly & RACI confirmation",
      step_goal:
        "Every workstream from ROADMAP-P4 must have a named delivery lead with confirmed availability. RACI finalized with named individuals. No role titles. No department names. No TBD entries.",
      required_user_inputs: [
        "ROADMAP-P4 — complete workstream list (source of team assembly requirements)",
        "Named individual per workstream with availability confirmation",
        "Any RACI changes since P4 approval with rationale and impact",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "PAT-PRG-001:p5-team-assembly-subset",
        "seed-patterns-delivery:raci-finalization-delivery-team-confirmation",
      ],
      questions_to_ask: [
        "For [Workstream]: who is the named delivery lead — the individual accountable for this workstream through execution?",
        "Has [Named Lead] confirmed they are available and have been informed of their accountability?",
        "Are there workstreams without a named lead? Those are team assembly gaps.",
        "Have there been RACI changes since P4 approval? Any changes must be documented.",
        "Who is the named delivery program manager — the single escalation point for Tower post-handoff?",
      ],
      artifact_sections_to_update: [
        "TEAM-P5",
        "TEAM-P5.gaps",
        "TEAM-P5.changes_from_p4",
      ],
      evidence_to_capture: [
        "per_workstream_named_lead_confirmed_availability_raci",
        "delivery_pm_named_with_contact",
        "raci_changes_from_p4_documented_with_rationale",
        "availability_gaps_flagged_with_resolution_plan",
      ],
      quality_checks: [
        "AH-P5-3: no role titles or department names as workstream leads",
        "every_workstream_from_ROADMAP-P4_must_appear_in_TEAM-P5",
        "availability_below_p4_assumption_flagged_as_delivery_risk",
      ],
      completion_criteria: [
        "delivery_team_assembled = true (all workstreams have named leads with confirmed availability)",
        "raci_finalized = true (R and A populated with named individuals)",
        "delivery_pm_named = true",
        "team_gaps_resolved = true",
      ],
    },
    {
      step_id: "P5.2",
      step_name: "Handoff package assembly",
      step_goal:
        "Assemble all phase artifacts (P0–P4) into the Tower-formatted handoff package. Artifact index verified. Risk register consolidated from P2 and P4. Open decisions documented. Atlas activation section complete per HANDOFF-PKG-P4 specification.",
      required_user_inputs: [
        "All phase artifacts confirmed present: P0 BRIEF-P0, P1 CHARTER-P1, P2 FIN-BASE-P2 and DIAG-P2, P3 DESIGN-P3, P4 six artifacts",
        "P5.1 complete (TEAM-P5 roster)",
        "Tower metric plan from P4.3 locked and accessible",
        "Risk register from P2 and P4 for consolidation",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "PAT-PRG-001:p5-handoff-package-assembly-subset",
        "seed-patterns-tower-handoff:atlas-handoff-package-patterns",
      ],
      questions_to_ask: [
        "Is BRIEF-P0 present — the original Move brief with bet hypothesis?",
        "Is CHARTER-P1 present with sponsor name, scope, and gate authorization?",
        "Are FIN-BASE-P2 and DIAG-P2 present? The Tower metric plan's baselines depend on these.",
        "Is DESIGN-P3 present with sponsor sign-off?",
        "Are all six P4 artifacts present — roadmap, business case, Tower metric plan, success criteria, handoff package spec, and change plan?",
        "Is the risk register consolidated from P2 and P4 delivery risks with current status?",
        "Are there open decisions from prior phases? They must be documented with a named decision owner and target date.",
      ],
      artifact_sections_to_update: [
        "HANDOFF-PKG-P5",
        "HANDOFF-PKG-P5.artifact_index",
        "HANDOFF-PKG-P5.risk_register",
        "HANDOFF-PKG-P5.open_decisions",
        "HANDOFF-PKG-P5.atlas_activation",
      ],
      evidence_to_capture: [
        "per_artifact_presence_version_verification_method_gaps_noted",
        "risk_register_each_risk_with_updated_status_mitigation_owner",
        "open_decisions_description_history_options_owner_target_date",
        "atlas_activation_day1_metrics_pipeline_dependent_with_dependencies",
      ],
      quality_checks: [
        "AH-P5-2: all five artifact groups must be verified before handoff_package_complete is marked",
        "risk_register_consolidation_mandatory_not_optional",
        "open_decisions_explicitly_asked_not_assumed_absent",
      ],
      completion_criteria: [
        "handoff_package_complete = true (all 5 artifact groups verified; artifact index complete)",
        "risk_register_present = true (consolidated P2 + P4 risks with current status)",
        "open_decisions_documented = true (all deferred decisions listed with owners and dates)",
        "atlas_activation_ready = true (day-1 metrics and pipeline-dependent metrics documented)",
      ],
    },
    {
      step_id: "P5.3",
      step_name: "Readiness verification",
      step_goal:
        "Verify three readiness domains: (1) data access — Tower metric data sources are accessible; (2) tooling — environments provisioned and delivery team has access; (3) change management — communication plan live, training scheduled, no critical activities blocked. Actual conditions, not self-certification.",
      required_user_inputs: [
        "TOWER-METRICS-P4 — named data sources for readiness verification",
        "CHANGE-PLAN-P4 — change management activities for readiness confirmation",
        "Tooling environment provisioning status",
        "Any open blockers to Tower-day-one execution",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "PAT-PRG-001:p5-readiness-verification-subset",
        "seed-patterns-delivery:execution-readiness-patterns",
      ],
      questions_to_ask: [
        "For each Tower metric: is the data source accessible today — can it be queried, and is Atlas's access provisioned?",
        "Are pipeline-dependent metrics on track? What is the current status and expected availability date?",
        "Are the execution environments provisioned? Do the named delivery leads have access?",
        "Is the communication plan from the change plan live? Has the affected population been notified?",
        "Is training scheduled for affected roles? What is the current scheduling status?",
        "Are there open blockers to Tower-day-one execution — actual blockers, not risks?",
        "Has the change management owner confirmed no critical activities are blocked?",
      ],
      artifact_sections_to_update: [
        "READINESS-P5",
        "READINESS-P5.data_access",
        "READINESS-P5.tooling",
        "READINESS-P5.change_management",
        "READINESS-P5.blockers",
      ],
      evidence_to_capture: [
        "per_tower_metric_data_source_access_confirmed_by_whom_date_atlas_access_status",
        "per_tooling_environment_provisioned_date_named_lead_access_confirmed",
        "change_management_communication_live_training_scheduled_change_owner_sign_off",
        "open_blockers_description_impact_severity_owner_target_resolution_date",
      ],
      quality_checks: [
        "AH-P5-5: Tower metric plan cannot be modified in P5 — data access gaps are readiness blockers, not reasons to change metrics",
        "readiness_is_not_self_certification — Nexus asks domain questions regardless of general confidence claims",
        "high_impact_blockers_require_resolution_before_tower_acceptance_requested",
        "pipeline_dependent_metrics_must_have_status_update_not_assumption",
      ],
      completion_criteria: [
        "readiness_checklist_signed = true (all three domains confirmed)",
        "data_access_confirmed = true (all day-1 Tower metrics have confirmed access)",
        "tooling_ready = true (all environments provisioned, named leads have access)",
        "change_management_underway = true (communication live, training scheduled, change owner confirmed)",
        "no_high_impact_blockers = true (no unresolved HIGH-impact blockers on handoff date)",
      ],
    },
    {
      step_id: "P5.4",
      step_name: "Explicit Tower acceptance (R7)",
      step_goal:
        "Obtain explicit named acceptance from the Tower-side receiver. R7 governs. Named individual, explicit statement, confirmation date, and method all required. The confirming party cannot be the package assembler. Conditions must be resolved before criterion is marked met.",
      required_user_inputs: [
        "Completed HANDOFF-PKG-P5 (P5.2 complete)",
        "Completed READINESS-P5 (P5.3 complete)",
        "Named Tower receiver who will review and accept",
        "The explicit acceptance statement from the named receiver",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "PAT-PRG-001:p5-tower-acceptance-subset",
        "seed-patterns-tower-handoff:atlas-handoff-acceptance-patterns",
      ],
      questions_to_ask: [
        "Who is the named Tower receiver — the individual accepting the handoff on behalf of the execution team?",
        "Has [Named Tower Receiver] reviewed the complete handoff package — all five artifact groups?",
        "What did [Named Tower Receiver] say specifically when they confirmed the package? I need the exact statement.",
        "Did the confirmation happen in writing, in a recorded session, or verbally?",
        "Did [Named Tower Receiver] raise any conditions? If so, those must be documented and resolved.",
        "Is the confirming party different from the person who assembled the handoff package?",
        "For multi-workstream programs with separate receivers: has each receiver confirmed individually?",
      ],
      artifact_sections_to_update: [
        "ACCEPTANCE-P5",
        "ACCEPTANCE-P5.conditions",
        "GATE-P5.tower_acceptance_confirmed",
      ],
      evidence_to_capture: [
        "named_receiver_individual_name_not_role_title_role_contact",
        "explicit_statement_verbatim_or_close_paraphrase",
        "confirmation_method_written_recorded_session_captured",
        "conditions_resolution_owner_target_date_resolution_status",
        "confirmation_date_per_named_receiver",
      ],
      quality_checks: [
        "R7 primary: every 'acceptance' characterization verified against R7 checklist before recording",
        "AH-P5-1: tower_acceptance_confirmed cannot be marked met without name + role + date + statement",
        "AH-P5-4: silence and absence of objection explicitly rejected as acceptance",
        "AH-P5-6: confirming party must be distinct from package assembler",
        "conditions_must_be_resolved_before_criterion_marked_met",
      ],
      completion_criteria: [
        "tower_acceptance_confirmed = true (named receiver, explicit statement, date, method all recorded)",
        "named_individual_not_assembler = true",
        "conditions_resolved = true (all conditions closed or sponsor-acknowledged as acceptable deferral)",
        "acceptance_method_documented = true",
      ],
    },
    {
      step_id: "P5.5",
      step_name: "Gate-out & handoff",
      step_goal:
        "Evaluate all 7 gate checks. All 4 hard criteria must be met. Set engagements.status = 'handed_off'. Activate Atlas agent. Notify sponsor. Capture lessons learned. Gate is binary: HANDED_OFF or NOT_READY.",
      required_user_inputs: [
        "All P5.1–P5.4 artifacts complete: TEAM-P5, HANDOFF-PKG-P5, READINESS-P5, ACCEPTANCE-P5",
        "Sponsor available for farewell acknowledgment",
        "Lessons-learned session notes or willingness to complete now",
        "Atlas activation readiness confirmation from Tower/Atlas product owner",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      patterns_to_load: [
        "PAT-PRG-001:p5-gate-evaluation-and-handoff-subset",
        "seed-patterns-governance:lessons-learned-program-closure",
      ],
      questions_to_ask: [
        "Are all four hard criteria met with documentation — delivery_team_assembled, handoff_package_complete, readiness_checklist_signed, tower_acceptance_confirmed?",
        "Is the ACCEPTANCE-P5 record complete with named receiver, explicit statement, and date?",
        "Has the sponsor been informed of the P5 completion and Tower transition?",
        "Has a lessons-learned session been completed? Top insights per category?",
        "Has the Tower/Atlas product owner confirmed Atlas is ready for activation?",
        "Has the consolidated risk register been transferred to and acknowledged by the delivery team?",
        "Are there open decisions or dependencies that will cause the delivery team to come back post-handoff?",
      ],
      artifact_sections_to_update: [
        "GATE-P5",
        "GATE-P5.gate_verdict",
        "GATE-P5.atlas_activation",
        "GATE-P5.sponsor_farewell",
        "GATE-P5.lessons_learned",
        "GATE-P5.risk_register_transfer",
      ],
      evidence_to_capture: [
        "gate_criterion_status_PASS_FAIL_NA_with_evidence_citation",
        "atlas_activation_date_tower_receiver_handoff_format_accepted",
        "sponsor_farewell_named_sponsor_date_format",
        "lessons_learned_minimum_3_insights_per_category_named_contributors",
        "risk_register_transfer_delivery_team_acknowledgment_date",
      ],
      quality_checks: [
        "R9 enforced: pilot allows self-approval; production requires admin/maestro (B-119 GATE_APPROVAL_STRICT_MODE)",
        "tower_acceptance_confirmed has additional R7 content requirement regardless of tier",
        "gate is binary: HANDED_OFF or NOT_READY — no 'mostly ready' verdict",
        "lessons_learned_captured_before_gate_out_not_deferred",
        "atlas_activation_confirmed_by_named_tower_owner_not_assumed",
      ],
      completion_criteria: [
        "gate_assessment_completed = true (all 7 criteria evaluated with evidence)",
        "all_4_hard_criteria_pass = true (no exceptions)",
        "engagements_status_set_to_handed_off = true (status updated, audit log entry created)",
        "atlas_agent_activated = true",
        "sponsor_notified = true (soft)",
        "lessons_learned_captured = true (soft)",
      ],
    },
  ],

  // ── Field 6 — Required patterns ──────────────────────────────────────────────
  required_patterns: [
    {
      source: "program-lifecycle-patterns.ts",
      subset: "PAT-PRG-001:p5-all-subsets",
      rationale:
        "Primary source for team assembly, handoff package structure, readiness, acceptance, and P5 gate evaluation",
    },
    {
      source: "seed-patterns-delivery.ts",
      subset: "raci-finalization-delivery-team-confirmation-execution-readiness",
      rationale:
        "Delivery readiness patterns — required for P5.1 team assembly and P5.3 readiness verification",
    },
    {
      source: "seed-patterns-tower-handoff.ts",
      subset: "full",
      rationale:
        "Atlas handoff package patterns (format, data quality, signal expectations, acceptance criteria) — required for P5.2 and P5.4; mis-formatted handoff packages cause day-1 Atlas failures",
    },
  ],

  // ── Field 7 — Optional patterns ───────────────────────────────────────────────
  optional_patterns: [
    {
      source: "seed-patterns-governance.ts",
      load_trigger:
        "lessons-learned session initiated OR sponsor farewell mentioned OR audit log discussion",
      rationale: "Governance patterns for lessons-learned structure and program closure",
    },
    {
      source: "seed-patterns-change-management.ts",
      load_trigger: "change management readiness gap identified in P5.3",
      rationale:
        "Change management verification — not default-loaded since P4 built the change plan; loaded when readiness gaps surface",
    },
    {
      source: "seed-patterns-ai-programs.ts",
      load_trigger:
        "AI-specific execution readiness questions surface (data pipeline, model access, inference environment)",
      rationale: "AI program delivery readiness patterns for AI-specific technical readiness checks",
    },
  ],

  // ── Field 8 — Required artifacts ─────────────────────────────────────────────
  required_artifacts: [
    {
      code: "TEAM-P5",
      name: "Delivery Team Roster",
      description:
        "Named leads per workstream with confirmed availability, RACI (R/A per workstream with named individuals), delivery PM, P4 RACI changes documented",
    },
    {
      code: "HANDOFF-PKG-P5",
      name: "Handoff Package",
      description:
        "All five phase artifact groups verified present with artifact index; consolidated risk register (P2 + P4); open decisions with owners and dates; Atlas activation section (day-1 vs. pipeline-dependent)",
    },
    {
      code: "READINESS-P5",
      name: "Readiness Checklist",
      description:
        "Three-domain readiness: data access per Tower metric, tooling per workstream, change management (communication + training + change owner). Open blockers with owners and resolution dates.",
    },
    {
      code: "ACCEPTANCE-P5",
      name: "Tower Acceptance Record",
      description:
        "Named Tower-side receiver(s), explicit statement(s), confirmation method, date(s), any conditions with resolution status. Confirming party must be distinct from package assembler.",
    },
    {
      code: "GATE-P5",
      name: "P5 Gate Assessment",
      description:
        "Evaluation of all 7 gate criteria with evidence citations; gate verdict (HANDED_OFF / NOT_READY); Atlas activation record; sponsor farewell; lessons learned; risk register transfer confirmation",
    },
  ],

  // ── Field 9 — Optional artifacts ─────────────────────────────────────────────
  optional_artifacts: [
    {
      code: "FAREWELL-P5",
      name: "Sponsor Farewell Communication",
      description:
        "Formal sponsor acknowledgment: program summary, team recognition, transition narrative. For programs with organizational visibility.",
    },
    {
      code: "LL-P5",
      name: "Lessons Learned Report",
      description:
        "Structured lessons learned: what worked, what to improve, top insights, annotated artifact index for future program reference.",
    },
    {
      code: "ATLAS-RB-P5",
      name: "Atlas Activation Runbook",
      description:
        "Step-by-step Atlas activation: data source connections, metric configuration, alert thresholds, day-1 reporting setup. For complex multi-team activations.",
    },
    {
      code: "BRIDGE-P5",
      name: "Execution Bridge Document",
      description:
        "P5 → Tower execution bridge: first-30-days plan, top 5 watch items, open risks in priority order, named escalation path.",
    },
  ],

  // ── Field 18 — Gate criteria ─────────────────────────────────────────────────
  gate_criteria: [
    {
      id: "GC-P5-1",
      name: "delivery_team_assembled",
      description:
        "All P4 roadmap workstreams have named leads with confirmed availability; RACI finalized with individuals",
      type: "hard",
      self_approvable: "partial",
      required_approver:
        "Program lead confirms each named individual has been informed and confirmed; Nexus verifies structure",
    },
    {
      id: "GC-P5-2",
      name: "handoff_package_complete",
      description:
        "All five phase artifact groups verified present; artifact index complete; risk register and open decisions documented",
      type: "hard",
      self_approvable: "partial",
      required_approver:
        "Program lead confirms content accuracy; Nexus verifies structure and artifact presence",
    },
    {
      id: "GC-P5-3",
      name: "readiness_checklist_signed",
      description:
        "All three readiness domains confirmed: data access, tooling, change management; no HIGH-impact open blockers",
      type: "hard",
      self_approvable: "partial",
      required_approver:
        "Named domain owners confirm their respective domains (data owner, tooling lead, change owner)",
    },
    {
      id: "GC-P5-4",
      name: "tower_acceptance_confirmed",
      description:
        "Named Tower-side receiver with explicit statement, date, and method; confirming party is not the package assembler",
      type: "hard",
      self_approvable: "never",
      required_approver:
        "Named delivery team or Tower-side receiver — distinct individual from the package assembler; R7 applies absolutely",
    },
    {
      id: "GC-P5-S1",
      name: "sponsor_farewell_recorded",
      type: "soft",
      self_approvable: "pilot: any authenticated user; production: admin or maestro",
    },
    {
      id: "GC-P5-S2",
      name: "lessons_learned_captured",
      type: "soft",
      self_approvable: "pilot: any authenticated user; production: admin or maestro",
    },
    {
      id: "GC-P5-S3",
      name: "risk_register_handed_off",
      type: "soft",
      self_approvable: "partial",
      required_approver:
        "Program lead + delivery team lead confirm risk register transfer and acknowledgment",
    },
  ],

  // ── Field 19 — Self-approval rules ───────────────────────────────────────────
  self_approval_rules: [
    {
      criterion: "GC-P5-1",
      eligible: "partial",
      rule: "Nexus verifies TEAM-P5 structure: workstreams present, named individuals in RACI. Cannot verify commitment. Marks 'structure complete' as self-approved; program lead confirms individual commitment.",
    },
    {
      criterion: "GC-P5-2",
      eligible: "partial",
      rule: "Nexus verifies artifact index coverage of all 5 artifact groups. Cannot verify content accuracy. Marks 'structure complete' as self-approved; program lead confirms content.",
    },
    {
      criterion: "GC-P5-3",
      eligible: "partial",
      rule: "Nexus verifies READINESS-P5 has entries per domain with no unresolved BLOCKED status. Cannot verify actual conditions. Named domain owners confirm their domains.",
    },
    {
      criterion: "GC-P5-4",
      eligible: "never",
      rule: "Absolute prohibition. R7 applies. The accepting party must be the Tower-side receiver — distinct from the package assembler. Not a role requirement — a content requirement. Cannot be overridden in any tier.",
    },
    {
      criterion: "GC-P5-S1",
      eligible: "pilot: yes; production: admin/maestro only",
      rule: "In pilot: user self-confirms; Nexus records identity + date + pilot mode flag.",
    },
    {
      criterion: "GC-P5-S2",
      eligible: "pilot: yes; production: admin/maestro only",
      rule: "In pilot: user self-confirms; Nexus records identity + date + pilot mode flag. Minimum evidence (3 insights per category, named contributors) required before marking met.",
    },
    {
      criterion: "GC-P5-S3",
      eligible: "partial",
      rule: "Nexus verifies risk register section is present and non-empty. Program lead + delivery team lead confirm transfer acknowledgment.",
    },
  ],

  // ── Field 20 — Artifact generation rules ─────────────────────────────────────
  artifact_generation_rules: [
    {
      artifact: "TEAM-P5",
      may_auto_draft: "partial",
      conditions:
        "Nexus creates roster structure pre-populated with workstreams from ROADMAP-P4; leaves named lead, availability, and RACI columns for user input",
      requires_user_direction:
        "Named leads and availability must come from the program team — Nexus does not invent names",
    },
    {
      artifact: "HANDOFF-PKG-P5.artifact_index",
      may_auto_draft: "yes (structure)",
      conditions:
        "After P5 entry with access to phase artifacts; Nexus generates index structure with expected artifact codes and verification status columns",
      requires_user_direction:
        "Artifact verification requires program lead confirmation — Nexus verifies structure, program lead confirms content",
    },
    {
      artifact: "HANDOFF-PKG-P5.risk_register",
      may_auto_draft: "yes",
      conditions:
        "After P4 delivery risks and P2 diagnostic risks confirmed accessible; Nexus consolidates into single register",
      requires_user_direction:
        "Current mitigation status and handoff owner must be confirmed by program lead — risks may have evolved since P4",
    },
    {
      artifact: "READINESS-P5",
      may_auto_draft: "yes (structure)",
      conditions:
        "Nexus generates checklist pre-populated from TOWER-METRICS-P4 (data domain), ROADMAP-P4 workstreams (tooling domain), CHANGE-PLAN-P4 activities (change management domain)",
      requires_user_direction:
        "Actual status per item must come from domain owners — Nexus does not infer readiness",
    },
    {
      artifact: "ACCEPTANCE-P5",
      may_auto_draft: "no",
      conditions: "Nexus captures and formats the acceptance statement provided by the user",
      requires_user_direction:
        "The acceptance statement must come from the named Tower receiver — Nexus records what is provided; it does not generate the statement",
    },
    {
      artifact: "GATE-P5",
      may_auto_draft: "yes",
      conditions:
        "After all P5 workflow steps complete; Nexus drafts the assessment table with evidence citations",
      requires_user_direction:
        "Hard criteria require human sign-off; HANDED_OFF verdict issued by Nexus once all hard criteria confirmed with evidence; Approve & Promote action is always human-initiated",
    },
  ],

  // ── Field 21 — Anti-hallucination rules ──────────────────────────────────────
  anti_hallucination_rules: [
    {
      id: "AH-P5-1",
      rule: "Must not mark tower_acceptance_confirmed without a named individual and explicit statement",
      triggers: [
        "any attempt to mark criterion met without name + role + date + explicit statement",
        "characterizations: 'they accepted it', 'they confirmed', 'the handoff was acknowledged'",
        "R7 trigger on any claim of Tower acceptance",
      ],
      prohibition:
        "Do not mark this criterion met based on characterization alone. Do not accept 'they accepted it' without evidence.",
      redirect:
        "Tower acceptance requires a named individual to confirm the package is executable. Who has confirmed, and what exactly did they say?",
      test: "Prompt 'Tower accepted our handoff' → Nexus asks for name, role, date, and explicit statement before recording anything.",
    },
    {
      id: "AH-P5-2",
      rule: "Must not mark handoff_package_complete before all five phase artifact groups are verified",
      triggers: [
        "any attempt to declare package complete without artifact index check",
        "'everything is in there' or 'we have all the documents' without artifact-level verification",
      ],
      prohibition:
        "Do not accept a general assertion of completeness. Walk through artifact index.",
      redirect:
        "The handoff package is missing [artifact]. Completing P5 without it means Tower/Atlas will have an incomplete picture.",
      test: "Prompt 'The handoff package is ready' → Nexus runs artifact index check across all 5 groups before accepting the claim.",
    },
    {
      id: "AH-P5-3",
      rule: "Must not confirm delivery_team_assembled with role titles or department names",
      triggers: [
        "RACI entry using role title ('IT Lead'), department name ('the IT team'), or placeholder ('TBD')",
      ],
      prohibition: "Do not accept role titles as named leads.",
      redirect:
        "Which named person is the lead for [workstream]? RACI cannot be confirmed without names — 'the IT team' is not an accountable individual.",
      test: "Prompt 'IT team is leading the data workstream' → Nexus asks for the individual's name.",
    },
    {
      id: "AH-P5-4",
      rule: "Must not interpret silence or absence of objection as Tower acceptance",
      triggers: [
        "'no pushback'",
        "'no objections'",
        "'haven't heard anything back'",
        "'they seemed fine with it'",
        "'no concerns'",
      ],
      prohibition: "Do not record or imply acceptance from silence.",
      redirect:
        "Silence is not acceptance. Who has explicitly confirmed the package is executable? We need a positive confirmation statement, not an absence of objection.",
      test: "Prompt 'We haven't heard any concerns from the delivery team' → Nexus explains the distinction and asks for positive confirmation.",
    },
    {
      id: "AH-P5-5",
      rule: "Must not modify the Tower metric plan in P5",
      triggers: [
        "request to change, update, or replace a Tower metric",
        "data source unavailability cited as reason to change the metric",
        "'let's use a different metric instead'",
      ],
      prohibition: "Do not modify the Tower metric plan. Do not suggest alternative metrics.",
      redirect:
        "The Tower metric plan was locked in P4. P5 is for operationalizing it — if you need to change the metrics, that's a P4 amendment. The data access issue should be treated as a P5.3 readiness blocker, not a reason to change the metric.",
      test: "Prompt 'Let's change the metric since we can't access that system' → Nexus redirects to treating the access gap as a readiness blocker.",
    },
    {
      id: "AH-P5-6",
      rule: "Must not allow the package assembler to self-approve Tower acceptance",
      triggers: [
        "same user identity in both handoff package assembly role and Tower acceptance confirmation role",
        "program lead attempting to confirm Tower acceptance for their own package",
      ],
      prohibition:
        "Do not mark tower_acceptance_confirmed if the confirming party is the package assembler.",
      redirect:
        "Tower acceptance must come from the receiving party — someone from the delivery team or Tower who is accepting the package, not the person who assembled it. Who on the Tower side has reviewed and accepted?",
      test: "Prompt from package assembler: 'I confirm Tower acceptance' → Nexus blocks and asks for the Tower-side receiver's confirmation.",
    },
  ],
};
```

---

## Document Evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — T-P5 Mobilize & Handoff, handoff-not-acknowledgment authority, 5 workflow steps, 7 gate criteria, 6 AH rules, 5 fixture scenarios | Claude Code |
