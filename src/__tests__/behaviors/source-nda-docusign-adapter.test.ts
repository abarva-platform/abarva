import { createHash, createHmac } from "node:crypto";
import { createDocuSignProvider } from "@/lib/source/esign/docusign-provider";
import type { EsignSigner } from "@/lib/source/esign/provider";

const documentPdf = new TextEncoder().encode("%PDF-1.7\nsynthetic test document");
const signers: EsignSigner[] = [
  { recipientId: "supplier-1", role: "supplier", name: "Test Supplier", email: "supplier@outside.example", signatureAnchor: "/supplier-signature/", delivery: "embedded", clientUserId: "supplier-test-1" },
  { recipientId: "buyer-1", role: "buyer", name: "Test Buyer", email: "buyer@outside.example", signatureAnchor: "/buyer-signature/", delivery: "embedded", clientUserId: "buyer-test-1" },
];
const input = {
  tenantKey: "meridian-health",
  eventId: "event-1",
  vendorId: "vendor-1",
  templateVersion: "v1",
  documentPdf,
  documentSha256: createHash("sha256").update(documentPdf).digest("hex"),
  signers,
};
const config = {
  state: "configured" as const,
  provider: "docusign" as const,
  environment: "demo" as const,
  accountId: "account-1",
  integrationKey: "integration-1",
  userId: "user-1",
  keyId: "https://kv-abarva-lab-001.vault.azure.net/keys/source-nda-docusign-lab-jwt/version-1",
  testInbox: "tester@example.test",
};

function fixture() {
  const calls: Array<{ url: string; body?: string; headers: Headers }> = [];
  const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, body: String(init?.body ?? ""), headers: new Headers(init?.headers) });
    if (url.endsWith("/oauth/token")) return new Response(JSON.stringify({ access_token: "token-1", expires_in: 3600 }), { status: 200 });
    if (url.endsWith("/envelopes") && init?.method === "POST") return new Response(JSON.stringify({ envelopeId: "envelope-1", status: "sent" }), { status: 201 });
    if (url.endsWith("/views/recipient")) return new Response(JSON.stringify({ url: "https://demo.docusign.net/signing/one" }), { status: 201 });
    if (url.endsWith("/envelopes/envelope-1")) return new Response(JSON.stringify({ envelopeId: "envelope-1", status: "completed" }), { status: 200 });
    if (url.endsWith("/documents/combined")) return new Response(new Uint8Array([37, 80, 68, 70, 1]), { status: 200 });
    if (url.endsWith("/documents/certificate")) return new Response(new Uint8Array([37, 80, 68, 70, 2]), { status: 200 });
    return new Response("not found", { status: 404 });
  });
  const signDigest = jest.fn(async () => new Uint8Array([1, 2, 3]));
  const provider = createDocuSignProvider(config, {
    fetcher,
    signDigest,
    loadWebhookSecret: async () => "test-hmac-secret",
    now: () => new Date("2026-10-02T17:00:00Z"),
  });
  return { provider, calls, signDigest };
}

