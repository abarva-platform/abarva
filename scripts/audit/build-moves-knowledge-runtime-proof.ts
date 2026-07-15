#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import type { ModuleContextScope } from "../../src/lib/enterprise-knowledge/contracts";
import {
  buildMovesKnowledgeRuntimeContext,
  MOVES_KNOWLEDGE_RUNTIME_FLAG,
  MOVES_RUNTIME_SUPPORTED_PHASES,
  type MovesKnowledgeRuntimeResult,
  type MovesRuntimePhase,
} from "../../src/lib/enterprise-knowledge/moves";

type SemanticReport = {
  codename: string;
  generated_at: string;
  verdict: string;
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
  | "catalogKey"
  | "tenantKey"
  | "tenantName"
  | "clusterName"
  | "contextTitle"
>;

type Scenario = {
  outputFile: string;
  title: string;
  tenantKey: string;
  moveId: string;
  phase: MovesRuntimePhase;
  question: string;
  useCaseArchetype?: string;
  expectedTerms: string[];
};

type ScenarioSummary = {
  outputFile: string;
  title: string;
  tenantKey: string;
  phase: string;
  status: MovesKnowledgeRuntimeResult["status"];
  profiles: number;
  relationships: number;
  evidenceRefs: number;
  gaps: number;
  unsupportedClaims: number;
  artifactId: string;
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.MOVES_KNOWLEDGE_RUNTIME_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "knowledge-layer-moves-runtime-pr6";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/moves-runtime-proof",
);

const enabledEnv = { [MOVES_KNOWLEDGE_RUNTIME_FLAG]: "true" };

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis:
      "Finance analytics modernization across close reporting, managed analytics services, and spend insight",
    systems: [
      "Oracle ERP Finance",
      "Workday Finance and HR source feeds",
      "Netezza finance analytics appliance",
      "SQL Server Finance Mart",
      "Informatica Finance ETL",
      "Tableau and Power BI finance dashboards",
      "Databricks Finance Gold target",
    ],
    dataDomains: [
      "GL",
      "AP",
      "AR",
      "vendor spend",
      "budget",
      "cost center",
      "labor and headcount",
    ],
    infrastructure: [
      "SQL Server reporting estate",
      "Netezza on-prem analytics appliance",
      "Databricks on AWS target foundation",
      "500 finance tables",
      "200 finance ETL jobs",
      "1,000 finance reports",
      "800 finance analytics users",
    ],
    vendorsContracts: [
      "Oracle",
      "Workday",
      "Microsoft",
      "Informatica",
      "Databricks",
      "Tableau",
      "Power BI",
    ],
    spendContext: [
      "analytics managed services spend",
      "finance dashboard run cost",
      "manual close reconciliation effort",
    ],
    programs: [
      "Databricks Finance Gold certification",
      "vendor master harmonization",
      "close automation roadmap",
    ],
    risksControls: [
      "inconsistent vendor spend definitions",
      "slow close-window dashboards",
      "manual reconciliation control risk",
    ],
    metrics: [
      "close report refresh completion",
      "certified dashboard adoption",
      "manual reconciliation hours",
      "report inventory reduction candidate",
    ],
    sourceContext: [
      "analytics managed services",
      "BI platform contracts",
      "data platform sourcing",
    ],
    moduleGuidance: {
      moves:
        "Use finance analytics context to shape scope, baselines, owners, and upload needs. Do not claim realized savings.",
      intelligence:
        "Frame modernization readiness and gaps without board-level recommendations beyond evidence.",
      source:
        "Use vendor and contract context as sourcing inputs; do not assert savings without measured evidence.",
      tower: "Use budget and value facts only as context; do not claim realized savings.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis:
      "AI-enabled agent assist for member service and contact-center workflows",
    systems: [
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "Claims administration platform",
      "Eligibility and benefits platform",
      "Knowledge base and call transcript store",
    ],
    dataDomains: ["call transcript", "case disposition", "claims status", "eligibility", "benefits"],
    infrastructure: ["contact center integration layer", "audited answer packet"],
    vendorsContracts: ["Genesys", "Salesforce", "claims platform managed services"],
    spendContext: ["agent handle-time baseline", "call deflection hypothesis"],
    programs: ["member-service AI assist", "knowledge article cleanup"],
    risksControls: ["PHI handling", "human-in-the-loop approval", "stale knowledge article duplicates"],
    metrics: ["average handle time", "first-contact resolution", "member satisfaction"],
    sourceContext: ["contact-center platform contracts", "CRM licenses"],
    movesPhase: "P2",
    moduleGuidance: {
      moves:
        "Return phase evidence and gaps only; Moves decides later what becomes attached evidence.",
      intelligence:
        "Assess readiness from source-backed workflow and data context, not generic AI enthusiasm.",
      home: "Orient the user to loaded service context and evidence limitations.",
    },
  },
  "harbortrust-bank::Fraud Analyst Copilot": {
    primaryFunction: "Fraud Operations",
    outcomeHypothesis: "AI copilot support for fraud analyst triage and case investigation",
    systems: [
      "Fraud alert platform",
      "Fraud case management",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "Fraud feature store",
    ],
    dataDomains: ["fraud alerts", "case outcomes", "AML transactions", "device risk", "model score"],
    infrastructure: ["real-time fraud decisioning", "model governance evaluation set"],
    vendorsContracts: ["KYC vendor", "device intelligence vendor", "core banking provider"],
    spendContext: ["fraud ops queue cost", "loss avoidance measurement baseline"],
    programs: ["fraud analyst copilot", "feature-store feedback loop"],
    risksControls: [
      "model version lineage gaps",
      "case outcome feedback gaps",
      "queue aging mixed with model quality signals",
    ],
    metrics: ["false-positive rate", "analyst queue aging", "confirmed fraud loss"],
    sourceContext: ["KYC vendor context", "device intelligence contract context"],
    movesPhase: "P2",
    moduleGuidance: {
      moves: "Return phase evidence and blockers; do not create Move evidence in this PR.",
      intelligence:
        "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      source: "Return vendor dependencies as context only; do not initiate sourcing work.",
    },
  },
};

