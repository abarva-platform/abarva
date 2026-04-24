import type { SourceValueLedgerSnapshot, ValueLedgerEntry } from './types';

export function sumLedger(entries: ValueLedgerEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amountUsd, 0);
}

export function getLedgerRollup(snapshot: SourceValueLedgerSnapshot) {
  return {
    projectedUsd: sumLedger(snapshot.projected),
    realizedUsd: sumLedger(snapshot.realized),
  };
}

export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}
