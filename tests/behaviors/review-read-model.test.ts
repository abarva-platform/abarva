import { buildReviewQueue } from "../../src/lib/enterprise-data/intake/review-read-model";
import type { EnrichmentProposal } from "../../src/lib/enterprise-data/intake/enrichment-proposals";

function p(over: Partial<EnrichmentProposal> & { sourceRowId: string; proposedValue: string }): EnrichmentProposal {
  return {
    proposalId: `${over.sourceRowId}-${over.targetAttribute ?? "architectureRole"}-${over.proposedValue}`,
    tenantKey: "t1",
    templateFile: "04_applications_systems.csv",
    schemaVersion: "2026-08-v1",
    sourceColumn: "drv__architecture_role",
    targetAttribute: "architectureRole",
    basis: "derived",
    evidenceFields: ["system_name", "system_category"],
    evidenceDependencyHash: "h",
    enrichmentRunId: "run-1",
    model: "m",
    promptVersion: "v1",
    status: "proposed",
    ...over,
  } as EnrichmentProposal;
}

const rows = new Map<string, Record<string, string>>([
  ["r1", { system_name: "Revenue Cycle Mart", system_category: "SQL Server database/mart" }],
  ["r2", { system_name: "Radiology Mart", system_category: "SQL Server database/mart" }],
  ["r3", { system_name: "Claims Mart", system_category: "SQL Server database/mart" }],
  ["r4", { system_name: "Enterprise Warehouse", system_category: "Appliance" }],
  ["r5", { system_name: "", system_category: "" }],
]);

function build(proposals: EnrichmentProposal[], declined = []) {
  return buildReviewQueue({ tenantKey: "t1", enrichmentRunId: "run-1", proposals, recordedRows: rows, declined });
}

describe("grouping turns a list into decisions", () => {
  it("counts decisions, not proposals", () => {
    // A list of thousands is not reviewable; it is a surface that gets approved wholesale.
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
      p({ sourceRowId: "r3", proposedValue: "data_mart" }),
    ]);
    expect(q.summary.proposalCount).toBe(3);
    expect(q.summary.decisionCount).toBe(1);
    expect(q.groups[0].kind).toBe("bulk_decidable");
    expect(q.groups[0].rowCount).toBe(3);
  });

  it("shows real rows so the claim is judged against actual evidence", () => {
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
    ]);
    expect(q.groups[0].samples[0].evidence).toEqual({
      system_name: "Revenue Cycle Mart",
      system_category: "SQL Server database/mart",
    });
  });

  it("asks the question in the reviewer's terms", () => {
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
    ]);
    expect(q.groups[0].question).toBe('Is "data_mart" the right architecture role for these 2 rows?');
  });
});

describe("what cannot be bulk-decided", () => {
  it("isolates a proposal that stands alone", () => {
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
      p({ sourceRowId: "r4", proposedValue: "enterprise_data_warehouse" }),
    ]);
    const lone = q.groups.find((g) => g.proposedValue === "enterprise_data_warehouse")!;
    expect(lone.kind).toBe("individual_only");
    expect(lone.individualReason).toBe("sole_instance");
    expect(lone.priorityReason).toMatch(/no group to judge it as part of/);
  });

  it("isolates a row that was given two different answers", () => {
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r1", proposedValue: "enterprise_data_warehouse" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
      p({ sourceRowId: "r3", proposedValue: "data_mart" }),
    ]);
    const contested = q.groups.filter((g) => g.samples[0].sourceRowId === "r1");
    expect(contested.every((g) => g.kind === "individual_only")).toBe(true);
    expect(contested.some((g) => g.individualReason === "row_has_competing_proposals")).toBe(true);
    // The other rows stay groupable: one row's disagreement does not contaminate the rest.
    const bulk = q.groups.find((g) => g.kind === "bulk_decidable")!;
    expect(bulk.rowCount).toBe(2);
    // And the group shows evidence only from rows it actually covers. Sampling the full member
    // list would put a pulled-out row's evidence under a bulk decision that does not include it.
    expect(bulk.samples.map((s) => s.sourceRowId)).toEqual(["r2", "r3"]);
  });

  it("isolates a proposal whose cited evidence is entirely blank", () => {
    // It may still be right, but a bulk decision is made against the group's evidence, and this
    // one was produced from nothing.
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
      p({ sourceRowId: "r5", proposedValue: "data_mart" }),
    ]);
    const thin = q.groups.find((g) => g.individualReason === "evidence_is_thin")!;
    expect(thin.samples[0].sourceRowId).toBe("r5");
    expect(thin.priorityReason).toMatch(/produced from nothing/);
    expect(q.groups.find((g) => g.kind === "bulk_decidable")!.rowCount).toBe(2);
  });
});

describe("ordering spends the reviewer's attention where it matters", () => {
  it("puts structural attributes above descriptive ones", () => {
    // A wrong architecture role reshapes a diagram and everything read off it; a wrong label is
    // visible in place and corrected in place.
    const q = build([
      p({ sourceRowId: "r1", targetAttribute: "hostingPlatform", proposedValue: "SQL Server", proposalId: "a" }),
      p({ sourceRowId: "r2", targetAttribute: "hostingPlatform", proposedValue: "SQL Server", proposalId: "b" }),
      p({ sourceRowId: "r1", proposedValue: "data_mart", proposalId: "c" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart", proposalId: "d" }),
    ]);
    expect(q.groups[0].targetAttribute).toBe("architectureRole");
  });

  it("is stable, so the queue does not reshuffle and lose the reviewer's place", () => {
    const proposals = [
      p({ sourceRowId: "r1", proposedValue: "data_mart" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart" }),
      p({ sourceRowId: "r3", proposedValue: "operational_reporting_database" }),
      p({ sourceRowId: "r4", proposedValue: "enterprise_data_warehouse" }),
    ];
    const a = build(proposals).groups.map((g) => g.groupId);
    const b = build([...proposals].reverse()).groups.map((g) => g.groupId);
    expect(a).toEqual(b);
  });
});

describe("declined cells are not decisions", () => {
  it("keeps them out of the queue and reports them separately", () => {
    // "unknown" is a correct answer and a map of what to ask the client, not a review task.
    const q = buildReviewQueue({
      tenantKey: "t1",
      enrichmentRunId: "run-1",
      proposals: [p({ sourceRowId: "r1", proposedValue: "data_mart" }), p({ sourceRowId: "r2", proposedValue: "data_mart" })],
      recordedRows: rows,
      declined: [{ sourceRowId: "r9", targetAttribute: "architectureRole" }],
    });
    expect(q.summary.decisionCount).toBe(1);
    expect(q.summary.declinedCount).toBe(1);
    expect(q.groups.some((g) => g.samples.some((s) => s.sourceRowId === "r9"))).toBe(false);
  });
});

describe("already-decided proposals do not reappear", () => {
  it("queues only what is still pending", () => {
    const q = build([
      p({ sourceRowId: "r1", proposedValue: "data_mart", status: "approved" }),
      p({ sourceRowId: "r2", proposedValue: "data_mart", status: "rejected" }),
      p({ sourceRowId: "r3", proposedValue: "data_mart" }),
    ]);
    expect(q.summary.proposalCount).toBe(1);
    expect(q.groups).toHaveLength(1);
    expect(q.groups[0].kind).toBe("individual_only");
  });
});
