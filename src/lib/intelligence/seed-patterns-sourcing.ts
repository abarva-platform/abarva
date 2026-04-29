import type { PatternSeed } from './seed-types';
import { SOURCING_CATEGORY_PATTERNS } from './seed-patterns-sourcing-categories';
import { SOURCING_CONTRACT_AUDIT_PATTERNS } from './seed-patterns-sourcing-contracts-audit';
import { SOURCING_CONTRACTS_COMMERCIAL_PATTERNS } from './seed-patterns-sourcing-contracts-commercial';
import { SOURCING_CONTRACT_PATTERNS } from './seed-patterns-sourcing-contracts';
import { SOURCING_PRICING_CLOUD_PATTERNS } from './seed-patterns-sourcing-pricing-cloud';
import { SOURCING_PRICING_PATTERNS } from './seed-patterns-sourcing-pricing';
import { SOURCING_PROCESS_PATTERNS } from './seed-patterns-sourcing-process';
import { SOURCING_REGULATORY_AI_PATTERNS } from './seed-patterns-sourcing-regulatory-ai';
import { SOURCING_REGULATORY_PATTERNS } from './seed-patterns-sourcing-regulatory';

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
- Programme dependency: APX-CDP-2026 gate waits on BAFO evidence

## Stage doctrine — BAFO
Issue BAFO invitation letter to 2–3 vendors (down-selecting from initial-bid field); include: specific areas for improvement (price levers, SLA uplifts, commercial term changes), a revised pricing template, and a firm deadline — no extensions. Conduct bilateral negotiation sessions before BAFO close: use competitive tension explicitly ("another vendor has addressed X, we expect you to match or exceed"); push on: unit pricing, implementation risk transfer, payment milestones, warranty periods, exit provisions. Identify price levers: volume commitments, payment terms acceleration, multi-year lock-in in exchange for rate card reduction, reduced scope optionality. Evaluate BAFO responses against the updated scorecard; re-run TCO model with final pricing; document final technical and commercial scores. Gate criteria before advancing: BAFO responses received by all invited vendors; evaluation panel scores finalised, documented, and signed by panel members; recommended vendor identified with full rationale; approval authority notified. Outputs: BAFO invitation letters, bilateral negotiation records, updated TCO model, BAFO evaluation report, panel scoring sign-off sheet.`,
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
- Award recommendation target is May 30 2026

## Stage doctrine — Selection
Prepare Award Recommendation Paper: summarise evaluation methodology, scoring outcomes, BAFO results, TCO comparison, and a clear recommendation with supporting rationale; include risk assessment of the recommended vendor. Present to the approval authority (CPO, CFO, board committee, or delegated approver per the Scheme of Delegation); obtain written approval before communicating to vendors. Initiate legal review of Heads of Terms and preferred contractual framework; identify material negotiation points (liability caps, IP ownership, data protection schedules, termination rights). Issue standstill notification to unsuccessful vendors (mandatory in regulated procurement; best practice in commercial); document debrief availability. Gate criteria before advancing: written award approval obtained from required authority; standstill period complete (or explicitly waived with legal sign-off); Heads of Terms agreed; contract negotiation formally commenced. Outputs: Award Recommendation Paper, approval authority sign-off, standstill notification letters, Heads of Terms, Negotiation Issues Log.`,
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
- Programme gate remains pending until BAFO evidence resolves the commercial dependency

