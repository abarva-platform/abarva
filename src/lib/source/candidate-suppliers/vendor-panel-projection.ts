import type {
  CandidateSupplierProjectionRow,
  CandidateSupplierRegistrySlice,
} from "./candidate-supplier-authority";

/**
 * Stage 04 vendor panel — read-only projection.
 *
 * The candidate-supplier authority already answers who is an accepted,
 * eligible candidate and who is selected for the event. It does not know the
 * third group the stage 04 decision names: **vendors already on a contract**.
 * That distinction is the point of the panel. A vendor the organisation
 * already buys from is not a fresh candidate, and presenting the two together
 * invites someone to "add" a supplier that is already under contract.
 *
 * The decision recorded for this stage:
 *
 *   - The canonical Vendor object supplies legal-entity candidates;
 *     Procurement Operations stewards identity and separate contact records.
 *   - Distinguish eligible candidates, selected respondents, and
 *     existing-contract vendors.
 *   - Show category/function/archetype eligibility and contact-policy
 *     blockers.
 *   - **Prevent send, contact and selection side effects.**
 *   - **Fail closed** when registry, filter, or do-not-contact evidence is
 *     absent.
 *
 * Side effects are prevented by construction rather than by discipline: this
 * module is a pure function over inputs and returns data with no action
 * handles on it. There is nothing here to call.
 */

export type VendorPanelGroup =
  | "eligible_candidate"
  | "selected_respondent"
  | "existing_contract_vendor";

export type VendorPanelRow = {
  supplierId: string;
  legalEntityId: string;
  legalName: string;
  group: VendorPanelGroup;
  /** Why this row is contactable, or why it is not. Always populated. */
  contactBlocker: string | null;
  eligibility: CandidateSupplierProjectionRow["eligibility"];
};

export type VendorPanelProjection = {
  /** `blocked` means show nothing and say why — never a partial panel. */
  status: "available" | "empty" | "blocked";
  blockers: readonly string[];
  rows: readonly VendorPanelRow[];
  counts: Record<VendorPanelGroup, number>;
};

export type VendorPanelInput = {
  slice: CandidateSupplierRegistrySlice;
  /**
   * Legal entity ids that already appear on a contract. Supplied rather than
   * derived so this stays pure; the caller reads them from the contract
   * register.
   */
  contractVendorLegalEntityIds: readonly string[];
  /**
   * Whether the contract register could be read at all. Distinguishing this
   * from an empty list is the whole point: "no vendors are under contract"
   * and "we could not find out" must not render the same, or every candidate
   * silently reads as new.
   */
  contractEvidenceAvailable: boolean;
};

/**
 * A contact blocker in words, or null when the row is contactable.
 *
 * `review_required` and `prohibited` both block. `missing_contact` blocks too
 * — a candidate with no contact record is not contactable, and showing it as
 * ready invites someone to discover that at the moment they try to reach out.
 */
function contactBlockerFor(row: CandidateSupplierProjectionRow): string | null {
  switch (row.contactReadiness) {
    case "ready":
      return null;
    case "prohibited":
      return "Do not contact: the supplier is marked do-not-contact.";
    case "review_required":
      return "Contact requires review before any approach.";
    case "missing_contact":
      return "No active contact record; the supplier cannot be reached yet.";
    default:
      // An unrecognised readiness value is unknown, and unknown blocks.
      return "Contact readiness is unrecognised, so this supplier is not contactable.";
  }
}

function groupFor(
  row: CandidateSupplierProjectionRow,
  contractVendors: ReadonlySet<string>,
): VendorPanelGroup {
  // Selection wins over contract history: a vendor already under contract who
  // has been selected for this event is a respondent in this event, and
  // filing them under history would hide them from the panel that matters.
  if (row.selectedForEvent) return "selected_respondent";
  if (contractVendors.has(row.legalEntityId)) return "existing_contract_vendor";
  return "eligible_candidate";
}

export function buildVendorPanelProjection(
  input: VendorPanelInput,
): VendorPanelProjection {
  const emptyCounts: Record<VendorPanelGroup, number> = {
    eligible_candidate: 0,
    selected_respondent: 0,
    existing_contract_vendor: 0,
  };

  // Fail closed on the registry first. A blocked or unavailable slice is not
  // an empty panel — it is an unknown one, and the two must not render alike.
  if (input.slice.status === "unavailable" || input.slice.status === "blocked") {
    return {
      status: "blocked",
      blockers: [
        `The candidate registry is ${input.slice.status}, so no panel can be shown.`,
        ...input.slice.blockers,
      ],
      rows: [],
      counts: emptyCounts,
    };
  }

  // And fail closed on contract evidence. Without it, every candidate would
  // read as new, which is the specific wrong answer this group exists to
  // prevent.
  if (!input.contractEvidenceAvailable) {
    return {
      status: "blocked",
      blockers: [
        "The contract register could not be read, so an existing-contract vendor " +
          "cannot be told from a new candidate. Showing the panel would present " +
          "every supplier as new.",
      ],
      rows: [],
      counts: emptyCounts,
    };
  }

  const contractVendors = new Set(input.contractVendorLegalEntityIds);
  const rows: VendorPanelRow[] = input.slice.candidates.map((candidate) => ({
    supplierId: candidate.supplierId,
    legalEntityId: candidate.legalEntityId,
    legalName: candidate.legalName,
    group: groupFor(candidate, contractVendors),
    contactBlocker: contactBlockerFor(candidate),
    eligibility: candidate.eligibility,
  }));

  const counts = rows.reduce<Record<VendorPanelGroup, number>>(
    (acc, row) => ({ ...acc, [row.group]: acc[row.group] + 1 }),
    { ...emptyCounts },
  );

  return {
    status: rows.length === 0 ? "empty" : "available",
    blockers: input.slice.blockers,
    rows,
    counts,
  };
}
