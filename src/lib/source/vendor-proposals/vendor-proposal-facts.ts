import "server-only";

// Repository for source_vendor_proposal_facts /
// source_vendor_proposal_fact_reviews — the governed vendor-proposal
// ingestion foundation (PR 3, ADR-0013-source-modernization-baseline.md),
// rewired for real DB-enforced tenant isolation (RLS/tenant-isolation
// workstream, PR A). Every query in this module now runs through
// withVendorProposalFactsSession — the connection is switched to the
// restricted `authenticated` Postgres role with `request.jwt.claims` set to
// the caller's real, server-resolved identity, so the RLS policies on both
// tables (supabase/migrations/20260726010000_vendor_proposal_facts_rls.sql)
// are a REAL second line of defense, not just an enabled-but-inert policy.
// Every query ALSO still carries an explicit client_key/source_event_id
// WHERE clause — defense in depth, not "RLS instead of the app check."
//
// Both tables are append-only: this module never updates or deletes a row.
// A fact's current status is derived from the latest review row for its id
// (or 'candidate' if none exists) — never a mutable status column. Accepting
// a fact that supersedes an earlier one writes TWO rows atomically (now a
// REAL single-transaction atomicity, not just sequential awaits): an
// 'accepted' review for the new fact, and a 'superseded' review for the old
// fact it replaces — the old fact's own row is never touched, so lineage is
// always readable by following supersedes_fact_id.

import {
  withVendorProposalFactsSession,
  type VendorProposalFactsIdentity,
} from "./tenant-scoped-session";
import type {
  VendorProposalFactConfidence,
  VendorProposalFactCurrentStatus,
  VendorProposalFactExtractionMethod,
  VendorProposalFactRecord,
  VendorProposalFactReviewRecord,
  VendorProposalFactReviewStatus,
  VendorProposalFactSourcePointer,
} from "./types";

export type { VendorProposalFactsIdentity } from "./tenant-scoped-session";

const FACT_COLUMNS =
  "id, client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key, " +
  "section_key, page_or_location, value_numeric, value_text, unit, currency, " +
  "effective_period_start, effective_period_end, source_quote, source_pointer, " +
  "confidence, extraction_method, supersedes_fact_id, created_by, created_at";

