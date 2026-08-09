import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import {
  SOURCE_ARTIFACT_SPECS,
  type SourceArtifactSpec,
} from "@/lib/source/canonical-specs";
import {
  ARTIFACT_CODE_TO_KIND,
  type SourceDeliverableKind,
} from "@/lib/source/exports/types";
import { getAllowedFormats } from "@/lib/source/exports/format-router";
import {
  SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
  SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
} from "@/lib/source/artifact-governance";
import { getPromptTemplate } from "@/lib/source/agent-generation";
import { requiresSourceConsultingGradeGate } from "@/lib/source/agent-generation/quality-review";
import {
  getSourceArtifactProfile,
  type SourceArtifactProfile,
} from "@/lib/source/documentation-standards/source-artifact-profiles";
import { runDocumentQA } from "@/lib/source/documentation-standards/source-documentation-standards";
import type { SourceStageKey } from "@/lib/source/types";

export type SourceArtifactLifecycleState =
  | "client_final"
  | "ai_draft"
  | "evidence_only"
  | "not_registered";

export interface SourceArtifactLifecycleArtifact {
  artifactCode?: string | null;
  artifactKind?: string | null;
  artifactType?: string | null;
  artifactGroup?: string | null;
  sourceOrigin?: string | null;
  status?: string | null;
  approvalState?: string | null;
  evidenceState?: string | null;
  isClientFinal?: boolean | null;
  body?: string | null;
  bodyMarkdown?: string | null;
  renderedText?: string | null;
  plainTextSummary?: string | null;
  bodyGenerationMetadata?: Record<string, unknown> | null;
}

export interface SourceArtifactLifecyclePromptContract {
  supported: boolean;
  modelLabel: string;
  maxTokensLabel: string;
}

export type SourceArtifactQualityState =
  | "decision_ready"
  | "review_required"
  | "evidence_only"
  | "missing";

export interface SourceArtifactQualityAssessment {
  state: SourceArtifactQualityState;
  label: string;
  score: number;
  hardFails: string[];
  warnings: string[];
  nextAction: string;
}

export type SourceArtifactContentQualityState =
  | "not_scored"
  | "passed"
  | "warnings"
  | "blocked";

export interface SourceArtifactContentQualityAssessment {
  state: SourceArtifactContentQualityState;
  label: string;
  score: number | null;
  blockers: string[];
  warnings: string[];
  gateCount: number;
  nextAction: string;
}

export type SourceArtifactConsultingGateState =
  | "not_required"
  | "required_not_run"
  | "passed"
  | "failed";

export interface SourceArtifactConsultingGateAssessment {
  required: boolean;
  state: SourceArtifactConsultingGateState;
  label: string;
  standardLabel: string;
  scoreLabel: string;
  findings: string[];
  nextAction: string;
}

export interface SourceArtifactLifecycleRow {
  code: string;
  name: string;
  stageKey: SourceStageKey;
  stageLabel: string;
  requirementLabel: string;
  gateLabel: string;
  familyLabel: string;
  guidelineLabel: string;
  audienceLabel: string;
  structureLabel: string;
  pageGuidanceLabel: string;
  controlsLabel: string;
  prompt: SourceArtifactLifecyclePromptContract;
  exportFormatsLabel: string;
  lifecycleState: SourceArtifactLifecycleState;
  lifecycleLabel: string;
  approvalLabel: string;
  governanceMessage: string;
  quality: SourceArtifactQualityAssessment;
  contentQuality: SourceArtifactContentQualityAssessment;
  consultingGate: SourceArtifactConsultingGateAssessment;
}

export interface SourceArtifactQualitySummary {
  score: number;
  hardFailCount: number;
  warningCount: number;
  missingRequiredCount: number;
  reviewRequiredCount: number;
  evidenceOnlyCount: number;
  decisionReadyCount: number;
  contentScoredCount: number;
  contentBlockerCount: number;
  contentWarningCount: number;
  consultingGateRequiredCount: number;
  consultingGatePassedCount: number;
  consultingGateFailedCount: number;
  consultingGatePendingCount: number;
  label: string;
  scopeLabel: string;
}

