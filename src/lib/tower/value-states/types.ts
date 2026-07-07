import type { TowerAiOpsCostLedger } from '@/lib/tower/ai-ops-cost-ledger';

export const VALUE_STATE_LAYERS = [
  'adoption',
  'dora_delta',
  'hours_saved',
  'hours_reallocated',
  'license_dollars',
  'realized_value_usd',
  'process_changes_shipped',
  'kill_criteria_status',
] as const;

export type ValueStateLayer = (typeof VALUE_STATE_LAYERS)[number];
export type ValueStateKind = 'projected' | 'tracked' | 'verified';
export type ValueFormat = 'percent' | 'hours' | 'usd' | 'count' | 'status';

export interface ValueLayerDefinition {
  layer: ValueStateLayer;
  label: string;
  format: ValueFormat;
  description: string;
}

export const VALUE_LAYER_DEFINITIONS: Record<ValueStateLayer, ValueLayerDefinition> = {
  adoption: {
    layer: 'adoption',
    label: 'Adoption',
    format: 'percent',
    description: 'Licensed AI SDLC seats converting into active usage.',
  },
  dora_delta: {
    layer: 'dora_delta',
    label: 'DORA delta',
    format: 'percent',
    description: 'Expected delivery-system improvement from deployment, lead time, MTTR, reliability, and change-failure movement.',
  },
  hours_saved: {
    layer: 'hours_saved',
    label: 'Hours saved',
    format: 'hours',
    description: 'Gross engineering hours freed by AI-assisted delivery across the scoped cohort.',
  },
  hours_reallocated: {
    layer: 'hours_reallocated',
    label: 'Hours reallocated',
    format: 'hours',
    description: 'Hours explicitly steered into the named reallocation queue instead of evaporating.',
  },
  license_dollars: {
    layer: 'license_dollars',
    label: 'License $',
    format: 'usd',
    description: 'Annual AI SDLC tooling spend under measurement.',
  },
  realized_value_usd: {
    layer: 'realized_value_usd',
    label: 'Realized $ value',
    format: 'usd',
    description: 'Financial value of reallocated capacity after license cost and delivery confidence.',
  },
  process_changes_shipped: {
    layer: 'process_changes_shipped',
    label: 'Process changes shipped',
    format: 'count',
    description: 'Operating-model and workflow changes shipped into teams.',
  },
  kill_criteria_status: {
    layer: 'kill_criteria_status',
    label: 'Kill-criteria status',
    format: 'status',
    description: 'Current deterministic kill-criteria posture for the Move.',
  },
};

export interface ValueEvidenceRef {
  id: string;
  label: string;
  href?: string;
  source: string;
  confidence: 'high' | 'medium' | 'low' | 'stub';
}

export interface ValueStateCell {
  kind: ValueStateKind;
  value: number | string | null;
  unit: ValueFormat;
  label: string;
  confidence: 'high' | 'medium' | 'low' | 'stub' | 'attested';
  basis: string;
  computedAt: string | null;
  evidence: ValueEvidenceRef[];
  attestation?: {
    actorId: string;
    actorRole: string | null;
    attestedAt: string;
    note: string | null;
  };
}

export interface ValueLayerState {
  id: string | null;
  moveId: string;
  layer: ValueStateLayer;
  definition: ValueLayerDefinition;
  projected: ValueStateCell;
  tracked: ValueStateCell;
  verified: ValueStateCell;
  variance: {
    trackedVsProjected: number | null;
    verifiedVsProjected: number | null;
    unit: ValueFormat;
  };
  updatedAt: string | null;
}

export interface TowerMoveValueDetail {
  move: {
    id: string;
    name: string;
    status: string | null;
    lifecycleState: string | null;
    currentPhase: number | null;
    currentGate: string | null;
    templateKind: 'Move' | 'SourceWorkflow' | null;
    templateSlug: string | null;
    templateName: string | null;
  };
  client: {
    id: string;
    key: string | null;
  };
  layers: ValueLayerState[];
  totals: {
    projectedUsd: number;
    trackedUsd: number;
    verifiedUsd: number;
    projectedHours: number;
    trackedHours: number;
    verifiedHours: number;
  };
  aiOpsCost: TowerAiOpsCostLedger;
  canAttest: boolean;
  p10: {
    source: 'move_dependencies' | 'fallback';
    arrows: TowerPortfolioArrow[];
  };
}

export interface TowerPortfolioMove {
  moveId: string;
  moveName: string;
  templateKind: 'Move' | 'SourceWorkflow' | null;
  templateSlug: string | null;
  status: string | null;
  currentGate: string | null;
  projectedUsd: number;
  trackedUsd: number;
  verifiedUsd: number;
  href: string;
}

export interface TowerPortfolioArrow {
  id: string;
  fromMoveId: string;
  fromMoveName: string;
  toMoveId: string;
  toMoveName: string;
  relationType: string;
  note: string | null;
}

export interface TowerPortfolioValueRollup {
  clientId: string;
  moves: TowerPortfolioMove[];
  arrows: TowerPortfolioArrow[];
  p10Source: 'move_dependencies' | 'fallback';
  totals: {
    projectedUsd: number;
    trackedUsd: number;
    verifiedUsd: number;
    activeMoveCount: number;
    activeSourceWorkflowCount: number;
  };
}
