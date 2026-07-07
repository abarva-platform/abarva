jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
    maybeSingle: jest.fn(),
  },
}));

import { azureRead } from "@/lib/data-plane/azureRead";

import { loadTenantAiPolicyRecord } from "../tenant-policy";
import {
  resolveTenantClientUuid,
  tenantLookupCandidates,
} from "../tenant-client-resolver";
import type { TenantAiPolicy } from "../types";

const queryMock = azureRead.query as jest.MockedFunction<
  typeof azureRead.query
>;
const maybeSingleMock = azureRead.maybeSingle as jest.MockedFunction<
  typeof azureRead.maybeSingle
>;

const CLIENT_UUID = "11111111-1111-4111-8111-111111111111";

const permissivePolicy: TenantAiPolicy = {
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: false,
  maxDataClass: "confidential",
  requireRedaction: false,
  requireHumanApprovalForExports: false,
  promptResponseRetentionDays: 7,
};

describe("tenant client resolver", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("expands canonical dashed tenant keys to legacy app aliases", () => {
    expect(tenantLookupCandidates("apex-retail")).toEqual(
      expect.arrayContaining(["apex-retail", "apexretail", "apex retail"]),
    );
    expect(tenantLookupCandidates("first-capital")).toEqual(
      expect.arrayContaining(["first-capital", "firstcapital", "arcturus"]),
    );
  });

  it("resolves dashed tenant keys to clients.id before AI policy/audit use", async () => {
    queryMock.mockResolvedValue([
      {
        id: CLIENT_UUID,
        ai_policy: permissivePolicy,
      },
    ]);

    await expect(resolveTenantClientUuid("apex-retail")).resolves.toBe(
      CLIENT_UUID,
    );
    const policy = await loadTenantAiPolicyRecord("apex-retail");

    expect(policy).toEqual({
      tenantId: CLIENT_UUID,
      policy: permissivePolicy,
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("to_jsonb(c)->>'key'"),
      [
        expect.arrayContaining(["apex-retail", "apexretail"]),
        "apex-retail",
      ],
    );
  });

  it("looks up UUID input directly by clients.id", async () => {
    maybeSingleMock.mockResolvedValue({
      id: CLIENT_UUID,
      ai_policy: permissivePolicy,
    });

    await expect(loadTenantAiPolicyRecord(CLIENT_UUID)).resolves.toEqual({
      tenantId: CLIENT_UUID,
      policy: permissivePolicy,
    });
    expect(maybeSingleMock).toHaveBeenCalledWith({
      table: "clients",
      columns: ["id", "ai_policy"],
      where: { id: CLIENT_UUID },
    });
    expect(queryMock).not.toHaveBeenCalled();
  });
});
