jest.mock("server-only", () => ({}));
jest.mock("../retrievers/ecl-serving-context", () => ({
  isEclProjectionProvider: () => false,
  retrieveEclServingContextSources: async () => [],
}));
jest.mock("../retrievers/curated-dossier", () => ({
  retrieveCuratedDossierSources: async () => ({ sources: [] }),
}));
jest.mock("@/lib/knowledge/tenant-enterprise-context", () => ({
  retrieveTenantEnterpriseSources: async () => [],
  retrieveTenantStructuredFacts: async () => [],
}));
jest.mock("@/lib/knowledge/tenant-technology-context", () => ({
  retrieveTenantTechnologySources: async () => [],
}));
jest.mock("../retrievers/retail-overlay", () => ({
  retrieveRetailOverlaySources: async () => [],
}));
jest.mock("../router", () => ({
  route: async () => ({ sources: [] }),
}));
jest.mock("../retrievers/worldview", () => ({
  retrieveWorldview: async () => ({ sources: [] }),
}));
jest.mock("../tenant-fact-fingerprint", () => ({
  getTenantFactFingerprint: async () => ({}),
  formatTenantFactAvailabilityBlock: () => "",
}));
jest.mock("../canonical-landscape-source", () => ({
  buildCanonicalLandscapeSource: async () => null,
}));
jest.mock("../client-grounding-packet", () => ({
  buildClientGroundingPacketSource: () => null,
}));

import { askIntelligence } from "../index";
import { buildFallbackNativeCanvasBlock } from "../synthesizer";
import type { AskSource } from "../types";

describe("retired CIO back-office source", () => {
  const question = "Which shared services AI investments should the CIO fund first?";

  it("keeps the relevant question on the generic Ask path without a canned source", async () => {
    const ask = askIntelligence(question, {
      tenantClientKey: "lakeshore-holdings",
    });

    expect((await ask.next()).value?.type).toBe("classified");
    const selected = await ask.next();
    expect(selected.value?.type).toBe("sources");
    expect(selected.value?.sources).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "industrial-cio-backoffice-readiness" }),
      ]),
    );
    await ask.return({ type: "done" });
  });

  it("cannot turn a retired source marker into a canned native exhibit", () => {
    const retiredMarker: AskSource = {
      type: "TENANT",
      id: "industrial-cio-backoffice-readiness",
      name: "Retired source marker",
      detail: "No current reviewed evidence",
    };

    expect(
      buildFallbackNativeCanvasBlock({
        query: question,
        sources: [retiredMarker],
        tenantClientKey: "lakeshore-holdings",
      }),
    ).toBe("");
  });

});
