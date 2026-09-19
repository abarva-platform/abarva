export type CandidateSupplierAuthorityState = "draft" | "accepted" | "retired";

export type CandidateSupplierContactPolicy =
  | "contact_allowed"
  | "review_required"
  | "do_not_contact";

export type CandidateSupplierContact = {
  contactId: string;
  role: string;
  displayName?: string;
  email?: string;
  state: "active" | "inactive";
};

export type CandidateSupplierEligibility = {
  categoryKeys: readonly string[];
  functionKeys: readonly string[];
  archetypeKeys: readonly string[];
};

export type CandidateSupplierAuthorityRow = {
  tenantKey: string;
  supplierId: string;
  legalEntityId: string;
  legalName: string;
  authorityState: CandidateSupplierAuthorityState;
  eligibility: CandidateSupplierEligibility;
  contactPolicy: CandidateSupplierContactPolicy;
  contacts: readonly CandidateSupplierContact[];
  source: {
    system: string;
    reference: string;
    recordedAt: string;
    recordedBy: string;
  };
};

export type CandidateSupplierEventFilters = {
  categoryKey?: string;
  functionKey?: string;
  archetypeKey?: string;
};

export type CandidateSupplierProjectionInput = {
  registryAvailable: boolean;
  tenantKey: string;
  eventId: string;
  filters: CandidateSupplierEventFilters;
  rows: readonly CandidateSupplierAuthorityRow[];
  selectedSupplierIds: readonly string[];
};

export type CandidateSupplierExclusionReason =
  | "authority_not_accepted"
  | "duplicate_supplier_id"
  | "identity_incomplete"
  | "lineage_incomplete"
  | "eligibility_mismatch";

export type CandidateSupplierProjectionRow = {
  supplierId: string;
  legalEntityId: string;
  legalName: string;
  eligibility: CandidateSupplierEligibility;
  contactPolicy: CandidateSupplierContactPolicy;
  contactReadiness: "ready" | "missing_contact" | "review_required" | "prohibited";
  activeContacts: readonly CandidateSupplierContact[];
  selectedForEvent: boolean;
  source: CandidateSupplierAuthorityRow["source"];
};

export type CandidateSupplierRegistrySlice = {
  tenantKey: string;
  eventId: string;
  status: "available" | "empty" | "blocked" | "unavailable";
  blockers: readonly string[];
  candidates: readonly CandidateSupplierProjectionRow[];
  contactReadySupplierIds: readonly string[];
  excluded: readonly {
    supplierId: string;
    reason: CandidateSupplierExclusionReason;
  }[];
};

const filled = (value: string | undefined): boolean => Boolean(value?.trim());

function hasLineage(row: CandidateSupplierAuthorityRow): boolean {
  return (
    filled(row.source.system) &&
    filled(row.source.reference) &&
    filled(row.source.recordedAt) &&
    !Number.isNaN(Date.parse(row.source.recordedAt)) &&
    filled(row.source.recordedBy)
  );
}

function matchesFilter(expected: string | undefined, actual: readonly string[]): boolean {
  return !filled(expected) || actual.includes(expected!.trim());
}

function matchesEligibility(
  row: CandidateSupplierAuthorityRow,
  filters: CandidateSupplierEventFilters,
): boolean {
  return (
    matchesFilter(filters.categoryKey, row.eligibility.categoryKeys) &&
    matchesFilter(filters.functionKey, row.eligibility.functionKeys) &&
    matchesFilter(filters.archetypeKey, row.eligibility.archetypeKeys)
  );
}

function contactReadiness(
  row: CandidateSupplierAuthorityRow,
): CandidateSupplierProjectionRow["contactReadiness"] {
  if (row.contactPolicy === "do_not_contact") return "prohibited";
  if (row.contactPolicy === "review_required") return "review_required";
  const hasContact = row.contacts.some(
    (contact) =>
      contact.state === "active" &&
      filled(contact.contactId) &&
      filled(contact.role) &&
      filled(contact.email),
  );
  return hasContact ? "ready" : "missing_contact";
}

export function buildCandidateSupplierRegistrySlice(
  input: CandidateSupplierProjectionInput,
): CandidateSupplierRegistrySlice {
  const base = {
    tenantKey: input.tenantKey,
    eventId: input.eventId,
    contactReadySupplierIds: [] as string[],
  };
  if (!filled(input.tenantKey) || !filled(input.eventId)) {
    return {
      ...base,
      status: "blocked",
      blockers: ["Declare the tenant and sourcing event identity"],
      candidates: [],
      excluded: [],
    };
  }
  if (!input.registryAvailable) {
    return {
      ...base,
      status: "unavailable",
      blockers: ["Governed candidate-supplier authority is unavailable"],
      candidates: [],
      excluded: [],
    };
  }

  const hasFilter = [
    input.filters.categoryKey,
    input.filters.functionKey,
    input.filters.archetypeKey,
  ].some(filled);
  if (!hasFilter) {
    return {
      ...base,
      status: "blocked",
      blockers: ["Declare at least one governed eligibility filter for the event"],
      candidates: [],
      excluded: [],
    };
  }

  const tenantRows = input.rows.filter((row) => row.tenantKey === input.tenantKey);
  const duplicateIds = new Set(
    tenantRows
      .map((row) => row.supplierId)
      .filter((supplierId, index, all) => all.indexOf(supplierId) !== index),
  );
  const excluded: Array<{
    supplierId: string;
    reason: CandidateSupplierExclusionReason;
  }> = [];
  const selected = new Set(input.selectedSupplierIds);
  const candidates: CandidateSupplierProjectionRow[] = [];

  for (const row of tenantRows) {
    let reason: CandidateSupplierExclusionReason | null = null;
    if (row.authorityState !== "accepted") reason = "authority_not_accepted";
    else if (duplicateIds.has(row.supplierId)) reason = "duplicate_supplier_id";
    else if (!filled(row.supplierId) || !filled(row.legalEntityId) || !filled(row.legalName)) {
      reason = "identity_incomplete";
    } else if (!hasLineage(row)) reason = "lineage_incomplete";
    else if (!matchesEligibility(row, input.filters)) reason = "eligibility_mismatch";

    if (reason) {
      excluded.push({ supplierId: row.supplierId, reason });
      continue;
    }

    const activeContacts = row.contacts.filter((contact) => contact.state === "active");
    candidates.push({
      supplierId: row.supplierId,
      legalEntityId: row.legalEntityId,
      legalName: row.legalName,
      eligibility: row.eligibility,
      contactPolicy: row.contactPolicy,
      contactReadiness: contactReadiness(row),
      activeContacts,
      selectedForEvent: selected.has(row.supplierId),
      source: row.source,
    });
  }

  candidates.sort(
    (left, right) =>
      left.legalName.localeCompare(right.legalName) ||
      left.supplierId.localeCompare(right.supplierId),
  );
  const contactReadySupplierIds = candidates
    .filter((candidate) => candidate.contactReadiness === "ready")
    .map((candidate) => candidate.supplierId);

  return {
    ...base,
    status: candidates.length > 0 ? "available" : "empty",
    blockers: [],
    candidates,
    contactReadySupplierIds,
    excluded,
  };
}
