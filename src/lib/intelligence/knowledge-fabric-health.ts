import { detectContradictions } from './contradiction-detector';
import { corpusToPrimitives, type KnowledgePrimitive } from './indexer';
import { loadCorpus } from './loader';
import type { LoadedCorpus } from './types';

type PrimitiveKind = KnowledgePrimitive['kind'];
type GapSeverity = 'low' | 'medium' | 'high';

export interface KnowledgeFabricHealthGap {
  id: string;
  label: string;
  severity: GapSeverity;
  rationale: string;
}

export interface KnowledgeFabricHealthCoverage {
  backed: number;
  total: number;
  percent: number;
}

export interface KnowledgeFabricContradictionHealth {
  corpusContradictions: number;
  detectedFindings: number;
  unresolvedFindings: number;
  affectedPatternCount: number;
}

export interface KnowledgeFabricHealthView {
  createdFrom: 'deterministic_knowledge_fabric_health_seed';
  corpusLoadedAt: string;
  status: 'ready' | 'partial' | 'blocked';
  primitiveCounts: Record<PrimitiveKind, number>;
  totalPrimitives: number;
  sourceCoverage: KnowledgeFabricHealthCoverage;
  citationCoverage: KnowledgeFabricHealthCoverage;
  contradictionCoverage: KnowledgeFabricContradictionHealth;
  coverageGaps: KnowledgeFabricHealthGap[];
  caveats: string[];
  storeWriteStatus: 'not_live';
  disclaimer: string;
}

const DEFAULT_HEALTH_LOADED_AT = '2026-04-28T00:00:00.000Z';

function percent(backed: number, total: number) {
  if (total === 0) return 100;
  return Math.round((backed / total) * 100);
}

function countByKind(primitives: KnowledgePrimitive[]): Record<PrimitiveKind, number> {
  return primitives.reduce<Record<PrimitiveKind, number>>(
    (counts, primitive) => {
      counts[primitive.kind] += 1;
      return counts;
    },
    { pattern: 0, signal: 0, solution: 0, contradiction: 0 },
  );
}

function hasCitation(primitive: KnowledgePrimitive) {
  if (primitive.sourceId) return true;
  const metadata = primitive.metadata ?? {};
  if (primitive.kind === 'solution') {
    return Array.isArray(metadata.signalIds) || Array.isArray(metadata.patternIds);
  }
  if (primitive.kind === 'contradiction') {
    return Array.isArray(metadata.sourceDocuments);
  }
  return false;
}

function buildCoverageGaps(
  primitives: KnowledgePrimitive[],
  sourceCoverage: KnowledgeFabricHealthCoverage,
  citationCoverage: KnowledgeFabricHealthCoverage,
  contradictionCoverage: KnowledgeFabricContradictionHealth,
): KnowledgeFabricHealthGap[] {
  const gaps: KnowledgeFabricHealthGap[] = [];

  if (sourceCoverage.percent < 100) {
    gaps.push({
      id: 'source-coverage-partial',
      label: 'Some primitives do not carry a direct sourceId',
      severity: sourceCoverage.percent < 75 ? 'high' : 'medium',
      rationale: `${sourceCoverage.backed} of ${sourceCoverage.total} primitives have direct source backing. Intelligence can render this deterministically, but I1 should tighten source provenance before live graph writes.`,
    });
  }

  if (citationCoverage.percent < 100) {
    gaps.push({
      id: 'citation-coverage-partial',
      label: 'Citation coverage is not complete across all primitive types',
      severity: citationCoverage.percent < 75 ? 'high' : 'medium',
      rationale: `${citationCoverage.backed} of ${citationCoverage.total} primitives have citation-style evidence. The health model keeps this visible without mutating the graph store.`,
    });
  }

  if (contradictionCoverage.unresolvedFindings > 0) {
    gaps.push({
      id: 'contradiction-review-open',
      label: 'Contradiction findings still need review',
      severity: 'medium',
      rationale: `${contradictionCoverage.unresolvedFindings} contradiction findings are unresolved or need review across ${contradictionCoverage.affectedPatternCount} affected patterns.`,
    });
  }

  if (primitives.length === 0) {
    gaps.push({
      id: 'empty-corpus',
      label: 'Corpus has no primitives',
      severity: 'high',
      rationale: 'The deterministic loader returned no primitives, so Intelligence cannot render a useful knowledge fabric health state.',
    });
  }

  return gaps;
}

export function buildKnowledgeFabricHealthView(
  corpus: LoadedCorpus = loadCorpus({ loadedAt: DEFAULT_HEALTH_LOADED_AT }),
): KnowledgeFabricHealthView {
  const primitives = corpusToPrimitives(corpus);
  const primitiveCounts = countByKind(primitives);
  const directSourceBacked = primitives.filter((primitive) => Boolean(primitive.sourceId)).length;
  const citationBacked = primitives.filter(hasCitation).length;
  const contradictionScan = detectContradictions({ corpus, includeResolved: true });
  const unresolvedFindings = contradictionScan.findings.filter(
    (finding) => finding.status === 'needs-review',
  ).length;
  const affectedPatternCount = new Set(
    contradictionScan.findings.flatMap((finding) => finding.affectedPatternIds),
  ).size;

  const sourceCoverage = {
    backed: directSourceBacked,
    total: primitives.length,
    percent: percent(directSourceBacked, primitives.length),
  };
  const citationCoverage = {
    backed: citationBacked,
    total: primitives.length,
    percent: percent(citationBacked, primitives.length),
  };
  const contradictionCoverage = {
    corpusContradictions: corpus.contradictions.length,
    detectedFindings: contradictionScan.findings.length,
    unresolvedFindings,
    affectedPatternCount,
  };
  const coverageGaps = buildCoverageGaps(
    primitives,
    sourceCoverage,
    citationCoverage,
    contradictionCoverage,
  );

  return {
    createdFrom: 'deterministic_knowledge_fabric_health_seed',
    corpusLoadedAt: corpus.loadedAt,
    status: primitives.length === 0 ? 'blocked' : coverageGaps.some((gap) => gap.severity === 'high') ? 'partial' : 'ready',
    primitiveCounts,
    totalPrimitives: primitives.length,
    sourceCoverage,
    citationCoverage,
    contradictionCoverage,
    coverageGaps,
    caveats: [
      'Read model only: no graph, vector, object, or ledger writes are performed.',
      'Counts are computed from deterministic seed corpus data, not live retrieval.',
      'This view is safe to mount before Knowledge Fabric write mode is enabled.',
    ],
    storeWriteStatus: 'not_live',
    disclaimer:
      'Knowledge Fabric health is a deterministic readiness view. It does not index, persist, or mutate graph/vector stores.',
  };
}
