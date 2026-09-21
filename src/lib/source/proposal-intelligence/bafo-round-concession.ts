import { canonicalTenantKey } from "@/lib/tenant/aliases";

export type Stage07BafoReviewState = "reviewed" | "not_reviewed" | "blocked";
export type Stage07BafoRoundConcessionState = "ready" | "blocked";

export interface Stage07BafoRoundRecord {
  tenantKey: string;
  sourceEventId: string;
  roundId: string;
  roundVersion: string;
  roundLabel: string;
  vendorId: string;
  vendorName: string;
  submittedAt: string | null;
  evidenceReference: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewState: Stage07BafoReviewState;
}

export interface Stage07BafoConcessionRecord {
  tenantKey: string;
  sourceEventId: string;
  concessionId: string;
  concessionVersion: string;
  roundId: string;
  roundVersion: string;
  vendorId: string;
  vendorName: string;
  concessionType: string;
  summary: string;
  condition: string | null;
  expiryDate: string | null;
  acceptedFlag: boolean | null;
  evidenceReference: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewState: Stage07BafoReviewState;
}

export interface Stage07BafoRoundView {
  roundId: string;
  roundVersion: string;
  roundLabel: string;
  vendorId: string;
  vendorName: string;
  submittedAt: string | null;
  evidenceReference: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewState: Stage07BafoReviewState;
}

export interface Stage07BafoConcessionView {
  concessionId: string;
  concessionVersion: string;
  roundId: string;
  roundVersion: string;
  vendorId: string;
  vendorName: string;
  concessionType: string;
  summary: string;
  condition: string | null;
  expiryDate: string | null;
  acceptedFlag: boolean | null;
  evidenceReference: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewState: Stage07BafoReviewState;
}

export interface Stage07BafoRoundConcessionBlocker {
  blockerId: string;
  vendorId: string | null;
  vendorName: string;
  label: string;
  detail: string;
  nextAction: string;
}

export interface Stage07BafoRoundConcessionView {
  state: Stage07BafoRoundConcessionState;
  roundRows: Stage07BafoRoundView[];
  concessionRows: Stage07BafoConcessionView[];
  blockers: Stage07BafoRoundConcessionBlocker[];
  guardrail: string;
}

