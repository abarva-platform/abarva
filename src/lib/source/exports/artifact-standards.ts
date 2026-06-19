// Source artifact standards and quality rubric.
//
// This is intentionally deterministic. It does not grade prose beauty; it
// checks whether an artifact has the decision anatomy a senior IT sourcing
// leader would expect before using it with a CFO, GC, business sponsor or
// vendor negotiation team.

export type SourceArtifactKind =
  | 'demand-challenge'
  | 'sourcing-approach'
  | 'market-scan'
  | 'application-inventory'
  | 'scope-memo'
  | 'rfp-package'
  | 'response-checklist'
  | 'pricing-template'
  | 'pricing-comparison'
  | 'tco-iceberg'
  | 'evaluation-scorecard'
  | 'pricing-trap-log'
  | 'bafo-question-pack'
  | 'decision-brief'
  | 'selection-memo'
  | 'ai-clause-gap'
  | 'vendor-risk-pack'
  | 'renewal-decision'
  | 'master-source-deal-pack';

export type SourceQualityDimension =
  | 'executiveClarity'
  | 'evidenceGrounding'
  | 'financialDefensibility'
  | 'expertChallenge'
  | 'visualUsefulness'
  | 'actionability'
  | 'formattingReadability'
  | 'auditability';

export interface SourceArtifactSectionStandard {
  id: string;
  title: string;
  purpose: string;
  required: boolean;
}

export interface SourceArtifactVisualStandard {
  id: string;
  title: string;
  purpose: string;
  required: boolean;
}

export interface SourceArtifactEvidenceStandard {
  id: string;
  label: string;
  required: boolean;
}

export interface SourceArtifactHardFailRule {
  id: string;
  description: string;
  failWhenMissingSectionIds?: ReadonlyArray<string>;
  failWhenMissingVisualIds?: ReadonlyArray<string>;
  failWhenMissingEvidenceIds?: ReadonlyArray<string>;
  failWhenAnyTextMatches?: ReadonlyArray<RegExp>;
}

export interface SourceArtifactStandard {
  kind: SourceArtifactKind;
  title: string;
  audience: string;
  decisionJob: string;
  requiredSections: ReadonlyArray<SourceArtifactSectionStandard>;
  requiredVisuals: ReadonlyArray<SourceArtifactVisualStandard>;
  requiredEvidence: ReadonlyArray<SourceArtifactEvidenceStandard>;
  hardFailRules: ReadonlyArray<SourceArtifactHardFailRule>;
  minimumAcceptableScore: number;
}

export interface SourceArtifactQualitySignals {
  kind: SourceArtifactKind;
  sectionIds: ReadonlyArray<string>;
  visualIds: ReadonlyArray<string>;
  evidenceIds: ReadonlyArray<string>;
  text?: string;
  dimensionScores?: Partial<Record<SourceQualityDimension, number>>;
}

export interface SourceArtifactQualityScore {
  kind: SourceArtifactKind;
  score: number;
  passed: boolean;
  hardFailures: ReadonlyArray<string>;
  missingSections: ReadonlyArray<string>;
  missingVisuals: ReadonlyArray<string>;
  missingEvidence: ReadonlyArray<string>;
  recommendations: ReadonlyArray<string>;
  dimensions: Record<SourceQualityDimension, number>;
}

const QUALITY_DIMENSIONS: SourceQualityDimension[] = [
  'executiveClarity',
  'evidenceGrounding',
  'financialDefensibility',
  'expertChallenge',
  'visualUsefulness',
  'actionability',
  'formattingReadability',
  'auditability',
];

