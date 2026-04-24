export type AtlasRouteType = 'scripted' | 'llm' | 'hybrid' | 'tool_augmented';

export type AtlasIntent =
  | 'morning_summary'
  | 'shadow_ai_detail'
  | 'cohort_position'
  | 'portfolio_status'
  | 'roi'
  | 'idle_seats'
  | 'signal_detail'
  | 'strategy_refusal'
  | 'llm';

export interface AtlasTenancyCtx {
  clientId: string;
  userId: string | null;
}

export interface AtlasSuggestion {
  label: string;
  value: string;
  kind?: 'message' | 'signal' | 'link';
  href?: string;
}

export interface AtlasPortfolioSummary {
  clientId: string;
  clientName: string;
  activeUseCaseCount: number;
  criticalSignalCount: number;
  warningSignalCount: number;
  governedAiSpendUsd: number;
  shadowAiSpendUsd: number;
  estimatedValueUsd: number;
  realizedValueUsd: number;
  averageTrustworthinessScore: number | null;
  staleIntegrationCount: number;
  adoptionPenetrationPctAvg: number | null;
  trackedActiveUsers: number | null;
  distinctAiVendorsCount: number | null;
  valueAttainmentPctAvg: number | null;
  adoptionPercentile: number | null;
  spendIntensityPercentile: number | null;
  valueAttainmentPercentile: number | null;
  vendorCountPercentile: number | null;
  asOf: string | null;
}

export interface AtlasSignalSummary {
  id: string;
  headline: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'new' | 'triaged' | 'actioned' | 'resolved' | 'suppressed';
  impactUsd: number | null;
  firedAt: string | null;
  signalKey: string;
  signalTitle: string;
  pillar: 'inventory' | 'adoption' | 'value' | 'risk' | 'cost' | 'cross_pillar';
  cohortLabel: string | null;
  percentile: number | null;
  evidenceSummary: Record<string, unknown>;
}

export interface AtlasEvidenceItem {
  id: string;
  position: number;
  evidenceType: string;
  sourceLabel: string;
  artifactRef: string | null;
  vendorName: string | null;
  title: string;
  summary: string | null;
  amountUsd: number | null;
  metricValue: number | null;
  metricUnit: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  metadata: Record<string, unknown>;
}

export interface AtlasBenchmarkPoint {
  label: string;
  value: number;
  kind: 'peer' | 'apex' | 'median' | 'p75';
}

export interface AtlasBenchmark {
  metricName: string;
  pillar: 'inventory' | 'adoption' | 'value' | 'risk' | 'cost' | 'cross_pillar';
  label: string | null;
  sampleSize: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  apexValue: number | null;
  apexPercentile: number | null;
  note: string | null;
  peers: AtlasBenchmarkPoint[];
}

export interface AtlasSignalDetail extends AtlasSignalSummary {
  narrative: Record<string, unknown>;
  evidence: AtlasEvidenceItem[];
  cohortContext: Record<string, unknown>;
  benchmark: AtlasBenchmark | null;
  recommendedActions: string[];
}

export interface AtlasObservation {
  id: string;
  summary: string;
  severity: 'critical' | 'warning' | 'info' | null;
  observationKind: 'summary' | 'recommendation' | 'risk_callout' | 'cohort_context' | 'anomaly';
  routeType: AtlasRouteType | 'rule';
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AtlasToolResultMap {
  portfolio?: AtlasPortfolioSummary;
  signals?: AtlasSignalSummary[];
  signalDetail?: AtlasSignalDetail | null;
  benchmark?: AtlasBenchmark | null;
  observations?: AtlasObservation[];
  programs?: Array<{
    id: string;
    name: string;
    currentPhase: number | null;
    status: string | null;
    originSource: string | null;
  }>;
  useCases?: Array<{
    id: string;
    name: string;
    stage: string | null;
    businessUnit: string | null;
    vendor: string | null;
  }>;
}

export interface AtlasTurnResult extends AtlasChatResponse {
  toolResults: AtlasToolResultMap;
  modelName: string | null;
  promptVersion: string;
}

export interface AtlasChatResponse {
  threadId: string;
  routeType: AtlasRouteType;
  intent: AtlasIntent;
  response: string;
  suggestions: AtlasSuggestion[];
  signalId?: string | null;
  observationId?: string | null;
  toolsUsed: string[];
}
