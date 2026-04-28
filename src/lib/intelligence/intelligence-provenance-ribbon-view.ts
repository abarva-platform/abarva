import type { SentinelPatternDetailView } from '@/lib/intelligence/sentinel-pattern-view';

export interface IntelligenceProvenanceRibbonView {
  primitive: 'Pattern' | 'Signal' | 'Solution' | 'Contradiction';
  sourceLabel: string;
  storeBinding: string;
  signalCount: number;
  programCount: number;
  citationReadinessLabel: string;
  runtimeLabel: string;
}

export function buildPatternProvenanceRibbonView(
  view: SentinelPatternDetailView,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Pattern',
    sourceLabel: view.sourceLabel,
    storeBinding: 'deterministic read model + evidence trail projection',
    signalCount: view.sourceSignalIds.length,
    programCount: view.affectedProgramRows.length,
    citationReadinessLabel: view.citationReadinessLabel,
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}
