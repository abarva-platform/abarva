const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: (...args: unknown[]) => withSessionMock(...args),
  },
}));

import { readApprovedContactsForEvent } from "@/lib/source/rfx-delivery/release-authority-repository";

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
