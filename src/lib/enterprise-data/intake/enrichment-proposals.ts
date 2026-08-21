import {
  basisForColumn,
  containsFinancialClaim,
  dependencyHash,
  hashContent,
  screenOverlayColumns,
  type DeclaredEnrichmentColumn,
  type EnrichmentBasis,
  type EnrichmentSchema,
} from "./enrichment-firewall";

/**
 * Proposal parsing and approval.
 *
 * A workbook overlay becomes a set of CELL-level proposals, never a set of columns. That
 * distinction is the point: a column routinely contains approved, rejected and still-pending
 * proposals at once, so admitting or refusing a whole column cannot express the review that
 * actually happened.
 *
 * Two levels of approval, meaning different things:
 *
 *   file-level      the reviewer completed review of this enrichment run
 *   proposal-level  THIS derived value may enter governed canonical context
 *
 * Only the second admits anything. A bulk action may decide many identical low-risk proposals at
 * once, but what persists is still one decision per cell -- otherwise "approved" cannot be
 * attributed to a specific value later, which is the only thing that makes it auditable.
 */

export type EnrichmentProposalStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "invalidated"
  | "superseded";

export interface EnrichmentProposal {
  proposalId: string;
  tenantKey: string;
  templateFile: string;
  schemaVersion: string;
  /** Row identity in the recorded source, so the proposal can be re-checked against it. */
  sourceRowId: string;
  sourceColumn: string;
  /** Stable logical attribute the proposal targets. */
  targetAttribute: string;
  basis: Exclude<EnrichmentBasis, "recorded">;
  proposedValue: string;
  /** Recorded fields the proposal cited, and the hash over their values. */
  evidenceFields: string[];
  evidenceDependencyHash: string;
  enrichmentRunId: string;
  model: string;
  promptVersion: string;
  status: EnrichmentProposalStatus;
  /** Populated only by an authenticated review action. */
  reviewedBy?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  approvalId?: string;
  reviewNote?: string;
  invalidatedAt?: string;
  invalidationReason?: string;
  /** Why a reviewer must look at this one individually. */
  mustReviewIndividually?: string;
}

export interface EnrichmentRunContext {
  tenantKey: string;
  templateFile: string;
  schema: EnrichmentSchema;
  enrichmentRunId: string;
  model: string;
  promptVersion: string;
  /** Hash of the immutable recorded source the overlay was derived from. */
  recordedSourceHash: string;
}

export interface ParsedOverlay {
  proposals: EnrichmentProposal[];
  /** Hash over every proposal, so an approval cannot be re-pointed at a different overlay. */
  proposalSetHash: string;
  errors: string[];
  /** Non-blocking observations worth showing the reviewer. */
  notes: string[];
}

function proposalId(parts: string[]): string {
  return hashContent(parts.join("|")).slice(0, 32);
}

/**
 * Turns overlay rows into cell-level proposals.
 *
 * Refuses rather than repairs. A proposal outside its declared vocabulary, or carrying a financial
 * claim, is an error for the whole overlay -- not a cell quietly dropped -- because a partially
 * silently-corrected overlay is one nobody can reason about afterwards.
 */
