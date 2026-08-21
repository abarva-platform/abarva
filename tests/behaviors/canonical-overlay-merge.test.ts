import {
  CONSUMER_BASIS_POLICY,
  filterForConsumer,
  mergeApprovedOverlay,
  violatesVisibleBasis,
  type MergedRecord,
} from "../../src/lib/enterprise-data/intake/canonical-overlay-merge";
import { dependencyHash } from "../../src/lib/enterprise-data/intake/enrichment-firewall";
import type { EnrichmentProposal } from "../../src/lib/enterprise-data/intake/enrichment-proposals";

const recordedRow = {
  sourceRowId: "r1",
  attributes: {
    systemName: "Revenue Cycle Mart",
    systemCategory: "SQL Server database/mart",
    annualCostUsd: 412000,
  },
};

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
    evidenceFields: ["systemName", "systemCategory"],
    evidenceDependencyHash: dependencyHash(recordedRow.attributes, ["systemName", "systemCategory"]),
    enrichmentRunId: "run-1",
    model: "gpt-enterprise",
    promptVersion: "2026-08-v1",
    status: "approved",
    reviewedBy: "A. Reviewer",
    reviewerRole: "Enterprise Architect",
    reviewedAt: "2026-08-21T00:00:00Z",
    approvalId: "ap-1",
    ...over,
  };
}

describe("merge: one logical key, recorded always wins", () => {
  it("fills a gap and records full provenance beside the value", () => {
    const out = mergeApprovedOverlay({ recordedRows: [recordedRow], approvedProposals: [proposal()] });
    expect(out.applied).toBe(1);
    const rec = out.records[0];
    expect(rec.attributes.architectureRole).toBe("data_mart");
    const meta = rec.attributeMetadata.architectureRole;
    expect(meta.basis).toBe("derived");
    // A consumer must be able to answer "what is this" from metadata, not a naming convention.
    expect(meta.approvedBy).toBe("A. Reviewer");
    expect(meta.approvalId).toBe("ap-1");
    expect(meta.model).toBe("gpt-enterprise");
    expect(meta.evidenceFields).toEqual(["systemName", "systemCategory"]);
  });

  it("never overwrites a recorded value, and keeps the losing proposal", () => {
    // "We inferred X, the client later stated Y" is worth being able to show.
    const row = { ...recordedRow, attributes: { ...recordedRow.attributes, architectureRole: "enterprise_data_warehouse" } };
    const p = proposal({ evidenceDependencyHash: dependencyHash(row.attributes, ["systemName", "systemCategory"]) });
    const out = mergeApprovedOverlay({ recordedRows: [row], approvedProposals: [p] });
    expect(out.records[0].attributes.architectureRole).toBe("enterprise_data_warehouse");
    expect(out.records[0].attributeMetadata.architectureRole.basis).toBe("recorded");
    expect(out.supersededByRecorded).toHaveLength(1);
    expect(out.notes.join(" ")).toMatch(/client's own statement outranks/);
  });

  it("puts a recorded and a derived value of the same fact on ONE key", () => {
    const out = mergeApprovedOverlay({ recordedRows: [recordedRow], approvedProposals: [proposal()] });
    const keys = Object.keys(out.records[0].attributes);
    expect(keys).toContain("architectureRole");
    expect(keys.some((k) => /^drv|^aug|^det/i.test(k))).toBe(false);
  });

  it("re-checks evidence at merge time rather than trusting the approval", () => {
    // Approval and merge are separated in time; a client can correct a cited field in between.
    const changed = { ...recordedRow, attributes: { ...recordedRow.attributes, systemCategory: "Application" } };
    const out = mergeApprovedOverlay({ recordedRows: [changed], approvedProposals: [proposal()] });
    expect(out.applied).toBe(0);
    expect(out.staleAtMerge).toHaveLength(1);
  });

  it("ignores proposals that are not approved", () => {
    const out = mergeApprovedOverlay({
      recordedRows: [recordedRow],
      approvedProposals: [proposal({ status: "proposed" }), proposal({ status: "rejected" })],
    });
    expect(out.applied).toBe(0);
  });
});

describe("consumer basis policy", () => {
  const merged: MergedRecord = mergeApprovedOverlay({
    recordedRows: [recordedRow],
    approvedProposals: [proposal()],
  }).records[0];

  it("keeps derived content out of Tower metrics", () => {
    const { attributes, withheld } = filterForConsumer({ record: merged, surface: "tower_metric" });
    expect(attributes.annualCostUsd).toBe(412000);
    expect(attributes.architectureRole).toBeUndefined();
    expect(withheld.find((w) => w.attribute === "architectureRole")?.reason).toMatch(/turns a model judgement into a measurement/);
  });

  it("keeps derived content out of the Home fact band but admits it to the inference band", () => {
    expect(filterForConsumer({ record: merged, surface: "home_fact_band" }).attributes.architectureRole).toBeUndefined();
    expect(filterForConsumer({ record: merged, surface: "home_inference_band" }).attributes.architectureRole).toBe("data_mart");
  });

  it("keeps a derived edge out of the graph", () => {
    // An inferred dependency must not become indistinguishable from an observed integration.
    const { attributes } = filterForConsumer({ record: merged, surface: "graph_edge" });
    expect(attributes.architectureRole).toBeUndefined();
  });

  it("withholds an attribute that has no provenance at all", () => {
    // Unknown basis must never read as fact by default.
    const orphan: MergedRecord = { sourceRowId: "r1", attributes: { mystery: "x" }, attributeMetadata: {} };
    const { attributes, withheld } = filterForConsumer({ record: orphan, surface: "home_fact_band" });
    expect(attributes.mystery).toBeUndefined();
    expect(withheld[0].reason).toMatch(/unknown basis/);
  });

  it("every surface that admits derived content must show the basis", () => {
    for (const [surface, policy] of Object.entries(CONSUMER_BASIS_POLICY)) {
      if (policy.allowed.includes("derived") || policy.allowed.includes("augmented")) {
        expect([surface, policy.requiresVisibleBasis]).toEqual([surface, true]);
      }
    }
  });

  it("flags a surface about to render derived content without its basis", () => {
    expect(violatesVisibleBasis({ surface: "client_export", basis: "derived", basisIsRendered: false })).toBe(true);
    expect(violatesVisibleBasis({ surface: "client_export", basis: "derived", basisIsRendered: true })).toBe(false);
    expect(violatesVisibleBasis({ surface: "client_export", basis: "recorded", basisIsRendered: false })).toBe(false);
    expect(violatesVisibleBasis({ surface: "tower_metric", basis: "deterministic", basisIsRendered: false })).toBe(false);
  });
});
