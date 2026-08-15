// ─────────────────────────────────────────────────────────────────────────────
// aVa Source MODE-SPECIFIC GROUNDING — Phase A (6 modes) + Phase B (8 modes) +
// Phase C (3 modes).
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
//
// Phase B extends the same discipline to the 8 VENDOR/VALUE/COMMERCIAL modes —
// `value_at_stake`, `vendor_comparison`, `should_cost`, `risk_exposure`,
// `clause_coverage`, `bafo_strategy`, `committed_value`, `value_realization`.
// Every Phase B builder reuses `buildStepInsight` (the SAME per-step insight the
// "✦ Intelligence" tab renders) for the relevant stage — it never re-derives a
// number the deterministic engine already computed. Every lever/value figure a
// Phase B block surfaces also carries its VALUE-TYPE CLASSIFICATION
// (expected_concession / incremental_negotiated / solution_tightening /
// protected / risk_adjusted) straight from the insight row's `valueType` field
// (itself sourced from `evaluateValueLevers` via the archetype's
// `ValueLeverRule.valueType`) — never reclassified, never invented.
//
// Phase C adds the final 3 modes:
//   - `decision_recommendation` — a COMPOSITE. It calls the exec_decision
//     insight (`buildStepInsight('executive_decision')`) for the value/risk
//     split, PLUS assembles `buildVendorComparisonGrounding`,
//     `buildBafoStrategyGrounding`, and `buildStageGateGrounding` /
//     `buildEvidenceReadinessGrounding`'s own blocks for the vendor, BAFO, and
//     unresolved-award-condition facets. It never re-derives any of those
//     numbers — it calls the existing builders and concatenates their output.
//   - `contract_optimization` — grounds the INCUMBENT/current-state economics
//     (distinct from vendor-bid comparison): `buildStepInsight('strategy')`
//     (value_pool — leakage/opportunity vs the incumbent baseline) and
//     `buildStepInsight('scope')` (scope_coverage — reachable vs stranded,
//     including the potential-at-risk banding). Surfaces each lever's own
//     `triggerLogic` / `valueBasis` (the archetype's stated cure/renegotiate/
//     rebid pattern) rather than inventing a decision framework beyond what
//     the archetype already encodes.
//   - `general_advisory` — the catch-all "senior sourcing judgment" mode. A
//     COMPACT roll-up: current stage (event_status), the value bridge
//     headline (value_at_stake), and the top open items across evidence/gate/
//     BAFO. Lighter quality bar (see answer-quality-gate.ts) — it's
//     intentionally general — but still passes the core Phase A checks.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SOURCE_STAGE_ORDER,
  SOURCE_STAGE_LABELS,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import { confirmationKeysForStage } from "@/lib/source/stage-gate-confirmations";
import { templateFactsPresent } from "@/lib/source/facts/view/task-evidence-hydration";
import { buildStepInsight } from "@/lib/source/facts/view/step-insight-builder";
import type {
  VendorBidSignal,
  VendorResponseSignal,
} from "@/lib/source/facts/view/step-insight-builder";
import type { EvaluatorInputs } from "@/lib/source/facts/evaluators/types";
import type {
  BafoProgressInsightView,
  CommittedValueInsightView,
  ExecDecisionInsightView,
  ResponseCoverageInsightView,
  RfpClauseInsightView,
  ScopeCoverageInsightView,
  ShouldCostInsightView,
  StageAnalyticsView,
  ValuePoolInsightView,
  ValueRealizationInsightView,
  ValueType,
} from "@/components/source/canvas/analytics/view-model";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import { resolveAuthoritativeArtifact } from "@/lib/source/client-final-artifacts";
import type { SourceEventArchetype, ValueLeverRule } from "@/lib/source/archetypes/types";
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
  /**
   * The resolved value archetype for this event (from `resolveValueArchetype` /
   * `getSourceArchetype`) — Phase B builders pass this straight into
   * `buildStepInsight` so the SAME archetype resolution the canvas uses drives
   * the grounding. Required for every Phase B mode; Phase A modes ignore it.
   */
  archetype?: SourceEventArchetype | null;
  /** The event's value-at-stake baseline (the canvas's `event.valueAtStakeUsd`). */
  baselineAmount?: number | null;
  /** The RFP-clause presence signal (from `readRfpClausePresentLeverKeys`) — `clause_coverage`. */
  rfpClausePresentLeverKeys?: ReadonlySet<string>;
  /** The committed-value-per-lever signal (from `readCommittedValueLevers`) — `committed_value`. */
  committedValueByLeverKey?: ReadonlyMap<string, number>;
  /** The BAFO-concession-per-lever signal (from `readBafoConcessionLevers`) — `bafo_strategy`. */
  bafoConcessionByLeverKey?: ReadonlyMap<string, number>;
  /** The realized-value-per-lever signal (from `readRealizedValueLevers`) — `value_realization`. */
  realizedValueByLeverKey?: ReadonlyMap<string, number>;
  /** The vendor-response signal (from `readVendorLeverResponses`) — `vendor_comparison`. */
  vendorResponses?: VendorResponseSignal;
  /** The vendor-bid signal (from `readVendorBids`) — `vendor_comparison`, `should_cost`. */
  vendorBids?: VendorBidSignal;
  /**
   * Stage keys with real approval evidence from the Source approval ledger.
   * When supplied, event-status completion claims must use this list instead
   * of deriving completion from stage position.
   */
  approvedStageKeys?: readonly string[];
}

export interface ModeGroundingResult {
  /** The grounding block to inject into the agent system prompt. Empty when the
   * mode has nothing mode-specific to add (caller falls back to base grounding). */
  block: string;
  /** Verbatim quotable facts extracted for the quality gate's consistency check. */
  quotableFacts: Record<string, string>;
}

