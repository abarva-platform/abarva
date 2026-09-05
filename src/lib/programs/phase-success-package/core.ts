import type { MovePhasePlaybook } from "@/lib/programs/playbook/move-phase-playbook";
import type { StrategicMove } from "@/lib/programs/types.ui";
import { templatesForPhase } from "@/lib/programs/phase-templates/catalog";
import type { MovePhaseCode } from "@/lib/programs/phase-templates/types";
import { buildFeedForwardPack } from "@/lib/programs/phase-templates/feed-forward";
import type { PhasePack } from "@/lib/programs/phase-packs/types.v2";

export type PhaseSuccessPackageKind =
  | "phase_execution_package"
  | "next_phase_readiness_package";

export interface PhaseSuccessPackageArtifact {
  kind: PhaseSuccessPackageKind;
  artifactType: string;
  title: string;
  fileName: string;
  body: string;
  status: PhaseSuccessPackageStatus;
  metadata: PhaseSuccessPackageMetadata;
}

export type PhaseSuccessPackageStatus =
  | "draft"
  | "evidence_incomplete"
  | "ready_for_review"
  | "ready_for_gate"
  | "approved"
  | "superseded";

export type RuntimeEvidenceStatus = "received" | "parsed" | "approved" | "missing";

export interface RuntimeEvidenceSummary {
  id: string;
  label: string;
  status: RuntimeEvidenceStatus;
  sourceArtifactId?: string | null;
  summary?: string;
}

export interface RuntimeFindingSummary {
  id: string;
  label: string;
  status: "approved" | "provisional" | "assumption";
  summary: string;
  sourceArtifactIds?: string[];
}

export interface RuntimeAssessmentDimension {
  key: string;
  label: string;
  status: "ready" | "in_progress" | "at_risk" | "blocked" | "unknown";
  summary: string;
}

export interface PhaseSuccessRuntimeTruth {
  generatedAt: string;
  generatedBy: string;
  evidenceCutoffAt: string;
  sourcePhase: number;
  targetPhase: number | "TOWER";
  sourceArtifactIds: string[];
  findingIds: string[];
  missingInputIds: string[];
  gateStatus: "passed" | "blocked" | "incomplete" | "not_evaluated";
  approvalStatus: "draft" | "ready_for_review" | "ready_for_gate" | "approved";
  packageStatus: PhaseSuccessPackageStatus;
  evidenceReceived: RuntimeEvidenceSummary[];
  evidenceMissing: RuntimeEvidenceSummary[];
  findings: RuntimeFindingSummary[];
  assumptions: string[];
  unresolvedQuestions: string[];
  assessment: RuntimeAssessmentDimension[];
  selectedBuildingBlocks: string[];
  architectureConstraints: string[];
  dataPlatformConstraints: string[];
  humanAiBoundaries: string[];
  controlRequirements: string[];
  openDecisions: string[];
  priorApprovedOutputs: string[];
  exactActionsToClosePhase: string[];
}

export interface PhaseSuccessPackageMetadata {
  packageKind: PhaseSuccessPackageKind;
  sourcePhase: number;
  targetPhase: number | "TOWER";
  generatedAt: string;
  generatedBy: string;
  evidenceCutoffAt: string;
  sourceArtifactIds: string[];
  findingIds: string[];
  missingInputIds: string[];
  gateStatus: PhaseSuccessRuntimeTruth["gateStatus"];
  approvalStatus: PhaseSuccessRuntimeTruth["approvalStatus"];
  packageStatus: PhaseSuccessPackageStatus;
  [key: string]: unknown;
}

export interface BuildPhaseSuccessPackagesInput {
  move: Pick<
    StrategicMove,
    | "id"
    | "name"
    | "tenant"
    | "archetype"
    | "functionPackKey"
    | "currentPhase"
    | "gateCriteria"
    | "valueAtStake"
    | "linkedEvidence"
  >;
  phase: number;
  phasePack: PhasePack | null;
  playbook: MovePhasePlaybook | null;
  runtime: PhaseSuccessRuntimeTruth;
}

