import {
  applyBulkApproval,
  buildApprovedOverlay,
  flagForIndividualReview,
  invalidateOnSourceChange,
  parseOverlay,
  type ApprovalBinding,
  type EnrichmentProposal,
  type EnrichmentRunContext,
} from "../../src/lib/enterprise-data/intake/enrichment-proposals";
import type { EnrichmentSchema } from "../../src/lib/enterprise-data/intake/enrichment-firewall";

const SCHEMA: EnrichmentSchema = {
  schemaVersion: "2026-08-v1",
  templateFile: "04_applications_systems.csv",
  columns: [
    {
      column: "drv__architecture_role",
      basis: "derived",
      targetAttribute: "architectureRole",
      evidenceFields: ["system_name", "system_category"],
      vocabulary: ["data_mart", "enterprise_data_warehouse", "operational_reporting_database", "unknown"],
    },
    {
      column: "det__interface_rank",
      basis: "deterministic",
      targetAttribute: "interfaceRank",
      evidenceFields: ["interfaces_count"],
    },
  ],
};

const CONTEXT: EnrichmentRunContext = {
  tenantKey: "t1",
  templateFile: "04_applications_systems.csv",
  schema: SCHEMA,
  enrichmentRunId: "run-1",
  model: "gpt-enterprise",
  promptVersion: "2026-08-v1",
  recordedSourceHash: "srchash",
};

const rows = [
  { row_id: "r1", system_name: "Revenue Cycle Mart", system_category: "SQL Server database/mart", drv__architecture_role: "data_mart", det__interface_rank: "99" },
  { row_id: "r2", system_name: "Epic Caboodle", system_category: "Application", drv__architecture_role: "enterprise_data_warehouse" },
  { row_id: "r3", system_name: "Mystery Box", system_category: "Application", drv__architecture_role: "unknown" },
  { row_id: "r4", system_name: "Radiology Mart", system_category: "SQL Server database/mart", drv__architecture_role: "data_mart" },
];

function parse() {
  return parseOverlay({ rows, rowIdColumn: "row_id", context: CONTEXT });
}

describe("overlay parses to CELL-level proposals", () => {
  it("produces one proposal per cell, not per column", () => {
    const { proposals, errors } = parse();
    expect(errors).toHaveLength(0);
    expect(proposals.map((p) => p.sourceRowId).sort()).toEqual(["r1", "r2", "r4"]);
    expect(proposals.every((p) => p.targetAttribute === "architectureRole")).toBe(true);
  });

  it("never turns a submitted deterministic value into a proposal", () => {
    // det__ is recomputed server-side; trusting the sheet admits tampering.
    const { proposals } = parse();
    expect(proposals.some((p) => p.targetAttribute === "interfaceRank")).toBe(false);
  });

  it("records unknown as a note rather than carrying it into canonical state", () => {
    const { proposals, notes } = parse();
    expect(proposals.some((p) => p.proposedValue === "unknown")).toBe(false);
    expect(notes.join(" ")).toMatch(/map of what to ask the client next/);
  });

  it("refuses a value outside the declared vocabulary", () => {
    const r = parseOverlay({
      rows: [{ row_id: "r9", system_name: "X", system_category: "Y", drv__architecture_role: "vibes_platform" }],
      rowIdColumn: "row_id",
      context: CONTEXT,
    });
    expect(r.errors.join(" ")).toMatch(/outside the declared vocabulary/);
    expect(r.proposals).toHaveLength(0);
  });

  it("refuses a financial claim inside a classification", () => {
    const r = parseOverlay({
      rows: [{ row_id: "r9", system_name: "X", system_category: "Y", drv__architecture_role: "data_mart saving $2M" }],
      rowIdColumn: "row_id",
      context: CONTEXT,
    });
    expect(r.errors.join(" ")).toMatch(/fabricated cost/);
  });

  it("refuses a row with no source identity, since it could never be re-checked", () => {
    const r = parseOverlay({
      rows: [{ row_id: "", system_name: "X", system_category: "Y", drv__architecture_role: "data_mart" }],
      rowIdColumn: "row_id",
      context: CONTEXT,
    });
    expect(r.errors.join(" ")).toMatch(/cannot be re-checked or invalidated/);
  });

  it("hashes the proposal set so an approval cannot be re-pointed at different content", () => {
    const a = parse().proposalSetHash;
    const b = parseOverlay({
      rows: [...rows.slice(0, 3), { ...rows[3], drv__architecture_role: "enterprise_data_warehouse" }],
      rowIdColumn: "row_id",
      context: CONTEXT,
    }).proposalSetHash;
    expect(a).not.toBe(b);
  });
});