## Stage doctrine — Award
Execute the contract: ensure all schedules (SLA schedule, data processing agreement, pricing schedule, change control procedure) are final, initialled, and signed by authorised signatories on both sides; store executed copies in the contract management system. Confirm implementation timeline, project governance structure (steering committee, operational cadence, escalation path), and first milestone dates in writing. Set SLA baselines: document initial performance benchmarks, measurement methodology, reporting cadence, and remedies framework (service credits, step-in rights, termination for cause triggers). Notify the incumbent supplier per contractual notice requirements; activate transition and exit plan; confirm data return/destruction obligations. Issue internal award announcement and activate the contract management framework; assign a named contract manager. Gate criteria before advancing: contract fully executed by both parties (wet or digital signatures confirmed); implementation timeline agreed in writing; SLA baselines documented; incumbent notified; contract registered in contract management system. Outputs: executed contract (all schedules), implementation timeline, SLA baseline register, incumbent notification letter, contract management framework activation record.`,
  },

  // ── Stage doctrine patterns (PAT-SRC-013 through PAT-SRC-019) ────────────────
  //
  // These patterns carry the full stage-level procurement doctrine for the ten
  // stages of the sourcing lifecycle. They supersede the freestanding
  // src/lib/agent/stage-playbooks.ts file and are retrieved via
  // src/lib/intelligence/agent-retrieval.ts.
  //
  // Placement decisions:
  //   Plan       → PAT-SRC-013  (new — no prior pattern covered early scoping)
  //   RFI        → PAT-SRC-014  (new — market engagement not previously covered)
  //   Shortlist  → PAT-SRC-015  (new — down-selection not previously covered)
  //   RFP        → PAT-SRC-016  (new — formal tender governance not previously covered)
  //   Q&A        → PAT-SRC-017  (new — clarification period not previously covered)
  //   Initial-Bid→ PAT-SRC-018  (new — first-round evaluation not previously covered;
  //                               PAT-SRC-002 covers completeness threshold only)
  //   BAFO       → PAT-SRC-001  body extended below with stage doctrine
  //   Selection  → PAT-SRC-011  body extended below with stage doctrine
  //   Award      → PAT-SRC-012  body extended below with stage doctrine
  //   Onboard    → PAT-SRC-019  (new — hypercare / go-live not previously covered)
  //
  // Service category patterns (PAT-SRC-020 through PAT-SRC-024) follow.
  //   AMS            → PAT-SRC-020 (new; PAT-SRC-005 covers consolidation event only)
  //   SaaS           → PAT-SRC-021 (new)
  //   Infrastructure → PAT-SRC-022 (new)
  //   Implementation → PAT-SRC-023 (new)
  //   Consulting     → PAT-SRC-024 (new)

  {
    id: 'PAT-SRC-013',
    slug: 'procurement-strategy-and-scoping',
    title: 'Procurement Strategy and Scoping (Plan Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Strategic sourcing outcomes improve when the Plan stage transforms a business need into an approved mandate with documented make-vs-buy rationale, cross-functional requirements, and a fixed procurement timeline before any supplier engagement.',
    applicability:
      'Apply at the outset of any sourcing programme, before RFI issue, to ensure mandate, budget, and requirements have been signed off and the evaluation team is resourced.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 10,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-014'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Establish the strategic foundation before any supplier engagement. This stage transforms a business need into a structured procurement programme with approved mandate, budget, and timeline.

## Key buyer activities
- Conduct make-vs-buy analysis and document the case for external supply; confirm category ownership and escalation paths
- Run stakeholder alignment workshops to capture requirements from technical, commercial, legal, and business owners
- Execute market sounding (desk research, analyst briefings, informal supplier conversations) to validate feasibility and baseline pricing
- Define category strategy: preferred route to market (open tender, direct award, framework call-off), sustainability criteria, and diversity targets
- Secure budget approval and sign-off on a Requirements Document that is version-controlled and traceable

## Risks to watch
Scope creep before RFI launch; under-resourced evaluation team; legal not engaged early enough; requirements authored by a single stakeholder without cross-functional review.

## Gate criteria before advancing
Board-approved budget line confirmed in writing; Requirements Document signed off by all functional owners; Procurement timeline published; make-vs-buy decision documented and accepted.

## Outputs
Requirements Document v1.0, Procurement Strategy Brief, stakeholder RACI, indicative budget envelope, high-level timeline.`,
  },

  {
    id: 'PAT-SRC-014',
    slug: 'rfi-market-engagement',
    title: 'RFI Market Engagement (RFI Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'A structured RFI stage builds a qualified long list before any competitive tender, reducing the risk of advancing unqualified or financially fragile vendors into the RFP round.',
    applicability:
      'Apply after Plan sign-off when the market is not fully mapped. Skip when the vendor landscape is already known and a direct-to-RFP approach is defensible.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 6,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-013', 'PAT-SRC-015'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
A no-commitment market intelligence exercise to map the supplier landscape, assess capability maturity, and build a qualified long list before issuing any competitive tender.

## Key buyer activities
- Issue structured RFI questionnaire covering: company profile, financial health (last 2 years accounts), relevant reference clients, technical capability, implementation methodology, data security posture, and indicative pricing ranges
- Conduct analyst briefings (Gartner, Forrester, IDC) and peer-reference calls to supplement vendor self-reporting
- Assess financial viability: Dun & Bradstreet scores, credit ratings, ownership structure, key-person dependency
- Complete a Capability Matrix scoring each respondent across agreed dimensions (usually 5–8 criteria weighted by strategic priority)
- Long-list 6–10 vendors; exclude non-compliant or financially marginal respondents with a written rationale

## Risks to watch
Receiving low-quality RFI responses due to poor question design; over-relying on brand recognition instead of evidence; failing to include emerging challengers who may outperform incumbents.

## Gate criteria before advancing
Capability Matrix populated and peer-reviewed; shortlisting criteria agreed and documented by stakeholder panel; minimum 6 qualified respondents assessed.

## Outputs
Supplier Capability Matrix, long list of 6–10 vendors with scoring summary, shortlisting criteria document.`,
  },

  {
    id: 'PAT-SRC-015',
    slug: 'vendor-qualification-down-selection',
    title: 'Vendor Qualification and Down-Selection (Shortlist Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Protects the evaluation team\'s bandwidth and signals market seriousness by rigorously narrowing the long list to 3–5 vendors capable of responding meaningfully to a full RFP.',
    applicability:
      'Apply after RFI scoring to produce a written, approved shortlist with documented inclusion and exclusion rationale before issuing the RFP.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 5,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-014', 'PAT-SRC-016'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Rigorous evaluation of RFI responses to narrow the field to 3–5 vendors capable of responding meaningfully to a full RFP.

## Key buyer activities
- Score each long-listed vendor against the agreed Capability Matrix using a blind or panel-reviewed process; document scoring rationale for audit trail
- Conduct structured reference checks: minimum 2 client references per vendor, covering implementation quality, support responsiveness, and commercial relationship
- Run financial viability screening: review audited accounts, check for change-of-control risk, confirm insurance levels meet minimum thresholds
- Issue preliminary Due Diligence questionnaires where data security or regulatory compliance is material (e.g., GDPR, FedRAMP, ISO 27001)
- Hold shortlist rationale review with stakeholder panel; document and approve final shortlist of 3–5 vendors

## Risks to watch
Panel bias toward known incumbents; reference check fatigue (all references are pre-selected wins); financial screening missed for smaller challengers.

## Gate criteria before advancing
Shortlist of 3–5 vendors formally approved by stakeholder panel; written rationale documented for each inclusion and exclusion; legal and procurement director sign-off obtained.

## Outputs
Scored Capability Matrix with shortlist rationale, vendor shortlist approval memo, due diligence summaries.`,
  },

  {
    id: 'PAT-SRC-016',
    slug: 'request-for-proposal-governance',
    title: 'Request for Proposal Governance (RFP Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Comparable, decision-grade proposals require the evaluation scorecard to be locked before any proposals are received — scoring criteria changed after receipt constitutes manipulation.',
    applicability:
      'Apply to any formal competitive tender where shortlisted vendors will submit binding technical and commercial proposals.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 8,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-015', 'PAT-SRC-017', 'PAT-SRC-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The formal competitive tender stage. A fully specified RFP document invites shortlisted vendors to submit binding technical and commercial proposals against a consistent evaluation framework.

## Key buyer activities
- Draft a detailed Requirements Document translated into RFP Sections: company background, scope of work, functional and non-functional requirements, implementation approach, SLA specifications, pricing template (fixed, T&M, or outcome-based), and contractual terms summary
- Design the Evaluation Scorecard: define mandatory (pass/fail) criteria, weighted technical categories, and commercial scoring methodology before RFP issue to prevent post-hoc scoring manipulation
- Establish submission format and compliance checklist: page limits, mandatory appendices, pricing template lock (no deviations accepted), and submission portal/deadline
- Issue RFP to shortlisted vendors with a cover letter confirming the procurement timetable, evaluation process, and no-collusion declaration requirement
- Conduct RFP review and approval internally before issue — legal, commercial, and technical sign-off required

## Risks to watch
Ambiguous requirements leading to non-comparable proposals; pricing template flexibility enabling comparison difficulties; evaluation scorecard not finalised before proposals received (manipulation risk).

## Gate criteria before advancing
RFP document approved by legal, commercial, and technical stakeholders; evaluation scorecard locked and stored in sealed record before any proposals received.

## Outputs
RFP document (final issued version), evaluation scorecard, no-collusion declaration template, RFP issue confirmation log.`,
  },

  {
    id: 'PAT-SRC-017',
    slug: 'clarification-period-management',
    title: 'Clarification Period Management (Q&A Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Competitive fairness requires all Q&A responses to be shared simultaneously with all bidders — bilateral verbal clarifications create information asymmetry that invalidates the evaluation.',
    applicability:
      'Apply in the window between RFP issue and proposal deadline to manage vendor questions through a governed, auditable process.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 7,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-016', 'PAT-SRC-018'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
A structured window for shortlisted vendors to seek clarification on RFP requirements. All questions and answers are shared simultaneously with all bidders to maintain competitive fairness and prevent information asymmetry.

## Key buyer activities
- Publish a Q&A submission deadline and confirm all questions must be submitted in writing via the procurement portal (no verbal clarifications accepted)
- Triage incoming questions: categorise as (a) genuine scope ambiguity requiring a formal answer, (b) commercially sensitive fishing requiring deflection, or (c) out-of-scope requiring no response
- Draft answers collaboratively with technical, legal, and commercial owners; obtain sign-off before publishing
- Issue all Q&A responses simultaneously to all shortlisted vendors in a numbered Q&A log; update the RFP document or issue a formal addendum if scope is materially clarified
- Close the Q&A log formally on the published deadline; confirm final clarifications constitute the definitive tender specification

## Risks to watch
Allowing verbal or bilateral clarifications that give one vendor an information advantage; scope changes introduced through Q&A that materially alter the original requirement; Q&A log not maintained creating audit gaps.

## Gate criteria before advancing
Q&A log formally closed and communicated to all vendors; any scope changes documented as formal addenda with version control; all vendors confirm receipt of final clarification pack.

## Outputs
Numbered Q&A log (all questions and answers), any RFP addenda, final clarification confirmation letter issued to all vendors.`,
  },

  {
    id: 'PAT-SRC-018',
    slug: 'initial-bid-evaluation-and-triage',
    title: 'Initial Bid Evaluation and Non-Conformance Triage (Initial-Bid Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'The Initial-Bid stage is diagnostic, not decisional — its purpose is to establish a commercial baseline, surface non-conformances, and validate TCO comparability before any negotiation begins.',
    applicability:
      'Apply on receipt of first-round proposals to establish compliance, independent scoring, and total cost of ownership baseline before the BAFO round.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md', 'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-002', 'PAT-SRC-008', 'PAT-SRC-017'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Receipt and initial evaluation of first-round vendor proposals. This is a diagnostic stage — the goal is to understand the commercial landscape, identify non-conformances, and establish a baseline before negotiation.

## Key buyer activities
- Receive proposals by the submission deadline; log receipt and confirm acknowledgement to all vendors immediately
- Run compliance check against the mandatory criteria and submission format checklist: non-compliant proposals are scored zero on affected criteria or excluded if a mandatory requirement is missed
- Evaluate technical proposals against the locked evaluation scorecard; use panel scoring to reduce individual bias; log non-conformances and deviations from requirements
- Analyse pricing submissions: decompose total cost of ownership (TCO) across implementation, licence/subscription, integration, support, and exit/transition; normalise to a common comparison basis
- Produce an Initial-Bid Evaluation Report summarising technical scores, commercial ranges, and key non-conformances per vendor

## Risks to watch
Evaluators sharing scores between themselves before independent scoring is complete; non-conformances logged but not followed up; pricing comparison based on headline number rather than TCO.

## Gate criteria before advancing
All proposals received; compliance check complete and documented; panel scoring independently completed and consolidated; non-conformances formally notified to relevant vendors.

## Outputs
Compliance check log, scored evaluation matrix (initial), TCO comparison model, Initial-Bid Evaluation Report, non-conformance notification letters.`,
  },

  {
    id: 'PAT-SRC-019',
    slug: 'vendor-onboarding-and-hypercare',
    title: 'Vendor Onboarding and Hypercare (Onboard Stage)',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Hypercare must be a formally bounded period with an explicit exit sign-off, because undefined hypercare end points create SLA ambiguity and undermine the governance baseline established during award.',
    applicability:
      'Apply after contract execution to validate go-live readiness, manage the elevated-support period, and confirm steady-state transition through a post-implementation review.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-012', 'PAT-SRC-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The operational phase begins. The vendor delivers initial integration and knowledge transfer; the buyer validates technical and commercial readiness; a hypercare period provides elevated support before steady-state operations are confirmed.

## Key buyer activities
- Execute the go-live checklist: confirm system integration testing (SIT) and user acceptance testing (UAT) sign-off, data migration validation, user training completion, and rollback plan readiness before production cutover
- Run hypercare period (typically 30–90 days post go-live): elevated support SLA, daily stand-ups between buyer and vendor delivery teams, accelerated issue triage and resolution
- Validate first invoice against contract pricing schedule and milestone acceptance criteria; reject non-compliant invoices promptly and document the basis for rejection
- Establish relationship governance cadence: operational review (monthly), service review (quarterly), strategic review (annually); confirm attendees, agenda templates, and action log ownership
- Conduct a post-implementation review (PIR) at hypercare exit: measure outcomes against business case KPIs, document lessons learned, and identify improvement actions for the steady-state relationship

## Risks to watch
Hypercare period ending without formal sign-off (leaving ambiguity about when steady-state SLAs apply); invoice validation deferred creating accruals uncertainty; governance cadence agreed but not activated.

## Gate criteria for steady-state transition
Hypercare period formally signed off by buyer and vendor; all critical go-live checklist items resolved; first invoice validated and approved; governance cadence first cycle completed; PIR documented and shared.

## Outputs
Go-live checklist sign-off, hypercare exit report, first invoice validation record, governance cadence schedule, post-implementation review.`,
  },

  // ── Service category patterns (PAT-SRC-020 through PAT-SRC-024) ───────────────
  //
  // These patterns carry the full service-category procurement playbook content,
  // superseding src/lib/agent/service-category-playbooks.ts.
  // Retrieved by keyword match in src/lib/intelligence/agent-retrieval.ts.
  //
  // Placement decisions:
  //   AMS            → PAT-SRC-020 (new; PAT-SRC-005 covers consolidation event
  //                                 architecture only, not the AMS procurement playbook)
  //   SaaS           → PAT-SRC-021 (new — no prior coverage)
  //   Infrastructure → PAT-SRC-022 (new — no prior coverage)
  //   Implementation → PAT-SRC-023 (new — no prior coverage)
  //   Consulting     → PAT-SRC-024 (new — no prior coverage)

  {
    id: 'PAT-SRC-020',
    slug: 'ams-procurement-playbook',
    title: 'AMS Procurement Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AMS procurement decisions are durable when evaluation dimensions, contract terms, and pricing benchmarks are treated as a category-specific framework rather than adapted generically from commodity purchasing.',
    applicability:
      'Apply to sourcing events for Application Managed Services, including vendor consolidation, re-tender, and operating-model transformation.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: ['docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md', 'docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-005', 'PAT-SRC-006', 'PAT-SRC-012'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
AMS (Application Managed Services) is a long-term engagement where a vendor takes operational responsibility for running, maintaining, and evolving applications. Scope typically covers: incident management (P1 <1hr, P2 <4hr, P3 <24hr response SLAs), change request process and backlog ownership, enhancement pipeline governance, tooling and access management, knowledge transfer obligations.

## Evaluation dimensions
Offshore/onshore mix and location risk, tooling compatibility with client stack, reference customers in same industry, SLA penalty structure and credit caps, minimum commitment terms (typically 3–5 years), exit assistance obligations.

## Red flags
Vague scope definitions that allow scope creep charges, uncapped T&M change clauses, weak transition-out provisions (should be 6–12 months minimum), SLA credits that don't reflect actual business loss, no benchmarking rights.

## Contract terms to negotiate hard
Minimum notice period for key resource changes (90 days), benchmarking rights every 2 years, open book pricing model, service credit caps (10–15% of annual fees), exit assistance at no cost, IP ownership of client-funded enhancements.

## Pricing benchmarks
AMS contracts typically 15–40% of application development cost per year. Offshore-heavy models: 12–18%. Nearshore-balanced: 20–28%. Premium onshore-led: 30–40%. Volume discounts kick in at >$5M ACV.`,
  },

  {
    id: 'PAT-SRC-021',
    slug: 'saas-procurement-playbook',
    title: 'SaaS Procurement Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'SaaS procurement value is preserved through negotiated renewal caps, explicit data portability rights, and AI/ML training data opt-outs — terms that are far harder to obtain after signature than before.',
    applicability:
      'Apply to sourcing events for SaaS platforms, cloud software, CRM/ERP systems, and subscription-based tooling.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 5,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: ['GDPR', 'CCPA'],
    relatedPatternIds: ['PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
SaaS procurement key dimensions: data residency and sovereignty requirements, user provisioning and SSO integration, API access and rate limits, renewal escalator caps (negotiate max 3–5% annual), data portability on exit (insist on full export rights), security certifications required (SOC-2 Type II minimum, ISO 27001 preferred).

## Negotiation leverage
Multi-year commits (2–3yr) for 15–25% discount, user volume commitments, additional module bundling.

## Red flags
Auto-renewal clauses without adequate notice windows (require 90-day notice minimum), vague data deletion timelines post-offboarding (insist on 30-day confirmed deletion), unclear AI/ML training data rights (require explicit opt-out of model training on client data).

## Contract terms to negotiate hard
Data portability in open formats at any time, DPA and GDPR/CCPA schedules, SLA uptime credits tied to actual business impact, right to audit security certifications annually, escrow provisions for source code if vendor is sub-scale.`,
  },

  {
    id: 'PAT-SRC-022',
    slug: 'infrastructure-cloud-procurement-playbook',
    title: 'Infrastructure and Cloud Procurement Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Cloud infrastructure procurement decisions consistently underestimate egress costs by 3–5x; modelling worst-case egress before signature is the single highest-value pre-award action.',
    applicability:
      'Apply to sourcing events for IaaS, PaaS, cloud platforms, hosting, and data centre services.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: ['FedRAMP', 'ISO-27001'],
    relatedPatternIds: ['PAT-SRC-008'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
IaaS/PaaS procurement key dimensions: committed use discounts vs on-demand (1yr: ~20–37%, 3yr: ~45–55% savings), egress cost exposure (often underestimated by 3–5x — model worst-case before signing), multi-cloud risk and portability, SLA uptime tiers (99.9% = ~8.7hr/yr downtime vs 99.99% = ~52min/yr — quantify business cost of each), DR/BCP provisions, data sovereignty and residency controls, security and compliance certifications (FedRAMP, ISO 27001, SOC-2), FinOps governance requirements.

## Red flags
Egress fees buried in pricing schedules, lock-in via proprietary APIs with no migration tooling, SLA credits capped at monthly spend (not proportional to business loss), no right to audit billing calculations.

## Contract terms to negotiate hard
Committed use discount with flex-up rights, egress fee caps or waiver for competitive migrations, FinOps reporting and cost anomaly alerting as baseline service, DPA and data residency schedules, exit migration assistance obligations.`,
  },

  {
    id: 'PAT-SRC-023',
    slug: 'implementation-si-procurement-playbook',
    title: 'Implementation and Systems Integration Procurement Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Fixed-price engagement models are preferable for well-defined SI scope because they transfer delivery risk to the vendor — T&M should be reserved for genuinely exploratory phases with clear governance checkpoints.',
    applicability:
      'Apply to sourcing events for systems integration, implementation programmes, digital transformation delivery, and bespoke build engagements.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-006', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
SI engagements key dimensions: fixed-price vs T&M trade-offs (fixed-price preferred for well-defined scope — reduces client risk; T&M appropriate for exploratory phases with clear governance), milestone structure and payment tied to acceptance, detailed acceptance criteria in SOW (not just delivery of artefacts but demonstrated functionality), IP ownership of custom code (insist on client ownership of all bespoke deliverables), warranty period (minimum 90 days post go-live), staffing approval rights for key roles, right to reject named resources, subcontractor disclosure requirements.

## Red flags
Vague acceptance criteria that leave pass/fail in vendor hands, payment milestones tied to delivery not acceptance, no key-person clauses for critical resources, broad subcontracting rights without client approval, no warranty on defects post go-live.

## Contract terms to negotiate hard
Change control process with quantified impact assessment before approval, liquidated damages for critical milestone slippage, escrow of all source code and configuration, knowledge transfer and documentation obligations, right to insource or re-bid post-completion without restriction.`,
  },

  {
    id: 'PAT-SRC-024',
    slug: 'consulting-advisory-procurement-playbook',
    title: 'Consulting and Advisory Procurement Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Consulting engagements produce measurable value when scoped as output-based deliverables rather than time-based retainers — specifying what documents, frameworks, or decisions will be produced prevents scope drift.',
    applicability:
      'Apply to sourcing events for strategy, advisory, assessment, and consulting engagements where the primary output is intellectual rather than operational.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: ['docs/build/SOURCE_BUILD_SPEC.md'],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
SOW-based consulting key dimensions: deliverable definition is critical — output-based not time-based (specify what documents, frameworks, or decisions will be produced, not just hours spent), rate benchmarking by grade (Partner/Director: $350–600/hr; Manager: $200–350/hr; Analyst: $100–200/hr for tier-1 firms), right-to-audit timesheets for T&M engagements, IP ownership of all work product (insist on full assignment, not licence), conflict of interest disclosure (especially where the firm also advises vendors), confidentiality scope, non-solicitation clauses (both directions).

## Red flags
Broad T&M engagements without milestone checkpoints, rate cards that allow grade substitution without client consent, vague deliverables that enable scope expansion, IP licence (not assignment) for work product, no obligation to disclose competing client relationships.

## Contract terms to negotiate hard
Fixed-fee or capped T&M with monthly not-to-exceed, explicit deliverable acceptance criteria with revision rounds, IP full assignment for all bespoke work product, conflict of interest disclosure obligations, 12-month non-solicitation on key client staff.`,
  },
  ...SOURCING_CATEGORY_PATTERNS,
  ...SOURCING_CONTRACT_AUDIT_PATTERNS,
  ...SOURCING_CONTRACT_PATTERNS,
  ...SOURCING_CONTRACTS_COMMERCIAL_PATTERNS,
  ...SOURCING_PRICING_CLOUD_PATTERNS,
  ...SOURCING_PRICING_PATTERNS,
  ...SOURCING_PROCESS_PATTERNS,
  ...SOURCING_REGULATORY_AI_PATTERNS,
  ...SOURCING_REGULATORY_PATTERNS,
];

export const SOURCING_PATTERN_COUNT = SOURCING_PATTERNS.length;
export const SOURCING_PATTERN_IDS = SOURCING_PATTERNS.map((pattern) => pattern.id);

export default SOURCING_PATTERNS;
