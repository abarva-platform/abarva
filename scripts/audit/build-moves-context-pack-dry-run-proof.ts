#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextPackMode,
  ModuleContextScope,
} from "../../src/lib/enterprise-knowledge/contracts";
import {
  type ContextAssemblyBlueprint,
  type ContextSourceCatalogEntry,
  type SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import {
  buildMovesContextPackDryRun,
  type MovesContextPackDryRunInput,
  type MovesContextPackDryRunResult,
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
  outputKey: string;
  title: string;
  input: MovesContextPackDryRunInput;
  expectedPhase: NonNullable<ModuleContextScope["phase"]>;
};

type ScenarioSummary = {
  outputKey: string;
  title: string;
  tenantKey: string;
  question: string;
  phase: string;
  inferredArchetype: string;
  selectedCatalogKey: string;
  resolutionScore: number;
  fallbackUsed: boolean;
  profiles: number;
  relationships: number;
  evidenceRefs: number;
  gaps: number;
  unsupportedClaims: number;
  claudePayloadUnsupportedClaims: number;
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.MOVES_CONTEXT_PACK_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/moves-pack-proof",
);

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis: "Finance close, managed analytics services, and spend analytics modernization",
    systems: [
      "Oracle ERP Finance",
      "SQL Server Finance Mart",
      "Informatica Finance ETL",
      "Tableau and Power BI finance dashboards",
      "Databricks Finance Gold",
    ],
    dataDomains: ["GL", "AP", "AR", "vendor spend", "budget", "cost center"],
    infrastructure: ["SQL Server reporting estate", "Databricks on AWS target foundation"],
    vendorsContracts: ["Oracle", "Microsoft", "Informatica", "Databricks", "Tableau"],
    spendContext: [
      "analytics managed services spend",
      "finance dashboard run cost",
      "manual close reconciliation effort",
    ],
    programs: ["Databricks Finance Gold certification", "vendor master harmonization"],
    risksControls: ["inconsistent vendor spend definitions", "slow close-window dashboards"],
    metrics: [
      "close report refresh completion",
      "certified dashboard adoption",
      "manual reconciliation hours",
    ],
    sourceContext: ["analytics managed services", "BI platform contracts", "data platform sourcing"],
    moduleGuidance: {
      moves: "Use finance analytics context to shape scope, baselines, owners, and upload needs. Do not claim realized savings.",
      intelligence: "Frame modernization readiness and gaps without board-level recommendations beyond evidence.",
      source: "Use vendor and contract context as sourcing inputs; do not assert savings without measured evidence.",
      tower: "Use budget and value facts only as context; do not claim realized savings.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis: "AI-enabled agent assist for member service and contact-center workflows",
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
      moves: "Return phase evidence and gaps only; Moves decides later what becomes attached evidence.",
      intelligence: "Assess readiness from source-backed workflow and data context, not generic AI enthusiasm.",
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
      intelligence: "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      source: "Return vendor dependencies as context only; do not initiate sourcing work.",
    },
  },
};

const scenarios: Scenario[] = [
  {
    outputKey: "meridian-agent-assist-p2",
    title: "Meridian Agent Assist P2",
    expectedPhase: "P2",
    input: {
      tenantKey: "meridian-health",
      question: "We want to explore Agent Assist for member service.",
      phase: "P2",
      moveId: "dry-run-meridian-agent-assist",
      mode: "synthetic_fixture",
    },
  },
  {
    outputKey: "meridian-finance-analytics-p1",
    title: "Meridian Finance Analytics P1",
    expectedPhase: "P1",
    input: {
      tenantKey: "meridian-health",
      question: "How should we improve Finance Analytics and reduce reporting pain?",
      phase: "P1",
      moveId: "dry-run-meridian-finance-analytics",
      mode: "synthetic_fixture",
    },
  },
  {
    outputKey: "harbortrust-fraud-copilot-p2",
    title: "HarborTrust Fraud Copilot P2",
    expectedPhase: "P2",
    input: {
      tenantKey: "harbortrust-bank",
      question: "Can we use AI to help fraud analysts triage alerts?",
      phase: "P2",
      moveId: "dry-run-harbortrust-fraud-copilot",
      mode: "synthetic_fixture",
    },
  },
  {
    outputKey: "generic-vendor-onboarding-fallback",
    title: "Generic Vendor Onboarding Fallback",
    expectedPhase: "P1",
    input: {
      tenantKey: "meridian-health",
      question: "How should we modernize the vendor onboarding workflow?",
      phase: "P1",
      moveId: "dry-run-generic-vendor-onboarding",
      mode: "synthetic_fixture",
    },
  },
];

