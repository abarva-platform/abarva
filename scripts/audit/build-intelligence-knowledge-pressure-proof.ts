#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import {
  assembleIntelligenceRuntimeContext,
  INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
  type EnabledIntelligenceKnowledgeRuntimeResult,
  type IntelligenceKnowledgeRuntimeResult,
  type IntelligenceRuntimeAudience,
} from "../../src/lib/enterprise-knowledge/intelligence";

type ReadinessStatus =
  | "ready"
  | "partially_ready"
  | "legacy_behavior"
  | "missing_fast_pack"
  | "missing_deep_pack"
  | "missing_evidence"
  | "missing_gaps"
  | "generic_answer_risk"
  | "candidate_boundary_risk"
  | "unsupported_claim_risk"
  | "latency_risk"
  | "not_implemented";

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

type PressureQuestion = {
  id: string;
  outputFile?: string;
  tenantKey: string;
  audience: IntelligenceRuntimeAudience;
  question: string;
  expectedIntent: string;
  preferredCatalogKey?: string;
  expectedTerms: string[];
};

type QuestionReadiness = {
  id: string;
  tenantKey: string;
  question: string;
  expectedIntent: string;
  status: ReadinessStatus;
  knowledgePathStatus: ReadinessStatus;
  defaultPathStatus: ReadinessStatus;
  selectedCatalogKey: string;
  intentClassification: string;
  archetype: string;
  profiles: number;
  relationships: number;
  evidenceRefs: number;
  gaps: number;
  unsupportedClaimsExcluded: boolean;
  candidateBoundaryClean: boolean;
  claudeCalled: boolean;
  genericAnswerRisk: boolean;
  latencyMisses: string[];
  timing: {
    intentClassificationMs: number;
    fastContextPackMs: number;
    initialPayloadMs: number;
    deepContextPackMs: number;
    totalAssemblyMs: number;
  };
  qualityAssessment: string;
  blockers: string[];
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.INTELLIGENCE_KNOWLEDGE_PRESSURE_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "intelligence-knowledge-pressure-pr13";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/intelligence-pressure-proof",
);
const enabledEnv = { [INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG]: "true" };

const defaultIntelligenceFiles = [
  "src/app/(maestro)/intelligence/page.tsx",
  "src/app/api/intelligence/ask/route.ts",
  "src/lib/intelligence/ask/index.ts",
  "src/lib/intelligence/answer/router.ts",
  "src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx",
];

