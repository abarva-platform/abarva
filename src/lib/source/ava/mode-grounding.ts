// ─────────────────────────────────────────────────────────────────────────────
// aVa Source MODE-SPECIFIC GROUNDING — Phase A (6 modes).
//
// `ava-grounding-context.ts` (merged #4567) gives aVa the deterministic VALUE
// numbers (value bridge / lever insight) for a Source event. This module is its
// sibling: it gives aVa deterministic WORKFLOW numbers — event status, evidence
// readiness, artifact lineage/finality, and stage-gate state — for the 6 answer
// modes Phase A implements. Same discipline as the value grounding: every line
// this module renders is read straight from a builder/registry the canvas
// already trusts (`buildLiveStageView`, `listSourceArtifactsForSourceEventId`,
// `hydrateTaskEvidenceState` / `templateFactsPresent`, `confirmationKeysForStage`,
// `SOURCE_STAGE_ORDER`) — it never re-derives a different truth.
//
// `workflow_how_to` is the one exception by design: it is NOT data-grounded. It
// is a small deterministic KNOWLEDGE TABLE mapping "how do I X" intents to the
// actual UI action, authored in code so the LLM cannot invent UI structure.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SOURCE_STAGE_ORDER,
  SOURCE_STAGE_LABELS,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import { confirmationKeysForStage } from "@/lib/source/stage-gate-confirmations";
import { templateFactsPresent } from "@/lib/source/facts/view/task-evidence-hydration";
import type { EvaluatorInputs } from "@/lib/source/facts/evaluators/types";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { SourceAnswerMode } from "./answer-mode";

/** Minimal shape needed from the event row for status/gate grounding. */
export interface SourceAvaModeEventSummary {
  code: string;
  name: string;
  currentStageKey: string;
  blocker?: string | null;
  nextAction?: string | null;
}

export interface BuildModeGroundingInput {
  mode: SourceAnswerMode;
  event: SourceAvaModeEventSummary;
  /** The stage the user is currently viewing (defaults to the event's current stage). */
  viewStageKey?: string | null;
  /** The live stage view for the viewed stage, when it was built by the caller (canvas parity). */
  stageView?: StageAnalyticsView | null;
  /** factKey → numeric value for the event, from `readEventFacts` (evidence_readiness). */
  factInputs?: EvaluatorInputs;
  /** The event's registered artifacts (from `listSourceArtifactsForSourceEventId`). */
  artifacts?: readonly SourceArtifactRegistryRecord[];
  /** The user's raw question text — used only by workflow_how_to's intent lookup. */
  question?: string;
}

export interface ModeGroundingResult {
  /** The grounding block to inject into the agent system prompt. Empty when the
   * mode has nothing mode-specific to add (caller falls back to base grounding). */
  block: string;
  /** Verbatim quotable facts extracted for the quality gate's consistency check. */
  quotableFacts: Record<string, string>;
}

const EMPTY_RESULT: ModeGroundingResult = { block: "", quotableFacts: {} };

// ── event_status ─────────────────────────────────────────────────────────────

function buildEventStatusGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { event, stageView } = input;
  const currentStage = normalizeSourceStageKey(event.currentStageKey) ?? "strategy";
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(currentStage);
  const stageOfEleven = currentIndex >= 0 ? currentIndex + 1 : 1;
  const completeStages = currentIndex >= 0 ? SOURCE_STAGE_ORDER.slice(0, currentIndex) : [];
  const remainingStages = currentIndex >= 0 ? SOURCE_STAGE_ORDER.slice(currentIndex + 1) : [];

  const lines: string[] = [
    "EVENT STATUS GROUNDING (authoritative — the exact stage-rail state this event is in):",
    `Event: ${event.name} (${event.code}).`,
    `Current stage: ${SOURCE_STAGE_LABELS[currentStage]} — stage ${stageOfEleven} of ${SOURCE_STAGE_ORDER.length}.`,
    completeStages.length > 0
      ? `Completed stages: ${completeStages.map((s) => SOURCE_STAGE_LABELS[s]).join(", ")}.`
      : "Completed stages: none yet — this event is at the first stage.",
    remainingStages.length > 0
      ? `Remaining stages: ${remainingStages.map((s) => SOURCE_STAGE_LABELS[s]).join(", ")}.`
      : "Remaining stages: none — this is the final stage.",
  ];

  if (stageView) {
    const doneCount = stageView.tasks.filter((t) => t.state === "done" || t.evidenceComplete).length;
    lines.push(
      `Current-stage task checklist: ${doneCount} of ${stageView.tasks.length} complete.`,
    );
    const openTasks = stageView.tasks.filter((t) => !(t.state === "done" || t.evidenceComplete));
    if (openTasks.length > 0) {
      lines.push(`Open on this stage: ${openTasks.map((t) => t.title).join("; ")}.`);
    } else {
      lines.push("Open on this stage: none — all tasks on this stage are complete.");
    }
  }

  if (event.blocker) {
    lines.push(`Named blocker: ${event.blocker}.`);
  }
  if (event.nextAction) {
    lines.push(`Next action: ${event.nextAction}.`);
  }

  return {
    block: lines.join("\n"),
    quotableFacts: {
      currentStageLabel: SOURCE_STAGE_LABELS[currentStage],
      stageOfEleven: `${stageOfEleven} of ${SOURCE_STAGE_ORDER.length}`,
    },
  };
}