const REVIEW_COLUMNS =
  "id, fact_id, client_key, source_event_id, review_status, rationale, reviewed_by, reviewed_at";

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
  client_key: string;
  source_event_id: string;
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface InsertVendorProposalFactInput {
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

/**
 * Insert one or more candidate facts, tagged with the caller's real
 * identity.tenantKey — never a client_key the caller passes in. Never
 * updates an existing row — append-only.
 */
export async function insertVendorProposalFacts(
  identity: VendorProposalFactsIdentity,
  inputs: readonly InsertVendorProposalFactInput[],
): Promise<
  | { ok: true; records: VendorProposalFactRecord[] }
  | { ok: false; error: string }
> {
  if (inputs.length === 0) return { ok: true, records: [] };

  try {
    const records = await withVendorProposalFactsSession(
      identity,
      async (run) => {
        const rows: VendorProposalFactRow[] = [];
        for (const input of inputs) {
          const inserted = await run<VendorProposalFactRow>(
            `INSERT INTO source_vendor_proposal_facts (
             client_key, source_event_id, vendor_key, proposal_artifact_id, fact_key,
             section_key, page_or_location, value_numeric, value_text, unit, currency,
             effective_period_start, effective_period_end, source_quote, source_pointer,
             confidence, extraction_method, supersedes_fact_id, created_by
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
             $15::jsonb, $16, $17, $18, $19
           ) RETURNING ${FACT_COLUMNS}`,
            [
              identity.tenantKey,
              input.sourceEventId,
              input.vendorKey,
              input.proposalArtifactId,
              input.factKey,
              input.sectionKey ?? null,
              input.pageOrLocation ?? null,
              input.valueNumeric ?? null,
              input.valueText ?? null,
              input.unit ?? null,
              input.currency ?? null,
              input.effectivePeriodStart ?? null,
              input.effectivePeriodEnd ?? null,
              input.sourceQuote ?? null,
              input.sourcePointer ? JSON.stringify(input.sourcePointer) : null,
              input.confidence,
              input.extractionMethod,
              input.supersedesFactId ?? null,
              input.createdBy,
            ],
          );
          rows.push(inserted[0]!);
        }
        return rows;
      },
    );
    return { ok: true, records: records.map(factRowToRecord) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

/** All facts for an event, optionally scoped to one vendor. Tenant-scoped by identity.tenantKey. */
export async function listVendorProposalFacts(
  identity: VendorProposalFactsIdentity,
  input: { eventId: string; vendorKey?: string },
): Promise<VendorProposalFactRecord[]> {
  try {
    return await withVendorProposalFactsSession(identity, async (run) => {
      const params: unknown[] = [input.eventId, identity.tenantKey];
      let vendorFilter = "";
      if (input.vendorKey) {
        params.push(input.vendorKey);
        vendorFilter = ` AND vendor_key = $${params.length}`;
      }
      const rows = await run<VendorProposalFactRow>(
        `SELECT ${FACT_COLUMNS} FROM source_vendor_proposal_facts
         WHERE source_event_id = $1 AND client_key = $2${vendorFilter}
         ORDER BY created_at DESC`,
        params,
      );
      return rows.map(factRowToRecord);
    });
  } catch {
    return [];
  }
}

/** All review rows for a fact, latest first. Tenant-scoped by identity.tenantKey. */
export async function listVendorProposalFactReviews(
  identity: VendorProposalFactsIdentity,
  factId: string,
): Promise<VendorProposalFactReviewRecord[]> {
  try {
    return await withVendorProposalFactsSession(identity, async (run) => {
      const rows = await run<VendorProposalFactReviewRow>(
        `SELECT ${REVIEW_COLUMNS} FROM source_vendor_proposal_fact_reviews
         WHERE fact_id = $1 AND client_key = $2
         ORDER BY reviewed_at DESC`,
        [factId, identity.tenantKey],
      );
      return rows.map(reviewRowToRecord);
    });
  } catch {
    return [];
  }
}

/**
 * Latest review row for each of several facts in one query — avoids N+1
 * lookups when deriving current status for a list. Facts with no review row
 * are simply absent from the map (derive 'candidate' for those).
 */
export async function getLatestVendorProposalFactReviewsByFactIds(
  identity: VendorProposalFactsIdentity,
  factIds: readonly string[],
): Promise<Map<string, VendorProposalFactReviewRecord>> {
  const result = new Map<string, VendorProposalFactReviewRecord>();
  if (factIds.length === 0) return result;

  try {
    return await withVendorProposalFactsSession(identity, async (run) => {
      const rows = await run<VendorProposalFactReviewRow>(
        `SELECT ${REVIEW_COLUMNS} FROM source_vendor_proposal_fact_reviews
         WHERE fact_id = ANY($1::uuid[]) AND client_key = $2
         ORDER BY reviewed_at DESC`,
        [Array.from(new Set(factIds)), identity.tenantKey],
      );
      // Rows arrive latest-first; keep only the first (latest) per fact_id.
      for (const row of rows) {
        if (!result.has(row.fact_id)) {
          result.set(row.fact_id, reviewRowToRecord(row));
        }
      }
      return result;
    });
  } catch {
    return result;
  }
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
  identity: VendorProposalFactsIdentity,
  input: { eventId: string; vendorKey?: string },
): Promise<VendorProposalFactRecord[]> {
  const facts = await listVendorProposalFacts(identity, input);
  if (facts.length === 0) return [];
  const reviews = await getLatestVendorProposalFactReviewsByFactIds(
    identity,
    facts.map((f) => f.id),
  );
  return facts.filter((f) => !reviews.has(f.id));
}

export interface ReviewVendorProposalFactInput {
  factId: string;
  eventId: string;
  rationale: string;
  reviewedBy: string;
}

/**
 * Accept a candidate fact as authoritative. If the fact declares
 * supersedesFactId, this ALSO writes a 'superseded' review row for the fact
 * it replaces — atomically, in the SAME transaction, so an accepted fact and
 * its predecessor's superseded status land together or not at all. Both the
 * fact lookup and the superseded-fact lookup filter by identity.tenantKey +
 * eventId directly in SQL (not just a post-fetch JS check) — never accepts
 * across a tenant or event boundary.
 */
export async function acceptVendorProposalFact(
  identity: VendorProposalFactsIdentity,
  input: ReviewVendorProposalFactInput,
): Promise<
  | { ok: true; record: VendorProposalFactReviewRecord }
  | { ok: false; error: string }
> {
  try {
    return await withVendorProposalFactsSession(identity, async (run) => {
      const factRows = await run<VendorProposalFactRow>(
        `SELECT ${FACT_COLUMNS} FROM source_vendor_proposal_facts
         WHERE id = $1 AND source_event_id = $2 AND client_key = $3
         LIMIT 1`,
        [input.factId, input.eventId, identity.tenantKey],
      );
      const factRow = factRows[0];
      if (!factRow) return { ok: false, error: "fact_not_found" };

      const reviewRows = await run<VendorProposalFactReviewRow>(
        `INSERT INTO source_vendor_proposal_fact_reviews
           (fact_id, client_key, source_event_id, review_status, rationale, reviewed_by)
         VALUES ($1, $2, $3, 'accepted', $4, $5)
         RETURNING ${REVIEW_COLUMNS}`,
        [
          input.factId,
          identity.tenantKey,
          input.eventId,
          input.rationale,
          input.reviewedBy,
        ],
      );
      const reviewRow = reviewRows[0]!;

      if (factRow.supersedes_fact_id) {
        const supersededRows = await run<VendorProposalFactRow>(
          `SELECT ${FACT_COLUMNS} FROM source_vendor_proposal_facts
           WHERE id = $1 AND source_event_id = $2 AND client_key = $3
           LIMIT 1`,
          [factRow.supersedes_fact_id, input.eventId, identity.tenantKey],
        );
        if (supersededRows[0]) {
          await run(
            `INSERT INTO source_vendor_proposal_fact_reviews
               (fact_id, client_key, source_event_id, review_status, rationale, reviewed_by)
             VALUES ($1, $2, $3, 'superseded', $4, $5)`,
            [
              factRow.supersedes_fact_id,
              identity.tenantKey,
              input.eventId,
              `Superseded by accepted fact ${input.factId}.`,
              input.reviewedBy,
            ],
          );
        }
      }

      return { ok: true, record: reviewRowToRecord(reviewRow) };
    });
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

/** Reject a candidate fact. Never mutates the fact row — writes a rejected review. */
export async function rejectVendorProposalFact(
  identity: VendorProposalFactsIdentity,
  input: ReviewVendorProposalFactInput,
): Promise<
  | { ok: true; record: VendorProposalFactReviewRecord }
  | { ok: false; error: string }
> {
  try {
    return await withVendorProposalFactsSession(identity, async (run) => {
      const factRows = await run<Pick<VendorProposalFactRow, "id">>(
        `SELECT id FROM source_vendor_proposal_facts
         WHERE id = $1 AND source_event_id = $2 AND client_key = $3
         LIMIT 1`,
        [input.factId, input.eventId, identity.tenantKey],
      );
      if (!factRows[0]) return { ok: false, error: "fact_not_found" };

      const reviewRows = await run<VendorProposalFactReviewRow>(
        `INSERT INTO source_vendor_proposal_fact_reviews
           (fact_id, client_key, source_event_id, review_status, rationale, reviewed_by)
         VALUES ($1, $2, $3, 'rejected', $4, $5)
         RETURNING ${REVIEW_COLUMNS}`,
        [
          input.factId,
          identity.tenantKey,
          input.eventId,
          input.rationale,
          input.reviewedBy,
        ],
      );
      return { ok: true, record: reviewRowToRecord(reviewRows[0]!) };
    });
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

/**
 * The governed read accessor: facts whose LATEST review is 'accepted', for
 * one event (and optionally one vendor), tenant-scoped by
 * identity.tenantKey. This is the only function downstream consumers
 * (scorecard, pricing, BAFO, Decision Brief, aVa context) should call —
 * never listVendorProposalFacts directly, which returns every candidate
 * regardless of review state.
 */
export async function getAuthoritativeVendorProposalFacts(
  identity: VendorProposalFactsIdentity,
  input: { eventId: string; vendorKey?: string },
): Promise<VendorProposalFactRecord[]> {
  const facts = await listVendorProposalFacts(identity, input);
  if (facts.length === 0) return [];
  const reviews = await getLatestVendorProposalFactReviewsByFactIds(
    identity,
    facts.map((f) => f.id),
  );
  return facts.filter((f) => reviews.get(f.id)?.reviewStatus === "accepted");
}