const questions: PressureQuestion[] = [
  {
    id: "meridian-agent-assist-readiness",
    outputFile: "meridian-agent-assist-pressure.json",
    tenantKey: "meridian-health",
    audience: "CIO",
    question: "How ready are we for Agent Assist in member service?",
    expectedIntent: "readiness",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    expectedTerms: ["Genesys Cloud", "Salesforce Health Cloud", "claims", "eligibility", "PHI", "average handle time"],
  },
  {
    id: "meridian-finance-modernization",
    outputFile: "meridian-finance-pressure.json",
    tenantKey: "meridian-health",
    audience: "CFO",
    question: "What is the Finance Analytics modernization opportunity?",
    expectedIntent: "value",
    preferredCatalogKey: "meridian-health-finance-analytics",
    expectedTerms: ["Oracle ERP Finance", "Netezza", "SQL Server Finance Mart", "Tableau", "Power BI", "Databricks", "manual reconciliation"],
  },
  {
    id: "meridian-agent-assist-blockers",
    tenantKey: "meridian-health",
    audience: "CDAO",
    question: "What systems, data, and controls would block Agent Assist?",
    expectedIntent: "risk",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    expectedTerms: ["Genesys Cloud", "Salesforce Health Cloud", "claims", "eligibility", "PHI", "human-in-the-loop"],
  },
  {
    id: "meridian-executive-decision-evidence",
    tenantKey: "meridian-health",
    audience: "EVP",
    question: "What evidence is missing before we can make an executive decision?",
    expectedIntent: "readiness",
    expectedTerms: ["evidence", "gaps", "source", "relationship", "baseline"],
  },
  {
    id: "meridian-highest-value-ai",
    tenantKey: "meridian-health",
    audience: "CEO",
    question: "What are the highest-value AI opportunities based on current enterprise context?",
    expectedIntent: "strategy",
    expectedTerms: ["Agent Assist", "Finance Analytics", "metrics", "risks", "evidence"],
  },
  {
    id: "harbortrust-fraud-triage",
    outputFile: "harbortrust-fraud-pressure.json",
    tenantKey: "harbortrust-bank",
    audience: "CISO",
    question: "Can AI help fraud analysts triage alerts safely?",
    expectedIntent: "use case",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: ["Fraud alert platform", "Fraud case management", "AML", "KYC", "model-risk controls", "false-positive"],
  },
  {
    id: "harbortrust-fraud-risks-controls",
    tenantKey: "harbortrust-bank",
    audience: "CISO",
    question: "What are the key risks and controls for a fraud analyst copilot?",
    expectedIntent: "risk",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: ["model-risk controls", "case outcome feedback", "model version lineage", "audit"],
  },
  {
    id: "harbortrust-customer-360",
    tenantKey: "harbortrust-bank",
    audience: "CDAO",
    question: "What data and system context do we have for Customer 360?",
    expectedIntent: "architecture",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: ["Digital onboarding KYC", "AML transaction monitoring", "device risk", "Fraud feature store"],
  },
  {
    id: "harbortrust-digital-onboarding",
    tenantKey: "harbortrust-bank",
    audience: "COO",
    question: "What is missing before digital onboarding modernization can be scoped?",
    expectedIntent: "operating model",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: ["Digital onboarding KYC", "KYC evidence", "gaps", "controls"],
  },
  {
    id: "generic-vendor-onboarding",
    outputFile: "generic-vendor-onboarding-pressure.json",
    tenantKey: "meridian-health",
    audience: "COO",
    question: "What context do we have for vendor onboarding modernization?",
    expectedIntent: "sourcing",
    preferredCatalogKey: "meridian-health-vendor-onboarding-modernization",
    expectedTerms: ["supplier intake workflow", "ERP supplier master", "security review", "approval"],
  },
  {
    id: "generic-back-office-manual-work",
    tenantKey: "meridian-health",
    audience: "COO",
    question: "Where should we focus if we want to reduce manual work in back office operations?",
    expectedIntent: "operating model",
    preferredCatalogKey: "meridian-health-vendor-onboarding-modernization",
    expectedTerms: ["supplier", "workflow", "manual", "rework", "evidence"],
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
      intelligence: "Frame modernization readiness, blockers, and next evidence. Do not claim realized savings or active delivery readiness.",
      home: "Show finance analytics context as source-backed enterprise knowledge.",
      moves: "Use finance analytics context to shape baselines and evidence asks.",
      source: "Use vendor and contract context as sourcing inputs only.",
      tower: "Use metric names as measurement candidates only.",
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
      intelligence: "Assess readiness from source-backed workflow and data context, with PHI and human-approval caveats.",
      home: "Show member service readiness with systems, data, risks, and recommended evidence.",
      moves: "Return phase evidence and gaps only.",
      source: "Return vendor dependencies as context only.",
      tower: "Use operational metrics as baseline candidates only.",
    },
  },
  "harbortrust-bank::Fraud Analyst Copilot": {
    primaryFunction: "Fraud Operations",
    outcomeHypothesis: "AI copilot support for fraud analyst triage, case investigation, and governed alert prioritization.",
    systems: ["Fraud alert platform", "Fraud case management", "AML transaction monitoring", "Digital onboarding KYC", "Device-risk intelligence", "Fraud feature store"],
    dataDomains: ["fraud alerts", "case outcomes", "AML transactions", "KYC evidence", "device risk", "model score"],
    infrastructure: ["real-time fraud decisioning", "model governance evaluation set", "feature-store feedback loop"],
    vendorsContracts: ["KYC vendor", "device intelligence vendor", "core banking provider"],
    spendContext: ["fraud ops queue cost", "loss avoidance measurement baseline"],
    programs: ["fraud analyst copilot", "feature-store feedback loop", "digital onboarding modernization"],
    risksControls: ["model-risk controls", "case outcome feedback gaps", "model version lineage gaps", "KYC evidence gaps"],
    metrics: ["false-positive rate", "analyst queue aging", "analyst throughput", "confirmed fraud loss", "loss recovery"],
    sourceContext: ["fraud alert tuning", "KYC vendor context", "device intelligence contract context"],
    moduleGuidance: {
      intelligence: "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      home: "Show fraud operations context with systems, risks, and evidence.",
      moves: "Use as discovery and diagnosis context only.",
      source: "Treat vendor context as sourcing input only.",
      tower: "Use metrics as measurement candidates only.",
    },
  },
  "meridian-health::Vendor Onboarding Modernization": {
    primaryFunction: "Vendor onboarding and back office operations",
    outcomeHypothesis: "Modernize supplier intake, security review, contract handoff, and ERP supplier-master activation with governed workflow evidence.",
    systems: ["supplier intake workflow", "ERP supplier master", "ServiceNow request queue", "contract repository", "security review portal"],
    dataDomains: ["supplier profile", "contract status", "security review status", "approval history", "ERP supplier master exception"],
    infrastructure: ["workflow evidence ledger", "source-owner attestation", "relationship validation notes"],
    vendorsContracts: ["ERP provider", "contract lifecycle platform", "security review tooling"],
    spendContext: ["onboarding rework effort", "supplier activation delay cost hypothesis"],
    programs: ["vendor onboarding modernization", "back office automation"],
    risksControls: ["duplicate supplier records", "incomplete security review evidence", "approval handoff gaps"],
    metrics: ["onboarding cycle time", "approval rework rate", "supplier master exception rate"],
    sourceContext: ["supplier onboarding workflow sample", "contract repository onboarding status extract", "ERP supplier master exception report", "security review evidence checklist"],
    moduleGuidance: {
      intelligence: "Frame workflow modernization context and missing evidence without claiming savings.",
      home: "Show as generic enterprise workflow context.",
      moves: "Use as discovery context.",
      source: "Use sourcing and vendor dependencies as context only.",
      tower: "Use cycle-time metrics as measurement candidates only.",
    },
  },
};

