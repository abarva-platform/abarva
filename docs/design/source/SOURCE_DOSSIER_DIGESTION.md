# Source Dossier Digestion
**Source:** `docs/abarva-source/build-pack/` (chapters 00–33)  
**Purpose:** Structured audit baseline — 600+ anchor points condensed from dossier  
**Status:** Pre-digested for audit use. If a specific claim here conflicts with the actual chapter, log as a digestion error and flag to Anand.

---

## §1 · Product overview

AbarVa Source is the operating room for technology and IT sourcing — a governed workflow surface for managing sourcing events from strategy through value realization. It is not a procurement system of record. It is a decision-intelligence layer that sits above procurement and surfaces evidence, agent guidance, and gate criteria at each stage.

**Lead agent:** Sentinel (information integrity, data readiness, evidence grounding)  
**Co-agents:** Nexus (workflow, scope, BAFO), Steward (scorecard, governance), Atlas (executive decision, value posture)  
**Module name:** `AbarVa Source`  
**Route prefix:** `/source`

---

## §2 · Agent roles and bounds

### §2.1 Four-agent doctrine

| Agent | Role | Lead steps | Scope |
|---|---|---|---|
| **Nexus** | Workflow lead — scope, RFP, BAFO, selection | 1, 2, 3, 4, 6, 7, 9, 10 | Owns workflow progression, scope boundary, BAFO structuring |
| **Sentinel** | Information integrity — data readiness, evidence, risk | All steps (observer role) | Pulls and assesses evidence quality; flags gaps; never claims evidence is "ready" if unparsed |
| **Steward** | Governance — scorecard, weights, evaluation | 5 (Evaluate) | Owns scorecard criterion management and weight governance |
| **Atlas** | Executive — decision brief, value posture | 8 (Decision), 11 (Value) | Produces recommendation briefs; tracks realized vs. committed value |

### §2.2 Agent role bounds (non-goals / forbidden)