export interface SourceArtifactLifecycleSummary {
  rows: SourceArtifactLifecycleRow[];
  expectedCount: number;
  requiredCount: number;
  gateDefiningCount: number;
  promptBackedCount: number;
  renderableCount: number;
  aiDraftCount: number;
  clientFinalCount: number;
  evidenceOnlyCount: number;
  quality: SourceArtifactQualitySummary;
}

export interface SourceArtifactStandardsContextItem {
  code: string;
  title: string;
  stageKey: SourceStageKey;
  excerpt: string;
  score: number;
}

const ARTIFACT_STANDARDS_CSV_COLUMNS = [
  "Stage",
  "Artifact code",
  "Artifact name",
  "Requirement",
  "Gate role",
  "Artifact family",
  "Guideline",
  "Audience and reader mode",
  "Required exhibits / sections",
  "Page guidance",
  "Evidence and source controls",
  "Prompt-backed",
  "Model",
  "Token budget",
  "Export formats",
  "Current lifecycle state",
  "Approval rule",
  "AI draft rule",
  "Human final rule",
  "Quality status",
  "Quality score",
  "Quality findings",
  "Content QA status",
  "Content QA score",
  "Content QA findings",
  "Consulting Gate B",
  "Consulting Gate B score",
  "Consulting Gate B findings",
  "Governance note",
] as const;

const GUIDELINES_BY_CODE: Partial<Record<string, string>> = {
  d01_strategy_memo: "Strategy decision, why-now, value target, archetype, rigor.",
  d02_value_target: "5 sections; value range, levers, confidence, assumptions, measurement.",
  d03_archetype_decision: "5 sections; candidate archetypes, criteria, selected archetype, rigor, implications.",
  d04_app_inv: "7-section inventory standard; pricing-critical table and evidence notes.",
  d05_scope_memo: "8-section scope standard; in/out scope, responsibilities, baselines, approval.",
  d06_excl_log: "Sponsor-reviewed exclusions, rationale, pricing implication, owner actions.",
  d08_premortem: "Workshop output; top scope failure modes, mitigations, owner actions.",
  d09_rfp_pack: "11 sections; mandatory tables, source register, gap closure register.",
  d10_rfi_summary: "Market-scan signal matrix, capability fit, caveats, shortlist implications.",
  d11_response_checklist: "Single vendor response workbook; claim register, pricing response tab, staffing, SLA, assumptions, exceptions.",
  d12_vendor_shortlist: "Approved vendors, rationale, fit, disqualification notes, invite conditions.",
  d16_scorecard: "Locked criteria, weights, evidence, pass/fail gates, sensitivity.",
  d19_pricing_workbook: "Pricing template/comparison; normalized assumptions, transition, run, risk reserve.",
  d20_trap_log: "Commercial traps, financial exposure, negotiation response, resolution owner.",
  d22_bafo_question_pack: "Vendor-specific asks, proof requests, walk-away conditions, owner/due date.",
  d23_bafo_round_log: "Round responses, price/term deltas, trap closure, written acceptances.",
  d24_decision_brief: "7-section executive decision standard with tradeoffs, risk, recommendation, signoff.",
  d25_risk_attestation: "Residual risk register, materiality, controls, acceptance conditions, signoff.",
  d26_steward_signoff: "Governance sign-off ledger, exceptions, dissent, decision-rights evidence.",
  d27_selection_memo: "Selection rationale, final economics, contract conditions, audit trail.",
  d28_contract_record: "Signed contract reference, terms snapshot, SLA/XLA and transition obligations.",
  d29_transition_plan: "Milestones, KT, go/no-go checkpoints, owner and risk controls.",
  d31_kt_evidence: "Session evidence; attendees, receiving-team signoff, open KT gaps.",
  d32_value_ledger: "Projected to committed to measured value, owner, evidence, Tower handoff.",
  d33_governance_review: "Quarterly value/SLA review, issues, decisions, rebaseline triggers.",
};

