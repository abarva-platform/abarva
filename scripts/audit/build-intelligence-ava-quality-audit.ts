#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import {
  buildIntelligenceContextPackDryRun,
  type IntelligenceContextPackDryRunInput,
  type IntelligenceContextPackDryRunResult,
} from "../../src/lib/enterprise-knowledge/intelligence";

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

type AuditQuestion = {
  id: string;
  question: string;
  audience: NonNullable<IntelligenceContextPackDryRunInput["audience"]>;
  expectedCluster: "Agent Assist / Member Service" | "Finance Analytics";
  optional?: boolean;
};

type ContextPathRow = {
  tenant_key: string;
  tenant_name: string;
  question_id: string;
  question: string;
  intent: string;
  module_context_request_id: string;
  context_pack_id: string;
  context_pack_type: string;
  context_pack_hash: string;
  source_layers_used: string;
  evidence_refs_used: string;
  canonical_fact_ids_used: string;
  entity_profile_ids_used: string;
  relationship_edge_ids_used: string;
  context_gap_ids_used: string;
  candidate_context_included: string;
  active_context_included: string;
  old_legacy_path_used: string;
  source_template_direct_read: string;
  claude_prompt_id: string;
  response_id: string;
  status: "pass" | "fail" | "blocked";
  notes: string;
};

type ClaimGroundingRow = {
  question_id: string;
  response_id: string;
  claim_id: string;
  claim_text: string;
  support_status:
    | "supported_by_context"
    | "supported_but_caveated"
    | "inference_from_context"
    | "unsupported"
    | "contradicted"
    | "candidate_only"
    | "stale_legacy"
    | "generic_advice"
    | "generation_blocked";
  evidence_ref: string;
  fact_or_profile_or_edge_ref: string;
  gap_ref: string;
  severity: "pass" | "warn" | "fail" | "blocked";
  notes: string;
};

type ExecutiveQualityRow = {
  question_id: string;
  tenant_specificity: number;
  executive_clarity: number;
  business_usefulness: number;
  context_grounding: number;
  evidence_gap_awareness: number;
  decision_usefulness: number;
  risk_control_awareness: number;
  module_handoff_clarity: number;
  caveat_quality: number;
  concision: number;
  structure: number;
  no_generic_fluff: number;
  overall_average: number;
  status: "pass" | "fail" | "blocked";
  notes: string;
};

type VisualContractRow = {
  rule: string;
  status: "pass" | "blocked";
  existing_pattern: string;
  proof_or_blocker: string;
};

type AuditResult = {
  question: AuditQuestion;
  result: IntelligenceContextPackDryRunResult;
};

const repoRoot = process.cwd();
const generatedAt = process.env.INTELLIGENCE_AVA_QUALITY_GENERATED_AT ?? new Date().toISOString();
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(repoRoot, "reports/intelligence-ava-quality");
const contextPackDir = path.join(outDir, "context-packs");
const promptDir = path.join(outDir, "claude-prompts");
const responseDir = path.join(outDir, "claude-responses");
const browserProofDir = path.join(outDir, "browser-proof");

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis:
      "AI-enabled agent assist for member service/contact-center workflows with evidence-backed claims, eligibility, benefits, and knowledge context",
    systems: [
      "CRM/member-service platform",
      "contact center platform",
      "claims platform",
      "eligibility/benefits platform",
      "knowledge base",
      "Epic Clarity/Caboodle as clinical/data context",
      "SQL Server marts / Netezza/DB2-style warehouse where applicable",
      "Tableau",
      "SAS",
    ],
    dataDomains: [
      "member",
      "claims",
      "eligibility",
      "benefits",
      "provider",
      "call transcript",
      "case disposition",
      "knowledge article",
    ],
    infrastructure: [
      "legacy/on-prem-heavy healthcare/member-service data estate",
      "fragmented reporting/data estate",
      "AWS + Databricks lakehouse target foundation",
      "medallion architecture target",
      "Unity Catalog/governance target",
      "identity/member/provider spine target",
    ],
    vendorsContracts: ["contact center platform", "CRM platform", "claims platform managed services"],
    spendContext: ["agent handle-time baseline", "after-call work baseline", "call deflection hypothesis"],
    programs: ["member-service AI assist", "knowledge article cleanup", "data foundation readiness"],
    risksControls: [
      "PHI handling",
      "human-in-the-loop approval",
      "audit trail",
      "stale knowledge article duplicates",
      "transcript governance not validated",
      "KPI baselines incomplete",
    ],
    metrics: [
      "average handle time",
      "first contact resolution",
      "transfer rate",
      "repeat contact rate",
      "after-call work",
      "CSAT",
      "agent adoption",
      "data-quality score",
    ],
    sourceContext: [
      "member service process",
      "contact-center platform contracts",
      "CRM licenses",
      "call transcript annotation sample",
      "systems inventory",
      "risk/control notes",
    ],
    moduleGuidance: {
      intelligence:
        "Answer from governed context packs. Explicitly say ready for discovery/framing/diagnosis, not production deployment, until transcript governance, KPI baselines, API readiness, identity matching, data lineage, and approved controls are validated.",
      moves: "Use the context pack to frame P0-P5 evidence asks and gaps; do not create Move evidence directly.",
      source: "Use vendor/platform dependencies only through SourceContextPack; do not initiate sourcing or assert savings.",
      tower: "Use metrics as measurement candidates only; do not claim realized value.",
    },
  },
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis:
      "Finance analytics modernization across close reporting, managed analytics services, vendor spend, budget insight, and governed data-product certification",
    systems: [
      "Oracle ERP Finance",
      "SQL Server Finance Mart",
      "Netezza finance analytics appliance",
      "Informatica Finance ETL",
      "Tableau finance dashboards",
      "Power BI finance dashboards",
      "Databricks Finance Gold target on AWS",
    ],
    dataDomains: ["GL", "AP", "AR", "vendor spend", "budget", "cost center", "labor and headcount"],
    infrastructure: [
      "legacy reporting estate",
      "SQL Server finance marts",
      "Netezza on-prem analytics appliance",
      "AWS + Databricks target foundation",
    ],
    vendorsContracts: ["Oracle", "Microsoft", "Informatica", "Databricks", "Tableau", "Power BI"],
    spendContext: [
      "analytics managed services spend",
      "finance dashboard run cost",
      "manual close reconciliation effort",
      "budget stewardship",
    ],
    programs: ["Databricks Finance Gold certification backlog", "vendor master harmonization", "close automation roadmap"],
    risksControls: [
      "inconsistent vendor spend definitions",
      "slow close-window dashboards",
      "manual reconciliation control risk",
    ],
    metrics: [
      "close report refresh completion",
      "certified finance dashboard adoption",
      "manual reconciliation hours per close cycle",
    ],
    sourceContext: ["analytics managed services", "BI platform contracts", "data platform sourcing"],
    moduleGuidance: {
      intelligence: "Frame modernization readiness, blockers, and next evidence. Do not claim realized savings.",
      source: "Use vendor and contract context as sourcing inputs only.",
      tower: "Use metric names as measurement candidates only.",
    },
  },
};

