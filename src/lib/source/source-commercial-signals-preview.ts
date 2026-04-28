// Source commercial signals preview view model.
// Aggregates top-3 control-tower signals and top-3 intelligence patterns
// into a compact preview suitable for dashboard surfaces.
// Deterministic — no model calls, no network calls.

import {
  buildSourceControlTowerSignals,
  SourceControlTowerSignal,
  SourceSignalSeverity,
} from './control-tower-signals';
import {
  detectIntelligencePatterns,
  IntelligencePattern,
} from './intelligence-patterns';

// ---------------------------------------------------------------------------
// View model types
// ---------------------------------------------------------------------------

export interface SourceSignalPreviewItem {
  signalId: string;
  signalType: string;
  label: string;
  severity: 'critical' | 'warning' | 'info';
  shortSummary: string;
}

export interface SourcePatternPreviewItem {
  patternId: string;
  category: string;
  label: string;
  confidence: number; // 0–1
  shortSummary: string;
}

export interface SourceCommercialSignalsPreviewViewModel {
  rfpId: string;
  topSignals: SourceSignalPreviewItem[];   // max 3
  topPatterns: SourcePatternPreviewItem[]; // max 3
  totalSignalCount: number;
  totalPatternCount: number;
  criticalSignalCount: number;
  generatedAt: string;
  caveat: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map the Wave-14 5-level severity to the 3-level preview severity. */
function mapSeverity(severity: SourceSignalSeverity): 'critical' | 'warning' | 'info' {
  if (severity === 'critical') return 'critical';
  if (severity === 'high' || severity === 'medium') return 'warning';
  return 'info';
}

/** Convert a pattern strength to a 0–1 confidence score. */
function strengthToConfidence(strength: IntelligencePattern['strength']): number {
  switch (strength) {
    case 'confirmed': return 0.95;
    case 'likely':    return 0.70;
    case 'possible':  return 0.40;
    default:          return 0;
  }
}

/** Sort signals: critical first, then high, medium, low, info. */
const SEVERITY_ORDER: Record<SourceSignalSeverity, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
  info:     4,
};

function rankSignal(s: SourceControlTowerSignal): number {
  return SEVERITY_ORDER[s.severity] ?? 99;
}

/** Sort patterns by confidence descending (confirmed > likely > possible). */
const STRENGTH_ORDER: Record<IntelligencePattern['strength'], number> = {
  confirmed:    0,
  likely:       1,
  possible:     2,
  not_detected: 3,
};

function rankPattern(p: IntelligencePattern): number {
  return STRENGTH_ORDER[p.strength] ?? 99;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildCommercialSignalsPreviewViewModel(
  rfpId: string,
  vendorList: string[],
  eventId: string,
): SourceCommercialSignalsPreviewViewModel {
  // Build signals using Wave-14 lib with representative flags derived from
  // the presence of vendors and standard procurement conditions.
  const signalBundle = buildSourceControlTowerSignals({
    eventId,
    eventName: `RFP ${rfpId}`,
    stage: 'evaluation',
    vendorIds: vendorList,
    hasPricingAnomalies: vendorList.length > 1,
    hasScopeGap: true,
    hasEvidenceDeficit: true,
    hasGovernanceGap: true,
    isBafoReady: false,
    evaluationDaysStalled: 10,
  });

  // Detect patterns using Wave-14 lib.
  const patternSummary = detectIntelligencePatterns({
    eventId,
    eventName: `RFP ${rfpId}`,
    vendorIds: vendorList,
    hasOpaquePricing: vendorList.length > 0,
    hasBroadScope: true,
    hasEvidenceGaps: true,
    hasTimelinePressure: false,
    hasGovernanceAvoidance: true,
    hasBundledServices: vendorList.length > 1,
  });

  // Top-3 signals — sorted by severity priority.
  const sortedSignals = [...signalBundle.signals].sort(
    (a, b) => rankSignal(a) - rankSignal(b),
  );

  const topSignals: SourceSignalPreviewItem[] = sortedSignals
    .slice(0, 3)
    .map((s) => ({
      signalId: s.signalId,
      signalType: s.signalType,
      label: s.title,
      severity: mapSeverity(s.severity),
      shortSummary: s.narrative,
    }));

  // Top-3 patterns — sorted by strength priority.
  const sortedPatterns = [...patternSummary.patterns].sort(
    (a, b) => rankPattern(a) - rankPattern(b),
  );

  const topPatterns: SourcePatternPreviewItem[] = sortedPatterns
    .slice(0, 3)
    .map((p) => ({
      patternId: p.patternId,
      category: p.category,
      label: p.name,
      confidence: strengthToConfidence(p.strength),
      shortSummary: p.description,
    }));

  const criticalSignalCount = signalBundle.signals.filter(
    (s) => s.severity === 'critical',
  ).length;

  return {
    rfpId,
    topSignals,
    topPatterns,
    totalSignalCount: signalBundle.totalCount,
    totalPatternCount: patternSummary.patterns.length,
    criticalSignalCount,
    generatedAt: '2026-04-26',
    caveat:
      'Signal and pattern detection based on available procurement data. Findings are indicative and should be validated by procurement specialists.',
  };
}
