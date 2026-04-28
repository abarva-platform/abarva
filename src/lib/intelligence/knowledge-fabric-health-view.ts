import {
  buildKnowledgeFabricHealthView,
  type KnowledgeFabricHealthGap,
  type KnowledgeFabricHealthView,
} from './knowledge-fabric-health';

export interface KnowledgeFabricHealthMetric {
  label: string;
  value: string;
  detail: string;
}

export interface KnowledgeFabricHealthPanelView {
  eyebrow: 'SENTINEL · KNOWLEDGE FABRIC · DETERMINISTIC';
  title: 'Knowledge fabric health';
  statusLabel: string;
  summary: string;
  metrics: readonly KnowledgeFabricHealthMetric[];
  gaps: readonly KnowledgeFabricHealthGap[];
  caveats: readonly string[];
  disclaimer: string;
  storeWriteStatus: KnowledgeFabricHealthView['storeWriteStatus'];
  createdFrom: KnowledgeFabricHealthView['createdFrom'];
}

function statusLabel(status: KnowledgeFabricHealthView['status']) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'partial':
      return 'Partial coverage';
    case 'blocked':
      return 'Blocked';
  }
}

export function buildKnowledgeFabricHealthPanelView(
  health: KnowledgeFabricHealthView = buildKnowledgeFabricHealthView(),
): KnowledgeFabricHealthPanelView {
  const primitiveSummary = [
    `${health.primitiveCounts.pattern} patterns`,
    `${health.primitiveCounts.signal} signals`,
    `${health.primitiveCounts.solution} solutions`,
    `${health.primitiveCounts.contradiction} contradictions`,
  ].join(' · ');

  return {
    eyebrow: 'SENTINEL · KNOWLEDGE FABRIC · DETERMINISTIC',
    title: 'Knowledge fabric health',
    statusLabel: statusLabel(health.status),
    summary: `${primitiveSummary}. Store writes are ${health.storeWriteStatus.replace('_', ' ')}.`,
    metrics: [
      {
        label: 'Total primitives',
        value: String(health.totalPrimitives),
        detail: primitiveSummary,
      },
      {
        label: 'Source-backed',
        value: `${health.sourceCoverage.backed}/${health.sourceCoverage.total}`,
        detail: `${health.sourceCoverage.percent}% carry direct sourceId coverage`,
      },
      {
        label: 'Citation-backed',
        value: `${health.citationCoverage.backed}/${health.citationCoverage.total}`,
        detail: `${health.citationCoverage.percent}% carry citation-style evidence`,
      },
      {
        label: 'Contradiction findings',
        value: String(health.contradictionCoverage.detectedFindings),
        detail: `${health.contradictionCoverage.unresolvedFindings} need review across ${health.contradictionCoverage.affectedPatternCount} affected patterns`,
      },
    ],
    gaps: health.coverageGaps,
    caveats: health.caveats,
    disclaimer: health.disclaimer,
    storeWriteStatus: health.storeWriteStatus,
    createdFrom: health.createdFrom,
  };
}
