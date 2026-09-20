import { azureRead } from "@/lib/data-plane/azureRead";

type CandidateAuthorityRow = {
  authority_id: string;
  vendor_id: string;
  legal_name: string;
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
const iso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;

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
