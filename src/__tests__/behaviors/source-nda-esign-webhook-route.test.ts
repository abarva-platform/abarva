const runtimeMock = jest.fn();
const storeMock = jest.fn();
const processMock = jest.fn();
const uploadMock = jest.fn();

jest.mock("@/lib/source/esign/runtime", () => ({
  createSourceNdaEsignRuntime: (...args: unknown[]) => runtimeMock(...args),
}));
jest.mock("@/lib/source/esign/webhook-repository", () => ({
  createWebhookEnvelopeStore: () => storeMock(),
}));
jest.mock("@/lib/source/esign/webhook-processing", () => ({
  processVerifiedEsignEvent: (...args: unknown[]) => processMock(...args),
}));
jest.mock("@/lib/source/esign/webhook-blob-store", () => ({
  uploadCompletedNdaFile: (...args: unknown[]) => uploadMock(...args),
}));

import { POST } from "@/app/api/webhooks/esign/route";

const verifyWebhook = jest.fn();
const url = "https://app.abarva.ai/api/webhooks/esign";
const signedRequest = (signature = "signature", body = "{}") => new Request(url, {
  method: "POST", body,
  headers: { "content-type": "application/json", "x-docusign-signature-1": signature },
});

beforeEach(() => {
  jest.clearAllMocks();
  runtimeMock.mockReturnValue({ provider: { verifyWebhook }, fallback: "upload" });
  storeMock.mockReturnValue({ read: jest.fn() });
  verifyWebhook.mockResolvedValue({
    envelopeId: "11111111-1111-4111-8111-111111111111", status: "completed",
  });
  processMock.mockResolvedValue({ state: "processed" });
});

describe("public DocuSign demo callback", () => {
  it("refuses an invalid signature before any envelope or Blob read", async () => {
    verifyWebhook.mockRejectedValueOnce(new Error("invalid_signature"));
    const response = await POST(signedRequest("bad"));
    expect(response.status).toBe(401);
    expect(processMock).not.toHaveBeenCalled();
    expect(storeMock).not.toHaveBeenCalled();
  });

  it("does not accept unsigned or unconfigured callbacks", async () => {
    expect((await POST(signedRequest(""))).status).toBe(401);
    expect(verifyWebhook).not.toHaveBeenCalled();
    runtimeMock.mockReturnValue({ provider: null, fallback: "upload" });
    expect((await POST(signedRequest())).status).toBe(503);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("processes a verified callback only for the synthetic tenant", async () => {
    const response = await POST(signedRequest());
    expect(response.status).toBe(202);
    expect(runtimeMock).toHaveBeenCalledWith("meridian-health");
    expect(verifyWebhook).toHaveBeenCalledWith({ body: "{}", signature: "signature" });
    expect(storeMock).toHaveBeenCalledTimes(1);
    expect(processMock).toHaveBeenCalledWith(
      { envelopeId: "11111111-1111-4111-8111-111111111111", status: "completed" },
      expect.objectContaining({ provider: expect.objectContaining({ verifyWebhook }), upload: expect.any(Function) }),
    );
  });

  it("rejects oversized bodies and retries an envelope not yet committed", async () => {
    const oversized = "x".repeat(260_000);
    expect((await POST(signedRequest("signature", oversized))).status).toBe(413);
    expect(verifyWebhook).not.toHaveBeenCalled();
    processMock.mockResolvedValueOnce({ state: "not_found" });
    expect((await POST(signedRequest())).status).toBe(503);
  });
});
