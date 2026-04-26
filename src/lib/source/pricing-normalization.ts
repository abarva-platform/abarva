import { getSourcePricingNormalizationSeed, getSourceVendorResponseSeed } from './mock-seed';
import type {
  SourceCommercialTrap,
  SourcePricingAssumptionBundle,
  SourcePricingComparisonRank,
  SourcePricingNormalization,
  SourcePricingNormalizationInput,
  SourcePricingNormalizationStatus,
  SourcePricingNormalizationSummary,
  SourcePricingSourceDataCost,
  SourcePricingVendorContext,
  SourcePricingVendorInput,
  SourcePricingVendorSnapshot,
} from './pricing-normalization-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';
const BASE_SEVERITY_MIX = {
  p1Critical: 12,
  p2High: 30,
  p3Medium: 40,
  p4Low: 18,
};
const REQUIRED_FOR_COMPARABLE = new Set([
  'pricing template',
  'scope confirmation',
  'security and compliance response',
  'transition plan',
]);

function clampMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Number((Math.round(value * 100) / 100).toFixed(2)));
}

function asPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function pickPricingInputs(input: SourcePricingNormalizationInput): SourcePricingVendorInput[] {
  if (input.event.pricingInputs && input.event.pricingInputs.length > 0) {
    return input.event.pricingInputs;
  }

  return getSourcePricingNormalizationSeed(input.event.id).vendors;
}

function toContext(
  input: SourcePricingNormalizationInput,
  vendor: SourcePricingVendorInput,
): SourcePricingVendorContext {
  const responseSeed = getSourceVendorResponseSeed(input.event.id).responses.find((response) => (
    response.vendorId === vendor.vendorId
  ));
  if (!responseSeed) {
    return {
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      evidenceUsability: vendor.evidenceUsability ?? 'not_available',
      evidenceStatus: vendor.evidenceStatus ?? 'Missing',
      pricingTemplateStatus: vendor.completenessStatus === 'complete' ? 'complete' : 'missing',
      transitionPlanStatus: vendor.responseStatus === 'not_started' ? 'missing' : 'incomplete',
      securityResponseStatus: 'missing',
      automationRoadmapStatus: vendor.responseStatus === 'submitted' ? 'complete' : 'missing',
      responseStatus: vendor.responseStatus ?? 'not_started',
      comparabilityStatus: vendor.completenessStatus === 'complete' ? 'comparable' : 'not_comparable',
    };
  }

  const requiredSections = responseSeed.requiredSections.map((section) => section.toLowerCase());
  const submittedSections = responseSeed.submittedSections.map((section) => section.toLowerCase());
  const missingRequired = requiredSections.filter((section) => !submittedSections.includes(section));
  const hasCriticalMissing = missingRequired.some((section) => REQUIRED_FOR_COMPARABLE.has(section));

  return {
    vendorId: responseSeed.vendorId,
    vendorName: responseSeed.vendorName,
    evidenceUsability: responseSeed.evidenceUsability,
    evidenceStatus: responseSeed.evidenceStatus,
    pricingTemplateStatus: responseSeed.pricingTemplateStatus,
    transitionPlanStatus: responseSeed.transitionPlanStatus,
    securityResponseStatus: responseSeed.securityResponseStatus,
    automationRoadmapStatus: responseSeed.automationRoadmapStatus,
    responseStatus: responseSeed.responseStatus,
    comparabilityStatus: hasCriticalMissing || responseSeed.pricingTemplateStatus === 'missing'
      ? 'not_comparable'
      : responseSeed.responseStatus === 'blocked' || responseSeed.responseStatus === 'rejected'
        ? 'blocked'
        : responseSeed.evidenceUsability === 'low_confidence' || responseSeed.evidenceUsability === 'restricted'
          ? 'partially_comparable'
          : 'comparable',
  };
}

function pickAssumptions(vendor: SourcePricingVendorInput): SourcePricingAssumptionBundle {
  return {
    applicationCount: clampMoney(vendor.applicationCount),
    ticketVolumePerMonth: clampMoney(vendor.ticketVolumePerMonth),
    supportHoursPerWeek: clampMoney(vendor.supportHoursPerWeek),
    severityMix: { ...BASE_SEVERITY_MIX },
  };
}