export function buildSourceArtifactLifecycleSummary(
  artifacts: readonly SourceArtifactLifecycleArtifact[] = [],
): SourceArtifactLifecycleSummary {
  const rows = SOURCE_ARTIFACT_SPECS.map((spec) =>
    buildLifecycleRow(spec, artifacts),
  );
  const quality = buildQualitySummary(rows);

  return {
    rows,
    expectedCount: rows.length,
    requiredCount: rows.filter((row) => row.requirementLabel === "Required").length,
    gateDefiningCount: rows.filter((row) => row.gateLabel === "Gate-defining").length,
    promptBackedCount: rows.filter((row) => row.prompt.supported).length,
    renderableCount: rows.filter((row) => row.exportFormatsLabel !== "Not export-routed").length,
    aiDraftCount: rows.filter((row) => row.lifecycleState === "ai_draft").length,
    clientFinalCount: rows.filter((row) => row.lifecycleState === "client_final").length,
    evidenceOnlyCount: rows.filter((row) => row.lifecycleState === "evidence_only").length,
    quality,
  };
}

export function buildSourceArtifactStandardsContext(args: {
  artifacts?: readonly SourceArtifactLifecycleArtifact[];
  stageKey?: SourceStageKey | string | null;
  prompt?: string | null;
  limit?: number;
} = {}): SourceArtifactStandardsContextItem[] {
  const summary = buildSourceArtifactLifecycleSummary(args.artifacts ?? []);
  const limit = Math.max(1, args.limit ?? 10);
  const promptCodes = inferArtifactCodesFromPrompt(args.prompt ?? "");
  const stageKey = args.stageKey ?? null;
  const rows = uniqueLifecycleRows([
    ...promptCodes
      .map((code) => summary.rows.find((row) => row.code === code))
      .filter((row): row is SourceArtifactLifecycleRow => Boolean(row)),
    ...summary.rows.filter((row) => stageKey && row.stageKey === stageKey),
    ...summary.rows.filter((row) => row.lifecycleState !== "not_registered"),
    ...summary.rows.filter((row) => row.prompt.supported),
  ]).slice(0, limit);

  return rows.map((row, index) => ({
    code: row.code,
    title: row.name,
    stageKey: row.stageKey,
    excerpt: formatArtifactStandardsExcerpt(row),
    score: 46 - index,
  }));
}

export function buildSourceArtifactStandardsCsv(
  rows: readonly SourceArtifactLifecycleRow[],
): string {
  const body = rows.map((row) =>
    [
      row.stageLabel,
      row.code,
      row.name,
      row.requirementLabel,
      row.gateLabel,
      row.familyLabel,
      row.guidelineLabel,
      row.audienceLabel,
      row.structureLabel,
      row.pageGuidanceLabel,
      row.controlsLabel,
      row.prompt.supported ? "Yes" : "No",
      row.prompt.modelLabel,
      row.prompt.maxTokensLabel,
      row.exportFormatsLabel,
      row.lifecycleLabel,
      row.approvalLabel,
      "AI-prepared drafts are not final and require human review before external use.",
      "A reviewed client-final version must be accepted back into Source as the authoritative artifact of record.",
      row.quality.label,
      String(row.quality.score),
      [...row.quality.hardFails, ...row.quality.warnings].join("; ") || row.quality.nextAction,
      row.contentQuality.label,
      row.contentQuality.score === null ? "Not scored" : String(row.contentQuality.score),
      [...row.contentQuality.blockers, ...row.contentQuality.warnings].join("; ") ||
        row.contentQuality.nextAction,
      row.consultingGate.label,
      row.consultingGate.scoreLabel,
      row.consultingGate.findings.join("; ") || row.consultingGate.nextAction,
      row.governanceMessage,
    ].map(csvCell).join(","),
  );

  return [
    ARTIFACT_STANDARDS_CSV_COLUMNS.map(csvCell).join(","),
    ...body,
  ].join("\n");
}

