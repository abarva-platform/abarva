export type ValueState = 'hypothesis' | 'projected' | 'committed' | 'measured' | 'realized' | 'attested';

export interface ValueCommitment {
  commitmentKey: string;
  tenantKey: string;
  sourceModule: 'moves' | 'source' | 'tower' | 'intelligence';
  valueState: ValueState;
  valueDescription: string;
  baselineEvidenceKeys: string[];
  targetEvidenceKeys: string[];
  ownerKey?: string;
  confidence?: number;
}

export interface OutcomeMeasurement {
  measurementKey: string;
  commitmentKey: string;
  measuredAt: string;
  metricKey: string;
  actualValue: number;
  unit: string;
  evidenceKeys: string[];
}

export interface RealizedValueAttestation {
  attestationKey: string;
  commitmentKey: string;
  attestedBy: string;
  attestedAt: string;
  status: 'approved' | 'rejected' | 'needs_more_evidence';
  notes?: string;
}
