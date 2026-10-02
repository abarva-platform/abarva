export type EsignEnvironment = "demo" | "production";
export type EsignEnvelopeStatus = "sent" | "viewed" | "completed" | "declined";

export type EsignSigner = {
  recipientId: string;
  role: "supplier" | "buyer";
  name: string;
  email: string;
  signatureAnchor: string;
  delivery: "embedded" | "email";
  clientUserId: string | null;
};

export type CreateEsignEnvelopeInput = {
  tenantKey: string;
  eventId: string;
  vendorId: string;
  templateVersion: string;
  documentPdf: Uint8Array;
  documentSha256: string;
  signers: readonly EsignSigner[];
};

export type EsignEnvelope = {
  envelopeId: string;
  status: EsignEnvelopeStatus;
};

export type EsignWebhookInput = {
  body: string;
  signature: string;
};

export type VerifiedEsignEvent = {
  envelopeId: string;
  status: EsignEnvelopeStatus;
  tenantKey: string;
  eventId: string;
};

export type CompletedEsignDocuments = {
  signedDocument: Uint8Array;
  certificate: Uint8Array;
};

export interface EsignProvider {
  createEnvelope(input: CreateEsignEnvelopeInput): Promise<EsignEnvelope>;
  getSigningLink(input: {
    envelopeId: string;
    recipientId: string;
    returnUrl: string;
  }): Promise<string>;
  verifyWebhook(input: EsignWebhookInput): Promise<VerifiedEsignEvent>;
  fetchCompletedDocuments(envelopeId: string): Promise<CompletedEsignDocuments>;
}
