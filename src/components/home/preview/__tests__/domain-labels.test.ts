import { DOMAIN_LABELS, domainLabel } from "../domain-labels";
import { getHomeReviewBundle, HOME_PREVIEW_TENANT_KEYS } from "@/lib/home/preview/golden-snapshot";

describe("domainLabel", () => {
  it("returns the configured label for a known domain", () => {
    expect(domainLabel("vendor_contract")).toBe("Vendors & Contracts");
  });

  it("title-cases an unrecognized domain rather than showing raw snake_case", () => {
    expect(domainLabel("some_future_domain")).toBe("Some Future Domain");
  });

  it("every domain actually present in either accepted tenant's real data has a real label, not a fallback", () => {
    // Pins the DOMAIN_LABELS table against real generator output: a new domain the compiler starts
    // emitting should surface here as a failing test, not silently render as a title-cased guess.
    for (const tenantKey of HOME_PREVIEW_TENANT_KEYS) {
      const bundle = getHomeReviewBundle(tenantKey)!;
      const domains = new Set<string>();
      for (const row of [...bundle.thesis.signalPacket.signals, ...bundle.thesis.signalPacket.contextItems]) {
        for (const d of row.domains) domains.add(d);
      }
      for (const d of domains) {
        expect(DOMAIN_LABELS).toHaveProperty(d);
      }
    }
  });
});