describe("review: bulk is allowed, but decisions persist per cell", () => {
  const binding: ApprovalBinding = {
    recordedSourceHash: "srchash",
    overlayHash: "ovhash",
    proposalSetHash: "pshash",
    schemaVersion: "2026-08-v1",
    enrichmentRunId: "run-1",
  };
  const reviewer = { userId: "u1", displayName: "A. Reviewer", role: "Enterprise Architect" };

  it("flags a lone proposal for individual review", () => {
    // Two rows propose data_mart; Caboodle's warehouse proposal stands alone and cannot be judged
    // as part of a group.
    const flagged = flagForIndividualReview(parse().proposals);
    const caboodle = flagged.find((p) => p.sourceRowId === "r2")!;
    const mart = flagged.find((p) => p.sourceRowId === "r1")!;
    expect(caboodle.mustReviewIndividually).toBeTruthy();
    expect(mart.mustReviewIndividually).toBeUndefined();
  });

  it("applies one reviewer decision to every matching cell, and records it on each", () => {
    const flagged = flagForIndividualReview(parse().proposals);
    const out = applyBulkApproval({
      proposals: flagged,
      request: { targetAttribute: "architectureRole", proposedValue: "data_mart", reviewer, binding, decidedAt: "2026-08-21T00:00:00Z" },
      decision: "approved",
      currentBinding: binding,
    });
    expect(out.decided).toBe(2);
    const approved = out.proposals.filter((p) => p.status === "approved");
    expect(approved).toHaveLength(2);
    // Every approved cell can name who approved it and against which overlay.
    expect(approved.every((p) => p.reviewedBy === "A. Reviewer" && p.approvalId)).toBe(true);
  });

  it("will not bulk-decide a proposal flagged for individual review", () => {
    const flagged = flagForIndividualReview(parse().proposals);
    const out = applyBulkApproval({
      proposals: flagged,
      request: { targetAttribute: "architectureRole", proposedValue: "enterprise_data_warehouse", reviewer, binding, decidedAt: "2026-08-21T00:00:00Z" },
      decision: "approved",
      currentBinding: binding,
    });
    expect(out.decided).toBe(0);
    expect(out.skippedRequiringIndividualReview).toBe(1);
  });

  it("refuses an approval bound to different content", () => {
    // A previously approved record must not be pairable with a changed workbook.
    const out = applyBulkApproval({
      proposals: parse().proposals,
      request: { targetAttribute: "architectureRole", proposedValue: "data_mart", reviewer, binding, decidedAt: "x" },
      decision: "approved",
      currentBinding: { ...binding, proposalSetHash: "DIFFERENT" },
    });
    expect(out.errors.join(" ")).toMatch(/cannot authorise the current overlay/);
    expect(out.decided).toBe(0);
  });

  it("refuses review without an authenticated identity", () => {
    const out = applyBulkApproval({
      proposals: parse().proposals,
      request: { targetAttribute: "architectureRole", proposedValue: "data_mart", reviewer: { userId: " ", displayName: "", role: "" }, binding, decidedAt: "x" },
      decision: "approved",
      currentBinding: binding,
    });
    expect(out.errors.join(" ")).toMatch(/name typed into a file is not approval/);
  });
});

describe("only approved cells reach canonical merge", () => {
  it("excludes proposed and rejected cells from the same column", () => {
    // The failure this prevents: admitting a whole column that contains mixed decisions.
    const proposals: EnrichmentProposal[] = [
      { ...parse().proposals[0], status: "approved" },
      { ...parse().proposals[1], status: "rejected" },
      { ...parse().proposals[2], status: "proposed" },
    ];
    const { cells, excluded } = buildApprovedOverlay(proposals);
    expect(cells).toHaveLength(1);
    expect(excluded.rejected).toBe(1);
    expect(excluded.proposed).toBe(1);
  });
});

describe("invalidation is exact", () => {
  const approved = parse().proposals.map((p) => ({ ...p, status: "approved" as const }));

  it("invalidates when a CITED evidence field changes", () => {
    const current = new Map(rows.map((r) => [r.row_id, { ...r, system_category: "Application" }]));
    const out = invalidateOnSourceChange({ proposals: approved, currentRows: current, invalidatedAt: "now" });
    expect(out.invalidated).toBeGreaterThan(0);
    expect(out.proposals.find((p) => p.status === "invalidated")?.invalidationReason).toMatch(/no longer supported/);
  });

  it("does NOT invalidate when an uncited field changes", () => {
    // A client correcting an unrelated column must not wipe every derivation in the file.
    const current = new Map(rows.map((r) => [r.row_id, { ...r, some_other_column: "changed" }]));
    const out = invalidateOnSourceChange({ proposals: approved, currentRows: current, invalidatedAt: "now" });
    expect(out.invalidated).toBe(0);
    expect(out.unchanged).toBe(approved.length);
  });

  it("invalidates when the source row is gone entirely", () => {
    const out = invalidateOnSourceChange({ proposals: approved, currentRows: new Map(), invalidatedAt: "now" });
    expect(out.invalidated).toBe(approved.length);
    expect(out.proposals[0].invalidationReason).toMatch(/no longer present/);
  });
});