const PHASE_CODE_BY_NUM: Partial<Record<number, MovePhaseCode>> = {
  2: "P2",
  3: "P3",
  4: "P4",
  5: "P5",
};

const NEXT_PHASE_LABEL: Record<number, string> = {
  0: "P1 Charter",
  1: "P2 Discover & Diagnose",
  2: "P3 Design Future State",
  3: "P4 Roadmap & Business Case",
  4: "P5 Approval & Mobilization",
  5: "Tower Track Outcomes",
};

export function buildPhaseSuccessPackages(
  input: BuildPhaseSuccessPackagesInput,
): PhaseSuccessPackageArtifact[] {
  const execution = renderPhaseExecutionPackage(input);
  const readiness = renderNextPhaseReadinessPackage(input);
  return [execution, readiness];
}

function renderPhaseExecutionPackage(
  input: BuildPhaseSuccessPackagesInput,
): PhaseSuccessPackageArtifact {
  const { move, phase, phasePack, playbook } = input;
  const runtime = input.runtime;
  const phaseLabel = phasePack?.phase_name ?? playbook?.label ?? `P${phase}`;
  const phaseCode = PHASE_CODE_BY_NUM[phase];
  const templates = phaseCode ? templatesForPhase(phaseCode) : [];
  const fileName = safeFileName(`${move.name}_P${phase}_Phase_Execution_Package.md`);

  const lines = [
    `# ${move.name} - ${phaseLabel} Phase Execution Package`,
    "",
    "## Purpose",
    phasePack?.phase_intent ??
      playbook?.intent ??
      "Run the current phase with explicit sessions, evidence, decisions, and approval criteria.",
    "",
    "## Package Status",
    `- Status: ${runtime.packageStatus}`,
    `- Source phase: P${runtime.sourcePhase}`,
    `- Target phase: ${formatTargetPhase(runtime.targetPhase)}`,
    `- Generated at: ${runtime.generatedAt}`,
    `- Evidence cutoff: ${runtime.evidenceCutoffAt}`,
    `- Gate status: ${runtime.gateStatus}`,
    `- Approval status: ${runtime.approvalStatus}`,
    "",
    "## Move Context",
    `- Client: ${move.tenant.name}`,
    `- Industry: ${move.tenant.industryCode ?? "Unknown"}`,
    `- Function pack: ${move.functionPackKey ?? "Not classified"}`,
    `- Archetype: ${move.archetype}`,
    `- Value basis: ${valueBasis(move)}`,
    `- Selected building blocks: ${formatList(runtime.selectedBuildingBlocks)}`,
    "",
    "## What Is Already Known",
    ...listOrNone(
      runtime.findings
        .filter((finding) => finding.status === "approved")
        .map((finding) => `${finding.label}: ${finding.summary}`),
    ),
    "",
    "## Evidence Received",
    ...listEvidence(runtime.evidenceReceived),
    "",
    "## Evidence Missing",
    ...listEvidence(runtime.evidenceMissing),
    "",
    "## Current Findings",
    ...listOrNone(
      runtime.findings.map(
        (finding) => `[${finding.status}] ${finding.label}: ${finding.summary}`,
      ),
    ),
    "",
    "## Current Assessment",
    ...listOrNone(
      runtime.assessment.map(
        (dimension) =>
          `${dimension.label}: ${dimension.status} - ${dimension.summary}`,
      ),
    ),
    "",
    "## Open Decisions",
    ...listOrNone(runtime.openDecisions),
    "",
    "## Entry Criteria",
    ...(phasePack?.entry_criteria ?? []).map(
      (criterion) => `- [${criterion.type}] ${criterion.description}`,
    ),
    "",
    "## Sessions To Run",
    ...(playbook?.sessions.length
      ? playbook.sessions.flatMap((session, index) => [
          `### ${index + 1}. ${session.label}`,
          `- Objective: ${session.objective}`,
          `- Participants: ${session.participants.join(", ")}`,
          `- Homework: ${session.homework.join(" | ") || "None recorded"}`,
          `- Alignment gate: ${session.gate.criterion} (${session.gate.severity}, ${session.gate.alignedBy})`,
          `- Feeds: ${session.feedsDeliverables.map((item) => item.replace(/_/g, " ")).join(", ")}`,
          "",
        ])
      : ["- No facilitated-session playbook is configured for this phase.", ""]),
    "## Workflow Steps",
    ...(phasePack?.workflow_steps ?? []).flatMap((step) => [
      `### ${step.step_id} - ${step.step_name}`,
      `- Goal: ${step.step_goal}`,
      `- Inputs: ${step.required_user_inputs.join(" | ") || "None recorded"}`,
      `- Evidence to capture: ${step.evidence_to_capture.join(" | ") || "None recorded"}`,
      `- Completion criteria: ${step.completion_criteria.join(" | ") || "None recorded"}`,
      "",
    ]),
    "## Recommended Templates",
    ...(templates.length
      ? templates.map(
          (template) =>
            `- ${template.label}: ${template.clientPurpose} (session: ${template.recommendedSessionType}, format: ${template.fileFormat})`,
        )
      : ["- No phase-template catalog entries are configured for this phase yet."]),
    "",
    "## Templates And Files Still Required",
    ...listOrNone(runtime.missingInputIds),
    "",
    "## Evidence Requirements",
    ...(phasePack?.evidence_requirements ?? []).map(
      (requirement) =>
        `- [${requirement.type}] ${requirement.label}: ${requirement.evaluation_hint}`,
    ),
    "",
    "## Gate Blockers",
    ...listOrNone(
      move.gateCriteria
        .filter((criterion) => !criterion.completed)
        .map((criterion) => `${criterion.label} (${criterion.severity})`),
    ),
    "",
    "## Sponsor Readout",
    ...listOrNone([
      runtime.packageStatus === "evidence_incomplete"
        ? "Evidence is incomplete; use this package to close the active phase, not to approve it."
        : "Package is ready for sponsor review against the evidence cutoff above.",
      ...runtime.unresolvedQuestions.map((question) => `Open question: ${question}`),
    ]),
    "",
    "## Exact Actions Required To Close Phase",
    ...listOrNone(runtime.exactActionsToClosePhase),
    "",
    "## Approval Checklist",
    ...(move.gateCriteria.length
      ? move.gateCriteria.map(
          (criterion) =>
            `- [${criterion.completed ? "x" : " "}] ${criterion.label} (${criterion.severity})`,
        )
      : ["- No live gate criteria were returned for this phase."]),
    "",
    "## Anti-Fabrication Rule",
    "Do not turn this package into approved phase evidence by itself. Session capture, uploaded evidence, owner attestation, and gate approval remain separate product actions.",
  ];

  return {
    kind: "phase_execution_package",
    artifactType: `p${phase}_phase_execution_package`,
    title: `${phaseLabel} - Phase Execution Package`,
    fileName,
    body: lines.join("\n"),
    metadata: {
      ...baseMetadata(runtime, "phase_execution_package"),
      sessionCount: playbook?.sessions.length ?? 0,
      templateCount: templates.length,
      evidenceRequirementCount: phasePack?.evidence_requirements.length ?? 0,
    },
    status: runtime.packageStatus,
  };
}

