# Moves Phase Approval Gates: Rules And Blockers

There are three different "green" states in Moves, and they must not be confused:

1. Capture complete: the phase form sections are filled.
2. Governance checks green: the gate criteria in `governance.ts` pass.
3. Phase approved: the signed-in gate approval was recorded and the Move advanced.

## P0 Originate -> P1 Charter

Capture sections required:

- Business trigger
- Problem statement
- Affected function/process
- Initial value hypothesis
- Stakeholder / owner view
- Known evidence
- Missing evidence / open questions
- Recommendation to advance

Governance criteria:

- Hard: Origination brief signed off with archetype classification
- Hard: Value hypothesis seed names problem trigger and target outcome
- Hard: Sponsor candidate identified for Charter
- Soft: Charter funding or capacity envelope stated
- Soft: Initial scope boundary names the first cohort or use case
- Soft: Evidence family selected for Discover & Diagnose

Common blocker: all seven Originate UI questions can be filled, but gate approval can still fail if the signed origination brief, sponsor/title evidence, or value hypothesis record does not reconcile into the gate contract.

## P1 Charter -> P2 Discover

Capture sections required:

- Sponsor commitment
- Scope boundary
- Success criteria
- Stakeholder map
- Decision rights
- Evidence plan

Governance criteria:

- Hard: Charter signed off by sponsor
- Hard: Sponsor committed and decision rights named
- Soft: Initial value range and success metrics ratified

Common blocker: a charter may be drafted, but not signed off; or sponsor/decision rights are still role-level unclear.

## P2 Discover -> P3 Design

Capture sections required:

- Current-state findings
- Baseline metrics
- Gaps / root causes
- Process handoffs
- Data quality / governance
- Evidence confidence
- Recommendation

Governance criteria:

- Hard: Discovery synthesis report signed off
- Hard: Discovery notes or workshop logs ingested
- Hard: Baseline metrics are captured and attested, not merely planned
- Hard: Stakeholder map names required human owners with no hard-owner gaps
- Hard: Diagnosis clears P2 without unresolved hard gaps or kill recommendation

Common blocker: the product has findings, but they are not evidence-backed or attested enough to start design.

## P3 Design -> P4 Roadmap

Capture sections required:

- Solution approach & options
- Operating model & work split
- Process / workflow design
- Controls & AI governance
- Architecture & integration
- Evidence confidence
- Recommended approach

Governance criteria:

- Hard: Future-state design and operating-model shift signed off
- Hard: Requirements-to-design-to-outcomes traceability captured
- Soft: Risks and tradeoffs named with mitigations
- Soft: Operating-model owners interviewed

Common blocker: the UI may show a recommended approach, but the gate still needs signed design evidence and traceability. The approach must be grounded in P2 findings, not a static three-option menu.

## P4 Roadmap -> P5 Handoff

Capture sections required:

- Roadmap & sequencing
- Estimates & capacity
- Value plan & business case
- Risks & dependencies
- Funding ask & governance
- Source / Tower handoff
- Recommendation to fund

Governance criteria:

- Hard: Roadmap drafted with workstreams, estimates, timeline, milestones, dependencies, RACI, and risks
- Hard: Business case and value plan approved
- Hard: Critical execution milestones defined
- Hard: Success criteria defined for execution
- Hard: Change readiness and adoption plan signed off
- Soft: Funding or capacity approval recorded
- Soft: Sponsor and stakeholder alignment confirmed
- Soft: Delivery RACI names business, technology, vendor, finance, change, and Tower owners
- Soft: Vendor selection approved if applicable
- Soft: Tower monitoring metric plan drafted
- Soft: Tower handoff plan drafted

Common blocker: roadmap text exists, but business case, funding, RACI, or Tower metric plan are not accepted.

## P5 Handoff -> Tower

Capture sections required:

- Mobilization plan & RACI
- Launch readiness
- Value-proof rules & metrics
- First 90 days & milestones
- Governance & Tower cadence
- Open risks & client-to-complete
- Recommendation to launch

Governance criteria:

- Hard: Mobilization and Tower handoff package signed off
- Hard: Value measurement contract signed off
- Hard: Launch readiness and go/no-go criteria attested
- Hard: Tower governance and measurement cadence defined
- Soft: Open launch risks and client-to-complete items recorded

Common blocker: Strategic Moves can prepare execution, but Tower handoff requires measurement and launch-readiness acceptance.

