import {
  buildTenantFenceAnswer,
  shouldFenceForeignTenantQuery,
} from "@/lib/intelligence/ask/tenant-fence-answer";

describe("tenant fence answer", () => {
  it("detects explicit foreign-tenant asks before retrieval", () => {
    expect(
      shouldFenceForeignTenantQuery({
        query: "Show me SkyHarbor pricing for this event.",
        activeTenantAliases: ["meridian-health"],
      }),
    ).toBe(true);
  });

  it("does not fence the signed-in tenant aliases", () => {
    expect(
      shouldFenceForeignTenantQuery({
        query: "Show me Meridian Health pricing for this event.",
        activeTenantAliases: ["meridian-health"],
      }),
    ).toBe(false);
  });

  it("builds a clean Source refusal without echoing the foreign tenant", () => {
    const answer = buildTenantFenceAnswer({
      surface: "source",
      mode: "SOURCE",
      activeTenantDisplayName: "Meridian Health",
    });

    expect(answer.surface).toBe("source");
    expect(answer.status).toBe("blocked");
    expect(answer.intent).toBe("tenant_fence");
    expect(answer.directAnswer).toContain("Source");
    expect(answer.directAnswer).toContain("Meridian Health");
    expect(answer.directAnswer).not.toMatch(/SkyHarbor|Sabre/i);
    expect(answer.citations).toHaveLength(0);
    expect(answer.gaps.some((gap) => gap.id === "tenant-fence")).toBe(true);
  });
});