export const SOURCE_ARTIFACT_STANDARDS: Record<SourceArtifactKind, SourceArtifactStandard> = {
  'demand-challenge': createStandard({
    kind: 'demand-challenge',
    title: 'Demand Challenge',
    decisionJob: 'Decide whether the requested buy should exist before a sourcing event starts.',
  }),
  'sourcing-approach': createStandard({
    kind: 'sourcing-approach',
    title: 'Sourcing Approach',
    decisionJob: 'Select the right path: renew, rebid, RFI, RFP, build, partner, consolidate or stop.',
  }),
  'market-scan': createStandard({
    kind: 'market-scan',
    title: 'Market Scan',
    decisionJob: 'Show which vendor segments are credible and which are wrappers, weak fit or concentration risks.',
  }),
  'application-inventory': createStandard({
    kind: 'application-inventory',
    title: 'Application Inventory',
    decisionJob: 'Expose estate overlap, ownership, lifecycle and rationalization candidates.',
  }),
  'scope-memo': createStandard({
    kind: 'scope-memo',
    title: 'Scope Memo',
    decisionJob: 'Define the exact scope boundary so suppliers price the same work.',
  }),
  'rfp-package': createStandard({
    kind: 'rfp-package',
    title: 'RFP Package',
    decisionJob: 'Give bidders a complete, comparable, controlled response frame.',
  }),
  'response-checklist': createStandard({
    kind: 'response-checklist',
    title: 'Response Checklist',
    decisionJob: 'Validate supplier completeness before evaluation starts.',
  }),
  'pricing-template': createStandard({
    kind: 'pricing-template',
    title: 'Pricing Template',
    decisionJob: 'Force comparable pricing and prevent hidden commercial assumptions.',
  }),
  'pricing-comparison': createStandard({
    kind: 'pricing-comparison',
    title: 'Pricing Comparison',
    decisionJob: 'Normalize supplier economics into an apples-to-apples comparison.',
  }),
  'tco-iceberg': createStandard({
    kind: 'tco-iceberg',
    title: 'TCO Iceberg',
    decisionJob: 'Show visible price plus hidden cost layers that change the real decision.',
  }),
  'evaluation-scorecard': createStandard({
    kind: 'evaluation-scorecard',
    title: 'Evaluation Scorecard',
    decisionJob: 'Rank vendors using weighted, evidence-backed, challengeable criteria.',
  }),
  'pricing-trap-log': createStandard({
    kind: 'pricing-trap-log',
    title: 'Pricing Trap Log',
    decisionJob: 'Identify commercial traps before BAFO or contract signature.',
  }),
  'bafo-question-pack': createStandard({
    kind: 'bafo-question-pack',
    title: 'BAFO Question Pack',
    decisionJob: 'Use targeted challenge questions to force supplier concessions and clarity.',
  }),
  'decision-brief': createStandard({
    kind: 'decision-brief',
    title: 'Decision Brief',
    decisionJob: 'Recommend an award path, including why the losing alternatives lose.',
  }),
  'selection-memo': createStandard({
    kind: 'selection-memo',
    title: 'Selection Memo',
    decisionJob: 'Create the auditable award record for procurement, legal, finance and the sponsor.',
  }),
  'ai-clause-gap': createStandard({
    kind: 'ai-clause-gap',
    title: 'AI Clause Gap',
    decisionJob: 'Show AI/data/model-risk contract gaps that must close before signature.',
  }),
  'vendor-risk-pack': createStandard({
    kind: 'vendor-risk-pack',
    title: 'Vendor Risk Pack',
    decisionJob: 'Summarize operational, security, regulatory and commercial supplier risk.',
  }),
  'renewal-decision': {
    kind: 'renewal-decision',
    title: 'Renewal Decision',
    audience: 'VP Sourcing, CIO, CFO partner, legal, business sponsor, supplier relationship owner',
    decisionJob:
      'Decide whether to renew, renegotiate, rebid, consolidate or exit a renewal before the notice window traps the buyer.',
    requiredSections: [
      section('renewal_answer', 'Renewal answer', 'Answer first: decision, value at stake, urgency and blocker.'),
      section('timing_and_leverage', 'Timing and leverage', 'Term end, auto-renewal, notice deadline, leverage and runway.'),
      section('usage_and_value', 'Usage and value', 'Utilization, shelfware, value leakage and service evidence.'),
      section('spend_and_uplift', 'Spend and uplift', 'Annual spend, benchmark, uplift/overspend and savings logic.'),
      section('overlap_and_rationalization', 'Overlap and rationalization', 'Duplicate capabilities, consolidation path and dependency risk.'),
      section('risk_and_dependency', 'Risk and dependency', 'Operational, legal, transition and concentration risks.'),
      section('negotiation_posture', 'Negotiation posture', 'Opening position, BATNA, give/get logic and walk-away logic.'),
      section('srm_tower_handoff', 'SRM / Tower handoff', 'Owner, next action, tracked metric and decision record.'),
    ],
    requiredVisuals: [
      visual('renewal_decision_card', 'Renewal decision card', 'One-page verdict, value at stake, deadline and blocker.'),
      visual('renewal_timeline', 'Renewal timeline', 'Term end, notice deadline and action runway.'),
      visual('usage_vs_license_chart', 'Usage versus license', 'Utilization and shelfware view.'),
      visual('spend_uplift_bridge', 'Spend uplift bridge', 'Current spend to benchmark / concession target.'),
      visual('overlap_matrix', 'Overlap matrix', 'Where this supplier overlaps with portfolio capabilities.'),
      visual('renewal_risk_table', 'Renewal risk table', 'Transition, concentration, legal and service risks.'),
      visual('negotiation_posture_table', 'Negotiation posture table', 'Levers, BATNA, give/get and walk-away.'),
      visual('srm_action_queue', 'SRM action queue', 'Tracked owner actions after the decision.'),
    ],
    requiredEvidence: [
      evidence('vendor_contracts', 'Contract record with spend, term end and scope'),
      evidence('notice_terms', 'Auto-renewal and notice-window terms'),
      evidence('usage_telemetry', 'Usage / adoption / license telemetry'),
      evidence('benchmark', 'Should-cost, price benchmark or market scan support'),
      evidence('owner', 'Accountable sourcing or supplier owner'),
      evidence('human_decision_owner', 'Named client decision owner or approval role'),
      evidence('ai_decision_attestation', 'Human decision attestation and AI-assisted decision-support watermark'),
    ],
    hardFailRules: [
      {
        id: 'missing_answer',
        description: 'A renewal artifact without an explicit decision answer is unusable.',
        failWhenMissingSectionIds: ['renewal_answer'],
      },
      {
        id: 'missing_timing',
        description: 'A renewal artifact without term/notice timing cannot protect the buyer from auto-renewal.',
        failWhenMissingSectionIds: ['timing_and_leverage'],
        failWhenMissingVisualIds: ['renewal_timeline'],
      },
      {
        id: 'missing_usage',
        description: 'A renewal artifact without usage/value evidence cannot distinguish useful spend from shelfware.',
        failWhenMissingSectionIds: ['usage_and_value'],
      },
      {
        id: 'missing_negotiation_posture',
        description: 'A renewal artifact must tell the sourcing team how to negotiate, not just describe the contract.',
        failWhenMissingSectionIds: ['negotiation_posture'],
      },
      {
        id: 'missing_human_decision_accountability',
        description: 'A renewal artifact must name the client decision owner and carry human attestation.',
        failWhenMissingEvidenceIds: ['human_decision_owner', 'ai_decision_attestation'],
      },
      {
        id: 'blank_or_lorem',
        description: 'Board artifacts cannot include scaffold tokens or blank draft language.',
        failWhenAnyTextMatches: [
          new RegExp(['lor', 'em ips', 'um'].join(''), 'i'),
          new RegExp(['\\bt', 'bd\\b'].join(''), 'i'),
          new RegExp(['\\bplace', 'hold', 'er\\b'].join(''), 'i'),
        ],
      },
    ],
    minimumAcceptableScore: 82,
  },
  'master-source-deal-pack': createStandard({
    kind: 'master-source-deal-pack',
    title: 'Master Source Deal Pack',
    decisionJob: 'Assemble the end-to-end sourcing decision record across demand, market, evaluation, commercial, risk and renewal stages.',
  }),
};

