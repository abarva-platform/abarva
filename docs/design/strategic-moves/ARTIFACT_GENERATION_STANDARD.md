# Strategic Moves Artifact Generation Standard

Status: active doctrine  
Owner: Strategic Moves runtime  
Applies to: P0-P5 Strategic Moves artifact generation, draft/final generation, review/regenerate, and future adaptive-rigor/demo workloads.

## Product Doctrine

AbarVa is an AI Success Platform. Strategic Moves turns a business opportunity into a governed Move: opportunity, charter, discovery, design, roadmap, and mobilization. The P0-P5 phase model stays intact. The platform must not add phases casually, weaken gates, fake evidence, mark drafts final, or reduce artifact quality to make UI proof easier.

Every artifact is a client work product. It must be good enough to support sponsor review, workshops, steering-committee discussion, board preparation, or mobilization. A thin AI summary is not acceptable.

## Core Principle

Every Strategic Moves artifact must be:

- premium consulting-grade
- evidence-bound
- phase-aligned
- use-case-specific
- visually structured
- decision-useful
- honest about what is known, assumed, missing, waived, or pending approval

Claude must receive a complete assignment: audience, decision, phase, available evidence, missing evidence, open gates, next client action, required structure, and quality bar.

## Standard Artifact Brief

Every Strategic Moves prompt must be assembled from the same structured brief.

### 1. Artifact Identity

- tenant/client name or key
- client-facing move name/reference when available
- raw move/system identifiers only in trace or audit metadata, never in the client-facing artifact body
- phase and artifact type
- draft/final mode
- intended audience
- purpose and intended use
- current phase state
- gate state

### 2. Business Context

- business problem
- strategic intent
- function, process, or domain in scope
- desired change
- value hypothesis
- sponsor and owner status
- key stakeholders
- expected decisions

### 3. Evidence Base

The prompt must bind the richest available evidence, not metadata only:

- uploaded file list and extracted content where available
- relevant excerpts from uploaded documents
- CSV/XLSX structured summaries and facts
- baseline metrics
- process notes
- stakeholder notes
- policy/control notes
- systems landscape
- known evidence
- inferred observations
- assumptions for review
- missing evidence
- waived evidence

If extracted content exists, do not pass only file names.

### 4. Readiness And Gates

- readiness score or status where available
- covered evidence slots
- missing evidence slots
- optional/recommended evidence still open
- hard vs soft gate status
- sponsor assignment/signoff status
- draft/final eligibility
- blockers to final

### 5. Phase-Specific Assignment

Each phase has a different job. The prompt must name what the artifact should do and what it must not do.

### 6. Quality Bar

- executive tone
- evidence-bound writing
- phase alignment
- specificity
- next action
- visual structure
- no internal language
- no fake certainty
- no unsupported value claims
- no generic AI filler

## Target Length And Token Budget

Artifact quality must not be constrained by arbitrary short output limits. If the UI cannot handle a useful artifact, fix rendering rather than shrinking the document.

| Artifact | Target words | Minimum words |
| --- | ---: | ---: |
| P0 Opportunity Brief | 1,200-1,800 | 900 |
| P1 Move Charter | 2,000-3,500 | 1,500 |
| P1 Scope Boundary | 1,200-2,000 | 900 |
| P1 Success Criteria | 1,000-1,800 | 800 |
| P2 Current Work Diagnostic | 3,000-5,000 | 2,500 |
| P2 Discovery Interview Guide | 1,800-3,000 | 1,500 |
| P2 Evidence Request List | 1,200-2,000 | 900 |
| P2 Readiness / AI-Fit View | 1,500-2,500 | 1,200 |
| P3 Future-State Blueprint | 3,500-6,000 | 2,500 |
| P3 Human + AI Role Model | 2,000-3,500 | 1,500 |
| P4 Roadmap / Business Case | 3,000-5,000 | 2,500 |
| P5 Mobilization / Handoff Pack | 2,500-4,000 | 2,000 |

## Phase Standards

### P0 Originate

P0 frames the opportunity. It must cover the trigger, problem, value, affected stakeholders, evidence available, missing inputs, and recommendation on whether to advance to P1.

Required structures:

- problem / evidence / implication table
- stakeholder map
- known / unknown evidence table
- proceed / hold / stop gate recommendation

### P1 Charter

P1 defines the Move. It must answer: what problem is being solved, what is in scope, what is out of scope, who owns the Move, what outcomes matter, what success means, what assumptions remain, what decisions are needed, and what evidence is still unresolved.

P1 must not over-design the future solution.

Required structures:

- scope in / out / adjacent table
- stakeholder and decision-rights table
- success criteria table
- assumptions and evidence gaps table
- decision log
- next working-session agenda

### P2 Discover And Diagnose

P2 diagnoses the current work. It must answer: how work runs today, where handoffs happen, where delays/rework/leakage/risk occur, what exception types matter, what evidence supports those findings, what is still unknown, and whether the problem is process, data, policy, control, ownership, or AI-fit.

P2 may identify AI opportunities, but must not jump to a fully designed future state.

Required structures:

- current-state handoff map
- exception taxonomy
- pain point / root cause matrix
- process vs data vs policy vs ownership vs AI matrix
- control implications
- evidence coverage table
- next evidence request table
- owner / action matrix

### P3 Design Future State

P3 designs the future way of working. It must cover human roles, AI roles, controls, data/platform dependencies, adoption implications, and open decisions. It must not finalize the business case unless P4 evidence exists.

Required structures:

