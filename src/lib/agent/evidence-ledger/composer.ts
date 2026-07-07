import type {
  ComposeEvidenceLedgerInput,
  EvidenceFreshness,
  EvidenceLedger,
  EvidenceLedgerDataUsed,
} from './types';

export type {
  ComposeEvidenceLedgerInput,
  EvidenceFreshness,
  EvidenceLedger,
  EvidenceLedgerDataMissing,
  EvidenceLedgerDataUsed,
  EvidenceLedgerPatternApplied,
} from './types';

export function composeEvidenceLedger(input: ComposeEvidenceLedgerInput): EvidenceLedger {
  const now = input.now ?? new Date();
  const dataUsed = (input.dataUsed ?? []).map(normalizeDataUsed);
  const dataMissing = input.dataMissing ?? [];
  const confidence = clampPercent(input.confidence ?? inferConfidence(dataUsed.length, dataMissing.length));

  return {
    dataUsed,
    dataMissing,
    confidence,
    freshness: resolveFreshness(dataUsed, now),
    owner: normalizeOwner(input.owner),
    patternsApplied: input.patternsApplied ?? [],
  };
}

export function assertEvidenceLedgerReady(ledger: EvidenceLedger): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (ledger.dataUsed.length === 0 && ledger.dataMissing.length === 0) {
    reasons.push('Ledger must state either data used or data missing.');
  }
  if (!ledger.owner.trim()) reasons.push('Ledger must name a substrate owner.');
  if (!Number.isFinite(ledger.confidence) || ledger.confidence < 0 || ledger.confidence > 100) {
    reasons.push('Ledger confidence must be 0..100.');
  }
  for (const row of ledger.dataUsed) {
    if (!row.substrateId || !row.label || !row.sourceTable || !row.asOf) {
      reasons.push(`Data-used row ${row.substrateId || '(missing id)'} is incomplete.`);
    }
  }
  return { passed: reasons.length === 0, reasons };
}

function normalizeDataUsed(row: EvidenceLedgerDataUsed): EvidenceLedgerDataUsed {
  return {
    ...row,
    substrateId: row.substrateId.trim(),
    label: row.label.trim(),
    sourceTable: row.sourceTable.trim(),
    rowCount: Math.max(0, Math.floor(row.rowCount)),
    asOf: new Date(row.asOf).toISOString(),
  };
}

function resolveFreshness(rows: EvidenceLedgerDataUsed[], now: Date): EvidenceFreshness {
  if (rows.length === 0) return 'stale';
  const newestAgeDays = Math.min(
    ...rows.map((row) => Math.floor((now.getTime() - new Date(row.asOf).getTime()) / 86_400_000)),
  );
  if (newestAgeDays <= 14) return 'fresh';
  if (newestAgeDays <= 60) return 'aging';
  return 'stale';
}

function inferConfidence(usedCount: number, missingCount: number): number {
  if (usedCount === 0) return 0;
  return Math.max(0, Math.min(100, 55 + usedCount * 10 - missingCount * 15));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeOwner(owner: string | null | undefined): string {
  return owner?.trim() || 'Unassigned substrate owner';
}
