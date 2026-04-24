// Sponsor commitment record · File 01 FM-03 P0
//
// Structured commitment the program sponsor makes at D01 Charter time.
// Required before the Phase 1 → Phase 2 gate can advance per FM-03.
//
// The four canonical fields come from File 01 FM-03:
//   budget_ceiling          — upper bound of financial commitment
//   decision_gates          — named decision moments sponsor will own
//   resistance_interventions — how sponsor will handle pushback
//   time_allocation         — hours/week sponsor will spend on the program
//
// This module is the server-side contract; the React form lives in
// src/components/workflow/SponsorCommitmentForm.tsx and the persistence
// layer is src/app/api/programs/sponsor-commitment/route.ts.

export interface SponsorCommitmentInput {
  programCode: string;
  budgetCeiling: {
    amount: number;
    currency: 'USD';
    scope: string;
  };
  decisionGates: Array<{
    phase: number;
    moment: string;
    willOwn: boolean;
  }>;
  resistanceInterventions: string;
  timeAllocation: {
    hoursPerWeek: number;
    commitmentTermWeeks: number;
  };
}

export interface SponsorCommitmentRecord extends SponsorCommitmentInput {
  id: string;
  sponsorUserId: string;
  sponsorName: string | null;
  sponsorEmail: string | null;
  committedAt: string;
}

export interface SponsorCommitmentLedger {
  schemaVersion: '1.0';
  entries: SponsorCommitmentRecord[];
}

export type SponsorCommitmentValidationError =
  | { field: 'programCode'; reason: 'required' }
  | { field: 'budgetCeiling'; reason: 'required' | 'must_be_positive' }
  | { field: 'decisionGates'; reason: 'required_minimum_one' | 'must_own_all' }
  | { field: 'resistanceInterventions'; reason: 'required' | 'too_short' }
  | { field: 'timeAllocation'; reason: 'required' | 'must_be_positive' };

/**
 * Server-side validator. Returns all errors (not short-circuit) so the
 * form can surface every issue at once rather than making the sponsor
 * round-trip per field.
 */
export function validateSponsorCommitment(
  input: Partial<SponsorCommitmentInput>,
): SponsorCommitmentValidationError[] {
  const errors: SponsorCommitmentValidationError[] = [];

  if (!input.programCode || typeof input.programCode !== 'string' || input.programCode.trim().length === 0) {
    errors.push({ field: 'programCode', reason: 'required' });
  }

  if (!input.budgetCeiling || typeof input.budgetCeiling !== 'object') {
    errors.push({ field: 'budgetCeiling', reason: 'required' });
  } else {
    const amount = input.budgetCeiling.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      errors.push({ field: 'budgetCeiling', reason: 'required' });
    } else if (amount <= 0) {
      errors.push({ field: 'budgetCeiling', reason: 'must_be_positive' });
    }
  }

  if (!Array.isArray(input.decisionGates) || input.decisionGates.length === 0) {
    errors.push({ field: 'decisionGates', reason: 'required_minimum_one' });
  } else if (input.decisionGates.some((g) => !g.willOwn)) {
    // Per FM-03 spec: sponsor must explicitly own every named gate. If
    // any gate is un-owned, the commitment isn't a commitment.
    errors.push({ field: 'decisionGates', reason: 'must_own_all' });
  }

  const resistanceText = typeof input.resistanceInterventions === 'string' ? input.resistanceInterventions.trim() : '';
  if (!resistanceText) {
    errors.push({ field: 'resistanceInterventions', reason: 'required' });
  } else if (resistanceText.length < 40) {
    // Short enough to fit one sentence; floor helps avoid "tbd"-type
    // non-answers passing validation.
    errors.push({ field: 'resistanceInterventions', reason: 'too_short' });
  }

  if (!input.timeAllocation || typeof input.timeAllocation !== 'object') {
    errors.push({ field: 'timeAllocation', reason: 'required' });
  } else {
    const hrs = input.timeAllocation.hoursPerWeek;
    const weeks = input.timeAllocation.commitmentTermWeeks;
    if (typeof hrs !== 'number' || typeof weeks !== 'number' || !Number.isFinite(hrs) || !Number.isFinite(weeks)) {
      errors.push({ field: 'timeAllocation', reason: 'required' });
    } else if (hrs <= 0 || weeks <= 0) {
      errors.push({ field: 'timeAllocation', reason: 'must_be_positive' });
    }
  }

  return errors;
}

/**
 * Reason strings for UI display. Consumer (form) maps validator errors
 * to these user-readable strings.
 */
export const VALIDATION_REASON_COPY: Record<SponsorCommitmentValidationError['reason'], string> = {
  required: 'Required.',
  must_be_positive: 'Must be greater than zero.',
  required_minimum_one: 'Name at least one decision gate you will own.',
  must_own_all: 'Every named gate must be marked as yours — unowned gates block phase advance.',
  too_short: 'Needs enough substance that a sponsor can be held to it (one full sentence minimum).',
};
