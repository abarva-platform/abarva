import 'server-only';

import {
  selectIntelligenceCorpusReadAdapter,
  type CorpusGenomePatternRow,
  type CorpusKnowledgeSourceRow,
  type CorpusUseCaseRow,
  type CorpusContradictionRow,
} from '@/lib/data-plane/read-adapters/intelligenceCorpusReadAdapter';
import type { AttentionItem, PatternRow } from '@/components/intelligence-v3/cxo-fixtures';
import type { RetailIntelligenceStatus } from '@/components/intelligence-v3/types';
import type {
  BriefData,
  EngagementState,
  MapData,
  Pattern,
  Provenance,
  Regulatory,
  UseCase,
  Vendor,
} from '@/lib/knowledge-corpus/types';

interface ClientRow {
  id: string;
  name: string;
  industry_code: string | null;
}

// Row shapes are owned by the Intelligence-corpus read adapter (Slice 5);
// these aliases keep the local names this module already references.
type GenomePatternRow = CorpusGenomePatternRow;
type KnowledgeSourceRow = CorpusKnowledgeSourceRow;
type UseCaseRow = CorpusUseCaseRow;
type ContradictionRow = CorpusContradictionRow;

export interface ApexRetailIntelligenceData {
  status: RetailIntelligenceStatus;
  patterns: PatternRow[];
  todayItems: AttentionItem[];
  mapData: MapData;
  briefData: BriefData;
}

const BRAND = '#0E8C7E';

// ---------------------------------------------------------------------
// Substrate-derived fundability score
// ---------------------------------------------------------------------
//
// Audit 2026-05-22: the loader previously assigned scores as positional
// integers (`78 - index`, `88 - index * 5`, `72 - index * 4`) — the
// ranking was just list order dressed up as analysis. Score is now
// computed from real substrate signals for each use case:
//   · stage maturity      — further-along stages are more fundable now
//   · bound failure patterns — each governed pattern raises confidence
//   · open contradiction  — an unresolved tension is a fundability drag
// The result is clamped to a 0-100 band. It is a deterministic readiness
// proxy, not a forecast — when a real scoring model lands it replaces this.

const STAGE_SCORE: Record<string, number> = {
  realize: 86,
  execute: 80,
  evidence: 72,
  design: 64,
  discovery: 52,
};

function fundabilityScore(
  stage: string,
  boundPatternCount: number,
  hasOpenContradiction: boolean,
): number {
  const base = STAGE_SCORE[stage.toLowerCase()] ?? 50;
  const patternBonus = Math.min(12, boundPatternCount * 4);
  const contradictionPenalty = hasOpenContradiction ? 9 : 0;
  return Math.max(5, Math.min(100, base + patternBonus - contradictionPenalty));
}

function useCaseHasContradiction(
  useCase: UseCaseRow,
  contradictions: ContradictionRow[],
): boolean {
  return contradictions.some((row) =>
    (row.implicated_initiative_refs ?? []).includes(useCase.external_id ?? ''),
  );
}

function boundPatternCount(useCase: UseCaseRow): number {
  return (useCase.metadata?.related_patterns ?? []).length;
}

// Audit 2026-05-22: Apex Retail has no per-use-case value estimate seeded
// in substrate. The loader previously presented hardcoded dollar ranges
// (`$3M-$12M`, `$15M+`, `$3M-$20M annual value`) as if they were tenant
// analysis. They are an illustrative industry band, not an estimate for
// any specific Apex use case — every surface that shows them labels them
// "(illustrative)" so a CXO is never misled. When real value modelling is
// seeded these are replaced with computed per-use-case figures.
const VALUE_BAND_ILLUSTRATIVE = '$3M-$12M';

const PROVENANCE: Provenance = {
  primarySources: [
    {
      source: 'AbarVa Apex Retail intelligence layer',
      currencyDate: '2026-05',
      reliability: 'HIGH',
    },
  ],
  curationPass: 'apex-retail-live-v1',
  notes: 'Composed from Apex Retail patterns, knowledge sources, use cases, open tensions, and portfolio relationships.',
};

