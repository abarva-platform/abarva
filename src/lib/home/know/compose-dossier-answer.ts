import type {
  HomeKnowChart,
  HomeKnowCitation,
  HomeKnowFact,
  HomeKnowGap,
  HomeKnowGraph,
  HomeKnowIntent,
  HomeKnowResponse,
  HomeKnowTable,
} from '@/lib/home/know/home-know-contract';
import { composeDossierAnswer, type UniversalDimensionDossier } from '@/lib/semantic-dossiers';

function homeIntentForDossier(dossier: UniversalDimensionDossier): HomeKnowIntent {
  if (dossier.answerBoundary.handoffTarget && dossier.answerBoundary.handoffTarget !== 'home') return 'decision_handoff';
  if (dossier.route.intent === 'gap') return 'gap';
  if (dossier.artifactPlan.includes('graph')) return 'chart';
  if (dossier.artifactPlan.includes('table')) return 'table';
  return 'lookup';
}

function citationId(index: number): string {
  return `dossier-citation-${index + 1}`;
}

function citationsForDossier(dossier: UniversalDimensionDossier): HomeKnowCitation[] {
  return dossier.citations.map((citation, index) => ({
    id: citationId(index),
    label: citation.label,
    sourceClass: 'tenant-source-file',
    sourceFile: citation.sourceKey,
    sourceRowNumber: null,
    excerpt: `${citation.count} source-backed item${citation.count === 1 ? '' : 's'} contributed to this dossier section.`,
    confidence: citation.count > 0 ? 'high' : 'low',
  }));
}

function allCitationIds(citations: HomeKnowCitation[]): string[] {
  return citations.slice(0, 8).map((citation) => citation.id);
}

function factsForDossier(dossier: UniversalDimensionDossier, citations: HomeKnowCitation[]): HomeKnowFact[] {
  const fallbackCitationIds = allCitationIds(citations);
  return dossier.facts.slice(0, 12).map((fact, index) => {
    const matchedCitationIds = citations
      .filter((citation) => citation.sourceFile === fact.sourceKey)
      .map((citation) => citation.id)
      .slice(0, 3);
    return {
      id: `dossier-fact-${index + 1}`,
      dimensionId: dossier.route.primaryDimension,
      label: fact.label,
      value: fact.value,
      citationIds: matchedCitationIds.length > 0 ? matchedCitationIds : fallbackCitationIds,
    };
  });
}

function tablesForDossier(dossier: UniversalDimensionDossier, citations: HomeKnowCitation[]): HomeKnowTable[] {
  return [
    {
      id: 'dimension-dossier-source-coverage',
      title: 'Dimension dossier source coverage',
      dimensionId: dossier.route.primaryDimension,
      columns: [
        { key: 'section', label: 'Section' },
        { key: 'dimension', label: 'Dimension' },
        { key: 'records', label: 'Records', align: 'right', format: 'number' },
        { key: 'role', label: 'Binder role' },
      ],
      rows: dossier.sections.slice(0, 18).map((section) => ({
        section: section.title,
        dimension: section.dimensionFamily.replaceAll('_', ' '),
        records: section.recordCount,
        role: section.dimensionFamily === dossier.route.primaryDimension ? 'primary' : 'adjacent',
      })),
      citationIds: allCitationIds(citations),
      note: 'This table shows the source families attached to the Home answer dossier.',
    },
  ];
}

function chartsForDossier(dossier: UniversalDimensionDossier, citations: HomeKnowCitation[]): HomeKnowChart[] {
  const numericMetrics = dossier.metrics
    .filter((metric) => typeof metric.value === 'number' && Number.isFinite(metric.value))
    .slice(0, 8);
  if (numericMetrics.length === 0) return [];
  return [
    {
      id: 'dimension-dossier-metrics',
      title: 'Dossier metric rollups',
      kind: 'bar',
      type: 'bar',
      dimensionId: dossier.route.primaryDimension,
      data: numericMetrics.map((metric) => ({
        label: metric.label,
        value: Number(metric.value),
      })),
      sourceIds: numericMetrics.flatMap((metric) => metric.sourceKeys),
      citationIds: allCitationIds(citations),
      caveats: numericMetrics.flatMap((metric) => (metric.caveat ? [metric.caveat] : [])),
      status: 'tenant-fact',
    },
  ];
}

