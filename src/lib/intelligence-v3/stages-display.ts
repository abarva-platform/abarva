// Pure types + display helpers for By function · Peer activity ·
// My strategy stages. No `import 'server-only'` so client canvases
// can pull these directly.

import type { Stage, StatusFlag } from '@/lib/admin/ai-initiatives/labels';

// ---------------------------------------------------------------------
// By function
// ---------------------------------------------------------------------

export interface FunctionInitiativeLink {
  initiativeId: string;
  displayId: string;
  name: string;
  statusFlag: StatusFlag;
  statusSummary: string;
  stage: Stage;
  committedAnnualUsd: number | null;
  measuredValueUsd: number | null;
  alignedCallout: boolean;
  alignedRationale: string | null;
}

export interface FunctionRollup {
  function: string;
  layer: 'experience' | 'decision' | 'operations';
  initiatives: ReadonlyArray<FunctionInitiativeLink>;
  counts: {
    total: number;
    healthy: number;
    atRisk: number;
    aligned: number;
  };
  committedAnnualUsd: number;
  measuredValueUsd: number;
  pendingDecisions: number;
  stalledDecisions: number;
  upcomingRenewals: ReadonlyArray<{
    vendorName: string;
    renewalDate: string;
    initiativeId: string;
  }>;
}

export interface ByFunctionData {
  functions: ReadonlyArray<FunctionRollup>;
}

export const LAYER_LABELS: Record<FunctionRollup['layer'], string> = {
  experience: 'Front Office',
  decision: 'Middle Office',
  operations: 'Back Office',
};

// ---------------------------------------------------------------------
// Peer activity
// ---------------------------------------------------------------------

export interface PeerSignal {
  initiativeId: string;
  initiativeDisplayId: string;
  initiativeName: string;
  kpiName: string;
  kpiUnit: string | null;
  quarter: string;
  tenantValue: number;
  peerMedian: number;
  targetValue: number | null;
  /** tenantValue - peerMedian. */
  deltaVsPeer: number;
  /** Percent delta of tenantValue from peerMedian. */
  deltaPctVsPeer: number;
}

export interface PeerActivityData {
  signals: ReadonlyArray<PeerSignal>;
  totals: {
    kpiCount: number;
    aheadOfPeer: number;
    behindPeer: number;
    onPar: number;
  };
}

// ---------------------------------------------------------------------
// My strategy
// ---------------------------------------------------------------------

export interface StrategyTheme {
  goalId: string;
  goalName: string;
  strategicContext: string;
  initiativeCount: number;
  committedAnnualUsd: number;
  measuredValueUsd: number;
  healthyCount: number;
  atRiskCount: number;
  alignedCount: number;
  initiatives: ReadonlyArray<{
    initiativeId: string;
    displayId: string;
    name: string;
    statusFlag: StatusFlag;
    alignedCallout: boolean;
  }>;
}

export interface MyStrategyData {
  themes: ReadonlyArray<StrategyTheme>;
  totals: {
    themeCount: number;
    committedTotalUsd: number;
    alignedCount: number;
    themesWithGap: number;
  };
}
