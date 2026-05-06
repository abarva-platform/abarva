// F-M1-205: per-line value tracking for source_value_lines substrate

export type ValueLineState = 'projected' | 'committed' | 'measuring' | 'realized';
export type ValueUnit = 'usd' | 'fte_hours' | 'percentage' | 'other';

export interface SourceValueLine {
  id: string;
  programId: string;
  label: string;
  category: string | null;
  valueState: ValueLineState;
  projectedAmount: number | null;
  committedAmount: number | null;
  realizedAmount: number | null;
  valueUnit: ValueUnit;
  measurementOwnerId: string | null;
  evidenceArtifactId: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateValueLineInput {
  programId: string;
  label: string;
  category?: string;
  valueState?: ValueLineState;
  projectedAmount?: number;
  valueUnit?: ValueUnit;
  measurementOwnerId?: string;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateValueLineInput {
  label?: string;
  category?: string;
  valueState?: ValueLineState;
  projectedAmount?: number;
  committedAmount?: number;
  realizedAmount?: number;
  valueUnit?: ValueUnit;
  measurementOwnerId?: string;
  evidenceArtifactId?: string;
  notes?: string;
  sortOrder?: number;
}

// Summary view used by T07/T11 design templates
export interface ValueLedgerSummary {
  programId: string;
  totalLines: number;
  byState: Record<ValueLineState, number>;
  projectedTotalUsd: number;
  committedTotalUsd: number;
  realizedTotalUsd: number;
  linesNeedingOwner: number;
  linesNeedingEvidence: number;
}

export function summarizeValueLines(lines: SourceValueLine[]): ValueLedgerSummary {
  const byState: Record<ValueLineState, number> = {
    projected: 0,
    committed: 0,
    measuring: 0,
    realized: 0,
  };
  let projectedTotal = 0;
  let committedTotal = 0;
  let realizedTotal = 0;
  let needsOwner = 0;
  let needsEvidence = 0;

  for (const line of lines) {
    byState[line.valueState]++;
    if (line.valueUnit === 'usd') {
      projectedTotal += line.projectedAmount ?? 0;
      committedTotal += line.committedAmount ?? 0;
      realizedTotal += line.realizedAmount ?? 0;
    }
    if (!line.measurementOwnerId) needsOwner++;
    if (line.valueState === 'realized' && !line.evidenceArtifactId) needsEvidence++;
  }

  return {
    programId: lines[0]?.programId ?? '',
    totalLines: lines.length,
    byState,
    projectedTotalUsd: projectedTotal,
    committedTotalUsd: committedTotal,
    realizedTotalUsd: realizedTotal,
    linesNeedingOwner: needsOwner,
    linesNeedingEvidence: needsEvidence,
  };
}
