// Source · vendor pricing submissions · types
//
// Mirrors the schema from
// supabase/migrations/20260508040000_source_event_pricing_submissions.sql.

export type ParseStatus = 'parsed' | 'partial' | 'failed';

export interface ParseWarning {
  /** Stable code for grouping (e.g. 'missing_unit_price'). */
  code: string;
  /** Human-readable message for surfacing in the buyer UI. */
  message: string;
}

export interface AssumptionDeviation {
  /** Assumption key from the locked d21 set. */
  assumptionKey: string;
  /** Vendor's proposed alternative (free-form). */
  proposedAlternative: string;
  /** Severity hint. */
  severity: 'low' | 'medium' | 'high';
}

/** Read shape — what the DAO returns. */
export interface VendorPricingSubmissionRow {
  id: string;
  sourceEventId: string;
  tenantKey: string;
  vendorName: string;
  submittedAt: string;
  uploadedByUserId: string | null;
  uploadedFilename: string | null;
  unitPricesById: Record<string, number>;
  vendorNotesById: Record<string, string>;
  pricingNotes: string;
  assumptionDeviations: AssumptionDeviation[];
  parseStatus: ParseStatus;
  parseWarnings: ParseWarning[];
  supersededBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Insert shape — what the upload route hands to the DAO. */
export interface VendorPricingSubmissionInsert {
  sourceEventId: string;
  tenantKey: string;
  vendorName: string;
  uploadedByUserId: string | null;
  uploadedFilename: string | null;
  unitPricesById: Record<string, number>;
  vendorNotesById: Record<string, string>;
  pricingNotes: string;
  assumptionDeviations: AssumptionDeviation[];
  parseStatus: ParseStatus;
  parseWarnings: ParseWarning[];
}