function main(): void {
  ensureDir(outDir);
  const report = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(report);
  const defaultSignals = analyzeDefaultIntelligence();
  const disabled = assembleIntelligenceRuntimeContext({
    tenantKey: "meridian-health",
    question: questions[0].question,
    audience: questions[0].audience,
    catalog,
    generatedAt,
    sourceVersion,
    contextVersion,
    env: {},
  });
  const results = questions.map((question) => {
    const result = assembleIntelligenceRuntimeContext({
      tenantKey: question.tenantKey,
      question: question.question,
      audience: question.audience,
      catalog: catalogForQuestion(catalog, question),
      generatedAt,
      sourceVersion,
      contextVersion,
      env: enabledEnv,
    });
    return { question, result, readiness: assessQuestion(question, result, defaultSignals) };
  });
  const validation = validatePressure(disabled, results);
  const summary = {
    codename: "INTELLIGENCE-KNOWLEDGE-LAYER-PRESSURE-TEST-PR13",
    generatedAt,
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    truthSplit: {
      defaultIntelligenceMigratedToKnowledgeLayer: false,
      flaggedKnowledgeRuntimeProven: true,
      defaultIntelligenceBehaviorChanged: false,
      tenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      defaultClaudeBehaviorChanged: false,
      productionRolloutChanged: false,
    },
    defaultSignals,
    counts: {
      questions: results.length,
      ready: countStatus(results, "ready"),
      partiallyReady: countStatus(results, "partially_ready"),
      legacyBehavior: countStatus(results, "legacy_behavior"),
      unsupportedClaimRisk: countStatus(results, "unsupported_claim_risk"),
      candidateBoundaryRisk: countStatus(results, "candidate_boundary_risk"),
      latencyRisk: countStatus(results, "latency_risk"),
    },
    questionReadiness: results.map((row) => row.readiness),
    timing: buildTiming(results.map((row) => row.readiness)),
    defaultVsKnowledgePathDiff: buildDiff(defaultSignals, results.map((row) => row.readiness)),
    failures: validation.failures,
    recommendedRemediationPRs: [
      "INTELLIGENCE-KNOWLEDGE-MIGRATION-PR16: wire the Intelligence page/API to the Knowledge runtime behind the existing default-off flag.",
      "INTELLIGENCE-ANSWER-QUALITY-PR17: render evidence, gaps, confidence, excluded context, and next evidence in the Intelligence answer packet.",
      "INTELLIGENCE-PROGRESSIVE-CLAUDE-PR18: enable progressive Claude only after signed-in proof shows the governed payload is used end to end.",
    ],
  };

  writeJson("summary.json", summary);
  writeJson("default-vs-knowledge-path-diff.json", summary.defaultVsKnowledgePathDiff);
  writeJson("timing.json", summary.timing);
  writeJson("all-question-pressure.json", results.map(({ question, result, readiness }) => compactResult(question, result, readiness)));
  for (const { question, result, readiness } of results) {
    if (question.outputFile) writeJson(question.outputFile, compactResult(question, result, readiness));
  }
  writeCsv(summary.questionReadiness);
  writeMarkdown(summary);
  writeHtml(summary);

  if (validation.failures.length > 0) {
    throw new Error(`Intelligence pressure proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`intelligence knowledge pressure proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function analyzeDefaultIntelligence() {
  const source = defaultIntelligenceFiles
    .map((file) => {
      const filePath = path.join(repoRoot, file);
      return fs.existsSync(filePath) ? `\n/* ${file} */\n${fs.readFileSync(filePath, "utf8")}` : "";
    })
    .join("\n");
  const knowledgeRuntimeImported = source.includes("assembleIntelligenceRuntimeContext") || source.includes("FastContextPack") || source.includes("ProgressiveClaudePayload");
  return {
    filesInspected: defaultIntelligenceFiles,
    knowledgeRuntimeImported,
    usesLegacyAskPipeline: source.includes("askIntelligence") || source.includes("routeQuestion") || source.includes("runSentinelReasoning"),
    advisoryPageUsesLandscapeViewModel: source.includes("getEnterpriseLandscapeViewModel"),
    defaultClaudePathPresent: source.includes("askIntelligence") || source.includes("composeAvaAnswer"),
    evidenceGapConfidenceRenderNotProven: !knowledgeRuntimeImported,
    conclusion: knowledgeRuntimeImported
      ? "Default Intelligence source references the Knowledge runtime; inspect runtime path before claiming migration."
      : "Default Intelligence still appears to use the advisory page and legacy ask pipeline; the Knowledge runtime is proven only through explicit flag/audit paths.",
  };
}

function assessQuestion(
  question: PressureQuestion,
  result: IntelligenceKnowledgeRuntimeResult,
  defaultSignals: ReturnType<typeof analyzeDefaultIntelligence>,
): QuestionReadiness {
  if (result.status !== "enabled") {
    return disabledReadiness(question);
  }
  const pack = result.intelligenceContextPack;
  const text = JSON.stringify(compactRuntimeForValidation(result));
  const blockers: string[] = [];
  if (!defaultSignals.knowledgeRuntimeImported) {
    blockers.push("Default Intelligence path is not proven to consume the Knowledge runtime.");
  }
  if (pack.evidence.length === 0) blockers.push("No evidence refs in context pack.");
  if (pack.gaps.length === 0) blockers.push("No gaps in context pack.");
  if (result.progressiveClaudePayload.initialPayload.unsupportedClaims.length > 0 || pack.claudeReadyContextPayload.unsupportedClaims.length > 0) {
    blockers.push("Unsupported claims leaked into model-visible payload.");
  }
  if (!candidateBoundaryClean(result)) blockers.push("Candidate/active boundary failed.");
  const missingTerms = question.expectedTerms.filter((term) => !text.toLowerCase().includes(term.toLowerCase()));
  if (missingTerms.length > 0) blockers.push(`Expected context terms missing: ${missingTerms.join(", ")}`);
  const genericAnswerRisk = pack.relevantEntityProfiles.length < 5 || missingTerms.length > 0;
  if (genericAnswerRisk) blockers.push("Context looks too thin or generic for the question.");
  const latencyRisk = result.timing.missedTargets.length > 0;
  if (latencyRisk) blockers.push(`Latency target misses: ${result.timing.missedTargets.join(", ")}`);
  const knowledgePathStatus: ReadinessStatus =
    blockers.some((b) => b.includes("Unsupported")) ? "unsupported_claim_risk"
    : blockers.some((b) => b.includes("Candidate")) ? "candidate_boundary_risk"
    : latencyRisk ? "latency_risk"
    : genericAnswerRisk ? "generic_answer_risk"
    : pack.evidence.length === 0 ? "missing_evidence"
    : pack.gaps.length === 0 ? "missing_gaps"
    : "ready";
  const defaultPathStatus: ReadinessStatus = defaultSignals.knowledgeRuntimeImported ? "partially_ready" : "legacy_behavior";
  return {
    id: question.id,
    tenantKey: question.tenantKey,
    question: question.question,
    expectedIntent: question.expectedIntent,
    status: defaultPathStatus === "legacy_behavior" ? "legacy_behavior" : knowledgePathStatus,
    knowledgePathStatus,
    defaultPathStatus,
    selectedCatalogKey: result.cacheBuild.resolution.selectedCatalogKey,
    intentClassification: result.cacheBuild.intent.moduleIntent,
    archetype: result.cacheBuild.intent.archetypeKey,
    profiles: pack.relevantEntityProfiles.length,
    relationships: pack.relationshipCandidates.length,
    evidenceRefs: pack.evidence.length,
    gaps: pack.gaps.length,
    unsupportedClaimsExcluded: result.progressiveClaudePayload.initialPayload.unsupportedClaims.length === 0 && pack.claudeReadyContextPayload.unsupportedClaims.length === 0,
    candidateBoundaryClean: candidateBoundaryClean(result),
    claudeCalled: result.guardrails.claudeCalled || result.cacheBuild.truthSplit.claudeCalled,
    genericAnswerRisk,
    latencyMisses: result.timing.missedTargets,
    timing: {
      intentClassificationMs: result.timing.intentClassificationMs,
      fastContextPackMs: result.timing.fastContextPackMs,
      initialPayloadMs: result.timing.initialPayloadMs,
      deepContextPackMs: result.timing.deepContextPackMs,
      totalAssemblyMs: result.timing.totalAssemblyMs,
    },
    qualityAssessment: [
      `Flagged path selected ${pack.relevantEntityProfiles.length} profiles, ${pack.relationshipCandidates.length} relationships, ${pack.evidence.length} evidence refs, and ${pack.gaps.length} gaps.`,
      `Default path status is ${defaultPathStatus}; do not claim default migration yet.`,
      result.progressiveClaudePayload.initialPayload.unsupportedClaims.length === 0
        ? "Claude-ready payload excludes unsupported claims."
        : "Unsupported claims require remediation.",
    ].join(" "),
    blockers: Array.from(new Set(blockers)),
  };
}

function disabledReadiness(question: PressureQuestion): QuestionReadiness {
  return {
    id: question.id,
    tenantKey: question.tenantKey,
    question: question.question,
    expectedIntent: question.expectedIntent,
    status: "not_implemented",
    knowledgePathStatus: "not_implemented",
    defaultPathStatus: "legacy_behavior",
    selectedCatalogKey: "disabled",
    intentClassification: "unknown",
    archetype: "unknown",
    profiles: 0,
    relationships: 0,
    evidenceRefs: 0,
    gaps: 0,
    unsupportedClaimsExcluded: false,
    candidateBoundaryClean: false,
    claudeCalled: false,
    genericAnswerRisk: true,
    latencyMisses: [],
    timing: { intentClassificationMs: 0, fastContextPackMs: 0, initialPayloadMs: 0, deepContextPackMs: 0, totalAssemblyMs: 0 },
    qualityAssessment: "Flagged Knowledge runtime did not enable for this question.",
    blockers: ["Flagged Knowledge runtime did not enable."],
  };
}

function validatePressure(
  disabled: IntelligenceKnowledgeRuntimeResult,
  results: Array<{ question: PressureQuestion; result: IntelligenceKnowledgeRuntimeResult; readiness: QuestionReadiness }>,
): { failures: string[] } {
  const failures: string[] = [];
  if (disabled.status !== "disabled") failures.push("default flag-off runtime was not disabled");
  if (results.length !== questions.length) failures.push("not every required question was tested");
  if (results.some((row) => row.readiness.defaultPathStatus !== "legacy_behavior")) {
    failures.push("pressure test should not mark default Intelligence path migrated in this PR");
  }
  for (const { question, result, readiness } of results) {
    if (result.status !== "enabled") {
      failures.push(`${question.id}: flagged runtime did not enable`);
      continue;
    }
    if (!readiness.unsupportedClaimsExcluded) failures.push(`${question.id}: unsupported claims leaked`);
    if (!readiness.candidateBoundaryClean) failures.push(`${question.id}: candidate boundary failed`);
    if (readiness.claudeCalled) failures.push(`${question.id}: audit called Claude or changed default Claude behavior`);
    if (result.intelligenceContextPack.mode !== "active") failures.push(`${question.id}: context pack was not active mode`);
    if (!result.fastContextPack) failures.push(`${question.id}: FastContextPack missing`);
    if (!result.deepContextPack) failures.push(`${question.id}: DeepContextPack missing`);
    if (!result.progressiveClaudePayload) failures.push(`${question.id}: ProgressiveClaudePayload missing`);
  }
  return { failures };
}

function buildCatalog(report: SemanticReport): ContextSourceCatalogEntry[] {
  const entries: ContextSourceCatalogEntry[] = [];
  for (const tenant of report.tenants) {
    for (const cluster of tenant.cluster_assessments) {
      entries.push(buildCatalogEntry(tenant.tenant_key, tenant.tenant_name, cluster.cluster, cluster, [
        path.relative(repoRoot, sourceReportPath),
        `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/evidence_summary.csv`,
        `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/relationship_summary.csv`,
      ]));
    }
  }
  const meridian = report.tenants.find((tenant) => tenant.tenant_key === "meridian-health");
  const base = meridian?.cluster_assessments[0];
  if (meridian && base) {
    entries.push(buildCatalogEntry(
      meridian.tenant_key,
      meridian.tenant_name,
      "Vendor Onboarding Modernization",
      {
        ...base,
        cluster: "Vendor Onboarding Modernization",
        rowsMatched: 18,
        painPoints: ["Supplier onboarding evidence spans workflow, contract, security, and ERP queues.", "Duplicate supplier records and missing security evidence slow activation."],
        evidenceItems: ["Supplier onboarding workflow sample.", "Contract repository onboarding status extract.", "ERP supplier master exception report.", "Security review evidence checklist."],
        metrics: ["onboarding cycle time", "approval rework rate", "supplier master exception rate"],
        issues: ["duplicate supplier records", "incomplete security review evidence", "approval handoff gaps"],
        modernizationDependencies: ["source-owner attestation", "relationship validation notes", "workflow evidence ledger"],
        relationshipsPresent: 8,
      },
      ["synthetic generic workflow fixture derived from universal context-pack contract", path.relative(repoRoot, sourceReportPath)],
    ));
  }
  return entries;
}

function buildCatalogEntry(
  tenantKey: string,
  tenantName: string,
  clusterName: string,
  cluster: SemanticReport["tenants"][number]["cluster_assessments"][number],
  inputSources: string[],
): ContextSourceCatalogEntry {
  const hint = catalogHints[`${tenantKey}::${clusterName}`];
  if (!hint) throw new Error(`Missing catalog hint for ${tenantKey} / ${clusterName}`);
  const semanticCluster: SemanticClusterInput = {
    tenantKey,
    tenantName,
    clusterName,
    rowsMatched: cluster.rowsMatched,
    painPoints: cluster.painPoints,
    evidenceItems: cluster.evidenceItems,
    metrics: cluster.metrics,
    issues: cluster.issues,
    modernizationDependencies: cluster.modernizationDependencies,
    relationshipsPresent: cluster.relationshipsPresent,
  };
  return {
    blueprint: {
      catalogKey: slug(`${tenantKey}-${clusterName}`),
      tenantKey,
      tenantName,
      clusterName,
      contextTitle: clusterName,
      ...hint,
    },
    semanticCluster,
    inputSources,
  };
}

function catalogForQuestion(catalog: ContextSourceCatalogEntry[], question: PressureQuestion): ContextSourceCatalogEntry[] {
  if (!question.preferredCatalogKey) return catalog.filter((entry) => entry.blueprint.tenantKey === question.tenantKey);
  const selected = catalog.filter((entry) => entry.blueprint.catalogKey === question.preferredCatalogKey);
  if (selected.length !== 1) throw new Error(`Missing preferred catalog ${question.preferredCatalogKey}`);
  return selected;
}

function candidateBoundaryClean(result: EnabledIntelligenceKnowledgeRuntimeResult): boolean {
  const boundary = result.intelligenceContextPack.truthBoundary;
  return !(
    boundary.candidateContextIncluded ||
    boundary.candidatePreviewExplicitlyRequested ||
    boundary.activeTenantAccessUpdated ||
    boundary.productionTenantDataWritten ||
    boundary.candidatePromoted ||
    boundary.moduleRuntimeBehaviorChanged ||
    boundary.sourceAdapterRowsActive ||
    result.guardrails.tenantDataWritten ||
    result.guardrails.activeTenantAccessUpdated ||
    result.guardrails.candidatePromoted ||
    result.guardrails.productionTenantDataWritten ||
    result.guardrails.moduleReadsCandidateByDefault
  );
}

function compactRuntimeForValidation(result: EnabledIntelligenceKnowledgeRuntimeResult): unknown {
  const pack = result.intelligenceContextPack;
  return {
    resolution: result.cacheBuild.resolution,
    intent: result.cacheBuild.intent,
    fastContextPack: result.fastContextPack,
    deepContextPack: result.deepContextPack,
    progressiveClaudePayload: result.progressiveClaudePayload,
    profiles: pack.relevantEntityProfiles,
    relationships: pack.relationshipCandidates,
    evidence: pack.evidence,
    gaps: pack.gaps,
    confidence: pack.confidenceSummary,
    caveats: pack.caveats,
  };
}

function compactResult(question: PressureQuestion, result: IntelligenceKnowledgeRuntimeResult, readiness: QuestionReadiness): unknown {
  if (result.status !== "enabled") return { question, readiness, result };
  return {
    question,
    readiness,
    request: result.request,
    resolution: result.cacheBuild.resolution,
    intent: result.cacheBuild.intent,
    fastContextPack: result.fastContextPack,
    deepContextPack: result.deepContextPack,
    progressiveClaudePayload: result.progressiveClaudePayload,
    streamingAssemblyTrace: result.streamingAssemblyTrace,
    timing: result.timing,
    guardrails: result.guardrails,
    contextPack: {
      contextPackId: result.intelligenceContextPack.contextPackId,
      mode: result.intelligenceContextPack.mode,
      executiveSummary: result.intelligenceContextPack.executiveSummary,
      profiles: result.intelligenceContextPack.relevantEntityProfiles,
      relationshipCandidates: result.intelligenceContextPack.relationshipCandidates,
      evidence: result.intelligenceContextPack.evidence,
      gaps: result.intelligenceContextPack.gaps,
      confidenceSummary: result.intelligenceContextPack.confidenceSummary,
      unsupportedClaimsHeldForAudit: result.intelligenceContextPack.unsupportedClaims,
      claudeReadyContextPayload: result.intelligenceContextPack.claudeReadyContextPayload,
      truthBoundary: result.intelligenceContextPack.truthBoundary,
    },
  };
}

function buildTiming(rows: QuestionReadiness[]) {
  return {
    generatedAt,
    targets: {
      intentClassificationMs: 500,
      fastContextPackMs: 2000,
      initialPayloadMs: 3000,
      deepContextPackMs: 15000,
    },
    maxIntentClassificationMs: Math.max(...rows.map((row) => row.timing.intentClassificationMs)),
    maxFastContextPackMs: Math.max(...rows.map((row) => row.timing.fastContextPackMs)),
    maxInitialPayloadMs: Math.max(...rows.map((row) => row.timing.initialPayloadMs)),
    maxDeepContextPackMs: Math.max(...rows.map((row) => row.timing.deepContextPackMs)),
    maxTotalAssemblyMs: Math.max(...rows.map((row) => row.timing.totalAssemblyMs)),
    targetFailures: rows.flatMap((row) => row.latencyMisses.map((miss) => `${row.id}:${miss}`)),
    rows: rows.map((row) => ({ id: row.id, question: row.question, timing: row.timing, latencyMisses: row.latencyMisses })),
  };
}

function buildDiff(defaultSignals: ReturnType<typeof analyzeDefaultIntelligence>, rows: QuestionReadiness[]) {
  return {
    generatedAt,
    defaultIntelligence: {
      route: "/intelligence",
      askApi: "/api/intelligence/ask",
      knowledgeRuntimeDefaultConsumptionProven: false,
      signals: defaultSignals,
    },
    flaggedKnowledgeRuntime: {
      requiredFlag: INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
      defaultEnabled: false,
      questionsTested: rows.length,
      statusByQuestion: rows.map((row) => ({
        id: row.id,
        selectedCatalogKey: row.selectedCatalogKey,
        knowledgePathStatus: row.knowledgePathStatus,
        defaultPathStatus: row.defaultPathStatus,
        profiles: row.profiles,
        relationships: row.relationships,
        evidenceRefs: row.evidenceRefs,
        gaps: row.gaps,
      })),
    },
    conclusion: "Flagged Intelligence Knowledge runtime is pressure-tested, but default Intelligence should not be called migrated until the page/API consumes the same context pack and renders evidence, gaps, confidence, exclusions, and next evidence.",
  };
}

function countStatus(rows: Array<{ readiness: QuestionReadiness }>, status: ReadinessStatus): number {
  return rows.filter((row) => row.readiness.status === status || row.readiness.knowledgePathStatus === status).length;
}

function writeCsv(rows: QuestionReadiness[]): void {
  const headers = ["id", "tenantKey", "status", "knowledgePathStatus", "defaultPathStatus", "intentClassification", "selectedCatalogKey", "profiles", "relationships", "evidenceRefs", "gaps", "latencyMisses", "blockers"];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.tenantKey,
        row.status,
        row.knowledgePathStatus,
        row.defaultPathStatus,
        row.intentClassification,
        row.selectedCatalogKey,
        row.profiles,
        row.relationships,
        row.evidenceRefs,
        row.gaps,
        row.latencyMisses.join(" | "),
        row.blockers.join(" | "),
      ].map(csvCell).join(","),
    ),
  ];
  fs.writeFileSync(path.join(outDir, "question-readiness.csv"), `${lines.join("\n")}\n`);
}

