import type {
  ContextPackPurpose,
  KnowledgeModuleKey,
  ModuleContextRequest,
  RequestedKnowledgeDomain,
} from "../contracts";
import type { IntentClassification, KnowledgeArchetypeKey } from "./fixture-input";

type ArchetypeDefinition = {
  archetypeKey: KnowledgeArchetypeKey;
  label: string;
  keywords: string[];
  requiredDomains: RequestedKnowledgeDomain[];
  moduleIntentByModule: Partial<Record<KnowledgeModuleKey, string>>;
  purposeHints: ContextPackPurpose[];
};

const SHARED_EVIDENCE_DOMAINS: RequestedKnowledgeDomain[] = [
  "evidence",
  "relationships",
  "metrics_outcomes",
  "risks_controls",
];

const ARCHETYPES: ArchetypeDefinition[] = [
  {
    archetypeKey: "analytics_modernization",
    label: "Analytics modernization",
    keywords: [
      "analytics",
      "reporting",
      "finance",
      "budget",
      "value",
      "mart",
      "dashboard",
      "data",
      "lakehouse",
      "databricks",
      "vendor",
      "contract",
      "managed services",
    ],
    requiredDomains: [
      "functions",
      "applications_systems",
      "data_domains",
      "infrastructure",
      "vendors_contracts",
      "programs",
      ...SHARED_EVIDENCE_DOMAINS,
    ],
    moduleIntentByModule: {
      home: "orient_to_enterprise_context",
      intelligence: "assess_strategy_readiness",
      source: "inspect_vendor_and_contract_context",
      tower: "inspect_budget_value_and_measurement_context",
      moves: "prepare_evidence_for_transformation_phase",
    },
    purposeHints: ["executive_orientation", "strategy_context", "measurement_context", "sourcing_context"],
  },
  {
    archetypeKey: "customer_service_ai",
    label: "Customer service AI",
    keywords: [
      "agent",
      "assist",
      "member",
      "customer",
      "service",
      "contact",
      "center",
      "call",
      "crm",
      "transcript",
      "knowledge",
      "next best",
    ],
    requiredDomains: [
      "functions",
      "processes",
      "applications_systems",
      "data_domains",
      "use_cases",
      "programs",
      ...SHARED_EVIDENCE_DOMAINS,
    ],
    moduleIntentByModule: {
      home: "orient_to_service_context",
      intelligence: "assess_customer_ai_readiness",
      moves: "assemble_phase_evidence_for_customer_ai",
      source: "inspect_contact_center_vendor_dependencies",
      tower: "inspect_member_experience_measurement_context",
    },
    purposeHints: ["evidence_extract", "phase_readiness", "strategy_context"],
  },
  {
    archetypeKey: "risk_ai_copilot",
    label: "Risk AI copilot",
    keywords: [
      "fraud",
      "risk",
      "copilot",
      "analyst",
      "alert",
      "case",
      "aml",
      "transaction",
      "model",
      "kyc",
      "governance",
    ],
    requiredDomains: [
      "functions",
      "processes",
      "applications_systems",
      "data_domains",
      "use_cases",
      "risks_controls",
      "metrics_outcomes",
      "vendors_contracts",
      "relationships",
      "evidence",
    ],
    moduleIntentByModule: {
      home: "orient_to_risk_operations_context",
      intelligence: "assess_risk_ai_readiness",
      moves: "assemble_phase_evidence_for_risk_ai",
      source: "inspect_risk_vendor_dependencies",
      tower: "inspect_risk_outcome_measurement_context",
    },
    purposeHints: ["strategy_context", "phase_readiness", "answer_context"],
  },
  {
    archetypeKey: "sourcing_optimization",
    label: "Sourcing optimization",
    keywords: ["vendor", "contract", "sourcing", "renewal", "managed services", "sla", "spend"],
    requiredDomains: [
      "vendors_contracts",
      "applications_systems",
      "functions",
      "metrics_outcomes",
      "risks_controls",
      "relationships",
      "evidence",
    ],
    moduleIntentByModule: {
      source: "inspect_sourcing_context",
      intelligence: "assess_commercial_strategy",
      tower: "inspect_vendor_value_measurement_context",
    },
    purposeHints: ["sourcing_context", "strategy_context"],
  },
  {
    archetypeKey: "operations_recovery",
    label: "Operations recovery",
    keywords: ["operations", "recovery", "resilience", "incident", "dispatch", "outage", "command"],
    requiredDomains: [
      "functions",
      "applications_systems",
      "processes",
      "programs",
      "metrics_outcomes",
      "risks_controls",
      "relationships",
      "evidence",
    ],
    moduleIntentByModule: {
      intelligence: "assess_operations_recovery_readiness",
      moves: "assemble_phase_evidence_for_operations_recovery",
      tower: "inspect_operational_outcome_measurement_context",
    },
    purposeHints: ["phase_readiness", "strategy_context", "measurement_context"],
  },
  {
    archetypeKey: "transaction_automation",
    label: "Transaction automation",
    keywords: ["automation", "workflow", "transaction", "coding", "prior authorization", "close"],
    requiredDomains: [
      "functions",
      "processes",
      "applications_systems",
      "data_domains",
      "programs",
      "metrics_outcomes",
      "risks_controls",
      "evidence",
    ],
    moduleIntentByModule: {
      intelligence: "assess_automation_readiness",
      moves: "assemble_phase_evidence_for_automation",
      tower: "inspect_automation_measurement_context",
    },
    purposeHints: ["evidence_extract", "phase_readiness", "strategy_context"],
  },
  {
    archetypeKey: "general_enterprise_context",
    label: "General enterprise context",
    keywords: ["enterprise", "context", "explain", "readiness", "gap", "overview"],
    requiredDomains: [
      "enterprise_profile",
      "functions",
      "applications_systems",
      "data_domains",
      "vendors_contracts",
      "programs",
      "risks_controls",
      "metrics_outcomes",
      "relationships",
      "evidence",
    ],
    moduleIntentByModule: {
      home: "orient_to_enterprise_context",
      intelligence: "prepare_fact_based_answer_context",
      moves: "prepare_phase_context",
      source: "prepare_sourcing_context",
      tower: "prepare_measurement_context",
    },
    purposeHints: ["executive_orientation", "answer_context"],
  },
];

