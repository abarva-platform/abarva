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
 * selected as a respondent; acceptance onto the panel is what this table
 * holds. The selected-respondent group is therefore always empty, and the
 * surface says so rather than letting an empty group read as "nobody was
 * selected".
 */

export type SourceNewStage04PanelRow = {
  authorityId: string;
  legalEntityId: string;
  legalName: string;
  group: VendorPanelGroup;
  acceptedByName: string;
  acceptedAt: string;
  evidenceReference: string;
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
  "Respondent selection happens after this stage, so the selected group is empty by design rather than by outcome.",
] as const;

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
  return {
    supplierId: candidate.supplierId,
    legalEntityId: candidate.legalEntityId,
    legalName: candidate.legalName,
    eligibility: { categoryKeys: [], functionKeys: [], archetypeKeys: [] },
    contactPolicy: "review_required",
    contactReadiness: "review_required",
    activeContacts: [],
    // Acceptance onto the panel is not selection as a respondent.
    selectedForEvent: false,
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
      return [
        {
          authorityId: candidate.authorityId,
          legalEntityId: row.legalEntityId,
          legalName: row.legalName,
          group: row.group,
          acceptedByName: candidate.acceptedByName,
          acceptedAt: candidate.acceptedAt,
          evidenceReference: candidate.evidenceReference,
        },
      ];
    }),
    counts: projection.counts,
    notRecorded: NOT_RECORDED,
    asOf: input.asOf,
  };
}
