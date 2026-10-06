import { azureRead } from "@/lib/data-plane/azureRead";

export type ApprovedRfxContact = {
  authorityId: string;
  candidateAuthorityId: string;
  tenantKey: string;
  eventId: string;
  legalEntityId: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPolicy: "contact_allowed";
  contactState: "approved";
  approvedByUserId: string;
  approvedAt: string;
  evidenceReference: string;
};

type ContactAuthorityRow = {
  authority_id: string;
  client_key: string;
  source_event_id: string;
  vendor_id: string;
  contact_id: string;
  display_name: string;
  email: string;
  approved_contact_name: string;
  approved_contact_email: string;
  contact_policy: string;
  contact_state: string;
  authority_state: string;
  candidate_authority_id: string;
  candidate_state: string;
  approved_by_user_id: string | null;
  approved_at: string | Date | null;
  evidence_reference: string | null;
  retired_at: string | Date | null;
};

const UNAVAILABLE = { registryAvailable: false, approvedContacts: [] } as const;

function filled(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function approvedRow(
  row: ContactAuthorityRow,
  input: { clientKey: string; eventId: string },
): boolean {
  return row.client_key === input.clientKey &&
    row.source_event_id === input.eventId &&
    filled(row.authority_id) &&
    filled(row.candidate_authority_id) &&
    filled(row.vendor_id) &&
    filled(row.contact_id) &&
    filled(row.display_name) &&
    filled(row.email) &&
    row.approved_contact_name === row.display_name &&
    row.approved_contact_email === row.email &&
    row.contact_policy === "contact_allowed" &&
    row.contact_state === "active" &&
    row.authority_state === "approved" &&
    row.candidate_state === "accepted" &&
    filled(row.approved_by_user_id) &&
    row.approved_at !== null &&
    Number.isFinite(Date.parse(String(row.approved_at))) &&
    filled(row.evidence_reference) &&
    row.retired_at === null;
}

export async function readApprovedContactsForEvent(input: {
  clientKey: string;
  eventId: string;
}): Promise<{ registryAvailable: boolean; approvedContacts: readonly ApprovedRfxContact[] }> {
  if (!filled(input.clientKey) || !filled(input.eventId)) return UNAVAILABLE;

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.clientKey]);
      const rows = await run<ContactAuthorityRow>(
        `SELECT authority.authority_id, authority.client_key,
                authority.source_event_id, authority.vendor_id,
                authority.contact_id, contact.display_name, contact.email,
                authority.approved_contact_name,
                authority.approved_contact_email,
                contact.contact_policy, contact.contact_state,
                authority.authority_state, authority.candidate_authority_id,
                candidate.authority_state AS candidate_state,
                authority.approved_by_user_id, authority.approved_at,
                authority.evidence_reference, authority.retired_at
         FROM source_event_rfx_contact_authority authority
         JOIN source.vendor_contact contact
           ON contact.tenant_key = authority.client_key
          AND contact.vendor_id = authority.vendor_id
          AND contact.contact_id = authority.contact_id
          AND contact.display_name = authority.approved_contact_name
          AND contact.email = authority.approved_contact_email
         JOIN source_event_candidate_supplier_authority candidate
           ON candidate.client_key = authority.client_key
          AND candidate.authority_id = authority.candidate_authority_id
          AND candidate.source_event_id = authority.source_event_id
          AND candidate.vendor_id = authority.vendor_id
         WHERE authority.client_key = $1
           AND authority.source_event_id = $2::uuid
           AND authority.authority_state = 'approved'
           AND authority.retired_at IS NULL
           AND candidate.authority_state = 'accepted'
           AND contact.contact_policy = 'contact_allowed'
           AND contact.contact_state = 'active'
         ORDER BY authority.vendor_id, authority.contact_id`,
        [input.clientKey, input.eventId],
      );
      if (!rows.every((row) => approvedRow(row, input))) return UNAVAILABLE;
      return {
        registryAvailable: true,
        approvedContacts: rows.map((row) => ({
          authorityId: row.authority_id,
          candidateAuthorityId: row.candidate_authority_id,
          tenantKey: row.client_key,
          eventId: row.source_event_id,
          legalEntityId: row.vendor_id,
          contactId: row.contact_id,
          contactName: row.display_name,
          contactEmail: row.email,
          contactPolicy: "contact_allowed" as const,
          contactState: "approved" as const,
          approvedByUserId: row.approved_by_user_id!,
          approvedAt: row.approved_at instanceof Date
            ? row.approved_at.toISOString()
            : row.approved_at!,
          evidenceReference: row.evidence_reference!,
        })),
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}
