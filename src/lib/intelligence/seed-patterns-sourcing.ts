import type { PatternSeed } from './seed-types';

export const SOURCING_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-001',
    slug: 'vendor-bafo-orchestration',
    title: 'Vendor BAFO Orchestration',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Late-stage sourcing events produce reliable decisions when the BAFO round is treated as a governed evidence-collection sequence rather than an informal commercial follow-up.',
    applicability:
      'Apply when a sourcing event has narrowed to a finalist set and the commercial decision must be made on comparable submissions, explicit dates, and named decision owners.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.86,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-002', 'PAT-SRC-007', 'PAT-SRC-011'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Source events become decision-grade when the BAFO stage is run as a bounded workflow with invited vendors, explicit due dates, and a named selection committee. The AMS Vendor Consolidation 2026 storyline shows this directly: Northstar Managed Services and ArcVault Managed were invited to BAFO, responses were due May 15 2026, the committee meeting was scheduled for May 22 2026, and the award recommendation targeted May 30 2026.

## When to apply
Use this pattern when an event has moved past broad-market discovery into a finalist round and the downstream programme or operating decision is waiting on a commercial answer. It is especially relevant when delay in BAFO would compress another milestone, as with the APX-CDP-2026 Q3 integration window.

## How it works
Define the finalist set, lock the BAFO due date, name the negotiation points per vendor, and expose the committee members who own the award decision. Keep the BAFO round tied to the event stage rather than handling it in email-only side channels. In the AMS storyline, the working sequence is visible: finalists invited, negotiation points recorded, response deadline fixed, committee calendar defined, then award recommendation prepared.

## Variations
For smaller events, BAFO may involve two vendors and a single approval meeting. For higher-risk events, the BAFO round may include multiple submissions, extra validation checkpoints, or dependency reviews from linked programmes before committee sign-off.

## Pitfalls
The pattern fails when BAFO is treated as an unstructured pricing chase, when the due date is soft, or when the approval group is implicit instead of named. It also breaks when programme dependencies are hidden, allowing sourcing timelines to slip without downstream consequences being surfaced.

