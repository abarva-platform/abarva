import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type {
  CompletedEsignDocuments,
  CreateEsignEnvelopeInput,
  EsignEnvelope,
  EsignProvider,
  EsignWebhookInput,
  VerifiedEsignEvent,
} from "@/lib/source/esign/provider";

type StoredEnvelope = {
  input: CreateEsignEnvelopeInput;
  documents: CompletedEsignDocuments | null;
};

export function createInMemoryEsignProvider() {
  const envelopes = new Map<string, StoredEnvelope>();
  const secret = randomBytes(32);
  const sign = (body: string) => createHmac("sha256", secret).update(body).digest("hex");

  const provider: EsignProvider & {
    completeForTest(envelopeId: string, documents: CompletedEsignDocuments): void;
    webhookForTest(envelopeId: string): EsignWebhookInput;
  } = {
    async createEnvelope(input): Promise<EsignEnvelope> {
      if (!input.tenantKey || !input.eventId || !input.vendorId ||
          !/^[a-f0-9]{64}$/.test(input.documentSha256) ||
          createHash("sha256").update(input.documentPdf).digest("hex") !== input.documentSha256 ||
          input.signers.length !== 2 ||
          new Set(input.signers.map((signer) => signer.role)).size !== 2 ||
          new Set(input.signers.map((signer) => signer.recipientId)).size !== 2 ||
          input.signers.some((signer) => !signer.name.trim() || !signer.email.trim() ||
            !signer.signatureAnchor.trim() ||
            (signer.delivery === "embedded") !== Boolean(signer.clientUserId?.trim()))) {
        throw new Error("invalid_envelope");
      }
      const envelopeId = randomUUID();
      envelopes.set(envelopeId, { input, documents: null });
      return { envelopeId, status: "sent" };
    },
    async getSigningLink({ envelopeId, eventId, vendorId, signer, returnUrl }) {
      const envelope = envelopes.get(envelopeId);
      if (!envelope) throw new Error("envelope_not_found");
      if (envelope.input.eventId !== eventId || envelope.input.vendorId !== vendorId) {
        throw new Error("envelope_identity_mismatch");
      }
      if (!envelope.input.signers.some((candidate) =>
        candidate.recipientId === signer.recipientId &&
        candidate.name === signer.name &&
        candidate.clientUserId === signer.clientUserId &&
        candidate.delivery === "embedded")) {
        throw new Error("recipient_not_found");
      }
      const target = new URL("https://esign-fake.invalid/sign");
      target.searchParams.set("envelope", envelopeId);
      target.searchParams.set("recipient", signer.recipientId);
      target.searchParams.set("return", returnUrl);
      return target.toString();
    },
    async verifyWebhook({ body, signature }): Promise<VerifiedEsignEvent> {
      const expected = Buffer.from(sign(body), "hex");
      const received = /^[a-f0-9]{64}$/.test(signature)
        ? Buffer.from(signature, "hex") : Buffer.alloc(0);
      if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        throw new Error("invalid_signature");
      }
      let parsed: { envelopeId?: string; status?: string };
      try {
        parsed = JSON.parse(body) as { envelopeId?: string; status?: string };
      } catch {
        throw new Error("invalid_event");
      }
      const envelope = envelopes.get(parsed.envelopeId ?? "");
      if (!envelope || parsed.status !== "completed" || !envelope.documents) {
        throw new Error("invalid_event");
      }
      return {
        envelopeId: parsed.envelopeId!,
        status: "completed",
      };
    },
    async fetchCompletedDocuments(envelopeId) {
      const envelope = envelopes.get(envelopeId);
      if (!envelope) throw new Error("envelope_not_found");
      if (!envelope.documents) throw new Error("envelope_not_completed");
      return {
        signedDocument: envelope.documents.signedDocument.slice(),
        certificate: envelope.documents.certificate.slice(),
      };
    },
    completeForTest(envelopeId, documents) {
      const envelope = envelopes.get(envelopeId);
      if (!envelope) throw new Error("envelope_not_found");
      envelope.documents = {
        signedDocument: documents.signedDocument.slice(),
        certificate: documents.certificate.slice(),
      };
    },
    webhookForTest(envelopeId) {
      const body = JSON.stringify({ envelopeId, status: "completed" });
      return { body, signature: sign(body) };
    },
  };
  return provider;
}
