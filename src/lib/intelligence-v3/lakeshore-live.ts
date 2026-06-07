import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { selectRelevantPatternRows } from '@/lib/intelligence-v3/pattern-relevance';
import {
  type PatternNamespace,
  type GroundingDiagnostic,
  filterToGrounding,
  groundingNamespaceForText,
  recordGroundingDiagnostics,
} from '@/lib/intelligence-v3/pattern-grounding';
import type {
  AntiPattern,
  BriefData,
  MapData,
  Pattern,
  Provenance,
  Regulatory,
  UseCase,
  Vendor,
} from '@/lib/knowledge-corpus/types';

interface ClientRow {
  id: string;
  key?: string | null;
  name: string;
}

interface CorpusPatternRow {
  slug: string;
  title: string;
  category: string | null;
  confidence: string | number | null;
  depth_score: string | number | null;
  vertical_overlays: string[] | null;
  region_overlays: string[] | null;
  published_at: string | null;
}

interface GenomePatternRow {
  code: string;
  name: string;
  sub_category: string | null;
  tags: string[] | null;
  keywords: string[] | null;
  confidence: string | number | null;
}

// A namespace-tagged candidate normalized to the relevance row shape
// (title/category/vertical_overlays/depth_score) so selectRelevantPatternRows
// can rank corpus and genome candidates with the same code path.
interface GroundedCandidate {
  namespace: PatternNamespace;
  id: string; // emitted id: PAT-LSH-* (corpus) or LSH-TMS-* (genome)
  title: string;
  category: string | null;
  vertical_overlays: string[] | null;
  depth_score: string | number | null;
  confidence: string | number | null;
}

interface InitiativeRow {
  initiative_id: string;
  display_id: string | null;
  name: string;
  description: string | null;
  stage: string | null;
  owner_title: string | null;
  committed_annual_usd: string | number | null;
  measured_value_usd: string | number | null;
  status_flag: string | null;
  status_summary: string | null;
  confidence_level: string | null;
}

const BRAND = '#2563EB';
const REFRESHED = '2026-Q2';

function provenance(source: string): Provenance {
  return {
    primarySources: [
      {
        source,
        currencyDate: REFRESHED,
        reliability: 'HIGH',
      },
    ],
    curationPass: 'lakeshore-live-corpus-v1',
    notes:
      'Derived at runtime from live Lakeshore corpus_patterns rows and loaded Lakeshore initiative substrate.',
  };
}

