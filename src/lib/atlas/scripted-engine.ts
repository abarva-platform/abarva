import {
  get_scripted_opening,
  query_cohort_benchmarks,
  query_portfolio_aggregates,
  query_programs,
  query_signal_evidence,
  query_signals,
  query_tower_current_state,
  query_use_cases,
} from '@/lib/atlas/tool-belt';
import type {
  AtlasChatResponse,
  AtlasIntent,
  AtlasPortfolioSummary,
  AtlasSignalDetail,
  AtlasSuggestion,
  AtlasTenancyCtx,
  AtlasToolResultMap,
  AtlasValueGrounding,
} from '@/lib/atlas/types';
import type { AtlasTowerCurrentState } from '@/lib/atlas/tower-grounding';
import { buildAtlasValueGrounding, renderAtlasValueGrounding } from '@/lib/atlas/value-grounding';
import { formatPercentile } from '@/lib/agent/response-shape';

function dollars(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function percent(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return `${Math.round(value)}%`;
}

function topSignal(signals: AtlasSignalDetail[] | AtlasToolResultMap['signals']) {
  return (signals ?? [])[0] ?? null;
}

function sentence(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.endsWith('.') || value.endsWith('?') || value.endsWith('!') ? value : `${value}.`;
}

function morningSuggestions(signalId?: string | null): AtlasSuggestion[] {
  return [
    { label: 'CFO lens', value: 'Give me the CFO value lens on the current state', kind: 'message' },
    { label: 'CIO lens', value: 'Give me the CIO delivery lens on the current state', kind: 'message' },
    signalId
      ? { label: 'Walk top pressure', value: 'Walk me through the top pressure strategically', kind: 'message' }
      : { label: 'Program load', value: 'Show active programs', kind: 'message' },
  ];
}

function buildMorningSummary(
  portfolio: AtlasPortfolioSummary,
  primary: AtlasSignalDetail | null,
  secondaryHeadline?: string | null,
  tower?: AtlasTowerCurrentState,
): string {
  const hero = tower?.bandMetrics.metrics.find((metric) => metric.hero) ?? tower?.bandMetrics.metrics[0];
  const topPressure = tower?.pressuresView.cards[0];
  const pressureRead = topPressure
    ? sentence(topPressure.headline)
    : primary
      ? sentence(primary.signalTitle)
      : 'The portfolio is active, but Atlas does not see a single dominant pressure in the current Tower state.';
  const technicalDepth = tower
    ? `The technical substrate is usable: Tower has initiative, vendor, KPI, decision, scenario, stakeholder, pressure, and observation coverage for this tenant.`
    : `The technical substrate is thinner than I want, so I would keep this as a directional read rather than a board-ready conclusion.`;
  const businessEvidence = hero
    ? `The business signal I would not ignore is ${hero.label.toLowerCase()} at ${hero.value}; that is a prompt for governance, not a standalone verdict.`
    : portfolio.valueAttainmentPctAvg != null
      ? `The business signal I would not ignore is value attainment around ${percent(portfolio.valueAttainmentPctAvg)}; that needs owner-by-owner interpretation before it becomes a decision.`
      : `The business signal is not clean enough to quantify from this turn alone.`;
  const secondary = secondaryHeadline
    ? `There is a second pressure behind it - ${secondaryHeadline.toLowerCase()} - so I would avoid treating this as a one-metric problem.`
    : null;

  return [
    `My read: ${portfolio.clientName} is past the "do we have AI activity?" question. The issue now is whether the portfolio is sequenced, owned, and measured well enough for CXO confidence.`,
    `Business lens: ${pressureRead} ${businessEvidence}`,
    `Technical lens: ${technicalDepth} The gap to watch is not retrieval; it is whether baselines, ownership, and value evidence are strong enough to support decisions.`,
    secondary,
    `I would sharpen this with one clarification: do you want the CFO value lens first, or the CIO delivery-risk lens first?`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildShadowAiDetail(signal: AtlasSignalDetail): string {
  const peerMedian = signal.benchmark?.p50;
  const ratio = typeof signal.cohortContext.apex_to_median_ratio === 'number'
    ? `${signal.cohortContext.apex_to_median_ratio.toFixed(1)}x`
    : null;
  const evidenceLead = signal.evidence
    .slice(0, 3)
    .map((entry) => `${entry.vendorName ?? entry.title} ${dollars(entry.amountUsd)}`)
    .join(', ');

  return [
    `${signal.headline}. The current annualized impact is ${dollars(signal.impactUsd)}.`,
    peerMedian ? `Peer median is ${dollars(peerMedian)}${ratio ? `, so this tenant is running at ${ratio} median` : ''}.` : null,
    evidenceLead ? `The evidence chain is anchored by ${evidenceLead}.` : null,
    'The clean next move is to review renewal windows, assign owners, and originate the consolidation program if the exposure is real.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildCohortPosition(portfolio: AtlasPortfolioSummary, adoptionBenchmark: Awaited<ReturnType<typeof query_cohort_benchmarks>>) {
  const median = adoptionBenchmark?.p50;
  const percentileRank = adoptionBenchmark?.apexPercentile;
  // ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B: render the percentile through
  // the labeled helper so the reader sees metric + cohort + n=… instead of
  // a naked "Xth percentile" that could belong to any scale.
  const percentileLabel = percentileRank != null
    ? formatPercentile({
      value: percentileRank,
      metric: adoptionBenchmark?.metricName,
      cohort: adoptionBenchmark?.label,
      sampleSize: adoptionBenchmark?.sampleSize ?? adoptionBenchmark?.peers.length,
    })
    : null;
  return [
    `${portfolio.clientName} is sitting at ${percent(portfolio.adoptionPenetrationPctAvg)} average adoption.`,
    median != null ? `Peer median is ${percent(median)}.` : null,
    percentileLabel ? `That puts the portfolio at ${percentileLabel}.` : null,
    adoptionBenchmark?.note ?? null,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildRoiSummary(portfolio: AtlasPortfolioSummary, grounding: AtlasValueGrounding) {
  return [
    `Projected value is ${dollars(portfolio.estimatedValueUsd)} from the Atlas portfolio estimate.`,
    portfolio.valueAttainmentPctAvg != null
      ? `Tracked value attainment is ${percent(portfolio.valueAttainmentPctAvg)}.`
      : 'Tracked value attainment is missing from the portfolio aggregate.',
    portfolio.trackedActiveUsers != null
      ? `Tracked active users are ${portfolio.trackedActiveUsers.toLocaleString()}.`
      : 'Tracked active users are missing from the portfolio aggregate.',
    `Verified realized value is ${dollars(portfolio.realizedValueUsd)}.`,
    'Do not treat projected value as verified value.',
    portfolio.averageTrustworthinessScore != null
      ? `Trustworthiness is averaging ${Math.round(portfolio.averageTrustworthinessScore)} out of 100, so the value story is credible but not fully clean.`
      : null,
    renderAtlasValueGrounding(grounding),
  ]
    .filter(Boolean)
    .join(' ');
}

function buildIdleSeatsSummary(useCases: Awaited<ReturnType<typeof query_use_cases>>, portfolio: AtlasPortfolioSummary) {
  const copilots = useCases.filter((item) => (item.vendor ?? '').toLowerCase().includes('copilot'));
  const names = copilots.slice(0, 2).map((item) => item.name).join(' and ');
  return [
    copilots.length > 0
      ? `${names} are the most likely places to inspect idle-seat behavior first.`
      : 'I do not have a clean idle-seat contradiction in the current signal set, so I would start with Copilot-adjacent deployments.',
    portfolio.adoptionPenetrationPctAvg != null ? `Portfolio adoption is only ${percent(portfolio.adoptionPenetrationPctAvg)}, which is low enough to justify a seat-utilization review.` : null,
    'If you want, I can break down the Shadow AI and Copilot exposure separately.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildStrategyRefusal(): string {
  return "That crosses from portfolio state into strategy. I can show you the concentration facts, evidence chains, program load, and peer context, but the actual choice belongs in Sentinel or a Program charter.";
}

export async function runScriptedAtlasIntent(
  ctx: AtlasTenancyCtx,
  intent: AtlasIntent,
  message: string,
  surfaceContext?: Record<string, unknown>,
): Promise<{
  response: string;
  suggestions: AtlasSuggestion[];
  signalId?: string | null;
  toolsUsed: string[];
  toolResults: AtlasToolResultMap;
}> {
  const toolResults: AtlasToolResultMap = {};
  const towerState = await query_tower_current_state(ctx, surfaceContext);
  toolResults.towerState = towerState;

  if (intent === 'morning_summary' || intent === 'portfolio_status') {
    const [opening, portfolio] = await Promise.all([get_scripted_opening(ctx), query_portfolio_aggregates(ctx)]);
    toolResults.portfolio = portfolio;
    toolResults.observations = opening.observations;
    toolResults.signals = opening.signals;

    const primary = opening.signals[0] ? await query_signal_evidence(ctx, opening.signals[0].id) : null;
    const second = opening.signals[1]?.headline ?? null;
    if (primary) toolResults.signalDetail = primary;

    return {
      response: buildMorningSummary(portfolio, primary, second, towerState),
      suggestions: morningSuggestions(primary?.id ?? opening.signals[0]?.id ?? null),
      signalId: primary?.id ?? opening.signals[0]?.id ?? null,
      toolsUsed: ['query_tower_current_state', 'get_scripted_opening', 'query_portfolio_aggregates', ...(primary ? ['query_signal_evidence'] : [])],
      toolResults,
    };
  }

  if (intent === 'shadow_ai_detail' || intent === 'signal_detail') {
    const signals = await query_signals(ctx, { limit: 5 });
    const selected = signals.find((signal) => signal.signalKey === 'shadow_ai_detected') ?? topSignal(signals);
    const detail = selected ? await query_signal_evidence(ctx, selected.id) : null;
    toolResults.signals = signals;
    toolResults.signalDetail = detail;
    return {
      response: detail
        ? buildShadowAiDetail(detail)
        : 'I do not have an active Shadow AI signal for this client right now.',
      suggestions: detail
        ? [
            { label: 'Open evidence', value: `signal:${detail.id}`, kind: 'signal' },
            { label: 'Originate program', value: 'Originate program', kind: 'link', href: `/programs/new?source=tower_signal&signalId=${encodeURIComponent(detail.id)}` },
            { label: 'Peer comparison', value: 'How do we compare to peers on Shadow AI?', kind: 'message' },
          ]
        : [{ label: 'Portfolio status', value: 'What is the portfolio look like?', kind: 'message' }],
      signalId: detail?.id ?? null,
      toolsUsed: ['query_tower_current_state', 'query_signals', ...(detail ? ['query_signal_evidence'] : [])],
      toolResults,
    };
  }

  if (intent === 'cohort_position') {
    const [portfolio, benchmark] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_cohort_benchmarks(ctx, 'adoption_penetration_pct_avg'),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.benchmark = benchmark;
    return {
      response: buildCohortPosition(portfolio, benchmark),
      suggestions: [
        { label: 'Adoption drag', value: 'What is dragging adoption?', kind: 'message' },
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_cohort_benchmarks'],
      toolResults,
    };
  }

  if (intent === 'roi') {
    const portfolio = await query_portfolio_aggregates(ctx);
    const valueGrounding = await buildAtlasValueGrounding({
      ctx,
      message,
      portfolio,
      towerState,
    });
    toolResults.portfolio = portfolio;
    toolResults.valueGrounding = valueGrounding;
    return {
      response: buildRoiSummary(portfolio, valueGrounding),
      suggestions: [
        { label: 'Peer value', value: 'How do we compare to peers on value attainment?', kind: 'message' },
        { label: 'Programs', value: 'Show active programs', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'search_canonical_pattern_index'],
      toolResults,
    };
  }

  if (intent === 'idle_seats') {
    const [useCases, portfolio] = await Promise.all([query_use_cases(ctx), query_portfolio_aggregates(ctx)]);
    toolResults.useCases = useCases;
    toolResults.portfolio = portfolio;
    return {
      response: buildIdleSeatsSummary(useCases, portfolio),
      suggestions: [
        { label: 'Copilot exposure', value: 'Show active signals', kind: 'message' },
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_use_cases', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'strategy_refusal') {
    const [programs, portfolio] = await Promise.all([query_programs(ctx), query_portfolio_aggregates(ctx)]);
    toolResults.programs = programs;
    toolResults.portfolio = portfolio;
    return {
      response: buildStrategyRefusal(),
      suggestions: [
        { label: 'Open Sentinel', value: 'Open in Sentinel', kind: 'link', href: '/intelligence' },
        { label: 'Originate program', value: 'Originate program', kind: 'link', href: '/programs/new?source=tower_signal' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_programs', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  const fallback = await runScriptedAtlasIntent(ctx, 'morning_summary', message, surfaceContext);
  return fallback;
}

export function makeScriptedChatResponse(
  base: Omit<AtlasChatResponse, 'routeType' | 'intent' | 'response' | 'suggestions' | 'toolsUsed'>,
  intent: AtlasIntent,
  payload: Awaited<ReturnType<typeof runScriptedAtlasIntent>>,
): AtlasChatResponse {
  return {
    ...base,
    routeType: intent === 'signal_detail' ? 'hybrid' : 'scripted',
    intent,
    response: payload.response,
    suggestions: payload.suggestions,
    signalId: payload.signalId ?? null,
    toolsUsed: payload.toolsUsed,
  };
}
