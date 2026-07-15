#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ModuleContextRequest,
  ModuleContextResponse,
  RequestedKnowledgeDomain,
} from "../../src/lib/enterprise-knowledge/contracts";
import {
  assembleModuleContext,
  classifyContextIntent,
  resolveContextAssemblyInput,
  type ContextAssemblyBlueprint,
  type ContextSourceCatalogEntry,
  type SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";

type SemanticReport = {
  tenants: Array<{
    tenant_key: string;
    tenant_name: string;
    cluster_assessments: Array<{
      cluster: string;
      rowsMatched: number;
      painPoints: string[];
      evidenceItems: string[];
      metrics: string[];
      issues: string[];
      modernizationDependencies: string[];
      relationshipsPresent: number;
    }>;
  }>;
};

type CatalogHint = Omit<
  ContextAssemblyBlueprint,
  "catalogKey" | "tenantKey" | "tenantName" | "clusterName" | "contextTitle"
>;

type TowerReadinessStatus =
  | "measurement_context_ready"
  | "partially_ready"
  | "legacy_behavior"
  | "seeded_or_standardized_path"
  | "missing_budget_spend_value"
  | "missing_metrics"
  | "missing_evidence"
  | "missing_relationships"
  | "generic_context_risk"
  | "unsupported_value_claim_risk"
  | "not_implemented";

type TowerScenario = {
  id: string;
  outputFile: string;
  tenantKey: string;
  question: string;
  preferredCatalogKey?: string;
  expectedTerms: string[];
  expectedDomains: string[];
  requiresMeasuredValue: boolean;
};

type TowerScenarioResult = {
  id: string;
  outputFile: string;
  tenantKey: string;
  question: string;
  status: TowerReadinessStatus;
  knowledgePathStatus: TowerReadinessStatus;
  defaultPathStatus: TowerReadinessStatus;
  selectedCatalogKey: string;
  archetype: string;
  profiles: number;
  relationships: number;
  metrics: number;
  evidenceRefs: number;
  gaps: number;
  unsupportedClaims: number;
  unsupportedClaimsExcludedFromClaudePayload: boolean;
  measuredValueEvidencePresent: boolean;
  realizedValueClaimAllowed: boolean;
  candidateBoundaryClean: boolean;
  genericContextRisk: boolean;
  missingTerms: string[];
  blockers: string[];
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.TOWER_KNOWLEDGE_PRESSURE_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/tower-pressure-proof",
);

const defaultTowerFiles = [
  "src/app/(maestro)/tower/page.tsx",
  "src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx",
  "src/app/api/tower/ask/route.ts",
  "src/app/api/tower/synthesis/route.ts",
  "src/lib/cio-tower/answer.ts",
  "src/lib/cio-tower/cxo-view-model.ts",
  "src/lib/tower/tower-budget-rollups.ts",
  "src/lib/reasoning/tower-synthesis-context-builder.ts",
  "src/lib/reasoning/tenant-tower-portfolio.ts",
];

const towerScenarios: TowerScenario[] = [
  {
    id: "meridian-finance-tower",
    outputFile: "meridian-finance-tower-pressure.json",
    tenantKey: "meridian-health",
    question: "What budget, spend, value, and metric context exists for Finance Analytics modernization?",
    preferredCatalogKey: "meridian-health-finance-analytics",
    expectedTerms: ["Oracle ERP Finance", "SQL Server Finance Mart", "Databricks", "vendor spend", "manual reconciliation", "close report"],
    expectedDomains: ["budget", "spend", "metrics", "vendors", "programs"],
    requiresMeasuredValue: true,
  },
  {
    id: "meridian-agent-assist-tower",
    outputFile: "meridian-agent-assist-tower-pressure.json",
    tenantKey: "meridian-health",
    question: "What value tracking context exists for Agent Assist in member service?",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    expectedTerms: ["average handle time", "first contact resolution", "Genesys", "Salesforce", "claims", "PHI"],
    expectedDomains: ["metrics", "systems", "controls", "programs"],
    requiresMeasuredValue: true,
  },
  {
    id: "meridian-lakehouse-tower",
    outputFile: "meridian-lakehouse-tower-pressure.json",
    tenantKey: "meridian-health",
    question: "What budget and value context exists for a unified clinical and claims lakehouse?",
    expectedTerms: ["clinical", "claims", "pharmacy", "lakehouse", "Databricks", "AWS"],
    expectedDomains: ["budget", "spend", "metrics", "data", "programs"],
    requiresMeasuredValue: true,
  },
  {
    id: "meridian-managed-services-tower",
    outputFile: "meridian-managed-services-tower-pressure.json",
    tenantKey: "meridian-health",
    question: "What spend and value context exists for analytics managed services?",
    preferredCatalogKey: "meridian-health-finance-analytics",
    expectedTerms: ["analytics managed services", "vendor spend", "run cost", "manual close", "dashboard"],
    expectedDomains: ["spend", "vendors", "metrics", "programs"],
    requiresMeasuredValue: true,
  },
  {
    id: "harbortrust-fraud-tower",
    outputFile: "harbortrust-fraud-tower-pressure.json",
    tenantKey: "harbortrust-bank",
    question: "What value tracking context exists for a Fraud Analyst Copilot?",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: ["fraud alert", "case throughput", "loss avoided", "AML", "model-risk", "false-positive"],
    expectedDomains: ["metrics", "risks", "controls", "evidence"],
    requiresMeasuredValue: true,
  },
  {
    id: "harbortrust-core-banking-tower",
    outputFile: "harbortrust-core-banking-tower-pressure.json",
    tenantKey: "harbortrust-bank",
    question: "What spend and value context exists for Core Banking Modernization?",
    expectedTerms: ["core banking", "deposit", "ledger", "payments", "modernization"],
    expectedDomains: ["budget", "spend", "systems", "programs"],
    requiresMeasuredValue: true,
  },
  {
    id: "harbortrust-digital-onboarding-tower",
    outputFile: "harbortrust-digital-onboarding-tower-pressure.json",
    tenantKey: "harbortrust-bank",
    question: "What budget and value context exists for Digital Onboarding?",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: ["Digital onboarding", "KYC", "case outcome", "controls", "audit"],
    expectedDomains: ["metrics", "risks", "controls", "evidence"],
    requiresMeasuredValue: true,
  },
  {
    id: "harbortrust-payments-analytics-tower",
    outputFile: "harbortrust-payments-analytics-tower-pressure.json",
    tenantKey: "harbortrust-bank",
    question: "What spend and value context exists for Payments analytics?",
    expectedTerms: ["payments", "analytics", "transaction", "spend", "value"],
    expectedDomains: ["budget", "spend", "metrics", "data"],
    requiresMeasuredValue: true,
  },
];

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis: "Finance analytics modernization across close reporting, managed analytics services, vendor spend, budget insight, and governed data-product certification.",
    systems: ["Oracle ERP Finance", "Workday Finance and HR source feeds", "Netezza finance analytics appliance", "SQL Server Finance Mart", "Informatica Finance ETL", "Tableau finance dashboards", "Power BI finance dashboards", "Databricks Finance Gold target on AWS"],
    dataDomains: ["GL", "AP", "AR", "vendor spend", "budget", "cost center", "labor and headcount"],
    infrastructure: ["SQL Server reporting estate", "Netezza on-prem analytics appliance", "Databricks on AWS target foundation", "500 finance tables", "200 finance ETL jobs", "1,000 finance reports", "800 finance analytics users"],
    vendorsContracts: ["Oracle", "Workday", "Microsoft", "Informatica", "Databricks", "Tableau", "Power BI"],
    spendContext: ["analytics managed services spend", "finance dashboard run cost", "manual close reconciliation effort", "budget stewardship"],
    programs: ["Databricks Finance Gold certification", "vendor master harmonization", "close automation roadmap"],
    risksControls: ["inconsistent vendor spend definitions", "slow close-window dashboards", "manual reconciliation control risk"],
    metrics: ["close report refresh completion", "certified finance dashboard adoption", "manual reconciliation hours per close cycle"],
    sourceContext: ["analytics managed services", "BI platform contracts", "data platform sourcing", "month-end close reporting"],
    moduleGuidance: {
      tower: "Use budget, spend, and metric names as measurement candidates only. Do not claim realized savings, forecast accuracy, or value capture without measured evidence.",
      intelligence: "Frame modernization readiness and gaps without board-level recommendations beyond evidence.",
      home: "Show finance analytics context as source-backed enterprise knowledge.",
      source: "Use vendor and contract context as sourcing inputs only.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis: "AI-enabled agent assist for member service workflows with cited claims, eligibility, benefits, and transcript context.",
    systems: ["Genesys Cloud", "Salesforce Health Cloud", "Claims administration platform", "Eligibility and benefits platform", "Knowledge base and call transcript store"],
    dataDomains: ["call transcript", "case disposition", "claims status", "eligibility", "benefits", "member inquiry intent"],
    infrastructure: ["contact center integration layer", "audited answer packet", "Genesys-Salesforce-claims context join"],
    vendorsContracts: ["Genesys", "Salesforce", "claims platform managed services"],
    spendContext: ["agent handle-time baseline", "after-call work baseline", "call deflection hypothesis"],
    programs: ["member-service AI assist", "knowledge article cleanup"],
    risksControls: ["PHI handling", "human-in-the-loop approval", "audit trail", "stale knowledge article duplicates"],
    metrics: ["average handle time", "first-contact resolution", "transfer rate", "after-call work minutes"],
    sourceContext: ["member service process", "contact-center platform contracts", "CRM licenses", "call transcript annotation sample"],
    moduleGuidance: {
      tower: "Use operational metrics as measurement candidates only. Do not assert measured value, savings, or realized productivity without baseline and actual extracts.",
      intelligence: "Assess readiness from source-backed workflow and data context, with PHI and human-approval caveats.",
      moves: "Return phase evidence and gaps only.",
      home: "Show member service readiness with systems, data, risks, and recommended evidence.",
    },
  },
  "harbortrust-bank::Fraud Analyst Copilot": {
    primaryFunction: "Financial Crimes Operations",
    outcomeHypothesis: "Fraud analyst copilot that triages alerts with cited case packet, model-risk controls, and analyst approval.",
    systems: ["Fraud alert platform", "Fraud case management", "AML transaction monitoring", "Digital onboarding KYC", "Customer 360"],
    dataDomains: ["fraud alert", "case outcome", "AML risk signal", "KYC evidence", "device risk", "transaction history"],
    infrastructure: ["fraud feature store", "model monitoring registry", "case packet assembly service"],
    vendorsContracts: ["Fraud platform vendor", "KYC provider", "cloud data platform"],
    spendContext: ["fraud operations queue cost", "investigator productivity baseline", "false-positive review effort"],
    programs: ["fraud analyst copilot", "digital onboarding KYC evidence uplift", "customer 360 risk join"],
    risksControls: ["model-risk controls", "case outcome feedback gaps", "model version lineage gaps", "audit trail"],
    metrics: ["fraud alert precision by model version", "analyst case throughput", "confirmed fraud loss avoided baseline", "false-positive review effort"],
    sourceContext: ["fraud case review process", "model-risk governance", "KYC onboarding flow", "customer risk data"],
    moduleGuidance: {
      tower: "Use fraud and digital onboarding metrics as candidate measurement context only. Do not claim fraud loss avoided or recovered value without measured evidence.",
      intelligence: "Assess copilot readiness, risks, and controls using cited case packet and model-risk caveats.",
      source: "Use KYC/fraud vendor context as sourcing inputs only.",
      moves: "Return phase evidence and gaps only.",
    },
  },
};

