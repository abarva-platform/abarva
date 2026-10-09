/**
 * What holds the phase build control — resolved ONCE, for the control's
 * `disabled` attribute, its colours, its cursor, its label, and the status
 * sentence beside it.
 *
 * The build button had its own condition written out four times. `disabled`
 * and `cursor` read four terms; `background` and `color` read three, omitting
 * the open-required-evidence term three lines above them. So a phase whose
 * only hold was open required evidence rendered a button that was genuinely
 * inert and painted in the full-strength primary green on white — the live
 * "go" treatment — and the only hint was its own label.
 *
 * That state is the ordinary one on the governed approve step: the transition
 * readiness workbook deliberately does NOT hold capture's Continue, so a phase
 * can have every input answered and saved (no parent blocker) with the
 * workbook still unaccepted. The reader sees the primary action, in the
 * primary colour, doing nothing.
 *
 * The label and the status sentence also resolved the same two holds in
 * OPPOSITE orders — the label named required evidence first, the sentence
 * named the parent's capture blocker first — so with both open the button and
 * the line beside it prescribed different work. The sentence had it right:
 * `onBeforeBuild` finalizes the capture before the build set is enqueued, so
 * incomplete inputs are what the server refuses on first.
 *
 * So the hold is a value, not a condition re-typed per slot:
 * `resolvePhaseBuildBlock` returns `null` when nothing holds the build — which
 * is what "the build is offerable" now means — and otherwise returns the hold
 * together with every string the control renders for it. A slot cannot style
 * the control as live while another slot reports it held, because there is
 * only one reckoning.
 *
 * Adding a hold means adding a `PhaseBuildBlockKey` and a branch in the
 * `switch`, which does not compile until both of its sentences are written.
 */

/**
 * The holds, in the order the control reports them. Earlier holds win.
 *
 * `build_in_flight` is first because a batch already running makes every
 * reckoning below it moot. `phase_inputs_incomplete` precedes
 * `required_evidence_open` because that is the order the write path refuses
 * in: the capture is finalized before the build set is enqueued.
 *
 * Exported so a surface that renders its own prose for these holds can be
 * cross-checked against this order instead of re-deriving it.
 */
export const PHASE_BUILD_BLOCK_ORDER = [
  "build_in_flight",
  "phase_inputs_incomplete",
  "required_evidence_open",
] as const;

export type PhaseBuildBlockKey = (typeof PHASE_BUILD_BLOCK_ORDER)[number];

export interface PhaseBuildBlockInput {
  /** This control's own submit is in flight. */
  building: boolean;
  /** A deliverable in the current build set is queued or running. */
  anyRunning: boolean;
  /**
   * The parent's own blocker sentence, or `null` when the parent reports none.
   * Passed as the sentence rather than a flag because the capture ladder
   * distinguishes unanswered, unsaved, saving, dirty and route-unchosen
   * inputs, and each of those has its own remedy. Blank is treated as absent,
   * matching the `Boolean(disabledReason)` the control used before.
   */
  parentBlockerText: string | null;
  /**
   * Required evidence items that must be covered before the final build, after
   * the caller has applied its own `blockOnEvidenceGaps` decision. Callers that
   * show evidence gaps as forward guidance rather than as a hold pass 0.
   */
  requiredEvidenceGapCount: number;
  /** The phase's display label, for the in-flight sentences. */
  phaseLabel: string;
}

export interface PhaseBuildBlock {
  key: PhaseBuildBlockKey;
  /** The build control's label while this hold stands. */
  actionLabel: string;
  /** The status sentence rendered beside the control. */
  statusLine: string;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

/**
 * Resolve what holds the build, or `null` when nothing does.
 *
 * `null` is the single definition of "offerable" for this control: the holds
 * below ARE the held condition, so the control cannot be styled as inert
 * without a hold, and cannot be styled as live while one stands.
 */
export function resolvePhaseBuildBlock(
  input: PhaseBuildBlockInput,
): PhaseBuildBlock | null {
  const key = resolveKey(input);
  if (!key) return null;
  switch (key) {
    case "build_in_flight":
      return {
        key,
        actionLabel: `Building ${input.phaseLabel}…`,
        statusLine: `Building ${input.phaseLabel}. Keep this page open while the governed batch finishes.`,
      };
    case "phase_inputs_incomplete": {
      // The parent already wrote the remedy for its own hold. Reusing its
      // sentence is what stops the control naming one action while the line
      // beside it names another.
      const sentence = (input.parentBlockerText ?? "").trim();
      return {
        key,
        actionLabel: "Complete phase inputs before build",
        statusLine: sentence,
      };
    }
    case "required_evidence_open": {
      const count = input.requiredEvidenceGapCount;
      return {
        key,
        actionLabel: "Final build blocked by required evidence",
        statusLine: `${count} required evidence ${plural(
          count,
          "item",
          "items",
        )} must be covered before final build.`,
      };
    }
  }
}

function resolveKey(input: PhaseBuildBlockInput): PhaseBuildBlockKey | null {
  if (input.building || input.anyRunning) return "build_in_flight";
  if ((input.parentBlockerText ?? "").trim().length > 0)
    return "phase_inputs_incomplete";
  if (input.requiredEvidenceGapCount > 0) return "required_evidence_open";
  return null;
}
