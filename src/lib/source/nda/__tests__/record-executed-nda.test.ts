import { recordExecutedNda } from "../record-executed-nda";
import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

const eventId = "11111111-1111-4111-8111-111111111111";
const foreignEventId = "22222222-2222-4222-8222-222222222222";
const artifactId = "33333333-3333-4333-8333-333333333333";
const documentHash = "a".repeat(64);

const input = {
  clientKey: "synthetic-tenant",
  eventId,
  vendorId: "VEN-SYN-001",
  ndaId: "NDA-SYN-001",
  artifactId,
  templateVersion: "NDA-V1",
  scopeLevel: "event_only" as const,
  coveredAffiliateEntityIds: [],
  effectiveFrom: "2026-09-30",
  effectiveTo: null,
  executedAt: "2026-09-30T12:00:00.000Z",
  uploadedByUserId: "uploader-1",
  recordedByUserId: "reviewer-1",
  evidenceReference: "EVID-SYN-001",
  signatureMethod: "wet_ink" as const,
  supplierSignatoryName: "Supplier signer",
  buyerSignatoryName: "Buyer signer",
  certificateSha256: null,
  privateEvidenceRef: "private://synthetic/nda-1",
};

function fakeTransaction(options: {
  candidateEventId?: string;
  artifactEventId?: string;
  published?: boolean;
} = {}) {
  const statements: string[] = [];
  const run: SqlRunner = async <R>(sql: string, params: unknown[]): Promise<R[]> => {
    statements.push(sql);
    if (sql.includes("FROM source_event_candidate_supplier_authority")) {
      const candidateEventId = options.candidateEventId ?? eventId;
      const hasEventFence = sql.includes("authority.source_event_id = $2::uuid");
      const hasTenantFence = sql.includes("authority.client_key = $1");
      return ((hasEventFence && candidateEventId !== params[1]) || !hasTenantFence
        ? []
        : [{ vendor_id: "VEN-SYN-001" }]) as R[];
    }
    if (sql.includes("FROM source_artifacts")) {
      const artifactEventId = options.artifactEventId ?? eventId;
      const hasEventFence = sql.includes("source_event_row_id = $2::uuid");
      const hasTenantFence = sql.includes("tenant_key = $1");
      return ((hasEventFence && artifactEventId !== params[1]) || !hasTenantFence
        ? []
        : [{ document_sha256: documentHash }]) as R[];
    }
    if (sql.includes("FROM source_nda_template_versions")) {
      return (options.published === false ? [] : [{ template_version: "NDA-V1" }]) as R[];
    }
    if (sql.includes("INSERT INTO source_executed_nda_authority")) {
      return [{ id: "44444444-4444-4444-8444-444444444444" }] as R[];
    }
    return [];
  };
  const tx: TxSessionRunner = async (body) => body(run);
  return { tx, statements };
}

describe("recordExecutedNda", () => {
  it("records complete bilateral evidence only for accepted event authority", async () => {
    const { tx, statements } = fakeTransaction();
    expect(await recordExecutedNda(input, tx, "2026-10-01T00:00:00.000Z")).toEqual({
      ok: true,
      id: "44444444-4444-4444-8444-444444444444",
    });
    expect(statements.some((sql) => sql.includes("INSERT INTO source_executed_nda_authority"))).toBe(true);
  });

  it("refuses a supplier accepted for another event before inserting", async () => {
    const { tx, statements } = fakeTransaction({ candidateEventId: foreignEventId });
    expect(await recordExecutedNda(input, tx, "2026-10-01T00:00:00.000Z")).toEqual({
      ok: false,
      code: "candidate_not_accepted",
    });
    expect(statements.some((sql) => sql.includes("INSERT INTO"))).toBe(false);
  });

  it("refuses an executed artifact bound to another event", async () => {
    const { tx, statements } = fakeTransaction({ artifactEventId: foreignEventId });
    expect(await recordExecutedNda(input, tx, "2026-10-01T00:00:00.000Z")).toEqual({
      ok: false,
      code: "executed_artifact_unavailable",
    });
    expect(statements.some((sql) => sql.includes("INSERT INTO"))).toBe(false);
  });

  it("refuses incomplete signature evidence and an unpublished template", async () => {
    const missingSigner = fakeTransaction();
    expect(await recordExecutedNda(
      { ...input, buyerSignatoryName: "" },
      missingSigner.tx,
      "2026-10-01T00:00:00.000Z",
    )).toEqual({ ok: false, code: "signature_evidence_incomplete" });
    expect(missingSigner.statements.some((sql) => sql.includes("INSERT INTO"))).toBe(false);

    const unpublished = fakeTransaction({ published: false });
    expect(await recordExecutedNda(input, unpublished.tx, "2026-10-01T00:00:00.000Z")).toEqual({
      ok: false,
      code: "published_template_unavailable",
    });
    expect(unpublished.statements.some((sql) => sql.includes("INSERT INTO"))).toBe(false);
  });

  it("does not let this event writer assert unverified affiliate coverage", async () => {
    const { tx, statements } = fakeTransaction();
    expect(await recordExecutedNda(
      { ...input, scopeLevel: "supplier_and_affiliates", coveredAffiliateEntityIds: ["VEN-OTHER"] },
      tx,
      "2026-10-01T00:00:00.000Z",
    )).toEqual({ ok: false, code: "invalid_record" });
    expect(statements).toEqual([]);
  });
});
