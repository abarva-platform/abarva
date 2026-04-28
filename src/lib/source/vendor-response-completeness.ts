import { getSourceVendorResponseSeed } from './mock-seed';
import type {
  SourceVendorResponseCompleteness,
  SourceVendorResponseCompletenessInput,
  SourceVendorResponseCompletenessRecord,
  SourceVendorResponseSeed,
  SourceVendorResponseSeedInput,
  SourceVendorCompletenessStatus,
} from './vendor-response-types';

const DEFAULT_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const REQUIRED_RESPONSE_SECTIONS = [
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

const COMPARABILITY_CRITICAL_SECTIONS = [
  'Pricing template',
  'Scope confirmation',
  'Security and compliance response',
];

const WEAK_EVIDENCE_STATUSES = new Set([
  'Low Confidence',
  'Stale',
  'Access Restricted',
]);

function getSeededVendorResponses(eventId: string): SourceVendorResponseSeed['responses'] {
  const seed = getSourceVendorResponseSeed(eventId);
  return seed.responses;
}

function pickEventSeedResponses(event: SourceVendorResponseCompletenessInput['event']): SourceVendorResponseSeed['responses'] {
  if (event.vendorResponses && event.vendorResponses.length > 0) {
    return event.vendorResponses;
  }
  return getSeededVendorResponses(event.id);
}

function toSet(values: readonly string[]): Set<string> {
  return new Set(values.map((value) => value.trim().toLowerCase()));
}

function getMissingSections(required: readonly string[], submitted: readonly string[]): string[] {
  const submittedSet = toSet(submitted);
  return required.filter((section) => !submittedSet.has(section.trim().toLowerCase()));
}

function buildVendorBlockers(
  vendor: SourceVendorResponseSeedInput,
  missingSections: string[],
): string[] {
  const blockers: string[] = [];

  for (const section of missingSections) {
    if (COMPARABILITY_CRITICAL_SECTIONS.includes(section)) {
      blockers.push(`${vendor.vendorName}: critical section missing - ${section}.`);
    } else {
      blockers.push(`${vendor.vendorName}: section incomplete - ${section}.`);
    }
  }

  if (vendor.pricingTemplateStatus === 'missing' || vendor.pricingTemplateStatus === 'incomplete') {
    blockers.push(`${vendor.vendorName}: pricing template is not complete.`);
  }

  if (vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted') {
    blockers.push(
      `${vendor.vendorName}: vendor evidence is ${vendor.evidenceUsability === 'low_confidence' ? 'low confidence' : 'restricted'}.`,
    );
  }

  if (vendor.securityResponseStatus === 'missing' || vendor.securityResponseStatus === 'incomplete') {
    blockers.push(`${vendor.vendorName}: security and compliance response is incomplete.`);
  }

  if (vendor.transitionPlanStatus === 'missing' || vendor.transitionPlanStatus === 'incomplete') {
    blockers.push(`${vendor.vendorName}: transition plan status is incomplete.`);
  }

  if (vendor.responseStatus === 'blocked' || vendor.responseStatus === 'rejected') {
    blockers.push(`${vendor.vendorName}: response is not in an evaluable state.`);
  }

  return blockers;
}

function isWeakEvidence(
  status: SourceVendorResponseSeedInput['evidenceStatus'],
  usability: SourceVendorResponseSeedInput['evidenceUsability'],
): boolean {
  return WEAK_EVIDENCE_STATUSES.has(status) || ['low_confidence', 'restricted'].includes(usability);
}

function buildCompletenessRecord(vendor: SourceVendorResponseSeedInput): SourceVendorResponseCompletenessRecord {
  const requiredSections = REQUIRED_RESPONSE_SECTIONS.filter((section) => vendor.requiredSections.includes(section));
  const missingSections = getMissingSections(requiredSections, vendor.submittedSections);
  const blockers = buildVendorBlockers(vendor, missingSections);

  const hasCriticalMissing = COMPARABILITY_CRITICAL_SECTIONS.some((section) => missingSections.includes(section));
  const hasWeakEvidence = isWeakEvidence(vendor.evidenceStatus, vendor.evidenceUsability);

  let completenessStatus: SourceVendorCompletenessStatus = 'complete';
  let comparabilityStatus: SourceVendorResponseCompletenessRecord['comparabilityStatus'] = 'comparable';
  const rationale: string[] = [];

  if (vendor.responseStatus !== 'submitted' && vendor.responseStatus !== 'rejected') {
    if (vendor.responseStatus === 'not_started' || vendor.responseStatus === 'in_progress') {
      completenessStatus = missingSections.length > 0 ? 'incomplete' : 'partially_complete';
    } else if (vendor.responseStatus === 'blocked') {
      completenessStatus = 'blocked';
    }
  }

  if (vendor.responseStatus === 'rejected' || vendor.responseStatus === 'blocked') {
    completenessStatus = 'blocked';
    comparabilityStatus = 'blocked';
  } else if (hasCriticalMissing || vendor.pricingTemplateStatus === 'missing' || vendor.pricingTemplateStatus === 'incomplete') {
    completenessStatus = 'not_comparable';
    comparabilityStatus = 'not_comparable';
  } else if (hasWeakEvidence) {
    if (completenessStatus === 'complete') {
      completenessStatus = 'partially_complete';
    }
    comparabilityStatus = 'partially_comparable';
  } else if (missingSections.length > 0) {
    completenessStatus = 'partially_complete';
    comparabilityStatus = 'partially_comparable';
  }

  if (hasCriticalMissing) {
    rationale.push('Critical section gap prevents fair comparison.');
  }
  if (hasWeakEvidence) {
    rationale.push('Evidence quality is weak and should not be used for direct scoring.');
  }
  if (completenessStatus === 'blocked') {
    rationale.push('Response state blocks comparison until corrected.');
  }
  if (completenessStatus === 'complete') {
    rationale.push('Response is complete and has a comparable structure.');
  }
  if (completenessStatus === 'partially_complete') {
    rationale.push('Response is mostly complete but not yet at full comparability.');
  }
  if (completenessStatus === 'incomplete') {
    rationale.push('Required response sections are still missing.');
  }

  const nexusGuidance = completenessStatus === 'complete'
    ? `${vendor.vendorName}: compare with peers after confirming pricing unit consistency.`
    : `${vendor.vendorName}: complete required sections and close blockers before comparison.`;
  const recommendedNextAction = blockers.length > 0
    ? blockers[0]
    : `${vendor.vendorName}: keep a direct follow-up window open for final evidence and signatures.`;

  const sentinelEvidenceNotes = vendor.evidenceUsability === 'low_confidence' || vendor.evidenceUsability === 'restricted'
    ? [
        `${vendor.vendorName}: evidence usability is ${vendor.evidenceUsability.replace('_', ' ')} for commercial claims.`,
      ]
    : [];

  const stewardGateNotes = blockers.length > 0
    ? ['Do not move this vendor to evaluation until required sections are complete.']
    : ['Vendor is not blocked by steward gate at this time.'];

  const atlasExecutiveImplication = hasWeakEvidence || comparabilityStatus !== 'comparable'
    ? `${vendor.vendorName}: comparability confidence is reduced; procurement should treat the response as provisional.`
    : `${vendor.vendorName}: response quality is sufficient for proposal comparison; keep pricing assumptions logged.`;

  return {
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    responseStatus: vendor.responseStatus,
    receivedAt: vendor.receivedAt,
    requiredSections: requiredSections,
    submittedSections: vendor.submittedSections,
    missingSections,
    assumptions: vendor.assumptions,
    exclusions: vendor.exclusions,
    pricingTemplateStatus: vendor.pricingTemplateStatus,
    transitionPlanStatus: vendor.transitionPlanStatus,
    securityResponseStatus: vendor.securityResponseStatus,
    automationRoadmapStatus: vendor.automationRoadmapStatus,
    evidenceStatus: vendor.evidenceStatus,
    comparabilityStatus,
    blockers,
    completenessStatus,
    rationale,
    recommendedNextAction,
    nexusGuidance,
    sentinelEvidenceNotes,
    stewardGateNotes,
    atlasExecutiveImplication,
  };
}

function buildSummary(records: SourceVendorResponseCompletenessRecord[]): SourceVendorResponseCompleteness['summary'] {
  return {
    totalVendors: records.length,
    complete: records.filter((record) => record.completenessStatus === 'complete').length,
    partiallyComplete: records.filter((record) => record.completenessStatus === 'partially_complete').length,
    incomplete: records.filter((record) => record.completenessStatus === 'incomplete').length,
    notComparable: records.filter((record) => record.completenessStatus === 'not_comparable').length,
    blocked: records.filter((record) => record.completenessStatus === 'blocked').length,
  };
}

function resolveComparabilityReadiness(
  summary: SourceVendorResponseCompleteness['summary'],
): SourceVendorCompletenessStatus {
  if (summary.blocked > 0) {
    return 'blocked';
  }
  if (summary.notComparable > 0) {
    return 'not_comparable';
  }
  if (summary.incomplete > 0) {
    return 'incomplete';
  }
  if (summary.partiallyComplete > 0) {
    return 'partially_complete';
  }
  if (summary.complete > 0) {
    return 'complete';
  }
  return 'incomplete';
}

function uniqueBlockers(records: SourceVendorResponseCompletenessRecord[]): string[] {
  const list = records.flatMap((record) => record.blockers);
  return Array.from(new Set(list));
}

export function buildSourceVendorResponseCompleteness(
  input: SourceVendorResponseCompletenessInput,
): SourceVendorResponseCompleteness {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const eventName = input.event.name;
  const responses = pickEventSeedResponses(input.event);
  const records = responses.map(buildCompletenessRecord);
  const summary = buildSummary(records);
  const comparabilityReadiness = resolveComparabilityReadiness(summary);

  const blockers = uniqueBlockers(records);
  const recommendedNextAction = comparabilityReadiness !== 'complete'
    ? 'Collect missing sections, normalize pricing units, and resolve evidence quality before comparison.'
    : 'Proceed to selection planning, keeping an active assumptions log for pricing deltas.';

  return {
    eventId: input.event.id,
    eventName,
    generatedAt,
    stage: input.event.currentStageKey,
    records,
    summary,
    comparabilityReadiness,
    blockers,
    recommendedNextAction,
  };
}

export function buildSourceVendorCompletenessSummary(
  input: SourceVendorResponseCompleteness,
): SourceVendorResponseCompleteness['summary'] {
  return input.summary;
}

export function getSourceVendorResponseGaps(
  input: SourceVendorResponseCompleteness,
): string[] {
  return input.records.flatMap((record) => {
    const statusMissing = record.missingSections.length > 0 ? `Missing sections: ${record.missingSections.join(', ')}` : null;
    const actionGap = record.assumptions.length === 0 || record.exclusions.length === 0 ? 'assumption/exclusion coverage' : null;
    return [statusMissing, actionGap].filter((entry) => Boolean(entry)) as string[];
  });
}

export function getSourceVendorResponseBlockers(
  input: SourceVendorResponseCompleteness,
): string[] {
  return uniqueBlockers(input.records);
}

export function summarizeSourceVendorResponseCompleteness(input: SourceVendorResponseCompleteness): string {
  return `Vendor responses: ${input.summary.totalVendors} total, ${input.summary.complete} complete, ${input.summary.notComparable} not comparable, ${input.summary.blocked} blocked.`;
}

export function formatSourceVendorResponseCompletenessAsMarkdown(
  input: SourceVendorResponseCompleteness,
): string {
  const lines = [
    '# Source Vendor Response Completeness',
    '',
    `Event: ${input.eventName} (${input.eventId})`,
    `Stage: ${input.stage}`,
    `Readiness: ${input.comparabilityReadiness}`,
    `Updated: ${input.generatedAt}`,
    '',
    `Summary: ${summarizeSourceVendorResponseCompleteness(input)}`,
    '',
    '## Top Blockers',
    ...input.blockers.map((blocker) => `- ${blocker}`),
    '',
    '## Vendor Records',
  ];

  for (const record of input.records) {
    lines.push(
      `- ${record.vendorName}: ${record.completenessStatus} (${record.comparabilityStatus})`,
      `  - Missing sections: ${record.missingSections.length > 0 ? record.missingSections.join(', ') : 'None'}`,
      `  - Next action: ${record.recommendedNextAction}`,
      `  - Nexus: ${record.nexusGuidance}`,
    );
  }

  lines.push('', '## Next Actions', `- ${input.recommendedNextAction}`);
  return lines.join('\n');
}
