import { getSourcePricingNormalizationSeed, getSourceVendorResponseSeed } from './mock-seed';
import { buildSourcePricingNormalization } from './pricing-normalization';
import type { SourcePricingVendorInput } from './pricing-normalization-types';
import type {
  SourcePricingVendorSnapshot,
} from './pricing-normalization-types';
import type { SourceVendorResponseSeedInput } from './vendor-response-types';
import type {
  SourceBafoCommercialTrapSummary,
  SourceBafoNegotiationInput,
  SourceBafoNegotiationPlan,
  SourceBafoNegotiationQuestion,
  SourceBafoNegotiationReadiness,
  SourceBafoQuestionCategory,
  SourceBafoVendorNegotiationPlan,
  SourceVendorBafoReadiness,
} from './bafo-negotiation-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const REQUIRED_SECTIONS = [
  'Executive response',
  'Scope confirmation',
  'Pricing template',
  'Assumptions and exclusions',
  'Transition plan',
  'Delivery model',
  'SLA response',
  'Security and compliance response',
  'Automation / productivity roadmap',
  'References and evidence',
] as const;

const CRITICAL_SECTIONS = [
  'Pricing template',
  'Scope confirmation',
  'Security and compliance response',
] as const;

const ASSUMPTION_LOCKS = [
  'Application and workload assumptions are locked in event-level baseline data.',
  'Security obligations are explicit by role and evidence owner.',
  'Transition support and release assumptions are contract-ready.',
  'Automation claims are bounded to observable commitments and cadence.',
  'Commercial exclusions are enumerated with a written waiver option.',
] as const;

const KNOWN_EXCLUSIONS = [
  'Release support and minor enhancements are excluded unless contract addendum is approved.',
  'Tooling maintenance and third-party API support are excluded unless explicitly priced.',
  'Change-overhead and add-on services must be captured before BAFO.',
] as const;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function pickVendorResponses(input: SourceBafoNegotiationInput['event']): SourceVendorResponseSeedInput[] {
  if (input.vendorResponses && input.vendorResponses.length > 0) {
    return input.vendorResponses;
  }
  return getSourceVendorResponseSeed(input.id).responses;
}

function pickPricingInputs(input: SourceBafoNegotiationInput['event']): SourcePricingVendorInput[] | undefined {
  if (input.pricingInputs && input.pricingInputs.length > 0) {
    return input.pricingInputs;
  }
  const pricingSeed = getSourcePricingNormalizationSeed(input.id);
  if (pricingSeed.vendors.length > 0) {
    return pricingSeed.vendors;
  }
  return undefined;
}

function pickSnapshots(
  input: SourceBafoNegotiationInput['event'],
  responses: SourceVendorResponseSeedInput[],
): SourcePricingVendorSnapshot[] {
  if (input.pricingNormalizationSnapshots && input.pricingNormalizationSnapshots.length > 0) {
    return input.pricingNormalizationSnapshots;
  }

  if (!pickPricingInputs(input)) {
    return [];
  }

  const pricing = buildSourcePricingNormalization({
    event: {
      id: input.id,
      name: input.name,
      currentStageKey: input.currentStageKey,
      vendorResponses: responses.map((response) => ({
        vendorId: response.vendorId,
        vendorName: response.vendorName,
        responseStatus: response.responseStatus,
        evidenceUsability: response.evidenceUsability,
        evidenceStatus: response.evidenceStatus,
        pricingTemplateStatus: response.pricingTemplateStatus,
        transitionPlanStatus: response.transitionPlanStatus,
        securityResponseStatus: response.securityResponseStatus,
        automationRoadmapStatus: response.automationRoadmapStatus,
        responseRiskLevel: response.responseRiskLevel,
      })),
      pricingInputs: pickPricingInputs(input),
    },
  });

  return pricing.snapshots;
}