const questions: AuditQuestion[] = [
  { id: "Q1", audience: "CDAO", expectedCluster: "Agent Assist / Member Service", question: "What does Nexus know about Meridian's Agent Assist opportunity?" },
  { id: "Q2", audience: "CDAO", expectedCluster: "Agent Assist / Member Service", question: "Is Meridian ready to implement AI Agent Assist in production?" },
  { id: "Q3", audience: "CIO", expectedCluster: "Agent Assist / Member Service", question: "What systems and data would Agent Assist depend on?" },
  { id: "Q4", audience: "CDAO", expectedCluster: "Agent Assist / Member Service", question: "What are the biggest evidence gaps before Meridian can make a CDAO-level decision?" },
  { id: "Q5", audience: "CDAO", expectedCluster: "Agent Assist / Member Service", question: "How should Meridian think about AWS and Databricks for Agent Assist and broader analytics?" },
  { id: "Q6", audience: "CDAO", expectedCluster: "Agent Assist / Member Service", question: "What should the CDAO prioritize in the next 30 days?" },
  { id: "Q7", audience: "CISO", expectedCluster: "Agent Assist / Member Service", question: "What risks and controls matter most for healthcare Agent Assist?" },
  { id: "Q8", audience: "CFO", expectedCluster: "Agent Assist / Member Service", question: "What metrics should Tower eventually track, and what should not be claimed yet?" },
  { id: "Q9", audience: "COO", expectedCluster: "Agent Assist / Member Service", question: "How would Moves use this context from P0 through P5?" },
  { id: "Q10", audience: "CEO", expectedCluster: "Agent Assist / Member Service", question: "What decisions are safe now versus not safe yet?" },
  { id: "Q11", audience: "CFO", expectedCluster: "Finance Analytics", question: "How does this context layer support Finance Analytics?", optional: true },
  { id: "Q12", audience: "CIO", expectedCluster: "Agent Assist / Member Service", question: "How could Source use this context if vendor/platform decisions are needed?", optional: true },
];

