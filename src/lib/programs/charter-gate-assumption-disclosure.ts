/**
 * What the gate dialog has to say about how much of the charter is assumed.
 *
 * The hand-off rollup already reads this back, but it reads it back inside the
 * capture flow — and the capture flow is not where the charter is signed for.
 * The gate dialog is a separate surface with a separate author: its copy is
 * governed by the approval flow, so nothing the capture flow renders reaches
 * it. That split is the whole reason this module exists. Approving the gate is
 * the consequential act — it is the moment an assumption stops being a note the
 * author left themselves and becomes something the approver is putting their
 * name to — so the disclosure has to be derived here and handed to that dialog
 * rather than inferred from a rollup the approver may never have scrolled to.
 *
 * Counts only, and advisory only. The gate's own pass/fail
 * (`src/lib/programs/p1-charter-evidence.ts`) is untouched by anything here and
 * a disclosure never blocks an approval: it discloses, the approver decides.
 * With the basis surface inactive this returns null and the dialog renders
 * byte-for-byte as it does today.
 */

/**
 * The counts the disclosure reads, declared structurally so this module does
 * not depend on the component that happens to produce them today. The shape is
 * the basis summary's — a caller passes that summary straight in.
 */
export interface CharterGateBasisCounts {
  /** Basis-eligible sections in this charter. */
  total: number;
  /** Of those, how many carry an answer. */
  answered: number;
  evidence: number;
  asserted: number;
  assumptions: number;
  /** Answered, but no basis declared yet. */
  unrecorded: number;
  openAssumptions: readonly CharterGateOpenAssumption[];
}

export interface CharterGateOpenAssumption {
  sectionKey: string;
  label: string;
  owner: string;
  p2ValidationPlan: string;
}

export interface CharterGateAssumptionDisclosure {
  /**
   * Amber when something is assumed or still has no basis; neutral when every
   * answer is backed or asserted. The neutral case is rendered rather than
   * omitted for the same reason the recap marks every basis and not just the
   * amber one: in a dialog, an absent disclosure is indistinguishable from a
   * clean one, so silence would read as a clean charter.
   */
  tone: "amber" | "neutral";
  headline: string;
  /** Present only in the amber case; empty when nothing is assumed. */
  openAssumptions: readonly CharterGateOpenAssumption[];
  /** Answered questions still carrying no declared basis. */
  unrecorded: number;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Derive the gate dialog's disclosure.
 *
 * Returns null — meaning "say nothing, render exactly as before" — when the
 * basis surface is inactive for this phase or tenant, when the charter has no
 * basis-eligible questions at all, or when nothing has been answered yet.
 * Nothing answered is a genuinely empty charter rather than a clean one, and
 * claiming either state would be a claim the counts do not support.
 */
export function charterGateAssumptionDisclosure(input: {
  /** The resolved basis surface: the feature flag AND the phase it applies to. */
  active: boolean;
  counts: CharterGateBasisCounts | null;
}): CharterGateAssumptionDisclosure | null {
  if (!input.active) return null;
  const counts = input.counts;
  if (!counts) return null;
  if (counts.total === 0) return null;
  if (counts.answered === 0) return null;

  const { assumptions, unrecorded } = counts;

  if (assumptions === 0 && unrecorded === 0) {
    return {
      tone: "neutral",
      headline: `All ${counts.answered} answered ${plural(
        counts.answered,
        "question",
        "questions",
      )} in this charter records a basis. None is an open assumption.`,
      openAssumptions: [],
      unrecorded: 0,
    };
  }

  const parts: string[] = [];
  if (assumptions > 0) {
    parts.push(
      `${assumptions} of ${counts.answered} answered ${plural(
        counts.answered,
        "question",
        "questions",
      )} ${plural(assumptions, "is an assumption", "are assumptions")} that Discover still has to validate`,
    );
  }
  if (unrecorded > 0) {
    parts.push(
      `${unrecorded} ${plural(unrecorded, "carries", "carry")} no declared basis yet`,
    );
  }

  return {
    tone: "amber",
    headline: `${parts.join("; ")}.`,
    openAssumptions: assumptions > 0 ? counts.openAssumptions : [],
    unrecorded,
  };
}
