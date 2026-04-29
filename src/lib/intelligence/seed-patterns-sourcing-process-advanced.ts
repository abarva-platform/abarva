import type { LifecycleStage, PatternSeed } from './seed-types';

const PROCESS_LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'MarketScan',
    label: 'Market scan and governed shortlist',
    order: 1,
    description:
      'Build the vendor universe, document inclusion and exclusion logic, and approve shortlist governance before the RFP is issued.',
  },
  {
    id: 'RFP',
    label: 'Structured RFP and response design',
    order: 2,
    description:
      'Translate the sourcing strategy into question architecture, evidence requests, response templates, and scorecard mapping.',
  },
  {
    id: 'Evaluation',
    label: 'Comparable response evaluation',
    order: 3,
    description:
      'Evaluate responses against the locked question taxonomy, completeness rules, scoring rubric, and evidence requirements.',
  },
  {
    id: 'BAFO',
    label: 'BAFO negotiation and decision cadence',
    order: 4,
    description:
      'Run finalist negotiation through dated submissions, bilateral clarification discipline, normalized commercials, and committee-ready decision artifacts.',
  },
  {
    id: 'Selection',
    label: 'Selection and award recommendation',
    order: 5,
    description:
      'Convert evaluated evidence into a recommendation package, approval record, and contracting handoff without losing traceability.',
  },
];

