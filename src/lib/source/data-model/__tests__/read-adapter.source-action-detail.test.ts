import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getSourceContractActionCandidate,
  getSourceContractEvidenceCoverage,
} from "@/lib/source/data-model/read-adapter";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: jest.fn() },
}));

const withSession = azureRead.withSession as jest.Mock;

describe("targeted supplemental contract detail", () => {
  beforeEach(() => withSession.mockReset());

  it("queries only the authorized tenant and exact contract for action evidence", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    withSession.mockImplementation(async (callback) => callback(async (sql: string, params: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("set_config")) return [];
      if ((params[0] as string[]).includes("meridian-health") && (params[0] as string[]).length === 1) return [];
      return [{
        tenant_key: "meridian_health_global",
        contract_id: "CTR-ACTION-1",
        vendor_ref: "VEN-1",
        vendor_name: "Example Vendor",
        candidate_amount_usd: "12000",
      }];
    }));

    const row = await getSourceContractActionCandidate("meridian", "CTR-ACTION-1");

    expect(row).toMatchObject({ contract_id: "CTR-ACTION-1", candidate_amount_usd: 12000 });
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ sql: expect.stringContaining("set_config('app.tenant_key'"), params: ["meridian-health"] }),
      expect.objectContaining({ sql: expect.stringContaining("set_config('app.tenant_key'"), params: ["meridian_health_global"] }),
      expect.objectContaining({
        sql: expect.stringMatching(/FROM source\.contract_action_candidate_v1[\s\S]*tenant_key = ANY\(\$1::text\[\]\)[\s\S]*contract_id = \$2[\s\S]*LIMIT 1/),
        params: [expect.arrayContaining(["meridian_health_global"]), "CTR-ACTION-1"],
      }),
    ]));
  });

  it("rejects a mismatched contract or tenant even if a read returns it", async () => {
    withSession.mockImplementation(async (callback) => callback(async (sql: string) => {
      if (sql.includes("set_config")) return [];
      return [{ tenant_key: "skyharbor_global", contract_id: "CTR-ACTION-1", vendor_ref: "VEN-2" }];
    }));
    await expect(getSourceContractActionCandidate("meridian", "CTR-ACTION-1")).resolves.toBeNull();
    withSession.mockImplementation(async (callback) => callback(async (sql: string) => {
      if (sql.includes("set_config")) return [];
      return [{ tenant_key: "meridian", contract_id: "CTR-OTHER", vendor_ref: "VEN-1" }];
    }));
    await expect(getSourceContractActionCandidate("meridian", "CTR-ACTION-1")).resolves.toBeNull();
  });

  it("uses the same tenant and contract fence for supplemental coverage", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    withSession.mockImplementation(async (callback) => callback(async (sql: string, params: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("set_config")) return [];
      return [{ tenant_key: "meridian", contract_id: "CTR-EVIDENCE-1", vendor_ref: "VEN-1", vendor_name: "Example Vendor", contract_name: "Depth record", scope_rows: "2", critical_scope_rows: "1" }];
    }));
    const row = await getSourceContractEvidenceCoverage("meridian", "CTR-EVIDENCE-1");
    expect(row).toMatchObject({ contract_id: "CTR-EVIDENCE-1", scope_rows: 2 });
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sql: expect.stringMatching(/FROM source\.contract_evidence_coverage_v1[\s\S]*tenant_key = ANY\(\$1::text\[\]\)[\s\S]*contract_id = \$2[\s\S]*LIMIT 1/),
        params: [expect.arrayContaining(["meridian-health"]), "CTR-EVIDENCE-1"],
      }),
    ]));
  });
});
