jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(),
}));

import { createWebhookEnvelopeStore } from "@/lib/source/esign/webhook-repository";
import type { TxSessionRunner, SqlRunner } from "@/lib/data-plane/read-adapters/azureSession";

const envelopeId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const hash = "a".repeat(64);
const envelope = { clientKey: "meridian-health", eventId, vendorId: "VEN-TEST-1", providerEnvelopeId: envelopeId, status: "sent" as const };
const ref = (fileName: string) => `source-events/meridian-health/${eventId}/uploads/nda_esign/${envelopeId}/${fileName}`;

describe("Source NDA webhook envelope store", () => {
  it("pins reads and state changes to tenant, provider, environment, envelope and status", async () => {
    const calls: { sql: string; params: unknown[] }[] = [];
    const run: SqlRunner = async (sql, params) => {
      calls.push({ sql, params });
      return (sql.includes("RETURNING id") ? [{ id: "row-1" }] : []) as never;
    };
    const tx: TxSessionRunner = async (fn) => fn(run);
    const store = createWebhookEnvelopeStore(tx);
    await store.read(envelopeId);
    await store.markViewed(envelopeId);
    await store.markDeclined(envelopeId);
    await store.markCompleted(envelope, {
      signedDocumentRef: ref(`signed-${hash}.pdf`),
      signedDocumentSha256: hash,
      certificateRef: ref(`certificate-${hash}.pdf`),
      certificateSha256: hash,
    });
    expect(calls.filter((call) => call.sql.includes("set_config"))).toHaveLength(4);
    for (const call of calls.filter((entry) => entry.sql.includes("source_nda_esign_envelopes"))) {
      expect(call.sql).toContain("client_key = $1");
      expect(call.sql).toContain("provider = $2");
      expect(call.sql).toContain("provider_environment = $3");
      expect(call.sql).toContain("provider_envelope_id = $4");
      expect(call.params.slice(0, 4)).toEqual(["meridian-health", "docusign", "demo", envelopeId]);
      if (call.sql.includes("UPDATE")) {
        expect(call.sql).toMatch(/AND status (?:= 'sent'|IN \('sent', 'viewed'\))/);
        if (call.sql.includes("status = 'completed'")) {
          expect(call.sql).toContain("source_event_id = $9 AND vendor_id = $10");
          expect(call.params.slice(8)).toEqual([eventId, "VEN-TEST-1"]);
        }
      }
    }
  });

  it("refuses a completion reference outside the synthetic tenant", async () => {
    const run = jest.fn(async (...args: [string, unknown[]]) => {
      void args;
      return [];
    });
    const store = createWebhookEnvelopeStore(async (fn) => fn(run));
    await expect(store.markCompleted(envelope, {
      signedDocumentRef: "source-events/other-tenant/event/signed.pdf",
      signedDocumentSha256: hash,
      certificateRef: ref(`certificate-${hash}.pdf`),
      certificateSha256: hash,
    })).rejects.toThrow("invalid_completed_evidence");
    expect(run.mock.calls.some((call) => String(call[0]).includes("UPDATE"))).toBe(false);
  });

  it("refuses a completion reference for another event in the same tenant", async () => {
    const run = jest.fn(async (...args: [string, unknown[]]) => {
      void args;
      return [];
    });
    const store = createWebhookEnvelopeStore(async (fn) => fn(run));
    await expect(store.markCompleted(envelope, {
      signedDocumentRef: `source-events/meridian-health/another-event/uploads/nda_esign/${envelopeId}/signed-${hash}.pdf`,
      signedDocumentSha256: hash,
      certificateRef: `source-events/meridian-health/another-event/uploads/nda_esign/${envelopeId}/certificate-${hash}.pdf`,
      certificateSha256: hash,
    })).rejects.toThrow("invalid_completed_evidence");
    expect(run.mock.calls.some((call) => String(call[0]).includes("UPDATE"))).toBe(false);
  });
});
