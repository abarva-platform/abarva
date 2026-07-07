import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { shouldUseApexRetailAdapter } from "@/app/api/v1/source/[eventId]/nexus/ask/route";

describe("Source Nexus ask route tenant scoping", () => {
  it("does not use the Apex adapter when a non-Apex active client is known", () => {
    expect(
      shouldUseApexRetailAdapter(
        "SRC-APX-101",
        "client-lakeshore",
        "lakeshore",
      ),
    ).toBe(false);
    expect(
      shouldUseApexRetailAdapter("APX-AMS-2026", "client-meridian", "meridian"),
    ).toBe(false);
  });

  it("uses the Apex adapter only for Apex client boundaries or unbound Apex shell probes", () => {
    expect(
      shouldUseApexRetailAdapter("SRC-APX-101", "apexretail", "apexretail"),
    ).toBe(true);
    expect(
      shouldUseApexRetailAdapter("SRC-APX-101", "apex-retail", undefined),
    ).toBe(true);
    expect(
      shouldUseApexRetailAdapter("SRC-APX-101", undefined, undefined),
    ).toBe(true);
  });

  it("404s unresolved event-scoped requests instead of falling back to seed context", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/v1/source/[eventId]/nexus/ask/route.ts",
      ),
      "utf8",
    );

    expect(src).toContain("if (eventId && !liveEventDetail)");
    expect(src).toContain("No Source event found for the active client.");
  });

  it("pins fallback event lookup to the already-resolved active client key", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/v1/source/[eventId]/nexus/ask/route.ts",
      ),
      "utf8",
    );

    expect(src).toContain("getSourcingEvent(eventId, activeClient?.key)");
  });

  it("normalizes SkyHarbor contract optimization answer context before assembly", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/v1/source/[eventId]/nexus/ask/route.ts",
      ),
      "utf8",
    );

    expect(src).toContain("normalizeSourceContractOptimizationDisplay");
    expect(src).toContain('accountName: "SkyHarbor Air"');
    expect(src).toContain('code: "SKYH-AMS-CONTRACT-OPT-2026"');
    expect(src).toContain('name: "SkyHarbor Air AMS Contract Optimization"');
    expect(src).toContain("tenantName: displayTenantName");
    expect(src).toContain("activeClientName: displayTenantName");
  });

  it("pins contract optimization brief export lookup to the active client key", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts",
      ),
      "utf8",
    );

    expect(src).toContain("getSourcingEvent(eventId, activeClient?.key)");
  });

  it("normalizes contract optimization exports to a client-facing SkyHarbor identity", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts",
      ),
      "utf8",
    );

    expect(src).toContain('tenantName: "SkyHarbor Air"');
    expect(src).toContain('eventCode: "SKYH-AMS-CONTRACT-OPT-2026"');
    expect(src).not.toContain('tenantName: activeClient?.name');
    expect(src).not.toContain('"SKYH-AMS-RFP-2026"');
    expect(src).not.toContain('"Airline Demo"');
  });
});