export function parseOverlay(input: {
  rows: Array<Record<string, unknown>>;
  /** Column holding each row's identity in the recorded source. */
  rowIdColumn: string;
  context: EnrichmentRunContext;
}): ParsedOverlay {
  const { context } = input;
  const errors: string[] = [];
  const notes: string[] = [];
  const proposals: EnrichmentProposal[] = [];

  const declaredByColumn = new Map<string, DeclaredEnrichmentColumn>(
    context.schema.columns.map((c) => [c.column, c]),
  );

  const overlayColumns = input.rows.length
    ? Object.keys(input.rows[0]).filter((c) => basisForColumn(c) !== "recorded")
    : [];
  const columnCheck = screenOverlayColumns({ columns: overlayColumns, schema: context.schema });
  errors.push(...columnCheck.errors);

  let unknownCount = 0;

  for (const row of input.rows) {
    const sourceRowId = String(row[input.rowIdColumn] ?? "").trim();
    if (!sourceRowId) {
      errors.push(`A row carries no value in "${input.rowIdColumn}". A proposal with no source row cannot be re-checked or invalidated.`);
      continue;
    }

    for (const [column, declared] of declaredByColumn) {
      // Deterministic columns are recomputed server-side; a submitted value is never a proposal.
      if (declared.basis === "deterministic") continue;

      const raw = row[column];
      const value = typeof raw === "string" ? raw.trim() : raw === undefined || raw === null ? "" : String(raw);
      if (!value) continue;

      if (value.toLowerCase() === "unknown") {
        unknownCount += 1;
        // `unknown` is a correct answer and is recorded as a proposal so the reviewer can see
        // where the model declined, but it carries nothing into canonical state.
        continue;
      }

      // Financial content is checked FIRST. A value that is both out-of-vocabulary and carries a
      // money claim should report the money claim: it is the more serious finding, and reporting
      // only "outside the vocabulary" would hide that a model tried to invent a figure.
      if (containsFinancialClaim(value)) {
        errors.push(
          `Row ${sourceRowId}, column "${column}" contains what reads as a financial claim. A derived cost is a fabricated cost.`,
        );
        continue;
      }

      if (declared.vocabulary && !declared.vocabulary.includes(value)) {
        errors.push(
          `Row ${sourceRowId}, column "${column}": "${value}" is outside the declared vocabulary. A value the schema does not permit is a schema violation, not a proposal.`,
        );
        continue;
      }

      const depHash = dependencyHash(row, declared.evidenceFields);

      proposals.push({
        proposalId: proposalId([context.tenantKey, context.templateFile, sourceRowId, declared.targetAttribute, context.enrichmentRunId]),
        tenantKey: context.tenantKey,
        templateFile: context.templateFile,
        schemaVersion: context.schema.schemaVersion,
        sourceRowId,
        sourceColumn: column,
        targetAttribute: declared.targetAttribute,
        basis: declared.basis,
        proposedValue: value,
        evidenceFields: declared.evidenceFields,
        evidenceDependencyHash: depHash,
        enrichmentRunId: context.enrichmentRunId,
        model: context.model,
        promptVersion: context.promptVersion,
        status: "proposed",
      });
    }
  }

  if (unknownCount > 0) {
    notes.push(
      `${unknownCount} cells were returned as "unknown". That is a correct answer and a map of what to ask the client next, not a failure of the run.`,
    );
  }

  const proposalSetHash = hashContent(
    proposals
      .map((p) => `${p.sourceRowId}:${p.targetAttribute}:${p.proposedValue}:${p.evidenceDependencyHash}`)
      .sort()
      .join("\n"),
  );

  return { proposals, proposalSetHash, errors, notes };
}

/* -- review ---------------------------------------------------------------------------------- */

export interface AuthenticatedReviewer {
  /** Identity from the platform session, never typed into a spreadsheet. */
  userId: string;
  displayName: string;
  role: string;
}

export interface ApprovalBinding {
  recordedSourceHash: string;
  overlayHash: string;
  proposalSetHash: string;
  schemaVersion: string;
  enrichmentRunId: string;
}

/**
 * Marks proposals that a reviewer must decide individually.
 *
 * Bulk approval is legitimate for many identical low-risk proposals -- a reviewer looking at 57
 * rows that all say the same thing is making one decision, not 57. It is not legitimate for a
 * conflict or a lone outlier, where the reviewer needs to see the specific row.
 *
 * Confidence may order the queue. It must never decide admission: a confident wrong answer is the
 * one that does damage.
 */
export function flagForIndividualReview(proposals: EnrichmentProposal[]): EnrichmentProposal[] {
  const countByValue = new Map<string, number>();
  for (const p of proposals) {
    const key = `${p.targetAttribute}:${p.proposedValue}`;
    countByValue.set(key, (countByValue.get(key) ?? 0) + 1);
  }

  return proposals.map((p) => {
    const key = `${p.targetAttribute}:${p.proposedValue}`;
    const shared = countByValue.get(key) ?? 0;
    if (shared === 1) {
      return {
        ...p,
        mustReviewIndividually: "The only proposal of its kind in this run, so it cannot be judged as part of a group.",
      };
    }
    return p;
  });
}

export interface BulkApprovalRequest {
  targetAttribute: string;
  proposedValue: string;
  reviewer: AuthenticatedReviewer;
  binding: ApprovalBinding;
  reviewNote?: string;
  decidedAt: string;
}

export interface ReviewOutcome {
  proposals: EnrichmentProposal[];
  decided: number;
  skippedRequiringIndividualReview: number;
  errors: string[];
}

/**
 * Applies a bulk decision, per cell.
 *
 * The decision is expressed once by the reviewer and persisted once per proposal, so every
 * approved value can later name the person who approved it, when, and against which overlay.
 */
