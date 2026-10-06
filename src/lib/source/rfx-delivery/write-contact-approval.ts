import { randomUUID } from "node:crypto";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

export type RfxContactApprovalInput = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  contactId: string;
  approvedByUserId: string;
  evidenceReference: string;
};

export type RfxContactApprovalResult =
  | { ok: true; id: string; authorityId: string }
  | { ok: false; code: "invalid_record" | "candidate_not_accepted" | "contact_not_allowed" | "duplicate_approval" | "authority_unavailable" };

type CandidateRow = { authority_id: string; vendor_raw_payload: unknown };
type ContactRow = { display_name: string; email: string; contact_policy: string; contact_state: string };

const filled = (value: string): boolean => value.trim().length > 0;
const validUuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function supplierContactAllowed(raw: unknown): boolean {
  const payload = record(raw);
  const registry = record(payload.candidate_supplier_registry ?? payload.candidateSupplierRegistry);
  const policy = registry.contactPolicy ?? registry.contact_policy;
  return policy === "contact_allowed" || policy === "review_required";
}

export async function approveRfxContact(
  input: RfxContactApprovalInput,
  tx: TxSessionRunner = createTxSession("source-rfx-contact-approval"),
  now: () => string = () => new Date().toISOString(),
  newAuthorityId: () => string = randomUUID,
): Promise<RfxContactApprovalResult> {
  if (!validUuid(input.eventId) ||
    ![input.clientKey, input.vendorId, input.contactId, input.approvedByUserId].every(filled) ||
    input.evidenceReference.trim().length < 12) {
    return { ok: false, code: "invalid_record" };
  }
  const approvedAt = now();
  const authorityId = newAuthorityId();
  if (!Number.isFinite(Date.parse(approvedAt)) || !filled(authorityId)) {
    return { ok: false, code: "invalid_record" };
  }

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);
      const candidates = await run<CandidateRow>(
        `SELECT authority.authority_id, vendor.raw_payload AS vendor_raw_payload
         FROM source_event_candidate_supplier_authority authority
         JOIN source.vendor vendor
           ON vendor.tenant_key = authority.client_key
          AND vendor.vendor_id = authority.vendor_id
         WHERE authority.client_key = $1
           AND authority.source_event_id = $2::uuid
           AND authority.vendor_id = $3
           AND authority.authority_state = 'accepted'
           AND authority.retired_at IS NULL
           AND authority.accepted_at <= $4::timestamptz
         FOR SHARE OF authority, vendor`,
        [input.clientKey, input.eventId, input.vendorId, approvedAt],
      );
      if (candidates.length !== 1) return { ok: false, code: "candidate_not_accepted" };
      if (!supplierContactAllowed(candidates[0].vendor_raw_payload)) {
        return { ok: false, code: "contact_not_allowed" };
      }

      const contacts = await run<ContactRow>(
        `SELECT display_name, email, contact_policy, contact_state
         FROM source.vendor_contact
         WHERE tenant_key = $1
           AND vendor_id = $2
           AND contact_id = $3
         FOR SHARE`,
        [input.clientKey, input.vendorId, input.contactId],
      );
      const contact = contacts[0];
      if (contacts.length !== 1 || !contact ||
        contact.contact_policy !== "contact_allowed" || contact.contact_state !== "active" ||
        !filled(contact.display_name) || !filled(contact.email)) {
        return { ok: false, code: "contact_not_allowed" };
      }

      const inserted = await run<{ id: string }>(
        `INSERT INTO source_event_rfx_contact_authority (
           authority_id, client_key, source_event_id, vendor_id, contact_id,
           candidate_authority_id, approved_contact_name, approved_contact_email,
           authority_state, approved_by_user_id, approved_at, evidence_reference
         ) VALUES (
           $1, $2, $3::uuid, $4, $5, $6, $7, $8,
           'approved', $9, $10::timestamptz, $11
         ) ON CONFLICT DO NOTHING RETURNING id`,
        [authorityId, input.clientKey, input.eventId, input.vendorId, input.contactId,
          candidates[0].authority_id, contact.display_name, contact.email,
          input.approvedByUserId, approvedAt, input.evidenceReference.trim()],
      );
      return inserted[0]
        ? { ok: true, id: inserted[0].id, authorityId }
        : { ok: false, code: "duplicate_approval" };
    });
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
}
