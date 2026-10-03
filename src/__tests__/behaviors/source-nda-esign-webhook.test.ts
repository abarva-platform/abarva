import { createHash } from "node:crypto";
import type { EsignProvider, VerifiedEsignEvent } from "@/lib/source/esign/provider";
import {
  processVerifiedEsignEvent,
  type WebhookDependencies,
  type WebhookEnvelopeStore,
} from "@/lib/source/esign/webhook-processing";

const envelopeId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const signedDocument = Buffer.from("%PDF-1.7 signed synthetic document");
const certificate = Buffer.from("%PDF-1.7 synthetic completion certificate");
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

function harness(initialStatus: "sent" | "viewed" | "completed" | "declined" = "sent") {
  let status = initialStatus;
  const provider = {
    fetchCompletedDocuments: jest.fn(async () => ({ signedDocument, certificate })),
  } as unknown as EsignProvider;
  const store: WebhookEnvelopeStore = {
    read: jest.fn(async () => ({
      clientKey: "meridian-health", eventId, vendorId: "VEN-TEST-1",
      providerEnvelopeId: envelopeId, status,
    })),
    markViewed: jest.fn(async () => {
      if (status !== "sent") return false;
      status = "viewed";
      return true;
    }),
    markDeclined: jest.fn(async () => {
      if (status !== "sent" && status !== "viewed") return false;
      status = "declined";
      return true;
    }),
    markCompleted: jest.fn(async () => {
      if (status !== "sent" && status !== "viewed") return false;
      status = "completed";
      return true;
    }),
  };
  const upload = jest.fn(async (input: Parameters<WebhookDependencies["upload"]>[0]) =>
    `source-events/${input.tenantKey}/${input.eventId}/${input.fileName}`);
  return { provider, store, upload, getStatus: () => status };
}

function event(status: VerifiedEsignEvent["status"]): VerifiedEsignEvent {
  return { envelopeId, status };
}

describe("verified Source NDA webhook processing", () => {
  it("stages both signed files before marking an envelope complete, without granting NDA authority", async () => {
    const deps = harness();
    const result = await processVerifiedEsignEvent(event("completed"), deps);
    expect(result).toEqual({ state: "processed" });
    expect(deps.upload).toHaveBeenCalledTimes(2);
    expect(deps.upload.mock.calls[0][0]).toMatchObject({
      eventId, vendorId: "VEN-TEST-1", fileName: `signed-${hash(signedDocument)}.pdf`,
    });
    expect(deps.upload.mock.calls[1][0]).toMatchObject({
      eventId, vendorId: "VEN-TEST-1", fileName: `certificate-${hash(certificate)}.pdf`,
    });
    expect(deps.store.markCompleted).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "meridian-health", eventId, vendorId: "VEN-TEST-1", providerEnvelopeId: envelopeId,
    }), {
      signedDocumentRef: expect.stringContaining(`signed-${hash(signedDocument)}.pdf`),
      signedDocumentSha256: hash(signedDocument),
      certificateRef: expect.stringContaining(`certificate-${hash(certificate)}.pdf`),
      certificateSha256: hash(certificate),
    });
    expect(deps.getStatus()).toBe("completed");
  });

  it("does not download or upload files on a duplicate completion", async () => {
    const deps = harness("completed");
    expect(await processVerifiedEsignEvent(event("completed"), deps)).toEqual({ state: "duplicate" });
    expect(deps.provider.fetchCompletedDocuments).not.toHaveBeenCalled();
    expect(deps.upload).not.toHaveBeenCalled();
  });

  it("refuses a completion after decline", async () => {
    const deps = harness("declined");
    expect(await processVerifiedEsignEvent(event("completed"), deps)).toEqual({ state: "conflict" });
    expect(deps.provider.fetchCompletedDocuments).not.toHaveBeenCalled();
    expect(deps.upload).not.toHaveBeenCalled();
  });

  it("does not mark completion when either PDF is invalid or upload fails", async () => {
    const deps = harness();
    jest.mocked(deps.provider.fetchCompletedDocuments).mockResolvedValueOnce({
      signedDocument: Buffer.from("not a PDF"), certificate,
    });
    await expect(processVerifiedEsignEvent(event("completed"), deps)).rejects.toThrow("invalid_completed_document");
    expect(deps.upload).not.toHaveBeenCalled();
    expect(deps.store.markCompleted).not.toHaveBeenCalled();

    jest.mocked(deps.provider.fetchCompletedDocuments).mockResolvedValueOnce({ signedDocument, certificate });
    deps.upload.mockRejectedValueOnce(new Error("blob unavailable"));
    await expect(processVerifiedEsignEvent(event("completed"), deps)).rejects.toThrow("blob unavailable");
    expect(deps.store.markCompleted).not.toHaveBeenCalled();
  });

  it("rejects an envelope outside the bound tenant and does not touch provider files", async () => {
    const deps = harness();
    jest.mocked(deps.store.read).mockResolvedValueOnce(null);
    expect(await processVerifiedEsignEvent(event("completed"), deps)).toEqual({ state: "not_found" });
    expect(deps.provider.fetchCompletedDocuments).not.toHaveBeenCalled();
    expect(deps.upload).not.toHaveBeenCalled();
    jest.mocked(deps.store.read).mockResolvedValueOnce({
      clientKey: "another-tenant", eventId, vendorId: "VEN-TEST-1",
      providerEnvelopeId: envelopeId, status: "sent",
    });
    expect(await processVerifiedEsignEvent(event("completed"), deps)).toEqual({ state: "not_found" });
    expect(deps.provider.fetchCompletedDocuments).not.toHaveBeenCalled();
  });

  it("never downgrades a terminal state on a late sent or viewed callback", async () => {
    const deps = harness("completed");
    expect(await processVerifiedEsignEvent(event("viewed"), deps)).toEqual({ state: "duplicate" });
    expect(await processVerifiedEsignEvent(event("sent"), deps)).toEqual({ state: "duplicate" });
    expect(deps.store.markViewed).not.toHaveBeenCalled();
    expect(deps.getStatus()).toBe("completed");
  });
});