export async function loadApexRetailIntelligenceData(
  client: ClientRow | null,
): Promise<ApexRetailIntelligenceData | null> {
  if (!client || normalizeIndustry(client.industry_code) !== 'retail') return null;

  const bundle = await selectIntelligenceCorpusReadAdapter().getCorpusBundle(client.id);
  const patterns = bundle.patterns;
  const sources = bundle.sources;
  const useCases = bundle.useCases;
  const allContradictions = bundle.contradictions;
  const edges = bundle.edges;

  if (patterns.length === 0 || useCases.length === 0) return null;

  const retailPatternCodes = new Set(patterns.map((pattern) => pattern.code));
  const contradictions = allContradictions.filter((row) =>
    (row.related_pattern_ids ?? []).some((code) => retailPatternCodes.has(code)),
  );

  const sourceByKey = new Map(sources.map((source) => [source.source_key, source]));
  const useCaseByExternalId = new Map(
    useCases
      .filter((row) => row.external_id)
      .map((row) => [row.external_id as string, row]),
  );

  const useCasesByPattern = new Map<string, UseCaseRow[]>();
  for (const useCase of useCases) {
    for (const code of useCase.metadata?.related_patterns ?? []) {
      const bucket = useCasesByPattern.get(code) ?? [];
      bucket.push(useCase);
      useCasesByPattern.set(code, bucket);
    }
  }

  for (const edge of edges) {
    if (edge.from_node_type !== 'use_case' || edge.to_node_type !== 'genome_pattern') continue;
    const useCase = useCaseByExternalId.get(edge.from_node_id);
    if (!useCase) continue;
    const bucket = useCasesByPattern.get(edge.to_node_id) ?? [];
    if (!bucket.includes(useCase)) bucket.push(useCase);
    useCasesByPattern.set(edge.to_node_id, bucket);
  }

  const sourcesByPattern = new Map<string, KnowledgeSourceRow[]>();
  for (const edge of edges) {
    if (
      edge.from_node_type !== 'genome_pattern' ||
      edge.to_node_type !== 'knowledge_source' ||
      edge.edge_type !== 'sourced_from'
    ) {
      continue;
    }
    const source = sourceByKey.get(edge.to_node_id);
    if (!source) continue;
    const bucket = sourcesByPattern.get(edge.from_node_id) ?? [];
    bucket.push(source);
    sourcesByPattern.set(edge.from_node_id, bucket);
  }

  const contradictionsByPattern = new Map<string, ContradictionRow[]>();
  for (const contradiction of contradictions) {
    for (const code of contradiction.related_pattern_ids ?? []) {
      const bucket = contradictionsByPattern.get(code) ?? [];
      bucket.push(contradiction);
      contradictionsByPattern.set(code, bucket);
    }
  }

  const patternRows = patterns.map((pattern) =>
    toPatternRow(
      pattern,
      useCasesByPattern.get(pattern.code) ?? [],
      sourcesByPattern.get(pattern.code) ?? [],
      contradictionsByPattern.get(pattern.code) ?? [],
    ),
  );

  // Derived once from the tenant's seeded regulation/framework sources —
  // no longer a hardcoded retail regulatory list (audit 2026-05-22).
  const regulatoryNames = regulatoryNamesFromSources(sources);

  return {
    status: {
      patterns: patterns.length,
      sources: sources.length,
      summarizedSources: sources.filter((source) => Boolean(source.summary)).length,
      useCases: useCases.length,
      contradictions: contradictions.length,
      graphEdges: edges.length,
      runtime: 'supabase',
    },
    patterns: patternRows,
    todayItems: contradictions.slice(0, 3).map(toAttentionItem),
    mapData: buildMapData(client, useCases, contradictions, regulatoryNames),
    briefData: buildBriefData(client, useCases, patterns, sources, contradictions, regulatoryNames),
  };
}

