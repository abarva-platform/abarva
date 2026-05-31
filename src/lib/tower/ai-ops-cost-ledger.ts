import type { ModelTier } from '@/lib/programs/expert-kernel/ai-ops-cost/types';
import type { ValueLayerState } from '@/lib/tower/value-states/types';

export interface TowerAiOpsCostLedgerEntry {
  projectedThreeYearUsd: number;
  realizedToDateUsd: number;
  realizedAsOf: string;
  varianceReasonCode: string | null;
  tierBreachAlert: { threshold: number; projectedDate: string } | null;
  modelTierDriftAlert: { fromTier: ModelTier; toTier: ModelTier; deltaUsd: number } | null;
  evidence: 'live' | 'estimated' | 'seed';
  source: string;
}

export interface TowerAiOpsVarianceAlert {
  severity: 'warning';
  message: string;
  projectedThreeYearUsd: number;
  realizedToDateUsd: number;
  variancePct: number;
}

export interface TowerAiOpsCostLedger {
  entry: TowerAiOpsCostLedgerEntry;
  alert: TowerAiOpsVarianceAlert | null;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function finiteOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function findLayer(layers: readonly ValueLayerState[], layerName: ValueLayerState['layer']): ValueLayerState | null {
  return layers.find((layer) => layer.layer === layerName) ?? null;
}

export function buildAiOpsVarianceAlert(
  entry: TowerAiOpsCostLedgerEntry,
): TowerAiOpsVarianceAlert | null {
  if (entry.projectedThreeYearUsd <= 0) return null;
  if (entry.varianceReasonCode) return null;
  const variancePct =
    ((entry.realizedToDateUsd - entry.projectedThreeYearUsd) /
      entry.projectedThreeYearUsd) *
    100;
  if (variancePct <= 10) return null;
  return {
    severity: 'warning',
    message: `AI ops cost is ${formatPercent(variancePct)} above the locked three-year projection and no reason code is on file.`,
    projectedThreeYearUsd: entry.projectedThreeYearUsd,
    realizedToDateUsd: entry.realizedToDateUsd,
    variancePct,
  };
}

export function buildTowerAiOpsCostLedger(input: {
  projectedThreeYearUsd: number;
  realizedToDateUsd: number;
  realizedAsOf: string;
  varianceReasonCode?: string | null;
  tierBreachAlert?: TowerAiOpsCostLedgerEntry['tierBreachAlert'];
  modelTierDriftAlert?: TowerAiOpsCostLedgerEntry['modelTierDriftAlert'];
  evidence?: TowerAiOpsCostLedgerEntry['evidence'];
  source?: string;
}): TowerAiOpsCostLedger {
  const entry: TowerAiOpsCostLedgerEntry = {
    projectedThreeYearUsd: Math.max(0, finiteOrZero(input.projectedThreeYearUsd)),
    realizedToDateUsd: Math.max(0, finiteOrZero(input.realizedToDateUsd)),
    realizedAsOf: input.realizedAsOf,
    varianceReasonCode: input.varianceReasonCode ?? null,
    tierBreachAlert: input.tierBreachAlert ?? null,
    modelTierDriftAlert: input.modelTierDriftAlert ?? null,
    evidence: input.evidence ?? 'estimated',
    source: input.source ?? 'Tower AI ops cost ledger',
  };
  return {
    entry,
    alert: buildAiOpsVarianceAlert(entry),
  };
}

export function buildTowerAiOpsCostLedgerFromValueLayers(
  layers: readonly ValueLayerState[],
  realizedAsOf: string,
): TowerAiOpsCostLedger {
  const licenseLayer = findLayer(layers, 'license_dollars');
  const projectedAnnualToolUsd = finiteOrZero(licenseLayer?.projected.value);
  const trackedAnnualToolUsd = finiteOrZero(licenseLayer?.tracked.value);
  return buildTowerAiOpsCostLedger({
    projectedThreeYearUsd: projectedAnnualToolUsd * 3,
    realizedToDateUsd: trackedAnnualToolUsd,
    realizedAsOf,
    evidence: 'estimated',
    source:
      'Estimated from Tower license-dollar layer until inference, embedding, and eval cost ledgers are live-wired.',
  });
}
