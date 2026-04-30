# Lifecycle Operating System Design

Status: canonical design spine for Programs and Source
Scope: Programs phases, Source stages, agent work modes, evidence capture, gate approval, and next-phase readiness

## Thesis

AbarVa is not a chat UI wrapped around project data. The product promise is that most AI and transformation programs fail for repeatable reasons, and AbarVa prevents those failures by forcing the right success-thinking at every phase, every stage, and every step.

Every phase/stage must prove three things before it advances:

1. Success thinking happened.
2. Evidence exists.
3. The next phase is ready.

The operating loop is:

`Intent -> Workplan -> Template / Workshop -> Evidence Upload -> Gate Review -> Next-Phase Primer`

A phase or sourcing stage is not complete because the user had a conversation with an agent. It is complete when the agent can show the completion contract, the evidence attached to it, the approval posture, the failure modes prevented, and the readiness package for the next phase.

## Shared Contract

The shared TypeScript contract lives at:

- `src/lib/lifecycle-operating-system/types.ts`
- `src/lib/lifecycle-operating-system/builders.ts`
- `src/lib/lifecycle-operating-system/failure-modes.ts`

It produces one `LifecycleCompletionContract` per Programs phase and Source stage.

| Layer | Meaning |
| --- | --- |
| Completion contract | What good looks like for this phase/stage |
| Step contract | The actual work inside the phase/stage |
| Agent work mode | Whether the agent should answer, coach, draft, facilitate, capture, evaluate, or prepare next |
| Template binding | The agenda, scorecard, data request, memo, or approval packet the user needs |
| Evidence requirement | What must be uploaded, linked, or captured after meetings/sessions |
| Gate approval | Who approves, what artifact they approve, and what blocks advancement |
| Next-phase primer | What the next phase must inherit so the team does not restart work |
| Failure-mode control | Which known failure mode this step prevents |

## Failure-Mode Taxonomy

The current canonical controls are:

| ID | Label | What It Prevents |
| --- | --- | --- |
| `phantom_sponsor` | Phantom sponsor | Work advancing without a named accountable owner |
| `unclear_decision_rights` | Unclear decision rights | Gates without a final decision authority |
| `solution_before_problem` | Solution before problem | Tool/platform choice before the operating problem is proven |
| `evidence_free_progress` | Evidence-free progress | Narrative replacing uploaded or cited evidence |
| `data_readiness_blindspot` | Data readiness blind spot | AI ambition outrunning data inventory, quality, access, privacy, or lineage |
| `integration_unknowns` | Integration unknowns | Build commitments made before architecture and operating dependencies are known |
| `adoption_afterthought` | Adoption afterthought | Change, training, incentives, and ownership delayed until launch |
| `value_baseline_missing` | Value baseline missing | ROI/success claims without a measurable starting point |
| `commercial_or_vendor_opacity` | Commercial or vendor opacity | Vendor, pricing, contract, or walkaway assumptions hidden from the decision |
| `governance_and_risk_late` | Governance and risk late | Security, legal, compliance, model risk, or audit arriving after the decision hardens |

These controls are not slogans. Each control has a detection prompt and a prevention move. Agents should reference them when they explain why a step matters.

## Agent Work Modes

| Mode | Use When | Expected Behavior |
| --- | --- | --- |
| `answer` | The user asks a bounded question | Answer directly, cite evidence, stop cleanly |
| `coach` | The user is framing intent or scope | Ask structured questions and converge the workplan |
| `draft` | The user needs a document or artifact | Produce a draft tied to the phase/stage contract |
| `facilitate_workshop` | The work requires stakeholders | Prepare agenda, attendees, pre-read, outputs, and capture plan |
| `capture_evidence` | The user returns from a meeting/session | Ask for uploads/links, classify evidence, map it to gate criteria |
| `evaluate_gate` | The user wants to advance | Evaluate hard/soft criteria, blockers, waiver posture, and approval packet |
| `prepare_next` | The phase/stage is closing | Produce next-phase primer and carry-forward checklist |

The crucial design point: complex work is not solved by asking the agent one more prompt. The agent must help the user run the human process, collect the output, and then evaluate the gate.

## Programs Application

Programs already has phase packs. The lifecycle operating-system layer wraps each phase pack into the step model.

| Phase | Primary Failure Modes Prevented | What Good Looks Like |
| --- | --- | --- |
| P0 Originate | Phantom sponsor, value baseline missing, solution before problem | Discovery-ready seed with sponsor candidate, value hypothesis, classification, and evidence family |
| P1 Discovery | Solution before problem, evidence-free progress, data readiness blind spot | Current-state proof, stakeholder map, baseline path, and problem definition grounded in evidence |
| P2 Synthesis | Value baseline missing, unclear decision rights, governance/risk late | Charter-quality synthesis with value logic, tradeoffs, decisions, and approval route |
| P3 Design | Integration unknowns, data readiness blind spot, governance/risk late | Design package with architecture, controls, dependencies, data readiness, and delivery slice plan |
| P4 Build | Integration unknowns, evidence-free progress, adoption afterthought | Build evidence, test evidence, release readiness, and adoption preparation |
| P5 Activate | Adoption afterthought, value baseline missing, unclear decision rights | Launch readiness, user adoption proof, owner handoff, value instrumentation |
| P6 Operate | Value baseline missing, governance/risk late, evidence-free progress | Run cadence, control monitoring, improvement backlog, realized-value readout |

