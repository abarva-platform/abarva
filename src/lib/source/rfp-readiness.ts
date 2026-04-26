import { getSourceRfpReadinessSeed } from './mock-seed';
import type {
  SourceRfpArtifactStatus,
  SourceRfpEvidenceReadiness,
  SourceRfpReadiness,
  SourceRfpReadinessArtifactInput,
  SourceRfpReadinessInput,
  SourceRfpReadinessMissingInput,
  SourceRfpReadinessSectionReadiness,
  SourceRfpReadinessStatus,
  SourceRfpReadinessSummary,
  SourceRfpReadinessTier,
  SourceRfpReadinessRequiredArtifact,
  SourceRfpReadinessSectionDefinition,
} from './rfp-readiness-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const REQUIRED_INPUT_CATEGORIES = [
  'Application Inventory',
  'Workload Baseline',
  'Vendor Spend',
  'Security / Compliance Requirements',
  'Retained Roles',
] as const;

const RECOMMENDED_INPUT_CATEGORIES = [
  'Ticket History',
  'SLA Baseline',
  'Vendor Contracts',
] as const;

const SECTION_DEFINITIONS: SourceRfpReadinessSectionDefinition[] = [
  {
    id: 'executive-context',
    title: 'Executive context',
    requiredInputCategories: ['Application Inventory'],
    requiredArtifacts: ['Sourcing Event Brief'],
  },
  {
    id: 'sourcing-objectives',
    title: 'Sourcing objectives',
    requiredInputCategories: ['Application Inventory', 'Workload Baseline'],
    requiredArtifacts: ['Project charter', 'Scope Document'],
  },
  {
    id: 'scope-of-services',
    title: 'Scope of services',
    requiredInputCategories: ['Application Inventory'],
    requiredArtifacts: ['Scope Document'],
  },
  {
    id: 'application-data-portfolio-scope',
    title: 'Application/data portfolio scope',
    requiredInputCategories: ['Application Inventory', 'Vendor Contracts'],
    requiredArtifacts: ['Minimum Data Request'],
  },
  {
    id: 'support-model-operating-model',
    title: 'Support model / operating model',
    requiredInputCategories: ['Retained Roles'],
    requiredArtifacts: ['Retained/Vendor Responsibility Matrix'],
  },
  {
    id: 'sla-service-level-expectations',
    title: 'SLA / service-level expectations',
    requiredInputCategories: ['SLA Baseline'],
    requiredArtifacts: ['Sourcing Event Brief'],
  },
  {
    id: 'pricing-instructions',
    title: 'Pricing instructions',
    requiredInputCategories: [
      'Workload Baseline',
      'Vendor Spend',
      'Security / Compliance Requirements',
    ],
    requiredArtifacts: ['Pricing Instructions'],
  },
  {
    id: 'vendor-response-instructions',
    title: 'Vendor response instructions',
    requiredInputCategories: ['Security / Compliance Requirements'],
    requiredArtifacts: ['RFP Outline'],
  },
  {
    id: 'transition-expectations',
    title: 'Transition expectations',
    requiredInputCategories: ['Retained Roles', 'Application Inventory'],
    requiredArtifacts: ['Retained/Vendor Responsibility Matrix'],
  },
  {
    id: 'governance-model',
    title: 'Governance model',
    requiredInputCategories: ['Security / Compliance Requirements'],
    requiredArtifacts: ['Sourcing Event Brief'],
  },
  {
    id: 'security-compliance-requirements',
    title: 'Security / compliance requirements',
    requiredInputCategories: ['Security / Compliance Requirements'],
    requiredArtifacts: ['Sourcing Event Brief'],
  },
  {
    id: 'assumptions-and-exclusions',
    title: 'Assumptions and exclusions',
    requiredInputCategories: ['Vendor Contracts', 'Ticket History'],
    requiredArtifacts: ['RFP Outline'],
  },
];

const REQUIRED_ARTIFACTS = [
  'Scope Document',
  'Minimum Data Request',
  'RFP Outline',
  'Retained/Vendor Responsibility Matrix',
  'Pricing Instructions',
];

