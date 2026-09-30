import { createHash } from "node:crypto";

import { POST } from "./route";
import { findCurrentAcceptedClientFinal } from "@/lib/source/contracts/current-client-final";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";

const bytes = Buffer.from("# Reviewed synthetic strategy\nA decision-usable final.\n");
const sha256 = createHash("sha256").update(bytes).digest("hex");
const updateArtifactBody = jest.fn(async (input: { columns: Record<string, unknown> }) => ({
  ok: true, data: { id: "state-1", linked_artifact_id: input.columns.linked_artifact_id },
}));
const insertActivityLog = jest.fn(async () => ({ ok: true }));
const download = jest.fn(async () => bytes);
let linkedArtifactId = "later-draft";
let artifactBody = "later draft";
let eventClientKey = "synthetic-tenant";

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    clientId: "client-1", clientKey: "synthetic-tenant", userId: "owner-1",
  })),
  tenancyErrorResponse: jest.fn(() => Response.json({}, { status: 401 })),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ id: "client-1", key: "synthetic-tenant" })),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canUploadSourceArtifacts: true, canApproveSourceStages: true,
  })),
}));
jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: jest.fn((key: string) => key),
}));
jest.mock("@/lib/source/contracts/current-client-final", () => ({
  findCurrentAcceptedClientFinal: jest.fn(),
}));
jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(() => ({ download })),
}));
jest.mock("@/lib/source/artifact-registry/upload-text-extraction", () => ({
  extractSourceUploadText: jest.fn(async () => ({
    text: "# Reviewed synthetic strategy\nA decision-usable final.\n",
    method: "text", warnings: [],
  })),
}));
jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({ updateArtifactBody, insertActivityLog })),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => table === "source_events"
          ? { data: { id: "event-1", client_key: eventClientKey }, error: null }
          : { data: {
              id: "state-1", source_event_id: "event-1", tenant_key: "synthetic-tenant",
              artifact_code: "d01_strategy_memo", stage_key: "strategy",
              status: "approved", body: artifactBody, linked_artifact_id: linkedArtifactId,
              body_generation_metadata: { qualityGate: { passed: true } },
            }, error: null },
      };
      return chain;
    },
  })),
}));

const currentFinal = {
  id: "final-1", sourceEventId: "event-1", tenantKey: "synthetic-tenant",
  artifactType: "d01_strategy_memo", artifactGroup: "approval", status: "client_final",
  lifecycleState: "current", isClientFinal: true, isCurrentAuthoritative: true,
  clientFinalAcceptedBy: "owner-1", clientFinalAcceptedAt: "2026-09-29T14:55:28Z",
  blobContainer: "source-artifacts", blobPath: "synthetic-tenant/event-1/final-1/final.md",
  blobSha256: sha256, fileFormat: "md", fileName: "reviewed-final.md", version: 3,
};
const findFinal = jest.mocked(findCurrentAcceptedClientFinal);
const policy = jest.mocked(loadUserSourceAccessPolicy);

function restore() {
  return POST(new Request("https://app.abarva.ai/restore", { method: "POST" }), {
    params: Promise.resolve({ eventId: "event-1", artifactCode: "d01_strategy_memo" }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  linkedArtifactId = "later-draft";
  artifactBody = "later draft";
  eventClientKey = "synthetic-tenant";
  download.mockResolvedValue(bytes);
  findFinal.mockResolvedValue(currentFinal as never);
  policy.mockResolvedValue({ canUploadSourceArtifacts: true, canApproveSourceStages: true } as never);
});

it("restores the existing accepted final's body and link without creating a new approval", async () => {
  const response = await restore();
  expect(response.status).toBe(200);
  expect(findFinal).toHaveBeenCalledWith("event-1", "synthetic-tenant", "d01_strategy_memo");
  expect(updateArtifactBody).toHaveBeenCalledWith(expect.objectContaining({
    artifactRowId: "state-1",
    columns: expect.objectContaining({
      body: bytes.toString(), linked_artifact_id: "final-1", status: "approved",
      body_generation_metadata: expect.objectContaining({
        clientFinal: expect.objectContaining({ artifactId: "final-1", acceptedBy: "owner-1" }),
      }),
    }),
  }));
  const metadata = updateArtifactBody.mock.calls[0]?.[0].columns.body_generation_metadata as Record<string, unknown>;
  expect(metadata.qualityGate).toBeUndefined();
  expect(insertActivityLog).toHaveBeenCalledWith(expect.objectContaining({
    eventId: "event-1", artifactCode: "d01_strategy_memo",
    actionType: "artifact_client_final_link_restored",
  }));
});

it("does not write when blob bytes disagree with the accepted hash", async () => {
  download.mockResolvedValue(Buffer.from("tampered"));
  expect((await restore()).status).toBe(409);
  expect(updateArtifactBody).not.toHaveBeenCalled();
});

it("does not write without current accepted authority", async () => {
  findFinal.mockResolvedValue(null);
  expect((await restore()).status).toBe(409);
  expect(updateArtifactBody).not.toHaveBeenCalled();
});

it("does not write across tenants", async () => {
  eventClientKey = "other-tenant";
  expect((await restore()).status).toBe(403);
  expect(updateArtifactBody).not.toHaveBeenCalled();
});

it("requires both upload and approval rights", async () => {
  policy.mockResolvedValue({ canUploadSourceArtifacts: true, canApproveSourceStages: false } as never);
  expect((await restore()).status).toBe(403);
  expect(updateArtifactBody).not.toHaveBeenCalled();
});

it("is idempotent when the stage already links the current final", async () => {
  linkedArtifactId = "final-1";
  artifactBody = bytes.toString();
  expect((await restore()).status).toBe(200);
  expect(updateArtifactBody).not.toHaveBeenCalled();
});