export function buildStage07BafoRoundConcessionView(input: {
  tenantKey: string;
  sourceEventId: string;
  rounds: readonly Stage07BafoRoundRecord[];
  concessions: readonly Stage07BafoConcessionRecord[];
}): Stage07BafoRoundConcessionView {
  const tenantKey = canonicalTenantKey(input.tenantKey);
  const rounds = input.rounds.filter(
    (round) =>
      canonicalTenantKey(round.tenantKey) === tenantKey &&
      round.sourceEventId === input.sourceEventId,
  );
  const concessions = input.concessions.filter(
    (concession) =>
      canonicalTenantKey(concession.tenantKey) === tenantKey &&
      concession.sourceEventId === input.sourceEventId,
  );
  const blockers: Stage07BafoRoundConcessionBlocker[] = [];

  if (rounds.length === 0) {
    blockers.push({
      blockerId: "bafo-rounds-missing",
      vendorId: null,
      vendorName: "All vendors",
      label: "BAFO rounds missing",
      detail: "No tenant-scoped BAFO round records are loaded for this event.",
      nextAction:
        "Load versioned BAFO round evidence before using BAFO facts in a negotiation brief.",
    });
  }

  if (concessions.length === 0) {
    blockers.push({
      blockerId: "bafo-concessions-missing",
      vendorId: null,
      vendorName: "All vendors",
      label: "BAFO concessions missing",
      detail:
        "No tenant-scoped concession records are loaded for this event.",
      nextAction:
        "Load versioned concession evidence before using concession facts in a negotiation brief.",
    });
  }

  const roundsByVersion = new Map<string, Stage07BafoRoundRecord>();
  for (const round of rounds) {
    roundsByVersion.set(roundKey(round.roundId, round.roundVersion), round);
    if (!round.roundVersion.trim()) {
      blockers.push({
        blockerId: `round-${round.roundId}-version-missing`,
        vendorId: round.vendorId,
        vendorName: round.vendorName,
        label: "BAFO round version missing",
        detail: `${round.vendorName} has a BAFO round without a version.`,
        nextAction:
          "Attach a stable round version before treating the round as reviewed evidence.",
      });
    }
    if (!round.evidenceReference?.trim()) {
      blockers.push({
        blockerId: `round-${round.roundId}-evidence-missing`,
        vendorId: round.vendorId,
        vendorName: round.vendorName,
        label: "BAFO round evidence missing",
        detail: `${round.vendorName} has a BAFO round without an evidence reference.`,
        nextAction:
          "Attach the reviewed round evidence reference before using the round in a brief.",
      });
    }
    if (
      round.reviewState !== "reviewed" ||
      !round.reviewedBy?.trim() ||
      !round.reviewedAt?.trim()
    ) {
      blockers.push({
        blockerId: `round-${round.roundId}-review-missing`,
        vendorId: round.vendorId,
        vendorName: round.vendorName,
        label: "BAFO round review missing",
        detail: `${round.vendorName} has a BAFO round that is not reviewed by a named reviewer.`,
        nextAction:
          "Record named reviewer identity, review timestamp, and reviewed state before export.",
      });
    }
  }

  for (const concession of concessions) {
    const round = roundsByVersion.get(
      roundKey(concession.roundId, concession.roundVersion),
    );
    if (!round) {
      blockers.push({
        blockerId: `concession-${concession.concessionId}-round-link-missing`,
        vendorId: concession.vendorId,
        vendorName: concession.vendorName,
        label: "Concession round link missing",
        detail: `${concession.vendorName} has a concession that is not tied to a reviewed BAFO round version.`,
        nextAction:
          "Tie every concession to the exact reviewed BAFO round version before export.",
      });
    }
    if (!concession.concessionVersion.trim()) {
      blockers.push({
        blockerId: `concession-${concession.concessionId}-version-missing`,
        vendorId: concession.vendorId,
        vendorName: concession.vendorName,
        label: "Concession version missing",
        detail: `${concession.vendorName} has a concession without a version.`,
        nextAction:
          "Attach a stable concession version before treating it as reviewed evidence.",
      });
    }
    if (!concession.evidenceReference?.trim()) {
      blockers.push({
        blockerId: `concession-${concession.concessionId}-evidence-missing`,
        vendorId: concession.vendorId,
        vendorName: concession.vendorName,
        label: "Concession evidence missing",
        detail: `${concession.vendorName} has a concession without evidence.`,
        nextAction:
          "Attach the concession evidence reference before using it in a brief.",
      });
    }
    if (
      concession.reviewState !== "reviewed" ||
      !concession.reviewedBy?.trim() ||
      !concession.reviewedAt?.trim()
    ) {
      blockers.push({
        blockerId: `concession-${concession.concessionId}-review-missing`,
        vendorId: concession.vendorId,
        vendorName: concession.vendorName,
        label: "Concession review missing",
        detail: `${concession.vendorName} has a concession that is not reviewed by a named reviewer.`,
        nextAction:
          "Record named reviewer identity, review timestamp, and reviewed state before export.",
      });
    }
  }

  return {
    state: blockers.length === 0 ? "ready" : "blocked",
    roundRows: rounds.map((round) => ({
      roundId: round.roundId,
      roundVersion: round.roundVersion,
      roundLabel: round.roundLabel,
      vendorId: round.vendorId,
      vendorName: round.vendorName,
      submittedAt: round.submittedAt,
      evidenceReference: round.evidenceReference,
      reviewedBy: round.reviewedBy,
      reviewedAt: round.reviewedAt,
      reviewState: round.reviewState,
    })),
    concessionRows: concessions.map((concession) => ({
      concessionId: concession.concessionId,
      concessionVersion: concession.concessionVersion,
      roundId: concession.roundId,
      roundVersion: concession.roundVersion,
      vendorId: concession.vendorId,
      vendorName: concession.vendorName,
      concessionType: concession.concessionType,
      summary: concession.summary,
      condition: concession.condition,
      expiryDate: concession.expiryDate,
      acceptedFlag: concession.acceptedFlag,
      evidenceReference: concession.evidenceReference,
      reviewedBy: concession.reviewedBy,
      reviewedAt: concession.reviewedAt,
      reviewState: concession.reviewState,
    })),
    blockers,
    guardrail:
      "Read-only BAFO round and concession view. Reviewed records may support negotiation facts; this view does not create rounds, accept concessions, communicate with suppliers, or claim savings.",
  };
}

function roundKey(roundId: string, roundVersion: string): string {
  return `${roundId.trim()}::${roundVersion.trim()}`;
}