export function buildSourceRfpReadiness(input: SourceRfpReadinessInput): SourceRfpReadiness {
  const event = input.event;
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const categoryMap = buildCategoryMap(event.dataReadiness);
  const rfpSections = buildSourceRfpSectionReadiness(event);
  const missingInputs = buildMissingInputs(categoryMap);
  const requiredInputsComplete = !missingInputs.some(
    (item) => item.severity === 'required' && item.fallbackTier !== 'waiver_required',
  );

  const scopeGate = event.stages.find((stage) => stage.key === 'scope');
  const scopeGateBlocked = scopeGate?.gate.status === 'blocked';
  const pricingInstructionReadiness = evaluatePricingReadiness(categoryMap);
  const requiredArtifacts = buildRequiredArtifacts(event.artifacts);
  const readinessScore = computeReadinessScore({
    categoryMap,
    missingInputs,
    scopeGateBlocked,
    pricingInstructionReadiness,
    rfpSections,
  });

  const overallTier = deriveOverallTier({
    readinessScore,
    requiredInputsComplete,
    missingInputs,
    scopeGateBlocked,
    pricingInstructionReadiness,
    requiredArtifacts,
  });

  const blockers = collectBlockers({
    missingInputs,
    pricingInstructionReadiness,
    scopeGate,
    requiredArtifacts,
    rfpSections,
    seed: getSourceRfpReadinessSeed(event.id),
  });

  const waiverOptions = buildWaiverOptions(missingInputs);

  const summary = summarizeSourceRfpReadiness({
    eventName: event.name,
    overallTier,
    readinessScore,
    requiredInputsComplete,
    missingInputs,
    scopeGateBlocked,
  });

  return {
    eventId: event.id,
    eventName: event.name,
    stage: event.currentStageKey,
    overallTier,
    readinessStatus: readinessStatusFromTier(overallTier),
    readinessScore,
    requiredInputsComplete,
    missingInputs,
    requiredArtifacts,
    rfpSections,
    blockers,
    waiverOptions,
    recommendedNextAction: chooseRecommendedNextAction({
      overallTier,
      missingInputs,
      scopeGateBlocked,
      requiredArtifacts,
      pricingInstructionReadiness,
    }),
    nexusGuidance: summary.nexusGuidance,
    sentinelEvidenceNotes: buildSentinelEvidenceNotes({
      categoryMap,
      rfpSections,
    }),
    stewardGateNotes: buildStewardGateNotes(scopeGate),
    atlasExecutiveImplication: buildAtlasExecutiveImplication({
      score: readinessScore,
      overallTier,
      missingInputs,
    }),
    generatedAt,
  };
}

export function buildSourceRfpSectionReadiness(
  event: SourceRfpReadinessInput['event'],
): SourceRfpReadinessSectionReadiness[] {
  const categoryMap = buildCategoryMap(event.dataReadiness);

  return SECTION_DEFINITIONS.map((section) => {
    const requiredInputsPresent: string[] = [];
    const requiredInputsMissing: string[] = [];
    const notes: string[] = [];

    for (const category of section.requiredInputCategories) {
      const readiness = categoryMap[category];
      if (!readiness || readiness.readiness === 'missing') {
        requiredInputsMissing.push(category);
        notes.push(`${category} is not available enough for deterministic RFP drafting.`);
        continue;
      }
      if (readiness.readiness === 'partial') {
        notes.push(`${category} is available but not ready for approval-grade claims.`);
      }
      requiredInputsPresent.push(category);
    }

    const status = requiredInputsMissing.length > 0
      ? (requiredInputsPresent.length === 0 ? 'missing' : 'partial')
      : 'ready';

    return {
      id: section.id,
      title: section.title,
      status: status === 'missing' ? 'missing' : status === 'partial' ? 'partial' : 'ready',
      readyForSection: status === 'ready',
      requiredInputsPresent,
      requiredInputsMissing,
      notes,
    };
  });
}

