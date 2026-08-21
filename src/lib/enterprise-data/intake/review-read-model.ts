import type { EnrichmentProposal } from "./enrichment-proposals";

/**
 * What a reviewer actually sees.
 *
 * A run can produce thousands of proposals, and a list of thousands is not reviewable -- it is a
 * surface that gets approved wholesale, which is the same as no review at all. The read model's
 * whole job is to turn that list into a small number of decisions a person can genuinely make, and
 * to make the ones that need individual attention impossible to sweep up in a bulk action.
 *
 * Three rules shape it:
 *
 *   GROUP WHAT IS THE SAME DECISION.  Fifty rows proposing the same classification off the same
 *   kind of evidence is one judgement. Splitting it into fifty prompts does not produce fifty
 *   considered decisions; it produces one decision and forty-nine clicks.
 *
 *   ISOLATE WHAT IS NOT.  A proposal that stands alone, or that disagrees with a recorded value,
 *   or that assigns the same source row two different answers, has no group to be judged as part
 *   of. It is shown on its own and cannot be bulk-decided.
 *
 *   ORDER BY WHAT WOULD HURT.  The reviewer's attention is the scarce resource, so what is spent
 *   first should be what is most consequential if wrong -- not what happens to sort first.
 */

export type ReviewGroupKind = "bulk_decidable" | "individual_only";

export type IndividualReason =
  | "sole_instance"
  | "conflicts_with_recorded"
  | "row_has_competing_proposals"
  | "evidence_is_thin";

export interface ReviewGroup {
  groupId: string;
  kind: ReviewGroupKind;
  templateFile: string;
  targetAttribute: string;
  proposedValue: string;
  proposalIds: string[];
  rowCount: number;
  /** A handful of real rows, so the reviewer judges the claim against actual evidence. */
  samples: Array<{ sourceRowId: string; evidence: Record<string, string> }>;
  /** Present only on individual_only groups. */
  individualReason?: IndividualReason;
  /** Stated in the reviewer's terms: what they are being asked to accept. */
  question: string;
  /** Why this group is placed where it is in the queue. */
  priorityReason: string;
}

export interface ReviewQueue {
  tenantKey: string;
  enrichmentRunId: string;
  groups: ReviewGroup[];
  /** Cells the model declined. Not a decision to make -- a list of what to ask the client. */
  declined: Array<{ sourceRowId: string; targetAttribute: string }>;
  summary: {
    proposalCount: number;
    groupCount: number;
    individualCount: number;
    declinedCount: number;
    /** Decisions a reviewer must make, which is the number that matters, not proposalCount. */
    decisionCount: number;
  };
}

const MAX_SAMPLES = 5;

/**
 * How consequential a wrong answer would be, for ordering.
 *
 * Structural attributes rank above descriptive ones because a wrong architecture role or movement
 * mechanism reshapes a diagram and everything read off it, while a wrong descriptive label is
 * visible in place and corrected in place.
 */
const ATTRIBUTE_WEIGHT: Record<string, number> = {
  architectureRole: 100,
  movementMechanism: 90,
  platformRole: 80,
  hostingPlatform: 60,
};

function weightOf(attribute: string): number {
  return ATTRIBUTE_WEIGHT[attribute] ?? 40;
}