function pickCosts(vendor: SourcePricingVendorInput): SourcePricingSourceDataCost {
  const complianceHoldback = vendor.securityComplianceNotes.some((note) => (
    note.toLowerCase().includes('excluded')
    || note.toLowerCase().includes('unpriced')
    || note.toLowerCase().includes('conditional')
  ))
    ? 8
    : 0;

  return {
    annualRunCostUsd: clampMoney(vendor.annualRunCostUsd),
    transitionCostUsd: clampMoney(vendor.transitionCostUsd),
    oneTimeSetupCostUsd: clampMoney(vendor.oneTimeSetupCostUsd),
    optionalServicesUsd: clampMoney(vendor.optionalServicesUsd),
    excludedServicesUsd: clampMoney(vendor.excludedServicesUsd),
    changeOrderExposureUsd: clampMoney(vendor.changeOrderExposureUsd),
    rateEscalationPercent: asPercent(vendor.rateEscalationPercent),
    securityComplianceHoldbackPercent: complianceHoldback,
  };
}

function addTrap(
  traps: SourceCommercialTrap[],
  vendor: SourcePricingVendorInput,
  trap: Omit<SourceCommercialTrap, 'vendorId' | 'vendorName'>,
): void {
  traps.push({
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    ...trap,
  });
}

function buildCommercialTraps(
  vendor: SourcePricingVendorInput,
  context: SourcePricingVendorContext,
): SourceCommercialTrap[] {
  const traps: SourceCommercialTrap[] = [];
  const exclusions = vendor.exclusions.join(' ').toLowerCase();
  const optionals = vendor.optionals.join(' ').toLowerCase();

  if (context.pricingTemplateStatus === 'missing' || context.pricingTemplateStatus === 'incomplete') {
    addTrap(traps, vendor, {
      category: 'Pricing template',
      signal: 'Pricing template is missing or incomplete.',
      impact: 'Without comparable line items, deterministic normalization is blocked.',
      recommendation: 'Request complete pricing workbook before shortlist comparison.',
      severity: 'high',
    });
  }

  if (context.transitionPlanStatus === 'missing' || context.transitionPlanStatus === 'incomplete') {
    addTrap(traps, vendor, {
      category: 'Transition risk',
      signal: 'Transition plan is incomplete.',
      impact: 'Year-one cost can be materially understated.',
      recommendation: 'Request transition inclusions and runbook handoff commitments.',
      severity: 'high',
    });
  }

  if (context.securityResponseStatus === 'missing' || context.securityResponseStatus === 'incomplete') {
    addTrap(traps, vendor, {
      category: 'Security/compliance',
      signal: 'Security/compliance response is incomplete.',
      impact: 'Commercial comparability is reduced by incomplete risk coverage.',
      recommendation: 'Complete security response and map obligations to scope.',
      severity: 'medium',
    });
  }

  if (vendor.rateEscalationPercent >= 12) {
    addTrap(traps, vendor, {
      category: 'Rate escalation',
      signal: `Rate escalation is ${asPercent(vendor.rateEscalationPercent)}%.`,
      impact: 'Year-2/3 totals may drift upward without a cap.',
      recommendation: 'Request a capped escalation and a reopener policy.',
      severity: 'medium',
    });
  }

  if (vendor.automationProductivityAssumptionPercent > 0) {
    if (!optionals.includes('automation')) {
      addTrap(traps, vendor, {
        category: 'Automation trap',
        signal: 'Automation assumption is not mapped to explicit commercial scope.',
        impact: 'Savings claims may not be enforceable.',
        recommendation: 'Attach explicit automation milestones and commitments.',
        severity: 'low',
      });
    } else if (vendor.automationProductivityAssumptionPercent >= 20 && context.automationRoadmapStatus !== 'complete') {
      addTrap(traps, vendor, {
        category: 'Automation trap',
        signal: 'Strong automation claim with incomplete roadmap.',
        impact: 'Value upside may be promotional.',
        recommendation: 'Request measurable automation commitments before final score.',
        severity: 'medium',
      });
    }
  }

  if (vendor.ticketVolumePerMonth < 250) {
    addTrap(traps, vendor, {
      category: 'Volume trap',
      signal: 'Ticket volume assumption is materially low.',
      impact: 'Normalized unit-costs may not cover baseline demand.',
      recommendation: 'Confirm vendor assumptions against baseline demand.',
      severity: 'medium',
    });
  }

  if (
    vendor.onshorePercent !== undefined
    && vendor.offshorePercent !== undefined
    && (vendor.offshorePercent > 60)
    && !optionals.includes('retained team')
  ) {
    addTrap(traps, vendor, {
      category: 'Delivery mix',
      signal: 'Delivery mix is heavily offshore.',
      impact: 'Transition and support risk should be validated for critical services.',
      recommendation: 'Request staged transition and retained knowledge transfer details.',
      severity: 'low',
    });
  }

  if (vendor.excludedServicesUsd > vendor.annualRunCostUsd * 0.2) {
    addTrap(traps, vendor, {
      category: 'Exclusions',
      signal: 'Excluded services value is significant.',
      impact: 'Real cost of ownership is higher than baseline run price.',
      recommendation: 'Include retained scope and explicit adders before BAFO.',
      severity: 'high',
    });
  }

  if (exclusions.includes('release') || exclusions.includes('minor enhancement') || exclusions.includes('tooling')) {
    addTrap(traps, vendor, {
      category: 'Exclusions',
      signal: exclusions.includes('release')
        ? 'Release support is excluded.'
        : exclusions.includes('minor enhancement')
          ? 'Minor enhancements are excluded.'
          : 'Tooling is excluded.',
      impact: 'Hidden follow-on commercial leakage risk.',
      recommendation: 'Require explicit inclusion or priced exclusion list in evaluation package.',
      severity: 'medium',
    });
  }

  if (context.evidenceUsability === 'low_confidence' || context.evidenceUsability === 'restricted') {
    addTrap(traps, vendor, {
      category: 'Evidence',
      signal: `Evidence usability is ${context.evidenceUsability.replace('_', ' ')}.`,
      impact: 'Commercial claims are provisional until stronger evidence is available.',
      recommendation: 'Request corroborating references and usage evidence before award.',
      severity: 'medium',
    });
  }

  if (context.responseStatus === 'blocked' || context.responseStatus === 'rejected') {
    addTrap(traps, vendor, {
      category: 'Response state',
      signal: 'Vendor response is blocked.',
      impact: 'Vendor should be deferred from shortlisted comparison.',
      recommendation: 'Resolve response blockers in compliance with response SLA.',
      severity: 'high',
    });
  }

  return traps;
}