export function summarizeSourceRfpReadiness(readiness: {
  eventName: string;
  overallTier: SourceRfpReadinessTier;
  readinessScore: number;
  requiredInputsComplete: boolean;
  missingInputs: SourceRfpReadinessMissingInput[];
  scopeGateBlocked: boolean;
}): SourceRfpReadinessSummary & { nexusGuidance: string } {
  const blockerCount = readiness.missingInputs.filter((item) => item.severity === 'required').length;
  const missingText = readiness.missingInputs.length > 0
    ? `Missing: ${readiness.missingInputs.map((item) => item.category).join(', ')}`
    : 'No seeded blocker rows.';

  const nexusGuidance = readiness.scopeGateBlocked
    ? 'Scope gate blocks moving beyond Scope-to-strategy decisions until blockers are resolved.'
    : readiness.requiredInputsComplete
      ? 'Readiness can move to sourcing pack planning with caveats above.'
      : 'Collect missing inputs before defining a release-grade RFP package.';

  const summaryText =
    `${readiness.eventName}: ${readiness.overallTier} at ${readiness.readinessScore}/100. `
    + `${missingText}. ${readyLabel(readiness.overallTier)}.`
    + ` ${readiness.requiredInputsComplete ? '' : `Scope gate blockers: ${blockerCount} required rows.`}`;

  return {
    requiredInputsComplete: readiness.requiredInputsComplete,
    missingInputs: readiness.missingInputs,
    readinessScore: readiness.readinessScore,
    summaryText,
    nexusGuidance,
  };
}

export function formatSourceRfpReadinessAsMarkdown(readiness: SourceRfpReadiness): string {
  const lines: string[] = [];
  lines.push('# Source RFP Readiness');
  lines.push(`- Event: ${readiness.eventName}`);
  lines.push(`- Event ID: ${readiness.eventId}`);
  lines.push(`- Stage: ${readiness.stage}`);
  lines.push(`- Overall tier: ${readiness.overallTier}`);
  lines.push(`- Status: ${readiness.readinessStatus}`);
  lines.push(`- Readiness score: ${readiness.readinessScore}`);
  lines.push('');
  lines.push('## Required inputs');
  if (readiness.missingInputs.length === 0) {
    lines.push('- None');
  } else {
    for (const input of readiness.missingInputs) {
      lines.push(`- ${input.category}: ${input.reason}`);
    }
  }
  lines.push('');
  lines.push('## Required artifacts');
  for (const artifact of readiness.requiredArtifacts) {
    lines.push(`- ${artifact.name}: ${artifact.status}`);
  }
  lines.push('');
  lines.push('## Top blockers');
  if (readiness.blockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of readiness.blockers.slice(0, 5)) {
      lines.push(`- ${blocker}`);
    }
  }
  return lines.join('\n');
}

export function getSourceRfpReadinessBlockers(readiness: SourceRfpReadiness): string[] {
  return readiness.blockers.slice();
}

export function getSourceRfpReadinessNextActions(readiness: SourceRfpReadiness): string[] {
  const actions = [];
  const blockers = getSourceRfpReadinessBlockers(readiness);

  if (readiness.overallTier === 'Waiver Required') {
    actions.push('Request Steward waiver for the blocked required category.');
    actions.push('Assign owners and explicit downstream risks for each waiver row.');
    actions.push('Recompute readiness after waiver capture.');
  } else if (readiness.overallTier === 'Blocked') {
    actions.push('Close scope-stage blockers before RFP planning begins.');
    actions.push('Collect required data categories with required ownership.');
    actions.push('Recompute readiness after each evidence improvement.');
  } else if (readiness.overallTier === 'Rich') {
    actions.push('Produce RFP pack with release-grade caveat tracking.');
    actions.push('Maintain section-level evidence links from loaded baseline to assertions.');
    actions.push('Proceed to sourcing strategy once Steward gate is stable.');
  } else if (readiness.overallTier === 'Outline') {
    actions.push('Draft outline package content with explicit assumptions.');
    actions.push('Lift recommended inputs before moving toward rich-tier output.');
    actions.push('Keep pricing assumptions marked as directional until all blockers close.');
  } else {
    actions.push('Fill required and recommended data blocks to move to Outline.');
    actions.push('Prioritize missing baseline categories with owners assigned.');
    actions.push('Keep scope claims at planning-level language.');
  }

  if (blockers.length > 0) {
    actions.push(`Top blockers: ${blockers.slice(0, 2).join('; ')}.`);
  }

  return actions.slice(0, 3);
}

function buildCategoryMap(rows: SourceRfpReadinessInput['event']['dataReadiness']) {
  const map: Record<string, ReturnType<typeof evaluateCategoryReadiness>> = {};
  for (const row of rows) {
    map[row.category] = evaluateCategoryReadiness(row);
  }
  return map;
}

