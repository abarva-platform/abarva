import type {
  DimensionRoute,
  DossierDimensionFamily,
  DossierSourceRequirement,
  DossierSurface,
} from "./types";

const EXECUTIVE_INTERVIEW_SOURCE: DossierSourceRequirement = {
  sourceKey: "executive_interviews",
  required: false,
  purpose:
    "executive interview priorities, pain points, decision criteria, and evidence-to-confirm signals",
};

const SOURCE_REQUIREMENTS: Record<
  DossierDimensionFamily,
  DossierSourceRequirement[]
> = {
  organization_leadership: [
    {
      sourceKey: "F01_enterprise_profile",
      required: false,
      purpose: "enterprise context and scale",
    },
    EXECUTIVE_INTERVIEW_SOURCE,
    {
      sourceKey: "F02_business_org_functions",
      required: true,
      purpose: "business-function ownership",
    },
    {
      sourceKey: "F03_it_org_ownership",
      required: true,
      purpose: "IT organization and role accountability",
    },
    {
      sourceKey: "F04_capabilities_value_streams",
      required: false,
      purpose: "capability context",
    },
    {
      sourceKey: "F05_applications_systems",
      required: false,
      purpose: "systems supported by teams",
    },
    {
      sourceKey: "F12_it_budget_financials",
      required: false,
      purpose: "portfolio funding context",
    },
    {
      sourceKey: "D19_personas_workforce",
      required: false,
      purpose: "workforce/persona context",
    },
    {
      sourceKey: "F18_leadership_org_chart",
      required: false,
      purpose: "named leadership and reporting context",
    },
    {
      sourceKey: "F19_team_application_ownership",
      required: false,
      purpose: "team-to-application ownership joins",
    },
    {
      sourceKey: "F25_context_node_dictionary",
      required: false,
      purpose: "business-readable graph nodes",
    },
    {
      sourceKey: "F26_dimension_question_contracts",
      required: false,
      purpose: "dimension answer contract",
    },
    {
      sourceKey: "F27_source_context_narratives",
      required: false,
      purpose: "source narrative and caveats",
    },
  ],
  application_systems: [
    {
      sourceKey: "F05_applications_systems",
      required: true,
      purpose: "application inventory",
    },
    EXECUTIVE_INTERVIEW_SOURCE,
    {
      sourceKey: "F04_capabilities_value_streams",
      required: false,
      purpose: "capability and value-stream context",
    },
    {
      sourceKey: "F06_system_function_mapping",
      required: false,
      purpose: "system-to-function mapping",
    },
    {
      sourceKey: "F07_infrastructure_cloud",
      required: false,
      purpose: "hosting and platform context",
    },
    {
      sourceKey: "F08_platform_volumetrics",
      required: false,
      purpose: "platform volumes and usage",
    },
    {
      sourceKey: "F10_integrations_interfaces",
      required: false,
      purpose: "integration/dependency context",
    },
    {
      sourceKey: "F11_vendors_contracts_licenses",
      required: false,
      purpose: "vendor/commercial dependency",
    },
    {
      sourceKey: "F12_it_budget_financials",
      required: false,
      purpose: "run cost and portfolio funding",
    },
    {
      sourceKey: "F14_operations_service_management",
      required: false,
      purpose: "incident/change/service signals",
    },
    {
      sourceKey: "F19_team_application_ownership",
      required: false,
      purpose: "team ownership",
    },
    {
      sourceKey: "F20_capability_system_dependency",
      required: false,
      purpose: "capability dependency graph",
    },
    {
      sourceKey: "F22_contract_system_service_map",
      required: false,
      purpose: "contract-to-system dependency",
    },
    {
      sourceKey: "F23_operational_service_map",
      required: false,
      purpose: "service map context",
    },
    {
      sourceKey: "F25_context_node_dictionary",
      required: false,
      purpose: "business-readable graph nodes",
    },
  ],
  vendor_contracts: [
    {
      sourceKey: "F11_vendors_contracts_licenses",
      required: true,
      purpose: "vendor and contract inventory",
    },
    {
      sourceKey: "F05_applications_systems",
      required: false,
      purpose: "supported applications",
    },
    {
      sourceKey: "F04_capabilities_value_streams",
      required: false,
      purpose: "supported capabilities",
    },
    {
      sourceKey: "F12_it_budget_financials",
      required: false,
      purpose: "budget and run-cost context",
    },
    {
      sourceKey: "F16_security_risk_compliance",
      required: false,
      purpose: "vendor risk/control context",
    },
    {
      sourceKey: "F22_contract_system_service_map",
      required: false,
      purpose: "contract-to-system joins",
    },
    {
      sourceKey: "F23_operational_service_map",
      required: false,
      purpose: "operational dependency context",
    },
    {
      sourceKey: "source_artifacts",
      required: false,
      purpose: "Source event and artifact evidence",
    },
    {
      sourceKey: "source_pricing_components",
      required: false,
      purpose: "pricing and commercial evidence",
    },
  ],
  data_analytics: [
    {
      sourceKey: "F09_data_analytics_estate",
      required: true,
      purpose: "data estate",
    },
    EXECUTIVE_INTERVIEW_SOURCE,
    {
      sourceKey: "F21_data_product_ownership_lineage",
      required: false,
      purpose: "ownership and lineage",
    },
    {
      sourceKey: "F10_integrations_interfaces",
      required: false,
      purpose: "data movement context",
    },
    {
      sourceKey: "F05_applications_systems",
      required: false,
      purpose: "source and consumer systems",
    },
    {
      sourceKey: "F17_ai_automation_footprint",
      required: false,
      purpose: "AI dependencies on data products",
    },
    {
      sourceKey: "F24_ai_use_case_system_value_map",
      required: false,
      purpose: "AI/value use cases fed by data",
    },
    {
      sourceKey: "O01_business_metrics",
      required: false,
      purpose: "business metrics and KPI consumers",
    },
    {
      sourceKey: "F25_context_node_dictionary",
      required: false,
      purpose: "business-readable graph nodes",
    },
  ],
  operations_process: [
    {
      sourceKey: "F14_operations_service_management",
      required: true,
      purpose: "operational signals",
    },
    EXECUTIVE_INTERVIEW_SOURCE,
    {
      sourceKey: "F23_operational_service_map",
      required: false,
      purpose: "service-to-team/system joins",
    },
    {
      sourceKey: "F05_applications_systems",
      required: false,
      purpose: "applications/systems involved",
    },
    {
      sourceKey: "F19_team_application_ownership",
      required: false,
      purpose: "owner/team context",
    },
    {
      sourceKey: "F16_security_risk_compliance",
      required: false,
      purpose: "risk/control context",
    },
    {
      sourceKey: "F17_ai_automation_footprint",
      required: false,
      purpose: "automation footprint",
    },
    {
      sourceKey: "F24_ai_use_case_system_value_map",
      required: false,
      purpose: "automation opportunity/value map",
    },
    {
      sourceKey: "operational_work_items",
      required: false,
      purpose: "ticket/work-item evidence",
    },
    {
      sourceKey: "operational_events",
      required: false,
      purpose: "event/log evidence",
    },
    {
      sourceKey: "process_flow_observations",
      required: false,
      purpose: "process observation evidence",
    },
    {
      sourceKey: "system_service_maps",
      required: false,
      purpose: "CMDB/service maps",
    },
  ],
  ai_value_governance: [
    {
      sourceKey: "F17_ai_automation_footprint",
      required: true,
      purpose: "AI/automation portfolio",
    },
    EXECUTIVE_INTERVIEW_SOURCE,
    {
      sourceKey: "F24_ai_use_case_system_value_map",
      required: false,
      purpose: "AI value and governance joins",
    },
    {
      sourceKey: "F05_applications_systems",
      required: false,
      purpose: "related systems",
    },
    {
      sourceKey: "F09_data_analytics_estate",
      required: false,
      purpose: "related data products",
    },
    {
      sourceKey: "F14_operations_service_management",
      required: false,
      purpose: "business/process signals",
    },
    {
      sourceKey: "O04_benefits_realization",
      required: false,
      purpose: "benefit evidence",
    },
    {
      sourceKey: "O06_ai_governance",
      required: false,
      purpose: "AI governance controls",
    },
    {
      sourceKey: "F16_security_risk_compliance",
      required: false,
      purpose: "risk/control gates",
    },
    {
      sourceKey: "F13_initiatives_portfolio",
      required: false,
      purpose: "business priorities and initiatives in flight",
    },
    {
      sourceKey: "F07_infrastructure_cloud",
      required: false,
      purpose: "cloud/infrastructure readiness",
    },
    {
      sourceKey: "F23_external_benchmark_market_corpus",
      required: false,
      purpose: "industry benchmark patterns separated from tenant facts",
    },
    {
      sourceKey: "ai_control_tower",
      required: false,
      purpose: "Tower value/control evidence",
    },
  ],
  budget_financials: [
    {
      sourceKey: "F12_it_budget_financials",
      required: true,
      purpose: "IT spend and portfolio funding",
    },
    {
      sourceKey: "F11_vendors_contracts_licenses",
      required: false,
      purpose: "vendor spend",
    },
  ],
  risk_compliance: [
    {
      sourceKey: "F16_security_risk_compliance",
      required: true,
      purpose: "risk and control evidence",
    },
    {
      sourceKey: "O05_raid_log",
      required: false,
      purpose: "delivery and operational risks",
    },
  ],
  source_moves_tower: [
    {
      sourceKey: "source_artifacts",
      required: false,
      purpose: "Source artifacts and evidence",
    },
    {
      sourceKey: "generated_artifacts",
      required: false,
      purpose: "Moves/generated artifact evidence",
    },
    {
      sourceKey: "ai_control_tower",
      required: false,
      purpose: "Tower value and control evidence",
    },
  ],
};

