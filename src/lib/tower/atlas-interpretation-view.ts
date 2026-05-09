import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import type { AtlasObservationAction, AtlasObservationsView } from '@/lib/tower/atlas-observations-view';
import type { TowerBandMetricsView, TowerLens } from '@/lib/tower/band-metrics-view';
import type { TowerPressuresView, PressureCardView } from '@/lib/tower/pressure-cards-view';
import type { StrategicAlignment2x2View } from '@/lib/tower/strategic-alignment-2x2-view';
import { type DeferredMetric, listDeferredMetrics } from '@/lib/tower/deferred-metrics';
import {
  type AtlasPatternId,
  selectAtlasPatterns,
} from '@/lib/tower/atlas-pattern-selectors';
import {
  type AtlasCitation,
  validateAtlasCitations,
} from '@/lib/tower/atlas-citation-validator';

export type AtlasInterpretationConfidence = 'high' | 'med' | 'low';

export interface AtlasInterpretiveObservation {
  number: number;
  topic: string;
  body: string;
  rootCause?: string;
  actions: ReadonlyArray<AtlasObservationAction>;
  confidenceFloor: 'HIGH' | 'MED' | 'LOW';
  citations: ReadonlyArray<AtlasCitation>;
}

export interface AtlasInterpretation extends AtlasObservationsView {
  observations: ReadonlyArray<AtlasInterpretiveObservation>;
  interpretationConfidence: AtlasInterpretationConfidence;
  citations: ReadonlyArray<AtlasCitation>;
  patternsFired: ReadonlyArray<AtlasPatternId>;
  citationErrors: ReadonlyArray<string>;
}

export interface AtlasReasoningInput {
  tenant: { name: string; clientId: string | null };
  todayIso: string;
  lens: TowerLens;
  bandMetrics: TowerBandMetricsView;
  pressuresView: TowerPressuresView;
  alignment2x2View: StrategicAlignment2x2View;
  deferredMetrics?: ReadonlyArray<DeferredMetric>;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
}

