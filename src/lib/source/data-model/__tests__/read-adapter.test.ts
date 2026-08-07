import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getContractOptimizationEvidencePack,
  listContractVendor360,
} from "../read-adapter";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: jest.fn() },
}));

const mockedWithSession = azureRead.withSession as jest.Mock;
const run = jest.fn();

describe("listContractVendor360 tenant-key aliasing", () => {
  beforeEach(() => {
    run.mockReset();
    mockedWithSession.mockReset();
    mockedWithSession.mockImplementation(async (fn) => fn(run));
    run.mockResolvedValue([]);
  });

  it("expands a known SkyHarbor alias to the full alias family, including the audit-verified spelling", async () => {
    await listContractVendor360("skyharbor-air");
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["skyharbor_global"],
    ]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(
      expect.arrayContaining([
        "skyharbor",
        "skyharbor-air",
        "skyharbor_global",
      ]),
    );
  });

  it("expands the audit-verified spelling itself to the same family", async () => {
    await listContractVendor360("skyharbor_global");
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(
      expect.arrayContaining([
        "skyharbor",
        "skyharbor-air",
        "skyharbor_global",
      ]),
    );
  });

  it("resolves a different tenant through the same shared alias service", async () => {
    await listContractVendor360("meridian");
    expect(run.mock.calls[0][0]).toBe(
      "SELECT set_config('app.tenant_key', $1, false)",
    );
    expect(run.mock.calls[0][1]).not.toEqual(["skyharbor_global"]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(
      expect.arrayContaining([
        "meridian",
        "meridian-health",
        "healthcare demo",
      ]),
    );
    expect(params[0]).not.toContain("skyharbor_global");
  });

  it("resolves another known tenant through its own aliases without defaulting to SkyHarbor", async () => {
    await listContractVendor360("apex-retail");
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["apex-retail"],
    ]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(
      expect.arrayContaining(["apexretail", "apex-retail", "retail demo"]),
    );
    expect(params[0]).not.toContain("skyharbor_global");
  });

  it("quantifies unapproved rate-card variance inside recoverable leakage evidence", async () => {
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("sourcing_performance_v1")) {
        return [
          {
            row_count: 12,
            credit_calculated: "620000",
            credit_claimed: "0",
            credit_recovered: "0",
            unclaimed_credit: "620000",
          },
        ];
      }
      if (sql.includes("sourcing_spend_monthly_v1")) {
        return [
          {
            row_count: 2,
            invoice_lines: "2",
            off_contract_spend: "185000",
            duplicate_spend: "90000",
          },
        ];
      }
      if (sql.includes("fieldglass_rate_card")) {
        return [
          {
            row_count: 2,
            unapproved_variance_count: "2",
            rate_variance_amount: "410000",
            hours: "20500",
          },
        ];
      }
      return [
        {
          row_count: 0,
          claimable_cost: "0",
          normalized_cost: "0",
          line_item_cost: "0",
        },
      ];
    });

    const pack = await getContractOptimizationEvidencePack(
      "skyharbor",
      "CTR-061",
    );
    const invoiceRate = pack.ledger_items.find(
      (item) => item.ledger_item_id === "recoverable:invoice-rate-card",
    );

    expect(invoiceRate?.amount).toBe(685000);
    expect(invoiceRate?.calculation_rule).toContain(
      "unapproved rate-card variance",
    );
  });
});