export function applyBulkApproval(input: {
  proposals: EnrichmentProposal[];
  request: BulkApprovalRequest;
  decision: "approved" | "rejected";
  currentBinding: ApprovalBinding;
}): ReviewOutcome {
  const errors: string[] = [];
  const { request, currentBinding } = input;

  // An approval must bind to the exact content it reviewed. Otherwise a previously approved record
  // can be paired with a changed workbook.
  for (const [field, expected] of Object.entries(currentBinding) as Array<[keyof ApprovalBinding, string]>) {
    if (request.binding[field] !== expected) {
      errors.push(
        `Approval binding mismatch on ${field}. This approval was made against different content and cannot authorise the current overlay.`,
      );
    }
  }
  if (!request.reviewer.userId?.trim()) {
    errors.push("Review requires an authenticated reviewer identity. A name typed into a file is not approval.");
  }
  if (errors.length > 0) {
    return { proposals: input.proposals, decided: 0, skippedRequiringIndividualReview: 0, errors };
  }

  const approvalId = hashContent([request.binding.proposalSetHash, request.reviewer.userId, request.decidedAt].join("|")).slice(0, 32);

  let decided = 0;
  let skipped = 0;

  const proposals = input.proposals.map((p) => {
    if (p.targetAttribute !== request.targetAttribute || p.proposedValue !== request.proposedValue) return p;
    if (p.status !== "proposed") return p;
    if (p.mustReviewIndividually) {
      skipped += 1;
      return p;
    }
    decided += 1;
    return {
      ...p,
      status: input.decision,
      reviewedBy: request.reviewer.displayName,
      reviewerRole: request.reviewer.role,
      reviewedAt: request.decidedAt,
      approvalId,
      reviewNote: request.reviewNote,
    };
  });

  return { proposals, decided, skippedRequiringIndividualReview: skipped, errors };
}

/* -- the sanitized overlay ------------------------------------------------------------------- */

export interface ApprovedCell {
  sourceRowId: string;
  targetAttribute: string;
  value: string;
  proposalId: string;
}

/**
 * The only thing permitted to reach canonical merge: approved cells.
 *
 * Built by inclusion rather than exclusion. A filter that removes rejected proposals leaves
 * anything a future status forgets to exclude; taking only what is explicitly approved cannot.
 */
export function buildApprovedOverlay(proposals: EnrichmentProposal[]): {
  cells: ApprovedCell[];
  excluded: Record<EnrichmentProposalStatus, number>;
} {
  const excluded: Record<EnrichmentProposalStatus, number> = {
    proposed: 0,
    approved: 0,
    rejected: 0,
    invalidated: 0,
    superseded: 0,
  };

  const cells: ApprovedCell[] = [];
  for (const p of proposals) {
    if (p.status === "approved") {
      cells.push({
        sourceRowId: p.sourceRowId,
        targetAttribute: p.targetAttribute,
        value: p.proposedValue,
        proposalId: p.proposalId,
      });
      excluded.approved += 1;
      continue;
    }
    excluded[p.status] += 1;
  }

  return { cells, excluded };
}

/* -- invalidation ---------------------------------------------------------------------------- */

/**
 * Invalidates approved proposals whose cited evidence changed.
 *
 * A source correction creates a new recorded version. Where it touches a field a proposal cited,
 * the derivation is no longer supported by the record it claimed to rest on, and keeping it would
 * mean asserting an interpretation of data that no longer exists.
 *
 * Where the file changed but the cited values are byte-identical, the proposal stays valid -- the
 * dependency hash is what makes that distinction possible.
 */
export function invalidateOnSourceChange(input: {
  proposals: EnrichmentProposal[];
  currentRows: Map<string, Record<string, unknown>>;
  invalidatedAt: string;
}): { proposals: EnrichmentProposal[]; invalidated: number; unchanged: number } {
  let invalidated = 0;
  let unchanged = 0;

  const proposals = input.proposals.map((p) => {
    if (p.status !== "approved") return p;
    const row = input.currentRows.get(p.sourceRowId);
    if (!row) {
      invalidated += 1;
      return {
        ...p,
        status: "invalidated" as const,
        invalidatedAt: input.invalidatedAt,
        invalidationReason: "The source row this proposal was derived from is no longer present.",
      };
    }
    const nowHash = dependencyHash(row, p.evidenceFields);
    if (nowHash === p.evidenceDependencyHash) {
      unchanged += 1;
      return p;
    }
    invalidated += 1;
    return {
      ...p,
      status: "invalidated" as const,
      invalidatedAt: input.invalidatedAt,
      invalidationReason: `Recorded evidence changed in ${p.evidenceFields.join(", ")}. The derivation is no longer supported by the record it rested on and must be re-derived.`,
    };
  });

  return { proposals, invalidated, unchanged };
}
