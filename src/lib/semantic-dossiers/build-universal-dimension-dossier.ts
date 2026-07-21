import { routeDimensionQuestion } from "./dimension-router";
import type {
  BuildUniversalDimensionDossierInput,
  DossierDimensionFamily,
  DossierFact,
  DossierGap,
  DossierMetric,
  DossierRecord,
  DossierRelationshipPath,
  DossierSection,
  DossierSourceCoverage,
  UniversalDimensionDossier,
} from "./types";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function hasText(value: unknown): boolean {
  return text(value).length > 0;
}

function pick(record: DossierRecord, keys: string[]): string {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return "";
}

function uniq(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function fact(
  label: string,
  value: string | number,
  sourceKey: string,
  confidence: DossierFact["confidence"] = "medium",
): DossierFact {
  return { label, value, sourceKey, confidence };
}

function gap(
  gapKey: string,
  label: string,
  impact: string,
  neededEvidence: string[],
): DossierGap {
  return { gapKey, label, impact, neededEvidence };
}

function inferSourceDimensionFamily(sourceKey: string): DossierDimensionFamily {
  if (sourceKey === "executive_interviews") return "organization_leadership";
  if (sourceKey === "F23_external_benchmark_market_corpus")
    return "ai_value_governance";
  if (/^(F01|F02|F03|F04|D19|F18|F25|F26|F27)/.test(sourceKey))
    return "organization_leadership";
  if (/^(F05|F06|F07|F08|F10|F19|F20)/.test(sourceKey))
    return "application_systems";
  if (/^(F11|F22|source_)/.test(sourceKey)) return "vendor_contracts";
  if (/^(F09|F21|O01)/.test(sourceKey)) return "data_analytics";
  if (/^(F14|F23|operational_|process_|system_service)/.test(sourceKey))
    return "operations_process";
  if (/^(F17|F24|O04|O06|ai_control)/.test(sourceKey))
    return "ai_value_governance";
  if (/^F12/.test(sourceKey)) return "budget_financials";
  if (/^(F16|O05)/.test(sourceKey)) return "risk_compliance";
  return "source_moves_tower";
}

function summarizeSource(sourceKey: string, rows: DossierRecord[]): string {
  if (rows.length === 0)
    return `Missing required source family for this question: ${sourceKey}.`;
  const columns = uniq(rows.flatMap((row) => Object.keys(row))).slice(0, 8);
  return `${sourceKey} contributes ${rows.length} evidence item${rows.length === 1 ? "" : "s"} across ${columns.join(", ")}.`;
}

function buildSections(
  input: BuildUniversalDimensionDossierInput,
  sourceCoverage: DossierSourceCoverage[],
): DossierSection[] {
  return sourceCoverage.map((coverage) => {
    const rows = input.sources[coverage.sourceKey] ?? [];
    return {
      sectionKey: coverage.sourceKey,
      title: coverage.purpose,
      dimensionFamily: inferSourceDimensionFamily(coverage.sourceKey),
      sourceKeys: [coverage.sourceKey],
      summary: summarizeSource(coverage.sourceKey, rows),
      recordCount: rows.length,
      sample: rows.slice(0, 5),
    };
  });
}

function relationshipPath(
  pathKey: string,
  label: string,
  from: string,
  relationship: string,
  to: string,
  sourceKeys: string[],
  confidence: DossierRelationshipPath["confidence"] = "medium",
): DossierRelationshipPath {
  return { pathKey, label, from, relationship, to, sourceKeys, confidence };
}

function buildGenericRelationshipPaths(
  input: BuildUniversalDimensionDossierInput,
): DossierRelationshipPath[] {
  const paths: DossierRelationshipPath[] = [];
  if ((input.sources.F19_team_application_ownership ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "team_application_ownership",
        "Technology team owns/supports application",
        "org_team",
        "owns/supports",
        "application",
        [
          "F19_team_application_ownership",
          "F03_it_org_ownership",
          "F05_applications_systems",
        ],
        "high",
      ),
    );
  }
  if ((input.sources.F20_capability_system_dependency ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "capability_system_dependency",
        "Capability depends on system",
        "business_capability",
        "depends_on",
        "application/system",
        [
          "F20_capability_system_dependency",
          "F04_capabilities_value_streams",
          "F06_system_function_mapping",
        ],
        "high",
      ),
    );
  }
  if ((input.sources.F21_data_product_ownership_lineage ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "data_product_lineage",
        "Source system feeds data product and owning domain",
        "source_system/application",
        "feeds",
        "data_product/domain",
        [
          "F21_data_product_ownership_lineage",
          "F09_data_analytics_estate",
          "F10_integrations_interfaces",
        ],
        "high",
      ),
    );
  }
  if ((input.sources.F10_integrations_interfaces ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "system_integration_path",
        "System connects through integration/interface",
        "application/system",
        "integrates_with",
        "application/system",
        ["F10_integrations_interfaces", "F05_applications_systems"],
        "high",
      ),
    );
  }
  if ((input.sources.F22_contract_system_service_map ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "vendor_system_dependency",
        "Vendor/contract supports system or service",
        "vendor_contract",
        "supplies/supports",
        "application/service",
        [
          "F22_contract_system_service_map",
          "F11_vendors_contracts_licenses",
          "F05_applications_systems",
        ],
        "medium",
      ),
    );
  }
  if ((input.sources.F23_operational_service_map ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "service_owner_system_path",
        "Service signal ties to owner and system",
        "operational_service",
        "impacts",
        "org_team/application",
        ["F23_operational_service_map", "F14_operations_service_management"],
        "medium",
      ),
    );
  }
  if ((input.sources.F24_ai_use_case_system_value_map ?? []).length > 0) {
    paths.push(
      relationshipPath(
        "ai_value_governance_path",
        "AI use case ties to system, governance, and value",
        "ai_asset",
        "realizes/depends_on/governed_by",
        "value_metric/system/control",
        [
          "F24_ai_use_case_system_value_map",
          "F17_ai_automation_footprint",
          "O04_benefits_realization",
          "O06_ai_governance",
        ],
        "medium",
      ),
    );
  }
  if (
    (input.sources.executive_interviews ?? []).length > 0 &&
    (input.sources.F17_ai_automation_footprint ?? []).length > 0
  ) {
    paths.push(
      relationshipPath(
        "interview_priority_to_ai_portfolio",
        "Executive priority connects to AI initiative and evidence needed",
        "executive_priority",
        "frames/tests",
        "ai_initiative/readiness_gap",
        [
          "executive_interviews",
          "F17_ai_automation_footprint",
          "F24_ai_use_case_system_value_map",
        ],
        "medium",
      ),
    );
  }
  return paths;
}

