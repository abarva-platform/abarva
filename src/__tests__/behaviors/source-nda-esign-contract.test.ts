import { createHash } from "node:crypto";
import { createInMemoryEsignProvider } from "@/__tests__/helpers/source-nda-in-memory-provider";
import { resolveSourceNdaEsignConfig } from "@/lib/source/esign/config";

const demoConfig = {
  SOURCE_NDA_ESIGN_PROVIDER: "docusign",
  SOURCE_NDA_ESIGN_ENVIRONMENT: "demo",
  SOURCE_NDA_ESIGN_INTEGRATION_KEY: "integration-1",
  SOURCE_NDA_ESIGN_ACCOUNT_ID: "account-1",
  SOURCE_NDA_ESIGN_USER_ID: "user-1",
  SOURCE_NDA_ESIGN_KEY_ID: "https://kv-abarva-lab-001.vault.azure.net/keys/source-nda-docusign-lab-jwt/version-1",
  SOURCE_NDA_ESIGN_TEST_INBOX: "tester@abarva.ai",
};

describe("Source NDA e-signature configuration", () => {
  it("keeps the upload fallback when no provider is configured", () => {
    expect(resolveSourceNdaEsignConfig("meridian-health", {})).toEqual({
      state: "not_configured",
      fallback: "upload",
    });
    expect(resolveSourceNdaEsignConfig("meridian-health", {
      SOURCE_NDA_ESIGN_PROVIDER: "disabled",
    })).toEqual({ state: "not_configured", fallback: "upload" });
  });

  it("refuses demo delivery for a different tenant", () => {
    expect(resolveSourceNdaEsignConfig("skyharbor-air", demoConfig)).toEqual({
      state: "blocked",
      reason: "tenant_environment_mismatch",
      fallback: "upload",
    });
  });

  it("refuses production delivery for the synthetic tenant", () => {
    expect(resolveSourceNdaEsignConfig("meridian-health", {
      ...demoConfig,
      SOURCE_NDA_ESIGN_ENVIRONMENT: "production",
    })).toEqual({
      state: "blocked",
      reason: "tenant_environment_mismatch",
      fallback: "upload",
    });
  });

  it("fails closed for incomplete or invalid configuration", () => {
    expect(resolveSourceNdaEsignConfig("meridian-health", {
      ...demoConfig,
      SOURCE_NDA_ESIGN_TEST_INBOX: "",
    })).toEqual({ state: "blocked", reason: "invalid_configuration", fallback: "upload" });
    expect(resolveSourceNdaEsignConfig("meridian-health", {
      ...demoConfig,
      SOURCE_NDA_ESIGN_TEST_INBOX: "supplier@outside.example",
    })).toEqual({ state: "blocked", reason: "invalid_configuration", fallback: "upload" });
    expect(resolveSourceNdaEsignConfig("meridian-health", {
      ...demoConfig,
      SOURCE_NDA_ESIGN_PROVIDER: "unknown",
    })).toEqual({ state: "blocked", reason: "invalid_configuration", fallback: "upload" });
    expect(resolveSourceNdaEsignConfig("meridian-health", {
      ...demoConfig,
      SOURCE_NDA_ESIGN_KEY_ID: "https://outside.example.test/keys/source-nda-docusign-lab-jwt/version-1",
    })).toEqual({ state: "blocked", reason: "invalid_configuration", fallback: "upload" });
  });

  it("returns only non-secret identifiers for a configured demo", () => {
    expect(resolveSourceNdaEsignConfig("meridian-health", demoConfig)).toEqual({
      state: "configured",
      provider: "docusign",
      environment: "demo",
      accountId: "account-1",
      integrationKey: "integration-1",
      userId: "user-1",
      keyId: demoConfig.SOURCE_NDA_ESIGN_KEY_ID,
      testInbox: "tester@abarva.ai",
    });
  });
});

