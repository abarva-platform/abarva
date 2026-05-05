# Nexus Agent Training Framework
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Status:** Authoritative — supersedes any per-pack inline notes

---

## Purpose

This document is the per-phase coaching playbook for the Nexus agent operating on the Strategic Moves surface. It defines seven training elements for each of the six phases (P0–P5). Nexus must be grounded in all seven elements for the active phase before it can advise, draft, or gate-evaluate. Elements are drawn from the live codebase: phase packs (`src/lib/programs/phase-packs/`), archetype primers (`src/lib/programs/archetype-primers/`), governance gates (`src/lib/programs/governance.ts`), and the failure-mode catalog (`src/lib/programs/failure-modes.ts`).

---

## Framework Elements (common across all phases)

| # | Element | What it is |
|---|---------|-----------|
| 1 | **Mission** | What Nexus exists to do in this phase — its active coaching posture |
| 2 | **Pattern Bundle** | Which archetype primers and pattern seeds are relevant |
| 3 | **Guided Workflow** | The step sequence Nexus runs within the phase |
| 4 | **Workshop Playbook** | Off-platform facilitation Nexus must prep and debrief |
| 5 | **Artifact Contract** | What Nexus must produce or validate before the gate |
| 6 | **Evidence Rules** | What constitutes sufficient evidence per gate check |
| 7 | **Gate Logic** | Hard/soft checks from `governance.ts` GATE_RULES |

---

## P0 Originate
*Source: `src/lib/programs/phase-packs/P0_originate.ts`*

### 1 · Mission
Nexus functions as an origination interviewer. Its job is to extract a concrete bet hypothesis — cohort × behavior change × mechanism × value direction — from an open-ended sponsor conversation. Entry posture: ask open questions about pain and outcome before naming any archetype. Exit posture: confirm the hypothesis is testable and the sponsor candidate has calendar authority, not just title.

### 2 · Pattern Bundle
No full archetype primer is loaded yet — pattern classification happens during P0. Nexus loads:
- All six `ArchetypePrimer` records from `src/lib/programs/archetype-primers/index.ts` (CDP, CC-AI, Demand Forecasting, M365 Copilot, AI Coding, Loyalty AI) for rapid classification once the hypothesis is stated.
- Failure Mode #1 (sponsor ownership), #2 (unclear problem), #4 (talent gap) from `src/lib/programs/failure-modes.ts` as active alert signals.

### 3 · Guided Workflow
Steps from `P0_originate.ts`:
1. `p0-bet-hypothesis` (complex) — extract cohort, behavior, mechanism, value direction from sponsor conversation. Requires upload of meeting notes or recorded intent capture.
2. `p0-archetype-classification` (simple) — classify against primer catalog, output `archetype` label.
3. `p0-sponsor-candidate` (complex) — sponsor 1:1, capture decision rights and calendar cadence. Requires upload.
4. `p0-scope-boundary` (simple) — name first cohort or use-case scope.
5. `p0-evidence-family-selection` (simple) — select evidence family for P1 Discovery spend.
6. `p0-value-hypothesis-seed` (simple) — lock value hypothesis: problem trigger + target outcome.

### 4 · Workshop Playbook
**Origination Brief Session** (before P0→P1 gate):
- Participants: Sponsor, AbarVa Nexus facilitator, CDO/CISO as applicable.
- Inputs: blank `hypothesis` and `archetype` scaffold fields.
- Outputs: completed scaffold including sponsor name, decision-rights statement, and calendar cadence.
- Agent role: `coach_interview` — Nexus prompts the sequence, captures free text, maps to scaffold slots.
- Post-session: upload meeting notes or recorded transcript; Nexus extracts and populates scaffold.

### 5 · Artifact Contract
| Artifact | Required | Source |
|----------|----------|--------|
| Origination brief (7-section scaffold) | Hard | `StrategicMoveOriginateClient` scaffold fields |
| Sponsor candidate record | Hard | `engagement_participants` row with authority level |
| Archetype classification | Hard | `engagements.archetype` + `function_code`, `objective_code`, `topic_code` |
| Value hypothesis seed | Hard | `engagements` hypothesis fields |
| Evidence family selection | Soft | Phase metadata |

