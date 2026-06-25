import type {
  IntelligenceArtifactType,
  IntelligenceDimension,
  IntelligenceIntent,
  IntelligenceRoute,
} from "./types";

interface RouteRule {
  intent: IntelligenceIntent;
  keywords: RegExp[];
  primaryDimension: IntelligenceDimension;
  relatedDimensions: IntelligenceDimension[];
  tenantEvidenceRequired: string[];
  corpusPatternFamiliesRequired: string[];
  expertLensesRequired: string[];
  benchmarkTypesRequired: string[];
  expectedArtifacts: IntelligenceArtifactType[];
  decisionFrameRequired: boolean;
  handoffTargets: IntelligenceRoute["handoffTargets"];
}

const RULES: RouteRule[] = [
  {
    intent: "investment_prioritization",
    keywords: [/\b(invest|investment|fund|funding|allocate|\$\d|capital|where should.*spend)\b/i],
    primaryDimension: "ai_value_governance",
    relatedDimensions: ["budget_financials", "data_analytics", "operations_process", "risk_compliance"],
    tenantEvidenceRequired: ["AI portfolio", "budget lines", "benefit evidence", "risk/control gates"],
    corpusPatternFamiliesRequired: ["value-realization", "ai-adoption", "operating-model"],
    expertLensesRequired: ["industry operator", "CFO/value", "data platform", "AI governance"],
    benchmarkTypesRequired: ["value range", "implementation maturity", "adoption curve"],
    expectedArtifacts: ["executive_answer", "option_matrix", "table", "risk_panel", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["moves", "tower"],
  },
  {
    intent: "kill_hold_scale",
    keywords: [/\b(scale|hold|stop|kill|pause|prioriti[sz]e|rank)\b/i],
    primaryDimension: "ai_value_governance",
    relatedDimensions: ["operations_process", "data_analytics", "risk_compliance", "budget_financials"],
    tenantEvidenceRequired: ["initiative portfolio", "value evidence", "risk gates", "owner/accountability"],
    corpusPatternFamiliesRequired: ["scale-hold-kill", "adoption-risk", "value-leakage"],
    expertLensesRequired: ["industry operator", "value office", "architecture/data", "change adoption"],
    benchmarkTypesRequired: ["success odds", "ROI clarity", "adoption readiness"],
    expectedArtifacts: ["executive_answer", "option_matrix", "table", "risk_panel", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["moves", "tower"],
  },
  {
    intent: "sourcing_strategy",
    keywords: [/\b(source|sourcing|vendor selection|rfp|negotiate|procure|commercial)\b/i],
    primaryDimension: "vendor_contracts",
    relatedDimensions: ["applications_systems", "budget_financials", "risk_compliance"],
    tenantEvidenceRequired: ["vendor inventory", "contract context", "spend basis", "system dependency"],
    corpusPatternFamiliesRequired: ["vendor-concentration", "commercial-leverage", "sourcing-risk"],
    expertLensesRequired: ["sourcing/commercial", "enterprise architect", "vendor risk", "finance/value"],
    benchmarkTypesRequired: ["contract concentration", "switching cost", "market maturity"],
    expectedArtifacts: ["executive_answer", "table", "option_matrix", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["source"],
  },
  {
    intent: "vendor_concentration",
    keywords: [/\b(vendor|contract|supplier|renewal|concentration|license|run cost)\b/i],
    primaryDimension: "vendor_contracts",
    relatedDimensions: ["applications_systems", "budget_financials", "risk_compliance"],
    tenantEvidenceRequired: ["vendor spend", "contract map", "supported systems"],
    corpusPatternFamiliesRequired: ["vendor-risk", "platform-rationalization"],
    expertLensesRequired: ["sourcing/commercial", "enterprise architecture", "risk/compliance"],
    benchmarkTypesRequired: ["spend concentration", "renewal risk"],
    expectedArtifacts: ["executive_answer", "table", "chart", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["source"],
  },
  {
    intent: "data_estate_modernization",
    keywords: [/\b(data|analytics|lakehouse|warehouse|bi|lineage|quality|cdp|mdm)\b/i],
    primaryDimension: "data_analytics",
    relatedDimensions: ["applications_systems", "ai_value_governance", "operations_process", "risk_compliance"],
    tenantEvidenceRequired: ["data product inventory", "lineage", "quality gates", "AI dependencies"],
    corpusPatternFamiliesRequired: ["data-platform", "data-governance", "ai-readiness"],
    expertLensesRequired: ["CDO/data platform", "enterprise architect", "AI readiness", "governance/privacy"],
    benchmarkTypesRequired: ["maturity", "data-quality threshold", "AI-readiness pattern"],
    expectedArtifacts: ["executive_answer", "table", "graph", "risk_panel", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["moves", "tower"],
  },
  {
    intent: "enterprise_architecture",
    keywords: [/\b(architecture|dependency|cmdb|integration|interface|topology|system map|graph)\b/i],
    primaryDimension: "applications_systems",
    relatedDimensions: ["data_analytics", "vendor_contracts", "operations_process", "risk_compliance"],
    tenantEvidenceRequired: ["system inventory", "dependencies", "interfaces", "ownership"],
    corpusPatternFamiliesRequired: ["modernization", "integration-risk", "platform-debt"],
    expertLensesRequired: ["enterprise architect", "integration/API", "resilience", "security"],
    benchmarkTypesRequired: ["technical-debt pattern", "integration complexity"],
    expectedArtifacts: ["executive_answer", "graph", "table", "risk_panel", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["moves", "tower"],
  },
  {
    intent: "operational_automation",
    keywords: [/\b(operations|process|workflow|ticket|jira|servicenow|itsm|automation|contact center|back office)\b/i],
    primaryDimension: "operations_process",
    relatedDimensions: ["applications_systems", "ai_value_governance", "operating_model", "risk_compliance"],
    tenantEvidenceRequired: ["work items", "service/process signals", "system-service map", "automation footprint"],
    corpusPatternFamiliesRequired: ["process-automation", "service-operations", "agentic-workflow"],
    expertLensesRequired: ["operations leader", "ITSM/process", "AI engineering", "change adoption"],
    benchmarkTypesRequired: ["throughput", "cycle time", "automation readiness"],
    expectedArtifacts: ["executive_answer", "table", "chart", "risk_panel", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["moves", "tower"],
  },
  {
    intent: "ai_governance",
    keywords: [/\b(governance|model risk|responsible ai|control|guardrail|policy|compliance)\b/i],
    primaryDimension: "ai_value_governance",
    relatedDimensions: ["risk_compliance", "data_analytics", "operating_model"],
    tenantEvidenceRequired: ["AI assets", "control evidence", "policy/gate evidence"],
    corpusPatternFamiliesRequired: ["ai-governance", "model-risk", "responsible-ai"],
    expertLensesRequired: ["AI governance", "risk/compliance", "data privacy", "operating model"],
    benchmarkTypesRequired: ["control maturity", "model-risk practice"],
    expectedArtifacts: ["executive_answer", "risk_panel", "table", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["tower"],
  },
  {
    intent: "cost_optimization",
    keywords: [/\b(cost|spend|budget|run|change|opex|capex|savings|takeout)\b/i],
    primaryDimension: "budget_financials",
    relatedDimensions: ["vendor_contracts", "applications_systems", "ai_value_governance"],
    tenantEvidenceRequired: ["budget lines", "vendor spend", "application cost", "benefit evidence"],
    corpusPatternFamiliesRequired: ["cost-takeout", "run-change", "vendor-rationalization"],
    expertLensesRequired: ["CFO/value", "IT spend optimization", "sourcing", "enterprise architecture"],
    benchmarkTypesRequired: ["run/change mix", "spend concentration", "savings range"],
    expectedArtifacts: ["executive_answer", "table", "chart", "option_matrix", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["tower", "source"],
  },
  {
    intent: "risk_assessment",
    keywords: [/\b(risk|fragile|blocker|constraint|exposure|failure|audit|security)\b/i],
    primaryDimension: "risk_compliance",
    relatedDimensions: ["applications_systems", "data_analytics", "operations_process", "ai_value_governance"],
    tenantEvidenceRequired: ["risk/control rows", "system dependency", "data readiness", "delivery risk"],
    corpusPatternFamiliesRequired: ["failure-mode", "risk-control", "resilience"],
    expertLensesRequired: ["risk/compliance", "enterprise architect", "operator", "AI governance"],
    benchmarkTypesRequired: ["risk severity", "control maturity"],
    expectedArtifacts: ["executive_answer", "risk_panel", "table", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["tower"],
  },
  {
    intent: "strategy",
    keywords: [/\b(strategy|strategic|what does it mean|implication|leadership|board|cxo|executive)\b/i],
    primaryDimension: "enterprise_strategy",
    relatedDimensions: ["ai_value_governance", "data_analytics", "applications_systems", "budget_financials"],
    tenantEvidenceRequired: ["enterprise profile", "portfolio evidence", "value evidence", "risk/control gates"],
    corpusPatternFamiliesRequired: ["industry-pattern", "portfolio-strategy", "value-realization"],
    expertLensesRequired: ["industry operator", "CIO/architecture", "CFO/value", "risk/governance"],
    benchmarkTypesRequired: ["peer pattern", "market maturity", "value pool"],
    expectedArtifacts: ["executive_answer", "option_matrix", "risk_panel", "source_list"],
    decisionFrameRequired: true,
    handoffTargets: ["moves", "tower"],
  },
];

const DEFAULT_RULE: RouteRule = {
  intent: "portfolio_review",
  keywords: [],
  primaryDimension: "enterprise_strategy",
  relatedDimensions: ["ai_value_governance", "applications_systems", "data_analytics", "vendor_contracts"],
  tenantEvidenceRequired: ["enterprise profile", "portfolio evidence", "sources and gaps"],
  corpusPatternFamiliesRequired: ["portfolio-review", "industry-pattern", "value-realization"],
  expertLensesRequired: ["industry operator", "CIO/architecture", "CFO/value"],
  benchmarkTypesRequired: ["peer pattern", "maturity", "value confidence"],
  expectedArtifacts: ["executive_answer", "option_matrix", "table", "source_list"],
  decisionFrameRequired: true,
  handoffTargets: ["moves", "tower"],
};

export function routeIntelligenceQuestion(input: {
  tenantKey?: string | null;
  question: string;
}): IntelligenceRoute {
  const normalized = input.question.trim();
  const rule = RULES.find((candidate) => candidate.keywords.some((keyword) => keyword.test(normalized))) ?? DEFAULT_RULE;
  return {
    tenantKey: input.tenantKey ?? null,
    question: normalized,
    intelligenceIntent: rule.intent,
    primaryDimension: rule.primaryDimension,
    relatedDimensions: rule.relatedDimensions,
    tenantEvidenceRequired: rule.tenantEvidenceRequired,
    corpusPatternFamiliesRequired: rule.corpusPatternFamiliesRequired,
    expertLensesRequired: rule.expertLensesRequired,
    benchmarkTypesRequired: rule.benchmarkTypesRequired,
    decisionFrameRequired: rule.decisionFrameRequired,
    expectedArtifacts: rule.expectedArtifacts,
    handoffTargets: rule.handoffTargets,
  };
}
