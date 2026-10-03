import { createNdaDraftRepository } from "@/lib/source/esign/draft-repository";
import type { TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

const identity = {
  clientKey: "meridian-health",
  eventId: "11111111-1111-4111-8111-111111111111",
  vendorId: "SYN-VENDOR-001",
  candidateAuthorityId: "22222222-2222-4222-8222-222222222222",
  contactAuthorityId: "SYN-CONTACT-001",
  templateVersion: "synthetic-1.0",
  documentSha256: "a".repeat(64),
  providerEnvelopeId: "33333333-3333-4333-8333-333333333333",
};

type SqlStep = { match: string; rows: unknown[] };

function fakeTx(steps: SqlStep[]) {
  const seen: string[] = [];
  const tx: TxSessionRunner = async (callback) => callback(async (sql) => {
    seen.push(sql);
    const step = steps.shift();
    if (!step || !sql.includes(step.match)) throw new Error(`unexpected_sql:${sql}`);
    return step.rows as never;
  });
  return { tx, seen, steps };
}

describe("NDA draft persistence and action-time contact fence", () => {
  it("serializes a supplier send and records only an unsent draft", async () => {
    const { tx, seen } = fakeTx([
      { match: "set_config", rows: [] },
      { match: "pg_advisory_xact_lock", rows: [] },
      { match: "SELECT id FROM source_nda_esign_envelopes", rows: [] },
      { match: "INSERT INTO source_nda_esign_envelopes", rows: [{ id: "draft-row" }] },
    ]);
    expect(await createNdaDraftRepository(tx).recordDraft(identity)).toBe("draft-row");
    expect(seen[3]).toContain("'created', NULL");
    expect(seen[3]).not.toContain("'sent', now()");
  });

  it("refuses a second active envelope before writing another draft", async () => {
    const { tx, seen } = fakeTx([
      { match: "set_config", rows: [] },
      { match: "pg_advisory_xact_lock", rows: [] },
      { match: "SELECT id FROM source_nda_esign_envelopes", rows: [{ id: "prior" }] },
    ]);
    await expect(createNdaDraftRepository(tx).recordDraft(identity)).rejects.toThrow("active_envelope_exists");
    expect(seen).toHaveLength(3);
  });

  it("rechecks approved active contact before calling the external send", async () => {
    const { tx, seen } = fakeTx([
      { match: "set_config", rows: [] },
      { match: "FOR UPDATE", rows: [{ id: "draft-row" }] },
      { match: "FOR SHARE OF authority", rows: [] },
    ]);
    const send = jest.fn();
    await expect(createNdaDraftRepository(tx).sendAndMark(identity, send)).rejects.toThrow("contact_not_approved");
    expect(send).not.toHaveBeenCalled();
    expect(seen[2]).toContain("vendor_contact.contact_policy = 'contact_allowed'");
    expect(seen[2]).toContain("candidate.authority_state = 'accepted'");
    expect(seen[2]).toContain("template.content_sha256 = $7");
  });

  it("marks sent only after the provider confirms the exact envelope", async () => {
    const { tx } = fakeTx([
      { match: "set_config", rows: [] },
      { match: "FOR UPDATE", rows: [{ id: "draft-row" }] },
      { match: "FOR SHARE OF authority", rows: [{ id: "approved" }] },
      { match: "UPDATE source_nda_esign_envelopes", rows: [{ id: "draft-row" }] },
    ]);
    const send = jest.fn(async () => ({ envelopeId: identity.providerEnvelopeId, status: "sent" as const }));
    await createNdaDraftRepository(tx).sendAndMark(identity, send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("rejects a mismatched provider response without updating the DB", async () => {
    const { tx, seen } = fakeTx([
      { match: "set_config", rows: [] },
      { match: "FOR UPDATE", rows: [{ id: "draft-row" }] },
      { match: "FOR SHARE OF authority", rows: [{ id: "approved" }] },
    ]);
    await expect(createNdaDraftRepository(tx).sendAndMark(identity, async () => ({
      envelopeId: "another-envelope", status: "sent",
    }))).rejects.toThrow("provider_send_not_confirmed");
    expect(seen).toHaveLength(3);
  });
});
