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
  testInbox: "tester@abarva.ai",
};

function fixture(configOverride: Partial<typeof config> = {}) {
  const calls: Array<{ url: string; body?: string; headers: Headers }> = [];
  const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, body: String(init?.body ?? ""), headers: new Headers(init?.headers) });
    if (url.endsWith("/oauth/token")) return new Response(JSON.stringify({ access_token: "token-1", expires_in: 3600 }), { status: 200 });
    if (url.endsWith("/envelopes") && init?.method === "POST") return new Response(JSON.stringify({ envelopeId: "envelope-1", status: "created" }), { status: 201 });
    if (url.endsWith("/envelopes/envelope-1") && init?.method === "PUT") return new Response(JSON.stringify({ envelopeId: "envelope-1", status: "sent" }), { status: 200 });
    if (url.endsWith("/views/recipient")) return new Response(JSON.stringify({ url: "https://demo.docusign.net/signing/one" }), { status: 201 });
    if (url.endsWith("/envelopes/envelope-1")) return new Response(JSON.stringify({ envelopeId: "envelope-1", status: "completed" }), { status: 200 });
    if (url.endsWith("/documents/combined")) return new Response(new Uint8Array([37, 80, 68, 70, 1]), { status: 200 });
    if (url.endsWith("/documents/certificate")) return new Response(new Uint8Array([37, 80, 68, 70, 2]), { status: 200 });
    return new Response("not found", { status: 404 });
  });
  const signDigest = jest.fn(async () => new Uint8Array([1, 2, 3]));
  const provider = createDocuSignProvider({ ...config, ...configOverride }, {
    fetcher,
    signDigest,
    loadWebhookSecret: async () => "test-hmac-secret",
    now: () => new Date("2026-10-02T17:00:00Z"),
  });
  return { provider, calls, signDigest };
}