describe("in-memory Source NDA e-signature provider", () => {
  const documentPdf = new Uint8Array([1, 2, 3]);
  const request = {
    tenantKey: "meridian-health",
    eventId: "event-1",
    vendorId: "vendor-1",
    templateVersion: "v1",
    documentPdf,
    documentSha256: createHash("sha256").update(documentPdf).digest("hex"),
    signers: [
      { recipientId: "supplier-1", role: "supplier" as const, name: "Test supplier", email: "supplier@example.test", signatureAnchor: "/supplier-signature/", delivery: "embedded" as const, clientUserId: "supplier-test-1" },
      { recipientId: "buyer-1", role: "buyer" as const, name: "Test buyer", email: "buyer@example.test", signatureAnchor: "/buyer-signature/", delivery: "embedded" as const, clientUserId: "buyer-test-1" },
    ],
  };

  it("refuses document bytes that do not match the governed hash", async () => {
    const provider = createInMemoryEsignProvider();
    await expect(provider.createDraftEnvelope({ ...request, documentPdf: new Uint8Array([9]) }))
      .rejects.toThrow("invalid_envelope");
  });

  it("requires explicit signer placement and embedded identity", async () => {
    const provider = createInMemoryEsignProvider();
    await expect(provider.createDraftEnvelope({
      ...request,
      signers: [{ ...request.signers[0], signatureAnchor: "" }, request.signers[1]],
    })).rejects.toThrow("invalid_envelope");
    await expect(provider.createDraftEnvelope({
      ...request,
      signers: [{ ...request.signers[0], clientUserId: null }, request.signers[1]],
    })).rejects.toThrow("invalid_envelope");
  });

  it("keeps a draft inaccessible until a separate send operation", async () => {
    const provider = createInMemoryEsignProvider();
    const envelope = await provider.createDraftEnvelope(request);
    expect(envelope.status).toBe("created");
    await expect(provider.getSigningLink({
      envelopeId: envelope.envelopeId,
      eventId: request.eventId,
      vendorId: request.vendorId,
      signer: request.signers[0],
      returnUrl: "https://app.example.test/return",
    })).rejects.toThrow("envelope_not_sent");
    await expect(provider.sendDraftEnvelope({ tenantKey: "other-tenant", envelopeId: envelope.envelopeId }))
      .rejects.toThrow("envelope_identity_mismatch");
    await expect(provider.sendDraftEnvelope({ tenantKey: request.tenantKey, envelopeId: envelope.envelopeId }))
      .resolves.toEqual({ envelopeId: envelope.envelopeId, status: "sent" });
    await expect(provider.getSigningLink({
      envelopeId: envelope.envelopeId,
      eventId: request.eventId,
      vendorId: request.vendorId,
      signer: request.signers[0],
      returnUrl: "https://app.example.test/return",
    })).resolves.toContain(envelope.envelopeId);
    await expect(provider.getSigningLink({
      envelopeId: envelope.envelopeId,
      eventId: request.eventId,
      vendorId: request.vendorId,
      signer: { ...request.signers[0], recipientId: "other" },
      returnUrl: "https://app.example.test/return",
    })).rejects.toThrow("recipient_not_found");
  });

  it("refuses unsigned webhooks and documents before completion", async () => {
    const provider = createInMemoryEsignProvider();
    const envelope = await provider.createDraftEnvelope(request);
    await expect(provider.verifyWebhook({ body: "{}", signature: "bad" }))
      .rejects.toThrow("invalid_signature");
    await expect(provider.fetchCompletedDocuments(envelope.envelopeId))
      .rejects.toThrow("envelope_not_completed");
  });

  it("returns pinned completion bytes only for the matching envelope", async () => {
    const provider = createInMemoryEsignProvider();
    const envelope = await provider.createDraftEnvelope(request);
    await provider.sendDraftEnvelope({ tenantKey: request.tenantKey, envelopeId: envelope.envelopeId });
    provider.completeForTest(envelope.envelopeId, {
      signedDocument: new Uint8Array([1, 2, 3]),
      certificate: new Uint8Array([4, 5]),
    });
    const event = provider.webhookForTest(envelope.envelopeId);
    await expect(provider.verifyWebhook(event)).resolves.toMatchObject({
      envelopeId: envelope.envelopeId,
      status: "completed",
    });
    await expect(provider.fetchCompletedDocuments(envelope.envelopeId)).resolves.toEqual({
      signedDocument: new Uint8Array([1, 2, 3]),
      certificate: new Uint8Array([4, 5]),
    });
    await expect(provider.fetchCompletedDocuments("different-envelope"))
      .rejects.toThrow("envelope_not_found");
  });
});
