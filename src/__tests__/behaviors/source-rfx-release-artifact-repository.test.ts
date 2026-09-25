const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: (...args: unknown[]) => withSessionMock(...args) },
}));

import { readArtifactsForEvent } from "@/lib/source/rfx-delivery/release-artifact-repository";

const eventId = "11111111-1111-4111-8111-111111111111";
const artifactId = "22222222-2222-4222-8222-222222222222";
const hash = "a".repeat(64);
const row = {
  id: artifactId,
  tenant_key: "tenant-1",
  source_event_id: eventId,
  sha256: hash,
  lifecycle_state: "current",
  deleted_at: null,
};

describe("Stage 06 source artifact read", () => {
  beforeEach(() => {
    runMock.mockReset();
    withSessionMock.mockReset();
    withSessionMock.mockImplementation(async (callback: (run: typeof runMock) => unknown) => callback(runMock));
  });

  it("reads the requested artifact IDs only within the tenant and event", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([row]);
    await expect(readArtifactsForEvent({ clientKey: "tenant-1", eventId, artifactIds: [artifactId] }))
      .resolves.toEqual({ registryAvailable: true, artifacts: [{
        artifactId, tenantKey: "tenant-1", eventId, sha256: hash,
        lifecycleState: "current", deletedAt: null,
      }] });
    expect(runMock.mock.calls[0]?.[0]).toContain("set_config('app.tenant_key'");
    const sql = runMock.mock.calls[1]?.[0] as string;
    expect(sql).toContain("FROM source_artifacts");
    expect(sql).toContain("tenant_key = $1");
    expect(sql).toContain("source_event_id = $2");
    expect(sql).toContain("id = ANY($3::uuid[])");
    expect(runMock.mock.calls[1]?.[1]).toEqual(["tenant-1", eventId, [artifactId]]);
  });

  it("distinguishes an empty match from an unavailable registry", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(readArtifactsForEvent({ clientKey: "tenant-1", eventId, artifactIds: [artifactId] }))
      .resolves.toEqual({ registryAvailable: true, artifacts: [] });
    withSessionMock.mockRejectedValueOnce(new Error("relation unavailable"));
    await expect(readArtifactsForEvent({ clientKey: "tenant-1", eventId, artifactIds: [artifactId] }))
      .resolves.toEqual({ registryAvailable: false, artifacts: [] });
  });

  it.each([
    { tenant_key: "tenant-2" },
    { source_event_id: "33333333-3333-4333-8333-333333333333" },
    { id: "44444444-4444-4444-8444-444444444444" },
    { sha256: "invalid" },
  ])("fails closed on an inconsistent returned row: %p", async (change) => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...row, ...change }]);
    await expect(readArtifactsForEvent({ clientKey: "tenant-1", eventId, artifactIds: [artifactId] }))
      .resolves.toEqual({ registryAvailable: false, artifacts: [] });
  });

  it("refuses malformed or duplicate identifiers without querying", async () => {
    await expect(readArtifactsForEvent({ clientKey: "", eventId, artifactIds: [artifactId] }))
      .resolves.toEqual({ registryAvailable: false, artifacts: [] });
    await expect(readArtifactsForEvent({ clientKey: "tenant-1", eventId, artifactIds: [artifactId, artifactId] }))
      .resolves.toEqual({ registryAvailable: false, artifacts: [] });
    expect(withSessionMock).not.toHaveBeenCalled();
  });
});