export const SOURCING_PROCESS_ADVANCED_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-PROC-004',
    slug: 'market-scan-list-building-governance',
    title: 'Market Scan and List-Building Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Market scans become decision-grade only when the vendor universe, shortlist rationale, and exclusion logic are governed before supplier contact begins.',
    applicability:
      'Apply when a sourcing team needs to move from broad category research to a defensible vendor list for RFI, RFP, or direct shortlist engagement.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.74,
    createdFrom: 'deterministic_seed',
    createdBy: 'codex-proc-2',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCING_CORPUS_BUILD_KICKOFF_V1.md',
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-005', 'PAT-SRC-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: PROCESS_LIFECYCLE_STAGES,
    perStageGateCriteria: {
      MarketScan: [
        {
          id: 'GATE-PROC-004-MARKET-01',
          description: 'Vendor universe has documented inclusion, exclusion, tiering, and category-fit rationale before shortlist approval.',
          gateType: 'hard',
          stageId: 'MarketScan',
          evaluationHint: 'market-universe-rationale-approved=true and excluded-vendor-rationale-present=true',
        },
        {
          id: 'GATE-PROC-004-MARKET-02',
          description: 'Shortlist governance names the business owner, procurement owner, and any no-contact or incumbent-handling constraints.',
          gateType: 'hard',
          stageId: 'MarketScan',
          evaluationHint: 'shortlist-governance-owner-map-complete=true',
        },
      ],
      RFP: [
        {
          id: 'GATE-PROC-004-RFP-01',
          description: 'RFP invite list matches the approved shortlist or records an explicit variance with owner approval.',
          gateType: 'hard',
          stageId: 'RFP',
          evaluationHint: 'rfp-invite-list-approved=true and shortlist-variance-log-empty-or-approved=true',
        },
      ],
    },
    perStageExpectedArtifacts: {
      MarketScan: [
        {
          id: 'ART-PROC-004-MARKET-UNIVERSE',
          label: 'Market universe map',
          stageId: 'MarketScan',
          requirement: 'required',
          gateType: 'hard',
          description: 'Structured list of considered vendors, tiers, category fit, known cautions, and source basis.',
        },
        {
          id: 'ART-PROC-004-SHORTLIST-RATIONALE',
          label: 'Shortlist and exclusion rationale',
          stageId: 'MarketScan',
          requirement: 'required',
          gateType: 'hard',
          description: 'Decision record explaining why each vendor was shortlisted, parked, excluded, or reserved for later diligence.',
        },
      ],
      RFP: [
        {
          id: 'ART-PROC-004-INVITE-CONTROL-LOG',
          label: 'RFP invite control log',
          stageId: 'RFP',
          requirement: 'recommended',
          gateType: 'soft',
          description: 'Trace from approved shortlist to issued invitations, including owner approval for any variance.',
        },
      ],
    },
    negotiationLevers: [
      {
        lever: 'Comparable finalist optionality',
        whenToUse: 'Use when the shortlist is at risk of collapsing to an incumbent or single preferred vendor before evidence is collected.',
        buyerAsk: 'Keep at least two credible alternatives active until the scoring and commercial normalization gates have been passed.',
        tradeoffs: ['Maintaining optionality requires more evaluation effort but preserves leverage and reduces narrative-only award risk.'],
      },
    ],
    riskFactors: [
      {
        id: 'RSK-PROC-004-INCUMBENT-ANCHORING',
        label: 'Incumbent anchoring before market evidence',
        severity: 'medium',
        detectionSignals: ['Shortlist mirrors incumbent comparison set', 'Excluded alternatives lack written rationale', 'RFP invite list differs from approved shortlist'],
        mitigations: ['Require market universe artifact', 'Record exclusion rationale', 'Approve invite-list variance before supplier contact'],
      },
    ],
    body: `## Summary
Market scan and list-building governance is the discipline of making the vendor universe visible before the event narrows. It prevents a sourcing team from treating the shortlist as a memory of who the room already knows. In Source terms, this pattern sits before RFP release and gives Sentinel a grounded answer to a simple question: why are these suppliers in the event, and why are the others not? The Source build spec defines sourcing as a strategic event lifecycle with stage gates, artifacts, and scorecards. This pattern turns the market scan into one of those artifacts rather than an informal spreadsheet.

## When to apply
Use this pattern when the category is strategically important, when an incumbent could dominate the narrative, when the buyer is entering an unfamiliar market, or when downstream stakeholders will later ask whether credible alternatives were considered. It is especially useful before managed services, enterprise platform, AI tooling, data platform, and security sourcing events because those categories often contain suite vendors, specialists, implementation partners, and incumbents that are not directly comparable.

## How it works
Create a market universe map before supplier outreach. The map should show considered vendors, tier, relevant capability, category fit, known cautions, and source basis. Then produce a shortlist rationale that records why each vendor is invited, parked, excluded, or retained as a reserve. Governance matters because the list is itself a decision. Name the procurement owner, business owner, and any rules that affect contact discipline, incumbent handling, confidentiality, or evaluation fairness. If the RFP invite list later differs from the approved shortlist, record the variance before issuing invitations.

The pattern works best when list-building is connected to the rest of the sourcing lifecycle. The market scan should inform the RFP question architecture, response templates, and evaluation rubric rather than living as a disconnected research file. A shortlist built around evidence categories makes later BAFO cleaner because finalists are more likely to have been selected for comparable scope, capability, and operating fit.

## Expected outputs
The minimum outputs are a market universe map, a shortlist and exclusion rationale, a named owner map, and an invite control log. For larger events, add a reserve vendor list, incumbent treatment note, and explicit assumptions that must be validated in the RFP.

## Pitfalls
The pattern fails when the team writes a shortlist after the fact to justify an already preferred vendor, when exclusions are left as verbal history, or when market tiers are mixed without explaining why a suite vendor and a specialist are being compared. It also fails when public market presence is confused with buyer fit. A vendor can be visible and still wrong for the operating model.

## Instances
- Source defines a ten-stage event lifecycle where stage and gate state are explicit.
- Source artifacts include scorecards, decision memos, artifact packets, value ledgers, and traces.
- The sourcing corpus kickoff identifies vendor landscape, lifecycle gates, and methodology patterns as first-class corpus content.`,
  },
  {
    id: 'PAT-SRC-PROC-005',
    slug: 'rfp-question-architecture',
    title: 'RFP Question Architecture',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'RFPs produce comparable evidence when questions are designed as an evaluation architecture, not as a generic vendor questionnaire.',
    applicability:
      'Apply before RFP release when response comparability, scoring discipline, evidence requirements, and BAFO readiness depend on how questions are framed.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.76,
    createdFrom: 'deterministic_seed',
    createdBy: 'codex-proc-2',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCING_CORPUS_BUILD_KICKOFF_V1.md',
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-002', 'PAT-SRC-007', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: PROCESS_LIFECYCLE_STAGES,
    perStageGateCriteria: {
      RFP: [
        {
          id: 'GATE-PROC-005-RFP-01',
          description: 'Each RFP question is classified as mandatory, scored, informational, proof-script, pricing, legal, or implementation evidence.',
          gateType: 'hard',
          stageId: 'RFP',
          evaluationHint: 'question-taxonomy-complete=true and unclassified-question-count=0',
        },
        {
          id: 'GATE-PROC-005-RFP-02',
          description: 'Scored questions map to scorecard criteria with answer format, evidence expectation, and evaluator owner.',
          gateType: 'hard',
          stageId: 'RFP',
          evaluationHint: 'scored-question-scorecard-map-complete=true',
        },
      ],
      Evaluation: [
        {
          id: 'GATE-PROC-005-EVAL-01',
          description: 'Response completeness report distinguishes missing answers, non-compliant answers, and unsupported assertions before scoring is finalized.',
          gateType: 'hard',
          stageId: 'Evaluation',
          evaluationHint: 'response-completeness-report-approved=true',
        },
      ],
      BAFO: [
        {
          id: 'GATE-PROC-005-BAFO-01',
          description: 'BAFO clarification topics trace back to scored RFP questions, missing evidence, pricing assumptions, or contractual exceptions.',
          gateType: 'hard',
          stageId: 'BAFO',
          evaluationHint: 'bafo-topic-lineage-to-rfp-question-present=true',
        },
      ],
    },
    perStageExpectedArtifacts: {
      RFP: [
        {
          id: 'ART-PROC-005-QUESTION-BANK',
          label: 'RFP question bank with taxonomy',
          stageId: 'RFP',
          requirement: 'required',
          gateType: 'hard',
          description: 'Question set with classification, answer format, evidence requirement, scoring linkage, and evaluator owner.',
        },
        {
          id: 'ART-PROC-005-RESPONSE-TEMPLATE',
          label: 'Comparable response template',
          stageId: 'RFP',
          requirement: 'required',
          gateType: 'hard',
          description: 'Vendor response format that separates narrative answers, evidence attachments, pricing inputs, exceptions, and implementation assumptions.',
        },
      ],
      Evaluation: [
        {
          id: 'ART-PROC-005-COMPLETENESS-REPORT',
          label: 'Response completeness and assertion report',
          stageId: 'Evaluation',
          requirement: 'required',
          gateType: 'hard',
          description: 'Evaluator-facing report showing missing responses, unsupported claims, non-compliance, and questions requiring clarification.',
        },
      ],
    },
    negotiationLevers: [
      {
        lever: 'Question-lineage pressure',
        whenToUse: 'Use when a finalist tries to answer a scored requirement with broad narrative or sales positioning.',
        buyerAsk: 'Require a direct answer, cited evidence, or a written exception against the exact question and scorecard criterion.',
        tradeoffs: ['Strict answer discipline may reduce vendor flexibility but improves comparability and auditability.'],
      },
    ],
    riskFactors: [
      {
        id: 'RSK-PROC-005-NARRATIVE-DRIFT',
        label: 'Narrative response drift',
        severity: 'medium',
        detectionSignals: ['Long-form answer with no required field completion', 'Scored criterion lacks evidence attachment', 'Evaluator comments compensate for missing answer'],
        mitigations: ['Use fixed response templates', 'Separate mandatory, scored, and informational questions', 'Block scoring until completeness is reviewed'],
      },
    ],
    body: `## Summary
RFP question architecture is the pattern of designing questions as a controlled evidence system. A weak RFP asks many questions and hopes the answers are useful. A strong RFP defines why each question exists, how it will be answered, who will evaluate it, what evidence is required, and whether the result affects a mandatory gate, a scored criterion, a pricing model, a proof script, a legal exception, or an implementation assumption. The Source spec emphasizes RFP readiness, scorecard governance, response completeness, pricing comparison, and vendor selection readiness. This pattern ties those pieces together before the event reaches evaluation.

## When to apply
Use this pattern whenever the team expects more than a simple price quote. It is especially relevant for enterprise platforms, managed services, AI tooling, data systems, and any event where vendors could give polished but non-comparable answers. Apply it before releasing the RFP, not during scoring. If the RFP has already been issued, use the pattern to triage clarifications and improve the next round.

## How it works
Start with the decision the RFP must support. Then divide the question bank into explicit classes: mandatory pass-fail requirements, scored evaluation questions, informational context, proof or demo scripts, pricing inputs, legal and commercial exceptions, implementation evidence, and open assumptions. Each scored question should map to a scorecard criterion and evaluator owner. Each mandatory question should define the consequence of a non-compliant answer. Each proof question should specify the scenario or artifact the vendor must produce. Each pricing question should preserve comparability by naming the same scope, unit, time horizon, and assumption basis for every vendor.

The response template is part of the architecture. If vendors can answer in any shape they want, comparability is lost. The template should separate direct answers, evidence attachments, exceptions, assumptions, pricing, and optional commentary. That separation helps Sentinel distinguish verified, asserted, and unknown content. It also helps Atlas and committee members understand where a vendor is strong, where evidence is thin, and where BAFO clarification is needed.

## Expected outputs
The key outputs are the question taxonomy, response template, scorecard mapping, evaluator owner map, completeness report, and BAFO clarification lineage. These artifacts make it possible to trace a final negotiation topic back to the RFP question or missing evidence that created it.

## Pitfalls
The common failure is a question bank that is large but unstructured. Teams ask capability questions, implementation questions, pricing questions, and legal questions in the same voice, then wonder why scoring becomes subjective. Another failure is treating vendor prose as evidence even when no artifact, scenario, or specific answer supports it. The most damaging failure is changing scoring intent after responses arrive, which turns the RFP into a negotiation theater rather than a decision record.

## Instances
- Source includes RFP readiness, response completeness, scorecard governance, pricing comparison, and vendor selection readiness panels.
- The intelligence design spec identifies reusable sourcing patterns as typed artifacts with provenance.
- The sourcing corpus kickoff names RFP question architecture as a process and methodology corpus need.`,
  },
  {
    id: 'PAT-SRC-PROC-006',
    slug: 'bafo-negotiation-cadence',
    title: 'BAFO Negotiation Cadence',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'BAFO improves award quality when finalist negotiation follows a dated cadence of submission, clarification, normalization, committee review, and award handoff.',
    applicability:
      'Apply when a finalist round must preserve leverage, normalize commercial offers, and produce committee-ready evidence without drifting into informal side-channel negotiation.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.77,
    createdFrom: 'deterministic_seed',
    createdBy: 'codex-proc-2',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-007', 'PAT-SRC-009', 'PAT-SRC-011'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: PROCESS_LIFECYCLE_STAGES,
    perStageGateCriteria: {
      BAFO: [
        {
          id: 'GATE-PROC-006-BAFO-01',
          description: 'BAFO pack names invited finalists, submission deadline, required response artifacts, negotiation topics, and no-late-change rules.',
          gateType: 'hard',
          stageId: 'BAFO',
          evaluationHint: 'bafo-pack-issued=true and finalist-deadline-present=true',
        },
        {
          id: 'GATE-PROC-006-BAFO-02',
          description: 'All bilateral negotiation records are logged with topic, owner, vendor position, buyer ask, and follow-up evidence requirement.',
          gateType: 'hard',
          stageId: 'BAFO',
          evaluationHint: 'bilateral-negotiation-log-complete=true',
        },
        {
          id: 'GATE-PROC-006-BAFO-03',
          description: 'Normalized final comparison and committee packet are complete before award recommendation discussion.',
          gateType: 'hard',
          stageId: 'Selection',
          evaluationHint: 'normalized-final-comparison-approved=true and committee-packet-ready=true',
        },
      ],
      Selection: [
        {
          id: 'GATE-PROC-006-SELECT-01',
          description: 'Award recommendation records final scores, unresolved exceptions, commercial tradeoffs, and approval forum decision.',
          gateType: 'hard',
          stageId: 'Selection',
          evaluationHint: 'award-recommendation-with-approval-record-present=true',
        },
      ],
    },
    perStageExpectedArtifacts: {
      BAFO: [
        {
          id: 'ART-PROC-006-BAFO-PACK',
          label: 'BAFO invitation and response pack',
          stageId: 'BAFO',
          requirement: 'required',
          gateType: 'hard',
          description: 'Finalist instruction pack containing deadline, response template, negotiation topics, required artifacts, and submission rules.',
        },
        {
          id: 'ART-PROC-006-NEGOTIATION-LOG',
          label: 'Bilateral negotiation log',
          stageId: 'BAFO',
          requirement: 'required',
          gateType: 'hard',
          description: 'Trace of vendor-by-vendor negotiation sessions, buyer asks, vendor positions, concessions, and evidence follow-ups.',
        },
        {
          id: 'ART-PROC-006-NORMALIZED-COMPARISON',
          label: 'Normalized BAFO comparison',
          stageId: 'BAFO',
          requirement: 'required',
          gateType: 'hard',
          description: 'Final comparable view of price, scope, assumptions, implementation risk, commercial exceptions, and residual gaps.',
        },
      ],
      Selection: [
        {
          id: 'ART-PROC-006-COMMITTEE-PACKET',
          label: 'Committee decision packet',
          stageId: 'Selection',
          requirement: 'required',
          gateType: 'hard',
          description: 'Award recommendation package with final scoring, rationale, unresolved exceptions, approval record, and contracting handoff points.',
        },
      ],
    },
    negotiationLevers: [
      {
        lever: 'Cadenced finalist pressure',
        whenToUse: 'Use when finalists remain credible and the buyer needs commercial movement without signaling a preferred vendor too early.',
        buyerAsk: 'Ask each finalist to improve defined areas by the same deadline and preserve a comparable final submission record.',
        tradeoffs: ['A firm cadence improves leverage but requires disciplined exception handling and executive availability.'],
      },
      {
        lever: 'Commercial term trade matrix',
        whenToUse: 'Use when price, payment timing, implementation risk transfer, renewal controls, and exit terms must be traded together.',
        buyerAsk: 'Document each concession request with the reciprocal value expected from the vendor.',
        tradeoffs: ['Concession trading can improve total value but should not hide scope reductions or unsupported implementation assumptions.'],
      },
    ],
    riskFactors: [
      {
        id: 'RSK-PROC-006-SIDE-CHANNEL-NEGOTIATION',
        label: 'Side-channel negotiation drift',
        severity: 'high',
        detectionSignals: ['Vendor commitments appear outside BAFO log', 'Committee packet differs from final submission', 'Preferred-vendor language appears before normalized comparison'],
        mitigations: ['Use a BAFO pack', 'Log bilateral sessions', 'Require normalized final comparison before selection discussion'],
      },
    ],
    body: `## Summary
BAFO negotiation cadence is the operating rhythm that keeps a finalist round from becoming an informal price chase. It defines who is invited, what they must improve, when final submissions are due, how bilateral discussions are recorded, how commercial offers are normalized, and when the committee reviews the recommendation. The AMS demo storyline shows why cadence matters: the event has named BAFO finalists, explicit negotiation points, response timing, committee ownership, and a programme dependency that waits on the commercial outcome. This pattern generalizes that approach without inventing market numbers or pretending a deterministic seed is live procurement evidence.

## When to apply
Use this pattern when two or more finalists remain viable and the team needs to preserve leverage while producing a decision record. It is strongest when the award affects downstream programme gates, operating model commitments, transition risk, or executive approval. It also applies when a single finalist remains but the buyer still needs a disciplined final offer, exception list, and approval packet before contracting.

## How it works
Start by issuing a BAFO pack. The pack should name the invited finalists, deadline, required response artifacts, response template, negotiation topics, and submission rules. Each finalist receives specific improvement areas tied to the evaluation record: pricing assumptions, SLA scope, staffing, implementation risk transfer, governance, transition plan, renewal controls, exit support, or contractual exceptions. The buyer can conduct bilateral sessions, but every session should be logged with topic, owner, vendor position, buyer ask, concession offered, and follow-up evidence required.

After final submissions arrive, the team produces a normalized comparison. This is not only a price table. It should show scope changes, assumptions, exclusions, implementation risk, residual exceptions, and any claim that still lacks support. That comparison feeds the committee packet. The committee should see final scoring, commercial tradeoffs, unresolved risks, recommended vendor, rationale, and contracting handoff points. The cadence is complete only when the award recommendation records the approval forum decision and the negotiation issues move into contracting without being lost.

## Expected outputs
The expected artifacts are the BAFO invitation and response pack, bilateral negotiation log, normalized BAFO comparison, committee decision packet, approval record, and contracting issues handoff. In Source, these artifacts align naturally with BAFO panels, pricing comparison, response completeness, vendor selection readiness, and scorecard governance.

## Pitfalls
The pattern fails when the buyer signals a preferred vendor before the normalized comparison is complete, when side conversations create commitments outside the record, or when the committee sees a polished recommendation but not the unresolved exceptions behind it. It also fails when the BAFO deadline floats. A soft deadline weakens leverage and can hide readiness problems until the programme gate is already waiting.

## Instances
- Source identifies BAFO negotiation, pricing comparison, response completeness, and vendor selection readiness as stage-specific panels.
- The AMS demo storyline keeps Northstar and ArcVault in BAFO with visible negotiation points and committee ownership.
- Intelligence treats the vendor BAFO scoring rubric as a high-reuse sourcing pattern, reinforcing the need for comparable final-round evidence.`,
  },
];

export const SOURCING_PROCESS_ADVANCED_PATTERN_COUNT = SOURCING_PROCESS_ADVANCED_PATTERNS.length;
export const SOURCING_PROCESS_ADVANCED_PATTERN_IDS = SOURCING_PROCESS_ADVANCED_PATTERNS.map((pattern) => pattern.id);

export default SOURCING_PROCESS_ADVANCED_PATTERNS;