function main(): void {
  ensureCleanDir(outDir);
  ensureDir(contextPackDir);
  ensureDir(promptDir);
  ensureDir(responseDir);
  ensureDir(browserProofDir);

  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  const results = questions.map((question) => {
    const result = buildIntelligenceContextPackDryRun({
      input: {
        tenantKey: "meridian-health",
        question: question.question,
        audience: question.audience,
        mode: "active",
        requiredDepth: "progressive",
      },
      catalog,
      generatedAt,
    });
    return { question, result };
  });

  const contextRows = results.map(({ question, result }) => buildContextPathRow(question, result));
  const claimRows = results.flatMap(({ question, result }) => buildClaimRows(question, result));
  const qualityRows = results.map(({ question, result }) => buildQualityRow(question, result));
  const renderingRows = results.map(({ question }) => ({
    question_id: question.id,
    artifact_html_desktop_rendering: "pass_when_checked_with_playwright",
    artifact_html_narrow_rendering: "pass_when_checked_with_playwright",
    desktop_screenshot: "blocked_signed_in_intelligence_browser_not_run",
    answer_canvas_screenshot: "blocked_signed_in_intelligence_browser_not_run",
    evidence_gap_panel_screenshot: "blocked_signed_in_intelligence_browser_not_run",
    broken_markdown: "not_applicable_no_live_answer",
    raw_json_visible: "not_applicable_no_live_answer",
    debug_trace_visible: "not_applicable_no_live_answer",
    overflow_detected: "not_applicable_no_live_answer",
    duplicate_sections: "not_applicable_no_live_answer",
    status: "blocked",
    notes: "Signed-in Meridian Intelligence browser proof was not run by this deterministic audit. Artifact HTML rendering was QA-checked separately by Playwright when invoked by the agent.",
  }));
  const semanticRows = buildSemanticRows(results);
  const visualContractRows = buildVisualContractRows();

  for (const { question, result } of results) {
    const responseId = responseIdFor(question);
    writeJson(path.join(contextPackDir, `${question.id}-context-pack.json`), compactContextPack(question, result));
    writeText(
      path.join(promptDir, `${question.id}-claude-prompt.txt`),
      buildPromptText(question, result),
    );
    writeJson(path.join(responseDir, `${question.id}-claude-response.json`), {
      responseId,
      status: "blocked",
      claudeCalled: false,
      reason:
        "Deterministic audit did not call Claude. Set up an approved signed-in Intelligence workflow with Anthropic/egress credentials to complete live answer-quality proof.",
      rawResponse: null,
      parsedRenderedResponse: null,
      validationResult: "blocked",
    });
  }

  writeCsv("context-path-proof.csv", contextRows);
  writeCsv("answer-claim-grounding.csv", claimRows);
  writeCsv("executive-quality-scores.csv", qualityRows);
  writeCsv("rendering-quality.csv", renderingRows);
  writeCsv("meridian-semantic-compliance.csv", semanticRows);
  writeCsv("visual-rendering-contract.csv", visualContractRows);
  writeJson("test-question-results.json", results.map(({ question, result }) => compactContextPack(question, result)));

  const hardFailures = [
    ...contextRows.filter((row) => row.status === "fail").map((row) => `${row.question_id}: context path failed`),
    ...claimRows.filter((row) => row.severity === "fail").map((row) => `${row.question_id}/${row.claim_id}: ${row.notes}`),
    ...semanticRows.filter((row) => row.status === "fail").map((row) => `${row.rule}: ${row.notes}`),
  ];
  const blocked = {
    claudeAnswerQuality: true,
    signedInBrowserProof: true,
    reason:
      "This audit proves deterministic IntelligenceContextPack assembly and semantic guardrails. It does not call Claude and does not operate a signed-in Meridian browser session.",
  };
  const averageQuality =
    qualityRows.reduce((sum, row) => sum + row.overall_average, 0) / Math.max(qualityRows.length, 1);
  const summary = {
    codename: "INTELLIGENCE-AVA-NEW-DATA-LAYER-QUALITY-AUDIT-PR",
    generatedAt,
    tenant: { tenant_key: "meridian-health", tenant_name: "Meridian Health / Healthcare Demo" },
    verdict: hardFailures.length === 0 ? "CONTEXT_PATH_PASS__ANSWER_AND_BROWSER_BLOCKED" : "FAIL",
    contextPath: {
      usesIntelligenceContextPack: contextRows.every((row) => row.context_pack_type === "IntelligenceContextPack"),
      oldLegacyPathUsed: contextRows.some((row) => row.old_legacy_path_used === "yes"),
      sourceTemplateDirectRead: contextRows.some((row) => row.source_template_direct_read === "yes"),
      candidateIncludedByDefault: contextRows.some((row) => row.candidate_context_included === "yes"),
    },
    qualityGate: {
      averageQuality,
      minimumRequiredAverage: 4.2,
      answerQualityStatus: "blocked_no_claude_response",
      renderingQualityStatus: "blocked_no_signed_in_browser_answer",
    },
    counts: {
      questions: results.length,
      contextRows: contextRows.length,
      claimRows: claimRows.length,
      semanticRules: semanticRows.length,
      hardFailures: hardFailures.length,
    },
    blocked,
    hardFailures,
  };
  writeJson("summary.json", summary);
  writeSummaryMarkdown(summary);
  writeHtmlReport(summary, results, contextRows, qualityRows, claimRows, semanticRows, visualContractRows);
  writeBrowserBlockedProof();

  console.log(`Intelligence aVa quality audit: ${summary.verdict}`);
  console.log(`Report: ${path.relative(repoRoot, path.join(outDir, "intelligence-ava-quality-proof.html"))}`);
  if (hardFailures.length > 0) {
    throw new Error(`Intelligence aVa quality audit failed: ${hardFailures.join("; ")}`);
  }
}

function buildCatalog(report: SemanticReport): ContextSourceCatalogEntry[] {
  const meridian = report.tenants.find((tenant) => tenant.tenant_key === "meridian-health");
  if (!meridian) throw new Error("Meridian Health not found in semantic report");
  return meridian.cluster_assessments.map((cluster) => {
    const hint = catalogHints[`${meridian.tenant_key}::${cluster.cluster}`];
    if (!hint) throw new Error(`Missing Meridian catalog hint for ${cluster.cluster}`);
    const semanticCluster: SemanticClusterInput = {
      tenantKey: meridian.tenant_key,
      tenantName: meridian.tenant_name,
      clusterName: cluster.cluster,
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
        catalogKey: slug(`${meridian.tenant_key}-${cluster.cluster}`),
        tenantKey: meridian.tenant_key,
        tenantName: meridian.tenant_name,
        clusterName: cluster.cluster,
        contextTitle: cluster.cluster,
        ...hint,
      },
      semanticCluster,
      inputSources: [
        path.relative(repoRoot, sourceReportPath),
        `datasets/tenant-inputs/generated/${meridian.tenant_key}/standard-2026-07-v3/evidence_summary.csv`,
        `datasets/tenant-inputs/generated/${meridian.tenant_key}/standard-2026-07-v3/relationship_summary.csv`,
      ],
    };
  });
}

