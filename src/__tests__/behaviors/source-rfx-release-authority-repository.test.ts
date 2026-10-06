const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: (...args: unknown[]) => withSessionMock(...args),
  },
}));

import { readApprovedContactsForEvent } from "@/lib/source/rfx-delivery/release-authority-repository";
import { approveRfxContact } from "@/lib/source/rfx-delivery/write-contact-approval";
import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

const eventId = "11111111-1111-4111-8111-111111111111";
const row = {
  authority_id: "contact-authority-1",
  client_key: "tenant-alpha",
  source_event_id: eventId,
  vendor_id: "vendor-1",
  contact_id: "contact-1",
  display_name: "Named contact",
  email: "contact@example.test",
  approved_contact_name: "Named contact",
  approved_contact_email: "contact@example.test",
  contact_policy: "contact_allowed",
  contact_state: "active",
  authority_state: "approved",
  candidate_authority_id: "candidate-authority-1",
  candidate_state: "accepted",
  approved_by_user_id: "approver-1",
  approved_at: new Date("2026-09-24T00:00:00Z"),
  evidence_reference: "contact-review-1",
  retired_at: null,
};

describe("Stage 06 named-contact authority read", () => {
  beforeEach(() => {
    runMock.mockReset();
    withSessionMock.mockReset();
    withSessionMock.mockImplementation(
      async (callback: (run: typeof runMock) => unknown) => callback(runMock),
    );
  });

  it("returns only a source-backed approved contact bound to a candidate legal entity", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([row]);

    await expect(readApprovedContactsForEvent({ clientKey: "tenant-alpha", eventId }))
      .resolves.toEqual({
        registryAvailable: true,
        approvedContacts: [{
          authorityId: "contact-authority-1",
          candidateAuthorityId: "candidate-authority-1",
          tenantKey: "tenant-alpha",
          eventId,
          legalEntityId: "vendor-1",
          contactId: "contact-1",
          contactName: "Named contact",
          contactEmail: "contact@example.test",
          contactPolicy: "contact_allowed",
          contactState: "approved",
          approvedByUserId: "approver-1",
          approvedAt: "2026-09-24T00:00:00.000Z",
          evidenceReference: "contact-review-1",
        }],
      });
    expect(runMock.mock.calls[0]?.[0]).toContain("set_config('app.tenant_key'");
    const sql = runMock.mock.calls[1]?.[0] as string;
    expect(sql).toContain("FROM source_event_rfx_contact_authority authority");
    expect(sql).toContain("JOIN source.vendor_contact contact");
    expect(sql).toContain("JOIN source_event_candidate_supplier_authority candidate");
    expect(sql).toContain("authority.client_key = $1");
    expect(sql).toContain("authority.source_event_id = $2::uuid");
    expect(sql).toContain("contact.tenant_key = authority.client_key");
    expect(sql).toContain("contact.vendor_id = authority.vendor_id");
    expect(sql).toContain("contact.contact_id = authority.contact_id");
    expect(sql).toContain("contact.display_name = authority.approved_contact_name");
    expect(sql).toContain("contact.email = authority.approved_contact_email");
    expect(sql).toContain("candidate.source_event_id = authority.source_event_id");
    expect(sql).toContain("candidate.vendor_id = authority.vendor_id");
    expect(sql).toContain("candidate.authority_state = 'accepted'");
    expect(sql).toContain("contact.contact_policy = 'contact_allowed'");
    expect(sql).toContain("contact.contact_state = 'active'");
  });

  it("distinguishes a valid empty registry from an unavailable relation", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(readApprovedContactsForEvent({ clientKey: "tenant-alpha", eventId }))
      .resolves.toEqual({ registryAvailable: true, approvedContacts: [] });
    withSessionMock.mockRejectedValueOnce(new Error("relation unavailable"));
    await expect(readApprovedContactsForEvent({ clientKey: "tenant-alpha", eventId }))
      .resolves.toEqual({ registryAvailable: false, approvedContacts: [] });
  });

  it.each([
    { client_key: "tenant-beta" },
    { source_event_id: "22222222-2222-4222-8222-222222222222" },
    { candidate_state: "draft" },
    { contact_policy: "do_not_contact" },
    { contact_state: "inactive" },
    { approved_contact_name: "Another person" },
    { approved_contact_email: "other@example.test" },
    { authority_state: "retired" },
    { approved_by_user_id: "" },
    { evidence_reference: "" },
    { retired_at: new Date("2026-09-24T01:00:00Z") },
  ])("fails closed for an inconsistent authority row: %p", async (change) => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...row, ...change }]);
    await expect(readApprovedContactsForEvent({ clientKey: "tenant-alpha", eventId }))
      .resolves.toEqual({ registryAvailable: false, approvedContacts: [] });
  });

  it("does not query for missing tenant or event identity", async () => {
    await expect(readApprovedContactsForEvent({ clientKey: "", eventId }))
      .resolves.toEqual({ registryAvailable: false, approvedContacts: [] });
    expect(withSessionMock).not.toHaveBeenCalled();
  });
});

