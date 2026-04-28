import {
  buildIntelligenceSourceBasisSeed,
  getExternalOnlyBases,
  getInternalOnlyBases,
  summarizeIntelligenceSourceBasis,
  type IntelligenceSourceBasis,
  type IntelligenceSourceBasisConfidence,
} from '@/lib/intelligence/source-basis';
import type { SentinelPatternDetailView } from '@/lib/intelligence/sentinel-pattern-view';

export interface IntelligenceSourceBasisPanelRow {
  id: string;
  label: string;
  kindLabel: string;
  confidence: IntelligenceSourceBasisConfidence;
  confidenceLabel: string;
  rationale: string;
  citationLocator: string;
}

export interface IntelligenceSourceBasisPanelView {
  patternKey: string;
  totalBases: number;
  internalCount: number;
  externalCount: number;
  internalRows: IntelligenceSourceBasisPanelRow[];
  externalRows: IntelligenceSourceBasisPanelRow[];
  honestDisclaimer: string;
}

export function buildIntelligenceSourceBasisPanelView(
  pattern: SentinelPatternDetailView,
): IntelligenceSourceBasisPanelView {
  const bases = buildIntelligenceSourceBasisSeed().filter(
    (basis) => basis.patternKey === pattern.patternKey,
  );
  const summary = summarizeIntelligenceSourceBasis(bases);
  return {
    patternKey: pattern.patternKey,
    totalBases: summary.totalBases,
    internalCount: summary.internalCount,
    externalCount: summary.externalCount,
    internalRows: getInternalOnlyBases(bases).map(toPanelRow),
    externalRows: getExternalOnlyBases(bases).map(toPanelRow),
    honestDisclaimer: summary.honestDisclaimer,
  };
}

function toPanelRow(basis: IntelligenceSourceBasis): IntelligenceSourceBasisPanelRow {
  return {
    id: basis.id,
    label: basis.label,
    kindLabel: basis.kind.replace(/_/g, ' '),
    confidence: basis.confidence,
    confidenceLabel: basis.confidence.toUpperCase(),
    rationale: basis.rationale,
    citationLocator: basis.citationLocator,
  };
}