export async function loadApexRetailIntelligenceDataForDemo(): Promise<ApexRetailIntelligenceData | null> {
  const client = await selectIntelligenceCorpusReadAdapter().getApexRetailClient();
  return loadApexRetailIntelligenceData(client);
}

function toPatternRow(
  pattern: GenomePatternRow,
  useCases: UseCaseRow[],
  sources: KnowledgeSourceRow[],
  contradictions: ContradictionRow[],
): PatternRow {
  const failureRate = Number(pattern.failure_rate_pct ?? 0);
  const withPct = Math.max(12, Math.min(95, Math.round(100 - failureRate)));
  const useCaseNames = useCases.slice(0, 4).map((useCase) => useCase.name);
  const sourceTitles = sources.slice(0, 3).map((source) => source.title);
  const contradictionTitles = contradictions
    .slice(0, 2)
    .map((contradiction) => contradiction.short_title ?? contradiction.summary ?? 'Open contradiction');

  return {
    id: pattern.code,
    name: pattern.name,
    description: pattern.summary ?? pattern.description ?? 'Retail failure pattern',
    withLabel: `With controls · ${withPct}% confidence`,
    withoutLabel: `No controls · ${Math.round(failureRate)}% failure`,
    withPct,
    withoutPct: Math.max(5, Math.min(95, Math.round(failureRate))),
    bindsTo: useCaseNames.length > 0 ? useCaseNames.slice(0, 2).join(' · ') : 'Retail AI portfolio',
    officeCategory: pattern.office_category ?? undefined,
    failureRatePct: failureRate,
    sourceTitles,
    contradictionTitles,
    useCaseNames,
  };
}

function toAttentionItem(row: ContradictionRow): AttentionItem {
  const tone = row.severity === 'high' ? 'urgent' : row.severity === 'medium' ? 'attn' : 'opp';
  return {
    tone,
    toneLabel: row.severity === 'high' ? 'Urgent' : row.severity === 'medium' ? 'Attention' : 'Opportunity',
    title: row.short_title ?? row.summary ?? 'Open Apex Retail contradiction',
    body: row.summary ?? row.long_description ?? 'Sentinel surfaced an unresolved CXO tension in the Apex Retail AI portfolio.',
    dependency: categoryLabel(row.category),
  };
}

function buildMapData(
  client: ClientRow,
  useCases: UseCaseRow[],
  contradictions: ContradictionRow[],
  regulatoryNames: string[],
): MapData {
  const nodes = useCases.map((row, index) => {
    const useCase = toUseCase(row, index, regulatoryNames);
    const engagementState = stageToEngagement(row.stage, contradictions, row.external_id);
    return {
      useCase,
      x: 14 + ((index * 17) % 72),
      y: 10 + ((index * 23) % 78),
      r: engagementState === 'at_risk' ? 18 : engagementState === 'in_flight' ? 16 : 13,
      engagementState,
      initiativeDisplayId: row.external_id?.replace('apex_retail_', 'AR-').toUpperCase(),
      score: fundabilityScore(
        row.stage,
        boundPatternCount(row),
        useCaseHasContradiction(row, contradictions),
      ),
    };
  });

  return {
    tenantName: client.name,
    tenantBrandColor: BRAND,
    industry: 'retail',
    totalUseCases: nodes.length,
    inFlightCount: nodes.filter((node) => node.engagementState === 'in_flight').length,
    atRiskCount: nodes.filter((node) => node.engagementState === 'at_risk').length,
    candidateCount: nodes.filter((node) => node.engagementState === 'not_started').length,
    refreshedLabel: '2026-05',
    whatChanged: contradictions.slice(0, 3).map((row) => ({
      entityId: row.severity.toUpperCase(),
      entityType: 'pattern' as const,
      summary: row.short_title ?? row.summary ?? 'Apex contradiction refreshed',
      source: 'Apex Retail open tensions',
    })),
    nodes,
    edges: nodes.slice(1).map((node, index) => ({
      fromUseCaseId: nodes[index]?.useCase.id ?? node.useCase.id,
      toUseCaseId: node.useCase.id,
      basis: 'pattern_cooccurrence',
    })),
    defaultSelectedId: nodes[0]?.useCase.id ?? 'UC-RET-001',
  };
}

