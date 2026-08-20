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