describe("Stage 06 named-contact approval write", () => {
  const input = {
    clientKey: "tenant-alpha",
    eventId,
    vendorId: "vendor-1",
    contactId: "contact-1",
    approvedByUserId: "reviewer-1",
    evidenceReference: "Reviewed canonical contact and event invitation scope.",
  };
  const candidate = {
    authority_id: "candidate-authority-1",
    vendor_raw_payload: { candidate_supplier_registry: { contactPolicy: "contact_allowed" } },
  };
  const contact = {
    display_name: "Named contact",
    email: "contact@example.test",
    contact_policy: "contact_allowed",
    contact_state: "active",
  };
  const transaction = (resolve: (sql: string) => unknown[]): TxSessionRunner =>
    async <T>(callback: (run: SqlRunner) => Promise<T>): Promise<T> => {
      const run: SqlRunner = async <R>(sql: string) => resolve(sql) as R[];
      return callback(run);
    };

  it("binds approved authority to an accepted candidate and canonical active contact", async () => {
    const sqls: string[] = [];
    const tx = transaction((sql) => {
      sqls.push(sql);
      if (sql.includes("FROM source_event_candidate_supplier_authority")) return [candidate];
      if (sql.includes("FROM source.vendor_contact")) return [contact];
      if (sql.includes("INSERT INTO source_event_rfx_contact_authority")) return [{ id: "row-1" }];
      return [];
    });
    await expect(approveRfxContact(input, tx, () => "2026-10-02T01:00:00Z", () => "approval-1"))
      .resolves.toEqual({ ok: true, id: "row-1", authorityId: "approval-1" });
    const candidateQuery = sqls.find((sql) => sql.includes("FROM source_event_candidate_supplier_authority"))!;
    expect(candidateQuery).toContain("authority.client_key = $1");
    expect(candidateQuery).toContain("authority.source_event_id = $2::uuid");
    expect(candidateQuery).toContain("authority.vendor_id = $3");
    const insert = sqls.find((sql) => sql.includes("INSERT INTO source_event_rfx_contact_authority"))!;
    expect(insert).toContain("approved_contact_name");
    expect(insert).toContain("approved_contact_email");
  });

  it("lets a named reviewer clear review-required supplier posture for an allowed canonical contact", async () => {
    const reviewed = {
      ...candidate,
      vendor_raw_payload: { candidate_supplier_registry: { contactPolicy: "review_required" } },
    };
    const tx = transaction((sql) => {
      if (sql.includes("FROM source_event_candidate_supplier_authority")) return [reviewed];
      if (sql.includes("FROM source.vendor_contact")) return [contact];
      if (sql.includes("INSERT INTO source_event_rfx_contact_authority")) return [{ id: "row-1" }];
      return [];
    });
    await expect(approveRfxContact(input, tx, () => "2026-10-02T01:00:00Z", () => "approval-1"))
      .resolves.toEqual({ ok: true, id: "row-1", authorityId: "approval-1" });
  });

  it("keeps do-not-contact supplier posture absolute even with a canonical allowed contact", async () => {
    const forbidden = {
      ...candidate,
      vendor_raw_payload: { candidate_supplier_registry: { contactPolicy: "do_not_contact" } },
    };
    const sqls: string[] = [];
    const tx = transaction((sql) => {
      sqls.push(sql);
      if (sql.includes("FROM source_event_candidate_supplier_authority")) return [forbidden];
      if (sql.includes("FROM source.vendor_contact")) return [contact];
      if (sql.includes("INSERT INTO source_event_rfx_contact_authority")) return [{ id: "row-1" }];
      return [];
    });
    await expect(approveRfxContact(input, tx, () => "2026-10-02T01:00:00Z", () => "approval-1"))
      .resolves.toEqual({ ok: false, code: "contact_not_allowed" });
    expect(sqls.some((sql) => sql.includes("INSERT INTO source_event_rfx_contact_authority"))).toBe(false);
  });

  it("refuses a review-required approval without a named reviewer or audit evidence", async () => {
    const tx = transaction((sql) => {
      if (sql.includes("FROM source_event_candidate_supplier_authority")) return [
        { ...candidate, vendor_raw_payload: { candidate_supplier_registry: { contactPolicy: "review_required" } } },
      ];
      if (sql.includes("FROM source.vendor_contact")) return [contact];
      if (sql.includes("INSERT INTO source_event_rfx_contact_authority")) return [{ id: "row-1" }];
      return [];
    });
    await expect(approveRfxContact({ ...input, approvedByUserId: "" }, tx))
      .resolves.toEqual({ ok: false, code: "invalid_record" });
    await expect(approveRfxContact({ ...input, evidenceReference: "thin" }, tx))
      .resolves.toEqual({ ok: false, code: "invalid_record" });
  });

  it("refuses an undeclared supplier contact policy", async () => {
    const tx = transaction((sql) => {
      if (sql.includes("FROM source_event_candidate_supplier_authority")) return [
        { ...candidate, vendor_raw_payload: { candidate_supplier_registry: {} } },
      ];
      return [];
    });
    await expect(approveRfxContact(input, tx, () => "2026-10-02T01:00:00Z", () => "approval-1"))
      .resolves.toEqual({ ok: false, code: "contact_not_allowed" });
  });

  it("refuses an unknown or foreign-event candidate before reading a contact or writing", async () => {
    const sqls: string[] = [];
    const tx = transaction((sql) => {
      sqls.push(sql);
      if (sql.includes("FROM source_event_candidate_supplier_authority")) {
        return sql.includes("authority.source_event_id = $2::uuid") ? [] : [candidate];
      }
      if (sql.includes("FROM source.vendor_contact")) return [contact];
      if (sql.includes("INSERT INTO source_event_rfx_contact_authority")) return [{ id: "row-1" }];
      return [];
    });
    await expect(approveRfxContact(input, tx, () => "2026-10-02T01:00:00Z", () => "approval-1"))
      .resolves.toEqual({ ok: false, code: "candidate_not_accepted" });
    expect(sqls.some((sql) => sql.includes("FROM source.vendor_contact"))).toBe(false);
    expect(sqls.some((sql) => sql.includes("INSERT INTO source_event_rfx_contact_authority"))).toBe(false);
  });

  it.each(["review_required", "do_not_contact"])("refuses a %s canonical contact policy", async (policy) => {
    const tx = transaction((sql) => {
      if (sql.includes("FROM source_event_candidate_supplier_authority")) return [candidate];
      if (sql.includes("FROM source.vendor_contact")) return [{ ...contact, contact_policy: policy }];
      return [];
    });
    await expect(approveRfxContact(input, tx, () => "2026-10-02T01:00:00Z", () => "approval-1"))
      .resolves.toEqual({ ok: false, code: "contact_not_allowed" });
  });
});
