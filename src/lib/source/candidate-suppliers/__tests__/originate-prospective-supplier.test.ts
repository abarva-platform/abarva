import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { originateProspectiveSupplier } from "../originate-prospective-supplier";

const eventId = "11111111-1111-4111-8111-111111111111";
const versionId = "22222222-2222-4222-8222-222222222222";
const input = {
  clientKey: "tenant-alpha",
  eventId,
  expectedEventVersionId: versionId,
  legalName: "Northwind Services LLC",
  contactName: "Test Contact",
  contactEmail: "test-contact@example.test",
  contactPermissionConfirmed: true,
  approvedByUserId: "person-1",
  approvedByName: "Named Procurement Reviewer",
  rationale: "Add this prospective supplier to the event panel.",
};

function transaction(overrides: {
  event?: Record<string, unknown> | null;
  version?: Record<string, unknown> | null;
  duplicate?: boolean;
} = {}) {
  const run = jest.fn(async (...[sql]: [string, ReadonlyArray<unknown>?]) => {
    if (sql.includes("FROM source_events")) {
      return overrides.event === null ? [] : [{
        id: eventId,
        event_type: "managed_service",
        classified_category: "ams",
        ...overrides.event,
      }];
    }
    if (sql.includes("FROM source_event_authority_versions")) {
      return overrides.version === null ? [] : [{
        id: versionId,
        request_accepted: true,
        ...overrides.version,
      }];
    }
    if (sql.includes("FROM source.vendor") && sql.includes("legal_name")) {
      return overrides.duplicate ? [{ vendor_id: "existing-1" }] : [];
    }
    if (sql.includes("INSERT INTO source.vendor ")) return [{ vendor_id: "prospect-1" }];
    if (sql.includes("INSERT INTO source.vendor_contact")) return [{ contact_id: "contact-1" }];
    if (sql.includes("INSERT INTO source_event_candidate_supplier_authority")) {
      return [{ authority_id: "authority-1" }];
    }
    return [];
  });
  const tx = (async (callback: (runner: SqlRunner) => Promise<unknown>) =>
    callback(run as unknown as SqlRunner)) as TxSessionRunner;
  return { run, tx };
}

describe("prospective supplier origination", () => {
  it("creates a provisional identity, contact and named candidate authority atomically", async () => {
    const { run, tx } = transaction();
    const result = await originateProspectiveSupplier(input, tx);

    expect(result).toEqual(expect.objectContaining({ ok: true }));
    const statements = run.mock.calls.map(([sql]) => sql).join("\n");
    expect(statements).toContain("set_config('app.tenant_key'");
    expect(statements).toContain("pg_advisory_xact_lock");
    expect(run.mock.calls.find(([sql]) => sql.includes("FROM source_events"))?.[0]).toContain("FOR UPDATE");
    expect(run.mock.calls.find(([sql]) => sql.includes("FROM source_event_authority_versions"))?.[0]).toContain("FOR UPDATE OF version");
    expect(statements).toContain("INSERT INTO source.vendor (");
    expect(statements).toContain("INSERT INTO source.vendor_contact");
    expect(statements).toContain("INSERT INTO source_event_candidate_supplier_authority");
    expect(statements).not.toMatch(/INSERT INTO (?:source\.contract|source_event_award)/);
    const vendorCall = run.mock.calls.find(([sql]) => sql.includes("INSERT INTO source.vendor ("));
    expect(vendorCall?.[1]).toEqual(expect.arrayContaining([
      input.clientKey,
      input.legalName,
      "prospective",
      "source_operator_intake",
    ]));
    expect(vendorCall?.[1]).toContainEqual(expect.stringMatching(/^source-operator-intake:/));
    const contactCall = run.mock.calls.find(([sql]) => sql.includes("INSERT INTO source.vendor_contact"));
    expect(contactCall?.[1]).toEqual(expect.arrayContaining([
      input.contactName,
      input.contactEmail,
      "contact_allowed",
    ]));
    const authorityCall = run.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO source_event_candidate_supplier_authority"),
    );
    expect(authorityCall?.[1]).toEqual(expect.arrayContaining([
      input.approvedByUserId,
      input.approvedByName,
      input.rationale,
    ]));
  });

  it("refuses a stale or unaccepted Request version before any insert", async () => {
    for (const version of [
      { id: "33333333-3333-4333-8333-333333333333", request_accepted: true },
      { id: versionId, request_accepted: false },
    ]) {
      const { run, tx } = transaction({ version });
      const result = await originateProspectiveSupplier(input, tx);
      expect(result).toEqual(expect.objectContaining({ ok: false }));
      expect(run.mock.calls.some(([sql]) => sql.includes("INSERT INTO"))).toBe(false);
    }
  });

  it("refuses a duplicate tenant legal name before any insert", async () => {
    const { run, tx } = transaction({ duplicate: true });
    await expect(originateProspectiveSupplier(input, tx)).resolves.toEqual(
      expect.objectContaining({ ok: false, code: "duplicate_supplier" }),
    );
    expect(run.mock.calls.some(([sql]) => sql.includes("INSERT INTO"))).toBe(false);
  });

  it("requires a named approver, verified contact permission and rationale", async () => {
    const { run, tx } = transaction();
    for (const invalid of [
      { approvedByName: "User" },
      { contactPermissionConfirmed: false },
      { rationale: "short" },
      { contactEmail: "not-an-email" },
    ]) {
      await expect(originateProspectiveSupplier({ ...input, ...invalid }, tx)).resolves.toEqual(
        expect.objectContaining({ ok: false }),
      );
    }
    expect(run).not.toHaveBeenCalled();
  });
});