export function buildReviewQueue(input: {
  tenantKey: string;
  enrichmentRunId: string;
  proposals: EnrichmentProposal[];
  /** Recorded rows, so a proposal can be shown against the evidence it cited. */
  recordedRows: Map<string, Record<string, string>>;
  /** Rows the model returned as unknown, per attribute. */
  declined?: Array<{ sourceRowId: string; targetAttribute: string }>;
}): ReviewQueue {
  const pending = input.proposals.filter((p) => p.status === "proposed");

  // A row whose proposals disagree about the same attribute cannot be grouped: the disagreement
  // is the thing the reviewer needs to see.
  const attributesPerRow = new Map<string, Set<string>>();
  for (const p of pending) {
    const key = `${p.sourceRowId}::${p.targetAttribute}`;
    const set = attributesPerRow.get(key) ?? new Set<string>();
    set.add(p.proposedValue);
    attributesPerRow.set(key, set);
  }

  const byValue = new Map<string, EnrichmentProposal[]>();
  for (const p of pending) {
    const key = `${p.templateFile}::${p.targetAttribute}::${p.proposedValue}`;
    const list = byValue.get(key) ?? [];
    list.push(p);
    byValue.set(key, list);
  }

  const groups: ReviewGroup[] = [];

  for (const [key, members] of byValue) {
    const first = members[0];
    const contested = members.filter(
      (m) => (attributesPerRow.get(`${m.sourceRowId}::${m.targetAttribute}`)?.size ?? 1) > 1,
    );

    const sampleFrom = (members: EnrichmentProposal[]) =>
      members.slice(0, MAX_SAMPLES).map((m) => ({
        sourceRowId: m.sourceRowId,
        evidence: Object.fromEntries(
          m.evidenceFields.map((f) => [f, input.recordedRows.get(m.sourceRowId)?.[f] ?? ""]),
        ),
      }));

    // A proposal whose cited evidence is entirely blank was produced from nothing. It may still be
    // right, but it cannot be reviewed as part of a group, because the group's evidence is what a
    // bulk decision is being made against.
    const thinEvidence = members.filter((m) =>
      m.evidenceFields.every((f) => !(input.recordedRows.get(m.sourceRowId)?.[f] ?? "").trim()),
    );

    const individuals: Array<{ member: EnrichmentProposal; reason: IndividualReason }> = [];
    for (const m of contested) individuals.push({ member: m, reason: "row_has_competing_proposals" });
    for (const m of thinEvidence) {
      if (!individuals.some((i) => i.member.proposalId === m.proposalId)) {
        individuals.push({ member: m, reason: "evidence_is_thin" });
      }
    }

    const groupable = members.filter((m) => !individuals.some((i) => i.member.proposalId === m.proposalId));

    for (const { member, reason } of individuals) {
      groups.push({
        groupId: `${key}::${member.sourceRowId}`,
        kind: "individual_only",
        templateFile: member.templateFile,
        targetAttribute: member.targetAttribute,
        proposedValue: member.proposedValue,
        proposalIds: [member.proposalId],
        rowCount: 1,
        samples: [
          {
            sourceRowId: member.sourceRowId,
            evidence: Object.fromEntries(
              member.evidenceFields.map((f) => [f, input.recordedRows.get(member.sourceRowId)?.[f] ?? ""]),
            ),
          },
        ],
        individualReason: reason,
        question: questionFor(member, 1),
        priorityReason: individualPriorityReason(reason),
      });
    }

    if (!groupable.length) continue;

    // Samples are drawn from the rows the group actually covers. Sampling the full member list
    // would show a reviewer evidence from a row that was pulled OUT of this group -- which is
    // precisely the misleading kind of correct-facts-wrong-statement this layer exists to stop.
    const samples = sampleFrom(groupable);

    if (groupable.length === 1) {
      const only = groupable[0];
      groups.push({
        groupId: `${key}::${only.sourceRowId}`,
        kind: "individual_only",
        templateFile: only.templateFile,
        targetAttribute: only.targetAttribute,
        proposedValue: only.proposedValue,
        proposalIds: [only.proposalId],
        rowCount: 1,
        samples,
        individualReason: "sole_instance",
        question: questionFor(only, 1),
        priorityReason: individualPriorityReason("sole_instance"),
      });
      continue;
    }

    groups.push({
      groupId: key,
      kind: "bulk_decidable",
      templateFile: first.templateFile,
      targetAttribute: first.targetAttribute,
      proposedValue: first.proposedValue,
      proposalIds: groupable.map((m) => m.proposalId),
      rowCount: groupable.length,
      samples,
      question: questionFor(first, groupable.length),
      priorityReason: `${groupable.length} rows turn on this one judgement.`,
    });
  }

  // Most consequential first, then widest blast radius, then stable by id so the queue does not
  // reshuffle between loads and lose the reviewer's place.
  groups.sort((a, b) => {
    const weight = weightOf(b.targetAttribute) - weightOf(a.targetAttribute);
    if (weight !== 0) return weight;
    const individual = Number(b.kind === "individual_only") - Number(a.kind === "individual_only");
    if (individual !== 0) return individual;
    if (b.rowCount !== a.rowCount) return b.rowCount - a.rowCount;
    return a.groupId.localeCompare(b.groupId);
  });

  const declined = input.declined ?? [];

  return {
    tenantKey: input.tenantKey,
    enrichmentRunId: input.enrichmentRunId,
    groups,
    declined,
    summary: {
      proposalCount: pending.length,
      groupCount: groups.length,
      individualCount: groups.filter((g) => g.kind === "individual_only").length,
      declinedCount: declined.length,
      decisionCount: groups.length,
    },
  };
}

function questionFor(proposal: EnrichmentProposal, rowCount: number): string {
  const subject = rowCount === 1 ? "this row" : `these ${rowCount} rows`;
  return `Is "${proposal.proposedValue}" the right ${readableAttribute(proposal.targetAttribute)} for ${subject}?`;
}

function readableAttribute(attribute: string): string {
  return attribute
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();
}

function individualPriorityReason(reason: IndividualReason): string {
  switch (reason) {
    case "sole_instance":
      return "The only row proposing this. There is no group to judge it as part of.";
    case "conflicts_with_recorded":
      return "This disagrees with what the client stated for the same field.";
    case "row_has_competing_proposals":
      return "This row was given more than one answer for the same attribute.";
    case "evidence_is_thin":
      return "Every field this cited is blank, so it was produced from nothing.";
  }
}
