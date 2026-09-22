import {
  readAcceptedCandidatesForEvent,
  type AcceptedEventCandidate,
} from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import {
  readContractVendorLegalEntityIds,
  toVendorPanelContractInput,
} from "@/lib/source/candidate-suppliers/contract-vendor-repository";
import {
  buildVendorPanelProjection,
  type VendorPanelGroup,
} from "@/lib/source/candidate-suppliers/vendor-panel-projection";
import type {
  CandidateSupplierContact,
  CandidateSupplierContactPolicy,
  CandidateSupplierEligibility,
  CandidateSupplierProjectionRow,
  CandidateSupplierRegistrySlice,
} from "@/lib/source/candidate-suppliers/candidate-supplier-authority";

/**
 * Stage 04 — the accepted candidate panel, as a surface can render it.
 *
 * Two of the three groups the stage 04 decision names are answerable from
 * the data that exists, and the third is not. Saying which is which is the
 * point of this module.
 *
 * **Answerable.** The candidate authority records who was explicitly
 * accepted onto the panel, and the contract register records which legal
 * entities the organisation is already under contract with. Those two give
 * the distinction that matters most at this stage: an incumbent is not a
 * fresh candidate, and presenting them together invites someone to "add" a
 * supplier already being bought from.
 *
 * **Not answerable, and not invented.** `source_event_candidate_supplier_authority`
 * carries no eligibility attributes and no contact policy, and neither does
 * `source.vendor`. So this panel makes **no claim about contactability** and
 * shows no category/function/archetype eligibility. Rendering an unrecorded
 * contact policy as "contactable" is the failure this whole stage exists to
 * avoid, and rendering it as a blocker nobody can clear would be just as
 * wrong. It is reported as not recorded.
 *
 * **Selection is a later stage.** Nothing here records that a candidate was
 * selected as a respondent unless the candidate registry carries a named
 * selector, timestamp, and evidence reference. Acceptance onto the panel alone
 * never promotes a supplier into the selected-respondent group.
 */

export type SourceNewStage04PanelRow = {
  authorityId: string;
  legalEntityId: string;
  legalName: string;
  group: VendorPanelGroup;
  acceptedByName: string;
  acceptedAt: string;
  evidenceReference: string;
  eligibility?: CandidateSupplierEligibility | null;
  contactPolicy?: CandidateSupplierContactPolicy | null;
  contactBlocker?: string | null;
  activeContactCount?: number;
  selectedByName?: string | null;
  selectedAt?: string | null;
  selectionEvidenceReference?: string | null;
  sourceReferences?: readonly string[];
};

export type SourceNewStage04VendorPanel = {
  status: "available" | "empty" | "blocked";
  blockers: readonly string[];
  rows: readonly SourceNewStage04PanelRow[];
  counts: Record<VendorPanelGroup, number>;
  /** Stated on the surface, not buried: what this panel does not know. */
  notRecorded: readonly string[];
  asOf: string;
};

export type SourceNewStage04PanelInput = {
  clientKey: string;
  eventId: string;
  asOf: string;
};

const NOT_RECORDED = [
  "Contact policy is not recorded for accepted candidates, so this panel makes no claim about who may be contacted.",
  "Category, function and archetype eligibility are not recorded on the acceptance record.",
  "Respondent selection is not recorded on any accepted candidate, so the selected group is empty by evidence rather than by outcome.",
] as const;

const RESPONDENT_SELECTION_NOTE =
  "Respondent selection is not recorded on any accepted candidate, so the selected group is empty by evidence rather than by outcome.";

function hasEligibility(
  eligibility: CandidateSupplierEligibility | null | undefined,
): boolean {
  return Boolean(
    eligibility &&
      (eligibility.categoryKeys.length > 0 ||
        eligibility.functionKeys.length > 0 ||
        eligibility.archetypeKeys.length > 0),
  );
}

function activeContacts(
  contacts: readonly CandidateSupplierContact[],
): readonly CandidateSupplierContact[] {
  return contacts.filter((contact) => contact.state === "active");
}

function contactReadiness(
  candidate: AcceptedEventCandidate,
): CandidateSupplierProjectionRow["contactReadiness"] {
  if (!candidate.contactPolicy) return "review_required";
  if (candidate.contactPolicy === "do_not_contact") return "prohibited";
  if (candidate.contactPolicy === "review_required") return "review_required";
  return activeContacts(candidate.contacts ?? []).some((contact) =>
    Boolean(contact.email?.trim()),
  )
    ? "ready"
    : "missing_contact";
}