function renderNextPhaseReadinessPackage(
  input: BuildPhaseSuccessPackagesInput,
): PhaseSuccessPackageArtifact {
  const { move, phase, phasePack, playbook } = input;
  const runtime = input.runtime;
  const phaseLabel = phasePack?.phase_name ?? playbook?.label ?? `P${phase}`;
  const nextPhaseLabel = formatTargetPhase(runtime.targetPhase);
  const hardEvidence = (phasePack?.evidence_requirements ?? [])
    .filter((requirement) => requirement.type === "hard")
    .map((requirement) => requirement.label);
  const softEvidence = (phasePack?.evidence_requirements ?? [])
    .filter((requirement) => requirement.type === "soft")
    .map((requirement) => requirement.label);
  const openGates = move.gateCriteria
    .filter((criterion) => !criterion.completed)
    .map((criterion) => criterion.label);
  const templates = PHASE_CODE_BY_NUM[phase]
    ? templatesForPhase(PHASE_CODE_BY_NUM[phase] as MovePhaseCode)
    : [];
  const nextPack = buildFeedForwardPack(phase, nextPhaseLabel, {
    coverageScore: null,
    missingEvidence: [...hardEvidence, ...softEvidence],
    openGateCriteria: openGates,
    hardGaps: hardEvidence,
    softGaps: softEvidence,
    gaps: hardEvidence.map((label) => ({ capability: label, severity: "foundational" })),
    controlConstraints: phasePack?.phase_scope_boundary?.out ?? [],
  });
  const blocked =
    runtime.gateStatus !== "passed" ||
    runtime.evidenceMissing.length > 0 ||
    openGates.length > 0;
  const fileName = safeFileName(`${move.name}_P${phase}_Next_Phase_Readiness_Package.md`);

  const lines = [
    `# ${move.name} - ${nextPhaseLabel} Readiness Package`,
    "",
    "## Source Phase",
    `${phaseLabel}`,
    "",
    "## Package Status",
    `- Status: ${runtime.packageStatus}`,
    `- Source phase: P${runtime.sourcePhase}`,
    `- Target phase: ${formatTargetPhase(runtime.targetPhase)}`,
    `- Generated at: ${runtime.generatedAt}`,
    `- Evidence cutoff: ${runtime.evidenceCutoffAt}`,
    `- Gate status: ${runtime.gateStatus}`,
    `- Approval status: ${runtime.approvalStatus}`,
    "",
    "## Readiness Verdict",
    blocked
      ? `Blocked or incomplete until hard evidence and open gate criteria are resolved.`
      : `Ready to prepare ${nextPhaseLabel}.`,
    "",
    "## Approved Findings",
    ...listOrNone(
      runtime.findings
        .filter((finding) => finding.status === "approved")
        .map((finding) => `${finding.label}: ${finding.summary}`),
    ),
    "",
    "## Provisional Findings",
    ...listOrNone(
      runtime.findings
        .filter((finding) => finding.status === "provisional")
        .map((finding) => `${finding.label}: ${finding.summary}`),
    ),
    "",
    "## Assumptions",
    ...listOrNone([
      ...runtime.assumptions,
      ...runtime.findings
        .filter((finding) => finding.status === "assumption")
        .map((finding) => `${finding.label}: ${finding.summary}`),
    ]),
    "",
    "## Unresolved Questions",
    ...listOrNone(runtime.unresolvedQuestions),
    "",
    "## Solution Building Blocks Implicated",
    ...listOrNone(runtime.selectedBuildingBlocks),
    "",
    "## Architecture Constraints",
    ...listOrNone(runtime.architectureConstraints),
    "",
    "## Data / Platform Constraints",
    ...listOrNone(runtime.dataPlatformConstraints),
    "",
    "## Human / AI Boundaries",
    ...listOrNone(runtime.humanAiBoundaries),
    "",
    "## Control Requirements",
    ...listOrNone(runtime.controlRequirements),
    "",
    "## Evidence That Must Carry Forward",
    ...listEvidence(runtime.evidenceReceived.filter((evidence) => evidence.status !== "missing")),
    "",
    "## Not Ready For Next Phase Blockers",
    ...listOrNone([
      ...runtime.evidenceMissing.map((evidence) => evidence.label),
      ...openGates,
    ]),
    "",
    "## Carries Forward",
    ...nextPack.carriesForward.map((item) => `- ${item}`),
    "",
    "## Open Required Evidence",
    ...listOrNone(hardEvidence),
    "",
    "## Open Gate Criteria",
    ...listOrNone(openGates),
    "",
    "## Next-Phase Sections",
    ...nextPack.sections.flatMap((section) => [
      `### ${section.title}`,
      ...(section.items.length
        ? section.items.map((item) => `- ${item}`)
        : [`- ${section.emptyLabel}`]),
      "",
    ]),
    "## Suggested Current-Phase Evidence Templates",
    ...(templates.length
      ? templates.map(
          (template) =>
            `- ${template.label} -> ${template.nextPhaseInputsCreated.join(", ") || "current-phase findings"}`,
        )
      : ["- No suggested templates configured."]),
    "",
    "## Recommended P3 Workshops",
    ...listOrNone(
      playbook?.sessions.map((session) => session.label) ??
        ["Resolve current phase blockers before scheduling next-phase workshops."],
    ),
    "",
    "## Next Action",
    blocked
      ? "Resolve the open hard evidence and gate criteria before treating the next phase as approved to start."
      : "Schedule the next-phase kickoff and carry forward the accepted findings.",
  ];

  return {
    kind: "next_phase_readiness_package",
    artifactType: `p${phase}_next_phase_readiness_package`,
    title: `${nextPhaseLabel} - Readiness Package`,
    fileName,
    body: lines.join("\n"),
    metadata: {
      ...baseMetadata(runtime, "next_phase_readiness_package"),
      blocked,
      openHardEvidenceCount: hardEvidence.length,
      openGateCount: openGates.length,
    },
    status: runtime.packageStatus,
  };
}

