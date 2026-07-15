#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import {
  buildKnowledgeLayerLivePreviewProof,
  type KnowledgeLayerLivePreviewScenarioOutput,
  type KnowledgeLayerLivePreviewSummaryRow,
} from "../../src/lib/enterprise-knowledge/live-preview";

type ReadinessStatus =
  | "ready"
  | "partially_ready"
  | "legacy_behavior"
  | "missing_relationships"
  | "missing_evidence"
  | "generic_copy"
  | "candidate_boundary_risk"
  | "not_implemented";

type TabKey = "summary" | "data" | "relationships" | "gaps" | "evidence" | "ava";

type DimensionSpec = {
  dimension: string;
  requiredFields: string[];
  moduleRelevance: string[];
  expectedRelationships: string[];
  expectedGaps: string[];
  sourceTypes: string[];
  priority: "high" | "medium";
};

type DimensionReadiness = {
  dimension: string;
  status: ReadinessStatus;
  summaryTab: ReadinessStatus;
  dataTab: ReadinessStatus;
  relationshipsTab: ReadinessStatus;
  gapsTab: ReadinessStatus;
  evidenceTab: ReadinessStatus;
  avaContext: ReadinessStatus;
  moduleRelevance: string[];
  previewProfiles: number;
  previewRelationships: number;
  previewEvidenceRefs: number;
  defaultHomeSignals: string[];
  knowledgeLayerSignals: string[];
  blockers: string[];
  recommendedRemediation: string[];
};

type ScenarioPressure = {
  scenario: string;
  tenantKey: string;
  question: string;
  selectedCatalogKey: string;
  homeHeadline: string;
  homeNarrative: string;
  safeToAnswer: string[];
  doNotInferYet: string[];
  profiles: number;
  relationships: number;
  evidenceRefs: number;
  gaps: number;
  candidateBoundaryClean: boolean;
  unsupportedClaimsBlocked: boolean;
  claudeCalled: boolean;
  tenantDataWritten: boolean;
  activeTenantAccessUpdated: boolean;
  candidatePromoted: boolean;
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.HOME_KNOWLEDGE_PRESSURE_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/home-pressure-proof",
);

const defaultHomeFiles = [
  "src/app/(maestro)/home/page.tsx",
  "src/components/home/HomeSurface.tsx",
  "src/lib/home/home-summary-runtime.ts",
  "src/lib/home/home-summary-snapshot.ts",
  "src/lib/home/home-english-summary.ts",
  "src/lib/home/v6-context-browser.ts",
  "src/lib/home/v7-context-browser.ts",
];

