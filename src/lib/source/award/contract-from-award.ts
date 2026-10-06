import { createHash } from "node:crypto";

/**
 * Maps an award decision onto the canonical contract row it should produce.
 *
 * Today every writer of `source.contract` is an ingestion script, so contracts
 * only ever enter the platform by import and no sourcing event has produced
 * one. This is the pure half of closing that: it decides what the row would be,
 * and refuses rather than guessing when the award cannot support one.
 *
 * It performs no write. The migration that persists an award decision, and the
 * transaction that writes both it and the contract, are separate slices.
 */
export type AwardDecision = {
  tenantKey: string;
  eventId: string;
  eventCode: string;
  /**
   * The winning supplier's canonical identity, resolved from the event's
   * candidate authority. Null when the panel entry was never resolved onto a
   * canonical supplier — which is a refusal, not something to invent.
   */
  vendorId: string | null;
  vendorLegalName: string;
  contractName: string;
  currency: string;
  approvedBy: string;
  approvedAt: string;
};

export type ContractRowDraft = {
  tenantKey: string;
  contractId: string;
  contractName: string;
  vendorId: string;
  currency: string;
  sourceEventId: string;
};

export type AwardToContractResult =
  | { ok: true; row: ContractRowDraft }
  | { ok: false; refusals: string[] };

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Stable across replays of the same award, distinct for a different supplier or
 * a different event. `source.contract` is unique on (tenant_key, contract_id),
 * so a deterministic id is what makes a second write a no-op rather than a
 * duplicate contract. It deliberately excludes the approval timestamp: the same
 * award re-sent is the same contract.
 */
function deterministicContractId(award: AwardDecision, vendorId: string): string {
  const digest = createHash("sha256")
    .update(`${award.tenantKey}\u0000${award.eventId}\u0000${vendorId}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `AWD-${digest}`;
}

export function contractFromAward(award: AwardDecision): AwardToContractResult {
  const refusals: string[] = [];

  // Every refusal is collected, not just the first: an operator fixing one
  // blocker at a time cannot see what else is wrong.
  if (!filled(award.vendorId)) {
    refusals.push("The winning supplier has no resolved canonical identity");
  }
  if (!filled(award.approvedBy)) {
    refusals.push("The award has no named approver");
  }
  if (!filled(award.contractName)) {
    refusals.push("The award has no contract name");
  }
  if (!filled(award.tenantKey) || !filled(award.eventId)) {
    refusals.push("The award is not bound to a tenant and an event");
  }

  if (refusals.length) return { ok: false, refusals };

  const vendorId = (award.vendorId as string).trim();
  return {
    ok: true,
    row: {
      tenantKey: award.tenantKey.trim(),
      contractId: deterministicContractId(award, vendorId),
      contractName: award.contractName.trim(),
      vendorId,
      currency: filled(award.currency) ? award.currency.trim() : "USD",
      sourceEventId: award.eventId.trim(),
    },
  };
}