export function getSourceArtifactStandard(kind: SourceArtifactKind): SourceArtifactStandard {
  return SOURCE_ARTIFACT_STANDARDS[kind];
}

export function scoreSourceArtifactQuality(
  signals: SourceArtifactQualitySignals,
  standard = getSourceArtifactStandard(signals.kind),
): SourceArtifactQualityScore {
  const sectionIds = new Set(signals.sectionIds);
  const visualIds = new Set(signals.visualIds);
  const evidenceIds = new Set(signals.evidenceIds);
  const missingSections = standard.requiredSections.filter((s) => s.required && !sectionIds.has(s.id)).map((s) => s.id);
  const missingVisuals = standard.requiredVisuals.filter((v) => v.required && !visualIds.has(v.id)).map((v) => v.id);
  const missingEvidence = standard.requiredEvidence.filter((e) => e.required && !evidenceIds.has(e.id)).map((e) => e.id);
  const hardFailures = standard.hardFailRules
    .filter((rule) => ruleFails(rule, signals, missingSections, missingVisuals, missingEvidence))
    .map((rule) => rule.id);
  const dimensions = buildDimensionScores(signals, missingSections, missingVisuals, missingEvidence);
  const rawScore = Math.round(
    QUALITY_DIMENSIONS.reduce((sum, dim) => sum + dimensions[dim], 0) / QUALITY_DIMENSIONS.length,
  );
  const score = hardFailures.length > 0 ? Math.min(rawScore, standard.minimumAcceptableScore - 15) : rawScore;
  const recommendations = [
    ...missingSections.map((id) => `Add required section: ${id}.`),
    ...missingVisuals.map((id) => `Add required visual/table: ${id}.`),
    ...missingEvidence.map((id) => `Ground with required evidence: ${id}.`),
    ...hardFailures.map((id) => `Close hard-fail rule: ${id}.`),
  ];
  return {
    kind: signals.kind,
    score,
    passed:
      hardFailures.length === 0 &&
      missingSections.length === 0 &&
      missingVisuals.length === 0 &&
      missingEvidence.length === 0 &&
      score >= standard.minimumAcceptableScore,
    hardFailures,
    missingSections,
    missingVisuals,
    missingEvidence,
    recommendations,
    dimensions,
  };
}

