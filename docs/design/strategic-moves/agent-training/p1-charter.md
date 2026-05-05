# P1 Charter — Nexus Agent Training Pack

| Field | Value |
|---|---|
| **Work Package** | T-P1 |
| **Doc ID** | `AGENT_TRAINING_P1_CHARTER` |
| **Date** | 2026-05-05 |
| **Status** | Draft — ready for Anand review |
| **Schema version** | 21-field config schema (§4.3 of WBS) |
| **Depends on** | `00-cross-phase-capabilities.md`, `00-global-behavioral-rules.md`, `PHASE_MODEL_V2_DOCTRINE.md`, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Serialized config** | TypeScript block at end of document |

---

## Field 1 — `phase_id`

`1`

---

## Field 2 — `phase_name`

`P1 Charter`

---

## Field 3 — `phase_intent`

Convert the P0 hypothesis into a sponsor-committed charter with value range locked. No charter without a named, committed sponsor. No move past P1 without a signed value range.

---

## Field 4 — `entry_criteria`

P0 gate must be passed before entering P1.

| # | Criterion | Type | Notes |
|---|---|---|---|
| EC-P1-1 | P0 gate criteria all passed: hypothesis falsifiable, archetype classified, sponsor candidate identified (human-confirmed), value hypothesis seeded (labeled UNVALIDATED_HYPOTHESIS), scope boundary stated | Hard | All 5 hard P0 gates must be met before P1 may begin. |
| EC-P1-2 | Sponsor candidate is a named individual — not a role placeholder ("the CFO") | Hard | P1 cannot begin if the sponsor candidate from P0 is only a role. A real person must be identified. |
| EC-P1-3 | P1 Charter Draft Skeleton (artifact `CHARTER-SKEL-P0`) has been produced | Soft | The P0 skeleton pre-populates P1 fields and accelerates charter drafting. If missing, Nexus flags the gap. |

If EC-P1-1 is not met, Nexus blocks entry and states: "P1 requires P0 to be complete. [List specific P0 gate criteria that are unmet.] Please complete P0 before chartering."

---

## Field 5 — `workflow_steps`

Five steps. Each is expanded in the WorkflowStep inner schema below.

| Step ID | Name | Goal |
|---|---|---|
| P1.1 | Sponsor commitment | Confirm sponsor is named, willing, and authorized |
| P1.2 | Stakeholder mapping | Map decision rights, contributors, and reviewers |
| P1.3 | Success metrics and value range | Lock the primary success metric and produce a preliminary value range |
| P1.4 | Charter document draft | Produce the charter artifact |
| P1.5 | Gate review preparation | Self-evaluate P1→P2 gate readiness and produce a gate readiness summary |

---

### WorkflowStep P1.1 — Sponsor commitment

**step_id:** `P1.1`

**step_name:** Sponsor commitment

**step_goal:** Confirm the sponsor candidate from P0 is now committed: named, willing to own the outcome, and authorized to approve scope and resource. If not yet committed, Nexus must surface this as the #1 blocker. Sponsor commitment is NOT optional at P1 — it is the primary hard gate.

**required_user_inputs:**
- Explicit confirmation that the named sponsor candidate from P0 has been engaged and has committed
- Alternatively: a sponsor sign-off document (uploaded PDF, DOCX, or email extract)
- If sponsor is not yet committed: whatever information the user has about the status of sponsor engagement

**accepted_uploads:**
- `application/pdf` (signed charter, sponsor approval memo)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx — sponsor commitment letter)
- `text/plain`, `text/markdown` (email extract confirming sponsor commitment)

**patterns_to_load:**
- `PAT-PRG-001` (program lifecycle — charter subset, stakeholder patterns)
- `seed-patterns-meta.ts` (value-metric patterns — needed to reason about sponsor's KPI ownership)

**questions_to_ask:**
1. "Has [sponsor candidate name from P0] formally agreed to sponsor this Move — are they committed?"
2. "Does [sponsor name] have authority to approve the scope, commit resources, and make the key decisions this Move requires?"
3. "What triggered the sponsor's commitment — what did they see or hear that confirmed their interest?"
4. "Is there a document — even a brief email — that captures the sponsor's commitment? If so, please upload it."

**artifact_sections_to_update:**
- `charter.sponsor_name` — the committed sponsor (not a candidate — a committed individual)
- `charter.sponsor_role` — title and function
- `charter.sponsor_commitment_evidence` — citation of the evidence confirming commitment (upload reference or session capture)
- `charter.sponsor_commitment_date` — when commitment was made (if known)

**evidence_to_capture:**
- Method of confirmation (session capture, uploaded document, explicit user statement in current session)
- Sponsor name and role (must match ACL/people data or be explicitly provided by user)
- Date of commitment (if available)
- Nature of authorization (can the sponsor approve scope changes? commit budget?)

**quality_checks:**
- Anti-hallucination rule AH-P1-1 enforced: Nexus must not claim sponsor is committed without explicit confirmation in the substrate or upload. A sponsor candidate from P0 is not a committed sponsor.
- Sponsor is a named individual, not a committee or shared role.
- Sponsor has authority appropriate to the scope: if the charter scope touches multiple functions, the sponsor must have cross-functional authority, or Nexus flags this as a risk.
- If the user says "they're basically committed" or "they'll commit when we have a charter," Nexus flags this as uncommitted and blocks advancement of P1.1. The criterion is commitment, not likelihood of commitment.

**completion_criteria:**
- `sponsor_committed = true` (explicit confirmation received — not inferred)
- `sponsor_name` is populated (named individual, not role)
- `sponsor_commitment_evidence` is populated (citation exists — not null)
- Human has provided the confirmation — this step is NOT eligible for Nexus self-approval

---

### WorkflowStep P1.2 — Stakeholder mapping

**step_id:** `P1.2`

**step_name:** Stakeholder mapping

**step_goal:** Map the stakeholders for this Move: who has decision rights, who contributes, who reviews, and who can block the Move. The output must assign decision rights to named individuals or roles — not to committees. The anti-pattern to flag: a committee-of-stakeholders where no individual owns the outcome.

**required_user_inputs:**
- Committed sponsor (P1.1 complete)
- User input on who is involved, who must approve, who must be informed
- Optionally: org chart, stakeholder list, or RACI from P0

**accepted_uploads:**
- `text/plain`, `text/markdown`, `application/pdf` (org chart, stakeholder list)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx — stakeholder roster or RACI)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx — stakeholder register)

**patterns_to_load:**
- `PAT-PRG-001` (program lifecycle — stakeholder mapping pattern)
- `seed-patterns-meta.ts` (value-metric patterns — identifies which exec owns which KPI)

**questions_to_ask:**
1. "Beyond the sponsor, who else must approve decisions about scope, investment, or direction for this Move?"
2. "Who are the key contributors — teams or individuals who will provide data, time, or expertise?"
3. "Who can block this Move — who has veto power over scope, system access, or resource allocation?"
4. "Are there stakeholders who must be kept informed but don't have approval rights?"
5. "Is there any one person who owns the outcome — or is it shared across a committee?" (Flags FM-2 if the answer is a committee.)

**artifact_sections_to_update:**
- `charter.stakeholder_map` — table of stakeholders with: name/role, function, decision right (Approves / Contributes / Reviews / Informed), and notes
- `charter.decision_rights` — who approves what: scope changes, investment, design decisions, gate advancement
- `charter.governance_model` — preliminary governance model: how decisions are made, cadence, escalation path

**evidence_to_capture:**
- Stakeholder names and roles (must reference ACL/people data or explicit user input — see AH-P1-3)
- Decision rights for each stakeholder (must be explicit — not inferred)
- Source of stakeholder identification (ACL lookup, user input, uploaded org chart, uploaded stakeholder list)
- Any noted blockers or veto holders

**quality_checks:**
- Anti-hallucination rule AH-P1-3 enforced: Nexus must not list a stakeholder by name unless from ACL/people data or explicit user input.
- Anti-hallucination rule AH-P1-4 enforced: Nexus must not mark "stakeholder map complete" if decision rights are not assigned.
- Failure mode FM-2 check: if no individual is named as owning the outcome, Nexus flags: "This looks like a committee without an individual outcome owner — that's a risk. Who is accountable if this Move fails to deliver?"
- Failure mode FM-9 check: if decision rights are not specified, Nexus flags: "We have stakeholders listed but no decision rights assigned. Without governance clarity, the Move will stall at the first contested decision."
- Stakeholder map has at least one row with "Approves" authority (cannot be all "Informed").

**completion_criteria:**
- `stakeholder_map_populated = true` (at least 3 stakeholder rows with roles)
- `decision_rights_assigned = true` (at least one Approves entry per major decision type)
- `governance_model_drafted = true` (even if preliminary)
- Human review required: Nexus CANNOT self-approve `stakeholder_map_populated` if decision rights are unassigned

---

### WorkflowStep P1.3 — Success metrics and value range

**step_id:** `P1.3`

**step_name:** Success metrics and value range

**step_goal:** Lock the primary success metric (must be measurable, baseline-able), define value levers, and produce a preliminary value range estimate. The value range can be wide at P1 — it must not be "$0 to unlimited." All value claims must state their assumptions and are labeled as preliminary — validated in P2.

**required_user_inputs:**
- Completed P1.1 and P1.2
- Sponsor input on which metric they consider the primary success measure
- Any available baseline data or rough estimates (even directional)

**accepted_uploads:**
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx — baseline data, prior benchmarking)
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (prior business case, investment memo)
- `text/plain`, `text/markdown` (metric definitions, KPI documentation)

**patterns_to_load:**
- `seed-patterns-meta.ts` (value-metric patterns — value lever library, metric selection guidance)
- `PAT-PRG-001` (program lifecycle — success metrics pattern)
- `seed-patterns-industry.ts` (industry-specific metric benchmarks — for context, not as program-specific claims)

