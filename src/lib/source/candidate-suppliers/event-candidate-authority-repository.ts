import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  CandidateSupplierContact,
  CandidateSupplierContactPolicy,
  CandidateSupplierEligibility,
} from "./candidate-supplier-authority";

type CandidateAuthorityRow = {
  authority_id: string;
  vendor_id: string;
  legal_name: string;
  supplier_category: string | null;
  vendor_source_system: string | null;
  vendor_source_record_id: string | null;
  vendor_as_of_date: string | Date | null;
  vendor_evidence_reference: string | null;
  vendor_raw_payload: unknown;
  accepted_by_name: string;
  accepted_at: string | Date;
  acceptance_rationale: string;
  evidence_reference: string;
};

export type AcceptedEventCandidate = {
  authorityId: string;
  supplierId: string;
  legalEntityId: string;
  legalName: string;
  acceptedByName: string;
  acceptedAt: string;
  acceptanceRationale: string;
  evidenceReference: string;
  eligibility?: CandidateSupplierEligibility | null;
  contactPolicy?: CandidateSupplierContactPolicy | null;
  contacts?: readonly CandidateSupplierContact[];
  activeContactCount?: number;
  selectionAuthority?: {
    selectedByName: string;
    selectedAt: string;
    evidenceReference: string;
  } | null;
  registrySource?: {
    system: string;
    reference: string;
    recordedAt: string;
    recordedBy: string;
  } | null;
};

export type EventCandidateAuthorityRead = {
  registryAvailable: boolean;
  acceptedSupplierIds: string[];
  acceptedCandidates: AcceptedEventCandidate[];
};

const UNAVAILABLE: EventCandidateAuthorityRead = {
  registryAvailable: false,
  acceptedSupplierIds: [],
  acceptedCandidates: [],
};

const nonempty = (value: string): boolean => value.trim().length > 0;
const optionalText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const iso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;
const optionalIso = (value: string | Date | null): string | null =>
  value ? iso(value) : null;

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const text = optionalText(item);
        return text ? [text] : [];
      })
    : [];
}

function contactPolicy(value: unknown): CandidateSupplierContactPolicy | null {
  const text = optionalText(value);
  return text === "contact_allowed" ||
    text === "review_required" ||
    text === "do_not_contact"
    ? text
    : null;
}

function contacts(value: unknown): CandidateSupplierContact[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = objectRecord(item);
    const contactId = optionalText(record.contactId ?? record.contact_id);
    const role = optionalText(record.role);
    const state = optionalText(record.state);
    if (!contactId || !role || (state !== "active" && state !== "inactive")) {
      return [];
    }
    return [
      {
        contactId,
        role,
        displayName: optionalText(record.displayName ?? record.display_name) ?? undefined,
        email: optionalText(record.email) ?? undefined,
        state,
      },
    ];
  });
}

function registryPayload(row: CandidateAuthorityRow): Record<string, unknown> {
  const raw = objectRecord(row.vendor_raw_payload);
  return objectRecord(
    raw.candidate_supplier_registry ?? raw.candidateSupplierRegistry,
  );
}

function selectionAuthority(
  row: CandidateAuthorityRow,
): AcceptedEventCandidate["selectionAuthority"] {
  const registry = registryPayload(row);
  const raw = objectRecord(
    registry.selectionAuthority ??
      registry.selection_authority ??
      registry.respondentSelection ??
      registry.respondent_selection,
  );
  const selectedByName = optionalText(
    raw.selectedByName ?? raw.selected_by_name,
  );
  const selectedAt = optionalText(raw.selectedAt ?? raw.selected_at);
  const evidenceReference = optionalText(
    raw.evidenceReference ?? raw.evidence_reference,
  );
  if (
    !selectedByName ||
    !selectedAt ||
    Number.isNaN(Date.parse(selectedAt)) ||
    !evidenceReference
  ) {
    return null;
  }
  return {
    selectedByName,
    selectedAt: iso(selectedAt),
    evidenceReference,
  };
}

