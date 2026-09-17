import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  isSourceStageKey,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import { getSourceCategory } from "@/lib/source/taxonomy/category-taxonomy";

/**
 * The four operator phases the Source New workspace can place an event in
 * today. They are a product vocabulary, not the eleven internal stage keys.
 */
export type SourceNewPhaseKey = "request" | "define" | "suppliers" | "rfi";

export const SOURCE_NEW_PHASE_ORDER: readonly SourceNewPhaseKey[] = [
  "request",
  "define",
  "suppliers",
  "rfi",
];

/**
 * What the workspace may honestly say about a phase.
 *
 * `recorded` and `no_record` both mean "the event is past this phase"; they
 * differ only in whether anything was actually recorded there. Neither means
 * complete or approved — a completion claim needs an approval record, which
 * this surface does not read.
 */
export type SourceNewPhaseState =
  | "current"
  | "review_needed"
  | "recorded"
  | "no_record"
  | "not_open";

export const SOURCE_NEW_PHASE_STATE_LABELS: Record<SourceNewPhaseState, string> = {
  current: "Current",
  review_needed: "Review needed",
  recorded: "Recorded",
  no_record: "No record",
  not_open: "Later",
};

export type SourceNewPhaseEvidence = Record<SourceNewPhaseKey, boolean>;

export interface SourceNewPhasePositionInput {
  currentStage: string;
  lifecycle: string;
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
  const behind = (): SourceNewPhaseState => (evidence[phase] ? "recorded" : "no_record");
  if (current === null) {
    // Past the four phases, or an unplaceable stage. Either way we cannot
    // claim a phase is locked ahead of the event, so we report what exists.
    return behind();
  }
  const index = SOURCE_NEW_PHASE_ORDER.indexOf(phase);
  const currentIndex = SOURCE_NEW_PHASE_ORDER.indexOf(current);
  return index < currentIndex ? behind() : "not_open";
}

export function sourceNewPhaseStateLabel(state: SourceNewPhaseState): string {
  return SOURCE_NEW_PHASE_STATE_LABELS[state];
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