export function buildDefaultPhaseSuccessRuntimeTruth(args: {
  move: BuildPhaseSuccessPackagesInput["move"];
  phase: number;
  generatedAt: string;
  generatedBy: string;
  phasePack?: PhasePack | null;
  sourceArtifacts?: Array<{
    id: string;
    title: string;
    artifactType: string;
    status: string;
    createdAt?: string | null;
    generatedAt?: string | null;
  }>;
}): PhaseSuccessRuntimeTruth {
  const openGates = args.move.gateCriteria.filter((criterion) => !criterion.completed);
  const missingRequirements = (args.phasePack?.evidence_requirements ?? []).map(
    (requirement) => ({
      id: requirement.id,
      label: requirement.label,
      status: "missing" as const,
      summary: requirement.evaluation_hint,
    }),
  );
  const targetPhase = args.phase >= 5 ? "TOWER" : args.phase + 1;
  const sourceArtifacts = args.sourceArtifacts ?? [];
  const sourceArtifactIds = sourceArtifacts.map((artifact) => artifact.id);
  const evidenceCutoffAt = latestArtifactTimestamp(sourceArtifacts) ?? args.generatedAt;
  const evidenceReceived = sourceArtifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.title,
    status: artifact.status === "approved" ? "approved" : "received",
    sourceArtifactId: artifact.id,
    summary: artifact.artifactType,
  })) satisfies RuntimeEvidenceSummary[];

  return {
    generatedAt: args.generatedAt,
    generatedBy: args.generatedBy,
    evidenceCutoffAt,
    sourcePhase: args.phase,
    targetPhase,
    sourceArtifactIds,
    findingIds: [],
    missingInputIds: [
      ...missingRequirements.map((requirement) => requirement.id),
      ...openGates.map((criterion) => criterion.id),
    ],
    gateStatus:
      args.move.gateCriteria.length === 0
        ? "not_evaluated"
        : openGates.length > 0
          ? "blocked"
          : "passed",
    approvalStatus:
      openGates.length > 0 || missingRequirements.length > 0
        ? "draft"
        : "ready_for_gate",
    packageStatus:
      openGates.length > 0 || missingRequirements.length > 0
        ? "evidence_incomplete"
        : "ready_for_gate",
    evidenceReceived,
    evidenceMissing: missingRequirements,
    findings:
      args.move.linkedEvidence?.map((evidence) => ({
        id: evidence.id,
        label: evidence.anchor,
        status: "provisional",
        summary: evidence.summary,
        sourceArtifactIds: [],
      })) ?? [],
    assumptions: [],
    unresolvedQuestions: [
      ...missingRequirements.map((requirement) => requirement.label),
      ...openGates.map((criterion) => criterion.label),
    ],
    assessment: [
      {
        key: "gate",
        label: "Gate readiness",
        status: openGates.length > 0 ? "blocked" : "ready",
        summary:
          openGates.length > 0
            ? `${openGates.length} gate criterion/criteria remain open.`
            : "All returned gate criteria are complete.",
      },
      {
        key: "evidence",
        label: "Evidence coverage",
        status: missingRequirements.length > 0 ? "at_risk" : evidenceReceived.length > 0 ? "in_progress" : "unknown",
        summary:
          missingRequirements.length > 0
            ? `${missingRequirements.length} evidence requirement(s) remain missing at cutoff.`
            : evidenceReceived.length > 0
              ? `${evidenceReceived.length} artifact(s) are available at cutoff.`
              : "No source artifacts were available at cutoff.",
      },
    ],
    selectedBuildingBlocks: [],
    architectureConstraints: [],
    dataPlatformConstraints: [],
    humanAiBoundaries: [],
    controlRequirements: [],
    openDecisions: openGates.map((criterion) => criterion.label),
    priorApprovedOutputs: sourceArtifacts
      .filter((artifact) => artifact.status === "approved")
      .map((artifact) => artifact.title),
    exactActionsToClosePhase: [
      ...missingRequirements.map(
        (requirement) => `Provide evidence requirement: ${requirement.label}`,
      ),
      ...openGates.map((criterion) => `Close gate criterion: ${criterion.label}`),
    ],
  };
}

