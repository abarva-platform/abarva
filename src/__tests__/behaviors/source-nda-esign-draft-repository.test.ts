import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDraftEnvelopeStore } from "@/lib/source/esign/draft-repository";
import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

const eventId = "22222222-2222-4222-8222-222222222222";
const candidateAuthorityId = "33333333-3333-4333-8333-333333333333";
const envelopeId = "11111111-1111-4111-8111-111111111111";
const documentSha256 = "a".repeat(64);
const draft = {
  clientKey: "meridian-health",
  eventId,
  vendorId: "VEN-TEST-1",
  candidateAuthorityId,
  templateVersion: "v1",
  providerEnvelopeId: envelopeId,
  documentSha256,
};

function harness() {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const run: SqlRunner = async (sql, params) => {
    calls.push({ sql, params });
    return (sql.includes("RETURNING id") ? [{ id: "row-1" }] : []) as never;
  };
  const tx: TxSessionRunner = async (fn) => fn(run);
  return { store: createDraftEnvelopeStore(tx), calls };
}

describe("Source NDA demo draft persistence", () => {
  it("inserts a hash-bound, unsent row before delivery", async () => {
    const { store, calls } = harness();
    await expect(store.recordDraft(draft)).resolves.toBe("row-1");
    const insert = calls.find(({ sql }) => sql.includes("INSERT INTO source_nda_esign_envelopes"));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain("status, sent_at, document_sha256");
    expect(insert!.sql).toMatch(/'created', NULL, \$\d+/);
    expect(insert!.params).toEqual([
      draft.clientKey, eventId, draft.vendorId, candidateAuthorityId,
      draft.templateVersion, envelopeId, documentSha256,
    ]);
    expect(calls[0]).toEqual({ sql: "SELECT set_config('app.tenant_key', $1, true)", params: [draft.clientKey] });
  });

  it("sends only the same tenant, event, supplier, candidate, document and draft envelope", async () => {
    const { store, calls } = harness();
    await expect(store.markSent(draft)).resolves.toBe(true);
    const update = calls.find(({ sql }) => sql.includes("UPDATE source_nda_esign_envelopes"));
    expect(update).toBeDefined();
    expect(update!.sql).toContain("status = 'created'");
    for (const field of ["client_key", "source_event_id", "vendor_id", "candidate_authority_id",
      "template_version", "provider_envelope_id", "document_sha256"]) {
      expect(update!.sql).toContain(`${field} = $`);
    }
    expect(update!.params).toEqual([
      draft.clientKey, eventId, draft.vendorId, candidateAuthorityId,
      draft.templateVersion, envelopeId, documentSha256,
    ]);
  });

  it("refuses wrong-tenant or malformed identity before SQL", async () => {
    const { store, calls } = harness();
    await expect(store.recordDraft({ ...draft, clientKey: "other-tenant" })).rejects.toThrow("invalid_draft_identity");
    await expect(store.recordDraft({ ...draft, documentSha256: "bad" })).rejects.toThrow("invalid_draft_identity");
    await expect(store.markSent({ ...draft, providerEnvelopeId: "other" })).rejects.toThrow("invalid_draft_identity");
    expect(calls).toHaveLength(0);
  });

  it("keeps draft rows unsent and rechecks Legal authority at the database transition", () => {
    const migration = readFileSync(join(process.cwd(), "supabase/migrations/20261003160000_source_nda_esign_draft_state.sql"), "utf8");
    expect(migration).toMatch(/status IN \('created', 'sent', 'viewed', 'completed', 'declined'\)/);
    expect(migration).toMatch(/status = 'created' AND sent_at IS NULL/);
    expect(migration).toMatch(/NEW\.status = 'sent' AND NEW\.sent_at IS NOT NULL/);
    expect(migration).toMatch(/template\.content_sha256 = NEW\.document_sha256/);
    expect(migration).toMatch(/template\.publication_state = 'published'/);
    expect(migration).toMatch(/candidate\.authority_state = 'accepted'/);
  });
});