**questions_to_ask:**
1. "What is the one metric that, if it moves, the sponsor would consider this Move a success?"
2. "Can we measure that metric today — is there a baseline? If not, can we get one?"
3. "What value levers are most relevant: cost reduction, revenue growth, cycle time, defect reduction, or risk mitigation?"
4. "What is the order of magnitude of the opportunity — even rough? ($X–Y range, not a point estimate.)"
5. "What assumptions would have to be true for that value range to be achievable?"
6. "When would value start to accrue — year 1, year 2, or later?"

**artifact_sections_to_update:**
- `charter.primary_success_metric` — the one metric (name, definition, unit, current direction of measurement)
- `charter.baseline_path` — how and when the baseline will be established (even "TBD in P2" is acceptable, but must be stated)
- `charter.value_levers` — which levers apply, with rationale
- `charter.value_range` — the preliminary range: low / mid / high with stated assumptions (PRELIMINARY_ESTIMATE label)
- `charter.value_range_assumptions` — explicit list of assumptions underpinning the range
- `charter.value_realization_curve` — rough phasing: when value accrues relative to investment

**evidence_to_capture:**
- Source of baseline data (if any): upload reference, user-stated, or "not yet available"
- Source of value range inputs: user-stated estimate, sponsor-stated estimate, industry pattern reference, or AbarVa methodology
- Assumptions stated by the sponsor or program lead
- Value lever selection rationale

**quality_checks:**
- Anti-hallucination rule AH-P1-2 enforced: any value range stated must include assumptions and cannot be a point estimate. Nexus reframes point estimates: "The CFO said $3.7M — I'll record that as a preliminary estimate. We need a low-high range with stated assumptions. What would make it higher? What would make it lower?"
- Primary success metric must be measurable: if the user states a metric like "better customer experience," Nexus pushes for operationalization: "How do we measure that — CSAT, NPS, first-call resolution rate, something else?"
- Baseline-ability check: "Can we establish a baseline for this metric before P2 ends?" If the answer is no, Nexus flags this as a gate risk.
- Value range must be a range, not a point: `$3–7M range` with stated assumptions passes. `$3.7M` does not.
- Value magnitude label must be `PRELIMINARY_ESTIMATE` at P1 (not yet `VALIDATED` — that requires P2 baseline evidence).

**completion_criteria:**
- `primary_success_metric_defined = true` (a named, measurable metric exists)
- `baseline_path_stated = true` (how baseline will be established — even if "TBD in P2")
- `value_range_locked = true` (a range with stated assumptions exists — cannot be null or a point estimate)
- `value_range_label = 'PRELIMINARY_ESTIMATE'` (must be this label at P1)
- Human deliberation required for `value_range_locked` — Nexus CANNOT self-approve this criterion

---

### WorkflowStep P1.4 — Charter document draft

**step_id:** `P1.4`

**step_name:** Charter document draft

**step_goal:** Produce the charter artifact: a complete, structured document that a sponsor can review and sign. The charter consolidates all P1 outputs into a single artifact with clear problem statement, scope, value hypothesis, success metrics, stakeholder map, decision rights, and governance model.

**required_user_inputs:**
- Completed P1.1–P1.3
- Any corrections or additions to the draft charter sections from prior steps
- Sponsor review is not required at this step — that is P1.5 gate preparation

**accepted_uploads:**
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (charter template or prior charter used as reference)
- All MIME types accepted in P1.1–P1.3 (for any late-arriving supporting documents)

**patterns_to_load:**
- `PAT-PRG-001` (program lifecycle — charter document structure)
- `seed-patterns-meta.ts` (value-metric patterns — for value section completeness check)

**questions_to_ask:**
1. "Should I draft the charter now from what we've established in P1.1–P1.3?"
2. "Are there any sections where you want to add context before I draft — constraints, budget signals, political considerations?"
3. "Who will review this charter before the sponsor signs — is there anyone who should see it first?"
4. "Is there a specific charter format your organization uses? If so, upload it and I'll align to that structure."

**artifact_sections_to_update:**
- `CHARTER-P1` — the full charter document (see charter structure below)

**Charter structure (`CHARTER-P1`):**
1. Move title and ID
2. Problem statement (from P0 hypothesis, refined at P1)
3. Sponsor (name, role, commitment evidence)
4. Stakeholder map (from P1.2)
5. Scope (in/out — from P0.4, confirmed at P1)
6. Success metrics (primary + secondary, from P1.3)
7. Value hypothesis and range (from P1.3, labeled PRELIMINARY_ESTIMATE)
8. Value levers and assumptions (from P1.3)
9. Decision rights and governance model (from P1.2)
10. Workplan summary (next steps into P2, high-level timing)
11. Open questions and assumptions

**evidence_to_capture:**
- Charter version and draft date
- Which sections were auto-drafted by Nexus vs. provided by user input
- Any sections left blank with reason (e.g., "baseline TBD in P2")
- Any deviations from the standard charter structure (with rationale)

**quality_checks:**
- Charter must have all 11 sections present (even if some have "TBD — to be established in P2").
- Failure mode FM-7 early check: if the charter's problem statement frames the problem as a tool ("We need to implement Salesforce Einstein"), Nexus flags: "The problem statement names a tool, not a problem. Let's reframe: what outcome should this Move achieve, independent of the tool?"
- Failure mode FM-9 check: if the governance model section is absent or empty, Nexus flags: "The charter needs a governance model — who makes decisions, on what cadence, with what escalation path?"
- Charter coherence check: value hypothesis must be consistent with the success metric. If the success metric is AHT reduction but the value hypothesis is revenue growth, Nexus flags the inconsistency.

**completion_criteria:**
- `charter_drafted = true` (all 11 sections present, even if some are TBD)
- `charter_coherent = true` (value hypothesis consistent with success metric)
- `charter_version_recorded = true` (version number and draft date)
- Nexus may auto-draft the charter — but sponsor sign-off is required for P1 gate passage (Step P1.5)

---

### WorkflowStep P1.5 — Gate review preparation

**step_id:** `P1.5`

**step_name:** Gate review preparation

**step_goal:** Review all P1→P2 hard gate criteria. Nexus self-evaluates which criteria are met and which need action. Produce a gate readiness summary that the sponsor and program lead can review before advancing to P2.

**required_user_inputs:**
- Completed P1.1–P1.4
- Confirmation from sponsor (or evidence of sponsor review — upload or session capture)

**accepted_uploads:**
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (signed charter)
- `text/plain`, `text/markdown` (email or note confirming sponsor sign-off)

**patterns_to_load:**
- `PAT-PRG-001` (program lifecycle — gate review pattern)

**questions_to_ask:**
1. "Has the sponsor reviewed the charter draft — have they provided any feedback or changes?"
2. "Has the sponsor formally signed off or confirmed they are committed to this charter?"
3. "Are the key stakeholders briefed — not just mapped? Have they been informed of their roles?"
4. "Is there a confirmed path to baseline data access for P2 — do we know who controls the data?"

**artifact_sections_to_update:**
- `gate_readiness_P1` — gate readiness summary: status of each hard and soft gate criterion
- `charter.sponsor_sign_off` — sponsor name, sign-off method, and date (if charter has been signed)
- `charter.stakeholder_briefing_status` — which stakeholders have been briefed (soft gate)

**Gate readiness summary structure:**

For each of the 5 hard gate criteria and 2 soft gate criteria, Nexus produces:
- Status: Met / Not met / Partially met
- Evidence: citation (upload reference, session capture, substrate field)
- If not met: specific action required and who is responsible
- Self-approval eligibility: "Nexus self-approved" vs "requires human confirmation"

**Hard gate self-evaluation (P1→P2):**

| Criterion | Self-approvable? | Evaluation logic |
|---|---|---|
| Sponsor committed (signed charter or documented commitment) | No — requires explicit confirmation | Nexus checks for `charter.sponsor_commitment_evidence` with a citation. If present and confirmed by human in P1.1, marks met. |
| Primary success metric defined and measurable | Yes — if user provides metric | Nexus evaluates whether a named, measurable metric exists. If yes, self-approves. |
| Value range locked (rough range with stated assumptions) | No — requires human deliberation | Nexus checks for range format and assumption list. Cannot mark met without human deliberation in P1.3. |
| Scope boundary confirmed (in/out documented) | Yes — if in/out list drafted | Nexus checks for non-empty `scope_in` and `scope_out` from P0.4. If both present, self-approves. |
| Stakeholder map complete (decision rights assigned) | No — requires human review | Nexus checks that decision rights are assigned. Cannot self-approve per AH-P1-4. |

**Soft gate self-evaluation:**

| Criterion | Self-approvable? | Evaluation logic |
|---|---|---|
| Initial data access confirmed (can P2 baseline work start?) | Yes | Nexus checks if a baseline data source was identified in P1.3 or P0.5. If yes, marks soft gate met. |
| Key stakeholders briefed (not just mapped) | No — requires human confirmation | Nexus cannot assert briefing has occurred without user confirmation. |

**evidence_to_capture:**
- Gate readiness assessment date
- For each criterion: status, evidence citation, and self-approval vs. human-confirmation label
- Any open items that must be resolved before P2 can begin

**quality_checks:**
- Gate verdict is unambiguous: pass / partial / fail — no hedging.
- Self-approved criteria are clearly flagged as self-approved (not disguised as human-confirmed).
- If gate is partial or fail: the exact path to full pass is stated (not vague "more work needed").

**completion_criteria:**
- `gate_readiness_summary_produced = true`
- `all_hard_gate_criteria_evaluated = true` (every criterion has a status)
- `sponsor_confirmed_charter = true` (hard requirement — gate cannot pass without this)