function buildGenericMetrics(input: BuildUniversalDimensionDossierInput) {
  const metrics: DossierMetric[] = [];
  const sourceMetric = (
    metricKey: string,
    label: string,
    sourceKey: string,
    caveat?: string,
  ) => {
    const rows = input.sources[sourceKey] ?? [];
    if (rows.length > 0)
      metrics.push({
        metricKey,
        label,
        value: rows.length,
        unit: "count",
        sourceKeys: [sourceKey],
        caveat,
      });
  };
  sourceMetric(
    "application_count",
    "Applications/systems in context",
    "F05_applications_systems",
  );
  sourceMetric(
    "vendor_contract_count",
    "Vendors/contracts in context",
    "F11_vendors_contracts_licenses",
  );
  sourceMetric(
    "integration_count",
    "Integrations/interfaces in context",
    "F10_integrations_interfaces",
  );
  sourceMetric(
    "data_product_count",
    "Data products/platform records in context",
    "F09_data_analytics_estate",
  );
  sourceMetric(
    "operations_signal_count",
    "Operational/service signals in context",
    "F14_operations_service_management",
  );
  sourceMetric(
    "ai_asset_count",
    "AI/automation assets in context",
    "F17_ai_automation_footprint",
  );
  sourceMetric(
    "risk_control_count",
    "Risk/control records in context",
    "F16_security_risk_compliance",
  );
  sourceMetric(
    "executive_interview_signal_count",
    "Executive interview signals in context",
    "executive_interviews",
  );
  sourceMetric(
    "industry_benchmark_count",
    "Industry benchmark patterns in context",
    "F23_external_benchmark_market_corpus",
    "Use as external pattern context, not tenant fact.",
  );
  return metrics;
}