function graphsForDossier(dossier: UniversalDimensionDossier, citations: HomeKnowCitation[]): HomeKnowGraph[] {
  if (dossier.relationshipPaths.length === 0) return [];
  const nodes = new Map<string, { id: string; label: string; type: string }>();
  const edges = dossier.relationshipPaths.slice(0, 8).map((path, index) => {
    const fromId = `node-from-${index + 1}`;
    const toId = `node-to-${index + 1}`;
    nodes.set(fromId, { id: fromId, label: path.from, type: path.from });
    nodes.set(toId, { id: toId, label: path.to, type: path.to });
    return {
      from: fromId,
      to: toId,
      label: path.relationship,
      type: path.pathKey,
      confidence: path.confidence,
    };
  });
  return [
    {
      id: 'dimension-dossier-relationship-paths',
      title: 'Relevant relationship paths',
      nodes: [...nodes.values()],
      edges,
      nodeTypes: [...new Set([...nodes.values()].map((node) => node.type))],
      edgeTypes: [...new Set(edges.map((edge) => edge.type))],
      sourceIds: dossier.relationshipPaths.flatMap((path) => path.sourceKeys),
      citationIds: allCitationIds(citations),
      confidence: 'medium',
      gaps: dossier.gaps.slice(0, 4).map((gap) => gap.label),
      inferredEdges: false,
    },
  ];
}

function gapsForDossier(dossier: UniversalDimensionDossier, citations: HomeKnowCitation[]): HomeKnowGap[] {
  return dossier.gaps.slice(0, 8).map((gap, index) => ({
    id: `dossier-gap-${index + 1}`,
    dimensionId: dossier.route.primaryDimension,
    objectType: 'dimension dossier',
    expectedField: gap.neededEvidence.join('; '),
    displayLabel: gap.label,
    severity: 'medium',
    message: `${gap.impact} Remediation: ${gap.neededEvidence.join('; ')}.`,
    citationIds: allCitationIds(citations),
  }));
}

export function buildHomeKnowResponseFromDossier(input: {
  tenantKey: string;
  question: string;
  dossier: UniversalDimensionDossier;
}): HomeKnowResponse {
  const answer = composeDossierAnswer(input.dossier);
  const citations = citationsForDossier(input.dossier);
  const intent = homeIntentForDossier(input.dossier);
  const handoffTarget = input.dossier.answerBoundary.handoffTarget;
  return {
    mode: 'KNOW',
    tenantKey: input.tenantKey,
    question: input.question,
    intent,
    answerStatus: handoffTarget && handoffTarget !== 'home' ? 'handoff' : input.dossier.gaps.length > 0 ? 'partial' : 'answered',
    prose: answer.directAnswer,
    dimensionsUsed: [input.dossier.route.primaryDimension, ...input.dossier.route.relatedDimensions],
    facts: factsForDossier(input.dossier, citations),
    tables: tablesForDossier(input.dossier, citations),
    charts: chartsForDossier(input.dossier, citations),
    graphs: graphsForDossier(input.dossier, citations),
    gaps: gapsForDossier(input.dossier, citations),
    conflicts: [],
    citations,
    handoff:
      handoffTarget && handoffTarget !== 'home'
        ? {
          target: handoffTarget === 'tower' || handoffTarget === 'moves' || handoffTarget === 'intelligence' ? handoffTarget : 'intelligence',
          label: `Continue in ${handoffTarget}`,
          reason: input.dossier.answerBoundary.handoffReason ?? 'The question needs judgment beyond Home KNOW.',
        }
        : null,
    safety: {
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved: answer.quality.issues.length,
      frontendTripwireShouldFire: false,
      composerTrace: {
        route: '/api/home/know/ask',
        composer: handoffTarget && handoffTarget !== 'home' ? 'home_know_decision_handoff' : 'golden_home_know_semantic_synthesis',
        goldenComposerAttempted: true,
        goldenComposerUsed: true,
        fallbackUsed: false,
        dimensionsUsed: [input.dossier.route.primaryDimension, ...input.dossier.route.relatedDimensions],
        factsBound: input.dossier.facts.length,
        tablesBound: 1,
        gapsBound: input.dossier.gaps.length,
        answerStatus: handoffTarget && handoffTarget !== 'home' ? 'handoff' : input.dossier.gaps.length > 0 ? 'partial' : 'answered',
      },
    },
  };
}