function selectionAuthority(
  candidate: AcceptedEventCandidate,
): NonNullable<AcceptedEventCandidate["selectionAuthority"]> | null {
  const selection = candidate.selectionAuthority;
  if (
    !selection?.selectedByName.trim() ||
    !selection.selectedAt.trim() ||
    Number.isNaN(Date.parse(selection.selectedAt)) ||
    !selection.evidenceReference.trim()
  ) {
    return null;
  }
  return selection;
}

function notRecordedNotes(
  candidates: readonly AcceptedEventCandidate[],
): readonly string[] {
  return [
    candidates.some((candidate) => !candidate.contactPolicy)
      ? NOT_RECORDED[0]
      : null,
    candidates.some((candidate) => !hasEligibility(candidate.eligibility))
      ? NOT_RECORDED[1]
      : null,
    candidates.some((candidate) => selectionAuthority(candidate))
      ? null
      : RESPONDENT_SELECTION_NOTE,
  ].filter((note): note is string => Boolean(note));
}

/**
 * Turn an accepted candidate into the projection's row shape.
 *
 * Every field the acceptance record does not carry is set to the value that
 * claims the least. `contactPolicy` is `review_required` because unknown is
 * not permission — but the panel reports contactability as *not recorded*
 * rather than surfacing that as a blocker somebody could try to clear.
 */
export function asProjectionRow(
  candidate: AcceptedEventCandidate,
): CandidateSupplierProjectionRow {
  const selection = selectionAuthority(candidate);
  return {
    supplierId: candidate.supplierId,
    legalEntityId: candidate.legalEntityId,
    legalName: candidate.legalName,
    eligibility: candidate.eligibility ?? {
      categoryKeys: [],
      functionKeys: [],
      archetypeKeys: [],
    },
    contactPolicy: candidate.contactPolicy ?? "review_required",
    contactReadiness: contactReadiness(candidate),
    activeContacts: activeContacts(candidate.contacts ?? []),
    // Acceptance onto the panel is not selection as a respondent.
    selectedForEvent: Boolean(selection),
    source: {
      system: "source_event_candidate_supplier_authority",
      reference: candidate.evidenceReference,
      recordedAt: candidate.acceptedAt,
      recordedBy: candidate.acceptedByName,
    },
  };
}

export async function readSourceNewStage04VendorPanel(
  input: SourceNewStage04PanelInput,
): Promise<SourceNewStage04VendorPanel> {
  const [authority, contracts] = await Promise.all([
    readAcceptedCandidatesForEvent({
      clientKey: input.clientKey,
      eventId: input.eventId,
    }),
    readContractVendorLegalEntityIds(input.clientKey),
  ]);

  const slice: CandidateSupplierRegistrySlice = {
    tenantKey: input.clientKey,
    eventId: input.eventId,
    // An unreadable authority is unknown, not empty. The projection refuses
    // a blocked slice, which is what should happen.
    status: authority.registryAvailable
      ? authority.acceptedCandidates.length > 0
        ? "available"
        : "empty"
      : "unavailable",
    blockers: authority.registryAvailable
      ? []
      : ["The candidate authority could not be read."],
    candidates: authority.acceptedCandidates.map(asProjectionRow),
    contactReadySupplierIds: [],
    excluded: [],
  };

  const projection = buildVendorPanelProjection({
    slice,
    ...toVendorPanelContractInput(contracts),
  });

  const byEntity = new Map(
    authority.acceptedCandidates.map((c) => [c.legalEntityId, c]),
  );

  return {
    status: projection.status,
    blockers: projection.blockers,
    rows: projection.rows.flatMap((row) => {
      const candidate = byEntity.get(row.legalEntityId);
      if (!candidate) return [];
      const selection = selectionAuthority(candidate);
      return [
        {
          authorityId: candidate.authorityId,
          legalEntityId: row.legalEntityId,
          legalName: row.legalName,
          group: row.group,
          acceptedByName: candidate.acceptedByName,
          acceptedAt: candidate.acceptedAt,
          evidenceReference: candidate.evidenceReference,
          eligibility: candidate.eligibility ?? null,
          contactPolicy: candidate.contactPolicy ?? null,
          contactBlocker: row.contactBlocker,
          activeContactCount: candidate.activeContactCount ?? 0,
          selectedByName: selection?.selectedByName ?? null,
          selectedAt: selection?.selectedAt ?? null,
          selectionEvidenceReference: selection?.evidenceReference ?? null,
          sourceReferences: [
            candidate.evidenceReference,
            candidate.registrySource?.reference,
            selection?.evidenceReference,
          ].filter((item): item is string => Boolean(item)),
        },
      ];
    }),
    counts: projection.counts,
    notRecorded: notRecordedNotes(authority.acceptedCandidates),
    asOf: input.asOf,
  };
}