const scenarios: Scenario[] = [
  {
    outputFile: "meridian-agent-assist-p2-runtime.json",
    title: "Meridian Agent Assist / Member Service P2",
    tenantKey: "meridian-health",
    moveId: "runtime-meridian-agent-assist-p2",
    phase: "P2",
    question: "We want to explore Agent Assist for member service.",
    useCaseArchetype: "member service agent assist",
    expectedTerms: ["Genesys Cloud", "Salesforce Health Cloud", "average handle time", "PHI handling"],
  },
  {
    outputFile: "meridian-finance-p1-runtime.json",
    title: "Meridian Finance Analytics P1",
    tenantKey: "meridian-health",
    moveId: "runtime-meridian-finance-p1",
    phase: "P1",
    question: "How should we improve Finance Analytics and reduce reporting pain?",
    useCaseArchetype: "finance analytics modernization",
    expectedTerms: ["Workday", "Netezza", "500 finance tables", "1,000 finance reports"],
  },
  {
    outputFile: "generic-vendor-onboarding-p0-runtime.json",
    title: "Generic Vendor Onboarding P0",
    tenantKey: "meridian-health",
    moveId: "runtime-generic-vendor-onboarding-p0",
    phase: "P0",
    question: "How should we frame a vendor onboarding workflow improvement?",
    expectedTerms: ["vendor onboarding workflow", "source-owner attestation", "relationship validation notes"],
  },
];