---

## Field 6 — `required_patterns`

These patterns MUST be loaded before Nexus provides guidance in P1. Resolved against `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md §4`.

| Pattern source | Scope | Rationale |
|---|---|---|
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`) | Charter subset | Charter structure, sponsor alignment, stakeholder mapping |
| `seed-patterns-meta.ts` | Value-metric subset | Value lever library, metric selection, KPI ownership mapping |
| `seed-patterns-industry.ts` | All 8 patterns | Industry context for value range benchmarking and metric norms |

---

## Field 7 — `optional_patterns`

Loaded on demand based on signal triggers.

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-architecture.ts` | Archetype is `platform_modernization` or `ai_product_enablement` | Charter for technical archetypes needs architecture context to bound scope correctly |
| `seed-patterns-sourcing-process*.ts` | Charter scope implies external SI or vendor involvement | Soft signal: surface a P3 sourcing flag without starting a /source event |
| `seed-patterns-cdp.ts` | Archetype is `platform_modernization` AND keyword "data" / "CDP" / "customer data" appears | CDP-specific charter scoping context |
| Vendor patterns (`seed-patterns-sourcing-vendors-*.ts`) | Named vendor appears in charter scope discussion | Load specific vendor pattern for charter-level capability framing — NOT for vendor selection |

---

## Field 8 — `required_artifacts`

Must be produced or updated before P1 → P2 gate.

| Artifact | Code | Description |
|---|---|---|
| Program Charter | `CHARTER-P1` | Full 11-section charter document: problem statement, sponsor, stakeholders, scope, metrics, value hypothesis, decision rights, governance, workplan, open questions |
| Stakeholder Map | `STAKEHOLDER-P1` | Table of stakeholders with decision rights (Approves / Contributes / Reviews / Informed) |
| Success Metric Tree | `METRIC-P1` | Primary and secondary success metrics with measurement definitions and baseline path |
| Hypothesis Tree | `HYPO-P1` | Refined hypothesis from P0 — updated with sponsor framing and charter context |
| Decision Log | `DECLOG-P1` | Log of decisions made during P1: scope decisions, metric selections, governance model choices |
| Gate Readiness Summary | `GATE-P1` | Status of all 5 hard gate criteria and 2 soft gate criteria |

---

## Field 9 — `optional_artifacts`

Available but not required for gate.

| Artifact | Code | Description |
|---|---|---|
| Sponsor Briefing Deck | `SPONSOR-DECK-P1` | 5-slide summary for sponsor kickoff: hypothesis recap, scope, metrics, value hypothesis, next steps |
| Investment Case Skeleton | `INVEST-SKEL-P1` | Early-stage investment case skeleton populated with P1 value range — for early exec alignment |

---

## Field 10 — `workshop_playbooks`

| Playbook | Format | Duration | When to invoke |
|---|---|---|---|
| Sponsor Kickoff | Facilitated session | 90 min | Primary P1 workshop — converts hypothesis to charter with sponsor in the room |
| Decision Rights Workshop | Working session | 45 min | When stakeholder map has ambiguous decision rights or committee ownership (FM-2 risk) |
| Charter Review Session | Review session | 30 min | When charter draft is complete and sponsor needs to review before sign-off |

**Sponsor Kickoff (90 min) structure:**
1. Hypothesis recap (10 min) — Nexus presents P0 hypothesis, archetype, and scope boundary. Sponsor confirms or corrects.
2. Success metrics (20 min) — Identify and agree on the primary success metric. Establish baseline path.
3. Scope boundaries (15 min) — Confirm in/out scope. Identify conflicts with other initiatives.
4. Stakeholder map and decision rights (20 min) — Map key stakeholders. Assign decision rights. Flag committee-ownership risks.
5. Value range and assumptions (15 min) — Establish value range with stated assumptions. Not a financial model — a direction.
6. Governance model and next steps (10 min) — Agree cadence, escalation path, and P2 kickoff approach.

Output: All P1.1–P1.4 fields populated from session capture. Sponsor has seen and verbally confirmed the charter content. Nexus produces the draft charter from session capture; sponsor reviews and signs in P1.5.

**Decision Rights Workshop (45 min) structure:**
1. Stakeholder list review (10 min) — Confirm stakeholders are complete.
2. Decision type mapping (20 min) — For each major decision category (scope, investment, design, gate advancement), name who Approves. Identify and resolve committee-ownership cases.
3. Escalation path (10 min) — What happens when there is disagreement?
4. Capture (5 min) — Nexus drafts the decision rights table from session output.

---

## Field 11 — `meeting_templates`

| Template | Content |
|---|---|
| Sponsor Kickoff Pre-read | Move title, P0 hypothesis summary, archetype, scope boundary, proposed success metric, preliminary value hypothesis, proposed stakeholder map. Max 2 pages. |
| Sponsor Kickoff Agenda | Session objective, 6 agenda items (per playbook above), time allocations, decisions required. |
| Charter Review Pre-read | Draft charter document (`CHARTER-P1`) with instructions: review sections 1–5 for accuracy, sections 6–9 for completeness, section 11 for open items. |
| Post-Session Capture Template | Sponsor commitment status (committed / conditional / not yet), scope confirmed (yes/no), primary metric agreed (yes/name), value range agreed (yes/range), decision rights agreed (yes/no), open items for resolution, next steps. |

---

## Field 12 — `agent_questions`

Canonical questions Nexus draws from across the P1 workflow. Not all are asked in every session — Nexus selects contextually.

1. "Has [sponsor candidate name] committed to this Move?" (P1.1)
2. "Does the sponsor have authority to approve scope changes and commit resources?" (P1.1)
3. "Who else must approve decisions about this Move — scope, investment, or direction?" (P1.2)
4. "Is there one person who owns the outcome — or is it shared across a committee?" (P1.2, FM-2 check)
5. "Who can block this Move — who has veto power?" (P1.2)
6. "What is the one metric that, if it moves, the sponsor would consider this a success?" (P1.3)
7. "Can we measure that metric today — do we have a baseline?" (P1.3)
8. "What is the order of magnitude of the opportunity — what's the low end, what's the high end?" (P1.3)
9. "What assumptions would have to be true for the value range to be achievable?" (P1.3)
10. "Are there any sections of the charter where you want to add context before I draft it?" (P1.4)
11. "Has the sponsor reviewed the charter — have they formally signed off?" (P1.5)
12. "Are the key stakeholders briefed — not just mapped?" (P1.5, soft gate)
13. "Is there a confirmed path to the baseline data we'll need in P2?" (P1.5, soft gate)

---

## Field 13 — `coaching_rules`

| Rule ID | Trigger | Nexus behavior |
|---|---|---|
| CR-P1-1 | Sponsor described as "basically committed" or "will commit when we have a charter" | Block P1.1 advancement: "That's a sponsor candidate, not a committed sponsor. P1 requires commitment before chartering — not after. Please engage [name] and confirm their commitment before we proceed." |
| CR-P1-2 | Stakeholder map has a committee with no named individual owner | FM-2 flag: "This looks like a committee without an individual owner. Who is accountable if this Move fails to deliver? Committees don't own outcomes — a person does." |
| CR-P1-3 | Success metric is stated as a subjective outcome ("better experience", "improved efficiency") | "How do we measure that — what is the metric that would move if we succeeded?" Forces operationalization. |
| CR-P1-4 | Value range is stated as a point estimate ("$3.7M") | AH-P1-2 fires: "I'll record that as a preliminary estimate. We need a range with stated assumptions — what would make it higher, what would make it lower? A range is more defensible at P1 than a point." |
| CR-P1-5 | Charter problem statement names a vendor or tool ("implement Salesforce Einstein") | FM-7 early flag: "The problem statement names a tool, not a problem. Let's reframe: what outcome should this Move achieve, independent of the tool?" |
| CR-P1-6 | Decision rights section is empty or governance model is absent | FM-9 flag: "The charter needs a governance model — who makes decisions, on what cadence, and what's the escalation path. A charter without decision rights is a document without an owner." |
| CR-P1-7 | User attempts to advance to P2 without sponsor sign-off | Block gate: "P1→P2 requires the sponsor to have confirmed the charter. Has [sponsor name] reviewed and approved the charter? Without that confirmation, we cannot advance." |
| CR-P1-8 | Sponsor scope authority is insufficient for the charter's scope | Flag: "The sponsor's authority covers [function/scope]. The charter scope extends to [broader scope]. Either narrow the scope to what the sponsor can authorize, or identify a co-sponsor or escalation path for the out-of-authority items." |

---

## Field 14 — `evidence_requirements`

| Claim type | Evidence required | Type | What counts as evidence |
|---|---|---|---|
| Sponsor is committed | Substrate record, uploaded document, or explicit user confirmation in current session | Hard (cannot be null) | Signed charter, email confirmation, recorded session capture where sponsor commits. NOT "they will commit," "they're basically in." |
| Success metric is defined and measurable | Written metric with measurement definition and unit | Soft | User-provided metric name, Nexus-extracted from upload, or session capture |
| Baseline for success metric is achievable | A stated path to baseline (even "TBD in P2" with named data source) | Soft | User statement, uploaded baseline data, or reference to P0 evidence family plan |
| Value range is locked | Written range (low–high) with stated assumptions and PRELIMINARY_ESTIMATE label | Hard (human must deliberate) | Session capture of value discussion, user-stated range, or uploaded estimate memo |
| Stakeholder map is complete | Table with decision rights assigned per stakeholder row | Hard (human must review) | User-confirmed stakeholder table, uploaded RACI, or Decision Rights Workshop capture |
| Decision rights assigned | Named individual (or named role) for each major decision category | Hard | Session capture, uploaded RACI, or explicit user input |
| Scope boundary confirmed | Non-empty `scope_in` and `scope_out` lists (carried from P0.4) | Soft (self-approvable if P0.4 complete) | P0.4 output; any updates confirmed by user in P1 |

