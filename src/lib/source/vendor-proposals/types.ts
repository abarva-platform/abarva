// Vendor proposal facts — TS mirror of
// supabase/migrations/20260725190000_source_vendor_proposal_facts.sql.
// Keep in lockstep with that migration.

/** Confidence is derived from HOW a fact was captured, not a free literal. */
export type VendorProposalFactConfidence = "low" | "med" | "high";

export type VendorProposalFactExtractionMethod =
  | "parsed_text"
  | "parsed_xlsx_cell"
  | "parsed_pdf_table"
  | "manual_entry";

/** A structured locator into the source document — page, cell, paragraph, etc. */
export interface VendorProposalFactSourcePointer {
  doc: string;
  locator: string;
}

/**
 * One EXTRACTED candidate fact. This table is append-only — a row is never
 * updated. The fact's current review status is NOT a column on this row; it
 * is derived from the latest row in source_vendor_proposal_fact_reviews for
 * this id (see getVendorProposalFactReviewStatus in the repository).
 */
export interface VendorProposalFactRecord {
  id: string;
  clientKey: string;
  sourceEventId: string;
  vendorKey: string;
  proposalArtifactId: string;
  factKey: string;
  sectionKey: string | null;
  pageOrLocation: string | null;
  valueNumeric: number | null;
  valueText: string | null;
  unit: string | null;
  currency: string | null;
  effectivePeriodStart: string | null;
  effectivePeriodEnd: string | null;
  sourceQuote: string | null;
  sourcePointer: VendorProposalFactSourcePointer | null;
  confidence: VendorProposalFactConfidence;
  extractionMethod: VendorProposalFactExtractionMethod;
  supersedesFactId: string | null;
  createdBy: string;
  createdAt: string;
}

/** The three-state (four-value) review-decision vocabulary. */
export type VendorProposalFactReviewStatus =
  | "accepted"
  | "rejected"
  | "superseded";

/** A fact's derived current status — 'candidate' when no review row exists yet. */
export type VendorProposalFactCurrentStatus =
  | "candidate"
  | VendorProposalFactReviewStatus;

export interface VendorProposalFactReviewRecord {
  id: string;
  factId: string;
  reviewStatus: VendorProposalFactReviewStatus;
  rationale: string;
  reviewedBy: string;
  reviewedAt: string;
}