function eligibility(row: CandidateAuthorityRow): CandidateSupplierEligibility | null {
  const registry = registryPayload(row);
  const categoryKeys = [
    ...textArray(registry.categoryKeys ?? registry.category_keys),
    ...(optionalText(row.supplier_category) ? [optionalText(row.supplier_category)!] : []),
  ];
  const functionKeys = textArray(registry.functionKeys ?? registry.function_keys);
  const archetypeKeys = textArray(registry.archetypeKeys ?? registry.archetype_keys);
  const unique = (items: string[]) => [...new Set(items)];
  const result = {
    categoryKeys: unique(categoryKeys),
    functionKeys: unique(functionKeys),
    archetypeKeys: unique(archetypeKeys),
  };
  return result.categoryKeys.length ||
    result.functionKeys.length ||
    result.archetypeKeys.length
    ? result
    : null;
}

function registrySource(
  row: CandidateAuthorityRow,
): AcceptedEventCandidate["registrySource"] {
  const system = optionalText(row.vendor_source_system);
  const reference =
    optionalText(row.vendor_evidence_reference) ??
    optionalText(row.vendor_source_record_id);
  const recordedAt = optionalIso(row.vendor_as_of_date);
  const recordedBy = optionalText(row.vendor_source_record_id);
  return system && reference && recordedAt && recordedBy
    ? { system, reference, recordedAt, recordedBy }
    : null;
}

/**
 * Read only explicitly accepted candidate-panel authority for one governed
 * event. Supplier invitation, response, recommendation, and award fields are
 * deliberately outside this read path.
 */
export async function readAcceptedCandidatesForEvent(input: {
  clientKey: string;
  eventId: string;
}): Promise<EventCandidateAuthorityRead> {
  if (!nonempty(input.clientKey) || !nonempty(input.eventId)) {
    return UNAVAILABLE;
  }

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [
        input.clientKey,
      ]);
      const rows = await run<CandidateAuthorityRow>(
        `SELECT authority.authority_id,
                authority.vendor_id,
                vendor.legal_name,
                vendor.supplier_category,
                vendor.source_system AS vendor_source_system,
                vendor.source_record_id AS vendor_source_record_id,
                vendor.as_of_date AS vendor_as_of_date,
                vendor.evidence_reference AS vendor_evidence_reference,
                vendor.raw_payload AS vendor_raw_payload,
                authority.accepted_by_name,
                authority.accepted_at,
                authority.acceptance_rationale,
                authority.evidence_reference
         FROM source_event_candidate_supplier_authority authority
         INNER JOIN source.vendor vendor
           ON vendor.tenant_key = authority.client_key
          AND vendor.vendor_id = authority.vendor_id
         WHERE authority.client_key = $1
           AND authority.source_event_id = $2::uuid
           AND authority.authority_state = 'accepted'
           AND authority.retired_at IS NULL
         ORDER BY vendor.legal_name ASC, authority.vendor_id ASC`,
        [input.clientKey, input.eventId],
      );

      const acceptedCandidates = rows.map((row) => ({
        authorityId: row.authority_id,
        supplierId: row.vendor_id,
        legalEntityId: row.vendor_id,
        legalName: row.legal_name,
        acceptedByName: row.accepted_by_name,
        acceptedAt: iso(row.accepted_at),
        acceptanceRationale: row.acceptance_rationale,
        evidenceReference: row.evidence_reference,
        eligibility: eligibility(row),
        contactPolicy: contactPolicy(
          registryPayload(row).contactPolicy ??
            registryPayload(row).contact_policy,
        ),
        contacts: contacts(registryPayload(row).contacts),
        activeContactCount: contacts(registryPayload(row).contacts).filter(
          (contact) => contact.state === "active",
        ).length,
        selectionAuthority: selectionAuthority(row),
        registrySource: registrySource(row),
      }));

      return {
        registryAvailable: true,
        acceptedSupplierIds: acceptedCandidates.map(
          (candidate) => candidate.supplierId,
        ),
        acceptedCandidates,
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}