describe("DocuSign demo NDA adapter", () => {
  it("sends only a hash-pinned PDF to the demo account and rewrites both recipients to the test inbox", async () => {
    const { provider, calls, signDigest } = fixture();
    await expect(provider.createEnvelope(input)).resolves.toEqual({ envelopeId: "envelope-1", status: "sent" });
    expect(signDigest).toHaveBeenCalledWith(config.keyId, expect.any(Uint8Array));
    const envelope = JSON.parse(calls.find((call) => call.url.endsWith("/envelopes"))!.body!);
    expect(envelope.documents[0].documentBase64).toBe(Buffer.from(documentPdf).toString("base64"));
    expect(envelope.recipients.signers).toHaveLength(2);
    expect(envelope.recipients.signers.every((signer: { email: string }) => signer.email.endsWith("@example.test"))).toBe(true);
    expect(JSON.stringify(envelope)).not.toContain("outside.example");
    expect(envelope.recipients.signers[0].tabs.signHereTabs[0].anchorString).toBe("/supplier-signature/");
    expect(envelope.customFields.textCustomFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "source_event_id", value: "event-1" }),
    ]));
  });

  it("rejects altered bytes and non-demo tenants before any network call", async () => {
    const { provider, calls } = fixture();
    await expect(provider.createEnvelope({ ...input, documentPdf: new Uint8Array([1]) })).rejects.toThrow("invalid_document_hash");
    await expect(provider.createEnvelope({ ...input, tenantKey: "another-tenant" })).rejects.toThrow("tenant_environment_mismatch");
    expect(calls).toHaveLength(0);
  });

  it("rejects signer input that could send mail outside the synthetic inbox", async () => {
    const { provider, calls } = fixture();
    await expect(provider.createEnvelope({ ...input, signers: [{ ...signers[0], clientUserId: null }, signers[1]] }))
      .rejects.toThrow("invalid_signer");
    await expect(provider.createEnvelope({ ...input, signers: [{ ...signers[0], signatureAnchor: "" }, signers[1]] }))
      .rejects.toThrow("invalid_signer");
    expect(calls).toHaveLength(0);
  });

  it("requests embedded signing only for the named signer", async () => {
    const { provider, calls } = fixture();
    await provider.createEnvelope(input);
    await expect(provider.getSigningLink({ envelopeId: "envelope-1", eventId: input.eventId, vendorId: input.vendorId, signer: signers[0], returnUrl: "https://app.abarva.ai/source/return" }))
      .resolves.toBe("https://demo.docusign.net/signing/one");
    const recipient = JSON.parse(calls.find((call) => call.url.endsWith("/views/recipient"))!.body!);
    const envelope = JSON.parse(calls.find((call) => call.url.endsWith("/envelopes"))!.body!);
    expect(recipient.email).toBe(envelope.recipients.signers[0].email);
    expect(recipient.recipientId).toBe("supplier-1");
    expect(recipient.clientUserId).toBe("supplier-test-1");
    expect(recipient.email).toMatch(/@example\.test$/);
    expect(recipient.email).not.toContain("outside.example");
  });

  it("authenticates raw webhook bytes before accepting an event", async () => {
    const { provider } = fixture();
    const body = JSON.stringify({ event: "envelope-completed", data: { envelopeId: "envelope-1", accountId: config.accountId } });
    const signature = createHmac("sha256", "test-hmac-secret").update(body).digest("base64");
    await expect(provider.verifyWebhook({ body, signature })).resolves.toEqual({ envelopeId: "envelope-1", status: "completed" });
    await expect(provider.verifyWebhook({ body: `${body} `, signature })).rejects.toThrow("invalid_signature");
    await expect(provider.verifyWebhook({ body, signature: "bad" })).rejects.toThrow("invalid_signature");
    const otherAccount = JSON.stringify({ event: "envelope-completed", data: { envelopeId: "envelope-1", accountId: "another-account" } });
    await expect(provider.verifyWebhook({
      body: otherAccount,
      signature: createHmac("sha256", "test-hmac-secret").update(otherAccount).digest("base64"),
    })).rejects.toThrow("invalid_event");
  });

  it("refuses an untrusted callback before requesting a signing link", async () => {
    const { provider, calls } = fixture();
    await expect(provider.getSigningLink({
      envelopeId: "envelope-1", eventId: input.eventId, vendorId: input.vendorId,
      signer: signers[0], returnUrl: "https://outside.example/collect",
    })).rejects.toThrow("invalid_return_url");
    expect(calls).toHaveLength(0);
  });

  it("retrieves completion PDFs only after provider status is completed", async () => {
    const { provider, calls } = fixture();
    const docs = await provider.fetchCompletedDocuments("envelope-1");
    expect(docs.signedDocument.slice(0, 4)).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(docs.certificate.slice(0, 4)).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(calls.filter((call) => call.url.includes("/documents/"))).toHaveLength(2);
  });
});
