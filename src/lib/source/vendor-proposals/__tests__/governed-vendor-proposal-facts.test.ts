import {
  buildGovernedVendorProposalFactBundle,
  governedCandidateFromVendorProposalFact,
  vendorProposalFactConfidenceToConfidenceLevel,
} from "../governed-vendor-proposal-facts";
import type { VendorProposalFactRecord } from "../types";

const fact = (
  overrides: Partial<VendorProposalFactRecord> = {},
): VendorProposalFactRecord => ({
  id: "fact-1",
  clientKey: "apexretail",
  sourceEventId: "event-1",
  vendorKey: "vendor-a",
  proposalArtifactId: "artifact-1",
  factKey: "unit_price",
  sectionKey: null,
  pageOrLocation: "line 4",
  valueNumeric: 120000,
  valueText: null,
  unit: "year",
  currency: "USD",
  effectivePeriodStart: null,
  effectivePeriodEnd: null,
  sourceQuote: "Price: $120,000/year",
  sourcePointer: null,
  confidence: "low",
  extractionMethod: "parsed_text",
  supersedesFactId: null,
  createdBy: "clerk-user-1",
  createdAt: "2026-07-25T00:00:00.000Z",
  ...overrides,
});

describe("vendorProposalFactConfidenceToConfidenceLevel", () => {
  it("maps each confidence tier explicitly", () => {
    expect(vendorProposalFactConfidenceToConfidenceLevel("low")).toBe("low");
    expect(vendorProposalFactConfidenceToConfidenceLevel("med")).toBe("medium");
    expect(vendorProposalFactConfidenceToConfidenceLevel("high")).toBe("high");
  });
});

describe("governedCandidateFromVendorProposalFact", () => {
  it("maps every field to an honest, conservative GovernedCandidate", () => {
    const candidate = governedCandidateFromVendorProposalFact(fact(), {
      clientKey: "apexretail",
      tenantId: "tenant-1",
    });
    expect(candidate).toEqual({
      id: "fact-1",
      client_key: "apexretail",
      tenant_id: "tenant-1",
      source_layer: "vendor",
      source_basis: null,
      classification: "confidential",
      retrievability: "not_indexed",
      agent_readiness_status: "not_reviewed",
      confidence_level: "low",
      cited_render_verified_at: null,
      title: "vendor-a · unit_price",
      citations: ["Price: $120,000/year"],
    });
  });

  it("falls back to sourcePointer for citations when there is no source quote", () => {
    const candidate = governedCandidateFromVendorProposalFact(
      fact({
        sourceQuote: null,
        sourcePointer: { doc: "proposal.pdf", locator: "page 4" },
      }),
      { clientKey: "apexretail", tenantId: null },
    );
    expect(candidate.citations).toEqual(["proposal.pdf — page 4"]);
    expect(candidate.source_basis).toBe("proposal.pdf");
  });
});

describe("buildGovernedVendorProposalFactBundle", () => {
  it("runs accepted facts through the mandatory gate with requireAgentReady: false", () => {
    const bundle = buildGovernedVendorProposalFactBundle(
      [fact({ clientKey: "apex-retail" })],
      { clientKey: "apex-retail", tenantId: "tenant-1" },
    );
    // Honest limitation: retrievability is always 'not_indexed', so the gate
    // must not require agent-ready — this is what proves it never will here.
    expect(bundle.decision).not.toBe("block");
    expect(bundle.usable).toHaveLength(1);
  });
});
