// Source control tower signals.
// Emits structured signals to the AI Control Tower from the Source module.
// Deterministic — no model calls, no network calls.

export type SourceSignalType =
  | 'price_anomaly'
  | 'scope_gap'
  | 'evidence_deficit'
  | 'negotiation_deadline'
  | 'vendor_withdrawal_risk'
  | 'governance_gap'
  | 'bafo_ready'
  | 'evaluation_stalled'
  | 'commercial_trap_detected'
  | 'contract_risk';

export type SourceSignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SourceSignalStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

export interface SourceControlTowerSignal {
  signalId: string;
  signalType: SourceSignalType;
  severity: SourceSignalSeverity;
  status: SourceSignalStatus;
  eventId: string;
  vendorId: string | null;     // null = event-level signal
  title: string;
  narrative: string;
  suggestedAction: string;
  tags: string[];
  emittedAt: string;
  ttlDays: number;             // signal TTL in days
}

export interface SourceControlTowerSignalBundle {
  eventId: string;
  eventName: string;
  generatedAt: string;
  signals: SourceControlTowerSignal[];
  criticalCount: number;
  highCount: number;
  totalCount: number;
  requiresImmediateAttention: boolean;
}

export interface SourceSignalInput {
  eventId: string;
  eventName: string;
  stage: string;
  vendorIds: string[];
  hasPricingAnomalies: boolean;
  hasScopeGap: boolean;
  hasEvidenceDeficit: boolean;
  hasGovernanceGap: boolean;
  isBafoReady: boolean;
  evaluationDaysStalled: number;
}

export function buildSourceControlTowerSignals(
  input: SourceSignalInput,
): SourceControlTowerSignalBundle {
  const signals: SourceControlTowerSignal[] = [];

  if (input.hasPricingAnomalies) {
    for (const vendorId of input.vendorIds) {
      signals.push({
        signalId: `sig-${input.eventId}-${vendorId}-price-anomaly`,
        signalType: 'price_anomaly',
        severity: 'high',
        status: 'active',
        eventId: input.eventId,
        vendorId,
        title: 'Pricing anomaly detected',
        narrative: `${vendorId} pricing deviates significantly from market benchmark.`,
        suggestedAction: 'Request benchmark comparison from vendor before BAFO submission.',
        tags: ['pricing', 'bafo', 'benchmark'],
        emittedAt: '2026-04-26',
        ttlDays: 14,
      });
    }
  }

  if (input.hasScopeGap) {
    signals.push({
      signalId: `sig-${input.eventId}-scope-gap`,
      signalType: 'scope_gap',
      severity: 'high',
      status: 'active',
      eventId: input.eventId,
      vendorId: null,
      title: 'Scope gap in vendor submissions',
      narrative: 'One or more vendor submissions have incomplete or ambiguous scope definitions.',
      suggestedAction: 'Issue scope clarification RFI before finalizing BAFO requirements.',
      tags: ['scope', 'rfp', 'bafo'],
      emittedAt: '2026-04-26',
      ttlDays: 7,
    });
  }

  if (input.hasEvidenceDeficit) {
    signals.push({
      signalId: `sig-${input.eventId}-evidence-deficit`,
      signalType: 'evidence_deficit',
      severity: 'high',
      status: 'active',
      eventId: input.eventId,
      vendorId: null,
      title: 'Evidence coverage below threshold',
      narrative: 'Event evidence coverage is below 50%. Evaluation quality is compromised.',
      suggestedAction: 'Pause evaluation. Request missing evidence from vendors or internal teams.',
      tags: ['evidence', 'data-readiness'],
      emittedAt: '2026-04-26',
      ttlDays: 7,
    });
  }

  if (input.hasGovernanceGap) {
    signals.push({
      signalId: `sig-${input.eventId}-governance-gap`,
      signalType: 'governance_gap',
      severity: 'medium',
      status: 'active',
      eventId: input.eventId,
      vendorId: null,
      title: 'Governance gap detected',
      narrative: 'No SLA, performance review cadence, or escalation path defined.',
      suggestedAction: 'Include mandatory SLA terms in BAFO requirements pack.',
      tags: ['governance', 'sla'],
      emittedAt: '2026-04-26',
      ttlDays: 14,
    });
  }

  if (input.isBafoReady) {
    signals.push({
      signalId: `sig-${input.eventId}-bafo-ready`,
      signalType: 'bafo_ready',
      severity: 'info',
      status: 'active',
      eventId: input.eventId,
      vendorId: null,
      title: 'Event ready for BAFO',
      narrative: 'All pre-BAFO conditions are satisfied. BAFO can be issued.',
      suggestedAction: 'Issue BAFO request to qualified vendors.',
      tags: ['bafo', 'milestone'],
      emittedAt: '2026-04-26',
      ttlDays: 30,
    });
  }

  if (input.evaluationDaysStalled > 7) {
    signals.push({
      signalId: `sig-${input.eventId}-evaluation-stalled`,
      signalType: 'evaluation_stalled',
      severity: input.evaluationDaysStalled > 14 ? 'high' : 'medium',
      status: 'active',
      eventId: input.eventId,
      vendorId: null,
      title: `Evaluation stalled for ${input.evaluationDaysStalled} days`,
      narrative: `No evaluation progress in ${input.evaluationDaysStalled} days. Timeline at risk.`,
      suggestedAction: 'Schedule evaluation session and assign accountable reviewer.',
      tags: ['timeline', 'evaluation'],
      emittedAt: '2026-04-26',
      ttlDays: 3,
    });
  }

  const criticalCount = signals.filter((s) => s.severity === 'critical').length;
  const highCount = signals.filter((s) => s.severity === 'high').length;

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    generatedAt: '2026-04-26',
    signals,
    criticalCount,
    highCount,
    totalCount: signals.length,
    requiresImmediateAttention: criticalCount > 0 || highCount > 0,
  };
}
