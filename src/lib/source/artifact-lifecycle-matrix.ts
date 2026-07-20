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
import {
  getSourceArtifactProfile,
  type SourceArtifactProfile,
} from "@/lib/source/documentation-standards/source-artifact-profiles";
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
}

export interface SourceArtifactLifecyclePromptContract {
  supported: boolean;
  modelLabel: string;
  maxTokensLabel: string;
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
  "Governance note",
] as const;

const DEFAULT_PROMPT_TOKENS = "24k max";

const PROMPT_CONTRACTS: Record<
  string,
  { modelLabel: string; maxTokensLabel: string }
> = {
  d01_strategy_memo: { modelLabel: "Claude Sonnet", maxTokensLabel: DEFAULT_PROMPT_TOKENS },
  d02_value_target: { modelLabel: "Claude Opus", maxTokensLabel: "12k max" },
  d03_archetype_decision: { modelLabel: "Claude Opus", maxTokensLabel: "12k max" },
  d04_app_inv: { modelLabel: "Claude Sonnet", maxTokensLabel: DEFAULT_PROMPT_TOKENS },
  d05_scope_memo: { modelLabel: "Claude Sonnet", maxTokensLabel: DEFAULT_PROMPT_TOKENS },
  d07_ticket_synth: { modelLabel: "Claude Sonnet", maxTokensLabel: DEFAULT_PROMPT_TOKENS },
  d09_rfp_pack: { modelLabel: "Claude Opus", maxTokensLabel: "128k max" },
  d11_response_checklist: { modelLabel: "Claude Opus", maxTokensLabel: "48k max" },
  d24_decision_brief: { modelLabel: "Claude Sonnet", maxTokensLabel: DEFAULT_PROMPT_TOKENS },
};

const GUIDELINES_BY_CODE: Partial<Record<string, string>> = {
  d01_strategy_memo: "Strategy decision, why-now, value target, archetype, rigor.",
  d02_value_target: "5 sections; value range, levers, confidence, assumptions, measurement.",
  d03_archetype_decision: "5 sections; candidate archetypes, criteria, selected archetype, rigor, implications.",
  d04_app_inv: "7-section inventory standard; pricing-critical table and evidence notes.",
  d05_scope_memo: "8-section scope standard; in/out scope, responsibilities, baselines, approval.",
  d08_premortem: "Workshop output; top scope failure modes, mitigations, owner actions.",
  d09_rfp_pack: "11 sections; mandatory tables, source register, gap closure register.",
  d11_response_checklist: "Vendor claim register, pricing workbook, staffing, SLA, assumptions, exceptions.",
  d16_scorecard: "Locked criteria, weights, evidence, pass/fail gates, sensitivity.",
  d19_pricing_workbook: "Pricing template/comparison; normalized assumptions, transition, run, risk reserve.",
  d20_trap_log: "Commercial traps, financial exposure, negotiation response, resolution owner.",
  d22_bafo_question_pack: "Vendor-specific asks, proof requests, walk-away conditions, owner/due date.",
  d24_decision_brief: "7-section executive decision standard with tradeoffs, risk, recommendation, signoff.",
  d27_selection_memo: "Selection rationale, final economics, contract conditions, audit trail.",
  d29_transition_plan: "Milestones, KT, go/no-go checkpoints, owner and risk controls.",
  d31_kt_evidence: "Session evidence; attendees, receiving-team signoff, open KT gaps.",
  d32_value_ledger: "Projected to committed to measured value, owner, evidence, Tower handoff.",
};

export function buildSourceArtifactLifecycleSummary(
  artifacts: readonly SourceArtifactLifecycleArtifact[] = [],
): SourceArtifactLifecycleSummary {
  const rows = SOURCE_ARTIFACT_SPECS.map((spec) =>
    buildLifecycleRow(spec, artifacts),
  );

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
    `Lifecycle state for this event: ${row.lifecycleLabel}. Approval rule: ${row.approvalLabel}. ${row.governanceMessage}`,
  ].join(" ");
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
  const contract = PROMPT_CONTRACTS[code];
  if (!contract) {
    return {
      supported: false,
      modelLabel: "No dedicated prompt",
      maxTokensLabel: "N/A",
    };
  }
  return { supported: true, ...contract };
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
