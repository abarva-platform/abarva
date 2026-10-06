const withSessionMock = jest.fn();
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: (fn: unknown) => withSessionMock(fn) },
}));

import { readSyntheticNdaOperatorStatus } from "@/lib/source/esign/operator-status";

const eventId = "11111111-1111-4111-8111-111111111111";
const input = { clientKey: "meridian-health", eventId };

describe("synthetic NDA operator status", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the accepted panel, approved active contact and latest envelope in one event-scoped session", async () => {
    const queries: { sql: string; args: unknown[] }[] = [];
    withSessionMock.mockImplementationOnce(async (fn: (run: jest.Mock) => Promise<unknown>) => fn(jest.fn(async (sql: string, args: unknown[]) => {
      queries.push({ sql, args });
      return sql.includes("WITH accepted AS") ? [{
        vendor_id: "SYN-VENDOR-001", contact_authority_id: "SYN-CONTACT-001",
        contact_name: "Fictional Contact", envelope_id: "33333333-3333-4333-8333-333333333333",
        envelope_status: "sent", envelope_template_version: "synthetic-1.0",
        approval_contacts: [{ contactId: "CONTACT-001", name: "Fictional Contact", email: "synthetic@abarva.ai" }],
      }] : [];
    })));
    expect(await readSyntheticNdaOperatorStatus(input)).toEqual([{
      vendorId: "SYN-VENDOR-001", contactAuthorityId: "SYN-CONTACT-001",
      contactName: "Fictional Contact", envelopeId: "33333333-3333-4333-8333-333333333333",
      envelopeStatus: "sent", envelopeTemplateVersion: "synthetic-1.0",
      approvalContacts: [{ contactId: "CONTACT-001", name: "Fictional Contact", email: "synthetic@abarva.ai" }],
    }]);
    expect(queries[0]).toEqual({ sql: "SELECT set_config('app.tenant_key', $1, false)", args: [input.clientKey] });
    const sql = queries[1]!.sql;
    expect(sql).toContain("candidate.client_key = $1");
    expect(sql).toContain("candidate.source_event_id = $2::uuid");
    expect(sql).toContain("candidate.authority_state = 'accepted'");
    expect(sql).toContain("vendor_contact.contact_policy = 'contact_allowed'");
    expect(sql).toContain("vendor_contact.contact_state = 'active'");
    expect(sql).toContain("candidate.source_event_id = $2::uuid");
    expect(sql).toContain("approval_contact.contact_policy = 'contact_allowed'");
    expect(sql).toContain("approval_contact.contact_state = 'active'");
    expect(sql).toContain("lower(split_part(approval_contact.email, '@', 2)) = 'abarva.ai'");
    expect(sql).toContain("contact_authority.authority_state = 'approved'");
    expect(sql).toContain("envelope.candidate_authority_id = accepted.id");
    expect(sql).toContain("ORDER BY envelope.created_at DESC");
    expect(queries[1]!.args).toEqual([input.clientKey, eventId]);
  });

  it("fails closed for another tenant, invalid event or duplicate supplier rows", async () => {
    expect(await readSyntheticNdaOperatorStatus({ ...input, clientKey: "other-tenant" })).toBeNull();
    expect(await readSyntheticNdaOperatorStatus({ ...input, eventId: "invalid" })).toBeNull();
    expect(withSessionMock).not.toHaveBeenCalled();
    withSessionMock.mockImplementationOnce(async (fn: (run: jest.Mock) => Promise<unknown>) => fn(jest.fn(async (sql: string) =>
      sql.includes("WITH accepted AS") ? [
        { vendor_id: "SYN-VENDOR-001", contact_authority_id: null, contact_name: null,
          envelope_id: null, envelope_status: null, envelope_template_version: null, approval_contacts: [] },
        { vendor_id: "SYN-VENDOR-001", contact_authority_id: null, contact_name: null,
          envelope_id: null, envelope_status: null, envelope_template_version: null, approval_contacts: [] },
      ] : [])));
    expect(await readSyntheticNdaOperatorStatus(input)).toBeNull();
  });

  it("reads a provider-voided envelope as terminal rather than dropping the supplier panel", async () => {
    withSessionMock.mockImplementationOnce(async (fn: (run: jest.Mock) => Promise<unknown>) => fn(jest.fn(async (sql: string) =>
      sql.includes("WITH accepted AS") ? [{
        vendor_id: "SYN-VENDOR-001", contact_authority_id: "SYN-CONTACT-001",
        contact_name: "Fictional Contact", envelope_id: "33333333-3333-4333-8333-333333333333",
        envelope_status: "voided", envelope_template_version: "synthetic-1.0", approval_contacts: [],
      }] : [])));
    expect(await readSyntheticNdaOperatorStatus(input)).toEqual([expect.objectContaining({
      vendorId: "SYN-VENDOR-001", envelopeStatus: "voided",
    })]);
  });

  it("rejects malformed or duplicate approval contacts instead of exposing an ambiguous decision", async () => {
    withSessionMock.mockImplementationOnce(async (fn: (run: jest.Mock) => Promise<unknown>) => fn(jest.fn(async (sql: string) =>
      sql.includes("WITH accepted AS") ? [{
        vendor_id: "SYN-VENDOR-001", contact_authority_id: null, contact_name: null,
        envelope_id: null, envelope_status: null, envelope_template_version: null,
        approval_contacts: [
          { contactId: "CONTACT-001", name: "First", email: "synthetic@abarva.ai" },
          { contactId: "CONTACT-001", name: "Second", email: "synthetic@abarva.ai" },
        ],
      }] : [])));
    expect(await readSyntheticNdaOperatorStatus(input)).toBeNull();
  });

  it("fails closed if a contact outside the internal lab domain reaches the projection", async () => {
    withSessionMock.mockImplementationOnce(async (fn: (run: jest.Mock) => Promise<unknown>) => fn(jest.fn(async (sql: string) =>
      sql.includes("WITH accepted AS") ? [{
        vendor_id: "SYN-VENDOR-001", contact_authority_id: null, contact_name: null,
        envelope_id: null, envelope_status: null, envelope_template_version: null,
        approval_contacts: [{ contactId: "CONTACT-001", name: "Outside", email: "person@supplier.example" }],
      }] : [])));
    expect(await readSyntheticNdaOperatorStatus(input)).toBeNull();
  });
});