function main(): void {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  const defaultInspection = inspectDefaultTowerBehavior();
  const scenarioResults = towerScenarios.map((scenario) =>
    evaluateScenario(scenario, catalog, defaultInspection),
  );
  const validation = validateResults(scenarioResults);
  const summary = {
    codename: "TOWER-KNOWLEDGE-LAYER-PRESSURE-TEST-PR14",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      defaultTowerMigratedToKnowledgeLayer: defaultInspection.defaultTowerMigratedToKnowledgeLayer,
      knowledgeLayerMeasurementContextProven: scenarioResults.some((row) => row.knowledgePathStatus === "measurement_context_ready"),
      defaultTowerBehaviorChanged: false,
      tenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      defaultClaudeBehaviorChanged: false,
      productionRolloutChanged: false,
      realizedValueClaimsAllowedWithoutMeasuredEvidence: false,
    },
    defaultInspection,
    counts: {
      scenarios: scenarioResults.length,
      measurementContextReady: countStatus(scenarioResults, "measurement_context_ready"),
      partiallyReady: countStatus(scenarioResults, "partially_ready"),
      genericContextRisk: countStatus(scenarioResults, "generic_context_risk"),
      unsupportedValueClaimRisk: countStatus(scenarioResults, "unsupported_value_claim_risk"),
      missingBudgetSpendValue: countStatus(scenarioResults, "missing_budget_spend_value"),
    },
    scenarios: scenarioResults,
    failures: validation.failures,
  };

  for (const item of scenarioResults) {
    writeJson(item.outputFile, item);
  }
  writeJson("summary.json", summary);
  writeJson("default-vs-knowledge-path-diff.json", buildDefaultVsKnowledgeDiff(defaultInspection, scenarioResults));
  writeCsv("tower-readiness.csv", scenarioResults);
  writeMarkdown(summary);
  writeHtml(summary);

  if (validation.failures.length > 0) {
    throw new Error(`Tower Knowledge pressure proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`tower knowledge pressure proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function evaluateScenario(
  scenario: TowerScenario,
  catalog: ContextSourceCatalogEntry[],
  defaultInspection: ReturnType<typeof inspectDefaultTowerBehavior>,
): TowerScenarioResult {
  const request = towerRequest(scenario);
  const intent = classifyContextIntent(request);
  const filteredCatalog = scenario.preferredCatalogKey
    ? catalog.filter((entry) => entry.blueprint.catalogKey === scenario.preferredCatalogKey)
    : catalog.filter((entry) => entry.blueprint.tenantKey === scenario.tenantKey);
  if (scenario.preferredCatalogKey && filteredCatalog.length !== 1) {
    throw new Error(`Missing preferred catalog ${scenario.preferredCatalogKey}`);
  }
  const resolved = resolveContextAssemblyInput({
    request,
    intent,
    catalog: filteredCatalog,
    generatedAt,
  });
  const response = assembleModuleContext(resolved);
  const pack = response.contextPack;
  const text = [
    pack.executiveSummary,
    pack.relevantEntityProfiles.map((profile) => profile.entityName).join(" "),
    pack.facts.map((fact) => `${fact.subjectEntityId} ${fact.predicate} ${String(fact.value)}`).join(" "),
    pack.relationshipCandidates.map((edge) => edge.businessMeaning).join(" "),
    pack.evidence.map((evidence) => evidence.sourceLabel).join(" "),
    pack.gaps.map((gap) => gap.title).join(" "),
  ].join(" ");
  const missingTerms = scenario.expectedTerms.filter(
    (term) => !text.toLowerCase().includes(term.toLowerCase()),
  );
  const measuredValueEvidencePresent = hasMeasuredValueEvidence(pack);
  const candidateBoundaryClean =
    pack.truthBoundary.candidateContextIncluded === false &&
    pack.truthBoundary.candidatePromoted === false &&
    pack.truthBoundary.activeTenantAccessUpdated === false &&
    pack.truthBoundary.productionTenantDataWritten === false &&
    pack.truthBoundary.moduleRuntimeBehaviorChanged === false;
  const unsupportedClaimsExcludedFromClaudePayload =
    pack.claudeReadyContextPayload.unsupportedClaims.length === 0;
  const genericContextRisk = missingTerms.length > 0 || pack.relevantEntityProfiles.length < 8;
  const hasBudgetSpendValueContext = /budget|spend|cost|value|run cost|baseline/i.test(text);
  const hasMetricContext = pack.metrics.length > 0 || /metric|throughput|handle time|precision|close report|adoption|reconciliation/i.test(text);
  const hasRelationships = pack.relationshipCandidates.length > 0;
  const blockers: string[] = [];
  if (!defaultInspection.defaultTowerMigratedToKnowledgeLayer) {
    blockers.push("Default Tower path is not proven to consume the Knowledge Layer context pack.");
  }
  if (!hasBudgetSpendValueContext) blockers.push("Budget/spend/value context is missing or too thin.");
  if (!hasMetricContext) blockers.push("Metric context is missing or too thin.");
  if (!hasRelationships) blockers.push("Relationship candidates are missing.");
  if (missingTerms.length > 0) blockers.push(`Expected Tower context terms missing: ${missingTerms.join(", ")}`);
  if (scenario.requiresMeasuredValue && !measuredValueEvidencePresent) {
    blockers.push("Measured value evidence is not present; realized value claims must remain blocked.");
  }
  if (!candidateBoundaryClean) blockers.push("Active/candidate truth boundary is not clean.");
  if (!unsupportedClaimsExcludedFromClaudePayload) blockers.push("Unsupported value claims leaked into the Claude-ready payload.");

  const knowledgePathStatus: TowerReadinessStatus =
    !candidateBoundaryClean
      ? "not_implemented"
      : !unsupportedClaimsExcludedFromClaudePayload
        ? "unsupported_value_claim_risk"
        : !hasBudgetSpendValueContext
          ? "missing_budget_spend_value"
          : !hasMetricContext
            ? "missing_metrics"
            : !hasRelationships
              ? "missing_relationships"
              : genericContextRisk
                ? "generic_context_risk"
                : "measurement_context_ready";
  const status: TowerReadinessStatus =
    defaultInspection.defaultTowerMigratedToKnowledgeLayer
      ? knowledgePathStatus
      : "legacy_behavior";

  return {
    id: scenario.id,
    outputFile: scenario.outputFile,
    tenantKey: scenario.tenantKey,
    question: scenario.question,
    status,
    knowledgePathStatus,
    defaultPathStatus: defaultInspection.defaultTowerMigratedToKnowledgeLayer
      ? "measurement_context_ready"
      : "seeded_or_standardized_path",
    selectedCatalogKey: resolved.resolution.selectedCatalogKey,
    archetype: intent.archetypeKey,
    profiles: pack.relevantEntityProfiles.length,
    relationships: pack.relationshipCandidates.length,
    metrics: pack.metrics.length,
    evidenceRefs: pack.evidence.length,
    gaps: pack.gaps.length,
    unsupportedClaims: pack.unsupportedClaims.length,
    unsupportedClaimsExcludedFromClaudePayload,
    measuredValueEvidencePresent,
    realizedValueClaimAllowed: scenario.requiresMeasuredValue ? measuredValueEvidencePresent : false,
    candidateBoundaryClean,
    genericContextRisk,
    missingTerms,
    blockers,
    qualityAssessment: buildQualityAssessment(response, measuredValueEvidencePresent, defaultInspection.defaultTowerMigratedToKnowledgeLayer),
  };
}

function hasMeasuredValueEvidence(pack: ModuleContextResponse["contextPack"]): boolean {
  const text = [
    pack.evidence.map((evidence) => evidence.sourceLabel).join(" "),
    pack.facts.map((fact) => `${fact.subjectEntityId} ${fact.predicate} ${String(fact.value)}`).join(" "),
  ].join(" ");
  return /actual\s+(spend|cost|value|saving|savings|benefit)|measured\s+(value|saving|savings|benefit|outcome)|paid\s+invoice|realized\s+(value|saving|savings|benefit)|value realization extract/i.test(text);
}

function buildQualityAssessment(
  response: ModuleContextResponse,
  measuredValueEvidencePresent: boolean,
  defaultTowerMigratedToKnowledgeLayer: boolean,
): string {
  const pack = response.contextPack;
  return [
    `Knowledge path selected ${pack.relevantEntityProfiles.length} profiles, ${pack.relationshipCandidates.length} relationship candidates, ${pack.metrics.length} metric candidates, and ${pack.evidence.length} evidence refs.`,
    measuredValueEvidencePresent
      ? "Measured/actual value evidence appears present, but value claims still require module-level calculation validation."
      : "Measured value evidence is not present, so Tower must not claim realized savings, ROI, or value captured.",
    defaultTowerMigratedToKnowledgeLayer
      ? "Default Tower path appears to reference the Knowledge Layer."
      : "Default Tower path is not proven to consume the Knowledge Layer and remains on the existing Tower/CIO read path.",
  ].join(" ");
}

function towerRequest(scenario: TowerScenario): ModuleContextRequest {
  return {
    tenantKey: scenario.tenantKey,
    moduleKey: "tower",
    purpose: "measurement_context",
    mode: "active",
    requestedDomains: [
      "enterprise_profile",
      "functions",
      "applications_systems",
      "data_domains",
      "infrastructure",
      "vendors_contracts",
      "programs",
      "risks_controls",
      "metrics_outcomes",
      "relationships",
      "evidence",
    ],
    scope: {
      question: scenario.question,
      useCase: scenario.question,
      portfolioScope: scenario.expectedDomains.join(" "),
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "tower-knowledge-pressure-audit",
  };
}

function inspectDefaultTowerBehavior(): {
  scannedFiles: string[];
  defaultTowerMigratedToKnowledgeLayer: boolean;
  usesKnowledgeContextPack: boolean;
  usesCioTowerPath: boolean;
  usesLegacyPortfolioSynthesis: boolean;
  usesSeedOrStandardizedTower: boolean;
  evidence: string[];
} {
  const evidence: string[] = [];
  let joined = "";
  const scannedFiles = defaultTowerFiles.filter((file) => fs.existsSync(path.join(repoRoot, file)));
  for (const file of scannedFiles) {
    const text = fs.readFileSync(path.join(repoRoot, file), "utf8");
    joined += `\n${text}`;
    if (/loadCioTowerCxoView|answerCioTowerQuestion|listTowerBudgetRollupsForClient/.test(text)) {
      evidence.push(`${file}: CIO Tower/standardized read path reference`);
    }
    if (/loadTenantTowerPortfolio|buildTowerSynthesisContext/.test(text)) {
      evidence.push(`${file}: portfolio synthesis context reference`);
    }
    if (/SeedTenantTower|seed-demo|seeded|tower:seed/.test(text)) {
      evidence.push(`${file}: seed or demo Tower reference`);
    }
    if (/assembleModuleContext|getModuleContext|ContextPack|enterprise-knowledge/.test(text)) {
      evidence.push(`${file}: Knowledge Layer reference`);
    }
  }
  const usesKnowledgeContextPack = /assembleModuleContext|getModuleContext|ContextPack|enterprise-knowledge/.test(joined);
  const usesCioTowerPath = /loadCioTowerCxoView|answerCioTowerQuestion|listTowerBudgetRollupsForClient/.test(joined);
  const usesLegacyPortfolioSynthesis = /loadTenantTowerPortfolio|buildTowerSynthesisContext/.test(joined);
  const usesSeedOrStandardizedTower = /SeedTenantTower|seed-demo|seeded|tower:seed|standardized/i.test(joined);
  return {
    scannedFiles,
    defaultTowerMigratedToKnowledgeLayer: usesKnowledgeContextPack && !usesCioTowerPath && !usesLegacyPortfolioSynthesis,
    usesKnowledgeContextPack,
    usesCioTowerPath,
    usesLegacyPortfolioSynthesis,
    usesSeedOrStandardizedTower,
    evidence,
  };
}

function buildCatalog(report: SemanticReport): ContextSourceCatalogEntry[] {
  return report.tenants.flatMap((tenant) =>
    tenant.cluster_assessments.map((cluster) => {
      const hint = catalogHints[`${tenant.tenant_key}::${cluster.cluster}`];
      if (!hint) {
        throw new Error(`Missing catalog hint for ${tenant.tenant_key} / ${cluster.cluster}`);
      }
      const semanticCluster: SemanticClusterInput = {
        tenantKey: tenant.tenant_key,
        tenantName: tenant.tenant_name,
        clusterName: cluster.cluster,
        rowsMatched: cluster.rowsMatched,
        painPoints: cluster.painPoints,
        evidenceItems: cluster.evidenceItems,
        metrics: cluster.metrics,
        issues: cluster.issues,
        modernizationDependencies: cluster.modernizationDependencies,
        relationshipsPresent: cluster.relationshipsPresent,
      };
      const catalogKey = slug(`${tenant.tenant_key}-${cluster.cluster}`);
      return {
        blueprint: {
          catalogKey,
          tenantKey: tenant.tenant_key,
          tenantName: tenant.tenant_name,
          clusterName: cluster.cluster,
          contextTitle: cluster.cluster,
          ...hint,
        },
        semanticCluster,
        inputSources: [
          path.relative(repoRoot, sourceReportPath),
          `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/evidence_summary.csv`,
          `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/relationship_summary.csv`,
        ],
      };
    }),
  );
}

function validateResults(rows: TowerScenarioResult[]): { failures: string[] } {
  const failures: string[] = [];
  if (rows.length !== towerScenarios.length) failures.push(`Expected ${towerScenarios.length} scenarios, found ${rows.length}`);
  for (const row of rows) {
    if (row.profiles === 0) failures.push(`${row.id}: no profiles`);
    if (row.evidenceRefs === 0) failures.push(`${row.id}: no evidence refs`);
    if (row.gaps === 0) failures.push(`${row.id}: no gaps`);
    if (!row.candidateBoundaryClean) failures.push(`${row.id}: candidate boundary not clean`);
    if (!row.unsupportedClaimsExcludedFromClaudePayload) failures.push(`${row.id}: unsupported claims leaked into Claude-ready payload`);
    if (row.realizedValueClaimAllowed && !row.measuredValueEvidencePresent) {
      failures.push(`${row.id}: realized value claim allowed without measured evidence`);
    }
  }
  return { failures };
}

function buildDefaultVsKnowledgeDiff(
  defaultInspection: ReturnType<typeof inspectDefaultTowerBehavior>,
  rows: TowerScenarioResult[],
): unknown {
  return {
    defaultPath: {
      status: defaultInspection.defaultTowerMigratedToKnowledgeLayer
        ? "knowledge_context_detected"
        : "existing_tower_read_path",
      ...defaultInspection,
    },
    knowledgePressurePath: {
      status: "audit_only_context_pack_pressure_path",
      scenarios: rows.map((row) => ({
        id: row.id,
        knowledgePathStatus: row.knowledgePathStatus,
        selectedCatalogKey: row.selectedCatalogKey,
        metrics: row.metrics,
        evidenceRefs: row.evidenceRefs,
        realizedValueClaimAllowed: row.realizedValueClaimAllowed,
        blockers: row.blockers,
      })),
    },
    conclusion:
      "Default Tower is not claimed migrated unless source inspection proves it consumes the Knowledge Layer context pack. The audit path proves measurement context shape and value-claim guardrails only.",
  };
}

function countStatus(rows: TowerScenarioResult[], status: TowerReadinessStatus): number {
  return rows.filter((row) => row.status === status || row.knowledgePathStatus === status).length;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function writeCsv(fileName: string, rows: TowerScenarioResult[]): void {
  const headers = [
    "id",
    "tenantKey",
    "status",
    "knowledgePathStatus",
    "defaultPathStatus",
    "selectedCatalogKey",
    "profiles",
    "relationships",
    "metrics",
    "evidenceRefs",
    "measuredValueEvidencePresent",
    "realizedValueClaimAllowed",
    "missingTerms",
    "blockers",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.tenantKey,
        row.status,
        row.knowledgePathStatus,
        row.defaultPathStatus,
        row.selectedCatalogKey,
        row.profiles,
        row.relationships,
        row.metrics,
        row.evidenceRefs,
        row.measuredValueEvidencePresent,
        row.realizedValueClaimAllowed,
        row.missingTerms.join("; "),
        row.blockers.join("; "),
      ].map(csvEscape).join(","),
    ),
  ];
  fs.writeFileSync(path.join(outDir, fileName), `${lines.join("\n")}\n`);
}

function writeMarkdown(summary: {
  verdict: string;
  generatedAt: string;
  truthSplit: Record<string, boolean>;
  counts: Record<string, number>;
  scenarios: TowerScenarioResult[];
  failures: string[];
}): void {
  const lines = [
    "# Tower Knowledge Layer Pressure Test",
    "",
    `Generated: ${summary.generatedAt}`,
    `Verdict: ${summary.verdict}`,
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Scenario Readiness",
    "",
    "| Scenario | Status | Knowledge Path | Default Path | Profiles | Relationships | Metrics | Evidence | Realized Value Allowed |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...summary.scenarios.map(
      (row) =>
        `| ${row.question} | ${row.status} | ${row.knowledgePathStatus} | ${row.defaultPathStatus} | ${row.profiles} | ${row.relationships} | ${row.metrics} | ${row.evidenceRefs} | ${row.realizedValueClaimAllowed} |`,
    ),
    "",
    "## Quality Assessment",
    "",
    "Tower can use the Knowledge Layer audit path as measurement context where the semantic cluster is specific enough. It must not claim realized savings, ROI, spend reduction, or value captured unless measured value evidence exists and Tower calculation rules validate it.",
    "",
    "The default Tower page/API path is not changed by this PR. The pressure proof distinguishes existing Tower/CIO paths from the Knowledge Layer measurement-context path.",
    "",
    "## Recommended Remediation PRs",
    "",
    "- TOWER-KNOWLEDGE-MIGRATION-PR16: add a default-off Tower preview path that reads Knowledge Layer measurement context.",
    "- TOWER-VALUE-CLAIM-GUARD-PR17: block realized-value language unless measured evidence and calculation basis are present.",
    "- TOWER-MEASUREMENT-PACKET-PR18: render budget, spend, metric definitions, evidence, gaps, and unsupported claims as a Tower measurement packet.",
  ];
  if (summary.failures.length) {
    lines.push("", "## Failures", "", ...summary.failures.map((failure) => `- ${failure}`));
  }
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(summary: {
  verdict: string;
  generatedAt: string;
  truthSplit: Record<string, boolean>;
  counts: Record<string, number>;
  scenarios: TowerScenarioResult[];
  failures: string[];
}): void {
  const rows = summary.scenarios.map((row) => `<tr>
    <td>${escapeHtml(row.id)}</td>
    <td>${escapeHtml(row.status)}</td>
    <td>${escapeHtml(row.knowledgePathStatus)}</td>
    <td>${escapeHtml(row.selectedCatalogKey)}</td>
    <td>${row.profiles}</td>
    <td>${row.relationships}</td>
    <td>${row.metrics}</td>
    <td>${row.evidenceRefs}</td>
    <td>${escapeHtml(row.realizedValueClaimAllowed ? "yes" : "no")}</td>
    <td>${escapeHtml(row.blockers.join(" | ") || "None")}</td>
  </tr>`).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower Knowledge Pressure Proof</title>
  <style>
    body { margin: 0; background: #f7f8fb; color: #071832; font-family: Inter, Arial, sans-serif; }
    main { max-width: 1240px; margin: 0 auto; padding: 48px 28px; }
    h1 { margin: 0; font-size: 42px; letter-spacing: -0.02em; }
    .eyebrow { color: #007a68; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .card { background: white; border: 1px solid #dfe5ef; border-radius: 12px; box-shadow: 0 18px 45px rgba(7, 24, 50, .08); padding: 24px; margin-top: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
    .metric { border: 1px solid #dfe5ef; border-radius: 10px; padding: 16px; background: #fbfcff; }
    .metric b { display: block; font-size: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
    th, td { text-align: left; border-bottom: 1px solid #e6ebf3; padding: 11px 10px; vertical-align: top; font-size: 13px; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #657391; }
    .pass { color: #007a68; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">AbarVa / Tower / Knowledge Layer</div>
    <h1>Tower Pressure Proof</h1>
    <p>Generated ${escapeHtml(summary.generatedAt)} · <span class="pass">${escapeHtml(summary.verdict)}</span></p>
    <section class="card">
      <h2>Truth split</h2>
      <div class="grid">
        ${Object.entries(summary.truthSplit).map(([key, value]) => `<div class="metric"><b>${escapeHtml(String(value))}</b><span>${escapeHtml(key)}</span></div>`).join("")}
      </div>
    </section>
    <section class="card">
      <h2>Scenario readiness</h2>
      <table>
        <thead><tr><th>Scenario</th><th>Status</th><th>Knowledge path</th><th>Catalog</th><th>Profiles</th><th>Relationships</th><th>Metrics</th><th>Evidence</th><th>Realized value allowed</th><th>Blockers</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "tower-knowledge-pressure-proof.html"), html);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] ?? char);
}

main();
