import { buildD09VendorDraftContext } from "../d09-vendor-context";
import type { SourceGenerationContext } from "../types";

it("binds only the buyer label until facts are explicitly cleared for bidder drafting", () => {
  const ctx: SourceGenerationContext = {
    tenantKey: "buyer-key",
    tenantName: "Example Buyer",
    event: {
      id: "event-1",
      code: "INTERNAL-TEST-RH-05",
      name: "Private workflow test",
      archetype: "managed_service",
      rigor: "strategic",
      currentStageKey: "rfp",
      statusLabel: "Release hold",
      owner: "Confidential owner",
      triggerDescription: "Internal negotiation target 12-15%",
      scopeDescription: "Buyer-only scope with legal release hold RH-05",
      estimatedValueUsd: 300_000_000,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
    uploadedEvidence: [],
  };

  const context = buildD09VendorDraftContext(ctx);
  expect(context).toContain("Buyer: Example Buyer");
  expect(context).toContain("not supplied to this drafting context");
  for (const privateField of [
    ctx.tenantKey,
    ctx.event.code,
    ctx.event.name,
    ctx.event.owner,
    ctx.event.triggerDescription,
    ctx.event.scopeDescription,
    "300,000,000",
  ]) {
    expect(context).not.toContain(privateField);
  }
});
