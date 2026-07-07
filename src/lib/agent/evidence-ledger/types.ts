export type EvidenceFreshness = 'fresh' | 'aging' | 'stale';

export interface EvidenceLedgerDataUsed {
  substrateId: string;
  label: string;
  sourceTable: string;
  rowCount: number;
  asOf: string;
}

export interface EvidenceLedgerDataMissing {
  requiredFor: string;
  gapDescription: string;
  nextLoadStep: string;
}

export interface EvidenceLedgerPatternApplied {
  patternId: string;
  patternName: string;
  confidenceContribution: number;
}

export interface EvidenceLedger {
  dataUsed: EvidenceLedgerDataUsed[];
  dataMissing: EvidenceLedgerDataMissing[];
  confidence: number;
  freshness: EvidenceFreshness;
  owner: string;
  patternsApplied: EvidenceLedgerPatternApplied[];
}

export interface ComposeEvidenceLedgerInput {
  dataUsed?: EvidenceLedgerDataUsed[];
  dataMissing?: EvidenceLedgerDataMissing[];
  confidence?: number;
  owner?: string | null;
  patternsApplied?: EvidenceLedgerPatternApplied[];
  now?: Date;
}