// ── workflow_how_to — deterministic knowledge table (NOT data-grounded) ──────

interface HowToEntry {
  /** Keyword/phrase patterns that match this intent. */
  patterns: RegExp[];
  /** The plain-English UI action, named exactly as it appears on the canvas. */
  action: string;
}

const HOW_TO_TABLE: HowToEntry[] = [
  {
    patterns: [/upload.*(final|reviewed|signed)/, /(final|reviewed|signed).*upload/],
    action:
      "Upload the final reviewed version through the current stage's PROVIDE task dropzone (the task card with an upload control in the task checklist) — the new upload is registered as the client-final artifact for that slot and supersedes any earlier generated draft.",
  },
  {
    patterns: [/advance (the )?stage/, /move (to|past) (the )?next stage/, /approve (the )?(gate|stage)/],
    action:
      "Advance the stage from the stage's gate panel: tick the gate's confirm boxes, then use the Approve button. Approving requires every confirm box this stage's gate declares to be checked first — the gate will not advance with unmet confirmations.",
  },
  {
    patterns: [/upload/, /attach/, /provide (a |the )?(document|file|evidence)/],
    action:
      "Use the PROVIDE task's dropzone in the task checklist for the current stage. If the task has a downloadable template, fill and re-upload that template so it also lands as typed evidence, not just a stored file.",
  },
  {
    patterns: [/confirm/, /review/],
    action:
      "Open the CONFIRM/DECIDE task in the task checklist, review the rows shown, and use the task's confirm button once you've verified the content.",
  },
  {
    patterns: [/find (a |the )?(document|artifact|file)/, /where.*(document|artifact|file)/],
    action:
      "Registered artifacts for this event are listed in the File Cabinet / artifact registry panel, grouped by stage — open the stage the document was uploaded under.",
  },
];

function buildWorkflowHowToGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const question = (input.question ?? "").toLowerCase();
  const match = HOW_TO_TABLE.find((entry) => entry.patterns.some((p) => p.test(question)));
  const action =
    match?.action ??
    "Use the task checklist for the current stage (PROVIDE tasks upload evidence, CONFIRM/DECIDE tasks record a review) and the stage's gate panel to advance once its confirm boxes are met.";

  const block = [
    "WORKFLOW HOW-TO GROUNDING (deterministic UI action table — not computed, not invented):",
    action,
  ].join("\n");

  return { block, quotableFacts: { howToAction: action } };
}

// ── evidence_readiness ────────────────────────────────────────────────────────

function buildEvidenceReadinessGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { stageView, factInputs = {}, artifacts = [] } = input;
  if (!stageView) {
    return {
      block: [
        "EVIDENCE READINESS GROUNDING: no live stage view is available for this event yet — do not claim any evidence is present or missing; say the stage checklist has not been computed and point the user to the canvas.",
      ].join("\n"),
      quotableFacts: {},
    };
  }

  const stagesWithArtifact = new Set<string>(artifacts.map((a) => a.stageKey));
  const present: string[] = [];
  const missing: string[] = [];

  for (const task of stageView.tasks) {
    if (task.type !== "provide") continue;
    const isPresent = task.factTemplateCode
      ? templateFactsPresent(task.factTemplateCode, factInputs)
      : stagesWithArtifact.has(stageView.stageKey);
    if (isPresent) {
      present.push(task.title);
    } else {
      missing.push(task.title);
    }
  }

  const lines = [
    "EVIDENCE READINESS GROUNDING (authoritative — persisted facts/artifacts for the CURRENT stage's tasks):",
    `Stage: ${stageView.stageName}.`,
    present.length > 0
      ? `Present (evidence already persisted): ${present.join("; ")}.`
      : "Present (evidence already persisted): none yet on this stage.",
    missing.length > 0
      ? `Missing (no persisted fact/artifact yet): ${missing.join("; ")}.`
      : "Missing (no persisted fact/artifact yet): none — every provide-task on this stage has persisted evidence.",
  ];

  return {
    block: lines.join("\n"),
    quotableFacts: {
      evidencePresentCount: String(present.length),
      evidenceMissingCount: String(missing.length),
    },
  };
}

// ── artifact_lineage / artifact_finality ─────────────────────────────────────

interface ArtifactSlotSummary {
  stageKey: string;
  authoritative: SourceArtifactRegistryRecord;
  superseded: SourceArtifactRegistryRecord[];
}

/**
 * Group an event's artifacts by (stageKey, artifactKind) "slot" and pick the
 * authoritative record for each slot. Reuses the registry's own authority
 * signal when present (`isCurrentAuthoritative` / `isClientFinal`); when the
 * data carries neither flag (older rows), the most recently updated record in
 * the slot is treated as authoritative and the rest as "remains available in
 * history" — this is the only finality concept the data actually shows, per
 * the honesty rule (do not invent a finality concept beyond what's persisted).
 */
function groupArtifactsBySlot(
  artifacts: readonly SourceArtifactRegistryRecord[],
): ArtifactSlotSummary[] {
  const bySlot = new Map<string, SourceArtifactRegistryRecord[]>();
  for (const artifact of artifacts) {
    const key = `${artifact.stageKey}::${artifact.artifactKind}`;
    const list = bySlot.get(key) ?? [];
    list.push(artifact);
    bySlot.set(key, list);
  }

  const summaries: ArtifactSlotSummary[] = [];
  for (const [key, records] of bySlot) {
    const stageKey = key.split("::")[0];
    const sorted = [...records].sort((a, b) => {
      // Explicit authority flags win over recency.
      const aFlag = a.isCurrentAuthoritative || a.isClientFinal ? 1 : 0;
      const bFlag = b.isCurrentAuthoritative || b.isClientFinal ? 1 : 0;
      if (aFlag !== bFlag) return bFlag - aFlag;
      return (
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime()
      );
    });
    const [authoritative, ...superseded] = sorted;
    if (authoritative) {
      summaries.push({ stageKey, authoritative, superseded });
    }
  }
  return summaries;
}

function buildArtifactLineageGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { artifacts = [] } = input;
  if (artifacts.length === 0) {
    return {
      block: "ARTIFACT LINEAGE GROUNDING: no artifacts are registered for this event yet.",
      quotableFacts: { artifactCount: "0" },
    };
  }

  const slots = groupArtifactsBySlot(artifacts);
  const lines = ["ARTIFACT LINEAGE GROUNDING (authoritative — the registry's actual upload history):"];
  for (const slot of slots) {
    const a = slot.authoritative;
    lines.push(
      `${a.originalName} (${SOURCE_STAGE_LABELS[normalizeSourceStageKey(slot.stageKey) ?? "strategy"] ?? slot.stageKey}, ${a.artifactKind}): current version v${a.version}, origin ${a.sourceOrigin}, uploaded ${a.createdAt}.`,
    );
    if (slot.superseded.length > 0) {
      lines.push(
        `  Prior version(s) remain available in history: ${slot.superseded
          .map((s) => `${s.originalName} (v${s.version}, ${s.createdAt})`)
          .join("; ")}.`,
      );
    }
  }

  return {
    block: lines.join("\n"),
    quotableFacts: { artifactCount: String(artifacts.length) },
  };
}

function buildArtifactFinalityGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { artifacts = [] } = input;
  if (artifacts.length === 0) {
    return {
      block: "ARTIFACT FINALITY GROUNDING: no artifacts are registered for this event yet — there is no final/authoritative version to name.",
      quotableFacts: { artifactCount: "0" },
    };
  }

  const slots = groupArtifactsBySlot(artifacts);
  const lines = ["ARTIFACT FINALITY GROUNDING (authoritative — which upload is the current authoritative version per slot):"];
  for (const slot of slots) {
    const a = slot.authoritative;
    const finalityBasis = a.isClientFinal
      ? "marked client-final"
      : a.isCurrentAuthoritative
        ? "marked current-authoritative"
        : "most recently uploaded (no explicit finality flag persisted for this slot — treated as authoritative by recency)";
    lines.push(
      `${a.originalName}: AUTHORITATIVE (${finalityBasis}). Approval state: ${a.approvalState}.`,
    );
    if (slot.superseded.length > 0) {
      lines.push(
        `  Superseded but remains available in history: ${slot.superseded.map((s) => s.originalName).join(", ")}.`,
      );
    }
  }

  return {
    block: lines.join("\n"),
    quotableFacts: { artifactCount: String(artifacts.length) },
  };
}

// ── stage_gate ────────────────────────────────────────────────────────────────

function buildStageGateGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { stageView, viewStageKey, event } = input;
  const stageKey = normalizeSourceStageKey(viewStageKey ?? event.currentStageKey) ?? "strategy";

  if (!stageView) {
    return {
      block: [
        `STAGE GATE GROUNDING: no live gate view is available for the ${SOURCE_STAGE_LABELS[stageKey]} stage yet — do not claim a confirm box is met or unmet; say the gate state has not been computed.`,
      ].join("\n"),
      quotableFacts: {},
    };
  }

  const gate = stageView.gate;
  const requiredKeys = confirmationKeysForStage(stageKey);
  // The evidence-complete task signal is the one honest, persisted proxy we have
  // for "has this stage's evidence box been earned" — every other confirm box
  // (sponsor sign-off, stage final, etc.) requires a human attestation the data
  // model does not yet persist per-box, so it is reported as requiring human
  // confirmation rather than fabricated as met/unmet.
  const allTasksComplete =
    stageView.tasks.length === 0 ||
    stageView.tasks.every((t) => t.state === "done" || t.evidenceComplete);

  const lines = [
    "STAGE GATE GROUNDING (authoritative — the same gate the canvas renders for this stage):",
    `Stage: ${stageView.stageName}. Approver: ${gate.approver}.`,
    `Gate requires ${requiredKeys.length} confirmation(s):`,
  ];
  gate.confirms.forEach((confirm, index) => {
    const isEvidenceBox = /evidence/i.test(confirm.label);
    const status = isEvidenceBox
      ? allTasksComplete
        ? "MET — the stage's task checklist is fully complete."
        : "UNMET — the stage's task checklist still has open tasks."
      : "requires human confirmation (not a data-derived box — the approver must attest it directly).";
    lines.push(`  ${index + 1}. ${confirm.label}: ${confirm.detail} — ${status}`);
  });
  lines.push(
    gate.nextStageName
      ? `Next stage on approval: ${gate.nextStageName}.`
      : "This is the final stage — approval closes the event.",
  );
  if (gate.generates.length > 0) {
    lines.push(`Generates on approval: ${gate.generates.map((g) => g.label).join(", ")}.`);
  }

  return {
    block: lines.join("\n"),
    quotableFacts: {
      gateStageLabel: stageView.stageName,
      gateAllTasksComplete: String(allTasksComplete),
    },
  };
}

/**
 * Build the mode-specific grounding block for one of Phase A's 6 implemented
 * modes. Returns an empty result for any other mode (the caller falls through
 * to existing chat behavior unchanged) — this function is only ever called
 * when the classifier already resolved an implemented mode.
 */
export function buildModeGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  switch (input.mode) {
    case "event_status":
      return buildEventStatusGrounding(input);
    case "workflow_how_to":
      return buildWorkflowHowToGrounding(input);
    case "evidence_readiness":
      return buildEvidenceReadinessGrounding(input);
    case "artifact_lineage":
      return buildArtifactLineageGrounding(input);
    case "artifact_finality":
      return buildArtifactFinalityGrounding(input);
    case "stage_gate":
      return buildStageGateGrounding(input);
    default:
      return EMPTY_RESULT;
  }
}
