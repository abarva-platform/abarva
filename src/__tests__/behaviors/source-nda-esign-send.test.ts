import { createHash } from "node:crypto";
import { sendSyntheticNdaForSignature } from "@/lib/source/esign/send-nda";
import type { EsignProvider } from "@/lib/source/esign/provider";

const eventId = "11111111-1111-4111-8111-111111111111";
const candidateId = "22222222-2222-4222-8222-222222222222";
const envelopeId = "33333333-3333-4333-8333-333333333333";
const bytes = new TextEncoder().encode("%PDF-1.4\nSYNTHETIC TEST FIXTURE\nFictional Supplier LLC\nSUPPLIER_SIGNATURE_HERE\nBUYER_SIGNATURE_HERE");
const documentSha256 = createHash("sha256").update(bytes).digest("hex");

const input = {
  clientKey: "meridian-health",
  eventId,
  vendorId: "SYN-VENDOR-001",
  contactAuthorityId: "SYN-CONTACT-001",
  templateVersion: "synthetic-1.0",
  actorUserId: "person-1",
  actorName: "Test Operator",
  acknowledged: true,
};

function harness() {
  const order: string[] = [];
  const provider = {
    createDraftEnvelope: jest.fn(async () => {
      order.push("provider-draft");
      return { envelopeId, status: "created" as const };
    }),
    sendDraftEnvelope: jest.fn(async () => {
      order.push("provider-send");
      return { envelopeId, status: "sent" as const };
    }),
    getSigningLink: jest.fn(),
    verifyWebhook: jest.fn(),
    fetchCompletedDocuments: jest.fn(),
  } as unknown as jest.Mocked<EsignProvider>;
  const deps = {
    config: {
      state: "configured" as const,
      provider: "docusign" as const,
      environment: "demo" as const,
      accountId: "account",
      integrationKey: "integration",
      userId: "user",
      keyId: "key",
      testInbox: "test@abarva.ai",
    },
    provider,
    loadAuthority: jest.fn(async () => ({
      candidateAuthorityId: candidateId,
      contactAuthorityId: input.contactAuthorityId,
      contactName: "Fictional Contact",
      supplierLegalName: "Fictional Supplier LLC",
      templateVersion: input.templateVersion,
      documentSha256,
      blobContainer: "source-artifacts",
      blobPath: `meridian-health/${eventId}/template/file.pdf`,
    })),
    download: jest.fn(async () => bytes),
    extractText: jest.fn(async () => new TextDecoder().decode(bytes)),
    recordDraft: jest.fn(async () => {
      order.push("record-draft");
      return "draft-row";
    }),
    sendAndMark: jest.fn(async (_identity: unknown, send: () => Promise<unknown>) => {
      order.push("recheck-authority");
      await send();
      order.push("mark-sent");
    }),
  };
  return { deps, order };
}