function main(): void {
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  ensureDir(outDir);

  const disabled = buildMovesKnowledgeRuntimeContext({
    ...scenarios[0],
    catalog,
    generatedAt,
    sourceVersion,
    contextVersion,
    env: {},
  });
  const enabledResults = scenarios.map((scenario) => ({
    scenario,
    result: buildMovesKnowledgeRuntimeContext({
      ...scenario,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      env: enabledEnv,
    }),
  }));
  const phaseContractResults = MOVES_RUNTIME_SUPPORTED_PHASES.map((phase) =>
    buildMovesKnowledgeRuntimeContext({
      ...scenarios[2],
      moveId: `runtime-contract-${phase.toLowerCase()}`,
      phase,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      env: enabledEnv,
    }),
  );

  const validation = validateProof(disabled, enabledResults, phaseContractResults);
  const scenarioSummaries = enabledResults.map(({ scenario, result }) =>
    summarizeScenario(scenario, result),
  );
  const summary = {
    codename: "KNOWLEDGE-LAYER-MOVES-RUNTIME-PR6",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    flag: {
      name: MOVES_KNOWLEDGE_RUNTIME_FLAG,
      defaultEnabled: false,
      disabledStatus: disabled.status,
      enabledStatuses: enabledResults.map((item) => item.result.status),
    },
    truthSplit: {
      defaultMovesBehaviorChanged: false,
      existingBehaviorUnchangedWhenFlagDisabled: disabled.status === "disabled",
      routeOrApiChanged: false,
      createsKnowledgeContextPreviewOnlyWhenFlagEnabled: true,
      claudeCalled: false,
      claudeReadyPayloadPreparedButNotSentByAudit: true,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      moduleReadsCandidateByDefault: false,
      deployRequired: false,
    },
    proofCounts: {
      catalogEntries: catalog.length,
      scenarios: enabledResults.length,
      contractPhases: phaseContractResults.length,
      totalProfiles: scenarioSummaries.reduce((sum, item) => sum + item.profiles, 0),
      totalRelationships: scenarioSummaries.reduce((sum, item) => sum + item.relationships, 0),
      totalEvidenceRefs: scenarioSummaries.reduce((sum, item) => sum + item.evidenceRefs, 0),
      totalGaps: scenarioSummaries.reduce((sum, item) => sum + item.gaps, 0),
      totalUnsupportedClaims: scenarioSummaries.reduce((sum, item) => sum + item.unsupportedClaims, 0),
    },
    scenarios: scenarioSummaries,
    phaseContract: phaseContractResults.map((result) => ({
      status: result.status,
      phase: result.status === "enabled" ? result.knowledgeContextPreviewArtifact.phase : "disabled",
      phaseLabel: result.status === "enabled" ? result.knowledgeContextPreviewArtifact.phaseLabel : "disabled",
    })),
    antiHardcoding: validation.antiHardcoding,
    failures: validation.failures,
  };

  for (const { scenario, result } of enabledResults) {
    writeJson(scenario.outputFile, compactRuntimeResult(scenario, result));
  }
  writeJson("disabled-default-runtime.json", disabled);
  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary, enabledResults);

  if (validation.failures.length > 0) {
    throw new Error(`Moves knowledge runtime proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`moves knowledge runtime proof PASS: ${path.relative(repoRoot, outDir)}`);
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

function validateProof(
  disabled: MovesKnowledgeRuntimeResult,
  enabledItems: Array<{ scenario: Scenario; result: MovesKnowledgeRuntimeResult }>,
  phaseContractResults: MovesKnowledgeRuntimeResult[],
): {
  failures: string[];
  antiHardcoding: {
    pass: boolean;
    scannedFiles: string[];
    forbiddenPatterns: string[];
  };
} {
  const failures: string[] = [];

  if (disabled.status !== "disabled") {
    failures.push("default flag-off runtime did not return disabled status");
  }
  if (disabled.status === "disabled" && !disabled.existingMovesBehaviorUnchanged) {
    failures.push("disabled runtime did not preserve existing Moves behavior");
  }
  if (enabledItems.length !== 3) {
    failures.push(`Expected 3 enabled scenarios, found ${enabledItems.length}`);
  }

  for (const { scenario, result } of enabledItems) {
    const prefix = scenario.outputFile;
    if (result.status !== "enabled") {
      failures.push(`${prefix}: runtime was not enabled with explicit flag`);
      continue;
    }
    const pack = result.movesContextPack;
    const artifact = result.knowledgeContextPreviewArtifact;
    const renderedText = JSON.stringify(artifact);
    if (pack.moduleKey !== "moves") failures.push(`${prefix}: pack moduleKey is not moves`);
    if (!pack.phase.startsWith(scenario.phase)) {
      failures.push(`${prefix}: expected ${scenario.phase}, got ${pack.phase}`);
    }
    if (artifact.artifactType !== "knowledge_context_preview") {
      failures.push(`${prefix}: missing knowledge context preview artifact`);
    }
    if (!artifact.reviewRequiredBeforeAttachment) {
      failures.push(`${prefix}: artifact is not review-required`);
    }
    if (artifact.overwritePolicy !== "append_only_no_silent_overwrite") {
      failures.push(`${prefix}: artifact can silently overwrite`);
    }
    if (!result.generationInputPatchWhenEnabled.includeClaudeReadyContextPayload) {
      failures.push(`${prefix}: generation patch does not include Claude-ready payload when enabled`);
    }
    if (pack.claudeReadyContextPayload.unsupportedClaims.length !== 0) {
      failures.push(`${prefix}: unsupported claims leaked into Claude-ready payload`);
    }
    if (!pack.claudeReadyContextPayload.excludesAuditOnlyDiagnostics) {
      failures.push(`${prefix}: Claude-ready payload does not exclude audit diagnostics`);
    }
    if (JSON.stringify(pack.claudeReadyContextPayload).includes("debugOnlyDiagnostics")) {
      failures.push(`${prefix}: debug diagnostics leaked into Claude-ready payload`);
    }
    if (
      pack.truthBoundary.activeTenantAccessUpdated ||
      pack.truthBoundary.productionTenantDataWritten ||
      pack.truthBoundary.candidatePromoted ||
      pack.truthBoundary.moduleRuntimeBehaviorChanged ||
      pack.truthBoundary.sourceAdapterRowsActive
    ) {
      failures.push(`${prefix}: non-destructive truth boundary failed`);
    }
    if (result.cacheBuild.truthSplit.claudeCalled) {
      failures.push(`${prefix}: cache build called Claude`);
    }
    if (pack.relevantEntityProfiles.length === 0) failures.push(`${prefix}: no entity profiles`);
    if (pack.relationshipCandidates.length === 0) failures.push(`${prefix}: no relationship candidates`);
    if (pack.evidence.length === 0) failures.push(`${prefix}: no evidence refs`);
    if (pack.gaps.length === 0) failures.push(`${prefix}: no gaps`);
    if (artifact.normalUserSections.recommendedNextEvidence.length === 0) {
      failures.push(`${prefix}: no recommended next evidence`);
    }
    for (const term of scenario.expectedTerms) {
      if (!renderedText.toLowerCase().includes(term.toLowerCase())) {
        failures.push(`${prefix}: expected term missing from preview artifact: ${term}`);
      }
    }
  }

  if (phaseContractResults.length !== MOVES_RUNTIME_SUPPORTED_PHASES.length) {
    failures.push("P0-P5 phase contract did not exercise all phases");
  }
  for (let index = 0; index < phaseContractResults.length; index += 1) {
    const expectedPhase = MOVES_RUNTIME_SUPPORTED_PHASES[index];
    const result = phaseContractResults[index];
    if (result.status !== "enabled") {
      failures.push(`${expectedPhase}: phase contract result was not enabled`);
      continue;
    }
    if (!result.movesContextPack.phase.startsWith(expectedPhase)) {
      failures.push(`${expectedPhase}: phase label mismatch ${result.movesContextPack.phase}`);
    }
  }

  const antiHardcoding = scanRuntimeForForbiddenUseCaseBranches();
  if (!antiHardcoding.pass) {
    failures.push(
      `Forbidden use-case-specific branch pattern found: ${antiHardcoding.forbiddenPatterns.join(", ")}`,
    );
  }
  return { failures, antiHardcoding };
}

function scanRuntimeForForbiddenUseCaseBranches(): {
  pass: boolean;
  scannedFiles: string[];
  forbiddenPatterns: string[];
} {
  const scannedFiles = [
    path.join(repoRoot, "src/lib/enterprise-knowledge/moves/moves-context-pack-dry-run.ts"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/moves/moves-knowledge-runtime.ts"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler/context-request-resolver.ts"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler/intent-classifier.ts"),
  ];
  const forbiddenRegexes = [
    /useCase\s*={2,3}/,
    /focus\s*={2,3}/,
    /fixtureKey\s*={2,3}/,
    /question\s*={2,3}\s*["'`]/,
    /agent_assist|fraud_copilot|finance_analytics/,
  ];
  const forbiddenPatterns: string[] = [];
  for (const file of scannedFiles) {
    const text = fs.readFileSync(file, "utf8");
    forbiddenRegexes.forEach((regex) => {
      if (regex.test(text)) {
        forbiddenPatterns.push(`${path.relative(repoRoot, file)}:${regex.source}`);
      }
    });
  }
  return {
    pass: forbiddenPatterns.length === 0,
    scannedFiles: scannedFiles.map((file) => path.relative(repoRoot, file)),
    forbiddenPatterns,
  };
}