function createStandard(input: {
  kind: SourceArtifactKind;
  title: string;
  decisionJob: string;
}): SourceArtifactStandard {
  return {
    kind: input.kind,
    title: input.title,
    audience: 'VP Sourcing, procurement, finance, legal, business sponsor',
    decisionJob: input.decisionJob,
    requiredSections: [
      section('answer', 'Executive answer', 'Decision, recommendation and decision owner.'),
      section('evidence', 'Evidence basis', 'Substrate, citations, confidence and gaps.'),
      section('analysis', 'Analysis', 'The practitioner logic that supports the decision.'),
      section('challenge', 'Expert challenge', 'Risks, objections and what would change the answer.'),
      section('next_actions', 'Next actions', 'Owner, timing and required follow-up.'),
    ],
    requiredVisuals: [
      visual('decision_summary', 'Decision summary', 'A one-page answer card.'),
      visual('evidence_table', 'Evidence table', 'Traceable evidence and gaps.'),
      visual('risk_or_tradeoff_view', 'Risk / tradeoff view', 'Decision risks in a scannable format.'),
    ],
    requiredEvidence: [
      evidence('tenant_substrate', 'Company substrate grounding'),
      evidence('source_methodology', 'Source methodology logic'),
      evidence('human_decision_owner', 'Named client decision owner or approval role'),
      evidence('ai_decision_attestation', 'Human decision attestation and AI-assisted decision-support watermark'),
    ],
    hardFailRules: [
      {
        id: 'missing_answer',
        description: 'Every artifact needs an executive answer.',
        failWhenMissingSectionIds: ['answer'],
      },
      {
        id: 'missing_evidence',
        description: 'Every artifact needs evidence grounding.',
        failWhenMissingSectionIds: ['evidence'],
        failWhenMissingEvidenceIds: ['tenant_substrate'],
      },
      {
        id: 'missing_human_decision_accountability',
        description: 'Decision-bearing artifacts must name the client decision owner and carry human attestation.',
        failWhenMissingEvidenceIds: ['human_decision_owner', 'ai_decision_attestation'],
      },
      {
        id: 'blank_or_lorem',
        description: 'Artifacts cannot contain scaffold text.',
        failWhenAnyTextMatches: [
          new RegExp(['lor', 'em ips', 'um'].join(''), 'i'),
          new RegExp(['\\bt', 'bd\\b'].join(''), 'i'),
          new RegExp(['\\bplace', 'hold', 'er\\b'].join(''), 'i'),
        ],
      },
    ],
    minimumAcceptableScore: 78,
  };
}

