// P0 corruption diagnostic — READ-ONLY classification. No writes, ever.
//
// Before the integrity fix, the P0 phase page synthesized its input values from
// a stale hardcoded draft list and POSTed them back as authoritative capture.
// The route merged them over `program_modules` and, on phase 0, also mirrored
// them into `engagements.charter`. This module classifies, per field per Move,
// whether that actually happened — so repair can be deterministic rather than
// based on "looks generic".
//
// Three layers are compared, because the damage could reach two of them:
//
//   charter.scaffold        preserved origination source (never overwritten)
//        |
//   engagements.charter     top-level mirror — overwritable, but only for
//        |                  the subset of fields the mirror actually wrote
//   program_modules p0      capture rows — overwritable
//
// The fourth thing this has to know is which fields the mirror could even
// touch. `scope_out`, `outcomes_success` and `discovery_questions` were never
// in the old client's payload and were never mirrored, so "no charter mirror
// value" is their CORRECT state — flagging it would manufacture false positives
// on exactly the fields that were never at risk.
//
// Pure module: no I/O.

import { isKnownPlaceholderValue } from "./phase-capture-integrity";

/**
 * The eight capture keys the broken client actually sent. Only these could have
 * been overwritten in `program_modules`; every other P0 key was absent from the
 * payload and is therefore untouched by construction.
 */
export const OVERWRITABLE_CAPTURE_KEYS: readonly string[] = [
  "business_trigger",
  "problem_statement",
  "affected_function_process",
  "initial_value_hypothesis",
  "stakeholder_owner_view",
  "known_evidence",
  "missing_evidence_open_questions",
  "recommendation_to_advance",
];

/**
 * Capture keys the phase-0 charter mirror wrote, and the `engagements.charter`
 * top-level field each landed in. A capture key absent from this map was never
 * mirrored, so its charter layer is legitimately "not applicable".
 */
export const CHARTER_MIRROR_TARGETS: Readonly<Record<string, string>> = {
  business_trigger: "business_trigger",
  problem_statement: "problem_statement",
  affected_function_process: "affected_function_process",
  initial_value_hypothesis: "value_hypothesis",
  stakeholder_owner_view: "sponsor_candidate",
  known_evidence: "known_evidence",
  missing_evidence_open_questions: "missing_evidence_open_questions",
  recommendation_to_advance: "recommendation_to_advance",
};

/**
 * Where each capture key's authoritative origination text lives inside
 * `charter.scaffold`. This is the restore source.
 *
 * `recommendation_to_advance` has no scaffold origin — the old client
 * hardcoded it and origination never captured one — so it can never be
 * deterministically restored and is always ambiguous.
 */
export const SCAFFOLD_SOURCE_KEYS: Readonly<Record<string, string>> = {
  business_trigger: "problem_statement",
  problem_statement: "problem_statement",
  affected_function_process: "scope_in",
  initial_value_hypothesis: "value_hypothesis",
  stakeholder_owner_view: "sponsor_candidate",
  known_evidence: "evidence_family",
  missing_evidence_open_questions: "foundation_readiness",
};

export type FieldAssessment =
  /** Real, non-placeholder text. Nothing to do. */
  | "clean"
  /** Empty. A legitimate state — the field was simply never filled in. */
  | "never_captured"
  /** Known boilerplate AND a different non-empty scaffold value exists. Deterministically repairable. */
  | "likely_corrupt_repairable"
  /** Known boilerplate, a scaffold value exists, but it is identical — nothing to restore to. */
  | "corrupt_unrestorable"
  /** Known boilerplate with NO scaffold source at all. Provenance unknown; human review. */
  | "ambiguous"
  /** The broken path never wrote this layer; nothing to assess. */
  | "not_applicable";

/** The action an operator should take. Never inferred beyond the evidence. */
export type RecommendedAction =
  | "none"
  | "restore_from_scaffold"
  | "human_review";

export function recommendedActionFor(
  assessment: FieldAssessment,
): RecommendedAction {
  switch (assessment) {
    case "likely_corrupt_repairable":
      return "restore_from_scaffold";
    case "corrupt_unrestorable":
    case "ambiguous":
      return "human_review";
    default:
      return "none";
  }
}

/** Assessments that represent actual damage, whatever the remedy. */
const DAMAGED: ReadonlySet<FieldAssessment> = new Set<FieldAssessment>([
  "likely_corrupt_repairable",
  "corrupt_unrestorable",
  "ambiguous",
]);

export interface FieldDiagnosis {
  captureKey: string;
  scaffoldValue: string;
  charterMirrorValue: string | null;
  captureValue: string;
  /** Whether the phase_0 row holds known boilerplate. */
  captureIsPlaceholder: boolean;
  /** Whether the charter mirror holds known boilerplate. */
  charterMirrorIsPlaceholder: boolean;
  captureAssessment: FieldAssessment;
  charterAssessment: FieldAssessment;
  captureAction: RecommendedAction;
  charterAction: RecommendedAction;
}