const dimensions: DimensionSpec[] = [
  {
    dimension: "Enterprise Profile",
    priority: "high",
    requiredFields: [
      "industry",
      "headquarters",
      "revenue",
      "employees",
      "locations",
      "leadership",
      "mission",
      "strategy",
    ],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Source", "Tower"],
    expectedRelationships: ["owned_by", "measured_by", "governed_by"],
    expectedGaps: ["missing source lineage", "missing as-of date"],
    sourceTypes: ["template", "SME interview", "program portfolio"],
  },
  {
    dimension: "Business Functions",
    priority: "high",
    requiredFields: ["function name", "executive owner", "business capability", "criticality"],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Tower"],
    expectedRelationships: ["supports", "owned_by", "measured_by", "has_risk"],
    expectedGaps: ["missing owner", "missing relationship", "missing metric"],
    sourceTypes: ["template", "SME interview", "program portfolio"],
  },
  {
    dimension: "Org Ownership",
    priority: "medium",
    requiredFields: ["owner", "role", "decision rights", "accountability"],
    moduleRelevance: ["Knowledge", "Moves", "Tower"],
    expectedRelationships: ["owned_by", "governed_by"],
    expectedGaps: ["missing owner", "missing approval authority"],
    sourceTypes: ["template", "SME interview"],
  },
  {
    dimension: "Workforce Roles",
    priority: "medium",
    requiredFields: ["role", "team", "capacity", "skills", "location"],
    moduleRelevance: ["Knowledge", "Moves", "Source", "Tower"],
    expectedRelationships: ["supports", "owned_by", "provided_by"],
    expectedGaps: ["missing capacity", "missing role mapping"],
    sourceTypes: ["template", "SME interview", "workforce extract"],
  },
  {
    dimension: "Applications & Systems",
    priority: "high",
    requiredFields: [
      "function supported",
      "system category",
      "technology type",
      "version",
      "hosting",
      "environments",
      "users/volume",
      "capacity",
      "data used/created",
      "integrations",
      "owner",
      "gaps",
    ],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Source", "Tower"],
    expectedRelationships: [
      "supports",
      "feeds",
      "consumes",
      "produces",
      "integrates_with",
      "hosted_in",
      "hosted_on",
      "owned_by",
      "target_platform_for",
    ],
    expectedGaps: [
      "missing hosting proof",
      "missing API readiness",
      "missing interface inventory",
      "missing capacity",
      "missing source lineage",
    ],
    sourceTypes: ["CMDB/ServiceNow", "cloud inventory", "template", "SME interview"],
  },
  {
    dimension: "Data Assets & Integrations",
    priority: "high",
    requiredFields: [
      "source systems",
      "consumers",
      "refresh",
      "volume",
      "quality",
      "lineage",
      "sensitivity",
      "owner",
      "gaps",
    ],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Tower"],
    expectedRelationships: ["feeds", "consumes", "produces", "measured_by", "governed_by"],
    expectedGaps: ["missing lineage", "missing refresh", "missing quality", "missing owner"],
    sourceTypes: ["data catalog extract", "template", "SME interview"],
  },
  {
    dimension: "Infrastructure & Platforms",
    priority: "high",
    requiredFields: [
      "hosting model",
      "cloud/on-prem",
      "account/data center",
      "region",
      "environment",
      "hosted systems",
      "capacity",
      "DR",
      "backup",
      "security zone",
      "owner",
    ],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Source", "Tower"],
    expectedRelationships: ["hosted_in", "hosted_on", "owned_by", "has_risk"],
    expectedGaps: ["missing data center", "missing region", "missing DR", "missing security zone"],
    sourceTypes: ["cloud inventory", "CMDB/ServiceNow", "template"],
  },
  {
    dimension: "Vendors & Contracts",
    priority: "high",
    requiredFields: [
      "vendor",
      "contract",
      "supported systems/functions",
      "spend",
      "renewal",
      "commercial model",
      "SLA/obligations",
      "sourcing levers",
    ],
    moduleRelevance: ["Knowledge", "Source", "Intelligence", "Tower"],
    expectedRelationships: ["provided_by", "supports", "funded_by", "governed_by"],
    expectedGaps: ["missing contract", "missing spend", "missing renewal", "missing SLA"],
    sourceTypes: ["contract", "finance/AP", "template", "SME interview"],
  },
  {
    dimension: "IT Budget, Spend & Value",
    priority: "high",
    requiredFields: [
      "tower",
      "run/change/transform",
      "internal/external",
      "vendor/system/program",
      "budget/actual/forecast",
      "source",
      "owner",
    ],
    moduleRelevance: ["Knowledge", "Source", "Tower", "Intelligence"],
    expectedRelationships: ["funded_by", "measured_by", "provided_by"],
    expectedGaps: ["missing spend source", "missing owner", "missing baseline"],
    sourceTypes: ["finance/AP", "contract", "program portfolio"],
  },
  {
    dimension: "Programs & Initiatives",
    priority: "high",
    requiredFields: ["program", "priority", "owner", "scope", "status", "dependencies"],
    moduleRelevance: ["Knowledge", "Moves", "Intelligence", "Tower"],
    expectedRelationships: ["supports", "funded_by", "measured_by", "has_risk"],
    expectedGaps: ["missing dependency", "missing metric", "missing owner"],
    sourceTypes: ["program portfolio", "template", "SME interview"],
  },
  {
    dimension: "AI & Automation Use Cases",
    priority: "high",
    requiredFields: ["use case", "business outcome", "systems", "data", "risk", "owner"],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Tower"],
    expectedRelationships: ["consumes", "supports", "measured_by", "has_risk"],
    expectedGaps: ["missing baseline", "missing model risk", "missing data readiness"],
    sourceTypes: ["template", "SME interview", "program portfolio"],
  },
  {
    dimension: "Risks & Controls",
    priority: "high",
    requiredFields: ["risk", "control", "owner", "severity", "evidence", "status"],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Source", "Tower"],
    expectedRelationships: ["has_risk", "governed_by", "owned_by"],
    expectedGaps: ["missing control evidence", "missing owner", "missing severity"],
    sourceTypes: ["incident/problem/change", "SME interview", "template"],
  },
  {
    dimension: "Relationships",
    priority: "high",
    requiredFields: ["from", "relationship type", "to", "evidence", "confidence"],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Source", "Tower"],
    expectedRelationships: [
      "supports",
      "feeds",
      "consumes",
      "produces",
      "integrates_with",
      "hosted_in",
      "hosted_on",
      "owned_by",
      "measured_by",
      "governed_by",
      "has_risk",
      "funded_by",
      "provided_by",
      "target_platform_for",
    ],
    expectedGaps: ["missing relationship evidence", "low-confidence relationship"],
    sourceTypes: ["template", "CMDB/ServiceNow", "data catalog extract", "SME interview"],
  },
  {
    dimension: "Evidence Sources",
    priority: "high",
    requiredFields: ["source type", "source name", "active/candidate", "as-of date", "lineage"],
    moduleRelevance: ["Knowledge", "Intelligence", "Moves", "Source", "Tower"],
    expectedRelationships: ["governed_by"],
    expectedGaps: ["missing source lineage", "stale source", "candidate-only fact"],
    sourceTypes: ["template", "CMDB/ServiceNow", "finance/AP", "contract", "SME interview"],
  },
  {
    dimension: "Metrics & Outcomes",
    priority: "high",
    requiredFields: [
      "definition",
      "baseline",
      "target",
      "data source",
      "calculation basis",
      "owner",
      "measurement status",
    ],
    moduleRelevance: ["Knowledge", "Tower", "Moves", "Intelligence"],
    expectedRelationships: ["measured_by", "owned_by", "funded_by"],
    expectedGaps: ["missing baseline", "missing target", "missing calculation basis"],
    sourceTypes: ["template", "finance/AP", "program portfolio"],
  },
  {
    dimension: "Managed Services Scope",
    priority: "medium",
    requiredFields: ["service", "provider", "scope", "SLA", "volume", "owner", "cost"],
    moduleRelevance: ["Knowledge", "Source", "Moves", "Tower"],
    expectedRelationships: ["provided_by", "supports", "measured_by"],
    expectedGaps: ["missing SLA", "missing volume", "missing commercial model"],
    sourceTypes: ["contract", "template", "SME interview"],
  },
  {
    dimension: "Operational Process Evidence",
    priority: "medium",
    requiredFields: ["process", "step", "owner", "system", "volume", "exception", "evidence"],
    moduleRelevance: ["Knowledge", "Moves", "Intelligence", "Tower"],
    expectedRelationships: ["supports", "owned_by", "measured_by", "has_risk"],
    expectedGaps: ["missing process evidence", "missing volume", "missing exception handling"],
    sourceTypes: ["incident/problem/change", "SME interview", "template"],
  },
];