- current vs future workflow
- human + AI role model
- decision rights
- control model
- data/platform dependency map
- adoption implications
- open design decisions

### P4 Roadmap And Business Case

P4 sequences work and frames value. It must show evidence, baselines, directional estimates, investment assumptions, risks, dependencies, and build/buy/partner implications.

Required structures:

- roadmap
- value levers
- baseline/target metrics
- benefits logic
- dependency and risk table
- funding decision brief
- build/buy/partner view

### P5 Mobilize And Handoff

P5 mobilizes execution. It must show owners, governance cadence, open decisions, Tower tracking, Source support, delivery model, and the next 30/60/90 days. If Tower or Source activation is not configured, say so truthfully.

Required structures:

- mobilization plan
- governance cadence
- owner/action matrix
- Tower handoff
- Source/partner brief where applicable
- open decision/risk log
- value tracking
- 30/60/90 plan

## Draft Vs Final Rules

Draft generation is allowed before final gate approval when enough context exists. Drafts support sponsor review, workshops, refinement, and evidence-gap closure.

Every draft must show:

- pre-gate review status
- gate caveats
- missing evidence
- decisions needed
- blockers to final

Drafts must not:

- satisfy gates
- mark themselves final
- advance the phase
- imply sponsor approval
- claim board-ready status

Required draft caveat:

> This is a pre-gate review draft generated from available evidence. It is intended for sponsor review, workshop preparation, and refinement. It is not final or board-ready until sponsor assignment, charter signoff, and phase gate approval are completed.

Final artifacts require:

- capture complete
- gate approval
- sponsor/owner conditions satisfied
- evidence covered or explicitly waived
- golden-bar quality passed
- no hard blockers

## Evidence-Bound Writing Rules

Every substantive claim must be treated as one of:

- supported by uploaded evidence
- inferred from evidence
- assumption for review
- missing evidence
- decision needed

Use natural client-facing wording:

- "the uploaded exception report indicates"
- "stakeholder notes suggest"
- "current evidence supports"
- "this remains an assumption until"
- "this cannot be finalized until"

Avoid:

- fake certainty
- unsupported ROI
- generic "AI will improve"
- "best practice" without evidence
- "fully automated" without control analysis
- "will deliver" unless value is proven

### Evidence Priority Rule

Concrete extracted evidence must be surfaced before advisory interpretation.
Premium artifacts must prioritize evidence in this order:

1. exact extracted metrics from uploaded evidence
2. structured CSV/XLSX summaries
3. stakeholder/process notes
4. policy/control evidence
5. systems landscape evidence
6. inferred observations
7. assumptions for review
8. general advisory pattern

If exact metrics, exception categories, owners, risk levels, or baseline figures are available, the artifact must use them in the executive summary, diagnostic tables, and evidence matrix. Claude must not produce a polished consulting document that fails to use the strongest available evidence.

For P2 Current Work Diagnostic artifacts specifically:

- start with a metrics-backed diagnostic thesis
- include exact available metrics in the executive summary
- use the exception taxonomy from uploaded evidence
- cite owners and risk levels when available
- distinguish validated metrics from finance-validation caveats
- build handoff maps from process notes
- build control sections from payment/control evidence when present
- build systems/data sections from systems landscape evidence when present
- make missing evidence client-actionable with owner, use, and gate impact
- keep draft/final gates honest when readiness is partial

## Regeneration Standard

Regeneration is not a patch.

When review feedback is submitted, Claude must receive:

- original artifact
- review feedback
- parsed feedback items
- artifact purpose
- phase context
- evidence base
- gate status
- missing evidence
- quality issues
- instruction to produce a complete revised artifact

The regeneration prompt must say:

- preserve the strongest parts of the prior artifact
- apply feedback substantively
- rewrite affected sections
- improve structure where needed
- add required tables/matrices if missing
- preserve evidence caveats
- return the complete updated artifact
- do not return a short delta note

If the regenerated artifact is shorter than the original, the quality gate should flag whether completeness was harmed.

## Golden-Bar Quality Standard

The golden bar must evaluate substance, not just formatting.

Checks should cover:

1. artifact completeness
2. minimum depth by artifact type
3. phase alignment
4. evidence usage
5. specificity to use case
6. executive readability
7. decision usefulness
8. missing-evidence honesty
9. visual/table usefulness
10. draft/final status correctness
11. no internal language leakage
12. no fake certainty
13. no unsupported value claims

Golden-bar should fail or pass with caveats if an artifact is too short, generic, ahead of phase, missing required tables, ignoring review feedback, or incorrectly marked final.

## Forbidden Internal Language

Artifacts must not expose:

- kernel
- seed
- function-pack
- generated-pack
- source row
- raw route
- blob path
- tenant key
- debug
- canonical internal ID
- prompt
- model call
- JSON
- implementation details

Use client-facing language instead:

- evidence base
- missing evidence
- generated artifact
- review draft
- decision packet
- phase deliverable
- readiness gap
- quality check
- value proof
- operating model
- future workflow
- control point

## Implementation Expectations

- Use one shared prompt contract for Strategic Moves artifacts.
- Upgrade P1 and P2 first, then prove before expanding to P3/P4/P5.
- Bind evidence excerpts and structured summaries where available.
- Use artifact-specific token budgets.
- Save new artifacts as draft/review-required unless final gate rules are met.
- Regeneration must produce a complete revised artifact.
- Tests must fail shallow P1/P2 artifacts, missing required P2 exhibits, and internal language leakage.