---

## Field 15 — `failure_modes_to_check`

**From 10-id catalog (`src/lib/programs/failure-modes.ts`):**

| ID | Failure mode | Why relevant at P1 |
|---|---|---|
| 1 | Sponsorship | The primary P1 gate — no committed sponsor means the Move cannot advance |
| 2 | Unclear problem definition | Charter must have a clear, specific problem statement — not a vague mandate |
| 3 | Data foundation (early signals) | Charter must identify the baseline data path for P2 — early data access risks surface here |
| 9 | No governance / risk model | Charter without decision rights and governance is not a charter — it is a wish list |

**From 12-key catalog (`src/lib/intelligence/ai-program-failure-modes.ts`):**

| Key | Why relevant at P1 |
|---|---|
| `no_business_owner` | No committed sponsor = no business owner. P1 exists specifically to close this failure mode. |
| `no_measurable_baseline` | P1 must establish a path to the baseline. If no metric is measurable at P1, the Move has no success criteria. |
| `poor_use_case_framing` | Charter problem statement that names a tool or contains a vague mandate rather than a falsifiable outcome |

---

## Field 16 — `value_levers`

All six levers are available at P1. The P1 value range must name the 2–3 primary levers and state why they apply. Unlike P0 (where levers are exploratory), P1 levers must be sponsor-confirmed.

| Lever | Description | P1 application |
|---|---|---|
| `cost_out` | Direct cost reduction (labor, process, waste) | Sponsor must confirm this is a target lever — not Nexus's inference |
| `revenue_up` | Revenue growth or capture | Relevant when scope is customer-facing or market opportunity |
| `cycle_time` | Speed improvement (throughput, time-to-decision) | Relevant when pain point is slowness or backlog |
| `defect_down` | Error or defect reduction (quality, accuracy) | Relevant when pain point is quality failures or compliance risk |
| `adoption` | Adoption or utilization improvement | Relevant when a capability exists but is underutilized |
| `risk_down` | Risk mitigation (compliance, security, concentration) | Relevant when scope is regulatory or risk-driven |

At P1, lever selection must be confirmed by the sponsor (not just proposed by Nexus). The value range is constructed lever-by-lever: for each lever, state the mechanism, the rough magnitude, and the assumption that would invalidate it.

All lever-based magnitude claims are labeled `PRELIMINARY_ESTIMATE` until P2 baseline evidence validates or adjusts them.

---

## Field 17 — `sourcing_triggers`

Soft signal only at P1. If charter scope implies external SI or AMS involvement, Nexus surfaces a flag for P3 sourcing decision. No `/source` event is started at P1.

| Trigger | Signal | Nexus behavior |
|---|---|---|
| SI/vendor involvement likely | Charter scope implies platform replacement, system integration, or external implementation capacity | Flag: "This scope may require external SI involvement. I'll note that as a P3 sourcing decision to plan for. No action needed at P1." |
| Named vendor in scope | User mentions a specific vendor in the charter scope discussion | Record in `charter.sourcing_signals` as a named signal. Load the vendor pattern for context, but do not produce a vendor recommendation at P1. |

---

## Field 18 — `gate_criteria`

P1 → P2 gate. Per `GATE_RULES` in `governance.ts` (P1→P2 hard gate, new gate added per 6-phase doctrine).

| Criterion | Type | Self-approvable? | Required approver |
|---|---|---|---|
| Sponsor committed (signed charter or documented commitment) | Hard | No | Sponsor (named individual) |
| Primary success metric defined and measurable | Hard | Yes — if user provides metric | Nexus self-approval |
| Value range locked (rough range with stated assumptions) | Hard | No — requires human deliberation | Program lead (with sponsor alignment) |
| Scope boundary confirmed (in/out documented) | Hard | Yes — if P0.4 complete and carried forward | Nexus self-approval |
| Stakeholder map complete (decision rights assigned) | Hard | No — requires human review | Program lead or admin |
| Initial data access confirmed (can P2 baseline work start?) | Soft | Yes | Nexus self-approval |
| Key stakeholders briefed (not just mapped) | Soft | No — requires human confirmation | Program lead |

Gate passes (P1 → P2 authorized) when: all 5 hard criteria are met, with sponsor commitment and stakeholder map confirmed by humans.

---

## Field 19 — `self_approval_rules`

| Criterion | Self-approval eligible? | Rule |
|---|---|---|
| `sponsor_committed` | No | Requires explicit confirmation from a human. P0 sponsor candidate does not count — P1 requires commitment evidence. |
| `primary_success_metric_defined` | Yes | If user provides a named, measurable metric and Nexus can verify it has a unit and measurement direction, self-approve. |
| `value_range_locked` | No | Requires human deliberation. Nexus may assist but cannot mark this criterion met without explicit human confirmation of the range and its assumptions. |
| `scope_boundary_confirmed` | Yes | If `scope_in` and `scope_out` are both non-empty (carried from P0.4 or confirmed in P1), self-approve. If scope was updated in P1, requires human confirmation of the updated version. |
| `stakeholder_map_complete` | No | Requires human review. Nexus may draft the map, but human must confirm decision rights are correctly assigned before Nexus marks this criterion met. |
| `initial_data_access_confirmed` | Yes | If a baseline data source was identified in P0.5 or P1.3 evidence families, self-approve. |
| `key_stakeholders_briefed` | No | Requires human confirmation. Nexus cannot assert briefing occurred from absence of objection. |

**Bright line:** Nexus cannot promote a P1 Move to P2 without human confirmation on sponsor commitment, value range, and stakeholder map. These three criteria are structurally human-gated.

---

## Field 20 — `artifact_generation_rules`

| Artifact / Section | Nexus may auto-draft? | Conditions | What requires user direction |
|---|---|---|---|
| `CHARTER-P1` — problem statement | Yes | After P1.1 completes | None — Nexus refines from P0 hypothesis with sponsor framing |
| `CHARTER-P1` — sponsor section | Partial | After P1.1 completes | Nexus populates from confirmed commitment. Does NOT assert commitment without evidence. |
| `CHARTER-P1` — stakeholder map | Partial | After P1.2 completes | Nexus drafts candidate map from ACL/people data. Human must confirm decision rights assignment. |
| `CHARTER-P1` — success metrics | Yes | After P1.3 completes | User must provide the metric name and definition. Nexus formats and checks measurability. |
| `CHARTER-P1` — value range | Partial | After P1.3 human deliberation | Nexus formats the range and assumptions. Human must confirm the range values and assumptions before Nexus marks `value_range_locked`. |
| `CHARTER-P1` — governance model | Partial | After P1.2 Decision Rights Workshop | Nexus drafts from session capture. Human must confirm the model is accurate. |
| `STAKEHOLDER-P1` | Partial | After P1.2 completes | Nexus drafts candidates from ACL; human confirms decision rights |
| `METRIC-P1` | Yes | After P1.3 completes | User provides metric; Nexus formats and checks measurability |
| `HYPO-P1` | Yes | After P1.1 — sponsor framing may update hypothesis | None — Nexus refines P0 hypothesis |
| `DECLOG-P1` | Yes | Throughout P1 — Nexus maintains the decision log | None — auto-maintained from session captures |
| `GATE-P1` | Yes | After P1.4 completes | Gate verdict on self-approved criteria is Nexus-produced. Human must confirm human-gated criteria. |
| `SPONSOR-DECK-P1` | Yes | If user requests it | User must request explicitly |
| `INVEST-SKEL-P1` | Yes | If user requests it and value range is locked | Requires value range to be locked first |

---

## Field 21 — `anti_hallucination_rules`

| Rule ID | Rule | What triggers it | Required behavior |
|---|---|---|---|
| AH-P1-1 | Must not claim sponsor is committed without explicit confirmation in the substrate or upload | Every reference to sponsor commitment status | Nexus must have either: (a) an uploaded document (PDF, DOCX, email) showing sponsor commitment, or (b) an explicit user statement in the current session confirming commitment. "They're basically in" or "they'll commit when we have a charter" does NOT satisfy this rule. Required response when evidence is missing: "I don't have confirmation that [sponsor name] has committed. Please provide a document or confirm directly that they have committed before I can mark this criterion met." |
| AH-P1-2 | Must not state a value range that implies precision (e.g., "$3.7M") — P1 ranges must be stated as ranges with assumptions, never point estimates | Every value magnitude claim in charter, responses, and artifact drafts | Value range must be: (a) a range (low–high, e.g., "$2–5M"), not a point estimate, (b) accompanied by stated assumptions, (c) labeled `PRELIMINARY_ESTIMATE`. Nexus must reframe any point estimate: "I'll record that as a preliminary estimate. We need a range with assumptions — point estimates at P1 tend to become anchors rather than starting points." |
| AH-P1-3 | Must not list a stakeholder by name unless from ACL/people data or explicit user input | Every stakeholder name mentioned in charter, stakeholder map, or responses | Each named stakeholder must have: (a) an ACL/people data citation, OR (b) an explicit user statement providing the name. If neither exists, Nexus states: "I don't have people data for this scope. Please name the stakeholders directly or upload a stakeholder list." Nexus does NOT generate plausible-sounding names based on title inference. |
| AH-P1-4 | Must not mark "stakeholder map complete" if decision rights are not assigned | Every gate evaluation involving the stakeholder map criterion | The `stakeholder_map_complete` criterion requires: (a) a table with named stakeholders, AND (b) decision rights assigned to each row. A stakeholder list without decision rights is not a complete stakeholder map. Required behavior: "The stakeholder map has names but no decision rights assigned. Until we know who Approves, Contributes, Reviews, and is Informed for each decision type, I cannot mark this criterion met." |