function sampleValues(
  rows: DossierRecord[],
  keys: string[],
  limit = 8,
): string[] {
  return uniq(rows.map((row) => pick(row, keys))).slice(0, limit);
}

function joinedSample(
  rows: DossierRecord[],
  keys: string[],
  limit = 8,
): string {
  return sampleValues(rows, keys, limit).join("; ");
}

function loaded(
  input: BuildUniversalDimensionDossierInput,
  sourceKey: string,
): DossierRecord[] {
  return input.sources[sourceKey] ?? [];
}

function addSourceFact(
  dossier: UniversalDimensionDossier,
  input: BuildUniversalDimensionDossierInput,
  sourceKey: string,
  label: string,
  keys: string[],
  confidence: DossierFact["confidence"] = "medium",
): void {
  const rows = loaded(input, sourceKey);
  if (rows.length === 0) return;
  const value = joinedSample(rows, keys);
  if (value) {
    dossier.facts.push(fact(label, value, sourceKey, confidence));
  } else {
    dossier.facts.push(fact(label, rows.length, sourceKey, confidence));
  }
}

function buildSharedClientGroundingDossier(
  input: BuildUniversalDimensionDossierInput,
  dossier: UniversalDimensionDossier,
): void {
  addSourceFact(
    dossier,
    input,
    "executive_interviews",
    "Executive interview themes in context",
    [
      "priority_theme",
      "business_priority",
      "pain_point",
      "known_challenge",
      "key_initiative",
    ],
    "high",
  );
  addSourceFact(
    dossier,
    input,
    "F05_applications_systems",
    "Relevant systems and platforms in context",
    [
      "system_name",
      "vendor_product",
      "system_category",
      "system_business_context",
    ],
    "high",
  );
  addSourceFact(
    dossier,
    input,
    "F09_data_analytics_estate",
    "Relevant data and analytics assets in context",
    [
      "data_asset_name",
      "data_product_name",
      "platform_name",
      "data_domain",
      "analytics_platform",
    ],
    "high",
  );
  addSourceFact(
    dossier,
    input,
    "F14_operations_service_management",
    "Process and operational evidence in context",
    ["process", "work_item_type", "bottleneck", "service_name"],
    "medium",
  );
  addSourceFact(
    dossier,
    input,
    "F13_initiatives_portfolio",
    "Programs and business priorities in context",
    ["initiative_name", "program_name", "business_priority", "priority_theme"],
    "medium",
  );
}