function formatUsdCompact(usd: number | null): string {
  if (usd === null || usd === undefined) return 'unknown value';
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function daysUntil(targetIso: string, todayIso: string): number {
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return Number.POSITIVE_INFINITY;
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function initiativeCitations(initiative: AIInitiative): AtlasCitation[] {
  const summaryNumbers = initiative.statusSummary.match(/\d+(?:\.\d+)?/g) ?? [];
  return [
    { initiativeId: initiative.initiativeId, field: 'ai_initiatives.display_id', value: initiative.displayId },
    { initiativeId: initiative.initiativeId, field: 'ai_initiatives.name', value: initiative.name },
    { initiativeId: initiative.initiativeId, field: 'ai_initiatives.status_flag', value: initiative.statusFlag },
    { initiativeId: initiative.initiativeId, field: 'ai_initiatives.confidence_level', value: initiative.confidenceLevel },
    ...summaryNumbers.map((value) => ({
      initiativeId: initiative.initiativeId,
      field: 'ai_initiatives.status_summary',
      value,
    })),
  ];
}

function byDisplayId(initiatives: ReadonlyArray<AIInitiative>): Map<string, AIInitiative> {
  return new Map(initiatives.map((initiative) => [initiative.displayId, initiative]));
}

function weakestConfidence(initiatives: ReadonlyArray<AIInitiative>): 'HIGH' | 'MED' | 'LOW' {
  if (initiatives.some((initiative) => initiative.confidenceLevel === 'LOW')) return 'LOW';
  if (initiatives.some((initiative) => initiative.confidenceLevel === 'MED')) return 'MED';
  return 'HIGH';
}

function topPressure(input: AtlasReasoningInput): PressureCardView | null {
  return input.pressuresView.cards[0] ?? null;
}

function composeVendorClock(input: AtlasReasoningInput, number: number): AtlasInterpretiveObservation | null {
  const pressure = topPressure(input);
  if (!pressure || pressure.type !== 'vend' || !pressure.displayId) return null;
  const initiative = byDisplayId(input.initiatives).get(pressure.displayId);
  const vendor = input.vendors
    .filter((candidate) => candidate.initiativeDisplayId === pressure.displayId && candidate.renewalDate)
    .sort((a, b) => daysUntil(a.renewalDate ?? '', input.todayIso) - daysUntil(b.renewalDate ?? '', input.todayIso))[0];
  if (!initiative || !vendor || !vendor.renewalDate) return null;
  const days = daysUntil(vendor.renewalDate, input.todayIso);
  const value = formatUsdCompact(vendor.contractValueUsd);
  return {
    number,
    topic: 'Vendor clock',
    body: `${vendor.vendorName} renewal is ${days} days out on ${initiative.displayId} ${initiative.name}; contract value is ${value}. The calendar is the forcing function: settle the ${initiative.statusFlag} posture before Source negotiates terms.`,
    actions: [
      { label: 'Open the renewal brief in Source', href: '/source', pending: true },
    ],
    confidenceFloor: initiative.confidenceLevel,
    citations: [
      ...initiativeCitations(initiative),
      { vendorId: vendor.vendorId, initiativeId: vendor.initiativeId, field: 'ai_initiative_vendors.vendor_name', value: vendor.vendorName },
      { vendorId: vendor.vendorId, initiativeId: vendor.initiativeId, field: 'ai_initiative_vendors.renewal_date', value: vendor.renewalDate },
      { vendorId: vendor.vendorId, initiativeId: vendor.initiativeId, field: 'ai_initiative_vendors.contract_value_usd', value: vendor.contractValueUsd ?? 0 },
      { field: 'tower_view.days_until_renewal', value: days },
    ],
  };
}

function composeTopPressure(input: AtlasReasoningInput, number: number): AtlasInterpretiveObservation | null {
  const pressure = topPressure(input);
  if (!pressure || !pressure.displayId) return null;
  const initiative = byDisplayId(input.initiatives).get(pressure.displayId);
  if (!initiative) return null;
  const committed = formatUsdCompact(initiative.committedAnnualUsd);
  const measured = formatUsdCompact(initiative.measuredValueUsd);
  const thinEvidence = initiative.confidenceLevel === 'LOW'
    ? ' Evidence is thin; treat the next action as a gate, not a conclusion.'
    : '';
  return {
    number,
    topic: pressure.type === 'dupl' ? 'Capability duplication' : pressure.type === 'adopt' ? 'Adoption gap' : pressure.type === 'cost' ? 'Cost overrun' : 'Value lag',
    body: `${initiative.displayId} ${initiative.name} is ${initiative.statusFlag}: ${initiative.statusSummary}. Committed annual value is ${committed}; measured value is ${measured}.${thinEvidence} ${pressure.nextAction}`,
    actions: pressure.type === 'dupl'
      ? [{ label: 'Run attribution study', href: '/programs/new?move=attribution-study', pending: true }]
      : pressure.type === 'adopt'
        ? [{ label: 'Connect identity sources', href: '/admin/connectors', timeHint: '5 min' }]
        : [{ label: 'Open re-baseline review', href: `/admin/ai-initiatives/${encodeURIComponent(initiative.displayId)}` }],
    confidenceFloor: initiative.confidenceLevel,
    citations: [
      ...initiativeCitations(initiative),
      { initiativeId: initiative.initiativeId, field: 'ai_initiatives.status_summary', value: initiative.statusSummary },
      { initiativeId: initiative.initiativeId, field: 'ai_initiatives.committed_annual_usd', value: initiative.committedAnnualUsd ?? 0 },
      { initiativeId: initiative.initiativeId, field: 'ai_initiatives.measured_value_usd', value: initiative.measuredValueUsd ?? 0 },
      ...(pressure.type === 'dupl'
        ? [{ field: 'tower_view.attribution_study_weeks', value: 6 } satisfies AtlasCitation]
        : []),
    ],
  };
}

function composeSharedRoot(input: AtlasReasoningInput, number: number): AtlasInterpretiveObservation | null {
  const selection = selectAtlasPatterns(input);
  if (!selection.sharedRoot) return null;
  const initiatives = input.initiatives.filter((initiative) =>
    selection.sharedRoot?.initiativeIds.includes(initiative.initiativeId),
  );
  if (initiatives.length < 2) return null;
  const ids = initiatives.map((initiative) => initiative.displayId).join(', ');
  const body = `${ids} share ${selection.sharedRoot.label}. Treat them as one portfolio posture before treating them as separate fixes; otherwise Tower will re-baseline symptoms while the shared root stays unresolved.`;
  return {
    number,
    topic: 'Portfolio pattern',
    body,
    rootCause: selection.sharedRoot.label,
    actions: [{ label: 'See programs lagging on value', href: '/programs?lens=value' }],
    confidenceFloor: weakestConfidence(initiatives),
    citations: initiatives.flatMap(initiativeCitations),
  };
}

function composeDefend(input: AtlasReasoningInput, number: number): AtlasInterpretiveObservation | null {
  const aligned = input.initiatives.filter(
    (initiative) =>
      initiative.alignedCallout &&
      initiative.statusFlag !== 'cost_overrun' &&
      initiative.statusFlag !== 'duplication_risk' &&
      (initiative.measuredValueUsd ?? 0) > 0,
  );
  if (aligned.length === 0) return null;
  const head = aligned.slice(0, 2);
  const names = head.map((initiative) => `${initiative.displayId} ${initiative.name}`).join(' and ');
  const measured = head.map((initiative) => formatUsdCompact(initiative.measuredValueUsd)).join(' / ');
  return {
    number,
    topic: 'Defend while resolving',
    body: `${names} carry the aligned-value callout with measured value of ${measured}. Do not let the pressure queue hide what is working; defend these while the weaker programs clear their evidence gates.`,
    actions: [{ label: 'Open Executive brief', href: '/tower?tab=executive_brief' }],
    confidenceFloor: weakestConfidence(head),
    citations: head.flatMap((initiative) => [
      ...initiativeCitations(initiative),
      { initiativeId: initiative.initiativeId, field: 'ai_initiatives.aligned_callout', value: String(initiative.alignedCallout) },
      { initiativeId: initiative.initiativeId, field: 'ai_initiatives.measured_value_usd', value: initiative.measuredValueUsd ?? 0 },
    ]),
  };
}

function composeLookAhead(input: AtlasReasoningInput, number: number): AtlasInterpretiveObservation | null {
  const bet = input.alignment2x2View.strategicBets[0];
  if (bet) {
    const initiative = input.initiatives.find((candidate) => candidate.displayId === bet.displayId);
    if (!initiative) return null;
    return {
      number,
      topic: 'Look-ahead',
      body: `${initiative.displayId} ${initiative.name} is the look-ahead: ${initiative.stageDetail ?? 'multi-year strategic bet'}, ${formatUsdCompact(initiative.committedTotalUsd ?? initiative.committedAnnualUsd)} committed, and no measured value yet by design. Watch milestone cadence before making it a value-lag story.`,
      actions: [{ label: 'Open foundation plan', href: `/admin/ai-initiatives/${encodeURIComponent(initiative.displayId)}` }],
      confidenceFloor: initiative.confidenceLevel,
      citations: [
        ...initiativeCitations(initiative),
        { initiativeId: initiative.initiativeId, field: 'ai_initiatives.stage', value: initiative.stage },
        { initiativeId: initiative.initiativeId, field: 'ai_initiatives.stage_detail', value: initiative.stageDetail ?? 'multi-year strategic bet' },
        { initiativeId: initiative.initiativeId, field: 'ai_initiatives.committed_total_usd', value: initiative.committedTotalUsd ?? initiative.committedAnnualUsd ?? 0 },
      ],
    };
  }

  const vendor = input.vendors.find((candidate) => {
    if (!candidate.renewalDate) return false;
    const days = daysUntil(candidate.renewalDate, input.todayIso);
    return days > 90 && days <= 365;
  });
  if (!vendor || !vendor.renewalDate) return null;
  const days = daysUntil(vendor.renewalDate, input.todayIso);
  return {
    number,
    topic: 'Look-ahead',
    body: `${vendor.vendorName} is not today's pressure, but it is ${days} days out. Keep it in the look-ahead lane until it enters the 90-day Source window.`,
    actions: [{ label: 'Review renewal calendar', href: '/source', pending: true }],
    confidenceFloor: 'MED',
    citations: [
      { vendorId: vendor.vendorId, initiativeId: vendor.initiativeId, field: 'ai_initiative_vendors.vendor_name', value: vendor.vendorName },
      { vendorId: vendor.vendorId, initiativeId: vendor.initiativeId, field: 'ai_initiative_vendors.renewal_date', value: vendor.renewalDate },
      { field: 'tower_view.days_until_renewal', value: days },
      { field: 'tower_view.renewal_window_days', value: 90 },
    ],
  };
}

function composeHealthy(input: AtlasReasoningInput, number: number): AtlasInterpretiveObservation {
  const scaled = input.initiatives.filter((initiative) => initiative.stage === 'scaled');
  const aligned = input.initiatives.filter((initiative) => initiative.alignedCallout).slice(0, 2);
  const names = aligned.map((initiative) => `${initiative.displayId} ${initiative.name}`).join(' and ');
  return {
    number,
    topic: 'Healthy posture',
    body: `Portfolio is quiet: ${scaled.length} initiatives are in scaled stage and no active CFO-decision pressures are firing. ${names ? `${names} carry the aligned-value callout; use the quiet window to review the next foundation bet.` : 'Use the quiet window to inspect the next foundation bet rather than manufacturing a pressure.'}`,
    actions: [{ label: 'Open Executive brief', href: '/tower?tab=executive_brief' }],
    confidenceFloor: weakestConfidence(input.initiatives),
    citations: [
      { field: 'tower_view.scaled_initiative_count', value: scaled.length },
      ...aligned.flatMap(initiativeCitations),
    ],
  };
}

function suggestedPromptsFor(input: AtlasReasoningInput): ReadonlyArray<string> {
  if (input.lens === 'contract') {
    return [
      'Draft a negotiation thesis tied to current pressures',
      'Which renewals enter the 90-day window next?',
      'What posture should Source take first?',
      'Show me the evidence behind the renewal pressure',
    ];
  }
  if (input.lens === 'adopt') {
    return [
      'Why is adoption low confidence?',
      'Which integrations replace the adoption proxy?',
      'Map adoption gap to identity-source coverage',
      'Which initiatives are scaled but thin on telemetry?',
    ];
  }
  return [
    'Show me the lagging programs by realized value',
    'Re-rank pressures by attribution confidence',
    'Which pressure has the strongest evidence?',
    'Brief me for the next governance meeting',
  ];
}

export function buildAtlasInterpretation(input: AtlasReasoningInput): AtlasInterpretation {
  if (input.initiatives.length === 0 && input.vendors.length === 0) {
    return {
      headline: 'Atlas needs substrate before it can synthesize Tower observations.',
      metaSuffix: '0 observations · substrate missing',
      observations: [],
      ifYouOnlyDoOneToday: 'Load AI Initiatives in Setup before asking Atlas to synthesize this Tower view.',
      suggestedPrompts: ['Load AI Initiatives substrate'],
      isEmpty: true,
      emptyHint: 'Atlas needs substrate to synthesize observations. Load via Setup -> AI Initiatives.',
      deterministicSeed: true,
      interpretationConfidence: 'low',
      citations: [],
      patternsFired: [],
      citationErrors: [],
    };
  }

  const deferredMetrics = input.deferredMetrics ?? listDeferredMetrics('tower-cfo');
  const selection = selectAtlasPatterns(input);
  const observations: AtlasInterpretiveObservation[] = [];
  const push = (observation: AtlasInterpretiveObservation | null) => {
    if (observation) observations.push({ ...observation, number: observations.length + 1 });
  };

  if (selection.leadPattern === 'pattern_04_vendor_clock') {
    push(composeVendorClock(input, 1));
  } else if (selection.leadPattern === 'pattern_01_top_pressure') {
    push(composeTopPressure(input, 1));
  } else {
    push(composeHealthy(input, 1));
  }

  for (const pattern of selection.secondaryPatterns) {
    if (pattern === 'pattern_02_shared_root') push(composeSharedRoot(input, observations.length + 1));
    if (pattern === 'pattern_03_defend_while_resolving') push(composeDefend(input, observations.length + 1));
    if (pattern === 'pattern_05_look_ahead') push(composeLookAhead(input, observations.length + 1));
  }

  const citations = observations.flatMap((observation) => observation.citations);
  const citationErrors = validateAtlasCitations(observations);
  const confidence: AtlasInterpretationConfidence =
    observations.length === 0 || citationErrors.length > 0
      ? 'low'
      : observations.some((observation) => observation.confidenceFloor === 'LOW')
        ? 'med'
        : 'high';
  const patternsFired = [
    selection.leadPattern,
    ...selection.secondaryPatterns.slice(0, Math.max(0, observations.length - 1)),
  ];

  return {
    headline: `Atlas read: ${observations.length === 1 ? 'one grounded pressure' : `${observations.length} grounded threads`} in ${input.tenant.name}.`,
    metaSuffix: `${observations.length} observation${observations.length === 1 ? '' : 's'} · ${patternsFired.length} pattern${patternsFired.length === 1 ? '' : 's'} · ${deferredMetrics.length} deferred metrics`,
    observations,
    ifYouOnlyDoOneToday:
      observations[0]?.actions[0]?.label
        ? `${observations[0].actions[0].label}. It is the most defensible next step because it anchors on the strongest cited pressure.`
        : 'Do not force a decision from thin substrate; load the missing evidence first.',
    suggestedPrompts: suggestedPromptsFor(input),
    isEmpty: observations.length === 0,
    emptyHint: observations.length === 0 ? 'Atlas could not compose a cited observation.' : null,
    deterministicSeed: true,
    interpretationConfidence: confidence,
    citations,
    patternsFired,
    citationErrors,
  };
}