function evaluateCategoryReadiness(row: SourceRfpReadinessInput['event']['dataReadiness'][number]) {
  const readiness = mapUsabilityToReadiness(row.evidenceUsability);
  return {
    category: row.category,
    readiness,
    requirementLevel: row.requirementLevel,
    confidence: row.confidence,
    workflowImpact: row.workflowImpact,
    evidenceUsability: row.evidenceUsability,
  };
}

function buildMissingInputs(categoryMap: ReturnType<typeof buildCategoryMap>): SourceRfpReadinessMissingInput[] {
  const required = buildMissingRows(categoryMap, REQUIRED_INPUT_CATEGORIES);
  const recommended = buildMissingRows(categoryMap, RECOMMENDED_INPUT_CATEGORIES);
  const requiredMissing = required
    .map((row) => mapMissingInputRow(row, 'required'));
  const recommendedMissing = recommended
    .map((row) => mapMissingInputRow(row, 'recommended'));

  return [...requiredMissing, ...recommendedMissing];
}

function mapMissingInputRow(
  row: ReturnType<typeof evaluateCategoryReadiness>,
  severity: 'required' | 'recommended',
) : SourceRfpReadinessMissingInput {
  const fallbackTier: SourceRfpReadinessMissingInput['fallbackTier'] = row.readiness === 'missing'
    ? (severity === 'required' ? 'waiver_required' : 'outline')
    : 'stub';

  return {
    category: row.category,
    reason: row.workflowImpact,
    impact: row.workflowImpact,
    severity,
    fallbackTier,
  };
}

function buildMissingRows(
  categoryMap: Record<string, ReturnType<typeof evaluateCategoryReadiness>>,
  categories: readonly string[],
) {
  return categories
    .map((category) => categoryMap[category])
    .filter((entry): entry is ReturnType<typeof evaluateCategoryReadiness> => Boolean(entry))
    .filter((entry) => entry.readiness !== 'ready');
}

function evaluatePricingReadiness(categoryMap: ReturnType<typeof buildCategoryMap>) {
  const requiredForPricing = ['Workload Baseline', 'Vendor Spend', 'Security / Compliance Requirements'];
  const blockers = requiredForPricing
    .map((category) => categoryMap[category])
    .filter((entry): entry is ReturnType<typeof evaluateCategoryReadiness> => Boolean(entry))
    .filter((entry) => entry.readiness !== 'ready')
    .map((entry) => `${entry.category} readiness not usable for pricing assumptions.`);

  return {
    baselineReady: blockers.length === 0,
    blockers,
  };
}

function computeReadinessScore(input: {
  categoryMap: ReturnType<typeof buildCategoryMap>;
  missingInputs: SourceRfpReadinessMissingInput[];
  scopeGateBlocked: boolean;
  pricingInstructionReadiness: ReturnType<typeof evaluatePricingReadiness>;
  rfpSections: SourceRfpReadinessSectionReadiness[];
}): number {
  let score = 100;
  for (const item of Object.values(input.categoryMap)) {
    if (item.requirementLevel === 'required') {
      if (item.readiness === 'missing') score -= 22;
      if (item.readiness === 'partial') score -= 11;
    }
    if (item.requirementLevel === 'recommended') {
      if (item.readiness === 'missing') score -= 8;
      if (item.readiness === 'partial') score -= 4;
    }
    if (item.requirementLevel === 'optional' && item.readiness === 'missing') score -= 2;
  }

  const partialSections = input.rfpSections.filter((section) => section.status !== 'ready').length;
  score -= partialSections * 2;

  if (input.scopeGateBlocked) score -= 12;
  if (!input.pricingInstructionReadiness.baselineReady) score -= 10;
  if (input.missingInputs.some((item) => item.severity === 'required' && item.fallbackTier === 'waiver_required')) {
    score -= 18;
  }

  return Math.max(0, Math.min(100, score));
}