function buildBriefData(
  client: ClientRow,
  useCases: UseCaseRow[],
  patterns: GenomePatternRow[],
  sources: KnowledgeSourceRow[],
  contradictions: ContradictionRow[],
  regulatoryNames: string[],
): BriefData {
  const patternByCode = new Map(patterns.map((pattern) => [pattern.code, pattern]));
  const topUseCases = useCases.slice(0, 3);
  const topPatterns = ['F200', 'F215', 'F233']
    .map((code) => patternByCode.get(code))
    .filter((value): value is GenomePatternRow => Boolean(value));

  return {
    tenantName: client.name,
    tenantBrandColor: BRAND,
    industry: 'retail',
    composedAt: new Date().toISOString(),
    synthesis:
      'Sentinel sees three Apex Retail priorities above the line: fix customer identity before scaling loyalty AI, prove demand-sensing data readiness before committing forecast lift, and keep the AI roadmap honest about platform prerequisites. This is not an idea shortage; it is a sequencing and accountability decision.',
    bets: topUseCases.map((useCase, index) => {
      const relatedPatternCodes = useCase.metadata?.related_patterns ?? [];
      const bindingPatterns = relatedPatternCodes
        .map((code) => patternByCode.get(code))
        .filter((value): value is GenomePatternRow => Boolean(value))
        .slice(0, 3);
      // Score + score factors are both computed from the same real
      // substrate signals (audit 2026-05-22) — stage maturity, bound
      // failure patterns, open-contradiction exposure — so the factor
      // deltas actually reconcile to the headline score.
      const hasContradiction = useCaseHasContradiction(useCase, contradictions);
      const stageDelta = STAGE_SCORE[useCase.stage.toLowerCase()] ?? 50;
      const patternDelta = Math.min(12, bindingPatterns.length * 4);
      const contradictionDelta = hasContradiction ? -9 : 0;
      const score = Math.max(5, Math.min(100, stageDelta + patternDelta + contradictionDelta));
      return {
        rank: index + 1,
        useCase: toUseCase(useCase, index, regulatoryNames),
        score,
        scoreFactors: [
          { name: `Use-case stage · ${useCase.stage}`, delta: stageDelta },
          { name: `Retail failure patterns bound (${bindingPatterns.length})`, delta: patternDelta },
          ...(hasContradiction
            ? [{ name: 'Open contradiction exposure', delta: contradictionDelta, isWarning: true }]
            : []),
        ],
        engagementState: stageToEngagement(useCase.stage, contradictions, useCase.external_id),
        initiativeDisplayId: useCase.external_id?.replace('apex_retail_', 'AR-').toUpperCase(),
        decision: {
          kind: index === 0 ? 'originate' : 'evaluate',
          label: index === 0 ? 'Originate now' : 'Evaluate next',
          reason: index === 0 ? 'Highest CXO tension · clear pattern binding' : 'Good candidate once readiness is explicit',
        },
        bindingPatterns: bindingPatterns.map((pattern) => ({
          pattern: toKnowledgePattern(pattern),
          quantifiedRow: {
            withLabel: 'Governed',
            withoutLabel: `${Math.round(Number(pattern.failure_rate_pct ?? 0))}% fail`,
            description: pattern.summary ?? pattern.description ?? pattern.name,
            source: 'Retail pattern library',
          },
        })),
        antiPatterns: [],
        vendors: toVendors(useCase.vendor),
        regulatory: toRegulatory(sources),
      };
    }),
    belowTheLine: useCases.slice(3, 8).map((useCase, index) => ({
      rank: index + 4,
      useCaseId: toUseCaseId(useCase, index + 4),
      useCaseName: useCase.name,
      score: fundabilityScore(
        useCase.stage,
        boundPatternCount(useCase),
        useCaseHasContradiction(useCase, contradictions),
      ),
      state: useCase.stage === 'evidence' || useCase.stage === 'design' ? 'in_portfolio' : 'candidate',
      initiativeDisplayId: useCase.external_id?.replace('apex_retail_', 'AR-').toUpperCase(),
      // Illustrative band — not a tenant-specific estimate. See VALUE_BAND
      // note: no per-use-case value is seeded for Apex Retail yet.
      valueLabel: `${VALUE_BAND_ILLUSTRATIVE} (illustrative)`,
      ttvLabel: '6-12 mo (illustrative)',
      hint: useCase.domain ?? 'Retail AI candidate',
    })),
    patternsTriggered: topPatterns.map((pattern) => ({
      pattern: toKnowledgePattern(pattern),
      issue: pattern.summary ?? pattern.description ?? pattern.name,
      recommendedAction: 'Bind this pattern to the relevant Apex use case before approving the next quarter roadmap.',
      cta: { primary: { label: 'Review pattern', href: `/intelligence#patterns` } },
    })),
    proofPoints: [],
    totals: {
      totalUseCases: useCases.length,
      totalPatterns: patterns.length,
      totalVendors: 5,
      totalRegulatory: sources.filter((source) => source.content_type === 'regulation' || source.content_type === 'framework').length,
      refreshCadence: 'monthly intelligence refresh',
      lastRefreshQuarter: '2026-Q2',
    },
  };
}

