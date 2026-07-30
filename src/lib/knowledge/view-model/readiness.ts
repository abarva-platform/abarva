/**
 * deriveReadiness — the single function that maps real governance signals
 * (AvailabilityState / AuthorityState / FreshnessState / ConsumptionWarning[])
 * onto the new 11-value ComponentReadinessState. No component and no other
 * assembler function re-implements this logic.
 *
 * See reports/airline-knowledge-provider-reconciliation-2026-07-30/
 * VIEW_MODEL_ASSEMBLER_INTERFACES.md §1 for the derivation table this
 * implements, and RISK_ASSESSMENT.md for why this is the highest-value
 * regression surface in the module: a change here that lets a candidate,
 * withheld, or not_measured value read as ENABLED_AND_PROVEN is a content-
 * safety bug, not a cosmetic one.
 */

import type {
  AuthorityState,
  AvailabilityState,
  ConsumptionWarning,
  FreshnessState,
} from "../consumption-contracts";
import type { ComponentReadinessState } from "./types";

export interface ReadinessInput {
  readonly availabilityState: AvailabilityState;
  readonly authorityState: AuthorityState;
  readonly freshnessState: FreshnessState;
  readonly warnings: readonly ConsumptionWarning[];
  /**
   * True only when this exact field is on the fixed SOURCE_INCOMPLETE
   * allow-list (see source-incomplete.ts) AND the underlying data is
   * functionally absent. Never inferred from row counts at call time.
   */
  readonly sourceIncomplete?: boolean;
  /** True when the evidence backing this field is access-restricted. */
  readonly restricted?: boolean;
  /**
   * True once an end-to-end cite-render test exists proving this exact view
   * model renders correctly. Defaults to false — a view model is
   * DATA_RECONCILED_BUT_UI_UNPROVEN, not ENABLED_AND_PROVEN, until a test
   * says otherwise. See TEST_PLAN.md.
   */
  readonly proven?: boolean;
}

const STALE_AVAILABILITY: ReadonlySet<AvailabilityState> = new Set([
  "stale",
  "superseded",
]);
const AUTHORITY_PUBLISHED_GRADE: ReadonlySet<AuthorityState> = new Set([
  "accepted",
  "published",
]);

export function deriveReadiness(
  input: ReadinessInput,
): ComponentReadinessState {
  const { availabilityState, authorityState, freshnessState, warnings } = input;

  if (input.restricted) return "RESTRICTED";
  if (availabilityState === "withheld") return "WITHHELD";
  if (input.sourceIncomplete) return "SOURCE_INCOMPLETE";
  if (availabilityState === "not_loaded") return "PROJECTION_UNAVAILABLE";
  if (availabilityState === "not_measured") return "NOT_MEASURED";
  if (availabilityState === "conflicting") return "DISPUTED";
  if (availabilityState === "not_applicable") return "NOT_ASSESSED";
  if (warnings.some((w) => w.code === "cube_unavailable"))
    return "CUBE_UNPROVEN";
  if (STALE_AVAILABILITY.has(availabilityState) || freshnessState === "stale")
    return "STALE";
  if (
    availabilityState === "candidate" ||
    !AUTHORITY_PUBLISHED_GRADE.has(authorityState)
  ) {
    return "DATA_RECONCILED_BUT_UI_UNPROVEN";
  }
  if (
    (availabilityState === "available" || availabilityState === "accepted") &&
    input.proven
  ) {
    return "ENABLED_AND_PROVEN";
  }
  return "DATA_RECONCILED_BUT_UI_UNPROVEN";
}

/** True when a view model at this readiness may have its `data` treated as fact. */
export function readinessIsRenderable(
  readiness: ComponentReadinessState,
): boolean {
  return (
    readiness === "ENABLED_AND_PROVEN" ||
    readiness === "DATA_RECONCILED_BUT_UI_UNPROVEN"
  );
}

const UNAVAILABLE_REASONS: Record<
  Exclude<ComponentReadinessState, "ENABLED_AND_PROVEN">,
  string
> = {
  DATA_RECONCILED_BUT_UI_UNPROVEN:
    "The underlying data is governed and available, but no end-to-end render proof exists for " +
    "this view yet.",
  SOURCE_INCOMPLETE:
    "The source corpus does not yet support a complete answer here. This is a known " +
    "source-completeness gap, not a rendering or provider defect.",
  PROJECTION_UNAVAILABLE:
    "This projection has not been built for the active baseline yet.",
  CUBE_UNPROVEN: "The Cube-backed measure for this value is not yet available.",
  WITHHELD:
    "This is classified or otherwise access-restricted; its content is withheld.",
  RESTRICTED: "The evidence backing this is access-restricted.",
  STALE: "The last accepted value has aged past its refresh window.",
  DISPUTED:
    "Two or more accepted sources disagree here; held out until resolved.",
  NOT_MEASURED: "No observation exists for this yet.",
  NOT_ASSESSED: "This has not been assessed for the active baseline.",
};

/** The default, honest reason string for a given readiness — callers may override with a more specific one. */
export function defaultUnavailableReason(
  readiness: ComponentReadinessState,
): string | null {
  if (readiness === "ENABLED_AND_PROVEN") return null;
  return UNAVAILABLE_REASONS[readiness];
}