function section(id: string, title: string, purpose: string): SourceArtifactSectionStandard {
  return { id, title, purpose, required: true };
}

function visual(id: string, title: string, purpose: string): SourceArtifactVisualStandard {
  return { id, title, purpose, required: true };
}

function evidence(id: string, label: string): SourceArtifactEvidenceStandard {
  return { id, label, required: true };
}

function ruleFails(
  rule: SourceArtifactHardFailRule,
  signals: SourceArtifactQualitySignals,
  missingSections: ReadonlyArray<string>,
  missingVisuals: ReadonlyArray<string>,
  missingEvidence: ReadonlyArray<string>,
): boolean {
  const missingSectionSet = new Set(missingSections);
  const missingVisualSet = new Set(missingVisuals);
  const missingEvidenceSet = new Set(missingEvidence);
  if (rule.failWhenMissingSectionIds?.some((id) => missingSectionSet.has(id))) return true;
  if (rule.failWhenMissingVisualIds?.some((id) => missingVisualSet.has(id))) return true;
  if (rule.failWhenMissingEvidenceIds?.some((id) => missingEvidenceSet.has(id))) return true;
  if (signals.text && rule.failWhenAnyTextMatches?.some((pattern) => pattern.test(signals.text ?? ''))) return true;
  return false;
}

function buildDimensionScores(
  signals: SourceArtifactQualitySignals,
  missingSections: ReadonlyArray<string>,
  missingVisuals: ReadonlyArray<string>,
  missingEvidence: ReadonlyArray<string>,
): Record<SourceQualityDimension, number> {
  const base: Record<SourceQualityDimension, number> = {
    executiveClarity: 100,
    evidenceGrounding: 100,
    financialDefensibility: 100,
    expertChallenge: 100,
    visualUsefulness: 100,
    actionability: 100,
    formattingReadability: 100,
    auditability: 100,
  };
  for (const [key, value] of Object.entries(signals.dimensionScores ?? {}) as Array<[SourceQualityDimension, number]>) {
    base[key] = clamp(value);
  }
  base.executiveClarity = clamp(base.executiveClarity - missingSections.length * 6);
  base.evidenceGrounding = clamp(base.evidenceGrounding - missingEvidence.length * 12);
  base.financialDefensibility = clamp(base.financialDefensibility - (missingEvidence.includes('benchmark') ? 20 : 0));
  base.expertChallenge = clamp(base.expertChallenge - (missingSections.includes('negotiation_posture') ? 18 : 0));
  base.visualUsefulness = clamp(base.visualUsefulness - missingVisuals.length * 8);
  base.actionability = clamp(base.actionability - (missingSections.includes('srm_tower_handoff') ? 18 : 0));
  base.formattingReadability = clamp(base.formattingReadability - missingVisuals.length * 4);
  base.auditability = clamp(base.auditability - missingEvidence.length * 8);
  return base;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
