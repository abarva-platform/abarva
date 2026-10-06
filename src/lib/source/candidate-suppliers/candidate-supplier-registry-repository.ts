import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  CandidateSupplierAuthorityRow,
  CandidateSupplierAuthorityState,
  CandidateSupplierContact,
  CandidateSupplierContactPolicy,
} from "./candidate-supplier-authority";

type VendorRow = {
  vendor_id: string;
  legal_name: string;
  supplier_category: string | null;
  source_system: string | null;
  source_record_id: string | null;
  as_of_date: string | Date | null;
  evidence_reference: string | null;
  raw_payload: unknown;
};

export type CandidateSupplierRegistryRead = {
  registryAvailable: boolean;
  rows: CandidateSupplierAuthorityRow[];
};

const UNAVAILABLE: CandidateSupplierRegistryRead = {
  registryAvailable: false,
  rows: [],
};

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const textList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.flatMap((item) => (text(item) ? [text(item)!] : [])))]
    : [];
const iso = (value: string | Date | null): string =>
  value instanceof Date ? value.toISOString() : value ?? "";

function registryPayload(row: VendorRow): Record<string, unknown> {
  const raw = record(row.raw_payload);
  return record(
    raw.candidate_supplier_registry ?? raw.candidateSupplierRegistry,
  );
}

function authorityState(value: unknown): CandidateSupplierAuthorityState {
  const state = text(value);
  return state === "accepted" || state === "retired" ? state : "draft";
}

function contactPolicy(value: unknown): CandidateSupplierContactPolicy {
  const policy = text(value);
  return policy === "contact_allowed" || policy === "do_not_contact"
    ? policy
    : "review_required";
}

function contacts(value: unknown): CandidateSupplierContact[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const raw = record(item);
    const contactId = text(raw.contactId ?? raw.contact_id);
    const role = text(raw.role);
    const state = text(raw.state);
    if (!contactId || !role || (state !== "active" && state !== "inactive")) {
      return [];
    }
    return [
      {
        contactId,
        role,
        displayName: text(raw.displayName ?? raw.display_name) ?? undefined,
        email: text(raw.email) ?? undefined,
        state,
      },
    ];
  });
}

function mapVendorRow(
  tenantKey: string,
  row: VendorRow,
): CandidateSupplierAuthorityRow {
  const registry = registryPayload(row);
  const categoryKeys = textList(
    registry.categoryKeys ?? registry.category_keys,
  );
  const supplierCategory = text(row.supplier_category);
  if (supplierCategory && !categoryKeys.includes(supplierCategory)) {
    categoryKeys.push(supplierCategory);
  }
  return {
    tenantKey,
    supplierId: row.vendor_id,
    legalEntityId: row.vendor_id,
    legalName: row.legal_name,
    authorityState: authorityState(
      registry.authorityState ?? registry.authority_state,
    ),
    eligibility: {
      categoryKeys,
      functionKeys: textList(
        registry.functionKeys ?? registry.function_keys,
      ),
      archetypeKeys: textList(
        registry.archetypeKeys ?? registry.archetype_keys,
      ),
    },
    contactPolicy: contactPolicy(
      registry.contactPolicy ?? registry.contact_policy,
    ),
    contacts: contacts(registry.contacts),
    source: {
      system: text(row.source_system) ?? "",
      reference:
        text(row.evidence_reference) ?? text(row.source_record_id) ?? "",
      recordedAt: iso(row.as_of_date),
      recordedBy: text(row.source_record_id) ?? "",
    },
  };
}

/**
 * Read the tenant candidate-supplier registry before event acceptance.
 * Existing-contract membership is deliberately read through a different
 * repository so a current vendor cannot silently become a sourcing candidate.
 */
export async function readCandidateSupplierRegistry(
  tenantKey: string,
): Promise<CandidateSupplierRegistryRead> {
  if (!tenantKey.trim()) return UNAVAILABLE;

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
      const rows = await run<VendorRow>(
        `SELECT vendor_id,
                legal_name,
                supplier_category,
                source_system,
                source_record_id,
                as_of_date,
                evidence_reference,
                raw_payload
           FROM source.vendor
          WHERE tenant_key = $1
          ORDER BY legal_name ASC, vendor_id ASC`,
        [tenantKey],
      );
      return {
        registryAvailable: true,
        rows: rows.map((row) => mapVendorRow(tenantKey, row)),
      };
    });
  } catch {
    return UNAVAILABLE;
  }
}
