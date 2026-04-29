import type { PatternSeed } from './seed-types';

const PROCESS_LIFECYCLE_STAGES = [
  {
    id: 'intake',
    label: 'Intake triage',
    order: 1,
    description:
      'Capture the request, business owner, sourcing need, linked program context, and minimum facts required to decide whether the event should proceed.',
  },
  {
    id: 'scope',
    label: 'Scope baseline',
    order: 2,
    description:
      'Freeze the commercial, operational, vendor, data, and out-of-scope boundaries that will be used for RFP packaging and evaluation.',
  },
  {
    id: 'evaluation',
    label: 'Evaluation governance',
    order: 3,
    description:
      'Apply a governed scorecard and evidence trail so vendor comparison is based on approved criteria, rationale, and documented reviewer ownership.',
  },
  {
    id: 'orals_bafo',
    label: 'Clarification and BAFO control',
    order: 4,
    description:
      'Use finalist clarification, commercial normalization, and BAFO asks to resolve evidence gaps before selection.',
  },
  {
    id: 'selection',
    label: 'Selection and decision lock',
    order: 5,
    description:
      'Lock the recommendation, decision memo, and required approvals before contract mobilization begins.',
  },
];

export const SOURCING_PROCESS_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-PROC-001',
    slug: 'sourcing-intake-triage-governance',
    title: 'Sourcing Intake Triage Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'A sourcing event becomes governable only when intake separates ready requests from ambiguous demand before the event is promoted into active sourcing workflow.',
    applicability:
      'Apply when new sourcing requests, renewals, vendor changes, or program-linked commercial decisions enter Source and must be accepted, deferred, redirected, or blocked without losing evidence.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'docs/source-build/WAVE-S6-PLAN.md',
      'docs/source-build/COMPLETE.md',
      'src/lib/source/source-stage-gates.ts',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-004', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: PROCESS_LIFECYCLE_STAGES,
    perStageGateCriteria: {
      intake: [
        {
          id: 'proc-intake-request-owner',
          description: 'The intake record identifies the business sponsor, sourcing owner, decision owner, and linked program context if one exists.',
          gateType: 'hard',
          stageId: 'intake',
          evaluationHint: 'Check the intake artifact for named owners and any program or portfolio dependency before allowing the request into active workflow.',
        },
        {
          id: 'proc-intake-minimum-facts',
          description: 'The request contains enough facts to classify the event, expected commercial decision, rough scope boundary, timing driver, and required artifacts.',
          gateType: 'hard',
          stageId: 'intake',
          evaluationHint: 'Look for a usable event type, category, business need, timing reason, and artifact expectation rather than a generic procurement note.',
        },
        {
          id: 'proc-intake-route-decision',
          description: 'The intake disposition is recorded as proceed, defer, redirect, or block, with the rationale visible to downstream reviewers.',
          gateType: 'soft',
          stageId: 'intake',
          evaluationHint: 'A triage decision should explain why the work belongs in Source now, why it is not ready, or where it should be handled instead.',
        },
      ],
      scope: [
        {
          id: 'proc-intake-scope-handoff',
          description: 'The promoted request has enough scope evidence for the scope baseline owner to begin boundary confirmation without re-running intake.',
          gateType: 'hard',
          stageId: 'scope',
          evaluationHint: 'The intake packet should hand off known inclusions, exclusions, assumptions, and unresolved questions.',
        },
      ],
    },
    perStageExpectedArtifacts: {
      intake: [
        {
          id: 'artifact-intake-record',
          label: 'Sourcing intake record',
          stageId: 'intake',
          requirement: 'required',
          gateType: 'hard',
          description: 'Structured request artifact containing business need, owner, category, timing, linked program context, and known evidence gaps.',
        },
        {
          id: 'artifact-triage-disposition',
          label: 'Triage disposition note',
          stageId: 'intake',
          requirement: 'required',
          gateType: 'hard',
          description: 'Decision note showing whether the request proceeds, defers, redirects, or blocks, including the reason and next owner.',
        },
      ],
      scope: [
        {
          id: 'artifact-scope-handoff',
          label: 'Scope handoff checklist',
          stageId: 'scope',
          requirement: 'recommended',
          gateType: 'soft',
          description: 'Checklist of assumptions and missing inputs carried from intake into scope confirmation.',
        },
      ],
    },
    riskFactors: [
      {
        id: 'intake-demand-ambiguity',
        label: 'Ambiguous demand enters active sourcing',
        severity: 'high',
        detectionSignals: ['Request has no named decision owner', 'Business need is phrased as vendor preference only', 'Linked program impact is implied but not recorded'],
        mitigations: ['Hold request at intake', 'Require business owner confirmation', 'Record proceed/defer/redirect/block disposition'],
      },
      {
        id: 'intake-email-only-approval',
        label: 'Email-only intake approval',
        severity: 'medium',
        detectionSignals: ['Approval exists outside Source artifacts', 'No triage rationale is visible to scorecard or gate reviewers'],
        mitigations: ['Convert approval into an intake artifact', 'Attach rationale before scope handoff'],
      },
    ],
    body: `## Summary
Intake is the control point that prevents Source from becoming a dumping ground for partially described demand. The Source build spec defines Source as the Sentinel-led strategic sourcing surface for RFPs, BAFO negotiations, scorecards, contracts, and downstream artifacts. It also defines intake as the first stage in the ten-stage sourcing lifecycle. That position matters: intake is not a formality before "real" sourcing work begins. It is where the system decides whether a request is ready to become governed work.

## When to apply
Use this pattern for new sourcing requests, renewals, consolidation events, urgent vendor changes, program-linked commercial dependencies, and intake-flow submissions that need an explicit route decision. It is most useful when the request arrives with partial context: a stakeholder wants to contact vendors, renew a tool, replace an incumbent, or support a program gate, but the decision owner, scope boundary, artifact need, or timing driver is not yet clear.

## Operating doctrine
The intake record should answer five questions before the event advances. What decision is being requested? Who owns the business outcome? What sourcing category or event type best describes the work? Which downstream program, portfolio, or operating deadline depends on the answer? What evidence is already available, and what is missing? If those answers are absent, the event should not silently become active. It should remain in intake with a visible defer, redirect, or block rationale.

## Lifecycle and gates
The hard gate is owner and minimum-fact completeness. The sourcing owner, business sponsor, and decision owner must be named, and the request must include enough information to classify the event and start scope work. The softer gate is route quality: proceed, defer, redirect, or block should be documented in a way that later reviewers can understand. A request can proceed with open questions, but those questions must be explicitly handed to the scope stage rather than buried in narrative.

## Artifacts
The required artifacts are the intake record and the triage disposition note. The intake record is the structured fact base. The disposition note is the governance trace that explains why the request moved, paused, or changed route. A recommended scope handoff checklist should list known inclusions, exclusions, assumptions, and unresolved inputs so the scope owner does not need to reconstruct the intake history.

## Failure modes
The first failure is vendor-led intake: the request starts from a vendor conversation rather than a buyer decision need. The second is email-only approval, where the event appears approved but the evidence is outside Source. The third is hidden program dependency, where a downstream program is waiting on the sourcing result but the intake artifact does not say so. In each case the remedy is not to overbuild intake. The remedy is to make the route decision deterministic, visible, and tied to a named next owner.`,
  },
  {
    id: 'PAT-SRC-PROC-002',
    slug: 'scope-freeze-change-control',
    title: 'Scope Freeze and Change-Control Discipline',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Vendor comparison stays defensible when the sourcing team freezes the evaluation scope before RFP release and treats later scope movement as governed change control.',
    applicability:
      'Apply when sourcing scope contains mutable inclusions, exclusions, transition responsibilities, service boundaries, data assumptions, or linked program dependencies that could distort pricing or scoring.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'src/lib/source/pricing-completeness-view.ts',
      'src/lib/source/bafo-negotiation-model.ts',
      'src/lib/source/source-stage-gates.ts',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-002', 'PAT-SRC-006', 'PAT-SRC-008', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: PROCESS_LIFECYCLE_STAGES,
    perStageGateCriteria: {
      scope: [
        {
          id: 'proc-scope-baseline-approved',
          description: 'The scope baseline names in-scope work, out-of-scope work, assumptions, exclusions, and linked dependencies before RFP or vendor clarification work proceeds.',
          gateType: 'hard',
          stageId: 'scope',
          evaluationHint: 'Confirm that the scope artifact is more than a category label; it should define what vendors are pricing and what they are not pricing.',
        },
        {
          id: 'proc-scope-change-log-open',
          description: 'Any post-freeze scope movement is captured in a change log with owner, reason, affected vendors, and scoring or pricing impact.',
          gateType: 'hard',
          stageId: 'scope',
          evaluationHint: 'A change after freeze should not live only in Q&A, BAFO notes, or stakeholder chat. It needs an auditable change-control entry.',
        },
      ],
      evaluation: [
        {
          id: 'proc-scope-comparable-evaluation',
          description: 'Evaluation does not start until all vendors are scored against the same approved scope baseline or documented exceptions are visible.',
          gateType: 'hard',
          stageId: 'evaluation',
          evaluationHint: 'Look for a normalized basis of comparison and explicit exception handling before scorecard reviewers compare vendors.',
        },
      ],
      orals_bafo: [
        {
          id: 'proc-scope-bafo-exception-close',
          description: 'Finalist BAFO asks close any unresolved scope exceptions before the selection recommendation is locked.',
          gateType: 'soft',
          stageId: 'orals_bafo',
          evaluationHint: 'BAFO should resolve ambiguous inclusions, exclusions, and transition responsibilities, not introduce untracked scope drift.',
        },
      ],
    },
    perStageExpectedArtifacts: {
      scope: [
        {
          id: 'artifact-scope-baseline',
          label: 'Frozen scope baseline',
          stageId: 'scope',
          requirement: 'required',
          gateType: 'hard',
          description: 'Approved baseline covering inclusions, exclusions, assumptions, owner, category boundary, and linked program dependencies.',
        },
        {
          id: 'artifact-change-control-log',
          label: 'Scope change-control log',
          stageId: 'scope',
          requirement: 'required',
          gateType: 'hard',
          description: 'Governed log for scope changes after freeze, including rationale, affected vendors, pricing/scoring impact, and approval status.',
        },
      ],
      evaluation: [
        {
          id: 'artifact-comparability-note',
          label: 'Comparability exception note',
          stageId: 'evaluation',
          requirement: 'recommended',
          gateType: 'soft',
          description: 'Reviewer-facing note describing any scope exceptions that remain during evaluation and how they are handled.',
        },
      ],
    },
    riskFactors: [
      {
        id: 'scope-drift-after-rfp',
        label: 'Scope drift after RFP release',
        severity: 'high',
        detectionSignals: ['Vendors price different service boundaries', 'Scope clarifications are scattered across Q&A', 'BAFO asks introduce new work without a change log'],
        mitigations: ['Freeze baseline before RFP', 'Track post-freeze changes', 'Normalize vendor comparisons before evaluation'],
      },
      {
        id: 'scope-exclusion-hidden-in-price',
        label: 'Hidden exclusion in price comparison',
        severity: 'high',
        detectionSignals: ['Vendor headline price is lower but excludes work other vendors included', 'Excluded scope is visible only in a proposal footnote'],
        mitigations: ['Require explicit exclusion schedule', 'Attach comparability exception note', 'Resolve exception through clarification or BAFO'],
      },
    ],
    body: `## Summary
Scope freeze is the discipline that makes vendor comparison fair. Source already treats scope as a first-class stage and stage-gate blocker. The runtime sourcing modules also show why this matters: pricing completeness flags inconsistent application counts, below-benchmark pricing basis, minimum governance scope, and ambiguous exclusions as risks before acceptance. Those are not just pricing issues. They are scope-control issues.

## When to apply
Use this pattern when vendors could interpret the buyer's requirement differently, when transition scope is uncertain, when a linked program depends on the answer, or when the event includes managed services, systems integration, SaaS modules, implementation work, data migration, service governance, or exit obligations. The pattern is also useful for renewals where the incumbent's current scope is known informally but not documented clearly enough for a competitive event.

## Operating doctrine
The scope baseline should freeze what vendors are being asked to price, build, operate, support, transition, or exclude. It should distinguish in-scope work, out-of-scope work, buyer-retained responsibilities, vendor assumptions, implementation dependencies, data or integration boundaries, and known open questions. Once that baseline is approved, changes are not forbidden. They are governed. A scope movement after freeze should have a named owner, rationale, affected vendor set, expected pricing or scoring impact, and approval state.

## Lifecycle and gates
The scope gate should block progression if the baseline is only a category label or business aspiration. The RFP and vendor-response stages need a stable reference point so all vendors respond to the same demand. The evaluation gate should not open if one vendor is priced on a narrower operating model than another without an exception note. BAFO can be used to close scope exceptions, but it should not become an untracked reset of the event.

## Artifacts
The frozen scope baseline is required. It should be treated as the canonical artifact for inclusions, exclusions, assumptions, dependencies, and owner approval. The change-control log is also required because it protects the event after freeze. A comparability exception note is recommended for evaluation when a residual scope difference is allowed to remain visible while reviewers score vendors.

## Governance posture
Good change control is not bureaucracy for its own sake. It preserves the integrity of the scorecard and prevents a vendor from winning on an artificially narrow interpretation of work. It also protects the buyer from post-award change orders by forcing disputed scope to surface while competitive tension still exists.

## Failure modes
The first failure is scope-by-spreadsheet, where commercial teams compare prices while the work underneath those prices differs. The second is Q&A drift, where clarifications effectively change the event but never update the baseline. The third is BAFO expansion, where final negotiation introduces new scope without reopening comparability. The remedy is a visible baseline, a disciplined change log, and a refusal to let evaluation proceed on hidden exceptions.`,
  },
  {
    id: 'PAT-SRC-PROC-003',
    slug: 'weighted-evaluation-scorecard-governance',
    title: 'Weighted Evaluation Scorecard Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Weighted scorecards are decision instruments only when criteria, rationale, approvals, and lock state are governed before vendor evaluation output is used.',
    applicability:
      'Apply when a sourcing event uses functional, commercial, risk, implementation, or governance criteria to compare vendors and the resulting scorecard will inform BAFO, selection, or a decision memo.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.86,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'docs/source-build/WAVE-S4-PLAN.md',
      'docs/source-build/mockups/src-dtl-scorecard.html',
      'src/lib/source/source-stage-gates.ts',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-007', 'PAT-SRC-010', 'PAT-SRC-011'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: PROCESS_LIFECYCLE_STAGES,
    perStageGateCriteria: {
      evaluation: [
        {
          id: 'proc-scorecard-criteria-approved',
          description: 'Evaluation criteria, weighting logic, and reviewer ownership are approved before vendor scoring is treated as decision evidence.',
          gateType: 'hard',
          stageId: 'evaluation',
          evaluationHint: 'Check that criteria are not being edited after scoring begins unless the change is governed and visible.',
        },
        {
          id: 'proc-scorecard-rationale-complete',
          description: 'Each material score includes rationale or evidence linkage sufficient for a reviewer to understand why the score was assigned.',
          gateType: 'hard',
          stageId: 'evaluation',
          evaluationHint: 'A score without rationale should not be allowed to carry the recommendation even if the numeric result looks complete.',
        },
        {
          id: 'proc-scorecard-lifecycle-locked',
          description: 'The scorecard reaches an approved or locked lifecycle state before it is used for vendor evaluation, BAFO design, or final selection.',
          gateType: 'hard',
          stageId: 'evaluation',
          evaluationHint: 'Use the scorecard lifecycle state as the governance signal for whether the scorecard can influence the decision memo.',
        },
      ],
      orals_bafo: [
        {
          id: 'proc-scorecard-bafo-link',
          description: 'BAFO asks are traceable to scorecard gaps, commercial exceptions, or evidence deficiencies rather than informal preference.',
          gateType: 'soft',
          stageId: 'orals_bafo',
          evaluationHint: 'The finalist ask list should cite scorecard evidence or unresolved criteria where possible.',
        },
      ],
      selection: [
        {
          id: 'proc-scorecard-decision-trace',
          description: 'The decision memo reflects the governed scorecard result, approved exceptions, and any rationale for selecting against the top score.',
          gateType: 'hard',
          stageId: 'selection',
          evaluationHint: 'Selection should explain how the scorecard was used, including any documented override or exception logic.',
        },
      ],
    },
    perStageExpectedArtifacts: {
      evaluation: [
        {
          id: 'artifact-scorecard-packet',
          label: 'Governed scorecard packet',
          stageId: 'evaluation',
          requirement: 'required',
          gateType: 'hard',
          description: 'Approved evaluation criteria, weighting logic, reviewer assignments, vendor scoring, rationale, and evidence links.',
        },
        {
          id: 'artifact-scorecard-approval-record',
          label: 'Scorecard approval record',
          stageId: 'evaluation',
          requirement: 'required',
          gateType: 'hard',
          description: 'Governance artifact showing review state, approvals, lock state, and whether the scorecard is cleared for vendor evaluation use.',
        },
      ],
      selection: [
        {
          id: 'artifact-decision-memo-scorecard-trace',
          label: 'Decision memo scorecard trace',
          stageId: 'selection',
          requirement: 'required',
          gateType: 'hard',
          description: 'Decision memo section linking the final recommendation to scorecard outcome, exceptions, and approval evidence.',
        },
      ],
    },
    riskFactors: [
      {
        id: 'scorecard-retrofit',
        label: 'Scorecard retrofitted to preferred vendor',
        severity: 'high',
        detectionSignals: ['Criteria change after vendor scoring', 'Weights move without change-control rationale', 'Rationale appears only after recommendation'],
        mitigations: ['Approve criteria before scoring', 'Record criterion changes', 'Require rationale before lock'],
      },
      {
        id: 'scorecard-rationale-gap',
        label: 'Scores without defensible rationale',
        severity: 'medium',
        detectionSignals: ['Material scores lack evidence links', 'Reviewer comments are generic', 'Decision memo cites score total without exceptions'],
        mitigations: ['Require rationale fields', 'Attach evidence artifacts', 'Block use until scorecard reaches approved or locked state'],
      },
    ],
    body: `## Summary
A weighted scorecard is not just a grid of criteria. In Source, it is a governed decision artifact. The build spec defines a scorecard page, scorecard lifecycle states, stage gates, artifact types, and a smoke path that traverses the AMS event into scorecard governance. The scorecard mockup makes the governance stance explicit: commercial rationale and governance approval remain blockers before the Evaluation to BAFO gate can clear, and required artifacts include the scorecard packet, BAFO comparison, and decision memo.

## When to apply
Use this pattern whenever vendor selection depends on a scorecard across functional fit, commercial terms, implementation risk, security, transition, governance, or category-specific evidence. It applies before BAFO design, finalist recommendation, steering review, and decision memo drafting. It is especially important when a preferred vendor narrative exists before evaluation is complete, because the scorecard must preserve the buyer's decision trail rather than validate a preselected answer.

## Operating doctrine
Criteria, weighting logic, reviewer ownership, and evidence expectations should be approved before scoring is treated as decision evidence. Weighting does not need to be overcomplicated, but it must be intentional and stable. If criteria or weights change after scoring begins, the change should be visible as governance, not hidden as spreadsheet maintenance. Each material score should carry rationale or evidence linkage so reviewers can understand why the score was assigned.

## Lifecycle and gates
The scorecard lifecycle should separate draft creation, client edits, rationale completion, review, approval, lock, and use for vendor evaluation. The hard gate is that vendor evaluation output should not influence BAFO or selection until the scorecard has reached an approved or locked state. The BAFO gate should connect asks to scorecard gaps or commercial exceptions. The selection gate should connect the final recommendation to the governed scorecard and explain any override.

## Artifacts
The governed scorecard packet is required. It should include criteria, weighting logic, reviewer assignments, vendor scores, rationale, and evidence links. The scorecard approval record is required because it proves the artifact is cleared for use. The decision memo scorecard trace is required at selection so the committee can see how the final recommendation relates to the evaluation record.

## Governance posture
Scorecards fail when they become decorative after the real decision has already happened. They also fail when reviewers can change criteria while preserving the appearance of objectivity. The right posture is controlled flexibility: criteria can evolve if the buyer learns something material, but the change must be named, approved, and reflected consistently across vendors.

## Failure modes
The first failure is scorecard retrofit, where weights or criteria are adjusted to support a preferred vendor after scoring starts. The second is rationale gap, where numeric scoring looks complete but the evidence chain is missing. The third is selection disconnect, where the decision memo cites a score total without explaining exceptions, risks, or overrides. The remedy is lifecycle lock, rationale completeness, and traceable linkage from criteria to BAFO asks to final recommendation.`,
  },
];

export const SOURCING_PROCESS_PATTERN_COUNT = SOURCING_PROCESS_PATTERNS.length;
export const SOURCING_PROCESS_PATTERN_IDS = SOURCING_PROCESS_PATTERNS.map((pattern) => pattern.id);

export default SOURCING_PROCESS_PATTERNS;