describe("DocuSign demo NDA adapter", () => {
  it("creates only a draft with a hash-pinned PDF and internal test recipients", async () => {
    const { provider, calls, signDigest } = fixture();
    await expect(provider.createDraftEnvelope(input)).resolves.toEqual({ envelopeId: "envelope-1", status: "created" });
    expect(signDigest).toHaveBeenCalledWith(config.keyId, expect.any(Uint8Array));
    const envelope = JSON.parse(calls.find((call) => call.url.endsWith("/envelopes"))!.body!);
    expect(envelope.status).toBe("created");
    expect(calls.some((call) => call.url.endsWith("/envelopes/envelope-1"))).toBe(false);
    expect(envelope.documents[0].documentBase64).toBe(Buffer.from(documentPdf).toString("base64"));
    expect(envelope.recipients.signers).toHaveLength(2);
    expect(envelope.recipients.signers.every((signer: { email: string }) => signer.email.endsWith("@abarva.ai"))).toBe(true);
    expect(JSON.stringify(envelope)).not.toContain("outside.example");
    expect(envelope.recipients.signers[0].tabs.signHereTabs[0].anchorString).toBe("/supplier-signature/");
    expect(envelope.customFields.textCustomFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "source_event_id", value: "event-1" }),
    ]));
  });

  it("sends a draft only through a separate explicit request", async () => {
    const { provider, calls } = fixture();
    await provider.createDraftEnvelope(input);
    await expect(provider.sendDraftEnvelope({ tenantKey: input.tenantKey, envelopeId: "envelope-1" }))
      .resolves.toEqual({ envelopeId: "envelope-1", status: "sent" });
    const send = calls.find((call) => call.url.endsWith("/envelopes/envelope-1") && call.body?.includes('"status":"sent"'));
    expect(send).toBeDefined();
    expect(JSON.parse(send!.body!)).toEqual({ status: "sent" });
  });

  it("refuses a cross-tenant or missing draft identity before sending", async () => {
    const { provider, calls } = fixture();
    await expect(provider.sendDraftEnvelope({ tenantKey: "another-tenant", envelopeId: "envelope-1" }))
      .rejects.toThrow("tenant_environment_mismatch");
    await expect(provider.sendDraftEnvelope({ tenantKey: input.tenantKey, envelopeId: "" }))
      .rejects.toThrow("invalid_envelope_id");
    expect(calls).toHaveLength(0);
  });

  it("does not send when the test inbox is no longer internal", async () => {
    const { provider, calls } = fixture({ testInbox: "outside@example.test" });
    await expect(provider.sendDraftEnvelope({ tenantKey: input.tenantKey, envelopeId: "envelope-1" }))
      .rejects.toThrow("invalid_test_inbox");
    expect(calls).toHaveLength(0);
  });

  it("rejects altered bytes and non-demo tenants before any network call", async () => {
    const { provider, calls } = fixture();
    await expect(provider.createDraftEnvelope({ ...input, documentPdf: new Uint8Array([1]) })).rejects.toThrow("invalid_document_hash");
    await expect(provider.createDraftEnvelope({ ...input, tenantKey: "another-tenant" })).rejects.toThrow("tenant_environment_mismatch");
    expect(calls).toHaveLength(0);
  });

  it("rejects signer input that could send mail outside the synthetic inbox", async () => {
    const { provider, calls } = fixture();
    await expect(provider.createDraftEnvelope({ ...input, signers: [{ ...signers[0], clientUserId: null }, signers[1]] }))
      .rejects.toThrow("invalid_signer");
    await expect(provider.createDraftEnvelope({ ...input, signers: [{ ...signers[0], signatureAnchor: "" }, signers[1]] }))
      .rejects.toThrow("invalid_signer");
    expect(calls).toHaveLength(0);
  });

  it("routes email signers only to internal test-inbox aliases without embedded identities", async () => {
    const { provider, calls } = fixture();
    const emailSigners: EsignSigner[] = signers.map((signer) => ({
      ...signer, delivery: "email", clientUserId: null,
    }));
    await expect(provider.createDraftEnvelope({ ...input, signers: emailSigners }))
      .resolves.toEqual({ envelopeId: "envelope-1", status: "created" });
    const body = calls.find((call) => call.url.endsWith("/envelopes"))!.body!;
    const recipients = JSON.parse(body).recipients.signers;
    expect(recipients).toHaveLength(2);
    expect(recipients.every((signer: { email: string }) => /^tester\+nda-[a-f0-9]{12}@abarva\.ai$/.test(signer.email))).toBe(true);
    expect(recipients.every((signer: { clientUserId?: string }) => signer.clientUserId === undefined)).toBe(true);
    expect(body).not.toContain("outside.example");
  });

  it("refuses external test-inbox configuration before any provider call", async () => {
    const { provider, calls } = fixture({ testInbox: "supplier@outside.example" });
    await expect(provider.createDraftEnvelope(input)).rejects.toThrow("invalid_test_inbox");
    expect(calls).toHaveLength(0);
  });

  it("rejects mixed email and embedded identities for one signer", async () => {
    const { provider, calls } = fixture();
    await expect(provider.createDraftEnvelope({
      ...input,
      signers: [{ ...signers[0], delivery: "email" }, signers[1]],
    })).rejects.toThrow("invalid_signer");
    expect(calls).toHaveLength(0);
  });

  it("requests embedded signing only for the named signer", async () => {
    const { provider, calls } = fixture();
    await provider.createDraftEnvelope(input);
    await provider.sendDraftEnvelope({ tenantKey: input.tenantKey, envelopeId: "envelope-1" });
    await expect(provider.getSigningLink({ envelopeId: "envelope-1", eventId: input.eventId, vendorId: input.vendorId, signer: signers[0], returnUrl: "https://app.abarva.ai/source/return" }))
      .resolves.toBe("https://demo.docusign.net/signing/one");
    const recipient = JSON.parse(calls.find((call) => call.url.endsWith("/views/recipient"))!.body!);
    const envelope = JSON.parse(calls.find((call) => call.url.endsWith("/envelopes"))!.body!);
    expect(recipient.email).toBe(envelope.recipients.signers[0].email);
    expect(recipient.recipientId).toBe("supplier-1");
    expect(recipient.clientUserId).toBe("supplier-test-1");
    expect(recipient.email).toMatch(/@abarva\.ai$/);
    expect(recipient.email).not.toContain("outside.example");
  });

  it("does not issue an embedded signing link for an email recipient", async () => {
    const { provider, calls } = fixture();
    await expect(provider.getSigningLink({
      envelopeId: "envelope-1", eventId: input.eventId, vendorId: input.vendorId,
      signer: { ...signers[0], delivery: "email", clientUserId: null },
      returnUrl: "https://app.abarva.ai/source/return",
    })).rejects.toThrow("email_signer_no_embedded_link");
    expect(calls).toHaveLength(0);
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

  it("maps a signed provider void callback to a terminal non-completion state", async () => {
    const { provider } = fixture();
    const body = JSON.stringify({ event: "envelope-voided", data: { envelopeId: "envelope-1", accountId: config.accountId } });
    const signature = createHmac("sha256", "test-hmac-secret").update(body).digest("base64");
    await expect(provider.verifyWebhook({ body, signature })).resolves.toEqual({ envelopeId: "envelope-1", status: "voided" });
    await expect(provider.verifyWebhook({ body, signature: "bad" })).rejects.toThrow("invalid_signature");
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
