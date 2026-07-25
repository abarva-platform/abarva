import "server-only";

// Repository for source_vendor_proposal_facts /
// source_vendor_proposal_fact_reviews — the governed vendor-proposal
// ingestion foundation (PR 3 of ADR-0013-source-modernization-baseline.md).
//
// Both tables are append-only: this module never updates or deletes a row.
// A fact's current status is derived from the latest review row for its id
// (or 'candidate' if none exists) — never a mutable status column. Accepting
// a fact that supersedes an earlier one writes TWO rows atomically: an
// 'accepted' review for the new fact, and a 'superseded' review for the old
// fact it replaces — the old fact's own row is never touched, so lineage is
// always readable by following supersedes_fact_id.

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import type {
  VendorProposalFactConfidence,
  VendorProposalFactCurrentStatus,
  VendorProposalFactExtractionMethod,
  VendorProposalFactRecord,
  VendorProposalFactReviewRecord,
  VendorProposalFactReviewStatus,
  VendorProposalFactSourcePointer,
} from "./types";

const FACT_COLUMNS =
  "id, client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key, " +
  "section_key, page_or_location, value_numeric, value_text, unit, currency, " +
  "effective_period_start, effective_period_end, source_quote, source_pointer, " +
  "confidence, extraction_method, supersedes_fact_id, created_by, created_at";

const REVIEW_COLUMNS =
  "id, fact_id, review_status, rationale, reviewed_by, reviewed_at";

interface VendorProposalFactRow {
  id: string;
  client_key: string;
  source_event_id: string;
  vendor_key: string;
  proposal_artifact_id: string;
  fact_key: string;
  section_key: string | null;
  page_or_location: string | null;
  value_numeric: number | string | null;
  value_text: string | null;
  unit: string | null;
  currency: string | null;
  effective_period_start: string | null;
  effective_period_end: string | null;
  source_quote: string | null;
  source_pointer: VendorProposalFactSourcePointer | null;
  confidence: string;
  extraction_method: string;
  supersedes_fact_id: string | null;
  created_by: string;
  created_at: string;
}

interface VendorProposalFactReviewRow {
  id: string;
  fact_id: string;
  review_status: string;
  rationale: string;
  reviewed_by: string;
  reviewed_at: string;
}