export function classifyContextIntent(request: ModuleContextRequest): IntentClassification {
  const text = requestText(request);
  const ranked = ARCHETYPES.map((archetype) => ({
    archetype,
    score: scoreArchetype(archetype, text, request),
    matchedSignals: archetype.keywords.filter((keyword) => text.includes(keyword)),
  })).sort((left, right) => right.score - left.score);

  const winner = ranked[0]?.score > 0 ? ranked[0] : {
    archetype: ARCHETYPES[ARCHETYPES.length - 1],
    score: 1,
    matchedSignals: ["default_context"],
  };

  return {
    archetypeKey: winner.archetype.archetypeKey,
    confidence: Math.min(0.95, Math.max(0.45, 0.45 + winner.score / 20)),
    moduleIntent:
      winner.archetype.moduleIntentByModule[request.moduleKey] ??
      `prepare_${request.moduleKey}_context`,
    matchedSignals: winner.matchedSignals.length
      ? winner.matchedSignals
      : [winner.archetype.label.toLowerCase()],
    requiredDomains: mergeDomains(request.requestedDomains, winner.archetype.requiredDomains),
    domainRationale: [
      `${winner.archetype.label} requires ${winner.archetype.requiredDomains.join(", ")} context.`,
      `${request.moduleKey} requested ${request.purpose} with ${request.relationshipPolicy} relationships and ${request.evidencePolicy} evidence.`,
    ],
  };
}

function scoreArchetype(
  archetype: ArchetypeDefinition,
  text: string,
  request: ModuleContextRequest,
): number {
  const keywordScore = archetype.keywords.reduce(
    (score, keyword) => score + (text.includes(keyword) ? 3 : 0),
    0,
  );
  const domainScore = request.requestedDomains.reduce(
    (score, domain) => score + (archetype.requiredDomains.includes(domain) ? 1 : 0),
    0,
  );
  const purposeScore = archetype.purposeHints.includes(request.purpose) ? 2 : 0;
  return keywordScore + domainScore + purposeScore;
}

function requestText(request: ModuleContextRequest): string {
  return [
    request.tenantKey,
    request.moduleKey,
    request.purpose,
    request.scope?.question,
    request.scope?.portfolioScope,
    request.scope?.useCase,
    request.scope?.requiredEvidenceFamilies?.join(" "),
    request.requestedDomains.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function mergeDomains(
  requested: RequestedKnowledgeDomain[],
  required: RequestedKnowledgeDomain[],
): RequestedKnowledgeDomain[] {
  return Array.from(new Set([...requested, ...required]));
}
