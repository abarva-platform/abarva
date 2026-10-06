const withSessionMock = jest.fn();
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: (fn: unknown) => withSessionMock(fn) },
}));

import { createSyntheticNdaEmbeddedLink, readSyntheticNdaEmbeddedEnvelope } from "@/lib/source/esign/embedded-link";
import type { EsignProvider } from "@/lib/source/esign/provider";

const eventId = "11111111-1111-4111-8111-111111111111";
const candidateId = "22222222-2222-4222-8222-222222222222";
const envelopeId = "33333333-3333-4333-8333-333333333333";
const sha = "a".repeat(64);
const input = {
  clientKey: "meridian-health",
  eventId,
  vendorId: "SYN-VENDOR-001",
  contactAuthorityId: "SYN-CONTACT-001",
  templateVersion: "synthetic-1.0",
  actorUserId: "person-1",
  actorName: "Named test operator",
  envelopeId,
  role: "supplier" as const,
};

function harness() {
  const provider = {
    getSigningLink: jest.fn(async () => "https://demo.docusign.net/signing/one"),
  } as unknown as jest.Mocked<EsignProvider>;
  return {
    provider,
    deps: {
      config: {
        state: "configured" as const, provider: "docusign" as const,
        environment: "demo" as const, accountId: "account", integrationKey: "integration",
        userId: "user", keyId: "key", testInbox: "test@abarva.ai",
      },
      provider,
      loadAuthority: jest.fn(async () => ({
        candidateAuthorityId: candidateId,
        contactAuthorityId: input.contactAuthorityId,
        contactName: "Fictional Contact",
        supplierLegalName: "Fictional Supplier LLC",
        templateVersion: input.templateVersion,
        documentSha256: sha,
        blobContainer: "source-artifacts",
        blobPath: `meridian-health/${eventId}/template/file.pdf`,
      })),
      loadEnvelope: jest.fn(async () => ({
        candidateAuthorityId: candidateId, documentSha256: sha,
      })),
    },
  };
}

describe("synthetic NDA embedded signing link", () => {
  it("reads only a sent demo envelope without a text-to-UUID comparison", async () => {
    const queries: string[] = [];
    withSessionMock.mockImplementationOnce(async (fn: (run: jest.Mock) => Promise<unknown>) => fn(jest.fn(async (sql: string) => {
      queries.push(sql);
      return sql.includes("SELECT candidate_authority_id")
        ? [{ candidate_authority_id: candidateId, document_sha256: sha }] : [];
    })));
    expect(await readSyntheticNdaEmbeddedEnvelope(input)).toEqual({
      candidateAuthorityId: candidateId, documentSha256: sha,
    });
    expect(queries.join("\n")).toContain("provider_envelope_id = $5");
    expect(queries.join("\n")).not.toContain("provider_envelope_id = $5::uuid");
    expect(queries.join("\n")).toContain("status IN ('sent', 'viewed')");
  });

  it("refuses another tenant before any provider or database access", async () => {
    const { deps } = harness();
    expect(await createSyntheticNdaEmbeddedLink({ ...input, clientKey: "another-tenant" }, deps))
      .toEqual({ ok: false, code: "provider_unavailable" });
    expect(deps.loadAuthority).not.toHaveBeenCalled();
    expect(deps.loadEnvelope).not.toHaveBeenCalled();
    expect(deps.provider.getSigningLink).not.toHaveBeenCalled();
  });

  it("refuses a mismatched candidate or document before obtaining a link", async () => {
    const { deps } = harness();
    deps.loadEnvelope.mockResolvedValueOnce({ candidateAuthorityId: candidateId, documentSha256: "b".repeat(64) });
    expect(await createSyntheticNdaEmbeddedLink(input, deps))
      .toEqual({ ok: false, code: "envelope_not_ready" });
    expect(deps.provider.getSigningLink).not.toHaveBeenCalled();
  });

  it("refuses retired authority before obtaining a link", async () => {
    const { deps } = harness();
    deps.loadAuthority.mockResolvedValueOnce(null as never);
    expect(await createSyntheticNdaEmbeddedLink(input, deps))
      .toEqual({ ok: false, code: "authority_not_ready" });
    expect(deps.provider.getSigningLink).not.toHaveBeenCalled();
  });

  it("refuses to relabel an email-delivery request as embedded", async () => {
    const { deps } = harness();
    expect(await createSyntheticNdaEmbeddedLink({ ...input, deliveryMode: "email" }, deps))
      .toEqual({ ok: false, code: "authority_not_ready" });
    expect(deps.loadEnvelope).not.toHaveBeenCalled();
    expect(deps.provider.getSigningLink).not.toHaveBeenCalled();
  });

  it("uses a stable embedded supplier identity and a fixed product return URL", async () => {
    const { deps } = harness();
    expect(await createSyntheticNdaEmbeddedLink(input, deps))
      .toEqual({ ok: true, url: "https://demo.docusign.net/signing/one" });
    expect(deps.provider.getSigningLink).toHaveBeenCalledWith({
      envelopeId, eventId, vendorId: input.vendorId,
      signer: expect.objectContaining({
        recipientId: "1", role: "supplier", name: "Fictional Contact",
        email: "test@abarva.ai", delivery: "embedded",
        clientUserId: expect.stringMatching(/^nda-[a-f0-9]{32}$/),
      }),
      returnUrl: `https://app.abarva.ai/source/new/${eventId}`,
    });
  });

  it("uses the signed-in operator identity for the buyer recipient", async () => {
    const { deps } = harness();
    expect(await createSyntheticNdaEmbeddedLink({ ...input, role: "buyer" }, deps))
      .toEqual({ ok: true, url: "https://demo.docusign.net/signing/one" });
    expect(deps.provider.getSigningLink).toHaveBeenCalledWith(expect.objectContaining({
      signer: expect.objectContaining({ role: "buyer", recipientId: "2", name: "Named test operator" }),
    }));
  });

  it("does not turn an email-delivery envelope into an embedded view", async () => {
    const { deps } = harness();
    deps.provider.getSigningLink.mockRejectedValueOnce(new Error("email_signer_no_embedded_link"));
    expect(await createSyntheticNdaEmbeddedLink(input, deps))
      .toEqual({ ok: false, code: "signing_link_unavailable" });
  });

  it("rejects a signing URL outside the provider domain", async () => {
    const { deps } = harness();
    deps.provider.getSigningLink.mockResolvedValueOnce("https://demo.docusign.net.attacker.example/sign");
    expect(await createSyntheticNdaEmbeddedLink(input, deps))
      .toEqual({ ok: false, code: "signing_link_unavailable" });
  });
});
