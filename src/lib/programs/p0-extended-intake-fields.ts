// =============================================================================
// P0 Extended Intake Fields — charter JSONB transformer
// -----------------------------------------------------------------------------
// Same seam as discovery/charter-transformers.ts: pure embed/read of a small
// bundle inside the existing `engagements.charter` JSONB, gated by
// `moves_extended_intake_fields_v1`. Deliberately NOT wired through
// phase-capture-contract.ts's P0_CAPTURE_SECTIONS — that array is read by the
// P1+ phase workspace and gate-evaluation for every tenant, so adding
// sections there would surface new rows to tenants who never opted in. This
// module keeps the fields fully isolated: flag off = charter written is
// byte-identical to today's behaviour.
//
// Field shape follows the PHS Capture Template's Field Guide distinction:
// Business Segment is a GROUNDED FACT (the tenant's real org structure, e.g.
// Meridian's 01b_business_segments.csv), while Office Lens and Care Type are
// ANALYTICAL LENSES applied for prioritization, not a claim about how the
// tenant is organized.
// =============================================================================

const EXTENDED_INTAKE_KEY = "p0_extended_intake_fields_v1";

/**
 * Complexity tier — a named owner's explicit classification, not an
 * auto-derived score (the signals to derive it faithfully — data-source
 * count, new-PHI-path or not, output type — aren't captured yet). Set
 * alongside Business Segment/Office Lens/Care Type since the source model
 * describes tagging and tier-setting as one action, not two.
 */
export type MoveTier = "Straightforward" | "Substantial" | "Complex";

export const MOVE_TIER_OPTIONS: readonly MoveTier[] = [
  "Straightforward",
  "Substantial",
  "Complex",
];

export interface ExtendedIntakeFields {
  /** Grounded fact — the tenant's own business-segment taxonomy. */
  businessSegment?: string | null;
  /** Analytical lens — front/middle/back/enterprise, not an org chart. */
  officeLens?: string | null;
  /** Analytical lens — clinical vs. non-clinical (or equivalent per tenant). */
  careType?: string | null;
  /** The number expected to move, and roughly by how much. */
  valueHypothesisQuant?: string | null;
  /** What would feel different day-to-day, even without a number attached. */
  valueHypothesisQual?: string | null;
  /** Who else needs to be involved, beyond the named sponsor. */
  stakeholders?: string | null;
  /** Complexity tier — gates the P1→P5 fast lane when 'straightforward'. */
  tier?: MoveTier | null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasAnyValue(fields: ExtendedIntakeFields): boolean {
  return Object.values(fields).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
}

/** Embed the bundle into a charter. Empty/null input leaves the charter untouched. */
export function embedExtendedIntakeFieldsInCharter(
  charter: Record<string, unknown>,
  fields: ExtendedIntakeFields | null | undefined,
): Record<string, unknown> {
  if (!fields || !hasAnyValue(fields)) return charter;
  return { ...charter, [EXTENDED_INTAKE_KEY]: fields };
}

/** Safe read of the bundle — null for legacy/malformed charters. */
export function readExtendedIntakeFieldsFromCharter(
  charter: Record<string, unknown> | null,
): ExtendedIntakeFields | null {
  if (!charter) return null;
  const v = charter[EXTENDED_INTAKE_KEY];
  return isPlainObject(v) ? (v as unknown as ExtendedIntakeFields) : null;
}

/**
 * P0 gate helper: embed the bundle only when the feature flag is on AND at
 * least one field was captured. Pure — the flag decision is passed in, so the
 * wiring stays unit-testable without a live tenant or DB. No-op (same
 * reference) otherwise.
 */
export function applyExtendedIntakeFieldsIfEnabled(
  charter: Record<string, unknown>,
  fields: ExtendedIntakeFields | null | undefined,
  flagEnabled: boolean,
): Record<string, unknown> {
  if (!flagEnabled || !fields) return charter;
  return embedExtendedIntakeFieldsInCharter(charter, fields);
}

/**
 * Read the Move's complexity tier straight off a charter, with no flag
 * dependency — governance.ts calls this directly (it already has `program`,
 * not raw submission input) and applies its OWN separate flag
 * (`moves_classify_fast_lane_v1`) before acting on the result. Returns null
 * for legacy/malformed charters or an unrecognized tier value.
 */
export function resolveMoveTier(
  charter: Record<string, unknown> | null,
): MoveTier | null {
  const tier = readExtendedIntakeFieldsFromCharter(charter)?.tier;
  return tier && (MOVE_TIER_OPTIONS as readonly string[]).includes(tier)
    ? tier
    : null;
}
