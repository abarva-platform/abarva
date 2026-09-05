import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import {
  buildAvaModuleCaveats,
  collectMissingAvaModuleInputs,
  type AvaModuleExpertContract,
  type AvaModuleOptionalInputField,
  type AvaModulePacketBase,
} from "@/lib/agent/module-expert-contract";
import {
  nextSourceStage,
  normalizeSourceStageKey,
  SOURCE_STAGE_LABELS,
} from "@/lib/source/constants";
import {
  classifySourceAnswerMode,
  type ClassifySourceAnswerModeInput,
  type SourceAnswerMode,
  type SourceAnswerModeClassification,
} from "./answer-mode";
import {
  runSourceAnswerQualityGate,
  type SourceAnswerQualityGateResult,
} from "./answer-quality-gate";
import {
  buildModeGrounding,
  type BuildModeGroundingInput,
  type ModeGroundingResult,
  type SourceAvaModeEventSummary,
} from "./mode-grounding";

export interface SourceAvaPacketCitation {
  id: string;
  label: string;
  value: string;
}

export interface SourceAvaStageGateSummary {
  stageKey: string;
  stageLabel: string;
  nextStageLabel: string | null;
  taskChecklistDone: number;
  taskChecklistTotal: number;
  evidenceBox: "met" | "unmet" | "not_computed";
  openTaskTitles: string[];
  confirmLabels: string[];
}

export interface SourceAvaChatPacket extends AvaModulePacketBase<"source"> {
  surface: "source";
  event: SourceAvaModeEventSummary;
  currentStageLabel: string;
  viewedStageKey: string | null;
  viewedStageLabel: string | null;
  answerMode: SourceAnswerMode;
  matchedRule: string;
  isFallbackMode: boolean;
  groundingBlock: string;
  quotableFacts: Record<string, string>;
  stageGate: SourceAvaStageGateSummary | null;
  citations: SourceAvaPacketCitation[];
}

export interface BuildSourceAvaChatPacketInput
  extends Omit<BuildModeGroundingInput, "mode"> {
  tenant: string;
  classification?: SourceAnswerModeClassification;
  grounding?: ModeGroundingResult;
}

const SOURCE_AVA_ALLOWED_ACTIONS: readonly string[] = [
  "Explain current Source event stage, gate posture, blockers, and next action",
  "Summarize vendor responses, pricing, value levers, and artifact readiness from loaded event state",
  "Label missing Source evidence as missing instead of filling from a generic sourcing checklist",
  "Point to Moves for phase execution when the user wants to mobilize a solution",
  "Point to Tower for portfolio value measurement and metric-contract proof",
];

const SOURCE_AVA_DISALLOWED_ACTIONS: readonly string[] = [
  "Approve a stage, award, artifact, or vendor through chat",
  "Treat corpus lifecycle stages as the product's 11-stage Source event workflow",
  "Invent vendors, values, dates, owners, evidence, or approval status not present in the packet",
  "Compute value, savings, ROI, or pricing outside deterministic Source read models",
  "Claim that chat saved a fact into the Source record",
];

const OPTIONAL_FIELD_LABELS: ReadonlyArray<
  AvaModuleOptionalInputField<BuildSourceAvaChatPacketInput>
> = [
  { key: "stageView", label: "stage gate view" },
  { key: "artifacts", label: "registered event artifacts" },
  { key: "factInputs", label: "event fact inputs" },
  { key: "approvedStageKeys", label: "approval-evidenced stage list" },
];

export function buildSourceAvaChatPacket(
  input: BuildSourceAvaChatPacketInput,
  questionText: string,
): SourceAvaChatPacket {
  const classification =
    input.classification ??
    classifySourceAnswerMode({
      question: questionText,
      viewedStage: input.viewStageKey,
    });
  const grounding =
    input.grounding ??
    buildModeGrounding({
      ...input,
      mode: classification.mode,
    });
  const currentStageLabel = labelForSourceStage(input.event.currentStageKey);
  const viewedStageKey = input.viewStageKey ?? input.event.currentStageKey ?? null;
  const viewedStageLabel = labelForSourceStage(viewedStageKey);
  const stageGate = buildSourceAvaStageGateSummary(input.stageView, viewedStageKey);
  const missingInputs = collectMissingAvaModuleInputs(input, OPTIONAL_FIELD_LABELS);

  return {
    surface: "source",
    tenant: input.tenant,
    event: input.event,
    currentStageLabel,
    viewedStageKey,
    viewedStageLabel,
    answerMode: classification.mode,
    matchedRule: classification.matchedRule,
    isFallbackMode: classification.isFallback,
    groundingBlock: grounding.block,
    quotableFacts: grounding.quotableFacts,
    stageGate,
    citations: buildSourceAvaPacketCitations({
      event: input.event,
      currentStageLabel,
      viewedStageLabel,
      stageGate,
    }),
    missingInputs,
    caveats: buildAvaModuleCaveats(missingInputs),
    allowedActions: [...SOURCE_AVA_ALLOWED_ACTIONS],
    disallowedActions: [...SOURCE_AVA_DISALLOWED_ACTIONS],
  };
}