function evaluateVendorReadiness(vendor: SourceVendorResponseSeedInput): SourceVendorBafoReadiness {
  const requiredSet = new Set(REQUIRED_SECTIONS.map(normalizeText));
  const submittedSet = new Set(vendor.submittedSections.map(normalizeText));
  const missingRequired = REQUIRED_SECTIONS.filter((section) => (
    requiredSet.has(normalizeText(section)) && !submittedSet.has(normalizeText(section))
  ));

  if (vendor.responseStatus === 'blocked' || vendor.responseStatus === 'rejected') {
    return 'blocked';
  }

  if (vendor.pricingTemplateStatus === 'missing' || vendor.securityResponseStatus === 'missing') {
    return 'not_comparable';
  }

  if (CRITICAL_SECTIONS.some((section) => missingRequired.includes(section))) {
    return 'not_comparable';
  }

  const hasCriticalDataGap = vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted';
  if (
    vendor.responseStatus !== 'submitted'
    || vendor.pricingTemplateStatus !== 'complete'
    || vendor.transitionPlanStatus !== 'complete'
    || missingRequired.length > 0
    || hasCriticalDataGap
    || vendor.responseRiskLevel === 'high'
  ) {
    return 'conditional';
  }

  return 'ready';
}

function buildMissingSections(vendor: SourceVendorResponseSeedInput): string[] {
  const required = vendor.requiredSections.map(normalizeText);
  const submitted = new Set(vendor.submittedSections.map(normalizeText));
  return required.filter((section) => !submitted.has(section));
}

function buildQuestion(
  question: string,
  reason: string,
  category: SourceBafoQuestionCategory,
  priority: 'high' | 'medium' | 'low' = 'medium',
): SourceBafoNegotiationQuestion {
  return { question, reason, category, priority };
}

export function buildVendorNegotiationQuestions(
  vendor: SourceVendorResponseSeedInput,
  snapshot: SourcePricingVendorSnapshot | undefined,
): SourceBafoNegotiationQuestion[] {
  const questions: SourceBafoNegotiationQuestion[] = [];
  const missingSections = buildMissingSections(vendor);

  for (const section of missingSections) {
    if (section === 'pricing template') {
      questions.push(
        buildQuestion(
          'Submit a complete and line-item pricing template.',
          'Missing pricing template blocks deterministic commercial comparison and BAFO normalization.',
          'pricing',
          'high',
        ),
      );
    } else if (section === 'security and compliance response') {
      questions.push(
        buildQuestion(
          'Complete the security and compliance response section.',
          'Security obligations must be explicit before recommendation lock.',
          'governance',
          'high',
        ),
      );
    } else if (section === 'transition plan') {
      questions.push(
        buildQuestion(
          'Clarify transition plan with owners, milestones, and release support boundaries.',
          'Transition ambiguity creates risk in BAFO timing assumptions.',
          'transition',
          'high',
        ),
      );
    } else if (section === 'automation / productivity roadmap') {
      questions.push(
        buildQuestion(
          'Provide measurable automation milestones tied to evidence.',
          'Vendor response should include measurable automation outcomes and checkpoints.',
          'evidence',
          'medium',
        ),
      );
    } else {
      questions.push(
        buildQuestion(
          `Close missing ${section} section before BAFO.`,
          `Missing section ${section} reduces comparability and weakens procurement confidence.`,
          'scope',
          'medium',
        ),
      );
    }
  }

  if (vendor.pricingTemplateStatus === 'incomplete') {
    questions.push(
      buildQuestion(
        'Reconcile all pricing fields and line-item deltas.',
        'Incomplete pricing creates non-actionable commercial positioning.',
        'pricing',
        'high',
      ),
    );
  }

  if (vendor.transitionPlanStatus !== 'complete') {
    questions.push(
      buildQuestion(
        'Clarify transition ownership, handoff windows, and tooling handback.',
        'Transition commitments are a first-order risk for enterprise readiness.',
        'transition',
        'high',
      ),
    );
  }

  if (vendor.securityResponseStatus !== 'complete') {
    questions.push(
      buildQuestion(
        'Specify security and compliance obligations by responsibility owner.',
        'Commercial commitments depend on clear residual risk and ownership.',
        'governance',
        'high',
      ),
    );
  }

  if (vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted') {
    questions.push(
      buildQuestion(
        'Attach a measurable evidence bundle for all commercial claims.',
        'Weak evidence reduces commercial trust and finalization confidence.',
        'evidence',
        'high',
      ),
    );
  }

  const exclusionFlags = vendor.exclusions.map(normalizeText).join(' ');
  if (exclusionFlags.includes('release') || exclusionFlags.includes('minor') || exclusionFlags.includes('tooling')) {
    questions.push(
      buildQuestion(
        'Clarify release, tooling, and minor enhancement exclusions in contract terms.',
        'Known exclusions must be explicit in pricing to prevent scope drift.',
        'exclusion',
        'high',
      ),
    );
  }

  if (snapshot && snapshot.commercialTraps.some((trap) => trap.category === 'Rate escalation')) {
    questions.push(
      buildQuestion(
        'Confirm capped rate escalation assumptions through year three.',
        'Commercial stability is currently exposed to unbounded pricing drift.',
        'pricing',
        'medium',
      ),
    );
  }

  if (vendor.vendorId === 'vendor-b' && vendor.pricingTemplateStatus !== 'complete') {
    questions.push(
      buildQuestion(
        'Upload transition and pricing addendum with complete template details.',
        'Vendor B is currently blocked on pricing completeness for comparison.',
        'pricing',
        'high',
      ),
    );
  }

  if (vendor.vendorId === 'vendor-a') {
    questions.push(
      buildQuestion(
        'Lock transition release, minor enhancement, and tooling exclusions in a contract addendum.',
        'Vendor A should confirm exclusions to prevent post-award scope expansion.',
        'exclusion',
        'medium',
      ),
    );
  }

  if (vendor.vendorId === 'vendor-c' && snapshot && snapshot.commercialTraps.some((trap) => (
    trap.category === 'Automation trap' || trap.category === 'Evidence'
  ))) {
    questions.push(
      buildQuestion(
        'Explain contract-backed evidence for automation and productivity gains.',
        'High automation upside requires measured commitments before recommendation lock.',
        'evidence',
        'high',
      ),
    );
  }

  return questions;
}