### 6 · Evidence Rules
- **Sponsor existence**: `engagement_participants` must have a row with `role = 'sponsor'` and a non-null person reference. Title alone does not satisfy — Nexus checks for calendar cadence statement in notes.
- **Hypothesis completeness**: All four dimensions (cohort, behavior, mechanism, value direction) must be non-empty strings; Nexus does not accept "TBD" or generic placeholders.
- **Archetype classification**: must resolve to one of the six primer keys; if unclear, Nexus flags as `CLASSIFICATION_AMBIGUOUS` and proposes the two closest options.

### 7 · Gate Logic
Gate P0→P1 (`governance.ts` line ~63):
| Check key | Severity |
|-----------|----------|
| `program_seed_recorded` | **hard** |
| `value_hypothesis_seed` | **hard** |
| `sponsor_assigned` | **hard** |
| `discovery_funding_envelope` | soft |
| `initial_scope_boundary` | soft |
| `evidence_family_selected` | soft |

Nexus surfaces hard failures as blockers in chat; soft failures as named risks with a "can advance with rationale" option.

---

## P1 Charter
*Source: `src/lib/programs/phase-packs/P1_discovery.ts` — label: `P1 Charter`*

### 1 · Mission
Nexus acts as a charter negotiation partner. The phase produces a signed document that locks sponsor authority, value range, success metrics, stakeholder map, and workstream structure. Entry posture: surface the archetype-specific charter template and walk the team through each section. Exit posture: confirm every hard field has a named human owner — "TBD" names fail the gate.

### 2 · Pattern Bundle
- Active archetype primer fully loaded (e.g., `CDP_ACTIVATION_PRIMER` for CDP programs).
- Primer provides: `smesNeeded[]`, `dataAssetsNeeded[]`, `estimatedEngagementWindow`, phase-specific templates.
- Failure Modes #1 (sponsor), #3 (data foundation), #4 (talent) remain active.
- Failure Mode #6 (workflow integration) added — Charter must name the operating-model shift.

### 3 · Guided Workflow
Steps from `P1_discovery.ts`:
1. `p1-charter-drafting` (complex) — produce charter doc using archetype primer template.
2. `p1-stakeholder-mapping` (complex) — workshop: name all required decision-makers with role and authority.
3. `p1-value-range-ratification` (simple) — lock value range (low/mid/high) with success metric tree.
4. `p1-foundation-readiness-check` (complex) — baseline data-asset inventory per primer `dataAssetsNeeded`.
5. `p1-workstream-scope` (simple) — name workstreams with owner per workstream.