function main(): void {
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  ensureDir(outDir);

  const results = scenarios.map((scenario) => ({
    scenario,
    result: buildMovesContextPackDryRun({
      input: scenario.input,
      catalog,
      generatedAt,
    }),
  }));

  const validation = validateProof(results);
  const scenarioSummaries = results.map(({ scenario, result }) =>
    summarizeScenario(scenario, result),
  );
  const summary = {
    codename: "KNOWLEDGE-LAYER-MOVES-PR3",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      dryRunOnly: true,
      defaultMovesBehaviorChanged: false,
      productionGenerationBehaviorChanged: false,
      claudeCalled: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
      deployRequired: false,
    },
    proofCounts: {
      catalogEntries: catalog.length,
      scenarios: results.length,
      totalProfiles: scenarioSummaries.reduce((sum, item) => sum + item.profiles, 0),
      totalRelationships: scenarioSummaries.reduce((sum, item) => sum + item.relationships, 0),
      totalEvidenceRefs: scenarioSummaries.reduce((sum, item) => sum + item.evidenceRefs, 0),
      totalGaps: scenarioSummaries.reduce((sum, item) => sum + item.gaps, 0),
      totalUnsupportedClaims: scenarioSummaries.reduce(
        (sum, item) => sum + item.unsupportedClaims,
        0,
      ),
    },
    scenarios: scenarioSummaries,
    antiHardcoding: validation.antiHardcoding,
    failures: validation.failures,
  };

  for (const { scenario, result } of results) {
    writeJson(`${scenario.outputKey}.json`, compactResult(scenario, result));
  }
  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary, results);

  if (validation.failures.length > 0) {
    throw new Error(`Moves context pack dry-run proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`moves context pack dry-run proof PASS: ${path.relative(repoRoot, outDir)}`);
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
  items: Array<{ scenario: Scenario; result: MovesContextPackDryRunResult }>,
): {
  failures: string[];
  antiHardcoding: {
    pass: boolean;
    scannedFiles: string[];
    forbiddenPatterns: string[];
  };
} {
  const failures: string[] = [];
  if (items.length !== 4) failures.push(`Expected 4 scenarios, found ${items.length}`);

  for (const { scenario, result } of items) {
    const pack = result.movesContextPack;
    const prefix = scenario.outputKey;
    if (pack.moduleKey !== "moves") failures.push(`${prefix}: context pack is not moduleKey=moves`);
    if (result.response.claudeReadyPayload !== pack.claudeReadyContextPayload) {
      failures.push(`${prefix}: response payload is not the pack payload`);
    }
    if (!pack.phase.startsWith(scenario.expectedPhase)) {
      failures.push(`${prefix}: expected phase ${scenario.expectedPhase}, got ${pack.phase}`);
    }
    if (!result.intent.archetypeKey) failures.push(`${prefix}: no inferred archetype`);
    if (!result.selectedCatalogKey) failures.push(`${prefix}: no selected catalog`);
    if (pack.relevantEntityProfiles.length === 0) failures.push(`${prefix}: no resolved entity profiles`);
    if (pack.relationshipCandidates.length === 0) failures.push(`${prefix}: no relationship candidates`);
    if (pack.evidence.length === 0) failures.push(`${prefix}: no evidence refs`);
    if (pack.gaps.length === 0) failures.push(`${prefix}: no gaps`);
    if (pack.unsupportedClaims.length === 0) failures.push(`${prefix}: no unsupported claims recorded`);
    if (pack.claudeReadyContextPayload.unsupportedClaims.length !== 0) {
      failures.push(`${prefix}: unsupported claims leaked into Claude-ready payload`);
    }
    if (pack.claudeReadyContextPayload.evidenceRefs.length === 0) {
      failures.push(`${prefix}: Claude-ready payload has no evidence refs`);
    }
    if (pack.excludedCandidateOnlyContext.length !== 0 && pack.mode === "active") {
      failures.push(`${prefix}: active mode included candidate-only context as excluded profiles unexpectedly`);
    }
    const boundary = pack.truthBoundary;
    if (
      boundary.activeTenantAccessUpdated ||
      boundary.productionTenantDataWritten ||
      boundary.candidatePromoted ||
      boundary.moduleRuntimeBehaviorChanged ||
      boundary.sourceAdapterRowsActive
    ) {
      failures.push(`${prefix}: non-destructive truth boundary failed`);
    }
    if (result.phaseSections.requiredUploads.length === 0) {
      failures.push(`${prefix}: no required uploads for phase`);
    }
    if (result.phaseSections.nextEvidence.length === 0) {
      failures.push(`${prefix}: no next evidence for phase`);
    }
    if (result.phaseSections.safeToUse.length === 0) {
      failures.push(`${prefix}: no safe-to-use section`);
    }
    if (result.phaseSections.notSafeToClaim.length === 0) {
      failures.push(`${prefix}: no not-safe-to-claim section`);
    }
  }

  const fallback = items.find((item) => item.scenario.outputKey === "generic-vendor-onboarding-fallback");
  if (!fallback?.result.fallbackBehavior.usedFallbackEntityExtraction) {
    failures.push("generic-vendor-onboarding-fallback: fallback entity extraction was not used");
  }

  const antiHardcoding = scanMovesForForbiddenUseCaseBranches();
  if (!antiHardcoding.pass) {
    failures.push(`Forbidden use-case-specific branch pattern found: ${antiHardcoding.forbiddenPatterns.join(", ")}`);
  }
  return { failures, antiHardcoding };
}

function scanMovesForForbiddenUseCaseBranches(): {
  pass: boolean;
  scannedFiles: string[];
  forbiddenPatterns: string[];
} {
  const srcDirs = [
    path.join(repoRoot, "src/lib/enterprise-knowledge/moves"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler"),
  ];
  const scannedFiles = srcDirs.flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => path.join(dir, file)),
  );
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
  result: MovesContextPackDryRunResult,
): ScenarioSummary {
  const pack = result.movesContextPack;
  return {
    outputKey: scenario.outputKey,
    title: scenario.title,
    tenantKey: scenario.input.tenantKey,
    question: scenario.input.question,
    phase: pack.phase,
    inferredArchetype: result.intent.archetypeKey,
    selectedCatalogKey: result.selectedCatalogKey,
    resolutionScore: result.resolutionScore,
    fallbackUsed: result.fallbackBehavior.usedFallbackEntityExtraction,
    profiles: pack.relevantEntityProfiles.length,
    relationships: pack.relationshipCandidates.length,
    evidenceRefs: pack.evidence.length,
    gaps: pack.gaps.length,
    unsupportedClaims: pack.unsupportedClaims.length,
    claudePayloadUnsupportedClaims: pack.claudeReadyContextPayload.unsupportedClaims.length,
    qualityAssessment: qualityAssessment(result),
  };
}

function qualityAssessment(result: MovesContextPackDryRunResult): string {
  const pack = result.movesContextPack;
  if (pack.confidenceSummary.overall === "blocked") {
    return "Does not yet tell a Moves-ready story; evidence should be strengthened before phase use.";
  }
  if (pack.relationshipCandidates.length < 3) {
    return "Useful for orientation but too relationship-light for client-facing phase decisions.";
  }
  if (result.phaseSections.notSafeToClaim.length > 0 && result.phaseSections.nextEvidence.length > 0) {
    return "Hits the mark for a dry-run Moves story: it gives usable phase context while clearly naming what cannot be claimed yet.";
  }
  return "Usable as a dry-run context pack, with caveats preserved for later module-specific decisions.";
}

function compactResult(scenario: Scenario, result: MovesContextPackDryRunResult): unknown {
  const pack = result.movesContextPack;
  return {
    scenario: {
      outputKey: scenario.outputKey,
      title: scenario.title,
      inputPrompt: scenario.input.question,
      requestedPhase: scenario.expectedPhase,
      tenantKey: scenario.input.tenantKey,
    },
    request: result.request,
    response: {
      selectedCatalogKey: result.selectedCatalogKey,
      resolutionScore: result.resolutionScore,
      matchedTokens: result.matchedTokens,
      inferredArchetype: result.intent.archetypeKey,
      intentConfidence: result.intent.confidence,
      fallbackBehavior: result.fallbackBehavior,
      explanation: result.response.explanation,
      movesContextPack: {
        contextPackId: pack.contextPackId,
        tenantKey: pack.tenantKey,
        moduleKey: pack.moduleKey,
        phase: pack.phase,
        purpose: pack.purpose,
        mode: pack.mode,
        truthStatus: pack.truthStatus,
        executiveSummary: pack.executiveSummary,
        phaseSections: result.phaseSections,
        profiles: pack.relevantEntityProfiles.map((profile) => ({
          profileId: profile.profileId,
          entityType: profile.entityType,
          entityName: profile.entityName,
          businessMeaning: profile.businessMeaning,
          currentStateSummary: profile.currentStateSummary,
          factCount: profile.facts.length,
          moduleReadiness: profile.moduleReadiness,
          evidenceRefs: profile.evidenceRefs,
        })),
        facts: pack.facts,
        metrics: pack.metrics,
        relationships: pack.relationshipCandidates,
        evidence: pack.evidence,
        gaps: pack.gaps,
        unsupportedClaims: pack.unsupportedClaims,
        claudeReadyContextPayload: pack.claudeReadyContextPayload,
        excludedCandidateOnlyContext: pack.excludedCandidateOnlyContext,
        confidenceSummary: pack.confidenceSummary,
        caveats: pack.caveats,
        recommendedNextEvidence: pack.recommendedNextEvidence,
        truthBoundary: pack.truthBoundary,
        assemblyTrace: pack.assemblyTrace,
      },
    },
    qualityAssessment: qualityAssessment(result),
  };
}

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  sourceSemanticProof: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  proofCounts: Record<string, number>;
  antiHardcoding: { pass: boolean; forbiddenPatterns: string[] };
  scenarios: ScenarioSummary[];
  failures: string[];
}): void {
  const lines = [
    "# Moves Context Pack Dry-Run Proof",
    "",
    `Status: ${summary.verdict}`,
    `Generated: ${summary.generatedAt}`,
    `Source semantic proof: ${summary.sourceSemanticProof}`,
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## What This Proves",
    "",
    "Moves can ask the Enterprise Knowledge Layer for a governed, phase-scoped context pack before Claude or production generation is involved. The output includes resolved profiles, relationship candidates, evidence references, confidence, gaps, unsupported claims, and phase-specific next evidence. This PR does not attach Move evidence or change default Moves behavior.",
    "",
    "## Scenario Results",
    "",
    "| Scenario | Tenant | Prompt | Phase | Archetype | Resolved catalog | Fallback | Profiles | Edges | Evidence | Gaps | Audit claims | Claude leaked claims |",
    "| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...summary.scenarios.map(
      (item) =>
        `| ${item.outputKey} | ${item.tenantKey} | ${item.question} | ${item.phase} | ${item.inferredArchetype} | ${item.selectedCatalogKey} | ${item.fallbackUsed ? "yes" : "no"} | ${item.profiles} | ${item.relationships} | ${item.evidenceRefs} | ${item.gaps} | ${item.unsupportedClaims} | ${item.claudePayloadUnsupportedClaims} |`,
    ),
    "",
    "## Quality Assessment",
    "",
    ...summary.scenarios.flatMap((item) => [
      `### ${item.title}`,
      "",
      item.qualityAssessment,
      "",
    ]),
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
    truthSplit: Record<string, boolean>;
    scenarios: ScenarioSummary[];
  },
  items: Array<{ scenario: Scenario; result: MovesContextPackDryRunResult }>,
): void {
  const scenarioCards = items
    .map(({ scenario, result }) => {
      const pack = result.movesContextPack;
      const rendered = compactResult(scenario, result);
      return `<section class="card">
        <div class="scenario-head">
          <div>
            <p class="eyebrow">${escapeHtml(scenario.outputKey)}</p>
            <h2>${escapeHtml(scenario.title)}</h2>
            <p class="prompt">${escapeHtml(scenario.input.question)}</p>
          </div>
          <span class="pill">${escapeHtml(pack.phase)}</span>
        </div>
        <div class="metrics">
          <div><span>${pack.relevantEntityProfiles.length}</span><label>profiles</label></div>
          <div><span>${pack.relationshipCandidates.length}</span><label>relationships</label></div>
          <div><span>${pack.evidence.length}</span><label>evidence refs</label></div>
          <div><span>${pack.gaps.length}</span><label>gaps</label></div>
        </div>
        <div class="grid">
          <div>
            <h3>Input to context pack</h3>
            <pre>${escapeHtml(JSON.stringify(result.request, null, 2))}</pre>
          </div>
          <div>
            <h3>Claude-ready payload</h3>
            <pre>${escapeHtml(JSON.stringify(pack.claudeReadyContextPayload, null, 2))}</pre>
          </div>
        </div>
        <h3>What was rendered to proof</h3>
        <pre>${escapeHtml(JSON.stringify(rendered, null, 2))}</pre>
        <h3>Quality assessment</h3>
        <p>${escapeHtml(qualityAssessment(result))}</p>
      </section>`;
    })
    .join("\n");
  const truthRows = Object.entries(summary.truthSplit)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${String(value)}</td></tr>`)
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Moves Context Pack Proof</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #071832; background: #f7f8fb; }
    main { max-width: 1280px; margin: 0 auto; padding: 48px 28px; }
    h1 { margin: 0; font-size: 44px; letter-spacing: -0.02em; }
    h2 { margin: 4px 0 8px; font-size: 28px; }
    h3 { margin: 22px 0 10px; font-size: 16px; }
    p { line-height: 1.55; color: #41506b; }
    pre { max-height: 420px; overflow: auto; padding: 14px; background: #0a1630; color: #e8f1ff; border-radius: 10px; font-size: 12px; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dfe5ef; border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; border-bottom: 1px solid #e6ebf3; padding: 12px 14px; }
    .eyebrow { color: #007a68; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .status { display: inline-flex; border-radius: 999px; padding: 7px 13px; font-weight: 800; background: #dff8ef; color: #00664f; }
    .card { background: white; border: 1px solid #dfe5ef; border-radius: 12px; box-shadow: 0 18px 45px rgba(7, 24, 50, .08); padding: 24px; margin-top: 24px; }
    .scenario-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .prompt { font-size: 16px; }
    .pill { white-space: nowrap; background: #eef8ff; border: 1px solid #c6e6fb; color: #063a61; border-radius: 999px; padding: 8px 12px; font-weight: 800; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
    .metrics div { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .metrics span { display: block; font-size: 28px; font-weight: 900; }
    .metrics label { color: #657391; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Enterprise Knowledge Layer</p>
    <h1>Moves Context Pack Dry-Run Proof <span class="status">${escapeHtml(summary.verdict)}</span></h1>
    <p>Generated ${escapeHtml(summary.generatedAt)}. This report shows each scenario prompt, the governed context pack response, the Claude-ready payload, and the rendered proof assessment.</p>
    <section class="card">
      <h2>Truth split</h2>
      <table><tbody>${truthRows}</tbody></table>
    </section>
    ${scenarioCards}
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "moves-context-pack-proof.html"), html);
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