## Instances
- AMS Vendor Consolidation 2026: two-vendor BAFO with responses due May 15 2026
- Selection committee: Priya Mehta, Marcus Chen, Fiona Wallace
- Award recommendation target: May 30 2026
- Programme dependency: APX-CDP-2026 gate waits on BAFO evidence`,
  },
  {
    id: 'PAT-SRC-002',
    slug: 'vendor-response-completeness-threshold',
    title: 'Vendor Response Completeness Threshold',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Final-round vendor decisions improve when response completeness is enforced as a threshold gate instead of being compensated for during subjective committee discussion.',
    applicability:
      'Apply when proposals or BAFO responses vary in completeness across pricing, staffing, governance, transition, or service-scope sections.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-006', 'PAT-SRC-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Proposal quality is not only about price. The sourcing surface repeatedly emphasizes response completeness, scorecard readiness, and missing-input visibility as first-order decision inputs. In the AMS storyline, finalists must clarify tier-2 pricing, staffing, governance, and scope boundaries before the event can advance cleanly through BAFO.

## When to apply
Use this pattern when proposals are comparable enough to remain in process but some submissions are incomplete in ways that would distort scoring or committee confidence. It fits events with scorecard governance and named artifacts rather than ad hoc email collections.

## How it works
Define the response sections that must be complete before a vendor can be fairly evaluated. Track completeness alongside pricing and risk rather than after the fact. A vendor that omits a core input stays in a governed holding state until the gap is resolved or becomes an exclusion reason. This keeps missing information from being disguised as negotiable nuance.

## Variations
Completeness thresholds may be light for early RFI stages and strict for BAFO. In regulated or transformation-critical events, completeness may extend to staffing plans, governance model definitions, evidence traces, and implementation dependencies.

## Pitfalls
The pattern loses value if reviewers silently score around missing sections, if incomplete submissions are normalized because the vendor is strategically preferred, or if missing-input tracking is not visible at the event level.

## Instances
- BAFO negotiation points in AMS include dedicated staffing, governance framework completion, and scope separation
- Scorecard governance is a distinct route in the Source surface
- Missing-input visibility is part of the Source and provenance design
- Vendor responses are evaluated before selection, not after award`,
  },
  {
    id: 'PAT-SRC-003',
    slug: 'ten-stage-sourcing-event-governance',
    title: 'Ten-Stage Sourcing Event Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Strategic sourcing work is more explainable and reusable when the event lifecycle is modelled as a fixed stage system with explicit stage and gate status values.',
    applicability:
      'Apply to sourcing programmes that need transparent progression from intake through value realization and must expose status to downstream users or agents.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 10,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-004', 'PAT-SRC-011'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Source module defines sourcing work as a ten-stage workflow: intake, scope, sourcing_strategy, rfp_rfi_package, vendor_responses, evaluation, orals_bafo, selection, contract_mobilization, and value_realization. That lifecycle provides a stable control frame for events, artifacts, agents, and downstream narrative.

## When to apply
Use this pattern when a sourcing surface must do more than store documents. It is especially useful when executives, programme teams, and validating agents need a shared state model for what has happened, what is active, and what is still blocked.

## How it works
Represent the event using a fixed stage vocabulary and pair it with lifecycle, stage, and gate statuses. Drive panels, artifact readiness, and agent summaries from the current stage. In the demo source baseline, AMS Vendor Consolidation 2026 is clearly positioned at stage 7, orals_bafo, which is what makes the rest of the storyline legible.

## Variations
The stage model can stay constant while individual categories, templates, and evidence rules differ by event type. Some tenants may spend longer in evaluation or mobilization, but the structural sequence remains stable.

## Pitfalls
The pattern weakens when teams invent one-off stage names, collapse evaluation and BAFO into a single opaque step, or fail to update stage state as the event moves.

## Instances
- Ten stage keys are enumerated in the Source build spec
- AMS Vendor Consolidation 2026 is anchored at stage 7: orals_bafo
- Stage gate and artifact status systems are modelled separately
- Smoke tests are defined against stage-correct rendering of the AMS storyline`,
  },
  {
    id: 'PAT-SRC-004',
    slug: 'linked-program-commercial-dependency-mapping',
    title: 'Linked-Program Commercial Dependency Mapping',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'A sourcing event becomes strategically useful when its downstream programme dependencies are explicit, traceable, and visible on the event itself.',
    applicability:
      'Apply when a commercial event informs a transformation programme gate, architecture choice, or value-hypothesis decision outside the sourcing workflow.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-012'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Source is defined as the ground-truth commercial layer feeding Programs, Tower, and Intelligence. The strongest example is the explicit link between AMS Vendor Consolidation 2026 and APX-CDP-2026, where the procurement outcome is a gating input to the CDP programme's Design progression.

## When to apply
Use this pattern when the sourcing decision materially affects another workstream's timeline, readiness, commercial assumptions, or architecture path. If a linked programme will need to explain why it is waiting, the dependency should be mapped in Source.

## How it works
Attach the sourcing event to the downstream programme, surface the linked badge or dependency chip, and describe what commercial evidence the programme is waiting for. This turns the sourcing event from a local procurement workspace into part of a connected decision chain.

## Variations
One event may inform a single programme gate, several dependent projects, or a Tower-level vendor posture. The representation can differ, but the rule stays the same: commercial outcomes must remain attached to the decisions they constrain.

## Pitfalls
The pattern fails when linkages are implied verbally but not represented in the system, when programme teams receive only the final vendor answer with no commercial context, or when sourcing delay is treated as isolated from delivery risk.

## Instances
- AMS Vendor Consolidation 2026 links to APX-CDP-2026
- Programme gate cannot advance until BAFO evidence lands
- Tower spec cites source events as upstream inputs for vendor and spend decisions`,
  },
  {
    id: 'PAT-SRC-005',
    slug: 'vendor-consolidation-event-architecture',
    title: 'Vendor Consolidation Event Architecture',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Multi-vendor consolidation decisions are more defensible when the event is structured around comparative architecture, commercial scope, and elimination logic rather than price-alone shortlisting.',
    applicability:
      'Apply to sourcing events where an enterprise is reducing vendors, rationalizing operating scope, or selecting a strategic long-horizon managed-services partner.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-006', 'PAT-SRC-008', 'PAT-SRC-009'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Vendor consolidation events are not ordinary purchasing rounds. They compress architectural fit, transition risk, SLA scope, and commercial leverage into one decision. The AMS storyline demonstrates this with four vendors, comparative elimination reasons, and a downstream programme dependency that makes weak vendor architecture unacceptable even if a price looks attractive.

## When to apply
Use this pattern for managed-services consolidation, platform partner reduction, or strategic vendor rationalization where the objective is fewer, stronger partners rather than lowest-price award alone.

## How it works
Frame the event around comparative operating models, implementation viability, governance maturity, and normalized commercial terms. Keep every exclusion reason explicit and traceable to evidence. The event must answer not only who is cheaper, but who can carry the required architecture without creating downstream risk.

## Variations
Some consolidations emphasize cost takeout, others capability modernization, geographic coverage, or governance maturity. The structure can flex, but the decision should still compare vendors on architecture, operating readiness, and evidence-backed eliminators.

## Pitfalls
The pattern degrades when vendor elimination is narrative-only, when the event is reduced to spreadsheet price comparison, or when longer-term architectural lock-in is ignored during shortlist design.

## Instances
- AMS Vendor Consolidation 2026 uses four vendors and narrows to two BAFO finalists
- Exclusion reasons are explicit rather than generic
- The event feeds a linked transformation programme, not a stand-alone procurement award`,
  },
  {
    id: 'PAT-SRC-006',
    slug: 'transition-plan-sufficiency-screen',
    title: 'Transition Plan Sufficiency Screen',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Transition plans should function as a hard screening device in managed-services sourcing because inadequate transition detail predicts delivery instability after award.',
    applicability:
      'Apply when vendors will assume live operational scope and must show migration sequencing, staffing, governance, and change-control readiness before award.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-002', 'PAT-SRC-005', 'PAT-SRC-012'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Transition quality is a first-order sourcing criterion in operating-model events. In the AMS storyline, BlueMaster Operations was excluded from BAFO not on pricing, but because its transition plan was materially insufficient: six pages versus a 25-40 page expectation for the event's complexity.

## When to apply
Use this pattern in outsourcing, managed-services, and transformation events where the cost of a weak transition exceeds any short-term pricing advantage.

## How it works
Set an explicit expectation for transition-plan depth and required sections, then treat failure to meet that bar as an elimination reason. The pattern works best when transition sufficiency is assessed before the final negotiation round so the committee does not spend BAFO effort on a structurally weak candidate.

## Variations
In smaller scope transfers the sufficiency bar may be lighter, but it still needs clear minimum coverage. In large multi-tower transitions the screen may include staffing ratios, day-one controls, knowledge transfer sequencing, and governance design.

## Pitfalls
Teams often rationalize a weak transition plan because the vendor is inexpensive or operationally familiar. That creates avoidable post-award risk and undermines the credibility of the selection process.

## Instances
- BlueMaster Operations excluded from BAFO for inadequate transition-plan quality
- Expected transition-plan depth cited as 25-40 pages for the AMS event`,
  },
  {
    id: 'PAT-SRC-007',
    slug: 'vendor-bafo-scoring-rubric',
    title: 'Vendor BAFO Scoring Rubric',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Final-round vendor comparison is reusable at scale when BAFO submissions are scored through a stable rubric that binds pricing, scope, staffing, governance, and risk into one comparable frame.',
    applicability:
      'Apply when a sourcing team needs to compare finalist vendors fairly, explain the ranking to executives, and reuse the structure across events.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.87,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 23,
    sourceDocuments: [
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-002', 'PAT-SRC-008'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The intelligence design spec calls out a sourcing pattern with the highest reuse count in the library: PAT-SRC-PROC-007, described as a vendor BAFO scoring rubric with 23 instances. The Source surface reinforces why: scorecard governance, pricing comparison, completeness, and vendor readiness all converge in the BAFO decision.

## When to apply
Use this pattern when finalists remain viable and the team must differentiate them through a repeatable scoring frame rather than unstructured narrative preference.

## How it works
Build a rubric that scores finalist vendors across commercial position, scope fidelity, transition readiness, governance maturity, staffing confidence, and programme-fit risks. Lock the rubric before BAFO responses arrive, then score against the agreed criteria so the committee can compare submissions consistently.

## Variations
Some events weight price and transition highest; others weight compliance, governance, or technology fit. The rubric can flex by category, but the act of forcing comparable dimensions is the pattern's core.

## Pitfalls
The rubric loses value if criteria are changed after responses arrive, if missing inputs are waived silently, or if committee members use the rubric only as a decorative appendix rather than the operating decision frame.

## Instances
- Intelligence design spec cites vendor BAFO scoring rubric as the top-reuse sourcing pattern at 23 instances
- AMS scorecard governance and pricing-comparison panels imply a reusable BAFO evaluation frame
- BAFO negotiation points for Northstar and ArcVault map naturally into rubric dimensions`,
  },
  {
    id: 'PAT-SRC-008',
    slug: 'vendor-price-benchmarking-and-variance-normalization',
    title: 'Vendor Price Benchmarking and Variance Normalization',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Commercial decisions improve when vendor pricing is normalized against scope and benchmark variance instead of being read as absolute numbers in isolation.',
    applicability:
      'Apply when pricing bands vary significantly across proposals or when downstream strategy questions depend on understanding commercial spread, not just list rates.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-005', 'PAT-SRC-007', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The AMS sourcing storyline highlights pricing divergence as a core signal rather than a footnote. Sentinel flags significant spread across four proposals, and the Source spec uses a benchmark reference point: pricing comparison locked at 14% variance to benchmark. That makes normalization a sourcing pattern, not merely a financial calculation.

## When to apply
Use this pattern when proposals show large commercial spread, when categories bundle different tower scopes, or when adjacent decisions such as AI cost strategy need a reusable way to reason about vendor price posture.

## How it works
Normalize vendor pricing against scope boundaries, benchmark bands, and tower decomposition before using price in a finalist decision. Expose the resulting variance clearly so the team can separate true cost advantage from scope distortion or hidden assumptions.

## Variations
Normalization may be lightweight in commodity events and more complex in multi-tower managed-services events. It can also feed adjacent domains such as Tower cost-pressure analysis or AI vendor consolidation discussions.

## Pitfalls
The pattern fails when price is compared without scope normalization, when benchmark data is implied but not shown, or when a below-market bid is treated as inherently attractive without examining what has been omitted.

## Instances
- PAT-AMS-001 identifies pricing divergence across all four AMS proposals
- Source spec cites pricing locked at 14% variance to benchmark
- AI cloud spend pressure storyline reuses sourcing-style normalization thinking for vendor economics`,
  },
  {
    id: 'PAT-SRC-009',
    slug: 'negotiation-leverage-preservation',
    title: 'Negotiation Leverage Preservation',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprises preserve negotiating power by keeping finalists comparable, deferring premature commitment signals, and separating base scope from advisory or optional commercial add-ons.',
    applicability:
      'Apply when a sourcing team is managing a finalist round and wants to avoid giving away leverage through unclear scope, single-vendor dependence, or bundled commercial asks.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-005', 'PAT-SRC-008'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The vendor consolidation playbook storyline depends on preserving leverage across the negotiation round. In the AMS event, two finalists remain active, negotiation points are explicit per vendor, and one of ArcVault's asks is to separate rationalisation advisory from AMS base scope rather than letting the vendor bundle it into a harder-to-compare offer.

## When to apply
Use this pattern when the buying team still has optionality across finalists and wants the BAFO to strengthen, not weaken, comparative leverage.

## How it works
Keep more than one credible finalist in play where possible, clarify negotiation points separately by vendor, and force optional or advisory elements to be itemized rather than folded into the base service. This preserves the ability to compare responses and walk away from hidden margin capture.

## Variations
Leverage preservation may show up as explicit dual-finalist BAFO, modular commercial decomposition, or timed governance checkpoints before any vendor is treated as preferred.

## Pitfalls
The pattern weakens when the team signals a preferred vendor too early, accepts bundled pricing that obscures base scope, or allows schedule pressure to eliminate optionality before comparative evaluation is complete.

## Instances
- Two AMS finalists remain in play through BAFO
- ArcVault BAFO ask explicitly separates rationalisation advisory from AMS base
- Vendor consolidation playbook in the backlog references this pattern with PAT-SRC-005`,
  },
  {
    id: 'PAT-SRC-010',
    slug: 'vendor-claim-verification-protocol',
    title: 'Vendor-Claim Verification Protocol',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Commercial claims should be handled as testable assertions with evidence and contradiction hooks, not accepted at face value during sourcing.',
    applicability:
      'Apply when vendors make delivery, staffing, pricing, or implementation claims that materially affect selection and cannot be trusted without corroboration.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.88,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 5,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-008', 'PAT-SRC-010', 'PAT-SRC-012'],
    derivedFromPatternIds: [],
    taggedContradictionIds: ['CON-001'],
    body: `## Summary
The Source build spec defines Sentinel's voice around verified, asserted, and inferred facts. That is a sourcing protocol: separate what is evidenced from what a vendor claims, then trace unresolved gaps into contradiction handling. The pattern is critical when claims about implementation speed, staffing sufficiency, or scope completeness would alter the selection outcome.

## When to apply
Use this pattern any time a proposal contains claims that are commercially important but not yet demonstrated. It is especially important in BAFO, where teams are vulnerable to accepting optimistic statements because a decision deadline is near.

## How it works
Record each material vendor claim, identify the source of evidence, distinguish verified facts from vendor assertions, and mark unresolved conflicts explicitly. Feed any hard contradiction into the contradiction layer rather than burying it inside selection notes. This creates a reusable chain from claim, to verification, to contradiction, to decision.

## Variations
Some events need lightweight claim verification focused on pricing and staffing. Others need deeper protocols for implementation timelines, regulatory commitments, security posture, or service-transition promises.

## Pitfalls
The pattern breaks when teams collapse verified and asserted facts into a single narrative, when missing evidence is treated as harmless optimism, or when contradictions are discussed informally but never registered in the system.

## Instances
- Sentinel voice spec distinguishes verified, asserted, and inferred content
- Source example calls out "Asserted by Vendor B: 90-day implementation"
- AMS event contains vendor claims around staffing, governance, and onboarding realism
- CON-001 is pre-linked for contradiction resolution in Phase 1`,
  },
  {
    id: 'PAT-SRC-011',
    slug: 'selection-committee-governance-cadence',
    title: 'Selection Committee Governance Cadence',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Final vendor decisions are more durable when the approval forum, chair, participants, and calendar are explicit before BAFO responses arrive.',
    applicability:
      'Apply when a sourcing event requires executive or cross-functional approval and committee timing can become the hidden critical path.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Decision velocity in sourcing depends as much on governance readiness as on vendor readiness. The AMS BAFO storyline names the selection committee members, identifies Priya Mehta as chair, and places a committee checkpoint on May 22 2026 before the target award recommendation on May 30 2026.

## When to apply
Use this pattern when multiple functions must agree on a finalist and the risk is not only analysis quality but governance drift or missing approver availability.

## How it works
Define the committee composition, chair, meeting date, and expected decision artifact before the final responses arrive. Tie the event timeline to that cadence so sourcing does not produce a decision package that then waits silently for calendar clearance.

## Variations
In some events the committee is small and operational; in others it includes executive sponsors, procurement, finance, and delivery owners. The pattern works across both if the governance path is explicit.

## Pitfalls
The pattern fails when sourcing assumes approval will materialize after analysis, when the chair is ambiguous, or when meetings are scheduled after the nominal commercial deadline has already passed.

## Instances
- Selection committee members listed for AMS: Priya Mehta, Marcus Chen, Fiona Wallace
- Steward mission includes confirming the May 22 committee meeting
- Award recommendation target is May 30 2026`,
  },
  {
    id: 'PAT-SRC-012',
    slug: 'mobilization-timeline-reality-check',
    title: 'Mobilization Timeline Reality Check',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Sourcing decisions should explicitly discount vendors whose onboarding or mobilization timelines conflict with programme dependency windows, even when the proposal is otherwise attractive.',
    applicability:
      'Apply when award timing affects a downstream delivery milestone, integration window, or seasonal operating commitment.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.86,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-004', 'PAT-SRC-006', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The AMS storyline makes timeline realism a selection criterion. DataPeak Services was excluded because its 16-week onboarding plan conflicted with the CDP programme's Q3 integration window. The commercial event therefore treated mobilization duration as a hard dependency question, not a post-award planning detail.

## When to apply
Use this pattern when implementation timing affects a linked programme, a seasonal business window, or a mandated cutover period that cannot absorb mobilization drift.

## How it works
Compare each vendor's onboarding and mobilization assumptions against the downstream calendar that actually matters. If the proposed timeline compresses or misses that window, treat it as an evidence-backed exclusion or scoring penalty even if the commercial offer is otherwise strong.

## Variations
The timeline check may focus on onboarding duration, named staffing start dates, governance setup lead time, or dependency sequencing against another programme's gate.

## Pitfalls
Teams often treat timeline claims as negotiable optimism and only discover the conflict after award. That shifts sourcing risk into delivery and makes the later programme gate look unexpectedly blocked.

## Instances
- DataPeak Services excluded because 16-week onboarding conflicts with APX-CDP-2026 Q3 integration timing
- Source demo warns that selection slip past June compresses the CDP window
- Programme gate remains pending until BAFO evidence resolves the commercial dependency`,
  },
];

export const SOURCING_PATTERN_COUNT = SOURCING_PATTERNS.length;
export const SOURCING_PATTERN_IDS = SOURCING_PATTERNS.map((pattern) => pattern.id);

export default SOURCING_PATTERNS;