function summarizeScenario(
  scenario: Scenario,
  result: MovesKnowledgeRuntimeResult,
): ScenarioSummary {
  if (result.status !== "enabled") {
    return {
      outputFile: scenario.outputFile,
      title: scenario.title,
      tenantKey: scenario.tenantKey,
      phase: scenario.phase,
      status: result.status,
      profiles: 0,
      relationships: 0,
      evidenceRefs: 0,
      gaps: 0,
      unsupportedClaims: 0,
      artifactId: "disabled",
      qualityAssessment: "Flag disabled; existing Moves behavior remains unchanged.",
    };
  }
  const pack = result.movesContextPack;
  return {
    outputFile: scenario.outputFile,
    title: scenario.title,
    tenantKey: scenario.tenantKey,
    phase: pack.phase,
    status: result.status,
    profiles: pack.relevantEntityProfiles.length,
    relationships: pack.relationshipCandidates.length,
    evidenceRefs: pack.evidence.length,
    gaps: pack.gaps.length,
    unsupportedClaims: pack.unsupportedClaims.length,
    artifactId: result.knowledgeContextPreviewArtifact.artifactId,
    qualityAssessment: qualityAssessment(result),
  };
}

function compactRuntimeResult(scenario: Scenario, result: MovesKnowledgeRuntimeResult): unknown {
  if (result.status !== "enabled") {
    return { scenario, result };
  }
  return {
    scenario,
    status: result.status,
    requiredFlag: result.requiredFlag,
    request: result.request,
    previewArtifact: result.knowledgeContextPreviewArtifact,
    generationInputPatchWhenEnabled: result.generationInputPatchWhenEnabled,
    contextPack: {
      contextPackId: result.movesContextPack.contextPackId,
      phase: result.movesContextPack.phase,
      mode: result.movesContextPack.mode,
      truthStatus: result.movesContextPack.truthStatus,
      executiveSummary: result.movesContextPack.executiveSummary,
      profiles: result.movesContextPack.relevantEntityProfiles.map((profile) => ({
        profileId: profile.profileId,
        entityType: profile.entityType,
        entityName: profile.entityName,
        businessMeaning: profile.businessMeaning,
        moduleReadiness: profile.moduleReadiness,
        sourceLineage: profile.sourceLineage,
      })),
      phaseSections: result.phaseSections,
      relationshipCandidates: result.movesContextPack.relationshipCandidates,
      evidence: result.movesContextPack.evidence,
      gaps: result.movesContextPack.gaps,
      unsupportedClaims: result.movesContextPack.unsupportedClaims,
      confidenceSummary: result.movesContextPack.confidenceSummary,
      claudeReadyContextPayload: result.movesContextPack.claudeReadyContextPayload,
      truthBoundary: result.movesContextPack.truthBoundary,
    },
    cacheProof: {
      fastContextPackCacheId: result.cacheBuild.fastContextPackCache.metadata.cacheId,
      deepContextPackCacheId: result.cacheBuild.deepContextPackCache.metadata.cacheId,
      relationshipSliceCacheId: result.cacheBuild.relationshipSliceCache.metadata.cacheId,
      timings: result.cacheBuild.timings,
      truthSplit: result.cacheBuild.truthSplit,
    },
    qualityAssessment: qualityAssessment(result),
  };
}