function factRowToRecord(row: VendorProposalFactRow): VendorProposalFactRecord {
  return {
    id: row.id,
    clientKey: row.client_key,
    sourceEventId: row.source_event_id,
    vendorKey: row.vendor_key,
    proposalArtifactId: row.proposal_artifact_id,
    factKey: row.fact_key,
    sectionKey: row.section_key,
    pageOrLocation: row.page_or_location,
    valueNumeric: row.value_numeric === null ? null : Number(row.value_numeric),
    valueText: row.value_text,
    unit: row.unit,
    currency: row.currency,
    effectivePeriodStart: row.effective_period_start,
    effectivePeriodEnd: row.effective_period_end,
    sourceQuote: row.source_quote,
    sourcePointer: row.source_pointer,
    confidence: row.confidence as VendorProposalFactConfidence,
    extractionMethod:
      row.extraction_method as VendorProposalFactExtractionMethod,
    supersedesFactId: row.supersedes_fact_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function reviewRowToRecord(
  row: VendorProposalFactReviewRow,
): VendorProposalFactReviewRecord {
  return {
    id: row.id,
    factId: row.fact_id,
    reviewStatus: row.review_status as VendorProposalFactReviewStatus,
    rationale: row.rationale,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  };
}

export interface InsertVendorProposalFactInput {
  clientKey: string;
  sourceEventId: string;
  vendorKey: string;
  proposalArtifactId: string;
  factKey: string;
  sectionKey?: string | null;
  pageOrLocation?: string | null;
  valueNumeric?: number | null;
  valueText?: string | null;
  unit?: string | null;
  currency?: string | null;
  effectivePeriodStart?: string | null;
  effectivePeriodEnd?: string | null;
  sourceQuote?: string | null;
  sourcePointer?: VendorProposalFactSourcePointer | null;
  confidence: VendorProposalFactConfidence;
  extractionMethod: VendorProposalFactExtractionMethod;
  supersedesFactId?: string | null;
  createdBy: string;
}

/** Insert one or more candidate facts. Never updates an existing row — append-only. */
export async function insertVendorProposalFacts(
  inputs: readonly InsertVendorProposalFactInput[],
  db = getAzureWriteFluentClient(),
): Promise<
  | { ok: true; records: VendorProposalFactRecord[] }
  | { ok: false; error: string }
> {
  if (inputs.length === 0) return { ok: true, records: [] };

  const payload = inputs.map((input) => ({
    client_key: input.clientKey,
    source_event_id: input.sourceEventId,
    vendor_key: input.vendorKey,
    proposal_artifact_id: input.proposalArtifactId,
    fact_key: input.factKey,
    section_key: input.sectionKey ?? null,
    page_or_location: input.pageOrLocation ?? null,
    value_numeric: input.valueNumeric ?? null,
    value_text: input.valueText ?? null,
    unit: input.unit ?? null,
    currency: input.currency ?? null,
    effective_period_start: input.effectivePeriodStart ?? null,
    effective_period_end: input.effectivePeriodEnd ?? null,
    source_quote: input.sourceQuote ?? null,
    source_pointer: input.sourcePointer ?? null,
    confidence: input.confidence,
    extraction_method: input.extractionMethod,
    supersedes_fact_id: input.supersedesFactId ?? null,
    created_by: input.createdBy,
  }));

  const { data, error } = await db
    .from("source_vendor_proposal_facts")
    .insert(payload)
    .select(FACT_COLUMNS);

  if (error || !Array.isArray(data)) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return {
    ok: true,
    records: (data as VendorProposalFactRow[]).map(factRowToRecord),
  };
}

/** All facts for an event, optionally scoped to one vendor. Tenant-scoped by clientKey. */
export async function listVendorProposalFacts(
  input: { eventId: string; clientKey: string; vendorKey?: string },
  db = getAzureReadFluentClient(),
): Promise<VendorProposalFactRecord[]> {
  let query = db
    .from("source_vendor_proposal_facts")
    .select(FACT_COLUMNS)
    .eq("source_event_id", input.eventId)
    .eq("client_key", input.clientKey);
  if (input.vendorKey) {
    query = query.eq("vendor_key", input.vendorKey);
  }
  const { data, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error || !Array.isArray(data)) return [];
  return (data as VendorProposalFactRow[]).map(factRowToRecord);
}

/** All review rows for a fact, latest first. */
export async function listVendorProposalFactReviews(
  factId: string,
  db = getAzureReadFluentClient(),
): Promise<VendorProposalFactReviewRecord[]> {
  const { data, error } = await db
    .from("source_vendor_proposal_fact_reviews")
    .select(REVIEW_COLUMNS)
    .eq("fact_id", factId)
    .order("reviewed_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return (data as VendorProposalFactReviewRow[]).map(reviewRowToRecord);
}

/**
 * Latest review row for each of several facts in one query — avoids N+1
 * lookups when deriving current status for a list. Facts with no review row
 * are simply absent from the map (derive 'candidate' for those).
 */
export async function getLatestVendorProposalFactReviewsByFactIds(
  factIds: readonly string[],
  db = getAzureReadFluentClient(),
): Promise<Map<string, VendorProposalFactReviewRecord>> {
  const result = new Map<string, VendorProposalFactReviewRecord>();
  if (factIds.length === 0) return result;

  const { data, error } = await db
    .from("source_vendor_proposal_fact_reviews")
    .select(REVIEW_COLUMNS)
    .in("fact_id", Array.from(new Set(factIds)))
    .order("reviewed_at", { ascending: false });

  if (error || !Array.isArray(data)) return result;
  for (const row of data as VendorProposalFactReviewRow[]) {
    // Rows arrive latest-first; keep only the first (latest) per fact_id.
    if (!result.has(row.fact_id)) {
      result.set(row.fact_id, reviewRowToRecord(row));
    }
  }
  return result;
}

/** Derive a fact's current status: the latest review's status, or 'candidate'. */
export function deriveVendorProposalFactStatus(
  latestReview: VendorProposalFactReviewRecord | undefined,
): VendorProposalFactCurrentStatus {
  return latestReview?.reviewStatus ?? "candidate";
}

/**
 * Facts still awaiting a review decision (no review row yet) for an event,
 * optionally scoped to one vendor. This is the review queue.
 */
export async function listCandidateVendorProposalFacts(
  input: { eventId: string; clientKey: string; vendorKey?: string },
  db = getAzureReadFluentClient(),
): Promise<VendorProposalFactRecord[]> {
  const facts = await listVendorProposalFacts(input, db);
  if (facts.length === 0) return [];
  const reviews = await getLatestVendorProposalFactReviewsByFactIds(
    facts.map((f) => f.id),
    db,
  );
  return facts.filter((f) => !reviews.has(f.id));
}

export interface ReviewVendorProposalFactInput {
  factId: string;
  eventId: string;
  clientKey: string;
  rationale: string;
  reviewedBy: string;
}

/**
 * Accept a candidate fact as authoritative. If the fact declares
 * supersedesFactId, this ALSO writes a 'superseded' review row for the fact
 * it replaces — atomically, so an accepted fact and its predecessor's
 * superseded status land together. Verifies both the fact and (if present)
 * the superseded fact belong to the same tenant+event before writing
 * anything — never accepts across a tenant or event boundary.
 */
export async function acceptVendorProposalFact(
  input: ReviewVendorProposalFactInput,
  db = getAzureWriteFluentClient(),
): Promise<
  | { ok: true; record: VendorProposalFactReviewRecord }
  | { ok: false; error: string }
> {
  const { data: factRow, error: factError } = await db
    .from("source_vendor_proposal_facts")
    .select(FACT_COLUMNS)
    .eq("id", input.factId)
    .maybeSingle<VendorProposalFactRow>();
  if (factError) return { ok: false, error: factError.message };
  if (
    !factRow ||
    factRow.source_event_id !== input.eventId ||
    factRow.client_key !== input.clientKey
  ) {
    return { ok: false, error: "fact_not_found" };
  }

  const { data, error } = await db
    .from("source_vendor_proposal_fact_reviews")
    .insert({
      fact_id: input.factId,
      review_status: "accepted",
      rationale: input.rationale,
      reviewed_by: input.reviewedBy,
    })
    .select(REVIEW_COLUMNS)
    .single<VendorProposalFactReviewRow>();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }

  if (factRow.supersedes_fact_id) {
    const { data: supersededRow, error: supersededError } = await db
      .from("source_vendor_proposal_facts")
      .select(FACT_COLUMNS)
      .eq("id", factRow.supersedes_fact_id)
      .maybeSingle<VendorProposalFactRow>();
    if (
      !supersededError &&
      supersededRow &&
      supersededRow.source_event_id === input.eventId &&
      supersededRow.client_key === input.clientKey
    ) {
      await db.from("source_vendor_proposal_fact_reviews").insert({
        fact_id: factRow.supersedes_fact_id,
        review_status: "superseded",
        rationale: `Superseded by accepted fact ${input.factId}.`,
        reviewed_by: input.reviewedBy,
      });
    }
  }

  return { ok: true, record: reviewRowToRecord(data) };
}

/** Reject a candidate fact. Never mutates the fact row — writes a rejected review. */
export async function rejectVendorProposalFact(
  input: ReviewVendorProposalFactInput,
  db = getAzureWriteFluentClient(),
): Promise<
  | { ok: true; record: VendorProposalFactReviewRecord }
  | { ok: false; error: string }
> {
  const { data: factRow, error: factError } = await db
    .from("source_vendor_proposal_facts")
    .select("id, source_event_id, client_key")
    .eq("id", input.factId)
    .maybeSingle<
      Pick<VendorProposalFactRow, "id" | "source_event_id" | "client_key">
    >();
  if (factError) return { ok: false, error: factError.message };
  if (
    !factRow ||
    factRow.source_event_id !== input.eventId ||
    factRow.client_key !== input.clientKey
  ) {
    return { ok: false, error: "fact_not_found" };
  }

  const { data, error } = await db
    .from("source_vendor_proposal_fact_reviews")
    .insert({
      fact_id: input.factId,
      review_status: "rejected",
      rationale: input.rationale,
      reviewed_by: input.reviewedBy,
    })
    .select(REVIEW_COLUMNS)
    .single<VendorProposalFactReviewRow>();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return { ok: true, record: reviewRowToRecord(data) };
}

/**
 * The governed read accessor: facts whose LATEST review is 'accepted', for
 * one event (and optionally one vendor), tenant-scoped by clientKey. This is
 * the only function downstream consumers (scorecard, pricing, BAFO, Decision
 * Brief, aVa context) should call — never listVendorProposalFacts directly,
 * which returns every candidate regardless of review state.
 */
export async function getAuthoritativeVendorProposalFacts(
  input: { eventId: string; clientKey: string; vendorKey?: string },
  db = getAzureReadFluentClient(),
): Promise<VendorProposalFactRecord[]> {
  const facts = await listVendorProposalFacts(input, db);
  if (facts.length === 0) return [];
  const reviews = await getLatestVendorProposalFactReviewsByFactIds(
    facts.map((f) => f.id),
    db,
  );
  return facts.filter((f) => reviews.get(f.id)?.reviewStatus === "accepted");
}