function buildKeyIssues(
  vendor: SourceVendorResponseSeedInput,
  snapshot: SourcePricingVendorSnapshot | undefined,
): string[] {
  const issues = new Set<string>([
    `Readiness: ${evaluateVendorReadiness(vendor).replace('_', ' ')}.`,
    `Response status: ${vendor.responseStatus}.`,
  ]);

  if (vendor.responseRiskLevel === 'high') {
    issues.add('Response risk level is high and may need mitigation.');
  }

  if (!snapshot) {
    issues.add('Pricing snapshot missing; decisions should be provisional.');
    return Array.from(issues);
  }

  if (snapshot.commercialTraps.length > 0) {
    issues.add(`${snapshot.commercialTraps.length} commercial trap(s) present.`);
  }
  if (snapshot.comparabilityStatus === 'not_comparable') {
    issues.add('Pricing snapshot is not comparable.');
  }
  if (snapshot.readinessStatus === 'not_comparable') {
    issues.add('Readiness flags indicate required commercial blockers.');
  }

  return Array.from(issues);
}

function buildRequiredClarifications(vendor: SourceVendorResponseSeedInput): string[] {
  const output: string[] = [];

  if (buildMissingSections(vendor).length > 0) {
    output.push('Missing required sections must be completed before BAFO.');
  }
  if (vendor.pricingTemplateStatus !== 'complete') {
    output.push('Missing or incomplete pricing template line-items require re-submission.');
  }
  if (vendor.transitionPlanStatus !== 'complete') {
    output.push('Transition plan should explicitly cover release, handoff, and support ownership.');
  }
  if (vendor.securityResponseStatus !== 'complete') {
    output.push('Security/compliance obligations should include owner, liability, and escalation path.');
  }
  if (vendor.responseRiskLevel === 'high') {
    output.push('Risk notes should be signed and explicitly accepted before recommendation lock.');
  }

  if (output.length === 0) {
    output.push('No additional clarifications required for the current BAFO cycle.');
  }

  return output;
}

