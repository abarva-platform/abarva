# 02 USER PERSONAS AND JOURNEYS

## Personas

### CIO

- Cares about: sourcing quality, transformation risk, vendor capability, technology strategy fit, executive confidence.
- Decisions they make: approve event scope, sourcing strategy, shortlist, vendor selection, mobilization path.
- Need to trust: that Nexus understands technology sourcing tradeoffs and that recommendations are evidence-backed.
- Should see: portfolio state, at-risk events, major decisions, value at stake, readiness, key artifacts.
- Should not be burdened with: raw vendor response normalization, low-level task management, long data-entry forms.

### CTO

- Cares about: architecture, platform fit, engineering quality, delivery model, migration risk.
- Decisions they make: technical scorecard criteria, architecture requirements, vendor technical fit, delivery model.
- Need to trust: that technical criteria are not diluted by commercial scoring.
- Should see: technical requirements, architecture assumptions, scorecard weights, risks, evidence gaps.
- Should not be burdened with: procurement process minutiae or repetitive status updates.

### CFO

- Cares about: projected value, commercial model, savings confidence, risk, realization measurement.
- Decisions they make: value case approval, commercial tradeoffs, funding, final recommendation support.
- Need to trust: projected value assumptions, measurement methods, variance explanations, and governance.
- Should see: value ledger, assumptions, confidence, timing, owner, variance model.
- Should not be burdened with: artifact drafting steps or vendor-response formatting.

### Procurement Leader

- Cares about: process integrity, vendor fairness, compliance, timing, approvals, auditability.
- Decisions they make: sourcing model, package release, response timing, process exceptions.
- Need to trust: that scorecards are locked before evaluation and that artifacts are reviewable.
- Should see: stage gates, vendor response status, scorecard state, artifact approvals, alert aging.
- Should not be burdened with: high-level strategy narrative when operational action is needed.

### Sourcing Lead

- Cares about: moving the event, collecting inputs, packaging artifacts, coordinating evaluation.
- Decisions they make: task sequencing, reminders, response handling, escalation timing.
- Need to trust: that Nexus identifies the next action and missing dependencies clearly.
- Should see: current stage, missing inputs, owner, due date, artifacts, risks, next action.
- Should not be burdened with: executive-only narrative unless preparing a decision packet.

### PMO / Transformation Lead

- Cares about: timing, dependencies, blockers, stakeholder accountability, value milestones.
- Decisions they make: escalation paths, operating cadence, readiness checkpoints.
- Need to trust: stage state, aging, blockers, ownership, and progress signals.
- Should see: lifecycle status, journey tracker, aging, missing inputs, alert panel.
- Should not be burdened with: vendor scoring detail unless it impacts schedule or risk.

### Business Sponsor

- Cares about: business outcome, decision clarity, implementation consequences, value.
- Decisions they make: scope acceptance, operating constraints, final recommendation support.
- Need to trust: the artifact is written in business terms and the recommendation is not vendor-biased.
- Should see: business implications, decision options, risk, value, recommended action.
- Should not be burdened with: raw procurement configuration or technical minutiae.

### Legal / Compliance Reviewer

- Cares about: release readiness, fair process, contractual risk, compliance obligations.
- Decisions they make: whether artifacts can be released, whether exceptions are acceptable.
- Need to trust: audit trail, artifact state, approvals, required inputs, legal blockers.
- Should see: artifact status, lock state, review queue, compliance risks.
- Should not be burdened with: unrelated portfolio metrics.

### Vendor Evaluation Team Member

- Cares about: criteria clarity, scoring fairness, evaluation instructions, evidence.
- Decisions they make: criterion-level scores and rationale once evaluation begins.
- Need to trust: scorecard weights, definitions, and evaluation guardrails.
- Should see: approved scorecard, scoring rubric, response summaries, required rationale.
- Should not be burdened with: pattern-pack internals or executive value ledger detail.

## Key Journeys

### Create sourcing event

User starts from `/source`, creates or selects an event, chooses an archetype, and Nexus recommends rigor level.

### Classify event and rigor

Nexus classifies the event using sourcing archetype, value, complexity, risk, and stakeholder context.

### Define scope

User and Nexus define in-scope work, out-of-scope work, required inputs, assumptions, blockers, and readiness.

### Approve sourcing strategy

Nexus presents sourcing strategy options. Steward checks readiness. Sponsor or sourcing lead approves the path.

### Generate RFP/RFI package

Artifact Studio generates from pattern-pack templates, client-specific inputs, assumptions, and missing-input tags.

### Manage vendor response period

The system tracks vendor response status, missing pricing templates, Q&A, overdue items, and escalation.

### Govern scorecard

Pattern defaults produce initial criteria and weights. Users edit weights with rationale. Steward enforces validation before evaluation.

### Evaluate vendors

Evaluation team uses locked scorecard and normalized vendor responses. Vendor scoring is not part of the first slice.

### Prepare executive decision

Nexus and Atlas prepare a decision packet from evidence, scorecard results, risks, and value ledger.

### Mobilize vendor

Selected vendor, transition plan, owner, milestones, and contract/mobilization actions are tracked.

### Track projected versus realized value

Projected value is logged early. Realized value is measured later with evidence, variance, and attribution confidence.
