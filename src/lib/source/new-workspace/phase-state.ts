import {
  SOURCE_LIFECYCLE_STATUS_LABELS,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  isSourceStageKey,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import { getSourceCategory } from "@/lib/source/taxonomy/category-taxonomy";

/**
 * The four operator phases the Source New workspace can place an accepted
 * event in today. They are product vocabulary, not the eleven internal stage
 * keys.
 */
export type SourceNewPhaseKey = "request" | "define" | "suppliers" | "rfi";

export const SOURCE_NEW_PHASE_ORDER: readonly SourceNewPhaseKey[] = [
  "request",
  "define",
  "suppliers",
  "rfi",
];

export const SOURCE_NEW_PHASE_DISPLAY_LABELS: Record<SourceNewPhaseKey, string> = {
  request: "Request",
  define: "Define",
  suppliers: "Suppliers & NDA",
  rfi: "Market package",
};

/**
 * The public Source New flow has five visible checkpoints: the request-first
 * entry before an event exists, then the four event phases above. Internal
 * stage keys remain governed by SOURCE_STAGE_ORDER; do not add internal stages
 * here to make a product rail look complete.
 */
export type SourceNewExternalCheckpointKey =
  | "request_intake"
  | SourceNewPhaseKey;

export const SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER: readonly SourceNewExternalCheckpointKey[] =
  ["request_intake", ...SOURCE_NEW_PHASE_ORDER];

/**
 * What the workspace may honestly say about a phase.
 *
 * `recorded`, `historical_gap`, and `no_record` all mean "the event is past
 * this phase"; they differ in whether evidence exists and whether the event
 * itself is terminal. None means approved — that needs authority this surface
 * does not create.
 */
export type SourceNewPhaseState =
  | "current"
  | "review_needed"
  | "recorded"
  | "historical_gap"
  | "no_record"
  | "not_open";

export const SOURCE_NEW_PHASE_STATE_LABELS: Record<SourceNewPhaseState, string> = {
  current: "Current",
  review_needed: "Review needed",
  recorded: "Recorded",
  historical_gap: "Historical gap",
  no_record: "No record",
  not_open: "Later",
};

export type SourceNewPhaseEvidence = Record<SourceNewPhaseKey, boolean>;

export interface SourceNewPhasePositionInput {
  currentStage: string;
  lifecycle: string;
}

export interface SourceNewOperatorContextInput
  extends SourceNewPhasePositionInput {
  solicitationMotion?: "rfi" | "rfp" | null;
}

export function awaitsIntakeReview(lifecycle: string): boolean {
  return lifecycle === "waiting_on_client";
}

/**
 * The phase the event is working in, or `null` when no phase owns it: either
 * the event has advanced past the four phases this workspace covers, or its
 * stage key is not one we recognise. `suppliers` is never current — Phase 1
 * has no supplier stage of its own, so supplier work is evidenced by its
 * artifacts, never asserted from the stage key.
 */
export function sourceNewCurrentPhase(event: SourceNewPhasePositionInput): SourceNewPhaseKey | null {
  if (awaitsIntakeReview(event.lifecycle)) return "request";
  const stage = event.currentStage.trim().toLowerCase();
  if (["intake", "strategy", "sourcing_strategy", "scope"].includes(stage)) return "define";
  if (["rfp", "rfp_rfi_package"].includes(stage)) return "rfi";
  return null;
}

export function sourceNewMarketPackageLabel(
  event: Pick<SourceNewOperatorContextInput, "solicitationMotion">,
): string {
  if (event.solicitationMotion === "rfi") return "RFI";
  if (event.solicitationMotion === "rfp") return "RFP";
  return "Market package";
}

export function sourceNewCurrentPhaseLabel(
  event: SourceNewOperatorContextInput,
): string {
  const phase = sourceNewCurrentPhase(event);
  if (!phase) return sourceNewStageLabel(event.currentStage);
  return phase === "rfi"
    ? sourceNewMarketPackageLabel(event)
    : SOURCE_NEW_PHASE_DISPLAY_LABELS[phase];
}

export function sourceNewNextAction(event: SourceNewOperatorContextInput): {
  label: string;
  detail: string;
} {
  const packageLabel = sourceNewMarketPackageLabel(event);
  const stage = event.currentStage.trim().toLowerCase();
  if (awaitsIntakeReview(event.lifecycle)) {
    return {
      label: "Review intake",
      detail: "Review the recorded request and its approval state.",
    };
  }
  if (event.lifecycle !== "active") {
    return {
      label: "Open event",
      detail: `Current stage: ${sourceNewStageLabel(event.currentStage)}`,
    };
  }
  if (
    ["strategy", "scope", "sourcing_strategy", "intake"].includes(stage)
  ) {
    return {
      label: "Open scope and strategy",
      detail:
        "Review scope, baseline and decision requirements in the governed event.",
    };
  }
  if (["rfp", "rfp_rfi_package"].includes(stage)) {
    return {
      label:
        packageLabel === "Market package"
          ? "Open market package"
          : `Open ${packageLabel}`,
      detail:
        packageLabel === "Market package"
          ? "Review the package and its release requirements in the governed event."
          : `Review the ${packageLabel} and its release requirements in the governed event.`,
    };
  }
  return {
    label: "Open current stage",
    detail: `Current stage: ${sourceNewStageLabel(event.currentStage)}`,
  };
}

/**
 * True when the event's stage sits after `rfp` in the canonical stage order,
 * so every phase this workspace shows is behind the event.
 */
export function isPastSourceNewPhases(event: SourceNewPhasePositionInput): boolean {
  if (awaitsIntakeReview(event.lifecycle)) return false;
  const canonical = normalizeSourceStageKey(event.currentStage);
  if (!canonical) return false;
  const index = SOURCE_STAGE_ORDER.indexOf(canonical);
  const rfpIndex = SOURCE_STAGE_ORDER.indexOf("rfp");
  return index > rfpIndex;
}

/**
 * The state of one phase.
 *
 * Position alone never earns a past-tense label. A phase behind the event
 * reads `recorded` only when that phase actually holds something; otherwise it
 * reads `no_record`, because an index lower than the current one is not
 * evidence that the work happened.
 */
export function sourceNewPhaseState(
  phase: SourceNewPhaseKey,
  event: SourceNewPhasePositionInput,
  evidence: SourceNewPhaseEvidence,
): SourceNewPhaseState {
  const current = sourceNewCurrentPhase(event);
  if (current !== null && phase === current) {
    return awaitsIntakeReview(event.lifecycle) ? "review_needed" : "current";
  }
  const behind = (): SourceNewPhaseState => {
    if (evidence[phase]) return "recorded";
    return event.lifecycle === "completed" ? "historical_gap" : "no_record";
  };
  if (current === null) {
    // Past the four phases, or an unplaceable stage. Either way we cannot
    // claim a phase is locked ahead of the event, so we report what exists.
    return behind();
  }
  const index = SOURCE_NEW_PHASE_ORDER.indexOf(phase);
  const currentIndex = SOURCE_NEW_PHASE_ORDER.indexOf(current);
  return index < currentIndex ? behind() : "not_open";
}

/**
 * Missing governed history on a terminal event is still operator work. Keep
 * that distinct from ordinary evidence gaps on an event that is in flight so
 * the workspace does not present a historically incomplete record as done.
 */
export function sourceNewHistoricalGapPhases(
  event: SourceNewPhasePositionInput,
  evidence: SourceNewPhaseEvidence,
): SourceNewPhaseKey[] {
  if (event.lifecycle !== "completed") return [];
  return SOURCE_NEW_PHASE_ORDER.filter(
    (phase) => sourceNewPhaseState(phase, event, evidence) === "historical_gap",
  );
}

export function sourceNewPhaseStateLabel(state: SourceNewPhaseState): string {
  return SOURCE_NEW_PHASE_STATE_LABELS[state];
}

/**
 * Operator wording for an event's lifecycle. The two states this workspace
 * speaks about in its own words keep those words; every other state comes from
 * the canonical lifecycle dictionary rather than from title-casing whatever the
 * column holds.
 */
export function sourceNewLifecycleLabel(lifecycle: string): string {
  if (awaitsIntakeReview(lifecycle)) return "Awaiting intake review";
  if (lifecycle === "active") return "Active event";
  const key = lifecycle.trim().toLowerCase();
  const known = (SOURCE_LIFECYCLE_STATUS_LABELS as Record<string, string | undefined>)[key];
  return known ?? "Not recorded";
}

/**
 * How the workspace shows a classified category.
 *
 * A category id from the governed taxonomy is shown by its taxonomy label. A
 * value that is recorded but outside that taxonomy is still shown — it is what
 * the event holds — but it is marked as ungoverned rather than presented as if
 * it came from the dictionary. Nothing recorded stays "Not established", which
 * is not the same as a category the taxonomy does not know.
 */
export interface SourceNewCategoryDisplay {
  text: string;
  note: string | null;
}

export function sourceNewCategoryDisplay(category: string | null): SourceNewCategoryDisplay {
  const value = category?.trim() ?? "";
  if (!value) return { text: "Not established", note: null };
  const governed = getSourceCategory(value);
  if (governed) return { text: governed.label, note: null };
  return {
    text: sourceNewEventTypeLabel(value),
    note: "This category is recorded on the event but is not one of the governed sourcing categories, so no category guidance applies to it.",
  };
}

/**
 * Title-cased wording for an event type. `source_events.event_type` is an open
 * text column with no closed dictionary behind it, so this only fixes the
 * casing of the recorded value — it does not name an archetype, because more
 * than one archetype shares an event type and picking one would assert an
 * identity the column does not carry.
 */
export function sourceNewEventTypeLabel(eventType: string): string {
  const words = eventType.trim().split(/[_\-\s]+/).filter(Boolean);
  if (words.length === 0) return "Not recorded";
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

/**
 * The folder an artifact belongs in.
 *
 * Every artifact the caller is authorized to see lands somewhere. An artifact
 * whose stage belongs to the rest of the event resolves to `other` rather than
 * to nothing: dropping it would show an operator an empty folder while the
 * cabinet holds files, and absent is not the same as none.
 */
export function sourceNewFilePhase(artifact: {
  sourcingStage: string | null;
  artifactType: string;
}): SourceNewPhaseKey | "other" {
  if (artifact.artifactType.toLowerCase().includes("nda")) return "suppliers";
  const stage = artifact.sourcingStage?.trim().toLowerCase() ?? "";
  if (stage === "intake") return "request";
  if (stage === "strategy" || stage === "sourcing_strategy" || stage === "scope") return "define";
  if (stage === "rfp" || stage === "rfp_rfi_package") return "rfi";
  return "other";
}

/**
 * Operator wording for a stage key. Raw keys are builder vocabulary and must
 * never reach this surface. `rfp` and its legacy alias resolve to the neutral
 * market-package wording: the stage key does not record whether the event is
 * an RFI or an RFP, so naming either one here would invent authority.
 */
export function sourceNewStageLabel(stageKey: string): string {
  const stage = stageKey.trim().toLowerCase();
  if (stage === "rfp" || stage === "rfp_rfi_package") return "Market package";
  if (isSourceStageKey(stage)) return SOURCE_STAGE_LABELS[stage];
  return "Not recorded";
}