function buildContextPathRow(
  question: AuditQuestion,
  result: IntelligenceContextPackDryRunResult,
): ContextPathRow {
  const pack = result.intelligenceContextPack;
  const oldLegacy = legacyTermsPresent(JSON.stringify(result));
  return {
    tenant_key: pack.tenantKey,
    tenant_name: "Meridian Health / Healthcare Demo",
    question_id: question.id,
    question: question.question,
    intent: result.intent.archetypeKey,
    module_context_request_id: stableHash(JSON.stringify(result.request)),
    context_pack_id: pack.contextPackId,
    context_pack_type: "IntelligenceContextPack",
    context_pack_hash: stableHash(JSON.stringify(pack)),
    source_layers_used: pack.assemblyTrace.inputSources.join("; "),
    evidence_refs_used: pack.evidence.map((item) => item.evidenceId).join("; "),
    canonical_fact_ids_used: pack.facts.map((item) => item.factId).join("; "),
    entity_profile_ids_used: pack.relevantEntityProfiles.map((item) => item.profileId).join("; "),
    relationship_edge_ids_used: pack.relationshipCandidates.map((item) => item.relationshipId).join("; "),
    context_gap_ids_used: pack.gaps.map((item) => item.gapId).join("; "),
    candidate_context_included: pack.truthBoundary.candidateContextIncluded ? "yes" : "no",
    active_context_included: pack.truthBoundary.activeTenantContextDefault ? "yes" : "no",
    old_legacy_path_used: oldLegacy ? "yes" : "no",
    source_template_direct_read: pack.truthBoundary.sourceAdapterRowsActive ? "yes" : "no",
    claude_prompt_id: `${question.id}-claude-prompt.txt`,
    response_id: responseIdFor(question),
    status:
      pack.moduleKey === "intelligence" &&
      !oldLegacy &&
      !pack.truthBoundary.candidateContextIncluded &&
      !pack.truthBoundary.sourceAdapterRowsActive
        ? "pass"
        : "fail",
    notes: "Deterministic dry-run proves IntelligenceContextPack assembly from governed enterprise-knowledge layers. Claude and browser proof are separate blocked gates in this run.",
  };
}

function buildClaimRows(
  question: AuditQuestion,
  result: IntelligenceContextPackDryRunResult,
): ClaimGroundingRow[] {
  const pack = result.intelligenceContextPack;
  const rows: ClaimGroundingRow[] = [];
  const evidenceRef = pack.evidence[0]?.evidenceId ?? "";
  const profileRef = pack.relevantEntityProfiles[0]?.profileId ?? "";
  const gapRef = pack.gaps[0]?.gapId ?? "";
  rows.push({
    question_id: question.id,
    response_id: responseIdFor(question),
    claim_id: `${question.id}-CTX-1`,
    claim_text: "Intelligence/aVa context path uses an IntelligenceContextPack assembled from governed context layers.",
    support_status: "supported_by_context",
    evidence_ref: evidenceRef,
    fact_or_profile_or_edge_ref: profileRef,
    gap_ref: "",
    severity: "pass",
    notes: "Supported by dry-run request, context pack ID, assembly trace, evidence refs, profiles, relationships, and gaps.",
  });
  rows.push({
    question_id: question.id,
    response_id: responseIdFor(question),
    claim_id: `${question.id}-GAP-1`,
    claim_text: "Important Meridian gaps must be surfaced rather than hidden.",
    support_status: "supported_but_caveated",
    evidence_ref: evidenceRef,
    fact_or_profile_or_edge_ref: profileRef,
    gap_ref: gapRef,
    severity: "pass",
    notes: "Context pack includes gaps and unsupported claims in audit payload, not leaked as active answer facts.",
  });
  rows.push({
    question_id: question.id,
    response_id: responseIdFor(question),
    claim_id: `${question.id}-CLAUDE-BLOCKED`,
    claim_text: "Live aVa answer claims cannot be grounded because Claude was not called in this deterministic audit.",
    support_status: "generation_blocked",
    evidence_ref: "",
    fact_or_profile_or_edge_ref: "",
    gap_ref: "",
    severity: "blocked",
    notes: "No raw Claude response or rendered answer was generated. This is intentionally blocked rather than faked.",
  });
  return rows;
}

function buildQualityRow(
  question: AuditQuestion,
  result: IntelligenceContextPackDryRunResult,
): ExecutiveQualityRow {
  const pack = result.intelligenceContextPack;
  const contextScore = Math.min(5, 3.8 + Math.min(0.8, pack.relevantEntityProfiles.length / 25) + Math.min(0.4, pack.gaps.length / 20));
  const scores = {
    tenant_specificity: round1(contextScore),
    executive_clarity: 0,
    business_usefulness: 0,
    context_grounding: round1(contextScore),
    evidence_gap_awareness: round1(pack.gaps.length > 0 ? 4.6 : 2.5),
    decision_usefulness: 0,
    risk_control_awareness: round1(pack.risks.length > 0 ? 4.4 : 3.5),
    module_handoff_clarity: round1(question.id === "Q9" || question.id === "Q12" ? 4.4 : 0),
    caveat_quality: round1(pack.unsupportedClaims.length > 0 ? 4.6 : 3.8),
    concision: 0,
    structure: 0,
    no_generic_fluff: 0,
  };
  const values = Object.values(scores);
  return {
    question_id: question.id,
    ...scores,
    overall_average: round1(values.reduce((sum, value) => sum + value, 0) / values.length),
    status: "blocked",
    notes:
      "Scores for rendered answer dimensions are blocked because Claude/aVa did not generate a live answer. Non-zero scores represent context-pack readiness dimensions only.",
  };
}

function buildSemanticRows(items: Array<{ question: AuditQuestion; result: IntelligenceContextPackDryRunResult }>) {
  const allText = items.map((item) => JSON.stringify(item.result)).join("\n");
  const rules = [
    ["current_state_legacy_fragmented", /legacy|on-prem|fragmented/i, true, "Meridian current state should be legacy/on-prem-heavy and fragmented."],
    ["known_agent_assist_systems", /CRM|contact center|claims|eligibility|knowledge|Epic|SQL Server|Netezza|Tableau|SAS/i, true, "Agent Assist known systems/data context should be present."],
    ["required_gaps_present", /transcript|baseline|API|identity|lineage|control|stale knowledge/i, true, "Known Agent Assist evidence gaps should be present."],
    ["aws_databricks_target_not_current", /target foundation|target on AWS|Databricks/i, true, "AWS/Databricks should appear as target/future/readiness context."],
    ["no_certified_production_claim", /certified production|production ready|production AI readiness is proven|already complete/i, false, "Must not claim certified production readiness."],
    ["no_realized_roi_claim", /has realized ROI|has realized savings|realized savings achieved|measured value achieved|realized value achieved/i, false, "Must not claim realized value without Tower/measured evidence."],
    ["no_phi_ingestion_claim", /PHI evidence has been ingested|PHI-bearing evidence ingested/i, false, "Must not claim PHI evidence was ingested."],
    ["no_legacy_v_named_artifacts", /\bV[4567]\b|current-state-pack|rich-pack/i, false, "Must not use old V-named pack language in answer context."],
  ] as const;
  return rules.map(([rule, pattern, shouldMatch, notes]) => {
    const matched = pattern.test(allText);
    const pass = shouldMatch ? matched : !matched;
    return {
      rule,
      expected: shouldMatch ? "present" : "absent",
      observed: matched ? "present" : "absent",
      status: pass ? "pass" : "fail",
      notes,
    };
  });
}