export interface MoveDiagnosis {
  moveId: string;
  tenantKey: string;
  moveName: string;
  fields: FieldDiagnosis[];
  /** Any layer of any field is corrupt. */
  affected: boolean;
  corruptCaptureKeys: string[];
  corruptCharterKeys: string[];
  /** Corrupt somewhere but no deterministic restore source — needs a human. */
  ambiguousKeys: string[];
  /** Every corrupt field has a deterministic restore source. */
  fullyRestorable: boolean;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Classify one field across the layers.
 *
 * The rule is deliberately narrow and all three conditions must hold before
 * anything is called corrupt: the live value is a KNOWN boilerplate string
 * (exact match, not a similarity judgment), a scaffold value exists, and the
 * scaffold value differs. "Looks generic" is never sufficient — a client may
 * legitimately have written something bland.
 */
function assessLayer(
  liveValue: string,
  scaffoldValue: string,
  applicable: boolean,
): { isPlaceholder: boolean; assessment: FieldAssessment } {
  if (!applicable)
    return { isPlaceholder: false, assessment: "not_applicable" };
  const isPlaceholder = isKnownPlaceholderValue(liveValue);
  if (!isPlaceholder) {
    // Empty is reported distinctly from real text: "never captured" is a
    // legitimate state and must not be counted as damage.
    return {
      isPlaceholder: false,
      assessment: liveValue.length === 0 ? "never_captured" : "clean",
    };
  }
  if (scaffoldValue.length === 0) {
    // Boilerplate with no origination source — we cannot tell whether it was
    // overwritten or was always this. A human decides.
    return { isPlaceholder: true, assessment: "ambiguous" };
  }
  if (scaffoldValue === liveValue) {
    // Boilerplate on both sides: nothing to restore TO.
    return { isPlaceholder: true, assessment: "corrupt_unrestorable" };
  }
  return { isPlaceholder: true, assessment: "likely_corrupt_repairable" };
}

export interface MoveLayers {
  moveId: string;
  tenantKey: string;
  moveName: string;
  /** `engagements.charter.scaffold` */
  scaffold: Record<string, unknown>;
  /** `engagements.charter` top level */
  charter: Record<string, unknown>;
  /** phase_0 capture values keyed by capture section key. */
  captureValues: Record<string, unknown>;
}

export function diagnoseMove(layers: MoveLayers): MoveDiagnosis {
  const fields: FieldDiagnosis[] = OVERWRITABLE_CAPTURE_KEYS.map(
    (captureKey) => {
      const scaffoldKey = SCAFFOLD_SOURCE_KEYS[captureKey];
      const scaffoldValue = scaffoldKey
        ? text(layers.scaffold[scaffoldKey])
        : "";
      const captureValue = text(layers.captureValues[captureKey]);

      const mirrorKey = CHARTER_MIRROR_TARGETS[captureKey];
      const mirrorApplicable = Boolean(mirrorKey);
      const charterMirrorValue = mirrorApplicable
        ? text(layers.charter[mirrorKey])
        : null;

      const capture = assessLayer(captureValue, scaffoldValue, true);
      const charter = assessLayer(
        charterMirrorValue ?? "",
        scaffoldValue,
        mirrorApplicable,
      );

      return {
        captureKey,
        scaffoldValue,
        charterMirrorValue,
        captureValue,
        captureIsPlaceholder: capture.isPlaceholder,
        charterMirrorIsPlaceholder: charter.isPlaceholder,
        captureAssessment: capture.assessment,
        charterAssessment: charter.assessment,
        captureAction: recommendedActionFor(capture.assessment),
        charterAction: recommendedActionFor(charter.assessment),
      };
    },
  );

  const corruptCaptureKeys = fields
    .filter((f) => DAMAGED.has(f.captureAssessment))
    .map((f) => f.captureKey);
  const corruptCharterKeys = fields
    .filter((f) => DAMAGED.has(f.charterAssessment))
    .map((f) => f.captureKey);
  const needsReview: ReadonlySet<FieldAssessment> = new Set<FieldAssessment>([
    "corrupt_unrestorable",
    "ambiguous",
  ]);
  const ambiguousKeys = Array.from(
    new Set(
      fields
        .filter(
          (f) =>
            needsReview.has(f.captureAssessment) ||
            needsReview.has(f.charterAssessment),
        )
        .map((f) => f.captureKey),
    ),
  );

  const affected =
    corruptCaptureKeys.length > 0 || corruptCharterKeys.length > 0;

  return {
    moveId: layers.moveId,
    tenantKey: layers.tenantKey,
    moveName: layers.moveName,
    fields,
    affected,
    corruptCaptureKeys,
    corruptCharterKeys,
    ambiguousKeys,
    fullyRestorable: affected && ambiguousKeys.length === 0,
  };
}

export interface BlastRadiusSummary {
  movesScanned: number;
  /** Moves with at least one corrupt field in either layer. */
  movesAffected: number;
  movesWithCorruptCapture: number;
  movesWithCorruptCharterMirror: number;
  /** Affected Moves where every corrupt field has a deterministic restore source. */
  movesFullyRestorable: number;
  /** Affected Moves with at least one field needing human review. */
  movesNeedingReview: number;
  tenantsAffected: string[];
  /** Per-field totals across every affected Move, for sizing the repair. */
  corruptFieldCounts: Record<string, number>;
}

export function summarizeBlastRadius(
  diagnoses: readonly MoveDiagnosis[],
): BlastRadiusSummary {
  const affected = diagnoses.filter((d) => d.affected);
  const corruptFieldCounts: Record<string, number> = {};
  for (const d of affected) {
    for (const key of new Set([
      ...d.corruptCaptureKeys,
      ...d.corruptCharterKeys,
    ])) {
      corruptFieldCounts[key] = (corruptFieldCounts[key] ?? 0) + 1;
    }
  }
  return {
    movesScanned: diagnoses.length,
    movesAffected: affected.length,
    movesWithCorruptCapture: affected.filter(
      (d) => d.corruptCaptureKeys.length > 0,
    ).length,
    movesWithCorruptCharterMirror: affected.filter(
      (d) => d.corruptCharterKeys.length > 0,
    ).length,
    movesFullyRestorable: affected.filter((d) => d.fullyRestorable).length,
    movesNeedingReview: affected.filter((d) => d.ambiguousKeys.length > 0)
      .length,
    tenantsAffected: Array.from(
      new Set(affected.map((d) => d.tenantKey)),
    ).sort(),
    corruptFieldCounts,
  };
}
