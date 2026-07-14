import type {
  KnowledgeModuleKey,
  ModuleContextRequest,
  RequestedKnowledgeDomain,
} from "../contracts";

export type KnowledgeArchetypeKey =
  | "analytics_modernization"
  | "customer_service_ai"
  | "risk_ai_copilot"
  | "sourcing_optimization"
  | "operations_recovery"
  | "transaction_automation"
  | "general_enterprise_context";

export interface IntentClassification {
  archetypeKey: KnowledgeArchetypeKey;
  confidence: number;
  moduleIntent: string;
  matchedSignals: string[];
  requiredDomains: RequestedKnowledgeDomain[];
  domainRationale: string[];
}

export interface SemanticClusterInput {
  tenantKey: string;
  tenantName: string;
  clusterName: string;
  rowsMatched: number;
  painPoints: string[];
  evidenceItems: string[];
  metrics: string[];
  issues: string[];
  modernizationDependencies: string[];
  relationshipsPresent: number;
}

export interface ContextAssemblyBlueprint {
  catalogKey: string;
  tenantKey: string;
  tenantName: string;
  clusterName: string;
  contextTitle: string;
  primaryFunction: string;
  outcomeHypothesis: string;
  systems: string[];
  dataDomains: string[];
  infrastructure: string[];
  vendorsContracts: string[];
  spendContext: string[];
  programs: string[];
  risksControls: string[];
  metrics: string[];
  sourceContext: string[];
  movesPhase?: "P0" | "P1" | "P2" | "P3" | "P4" | "P5";
  moduleGuidance: Partial<Record<KnowledgeModuleKey, string>>;
}

export interface ContextAssemblyInput {
  request: ModuleContextRequest;
  intent: IntentClassification;
  blueprint: ContextAssemblyBlueprint;
  semanticCluster: SemanticClusterInput;
  generatedAt: string;
  inputSources: string[];
}