function deriveOverallTier(input: {
  readinessScore: number;
  requiredInputsComplete: boolean;
  missingInputs: SourceRfpReadinessMissingInput[];
  scopeGateBlocked: boolean;
  pricingInstructionReadiness: ReturnType<typeof evaluatePricingReadiness>;
  requiredArtifacts: SourceRfpReadinessRequiredArtifact[];
}): SourceRfpReadinessTier {
  const requiredMissing = input.missingInputs.filter((item) => (
    item.severity === 'required' && item.fallbackTier !== 'waiver_required'
  ));
  const hasWaiverOption = input.missingInputs.some((item) => item.fallbackTier === 'waiver_required');
  const missingArtifactForRich = input.requiredArtifacts.filter((artifact) => (
    artifact.tierImpact === 'Rich' && artifact.status !== 'ready' && artifact.status !== 'issued'
  )).length > 0;
  const hasRequiredGateBlocker = input.scopeGateBlocked || requiredMissing.length > 0;

  if (hasRequiredGateBlocker) {
    return hasWaiverOption ? 'Waiver Required' : 'Blocked';
  }

  if (missingArtifactForRich) {
    return input.readinessScore >= 55 ? 'Outline' : 'Stub';
  }

  if (!input.pricingInstructionReadiness.baselineReady) {
    return 'Stub';
  }

  if (input.readinessScore >= 82) return 'Rich';
  if (input.readinessScore >= 60) return 'Outline';
  return 'Stub';
}

function collectBlockers(input: {
  missingInputs: SourceRfpReadinessMissingInput[];
  pricingInstructionReadiness: ReturnType<typeof evaluatePricingReadiness>;
  scopeGate?: SourceRfpReadinessInput['event']['stages'][number];
  requiredArtifacts: SourceRfpReadinessRequiredArtifact[];
  rfpSections: SourceRfpReadinessSectionReadiness[];
  seed: ReturnType<typeof getSourceRfpReadinessSeed>;
}): string[] {
  const blockers: string[] = [];

  for (const item of input.missingInputs.filter((row) => row.severity === 'required').slice(0, 3)) {
    blockers.push(`Required: ${item.category}: ${item.impact}`);
  }

  blockers.push(...input.pricingInstructionReadiness.blockers);

  for (const artifact of input.requiredArtifacts.filter((item) => item.status === 'not_started' || item.status === 'needs_inputs')) {
    blockers.push(`Artifact pending: ${artifact.name}`);
  }

  for (const section of input.rfpSections.filter((section) => section.status !== 'ready').slice(0, 2)) {
    blockers.push(`${section.title} is ${section.status}; ${section.requiredInputsMissing[0] ?? 'inputs' } still missing.`);
  }

  if (input.scopeGate?.gate.blocker) {
    blockers.push(`Scope gate: ${input.scopeGate.gate.blocker}`);
  }

  if (input.seed) {
    blockers.push(...input.seed.blockers);
  }

  return [...new Set(blockers)].slice(0, 10);
}

function buildRequiredArtifacts(
  artifacts: SourceRfpReadinessArtifactInput[],
): SourceRfpReadinessRequiredArtifact[] {
  return REQUIRED_ARTIFACTS.map((name) => {
    const artifact = artifacts.find((item) => item.title === name);
    const artifactStatus = artifact?.status ? mapArtifactStatus(artifact.status) : 'not_started';
    const readiness = artifactStatus === 'locked'
      ? 'ready'
      : artifactStatus === 'needs_inputs'
        ? 'partial'
        : artifactStatus === 'draft'
          ? 'partial'
          : 'missing';

    return {
      name,
      status: artifactStatus,
      readiness,
      tierImpact:
        name === 'Pricing Instructions'
          ? 'Rich'
          : name === 'Scope Document'
            ? 'Outline'
            : 'none',
    };
  });
}

function buildWaiverOptions(missingInputs: SourceRfpReadinessMissingInput[]): string[] {
  return missingInputs
    .filter((item) => item.fallbackTier === 'waiver_required')
    .map((item) => `Steward waiver required for ${item.category} if timeline compresses.`);
}

function buildStewardGateNotes(scopeGate?: SourceRfpReadinessInput['event']['stages'][number]): string[] {
  if (!scopeGate) return ['No seeded scope gate row exists.'];
  return [
    `${scopeGate.gate.label}: ${scopeGate.gate.status}`,
    scopeGate.gate.blocker ? `Scope gate blocker: ${scopeGate.gate.blocker}` : 'Scope gate has no blocker row.',
  ];
}

