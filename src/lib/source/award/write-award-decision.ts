import { randomUUID } from "node:crypto";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { contractFromAward } from "./contract-from-award";

/**
 * Writes the award decision for one Source event, and the canonical contract
 * that decision produces, in one transaction.
 *
 * Until now no sourcing event could produce a contract. Every writer of
 * `source.contract` is an ingestion script, so every contract in the platform
 * arrived by import and the sourcing lifecycle stopped at the panel. This is
 * the consumer the pure mapping was waiting for.
 *
 * Both rows are written together or neither is. An award whose contract failed
 * to write would assert, through its own CHECK constraint, that it produced a
 * contract that does not exist.
 */
export type SourceEventAwardInput = {
  clientKey: string;
  eventId: string;
  vendorId: string;
  approvedByUserId: string;
  approvedByName: string;
  contractName: string;
  awardRationale: string;
  evidenceReference: string;
  currency?: string;
};

export type SourceEventAwardResult =
  | { ok: true; awardId: string; contractId: string }
  | {
      ok: false;
      code:
        | "invalid_record"
        | "event_not_found"
        | "candidate_not_accepted"
        | "award_not_derivable"
        | "duplicate_award"
        | "contract_id_taken"
        | "award_unavailable";
      refusals?: string[];
    };

type EventRow = { event_code: string };
type CandidateRow = { authority_id: string; legal_name: string };

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const validUuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

/**
 * Thrown to roll the transaction back. `createTxSession` commits whatever the
 * callback returns, so a refusal discovered after the award row is inserted has
 * to leave by throwing or the award would commit without its contract.
 */
class AwardRollback extends Error {
  constructor(readonly code: "contract_id_taken") {
    super(code);
  }
}

export async function recordSourceEventAward(
  input: SourceEventAwardInput,
  tx: TxSessionRunner = createTxSession("source-event-award-decision"),
  now: () => string = () => new Date().toISOString(),
  newAwardId: () => string = randomUUID,
): Promise<SourceEventAwardResult> {
  if (
    !validUuid(input.eventId) ||
    ![
      input.clientKey,
      input.vendorId,
      input.approvedByUserId,
      input.approvedByName,
      input.contractName,
    ].every(filled) ||
    // The awarded CHECK constraint requires a rationale and evidence with
    // content. A one-word reason satisfies the database and explains nothing,
    // so the writer asks for more than the column does.
    input.awardRationale.trim().length < 12 ||
    input.evidenceReference.trim().length < 12
  ) {
    return { ok: false, code: "invalid_record" };
  }

  const approvedAt = now();
  const awardId = newAwardId();
  if (!Number.isFinite(Date.parse(approvedAt)) || !filled(awardId)) {
    return { ok: false, code: "invalid_record" };
  }

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [input.clientKey]);

      const events = await run<EventRow>(
        `SELECT event_code
           FROM source_events
          WHERE id = $1::uuid
            AND client_key = $2
          FOR SHARE`,
        [input.eventId, input.clientKey],
      );
      if (events.length !== 1) return { ok: false, code: "event_not_found" } as const;

      // The award can only name a supplier this event accepted onto its panel.
      // Joining candidate authority to `source.vendor` is what makes that true:
      // a free-text supplier name has no canonical identity and so cannot reach
      // this row at all.
      const candidates = await run<CandidateRow>(
        `SELECT authority.authority_id, vendor.legal_name
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
      const candidate = candidates[0];
      if (candidates.length !== 1 || !candidate || !filled(candidate.authority_id)) {
        return { ok: false, code: "candidate_not_accepted" } as const;
      }

      const mapped = contractFromAward({
        tenantKey: input.clientKey,
        eventId: input.eventId,
        eventCode: events[0].event_code,
        vendorId: input.vendorId,
        vendorLegalName: candidate.legal_name,
        contractName: input.contractName,
        currency: input.currency ?? "",
        approvedBy: input.approvedByUserId,
        approvedAt,
      });
      if (!mapped.ok) {
        return { ok: false, code: "award_not_derivable", refusals: mapped.refusals } as const;
      }
      const row = mapped.row;

      // The award goes in first. Its partial unique index on
      // (client_key, source_event_id) WHERE award_state <> 'retired' is what
      // makes a replay a refusal rather than a second contract, so it has to be
      // the first write that can conflict.
      const awarded = await run<{ id: string }>(
        `INSERT INTO source_event_award_decision (
           award_id, client_key, source_event_id, vendor_id, candidate_authority_id,
           award_state, contract_id, contract_name, currency,
           approved_by_user_id, approved_by_name, approved_at,
           award_rationale, evidence_reference
         ) VALUES (
           $1, $2, $3::uuid, $4, $5,
           'awarded', $6, $7, $8,
           $9, $10, $11::timestamptz,
           $12, $13
         ) ON CONFLICT DO NOTHING RETURNING id`,
        [
          awardId,
          input.clientKey,
          input.eventId,
          input.vendorId,
          candidate.authority_id,
          row.contractId,
          row.contractName,
          row.currency,
          input.approvedByUserId,
          input.approvedByName.trim(),
          approvedAt,
          input.awardRationale.trim(),
          input.evidenceReference.trim(),
        ],
      );
      if (!awarded[0]) return { ok: false, code: "duplicate_award" } as const;

      // `quality_state` stays at the column's own default of 'unreviewed'. The
      // award is named and evidenced; the contract record derived from it has
      // been reviewed by nobody. Writing 'accepted' here would make an
      // award-produced contract read as confirmed to the Source projections
      // that key on that value.
      const contract = await run<{ contract_id: string }>(
        `INSERT INTO source.contract (
           tenant_key, contract_id, vendor_id, contract_name, currency,
           quality_state, source_system, source_record_id, evidence_reference
         ) VALUES (
           $1, $2, $3, $4, $5,
           'unreviewed', 'source-event-award', $6, $7
         ) ON CONFLICT (tenant_key, contract_id) DO NOTHING RETURNING contract_id`,
        [
          row.tenantKey,
          row.contractId,
          row.vendorId,
          row.contractName,
          row.currency,
          awardId,
          input.evidenceReference.trim(),
        ],
      );
      // The contract id is a digest of tenant, event and supplier, so a clash
      // means some other row already holds it. Adopting it would let an award
      // claim a contract it did not produce, so the award is rolled back with
      // it rather than left pointing at a stranger's row.
      if (!contract[0]) throw new AwardRollback("contract_id_taken");

      return { ok: true, awardId, contractId: row.contractId } as const;
    });
  } catch (error) {
    if (error instanceof AwardRollback) return { ok: false, code: error.code };
    return { ok: false, code: "award_unavailable" };
  }
}
