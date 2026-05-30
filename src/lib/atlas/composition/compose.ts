import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import { getArchetype, findArchetypeByLooseMatch } from '@/lib/atlas/iac/retrieval';
import type { InitiativeArchetype, PlanningRange } from '@/lib/atlas/iac/types';
import { getInitiativeDeepView } from '@/lib/atlas/initiative-deep/retrieve';
import type { AtlasTenancyCtx, InitiativeDeepView } from '@/lib/atlas/initiative-deep/types';
import { categoryIdToArchetypeKey } from './category-archetype-map';
import { classifyAtlasIacIntent, type AtlasIacIntent } from './intent';

export interface AtlasIacComposition {
  intent: AtlasIacIntent;
  response: string;
}

export interface ComposeAtlasIacArgs {
  prompt: string;
  tenancy: AtlasTenancyCtx;
  client?: PostgresCompatClient;
}

function rangeText(range: PlanningRange): string {
  const value = range.low === range.high ? `${range.low}` : `${range.low}-${range.high}`;
  return `${value}${range.unit.startsWith('%') ? '' : ' '}${range.unit}`;
}

function latestTenantDate(view: InitiativeDeepView): string {
  const dates = [
    ...view.baselineMetrics.map((m) => m.asOf).filter(Boolean),
    ...view.evidenceAnchors.map((e) => e.date).filter(Boolean),
  ].sort();
  return dates.at(-1) ?? 'the latest tenant ledger';
}

function formatTenantFacts(view: InitiativeDeepView): string {
  const asOf = latestTenantDate(view);
  const metrics = view.baselineMetrics.slice(0, 3).map((metric) => {
    const measured = metric.measured === null ? 'unrecorded' : `${metric.measured}${metric.unit ? ` ${metric.unit}` : ''}`;
    const target = metric.target === null ? 'target unrecorded' : `target ${metric.target}${metric.unit ? ` ${metric.unit}` : ''}`;
    return `${metric.label}: ${measured} (${target}, as of ${metric.asOf || asOf})`;
  });
  const value = view.valueAttestation.attainmentPct === null
    ? 'value attainment is not yet measurable'
    : `value attainment is ${view.valueAttestation.attainmentPct}%`;
  const gates = view.gates.upcoming
    ? `next gate: ${view.gates.upcoming.name}${view.gates.upcoming.dueBy ? ` due ${view.gates.upcoming.dueBy}` : ''}`
    : 'no upcoming gate is recorded';
  return [
    `From your Tower / Source ledger as of ${asOf}: ${view.code} (${view.name}) is ${view.status}, owned by ${view.ownerLabel}.`,
    metrics.length > 0 ? `Baseline: ${metrics.join('; ')}.` : 'Baseline: no KPI baseline is recorded.',
    `Value: ${value}; ${gates}.`,
    view.signals.length > 0 ? `Signals: ${view.signals.slice(0, 2).map((s) => `${s.severity} ${s.summary}`).join('; ')}.` : 'Signals: no linked signals are recorded.',
  ].join(' ');
}

function formatIndustryContext(archetype: InitiativeArchetype): string {
  const metrics = archetype.adoptionMetrics.slice(0, 2).map((metric) =>
    `${metric.metric}: ${rangeText(metric.range)} (${metric.range.source}, ${metric.range.date})`,
  );
  const patterns = archetype.deploymentPatterns.slice(0, 2).map((pattern) =>
    `${pattern.pattern}: ${pattern.description} (${pattern.source}, ${pattern.date})`,
  );
  return [
    `${archetype.label} trend: ${archetype.trendDirection.direction}; driver: ${archetype.trendDirection.named_driver} (${archetype.trendDirection.source}, ${archetype.trendDirection.date}).`,
    metrics.length > 0 ? `Metrics: ${metrics.join('; ')}.` : 'Metrics: no honest adoption metric is published for this archetype yet.',
    `Patterns: ${patterns.join(' ')}`,
    `Industry context refreshed ${archetype.lastReviewed}.`,
  ].join(' ');
}

