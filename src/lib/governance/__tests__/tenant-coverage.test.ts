import {
  aggregateTenantCoverage,
  renderTenantCoverageMarkdown,
  type LedgerGroup,
} from "../tenant-coverage";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

function group(
  over: Partial<LedgerGroup> & Pick<LedgerGroup, "client_key">,
): LedgerGroup {
  return {
    agent_readiness_status: "not_reviewed",
    retrievability: "committed_not_indexed",
    count: 0,
    ...over,
  };
}

describe("aggregateTenantCoverage", () => {
  it("represents EVERY canonical tenant + corpus_global", () => {
    const r = aggregateTenantCoverage([
      group({ client_key: "lakeshore-holdings", count: 179 }),
    ]);
    for (const key of CANONICAL_TENANT_KEYS) {
      expect(r.tenants.some((t) => t.client_key === key)).toBe(true);
    }
    expect(r.tenants.some((t) => t.client_key === "corpus_global")).toBe(true);
  });

  it("flags canonical tenants with no readiness rows (SkyHarbor guarantee)", () => {
    const r = aggregateTenantCoverage([
      group({ client_key: "lakeshore-holdings", count: 10 }),
    ]);
    expect(r.missing_tenants).toContain("skyharbor-air");
    const md = renderTenantCoverageMarkdown(r, "2026-06-08T00:00:00Z");
    expect(md).toMatch(/NO DATA FOUND/);
  });

  it("buckets statuses and computes governed %", () => {
    const r = aggregateTenantCoverage([
      group({
        client_key: "meridian-health",
        agent_readiness_status: "agent_ready",
        retrievability: "search_indexed",
        count: 30,
      }),
      group({
        client_key: "meridian-health",
        agent_readiness_status: "not_reviewed",
        count: 70,
      }),
      group({
        client_key: "meridian-health",
        agent_readiness_status: "restricted",
        count: 0,
      }),
    ]);
    const m = r.tenants.find((t) => t.client_key === "meridian-health")!;
    expect(m.total).toBe(100);
    expect(m.agent_ready).toBe(30);
    expect(m.retrievable).toBe(30);
    expect(m.not_reviewed).toBe(70);
    expect(m.governed_pct).toBe(30);
  });

  it("counts blocked + quarantined together and restricted separately", () => {
    const r = aggregateTenantCoverage([
      group({
        client_key: "apex-retail",
        agent_readiness_status: "blocked",
        count: 5,
      }),
      group({
        client_key: "apex-retail",
        agent_readiness_status: "quarantined",
        count: 3,
      }),
      group({
        client_key: "apex-retail",
        agent_readiness_status: "restricted",
        count: 2,
      }),
    ]);
    const a = r.tenants.find((t) => t.client_key === "apex-retail")!;
    expect(a.blocked).toBe(8);
    expect(a.restricted).toBe(2);
  });

  it("rolls up grand totals", () => {
    const r = aggregateTenantCoverage([
      group({
        client_key: "apex-retail",
        agent_readiness_status: "agent_ready",
        count: 10,
      }),
      group({ client_key: "first-capital", count: 5 }),
    ]);
    expect(r.grand_total).toBe(15);
    expect(r.grand_agent_ready).toBe(10);
  });
});