function buildLifecycleRow(
  spec: SourceArtifactSpec,
  artifacts: readonly SourceArtifactLifecycleArtifact[],
): SourceArtifactLifecycleRow {
  const matchingArtifacts = artifacts.filter((artifact) => artifactMatchesSpec(artifact, spec));
  const lifecycleState = lifecycleStateFor(matchingArtifacts);
  const prompt = promptContractFor(spec.code);
  const profile = profileFor(spec.code);
  const quality = qualityAssessmentFor({
    lifecycleState,
    spec,
    prompt,
    profile,
  });
  const contentQuality = contentQualityAssessmentFor({
    content: artifactContentFor(matchingArtifacts),
    spec,
  });
  const consultingGate = consultingGateAssessmentFor({
    artifactCode: spec.code,
    artifacts: matchingArtifacts,
  });
  return {
    code: spec.code,
    name: spec.name,
    stageKey: spec.stage,
    stageLabel: SOURCE_STAGE_LABELS[spec.stage] ?? humanize(spec.stage),
    requirementLabel: humanize(spec.requirementLevel),
    gateLabel: spec.gateDefining ? "Gate-defining" : "Supporting",
    familyLabel: humanize(spec.family),
    guidelineLabel:
      GUIDELINES_BY_CODE[spec.code] ??
      "Executive answer, evidence basis, analysis, expert challenge, next actions.",
    audienceLabel: audienceLabelFor(profile),
    structureLabel: structureLabelFor(profile),
    pageGuidanceLabel: pageGuidanceLabelFor(profile),
    controlsLabel: controlsLabelFor(profile),
    prompt,
    exportFormatsLabel: exportFormatsFor(spec.code),
    lifecycleState,
    lifecycleLabel: lifecycleLabelFor(lifecycleState),
    approvalLabel: approvalLabelFor(lifecycleState),
    governanceMessage: governanceMessageFor(lifecycleState),
    quality,
    contentQuality,
    consultingGate,
  };
}

function buildQualitySummary(
  rows: readonly SourceArtifactLifecycleRow[],
): SourceArtifactQualitySummary {
  const relevantRows = rows.filter(
    (row) => row.requirementLabel === "Required" || row.gateLabel === "Gate-defining",
  );
  const denominator = Math.max(relevantRows.length, 1);
  const score = Math.round(
    relevantRows.reduce((total, row) => total + row.quality.score, 0) / denominator,
  );
  const hardFailCount = rows.reduce(
    (total, row) => total + row.quality.hardFails.length,
    0,
  );
  const warningCount = rows.reduce(
    (total, row) => total + row.quality.warnings.length,
    0,
  );
  const missingRequiredCount = rows.filter(
    (row) => row.requirementLabel === "Required" && row.quality.state === "missing",
  ).length;
  const reviewRequiredCount = rows.filter(
    (row) => row.quality.state === "review_required",
  ).length;
  const evidenceOnlyCount = rows.filter(
    (row) => row.quality.state === "evidence_only",
  ).length;
  const decisionReadyCount = rows.filter(
    (row) => row.quality.state === "decision_ready",
  ).length;
  const contentScoredCount = rows.filter(
    (row) => row.contentQuality.state !== "not_scored",
  ).length;
  const contentBlockerCount = rows.reduce(
    (total, row) => total + row.contentQuality.blockers.length,
    0,
  );
  const contentWarningCount = rows.reduce(
    (total, row) => total + row.contentQuality.warnings.length,
    0,
  );
  const consultingGateRequiredCount = rows.filter(
    (row) => row.consultingGate.required,
  ).length;
  const consultingGatePassedCount = rows.filter(
    (row) => row.consultingGate.state === "passed",
  ).length;
  const consultingGateFailedCount = rows.filter(
    (row) => row.consultingGate.state === "failed",
  ).length;
  const consultingGatePendingCount = rows.filter(
    (row) => row.consultingGate.state === "required_not_run",
  ).length;

  return {
    score,
    hardFailCount,
    warningCount,
    missingRequiredCount,
    reviewRequiredCount,
    evidenceOnlyCount,
    decisionReadyCount,
    contentScoredCount,
    contentBlockerCount,
    contentWarningCount,
    consultingGateRequiredCount,
    consultingGatePassedCount,
    consultingGateFailedCount,
    consultingGatePendingCount,
    label:
      hardFailCount > 0
        ? "Hard fails present"
        : warningCount > 0
          ? "Review warnings"
          : "Lifecycle ready",
    scopeLabel:
      contentScoredCount > 0
        ? `Scores lifecycle and approval hard gates, rendered body text where Source has artifact content available, and ${consultingGateRequiredCount} flagship consulting-grade Gate B contract(s).`
        : `Scores lifecycle and approval hard gates plus ${consultingGateRequiredCount} flagship consulting-grade Gate B contract(s); rendered body text is not available in this registry view yet, so prose, visuals, citations, and exhibit quality are not claimed.`,
  };
}

