import { createHash } from "node:crypto";
import type { EsignEnvelopeStatus, EsignProvider, VerifiedEsignEvent } from "./provider";

export type WebhookEnvelope = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  providerEnvelopeId: string;
  status: EsignEnvelopeStatus;
};

export type CompletedEnvelopeEvidence = {
  signedDocumentRef: string;
  signedDocumentSha256: string;
  certificateRef: string;
  certificateSha256: string;
};

export type WebhookEnvelopeStore = {
  read(envelopeId: string): Promise<WebhookEnvelope | null>;
  markViewed(envelopeId: string): Promise<boolean>;
  markDeclined(envelopeId: string): Promise<boolean>;
  markCompleted(envelope: WebhookEnvelope, evidence: CompletedEnvelopeEvidence): Promise<boolean>;
};

export type WebhookDependencies = {
  provider: EsignProvider;
  store: WebhookEnvelopeStore;
  upload(input: {
    tenantKey: string;
    eventId: string;
    vendorId: string;
    envelopeId: string;
    fileName: string;
    bytes: Uint8Array;
  }): Promise<string>;
};

export async function processVerifiedEsignEvent(
  event: VerifiedEsignEvent,
  deps: WebhookDependencies,
): Promise<{ state: "processed" | "duplicate" | "conflict" | "not_found" }> {
  const envelope = await deps.store.read(event.envelopeId);
  if (!envelope || envelope.clientKey !== "meridian-health" ||
      envelope.providerEnvelopeId !== event.envelopeId) return { state: "not_found" };

  if (event.status === "sent") return { state: "duplicate" };
  if (event.status === "viewed") {
    if (envelope.status !== "sent") return { state: "duplicate" };
    return { state: (await deps.store.markViewed(event.envelopeId)) ? "processed" : "duplicate" };
  }
  if (event.status === "declined") {
    if (envelope.status === "declined") return { state: "duplicate" };
    if (envelope.status === "completed") return { state: "conflict" };
    return { state: (await deps.store.markDeclined(event.envelopeId)) ? "processed" : "conflict" };
  }

  if (envelope.status === "completed") return { state: "duplicate" };
  if (envelope.status === "declined") return { state: "conflict" };
  const documents = await deps.provider.fetchCompletedDocuments(event.envelopeId);
  const validPdf = (bytes: Uint8Array) =>
    bytes.length >= 5 && bytes.length <= 20_000_000 &&
    Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-";
  if (!validPdf(documents.signedDocument) || !validPdf(documents.certificate)) {
    throw new Error("invalid_completed_document");
  }
  const signedDocumentSha256 = createHash("sha256").update(documents.signedDocument).digest("hex");
  const certificateSha256 = createHash("sha256").update(documents.certificate).digest("hex");
  const common = {
    tenantKey: envelope.clientKey,
    eventId: envelope.eventId,
    vendorId: envelope.vendorId,
    envelopeId: event.envelopeId,
  };
  const signedDocumentRef = await deps.upload({
    ...common, fileName: `signed-${signedDocumentSha256}.pdf`, bytes: documents.signedDocument,
  });
  const certificateRef = await deps.upload({
    ...common, fileName: `certificate-${certificateSha256}.pdf`, bytes: documents.certificate,
  });
  const evidence = { signedDocumentRef, signedDocumentSha256, certificateRef, certificateSha256 };
  if (await deps.store.markCompleted(envelope, evidence)) return { state: "processed" };
  const current = await deps.store.read(event.envelopeId);
  return { state: current?.status === "completed" ? "duplicate" : "conflict" };
}