Agents MUST NOT:
1. Claim evidence readiness based on file upload alone (uploaded ≠ parsed ≠ usable)
2. Claim a vendor is selected or award is made before Decision step is complete
3. Claim realized savings without a measurement owner + evidence artifact
4. Produce scorecard scores without evidence citations
5. Advance a gate without all hard criteria met (waiver path exists, but agents don't approve their own waivers)
6. Claim a value projection is live data when substrate is not yet bound ("v2 PENDING SUBSTRATE")
7. Speak as a different agent than their assigned role for the current step
8. Make claims about Tower or other surfaces not yet designed
9. Claim final legal/commercial advice — advisory only
10. Name a specific dollar figure as "confirmed savings" without measurement evidence
11. Claim a counterparty has agreed to terms not in evidence
12. Claim an audit trail exists for actions not logged to the substrate
13. Override sponsor/EA decisions with agent recommendations
14. Claim data from a tenant the user cannot access
15. Imply that a risk has been resolved without a resolution record

### §2.3 Seven product truths (must remain visible)

1. **Gate criteria are explicit** — always show what criteria must be met before advancing
2. **Data readiness is honest** — always show current evidence state, never implied readiness
3. **Value is range-bracketed** — never a single point estimate; always low-high-confidence
4. **Agent attribution is named** — every claim has an agent source
5. **Audit trail is immutable** — approvals, weight changes, gate advances are logged
6. **Waiver path is available** — promotion can proceed at outline-tier with explicit waiver
7. **Vendor concentration is tracked** — risk register surfaces vendor overlap across events

---

## §3 · Forbidden claims (15 prohibitions)

From dossier §15.2 and §2.2:

| # | Forbidden claim |
|---|---|
| F01 | "Your ticket history is ready to use" (uploaded ≠ parsed ≠ usable evidence) |
| F02 | "We have X evidence items supporting this" (without naming the items) |
| F03 | "Vendor B is the best choice" (without scorecard basis) |
| F04 | Citing any loaded/uploaded file as "usable evidence" before parsed + validated |
| F05 | "You have saved $X" without measurement owner + evidence |
| F06 | "The vendor agreed to Y" without a signed/evidence-backed artifact |
| F07 | "Your data readiness is complete" when any required source is below Parsed |
| F08 | Claiming a gate is met when any hard criterion is outstanding |
| F09 | "This is the recommended decision" without providing Atlas decision brief |
| F10 | Claiming Tower-based context (Tower not yet designed in v0.3) |
| F11 | Claiming audit trail for an action that wasn't logged |
| F12 | Claiming final vendor selection before Decision step and sponsor sign-off |
| F13 | Pricing values labeled as "live" when substrate has `v2 PENDING SUBSTRATE` flag |
| F14 | Claiming cross-tenant event data for a tenant the user cannot access |
| F15 | Recommending override of EA council or sponsor decision |

---

## §4 · Nine universal page acceptance criteria (dossier §13.1)

Every Source surface must:

1. Show current agent attribution (which agent is lead for this step)
2. Show current event/step/stage state
3. Show data readiness summary (X/Y sources in usable state)
4. Show gate criteria status (X of Y criteria met)
5. Show artifact count for current step (required + optional)
6. Never claim a value point-estimate without range + v2 flag if substrate unbound
7. Show top blocker prominently (not buried in a tab)
8. Provide a "Continue this step" path (always forward-leaning)
9. Show recent activity (at least 3 events from the step activity log)

---

## §5 · Eleven canonical sourcing stages

| # | Key | Label | Lead | Primary user question |
|---|---|---|---|---|
| 1 | `strategy` | Strategy | Nexus | What are we buying and why? |
| 2 | `scope` | Scope | Nexus | What's in scope and what's out? |
| 3 | `rfp` | RFP | Nexus | What are we asking vendors to respond to? |
| 4 | `responses` | Responses | Nexus | What did vendors submit? |
| 5 | `evaluation` | Evaluate | Steward | Which vendor scores highest against our criteria? |
| 6 | `pricing` | Pricing | Nexus | What is the true normalized cost? |
| 7 | `bafo` | BAFO | Nexus | What's our best-and-final negotiation ask? |
| 8 | `executive_decision` | Decision | Atlas | Which vendor should we select and why? |
| 9 | `selection` | Selection | Nexus | How do we confirm and document the choice? |
| 10 | `transition` | Transition | Nexus | How do we migrate safely? |
| 11 | `value` | Value | Atlas | Is the value we committed actually being realized? |

---

## §6 · Data model domain concepts (dossier ch.06)

### Core entities

| Entity | Key fields |
|---|---|
| `SourcingEvent` | id, name, archetype, rigorLevel, lifecycleStatus, currentStageId, owner, blocker, nextAction, valueAtStake |
| `WorkflowStage` | id, eventId, name, status, readinessScore, owner, requiredInputs, gate |
| `StageGate` | id, stageId, requiredArtifacts, requiredInputs, approver, status, blocker |
| `Artifact` | id, eventId, stageId, type, status, tier (rich/outline/stub), owner, confidence, version |
| `Vendor` | id, name, category, status, contact |
| `VendorResponse` | id, eventId, vendorId, status, submittedAt, missingItems |
| `EvaluationScorecard` | id, eventId, status, totalWeight, lockedAt, approvedBy |
| `EvaluationCriteria` | id, scorecardId, label, defaultWeight, currentWeight, description, required |
| `ScorecardOverride` | id, criteriaId, previousWeight, newWeight, rationale, materialChange, actor, timestamp |
| `ValueLine` | id, eventId, label, category, valueState (projected→committed→measuring→realized), projectedAmount, committedAmount, realizedAmount, measurementOwner, evidenceArtifact |
| `DataReadinessItem` | id, eventId, stageId, sourceLabel, state (7-state ramp), lastSyncAt |
| `PricingNormalization` | id, eventId, vendorId, listTco, transitionCostNormalized, egressOverBase, riskReserve, normalizedTco, traps[] |
| `PricingTrap` | id, normalizationId, vendorId, severity (P0/P1/P2), description, agentAttribution, resolvedInStage |

### Seven data readiness states (dossier definition)

| State | Meaning |
|---|---|
| Usable Evidence | Parsed, validated, citable in artifacts and gates |
| Available | Parsed and sample-checked; can be queried |
| Parsed | Fields extracted; not yet validated |
| Loaded | File ingested; not yet parsed |
| Not Requested | Known source, not yet pulled |
| Stale | Older than freshness window |
| Low Confidence | Flagged by Sentinel |

### Four value states

| State | Trigger |
|---|---|
| Projected | Stage < Decision; range estimate only; v2 PENDING |
| Committed | Sponsor sign-off on value commitment in Decision step |
| Measuring | Post-go-live; measurement owner assigned, data being collected |
| Realized | Measurement owner confirmed value with evidence artifact |

### Artifact tiers

| Tier | Meaning |
|---|---|
| Rich | Full text, evidence-cited, signed |
| Outline | Section headings + working assumptions; not citeable in gates |
| Stub | Scaffold only; no substantive content |

---

## §7 · Stage data requirements (dossier §9.2, abridged)

For each stage, these data items must exist before gate criteria can evaluate:

| Stage | Required data |
|---|---|
| Strategy | eventId, archetype, rigorLevel, owner, trigger, valueTarget |
| Scope | App inventory, exclusion log, tier classification, scope memo draft |
| RFP | Scope memo signed, RFP document, vendor shortlist |
| Responses | VendorResponse records for all shortlisted vendors |
| Evaluate | EvaluationScorecard with all criteria, scores from ≥2 raters |
| Pricing | PricingNormalization for all vendors, trap log |
| BAFO | BAFO question pack, ≥1 BAFO round records per finalist |
| Decision | Atlas decision brief, Steward sign-off, Sentinel risk attestation |
| Selection | Selection memo signed, vendor contract record |
| Transition | Transition plan, checkpoint records |
| Value | ValueLine records with measurement owner + evidence artifact |

---

## §8 · Field-level binding reference (dossier §18, abridged)

| Field | Substrate table | UI consumer | Required for |
|---|---|---|---|
| `sourcingEvent.currentStageKey` | `source_events.current_stage_key` | StageTrackerStrip, id-strip | All surfaces |
| `sourcingEvent.lifecycleStatus` | `source_events.lifecycle_state` | Status chip on id-strip | All surfaces |
| `sourcingEvent.blocker` | derived from gate_criterion_states | Portfolio blocker column, top-of-canvas | T01, T03 |
| `sourcingEvent.estimatedValueUsd` | `source_events.estimated_value_usd` | Value at stake panel, portfolio row | T01, T03, T07, T11 |
| `dataReadiness.state` | `source_artifacts.evidence_state` | Context-bundle strip, T12 drawer | T03 |
| `artifact.tier` | `source_artifacts` (no direct tier column) | Artifact shelf tier badge | T03, T09 |
| `gate.criteriaCount` | `gate_criteria` count | Gate panel "X/Y met" | T03, T14 |
| `gate.metCount` | `gate_criterion_states.state='met'` count | Gate panel | T03, T14 |
| `scorecard.weights` | `source_artifacts` + `evaluation_criteria` (no table found) | T04 matrix, T08 governance | T04, T08 |
| `pricingTrap.severity` | `source_pricing_components` (no `pricing_traps` table found) | T05 trap log | T05 |
| `valueLine.valueState` | `source_value_lines.value_state` | T07 ledger, T11 portfolio ledger | T07, T11 |
| `vendor.bafoHistory` | No `bafo_rounds` table found | T10 BAFO history | T10 |

---

## §9 · Implementation status (dossier §12 self-assessment)

Dossier pre-disclosed three partial/gap items:

| Item | Dossier status |
|---|---|
| Scorecard Governance | Partial — criteria display exists, weight versioning and audit trail incomplete |
| Artifact Detail | Partial — drawer exists, full-page two-column layout not yet built |
| Source Value Ledger | Partial — ledger component exists, 4-state model completeness unknown |

All three remain open as of this audit (confirmed by design backlog analysis 2026-05-06).