function consultingGateAssessmentFor(args: {
  artifactCode: string;
  artifacts: readonly SourceArtifactLifecycleArtifact[];
}): SourceArtifactConsultingGateAssessment {
  if (!requiresSourceConsultingGradeGate(args.artifactCode)) {
    return {
      required: false,
      state: "not_required",
      label: "Gate B not required",
      standardLabel: "Not required for this artifact class",
      scoreLabel: "N/A",
      findings: [],
      nextAction:
        "Use deterministic content QA and human review for this artifact.",
    };
  }

  const gate = latestConsultingGateMetadata(args.artifacts);
  const standardLabel = "Partner-grade consulting deliverable v1";
  if (!gate) {
    return {
      required: true,
      state: "required_not_run",
      label: "Gate B required",
      standardLabel,
      scoreLabel: "Not run",
      findings: [
        "No persisted consulting-grade review receipt is available for this artifact.",
      ],
      nextAction:
        "Run Claude generation/review or attach a client-final artifact with separate human acceptance before claiming narrative quality.",
    };
  }

  const passed = gate.passed === true;
  const score =
    typeof gate.overallScore === "number" && Number.isFinite(gate.overallScore)
      ? `${gate.overallScore}/10`
      : typeof gate.finalSummary === "string" && gate.finalSummary.trim()
        ? gate.finalSummary.trim()
        : "Recorded";
  const findings = [
    typeof gate.finalSummary === "string" ? gate.finalSummary : null,
    ...stringArray(gate.unsupportedClaims).map((claim) => `Unsupported: ${claim}`),
    ...stringArray(gate.missingEvidence).map((gap) => `Missing evidence: ${gap}`),
  ].filter((item): item is string => Boolean(item?.trim()));

  return {
    required: true,
    state: passed ? "passed" : "failed",
    label: passed ? "Gate B passed" : "Gate B failed",
    standardLabel,
    scoreLabel: score,
    findings,
    nextAction: passed
      ? "Keep the Gate B receipt with the generated artifact lineage."
      : "Repair or regenerate the artifact until every consulting-grade dimension scores at least 8/10.",
  };
}

function contentQualityAssessmentFor(args: {
  content: string | null;
  spec: SourceArtifactSpec;
}): SourceArtifactContentQualityAssessment {
  const content = args.content?.trim();
  if (!content) {
    return {
      state: "not_scored",
      label: "Content not scored",
      score: null,
      blockers: [],
      warnings: [],
      gateCount: 0,
      nextAction:
        "Thread rendered artifact body text into the lifecycle matrix before claiming section, visual, citation, or narrative quality.",
    };
  }

  const report = runDocumentQA({
    artifactCode: shortProfileCode(args.spec.code),
    content,
  });
  const score = Math.max(
    0,
    100 - report.blockers.length * 25 - report.warnings.length * 8,
  );
  const state: SourceArtifactContentQualityState =
    report.blockers.length > 0
      ? "blocked"
      : report.warnings.length > 0
        ? "warnings"
        : "passed";

  return {
    state,
    label:
      state === "blocked"
        ? "Content blockers"
        : state === "warnings"
          ? "Content warnings"
          : "Content QA passed",
    score,
    blockers: report.blockers,
    warnings: report.warnings,
    gateCount: report.results.length,
    nextAction:
      state === "passed"
        ? "Rendered content passes deterministic Source document QA."
        : "Repair the rendered artifact body, then re-run deterministic Source document QA before final use.",
  };
}

