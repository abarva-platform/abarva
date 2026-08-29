import { readSourceContractDepthFacts } from "../project-tower-mart";

class FakeClient {
  queries: Array<{ sql: string; values?: unknown[] }> = [];

  async query(sql: string, values?: unknown[]) {
    this.queries.push({ sql, values });
    if (sql.includes("FROM source.contract_360")) {
      return {
        rows: [
          {
            contract_id: "MER-TECH-M365-001",
            contract_name: "Microsoft 365 Enterprise Agreement",
            vendor_name: "Microsoft",
            annual_contract_value: "4200000",
            actual_annual_spend: "4180000",
            authority_state: "accepted",
            quality_state: "reviewed",
            knowledge_baseline_ref: "load-run-1",
          },
        ],
      };
    }
    return { rows: [] };
  }
}

describe("project-tower-mart Source contract bridge", () => {
  it("sets Source tenant context before reading guarded consumption views", async () => {
    const client = new FakeClient();

    const facts = await readSourceContractDepthFacts(client as never, {
      tenantKey: "meridian-health",
      tenantName: "Meridian Health",
      clientId: "client-123",
    });

    expect(client.queries[0]).toEqual({
      sql: "SELECT set_config('app.tenant_key', $1, false)",
      values: ["meridian-health"],
    });
    expect(client.queries.some((query) => query.sql.includes("source.contract_360"))).toBe(true);
    expect(client.queries.some((query) => query.sql.includes("annual_value AS annual_contract_value"))).toBe(true);
    expect(client.queries.some((query) => query.sql.includes("consumption.sourcing_opportunity_v1"))).toBe(true);
    expect(client.queries.at(-1)).toEqual({
      sql: "SELECT set_config('app.tenant_key', '', false)",
      values: undefined,
    });
    expect(facts.map((fact) => fact.fact_key)).toEqual([
      "meridian-health::source-contract-funding::mer-tech-m365-001",
      "meridian-health::source-contract-actual-spend::mer-tech-m365-001",
    ]);
  });

  it("fails loudly when a Source consumption view cannot be read", async () => {
    const client = {
      async query(sql: string) {
        if (sql.includes("source.contract_360")) {
          throw new Error("relation does not exist");
        }
        return { rows: [] };
      },
    };

    await expect(
      readSourceContractDepthFacts(client as never, {
        tenantKey: "meridian-health",
        tenantName: "Meridian Health",
        clientId: "client-123",
      }),
    ).rejects.toThrow("source_contract_depth_read_failed: relation does not exist");
  });
});