function buildRatios(costs: SourcePricingSourceDataCost, assumptions: SourcePricingAssumptionBundle): {
  transitionInclusiveYearOneUsd: number;
  costPerApplicationUsd: number;
  costPerTicketUsd: number;
  costPerTicketSavingsAtRiskUsd: number;
} {
  const transitionInclusiveYearOneUsd = clampMoney(
    costs.annualRunCostUsd
      + costs.transitionCostUsd
      + costs.oneTimeSetupCostUsd
      + costs.changeOrderExposureUsd,
  );
  const annualTickets = assumptions.ticketVolumePerMonth * 12;
  const costPerTicket = annualTickets > 0 ? transitionInclusiveYearOneUsd / annualTickets : 0;

  return {
    transitionInclusiveYearOneUsd,
    costPerApplicationUsd: assumptions.applicationCount > 0
      ? transitionInclusiveYearOneUsd / assumptions.applicationCount
      : 0,
    costPerTicketUsd: costPerTicket,
    costPerTicketSavingsAtRiskUsd: costPerTicket * (assumptions.supportHoursPerWeek / 100),
  };
}

function buildYearlyCosts(costs: SourcePricingSourceDataCost): {
  year1: number;
  year2: number;
  year3: number;
} {
  const year1 = costs.annualRunCostUsd + costs.transitionCostUsd + costs.oneTimeSetupCostUsd + costs.optionalServicesUsd;
  const rateMultiplier = 1 + costs.rateEscalationPercent / 100;

  return {
    year1: clampMoney(year1),
    year2: clampMoney(year1 * rateMultiplier + costs.changeOrderExposureUsd),
    year3: clampMoney(year1 * rateMultiplier * rateMultiplier + costs.changeOrderExposureUsd * 2),
  };
}