function artifactContentFor(
  artifacts: readonly SourceArtifactLifecycleArtifact[],
): string | null {
  for (const artifact of artifacts) {
    const content =
      artifact.body ??
      artifact.bodyMarkdown ??
      artifact.renderedText ??
      artifact.plainTextSummary;
    if (content?.trim()) return content;
  }
  return null;
}

function shortProfileCode(code: string): string {
  return code.split("_")[0] ?? code;
}

function qualityAssessmentFor(args: {
  lifecycleState: SourceArtifactLifecycleState;
  spec: SourceArtifactSpec;
  prompt: SourceArtifactLifecyclePromptContract;
  profile: SourceArtifactProfile | null;
}): SourceArtifactQualityAssessment {
  const { lifecycleState, spec, prompt, profile } = args;
  const hardFails: string[] = [];
  const warnings: string[] = [];
  const requiredOrGate = spec.requirementLevel === "required" || spec.gateDefining;
  const exhibitCount = profile?.requiredExhibits.length ?? 0;

  if (lifecycleState === "not_registered") {
    if (requiredOrGate) {
      hardFails.push(
        "Required/gate-defining artifact is missing; sections, visuals, and evidence cannot be scored yet.",
      );
    } else {
      warnings.push(
        "Supporting artifact is not registered; score excludes content inspection.",
      );
    }
    return {
      state: "missing",
      label: "Missing artifact",
      score: requiredOrGate ? 0 : 35,
      hardFails,
      warnings,
      nextAction: "Create or attach the artifact before treating this phase as complete.",
    };
  }

  if (lifecycleState === "ai_draft") {
    hardFails.push(
      "AI-prepared draft has not been accepted back as a human-reviewed client final.",
    );
    if (exhibitCount > 0) {
      warnings.push(
        `Human reviewer must verify ${exhibitCount} required exhibits, visuals, and source-register evidence before final use.`,
      );
    }
    return {
      state: "review_required",
      label: "Human review required",
      score: requiredOrGate ? 68 : 74,
      hardFails,
      warnings,
      nextAction: "Review the draft, approve it outside Source, then accept the reviewed final back into Source.",
    };
  }

  if (lifecycleState === "evidence_only") {
    if (requiredOrGate) {
      hardFails.push(
        "Uploaded evidence is present, but no governed deliverable or accepted final exists for this required artifact.",
      );
    } else {
      warnings.push(
        "Evidence is registered; confirm whether a formal deliverable is needed.",
      );
    }
    return {
      state: "evidence_only",
      label: "Evidence only",
      score: requiredOrGate ? 42 : 64,
      hardFails,
      warnings,
      nextAction: "Use the evidence to generate or complete the governed artifact, then route it through review.",
    };
  }

  if (!prompt.supported && spec.requirementLevel === "required") {
    warnings.push(
      "No dedicated generation prompt is registered; content quality depends on manual/template production.",
    );
  }
  if (!profile) {
    warnings.push(
      "No documentation profile is registered; required sections and visuals cannot be scored deeply yet.",
    );
  }

  return {
    state: "decision_ready",
    label: warnings.length > 0 ? "Client final with warnings" : "Client final ready",
    score: warnings.length > 0 ? 88 : 96,
    hardFails,
    warnings,
    nextAction: "Use this accepted client-final artifact as the authoritative record.",
  };
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function inferArtifactCodesFromPrompt(prompt: string): string[] {
  const text = prompt.toLowerCase();
  const matches: string[] = [];
  const add = (code: string, pattern: RegExp) => {
    if (pattern.test(text)) matches.push(code);
  };

  add("d01_strategy_memo", /\b(strategy memo|sourcing strategy|why now)\b/);
  add("d02_value_target", /\b(value target|value brief|savings target)\b/);
  add("d03_archetype_decision", /\b(archetype|buying motion)\b/);
  add("d04_app_inv", /\b(application inventory|app inventory|cmdb)\b/);
  add("d05_scope_memo", /\b(scope memo|scope document|scope pack|scope artifact)\b/);
  add("d07_ticket_synth", /\b(ticket|servicenow|volume|volumetric|baseline)\b/);
  add("d08_premortem", /\b(premortem|pre-mortem|workshop|session)\b/);
  add("d09_rfp_pack", /\b(rfp|request for proposal|vendor pack|vendor package)\b/);
  add("d11_response_checklist", /\b(response checklist|vendor response|compliance checklist)\b/);
  add("d16_scorecard", /\b(scorecard|evaluation rubric|rubric)\b/);
  add("d19_pricing_workbook", /\b(pricing workbook|pricing template|commercial workbook)\b/);
  add("d20_trap_log", /\b(trap log|commercial trap|risk trap)\b/);
  add("d22_bafo_question_pack", /\b(bafo|question pack|clarification)\b/);
  add("d24_decision_brief", /\b(decision brief|executive decision|recommendation)\b/);
  add("d29_transition_plan", /\b(transition plan|handoff plan|implementation plan)\b/);
  add("d31_kt_evidence", /\b(kt|knowledge transfer|session guidance|workshop guidance)\b/);
  add("d32_value_ledger", /\b(value ledger|realized value|value realization)\b/);

  return Array.from(new Set(matches));
}

function uniqueLifecycleRows(
  rows: SourceArtifactLifecycleRow[],
): SourceArtifactLifecycleRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.code)) return false;
    seen.add(row.code);
    return true;
  });
}

