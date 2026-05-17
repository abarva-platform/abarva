// Source · Artifact disclosure-classification flag · Wave C1 · types.
//
// GAP-9 from FIRSTCAPITAL-LOOP-WIRING-GAPS.md: sourcing / deliverable
// artifacts carry a `dataClassification` (Public…Restricted) — a
// *sensitivity* axis — but no flag for whether the content is
// legal-privileged. The First Capital scenario states AML KPIs and every
// downstream artifact carry legal-privileged disclosure that must travel
// with the artifact from Intelligence → Move → Source → Tower.
//
// Sensitivity and disclosure are orthogonal: a Confidential artifact may
// or may not be privileged; privilege is about *who may compel its
// disclosure and how it must be handled in legal process*, not about how
// secret it is. This module adds the missing typed disclosure axis as a
// pure value object that attaches to an artifact without a schema
// change — it is derivable from existing fields and carryable in app
// state, so GAP-9's persistence is a clean, optional follow-up.
//
// Pure: no I/O, no DB, no model calls.

/**
 * The disclosure-classification axis. Distinct from data-sensitivity:
 * - `none`                — no special disclosure handling.
 * - `attorney_client`     — attorney-client privileged communication.
 * - `work_product`        — attorney work product (litigation/anticipation).
 * - `privileged_and_confidential` — both privileges asserted; the
 *                           strongest routine marking for regulated-AI
 *                           and consent-order material.
 * - `regulator_restricted` — prepared for / shared with a regulator under
 *                           a supervisory or examination protection; not
 *                           privilege per se, but compelled-disclosure
 *                           scoped and must not leak outside that channel.
 */
export const DISCLOSURE_CLASSIFICATIONS = [
  'none',
  'attorney_client',
  'work_product',
  'privileged_and_confidential',
  'regulator_restricted',
] as const;

export type DisclosureClassification =
  (typeof DISCLOSURE_CLASSIFICATIONS)[number];

/** The disclosure classifications that assert legal privilege. */
export const PRIVILEGED_CLASSIFICATIONS: readonly DisclosureClassification[] = [
  'attorney_client',
  'work_product',
  'privileged_and_confidential',
];

/**
 * How the flag came to be set — the provenance of the classification,
 * so an audit trail can show whether a human or an inheritance rule
 * applied it.
 * - `explicit`    — set deliberately by a user / counsel.
 * - `inherited`   — carried from an upstream artifact in the loop.
 * - `policy`      — applied by a tenant disclosure policy / rule.
 * - `default`     — the unset default (`none`).
 */
export const DISCLOSURE_FLAG_SOURCES = [
  'explicit',
  'inherited',
  'policy',
  'default',
] as const;

export type DisclosureFlagSource = (typeof DISCLOSURE_FLAG_SOURCES)[number];

/**
 * The typed disclosure flag that travels with an artifact. A value
 * object — attach it to any sourcing / deliverable artifact record.
 */
export interface ArtifactDisclosureFlag {
  readonly classification: DisclosureClassification;
  /** True iff the classification asserts legal privilege. */
  readonly privileged: boolean;
  /** How the classification was set. */
  readonly setBy: DisclosureFlagSource;
  /**
   * The privilege holder — the counsel function whose privilege is
   * asserted (e.g. `General Counsel`). Empty when not privileged.
   */
  readonly privilegeHolder: string;
  /**
   * Free-text basis — why the flag is set, e.g. "Consent-order
   * remediation analysis prepared at the direction of counsel". Empty
   * when `none`.
   */
  readonly basis: string;
  /**
   * The id of the upstream artifact this flag was inherited from, when
   * `setBy === 'inherited'`; null otherwise. This is what makes the
   * legal-privileged marking *travel* the loop.
   */
  readonly inheritedFromArtifactId: string | null;
}

/** The handling obligations a privileged flag imposes downstream. */
export interface DisclosureHandlingRequirements {
  /** Must the artifact carry a visible privileged-disclosure legend? */
  readonly requiresLegend: boolean;
  /** The legend text to render, or empty when none is required. */
  readonly legendText: string;
  /** Must export / sharing be restricted to a counsel-controlled channel? */
  readonly restrictExport: boolean;
  /** Must any derived / downstream artifact inherit this classification? */
  readonly propagatesToDerivedArtifacts: boolean;
  /** One-line operator-facing summary of the obligation. */
  readonly summary: string;
}