// Regulatory context for a use case. Audit 2026-05-22: the loader
// previously hardcoded `['CCPA', 'PCI DSS v4.0', 'FTC dark patterns
// guidance']` on every Apex use case regardless of what was seeded.
// We now derive the applicable list from the tenant's seeded regulation /
// framework knowledge sources; only when none are seeded do we fall back
// to a clearly-generic retail-baseline list.
function regulatoryNamesFromSources(sources: KnowledgeSourceRow[]): string[] {
  const seeded = sources
    .filter((s) => s.content_type === 'regulation' || s.content_type === 'framework')
    .map((s) => s.title);
  if (seeded.length > 0) return seeded.slice(0, 5);
  return ['Retail data-privacy baseline (illustrative)'];
}

function toUseCase(row: UseCaseRow, index: number, regulatoryNames: string[]): UseCase {
  const office = officeFor(row);
  return {
    id: toUseCaseId(row, index),
    name: row.name,
    displayNameShort: row.name,
    industry: 'retail',
    office,
    domainTags: [row.domain ?? 'retail_ai', row.business_unit ?? 'Apex Retail'],
    problemStatement: row.description ?? row.scope ?? row.name,
    artOfPossibleFraming: row.scope ?? row.description ?? row.name,
    // Illustrative bands — no per-use-case value is seeded for Apex Retail
    // (audit 2026-05-22). Labelled so they read as a reference band, not a
    // tenant-specific estimate.
    businessValueRanges: {
      perCompanySize: { veryLarge: `${VALUE_BAND_ILLUSTRATIVE} annual value (illustrative)` },
      timeToValueMonths: '6-12',
      paybackMonths: '9-15',
      confidenceBand: 'LOW',
    },
    lifecycleStage: row.stage === 'execute' || row.stage === 'realize' ? 'scaling' : 'emerging',
    lifecycleBasis: 'Apex Retail use-case portfolio',
    successPatterns: (row.metadata?.related_patterns ?? []).map((patternId) => ({ patternId, relevance: 'HIGH' })),
    vendorLandscape: {
      incumbent: splitVendor(row.vendor).slice(0, 1),
      challenger: splitVendor(row.vendor).slice(1, 3),
      emerging: [],
    },
    siLandscape: { crediblePractice: ['AbarVa'], emergingPractice: [] },
    regulatoryContext: { applicable: regulatoryNames },
    benchmarkMetrics: {
      primary: [{ kpi: row.domain ?? 'Retail value', industryMedian: `${VALUE_BAND_ILLUSTRATIVE} (illustrative)`, topQuartile: '$15M+ (illustrative)' }],
    },
    provenance: PROVENANCE,
    lastRefreshed: '2026-05-09',
    refreshCadence: 'monthly',
  };
}