function buildAiValueDossier(
  input: BuildUniversalDimensionDossierInput,
  dossier: UniversalDimensionDossier,
): void {
  const aiRows = loaded(input, "F17_ai_automation_footprint");
  const bridgeRows = loaded(input, "F24_ai_use_case_system_value_map");
  const systems = loaded(input, "F05_applications_systems");
  const dataAssets = loaded(input, "F09_data_analytics_estate");
  const interviews = loaded(input, "executive_interviews");
  const benchmarks = loaded(input, "F23_external_benchmark_market_corpus");

  dossier.rollups.aiInitiativeCount = aiRows.length;
  dossier.rollups.aiSystemBridgeCount = bridgeRows.length;
  dossier.rollups.aiRelatedSystemCount = systems.length;
  dossier.rollups.aiRelatedDataAssetCount = dataAssets.length;
  dossier.rollups.aiInterviewSignalCount = interviews.length;
  dossier.rollups.industryBenchmarkCount = benchmarks.length;
  dossier.dimensionSummary =
    "AI and automation context assembled from tenant AI initiatives, executive interviews, current systems, data assets, operational bottlenecks, governance controls, benefits evidence, and external benchmark patterns kept separate from tenant facts.";

  addSourceFact(
    dossier,
    input,
    "F17_ai_automation_footprint",
    "AI initiatives and tools in context",
    [
      "ai_use_case",
      "tool_or_model",
      "production_status",
      "readiness_gate",
      "value_risk_posture",
    ],
    "high",
  );
  addSourceFact(
    dossier,
    input,
    "F24_ai_use_case_system_value_map",
    "AI use-case to system/value bridge in context",
    [
      "process_supported",
      "data_exchanged",
      "role_in_function",
      "criticality_to_function",
    ],
    "medium",
  );
  addSourceFact(
    dossier,
    input,
    "F16_security_risk_compliance",
    "AI-relevant risk and control gates in context",
    ["control_name", "risk_name", "readiness_gate", "known_gaps"],
    "medium",
  );
  addSourceFact(
    dossier,
    input,
    "F23_external_benchmark_market_corpus",
    "External industry patterns available for comparison",
    ["benchmark_name", "industry", "benchmark_definition", "recommended_use"],
    "medium",
  );

  if (systems.length === 0) {
    dossier.gaps.push(
      gap(
        "ai_current_system_context_missing",
        "Missing current-state systems tied to the AI question.",
        "aVa can discuss AI themes, but should not imply current technology readiness without application/platform evidence.",
        [
          "V7_05 applications/systems",
          "V7_18 function-system-data-vendor bridge",
        ],
      ),
    );
  }
  if (interviews.length === 0) {
    dossier.gaps.push(
      gap(
        "ai_interview_context_missing",
        "Missing executive interview signals for this AI question.",
        "aVa can benchmark the market, but will be less differentiated from generic GPT without client priorities and pain points.",
        ["executive interviews", "business-priority interview notes"],
      ),
    );
  }
}

function buildApplicationSystemsDossier(
  input: BuildUniversalDimensionDossierInput,
  dossier: UniversalDimensionDossier,
): void {
  dossier.rollups.applicationSystemCount = loaded(
    input,
    "F05_applications_systems",
  ).length;
  dossier.rollups.infrastructureCloudCount = loaded(
    input,
    "F07_infrastructure_cloud",
  ).length;
  dossier.rollups.integrationBridgeCount = loaded(
    input,
    "F10_integrations_interfaces",
  ).length;
  dossier.dimensionSummary =
    "Application and systems context assembled from system inventory, infrastructure/cloud estate, integration bridge, vendor/contracts, operational process evidence, ownership, and adjacent risk signals.";
  addSourceFact(
    dossier,
    input,
    "F07_infrastructure_cloud",
    "Infrastructure and cloud estate in context",
    [
      "platform_name",
      "hosting_model",
      "technology_stack",
      "cloud_provider",
      "known_gaps",
    ],
    "medium",
  );
}

function buildDataAnalyticsDossier(
  input: BuildUniversalDimensionDossierInput,
  dossier: UniversalDimensionDossier,
): void {
  dossier.rollups.dataAssetCount = loaded(
    input,
    "F09_data_analytics_estate",
  ).length;
  dossier.rollups.dataLineageBridgeCount = loaded(
    input,
    "F21_data_product_ownership_lineage",
  ).length;
  dossier.dimensionSummary =
    "Data and analytics context assembled from data assets, lineage/ownership, system/data/vendor bridge, AI dependencies, business metrics, and evidence gaps.";
  addSourceFact(
    dossier,
    input,
    "F21_data_product_ownership_lineage",
    "Data lineage and ownership paths in context",
    [
      "data_asset_name",
      "source_system",
      "owner_role",
      "data_domain",
      "known_gaps",
    ],
    "medium",
  );
}