function annotateSources(
  sources: DossierSourceRequirement[],
  dimensionFamily: DossierDimensionFamily,
  binderRole: NonNullable<DossierSourceRequirement["binderRole"]>,
): DossierSourceRequirement[] {
  return sources.map((source) => ({
    ...source,
    dimensionFamily,
    binderRole: source.binderRole ?? binderRole,
  }));
}

function inferPrimaryDimension(question: string): DossierDimensionFamily {
  const q = question.toLowerCase();
  if (
    /\b(ai|agents?|agent assist|copilot|automation|automate|llm|machine learning models?|model|genai|use cases?|adoption)\b/.test(
      q,
    )
  )
    return "ai_value_governance";
  if (
    /\b(contact center|call center|member service|customer service|agent desktop|case management|deflection|ivr|ccaas|claims call|provider call|support center)\b/.test(
      q,
    )
  )
    return "ai_value_governance";
  if (
    /\b(risks?|controls?|compliance|governance|security|audit|cyber)\b/.test(q)
  )
    return "risk_compliance";
  if (
    /\b(vendors?|contracts?|licenses?|renewals?|suppliers?|commercial|pricing|sourcing)\b/.test(
      q,
    )
  )
    return "vendor_contracts";
  if (
    /\b(data|analytics|warehouse|lakehouse|bi|tableau|power bi|databricks|lineage|data products?|analytics platforms?|analytics tools?)\b/.test(
      q,
    )
  )
    return "data_analytics";
  if (
    /\b(operational evidence|back[- ]office|back[- ]office services|service management|itsm|service now|servicenow|jira|tickets?|requests?|incidents?|changes?|problems?|service desk|queues?|bottlenecks?|handoffs?|process|operational friction|repetitive|automation candidates?|shared it services?)\b/.test(
      q,
    )
  ) {
    return "operations_process";
  }
  if (/\b(value|benefit|roi|initiatives?|adoption)\b/.test(q))
    return "ai_value_governance";
  if (/\b(cost|budget|spend|finance|financial|run|change|funding)\b/.test(q))
    return "budget_financials";
  if (
    /\b(org|organization|organised|organized|leader|leadership|cio|cto|ciso|cdao|cdto|owner|accountab)\b/.test(
      q,
    )
  ) {
    return "organization_leadership";
  }
  if (
    /\b(apps?|applications?|systems?|platforms?|technology|cmdb|integrations?|interfaces?|dependencies?|dependency|connected)\b/.test(
      q,
    )
  )
    return "application_systems";
  return "organization_leadership";
}