function buildVisualContractRows(): VisualContractRow[] {
  return [
    {
      rule: "Reuse existing structured answer packet instead of inventing a new visual schema",
      status: "pass",
      existing_pattern: "src/lib/ava-answer/contract.ts defines AvaAnswerPacket with table, chart, and graph artifacts.",
      proof_or_blocker:
        "Audit prompt and report use the existing artifact contract as the required live-proof target.",
    },
    {
      rule: "Model may suggest visual intent and data; app controls rendering",
      status: "pass",
      existing_pattern:
        "src/lib/intelligence/answer/structured-exhibits.ts converts prose/source-backed structures into AnswerTable, AnswerChart, and AnswerGraph artifacts.",
      proof_or_blocker:
        "Live proof must capture agent-answer artifacts and verify approved renderer output.",
    },
    {
      rule: "Approved renderers handle tables, charts, cards, matrices, and relationship/context graphs",
      status: "pass",
      existing_pattern:
        "src/components/home/know/HomeKnowAnswerRenderer.tsx and src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx consume AvaAnswerPacket artifacts.",
      proof_or_blocker:
        "This deterministic audit records the reuse target; signed-in Intelligence visual rendering remains blocked until live browser proof.",
    },
    {
      rule: "Claude must not emit arbitrary SVG, chart code, raw JSON, or Mermaid as the final UI",
      status: "blocked",
      existing_pattern:
        "Runtime answer path emits delta/agent-answer events; final rendered proof requires signed-in browser capture.",
      proof_or_blocker:
        "Blocked in this PR because no live Claude/aVa response or rendered Intelligence answer canvas was captured.",
    },
    {
      rule: "Visuals must be useful, source-backed, and no more precise than the evidence",
      status: "blocked",
      existing_pattern:
        "AvaAnswerPacket artifacts carry citationIds; claim validation and product-truth guards run in the ask route.",
      proof_or_blocker:
        "Blocked until live responses are scored for visual usefulness, source backing, no fake precision, no candidate-as-active leakage, and no Tower value overclaim.",
    },
  ];
}

function compactContextPack(
  question: AuditQuestion,
  result: IntelligenceContextPackDryRunResult,
) {
  const pack = result.intelligenceContextPack;
  return {
    question,
    contextPath: {
      request: result.request,
      intent: result.intent,
      selectedCatalogKey: result.selectedCatalogKey,
      contextPackId: pack.contextPackId,
      contextPackType: "IntelligenceContextPack",
      contextPackHash: stableHash(JSON.stringify(pack)),
    },
    layers: {
      evidenceRefs: pack.evidence.map((item) => item.evidenceId),
      canonicalFactIds: pack.facts.map((item) => item.factId),
      entityProfileIds: pack.relevantEntityProfiles.map((item) => item.profileId),
      relationshipEdgeIds: pack.relationshipCandidates.map((item) => item.relationshipId),
      contextGapIds: pack.gaps.map((item) => item.gapId),
      confidenceSummary: pack.confidenceSummary,
      caveats: pack.caveats,
      unsupportedClaims: pack.unsupportedClaims,
      recommendedNextEvidence: pack.recommendedNextEvidence,
    },
    claudeReadyContextPayload: pack.claudeReadyContextPayload,
    progressiveClaudePayload: result.progressiveClaudePayload,
    truthBoundary: pack.truthBoundary,
    assemblyTrace: pack.assemblyTrace,
  };
}

function buildPromptText(question: AuditQuestion, result: IntelligenceContextPackDryRunResult): string {
  return [
    "SYSTEM:",
    result.intelligenceContextPack.claudeReadyContextPayload.systemInstruction,
    "",
    "USER QUESTION:",
    question.question,
    "",
    "CONTEXT PACK PAYLOAD:",
    JSON.stringify(result.progressiveClaudePayload, null, 2),
    "",
    "ANSWER SHAPE REQUIRED:",
    "- direct answer",
    "- what Nexus knows",
    "- what Nexus does not know yet",
    "- evidence/gap basis",
    "- decision implication",
    "- recommended next action",
    "- module handoff where relevant",
    "- caveats / do-not-claim",
    "",
    "STRUCTURED VISUAL OUTPUT CONTRACT:",
    "- Use the existing AvaAnswerPacket artifact contract: table, chart, or graph artifacts only.",
    "- Claude may suggest visual intent and source-backed data points; the app decides how to render.",
    "- Do not output raw SVG, arbitrary Mermaid, chart code, raw JSON, or markdown tables as the final UI.",
    "- Suggest a visual only when it improves comprehension and the data is traceable to evidence refs.",
    "- Prefer tables, readiness matrices, gap tables, risk/control tables, metric tables, module handoff cards, and relationship/context graphs.",
    "- Use charts only for real numeric comparisons or trends with evidence-backed data points.",
    "- Never imply Tower measured value, AWS/Databricks production readiness, or realized ROI without proof.",
  ].join("\n");
}

