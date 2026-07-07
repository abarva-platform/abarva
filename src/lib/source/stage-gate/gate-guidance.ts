// Nexus/Sentinel gate guidance — turn a stage-gate assessment into senior-advisor
// language. Never just "approved"/"blocked": it states the full standard, what's missing,
// the risk of proceeding, what stays preliminary, and that Maestro may override.

import type { SourceStageGateAssessment } from './types';

export type GateGuidanceVerdict =
  | 'Ready'
  | 'Ready with gaps'
  | 'Preliminary only'
  | 'Not recommended, but Maestro can override'
  | 'Blocked unless Maestro accepts critical risk';

export interface GateGuidance {
  verdict: GateGuidanceVerdict;
  headline: string;
  detail: string;
  missingItems: string[];
  downstreamImpacts: string[];
  maestroOverrideAllowed: boolean;
}

export function buildGateGuidance(a: SourceStageGateAssessment): GateGuidance {
  const missingItems = a.gaps.map((g) => g.label);
  const pct = Math.round(a.currentCompletion * 100);

  let verdict: GateGuidanceVerdict;
  if (a.gateStatus === 'ready') verdict = 'Ready';
  else if (a.gateStatus === 'blocked') verdict = a.minimumViableMet ? 'Not recommended, but Maestro can override' : 'Blocked unless Maestro accepts critical risk';
  else if (a.gateStatus === 'preliminary_only') verdict = 'Preliminary only';
  else verdict = 'Ready with gaps';

  const standardLine = `The full standard for "${a.stageName}" is ${a.recommendedStandard.length} items; ${a.satisfied.length} are met (${pct}%).`;
  const missingLine = missingItems.length
    ? `Missing: ${missingItems.join(', ')}.`
    : 'No gaps remain.';
  const downstreamLine = a.downstreamImpacts.length
    ? ` If you proceed, these stay preliminary and cannot be marked issue-ready: ${a.downstreamImpacts.join(', ')}.`
    : '';
  const overrideLine = a.gateStatus === 'ready'
    ? ''
    : ' You may proceed with Maestro approval, but the affected deliverables must remain preliminary and the gaps are carried forward.';

  return {
    verdict,
    headline: verdict,
    detail: `${standardLine} ${missingLine}${downstreamLine}${overrideLine}`.trim(),
    missingItems,
    downstreamImpacts: a.downstreamImpacts,
    maestroOverrideAllowed: a.maestroOverrideAllowed,
  };
}