function relatedFor(primary: DossierDimensionFamily): DossierDimensionFamily[] {
  const related: Record<DossierDimensionFamily, DossierDimensionFamily[]> = {
    organization_leadership: [
      "application_systems",
      "budget_financials",
      "operations_process",
      "risk_compliance",
    ],
    application_systems: [
      "organization_leadership",
      "vendor_contracts",
      "data_analytics",
      "operations_process",
      "budget_financials",
      "risk_compliance",
    ],
    vendor_contracts: [
      "application_systems",
      "budget_financials",
      "risk_compliance",
    ],
    data_analytics: [
      "application_systems",
      "organization_leadership",
      "ai_value_governance",
      "operations_process",
    ],
    operations_process: [
      "application_systems",
      "organization_leadership",
      "ai_value_governance",
    ],
    ai_value_governance: [
      "data_analytics",
      "operations_process",
      "risk_compliance",
      "budget_financials",
    ],
    budget_financials: [
      "vendor_contracts",
      "application_systems",
      "organization_leadership",
      "ai_value_governance",
    ],
    risk_compliance: [
      "application_systems",
      "ai_value_governance",
      "vendor_contracts",
    ],
    source_moves_tower: [
      "vendor_contracts",
      "ai_value_governance",
      "risk_compliance",
    ],
  };
  return related[primary];
}

