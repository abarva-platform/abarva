import { describeRefusal, evaluatePromotion, isApprovalStale } from "../../src/lib/enterprise-data/intake/promotion-gate";
import type { MergedRecord } from "../../src/lib/enterprise-data/intake/canonical-overlay-merge";
import type { EnrichmentProposal } from "../../src/lib/enterprise-data/intake/enrichment-proposals";

function proposal(over: Partial<EnrichmentProposal> = {}): EnrichmentProposal {
  return {
    proposalId: "p1",
    tenantKey: "t1",
    templateFile: "04_applications_systems.csv",
    schemaVersion: "2026-08-v1",
    sourceRowId: "r1",
    sourceColumn: "drv__architecture_role",
    targetAttribute: "architectureRole",
    basis: "derived",
    proposedValue: "data_mart",
    evidenceFields: ["system_name"],
    evidenceDependencyHash: "h1",
    enrichmentRunId: "run-1",
    model: "gpt-enterprise",
    promptVersion: "v1",
    status: "approved",
    reviewedBy: "A. Reviewer",
    reviewerRole: "Enterprise Architect",
    reviewedAt: "2026-08-21T00:00:00Z",
    approvalId: "ap-1",
    ...over,
  };
}

function record(over: Partial<MergedRecord> = {}): MergedRecord {
  return {
    sourceRowId: "r1",
    attributes: { systemName: "Revenue Cycle Mart", architectureRole: "data_mart" },
    attributeMetadata: {
      systemName: { basis: "recorded", evidenceFields: [] },
      architectureRole: {
        basis: "derived",
        evidenceFields: ["system_name"],
        evidenceDependencyHash: "h1",
        approvedBy: "A. Reviewer",
        approvalId: "ap-1",
      },
    },
    ...over,
  };
}

const base = {
  tenantKey: "t1",
  mergedSchemaVersions: { "04_applications_systems.csv": "2026-08-v1" },
  currentSchemaVersions: { "04_applications_systems.csv": "2026-08-v1" },
};

describe("a clean snapshot promotes", () => {
  it("passes and reports what it contains", () => {
    const out = evaluatePromotion({ ...base, records: [record()], proposals: [proposal()] });
    expect(out.ok).toBe(true);
    expect(out.summary.attributesByBasis).toEqual({ recorded: 1, derived: 1 });
    expect(out.summary.proposalsByStatus).toEqual({ approved: 1 });
    expect(describeRefusal(out)).toMatch(/may be promoted/);
  });
});

describe("an approval that was true when given and is not true now", () => {
  it("refuses a merged value whose proposal was invalidated", () => {
    const out = evaluatePromotion({
      ...base,
      records: [record()],
      proposals: [proposal({ status: "invalidated", invalidationReason: "the source row was corrected" })],
    });
    expect(out.ok).toBe(false);
    expect(out.blocks[0].code).toBe("invalidated_proposal_merged");
    // The operator must not be able to read this as "re-approve it".
    expect(out.blocks[0].message).toMatch(/cannot simply be re-applied/);
  });

  it("refuses when the schema was re-versioned after approval", () => {
    // A schema change can add, remove or re-scope a column; the old merge cannot be assumed to
    // still mean the same thing.
    const out = evaluatePromotion({
      ...base,
      currentSchemaVersions: { "04_applications_systems.csv": "2026-09-v2" },
      records: [record()],
      proposals: [proposal()],
    });
    expect(out.ok).toBe(false);
    expect(out.blocks.map((b) => b.code)).toEqual(expect.arrayContaining(["stale_approval", "schema_version_drift"]));
  });

  it("treats freshness as a question about evidence, not a duration", () => {
    // Expiring approvals on a clock would churn correct decisions, and would imply an unexpired
    // one is still valid when its evidence has moved.
    expect(isApprovalStale({ proposal: proposal({ reviewedAt: "2019-01-01T00:00:00Z" }), currentSchemaVersion: "2026-08-v1" }).stale).toBe(false);
    expect(isApprovalStale({ proposal: proposal({ status: "invalidated" }), currentSchemaVersion: "2026-08-v1" }).stale).toBe(true);
  });
});

describe("content that never went through review", () => {
  it("refuses a derived value with no proposal behind it at all", () => {
    const out = evaluatePromotion({ ...base, records: [record()], proposals: [] });
    expect(out.blocks[0].code).toBe("unapproved_proposal_merged");
    expect(out.blocks[0].message).toMatch(/never went through review/);
  });

  it("refuses a derived value whose proposal is still pending", () => {
    const out = evaluatePromotion({ ...base, records: [record()], proposals: [proposal({ status: "proposed" })] });
    expect(out.blocks[0].code).toBe("unapproved_proposal_merged");
  });

  it("refuses an approval that names no reviewer", () => {
    // An approval that cannot be attributed is not one.
    const out = evaluatePromotion({
      ...base,
      records: [record()],
      proposals: [proposal({ reviewedBy: undefined, approvalId: undefined })],
    });
    expect(out.blocks[0].code).toBe("no_reviewer_recorded");
  });

  it("refuses an attribute nobody can characterise", () => {
    const orphan = record({ attributes: { systemName: "X", mystery: "y" } });
    const out = evaluatePromotion({ ...base, records: [orphan], proposals: [proposal()] });
    expect(out.blocks.some((b) => b.code === "unknown_basis_attribute" && b.attribute === "mystery")).toBe(true);
  });
});

describe("the gate refuses rather than repairs", () => {
  it("never returns ok with blocks present, however few", () => {
    // A small count is not a reason to downgrade an error: one wrong derived value in a client
    // deck is the whole failure.
    const out = evaluatePromotion({ ...base, records: [record()], proposals: [proposal({ status: "rejected" })] });
    expect(out.blocks).toHaveLength(1);
    expect(out.ok).toBe(false);
  });

  it("leaves recorded and deterministic attributes alone", () => {
    const rec = record({
      attributes: { systemName: "X", interfaceIntensity: "integrated" },
      attributeMetadata: {
        systemName: { basis: "recorded", evidenceFields: [] },
        interfaceIntensity: { basis: "deterministic", evidenceFields: ["interfaces_count"] },
      },
    });
    // Deterministic values are recomputed every build, so they need no approval to stay true.
    expect(evaluatePromotion({ ...base, records: [rec], proposals: [] }).ok).toBe(true);
  });

  it("groups the refusal by cause, not by cell", () => {
    // 300 rows blocked by one changed source column is one problem with one fix.
    const records = Array.from({ length: 300 }, (_, i) => record({ sourceRowId: `r${i}` }));
    const proposals = records.map((r) => proposal({ sourceRowId: r.sourceRowId, status: "invalidated" }));
    const out = evaluatePromotion({ ...base, records, proposals });
    const text = describeRefusal(out);
    expect(out.blocks).toHaveLength(300);
    expect(text).toMatch(/300 blocks across 1 causes/);
    expect(text).toMatch(/\(300 rows\)/);
    // One statement of the cause, not three hundred.
    expect(text.split("cannot simply be re-applied")).toHaveLength(2);
  });
});