function qualityAssessment(result: MovesKnowledgeRuntimeResult): string {
  if (result.status !== "enabled") return "Flag disabled; no runtime preview is created.";
  const pack = result.movesContextPack;
  const artifact = result.knowledgeContextPreviewArtifact;
  if (pack.confidenceSummary.overall === "blocked") {
    return "Does not yet tell a Moves-ready story; evidence must be strengthened before phase use.";
  }
  if (artifact.normalUserSections.relevantSystems.length === 0) {
    return "Too thin for client storytelling because no relevant systems were carried into the preview.";
  }
  if (artifact.normalUserSections.recommendedNextEvidence.length === 0) {
    return "Useful for orientation, but it needs next-evidence guidance before a phase workshop.";
  }
  return "Hits the mark for controlled Moves runtime preview: it gives phase context, shows what can be reviewed, preserves unsupported claims, and keeps Claude/model payloads governed.";
}

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  verdict: string;
  flag: Record<string, unknown>;
  truthSplit: Record<string, boolean>;
  proofCounts: Record<string, number>;
  scenarios: ScenarioSummary[];
  phaseContract: Array<Record<string, string>>;
  antiHardcoding: { pass: boolean; forbiddenPatterns: string[] };
  failures: string[];
}): void {
  const lines = [
    "# Moves Knowledge Runtime Proof",
    "",
    `Status: ${summary.verdict}`,
    `Generated: ${summary.generatedAt}`,
    "",
    "## Flag",
    "",
    ...Object.entries(summary.flag).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`),
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## What This Proves",
    "",
    "Moves can be the first controlled runtime consumer of the Enterprise Knowledge Layer behind an explicit non-default flag. When enabled, the runtime helper builds a phase-aware Moves context pack, prepares a reviewable Knowledge Context Preview artifact, and exposes a Claude-ready context payload for downstream generation input without calling Claude in this proof.",
    "",
    "## What This Does Not Do",
    "",
    "- Does not change existing default Moves behavior.",
    "- Does not write production tenant data.",
    "- Does not promote candidate data.",
    "- Does not update Active Tenant Access.",
    "- Does not attach Move evidence automatically.",
    "- Does not send the payload to Claude during the audit.",
    "",
    "## Scenario Results",
    "",
    "| Scenario | Tenant | Phase | Status | Profiles | Relationships | Evidence | Gaps | Unsupported Claims | Artifact | Quality |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ...summary.scenarios.map(
      (item) =>
        `| ${item.title} | ${item.tenantKey} | ${item.phase} | ${item.status} | ${item.profiles} | ${item.relationships} | ${item.evidenceRefs} | ${item.gaps} | ${item.unsupportedClaims} | ${item.artifactId} | ${item.qualityAssessment} |`,
    ),
    "",
    "## Phase Contract",
    "",
    "| Phase | Label | Status |",
    "| --- | --- | --- |",
    ...summary.phaseContract.map(
      (item) => `| ${item.phase} | ${item.phaseLabel} | ${item.status} |`,
    ),
    "",
    "## Anti-Hardcoding Gate",
    "",
    `- pass: ${summary.antiHardcoding.pass}`,
    `- forbidden patterns: ${summary.antiHardcoding.forbiddenPatterns.length ? summary.antiHardcoding.forbiddenPatterns.join(", ") : "none"}`,
  ];
  if (summary.failures.length) {
    lines.push("", "## Failures", "", ...summary.failures.map((failure) => `- ${failure}`));
  }
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(
  summary: {
    verdict: string;
    generatedAt: string;
    flag: Record<string, unknown>;
    truthSplit: Record<string, boolean>;
    scenarios: ScenarioSummary[];
  },
  enabledItems: Array<{ scenario: Scenario; result: MovesKnowledgeRuntimeResult }>,
): void {
  const cards = enabledItems
    .map(({ scenario, result }) => {
      if (result.status !== "enabled") return "";
      const artifact = result.knowledgeContextPreviewArtifact;
      return `<section class="card">
        <div class="scenario-head">
          <div>
            <p class="eyebrow">${escapeHtml(scenario.outputFile)}</p>
            <h2>${escapeHtml(scenario.title)}</h2>
            <p>${escapeHtml(scenario.question)}</p>
          </div>
          <span class="pill">${escapeHtml(artifact.phaseLabel)}</span>
        </div>
        <div class="metrics">
          <div><span>${result.movesContextPack.relevantEntityProfiles.length}</span><label>profiles</label></div>
          <div><span>${result.movesContextPack.relationshipCandidates.length}</span><label>candidate links</label></div>
          <div><span>${result.movesContextPack.evidence.length}</span><label>evidence refs</label></div>
          <div><span>${result.movesContextPack.gaps.length}</span><label>known gaps</label></div>
        </div>
        <div class="story">
          <h3>Knowledge Context Preview</h3>
          <p>${escapeHtml(artifact.normalUserSections.whatAbarvaKnows[0] ?? "")}</p>
          <div class="columns">
            ${sectionList("Relevant systems", artifact.normalUserSections.relevantSystems)}
            ${sectionList("Relevant data", artifact.normalUserSections.relevantDataDomains)}
            ${sectionList("Risks and controls", artifact.normalUserSections.relevantRisksControls)}
            ${sectionList("Next evidence", artifact.normalUserSections.recommendedNextEvidence)}
          </div>
        </div>
        <details>
          <summary>Audit payload comparison</summary>
          <h3>Input prompt to Enterprise Knowledge Layer</h3>
          <pre>${escapeHtml(JSON.stringify(result.request, null, 2))}</pre>
          <h3>Claude-ready context payload prepared but not sent</h3>
          <pre>${escapeHtml(JSON.stringify(artifact.claudeReadyContextPayload, null, 2))}</pre>
          <h3>Rendered artifact</h3>
          <pre>${escapeHtml(JSON.stringify(artifact, null, 2))}</pre>
        </details>
        <h3>Quality assessment</h3>
        <p>${escapeHtml(qualityAssessment(result))}</p>
      </section>`;
    })
    .join("\n");
  const truthRows = Object.entries(summary.truthSplit)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${String(value)}</td></tr>`)
    .join("\n");
  const flagRows = Object.entries(summary.flag)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(JSON.stringify(value))}</td></tr>`)
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Moves Knowledge Runtime Proof</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #071832; background: #f6f8fc; }
    main { max-width: 1320px; margin: 0 auto; padding: 48px 28px; }
    h1 { margin: 0; font-size: 46px; letter-spacing: -0.03em; }
    h2 { margin: 4px 0 8px; font-size: 28px; }
    h3 { margin: 20px 0 10px; font-size: 16px; }
    p { line-height: 1.55; color: #41506b; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dfe5ef; border-radius: 10px; overflow: hidden; }
    td { border-bottom: 1px solid #e6ebf3; padding: 12px 14px; }
    pre { max-height: 420px; overflow: auto; padding: 14px; background: #0a1630; color: #e8f1ff; border-radius: 10px; font-size: 12px; line-height: 1.45; }
    details { margin-top: 18px; border: 1px solid #dfe5ef; border-radius: 10px; padding: 14px; background: #fbfdff; }
    summary { cursor: pointer; font-weight: 800; }
    .eyebrow { color: #007a68; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .status { display: inline-flex; border-radius: 999px; padding: 7px 13px; font-weight: 800; background: #dff8ef; color: #00664f; }
    .card { background: white; border: 1px solid #dfe5ef; border-radius: 12px; box-shadow: 0 18px 45px rgba(7, 24, 50, .08); padding: 24px; margin-top: 24px; }
    .scenario-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .pill { white-space: nowrap; background: #eef8ff; border: 1px solid #c6e6fb; color: #063a61; border-radius: 999px; padding: 8px 12px; font-weight: 800; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
    .metrics div { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .metrics span { display: block; font-size: 28px; font-weight: 900; }
    .metrics label { color: #657391; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }
    .columns { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .section-list { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .section-list ul { margin: 0; padding-left: 18px; }
    .section-list li { margin: 6px 0; color: #41506b; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Enterprise Knowledge Layer</p>
    <h1>Moves Knowledge Runtime Proof <span class="status">${escapeHtml(summary.verdict)}</span></h1>
    <p>Generated ${escapeHtml(summary.generatedAt)}. This report compares the prompt sent into the Enterprise Knowledge Layer, the governed response, the rendered Knowledge Context Preview artifact, and the Claude-ready payload prepared but not sent.</p>
    <section class="card">
      <h2>Flag and truth split</h2>
      <div class="columns">
        <div><h3>Flag</h3><table><tbody>${flagRows}</tbody></table></div>
        <div><h3>Truth split</h3><table><tbody>${truthRows}</tbody></table></div>
      </div>
    </section>
    ${cards}
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "moves-runtime-context-proof.html"), html);
}

function sectionList(title: string, items: string[]): string {
  const list = items.length ? items : ["No items surfaced in this proof slice."];
  return `<div class="section-list"><h3>${escapeHtml(title)}</h3><ul>${list
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul></div>`;
}

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main();