const EMPTY_RESULT: ModeGroundingResult = { block: "", quotableFacts: {} };

// ── Phase B shared helpers ───────────────────────────────────────────────────

const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  notation: "compact",
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

function fmtUsdRange(low: number, high: number): string {
  if (low === high) return fmtUsd(low);
  return `${fmtUsd(low)}–${fmtUsd(high)}`;
}

/** Human label for a value-type classification — the canonical 5-way taxonomy. */
const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  expected_concession: "expected concession",
  incremental_negotiated: "incremental negotiated value",
  solution_tightening: "solution tightening",
  protected: "protected value (risk hedge)",
  risk_adjusted: "risk-adjusted (TCO normalization)",
};

function valueTypeLabel(vt: ValueType): string {
  return VALUE_TYPE_LABELS[vt] ?? vt;
}

/**
 * The VALUE-TYPE CLASSIFICATION line every Phase B block must carry when it
 * surfaces lever/value figures — reuses each row's own `valueType` (itself
 * sourced from `evaluateValueLevers` / the archetype's `ValueLeverRule.valueType`),
 * never reclassified. Grouped so the model reads the classification distribution
 * at a glance rather than one line per lever.
 */
function valueTypeClassificationLines(
  rows: readonly { label: string; valueType: ValueType }[],
): string[] {
  if (rows.length === 0) return [];
  const byType = new Map<ValueType, string[]>();
  for (const row of rows) {
    const list = byType.get(row.valueType) ?? [];
    list.push(row.label);
    byType.set(row.valueType, list);
  }
  const lines = ["VALUE-TYPE CLASSIFICATION (never claim these as one blended savings figure):"];
  for (const [vt, labels] of byType) {
    lines.push(`  ${valueTypeLabel(vt)}: ${labels.join("; ")}.`);
  }
  return lines;
}

const BASELINE_LABEL = "Value at stake (event estimate)";

// ── event_status ─────────────────────────────────────────────────────────────

function buildEventStatusGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { event, stageView } = input;
  const currentStage = normalizeSourceStageKey(event.currentStageKey) ?? "strategy";
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(currentStage);
  const stageOfEleven = currentIndex >= 0 ? currentIndex + 1 : 1;
  const priorStages = currentIndex >= 0 ? SOURCE_STAGE_ORDER.slice(0, currentIndex) : [];
  const approvedStageKeys =
    input.approvedStageKeys === undefined
      ? null
      : new Set(
          input.approvedStageKeys
            .map((stageKey) => normalizeSourceStageKey(stageKey))
            .filter((stageKey): stageKey is NonNullable<typeof stageKey> =>
              Boolean(stageKey),
            ),
        );
  const completeStages =
    approvedStageKeys === null
      ? priorStages
      : priorStages.filter((stageKey) => approvedStageKeys.has(stageKey));
  const priorStagesWithoutApproval =
    approvedStageKeys === null
      ? []
      : priorStages.filter((stageKey) => !approvedStageKeys.has(stageKey));
  const remainingStages = currentIndex >= 0 ? SOURCE_STAGE_ORDER.slice(currentIndex + 1) : [];

  const lines: string[] = [
    "EVENT STATUS GROUNDING (authoritative — the exact stage-rail state this event is in):",
    `Event: ${event.name} (${event.code}).`,
    `Current stage: ${SOURCE_STAGE_LABELS[currentStage]} — stage ${stageOfEleven} of ${SOURCE_STAGE_ORDER.length}.`,
    approvedStageKeys === null
      ? completeStages.length > 0
        ? `Completed stages: ${completeStages.map((s) => SOURCE_STAGE_LABELS[s]).join(", ")}.`
        : "Completed stages: none yet — this event is at the first stage."
      : completeStages.length > 0
        ? `Completed stages with approval evidence: ${completeStages.map((s) => SOURCE_STAGE_LABELS[s]).join(", ")}.`
        : "Completed stages with approval evidence: none.",
    ...(approvedStageKeys !== null && priorStagesWithoutApproval.length > 0
      ? [
          `Prior stages without approval evidence: ${priorStagesWithoutApproval.map((s) => SOURCE_STAGE_LABELS[s]).join(", ")}.`,
          "Completion rule: do not say all prior stages are completed unless every prior stage is listed as approval-evidenced.",
        ]
      : []),
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

  const quotableFacts: Record<string, string> = {
    currentStageLabel: SOURCE_STAGE_LABELS[currentStage],
    stageOfEleven: `${stageOfEleven} of ${SOURCE_STAGE_ORDER.length}`,
  };
  if (stageView) {
    const doneCount = stageView.tasks.filter((t) => t.state === "done" || t.evidenceComplete).length;
    // Quoted by the quality gate's numeric-contradiction check — an answer
    // stating "N of M tasks/complete" for the current stage must match THIS
    // count, the exact same one the canvas checklist counter renders.
    quotableFacts.taskChecklistDone = String(doneCount);
    quotableFacts.taskChecklistTotal = String(stageView.tasks.length);
  }
  if (approvedStageKeys !== null) {
    quotableFacts.approvalEvidencedStageCount = String(completeStages.length);
    quotableFacts.priorStagesWithoutApprovalEvidence = String(
      priorStagesWithoutApproval.length,
    );
  }

  return {
    block: lines.join("\n"),
    quotableFacts,
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
    // Authority decision now goes through the SAME shared resolver every
    // other Source surface uses (client-final-artifacts.ts) — this used to
    // be a bespoke flags-then-recency sort here, which risked silently
    // diverging from e.g. the artifact render route's own pick. Falls back
    // to recency exactly as before when no record in the slot carries an
    // explicit authority flag (the "honesty rule": no finality concept
    // beyond what's actually persisted).
    const authoritative = resolveAuthoritativeArtifact(records);
    if (!authoritative) continue;
    const superseded = [...records]
      .filter((record) => record.id !== authoritative.id)
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      );
    summaries.push({ stageKey, authoritative, superseded });
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

  const metConfirmCount = gate.confirms.filter((confirm) => {
    const isEvidenceBox = /evidence/i.test(confirm.label);
    return isEvidenceBox && allTasksComplete;
  }).length;

  return {
    block: lines.join("\n"),
    quotableFacts: {
      gateStageLabel: stageView.stageName,
      gateAllTasksComplete: String(allTasksComplete),
      // Quoted by the quality gate's numeric-contradiction check — an answer
      // stating "N of M complete/confirmed" for the stage's task checklist
      // must match THESE counts, not an invented pair.
      taskChecklistDone: String(
        stageView.tasks.filter((t) => t.state === "done" || t.evidenceComplete).length,
      ),
      taskChecklistTotal: String(stageView.tasks.length),
      gateMetConfirmCount: String(metConfirmCount),
      gateRequiredConfirmCount: String(requiredKeys.length),
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE B — vendor/value/commercial modes.
//
// Each builder below calls `buildStepInsight` for the stage that insight kind
// foregrounds (see `stepInsightKindForStage` in step-insight-builder.ts), passing
// through whichever per-lever/per-vendor signal the route already read for the
// canvas (rfpClausePresentLeverKeys / committedValueByLeverKey /
// bafoConcessionByLeverKey / realizedValueByLeverKey / vendorResponses /
// vendorBids). It never re-implements the insight's math — it renders the SAME
// headline + rows/bars the canvas tab shows, plus the value-type classification
// every row already carries.
// ═════════════════════════════════════════════════════════════════════════════

// ── value_at_stake ───────────────────────────────────────────────────────────

/**
 * value_at_stake was already effectively covered by the pre-existing
 * `buildAvaSourceGrounding` / `renderAvaSourceGroundingFromFacts` wire (#4567) —
 * the route injects that block on EVERY grounded turn (it is the base grounding,
 * not mode-specific), so this builder does not duplicate it. It confirms/labels
 * that the value bridge is the authoritative source for this mode rather than
 * re-deriving a second view of the same numbers.
 */
function buildValueAtStakeGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, baselineAmount } = input;
  if (!archetype) return EMPTY_RESULT;
  const insight = buildStepInsight({
    stageKey: "pricing",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    baselineLabel: BASELINE_LABEL,
    baselineAmount: baselineAmount ?? 0,
  });
  if (!insight || insight.kind !== "value_bridge") return EMPTY_RESULT;
  const quantified = insight.waterfall.bands.filter((b) => b.state === "quantified");
  const lines = [
    "VALUE-AT-STAKE GROUNDING (authoritative — the same value bridge the canvas Pricing tab renders):",
    `Provenance: ${insight.provenance === "live" ? "LIVE — computed from this event's cited facts." : "SAMPLE/MODEL — illustrative shape, not a tenant number."}`,
    `Headline: ${insight.headline}`,
    ...valueTypeClassificationLines(
      quantified.map((b) => ({ label: b.label, valueType: b.valueType })),
    ),
  ];
  return {
    block: lines.join("\n"),
    quotableFacts: {
      valueBridgeHeadline: insight.headline,
      valueBridgeProvenance: insight.provenance,
    },
  };
}

// ── vendor_comparison ────────────────────────────────────────────────────────

/**
 * Vendor comparison grounds BOTH facets when available: Responses stage
 * (`response_coverage` — per-vendor lever-addressed/dodged coverage) AND
 * Evaluation stage (`should_cost_normalization` — the vendor bid normalization +
 * the cheapest-headline-loses-on-TCO trap). If only one has data, ground what
 * exists and say the other is model/pending — never fabricate the missing one.
 */
function buildVendorComparisonGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, vendorResponses, vendorBids } = input;
  if (!archetype) return EMPTY_RESULT;

  const responseInsight = buildStepInsight({
    stageKey: "responses",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    vendorResponses,
  }) as ResponseCoverageInsightView | null;

  const shouldCostInsight = buildStepInsight({
    stageKey: "evaluation",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    vendorBids,
  }) as ShouldCostInsightView | null;

  const lines = [
    "VENDOR COMPARISON GROUNDING (authoritative — the same response-coverage and should-cost insights the canvas renders):",
  ];
  const quotableFacts: Record<string, string> = {};

  if (responseInsight) {
    lines.push(
      `Response coverage [${responseInsight.isModel ? "MODEL — illustrative, no vendor-response signal yet" : "LIVE"}]: ${responseInsight.headline}`,
    );
    if (responseInsight.vendors && responseInsight.vendors.length > 0) {
      for (const v of responseInsight.vendors) {
        lines.push(
          `  ${v.vendorId}: ${v.addressed} addressed, ${v.partial} partial, ${v.dodged} dodged, ${v.notYetAnswered} not yet answered (of ${v.totalLevers} levers) — addressed pool up to ${fmtUsd(v.addressedHighUsd)}, exposed pool up to ${fmtUsd(v.exposedHighUsd)}.`,
        );
      }
    }
    lines.push(
      ...valueTypeClassificationLines(
        responseInsight.rows.map((r) => ({ label: r.label, valueType: r.valueType })),
      ),
    );
    quotableFacts.responseCoverageHeadline = responseInsight.headline;
    quotableFacts.responseCoverageIsModel = String(responseInsight.isModel);
  } else {
    lines.push(
      "Response coverage: no value levers wired for this archetype — nothing to compare.",
    );
  }

  if (shouldCostInsight) {
    lines.push(
      `Should-cost normalization [${shouldCostInsight.isModel ? "MODEL — illustrative vendors, no vendor-bid signal yet" : "LIVE"}]: ${shouldCostInsight.headline}`,
    );
    for (const v of shouldCostInsight.vendors) {
      const evidenceFrag =
        v.needsEvidence && v.needsEvidence.length > 0
          ? ` (needs evidence: ${v.needsEvidence.join(", ")})`
          : "";
      lines.push(
        `  ${v.label}: headline ${fmtUsd(v.headlinePrice)}, normalized TCO ${fmtUsd(v.normalizedTco)}${evidenceFrag}.`,
      );
    }
    quotableFacts.shouldCostHeadline = shouldCostInsight.headline;
    quotableFacts.shouldCostIsModel = String(shouldCostInsight.isModel);
  } else {
    lines.push(
      "Should-cost normalization: no value levers wired for this archetype — nothing to normalize.",
    );
  }

  return { block: lines.join("\n"), quotableFacts };
}