function buildSentinelEvidenceNotes(input: {
  categoryMap: Record<string, ReturnType<typeof evaluateCategoryReadiness>>;
  rfpSections: SourceRfpReadinessSectionReadiness[];
}) {
  const usable = Object.values(input.categoryMap).filter((item) => item.readiness === 'ready').length;
  const partial = Object.values(input.categoryMap).filter((item) => item.readiness === 'partial').length;
  const missing = Object.values(input.categoryMap).filter((item) => item.readiness === 'missing').length;
  const notes = [
    `${usable} categories are usable evidence for release language.`,
    `${partial} categories are loaded/available but require validation before claims.`,
    `${missing} categories are not present in seeded read model.`,
  ];
  notes.push(`Readiness section signals: ${input.rfpSections.filter((section) => section.status === 'ready').length} ready, ${input.rfpSections.filter((section) => section.status !== 'ready').length} blocked.`);
  return notes;
}

function buildAtlasExecutiveImplication(input: {
  score: number;
  overallTier: SourceRfpReadinessTier;
  missingInputs: SourceRfpReadinessMissingInput[];
}) {
  if (input.overallTier === 'Rich' && input.score >= 82) {
    return 'Atlas can present planning-to-execution value proposition with guarded assumptions.';
  }
  if (input.overallTier === 'Waiver Required') {
    return 'Atlas should present only planning narrative while waivers are resolved.';
  }
  return `Atlas recommendation: ${input.overallTier} with ${input.missingInputs.length} input gaps.`;
}

function chooseRecommendedNextAction(input: {
  overallTier: SourceRfpReadinessTier;
  missingInputs: SourceRfpReadinessMissingInput[];
  scopeGateBlocked: boolean;
  requiredArtifacts: SourceRfpReadinessRequiredArtifact[];
  pricingInstructionReadiness: ReturnType<typeof evaluatePricingReadiness>;
}): string {
  if (input.overallTier === 'Waiver Required' || input.scopeGateBlocked) {
    return 'Close scope gate and request required waivers before moving to sourcing package outputs.';
  }

  if (input.pricingInstructionReadiness.blockers.length > 0) {
    return 'Complete workload, spend, and security/compliance assumptions before pricing section.'
      + ' Keep assumptions explicit.';
  }

  if (input.requiredArtifacts.some((artifact) => artifact.tierImpact === 'Rich' && artifact.readiness !== 'ready')) {
    return 'Produce pricing and governance artifacts to reach Rich-tier readiness.';
  }

  if (input.overallTier === 'Outline') return 'Start drafting outline and transition RFP instructions.';
  return 'Collect remaining required and recommended inputs and recompute readiness.';
}

function mapArtifactStatus(status: SourceRfpReadinessArtifactInput['status']): SourceRfpArtifactStatus {
  switch (status) {
    case 'not_started':
      return 'not_started';
    case 'draft':
      return 'draft';
    case 'needs_inputs':
      return 'needs_inputs';
    case 'needs_review':
      return 'needs_inputs';
    case 'locked':
      return 'locked';
    case 'approved':
      return 'locked';
    case 'superseded':
      return 'archived';
    case 'archived':
      return 'archived';
    default:
      return 'not_started';
  }
}

function mapUsabilityToReadiness(value: SourceRfpReadinessInput['event']['dataReadiness'][number]['evidenceUsability']): SourceRfpEvidenceReadiness {
  if (value === 'usable' || value === 'waived') return 'ready';
  if (value === 'not_available') return 'missing';
  return 'partial';
}

function readinessStatusFromTier(tier: SourceRfpReadinessTier): SourceRfpReadinessStatus {
  if (tier === 'Rich') return 'sufficient';
  if (tier === 'Outline') return 'partial';
  if (tier === 'Stub') return 'incomplete';
  if (tier === 'Waiver Required') return 'waiver_required';
  return 'blocked';
}

function readyLabel(tier: SourceRfpReadinessTier): string {
  if (tier === 'Rich') return 'Approach is release planning ready.';
  if (tier === 'Outline') return 'Approach is viable for outline-tier package.';
  if (tier === 'Stub') return 'Approach remains partial and should not drive release documents.';
  if (tier === 'Waiver Required') return 'Approach has required gaps with waiver path.';
  return 'Approach is blocked by required missing inputs.';
}