function buildOrganizationDossier(
  input: BuildUniversalDimensionDossierInput,
  dossier: UniversalDimensionDossier,
): void {
  const leaders = input.sources.F18_leadership_org_chart ?? [];
  const namedLeaders = leaders.filter((row) => hasText(row.leader_name));
  const roleLeaders = leaders.filter(
    (row) => !hasText(row.leader_name) && hasText(row.role),
  );
  const teams = input.sources.F03_it_org_ownership ?? [];
  const functions = input.sources.F02_business_org_functions ?? [];
  const appOwnership = input.sources.F19_team_application_ownership ?? [];
  const budget = input.sources.F12_it_budget_financials ?? [];

  const technologyRoles = uniq([
    ...namedLeaders
      .filter((row) =>
        /\b(cio|cto|ciso|cdo|cdao|cdto|tech|digital|data|security|architect|platform|ops)\b/i.test(
          `${row.role} ${row.organization_area}`,
        ),
      )
      .map((row) => `${pick(row, ["leader_name"])} (${pick(row, ["role"])})`),
    ...roleLeaders
      .filter((row) =>
        /\b(cio|cto|ciso|cdo|cdao|cdto|tech|digital|data|security|architect|platform|ops)\b/i.test(
          `${row.role} ${row.organization_area}`,
        ),
      )
      .slice(0, 12)
      .map((row) => pick(row, ["role"])),
  ]);

  dossier.rollups.namedLeadershipCount = namedLeaders.length;
  dossier.rollups.roleAccountabilityCount = roleLeaders.length || teams.length;
  dossier.rollups.businessFunctionCount = functions.length;
  dossier.rollups.itTeamCount = teams.length;
  dossier.rollups.applicationOwnershipCount = appOwnership.length;
  dossier.rollups.budgetLineCount = budget.length;
  dossier.rollups.technologyLeadership = technologyRoles;
  dossier.dimensionSummary =
    "Organization and leadership context assembled from enterprise profile, business functions, IT ownership, leadership/person/team data, workforce/persona context, application ownership, budget, and adjacent relationship source support.";

  if (namedLeaders.length > 0) {
    dossier.facts.push(
      fact(
        "Named leadership evidence loaded",
        namedLeaders.length,
        "F18_leadership_org_chart",
        "high",
      ),
    );
    dossier.facts.push(
      fact(
        "Technology leadership names visible",
        technologyRoles
          .filter((entry) => entry.includes("("))
          .slice(0, 10)
          .join("; "),
        "F18_leadership_org_chart",
        "high",
      ),
    );
  }

  if (teams.length > 0) {
    dossier.facts.push(
      fact(
        "IT teams and domains loaded",
        teams.length,
        "F03_it_org_ownership",
        "high",
      ),
    );
    dossier.facts.push(
      fact(
        "Role-level technology accountability",
        uniq(
          teams.map((row) => pick(row, ["executive_owner_role", "team_name"])),
        )
          .slice(0, 12)
          .join("; "),
        "F03_it_org_ownership",
        "high",
      ),
    );
  }

  if (functions.length > 0) {
    dossier.facts.push(
      fact(
        "Business functions loaded",
        functions.length,
        "F02_business_org_functions",
        "high",
      ),
    );
  }

  if (appOwnership.length > 0) {
    dossier.facts.push(
      fact(
        "Application-to-team ownership links loaded",
        appOwnership.length,
        "F19_team_application_ownership",
        "medium",
      ),
    );
  }

  if (namedLeaders.length === 0) {
    dossier.gaps.push(
      gap(
        "named_leadership_missing",
        "Missing field: named individual leadership / person-name mapping.",
        "The answer can describe role and team accountability, but must not invent a named org chart.",
        ["F18 leadership-org-chart", "client-approved HR/org roster"],
      ),
    );
  }

  if (roleLeaders.length > 0 && namedLeaders.length > 0) {
    dossier.gaps.push(
      gap(
        "role_to_person_mapping_partial",
        "Some role-level accountabilities are not tied to named people.",
        "The answer should name loaded executives separately from role/domain accountability.",
        [
          "client-approved role-to-person mapping",
          "HRIS or operating-model attestation",
        ],
      ),
    );
  }

  if (appOwnership.length === 0 && teams.length > 0) {
    dossier.gaps.push(
      gap(
        "team_application_join_missing",
        "Missing relationship family: application-to-team ownership joins.",
        "Application accountability and org impact answers will be less precise.",
        ["F19 team-application-ownership", "CMDB/application owner export"],
      ),
    );
  }
}

