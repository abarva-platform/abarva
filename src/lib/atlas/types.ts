import type { MetricExplanation } from "@/lib/tower/metric-explanation-view";
import type { MetricProvenanceKey } from "@/lib/tower/metric-provenance";
import type { RetrievalContext } from "@/lib/agent/retrieval";
import type { AtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";
import type { AgentGroundingDisclosure } from "@/lib/intelligence/canonical/agent-grounding-disclosure";

export type AtlasRouteType = "scripted" | "llm" | "hybrid" | "tool_augmented";

export type AtlasIntent =
  // ---- Original 8 (pre-expansion)
  | "morning_summary"
  | "shadow_ai_detail"
  | "cohort_position"
  | "portfolio_status"
  | "metric_explanation"
  | "roi"
  | "idle_seats"
  | "copilot_usage_value"
  | "signal_detail"
  | "strategy_refusal"
  | "llm"
  // ---- Portfolio diagnostics (audit §3.1)
  | "lagging_programs_by_value"
  | "value_attainment_vs_commitment"
  | "at_risk_gates"
  | "portfolio_confidence"
  // ---- Peer / industry (audit §3.2)
  | "peer_adoption_compare"
  | "industry_leaders"
  | "cohort_lagging"
  // ---- Spend / cost (audit §3.3)
  | "ai_spend_vs_budget"
  | "vendor_concentration_risk"
  | "cost_overruns"
  // ---- Risk / governance (audit §3.4)
  | "shadow_ai_exposure"
  | "governance_coverage_gaps"
  | "regulatory_open_items"
  // ---- Decisions (audit §3.5)
  | "fund_next_why"
  | "kill_next_why"
  | "reshape_next_why"
  // ---- Drilldown (audit §3.6)
  | "program_drilldown"
  | "signal_drilldown"
  | "vendor_drilldown"
  // ---- Compare / hypothetical (audit §3.7)
  | "cut_program_impact"
  | "fund_x_vs_y"
  // ---- Federated Tower governance
  | "federated_visibility_boundary";

export interface AtlasMetricExplanationRequest {
  source: "tower_metric_provenance";
  metricKey: MetricProvenanceKey;
  displayValue?: string;
  displayConfidence?: "high" | "med" | "low" | "none";
  mode?: "why" | "levers";
}

export interface AtlasTenancyCtx {
  clientId: string;
  clientKey?: string | null;
  userId: string | null;
}

export interface AtlasSuggestion {
  label: string;
  value: string;
  kind?: "message" | "signal" | "link";
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
  severity: "critical" | "warning" | "info";
  state: "new" | "triaged" | "actioned" | "resolved" | "suppressed";
  impactUsd: number | null;
  firedAt: string | null;
  signalKey: string;
  signalTitle: string;
  pillar: "inventory" | "adoption" | "value" | "risk" | "cost" | "cross_pillar";
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
  confidence: "high" | "medium" | "low" | null;
  metadata: Record<string, unknown>;
}

export interface AtlasBenchmarkPoint {
  label: string;
  value: number;
  kind: "peer" | "apex" | "median" | "p75";
}

export interface AtlasBenchmark {
  metricName: string;
  pillar: "inventory" | "adoption" | "value" | "risk" | "cost" | "cross_pillar";
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
  severity: "critical" | "warning" | "info" | null;
  observationKind:
    | "summary"
    | "recommendation"
    | "risk_callout"
    | "cohort_context"
    | "anomaly";
  routeType: AtlasRouteType | "rule";
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AtlasToolResultMap {
  towerState?: AtlasTowerCurrentState;
  retrievalContext?: RetrievalContext;
  valueGrounding?: AtlasValueGrounding;
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
  metricExplanation?: MetricExplanation;
}

export interface AtlasValueEvidencePoint {
  label: string;
  value: string;
  basis: string;
  status: "projected" | "tracked" | "verified" | "missing";
}

export interface AtlasValueGroundingPattern {
  canonicalId: string;
  title: string;
  confidenceLevel: string;
  score: number;
  matchReasons: string[];
  valueHypothesis: string;
  primaryKpis: string[];
  secondaryKpis: string[];
  baselineNeeded: string[];
  measurementMethod: string;
  valueLevers: string[];
  sourceBasis: string;
  sourceReferencesCount: number;
  confidenceRationale: string;
  missingProvenance: boolean;
  missingRequiredFields: string[];
  unsupportedClaimFlags: string[];
  quantitativeClaimCount: number;
}

export interface AtlasValueGrounding {
  source: "persisted_canonical_corpus";
  status: "ready" | "empty" | "no_match" | "error";
  warnings: string[];
  filtersApplied: Record<string, unknown>;
  valueSeparation: {
    projected: AtlasValueEvidencePoint;
    tracked: AtlasValueEvidencePoint[];
    verified: AtlasValueEvidencePoint;
  };
  patterns: AtlasValueGroundingPattern[];
  missingEvidence: string[];
}

export type AtlasExecutionMode = "live" | "fallback";

export interface AtlasTurnResult extends AtlasChatResponse {
  toolResults: AtlasToolResultMap;
  modelName: string | null;
  promptVersion: string;
  debugTrace?: AtlasDebugTrace;
}

export interface AtlasDebugTrace {
  routing: {
    promptVersion: string;
    dossierId: string | null;
    dossierVersion: string | null;
    dossierBuiltAt: string | null;
    fallbackUsed: boolean;
    fallbackReason: string | null;
    shapeIssues: string[];
  };
  finalPrompt: string | null;
  rawModelResponse: string | null;
  renderedResponse: string;
  replacements: Array<{ from: string; to: string }>;
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
  atlasMode: AtlasExecutionMode;
  fallbackReason?: string | null;
  metricExplanation?: MetricExplanation;
  groundingDisclosure?: AgentGroundingDisclosure;
  debugTrace?: AtlasDebugTrace;
}