function writeMarkdown(summary: {
  generatedAt: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  questionReadiness: QuestionReadiness[];
  timing: unknown;
  recommendedRemediationPRs: string[];
  failures: string[];
}): void {
  const lines = [
    "# Intelligence Knowledge Layer Pressure Test",
    "",
    `Generated: ${summary.generatedAt}`,
    `Verdict: ${summary.verdict}`,
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Question Readiness",
    "",
    "| Question | Status | Knowledge Path | Default Path | Profiles | Relationships | Evidence | Gaps |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: |",
    ...summary.questionReadiness.map((row) => `| ${row.question} | ${row.status} | ${row.knowledgePathStatus} | ${row.defaultPathStatus} | ${row.profiles} | ${row.relationships} | ${row.evidenceRefs} | ${row.gaps} |`),
    "",
    "## Latency Summary",
    "",
    "```json",
    JSON.stringify(summary.timing, null, 2),
    "```",
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

function writeHtml(summary: {
  verdict: string;
  questionReadiness: QuestionReadiness[];
  timing: { maxTotalAssemblyMs?: number; targetFailures?: string[] };
  defaultVsKnowledgePathDiff: unknown;
}): void {
  const rows = summary.questionReadiness.map((row) => `<tr><td>${escapeHtml(row.question)}</td><td><span class="status ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></td><td>${escapeHtml(row.knowledgePathStatus)}</td><td>${escapeHtml(row.defaultPathStatus)}</td><td>${row.profiles}</td><td>${row.relationships}</td><td>${row.evidenceRefs}</td><td>${row.gaps}</td><td>${escapeHtml(row.blockers.join(" | ") || "None")}</td></tr>`).join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Intelligence Knowledge Pressure Proof</title><style>
    body{margin:0;background:#f6f8fb;color:#071733;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1320px;margin:0 auto;padding:44px 28px 72px}.hero{background:#071733;color:white;border-radius:14px;padding:32px;margin-bottom:22px}.hero p{color:#dbe7ff;font-size:18px;line-height:1.5;max-width:940px}h1{font-size:44px;line-height:1.05;margin:8px 0 10px}h2{font-size:26px;margin:30px 0 14px}.badge{display:inline-flex;background:#dff8ee;color:#08654f;border-radius:999px;padding:8px 12px;font-weight:850}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.card{background:white;border:1px solid #d8e0ec;border-radius:12px;padding:18px}.card strong{display:block;font-size:30px}table{width:100%;border-collapse:collapse;background:white;border:1px solid #d8e0ec;border-radius:12px;overflow:hidden}th,td{border-bottom:1px solid #e8edf5;padding:11px;text-align:left;font-size:13px;vertical-align:top}th{background:#fbfcff;color:#536073;text-transform:uppercase;font-size:11px;letter-spacing:.08em}.status{display:inline-flex;border-radius:999px;padding:4px 8px;font-weight:800;background:#eef4ff;color:#29466f}.legacy_behavior,.generic_answer_risk,.latency_risk{background:#fff5db;color:#6f4f12}.candidate_boundary_risk,.unsupported_claim_risk{background:#fff1f1;color:#8f1f1f}.ready{background:#dff8ee;color:#08654f}pre{white-space:pre-wrap;background:#071733;color:#dbe7ff;border-radius:12px;padding:18px;overflow:auto}
  </style></head><body><main><section class="hero"><span class="badge">${escapeHtml(summary.verdict)}</span><h1>Intelligence Knowledge Layer Pressure Test</h1><p>Truth-finding report: the flagged Intelligence Knowledge runtime can assemble FastContextPack, DeepContextPack, and ProgressiveClaudePayload, but default Intelligence should not be called migrated until the page/API uses that path and renders evidence, gaps, confidence, exclusions, and next evidence.</p></section><section class="cards"><div class="card"><strong>${summary.questionReadiness.length}</strong><span>questions tested</span></div><div class="card"><strong>${summary.timing.maxTotalAssemblyMs ?? 0}ms</strong><span>max pre-Claude assembly</span></div><div class="card"><strong>${summary.timing.targetFailures?.length ?? 0}</strong><span>latency misses</span></div></section><h2>Question readiness</h2><table><thead><tr><th>Question</th><th>Status</th><th>Knowledge Path</th><th>Default Path</th><th>Profiles</th><th>Relationships</th><th>Evidence</th><th>Gaps</th><th>Blockers</th></tr></thead><tbody>${rows}</tbody></table><h2>Default vs Knowledge Path Diff</h2><pre>${escapeHtml(JSON.stringify(summary.defaultVsKnowledgePathDiff, null, 2))}</pre></main></body></html>`;
  fs.writeFileSync(path.join(outDir, "intelligence-knowledge-pressure-proof.html"), html);
}

function writeJson(fileName: string, value: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

main();