function buildRecommendedAsks(
  vendor: SourceVendorResponseSeedInput,
  snapshot: SourcePricingVendorSnapshot | undefined,
): string[] {
  const asks = new Set<string>([
    'Validate blockers and update comparability notes before recommendation lock.',
  ]);

  if (vendor.pricingTemplateStatus === 'missing' || vendor.pricingTemplateStatus === 'incomplete') {
    asks.add('Upload complete pricing template (all sections and line-items).');
  }
  if (vendor.transitionPlanStatus !== 'complete') {
    asks.add('Upload transition milestones with retained and vendor role split.');
  }
  if (vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted') {
    asks.add('Supplement claims with measurable references and usage evidence.');
  }

  const exclusionFlags = vendor.exclusions.map(normalizeText).join(' ');
  if (exclusionFlags.includes('release') || exclusionFlags.includes('minor') || exclusionFlags.includes('tooling')) {
    asks.add('Clarify exclusion language around release support and minor enhancements.');
  }
  if (snapshot?.commercialTraps.some((trap) => trap.category === 'Security/compliance')) {
    asks.add('Confirm security obligations are contract-ready and evidence-backed.');
  }
  if (asks.size === 1) {
    asks.add('No additional BAFO asks outside current commercial follow-through.');
  }

  return Array.from(asks);
}

function buildVendorRiskNotes(
  vendor: SourceVendorResponseSeedInput,
  snapshot: SourcePricingVendorSnapshot | undefined,
): string[] {
  const notes = new Set<string>([
    `Vendor evidence status: ${vendor.evidenceStatus}.`,
    `Evidence usability: ${vendor.evidenceUsability}.`,
  ]);
  if (vendor.responseRiskLevel === 'high') {
    notes.add('High response risk level indicates elevated commercial uncertainty.');
  }
  if (vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted') {
    notes.add('Evidence cannot yet be treated as deterministic for recommendation lock.');
  }
  if (snapshot) {
    for (const trap of snapshot.commercialTraps.slice(0, 2)) {
      notes.add(`${trap.category}: ${trap.signal}`);
    }
  }
  return Array.from(notes);
}

function buildBlockers(
  vendor: SourceVendorResponseSeedInput,
  questions: SourceBafoNegotiationQuestion[],
): string[] {
  const blockers: string[] = [];
  if (vendor.responseStatus === 'blocked' || vendor.responseStatus === 'rejected') {
    blockers.push(`${vendor.vendorName}: response is not in an evaluable state.`);
  }
  if (vendor.pricingTemplateStatus !== 'complete') {
    blockers.push(`${vendor.vendorName}: pricing template is incomplete or missing.`);
  }
  if (vendor.transitionPlanStatus !== 'complete') {
    blockers.push(`${vendor.vendorName}: transition plan is incomplete.`);
  }
  if (vendor.securityResponseStatus !== 'complete') {
    blockers.push(`${vendor.vendorName}: security/compliance response remains incomplete.`);
  }
  if (vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted') {
    blockers.push(`${vendor.vendorName}: evidence is not yet dependable.`);
  }
  if (questions.length > 2) {
    blockers.push(`${vendor.vendorName}: multiple high-priority BAFO actions remain.`);
  }
  return blockers;
}

function buildExpectedValueImpact(
  vendor: SourceVendorResponseSeedInput,
  snapshot: SourcePricingVendorSnapshot | undefined,
): string {
  if (snapshot && snapshot.commercialTraps.some((trap) => trap.category === 'Automation trap')) {
    return vendor.vendorId === 'vendor-c'
      ? 'Automation upside is strong but contingent on measurable workflow commitments.'
      : 'Automation assumption is present and should be validated before final trade-off lock.';
  }
  if (snapshot && snapshot.readinessStatus === 'risk_adjusted') {
    return 'Value upside is plausible but requires commercial and evidence clarifications.';
  }
  if (snapshot && snapshot.readinessStatus === 'not_comparable') {
    return 'Commercial value cannot be compared until critical comparability blockers are resolved.';
  }
  return 'Value impact is directionally comparable after current blockers are cleared.';
}