### Program UI Implications

Every Programs phase page should show above the fold:

1. Current phase outcome.
2. Current step and agent work mode.
3. What human work is required.
4. Templates/meeting packs to use.
5. Evidence still missing.
6. Failure modes being prevented.
7. Gate approval posture.
8. Next-phase readiness.

The agent composer should be paired with the current step. The user should never wonder: "What am I supposed to do now?"

## Source Application

Source stages use the same contract, but with sourcing-specific parameters and commercial failure modes.

| Stage | Primary Failure Modes Prevented | What Good Looks Like |
| --- | --- | --- |
| S0 Intake | Solution before problem, phantom sponsor, commercial opacity | Sourcing event has owner, business trigger, scope boundary, category, and kill criterion |
| S1 Market Shape | Solution before problem, commercial opacity, evidence-free progress | Vendor universe and market assumptions are explicit before shortlist pressure begins |
| S2 Shortlist | Unclear decision rights, commercial opacity, evidence-free progress | Rubric, panel, mandatory requirements, and challenger position are locked before bias enters |
| S3 RFP | Evidence-free progress, commercial opacity, governance/risk late | RFP, Q&A rules, response rubric, and commercial assumptions are comparable and decision-safe |
| S4 Demo / POC | Evidence-free progress, solution before problem, governance/risk late | Buyer-designed demo/POC proves success criteria rather than vendor theatre |
| S5 BAFO | Commercial opacity, unclear decision rights, evidence-free progress | Walkaway, normalized pricing, exceptions, concession plan, and final decision packet are explicit |
| S6 Contract | Governance/risk late, commercial opacity, integration unknowns | Clause hygiene, exit terms, risk exceptions, and signature authority are known before signature |
| S7 Activate | Adoption afterthought, value baseline missing, integration unknowns | Onboarding, dual-run, ownership handoff, lessons learned, and value tracking are ready |

### Source UI Implications

A Source event should not be a long dashboard with chat somewhere on the page. It should be an operator cockpit:

- Left: Sentinel/Sourcer composer plus current step intent and work mode.
- Right: stage contract, missing evidence, templates, and gate posture.
- Below: detailed artifacts, scorecards, timeline, commercial workbench, and audit history.

The first viewport must answer:

1. What stage are we in?
2. What is the current decision?
3. What task is the agent helping with?
4. Is this a prompt answer or a workshop/process task?
5. What evidence/template/gate action is needed next?

## Simple vs Complex Work

The lifecycle contract classifies each step as `simple` or `complex`.

Simple work can be completed in chat:

- Clarify a decision.
- Explain an anti-pattern.
- Summarize evidence already attached.
- Draft a short note from available context.

Complex work requires human process:

- Stakeholder workshop.
- Sponsor alignment session.
- Vendor demo review.
- BAFO strategy session.
- Contract/legal review.
- Data-readiness assessment.
- Gate approval review.

For complex work, the agent should not pretend it can finish alone. It should produce:

1. Intent.
2. Meeting/workshop plan.
3. Required participants.
4. Template/pre-read.
5. Expected outputs.
6. Upload/link instructions for post-session evidence.
7. Gate criteria impacted.
8. Next-phase carry-forward.

## Gate Approval Packet

A gate approval packet should include:

- Phase/stage being exited.
- Phase/stage being entered.
- Hard criteria met/unmet.
- Soft criteria met/unmet.
- Evidence linked to each criterion.
- Failure modes still active.
- Waiver posture if hard criteria are missing.
- Approval authority.
- Decision requested.
- Next-phase primer.

The gate is not only a UI status. It is the governance moment where AbarVa proves the user did or did not think through success.

## Implementation Status

Implemented in this slice:

- Shared lifecycle contract types.
- Canonical 10 failure-mode controls.
- Program phase contract builder for P0-P6.
- Source stage contract builder for S0-S7.
- Test coverage that every authored phase/stage has steps, evidence, templates, approval, next-phase primer, and failure-mode controls.

Not implemented in this slice:

- UI rendering of the lifecycle contract.
- Broker-backed evidence evaluation.
- Durable upload/write-back path.
- Live meeting scheduling.
- Production gate state-machine persistence.

## Next Build Slice

Recommended next slice:

`feat(lifecycle): render current operating contract above fold`

Scope:

1. Programs detail renders current `LifecycleCompletionContract` above the existing phase canvas.
2. Source event renders current `LifecycleCompletionContract` above the event workbench.
3. Agent prompt receives current step, work mode, templates, evidence gaps, and failure modes.
4. Gate drawer consumes `approval` and `nextPhasePrimer` fields.
5. No persistence changes yet.