// ── should_cost ──────────────────────────────────────────────────────────────

/**
 * Per-vendor headline bid vs normalized TCO, the ranking, and the trap
 * explanation when the ranking flips — reuses `should_cost_normalization`
 * verbatim (never re-normalizes a bid itself).
 */
function buildShouldCostGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, vendorBids } = input;
  if (!archetype) return EMPTY_RESULT;

  const insight = buildStepInsight({
    stageKey: "evaluation",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    vendorBids,
  }) as ShouldCostInsightView | null;
  if (!insight) return EMPTY_RESULT;

  const lines = [
    "SHOULD-COST GROUNDING (authoritative — the same should-cost normalization the canvas Evaluation tab renders):",
    `Provenance: ${insight.isModel ? "MODEL — illustrative vendors, not real bids." : "LIVE — normalized from the vendor bids provided."}`,
    `Headline: ${insight.headline}`,
  ];
  for (const v of insight.vendors) {
    const winnerFrag =
      v.vendorKey === insight.headlineWinnerKey
        ? " [cheapest on headline]"
        : v.vendorKey === insight.normalizedWinnerKey
          ? " [wins on normalized TCO]"
          : "";
    const evidenceFrag =
      v.needsEvidence && v.needsEvidence.length > 0
        ? ` — needs evidence: ${v.needsEvidence.join(", ")} (not ranked)`
        : "";
    lines.push(
      `  ${v.label}${winnerFrag}: headline ${fmtUsd(v.headlinePrice)} + adjustments (${v.adjustments.map((a) => `${a.label}: ${fmtUsd(a.amount)}`).join("; ") || "none"}) = normalized TCO ${fmtUsd(v.normalizedTco)}.${evidenceFrag}`,
    );
  }
  return {
    block: lines.join("\n"),
    quotableFacts: {
      shouldCostHeadline: insight.headline,
      shouldCostIsModel: String(insight.isModel),
      headlineWinnerKey: insight.headlineWinnerKey,
      normalizedWinnerKey: insight.normalizedWinnerKey,
    },
  };
}

// ── risk_exposure ────────────────────────────────────────────────────────────

/**
 * Grounds the archetype's stated COMMERCIAL RISK per lever (the `commercialRisk`
 * field on `ValueLeverRule`, when the rule declares one) alongside the lever's
 * confidence + evidence basis from `evaluateValueLevers` via the Strategy-stage
 * value-pool insight (the same per-lever confidence the canvas shows). Never
 * invents a risk category beyond what the archetype/evidence already states —
 * a lever with no declared `commercialRisk` is named as such, not filled in.
 */
function buildRiskExposureGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {} } = input;
  if (!archetype) return EMPTY_RESULT;

  const insight = buildStepInsight({
    stageKey: "strategy",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
  });
  if (!insight || insight.kind !== "value_pool") return EMPTY_RESULT;

  const rulesByKey = new Map<string, ValueLeverRule>(
    (archetype.valueLeverRules ?? []).map((r) => [r.key, r]),
  );

  const lines = [
    "RISK EXPOSURE GROUNDING (authoritative — the same value-pool levers the canvas Strategy tab renders, with each lever's stated commercial risk and confidence):",
    `Provenance: ${insight.provenance === "live" ? "LIVE — computed from this event's cited facts." : "SAMPLE/MODEL — illustrative shape, not a tenant number."}`,
    `Headline: ${insight.headline}`,
  ];
  for (const bar of insight.bars) {
    const rule = rulesByKey.get(bar.leverKey);
    const riskFrag = rule?.commercialRisk
      ? rule.commercialRisk
      : "no commercial-risk note is declared for this lever in the archetype playbook — do not invent one.";
    lines.push(
      `  ${bar.label} (${valueTypeLabel(bar.valueType)}, confidence ${bar.confidence}): ${fmtUsdRange(bar.low, bar.high)}. Commercial risk: ${riskFrag}`,
    );
  }
  if (insight.needsEvidenceLevers.length > 0) {
    lines.push(
      `Levers needing evidence before they can be sized (unsized risk, not zero risk): ${insight.needsEvidenceLevers.join(", ")}.`,
    );
  }
  lines.push(
    ...valueTypeClassificationLines(
      insight.bars.map((b) => ({ label: b.label, valueType: b.valueType })),
    ),
  );

  return {
    block: lines.join("\n"),
    quotableFacts: {
      valuePoolHeadline: insight.headline,
      valuePoolProvenance: insight.provenance,
    },
  };
}

// ── clause_coverage ──────────────────────────────────────────────────────────

