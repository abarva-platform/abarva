import {
  isRootCauseSettled,
  rankedRootCauses,
} from "@/lib/programs/root-cause-register";
import { readRootCauseValue } from "@/lib/programs/root-cause-step";
import { stepPageHref } from "@/lib/programs/step-page-views";

export interface PhaseCatchUpItem {
  phase: number;
  stepId: string;
  id: string;
  label: string;
  href: string;
}

export interface PhaseCatchUp {
  phase: number;
  /** Advancement proves a passed gate, but does not identify the old UI. */
  provenance: "advanced-past" | "handed-off";
  gateRecordConfirmed: boolean;
  items: readonly PhaseCatchUpItem[];
}

/**
 * Only declare a gap for a saved step value that a later page actually reads.
 * P3 Step 1 reads P2's root-cause register. Missing structured state is a
 * confirmation gap, never proof of which capture flow the person used.
 */
export function detectPhaseCatchUp(input: {
  moveId: string;
  phase: number;
  currentPhase: number;
  terminalComplete?: boolean;
  gatePassed: boolean;
  gateRecordConfirmed?: boolean;
  rootCauses?: string;
}): PhaseCatchUp | null {
  if (
    !input.gatePassed ||
    input.phase >= input.currentPhase ||
    input.phase !== 2
  )
    return null;

  const href = stepPageHref(input.moveId, 2, "P2.3");
  const { kind, register } = readRootCauseValue(input.rootCauses ?? "");
  const items: PhaseCatchUpItem[] = [];
  if (kind !== "register") {
    items.push({
      phase: 2,
      stepId: "P2.3",
      id: "root-cause-record",
      label:
        kind === "earlier_answer"
          ? "Review the earlier root-cause answer"
          : "Confirm the root-cause record",
      href,
    });
  } else {
    const ranked = rankedRootCauses(register);
    if (ranked.length === 0) {
      items.push({
        phase: 2,
        stepId: "P2.3",
        id: "root-cause-empty",
        label: "Add a root cause",
        href,
      });
    }
    for (const cause of ranked) {
      if (isRootCauseSettled(cause)) continue;
      const name = cause.short ? `${cause.short} (${cause.id})` : cause.id;
      items.push({
        phase: 2,
        stepId: "P2.3",
        id: cause.id,
        label:
          cause.status === "no_evidence"
            ? `Settle ${name} · add its evidence`
            : `Review ${name}`,
        href,
      });
    }
    // The order is actionable once all causes are settled. Avoid presenting
    // one cause and its order as two separate confirmations in the banner.
    if (ranked.length > 0 && items.length === 0 && !register.orderConfirmedAt) {
      items.push({
        phase: 2,
        stepId: "P2.3",
        id: "root-cause-order",
        label: "Confirm the root-cause order",
        href,
      });
    }
  }
  if (items.length === 0) return null;
  return {
    phase: 2,
    provenance: input.terminalComplete ? "handed-off" : "advanced-past",
    gateRecordConfirmed: Boolean(input.gateRecordConfirmed),
    items,
  };
}

export function firstCatchUpHref(
  catchUps: readonly PhaseCatchUp[],
): string | null {
  return (
    [...catchUps]
      .sort((a, b) => a.phase - b.phase)
      .flatMap((catchUp) => catchUp.items)[0]?.href ?? null
  );
}

export function phaseStatusWithCatchUp(
  phase: number,
  done: boolean,
  catchUp: PhaseCatchUp | null,
): string {
  if (!done) return "Not started";
  return catchUp?.phase === phase
    ? `Done · ${catchUp.items.length} to confirm`
    : "Done";
}