function toKnowledgePattern(row: GenomePatternRow): Pattern {
  return {
    id: row.code,
    name: row.name,
    scope: 'industry_specific',
    applicableIndustries: ['retail'],
    patternType: 'failure',
    description: row.summary ?? row.description ?? row.name,
    evidenceBasis: {
      observedInUseCases: [],
      observationCount: 'Composite retail seed',
      confidence: 'MED',
    },
    quantifiedSignal: {
      withPattern: { metric: 'readiness confidence', valueRange: '70-90%' },
      withoutPattern: { metric: 'failure rate', valueRange: `${Math.round(Number(row.failure_rate_pct ?? 0))}%` },
      source: 'Retail pattern library',
      confidence: 'MED',
    },
    failureConsequence: row.description ?? undefined,
    recommendedResponse: 'Bind ownership, readiness, source evidence, and CXO decision rights before scale.',
    provenance: PROVENANCE,
    lastRefreshed: '2026-05-09',
    refreshCadence: 'monthly',
  };
}

function toVendors(raw: string | null): Array<{ vendor: Vendor; tier: 'incumbent' | 'challenger' | 'emerging'; healthLabel: string; isCurrent?: boolean }> {
  return splitVendor(raw).slice(0, 3).map((name, index) => ({
    vendor: {
      id: `V-RET-${index + 1}`,
      name,
      productLines: [{ productName: name, servesUseCases: [] }],
      vendorType: index === 0 ? 'incumbent' : 'challenger',
      financialHealth: 'strong',
      shareTrajectory: 'holding',
      trajectorySignalBasis: 'Apex Retail seed',
      provenance: PROVENANCE,
      lastRefreshed: '2026-05-09',
      refreshCadence: 'quarterly',
    },
    tier: index === 0 ? 'incumbent' : 'challenger',
    healthLabel: 'Seeded · review',
    isCurrent: index === 0,
  }));
}

function toRegulatory(sources: KnowledgeSourceRow[]): Array<{ regulatory: Regulatory; currencyDate: string }> {
  return sources
    .filter((source) => source.content_type === 'regulation' || source.content_type === 'framework')
    .slice(0, 3)
    .map((source, index) => ({
      regulatory: {
        id: `REG-RET-${index + 1}`,
        name: source.title,
        jurisdiction: 'US',
        issuingBody: source.publisher,
        applicableIndustries: ['retail'],
        summary: source.summary ?? source.title,
        keyRequirements: [source.summary ?? source.title],
        provenance: PROVENANCE,
        lastRefreshed: '2026-05-09',
        refreshCadence: 'quarterly',
      },
      currencyDate: '2026-05',
    }));
}

function toUseCaseId(row: UseCaseRow, index: number): string {
  return row.external_id?.replace('apex_retail_', 'UC-RET-').toUpperCase() ?? `UC-RET-${String(index + 1).padStart(3, '0')}`;
}

function officeFor(row: UseCaseRow): 'front' | 'middle' | 'back' {
  const text = `${row.business_unit ?? ''} ${row.domain ?? ''}`.toLowerCase();
  if (text.includes('marketing') || text.includes('commerce') || text.includes('customer') || text.includes('loyalty')) return 'front';
  if (text.includes('merchandising') || text.includes('supply') || text.includes('asset') || text.includes('procurement')) return 'middle';
  return 'back';
}

function stageToEngagement(
  stage: string,
  contradictions: ContradictionRow[],
  externalId: string | null,
): EngagementState {
  const hasContradiction = contradictions.some((row) => (row.implicated_initiative_refs ?? []).includes(externalId ?? ''));
  if (hasContradiction) return 'at_risk';
  if (stage === 'evidence' || stage === 'design') return 'in_flight';
  if (stage === 'execute' || stage === 'realize') return 'scaled';
  return 'not_started';
}

function splitVendor(raw: string | null): string[] {
  return (raw ?? 'AbarVa')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeIndustry(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function categoryLabel(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.replace(/^[A-E]_/, '').replace(/_/g, ' ');
}