function buildCommercialTrapSummary(snapshots: SourcePricingVendorSnapshot[]): SourceBafoCommercialTrapSummary[] {
  const grouped = new Map<string, { category: string; count: number; severity: 'low' | 'medium' | 'high'; samples: string[] }>();
  for (const snapshot of snapshots) {
    for (const trap of snapshot.commercialTraps) {
      const existing = grouped.get(trap.category);
      if (existing) {
        existing.count += 1;
        if (existing.severity !== 'high' && trap.severity === 'high') {
          existing.severity = 'high';
        }
        if (existing.severity === 'low' && trap.severity === 'medium') {
          existing.severity = 'medium';
        }
        if (!existing.samples.includes(trap.signal)) {
          existing.samples.push(trap.signal);
        }
      } else {
        grouped.set(trap.category, {
          category: trap.category,
          count: 1,
          severity: trap.severity,
          samples: [trap.signal],
        });
      }
    }
  }

  return Array.from(grouped.values()).map((entry) => ({
    category: entry.category,
    count: entry.count,
    severity: entry.severity,
    samples: entry.samples.slice(0, 2),
  }));
}

function aggregateExclusions(vendors: SourceVendorResponseSeedInput[], snapshots: SourcePricingVendorSnapshot[]): string[] {
  const exclusions = new Set<string>(KNOWN_EXCLUSIONS);
  for (const snapshot of snapshots) {
    for (const exclusion of snapshot.exclusions) {
      exclusions.add(exclusion);
    }
    for (const optional of snapshot.optionals) {
      if (/release|minor|tooling/i.test(optional)) {
        exclusions.add(`Optional item requires explicit decision: ${optional}.`);
      }
    }
  }
  for (const vendor of vendors) {
    for (const exclusion of vendor.exclusions) {
      exclusions.add(exclusion);
    }
  }
  return Array.from(exclusions).slice(0, 12);
}

function toBafoReadiness(vendors: SourceVendorBafoReadiness[]): SourceBafoNegotiationReadiness {
  if (vendors.some((readiness) => readiness === 'blocked')) {
    return 'blocked';
  }
  if (vendors.some((readiness) => readiness === 'not_comparable')) {
    return 'not_ready';
  }
  if (vendors.some((readiness) => readiness === 'conditional')) {
    return 'partially_ready';
  }
  return 'ready';
}

function summarizeBlockers(vendors: SourceBafoVendorNegotiationPlan[]): string[] {
  return Array.from(new Set(vendors.flatMap((vendor) => vendor.blockers)));
}

export function getSourceNegotiationBlockers(
  input: SourceBafoNegotiationPlan | SourceBafoVendorNegotiationPlan[],
): string[] {
  if (Array.isArray(input)) {
    return summarizeBlockers(input);
  }
  return summarizeBlockers(input.vendorNegotiationPlans);
}

export function getSourceBafoPriorities(plan: SourceBafoNegotiationPlan): string[] {
  const priorities = new Set<string>();
  const notComparable = plan.vendorNegotiationPlans.filter((vendor) => vendor.readiness === 'not_comparable');
  if (notComparable.length > 0) {
    priorities.add(`Close not comparable blockers for ${notComparable.map((vendor) => vendor.vendorName).join(', ')}.`);
  }
  const blocked = plan.vendorNegotiationPlans.filter((vendor) => vendor.readiness === 'blocked');
  if (blocked.length > 0) {
    priorities.add(`Resolve blocked vendor states before decision lock: ${blocked.map((vendor) => vendor.vendorName).join(', ')}.`);
  }
  const conditional = plan.vendorNegotiationPlans.filter((vendor) => vendor.readiness === 'conditional');
  if (conditional.length > 0) {
    priorities.add(`Stabilize evidence and pricing conditions for ${conditional.map((vendor) => vendor.vendorName).join(', ')}.`);
  }
  priorities.add('Publish assumption lock list for legal, finance, security, and transition decisions.');
  priorities.add('Collect comparability evidence for BAFO selection set.');
  return Array.from(priorities).slice(0, 5);
}