function latestArtifactTimestamp(
  artifacts: NonNullable<
    Parameters<typeof buildDefaultPhaseSuccessRuntimeTruth>[0]["sourceArtifacts"]
  >,
): string | null {
  let latest: { value: string; epochMs: number } | null = null;
  for (const artifact of artifacts) {
    const candidate = artifact.generatedAt ?? artifact.createdAt;
    if (!candidate) continue;
    const epochMs = Date.parse(candidate);
    if (Number.isNaN(epochMs)) continue;
    if (!latest || epochMs > latest.epochMs) {
      latest = { value: candidate, epochMs };
    }
  }
  return latest?.value ?? null;
}

function valueBasis(
  move: Pick<StrategicMove, "valueAtStake">,
): string {
  const projected = move.valueAtStake.projected;
  if (!projected) return "No projected value range recorded";
  return `${projected.currency} ${projected.low.toLocaleString()}-${projected.high.toLocaleString()} projected`;
}

function safeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

function formatList(items: string[]): string {
  return items.length ? items.join(", ") : "None recorded";
}

function listOrNone(items: string[]): string[] {
  return items.length ? items.map((item) => `- ${item}`) : ["- None recorded."];
}

function listEvidence(items: RuntimeEvidenceSummary[]): string[] {
  return items.length
    ? items.map((item) => {
        const suffix = item.summary ? ` - ${item.summary}` : "";
        return `- [${item.status}] ${item.label}${suffix}`;
      })
    : ["- None recorded."];
}

function formatTargetPhase(target: number | "TOWER"): string {
  return target === "TOWER" ? "Tower Track Outcomes" : (NEXT_PHASE_LABEL[target - 1] ?? `P${target}`);
}

function baseMetadata(
  runtime: PhaseSuccessRuntimeTruth,
  kind: PhaseSuccessPackageKind,
): PhaseSuccessPackageMetadata {
  return {
    packageKind: kind,
    sourcePhase: runtime.sourcePhase,
    targetPhase: runtime.targetPhase,
    generatedAt: runtime.generatedAt,
    generatedBy: runtime.generatedBy,
    evidenceCutoffAt: runtime.evidenceCutoffAt,
    sourceArtifactIds: runtime.sourceArtifactIds,
    findingIds: runtime.findingIds,
    missingInputIds: runtime.missingInputIds,
    gateStatus: runtime.gateStatus,
    approvalStatus: runtime.approvalStatus,
    packageStatus: runtime.packageStatus,
  };
}