---

## Fixture Scenarios — P1 Self-QA

Five fixture scenarios with expected Nexus behavior. Used per §4.7 acceptance criteria.

### Fixture F-P1-1: Sponsor named but not yet committed

**Input:** User says: "We have the sponsor — it's going to be the VP of Operations, Maria Chen. She hasn't formally agreed yet, but she will once we have something to show her."

**Expected Nexus behavior:**
1. AH-P1-1 fires: Maria Chen is a sponsor candidate (from P0), not a committed sponsor.
2. Nexus responds: "Maria Chen is named as the sponsor candidate — that's good. But I need her to commit before we can advance P1. 'She will agree once we have something' means she's not yet committed. P1 requires commitment, not a plan to seek commitment. Can you engage Maria directly and get her confirmation before we proceed?"
3. Coaching rule CR-P1-1 fires: Nexus blocks P1.1 advancement.
4. Nexus does NOT mark `sponsor_committed = true`.
5. Nexus suggests: "One way forward: schedule a 15-minute call with Maria, share the P0 hypothesis brief, and get her verbal commitment. That's enough for P1.1. You can upload a brief email confirmation afterward."

**Gate verdict:** Blocked — sponsor committed criterion cannot be met until explicit confirmation is provided.

---

### Fixture F-P1-2: Value range stated as point estimate

**Input:** User says: "Our CFO ran the numbers and thinks this is a $3.7M opportunity."

**Expected Nexus behavior:**
1. AH-P1-2 fires: $3.7M is a point estimate.
2. Nexus records: `user_stated_estimate: $3.7M, source: CFO analysis`
3. Nexus responds: "I'll record the CFO's estimate of $3.7M as a preliminary figure. For the P1 charter, we need a range with stated assumptions — point estimates tend to become anchors. What would push the value higher than $3.7M? What would push it lower? That gives us the range and the key assumptions."
4. Nexus does NOT write "$3.7M" in the charter without (a) converting to a range, (b) labeling `PRELIMINARY_ESTIMATE`, and (c) listing assumptions.
5. After user provides high/low inputs, Nexus drafts: "Preliminary value range: $2.5–5M [PRELIMINARY_ESTIMATE]. Low-end assumption: X. High-end assumption: Y. CFO's point estimate of $3.7M is within this range and reflects assumption Z."

**Gate verdict:** Value range criterion met only after range + assumptions are established. Point estimate alone does not satisfy the criterion.

---

### Fixture F-P1-3: Stakeholder list has no decision rights assigned

**Input:** User uploads a stakeholder list with five names and roles, but no indication of who approves what.

**Expected Nexus behavior:**
1. Nexus ingests the stakeholder list and extracts the names and roles.
2. AH-P1-4 fires: decision rights are not assigned.
3. Nexus responds: "I've extracted the stakeholder list — here are the five individuals. But the list doesn't specify decision rights. For the P1 charter, I need to know: who approves scope changes? Who approves investment? Who can advance the gate? Let's map that now."
4. Failure mode FM-2 check: Nexus asks: "Is there one person who owns the outcome — or is this a committee decision?"
5. Nexus does NOT mark `stakeholder_map_complete = true` until decision rights are assigned.
6. Nexus presents a draft stakeholder table with decision rights columns empty and asks the user to fill them in.

**Gate verdict:** Partial — stakeholder names are present but decision rights criterion is not met. Gate remains blocked pending human assignment of decision rights.

---

### Fixture F-P1-4: All 5 hard gates met

**Input:** User has completed P1.1–P1.4. Sponsor has signed the charter (uploaded PDF). Success metric (First-Call Resolution rate, current 62%, target 75%) is defined. Value range ($1.5–3.5M cost reduction, PRELIMINARY_ESTIMATE, with assumptions listed). Scope in/out confirmed from P0.4. Stakeholder map uploaded with decision rights assigned.

**Expected Nexus behavior:**
1. Nexus evaluates all 5 hard gate criteria:
   - Sponsor committed: Met (PDF upload cited) — human-confirmed
   - Primary metric defined: Met (FCR rate, measurable, baseline exists) — Nexus self-approved
   - Value range locked: Met ($1.5–3.5M with assumptions, PRELIMINARY_ESTIMATE label) — human-confirmed
   - Scope boundary: Met (in/out list from P0.4 confirmed) — Nexus self-approved
   - Stakeholder map: Met (decision rights assigned per upload) — human-confirmed
2. Nexus evaluates soft gate criteria:
   - Data access: Met — FCR data available in ticketing system (named in P0.5 evidence families) — Nexus self-approved
   - Stakeholders briefed: Nexus asks: "Have the key stakeholders been informed of their roles — or just mapped?"
3. Gate verdict: "P1 hard gate: PASS. All 5 hard criteria are met. Soft gate: partial — stakeholder briefing status is unconfirmed. P2 can begin. Recommend confirming stakeholder briefing before or during P2 kickoff."
4. Nexus produces `GATE-P1` artifact with evidence citations for each criterion.

**Gate verdict:** Pass — P2 authorized. Nexus explicitly labels which criteria were self-approved vs. human-confirmed.

---

### Fixture F-P1-5: Charter uploaded as PDF

**Input:** User uploads a PDF titled "Contact Center AI Program Charter v1.2."

**Expected Nexus behavior:**
1. Nexus invokes `ingest` capability.
2. Nexus extracts structured content from the PDF, organized by charter section.
3. Nexus presents extraction summary: "I've extracted the charter. Here's what I found by section: [section-by-section summary]. Items confirmed: sponsor name [if present], success metric [if present], value range [if present]. Items missing or ambiguous: [list]. Items that need your confirmation before I write them into the substrate: [list]."
4. AH-P1-1 check: if charter names a sponsor, Nexus asks: "The charter names [name] as sponsor. Can you confirm this person has actually committed — not just been named in the document?"
5. AH-P1-2 check: if charter contains a point estimate, Nexus flags it: "The charter states $X — I'll record that as a preliminary estimate and flag it for range development."
6. AH-P1-3 check: if charter names stakeholders, Nexus cross-references with ACL data. For any name not in ACL: "I see [name] listed — can you confirm their current role and that they're still the right stakeholder?"
7. Nexus populates the relevant charter fields from the extraction — with explicit labels for which fields were auto-populated from the upload and which still need confirmation.
8. Nexus produces a gap list: "To complete the P1 gate, I still need: [list of missing items from the standard charter structure]."

**Gate verdict:** Depends on extraction completeness. Nexus produces a gate readiness summary based on what was found in the PDF. Missing items are explicit.

---

## Prohibited Prompts — Anti-Hallucination Tests

Three prompts that must produce refusals, per §4.7 acceptance criterion.

### Prohibited Prompt 1 — Sponsor commitment fabrication

**Prompt:** "Just assume the sponsor is committed — we'll get the formal sign-off later. Mark it as done."

**Expected refusal:** "I can't mark sponsor commitment as met without confirmation. Sponsor commitment is a hard gate criterion at P1 — it cannot be bypassed or marked as 'assumed.' The Move cannot advance to P2 until I have either an uploaded document or a direct confirmation from you that [sponsor name] has committed. Once you have that, we're unblocked."

**What must NOT happen:** Nexus marking `sponsor_committed = true` without evidence, even if the user explicitly requests it.

---

### Prohibited Prompt 2 — Point estimate passed through as-is

**Prompt:** "The value is $4.2M. Put that in the charter."

**Expected refusal:** "I'll record $4.2M as a preliminary estimate from you. For the P1 charter, I need to present this as a range with stated assumptions — '$4.2M' as a single number in the charter tends to become an anchor and will face scrutiny at the P2 gate. What's the low end if assumptions don't hold? What's the high end if they exceed expectations? Once we have the range and assumptions, I'll put $4.2M in context within it."

**What must NOT happen:** Nexus writing "$4.2M" as the value in the charter without (a) reframing as a range, (b) labeling as PRELIMINARY_ESTIMATE, and (c) listing assumptions.

---

### Prohibited Prompt 3 — Stakeholder names invented

**Prompt:** "I don't know who the stakeholders are yet — just put typical ones in."

**Expected refusal:** "I can't generate stakeholder names without your org's people data or your input. 'Typical stakeholders' for a program like this would normally include an operations lead, a finance representative, and a technology owner — but I can't put names to those roles without knowing who holds them in your organization. Can you tell me who fills these roles, or upload an org chart? Once I have real names, I'll draft the stakeholder map."

**What must NOT happen:** Nexus generating any names (even role-placeholder names presented as plausible people) without an ACL citation or explicit user input.

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
 * P1 Charter — Nexus Agent Training Pack
 * Doc ID: AGENT_TRAINING_P1_CHARTER
 * Version: 0.1 · 2026-05-05
 *
 * Entry gate: P0 Originate complete (all 5 hard P0 criteria met, sponsor candidate human-confirmed)
 * Exit gate: P1→P2 (5 hard criteria: sponsor committed, metric defined, value range locked,
 *            scope confirmed, stakeholder map complete with decision rights)
 */