function formatGap(view: InitiativeDeepView, archetype: InitiativeArchetype): string {
  const pct = view.portfolioPosition.valueAttainmentPercentileInTenant;
  if (pct === null) {
    return `No portfolio percentile is available for ${view.code}; the tenant sample is too small or measured value is missing, so Atlas cannot claim ahead/behind versus peers. Compared with ${archetype.label}, the gap to inspect is whether the tenant has measured adoption and gate evidence before scaling.`;
  }
  if (pct >= 65) {
    return `${view.code} is ahead of most named tenant peers on value attainment (${pct}th percentile). The gap is to prove the same operating controls the ${archetype.label} archetype requires: usage telemetry, gates, and owner accountability.`;
  }
  if (pct <= 35) {
    return `${view.code} is below stronger tenant peers on value attainment (${pct}th percentile). The gap is not an industry claim; it is the tenant evidence gap between recorded value and the rollout patterns visible in ${archetype.label}.`;
  }
  return `${view.code} is in line with the tenant middle on value attainment (${pct}th percentile). The gap is measurement depth: Atlas needs KPI trend and gate evidence before claiming the initiative is ahead of named peers.`;
}

function formatNextMove(view: InitiativeDeepView): string {
  const missingBaseline = view.baselineMetrics.length === 0;
  const missingPercentile = view.portfolioPosition.valueAttainmentPercentileInTenant === null;
  if (missingBaseline) {
    return `Record the initiative baseline KPI and target, then rerun the comparison before scaling ${view.code}.`;
  }
  if (missingPercentile) {
    return `Add measured value for ${view.code} and at least two comparable tenant initiatives so Atlas can compute a portfolio percentile.`;
  }
  return `Use the next governance gate to require owner sign-off on KPI movement and seat/tool telemetry for ${view.code}; expand only if the next ledger refresh improves measured attainment.`;
}

export function resolveArchetypeForView(view: InitiativeDeepView, prompt: string): InitiativeArchetype | null {
  const direct = getArchetype(view.archetypeKey);
  if (direct) return direct;
  const mappedKey = categoryIdToArchetypeKey(view.archetypeKey);
  if (mappedKey) return getArchetype(mappedKey);
  return findArchetypeByLooseMatch(prompt);
}

export function renderHybridAtlasIacAnswer(view: InitiativeDeepView, archetype: InitiativeArchetype): string {
  return [
    `Your data\n${formatTenantFacts(view)}`,
    `Industry context\n${formatIndustryContext(archetype)}`,
    `The gap\n${formatGap(view, archetype)}`,
    `Next move\n${formatNextMove(view)}`,
  ].join('\n\n');
}

export async function composeAtlasIacAnswer(args: ComposeAtlasIacArgs): Promise<AtlasIacComposition | null> {
  const intent = classifyAtlasIacIntent(args.prompt);
  if (intent.kind === 'none') return null;

  if (intent.kind === 'archetype-specific') {
    const archetype = intent.archetypeKey ? getArchetype(intent.archetypeKey) : findArchetypeByLooseMatch(args.prompt);
    if (!archetype) return null;
    return {
      intent,
      response: `Industry context\n${formatIndustryContext(archetype)}`,
    };
  }

  if (!intent.initiativeId) return null;
  const view = await getInitiativeDeepView(intent.initiativeId, args.tenancy, args.client);
  if (!view) {
    return {
      intent,
      response: `Your data\nNo such initiative in your scope: ${intent.initiativeId}. Atlas did not retrieve cross-tenant content.`,
    };
  }

  const archetype = intent.archetypeKey ? getArchetype(intent.archetypeKey) : resolveArchetypeForView(view, args.prompt);
  if (intent.kind === 'hybrid' && archetype) {
    return { intent, response: renderHybridAtlasIacAnswer(view, archetype) };
  }

  return {
    intent,
    response: [
      `Your data\n${formatTenantFacts(view)}`,
      `Next move\n${formatNextMove(view)}`,
    ].join('\n\n'),
  };
}