function targetSurfaceFor(
  question: string,
  requestedSurface: DossierSurface,
): DimensionRoute["targetSurface"] {
  const q = question.toLowerCase();
  if (
    requestedSurface === "home" &&
    /\b(should|recommend|prioriti[sz]e|decide|invest|option|roadmap)\b/.test(q)
  )
    return "intelligence";
  if (/\b(source|vendor selection|rfp|bafo)\b/.test(q)) return "source";
  if (/\b(move|deliverable|phase|architecture|roadmap)\b/.test(q))
    return "moves";
  if (/\b(prove|control|realized|governance status|value leakage)\b/.test(q))
    return "tower";
  return requestedSurface;
}

export function routeDimensionQuestion(
  question: string,
  requestedSurface: DossierSurface = "home",
): DimensionRoute {
  const primaryDimension = inferPrimaryDimension(question);
  const relatedDimensions = relatedFor(primaryDimension);
  const targetSurface = targetSurfaceFor(question, requestedSurface);
  const intent: DimensionRoute["intent"] =
    targetSurface === "intelligence"
      ? "decide"
      : targetSurface === "source"
        ? "source"
        : targetSurface === "moves"
          ? "execute"
          : targetSurface === "tower"
            ? "control"
            : "know";

  const sourceMap = new Map<string, DossierSourceRequirement>();
  for (const source of annotateSources(
    SOURCE_REQUIREMENTS[primaryDimension],
    primaryDimension,
    "primary",
  )) {
    sourceMap.set(source.sourceKey, source);
  }
  for (const dimension of relatedDimensions) {
    for (const source of annotateSources(
      SOURCE_REQUIREMENTS[dimension],
      dimension,
      "adjacent",
    )) {
      if (!sourceMap.has(source.sourceKey))
        sourceMap.set(source.sourceKey, source);
    }
  }

  return {
    question,
    requestedSurface,
    targetSurface,
    intent,
    primaryDimension,
    relatedDimensions,
    requiredSources: [...sourceMap.values()],
    artifactPlan: ["prose", "table", "chart", "graph"],
    handoffReason:
      targetSurface !== requestedSurface
        ? `${requestedSurface} should not answer this as a narrow lookup.`
        : undefined,
  };
}