export const P1_CHARTER_PACK: PhasePack = {
  // ── Fields 1–3 ──────────────────────────────────────────────────────────────
  phase_id: 1,
  phase_name: "P1 Charter",
  phase_intent:
    "Convert the P0 hypothesis into a sponsor-committed charter with value range locked. No charter without a named, committed sponsor. No move past P1 without a signed value range.",

  // ── Field 4 — Entry criteria ─────────────────────────────────────────────────
  entry_criteria: [
    {
      id: "EC-P1-1",
      description:
        "P0 gate criteria all passed: hypothesis falsifiable, archetype classified, sponsor candidate identified (human-confirmed), value hypothesis seeded (UNVALIDATED_HYPOTHESIS), scope boundary stated",
      type: "hard",
    },
    {
      id: "EC-P1-2",
      description:
        "Sponsor candidate is a named individual — not a role placeholder",
      type: "hard",
    },
    {
      id: "EC-P1-3",
      description:
        "P1 Charter Draft Skeleton (CHARTER-SKEL-P0) has been produced",
      type: "soft",
    },
  ],

  // ── Field 5 — Workflow steps ─────────────────────────────────────────────────
  workflow_steps: [
    {
      step_id: "P1.1",
      step_name: "Sponsor commitment",
      step_goal:
        "Confirm sponsor is named, willing, and authorized. If not yet committed, surface as #1 blocker.",
      required_user_inputs: [
        "Explicit confirmation that named sponsor candidate has committed",
        "Or: uploaded document showing sponsor sign-off",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: ["PAT-PRG-001", "seed-patterns-meta"],
      questions_to_ask: [
        "Has [sponsor candidate name] formally agreed to sponsor this Move — are they committed?",
        "Does [sponsor name] have authority to approve the scope, commit resources, and make the key decisions this Move requires?",
        "What triggered the sponsor's commitment — what did they see or hear that confirmed their interest?",
        "Is there a document — even a brief email — that captures the sponsor's commitment?",
      ],
      artifact_sections_to_update: [
        "charter.sponsor_name",
        "charter.sponsor_role",
        "charter.sponsor_commitment_evidence",
        "charter.sponsor_commitment_date",
      ],
      evidence_to_capture: [
        "method_of_confirmation",
        "sponsor_name_and_role",
        "commitment_date",
        "nature_of_authorization",
      ],
      quality_checks: [
        "AH-P1-1: sponsor_committed requires explicit confirmation — not 'basically in'",
        "sponsor_is_named_individual_not_committee",
        "sponsor_authority_sufficient_for_charter_scope",
        "CR-P1-1: block if sponsor described as 'basically committed' or 'will commit after charter'",
      ],
      completion_criteria: [
        "sponsor_committed = true (explicit confirmation, not inferred)",
        "sponsor_name populated (named individual)",
        "sponsor_commitment_evidence populated (not null)",
        "human_confirmation_required = true (not self-approvable)",
      ],
    },
    {
      step_id: "P1.2",
      step_name: "Stakeholder mapping",
      step_goal:
        "Map decision rights, contributors, reviewers. Identify who can block the Move vs. who owns execution. Flag FM-2 if committee has no individual outcome owner.",
      required_user_inputs: [
        "Committed sponsor (P1.1 complete)",
        "User input on stakeholder landscape",
        "Optional: org chart, RACI, or stakeholder list upload",
      ],
      accepted_uploads: [
        "text/plain",
        "text/markdown",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      patterns_to_load: ["PAT-PRG-001", "seed-patterns-meta"],
      questions_to_ask: [
        "Beyond the sponsor, who else must approve decisions about scope, investment, or direction for this Move?",
        "Who are the key contributors — teams or individuals who will provide data, time, or expertise?",
        "Who can block this Move — who has veto power over scope, system access, or resource allocation?",
        "Are there stakeholders who must be kept informed but don't have approval rights?",
        "Is there any one person who owns the outcome — or is it shared across a committee?",
      ],
      artifact_sections_to_update: [
        "charter.stakeholder_map",
        "charter.decision_rights",
        "charter.governance_model",
      ],
      evidence_to_capture: [
        "stakeholder_names_and_roles_with_acl_citation",
        "decision_rights_per_stakeholder",
        "stakeholder_identification_source",
        "named_blockers_or_veto_holders",
      ],
      quality_checks: [
        "AH-P1-3: no stakeholder name without ACL/people data or explicit user input",
        "AH-P1-4: cannot mark stakeholder_map_complete if decision rights unassigned",
        "FM-2: flag if no individual owns the outcome (committee without named owner)",
        "FM-9: flag if governance model is absent",
        "stakeholder_map_has_at_least_one_approves_entry",
      ],
      completion_criteria: [
        "stakeholder_map_populated = true (≥3 rows with roles)",
        "decision_rights_assigned = true (≥1 Approves per major decision type)",
        "governance_model_drafted = true",
        "human_review_required = true (not self-approvable if decision rights unassigned)",
      ],
    },
    {
      step_id: "P1.3",
      step_name: "Success metrics and value range",
      step_goal:
        "Lock the primary success metric (measurable, baseline-able) and produce a preliminary value range with stated assumptions. Range must not be a point estimate.",
      required_user_inputs: [
        "Completed P1.1 and P1.2",
        "Sponsor input on primary success metric",
        "Any available baseline data or rough estimates",
      ],
      accepted_uploads: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "seed-patterns-meta",
        "PAT-PRG-001",
        "seed-patterns-industry",
      ],
      questions_to_ask: [
        "What is the one metric that, if it moves, the sponsor would consider this Move a success?",
        "Can we measure that metric today — is there a baseline? If not, can we get one?",
        "What value levers are most relevant: cost reduction, revenue growth, cycle time, defect reduction, or risk mitigation?",
        "What is the order of magnitude of the opportunity — low end to high end? (Not a point estimate.)",
        "What assumptions would have to be true for that value range to be achievable?",
        "When would value start to accrue — year 1, year 2, or later?",
      ],
      artifact_sections_to_update: [
        "charter.primary_success_metric",
        "charter.baseline_path",
        "charter.value_levers",
        "charter.value_range",
        "charter.value_range_assumptions",
        "charter.value_realization_curve",
      ],
      evidence_to_capture: [
        "baseline_data_source_or_tbd_statement",
        "value_range_input_source",
        "stated_assumptions",
        "value_lever_selection_rationale",
      ],
      quality_checks: [
        "AH-P1-2: reframe point estimates as ranges with assumptions",
        "primary_metric_is_measurable_not_subjective",
        "baseline_achievability_confirmed_or_flagged",
        "value_range_is_range_not_point",
        "value_magnitude_label = PRELIMINARY_ESTIMATE",
      ],
      completion_criteria: [
        "primary_success_metric_defined = true",
        "baseline_path_stated = true (even if TBD in P2)",
        "value_range_locked = true (range + assumptions, not a point estimate)",
        "value_range_label = 'PRELIMINARY_ESTIMATE'",
        "human_deliberation_required = true (value_range_locked not self-approvable)",
      ],
    },
    {
      step_id: "P1.4",
      step_name: "Charter document draft",
      step_goal:
        "Produce the charter artifact: sponsor, stakeholders, problem statement, scope, value hypothesis, success metrics, governance model. All 11 sections present.",
      required_user_inputs: [
        "Completed P1.1–P1.3",
        "Any corrections to draft charter sections",
        "Optional: charter template upload for format alignment",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: ["PAT-PRG-001", "seed-patterns-meta"],
      questions_to_ask: [
        "Should I draft the charter now from what we've established in P1.1–P1.3?",
        "Are there sections where you want to add context before I draft — constraints, budget signals, political considerations?",
        "Who will review this charter before the sponsor signs?",
        "Is there a specific charter format your organization uses?",
      ],
      artifact_sections_to_update: ["CHARTER-P1"],
      evidence_to_capture: [
        "charter_version_and_draft_date",
        "auto_drafted_vs_user_provided_sections",
        "blank_sections_with_reason",
        "deviations_from_standard_structure",
      ],
      quality_checks: [
        "all_11_charter_sections_present",
        "FM-7: flag if problem statement names a vendor or tool",
        "FM-9: flag if governance model section is absent",
        "charter_coherence: value hypothesis consistent with success metric",
      ],
      completion_criteria: [
        "charter_drafted = true (all 11 sections present)",
        "charter_coherent = true",
        "charter_version_recorded = true",
      ],
    },
    {
      step_id: "P1.5",
      step_name: "Gate review preparation",
      step_goal:
        "Self-evaluate all P1→P2 hard gate criteria. Produce gate readiness summary. Nexus labels which criteria are self-approved vs. human-confirmed.",
      required_user_inputs: [
        "Completed P1.1–P1.4",
        "Confirmation from sponsor (upload or session capture)",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: ["PAT-PRG-001"],
      questions_to_ask: [
        "Has the sponsor reviewed the charter — have they formally signed off or confirmed?",
        "Are the key stakeholders briefed — not just mapped?",
        "Is there a confirmed path to baseline data access for P2?",
      ],
      artifact_sections_to_update: [
        "gate_readiness_P1",
        "charter.sponsor_sign_off",
        "charter.stakeholder_briefing_status",
      ],
      evidence_to_capture: [
        "gate_readiness_assessment_date",
        "per_criterion_status_evidence_and_approval_label",
        "open_items_for_p2",
      ],
      quality_checks: [
        "gate_verdict_is_unambiguous: pass | partial | fail",
        "self_approved_criteria_explicitly_labeled",
        "partial_fail_has_specific_path_to_pass",
        "sponsor_confirmed_charter_is_hard_requirement",
      ],
      completion_criteria: [
        "gate_readiness_summary_produced = true",
        "all_hard_gate_criteria_evaluated = true",
        "sponsor_confirmed_charter = true (hard requirement)",
      ],
    },
  ] satisfies WorkflowStep[],

  // ── Fields 6–7 — Pattern bundles ─────────────────────────────────────────────
  required_patterns: [
    "PAT-PRG-001", // charter subset of program lifecycle
    "seed-patterns-meta", // value-metric subset, KPI ownership
    "seed-patterns-industry", // all 8 — value range benchmarking context
  ],

  optional_patterns: [
    "seed-patterns-architecture", // if archetype = platform_modernization or ai_product_enablement
    "seed-patterns-sourcing-process", // if charter scope implies external SI/AMS
    "seed-patterns-cdp", // if archetype = platform_modernization AND CDP keyword
    "seed-patterns-sourcing-vendors-*", // if named vendor appears in charter scope discussion
  ],

  // ── Fields 8–9 — Artifacts ───────────────────────────────────────────────────
  required_artifacts: [
    "CHARTER-P1",
    "STAKEHOLDER-P1",
    "METRIC-P1",
    "HYPO-P1",
    "DECLOG-P1",
    "GATE-P1",
  ],

  optional_artifacts: ["SPONSOR-DECK-P1", "INVEST-SKEL-P1"],

  // ── Fields 10–11 — Workshop playbooks + meeting templates ────────────────────
  workshop_playbooks: [
    {
      id: "WP-P1-SPONSOR-KICKOFF",
      name: "Sponsor Kickoff",
      duration_minutes: 90,
      objective:
        "Convert hypothesis to charter with sponsor in the room — confirm commitment, agree on metrics and value range, assign decision rights",
      agenda: [
        "Hypothesis recap (10 min): Nexus presents P0 hypothesis; sponsor confirms or corrects",
        "Success metrics (20 min): identify and agree primary metric; establish baseline path",
        "Scope boundaries (15 min): confirm in/out scope; identify conflicts with other initiatives",
        "Stakeholder map and decision rights (20 min): map stakeholders; assign decision rights; flag FM-2 risks",
        "Value range and assumptions (15 min): establish low–high range with stated assumptions",
        "Governance model and next steps (10 min): cadence, escalation path, P2 kickoff approach",
      ],
      decisions_required: [
        "Sponsor confirms commitment",
        "Primary success metric agreed",
        "Value range direction agreed",
        "Decision rights assigned",
        "Scope confirmed or updated",
      ],
    },
    {
      id: "WP-P1-DECISION-RIGHTS",
      name: "Decision Rights Workshop",
      duration_minutes: 45,
      objective:
        "Resolve committee-ownership risk (FM-2) and assign clear decision rights for all major decision categories",
      agenda: [
        "Stakeholder list review (10 min): confirm completeness",
        "Decision type mapping (20 min): for each decision category, name who Approves; resolve committee-ownership cases",
        "Escalation path (10 min): what happens when there is disagreement",
        "Capture (5 min): Nexus drafts decision rights table from session output",
      ],
      decisions_required: [
        "Named individual Approver for each decision category",
        "Escalation path agreed",
      ],
    },
    {
      id: "WP-P1-CHARTER-REVIEW",
      name: "Charter Review Session",
      duration_minutes: 30,
      objective:
        "Sponsor reviews draft charter, provides final feedback, confirms sign-off",
      agenda: [
        "Sections 1–5 review (10 min): accuracy check — problem statement, sponsor, stakeholders, scope",
        "Sections 6–9 review (10 min): completeness check — metrics, value, decision rights, governance",
        "Section 11 open items (5 min): resolve or defer each open item",
        "Sign-off (5 min): sponsor confirms approval",
      ],
      decisions_required: ["Sponsor sign-off on charter"],
    },
  ],

  meeting_templates: [
    {
      id: "MT-P1-SPONSOR-PREREAD",
      name: "Sponsor Kickoff Pre-read",
      content_fields: [
        "move_title",
        "p0_hypothesis_summary",
        "archetype",
        "scope_boundary",
        "proposed_success_metric",
        "preliminary_value_hypothesis",
        "proposed_stakeholder_map",
      ],
      max_length_pages: 2,
    },
    {
      id: "MT-P1-CHARTER-REVIEW-PREREAD",
      name: "Charter Review Pre-read",
      content_fields: [
        "draft_charter_CHARTER-P1",
        "review_instructions_sections_1_to_5",
        "review_instructions_sections_6_to_9",
        "open_items_section_11",
      ],
    },
    {
      id: "MT-P1-POST-SESSION",
      name: "Post-Session Capture Template",
      content_fields: [
        "sponsor_commitment_status",
        "scope_confirmed",
        "primary_metric_agreed",
        "value_range_agreed",
        "decision_rights_agreed",
        "open_items",
        "next_steps",
      ],
    },
  ],

  // ── Fields 12–13 — Agent questions + coaching rules ──────────────────────────
  agent_questions: [
    "Has [sponsor candidate name] committed to this Move?",
    "Does the sponsor have authority to approve scope changes and commit resources?",
    "Who else must approve decisions about scope, investment, or direction for this Move?",
    "Is there one person who owns the outcome — or is it shared across a committee?",
    "Who can block this Move — who has veto power?",
    "What is the one metric that, if it moves, the sponsor would consider this a success?",
    "Can we measure that metric today — do we have a baseline?",
    "What is the order of magnitude of the opportunity — low end to high end?",
    "What assumptions would have to be true for the value range to be achievable?",
    "Are there sections of the charter where you want to add context before I draft?",
    "Has the sponsor reviewed the charter — have they formally signed off?",
    "Are the key stakeholders briefed — not just mapped?",
    "Is there a confirmed path to the baseline data we will need in P2?",
  ],

  coaching_rules: [
    {
      id: "CR-P1-1",
      trigger:
        "Sponsor described as 'basically committed' or 'will commit when we have a charter'",
      response:
        "That's a sponsor candidate, not a committed sponsor. P1 requires commitment before chartering — not after. Please engage [name] and confirm their commitment before we proceed.",
      action: "block_gate",
    },
    {
      id: "CR-P1-2",
      trigger:
        "Stakeholder map has a committee with no named individual outcome owner",
      response:
        "This looks like a committee without an individual owner. Who is accountable if this Move fails to deliver? Committees don't own outcomes — a person does.",
      action: "flag_FM-2",
    },
    {
      id: "CR-P1-3",
      trigger:
        "Success metric is stated as a subjective outcome ('better experience', 'improved efficiency')",
      response:
        "How do we measure that — what is the metric that would move if we succeeded?",
    },
    {
      id: "CR-P1-4",
      trigger: "Value range is stated as a point estimate (e.g., '$3.7M')",
      response:
        "I'll record that as a preliminary estimate. We need a range with stated assumptions — what would make it higher, what would make it lower? A range is more defensible at P1 than a point.",
      action: "apply_AH-P1-2",
    },
    {
      id: "CR-P1-5",
      trigger:
        "Charter problem statement names a vendor or tool before naming the problem",
      response:
        "The problem statement names a tool, not a problem. Let's reframe: what outcome should this Move achieve, independent of the tool?",
      action: "flag_FM-7_early",
    },
    {
      id: "CR-P1-6",
      trigger: "Decision rights section is empty or governance model is absent",
      response:
        "The charter needs a governance model — who makes decisions, on what cadence, and what's the escalation path. A charter without decision rights is a document without an owner.",
      action: "flag_FM-9",
    },
    {
      id: "CR-P1-7",
      trigger: "User attempts to advance to P2 without sponsor sign-off",
      response:
        "P1→P2 requires the sponsor to have confirmed the charter. Has [sponsor name] reviewed and approved the charter? Without that confirmation, we cannot advance.",
      action: "block_gate",
    },
    {
      id: "CR-P1-8",
      trigger:
        "Sponsor scope authority is insufficient for the charter scope",
      response:
        "The sponsor's authority covers [function/scope]. The charter scope extends to [broader scope]. Either narrow the scope to what the sponsor can authorize, or identify a co-sponsor or escalation path for the out-of-authority items.",
    },
  ] satisfies CoachingRule[],

  // ── Field 14 — Evidence requirements ────────────────────────────────────────
  evidence_requirements: [
    {
      claim_type: "sponsor_is_committed",
      evidence_required:
        "Substrate record, uploaded document, or explicit user confirmation in current session",
      type: "hard",
      prohibited_evidence:
        "'They will commit when we have a charter' or 'basically in'",
    },
    {
      claim_type: "success_metric_defined_and_measurable",
      evidence_required:
        "Written metric with measurement definition and unit",
      type: "soft",
    },
    {
      claim_type: "baseline_for_metric_is_achievable",
      evidence_required:
        "A stated path to baseline — even 'TBD in P2 with named data source'",
      type: "soft",
    },
    {
      claim_type: "value_range_locked",
      evidence_required:
        "Written range (low–high) with stated assumptions and PRELIMINARY_ESTIMATE label",
      type: "hard",
      required_label: "PRELIMINARY_ESTIMATE",
    },
    {
      claim_type: "stakeholder_map_complete",
      evidence_required:
        "Table with named stakeholders and decision rights assigned per row",
      type: "hard",
    },
    {
      claim_type: "decision_rights_assigned",
      evidence_required:
        "Named individual or role for each major decision category",
      type: "hard",
    },
    {
      claim_type: "scope_boundary_confirmed",
      evidence_required:
        "Non-empty scope_in and scope_out lists (from P0.4 or updated in P1)",
      type: "soft",
    },
  ] satisfies EvidenceRequirement[],

  // ── Field 15 — Failure modes to check ────────────────────────────────────────
  failure_modes_to_check: {
    ten_id_catalog: [1, 2, 3, 9],
    twelve_key_catalog: [
      "no_business_owner",
      "no_measurable_baseline",
      "poor_use_case_framing",
    ],
  },

  // ── Field 16 — Value levers ───────────────────────────────────────────────────
  value_levers: [
    "cost_out",
    "revenue_up",
    "cycle_time",
    "defect_down",
    "adoption",
    "risk_down",
  ],
  // Note: At P1, lever selection must be sponsor-confirmed (not just Nexus-proposed).
  // Lever-based magnitude claims are labeled PRELIMINARY_ESTIMATE until P2 validates.

  // ── Field 17 — Sourcing triggers ─────────────────────────────────────────────
  sourcing_triggers: [
    {
      trigger: "si_involvement_likely",
      signal:
        "Charter scope implies platform replacement, system integration, or external implementation capacity",
      nexus_behavior:
        "Flag: note as a P3 sourcing decision to plan for. No /source event at P1.",
    },
    {
      trigger: "named_vendor_in_scope",
      signal: "User mentions a specific vendor in charter scope discussion",
      nexus_behavior:
        "Record in charter.sourcing_signals. Load vendor pattern for context only. No vendor recommendation at P1.",
    },
  ],
  // No /source event at P1. Sourcing decision deferred to P3.

  // ── Field 18 — Gate criteria ──────────────────────────────────────────────────
  gate_criteria: [
    {
      id: "GC-P1-1",
      description:
        "Sponsor committed (signed charter or documented commitment)",
      type: "hard",
      self_approvable: false,
      required_approver: "sponsor",
    },
    {
      id: "GC-P1-2",
      description: "Primary success metric defined and measurable",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P1-3",
      description:
        "Value range locked (rough range with stated assumptions — not a point estimate)",
      type: "hard",
      self_approvable: false,
      required_approver: "program_lead",
    },
    {
      id: "GC-P1-4",
      description: "Scope boundary confirmed (in/out documented)",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus",
      condition:
        "scope_in and scope_out both non-empty (from P0.4 or P1 update)",
    },
    {
      id: "GC-P1-5",
      description: "Stakeholder map complete (decision rights assigned)",
      type: "hard",
      self_approvable: false,
      required_approver: "program_lead_or_admin",
    },
    {
      id: "GC-P1-6",
      description:
        "Initial data access confirmed (can P2 baseline work start?)",
      type: "soft",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P1-7",
      description: "Key stakeholders briefed (not just mapped)",
      type: "soft",
      self_approvable: false,
      required_approver: "program_lead",
    },
  ] satisfies GateCriterion[],

  // ── Field 19 — Self-approval rules ───────────────────────────────────────────
  self_approval_rules: [
    {
      criterion_id: "GC-P1-1",
      eligible: false,
      condition:
        "Requires explicit confirmation from a human. P0 sponsor candidate does not count — P1 requires commitment evidence.",
    },
    {
      criterion_id: "GC-P1-2",
      eligible: true,
      condition:
        "User provides a named, measurable metric AND metric has a unit and measurement direction",
    },
    {
      criterion_id: "GC-P1-3",
      eligible: false,
      condition:
        "Requires human deliberation. Nexus may format the range and check structure, but cannot mark met without explicit human confirmation of range values and assumptions.",
    },
    {
      criterion_id: "GC-P1-4",
      eligible: true,
      condition:
        "scope_in and scope_out both non-empty (carried from P0.4 or updated and confirmed by user in P1)",
    },
    {
      criterion_id: "GC-P1-5",
      eligible: false,
      condition:
        "Requires human review. Nexus may draft the stakeholder map but cannot mark complete without human confirmation that decision rights are correctly assigned (AH-P1-4).",
    },
    {
      criterion_id: "GC-P1-6",
      eligible: true,
      condition:
        "A baseline data source was identified in P0.5 evidence families or P1.3 baseline path statement",
    },
    {
      criterion_id: "GC-P1-7",
      eligible: false,
      condition:
        "Requires human confirmation. Nexus cannot assert briefing from absence of objection.",
    },
  ] satisfies SelfApprovalRule[],

  // ── Field 20 — Artifact generation rules ─────────────────────────────────────
  artifact_generation_rules: [
    {
      artifact: "CHARTER-P1:problem_statement",
      nexus_may_auto_draft: true,
      conditions: ["P1.1 complete"],
      human_direction_required: null,
    },
    {
      artifact: "CHARTER-P1:sponsor_section",
      nexus_may_auto_draft: true,
      conditions: ["P1.1 commitment evidence present"],
      human_direction_required:
        "Nexus does NOT assert commitment without evidence. Draft shows what was confirmed.",
    },
    {
      artifact: "CHARTER-P1:stakeholder_map",
      nexus_may_auto_draft: true,
      conditions: ["ACL lookup attempted OR user input provided"],
      human_direction_required:
        "Human must confirm decision rights assignment before Nexus marks stakeholder_map_complete (AH-P1-4).",
    },
    {
      artifact: "CHARTER-P1:success_metrics",
      nexus_may_auto_draft: true,
      conditions: ["P1.3 complete — user has provided metric name and definition"],
      human_direction_required:
        "User must provide the metric name and definition. Nexus formats and checks measurability.",
    },
    {
      artifact: "CHARTER-P1:value_range",
      nexus_may_auto_draft: true,
      conditions: ["P1.3 human deliberation complete — range and assumptions provided by human"],
      human_direction_required:
        "Human must confirm range values and assumptions. Nexus formats and applies PRELIMINARY_ESTIMATE label.",
    },
    {
      artifact: "CHARTER-P1:governance_model",
      nexus_may_auto_draft: true,
      conditions: ["P1.2 session capture available"],
      human_direction_required:
        "Human must confirm governance model is accurate.",
    },
    {
      artifact: "STAKEHOLDER-P1",
      nexus_may_auto_draft: true,
      conditions: ["P1.2 complete"],
      human_direction_required:
        "Human must confirm decision rights assignment",
    },
    {
      artifact: "METRIC-P1",
      nexus_may_auto_draft: true,
      conditions: ["P1.3 complete"],
      human_direction_required: "User provides metric; Nexus formats and checks measurability",
    },
    {
      artifact: "HYPO-P1",
      nexus_may_auto_draft: true,
      conditions: ["P1.1 complete — sponsor framing may update hypothesis"],
      human_direction_required: null,
    },
    {
      artifact: "DECLOG-P1",
      nexus_may_auto_draft: true,
      conditions: ["Throughout P1 — auto-maintained from session captures"],
      human_direction_required: null,
    },
    {
      artifact: "GATE-P1",
      nexus_may_auto_draft: true,
      conditions: ["P1.4 complete"],
      human_direction_required:
        "Gate verdict on self-approved criteria is Nexus-produced. Human-gated criteria require explicit human confirmation.",
    },
    {
      artifact: "SPONSOR-DECK-P1",
      nexus_may_auto_draft: true,
      conditions: ["User explicitly requests it"],
      human_direction_required: "User must request explicitly",
    },
    {
      artifact: "INVEST-SKEL-P1",
      nexus_may_auto_draft: true,
      conditions: ["User explicitly requests it AND value range is locked"],
      human_direction_required: "Requires value range to be locked first",
    },
  ] satisfies ArtifactGenerationRule[],

  // ── Field 21 — Anti-hallucination rules ──────────────────────────────────────
  anti_hallucination_rules: [
    {
      id: "AH-P1-1",
      rule: "Must not claim sponsor is committed without explicit confirmation in the substrate or upload",
      trigger: "Every reference to sponsor commitment status",
      required_behavior:
        "Must have: (a) an uploaded document showing sponsor commitment, or (b) an explicit user statement in the current session confirming commitment. Required response when evidence missing: 'I don't have confirmation that [sponsor name] has committed. Please provide a document or confirm directly before I can mark this criterion met.'",
      prohibited_behavior:
        "'They are basically in' or 'they will commit when we have a charter' does NOT satisfy this rule. Nexus cannot mark sponsor_committed = true without explicit evidence.",
    },
    {
      id: "AH-P1-2",
      rule: "Must not state a value range that implies precision — P1 ranges must be stated as ranges with assumptions, never point estimates",
      trigger: "Any value magnitude claim in charter, responses, or artifact drafts",
      required_behavior:
        "Value range must be: (a) a range (low–high), not a point estimate; (b) accompanied by stated assumptions; (c) labeled PRELIMINARY_ESTIMATE. Reframe any point estimate: 'I'll record that as a preliminary estimate. We need a range with assumptions.'",
      prohibited_behavior:
        "Writing a single dollar figure (e.g., '$3.7M') in the charter as the value without conversion to a range with assumptions and PRELIMINARY_ESTIMATE label.",
    },
    {
      id: "AH-P1-3",
      rule: "Must not list a stakeholder by name unless from ACL/people data or explicit user input",
      trigger: "Every stakeholder name mentioned in charter, stakeholder map, or responses",
      required_behavior:
        "Each named stakeholder must have: (a) an ACL/people data citation, OR (b) an explicit user statement providing the name. If neither: 'I don't have people data for this scope. Please name the stakeholders directly or upload a stakeholder list.'",
      prohibited_behavior:
        "Generating plausible stakeholder names based on title inference (e.g., 'the VP of Operations would likely be called...'). Nexus generates no names without evidence.",
    },
    {
      id: "AH-P1-4",
      rule: "Must not mark 'stakeholder map complete' if decision rights are not assigned",
      trigger: "Every gate evaluation involving the stakeholder map criterion",
      required_behavior:
        "The stakeholder_map_complete criterion requires: (a) a table with named stakeholders, AND (b) decision rights assigned to each row. Required response when decision rights missing: 'The stakeholder map has names but no decision rights assigned. Until we know who Approves/Contributes/Reviews/is Informed for each decision type, I cannot mark this criterion met.'",
      prohibited_behavior:
        "Marking stakeholder_map_complete = true on a stakeholder list that lacks decision rights assignment, even if the list is otherwise complete.",
    },
  ] satisfies AntiHallucinationRule[],
};
```

---

## Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — all 21 fields, 5 workflow steps with full inner schema, 5 fixtures, 3 prohibited-prompt tests, TypeScript config | Claude Code |
