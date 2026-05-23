# AbarVa Depth Standard

This is the canonical shipping standard for AbarVa framework artifacts. Every template, workshop, instrument, corpus pattern, Move gate, and Sentinel output is scored on a 10-point rubric. Pass threshold is 8/10. Anything below 8 is not ready to ship.

The standard is deliberately concrete. A shallow artifact can sound polished while still being unusable. A deep artifact carries numbers, owners, decision rights, evidence anchors, failure modes, and context overlays.

## Enforcement Contract

| Rule | Standard |
|---|---|
| Rubrics | T/W/I/P/G/S, each with 10 criteria scored 0 or 1 |
| Pass threshold | 8/10 and all required sections present |
| Structural lint | Required sections and explicit evidence terms must be present |
| Semantic lint | The artifact is sent through `callModel` using workflow `depth-lint` and data class `internal` |
| CI | Pull requests touching corpus, template, instrument, workshop, or standard content run depth lint |
| Cost guard | Service caches by content hash for 5 minutes and alerts if estimated PR lint cost exceeds $5 |

## Rubric T - Template / Artifact

| Criterion | Required evidence |
|---|---|
| T1 Numbered depth-tagged TOC | L1/L2/L3 plus effort estimate per section |
| T2 Layered frameworks | At least two named frameworks, with the job each framework does |
| T3 Numerical benchmarks | Claim, range, sample size, source |
| T4 Anti-patterns | At least three named "this goes wrong when..." cases |
| T5 RACI and decision rights | Single accountable owner and threshold |
| T6 Sensitivity analysis | What changes when assumptions shift plus/minus 20 percent |
| T7 Sequenced sub-steps | Effort, order, and dependency arrows |
| T8 Quality gate | Testable done definition |
| T9 Maturity-model overlay | Current stage 1-5 and next-stage description |
| T10 Context overlay | Vertical, regional, or persona-specific variation |

Do:

| Do | Why |
|---|---|
| Put decision rights near the front | Sponsors need to know who can say yes |
| Make benchmarks falsifiable | Ranges without source quality are theater |
| Tie quality gates to evidence | Done must be checkable |

Do not:

| Do not | Why |
|---|---|
| Use a generic "key considerations" section | It hides missing decisions |
| Say "best practice" without range and source | It is not audit-grade |
| Treat vertical overlays as an appendix | Context changes the recommendation |

Worked exemplar: `docs/standards/exemplars/template-sponsor-charter.md`.

## Rubric W - Workshop

| Criterion | Required evidence |
|---|---|
| W1 Pre-read | 15-30 min sequence and glossary |
| W2 Facilitator brief | Objectives, success criteria, escalation, time-boxes |
| W3 Minute agenda | Every 10 minutes accounted for |
| W4 Numerical hypothesis | Testable number, not a blank-page discussion |
| W5 Facilitation tactics | Push/listen/escalate triggers |
| W6 Worksheets | Pre-built worksheets or canvases |
| W7 Decision capture | Decision, by whom, why, dissent, follow-ups |
| W8 Pre-mortem | 15 min ritual |
| W9 Stakeholder map | Influence x interest grid and named pre-work 1:1s |
| W10 Post-read tracker | Post-read and commitments tracker within 24h |

Do:

| Do | Why |
|---|---|
| Start with a numerical hypothesis | It focuses the room on judgment |
| Name derailment tactics before the meeting | The facilitator should not improvise governance |
| Capture dissent in the room | Later objections become evidence, not gossip |

Do not:

| Do not | Why |
|---|---|
| Run a workshop from slides alone | The artifact must create decisions |
| Leave agenda blocks vague | Time-boxes are the operating system |
| Send no post-read | Commitments decay within a day |

Worked exemplar: `docs/standards/exemplars/workshop-time-ai-fit.md`.

## Rubric I - Data-collection Instrument

| Criterion | Required evidence |
|---|---|
| I1 Sample math | Sample size and statistical confidence |
| I2 Bias controls | Response, selection, social-desirability controls |
| I3 Privacy and consent | Consent plus anonymization-at-source for person-level data |
| I4 Validation rules | Capture-time validation |
| I5 Triangulation | Cross-check plan; no single instrument is truth |
| I6 Calibration questions | Attention checks or calibration questions |
| I7 Cleaning checklist | 15 named cleaning steps |
| I8 Edge cases | Explicit handling guide |
| I9 Missing-data sensitivity | How conclusions change with missingness |
| I10 Refresh cadence | Owner and recurrence |