function formatArtifactStandardsExcerpt(
  row: SourceArtifactLifecycleRow,
): string {
  const generation = row.prompt.supported
    ? `Generation contract: ${row.prompt.modelLabel}, ${row.prompt.maxTokensLabel}. Export: ${row.exportFormatsLabel}.`
    : `Generation contract: no dedicated prompt. Export: ${row.exportFormatsLabel}.`;
  return [
    `Artifact standard: ${row.name} (${row.code}) is ${row.requirementLabel.toLowerCase()} and ${row.gateLabel.toLowerCase()} for ${row.stageLabel}.`,
    `Purpose and guideline: ${row.guidelineLabel}`,
    `Audience: ${row.audienceLabel}.`,
    `Structure: ${row.structureLabel}.`,
    `Page guidance: ${row.pageGuidanceLabel}.`,
    `Controls: ${row.controlsLabel}.`,
    generation,
    `Consulting-grade Gate B: ${row.consultingGate.label}; ${row.consultingGate.standardLabel}; score ${row.consultingGate.scoreLabel}.`,
    `Lifecycle state for this event: ${row.lifecycleLabel}. Approval rule: ${row.approvalLabel}. ${row.governanceMessage}`,
  ].join(" ");
}

function latestConsultingGateMetadata(
  artifacts: readonly SourceArtifactLifecycleArtifact[],
): Record<string, unknown> | null {
  for (const artifact of artifacts) {
    const metadata = artifact.bodyGenerationMetadata;
    if (!metadata || typeof metadata !== "object") continue;
    const gate = metadata.qualityGate;
    if (gate && typeof gate === "object") {
      return gate as Record<string, unknown>;
    }
  }
  return null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function profileFor(code: string): SourceArtifactProfile | null {
  const prefix = code.match(/^d\d+/)?.[0] ?? code;
  return getSourceArtifactProfile(prefix);
}

function audienceLabelFor(profile: SourceArtifactProfile | null): string {
  if (!profile) return "Audience: not profiled yet";
  const audience = Array.isArray(profile.audience)
    ? profile.audience.join(" + ")
    : profile.audience;
  return `${profile.clientFacing ? "Client-facing" : "Internal"} · ${humanize(audience)} · ${humanize(profile.readerMode)}`;
}

function structureLabelFor(profile: SourceArtifactProfile | null): string {
  if (!profile) return "Required exhibits: profile not available";
  const exhibits = profile.requiredExhibits.map(humanize);
  const preview = exhibits.slice(0, 4).join(", ");
  const suffix = exhibits.length > 4 ? ", ..." : "";
  return `Required exhibits: ${exhibits.length} · ${preview}${suffix}`;
}

function pageGuidanceLabelFor(profile: SourceArtifactProfile | null): string {
  if (!profile) return "Page guidance: follow artifact profile when available.";
  return `No fixed page cap; sections must satisfy the required exhibits. Depth: ${humanize(profile.riskDepth)}.`;
}

function controlsLabelFor(profile: SourceArtifactProfile | null): string {
  if (!profile) return "Controls: prompt/export metadata only.";
  return `Missing inputs: ${humanize(profile.missingInputPolicy)}. Evidence: ${humanize(profile.evidenceMode)}. Source register: ${humanize(profile.sourceRegisterPolicy)}.`;
}

function artifactMatchesSpec(
  artifact: SourceArtifactLifecycleArtifact,
  spec: SourceArtifactSpec,
): boolean {
  return (
    artifact.artifactCode ?? artifact.artifactKind ?? artifact.artifactType
  ) === spec.code;
}

function lifecycleStateFor(
  artifacts: readonly SourceArtifactLifecycleArtifact[],
): SourceArtifactLifecycleState {
  if (
    artifacts.some(
      (artifact) =>
        artifact.isClientFinal === true ||
        artifact.status === "client_final" ||
        artifact.approvalState === "client_final",
    )
  ) {
    return "client_final";
  }
  if (
    artifacts.some(
      (artifact) =>
        artifact.sourceOrigin === "generated" ||
        artifact.artifactGroup === "generated",
    )
  ) {
    return "ai_draft";
  }
  if (artifacts.length > 0) return "evidence_only";
  return "not_registered";
}

function promptContractFor(code: string): SourceArtifactLifecyclePromptContract {
  const template = getPromptTemplate(code);
  if (!template) {
    return {
      supported: false,
      modelLabel: "No dedicated prompt",
      maxTokensLabel: "N/A",
    };
  }
  return {
    supported: true,
    modelLabel: modelLabelFor(template.model),
    maxTokensLabel: maxTokensLabelFor(template.maxTokens),
  };
}

function modelLabelFor(model: string): string {
  const normalized = model.toLowerCase();
  if (normalized.includes("opus")) return "Claude Opus";
  if (normalized.includes("sonnet")) return "Claude Sonnet";
  if (normalized.includes("haiku")) return "Claude Haiku";
  return model;
}

function maxTokensLabelFor(maxTokens: number): string {
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) return "N/A";
  if (maxTokens >= 1000 && maxTokens % 1000 === 0) {
    return `${maxTokens / 1000}k max`;
  }
  return `${maxTokens.toLocaleString("en-US")} max`;
}