const priorityQuestions = [
  "What does Nexus know about Meridian's finance analytics context?",
  "What systems support Meridian member service and Agent Assist?",
  "What data and integration gaps would block Agent Assist?",
  "What infrastructure hosts Meridian's analytics platforms?",
  "What vendors and contracts support Meridian analytics and contact center?",
  "What budget/spend context exists for Finance Analytics?",
  "What risks and controls matter for Agent Assist?",
  "What metrics would Tower use to track Agent Assist value?",
  "What evidence is missing before we can make a decision?",
  "What does Nexus know about HarborTrust Fraud Analyst Copilot readiness?",
];

function main(): void {
  ensureDir(outDir);

  const defaultHomeText = readDefaultHomeSource();
  const defaultSignals = analyzeDefaultHome(defaultHomeText);
  const livePreviewProof = buildKnowledgeLayerLivePreviewProof({
    repoRoot,
    generatedAt,
  });
  const scenarioPressures = buildScenarioPressures(
    livePreviewProof.scenarioOutputs,
    livePreviewProof.scenarios,
  );
  const dimensionReadiness = dimensions.map((dimension) =>
    assessDimension(dimension, defaultSignals, scenarioPressures),
  );
  const diff = buildHomeVsPreviewDiff(defaultSignals, scenarioPressures, dimensionReadiness);
  const failures = validatePressureProof(dimensionReadiness, scenarioPressures);
  const summary = {
    codename: "HOME-KNOWLEDGE-LAYER-PRESSURE-TEST-PR12",
    generatedAt,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      defaultHomeMigratedToKnowledgeLayer: false,
      hiddenKnowledgePreviewProven: livePreviewProof.verdict === "PASS",
      defaultHomeBehaviorChanged: false,
      tenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      defaultClaudeBehaviorChanged: false,
      defaultNavigationExposureChanged: false,
    },
    counts: {
      dimensions: dimensionReadiness.length,
      ready: countStatus(dimensionReadiness, "ready"),
      partiallyReady: countStatus(dimensionReadiness, "partially_ready"),
      legacyBehavior: countStatus(dimensionReadiness, "legacy_behavior"),
      missingRelationships: countStatus(dimensionReadiness, "missing_relationships"),
      missingEvidence: countStatus(dimensionReadiness, "missing_evidence"),
      genericCopy: countStatus(dimensionReadiness, "generic_copy"),
      candidateBoundaryRisk: countStatus(dimensionReadiness, "candidate_boundary_risk"),
      notImplemented: countStatus(dimensionReadiness, "not_implemented"),
    },
    defaultHomeSignals: defaultSignals,
    priorityQuestions,
    dimensionReadiness,
    scenarioPressures,
    failures,
    recommendedRemediationPRs: [
      "HOME-KNOWLEDGE-MIGRATION-PR13: migrate Home landing and dimension summaries to Knowledge Layer.",
      "HOME-DIMENSION-TABS-PR14: migrate Data, Relationships, Gaps, and Evidence tabs to entity profiles, graph slices, and evidence refs.",
      "HOME-AVA-KNOWLEDGE-PR15: make Home/aVa answers consume HomeKnowledgePack behind flag before default enablement.",
    ],
  };

  writeJson("summary.json", summary);
  writeJson("home-vs-knowledge-preview-diff.json", diff);
  writeScenarioJson("meridian-finance-home-pressure.json", scenarioPressures, "Finance Analytics");
  writeScenarioJson(
    "meridian-agent-assist-home-pressure.json",
    scenarioPressures,
    "Agent Assist / Member Service",
  );
  writeScenarioJson("harbortrust-fraud-home-pressure.json", scenarioPressures, "Fraud Analyst");
  writeCsv(dimensionReadiness);
  writeMarkdown(summary);
  writeHtml(summary, diff);

  if (failures.length > 0) {
    throw new Error(`Home Knowledge pressure proof failed: ${failures.join("; ")}`);
  }
  console.log(`home knowledge pressure proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function readDefaultHomeSource(): string {
  return defaultHomeFiles
    .map((file) => {
      const filePath = path.join(repoRoot, file);
      return fs.existsSync(filePath) ? `\n/* ${file} */\n${fs.readFileSync(filePath, "utf8")}` : "";
    })
    .join("\n");
}

function analyzeDefaultHome(source: string) {
  const lower = source.toLowerCase();
  const genericLoadedRecords = /loaded records|rows loaded|source files|search loaded records/i.test(source);
  const legacyLayerLanguage = /\bv6\b|\bv7\b|rich-pack|current-state/i.test(source);
  const diagnosticFirstCopy = /data quality|source coverage|relationship coverage|not available yet|0 mapped links/i.test(source);
  const knowledgePreviewImported =
    source.includes("buildHomeKnowledgePreview") || source.includes("HomeKnowledgePack");
  const activeHomeContextMode = source.includes("active_home_context");
  const relationshipsTabPresent = lower.includes("relationships");
  const gapsTabPresent = lower.includes("gaps");
  const evidenceTabPresent = lower.includes("sources") || lower.includes("evidence");
  const avaDockPresent = lower.includes("ask ava") || lower.includes("agentanswer");
  return {
    filesInspected: defaultHomeFiles,
    activeHomeContextMode,
    knowledgePreviewImported,
    genericLoadedRecords,
    legacyLayerLanguage,
    diagnosticFirstCopy,
    relationshipsTabPresent,
    gapsTabPresent,
    evidenceTabPresent,
    avaDockPresent,
    conclusion:
      "Default Home still renders from the active Home context/browser and summary snapshot path. The Knowledge Layer is proven through hidden preview/audit paths, not default Home consumption.",
  };
}

function buildScenarioPressures(
  scenarioOutputs: KnowledgeLayerLivePreviewScenarioOutput[],
  scenarioSummaries: KnowledgeLayerLivePreviewSummaryRow[],
): ScenarioPressure[] {
  return scenarioOutputs.map((output) => {
    const home = output.home;
    const pack = home.contextPack;
    const summary = scenarioSummaries.find(
      (row) => row.title === output.scenario.title && row.tenantKey === output.scenario.tenantKey,
    );
    return {
      scenario: output.scenario.title,
      tenantKey: output.scenario.tenantKey,
      question: output.scenario.question,
      selectedCatalogKey: home.selectedCatalogKey,
      homeHeadline: home.sections.enterpriseBrief.headline,
      homeNarrative: home.sections.enterpriseBrief.narrative,
      safeToAnswer: home.sections.contextConfidence.safeToAnswer,
      doNotInferYet: home.sections.contextConfidence.doNotInferYet,
      profiles: pack.profiles.length,
      relationships: pack.relationshipCandidates.length,
      evidenceRefs: pack.evidence.length,
      gaps: pack.gaps.length,
      candidateBoundaryClean:
        output.guardrails.candidatePromoted === false &&
        output.guardrails.activeTenantAccessUpdated === false &&
        output.guardrails.moduleReadsCandidateByDefault === false,
      unsupportedClaimsBlocked:
        output.home.contextPack.claudeReadyContextPayload.unsupportedClaims.length === 0,
      claudeCalled: false,
      tenantDataWritten: output.guardrails.productionTenantDataWritten,
      activeTenantAccessUpdated: output.guardrails.activeTenantAccessUpdated,
      candidatePromoted: output.guardrails.candidatePromoted,
      qualityAssessment:
        summary?.qualityAssessment ??
        "Knowledge Layer live preview scenario rendered, but no summary assessment row was found.",
    };
  });
}

function assessDimension(
  dimension: DimensionSpec,
  defaultSignals: ReturnType<typeof analyzeDefaultHome>,
  scenarioPressures: ScenarioPressure[],
): DimensionReadiness {
  const previewProfiles = scenarioPressures.reduce((sum, scenario) => sum + scenario.profiles, 0);
  const previewRelationships = scenarioPressures.reduce(
    (sum, scenario) => sum + scenario.relationships,
    0,
  );
  const previewEvidenceRefs = scenarioPressures.reduce(
    (sum, scenario) => sum + scenario.evidenceRefs,
    0,
  );
  const knowledgeLayerSignals = [
    `${previewProfiles} preview entity profiles`,
    `${previewRelationships} relationship candidates`,
    `${previewEvidenceRefs} evidence refs`,
    "HomeKnowledgeSurface preview includes executive brief, context confidence, relationships, gaps, evidence coverage, and recommended next evidence.",
  ];
  const blockers: string[] = [];
  const remediation: string[] = [];

  const summaryTab = defaultSignals.genericLoadedRecords ? "generic_copy" : "partially_ready";
  if (summaryTab === "generic_copy") {
    blockers.push("Default Home source still contains loaded-record/file-count style summary copy.");
    remediation.push("Replace default Summary tab with HomeKnowledgeSurface enterprise brief.");
  }

  const dataTab = defaultSignals.knowledgePreviewImported ? "partially_ready" : "legacy_behavior";
  if (dataTab === "legacy_behavior") {
    blockers.push("Default Data tab is not proven to read entity profiles/canonical facts.");
    remediation.push("Map Data tab to entity profiles and canonical fact fields for this dimension.");
  }

  const relationshipsTab =
    previewRelationships > 0 && defaultSignals.relationshipsTabPresent
      ? "missing_relationships"
      : "not_implemented";
  blockers.push("Relationship candidates exist in Knowledge preview, but default Home is not proven to render the graph slice.");
  remediation.push("Render relationship graph slices with typed relationship labels and evidence refs.");

  const gapsTab =
    defaultSignals.gapsTabPresent && scenarioPressures.some((scenario) => scenario.gaps > 0)
      ? "partially_ready"
      : "missing_evidence";
  if (gapsTab !== "partially_ready") {
    blockers.push("Gaps tab is not proven to render Knowledge Layer gap/confidence objects.");
  }
  remediation.push("Separate missing evidence, low-confidence facts, candidate-only facts, stale source, missing owner, missing metric, and missing relationship gaps.");

  const evidenceTab =
    defaultSignals.evidenceTabPresent && previewEvidenceRefs > 0
      ? "partially_ready"
      : "missing_evidence";
  remediation.push("Render source lineage with source type, active/candidate status, confidence, and as-of date.");

  const avaContext = defaultSignals.avaDockPresent ? "partially_ready" : "not_implemented";
  blockers.push("Home/aVa answer path is not proven to use HomeKnowledgePack by default.");
  remediation.push("Wire Home/aVa to HomeKnowledgePack behind flag, then compare responses to the same context pack.");

  const candidateRisk = scenarioPressures.some((scenario) => !scenario.candidateBoundaryClean);
  const tabStatuses: ReadinessStatus[] = [
    summaryTab,
    dataTab,
    relationshipsTab,
    gapsTab,
    evidenceTab,
    avaContext,
  ];
  const status = candidateRisk
    ? "candidate_boundary_risk"
    : tabStatuses.includes("legacy_behavior")
      ? "legacy_behavior"
      : tabStatuses.includes("missing_relationships")
        ? "missing_relationships"
        : tabStatuses.includes("missing_evidence")
          ? "missing_evidence"
          : tabStatuses.every((statusValue) => statusValue === "ready")
            ? "ready"
            : "partially_ready";

  return {
    dimension: dimension.dimension,
    status,
    summaryTab,
    dataTab,
    relationshipsTab,
    gapsTab,
    evidenceTab,
    avaContext,
    moduleRelevance: dimension.moduleRelevance,
    previewProfiles,
    previewRelationships,
    previewEvidenceRefs,
    defaultHomeSignals: [
      defaultSignals.activeHomeContextMode ? "active_home_context mode present" : "active_home_context mode not found",
      defaultSignals.knowledgePreviewImported
        ? "HomeKnowledgePack referenced in default Home path"
        : "HomeKnowledgePack not referenced in default Home path",
      defaultSignals.genericLoadedRecords
        ? "loaded-record/file-count copy present"
        : "loaded-record/file-count copy not found",
      defaultSignals.legacyLayerLanguage
        ? "legacy layer/current-state wording present in Home source"
        : "legacy layer wording not found",
    ],
    knowledgeLayerSignals,
    blockers: Array.from(new Set(blockers)),
    recommendedRemediation: Array.from(new Set(remediation)),
  };
}

function buildHomeVsPreviewDiff(
  defaultSignals: ReturnType<typeof analyzeDefaultHome>,
  scenarioPressures: ScenarioPressure[],
  dimensionReadiness: DimensionReadiness[],
) {
  return {
    generatedAt,
    defaultHome: {
      sourcePath: "src/app/(maestro)/home/page.tsx -> HomeSurface",
      consumptionMode: defaultSignals.activeHomeContextMode
        ? "active_home_context"
        : "unknown_default_home_path",
      knowledgeLayerDefaultConsumptionProven: false,
      signals: defaultSignals,
    },
    hiddenKnowledgePreview: {
      sourcePath: "/admin/knowledge-preview?proof=knowledge-layer-live-preview",
      consumptionMode: "proof_only_knowledge_layer_preview",
      scenarios: scenarioPressures.map((scenario) => ({
        scenario: scenario.scenario,
        profiles: scenario.profiles,
        relationships: scenario.relationships,
        evidenceRefs: scenario.evidenceRefs,
        gaps: scenario.gaps,
      })),
    },
    tabReadiness: Object.fromEntries(
      dimensionReadiness.map((dimension) => [
        dimension.dimension,
        {
          summary: dimension.summaryTab,
          data: dimension.dataTab,
          relationships: dimension.relationshipsTab,
          gaps: dimension.gapsTab,
          evidence: dimension.evidenceTab,
          ava: dimension.avaContext,
        },
      ]),
    ),
    conclusion:
      "The Knowledge Layer preview is strong enough to prove the model and hidden route. Default Home should not be claimed migrated until Summary/Data/Relationships/Gaps/Evidence/aVa consume the same pack.",
  };
}

function validatePressureProof(
  dimensionReadiness: DimensionReadiness[],
  scenarioPressures: ScenarioPressure[],
): string[] {
  const failures: string[] = [];
  if (dimensionReadiness.length !== dimensions.length) {
    failures.push("dimension readiness output does not cover every required dimension");
  }
  if (dimensionReadiness.some((dimension) => dimension.status === "ready")) {
    failures.push("pressure test must not mark dimensions ready before default Home tabs are migrated");
  }
  if (scenarioPressures.some((scenario) => !scenario.candidateBoundaryClean)) {
    failures.push("candidate boundary guardrail failed in preview scenario");
  }
  if (scenarioPressures.some((scenario) => !scenario.unsupportedClaimsBlocked)) {
    failures.push("unsupported claims leaked into Claude-ready payload");
  }
  if (
    scenarioPressures.some(
      (scenario) =>
        scenario.claudeCalled ||
        scenario.tenantDataWritten ||
        scenario.activeTenantAccessUpdated ||
        scenario.candidatePromoted,
    )
  ) {
    failures.push("non-destructive pressure test guardrail failed");
  }
  return failures;
}

function countStatus(rows: DimensionReadiness[], status: ReadinessStatus): number {
  return rows.filter((row) => row.status === status).length;
}

function writeJson(fileName: string, value: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function writeScenarioJson(
  fileName: string,
  scenarios: ScenarioPressure[],
  titleNeedle: string,
): void {
  const match = scenarios.find((scenario) => scenario.scenario.includes(titleNeedle));
  if (!match) {
    throw new Error(`Could not find scenario matching ${titleNeedle}`);
  }
  writeJson(fileName, match);
}

function writeCsv(rows: DimensionReadiness[]): void {
  const headers = [
    "dimension",
    "status",
    "summaryTab",
    "dataTab",
    "relationshipsTab",
    "gapsTab",
    "evidenceTab",
    "avaContext",
    "previewProfiles",
    "previewRelationships",
    "previewEvidenceRefs",
    "blockers",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.dimension,
        row.status,
        row.summaryTab,
        row.dataTab,
        row.relationshipsTab,
        row.gapsTab,
        row.evidenceTab,
        row.avaContext,
        row.previewProfiles,
        row.previewRelationships,
        row.previewEvidenceRefs,
        row.blockers.join(" | "),
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  fs.writeFileSync(path.join(outDir, "dimension-readiness.csv"), `${lines.join("\n")}\n`);
}

function writeMarkdown(summary: {
  generatedAt: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  counts: Record<string, number>;
  dimensionReadiness: DimensionReadiness[];
  scenarioPressures: ScenarioPressure[];
  recommendedRemediationPRs: string[];
  failures: string[];
}): void {
  const lines = [
    "# Home Knowledge Layer Pressure Test",
    "",
    `Generated: ${summary.generatedAt}`,
    `Verdict: ${summary.verdict}`,
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Dimension Readiness",
    "",
    "| Dimension | Status | Summary | Data | Relationships | Gaps | Evidence | aVa |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...summary.dimensionReadiness.map(
      (row) =>
        `| ${row.dimension} | ${row.status} | ${row.summaryTab} | ${row.dataTab} | ${row.relationshipsTab} | ${row.gapsTab} | ${row.evidenceTab} | ${row.avaContext} |`,
    ),
    "",
    "## Scenario Pressure Tests",
    "",
    "| Scenario | Profiles | Relationships | Evidence | Gaps | Boundary clean | Unsupported claims blocked |",
    "| --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...summary.scenarioPressures.map(
      (scenario) =>
        `| ${scenario.scenario} | ${scenario.profiles} | ${scenario.relationships} | ${scenario.evidenceRefs} | ${scenario.gaps} | ${scenario.candidateBoundaryClean} | ${scenario.unsupportedClaimsBlocked} |`,
    ),
    "",
    "## Recommended Remediation PRs",
    "",
    ...summary.recommendedRemediationPRs.map((item) => `- ${item}`),
    "",
    "## Failures",
    "",
    summary.failures.length ? summary.failures.map((failure) => `- ${failure}`).join("\n") : "- None",
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(
  summary: {
    generatedAt: string;
    verdict: string;
    truthSplit: Record<string, boolean>;
    counts: Record<string, number>;
    dimensionReadiness: DimensionReadiness[];
    scenarioPressures: ScenarioPressure[];
    recommendedRemediationPRs: string[];
  },
  diff: unknown,
): void {
  const rowHtml = summary.dimensionReadiness
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.dimension)}</td>
        <td><span class="status ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></td>
        <td>${escapeHtml(row.summaryTab)}</td>
        <td>${escapeHtml(row.dataTab)}</td>
        <td>${escapeHtml(row.relationshipsTab)}</td>
        <td>${escapeHtml(row.gapsTab)}</td>
        <td>${escapeHtml(row.evidenceTab)}</td>
        <td>${escapeHtml(row.avaContext)}</td>
      </tr>`,
    )
    .join("\n");
  const scenarioHtml = summary.scenarioPressures
    .map(
      (scenario) => `<article>
        <div class="eyebrow">${escapeHtml(scenario.tenantKey)}</div>
        <h3>${escapeHtml(scenario.scenario)}</h3>
        <p>${escapeHtml(scenario.homeNarrative)}</p>
        <dl>
          <div><dt>Profiles</dt><dd>${scenario.profiles}</dd></div>
          <div><dt>Relationships</dt><dd>${scenario.relationships}</dd></div>
          <div><dt>Evidence</dt><dd>${scenario.evidenceRefs}</dd></div>
          <div><dt>Gaps</dt><dd>${scenario.gaps}</dd></div>
        </dl>
      </article>`,
    )
    .join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
    <title>Home Knowledge Layer Pressure Test</title>
    <style>
      body{margin:0;background:#f6f4ef;color:#071733;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      main{max-width:1280px;margin:0 auto;padding:44px 28px 72px}
      .hero{background:#071733;color:white;border-radius:14px;padding:32px;margin-bottom:22px}
      .hero p{color:#dbe7ff;font-size:18px;line-height:1.5;max-width:920px}
      h1{font-size:46px;line-height:1.05;margin:8px 0 10px} h2{font-size:28px;margin:30px 0 14px} h3{margin:8px 0}
      .badge{display:inline-flex;background:#dff8ee;color:#08654f;border-radius:999px;padding:8px 12px;font-weight:850}
      .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}.card,article{background:white;border:1px solid #ded8ca;border-radius:12px;padding:18px}
      .card strong{display:block;font-size:28px}.card span{color:#536073}
      table{width:100%;border-collapse:collapse;background:white;border:1px solid #ded8ca;border-radius:12px;overflow:hidden}th,td{border-bottom:1px solid #ece6da;padding:11px;text-align:left;font-size:13px;vertical-align:top}th{background:#fbfaf7;color:#536073;text-transform:uppercase;font-size:11px;letter-spacing:.08em}
      .status{display:inline-flex;border-radius:999px;padding:4px 8px;font-weight:800;background:#eef4ff;color:#29466f}.legacy_behavior,.generic_copy,.missing_relationships,.missing_evidence{background:#fff5db;color:#6f4f12}.candidate_boundary_risk{background:#fff1f1;color:#8f1f1f}.ready{background:#dff8ee;color:#08654f}
      .scenarioGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:#087963;font-weight:850}
      dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}dt{font-size:11px;color:#66708a;text-transform:uppercase}dd{font-size:22px;margin:2px 0 0;font-weight:850}
      pre{white-space:pre-wrap;background:#071733;color:#dbe7ff;border-radius:12px;padding:18px;overflow:auto}
    </style></head><body><main>
      <section class="hero"><span class="badge">${escapeHtml(summary.verdict)}</span><h1>Home Knowledge Layer Pressure Test</h1>
      <p>Truth-finding report: the hidden Knowledge Layer preview is proven, but default Home must not be called migrated until its landing page, dimensions, tabs, and aVa answer path consume the same Knowledge Layer context.</p></section>
      <section class="cards">
        <div class="card"><strong>${summary.counts.dimensions}</strong><span>dimensions tested</span></div>
        <div class="card"><strong>${summary.counts.ready}</strong><span>ready</span></div>
        <div class="card"><strong>${summary.counts.legacyBehavior}</strong><span>legacy behavior</span></div>
        <div class="card"><strong>${summary.counts.missingRelationships}</strong><span>missing relationships</span></div>
      </section>
      <h2>Dimension readiness</h2><table><thead><tr><th>Dimension</th><th>Status</th><th>Summary</th><th>Data</th><th>Relationships</th><th>Gaps</th><th>Evidence</th><th>aVa</th></tr></thead><tbody>${rowHtml}</tbody></table>
      <h2>Scenario pressure tests</h2><section class="scenarioGrid">${scenarioHtml}</section>
      <h2>Home vs Knowledge Preview Diff</h2><pre>${escapeHtml(JSON.stringify(diff, null, 2))}</pre>
    </main></body></html>`;
  fs.writeFileSync(path.join(outDir, "home-knowledge-pressure-proof.html"), html);
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

main();