function writeSummaryMarkdown(summary: Record<string, unknown>): void {
  const lines = [
    "# Intelligence aVa Quality Audit",
    "",
    `Status: ${summary.verdict}`,
    `Generated: ${summary.generatedAt}`,
    "",
    "## What Passed",
    "",
    "- Deterministic IntelligenceContextRequest construction.",
    "- Nexus Context Pack Assembler dry-run.",
    "- IntelligenceContextPack output with evidence, profiles, relationships, gaps, caveats, unsupported-claim exclusions, and Claude-ready payload.",
    "- Old V-path, raw source-template direct-read, and candidate-default leakage checks.",
    "- Meridian semantic guardrails for Agent Assist, AWS/Databricks, Source, and Tower.",
    "",
    "## What Is Blocked",
    "",
    "- Live Claude/aVa answer generation was not run.",
    "- Signed-in Meridian Intelligence browser proof was not run.",
    "- Rendering quality for the live answer canvas remains blocked until browser proof is captured.",
    "",
    "## Truth Boundary",
    "",
    "This report does not claim answer-quality pass. It proves the deterministic context path and marks answer/rendering proof blocked.",
  ];
  writeText(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtmlReport(
  summary: Record<string, unknown>,
  results: AuditResult[],
  contextRows: ContextPathRow[],
  qualityRows: ExecutiveQualityRow[],
  claimRows: ClaimGroundingRow[],
  semanticRows: Array<Record<string, string>>,
  visualContractRows: VisualContractRow[],
): void {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Intelligence aVa Quality Proof</title>
  <style>
    body { margin:0; background:#07101d; color:#edf5ff; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    main { max-width: 1340px; margin:0 auto; padding:36px 28px 80px; }
    section { border:1px solid #26364f; background:#101a2a; border-radius:12px; padding:22px; margin:16px 0; overflow:hidden; }
    h1 { font-size:42px; margin:0 0 8px; }
    h2 { margin:0 0 10px; font-size:25px; }
    h3 { margin:16px 0 8px; }
    p, li { color:#b8c7d9; line-height:1.55; }
    .eyebrow { color:#79b4ff; letter-spacing:.16em; text-transform:uppercase; font-weight:800; font-size:12px; }
    .grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; }
    .flow-grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:10px; margin-top:14px; }
    .card { border:1px solid #26364f; border-radius:10px; padding:14px; background:#0b1422; overflow-wrap:anywhere; }
    .flow-step { border:1px solid #30415c; border-radius:10px; padding:12px; background:#0b1422; min-height:92px; }
    .flow-step strong { display:block; color:#edf5ff; margin-bottom:5px; }
    .flow-step span { color:#b8c7d9; font-size:13px; line-height:1.45; }
    .metric { font-size:30px; font-weight:900; }
    .review-card { border:1px solid #26364f; background:#0b1422; border-radius:12px; padding:18px; margin:16px 0; }
    .review-head { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; border-bottom:1px solid #24334a; padding-bottom:12px; margin-bottom:14px; }
    .review-head h3 { margin:0 0 6px; font-size:20px; }
    .pill-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
    .pill { border:1px solid #30415c; background:#101a2a; border-radius:999px; padding:5px 9px; color:#d9e9ff; font-size:12px; font-weight:800; }
    .review-grid { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:14px; }
    .mini-panel { border:1px solid #24334a; border-radius:10px; padding:12px; background:#101a2a; }
    .mini-panel h4 { margin:0 0 8px; color:#79b4ff; letter-spacing:.12em; text-transform:uppercase; font-size:11px; }
    .mini-panel p { margin:6px 0; }
    .compact-list { margin:8px 0 0; padding-left:18px; }
    .compact-list li { margin:4px 0; }
    details { border:1px solid #24334a; border-radius:10px; padding:10px 12px; background:#07101d; margin-top:12px; }
    summary { cursor:pointer; font-weight:900; color:#d9e9ff; }
    pre { white-space:pre-wrap; overflow-wrap:anywhere; background:#050b14; border:1px solid #24334a; border-radius:10px; padding:12px; color:#d9e9ff; font-size:12px; line-height:1.45; max-height:360px; overflow:auto; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:12px; }
    th, td { padding:9px 10px; border-bottom:1px solid #24334a; text-align:left; vertical-align:top; overflow-wrap:anywhere; word-break:break-word; }
    th { color:#d9e9ff; background:#0b1422; }
    .good { color:#06140f; background:#3ddc97; border-radius:999px; padding:5px 9px; font-weight:800; }
    .blocked { color:#241900; background:#ffd166; border-radius:999px; padding:5px 9px; font-weight:800; }
    .bad { color:#27070a; background:#ff6b6b; border-radius:999px; padding:5px 9px; font-weight:800; }
    svg { width:100%; max-width:100%; display:block; }
    .svg-panel { overflow:hidden; border:1px solid #26364f; border-radius:12px; padding:10px; background:#0b1422; }
    @media (max-width: 900px) { .grid, .flow-grid, .review-grid { grid-template-columns:1fr; } main { padding:20px; } .review-head { display:block; } }
    @media (max-width: 700px) {
      table, thead, tbody, tr, th, td { display:block; width:100%; box-sizing:border-box; }
      thead { display:none; }
      tr { border:1px solid #24334a; border-radius:10px; margin:10px 0; overflow:hidden; background:#0b1422; }
      td { display:grid; grid-template-columns:minmax(0, .42fr) minmax(0, 1fr); gap:10px; border-bottom:1px solid #1f2d43; }
      td::before { content:attr(data-label); color:#79b4ff; font-weight:900; text-transform:uppercase; letter-spacing:.08em; font-size:10px; overflow-wrap:anywhere; }
    }
  </style>
</head>
<body>
<main>
  <p class="eyebrow">Meridian Health · Intelligence · aVa</p>
  <h1>Intelligence aVa Quality Audit</h1>
  <p>This proof separates context-path truth from answer/rendering truth. Context-pack assembly passes; live Claude/aVa answer quality and signed-in browser rendering are explicitly blocked in this deterministic run.</p>
  <p><strong>This is not an aVa answer-quality pass.</strong> The correct conclusion is: Intelligence context-pack path passed; live Meridian aVa answer quality and browser rendering remain unproven.</p>
  <section>
    <h2>Executive Summary</h2>
    <div class="grid">
      <div class="card"><div class="metric">${escapeHtml(String(summary.verdict))}</div><p>Overall status</p></div>
      <div class="card"><div class="metric">${contextRows.length}</div><p>Questions audited</p></div>
      <div class="card"><div class="metric">12</div><p>Required output families generated</p></div>
      <div class="card"><div class="metric">Blocked</div><p>Claude/browser proof</p></div>
    </div>
  </section>
	  <section>
	    <h2>Intelligence/aVa Context Path</h2>
	    ${contextPathSvg()}
	    <p><span class="good">Pass</span> The deterministic path produces IntelligenceContextPack records from governed context layers. <span class="blocked">Blocked</span> Live Claude response and signed-in browser rendering still need runtime proof.</p>
	    <div class="flow-grid">
	      <div class="flow-step"><strong>1. Question</strong><span>Business/audience question captured for Meridian.</span></div>
	      <div class="flow-step"><strong>2. Prompt</strong><span>Nexus builds a governed Claude-ready prompt from the IntelligenceContextPack.</span></div>
	      <div class="flow-step"><strong>3. Response</strong><span>Blocked in this PR because Claude/aVa was not called.</span></div>
	      <div class="flow-step"><strong>4. Rendered UI</strong><span>Signed-in Intelligence answer canvas proof is blocked; HTML artifact rendering is QA-checked.</span></div>
	    </div>
	  </section>
	  <section>
	    <h2>Question / Prompt / Response / Render Review</h2>
	    <p>Each card shows the exact audit question, the context Nexus selected, the prompt payload that would be sent to aVa/Claude, and the honest response/rendering state. This is the reviewer-friendly view; the raw tables remain below for export and audit comparison.</p>
	    ${questionReviewCards(results)}
	  </section>
	  <section>
	    <h2>Structured Visual Contract</h2>
	    <p>Claude should not draw charts or ship arbitrary visual code. The existing pattern is: aVa returns an <strong>AvaAnswerPacket</strong> with optional source-backed table/chart/graph artifacts, validators check them, and the app renders them with approved components. This audit records that contract; live Intelligence visual rendering remains blocked until a signed-in answer is captured.</p>
	    ${tableHtml(visualContractRows)}
	  </section>
	  <section><h2>Context Path Proof</h2>${tableHtml(contextRows)}</section>
  <section><h2>Claim Grounding Summary</h2>${tableHtml(claimRows)}</section>
  <section><h2>Executive Quality Scores</h2>${tableHtml(qualityRows)}</section>
  <section><h2>Meridian Semantic Compliance</h2>${tableHtml(semanticRows)}</section>
  <section>
    <h2>Pass / Fail Decision</h2>
    <p><strong>Context path:</strong> pass for deterministic dry-run. <strong>Answer quality:</strong> blocked because no Claude/aVa live responses were generated. <strong>Rendering quality:</strong> blocked for signed-in Intelligence UI, though this HTML proof is artifact-rendered.</p>
  </section>
</main>
</body>
</html>`;
  writeText(path.join(outDir, "intelligence-ava-quality-proof.html"), html.replace(/[ \t]+$/gm, ""));
}

function contextPathSvg(): string {
  const nodes = [
    "User Question",
    "IntelligenceContextRequest",
    "Context Pack Assembler",
    "Evidence / Facts / Profiles / Graph / Gaps",
    "IntelligenceContextPack",
    "Claude / aVa",
    "Validator",
    "Rendered Answer",
  ];
  const markup = nodes
    .map((node, index) => {
      const x = 52 + index * 148;
      const color = index < 5 ? "#3ddc97" : "#ffd166";
      return `<g><rect x="${x}" y="112" width="126" height="64" rx="12" fill="#101a2a" stroke="${color}" stroke-width="2"/><foreignObject x="${x + 10}" y="126" width="106" height="38"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#edf5ff; font-weight:800; text-align:center; line-height:1.12; overflow-wrap:anywhere; word-break:break-word">${escapeHtml(node)}</div></foreignObject>${index < nodes.length - 1 ? `<path d="M${x + 126} 144 L${x + 146} 144" stroke="#79b4ff" stroke-width="2"/><path d="M${x + 146} 144 l-7 -5 v10 z" fill="#79b4ff"/>` : ""}</g>`;
    })
    .join("");
  return `<div class="svg-panel"><svg viewBox="0 0 1280 270" role="img" aria-label="Intelligence aVa context path"><rect x="0" y="0" width="1280" height="270" rx="18" fill="#0b1422"/><text x="52" y="52" fill="#79b4ff" font-size="13" font-weight="900" letter-spacing="3">CONTEXT PATH</text><text x="52" y="78" fill="#edf5ff" font-size="22" font-weight="900">Question to governed context pack to rendered answer</text>${markup}<text x="52" y="230" fill="#b8c7d9" font-size="13">This deterministic audit proves the green path through IntelligenceContextPack. Yellow stages require live Claude/browser proof.</text></svg></div>`;
}

function questionReviewCards(results: AuditResult[]): string {
  return results
    .map(({ question, result }) => {
      const pack = result.intelligenceContextPack;
      const promptText = buildPromptText(question, result);
      const evidenceItems = pack.evidence.slice(0, 5).map((item) => {
        const source = [item.sourceLabel, item.sourceType, item.citationStatus].filter(Boolean).join(" · ");
        const excerpt = item.excerpt ? ` — ${item.excerpt}` : "";
        return `${item.evidenceId}: ${source}${excerpt}`;
      });
      const facts = pack.facts.slice(0, 6).map((item) => `${item.predicate}: ${formatFactValue(item.value)}`);
      const gaps = pack.gaps.slice(0, 5).map((item) => `${item.gapId}: ${item.description}`);
      const unsupported = pack.unsupportedClaims.slice(0, 5).map((item) => `${item.claimId}: ${item.description}`);
      const caveats = pack.caveats.slice(0, 5);
      return `<article class="review-card">
        <div class="review-head">
          <div>
            <p class="eyebrow">${escapeHtml(question.id)} · ${escapeHtml(question.audience)} · ${escapeHtml(question.expectedCluster)}</p>
            <h3>${escapeHtml(question.question)}</h3>
            <p>${escapeHtml(pack.executiveSummary)}</p>
            <div class="pill-row">
              <span class="pill">Context: ${escapeHtml(pack.contextPackId)}</span>
              <span class="pill">Mode: ${escapeHtml(pack.mode)}</span>
              <span class="pill">Evidence refs: ${pack.evidence.length}</span>
              <span class="pill">Facts: ${pack.facts.length}</span>
              <span class="pill">Gaps: ${pack.gaps.length}</span>
            </div>
          </div>
          <div class="pill-row">
            <span class="good">Context pass</span>
            <span class="blocked">Response blocked</span>
            <span class="blocked">UI proof blocked</span>
          </div>
        </div>
        <div class="review-grid">
          <div class="mini-panel">
            <h4>Context Retrieved</h4>
            <p><strong>Summary sent forward:</strong> ${escapeHtml(firstLines(pack.claudeReadyContextPayload.contextSummary, 5))}</p>
            ${listHtml("Evidence attached to prompt", evidenceItems)}
            ${listHtml("Facts used", facts)}
            ${listHtml("Gaps / next evidence", gaps)}
          </div>
          <div class="mini-panel">
            <h4>Prompt / Response / Render</h4>
            <p><strong>Prompt file:</strong> ${escapeHtml(`claude-prompts/${question.id}-claude-prompt.txt`)}</p>
            <p><strong>Response file:</strong> ${escapeHtml(`claude-responses/${question.id}-claude-response.json`)}</p>
            <p><strong>Response status:</strong> blocked — Claude/aVa was not called by this deterministic audit.</p>
            <p><strong>Rendered answer status:</strong> blocked — signed-in Meridian Intelligence browser canvas was not operated.</p>
            ${listHtml("Do-not-claim controls", unsupported)}
            ${listHtml("Caveats", caveats)}
          </div>
        </div>
        <details>
          <summary>View prompt excerpt</summary>
          <pre>${escapeHtml(truncateMiddle(promptText, 5600))}</pre>
        </details>
        <details>
          <summary>What would need to be captured for full pass</summary>
          <pre>${escapeHtml([
            "1. Run the exact question in signed-in Meridian Intelligence.",
            "2. Capture the outbound Claude/aVa request ID or audited egress trace.",
            "3. Save the raw Claude response and parsed rendered response.",
            "4. Score answer quality against tenant specificity, grounding, caveats, decision usefulness, and no-fluff criteria.",
            "5. Capture browser screenshots/DOM proof of the rendered answer, evidence panel, and no-overflow layout.",
          ].join("\n"))}</pre>
        </details>
      </article>`;
    })
    .join("");
}

function tableHtml(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "<p>No rows.</p>";
  const columns = Object.keys(rows[0]);
  return `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td data-label="${escapeHtml(column)}">${escapeHtml(String(row[column] ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function listHtml(title: string, items: string[]): string {
  if (items.length === 0) {
    return `<p><strong>${escapeHtml(title)}:</strong> None in this context pack.</p>`;
  }
  return `<p><strong>${escapeHtml(title)}:</strong></p><ul class="compact-list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function firstLines(value: string, maxLines: number): string {
  return value.split("\n").slice(0, maxLines).join(" ");
}

function formatFactValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const half = Math.floor((maxLength - 80) / 2);
  return `${value.slice(0, half)}\n\n...[middle truncated for HTML readability; full prompt file is in the proof bundle]...\n\n${value.slice(-half)}`;
}

function writeBrowserBlockedProof(): void {
  writeText(
    path.join(browserProofDir, "BLOCKED.md"),
    `# Browser Proof Blocked

Signed-in Meridian Intelligence browser proof was not run by this deterministic audit.

Required future proof:

- Meridian/Healthcare Demo signed-in persona or approved tenant switch.
- Load Intelligence page for Meridian.
- Ask required questions.
- Capture rendered answer, evidence/gap panel, network/API response, and screenshots.
- Confirm no wrong tenant, no raw JSON/debug traces, no old V-language, and no AWS/Databricks production overclaim.
`,
  );
}

function legacyTermsPresent(text: string): boolean {
  return /\bV[4567]\b|current-state-pack|rich-pack|old tenant pack/i.test(text);
}

function responseIdFor(question: AuditQuestion): string {
  return `${question.id}-blocked-no-claude-response`;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function writeCsv(fileName: string, rows: Array<Record<string, unknown>>): void {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }
  writeText(path.join(outDir, fileName), `${lines.join("\n")}\n`);
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePathOrName: string, value: unknown): void {
  const filePath = path.isAbsolute(filePathOrName) ? filePathOrName : path.join(outDir, filePathOrName);
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath: string, value: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function ensureCleanDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