function exportFormatsFor(code: string): string {
  const kind = deliverableKindsFor(code);
  if (kind.length === 0) return "Not export-routed";
  const formats = Array.from(
    new Set(kind.flatMap((item) => getAllowedFormats(item))),
  );
  return formats.map((format) => format.toUpperCase()).join(" / ");
}

function deliverableKindsFor(code: string): SourceDeliverableKind[] {
  if (code === "d19_pricing_workbook") {
    return ["pricing-template", "pricing-comparison"];
  }
  const kind = ARTIFACT_CODE_TO_KIND[code];
  return kind ? [kind] : [];
}

function lifecycleLabelFor(state: SourceArtifactLifecycleState): string {
  switch (state) {
    case "client_final":
      return "Client-approved final";
    case "ai_draft":
      return "AI draft awaiting review";
    case "evidence_only":
      return "Evidence registered";
    case "not_registered":
      return "Not registered";
  }
}

function approvalLabelFor(state: SourceArtifactLifecycleState): string {
  if (state === "client_final") return "Human accepted";
  if (state === "ai_draft") return "Human review required";
  if (state === "evidence_only") return "Review before relying";
  return "Not ready for approval";
}

function governanceMessageFor(state: SourceArtifactLifecycleState): string {
  if (state === "client_final") return SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE;
  if (state === "ai_draft") return SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE;
  if (state === "evidence_only") {
    return "Uploaded evidence can support the record, but it is not a client-approved deliverable by itself.";
  }
  return "No event artifact is registered yet.";
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