function resolveRowReadiness(context: SourcePricingVendorContext, traps: SourceCommercialTrap[]): {
  readinessStatus: SourcePricingVendorSnapshot['readinessStatus'];
  comparabilityStatus: SourcePricingVendorSnapshot['comparabilityStatus'];
} {
  if (context.responseStatus === 'blocked' || context.responseStatus === 'rejected') {
    return {
      readinessStatus: 'blocked',
      comparabilityStatus: 'blocked',
    };
  }

  if (context.comparabilityStatus === 'not_comparable') {
    return {
      readinessStatus: 'not_comparable',
      comparabilityStatus: 'not_comparable',
    };
  }

  if (context.comparabilityStatus === 'partially_comparable' || traps.some((trap) => trap.severity === 'high')) {
    return {
      readinessStatus: 'risk_adjusted',
      comparabilityStatus: traps.some((trap) => trap.severity === 'high') ? 'partially_comparable' : 'partially_comparable',
    };
  }

  if (traps.length > 2 || traps.some((trap) => trap.severity === 'medium')) {
    return {
      readinessStatus: 'risk_adjusted',
      comparabilityStatus: 'partially_comparable',
    };
  }

  return {
    readinessStatus: 'strong',
    comparabilityStatus: 'comparable',
  };
}

function buildSnapshot(vendor: SourcePricingVendorInput, context: SourcePricingVendorContext): SourcePricingVendorSnapshot {
  const assumptions = pickAssumptions(vendor);
  const costs = pickCosts(vendor);
  const traps = buildCommercialTraps(vendor, context);
  const { readinessStatus, comparabilityStatus } = resolveRowReadiness(context, traps);
  const costByYear = buildYearlyCosts(costs);
  const ratios = buildRatios(costs, assumptions);
  const sentinelEvidenceNotes = traps
    .filter((trap) => trap.category === 'Evidence')
    .map((trap) => `${vendor.vendorName}: ${trap.signal}`);
  const stewardGateNotes = traps.some((trap) => trap.category === 'Response state' || trap.severity === 'high')
    ? ['Do not shortlist until response blockers and high-severity traps are resolved.']
    : ['No blocker from deterministic pricing row readiness.'];
  const atlasExecutiveImplication = `Readiness ${readinessStatus} with ${traps.length} trap(s).`;
  const notes = [
    `Automation productivity assumption: ${vendor.automationProductivityAssumptionPercent}%`,
    `Onshore/offshore split: ${vendor.onshorePercent ?? 100}/${vendor.offshorePercent ?? 0}`,
    `Assumptions/exclusions count: ${vendor.assumptions.length}/${vendor.exclusions.length}`,
  ];
  const rationale = [
    traps.length === 0
      ? 'No high-risk commercial traps surfaced.'
      : `Commercial traps surfaced: ${traps.map((trap) => trap.category).join(', ')}`,
    `Security/compliance holdback set to ${costs.securityComplianceHoldbackPercent}%.`,
  ];

  return {
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    readinessStatus,
    comparabilityStatus,
    costInputs: costs,
    assumptions,
    costByYear,
    transitionInclusiveYearOneUsd: ratios.transitionInclusiveYearOneUsd,
    costPerApplicationUsd: ratios.costPerApplicationUsd,
    costPerTicketUsd: ratios.costPerTicketUsd,
    costPerTicketSavingsAtRiskUsd: ratios.costPerTicketSavingsAtRiskUsd,
    commercialTraps: traps,
    exclusions: vendor.exclusions,
    optionals: vendor.optionals,
    notes,
    rationale,
    nextAction: traps.length > 0
      ? `${vendor.vendorName}: close high-priority traps before shortlist lock.`
      : `${vendor.vendorName}: deterministic row is ready for comparative review.`,
    atlasExecutiveImplication,
    sentinelEvidenceNotes,
    stewardGateNotes,
  };
}

