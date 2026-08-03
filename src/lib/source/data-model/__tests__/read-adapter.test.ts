import { azureRead } from "@/lib/data-plane/azureRead";
import { listContractVendor360 } from "../read-adapter";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: jest.fn() },
}));

const mockedQuery = azureRead.query as jest.Mock;

describe("listContractVendor360 tenant-key aliasing", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
    mockedQuery.mockResolvedValue([]);
  });

  it("expands a known SkyHarbor alias to the full alias family, including the audit-verified spelling", async () => {
    await listContractVendor360("skyharbor-air");
    const [, params] = mockedQuery.mock.calls[0];
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
    const [, params] = mockedQuery.mock.calls[0];
    expect(params[0]).toEqual(
      expect.arrayContaining([
        "skyharbor",
        "skyharbor-air",
        "skyharbor_global",
      ]),
    );
  });

  it("passes an unrelated tenant key through unexpanded, not fanned out to SkyHarbor's aliases", async () => {
    await listContractVendor360("apex-retail");
    const [, params] = mockedQuery.mock.calls[0];
    expect(params[0]).toEqual(["apex-retail"]);
  });
});