export function formatSourceAvaChatPacketForPrompt(
  packet: SourceAvaChatPacket,
  mode: SourceAnswerMode,
): string {
  const lines = [
    "SOURCE AVA MODULE PACKET:",
    `Surface: ${packet.surface}`,
    `Tenant: ${packet.tenant}`,
    `Event: ${packet.event.name} (${packet.event.code})`,
    `Current product stage: ${packet.currentStageLabel}`,
    packet.viewedStageLabel
      ? `Viewed product stage: ${packet.viewedStageLabel}`
      : "Viewed product stage: not loaded",
    `Answer mode: ${mode} (${packet.matchedRule})`,
    packet.stageGate
      ? `Stage gate: ${packet.stageGate.taskChecklistDone} of ${packet.stageGate.taskChecklistTotal} tasks complete; evidence box ${packet.stageGate.evidenceBox.toUpperCase()}; next stage ${packet.stageGate.nextStageLabel ?? "none"}.`
      : "Stage gate: not computed this turn.",
    packet.event.blocker ? `Recorded blocker: ${packet.event.blocker}` : "Recorded blocker: none.",
    packet.event.nextAction
      ? `Recorded next action: ${packet.event.nextAction}`
      : "Recorded next action: not loaded.",
    packet.stageGate?.openTaskTitles.length
      ? `Open gate tasks: ${packet.stageGate.openTaskTitles.join("; ")}`
      : "Open gate tasks: none recorded.",
    packet.groundingBlock ? packet.groundingBlock : "Mode grounding: not available.",
    packet.caveats.length ? `Caveats: ${packet.caveats.join(" | ")}` : "Caveats: none.",
    "Evidence-class rule: Source product stages are the canonical 11-stage event workflow; industry lifecycle corpus stages are pattern context only and must be labelled as such.",
    "Answer rule: cite packet evidence labels such as [S1] and [G1] when answering stage/gate questions.",
  ];

  return lines.join("\n");
}

export function buildDeterministicSourceAvaBlockedNextActionAnswer(
  packet: SourceAvaChatPacket,
): string | null {
  if (!["event_status", "stage_gate", "workflow_how_to", "general_advisory"].includes(packet.answerMode)) {
    return null;
  }

  const stageLabel = packet.viewedStageLabel ?? packet.currentStageLabel;
  const gate = packet.stageGate;
  const openTask = gate?.openTaskTitles[0] ?? null;
  const blocker = packet.event.blocker?.trim() || openTask;
  const nextAction =
    packet.event.nextAction?.trim() ||
    (openTask ? `Complete or upload evidence for: ${openTask}` : "Review the Source stage gate before advancing.");

  if (!gate) {
    return [
      `${packet.event.name} is at ${stageLabel}, but the stage gate view was not computed for this turn. [S1]`,
      blocker ? `Recorded blocker: ${blocker}. [B1]` : "No blocker is recorded in the event packet.",
      `Next step: ${nextAction}. [A1]`,
    ].join(" ");
  }

  const gateSentence =
    gate.evidenceBox === "met"
      ? `The ${stageLabel} gate evidence box is MET with ${gate.taskChecklistDone} of ${gate.taskChecklistTotal} tasks complete. [G1]`
      : `The ${stageLabel} gate evidence box is UNMET with ${gate.taskChecklistDone} of ${gate.taskChecklistTotal} tasks complete. [G1]`;

  return [
    blocker
      ? `${packet.event.name} is blocked at ${stageLabel}: ${blocker}. [S1][B1]`
      : `${packet.event.name} is not showing a named blocker at ${stageLabel}. [S1]`,
    gateSentence,
    `Next step: ${nextAction}. [A1]`,
  ].join(" ");
}

