import { createHash } from "node:crypto";
import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import type { PreparedPackageWriteInput } from "../write-prepared-package-version";
import { writePreparedRfxPackageVersion } from "../write-prepared-package-version";

const EVENT = "11111111-1111-4111-8111-111111111111";
const ARTIFACT = "22222222-2222-4222-8222-222222222222";

function input(): PreparedPackageWriteInput {
  return {
    release: {
      package: {
        packageId: "package-1",
        tenantKey: "tenant-1",
        eventId: EVENT,
        disclosureScope: { classification: "confidential_rfp", includedArtifactIds: [ARTIFACT] },
        authentication: { method: "shared_secret", secretRef: "secret-1" },
        expiresAt: "2026-10-15T00:00:00Z",
        recipients: [{
          recipientId: "recipient-1", legalEntityId: "vendor-1", contactId: "contact-1",
          contactName: "Named contact", contactEmail: "contact@example.test", contactPolicy: "contact_allowed",
        }],
        receipts: [],
      },
      supplierContactPolicies: { "vendor-1": "contact_allowed" },
      asOf: "2026-10-01T00:00:00Z",
    },
    artifacts: [{ artifactId: ARTIFACT, sha256: "a".repeat(64) }],
    recipientAuthorities: [{
      recipientId: "recipient-1", candidateAuthorityId: "candidate-1",
      candidateTenantKey: "tenant-1", candidateEventId: EVENT,
      candidateLegalEntityId: "vendor-1", candidateState: "accepted",
      contactAuthorityId: "contact-authority-1", contactTenantKey: "tenant-1",
      contactEventId: EVENT, contactLegalEntityId: "vendor-1", contactId: "contact-1",
      contactName: "Named contact", contactEmail: "contact@example.test",
      contactPolicy: "contact_allowed", contactState: "approved",
      contactApprovedByUserId: "contact-approver", contactApprovedAt: "2026-09-30T00:00:00Z",
      contactEvidenceReference: "contact-evidence", ndaAuthorityId: "nda-1",
      ndaTenantKey: "tenant-1", ndaEventId: EVENT, ndaLegalEntityId: "vendor-1",
      ndaState: "recorded",
    }],
    approvedByUserId: "approver-1",
    approvedAt: "2026-10-01T00:00:00Z",
    approvalEvidenceReference: "approval-1",
  };
}

function store(): { tx: TxSessionRunner; writes: unknown[][]; sql: string[] } {
  const writes: unknown[][] = [];
  const sql: string[] = [];
  const run: SqlRunner = async <R>(query: string, params: unknown[]): Promise<R[]> => {
    sql.push(query);
    if (query.includes("FROM source_events")) {
      if (!query.includes("client_key = $1") || params[0] !== "tenant-1") return [];
      return (query.includes("id = $2::uuid") && params[1] !== EVENT
        ? [] : [{ id: EVENT }]) as R[];
    }
    if (query.includes("FROM source_event_rfx_package_version")) {
      return (writes.length ? [{ version_number: writes.length }] : []) as R[];
    }
    if (query.includes("INSERT INTO source_event_rfx_package_version")) {
      writes.push(params);
      return [{ id: `row-${writes.length}` }] as R[];
    }
    return [];
  };
  const tx: TxSessionRunner = async (fn) => fn(run);
  return { tx, writes, sql };
}

describe("prepared RFx package version write", () => {
  it("allocates n+1 without rewriting the previous frozen snapshot", async () => {
    const db = store();
    const first = await writePreparedRfxPackageVersion(input(), db.tx, () => "version-1");
    const frozenFirst = JSON.stringify(db.writes[0]);
    const second = await writePreparedRfxPackageVersion(input(), db.tx, () => "version-2");
    expect(first).toMatchObject({ ok: true, version: 1 });
    expect(second).toMatchObject({ ok: true, version: 2 });
    expect(db.writes).toHaveLength(2);
    expect(JSON.stringify(db.writes[0])).toBe(frozenFirst);
    expect(db.sql.some((query) => /^\s*(UPDATE|DELETE)\b/i.test(query))).toBe(false);
    expect(db.writes[0][0]).toBe("tenant-1");
    expect(db.writes[0][1]).toBe(EVENT);
    expect(db.writes[0][2]).toBe("package-1");
    expect(createHash("sha256").update(db.writes[0][5] as string).digest("hex")).toBe(db.writes[0][6]);
    expect(first.ok && first.snapshotSha256).toBe(db.writes[0][6]);
    expect(db.sql.filter((query) => query.includes("FROM source_event_rfx_package_version")))
      .toEqual([expect.stringContaining("client_key = $1 AND source_event_id = $2::uuid AND package_id = $3"),
        expect.stringContaining("client_key = $1 AND source_event_id = $2::uuid AND package_id = $3")]);
  });

  it("refuses an event outside the scoped tenant before any insert", async () => {
    const db = store();
    const otherEvent = input();
    const foreignEvent = "33333333-3333-4333-8333-333333333333";
    otherEvent.release.package.eventId = foreignEvent;
    otherEvent.recipientAuthorities[0].candidateEventId = foreignEvent;
    otherEvent.recipientAuthorities[0].contactEventId = foreignEvent;
    otherEvent.recipientAuthorities[0].ndaEventId = foreignEvent;
    const result = await writePreparedRfxPackageVersion(otherEvent, db.tx, () => "version-1");
    expect(result).toMatchObject({ ok: false, code: "event_unavailable" });
    expect(db.writes).toHaveLength(0);
  });

  it("does not persist a package whose proposed recipient cannot be contacted", async () => {
    const db = store();
    const blocked = input();
    blocked.release.package.recipients[0].contactPolicy = "do_not_contact";
    const result = await writePreparedRfxPackageVersion(blocked, db.tx, () => "version-1");
    expect(result).toMatchObject({ ok: false, code: "release_not_ready" });
    expect(db.writes).toHaveLength(0);
  });
});