function money(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyLabel(value: number): string {
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function domainFromCategory(category: string | null, slug: string): string {
  const fromCategory = category?.match(/D\d{2}/i)?.[0];
  if (fromCategory) return fromCategory.toUpperCase();
  const fromSlug = slug.match(/d\d{2}/i)?.[0];
  return fromSlug ? fromSlug.toUpperCase() : 'D01';
}

function officeForDomain(domain: string): 'front' | 'middle' | 'back' {
  if (['D02', 'D03', 'D04', 'D05', 'D13', 'D17', 'D18'].includes(domain)) return 'front';
  if (['D06', 'D07', 'D15', 'D16'].includes(domain)) return 'middle';
  return 'back';
}

function lifecycleForStage(stage: string | null): 'emerging' | 'scaling' | 'mature' | 'declining' {
  const normalized = stage?.toLowerCase() ?? '';
  if (normalized.includes('scale') || normalized.includes('pilot')) return 'scaling';
  if (normalized.includes('mature')) return 'mature';
  if (normalized.includes('retire')) return 'declining';
  return 'emerging';
}

function engagementForStatus(status: string | null): 'not_started' | 'in_flight' | 'scaled' | 'failed' | 'at_risk' {
  const normalized = status?.toLowerCase() ?? '';
  if (normalized.includes('risk') || normalized.includes('blocked') || normalized.includes('watch')) return 'at_risk';
  if (normalized.includes('scale')) return 'scaled';
  if (normalized.includes('fail')) return 'failed';
  return 'in_flight';
}

function buildPattern(row: CorpusPatternRow, useCaseIds: string[]): Pattern {
  const domain = domainFromCategory(row.category, row.slug);
  return {
    id: row.slug.toUpperCase(),
    name: row.title,
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      `${row.title}. This is a Lakeshore private-holdings decision pattern loaded from the governed corpus, with category ${row.category ?? domain}.`,
    evidenceBasis: {
      observedInUseCases: useCaseIds,
      observationCount: 'Live Lakeshore corpus pattern row',
      confidence: Number(row.confidence ?? 0) >= 0.9 ? 'HIGH' : 'MED',
    },
    recommendedResponse:
      'Use this pattern as a decision check before advancing the related portfolio initiative or Source event.',
    relatedPatterns: [],
    provenance: provenance(`corpus_patterns:${row.slug}`),
    lastRefreshed: '2026-06-04',
    refreshCadence: 'quarterly',
  };
}

function corpusCandidate(row: CorpusPatternRow): GroundedCandidate {
  return {
    namespace: 'corpus-pat-lsh',
    id: row.slug.toUpperCase(),
    title: row.title,
    category: row.category,
    vertical_overlays: row.vertical_overlays,
    depth_score: row.depth_score,
    confidence: row.confidence,
  };
}

function genomeCandidate(row: GenomePatternRow): GroundedCandidate {
  return {
    namespace: 'genome-lsh-tms',
    id: row.code.toUpperCase(),
    title: row.name,
    category: row.sub_category,
    vertical_overlays: row.tags ?? row.keywords ?? null,
    depth_score: row.confidence,
    confidence: row.confidence,
  };
}

// Build a Pattern from a namespace-tagged candidate. The emitted `id` is the
// candidate's own namespace id (PAT-LSH-* or LSH-TMS-*) and the provenance names
// the source table, so a card's citation always traces to the right namespace.
function buildGroundedPattern(candidate: GroundedCandidate, useCaseIds: string[]): Pattern {
  const isGenome = candidate.namespace === 'genome-lsh-tms';
  const domain = isGenome ? 'TMS' : domainFromCategory(candidate.category, candidate.id);
  const sourceTable = isGenome ? 'genome_patterns' : 'corpus_patterns';
  const sourceRef = isGenome ? candidate.id : candidate.id.toLowerCase();
  return {
    id: candidate.id,
    name: candidate.title,
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      `${candidate.title}. This is a Lakeshore ${isGenome ? 'treasury/Kyriba (LSH-TMS)' : 'private-holdings'} decision pattern loaded from the governed ${sourceTable} namespace, with category ${candidate.category ?? domain}.`,
    evidenceBasis: {
      observedInUseCases: useCaseIds,
      observationCount: `Live Lakeshore ${sourceTable} row`,
      confidence: Number(candidate.confidence ?? 0) >= 0.9 ? 'HIGH' : 'MED',
    },
    recommendedResponse:
      'Use this pattern as a decision check before advancing the related portfolio initiative or Source event.',
    relatedPatterns: [],
    provenance: provenance(`${sourceTable}:${sourceRef}`),
    lastRefreshed: '2026-06-04',
    refreshCadence: 'quarterly',
  };
}

/**
 * Bind the patterns for a single decision card, scoped to that card's grounding
 * namespace. Picks the relevant candidate(s) from ONLY the grounding namespace's
 * pool, then applies the grounding guard as a backstop (dropping any id that is
 * not in the active namespace — even if it is a valid id elsewhere) and records a
 * diagnostic for each rejection. Returns [] (fail closed) when nothing relevant
 * clears threshold, so a card binds a real on-namespace pattern or none.
 */
function bindGroundedPatterns(
  cardText: string,
  corpusPool: readonly GroundedCandidate[],
  tmsPool: readonly GroundedCandidate[],
  useCaseIds: string[],
  limit = 2,
): { grounding: PatternNamespace; patterns: Pattern[]; diagnostics: GroundingDiagnostic[] } {
  const grounding = groundingNamespaceForText(cardText);
  const pool = grounding === 'genome-lsh-tms' ? tmsPool : corpusPool;
  const selected = selectRelevantPatternRows(cardText, pool, limit);
  const diagnostics: GroundingDiagnostic[] = [];
  const patterns = filterToGrounding(selected, (c) => c.id, grounding, diagnostics).map((c) =>
    buildGroundedPattern(c, useCaseIds),
  );
  return { grounding, patterns, diagnostics };
}

function buildUseCase(row: InitiativeRow, index: number, patterns: Pattern[]): UseCase {
  const committed = money(row.committed_annual_usd);
  const measured = money(row.measured_value_usd);
  const id = `UC-LSH-${String(index + 1).padStart(3, '0')}`;
  const primaryPattern = patterns[index % Math.max(patterns.length, 1)]?.id;
  return {
    id,
    name: row.name,
    displayNameShort: row.display_id ?? row.initiative_id,
    industry: 'finserv',
    office: officeForDomain(primaryPattern?.match(/D\d{2}/)?.[0] ?? 'D14'),
    domainTags: ['private_holdings', 'lakeshore', row.owner_title ?? 'portfolio'],
    problemStatement:
      row.description ?? `${row.name} needs decision-grade evidence across Lakeshore's multi-entity portfolio.`,
    artOfPossibleFraming:
      row.status_summary ?? `${row.name} is a governed Lakeshore initiative tied to loaded portfolio substrate.`,
    businessValueRanges: {
      perCompanySize: {
        mid: `${moneyLabel(committed)} committed annual value`,
        large: `${moneyLabel(measured || committed)} projected or measured value`,
      },
      timeToValueMonths: '6-18',
      confidenceBand: row.confidence_level?.toUpperCase() === 'HIGH' ? 'HIGH' : 'MED',
    },
    lifecycleStage: lifecycleForStage(row.stage),
    successPatterns: patterns.slice(0, 3).map((pattern) => ({
      patternId: pattern.id,
      relevance: 'HIGH',
    })),
    vendorLandscape: {
      incumbent: ['Current Lakeshore platform estate'],
      challenger: [],
      emerging: [],
    },
    siLandscape: {
      crediblePractice: ['portfolio transformation office', 'treasury and data-platform delivery'],
      emergingPractice: ['agentic decision-support with governed evidence'],
    },
    regulatoryContext: {
      applicable: ['Multi-entity governance', 'Treasury controls', 'AI decision-support review'],
    },
    benchmarkMetrics: {
      primary: [
        { kpi: 'Committed annual value', industryMedian: moneyLabel(committed), leadingIndicator: false },
        { kpi: 'Projected or measured value', industryMedian: moneyLabel(measured || committed), leadingIndicator: true },
      ],
    },
    provenance: provenance(`ai_initiatives:${row.initiative_id}`),
    lastRefreshed: '2026-06-04',
    refreshCadence: 'quarterly',
  };
}

function buildAntiPattern(pattern: Pattern, index: number): AntiPattern {
  return {
    id: `AP-LSH-${String(index + 1).padStart(3, '0')}`,
    name: `${pattern.name} ignored`,
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    relatedToPattern: pattern.id,
    description:
      `Lakeshore advances a decision without applying the pattern "${pattern.name}", leaving the operating or governance exception unresolved.`,
    observedInUseCases: pattern.evidenceBasis.observedInUseCases,
    observationCount: 'Derived from live Lakeshore pattern and initiative linkage',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Decision quality', valueRange: 'Exception unresolved' },
      withoutAntiPattern: { metric: 'Decision quality', valueRange: 'Evidence and owner named' },
      source: pattern.provenance.primarySources[0]?.source ?? 'lakeshore corpus',
      confidence: 'MED',
    },
    earlySignals: [
      { signal: 'Pattern is cited after the gate instead of before the decision', severity: 'HIGH' },
    ],
    typicalRecovery:
      'Reopen the gate, assign the decision owner, and attach the missing evidence before executive approval.',
    preventionPatterns: [pattern.id],
    provenance: pattern.provenance,
    lastRefreshed: '2026-06-04',
  };
}

const CONTROL_VENDOR: Vendor = {
  id: 'V-LSH-CONTROL-PLANE',
  name: 'Lakeshore governed platform estate',
  productLines: [
    { productName: 'Treasury, portfolio reporting, and evidence spine', servesUseCases: [] },
  ],
  vendorType: 'incumbent',
  financialHealth: 'moderate',
  shareTrajectory: 'holding',
  trajectorySignalBasis: 'Loaded Lakeshore substrate names portfolio systems and Source/Tower evidence paths.',
  contractPatterns: {
    pricingModels: ['portfolio platform run-rate', 'implementation services'],
    negotiationLevers: 'Tie renewal and implementation spend to evidence readiness and decision adoption.',
  },
  provenance: provenance('lakeshore product substrate'),
  lastRefreshed: '2026-06-04',
  refreshCadence: 'quarterly',
};

const GOVERNANCE_REGULATORY: Regulatory = {
  id: 'REG-LSH-GOV-001',
  name: 'HoldCo treasury and AI decision-support governance',
  jurisdiction: 'United States, Illinois, and portfolio-company operating jurisdictions',
  issuingBody: 'Internal governance, accounting, tax, and AI decision-support controls',
  applicableIndustries: ['finserv'],
  summary:
    'Lakeshore decisions must preserve multi-entity governance, treasury controls, audit evidence, and human approval for AI-assisted recommendations.',
  keyRequirements: [
    'Named decision owner before material action',
    'Evidence trace for value and risk claims',
    'Human approval before external action or spend commitment',
  ],
  provenance: provenance('lakeshore governance substrate'),
  lastRefreshed: '2026-06-04',
  refreshCadence: 'quarterly',
};

export async function loadLakeshoreIntelligenceData(client: ClientRow): Promise<{ mapData: MapData; briefData: BriefData } | null> {
  const [patternRows, tmsRows, initiativeRows] = await Promise.all([
    azureRead.query<CorpusPatternRow>(
      `SELECT slug, title, category, confidence, depth_score, vertical_overlays, region_overlays, published_at
       FROM corpus_patterns
       WHERE slug LIKE 'pat-lsh-%'
         AND status = 'published'
         AND retired_at IS NULL
       ORDER BY depth_score DESC NULLS LAST, published_at DESC NULLS LAST, slug ASC
       LIMIT 24`,
    ),
    // Treasury/Kyriba grounding namespace (genome LSH-TMS-*, served by the
    // lakeshore-patterns-v1 index). Loaded so treasury cards bind a real
    // on-namespace pattern instead of an off-namespace corpus pattern.
    azureRead.query<GenomePatternRow>(
      `SELECT code, name, sub_category, tags, keywords, confidence
       FROM genome_patterns
       WHERE code LIKE 'LSH-TMS-%'
       ORDER BY code ASC
       LIMIT 24`,
    ),
    azureRead.query<InitiativeRow>(
      `SELECT initiative_id, display_id, name, description, stage, owner_title,
              committed_annual_usd, measured_value_usd, status_flag, status_summary, confidence_level
       FROM ai_initiatives
       WHERE client_id = $1
       ORDER BY measured_value_usd DESC NULLS LAST, committed_annual_usd DESC NULLS LAST, display_id ASC
       LIMIT 8`,
      [client.id],
    ),
  ]);

  if (patternRows.length === 0 || initiativeRows.length === 0) return null;

  const seedUseCaseIds = initiativeRows.slice(0, 6).map((_, index) => `UC-LSH-${String(index + 1).padStart(3, '0')}`);
  const patterns = patternRows.slice(0, 6).map((row) => buildPattern(row, seedUseCaseIds));

  // Namespace-scoped candidate pools for per-card grounding (corpus pat-lsh vs
  // genome LSH-TMS). Anti-patterns are now derived per card from the bound
  // grounded pattern, so there is no brief-wide anti-pattern array.
  const corpusPool = patternRows.map(corpusCandidate);
  const tmsPool = tmsRows.map(genomeCandidate);
  const useCases = initiativeRows.slice(0, 6).map((row, index) => buildUseCase(row, index, patterns));
  CONTROL_VENDOR.productLines[0]!.servesUseCases = useCases.map((useCase) => useCase.id);

  const nodes = useCases.map((useCase, index) => ({
    useCase,
    x: 20 + index * 11,
    y: 82 - index * 7,
    r: 18 - Math.min(index, 5),
    engagementState: engagementForStatus(initiativeRows[index]?.status_flag ?? null),
    initiativeDisplayId: initiativeRows[index]?.display_id ?? undefined,
    score: 90 - index * 4,
  }));

  const totalProjected = initiativeRows.reduce((sum, row) => sum + money(row.measured_value_usd || row.committed_annual_usd), 0);
  const totalCommitted = initiativeRows.reduce((sum, row) => sum + money(row.committed_annual_usd), 0);

  const mapData: MapData = {
    tenantName: client.name,
    tenantBrandColor: BRAND,
    industry: 'finserv',
    totalUseCases: useCases.length,
    inFlightCount: useCases.length,
    atRiskCount: nodes.filter((node) => node.engagementState === 'at_risk').length,
    candidateCount: 0,
    refreshedLabel: '2026-Q2',
    whatChanged: patterns.slice(0, 4).map((pattern) => ({
      entityId: pattern.id,
      entityType: 'pattern',
      summary: pattern.name,
      source: pattern.provenance.primarySources[0]?.source ?? 'lakeshore corpus',
    })),
    nodes,
    edges: nodes.slice(1).map((node, index) => ({
      fromUseCaseId: nodes[index]!.useCase.id,
      toUseCaseId: node.useCase.id,
      basis: 'pattern_cooccurrence',
      patternId: patterns[index % patterns.length]!.id,
    })),
    defaultSelectedId: nodes[0]!.useCase.id,
  };

  const briefData: BriefData = {
    tenantName: client.name,
    tenantBrandColor: BRAND,
    industry: 'finserv',
    composedAt: '2026-06-04T00:00:00.000Z',
    synthesis:
      `Lakeshore's Intelligence brief is now bound to live Lakeshore substrate: ${patternRows.length} high-depth decision patterns in the current view, ${initiativeRows.length} loaded initiatives, and no Apex/Meridian fixture content. The strongest proof points are Treasury/Kyriba, the shared data evidence spine, and portfolio modernization bets that require named owners and evidence before decisions move.`,
    valueAtStake: [
      { label: 'Projected portfolio value', value: moneyLabel(totalProjected), captured: 35, blocked: 20, candidate: 25, tone: 'teal' },
      { label: 'Committed annual value', value: moneyLabel(totalCommitted), captured: 30, blocked: 15, candidate: 20, tone: 'navy' },
      { label: 'Evidence-gated decisions', value: `${patterns.length} patterns active`, captured: 25, blocked: 25, candidate: 30, tone: 'amber' },
    ],
    openTensions: [
      {
        title: 'Permanent-capital patience vs. operating proof',
        body: 'Lakeshore can hold through cycles, but the AI portfolio still needs owner-named evidence before executive decisions move.',
        severity: 'amber',
      },
      {
        title: 'Treasury modernization vs. multi-entity controls',
        body: 'Kyriba and data-spine benefits are most credible when intercompany, bank-connectivity, and governance evidence stay attached.',
        severity: 'red',
      },
    ],
    bets: useCases.slice(0, 3).map((useCase, index) => {
      // Decision-card grounding: bind patterns ONLY from this card's grounding
      // namespace (treasury/Kyriba → genome LSH-TMS; otherwise corpus pat-lsh).
      // A valid id from the wrong namespace (e.g. PAT-LSH-D18-00479 on a Kyriba
      // card) is rejected by the guard even though it exists in corpus_patterns.
      const cardText = `${initiativeRows[index]?.name ?? useCase.name} ${initiativeRows[index]?.description ?? ''} ${useCase.problemStatement ?? ''}`;
      const bound = bindGroundedPatterns(cardText, corpusPool, tmsPool, seedUseCaseIds);
      recordGroundingDiagnostics(`lakeshore-bet:${useCase.id}`, bound.diagnostics);

      const boundPattern = bound.patterns[0];
      const cardAntiPatterns = boundPattern ? [buildAntiPattern(boundPattern, index)] : [];

      // Citations/evidence on this card may only reference ids in the grounding
      // namespace — re-validate the use case's successPatterns the same way.
      const successDiag: GroundingDiagnostic[] = [];
      const groundedSuccess = filterToGrounding(
        useCase.successPatterns,
        (sp) => sp.patternId,
        bound.grounding,
        successDiag,
      );
      recordGroundingDiagnostics(`lakeshore-bet-success:${useCase.id}`, successDiag);
      const cardSuccessPatterns = bound.patterns.length
        ? bound.patterns.map((p) => ({ patternId: p.id, relevance: 'HIGH' as const }))
        : groundedSuccess;

      return {
        rank: index + 1,
        useCase: { ...useCase, successPatterns: cardSuccessPatterns },
        score: 90 - index * 4,
        scoreFactors: [
          { name: 'Loaded Lakeshore initiative substrate', delta: 24 },
          {
            name:
              bound.grounding === 'genome-lsh-tms'
                ? 'Bound to live Lakeshore treasury (LSH-TMS) pattern'
                : 'Bound to live Lakeshore corpus pattern',
            delta: 22,
          },
          { name: 'Requires named evidence owner before gate movement', delta: -6, isWarning: true },
          { name: 'Portfolio value path is visible', delta: 20 },
        ],
        engagementState: nodes[index]?.engagementState ?? 'in_flight',
        initiativeDisplayId: nodes[index]?.initiativeDisplayId,
        measuredVsCommitted: {
          measured: money(initiativeRows[index]?.measured_value_usd),
          committed: money(initiativeRows[index]?.committed_annual_usd),
        },
        decision: {
          kind: index === 0 ? 'approve_scale' : 'evaluate',
          label: index === 0 ? 'Gate on treasury proof' : 'Evaluate with evidence',
          reason: 'Advance only where Source/Tower evidence and accountable owner are visible.',
        },
        // Grounding-bound + fail-closed: empty when no candidate in the card's
        // namespace clears MIN_PATTERN_RELEVANCE — the card then cites no pattern
        // rather than an off-namespace one.
        bindingPatterns: bound.patterns.map((pattern) => ({
          pattern,
          quantifiedRow: {
            withLabel: '+ Pattern applied',
            withoutLabel: '- Decision theater',
            description: pattern.description,
            source: pattern.provenance.primarySources[0]?.source ?? 'lakeshore corpus',
          },
        })),
        antiPatterns: cardAntiPatterns.map((antiPattern) => ({
          antiPattern,
          description: antiPattern.description,
          source: antiPattern.provenance.primarySources[0]?.source ?? 'lakeshore corpus',
        })),
        vendors: [{ vendor: CONTROL_VENDOR, tier: 'incumbent', healthLabel: 'Governed estate', isCurrent: true }],
        regulatory: [{ regulatory: GOVERNANCE_REGULATORY, currencyDate: REFRESHED }],
      };
    }),
    belowTheLine: useCases.slice(3).map((useCase, index) => ({
      rank: index + 4,
      useCaseId: useCase.id,
      useCaseName: useCase.name,
      score: 76 - index * 3,
      state: 'in_portfolio',
      initiativeDisplayId: nodes[index + 3]?.initiativeDisplayId,
      valueLabel: moneyLabel(money(initiativeRows[index + 3]?.measured_value_usd || initiativeRows[index + 3]?.committed_annual_usd)),
      ttvLabel: '6-18 mo',
      hint: 'Track as a portfolio bet; use the cited Lakeshore pattern before gate movement.',
    })),
    patternsTriggered: patterns.slice(0, 3).map((pattern) => ({
      pattern,
      issue: `${pattern.name} is active in the Lakeshore corpus and should govern the related initiative gate.`,
      recommendedAction:
        'Open the related Move or Source event and attach the decision artifact before executive review.',
      cta: { primary: { label: 'Open Moves', href: '/strategic-moves' }, secondary: { label: 'Open Tower', href: '/tower' } },
    })),
    proofPoints: [],
    totals: {
      totalUseCases: useCases.length,
      totalPatterns: patternRows.length,
      totalVendors: 1,
      totalRegulatory: 1,
      refreshCadence: 'quarterly',
      lastRefreshQuarter: REFRESHED,
    },
  };

  return { mapData, briefData };
}