export function buildUniversalDimensionDossier(
  input: BuildUniversalDimensionDossierInput,
): UniversalDimensionDossier {
  const route = routeDimensionQuestion(
    input.question,
    input.requestedSurface ?? "home",
  );
  const sourceCoverage = route.requiredSources.map((source) => {
    const rows = input.sources[source.sourceKey] ?? [];
    return {
      sourceKey: source.sourceKey,
      loaded: rows.length > 0,
      count: rows.length,
      purpose: source.purpose,
      required: source.required,
      dimensionFamily: source.dimensionFamily,
      binderRole: source.binderRole,
    };
  });

  const dossier: UniversalDimensionDossier = {
    tenantKey: input.tenantKey,
    route,
    sourceCoverage,
    dimensionSummary: `Full ${route.primaryDimension.replaceAll("_", " ")} answer context assembled with ${route.relatedDimensions.length} adjacent dimension context group${route.relatedDimensions.length === 1 ? "" : "s"}.`,
    sections: buildSections(input, sourceCoverage),
    facts: [],
    rollups: {},
    relationshipPaths: buildGenericRelationshipPaths(input),
    metrics: buildGenericMetrics(input),
    gaps: [],
    citations: sourceCoverage
      .filter((coverage) => coverage.loaded)
      .map((coverage) => ({
        label: coverage.purpose,
        sourceKey: coverage.sourceKey,
        count: coverage.count,
      })),
    artifactPlan: route.artifactPlan,
    answerBoundary: {
      canAnswer: [],
      cannotAnswer: [],
      handoffTarget:
        route.targetSurface === route.requestedSurface
          ? null
          : route.targetSurface,
      handoffReason: route.handoffReason,
    },
    composerPacket: {
      question: input.question,
      tenantKey: input.tenantKey,
      primaryDimension: route.primaryDimension,
      relatedDimensions: route.relatedDimensions,
      dimensionSummary: "",
      sections: [],
      rollups: {},
      relationshipPaths: [],
      metrics: [],
      gaps: [],
      citations: [],
      artifactPlan: route.artifactPlan,
      answerBoundary: {
        canAnswer: [],
        cannotAnswer: [],
        handoffTarget:
          route.targetSurface === route.requestedSurface
            ? null
            : route.targetSurface,
        handoffReason: route.handoffReason,
      },
    },
    qualityFlags: [],
  };

  for (const coverage of sourceCoverage.filter(
    (source) => source.required && !source.loaded,
  )) {
    dossier.gaps.push(
      gap(
        `${coverage.sourceKey}_missing`,
        `Missing required source family: ${coverage.sourceKey}.`,
        `${coverage.purpose} needs this source family before aVa can answer deterministically.`,
        [coverage.sourceKey],
      ),
    );
  }

  buildSharedClientGroundingDossier(input, dossier);

  if (route.primaryDimension === "organization_leadership") {
    buildOrganizationDossier(input, dossier);
  }
  if (route.primaryDimension === "ai_value_governance") {
    buildAiValueDossier(input, dossier);
  }
  if (route.primaryDimension === "application_systems") {
    buildApplicationSystemsDossier(input, dossier);
  }
  if (route.primaryDimension === "data_analytics") {
    buildDataAnalyticsDossier(input, dossier);
  }

  dossier.answerBoundary.canAnswer = [
    `What is loaded for ${route.primaryDimension.replaceAll("_", " ")}`,
    "What the loaded evidence means at a current-state level",
    "Which tables, charts, or graphs can be produced deterministically",
  ];
  dossier.answerBoundary.cannotAnswer = dossier.gaps.map((item) => item.label);

  dossier.composerPacket = {
    question: input.question,
    tenantKey: input.tenantKey,
    primaryDimension: route.primaryDimension,
    relatedDimensions: route.relatedDimensions,
    dimensionSummary: dossier.dimensionSummary,
    sections: dossier.sections,
    rollups: dossier.rollups,
    relationshipPaths: dossier.relationshipPaths,
    metrics: dossier.metrics,
    gaps: dossier.gaps,
    citations: dossier.citations,
    artifactPlan: dossier.artifactPlan,
    answerBoundary: dossier.answerBoundary,
  };

  if (dossier.facts.length === 0 && dossier.gaps.length === 0) {
    dossier.qualityFlags.push("answer_context_has_no_facts_or_gaps");
  }

  return dossier;
}