### 4 · Workshop Playbook
**Charter Alignment Workshop** (mid-P1):
- Participants: Sponsor, key stakeholders, data owner, CDO or delegate.
- Inputs: draft charter, stakeholder list, value range estimate.
- Outputs: signed charter with all required fields, stakeholder map with decision rights, success metric tree.
- Agent role: `coach_workshop` — Nexus circulates pre-read, tracks live gaps, post-session generates completion summary.
- Anti-pattern to watch: stakeholder map naming committees instead of named individuals (FM #1 proxy).

### 5 · Artifact Contract
| Artifact | Required | Source |
|----------|----------|--------|
| Signed charter document | Hard | Program attachment, `program_evidence_items` |
| Stakeholder map (named) | Hard | Captured in phase notes, referenced from charter |
| Success metric tree | Soft | Charter section or separate attachment |
| Foundation readiness assessment | Soft | Data asset baseline per primer |

### 6 · Evidence Rules
- **Charter sign-off**: attachment must exist in `program_evidence_items` tagged `charter_signed_off`; Nexus checks `completed` flag on gate criteria, not just file presence.
- **Stakeholder map**: must name individuals, not roles or org units. Nexus flags "will confirm with CDO" as unresolved.
- **Value range**: must have numeric low/high bounds in stated currency. "Significant" or "material" is rejected.

### 7 · Gate Logic
Gate P1→P2 (`governance.ts` line ~84):
| Check key | Severity |
|-----------|----------|
| `charter_signed_off` | **hard** |
| `sponsor_assigned` | **hard** |
| `baseline_captured` | soft |

---

## P2 Discover & Diagnose
*Source: `src/lib/programs/phase-packs/P2_synthesis.ts` — label: `P2 Discover & Diagnose`*

### 1 · Mission
Nexus acts as a diagnostic synthesizer. Its job is to push the team to converge on root causes, not observations. The phase has a unique permission: Nexus may recommend "discontinue" if the evidence base does not support the hypothesis. Entry posture: verify that all planned baseline interviews and data pulls are scheduled. Mid-phase: drive convergence on root cause using the `rightQuestions.converge` set. Exit posture: lock the synthesis report before any design spend is approved.

### 2 · Pattern Bundle
- Active archetype primer fully loaded; data-asset baseline from P1 drives the discovery checklist.
- Failure Modes #2 (unclear problem), #3 (data foundation), #5 (operating model), #8 (governance/risk) are active.
- Intelligence genome corpus (accessed via `AgentContextBroker`, domain `worldview`) provides benchmark comparators for baseline metrics.

### 3 · Guided Workflow
Steps from `P2_synthesis.ts`:
1. `p2-baseline-interviews` (complex) — structured stakeholder interviews against the primer's interview guide.
2. `p2-data-asset-audit` (complex) — data quality + lineage + access-path validation per `dataAssetsNeeded`.
3. `p2-root-cause-synthesis` (simple) — Nexus maps interview themes to root causes; presents structured hypothesis test.
4. `p2-discontinue-evaluation` (simple) — Nexus explicitly evaluates whether evidence supports continuation; outputs Continue / Discontinue recommendation with rationale.
5. `p2-discovery-report` (complex) — produce signed synthesis report.

### 4 · Workshop Playbook
**Discovery Synthesis Workshop** (end of P2, pre-gate):
- Participants: Sponsor, CDO, data team lead, Nexus facilitator.
- Inputs: interview notes uploaded to evidence ledger, data-asset audit output.
- Outputs: signed synthesis report with root cause map, baseline metrics attested, Continue/Discontinue call.
- Agent role: `evaluate_evidence` then `compose_artifact`.
- Anti-pattern: workshop produces a list of observations not root causes — Nexus must push for mechanism, not symptom.

### 5 · Artifact Contract
| Artifact | Required | Source |
|----------|----------|--------|
| Discovery synthesis report (signed) | Hard | `program_evidence_items` |
| Baseline metrics (attested, numeric) | Hard | Evidence attachment |
| Stakeholder map (updated post-interviews) | Hard | Phase notes |
| Root cause map | Hard | Synthesis report section |
| Continue/Discontinue recommendation | Hard | Report executive summary |
| Data-asset audit | Soft | Attachment |

### 6 · Evidence Rules
- **Baseline attestation**: "planned" or "estimated" baselines do not satisfy `discovery_baseline_attested`. Nexus requires an actual measured value with source and date.
- **Root causes**: at least 2 root causes named, each with evidence reference. Nexus rejects root causes stated as observations ("users don't adopt the tool" is a symptom, not a cause).
- **Discontinue check**: Nexus must produce the evaluation record even when the recommendation is Continue. Skipping it is a hard protocol violation.

### 7 · Gate Logic
Gate P2→P3 (`governance.ts` line ~97):
| Check key | Severity |
|-----------|----------|
| `discovery_report_signed_off` | **hard** |
| `discovery_notes_ingested` | **hard** |
| `discovery_baseline_attested` | **hard** |
| `discovery_stakeholders_named` | **hard** |
| `p2_readiness_cleared` | **hard** |

All five are hard gates. This is the highest-gate-density transition in the lifecycle — reflects that design spend is wasted without a real diagnosis.

---

## P3 Design Future State
*Source: `src/lib/programs/phase-packs/P3_design.ts`*

### 1 · Mission
Nexus acts as a design discipline enforcer. The explicit doctrine (from `governance.ts`): P3 rejects tool-first solutions without a workflow integration plan. Entry posture: present the root-cause map from P2 and demand that every design element traces back to a root cause. Mid-phase: detect "we'll use [Vendor X]" patterns without operating-model redesign and surface FM #5 (operating-model change). Exit posture: validate requirements-to-design traceability before gate submission.

### 2 · Pattern Bundle
- Full archetype primer including `workshopPlaybooks[phase='design']`.
- Failure Modes #5 (operating model), #6 (workflow integration), #7 (tool-first thinking), #8 (governance/risk) are active.
- FM #7 (`tool_first_thinking` in `ai-program-failure-modes.ts`) gets the highest priority signal weight in this phase.

### 3 · Guided Workflow
Steps from `P3_design.ts`:
1. `p3-operating-model-design` (complex) — workshop: design target operating model and workflow changes. Requires upload.
2. `p3-solution-architecture` (complex) — architecture design scoped to the operating-model context. No tool-first patterns accepted.
3. `p3-requirements-traceability` (simple) — Nexus maps requirements → design elements → expected outcomes.
4. `p3-risk-tradeoff-capture` (simple) — risks and tradeoffs named with mitigations.
5. `p3-design-signoff` (complex) — operating-model owners interviewed; design signed off.

### 4 · Workshop Playbook
**Operating Model Design Workshop** (early P3):
- Participants: Sponsor, operating-model owners (the people whose workflow will change), IT/architecture lead.
- Inputs: root-cause map, P2 synthesis report.
- Outputs: target-state workflow diagrams, named change-owners, operating-model delta doc.
- Anti-pattern: architecture team attends without operating-model owners → FM #5.

**Design Review** (late P3):
- Participants: Sponsor, CXO-level operating-model owner.
- Inputs: draft design pack.
- Outputs: signed design with traceability matrix.

### 5 · Artifact Contract
| Artifact | Required | Source |
|----------|----------|--------|
| Future-state design (operating model + architecture) | Hard | Attachment |
| Operating-model shift narrative | Hard | Design doc section |
| Requirements-to-design traceability | Hard | Traceability matrix |
| Risk and tradeoff register | Soft | Design doc appendix |
| CXO interview notes | Soft | Evidence attachment |

### 6 · Evidence Rules
- **No tool-first**: Nexus rejects designs that name vendor/tool before naming the workflow change. Gate check `design_approved` requires explicit operating-model delta.
- **Traceability**: Nexus validates that every design element references at least one P2 root cause. Orphaned design elements are flagged.
- **Change owners**: "TBD" is not accepted in the operating-model shift section.

### 7 · Gate Logic
Gate P3→P4 (`governance.ts` line ~113):
| Check key | Severity |
|-----------|----------|
| `design_approved` | **hard** |
| `requirements_design_outcome_trace` | **hard** |
| `phase_3_findings_written` | soft |
| `cxo_interview_complete` | soft |

---

## P4 Roadmap & Business Case
*Source: `src/lib/programs/phase-packs/P4_build.ts` — label: `P4 Roadmap & Business Case`*

### 1 · Mission
Nexus acts as a business-case rigour partner. This phase produces the funding gate materials: roadmap, business case, value plan, cost model, and change readiness assessment. Entry posture: confirm the design sign-off exists before any roadmap work begins. Mid-phase: challenge value claims — every projected benefit must trace back to a P2 baseline metric. Exit posture: confirm that Tower metric plan is drafted before the P4→P5 gate is submitted, because Tower cannot be set up reactively.

### 2 · Pattern Bundle
- Full archetype primer including engagement window estimates and cost-range references.
- Failure Modes #5 (operating model), #9 (value measurement), #10 (post-handoff accountability) become active as the business case is built.
- `src/lib/programs/value-utils.ts` — value range computation logic used to validate the business case numbers.

### 3 · Guided Workflow
Steps from `P4_build.ts`:
1. `p4-roadmap-draft` (complex) — produce roadmap with workstreams, estimates, timeline, milestones, dependencies, RACI, risks.
2. `p4-business-case` (complex) — produce business case with value plan, cost model, sensitivity analysis.
3. `p4-change-readiness` (complex) — change readiness assessment and adoption plan with named change owners.
4. `p4-tower-metric-plan` (simple) — draft Tower monitoring metrics so Tower can be configured at handoff.
5. `p4-vendor-selection` (complex, conditional) — vendor selection if applicable; approval required.
6. `p4-funding-approval` (simple) — record funding or capacity approval.

### 4 · Workshop Playbook
**Business Case Review** (mid-P4):
- Participants: Sponsor, Finance, CDO/CTO as applicable.
- Inputs: draft roadmap, value model, cost model.
- Outputs: approved business case with sensitivity cases signed off.

**Change Readiness Assessment** (late P4):
- Participants: Change management lead, HR/L&D if applicable, operating-model owners.
- Inputs: P3 operating-model delta doc.
- Outputs: change readiness score, adoption plan with named owners.

### 5 · Artifact Contract
| Artifact | Required | Source |
|----------|----------|--------|
| Roadmap (RACI, milestones, risks) | Hard | Attachment |
| Business case (value plan approved) | Hard | Attachment |
| Change readiness + adoption plan | Hard | Attachment |
| Execution success criteria | Hard | Roadmap section |
| Tower metric plan | Soft | Phase metadata |
| Vendor selection record | Soft (conditional) | Attachment |
| Funding approval record | Soft | Evidence item |

### 6 · Evidence Rules
- **Value traceability**: every projected benefit must reference a P2 baseline metric. Nexus rejects benefit claims without a "from X to Y" structure with a named measurement owner.
- **RACI completeness**: roadmap RACI must name business, technology, vendor (if applicable), finance, change, and Tower owners. Generic "business team" entries are flagged.
- **Tower metric plan**: Nexus proactively flags if this artifact is missing at mid-P4. Tower cannot accept an unmeasured handoff.

### 7 · Gate Logic
Gate P4→P5 (`governance.ts` line ~127):
| Check key | Severity |
|-----------|----------|
| `execution_roadmap_drafted` | **hard** |
| `business_case_approved` | **hard** |
| `execution_milestones_defined` | **hard** |
| `execution_success_criteria_defined` | **hard** |
| `readiness_and_change_plan_signed_off` | **hard** |
| `funding_approval_recorded` | soft |
| `sponsor_alignment_confirmed` | soft |
| `delivery_raci_named` | soft |
| `vendor_selection_approved` | soft |
| `tower_metric_plan_drafted` | soft |

Five hard gates — this is the funding/mobilization gate and the last point where a move can be killed before Tower takes ownership.

---

## P5 Mobilize & Handoff
*Source: `src/lib/programs/phase-packs/P5_activate.ts` — label: `P5 Mobilize & Handoff`*

### 1 · Mission
Nexus acts as a handoff integrity officer. The phase moves the execution team from planning to mobilization and passes accountability to Tower. Entry posture: verify that the execution team has accepted the RACI — not just that it was written. Mid-phase: confirm Tower can begin monitoring setup (metric plan, data connections, alerting thresholds). Exit posture: this is the last Nexus-owned gate. After sign-off, Nexus's role shifts to read-only program history; Tower owns outcome tracking.

### 2 · Pattern Bundle
- Full archetype primer for final reference.
- Failure Modes #9 (value measurement cadence), #10 (post-handoff accountability), #5 (operating-model) are active as final-check signals.
- Tower integration context: `src/lib/programs/programs-control-tower-signals.ts`.

### 3 · Guided Workflow
Steps from `P5_activate.ts`:
1. `p5-execution-team-acceptance` (complex) — execution team formally accepts RACI; upload acceptance record.
2. `p5-tower-setup` (complex) — Tower configured with metric plan, dashboards, alert thresholds. Requires Tower team upload.
3. `p5-kickoff-facilitation` (complex) — program kickoff event; Nexus generates kickoff pack.
4. `p5-value-tracking-handoff` (simple) — lock measurement cadence, owner, and baseline anchors for Tower.
5. `p5-handoff-pack` (complex) — produce Tower handoff pack: all signed artifacts, RACI, metric plan, outstanding risks.

### 4 · Workshop Playbook
**Program Kickoff** (early P5):
- Participants: Full execution team (business + technology + vendor).
- Inputs: signed roadmap, RACI, change plan.
- Outputs: kickoff record, team-level commitment signoff.

**Handoff Review** (late P5, before gate):
- Participants: Tower team, Sponsor, CDO.
- Inputs: Tower handoff pack.
- Outputs: Tower team acceptance, monitoring setup confirmation.
- Hard rule: Tower team must explicitly accept, not just acknowledge. "Noted" is not acceptance.

### 5 · Artifact Contract
| Artifact | Required | Source |
|----------|----------|--------|
| Execution team acceptance record | Hard | Upload + evidence item |
| Tower handoff pack | Hard | Composed artifact |
| Tower setup confirmation | Hard | Tower team upload |
| Value tracking cadence + owner | Hard | Phase metadata |
| Kickoff record | Soft | Attachment |

### 6 · Evidence Rules
- **Tower acceptance**: requires an upload from the Tower team with a named recipient, not just Nexus generating the pack. Nexus distinguishes "pack sent" from "pack accepted".
- **Value tracking**: baseline anchor must be a numeric value with date and measurement source. The measurement owner must be named (not "TBD" and not the same person as the sponsor).
- **No open risks**: Nexus flags any unresolved hard risks from P4 that have not been assigned a mitigation owner.

### 7 · Gate Logic
Tower handoff gate (P5 exit, `governance.ts`):
| Check | Severity |
|-------|----------|
| Execution team acceptance | **hard** |
| Tower metric plan confirmed active | **hard** |
| Value tracking owner named | **hard** |
| All hard P4 risks resolved or assigned | **hard** |
| Kickoff record uploaded | soft |

After gate sign-off: `findGateRule(5, 6) === null` — no further Nexus gate. Move passes to Tower. Nexus posture shifts to historical Q&A only.

---

## Appendix A — Failure Mode → Phase Mapping

| FM# | Name | Primary Phases | Anti-Pattern Files |
|-----|------|---------------|-------------------|
| 1 | Exec sponsorship | P0 | `P0_originate.ts`, `governance.ts` |
| 2 | Unclear problem | P0, P2 | `P0_originate.ts`, `P2_synthesis.ts` |
| 3 | Data foundation | P1, P2 | `P1_discovery.ts`, `P2_synthesis.ts` |
| 4 | Talent gap | P0, P1 | `P0_originate.ts`, archetype primers |
| 5 | Operating model | P3, P5 | `P3_design.ts`, `governance.ts` |
| 6 | Workflow integration | P3, P5 | `P3_design.ts` |
| 7 | Tool-first thinking | P3 | `P3_design.ts`, `ai-program-failure-modes.ts` |
| 8 | Governance/risk | P2, P3 | `P2_synthesis.ts`, `P3_design.ts` |
| 9 | Value measurement | P1, P5 | `governance.ts` P4→P5 checks |
| 10 | Post-handoff accountability | P0, P5 | `P5_activate.ts`, Tower signals |

Source: `src/lib/programs/failure-modes.ts` (programs module) and `src/lib/intelligence/ai-program-failure-modes.ts` (intelligence module — **not reconciled**, see Gap Backlog).

---

## Appendix B — Archetype Primers Registered

| Pattern ID | Primer | File |
|-----------|--------|------|
| PAT-PRG-CDP-001 | CDP Activation | `archetype-primers/PAT-PRG-CDP-001.ts` |
| PAT-PRG-CC-AI-001 | Contact Center AI | `archetype-primers/PAT-PRG-CC-AI-001.ts` |
| PAT-PRG-DATA-FAB-001 | Demand Forecasting | `archetype-primers/PAT-PRG-DATA-FAB-001.ts` |
| PAT-PRG-COPILOT-001 | M365 Copilot | `archetype-primers/PAT-PRG-COPILOT-001.ts` |
| PAT-PRG-AI-CODING-001 | AI Coding | `archetype-primers/PAT-PRG-AI-CODING-001.ts` |
| PAT-PRG-LOYALTY-001 | Loyalty AI | `archetype-primers/PAT-PRG-LOYALTY-001.ts` |

**Gap**: No primers exist for PLATFORM MODERNIZATION, SUPPLY CHAIN AI, PRICING AI, STORE OPERATIONS AI archetypes — all present in the demo seed. See Gap Backlog.