export function summarizeSourceBafoNegotiation(plan: SourceBafoNegotiationPlan): string {
  return `BAFO negotiation: ${plan.vendorNegotiationPlans.length} vendors, overall ${plan.overallNegotiationReadiness},`
    + ` ${plan.blockers.length} blockers, next action "${plan.nextAction}".`;
}

export function formatSourceBafoNegotiationAsMarkdown(plan: SourceBafoNegotiationPlan): string {
  const lines = [
    '# Source BAFO Negotiation',
    '',
    `Event: ${plan.eventName} (${plan.eventId})`,
    `Stage: ${plan.stage}`,
    `Readiness: ${plan.overallNegotiationReadiness}`,
    `Generated: ${plan.generatedAt}`,
    '',
    `Assumption locks: ${plan.assumptionLockList.join('; ')}`,
    `Excluded scope: ${plan.excludedScopeList.join('; ')}`,
    `Next action: ${plan.nextAction}`,
    '',
    '## Executive tradeoff',
    plan.executiveTradeoffSummary,
    '',
    '## Recommended BAFO priorities',
    ...plan.recommendedBafoPriorities.map((priority) => `- ${priority}`),
    '',
    '## Top blockers',
    ...plan.blockers.map((blocker) => `- ${blocker}`),
    '',
    '## Vendor Negotiation Plans',
  ];

  for (const vendor of plan.vendorNegotiationPlans) {
    lines.push(
      `- ${vendor.vendorName} (${vendor.readiness}): impact = ${vendor.expectedValueImpact}`,
    );
    lines.push(`  - Blockers: ${vendor.blockers.join('; ') || 'none'}`);
    lines.push(`  - Questions: ${vendor.negotiationQuestions.length}`);
    if (vendor.negotiationQuestions.length > 0) {
      lines.push('  - Top questions:');
      for (const question of vendor.negotiationQuestions.slice(0, 2)) {
        lines.push(`    - ${question.question}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function buildSourceBafoNegotiationPlan(input: SourceBafoNegotiationInput): SourceBafoNegotiationPlan {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const vendorResponses = pickVendorResponses(input.event);
  const pricingSnapshots = pickSnapshots(input.event, vendorResponses);
  const snapshotByVendor = new Map(pricingSnapshots.map((snapshot) => [snapshot.vendorId, snapshot]));

  const vendorPlans: SourceBafoVendorNegotiationPlan[] = vendorResponses.map((vendor) => {
    const snapshot = snapshotByVendor.get(vendor.vendorId);
    const readiness = evaluateVendorReadiness(vendor);
    const questions = buildVendorNegotiationQuestions(vendor, snapshot);
    const keyIssues = buildKeyIssues(vendor, snapshot);
    const requiredClarifications = buildRequiredClarifications(vendor);
    const recommendedAsks = buildRecommendedAsks(vendor, snapshot);
    const expectedValueImpact = buildExpectedValueImpact(vendor, snapshot);
    const riskNotes = buildVendorRiskNotes(vendor, snapshot);
    const blockers = buildBlockers(vendor, questions);

    return {
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      readiness,
      keyIssues,
      negotiationQuestions: questions,
      requiredClarifications,
      recommendedAsks,
      expectedValueImpact,
      riskNotes,
      evidenceStatus: vendor.evidenceStatus,
      blockers,
    };
  });

  const readiness = toBafoReadiness(vendorPlans.map((vendorPlan) => vendorPlan.readiness));
  const blockers = summarizeBlockers(vendorPlans);
  const commercialTrapSummary = buildCommercialTrapSummary(pricingSnapshots);
  const excludedScopeList = aggregateExclusions(vendorResponses, pricingSnapshots);

  const sentinelEvidenceNotes = pricingSnapshots
    .flatMap((snapshot) => snapshot.commercialTraps)
    .filter((trap) => trap.category === 'Evidence')
    .map((trap) => `${trap.vendorName}: ${trap.signal}`)
    .slice(0, 3);

  const assumptions = [...ASSUMPTION_LOCKS];
  const recommendedBafoPriorities = getSourceBafoPriorities({
    eventId: input.event.id,
    eventName: input.event.name,
    stage: input.event.currentStageKey,
    generatedAt,
    overallNegotiationReadiness: readiness,
    vendorNegotiationPlans: vendorPlans,
    assumptionLockList: assumptions,
    excludedScopeList,
    commercialTrapSummary,
    recommendedBafoPriorities: [],
    executiveTradeoffSummary: '',
    nexusGuidance: '',
    sentinelEvidenceNotes,
    stewardGateNotes: [],
    atlasExecutiveImplication: '',
    blockers,
    nextAction: '',
  });

  const tradeoff = tradeoffSummary(vendorPlans, pricingSnapshots);
  const nextAction = readiness === 'ready'
    ? 'Proceed to execution planning if executive approvals are aligned.'
    : readiness === 'blocked'
      ? 'Resolve blocked responses and missing pricing/compliance artifacts before recommendation lock.'
      : 'Close conditional gaps, clarify assumptions, and refresh comparisons before BAFO.';
  const summaryNotes = [
    `Vendors ready: ${vendorPlans.filter((vendor) => vendor.readiness === 'ready').length}.`,
    `Vendors not ready: ${vendorPlans.filter((vendor) => vendor.readiness === 'not_comparable' || vendor.readiness === 'conditional' || vendor.readiness === 'blocked').length}.`,
  ];
  const stewardGateNotes = blockers.length > 0
    ? ['Do not proceed to BAFO close until critical blockers are resolved.']
    : ['Vendor set is sufficiently complete for controlled BAFO sequencing.'];

  return {
    eventId: input.event.id,
    eventName: input.event.name,
    stage: input.event.currentStageKey,
    generatedAt,
    overallNegotiationReadiness: readiness,
    vendorNegotiationPlans: vendorPlans,
    assumptionLockList: assumptions,
    excludedScopeList,
    commercialTrapSummary,
    recommendedBafoPriorities,
    executiveTradeoffSummary: tradeoff,
    nexusGuidance: `${summaryNotes.join(' ')}`,
    sentinelEvidenceNotes,
    stewardGateNotes,
    atlasExecutiveImplication: `Decision posture is ${readiness}; ${summaryNotes.join(' ')}`,
    blockers,
    nextAction,
  } as SourceBafoNegotiationPlan;
}

function tradeoffSummary(
  vendorPlans: SourceBafoVendorNegotiationPlan[],
  snapshots: SourcePricingVendorSnapshot[],
): string {
  if (vendorPlans.length === 0) {
    return 'No deterministic vendor set available for BAFO tradeoff.';
  }

  const ready = vendorPlans.filter((vendor) => vendor.readiness === 'ready').length;
  const blocked = vendorPlans.filter((vendor) => vendor.readiness === 'blocked').length;
  const compareRisk = snapshots.some((snapshot) => snapshot.commercialTraps.some((trap) => trap.severity === 'high'));
  const evidenceWeak = vendorPlans.some((vendor) => vendor.evidenceStatus === 'Low Confidence');

  if (blocked > 0) {
    return 'Blockers present. Cost, scope, and evidence must be stabilized before executive decision.';
  }
  if (ready === vendorPlans.length && !compareRisk && !evidenceWeak) {
    return 'Cost and evidence posture suggests a clean decision path with minimal contingencies.';
  }
  if (compareRisk) {
    return 'Commercial traps are present and drive a staged decision with explicit risk controls.';
  }
  return 'Decision depends on clarifying exclusions, pricing details, and evidence confidence.';
}