function scoreSnapshot(snapshot: SourcePricingVendorSnapshot): number {
  const trapPenalty = snapshot.commercialTraps.reduce((total, trap) => {
    if (trap.severity === 'high') return total + 300;
    if (trap.severity === 'medium') return total + 140;
    return total + 40;
  }, 0);
  const comparabilityPenalty = snapshot.readinessStatus === 'strong' ? 0 : 260;
  return clampMoney(snapshot.costByYear.year1 + comparabilityPenalty + trapPenalty);
}

function rankSnapshots(snapshots: SourcePricingVendorSnapshot[]): SourcePricingComparisonRank[] {
  const baseRanks = snapshots.map((snapshot) => ({
    vendorId: snapshot.vendorId,
    vendorName: snapshot.vendorName,
    comparable: snapshot.comparabilityStatus === 'comparable',
    score: scoreSnapshot(snapshot),
    reason: '',
    rank: 0,
  }));

  return baseRanks
    .map((row) => ({
      ...row,
      reason: row.comparable
        ? 'Comparable with deterministic normalization assumptions.'
        : 'Hold as risk-adjusted candidate until blockers are closed.',
    }))
    .sort((a, b) => {
      if (a.comparable !== b.comparable) return a.comparable ? -1 : 1;
      if (a.score !== b.score) return a.score - b.score;
      return a.vendorName.localeCompare(b.vendorName);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

function buildSummary(snapshots: SourcePricingVendorSnapshot[]): SourcePricingNormalizationSummary {
  const totalVendors = snapshots.length;
  const comparable = snapshots.filter((snapshot) => snapshot.comparabilityStatus === 'comparable').length;
  const partiallyComparable = snapshots.filter((snapshot) => snapshot.comparabilityStatus === 'partially_comparable').length;
  const notComparable = snapshots.filter((snapshot) => snapshot.comparabilityStatus === 'not_comparable').length;
  const blocked = snapshots.filter((snapshot) => snapshot.comparabilityStatus === 'blocked').length;
  const comparableWithoutExclusions = snapshots.filter((snapshot) => (
    snapshot.comparabilityStatus === 'comparable' && snapshot.exclusions.length === 0
  )).length;

  return {
    totalVendors,
    comparable,
    partiallyComparable,
    notComparable,
    blocked,
    comparableWithoutExclusions,
  };
}

function deriveReadinessStatus(summary: SourcePricingNormalizationSummary): SourcePricingNormalizationStatus {
  if (summary.blocked > 0) return 'blocked';
  if (summary.notComparable > 0) return 'not_comparable';
  if (summary.partiallyComparable > 0) return 'partially_comparable';
  if (summary.comparable > 0) return 'comparable';
  return 'not_comparable';
}

function computeReadinessScore(status: SourcePricingNormalizationStatus, summary: SourcePricingNormalizationSummary): number {
  const denominator = Math.max(1, summary.totalVendors);
  if (status === 'blocked') return 20;
  if (status === 'not_comparable') return 38;
  if (status === 'partially_comparable') return 68;
  if (status === 'comparable') {
    const partialPenalty = summary.partiallyComparable * 10;
    return Math.max(80, Math.min(100, 100 - partialPenalty));
  }
  return Math.round(
    ((summary.comparable + summary.partiallyComparable * 0.5 + summary.comparableWithoutExclusions * 0.25) / denominator) * 100,
  );
}

function summarizeMissingInputs(input: SourcePricingNormalizationInput): string[] {
  if (!input.event.dataReadiness) return [];
  return input.event.dataReadiness
    .filter((row) => row.readinessState === 'Missing' || row.evidenceUsability === 'not_available')
    .map((row) => `${row.category}: ${row.evidenceUsability}`);
}

function buildNarrative(status: SourcePricingNormalizationStatus, summary: SourcePricingNormalizationSummary): string {
  if (status === 'blocked') {
    return 'Pricing comparison is blocked by at least one vendor response state or high-severity trap.';
  }
  if (status === 'not_comparable') {
    return `${summary.notComparable} vendor row(s) are not comparable.`
      + ' Complete pricing templates and mandatory scope inputs first.';
  }
  if (status === 'partially_comparable') {
    return `${summary.partiallyComparable} vendor row(s) are risk-adjusted and should be treated as conditional for shortlist decisions.`;
  }
  return 'Normalization is mostly comparable with explicit assumptions and risk notes.';
}

function buildRecommendedAction(status: SourcePricingNormalizationStatus): string {
  if (status === 'blocked') {
    return 'Resolve blocked responses and critical response-state traps before comparison.';
  }
  if (status === 'not_comparable') {
    return 'Request missing pricing templates and missing transition detail, then rerun normalization.';
  }
  if (status === 'partially_comparable') {
    return 'Run risk-adjusted shortlist and request weak-evidence/assumption confirmations.';
  }
  return 'Proceed to BAFO preparation with a defensible assumption lock.';
}

function pickRequiredArtifacts(): string[] {
  return [
    'Pricing template',
    'Scope confirmation',
    'Transition plan',
    'Assumptions and exclusions register',
  ];
}

function pickRequiredInputs(input: SourcePricingNormalizationInput): string[] {
  const required = ['Application Portfolio', 'Workload Baseline', 'Vendor Spend'];
  const missing = summarizeMissingInputs(input);
  return required.filter((item) => !missing.some((entry) => entry.startsWith(item)));
}

export function getSourcePricingComparison(
  input: SourcePricingNormalization,
): SourcePricingComparisonRank[] {
  return rankSnapshots(input.snapshots);
}

export function getSourceCommercialTraps(
  input: SourcePricingNormalization,
): SourceCommercialTrap[] {
  return input.traps;
}

export function getSourcePricingNormalizationBlockers(
  input: SourcePricingNormalization,
): string[] {
  return input.blockers;
}

export function getSourcePricingNormalizationNextActions(
  input: SourcePricingNormalization,
): string[] {
  return [
    input.recommendedNextAction,
    ...input.blockers,
  ].filter(Boolean);
}

export function getSourcePricingNormalizationSummary(
  input: SourcePricingNormalization,
): SourcePricingNormalizationSummary {
  return input.summary;
}

export function summarizeSourcePricingNormalization(input: SourcePricingNormalization): string {
  return `Pricing normalization: ${input.summary.totalVendors} vendors, ${input.summary.comparable} comparable,`
    + ` ${input.summary.partiallyComparable} risk-adjusted, ${input.summary.notComparable} not comparable.`;
}

export function normalizeVendorPricing(vendor: SourcePricingVendorInput): SourcePricingVendorSnapshot {
  const context = toContext({
    event: {
      id: 'evt-source-digital-app-build-partner-selection',
      name: 'Digital App Build Partner Selection',
      currentStageKey: 'pricing',
      pricingInputs: [vendor],
    },
  }, vendor);
  const snapshot = buildSnapshot(vendor, context);
  return snapshot;
}

export function buildSourcePricingNormalization(
  input: SourcePricingNormalizationInput,
): SourcePricingNormalization {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const pricingInputs = pickPricingInputs(input);

  const snapshots = pricingInputs.map((vendor) => buildSnapshot(vendor, toContext(input, vendor)));
  const summary = buildSummary(snapshots);
  const status = deriveReadinessStatus(summary);
  const comparison = rankSnapshots(snapshots);
  const allTraps = snapshots.flatMap((snapshot) => snapshot.commercialTraps);
  const uniqueTraps = new Map(
    allTraps.map((trap) => [`${trap.vendorId}:${trap.category}:${trap.signal}`, trap]),
  );
  const blockers = input.event.dataReadiness
    ? input.event.dataReadiness
      .filter((row) => row.readinessState === 'Missing')
      .map((row) => `Missing baseline data: ${row.category}`)
    : [];
  const contextBlockers = Array.from(uniqueTraps.values())
    .filter((trap) => trap.severity === 'high' || trap.severity === 'medium')
    .map((trap) => `${trap.vendorName}: ${trap.signal}`);
  const requiredInputs = pickRequiredInputs(input);

  const output: SourcePricingNormalization = {
    eventId: input.event.id,
    eventName: input.event.name,
    stage: input.event.currentStageKey,
    generatedAt,
    generatedAtSource: 'seeded',
    status,
    readinessStatus: status,
    readinessScore: computeReadinessScore(status, summary),
    requiredInputsComplete: requiredInputs.length === 0,
    missingInputs: requiredInputs,
    requiredArtifacts: pickRequiredArtifacts(),
    snapshots,
    comparisonReadiness: status,
    comparison,
    summary,
    comparableVendors: summary.comparable,
    notComparableVendors: summary.notComparable,
    traps: Array.from(uniqueTraps.values()),
    topCommercialTraps: Array.from(uniqueTraps.values())
      .sort((a, b) => a.severity.localeCompare(b.severity))
      .slice(0, 6),
    blockers: Array.from(new Set([...blockers, ...contextBlockers])),
    recommendedNextAction: '',
    summaryNarrative: '',
    summaryBlockers: [],
    rfpSections: [
      'Scope baseline consistency',
      'Pricing completeness',
      'Commercial assumption quality',
      'Transition readiness',
      'Evidence confidence',
    ],
    nexusGuidance: '',
    sentinelEvidenceNotes: [],
    stewardGateNotes: [],
    atlasExecutiveImplication: '',
  };

  output.summaryNarrative = buildNarrative(output.status, output.summary);
  output.summaryBlockers = [
    ...new Set(output.blockers.filter((value) => value.length > 0)),
  ];
  output.recommendedNextAction = buildRecommendedAction(output.status);
  output.nexusGuidance = output.summary.comparable === 0
    ? 'Do not shortlist yet. Close high severity traps and missing comparability requirements first.'
    : 'Run BAFO prep only after risk-adjusted traps are either closed or explicitly accepted by Steward.';
  output.sentinelEvidenceNotes = output.traps
    .filter((trap) => trap.category === 'Evidence')
    .map((trap) => `${trap.vendorName}: ${trap.signal}`);
  output.stewardGateNotes = output.summary.notComparable > 0 || output.summary.blocked > 0
    ? ['Do not authorize final decision lock until comparability blockers are resolved.']
    : ['Proceed with conditional shortlist if governance accepts residual assumptions.'];
  output.atlasExecutiveImplication = `${output.summary.comparable} comparable row(s),`
    + ` ${output.summary.notComparable} not-comparable row(s), ${output.summary.blocked} blocked.`;
  return output;
}

export function formatSourcePricingNormalizationAsMarkdown(
  input: SourcePricingNormalization,
): string {
  const lines = [
    '# Source Pricing Normalization',
    '',
    `Event: ${input.eventName} (${input.eventId})`,
    `Stage: ${input.stage}`,
    `Status: ${input.status}`,
    `Readiness score: ${input.readinessScore}`,
    `Generated: ${input.generatedAt}`,
    '',
    `Summary: ${summarizeSourcePricingNormalization(input)}`,
    `Narrative: ${input.summaryNarrative}`,
    `Recommended next action: ${input.recommendedNextAction}`,
    '',
    `Required artifacts: ${input.requiredArtifacts.join(', ')}`,
    '',
    '## Comparison',
  ];

  for (const row of input.comparison) {
    const snapshot = input.snapshots.find((entry) => entry.vendorId === row.vendorId);
    if (!snapshot) continue;

    lines.push(
      `- ${row.rank}. ${snapshot.vendorName}`,
      `  - Comparable: ${row.comparable}`,
      `  - Score: ${row.score}`,
      `  - Year 1: ${snapshot.costByYear.year1}`,
      `  - Year 2: ${snapshot.costByYear.year2}`,
      `  - Year 3: ${snapshot.costByYear.year3}`,
      `  - Readiness: ${snapshot.readinessStatus}`,
    );
  }

  lines.push('', '## Top traps');
  for (const trap of input.topCommercialTraps) {
    lines.push(`- ${trap.vendorName}: ${trap.category} - ${trap.signal}`);
  }
  lines.push('', '## Guardrails', `- ${input.nexusGuidance}`);
  return lines.join('\n');
}
