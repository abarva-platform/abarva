import {
  aggregateInventory,
  renderInventoryReportMarkdown,
  type InventoryProbe,
} from "../inventory";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

function probe(
  over: Partial<InventoryProbe> & Pick<InventoryProbe, "client_key" | "store">,
): InventoryProbe {
  return {
    source_layer: "tenant_context",
    total: 0,
    missing_source_basis: 0,
    missing_confidence: 0,
    missing_tenant_id: 0,
    missing_classification: 0,
    not_indexed: 0,
    agent_ready: 0,
    blocked: 0,
    ...over,
  };
}

describe("inventory aggregation", () => {
  it("represents EVERY canonical tenant + corpus_global, even with no probes", () => {
    const report = aggregateInventory([
      probe({
        client_key: "lakeshore-holdings",
        store: "enterprise_context_chunks",
        total: 179,
        agent_ready: 0,
        not_indexed: 179,
        missing_confidence: 179,
      }),
      probe({
        client_key: "meridian-health",
        store: "ai_initiatives",
        total: 8,
        agent_ready: 8,
      }),
    ]);
    for (const key of CANONICAL_TENANT_KEYS) {
      expect(report.tenants.some((t) => t.client_key === key)).toBe(true);
    }
    expect(report.tenants.some((t) => t.client_key === "corpus_global")).toBe(
      true,
    );
  });

  it("flags canonical tenants with NO data found (the SkyHarbor guarantee)", () => {
    const report = aggregateInventory([
      probe({
        client_key: "lakeshore-holdings",
        store: "enterprise_context_chunks",
        total: 179,
      }),
    ]);
    expect(report.missing_tenants).toContain("skyharbor-air");
    const sky = report.tenants.find((t) => t.client_key === "skyharbor-air");
    expect(sky?.present).toBe(false);
    const md = renderInventoryReportMarkdown(report, "2026-06-08T00:00:00Z");
    expect(md).toMatch(/NO DATA FOUND/);
    expect(md).toMatch(/skyharbor-air/);
  });

  it("rolls up totals, agent-ready, blocked, not-indexed, and missing fields per scope", () => {
    const report = aggregateInventory([
      probe({
        client_key: "lakeshore-holdings",
        store: "s1",
        total: 100,
        agent_ready: 40,
        blocked: 10,
        not_indexed: 50,
        missing_source_basis: 20,
        missing_confidence: 30,
      }),
      probe({
        client_key: "lakeshore-holdings",
        store: "s2",
        total: 50,
        agent_ready: 50,
      }),
    ]);
    const lake = report.tenants.find(
      (t) => t.client_key === "lakeshore-holdings",
    )!;
    expect(lake.total).toBe(150);
    expect(lake.agent_ready).toBe(90);
    expect(lake.blocked).toBe(10);
    expect(lake.not_indexed).toBe(50);
    expect(lake.missing_fields).toBe(50); // 20 + 30
    expect(lake.stores).toBe(2);
    expect(report.grand_total).toBe(150);
  });

  it("surfaces non-canonical scopes too (so tenant drift is visible)", () => {
    const report = aggregateInventory([
      probe({ client_key: "arcturus", store: "s1", total: 5 }),
    ]);
    expect(report.tenants.some((t) => t.client_key === "arcturus")).toBe(true);
  });
});