describe("synthetic NDA send boundary", () => {
  it("refuses a disabled provider before reading or contacting anyone", async () => {
    const { deps } = harness();
    const result = await sendSyntheticNdaForSignature(input, {
      ...deps,
      config: { state: "not_configured" as const, fallback: "upload" as const },
    });
    expect(result).toEqual({ ok: false, code: "provider_unavailable" });
    expect(deps.loadAuthority).not.toHaveBeenCalled();
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses an absent approved candidate/contact/template without a provider call", async () => {
    const { deps } = harness();
    deps.loadAuthority.mockResolvedValueOnce(null as never);
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "authority_not_ready" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses a changed document and never creates a provider draft", async () => {
    const { deps } = harness();
    deps.download.mockResolvedValueOnce(new TextEncoder().encode("%PDF-other"));
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "document_mismatch" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses a test PDF without distinct signer anchors", async () => {
    const { deps } = harness();
    deps.extractText.mockResolvedValueOnce("SYNTHETIC TEST FIXTURE\nSignature: ______\nSignature: ______");
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "document_mismatch" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses unresolved legal-party placeholders before draft creation", async () => {
    const { deps } = harness();
    deps.extractText.mockResolvedValueOnce("SYNTHETIC TEST FIXTURE\nFictional Supplier LLC\n[COUNTERPARTY LEGAL NAME]\nSUPPLIER_SIGNATURE_HERE\nBUYER_SIGNATURE_HERE");
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "document_mismatch" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses any unfinished effective-date or address field", async () => {
    const { deps } = harness();
    deps.extractText.mockResolvedValueOnce("SYNTHETIC TEST FIXTURE\nFictional Supplier LLC\n[Effective Date]\n[address]\nSUPPLIER_SIGNATURE_HERE\nBUYER_SIGNATURE_HERE");
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "document_mismatch" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses ambiguous signing anchors", async () => {
    const { deps } = harness();
    deps.extractText.mockResolvedValueOnce("SYNTHETIC TEST FIXTURE\nFictional Supplier LLC\nSUPPLIER_SIGNATURE_HERE\nSUPPLIER_SIGNATURE_HERE\nBUYER_SIGNATURE_HERE");
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "document_mismatch" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("refuses a document for a different supplier", async () => {
    const { deps } = harness();
    deps.extractText.mockResolvedValueOnce("SYNTHETIC TEST FIXTURE\nAnother Supplier LLC\nSUPPLIER_SIGNATURE_HERE\nBUYER_SIGNATURE_HERE");
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "document_mismatch" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("records the unsent draft before any outbound send and uses only the lab inbox", async () => {
    const { deps, order } = harness();
    const result = await sendSyntheticNdaForSignature(input, deps);
    expect(result).toEqual({ ok: true, envelopeId });
    expect(order).toEqual(["provider-draft", "record-draft", "recheck-authority", "provider-send", "mark-sent"]);
    const draftInput = deps.provider.createDraftEnvelope.mock.calls[0]![0];
    expect(draftInput.signers).toHaveLength(2);
    expect(draftInput.signers.map((signer) => signer.email)).toEqual(["test@abarva.ai", "test@abarva.ai"]);
    expect(draftInput.signers.map((signer) => signer.role)).toEqual(["supplier", "buyer"]);
  });

  it("creates a separately selected embedded envelope with stable lab signer identities", async () => {
    const { deps } = harness();
    expect(await sendSyntheticNdaForSignature({ ...input, deliveryMode: "embedded" }, deps))
      .toEqual({ ok: true, envelopeId });
    const signers = deps.provider.createDraftEnvelope.mock.calls[0]![0].signers;
    expect(signers.map((signer) => signer.delivery)).toEqual(["embedded", "embedded"]);
    expect(signers.map((signer) => signer.clientUserId)).toEqual([
      expect.stringMatching(/^nda-[a-f0-9]{32}$/),
      expect.stringMatching(/^nda-[a-f0-9]{32}$/),
    ]);
    expect(signers.map((signer) => signer.email)).toEqual(["test@abarva.ai", "test@abarva.ai"]);
  });

  it("refuses an unrecognized delivery mode rather than falling back to email", async () => {
    const { deps } = harness();
    const invalid = { ...input, deliveryMode: "unknown" } as unknown as typeof input & { deliveryMode: "email" };
    expect(await sendSyntheticNdaForSignature(invalid, deps))
      .toEqual({ ok: false, code: "authority_not_ready" });
    expect(deps.provider.createDraftEnvelope).not.toHaveBeenCalled();
  });

  it("does not send if the durable draft write fails", async () => {
    const { deps } = harness();
    deps.recordDraft.mockRejectedValueOnce(new Error("db unavailable"));
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "draft_not_recorded" });
    expect(deps.provider.sendDraftEnvelope).not.toHaveBeenCalled();
  });

  it("does not send after the approved contact is retired at action time", async () => {
    const { deps } = harness();
    deps.sendAndMark.mockRejectedValueOnce(new Error("contact_not_approved"));
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "send_not_confirmed" });
    expect(deps.provider.sendDraftEnvelope).not.toHaveBeenCalled();
  });

  it("does not retry an uncertain send after a sent/DB mismatch", async () => {
    const { deps } = harness();
    deps.sendAndMark.mockImplementationOnce(async (_identity, send) => {
      await send();
      throw new Error("mark_sent_failed");
    });
    expect(await sendSyntheticNdaForSignature(input, deps)).toEqual({ ok: false, code: "send_not_confirmed" });
    expect(deps.provider.sendDraftEnvelope).toHaveBeenCalledTimes(1);
  });
});
