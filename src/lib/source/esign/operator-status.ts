import { azureRead } from "@/lib/data-plane/azureRead";

export type NdaOperatorSupplierStatus = {
  vendorId: string;
  contactAuthorityId: string | null;
  contactName: string | null;
  approvalContacts: readonly { contactId: string; name: string; email: string }[];
  envelopeId: string | null;
  envelopeStatus: "created" | "sent" | "viewed" | "completed" | "declined" | "voided" | null;
  envelopeTemplateVersion: string | null;
};

type StatusRow = {
  vendor_id: string;
  contact_authority_id: string | null;
  contact_name: string | null;
  approval_contacts: unknown;
  envelope_id: string | null;
  envelope_status: string | null;
  envelope_template_version: string | null;
};

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const statuses = new Set(["created", "sent", "viewed", "completed", "declined", "voided"]);

export async function readSyntheticNdaOperatorStatus(input: {
  clientKey: string;
  eventId: string;
}): Promise<NdaOperatorSupplierStatus[] | null> {
  if (input.clientKey !== "meridian-health" || !uuid.test(input.eventId)) return null;
  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.clientKey]);
      const rows = await run<StatusRow>(
        `WITH accepted AS (
           SELECT candidate.id, candidate.authority_id, candidate.vendor_id
           FROM source_event_candidate_supplier_authority candidate
           WHERE candidate.client_key = $1
             AND candidate.source_event_id = $2::uuid
             AND candidate.authority_state = 'accepted'
             AND candidate.retired_at IS NULL
         )
         SELECT accepted.vendor_id,
                contact_authority.authority_id AS contact_authority_id,
                contact_authority.approved_contact_name AS contact_name,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'contactId', approval_contact.contact_id,
                    'name', approval_contact.display_name,
                    'email', approval_contact.email
                  ) ORDER BY approval_contact.contact_id)
                  FROM source.vendor_contact approval_contact
                  WHERE approval_contact.tenant_key = $1
                    AND approval_contact.vendor_id = accepted.vendor_id
                    AND approval_contact.contact_policy = 'contact_allowed'
                    AND approval_contact.contact_state = 'active'
                    AND lower(split_part(approval_contact.email, '@', 2)) = 'abarva.ai'
                ), '[]'::jsonb) AS approval_contacts,
                envelope.provider_envelope_id AS envelope_id,
                envelope.status AS envelope_status,
                envelope.template_version AS envelope_template_version
         FROM accepted
         LEFT JOIN LATERAL (
           SELECT contact_authority.authority_id, contact_authority.approved_contact_name
           FROM source_event_rfx_contact_authority contact_authority
           JOIN source.vendor_contact vendor_contact
             ON vendor_contact.tenant_key = contact_authority.client_key
            AND vendor_contact.vendor_id = contact_authority.vendor_id
            AND vendor_contact.contact_id = contact_authority.contact_id
            AND vendor_contact.display_name = contact_authority.approved_contact_name
            AND vendor_contact.email = contact_authority.approved_contact_email
           WHERE contact_authority.client_key = $1
             AND contact_authority.source_event_id = $2::uuid
             AND contact_authority.vendor_id = accepted.vendor_id
             AND contact_authority.candidate_authority_id = accepted.authority_id
             AND contact_authority.authority_state = 'approved'
             AND contact_authority.retired_at IS NULL
             AND contact_authority.approved_at IS NOT NULL
             AND contact_authority.approved_by_user_id IS NOT NULL
             AND contact_authority.evidence_reference IS NOT NULL
             AND vendor_contact.contact_policy = 'contact_allowed'
             AND vendor_contact.contact_state = 'active'
           ORDER BY contact_authority.approved_at DESC, contact_authority.id DESC
           LIMIT 1
         ) contact_authority ON true
         LEFT JOIN LATERAL (
           SELECT envelope.provider_envelope_id, envelope.status,
                  envelope.template_version
           FROM source_nda_esign_envelopes envelope
           WHERE envelope.client_key = $1
             AND envelope.source_event_id = $2::uuid
             AND envelope.vendor_id = accepted.vendor_id
             AND envelope.candidate_authority_id = accepted.id
             AND envelope.provider = 'docusign'
             AND envelope.provider_environment = 'demo'
           ORDER BY envelope.created_at DESC, envelope.id DESC
           LIMIT 1
         ) envelope ON true
         ORDER BY accepted.vendor_id`,
        [input.clientKey, input.eventId],
      );
      const seen = new Set<string>();
      const result: NdaOperatorSupplierStatus[] = [];
      for (const row of rows) {
        if (!Array.isArray(row.approval_contacts)) return null;
        const approvalContacts: Array<{ contactId: string; name: string; email: string }> = [];
        const contactIds = new Set<string>();
        for (const value of row.approval_contacts) {
          if (!value || typeof value !== "object" || Array.isArray(value)) return null;
          const contact = value as Record<string, unknown>;
          if (typeof contact.contactId !== "string" || !contact.contactId.trim() ||
              typeof contact.name !== "string" || !contact.name.trim() ||
              typeof contact.email !== "string" || !/^[^@\s]+@abarva\.ai$/i.test(contact.email) ||
              contactIds.has(contact.contactId)) return null;
          contactIds.add(contact.contactId);
          approvalContacts.push({ contactId: contact.contactId, name: contact.name, email: contact.email });
        }
        if (!row.vendor_id?.trim() || seen.has(row.vendor_id) ||
            (row.envelope_status !== null && !statuses.has(row.envelope_status)) ||
            Boolean(row.contact_authority_id) !== Boolean(row.contact_name) ||
            Boolean(row.envelope_id) !== Boolean(row.envelope_status)) return null;
        seen.add(row.vendor_id);
        result.push({
          vendorId: row.vendor_id,
          contactAuthorityId: row.contact_authority_id,
          contactName: row.contact_name,
          approvalContacts,
          envelopeId: row.envelope_id,
          envelopeStatus: row.envelope_status as NdaOperatorSupplierStatus["envelopeStatus"],
          envelopeTemplateVersion: row.envelope_template_version,
        });
      }
      return result;
    });
  } catch {
    return null;
  }
}