/**
 * Protected vs exposed levers, cited to the RFP clause checklist facts — reuses
 * `rfp_clause_coverage` verbatim.
 */
function buildClauseCoverageGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, rfpClausePresentLeverKeys } = input;
  if (!archetype) return EMPTY_RESULT;

  const insight = buildStepInsight({
    stageKey: "rfp",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    rfpClausePresentLeverKeys,
  }) as RfpClauseInsightView | null;
  if (!insight) return EMPTY_RESULT;

  const lines = [
    "CLAUSE COVERAGE GROUNDING (authoritative — the same RFP clause-coverage insight the canvas RFP tab renders):",
    `Provenance: ${insight.isModel ? "MODEL — no RFP-clause signal yet, every lever shown as exposed (to require)." : "LIVE — read from the RFP clause checklist facts."}`,
    `Headline: ${insight.headline}`,
  ];
  for (const row of insight.rows) {
    lines.push(
      `  ${row.label} (${valueTypeLabel(row.valueType)}, ${fmtUsdRange(row.low, row.high)}): ${row.protected ? "PROTECTED — clause present in the RFP." : "EXPOSED — clause not present."} Clause: ${row.rfpClause} BAFO fallback if it slips: ${row.bafoAsk}`,
    );
  }
  lines.push(
    ...valueTypeClassificationLines(
      insight.rows.map((r) => ({ label: r.label, valueType: r.valueType })),
    ),
  );

  return {
    block: lines.join("\n"),
    quotableFacts: {
      clauseCoverageHeadline: insight.headline,
      clauseCoverageIsModel: String(insight.isModel),
    },
  };
}

// ── bafo_strategy ────────────────────────────────────────────────────────────

/**
 * Captured-vs-target per lever, which levers are still open, and (reusing each
 * lever's `bafoAsk` from the archetype rule) the specific ask for each open
 * lever — reuses `bafo_progress` verbatim.
 */
function buildBafoStrategyGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, bafoConcessionByLeverKey } = input;
  if (!archetype) return EMPTY_RESULT;

  const insight = buildStepInsight({
    stageKey: "bafo",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    bafoConcessionByLeverKey,
  }) as BafoProgressInsightView | null;
  if (!insight) return EMPTY_RESULT;

  const openRows = insight.rows.filter((r) => r.captured <= 0);
  const capturedRows = insight.rows.filter((r) => r.captured > 0);

  const lines = [
    "BAFO STRATEGY GROUNDING (authoritative — the same BAFO captured-vs-target insight the canvas BAFO tab renders):",
    `Provenance: ${insight.isModel ? "MODEL — no BAFO concession signal yet, every lever shown as still-open (0 captured)." : "LIVE — read from the BAFO concession actuals provided."}`,
    `Headline: ${insight.headline}`,
  ];
  if (capturedRows.length > 0) {
    lines.push("Captured so far:");
    for (const row of capturedRows) {
      lines.push(
        `  ${row.label} (${valueTypeLabel(row.valueType)}): captured ${fmtUsd(row.captured)} of target ${fmtUsdRange(row.targetLow, row.targetHigh)}.`,
      );
    }
  }
  if (openRows.length > 0) {
    lines.push("Still open — the specific ask for each (from the archetype's BAFO playbook):");
    for (const row of openRows) {
      lines.push(
        `  ${row.label} (${valueTypeLabel(row.valueType)}, target ${fmtUsdRange(row.targetLow, row.targetHigh)}): ask — ${row.bafoAsk}`,
      );
    }
  }
  lines.push(
    ...valueTypeClassificationLines(
      insight.rows.map((r) => ({ label: r.label, valueType: r.valueType })),
    ),
  );

  return {
    block: lines.join("\n"),
    quotableFacts: {
      bafoProgressHeadline: insight.headline,
      bafoProgressIsModel: String(insight.isModel),
      bafoOpenLeverCount: String(openRows.length),
    },
  };
}

// ── committed_value ──────────────────────────────────────────────────────────

/**
 * Committed-vs-target per lever, which levers are awaiting award confirmation —
 * reuses `committed_value` verbatim.
 */
function buildCommittedValueGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, committedValueByLeverKey } = input;
  if (!archetype) return EMPTY_RESULT;

  const insight = buildStepInsight({
    stageKey: "selection",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    committedValueByLeverKey,
  }) as CommittedValueInsightView | null;
  if (!insight) return EMPTY_RESULT;

  const awaitingRows = insight.bars.filter((b) => b.committed === undefined);
  const committedRows = insight.bars.filter((b) => b.committed !== undefined);

  const lines = [
    "COMMITTED VALUE GROUNDING (authoritative — the same award-committed-value insight the canvas Selection tab renders):",
    `Provenance: ${insight.isModel ? "MODEL — no award signal yet, shown as the awarded-lever target roll-up." : "LIVE — read from the award commitments provided."}`,
    `Headline: ${insight.headline}`,
  ];
  if (committedRows.length > 0) {
    lines.push("Committed by the executed award:");
    for (const bar of committedRows) {
      lines.push(
        `  ${bar.label} (${valueTypeLabel(bar.valueType)}): committed ${fmtUsd(bar.committed ?? 0)} against target ${fmtUsdRange(bar.low, bar.high)}.`,
      );
    }
  }
  if (awaitingRows.length > 0) {
    lines.push(
      `Still awaiting award confirmation (never shown as $0 — honestly unresolved): ${awaitingRows.map((b) => b.label).join("; ")}.`,
    );
  }
  lines.push(
    ...valueTypeClassificationLines(
      insight.bars.map((b) => ({ label: b.label, valueType: b.valueType })),
    ),
  );

  return {
    block: lines.join("\n"),
    quotableFacts: {
      committedValueHeadline: insight.headline,
      committedValueIsModel: String(insight.isModel),
      committedAwaitingCount: String(awaitingRows.length),
    },
  };
}