Do:

| Do | Why |
|---|---|
| Design privacy into capture | Retrofitting privacy is weaker |
| Separate telemetry from self-report | Each has different bias |
| Predefine missing-data thresholds | It prevents after-the-fact rationalization |

Do not:

| Do not | Why |
|---|---|
| Ask for individual productivity rankings | It creates bad incentives |
| Treat a survey as the answer | It is one instrument in triangulation |
| Skip cleaning steps | Dirty evidence makes precise math misleading |

Worked exemplar: `docs/standards/exemplars/instrument-dora-baseline.md`.

## Rubric P - Corpus Pattern

| Criterion | Required evidence |
|---|---|
| P1 Quantified claim | Number, scope, horizon |
| P2 Evidence chunks | 3-5 chunks with primary citation |
| P3 Counterarguments | At least two named counterarguments |
| P4 Calibrated confidence | Confidence and reason |
| P5 Boundary conditions | When this does not apply |
| P6 Failure modes | At least two named failure modes |
| P7 Maturity linkage | Link to maturity model |
| P8 Vertical overlay | How industry changes the pattern |
| P9 Related patterns | Graph relationships |
| P10 So what | Synthesis paragraph |

Do:

| Do | Why |
|---|---|
| State the claim as a decision input | Patterns should change a recommendation |
| Steelman counterarguments | Weak objections make weak advice |
| Pin applicability boundaries | Patterns are dangerous when overgeneralized |

Do not:

| Do not | Why |
|---|---|
| Write thought leadership | Corpus patterns must be operational |
| Cite only secondary summaries | Primary citations carry the weight |
| Hide confidence | Executives need calibrated uncertainty |

Worked exemplar: `docs/standards/exemplars/pattern-productivity-value.md`.

## Rubric G - Move Gate

| Criterion | Required evidence |
|---|---|
| G1 RACI owner | Single accountable owner |
| G2 Artifact criteria | Required artifacts and completion criteria |
| G3 Evidence anchors | Audit trail |
| G4 Numeric kill criteria | Numeric thresholds |
| G5 Sensitivity | Gate-level sensitivity analysis |
| G6 Pre-mortem | Ritual before decision |
| G7 Decision and dissent | Capture plus dissent log |
| G8 Time budget | P50/P90 |
| G9 Hand-off | Next-gate ritual |
| G10 Maturity great | What great looks like |

Do:

| Do | Why |
|---|---|
| Make kill criteria numeric | Otherwise every weak pilot survives |
| Keep dissent attached to the decision | It improves later replay |
| Define the hand-off | Gates are transitions, not ceremonies |

Do not:

| Do not | Why |
|---|---|
| Let a committee be accountable | Single owner means someone can decide |
| Use red/yellow/green without thresholds | Color is not governance |
| Advance without evidence anchors | The audit trail is the product memory |

Worked exemplar: `docs/standards/exemplars/gate-wave1-pilot.md`.

## Rubric S - Sentinel Reasoning Output

| Criterion | Required evidence |
|---|---|
| S1 Clarifies gaps | Clarifying questions when context is incomplete |
| S2 Named frame | Named reasoning frame |
| S3 Tenant evidence | Tenant evidence per claim |
| S4 Corpus citations | Corpus pattern per recommendation |
| S5 Confidence | Confidence per recommendation |
| S6 Dissent | First-class dissent block |
| S7 View-change hedge | What would change my view |
| S8 Constraint sensitivity | Top user constraint reflected |
| S9 Next action | Named Move, workshop, or instrument |
| S10 Audit trail | Reasoning trace anchor |

Do:

| Do | Why |
|---|---|
| Separate facts from recommendations | Grounding must be visible |
| Include dissent before next steps | It prevents one-way persuasion |
| Name the next action | Sentinel should move work forward |

Do not:

| Do not | Why |
|---|---|
| Answer as generic strategy prose | Sentinel is tenant-grounded |
| Cite corpus without tenant evidence | Patterns need local fit |
| Omit the audit trail | Reasoning must be replayable |

Worked exemplar: `docs/standards/exemplars/sentinel-it-productivity-output.md`.