export const SOURCE_AVA_MODULE_EXPERT_CONTRACT: AvaModuleExpertContract<
  "source",
  SourceAvaChatPacket,
  BuildSourceAvaChatPacketInput,
  SourceAnswerMode,
  SourceAnswerQualityGateResult,
  SourceAnswerModeClassification,
  ClassifySourceAnswerModeInput
> = {
  surface: "source",
  classifyQuestion: classifySourceAnswerMode,
  shouldBuildPacket: ({ hardeningEnabled }) => hardeningEnabled,
  buildPacket: buildSourceAvaChatPacket,
  formatPrompt: formatSourceAvaChatPacketForPrompt,
  runQualityGate: (text, packet, mode) =>
    runSourceAnswerQualityGate({
      answerText: text,
      mode,
      hasGroundingContext: packet.groundingBlock.length > 0,
      groundingFacts: packet.quotableFacts,
      evidenceIsIncomplete: (packet.stageGate?.openTaskTitles.length ?? 0) > 0,
      groundingBlockText: packet.groundingBlock || undefined,
      groundingHasSpecificAsk:
        packet.quotableFacts.bafoOpenLeverCount !== undefined &&
        packet.quotableFacts.bafoOpenLeverCount !== "0",
    }),
};

function buildSourceAvaStageGateSummary(
  stageView: StageAnalyticsView | null | undefined,
  fallbackStageKey: string | null,
): SourceAvaStageGateSummary | null {
  if (!stageView) return null;
  const taskChecklistDone = stageView.tasks.filter(isStageTaskComplete).length;
  const taskChecklistTotal = stageView.tasks.length;
  const canonicalStageKey = normalizeSourceStageKey(stageView.stageKey ?? fallbackStageKey);
  const nextStageKey = nextSourceStage(canonicalStageKey);

  return {
    stageKey: stageView.stageKey,
    stageLabel: stageView.stageName || labelForSourceStage(stageView.stageKey),
    nextStageLabel: nextStageKey ? SOURCE_STAGE_LABELS[nextStageKey] : stageView.gate.nextStageName,
    taskChecklistDone,
    taskChecklistTotal,
    evidenceBox:
      taskChecklistTotal === 0
        ? "not_computed"
        : taskChecklistDone === taskChecklistTotal
          ? "met"
          : "unmet",
    openTaskTitles: stageView.tasks
      .filter((task) => !isStageTaskComplete(task))
      .map((task) => task.title),
    confirmLabels: stageView.gate.confirms.map((confirm) => confirm.label),
  };
}

function buildSourceAvaPacketCitations(args: {
  event: SourceAvaModeEventSummary;
  currentStageLabel: string;
  viewedStageLabel: string | null;
  stageGate: SourceAvaStageGateSummary | null;
}): SourceAvaPacketCitation[] {
  const citations: SourceAvaPacketCitation[] = [
    {
      id: "S1",
      label: "Source event stage",
      value: `${args.event.code} is at ${args.currentStageLabel}; viewed stage ${args.viewedStageLabel ?? "not loaded"}.`,
    },
  ];

  if (args.stageGate) {
    citations.push({
      id: "G1",
      label: "Stage gate checklist",
      value: `${args.stageGate.taskChecklistDone} of ${args.stageGate.taskChecklistTotal} tasks complete; evidence box ${args.stageGate.evidenceBox}.`,
    });
  }
  if (args.event.blocker) {
    citations.push({
      id: "B1",
      label: "Recorded event blocker",
      value: args.event.blocker,
    });
  }
  if (args.event.nextAction) {
    citations.push({
      id: "A1",
      label: "Recorded next action",
      value: args.event.nextAction,
    });
  }

  return citations;
}

function isStageTaskComplete(task: StageAnalyticsView["tasks"][number]): boolean {
  return task.evidenceComplete === true || task.state === "done";
}

function labelForSourceStage(stageKey: string | null | undefined): string {
  const canonicalStageKey = normalizeSourceStageKey(stageKey);
  return canonicalStageKey ? SOURCE_STAGE_LABELS[canonicalStageKey] : (stageKey ?? "Unknown");
}
