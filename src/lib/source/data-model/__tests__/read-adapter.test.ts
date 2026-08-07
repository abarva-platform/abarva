import { azureRead } from "@/lib/data-plane/azureRead";
import { listContractVendor360 } from "../read-adapter";

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
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["meridian-health"],
    ]);
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
});