// ── value_realization ────────────────────────────────────────────────────────

/**
 * Realized-to-date vs committed per lever — reuses `value_realization` verbatim.
 */
function buildValueRealizationGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const { archetype, factInputs = {}, realizedValueByLeverKey } = input;
  if (!archetype) return EMPTY_RESULT;

  const insight = buildStepInsight({
    stageKey: "value",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
    realizedValueByLeverKey,
  }) as ValueRealizationInsightView | null;
  if (!insight) return EMPTY_RESULT;

  const lines = [
    "VALUE REALIZATION GROUNDING (authoritative — the same committed-vs-realized insight the canvas Value tab renders):",
    `Provenance: ${insight.isModel ? "MODEL — no realized-value signal yet, realization tracked as pending against committed." : "LIVE (snapshot) — read from the realized-to-date actuals provided."}`,
    `Headline: ${insight.headline}`,
  ];
  if (insight.bars && insight.bars.length > 0) {
    for (const bar of insight.bars) {
      const realizedFrag =
        bar.realized !== undefined
          ? `realized to date ${fmtUsd(bar.realized)}`
          : "not yet realized";
      lines.push(
        `  ${bar.label} (${valueTypeLabel(bar.valueType)}): ${realizedFrag} against committed ${fmtUsd(bar.committed)}.`,
      );
    }
    lines.push(
      ...valueTypeClassificationLines(
        insight.bars.map((b) => ({ label: b.label, valueType: b.valueType })),
      ),
    );
  }

  return {
    block: lines.join("\n"),
    quotableFacts: {
      valueRealizationHeadline: insight.headline,
      valueRealizationIsModel: String(insight.isModel),
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE C — decision_recommendation · contract_optimization · general_advisory.
//
// `decision_recommendation` and `contract_optimization` are COMPOSITE builders:
// they call the OTHER mode builders above (and `buildStepInsight` directly for
// the two insight kinds Phase A/B never wired — `exec_decision`/`value_pool`/
// `scope_coverage`) and concatenate the resulting blocks. Neither one
// re-implements a Phase A/B builder's math or text — every fact string in their
// output is produced by an existing function call.
// ═════════════════════════════════════════════════════════════════════════════

// ── decision_recommendation ─────────────────────────────────────────────────

/**
 * The value/commercial view: reuses `buildStepInsight('executive_decision')`
 * (`exec_decision`) — the SAME classified negotiable/protected/risk-adjusted
 * split the canvas Executive Decision tab renders. Never blended into one
 * headline savings number (the canonical doctrine).
 */
function buildExecDecisionFacet(input: BuildModeGroundingInput): {
  block: string;
  quotableFacts: Record<string, string>;
} {
  const { archetype, factInputs = {} } = input;
  if (!archetype) return { block: "", quotableFacts: {} };

  const insight = buildStepInsight({
    stageKey: "executive_decision",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
  }) as ExecDecisionInsightView | null;
  if (!insight) return { block: "", quotableFacts: {} };

  const lines = [
    "EXECUTIVE DECISION FACET (authoritative — the same value+risk split the canvas Executive Decision tab renders):",
    `Provenance: ${insight.provenance === "live" ? "LIVE — computed from this event's cited facts." : "SAMPLE/MODEL — illustrative shape, not a tenant number."}`,
    `Headline: ${insight.headline}`,
  ];
  for (const slice of insight.slices) {
    lines.push(`  ${slice.label} (${slice.bucket}): ${fmtUsdRange(slice.low, slice.high)}.`);
  }
  lines.push(`Confidence (negotiable slice): ${insight.confidence}.`);
  if (insight.residualRiskLevers.length > 0) {
    lines.push(
      `Residual risk — levers still needing evidence (${insight.residualRiskLeverCount}): ${insight.residualRiskLevers.join(", ")}.`,
    );
  }
  return {
    block: lines.join("\n"),
    quotableFacts: {
      execDecisionHeadline: insight.headline,
      execDecisionProvenance: insight.provenance,
    },
  };
}

/**
 * decision_recommendation — a COMPOSITE grounding for "what should we do /
 * who should we award" questions. Assembles FOUR facets, each produced by
 * calling an EXISTING builder (never re-derived):
 *   1. The value/commercial view — `buildExecDecisionFacet` (exec_decision).
 *   2. The vendor comparison facet — `buildVendorComparisonGrounding` verbatim.
 *   3. The BAFO facet — `buildBafoStrategyGrounding` verbatim.
 *   4. Unresolved award conditions — `buildStageGateGrounding` +
 *      `buildEvidenceReadinessGrounding` verbatim (the "what's still open
 *      before this can be awarded" read).
 * Any facet with nothing to say (no archetype, no stage view, etc.) is simply
 * omitted — this never fabricates a facet the underlying builder itself
 * couldn't ground.
 */
function buildDecisionRecommendationGrounding(
  input: BuildModeGroundingInput,
): ModeGroundingResult {
  const sections: string[] = [
    "DECISION RECOMMENDATION GROUNDING (composite — assembled from the same builders the other modes use, never re-derived):",
  ];
  const quotableFacts: Record<string, string> = {};

  const execDecision = buildExecDecisionFacet(input);
  if (execDecision.block) {
    sections.push(execDecision.block);
    Object.assign(quotableFacts, execDecision.quotableFacts);
  }

  const vendorComparison = buildVendorComparisonGrounding(input);
  if (vendorComparison.block) {
    sections.push(vendorComparison.block);
    Object.assign(quotableFacts, vendorComparison.quotableFacts);
  }

  const bafo = buildBafoStrategyGrounding(input);
  if (bafo.block) {
    sections.push(bafo.block);
    Object.assign(quotableFacts, bafo.quotableFacts);
  }

  // Unresolved award conditions: the stage gate (what must clear to advance)
  // plus evidence readiness (what's still missing) for the CURRENT stage —
  // named "unresolved award conditions" here since decision_recommendation is
  // asked when the user is deciding whether the event is ready to award.
  const stageGate = buildStageGateGrounding(input);
  const evidenceReadiness = buildEvidenceReadinessGrounding(input);
  const unresolvedLines: string[] = [];
  if (stageGate.block) unresolvedLines.push(stageGate.block);
  if (evidenceReadiness.block) unresolvedLines.push(evidenceReadiness.block);
  if (unresolvedLines.length > 0) {
    sections.push(
      ["UNRESOLVED AWARD CONDITIONS (from the stage gate + evidence readiness reads):", ...unresolvedLines].join(
        "\n",
      ),
    );
    Object.assign(quotableFacts, stageGate.quotableFacts, evidenceReadiness.quotableFacts);
  }

  if (sections.length === 1) {
    // Nothing to assemble (no archetype, no stage view) — honest empty.
    return EMPTY_RESULT;
  }

  return { block: sections.join("\n\n"), quotableFacts };
}

// ── contract_optimization ───────────────────────────────────────────────────

/**
 * contract_optimization — grounds the INCUMBENT/current-state economics
 * (distinct from vendor_comparison's bid-vs-bid view). Reuses:
 *   - `buildStepInsight('strategy')` (value_pool) for the leakage/opportunity
 *     read against the incumbent baseline.
 *   - `buildStepInsight('scope')` (scope_coverage) for reachable-vs-stranded
 *     value, including the potential-at-risk banding for stranded levers.
 * For each lever this surfaces the archetype's OWN `triggerLogic` and
 * `valueBasis` text (the pattern that triggered the lever, and the basis for
 * its range) — this is the cure/renegotiate/rebid framing already encoded in
 * the playbook; no additional decision framework is invented on top of it.
 */
function buildContractOptimizationGrounding(
  input: BuildModeGroundingInput,
): ModeGroundingResult {
  const { archetype, factInputs = {} } = input;
  if (!archetype) return EMPTY_RESULT;

  const valuePoolInsight = buildStepInsight({
    stageKey: "strategy",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
  }) as ValuePoolInsightView | null;

  const scopeInsight = buildStepInsight({
    stageKey: "scope",
    inputs: factInputs,
    citations: {},
    archetypeId: archetype.id,
  }) as ScopeCoverageInsightView | null;

  if (!valuePoolInsight && !scopeInsight) return EMPTY_RESULT;

  const rulesByKey = new Map<string, ValueLeverRule>(
    (archetype.valueLeverRules ?? []).map((r) => [r.key, r]),
  );

  const lines = [
    "CONTRACT OPTIMIZATION GROUNDING (authoritative — incumbent/current-state economics, distinct from vendor-bid comparison):",
  ];
  const quotableFacts: Record<string, string> = {};

  if (valuePoolInsight) {
    lines.push(
      `Leakage / opportunity pool [${valuePoolInsight.provenance === "live" ? "LIVE" : "SAMPLE/MODEL — illustrative, not a tenant number"}]: ${valuePoolInsight.headline}`,
    );
    for (const bar of valuePoolInsight.bars) {
      const rule = rulesByKey.get(bar.leverKey);
      lines.push(
        `  ${bar.label} (${valueTypeLabel(bar.valueType)}, ${fmtUsdRange(bar.low, bar.high)}): trigger — ${rule?.triggerLogic ?? "not declared for this lever"}. Basis — ${rule?.valueBasis ?? "not declared for this lever"}.`,
      );
    }
    if (valuePoolInsight.needsEvidenceLevers.length > 0) {
      lines.push(
        `Levers needing evidence before they can be sized: ${valuePoolInsight.needsEvidenceLevers.join(", ")}.`,
      );
    }
    lines.push(
      ...valueTypeClassificationLines(
        valuePoolInsight.bars.map((b) => ({ label: b.label, valueType: b.valueType })),
      ),
    );
    quotableFacts.contractOptValuePoolHeadline = valuePoolInsight.headline;
    quotableFacts.contractOptValuePoolProvenance = valuePoolInsight.provenance;
  }

  if (scopeInsight) {
    lines.push(
      `Value exposure — reachable vs stranded [${scopeInsight.isModel ? "MODEL" : "LIVE"}]: ${scopeInsight.headline}`,
    );
    const strandedRows = scopeInsight.rows.filter((r) => !r.reachable);
    if (strandedRows.length > 0) {
      lines.push("Stranded (value exposed, not currently reachable under scope/evidence):");
      for (const row of strandedRows) {
        const riskBandFrag = row.potentialAtRisk
          ? " [benchmark-scaled potential-at-risk — illustrative, not a cited figure]"
          : "";
        lines.push(
          `  ${row.label} (${valueTypeLabel(row.valueType)}, ${fmtUsdRange(row.low, row.high)}${riskBandFrag}): missing ${row.missingEvidence.join(", ") || "evidence not specified"}.`,
        );
      }
    } else {
      lines.push("Stranded: none — every lever is reachable under current scope/evidence.");
    }
    quotableFacts.contractOptScopeHeadline = scopeInsight.headline;
    quotableFacts.contractOptScopeIsModel = String(scopeInsight.isModel);
  }

  return { block: lines.join("\n"), quotableFacts };
}

// ── general_advisory ─────────────────────────────────────────────────────────

/**
 * general_advisory — the catch-all "senior sourcing judgment about the
 * current event" mode. A COMPACT roll-up, reusing existing groundings rather
 * than new logic: current stage (`buildEventStatusGrounding`), the FULL stage
 * gate read (`buildStageGateGrounding` — not just its boolean, so a
 * finality/"ready to issue" question phrased generically enough to fall
 * through to this mode still gets the exact confirm-box states, never a
 * summarized/inferred one), the value bridge headline
 * (`buildValueAtStakeGrounding`, when an archetype resolves), the RFP
 * clause-coverage facet (`buildClauseCoverageGrounding`, when the viewed stage
 * is RFP and an archetype resolves — this is the exact protected-vs-exposed
 * lever read a "is the RFP ready" question needs), and the top 2–3 remaining
 * open items across evidence/BAFO. Intentionally lighter than the other
 * modes — the quality gate applies a lighter bar to it (see
 * `answer-quality-gate.ts`) — but it must still pass the core Phase A checks
 * (no banned language, no fabrication, etc) and must never omit a facet the
 * question is actually asking about just because it classified to the
 * catch-all mode.
 */
function buildGeneralAdvisoryGrounding(input: BuildModeGroundingInput): ModeGroundingResult {
  const sections: string[] = [
    "GENERAL ADVISORY ROLL-UP (compact — current stage + stage gate + value headline + top open items, all reused from existing groundings):",
  ];
  const quotableFacts: Record<string, string> = {};

  const eventStatus = buildEventStatusGrounding(input);
  if (eventStatus.block) {
    sections.push(eventStatus.block);
    Object.assign(quotableFacts, eventStatus.quotableFacts);
  }

  // Full stage-gate read (not just the "met/unmet" boolean folded into the
  // open-items list below) — a generic "is this ready to advance/issue"
  // question needs the ACTUAL confirm-box states, not a one-line summary.
  const stageGate = buildStageGateGrounding(input);
  if (stageGate.block) {
    sections.push(stageGate.block);
    Object.assign(quotableFacts, stageGate.quotableFacts);
  }

  if (input.archetype) {
    const valueAtStake = buildValueAtStakeGrounding(input);
    if (valueAtStake.block) {
      sections.push(valueAtStake.block);
      Object.assign(quotableFacts, valueAtStake.quotableFacts);
    }
  }

  // RFP clause coverage: the protected-vs-exposed-lever read the canvas RFP
  // tab renders. Surfaced here (not just in the dedicated `clause_coverage`
  // mode) because "is the RFP final / ready to issue" style questions name
  // the RFP stage's gate condition ("every priced lever has a clause") but do
  // not always match the `clause_coverage` classifier pattern — omitting this
  // facet is what let a prior answer claim "all levers exposed" without ever
  // reading the real per-lever protected/exposed signal.
  const viewedStageForClauseCoverage = normalizeSourceStageKey(
    input.viewStageKey ?? input.event.currentStageKey,
  );
  if (input.archetype && viewedStageForClauseCoverage === "rfp") {
    const clauseCoverage = buildClauseCoverageGrounding(input);
    if (clauseCoverage.block) {
      sections.push(clauseCoverage.block);
      Object.assign(quotableFacts, clauseCoverage.quotableFacts);
    }
  }

  const openItems: string[] = [];
  const evidenceReadiness = buildEvidenceReadinessGrounding(input);
  if (
    evidenceReadiness.quotableFacts.evidenceMissingCount !== undefined &&
    evidenceReadiness.quotableFacts.evidenceMissingCount !== "0"
  ) {
    openItems.push(
      `${evidenceReadiness.quotableFacts.evidenceMissingCount} evidence item(s) still missing on the current stage.`,
    );
  }
  if (stageGate.quotableFacts.gateAllTasksComplete === "false") {
    openItems.push("The current stage's gate is not yet met — open tasks remain.");
  }
  if (input.archetype) {
    const bafo = buildBafoStrategyGrounding(input);
    if (
      bafo.quotableFacts.bafoOpenLeverCount !== undefined &&
      bafo.quotableFacts.bafoOpenLeverCount !== "0"
    ) {
      openItems.push(`${bafo.quotableFacts.bafoOpenLeverCount} BAFO lever(s) still open.`);
    }
  }
  if (openItems.length > 0) {
    sections.push(["Top open items:", ...openItems.slice(0, 3).map((l) => `  - ${l}`)].join("\n"));
  }

  if (sections.length === 1) {
    return EMPTY_RESULT;
  }

  return { block: sections.join("\n\n"), quotableFacts };
}

/**
 * Build the mode-specific grounding block for one of Phase A's 6, Phase B's 8,
 * or Phase C's 3 implemented modes. Returns an empty result for any other mode
 * (the caller falls through to existing chat behavior unchanged) — this
 * function is only ever called when the classifier already resolved an
 * implemented mode.
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
    case "value_at_stake":
      return buildValueAtStakeGrounding(input);
    case "vendor_comparison":
      return buildVendorComparisonGrounding(input);
    case "should_cost":
      return buildShouldCostGrounding(input);
    case "risk_exposure":
      return buildRiskExposureGrounding(input);
    case "clause_coverage":
      return buildClauseCoverageGrounding(input);
    case "bafo_strategy":
      return buildBafoStrategyGrounding(input);
    case "committed_value":
      return buildCommittedValueGrounding(input);
    case "value_realization":
      return buildValueRealizationGrounding(input);
    case "decision_recommendation":
      return buildDecisionRecommendationGrounding(input);
    case "contract_optimization":
      return buildContractOptimizationGrounding(input);
    case "general_advisory":
      return buildGeneralAdvisoryGrounding(input);
    default:
      return EMPTY_RESULT;
  }
}
