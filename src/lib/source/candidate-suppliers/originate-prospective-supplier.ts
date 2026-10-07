import { randomUUID } from "node:crypto";
import {
  createTxSession,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";

export type OriginateProspectiveSupplierInput = {
  clientKey: string;
  eventId: string;
  expectedEventVersionId: string;
  legalName: string;
  contactName: string;
  contactEmail: string;
  contactPermissionConfirmed: boolean;
  approvedByUserId: string;
  approvedByName: string;
  rationale: string;
};

export type OriginateProspectiveSupplierResult =
  | { ok: true; supplierId: string; authorityId: string }
  | {
      ok: false;
      code:
        | "invalid_input"
        | "reviewer_required"
        | "contact_permission_required"
        | "rationale_required"
        | "event_mapping_required"
        | "stale_event_version"
        | "request_not_accepted"
        | "duplicate_supplier"
        | "write_failed";
      detail: string;
    };

type EventRow = {
  id: string;
  event_type: string | null;
  classified_category: string | null;
};
type VersionRow = { id: string; request_accepted: boolean };

const validUuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const validEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const failure = (
  code: Exclude<OriginateProspectiveSupplierResult, { ok: true }>["code"],
  detail: string,
): OriginateProspectiveSupplierResult => ({ ok: false, code, detail });

function categoryId(value: string | null): SourceCategoryId | null {
  return value && (SOURCE_CATEGORY_IDS as readonly string[]).includes(value)
    ? (value as SourceCategoryId)
    : null;
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

/** Source operator intake is the upstream record; no ERP or payable identity is asserted. */
export async function originateProspectiveSupplier(
  input: OriginateProspectiveSupplierInput,
  tx: TxSessionRunner = createTxSession("source-prospective-supplier-origination"),
): Promise<OriginateProspectiveSupplierResult> {
  const legalName = input.legalName.trim();
  const contactName = input.contactName.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const reviewerName = input.approvedByName.trim();
  if (
    !input.clientKey.trim() ||
    !validUuid(input.eventId) ||
    !validUuid(input.expectedEventVersionId) ||
    legalName.length < 3 || legalName.length > 200 ||
    contactName.length < 2 || contactName.length > 200 ||
    contactEmail.length > 320 || !validEmail(contactEmail)
  ) {
    return failure("invalid_input", "Valid event, supplier, and contact identity are required.");
  }
  if (
    !input.approvedByUserId.trim() ||
    !reviewerName ||
    ["user", "unknown", "unknown user"].includes(reviewerName.toLowerCase())
  ) {
    return failure("reviewer_required", "A named signed-in procurement reviewer is required.");
  }
  if (!input.contactPermissionConfirmed) {
    return failure("contact_permission_required", "Confirm authority to record this contact for future governed supplier work.");
  }
  if (input.rationale.trim().length < 12) {
    return failure("rationale_required", "An approval rationale of at least 12 characters is required.");
  }

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);
      const [event] = await run<EventRow>(
        `SELECT id, event_type, classified_category
           FROM source_events
          WHERE client_key = $1 AND id = $2::uuid
          LIMIT 1`,
        [input.clientKey, input.eventId],
      );
      const category = categoryId(event?.classified_category ?? null);
      const mapping = resolveArchetypeForEvent({
        categoryId: category,
        eventType: event?.event_type ?? undefined,
      });
      if (!event || !category || !mapping.archetypeId) {
        return failure("event_mapping_required", "The event needs a governed category and archetype mapping.");
      }

      const [version] = await run<VersionRow>(
        `SELECT version.id,
                EXISTS (
                  SELECT 1 FROM source_event_authority_version_approvals approval
                   WHERE approval.version_id = version.id
                     AND approval.client_key = version.client_key
                     AND approval.event_id = version.event_id
                     AND approval.authority_kind = version.authority_kind
                     AND approval.role = 'request_acceptor'
                     AND approval.decision = 'approved'
                ) AND NOT EXISTS (
                  SELECT 1 FROM source_event_authority_version_approvals approval
                   WHERE approval.version_id = version.id
                     AND approval.client_key = version.client_key
                     AND approval.event_id = version.event_id
                     AND approval.authority_kind = version.authority_kind
                     AND approval.role = 'request_acceptor'
                     AND approval.decision = 'changes_requested'
                ) AS request_accepted
           FROM source_event_authority_versions version
          WHERE version.client_key = $1
            AND version.event_id = $2::uuid
            AND version.authority_kind = 'request'
            AND version.superseded_at IS NULL
          LIMIT 1`,
        [input.clientKey, input.eventId],
      );
      if (version?.id !== input.expectedEventVersionId) {
        return failure("stale_event_version", "The current Request version changed; reload before approving a supplier.");
      }
      if (!version.request_accepted) {
        return failure("request_not_accepted", "The current Request version must be accepted first.");
      }

      await run(
        "SELECT pg_advisory_xact_lock(hashtextextended($1 || ':' || lower(btrim($2)), 0))",
        [input.clientKey, legalName],
      );
      const duplicates = await run<{ vendor_id: string }>(
        `SELECT vendor_id FROM source.vendor
          WHERE tenant_key = $1 AND lower(btrim(legal_name)) = lower($2)
          LIMIT 1`,
        [input.clientKey, legalName],
      );
      if (duplicates.length > 0) {
        return failure("duplicate_supplier", "A supplier with this legal name already exists for this tenant.");
      }

      const id = randomUUID();
      const supplierId = `prospect:${id}`;
      const contactId = `contact:${id}`;
      const authorityId = `stage04:${input.eventId}:${version.id}:${supplierId}`;
      const reference = `source-operator-intake:${id}`;
      const recordedAt = new Date().toISOString();
      const payload = {
        candidate_supplier_registry: {
          authorityState: "accepted",
          categoryKeys: [category],
          functionKeys: [],
          archetypeKeys: [mapping.archetypeId],
          contactPolicy: "contact_allowed",
          contacts: [{
            contactId,
            role: "NDA contact",
            displayName: contactName,
            email: contactEmail,
            state: "active",
          }],
        },
        source_operator_intake: {
          reference,
          eventId: input.eventId,
          requestVersionId: version.id,
          approvedByUserId: input.approvedByUserId,
          approvedByName: reviewerName,
          rationale: input.rationale.trim(),
          contactPermissionConfirmed: true,
          recordedAt,
          erpVendorId: null,
          payable: false,
        },
      };
      await run(
        `INSERT INTO source.vendor (
           tenant_key, vendor_id, legal_name, supplier_category,
           strategic_status, source_system, source_record_id, as_of_date,
           quality_state, evidence_reference, raw_payload
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, $11::jsonb)
         RETURNING vendor_id`,
        [
          input.clientKey, supplierId, legalName, category,
          "prospective", "source_operator_intake", reference,
          recordedAt.slice(0, 10), "unreviewed", reference, JSON.stringify(payload),
        ],
      );
      await run(
        `INSERT INTO source.vendor_contact (
           tenant_key, vendor_id, contact_id, display_name, email,
           contact_policy, contact_state, source_system, source_record_id,
           evidence_reference, as_of_date
         ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10::date)
         RETURNING contact_id`,
        [
          input.clientKey, supplierId, contactId, contactName, contactEmail,
          "contact_allowed", "source_operator_intake", reference,
          reference, recordedAt.slice(0, 10),
        ],
      );
      await run(
        `INSERT INTO source_event_candidate_supplier_authority (
           authority_id, client_key, source_event_id, vendor_id,
           authority_state, accepted_by_user_id, accepted_by_name,
           accepted_at, acceptance_rationale, evidence_reference
         ) VALUES ($1, $2, $3::uuid, $4, 'accepted', $5, $6, now(), $7, $8)
         RETURNING authority_id`,
        [
          authorityId, input.clientKey, input.eventId, supplierId,
          input.approvedByUserId, reviewerName, input.rationale.trim(), reference,
        ],
      );
      return { ok: true, supplierId, authorityId };
    });
  } catch (error) {
    return isUniqueViolation(error)
      ? failure("duplicate_supplier", "This prospective supplier was already recorded.")
      : failure("write_failed", "Prospective supplier origination is unavailable.");
  }
}
