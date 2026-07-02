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
import { getArchetype } from '@/lib/atlas/iac/retrieval';
import type { AIInitiative } from '@/lib/admin/ai-initiatives/queries';

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
      : 'The portfolio is active, but aVa does not see a single dominant pressure in the current Tower state.';
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

function buildRoiSummary(
  portfolio: AtlasPortfolioSummary,
  grounding: AtlasValueGrounding,
  message: string,
) {
  const topic = /kyriba/i.test(message) ? ' Kyriba rollout' : '';
  const projected = grounding.valueSeparation.projected;
  const verified = grounding.valueSeparation.verified;
  const tracked = grounding.valueSeparation.tracked;
  const trackedValueAttainment = tracked.find((item) => item.label === 'Tracked value attainment');
  const trackedUsers = tracked.find((item) => item.label === 'Tracked active users');
  const missingEvidence = grounding.missingEvidence.slice(0, 3).join('; ') || 'No missing evidence surfaced by the value-grounding layer.';

  return [
    `My read: ${portfolio.clientName}${topic} value is not ready to be spoken as realized savings. Tower is separating projected or modeled value, tracked value, and verified realized value, and the verified layer is still missing or zero.`,
    '',
    'Why:',
    `- Projected or modeled value: ${projected.value} (${projected.status}); do not treat this as verified realized value.`,
    `- Tracked value: ${trackedValueAttainment?.value ?? 'missing'} value attainment and ${trackedUsers?.value ?? 'missing'} tracked active users.`,
    `- Verified realized value: ${verified.value} (${verified.status}); this is the number a CFO can defend today.`,
    '',
    'Decision fork:',
    '- Option A: Use this as a planning-range read only. Lower risk; keeps the board story honest.',
    '- Option B: Quote value externally only after Finance attaches baseline, measurement method, and attestation.',
    '',
    'What I would do next: Open the Tower value evidence for the highest-value initiative and assign Finance to close the baseline and measurement method before any savings claim is used in a board packet.',
    '',
    `Evidence gap: ${missingEvidence}`,
    '',
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

function initiativeRatio(initiative: AIInitiative): number | null {
  return ratioPct(initiative.measuredValueUsd, initiative.committedAnnualUsd);
}

function initiativeDisplayRatio(initiative: AIInitiative): string {
  const ratio = initiativeRatio(initiative);
  return ratio === null ? 'not measurable yet' : `${ratio}%`;
}

function isCopilotInitiative(initiative: AIInitiative): boolean {
  const text = [
    initiative.displayId,
    initiative.name,
    initiative.description,
    initiative.primaryCategoryName,
    initiative.secondaryCategoryName,
    initiative.statusSummary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes('copilot')
    || text.includes('github')
    || text.includes('m365')
    || text.includes('developer productivity');
}

function formatIndustryMetric(archetypeKey: 'github_copilot' | 'microsoft_365_copilot'): string | null {
  const archetype = getArchetype(archetypeKey);
  const metric = archetype?.adoptionMetrics[0];
  if (!archetype || !metric) return null;
  const value = metric.range.low === metric.range.high
    ? `${metric.range.low}${metric.range.unit.startsWith('%') ? '' : ` ${metric.range.unit}`}`
    : `${metric.range.low}-${metric.range.high}${metric.range.unit.startsWith('%') ? '' : ` ${metric.range.unit}`}`;
  return `${archetype.label}: ${metric.metric} ${value} (${metric.range.source}, ${metric.range.date}; cohort ${metric.range.cohort}; n=${metric.range.sampleSize}).`;
}

function buildCopilotUsageValueSummary(
  portfolio: AtlasPortfolioSummary,
  tower: AtlasTowerCurrentState | undefined,
  adoptionBenchmark: Awaited<ReturnType<typeof query_cohort_benchmarks>>,
): string {
  const initiatives = (tower?.initiatives ?? []).filter(isCopilotInitiative);
  const ranked = [...initiatives].sort((a, b) => {
    const ar = initiativeRatio(a);
    const br = initiativeRatio(b);
    return (ar ?? -1) - (br ?? -1);
  });
  const initiativeLines = ranked.length > 0
    ? ranked.slice(0, 5).map((initiative, index) => {
      const denominator = initiative.committedAnnualUsd != null ? `commit ${dollars(initiative.committedAnnualUsd)}` : 'commit n/a';
      const measured = initiative.measuredValueUsd != null ? `measured ${dollars(initiative.measuredValueUsd)}` : 'measured n/a';
      return `${index + 1}. ${initiative.displayId} ${initiative.name} — ${initiativeDisplayRatio(initiative)} measured/commit (${measured}; ${denominator}); ${initiative.statusFlag}; confidence ${initiative.confidenceLevel}.`;
    }).join('\n')
    : 'No Copilot-named initiative is loaded in the current Tower initiative registry.';
  const kpis = (tower?.kpiSnapshots ?? [])
    .filter((snapshot) => /copilot|github|m365|developer|usage|adoption|cycle|nps/i.test(`${snapshot.initiativeName} ${snapshot.kpiName}`))
    .slice(0, 4);
  const kpiLines = kpis.length > 0
    ? kpis.map((snapshot) => `- ${snapshot.initiativeDisplayId} ${snapshot.kpiName}: ${snapshot.value ?? 'n/a'} vs target ${snapshot.targetValue ?? 'n/a'} (${snapshot.quarter}; confidence ${snapshot.confidenceLevel ?? 'n/a'}).`).join('\n')
    : '- No Copilot-specific KPI snapshots are loaded; use portfolio adoption and initiative value as the bounded read.';
  const adoptionLine = portfolio.adoptionPenetrationPctAvg != null
    ? `Portfolio adoption is ${percent(portfolio.adoptionPenetrationPctAvg)} with ${portfolio.trackedActiveUsers?.toLocaleString() ?? 'n/a'} tracked active users.`
    : 'Portfolio adoption is not loaded in the aggregate.';
  const valueLine = portfolio.valueAttainmentPctAvg != null
    ? `Portfolio value attainment is ${percent(portfolio.valueAttainmentPctAvg)}; verified realized value is ${dollars(portfolio.realizedValueUsd)} against ${dollars(portfolio.estimatedValueUsd)} projected.`
    : `Verified realized value is ${dollars(portfolio.realizedValueUsd)} against ${dollars(portfolio.estimatedValueUsd)} projected; value-attainment percentage is not loaded.`;
  const industryLines = [
    formatIndustryMetric('github_copilot'),
    formatIndustryMetric('microsoft_365_copilot'),
  ].filter(Boolean);
  const benchmarkLine = adoptionBenchmark?.p50 != null
    ? `Retail cohort adoption median is ${percent(adoptionBenchmark.p50)} (sample size ${adoptionBenchmark.sampleSize ?? adoptionBenchmark.peers.length}); this tenant value is ${percent(adoptionBenchmark.apexValue)}.`
    : null;

  return [
    `Your data\n${portfolio.clientName} has ${initiatives.length} Copilot-adjacent initiative${initiatives.length === 1 ? '' : 's'} loaded in Tower. ${adoptionLine} ${valueLine}\n${initiativeLines}\n\nUsage/value evidence\n${kpiLines}`,
    `Industry context\n${industryLines.join(' ')}${benchmarkLine ? ` ${benchmarkLine}` : ''} Industry context refreshed 2026-05-30.`,
    `The gap\nThe strongest honest read is measured value and adoption telemetry, not a blanket productivity claim. ${ranked[0] ? `${ranked[0].displayId} is the first Copilot-adjacent item to inspect because it has the lowest measured/commit ratio or missing measurement in the loaded Tower facts.` : 'The gap is missing Copilot-specific initiative data in Tower.'}`,
    `Next move\nOpen the lowest-ratio Copilot initiative, verify active-seat telemetry and measured-value method, then decide whether to reclaim seats, tighten prompts/training, or hold expansion until the next value ledger refresh.`,
  ].join('\n\n');
}

function buildStrategyRefusal(): string {
  return "That crosses from portfolio state into strategy. I can show you the concentration facts, evidence chains, program load, and peer context, but the actual choice belongs in Intelligence or a Program charter.";
}

function buildFederatedVisibilityBoundary(
  portfolio: AtlasPortfolioSummary,
  tower: AtlasTowerCurrentState | undefined,
): string {
  const initiativeCount = tower?.initiatives?.length ?? portfolio.activeUseCaseCount;
  const vendorCount = tower?.vendors?.length ?? null;
  const pressureCount = tower?.pressuresView?.cards?.length ?? null;
  const loadedEvidence = [
    `${initiativeCount} Tower initiative${initiativeCount === 1 ? '' : 's'}`,
    vendorCount != null ? `${vendorCount} vendor record${vendorCount === 1 ? '' : 's'}` : null,
    pressureCount != null ? `${pressureCount} pressure card${pressureCount === 1 ? '' : 's'}` : null,
  ].filter(Boolean).join(', ');

  return [
    'My read:',
    `${portfolio.clientName}'s L0 Tower view should stay consolidated: the sponsor sees cross-HoldCo posture across Lakeshore Holdings and sibling HoldCos, but does not see raw HoldCo-private evidence unless the owning HoldCo grants access.`,
    '',
    'Why:',
    `- The L0 view is for portfolio steering: consolidated initiative health, value posture, renewal clocks, pressure themes, and decision history. Current loaded Tower coverage includes ${loadedEvidence || 'the active Tower portfolio set'}.`,
    '- Sibling HoldCos should not see each other\'s raw contracts, stakeholder notes, scenario drafts, workforce-level data, or private operating telemetry by default.',
    '- The safe pattern is roll up the signal, keep the evidence owner visible, and require a named grant before exposing raw support material.',
    '',
    'What I would do next:',
    'Approve an L0 visibility matrix with three lanes: consolidated by default, HoldCo-private by default, and grant-on-request with owner, purpose, and expiry.',
    '',
    'Evidence gap:',
    'Tower has the operating rollup, but the formal L0/L1 visibility grant matrix is not yet loaded as a ratified governance artifact.',
  ].join('\n');
}

// ---- Gold-standard response shape helpers (audit §4) -----------------------
// Every CXO response is built from: Lead (1 sentence verdict, names the
// tenant) + Evidence (2-4 short citations) + Honesty line (gap name when
// applicable) + Next step + Handoff (when scope-crossing).
//
// Handlers below return strings shaped to this contract. When the underlying
// data layer cannot yet supply a particular field, the honesty line names the
// gap rather than fabricating a value or shipping boilerplate.

function ratioPct(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function buildLaggingProgramsByValue(
  portfolio: AtlasPortfolioSummary,
  tower: AtlasTowerCurrentState | undefined,
): string {
  const programList = tower?.initiatives ?? [];
  const overallRatio = ratioPct(portfolio.realizedValueUsd, portfolio.estimatedValueUsd);
  const ranked = [...programList]
    .filter((program) => program.committedAnnualUsd != null || program.measuredValueUsd != null)
    .sort((a, b) => {
      const ar = initiativeRatio(a);
      const br = initiativeRatio(b);
      if ((ar ?? -1) !== (br ?? -1)) return (ar ?? -1) - (br ?? -1);
      return (b.committedAnnualUsd ?? 0) - (a.committedAnnualUsd ?? 0);
    })
    .slice(0, 5);
  const programLines = ranked.length > 0
    ? ranked
        .map((program, index) => {
          return `${index + 1}. ${program.displayId} ${program.name} (${program.stage}${program.stageDetail ? ` / ${program.stageDetail}` : ''}) — ${initiativeDisplayRatio(program)} measured/commit; measured ${dollars(program.measuredValueUsd)} vs committed annual ${dollars(program.committedAnnualUsd)}; ${program.statusFlag}; confidence ${program.confidenceLevel}.`;
        })
        .join('\n')
    : 'No programs returned for this tenant.';

  return [
    `${portfolio.clientName} has ${programList.length} programs in flight; the lagging set below is what would draw a CFO question first.`,
    programLines,
    overallRatio != null
      ? `Portfolio-wide realized-to-projected ratio is ${overallRatio}% (${dollars(portfolio.realizedValueUsd)} of ${dollars(portfolio.estimatedValueUsd)} projected).`
      : 'Portfolio-wide realized-to-projected ratio cannot be computed — projected or realized value is missing.',
    'This is ranked from loaded Tower initiative facts: measured_value_usd ÷ committed_annual_usd. A missing measured value is treated as an evidence gap, not as proof of zero impact.',
    ranked[0]
      ? `Next step: open ${ranked[0].displayId} in Programs and verify the value ledger method before deciding whether to reshape, accelerate, or pause.`
      : 'Next step: load per-program measured value before using this as a decision-grade CFO ranking.',
  ].join('\n\n');
}

function buildValueAttainmentVsCommitment(portfolio: AtlasPortfolioSummary): string {
  const overallRatio = ratioPct(portfolio.realizedValueUsd, portfolio.estimatedValueUsd);
  return [
    `${portfolio.clientName} value attainment vs commitment: tracked attainment is ${percent(portfolio.valueAttainmentPctAvg)} on the portfolio aggregate.`,
    `Projected value commitment is ${dollars(portfolio.estimatedValueUsd)}. Verified realized value is ${dollars(portfolio.realizedValueUsd)}.`,
    overallRatio != null
      ? `That puts realized at ${overallRatio}% of projected — projected is not verified, so treat this as the upper bound on the verified story.`
      : 'Realized-to-projected ratio cannot be computed cleanly — one of the inputs is missing from the aggregate.',
    portfolio.averageTrustworthinessScore != null
      ? `Trustworthiness averages ${Math.round(portfolio.averageTrustworthinessScore)}/100, which is the confidence we have in the underlying measurement.`
      : 'Trustworthiness score is missing — the credibility of the measurement is undisclosed.',
    'Next step: open the value-grounding evidence in Programs for the largest commitment to validate measurement method before quoting the number externally.',
  ].join(' ');
}

function buildAtRiskGates(
  portfolio: AtlasPortfolioSummary,
  signals: AtlasToolResultMap['signals'],
  programs: AtlasToolResultMap['programs'],
): string {
  const signalList = signals ?? [];
  const programList = programs ?? [];
  const criticalSignals = signalList.filter((signal) => signal.severity === 'critical');
  const warningSignals = signalList.filter((signal) => signal.severity === 'warning');
  const signalLines = signalList
    .slice(0, 3)
    .map((signal, index) => `${index + 1}. ${signal.signalTitle} — ${signal.severity}, ${signal.pillar} pillar`)
    .join('\n');
  return [
    `${portfolio.clientName} has ${criticalSignals.length} critical and ${warningSignals.length} warning signals on the portfolio; ${programList.length} programs are in flight.`,
    signalLines || 'No active signals returned for this tenant.',
    'Per-gate-risk scoring by date is not exposed in this surface, so this answer uses the active critical and warning signals as the honest proxy.',
    'Next step: open the top signal evidence chain and walk the program owner through the at-risk gate before the next checkpoint.',
  ].join('\n\n');
}

function buildPortfolioConfidence(
  portfolio: AtlasPortfolioSummary,
  tower: AtlasTowerCurrentState | undefined,
): string {
  const bandFloor = tower?.bandMetrics.metrics
    .map((metric) => metric.confidence)
    .find((value) => value === 'low' || value === 'none') ?? 'med';
  const lowestBandLabel = tower?.bandMetrics.metrics.find((metric) => metric.confidence === 'low')?.label
    ?? tower?.bandMetrics.metrics.find((metric) => metric.confidence === 'none')?.label
    ?? null;
  return [
    `${portfolio.clientName} portfolio confidence is bounded by the lowest-confidence displayed metric, which is currently ${bandFloor}${lowestBandLabel ? ` (driven by ${lowestBandLabel.toLowerCase()})` : ''}.`,
    portfolio.averageTrustworthinessScore != null
      ? `Average value-evidence trustworthiness is ${Math.round(portfolio.averageTrustworthinessScore)}/100.`
      : 'Average value-evidence trustworthiness is missing from the portfolio aggregate.',
    `Substrate coverage: ${portfolio.activeUseCaseCount} active use cases, ${portfolio.criticalSignalCount} critical signals, ${portfolio.warningSignalCount} warning signals.`,
    'A single blended portfolio-confidence score is not exposed in this surface; the band floor and value-evidence trustworthiness are the closest honest read.',
    'Next step: review the band-floor metric in Tower and decide whether the missing measurement blocks the next gate.',
  ].join(' ');
}

function buildPeerAdoptionCompare(
  portfolio: AtlasPortfolioSummary,
  benchmark: Awaited<ReturnType<typeof query_cohort_benchmarks>>,
): string {
  const median = benchmark?.p50;
  const percentileRank = benchmark?.apexPercentile;
  const sampleSize = benchmark?.sampleSize;
  const cohortLabel = benchmark?.label ?? 'retail cohort';
  // Per audit §4.3 percentile rule: metric + cohort + sample size are required.
  const percentileLine = percentileRank != null
    ? `That puts ${portfolio.clientName} at the ${percentileRank}th percentile on adoption_penetration_pct_avg in the ${cohortLabel} (n=${sampleSize ?? 'n/a'}).`
    : `Cohort percentile is missing for adoption_penetration_pct_avg — peer panel n=${sampleSize ?? 'n/a'}.`;
  return [
    `${portfolio.clientName} runs at ${percent(portfolio.adoptionPenetrationPctAvg)} average adoption.`,
    median != null ? `Peer median is ${percent(median)} on the same metric.` : null,
    percentileLine,
    'Next step: drill into the cohort definition in Tower to confirm the peer set is right before quoting the percentile externally.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildIndustryLeaders(portfolio: AtlasPortfolioSummary): string {
  return [
    `${portfolio.clientName}'s industry-leader read is an external-corpus question — Tower does not assert leader behavior from the portfolio aggregate alone.`,
    `What I can ground from this tenant: ${portfolio.activeUseCaseCount} active use cases, ${portfolio.criticalSignalCount} critical signals, ${portfolio.warningSignalCount} warning signals.`,
    'Industry-leader patterns live in the knowledge corpus. To answer well I need a corpus retrieval pass scoped to this industry — ask "what are others doing in retail on AI governance" and I will run the LLM path with industry corpus context.',
    'Honesty line: I do not have a curated "industry leaders" intent backed by a verified peer panel. The LLM path with corpus context is the closest honest read until that lands.',
  ].join(' ');
}

function buildCohortLagging(
  portfolio: AtlasPortfolioSummary,
  benchmark: Awaited<ReturnType<typeof query_cohort_benchmarks>>,
): string {
  const median = benchmark?.p50;
  const sampleSize = benchmark?.sampleSize;
  const cohortLabel = benchmark?.label ?? 'retail cohort';
  const adoptionGap = typeof portfolio.adoptionPenetrationPctAvg === 'number' && typeof median === 'number'
    ? Math.round(portfolio.adoptionPenetrationPctAvg - median)
    : null;
  return [
    `${portfolio.clientName} is lagging the ${cohortLabel} on adoption: ${percent(portfolio.adoptionPenetrationPctAvg)} vs peer median ${median != null ? percent(median) : 'n/a'} (n=${sampleSize ?? 'n/a'}).`,
    adoptionGap != null && adoptionGap < 0
      ? `Gap to median: ${Math.abs(adoptionGap)} points below.`
      : adoptionGap != null
        ? `Gap to median: ${adoptionGap} points above on adoption — the lag, if any, is elsewhere.`
        : 'Gap to median cannot be computed.',
    'Other percentile dimensions such as spend intensity, value attainment, and vendor count are not exposed in this surface, so do not over-read adoption as the whole portfolio story.',
    'Next step: open the cohort definition in Tower and confirm peer panel size before quoting the gap to the CFO.',
  ].join(' ');
}

function buildAiSpendVsBudget(portfolio: AtlasPortfolioSummary): string {
  return [
    `${portfolio.clientName} governed AI spend is running at ${dollars(portfolio.governedAiSpendUsd)} on the latest portfolio aggregate; shadow AI exposure adds ${dollars(portfolio.shadowAiSpendUsd)}.`,
    'AI budget for the fiscal period is not exposed on the portfolio aggregate — Tower cannot quote a run-rate-vs-budget number without that input.',
    'What Tower can ground today is the governed-spend total plus the shadow exposure. To answer "run-rate vs budget" properly, the FY budget figure has to be loaded into the Tower evidence set.',
    'Next step: pull the FY budget from Finance or the Tower today resolver, then re-ask — the answer is a one-line computation once the budget is grounded.',
  ].join(' ');
}

function buildVendorConcentrationRisk(
  portfolio: AtlasPortfolioSummary,
  useCases: AtlasToolResultMap['useCases'],
): string {
  const useCaseList = useCases ?? [];
  const vendorCounts = new Map<string, number>();
  for (const useCase of useCaseList) {
    const vendor = useCase.vendor?.trim();
    if (!vendor) continue;
    vendorCounts.set(vendor, (vendorCounts.get(vendor) ?? 0) + 1);
  }
  const ranked = Array.from(vendorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const concentrationLine = ranked.length > 0
    ? ranked.map(([vendor, count]) => `${vendor} (${count} use case${count === 1 ? '' : 's'})`).join(', ')
    : 'No vendor concentration visible in the sampled use-case set.';
  return [
    `${portfolio.clientName} carries ${portfolio.distinctAiVendorsCount ?? 'n/a'} distinct AI vendors on the portfolio aggregate.`,
    `Top concentration in the active use-case sample: ${concentrationLine}.`,
    'This is a sample-based concentration read, not a contract-value-weighted one; value-weighted vendor concentration is not exposed in this surface.',
    'Next step: if a single vendor anchors more than 40% of value-weighted spend, originate a multi-vendor program in Source before the next renewal window.',
  ].join(' ');
}

function buildCostOverruns(
  portfolio: AtlasPortfolioSummary,
  programs: AtlasToolResultMap['programs'],
): string {
  const programList = programs ?? [];
  return [
    `${portfolio.clientName} carries ${programList.length} programs in flight; per-program cost-overrun status is not exposed on the listAtlasPrograms shape today.`,
    `Portfolio-wide governed AI spend is ${dollars(portfolio.governedAiSpendUsd)}.`,
    'Tower cannot rank programs by overrun magnitude from this surface. Treat this as a coverage gap, not a "no overruns" finding.',
    'Next step: pull the Programs ledger view directly; that is where budget-to-actual evidence belongs today.',
  ].join(' ');
}

function buildGovernanceCoverageGaps(
  portfolio: AtlasPortfolioSummary,
  signals: AtlasToolResultMap['signals'],
): string {
  const signalList = signals ?? [];
  const governanceSignals = signalList.filter((signal) => signal.pillar === 'risk' || signal.pillar === 'cross_pillar');
  const signalLine = governanceSignals
    .slice(0, 3)
    .map((signal) => `${signal.signalTitle} (${signal.severity}, ${signal.pillar} pillar)`)
    .join('; ');
  return [
    `${portfolio.clientName} has ${portfolio.criticalSignalCount} critical and ${portfolio.warningSignalCount} warning signals across the portfolio.`,
    governanceSignals.length > 0
      ? `Risk and cross-pillar signals that map to governance coverage: ${signalLine}.`
      : 'No risk-pillar signals returned in the top sample — the coverage view requires a wider signal pull.',
    `Stale integrations: ${portfolio.staleIntegrationCount} (these are the most common evidence-of-control gaps).`,
    'A formal governance-coverage ranking by policy area is not exposed in this surface; aVa is using risk signals and stale integrations as the bounded proxy.',
    'Next step: triage the highest-severity risk signal first and walk the attestation evidence in Programs.',
  ].join(' ');
}

function buildRegulatoryOpenItems(
  portfolio: AtlasPortfolioSummary,
  signals: AtlasToolResultMap['signals'],
): string {
  const signalList = signals ?? [];
  const regulatorySignals = signalList.filter((signal) =>
    signal.pillar === 'risk' || signal.signalKey.toLowerCase().includes('reg') || signal.signalKey.toLowerCase().includes('compli'),
  );
  return [
    `${portfolio.clientName} regulatory and compliance signal set: ${regulatorySignals.length} of ${signalList.length} sampled signals route to risk or regulatory pillars.`,
    regulatorySignals.length > 0
      ? `Top items: ${regulatorySignals.slice(0, 3).map((s) => `${s.signalTitle} (${s.severity}, ${s.pillar} pillar)`).join('; ')}.`
      : 'No regulatory-pillar signals surfaced in the top sample.',
    'Open regulatory items as a canonical register are not exposed in this surface; aVa is inferring from the signal pillar here, not reading a register.',
    'Next step: pull the Source compliance ledger directly; that is the audit-bearing list.',
  ].join(' ');
}

function buildFundNextWhy(portfolio: AtlasPortfolioSummary, programs: AtlasToolResultMap['programs']): string {
  const programList = programs ?? [];
  return [
    `aVa does not recommend "fund next" from Tower alone. What Tower can show: ${programList.length} active programs on ${portfolio.clientName}, ${portfolio.criticalSignalCount} critical signals, ${dollars(portfolio.estimatedValueUsd)} projected value, ${dollars(portfolio.realizedValueUsd)} verified realized.`,
    'For a "fund X why" answer, Intelligence should run the pattern + alignment + commitment-to-capacity check against the active substrate and return a recommendation with evidence chain.',
    "Next step: open Intelligence with this portfolio context. Tower's honest contribution stops at naming the facts; the choice belongs there.",
  ].join(' ');
}

function buildKillNextWhy(portfolio: AtlasPortfolioSummary, programs: AtlasToolResultMap['programs']): string {
  const programList = programs ?? [];
  return [
    `aVa does not recommend "kill next" from Tower alone. What Tower can show: ${programList.length} active programs on ${portfolio.clientName}; ranking by lagging value attainment is the canonical input.`,
    'The clean input to a kill decision is: (a) measured-value-to-commit by program, (b) gate confidence, and (c) cohort percentile on value attainment. Tower can ground the measured-value-to-commit part from loaded initiative facts; gate confidence and cohort percentile belong in Intelligence.',
    'Next step: hand off to Intelligence with the lagging-by-value program shortlist; the decision returns there with evidence.',
  ].join(' ');
}

function buildReshapeNextWhy(portfolio: AtlasPortfolioSummary, programs: AtlasToolResultMap['programs']): string {
  const programList = programs ?? [];
  return [
    `aVa does not recommend "reshape next" from Tower alone. What Tower can show: ${programList.length} active programs on ${portfolio.clientName} and the signals fired against them.`,
    'A reshape decision is anchored on the gap between intended pattern and observed evidence chain. Intelligence runs that comparison; Tower surfaces the signals that triggered the question.',
    'Next step: open the candidate program in Intelligence and run "reshape why" with the active pressure signal as the anchor.',
  ].join(' ');
}

function buildCutProgramImpact(
  portfolio: AtlasPortfolioSummary,
  programs: AtlasToolResultMap['programs'],
): string {
  const programList = programs ?? [];
  return [
    `Tower does not run counterfactuals — "if I cut program X" is an Intelligence scenario. What Tower grounds: ${programList.length} active programs on ${portfolio.clientName}, ${dollars(portfolio.estimatedValueUsd)} projected portfolio value.`,
    "A clean cut-impact analysis needs (a) the program's commitment, (b) its value at stake under the active pattern, and (c) downstream dependencies in the scenario graph. Intelligence runs that; Tower does not.",
    'Next step: open the target program in Intelligence and request the cut-scenario explicitly. The answer comes back with evidence and dependency map.',
  ].join(' ');
}

function buildFundXVsY(portfolio: AtlasPortfolioSummary, programs: AtlasToolResultMap['programs']): string {
  const programList = programs ?? [];
  return [
    `Tower does not rank "X vs Y" by itself. What Tower grounds: ${programList.length} active programs on ${portfolio.clientName} and their basic shape (name, phase, status).`,
    'Intelligence runs the comparison on pattern fit + value evidence + capacity to deliver. Tower can list the two programs side by side but cannot pick.',
    'Next step: hand off to Intelligence with both programs. The recommendation returns there with evidence per side.',
  ].join(' ');
}

function buildProgramDrilldown(
  portfolio: AtlasPortfolioSummary,
  programs: AtlasToolResultMap['programs'],
  message: string,
): string {
  const programList = programs ?? [];
  // Best-effort program ID match against the user message.
  const lowered = message.toLowerCase();
  const matched = programList.find((program) => {
    const name = program.name.toLowerCase();
    return lowered.includes(name) || lowered.includes(program.id.toLowerCase());
  });
  if (matched) {
    return [
      `${matched.name} on ${portfolio.clientName}: currently in phase ${matched.currentPhase ?? 'n/a'}, status ${matched.status ?? 'n/a'}, origin ${matched.originSource ?? 'n/a'}.`,
      'Per-program value attainment, gate-confidence, and budget-to-actual are not exposed in the listAtlasPrograms shape today — drill into the program page in Programs for those fields.',
      `Next step: open ${matched.name} in Programs to see the value evidence chain and the next gate.`,
    ].join(' ');
  }
  const sample = programList.slice(0, 3).map((program) => program.name).join(', ');
  return [
    `${portfolio.clientName} has ${programList.length} active programs; the message did not match a specific program ID or name.`,
    programList.length > 0 ? `Candidates from the active set: ${sample}.` : 'No active programs returned for this tenant.',
    'Next step: re-ask with a specific program name and aVa can drill down.',
  ].join(' ');
}

function buildVendorDrilldown(
  portfolio: AtlasPortfolioSummary,
  useCases: AtlasToolResultMap['useCases'],
  message: string,
): string {
  const useCaseList = useCases ?? [];
  const lowered = message.toLowerCase();
  const matchedUseCases = useCaseList.filter((useCase) => {
    const vendor = useCase.vendor?.toLowerCase();
    return Boolean(vendor && lowered.includes(vendor));
  });
  if (matchedUseCases.length > 0) {
    const vendorName = matchedUseCases[0]?.vendor ?? 'this vendor';
    const sampleNames = matchedUseCases.slice(0, 3).map((useCase) => useCase.name).join(', ');
    return [
      `${vendorName} on ${portfolio.clientName}: ${matchedUseCases.length} use case${matchedUseCases.length === 1 ? '' : 's'} in the active sample (${sampleNames}).`,
      'Vendor contract value, renewal window, and concentration weight are not exposed in the listAtlasUseCases shape today — open the Source vendor ledger for the contracted view.',
      `Next step: open ${vendorName} in Source to see the renewal window and contract value before any consolidation decision.`,
    ].join(' ');
  }
  return [
    `${portfolio.clientName} carries ${portfolio.distinctAiVendorsCount ?? 'n/a'} distinct AI vendors; the message did not match a specific vendor name in the active use-case sample.`,
    'Next step: re-ask with a specific vendor name and aVa will drill down against the use-case + signal coverage.',
  ].join(' ');
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

  if (intent === 'shadow_ai_detail' || intent === 'shadow_ai_exposure' || intent === 'signal_detail' || intent === 'signal_drilldown') {
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

  if (intent === 'cohort_position' || intent === 'peer_adoption_compare') {
    const [portfolio, benchmark] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_cohort_benchmarks(ctx, 'adoption_penetration_pct_avg'),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.benchmark = benchmark;
    return {
      response: intent === 'peer_adoption_compare'
        ? buildPeerAdoptionCompare(portfolio, benchmark)
        : buildCohortPosition(portfolio, benchmark),
      suggestions: [
        { label: 'Adoption drag', value: 'What is dragging adoption?', kind: 'message' },
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_cohort_benchmarks'],
      toolResults,
    };
  }

  if (intent === 'cohort_lagging') {
    const [portfolio, benchmark] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_cohort_benchmarks(ctx, 'adoption_penetration_pct_avg'),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.benchmark = benchmark;
    return {
      response: buildCohortLagging(portfolio, benchmark),
      suggestions: [
        { label: 'Peer adoption', value: 'How do we compare to retail peers on adoption?', kind: 'message' },
        { label: 'Value attainment', value: 'Where is value attainment vs commitment?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_cohort_benchmarks'],
      toolResults,
    };
  }

  if (intent === 'industry_leaders') {
    const portfolio = await query_portfolio_aggregates(ctx);
    toolResults.portfolio = portfolio;
    return {
      response: buildIndustryLeaders(portfolio),
      suggestions: [
        { label: 'Industry context', value: 'What are others doing in this industry on AI governance?', kind: 'message' },
        { label: 'Cohort position', value: 'How do we compare to retail peers on adoption?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'lagging_programs_by_value') {
    const portfolio = await query_portfolio_aggregates(ctx);
    toolResults.portfolio = portfolio;
    return {
      response: buildLaggingProgramsByValue(portfolio, towerState),
      suggestions: [
        { label: 'Value vs commitment', value: 'Where is value attainment vs commitment?', kind: 'message' },
        { label: 'At-risk gates', value: 'Which bets are at risk of missing the next gate?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'value_attainment_vs_commitment') {
    const portfolio = await query_portfolio_aggregates(ctx);
    toolResults.portfolio = portfolio;
    return {
      response: buildValueAttainmentVsCommitment(portfolio),
      suggestions: [
        { label: 'Lagging programs', value: 'Show me lagging programs by realized value', kind: 'message' },
        { label: 'Portfolio confidence', value: 'What is the portfolio confidence right now?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'federated_visibility_boundary') {
    const portfolio = await query_portfolio_aggregates(ctx);
    toolResults.portfolio = portfolio;
    return {
      response: buildFederatedVisibilityBoundary(portfolio, towerState),
      suggestions: [
        { label: 'Value posture', value: 'Separate projected, tracked, and verified value for Lakeshore', kind: 'message' },
        { label: 'Governance gaps', value: 'Governance coverage gaps?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'at_risk_gates') {
    const [portfolio, signals, programs] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_signals(ctx, { limit: 5 }),
      query_programs(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.signals = signals;
    toolResults.programs = programs;
    return {
      response: buildAtRiskGates(portfolio, signals, programs),
      suggestions: [
        { label: 'Lagging programs', value: 'Show me lagging programs by realized value', kind: 'message' },
        { label: 'Portfolio confidence', value: 'What is the portfolio confidence right now?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_signals', 'query_programs'],
      toolResults,
    };
  }

  if (intent === 'portfolio_confidence') {
    const portfolio = await query_portfolio_aggregates(ctx);
    toolResults.portfolio = portfolio;
    return {
      response: buildPortfolioConfidence(portfolio, towerState),
      suggestions: [
        { label: 'Lagging programs', value: 'Show me lagging programs by realized value', kind: 'message' },
        { label: 'At-risk gates', value: 'Which bets are at risk of missing the next gate?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'ai_spend_vs_budget') {
    const portfolio = await query_portfolio_aggregates(ctx);
    toolResults.portfolio = portfolio;
    return {
      response: buildAiSpendVsBudget(portfolio),
      suggestions: [
        { label: 'Vendor concentration', value: 'Concentrated vendor risk?', kind: 'message' },
        { label: 'Cost overruns', value: 'Cost overruns by program?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates'],
      toolResults,
    };
  }

  if (intent === 'vendor_concentration_risk') {
    const [portfolio, useCases] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_use_cases(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.useCases = useCases;
    return {
      response: buildVendorConcentrationRisk(portfolio, useCases),
      suggestions: [
        { label: 'AI spend vs budget', value: 'AI spend run-rate vs budget?', kind: 'message' },
        { label: 'Cost overruns', value: 'Cost overruns by program?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_use_cases'],
      toolResults,
    };
  }

  if (intent === 'cost_overruns') {
    const [portfolio, programs] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_programs(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.programs = programs;
    return {
      response: buildCostOverruns(portfolio, programs),
      suggestions: [
        { label: 'AI spend vs budget', value: 'AI spend run-rate vs budget?', kind: 'message' },
        { label: 'Vendor concentration', value: 'Concentrated vendor risk?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_programs'],
      toolResults,
    };
  }

  if (intent === 'governance_coverage_gaps') {
    const [portfolio, signals] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_signals(ctx, { limit: 5 }),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.signals = signals;
    return {
      response: buildGovernanceCoverageGaps(portfolio, signals),
      suggestions: [
        { label: 'Regulatory items', value: 'Open regulatory items?', kind: 'message' },
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_signals'],
      toolResults,
    };
  }

  if (intent === 'regulatory_open_items') {
    const [portfolio, signals] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_signals(ctx, { limit: 5 }),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.signals = signals;
    return {
      response: buildRegulatoryOpenItems(portfolio, signals),
      suggestions: [
        { label: 'Governance gaps', value: 'Governance coverage gaps?', kind: 'message' },
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_signals'],
      toolResults,
    };
  }

  if (intent === 'fund_next_why' || intent === 'kill_next_why' || intent === 'reshape_next_why') {
    const [portfolio, programs] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_programs(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.programs = programs;
    const response = intent === 'fund_next_why'
      ? buildFundNextWhy(portfolio, programs)
      : intent === 'kill_next_why'
        ? buildKillNextWhy(portfolio, programs)
        : buildReshapeNextWhy(portfolio, programs);
    return {
      response,
      suggestions: [
        { label: 'Open Intelligence', value: 'Open in Intelligence', kind: 'link', href: '/intelligence' },
        { label: 'Lagging programs', value: 'Show me lagging programs by realized value', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_programs'],
      toolResults,
    };
  }

  if (intent === 'cut_program_impact' || intent === 'fund_x_vs_y') {
    const [portfolio, programs] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_programs(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.programs = programs;
    return {
      response: intent === 'cut_program_impact'
        ? buildCutProgramImpact(portfolio, programs)
        : buildFundXVsY(portfolio, programs),
      suggestions: [
        { label: 'Open Intelligence', value: 'Open in Intelligence', kind: 'link', href: '/intelligence' },
        { label: 'Program drilldown', value: 'Tell me more about a program', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_programs'],
      toolResults,
    };
  }

  if (intent === 'program_drilldown') {
    const [portfolio, programs] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_programs(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.programs = programs;
    return {
      response: buildProgramDrilldown(portfolio, programs, message),
      suggestions: [
        { label: 'Lagging programs', value: 'Show me lagging programs by realized value', kind: 'message' },
        { label: 'At-risk gates', value: 'Which bets are at risk of missing the next gate?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_programs'],
      toolResults,
    };
  }

  if (intent === 'vendor_drilldown') {
    const [portfolio, useCases] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_use_cases(ctx),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.useCases = useCases;
    return {
      response: buildVendorDrilldown(portfolio, useCases, message),
      suggestions: [
        { label: 'Vendor concentration', value: 'Concentrated vendor risk?', kind: 'message' },
        { label: 'Shadow AI', value: 'Tell me more about Shadow AI', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_use_cases'],
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
      response: buildRoiSummary(portfolio, valueGrounding, message),
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

  if (intent === 'copilot_usage_value') {
    const [portfolio, adoptionBenchmark] = await Promise.all([
      query_portfolio_aggregates(ctx),
      query_cohort_benchmarks(ctx, 'adoption_penetration_pct_avg'),
    ]);
    toolResults.portfolio = portfolio;
    toolResults.benchmark = adoptionBenchmark;
    return {
      response: buildCopilotUsageValueSummary(portfolio, towerState, adoptionBenchmark),
      suggestions: [
        { label: 'Lagging programs', value: 'Show me the lagging programs by realized value', kind: 'message' },
        { label: 'Copilot vs industry', value: 'How does AR-02 compare to industry Copilot adoption?', kind: 'message' },
      ],
      toolsUsed: ['query_tower_current_state', 'query_portfolio_aggregates', 'query_cohort_benchmarks'],
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
        { label: 'Open Intelligence', value: 'Open in Intelligence', kind: 'link', href: '/intelligence' },
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
  base: Omit<AtlasChatResponse, 'routeType' | 'intent' | 'response' | 'suggestions' | 'toolsUsed' | 'atlasMode' | 'fallbackReason'>,
  intent: AtlasIntent,
  payload: Awaited<ReturnType<typeof runScriptedAtlasIntent>>,
): AtlasChatResponse {
  return {
    ...base,
    routeType: intent === 'signal_detail' || intent === 'signal_drilldown' ? 'hybrid' : 'scripted',
    intent,
    response: payload.response,
    suggestions: payload.suggestions,
    signalId: payload.signalId ?? null,
    toolsUsed: payload.toolsUsed,
    atlasMode: 'live',
    fallbackReason: null,
  };
}
