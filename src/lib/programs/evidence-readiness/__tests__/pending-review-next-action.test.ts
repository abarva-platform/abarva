/**
 * Coverage is graded on APPROVED evidence rows only, so an uncovered family
 * whose evidence is already sitting in the reviewer's queue used to present the
 * same authored *"Upload a …"* sentence as one where nothing was ever provided
 * — including through the live aVa prompt. These cases pin the rewrite AND the
 * harder half: that pending evidence never reads as covered, so nothing the
 * gate layer consumes moves.
 *
 * The same was true of the column's THIRD value. A rejected review leaves the
 * pending queue without ever becoming approved, and no control can re-decide
 * it, so rejecting an extraction silently restored that authored "Upload a …"
 * sentence for a family whose file is already in the cabinet. These cases pin
 * the rejected sentence under the same invariant.
 */
import {
  awaitingReviewNextActionSentence,
  familyReviewBacklogFromDecisionRows,
  pendingReviewCountForFamily,
  rejectedEvidenceNextActionSentence,
  rejectedReviewCountForFamily,
  resolvePendingAwareNextAction,
  type FamilyAwaitingReview,
  type FamilyWithRejectedEvidence,
} from "@/lib/programs/evidence-readiness/pending-review-next-action";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";

const AUTHORED = "Upload a governance charter, decision-rights matrix, or steward register.";

/** Fields the gate layer and the generation path read. None may move. */
const GATE_BEARING = [
  "status",
  "priority",
  "canDraftBoundary",
  "preliminaryGenerationCaveat",
  "waiverOption",
  "blockedArtifacts",
  "evidenceIds",
  "evidenceTitles",
  "phase",
  "artifactType",
  "familyId",
  "evidenceSlot",
] as const;

function readiness(args: {
  familiesAwaitingReview?: FamilyAwaitingReview[];
  familiesWithRejectedEvidence?: FamilyWithRejectedEvidence[];
  coveredFamilyIds?: string[];
}): DiscoveryEvidenceReadiness {
  const covered = new Set(args.coveredFamilyIds ?? []);
  const ids = ["data_governance_ownership", "semantic_layer_certification"];
  return {
    blueprintId: "governed_data_foundation",
    blueprintVersion: "1.0.0",
    archetypeLabel: "Governed data foundation",
    blueprintBasis: "declared",
    unknownDeclaredArchetype: null,
    requiredTotal: ids.length,
    requiredCovered: covered.size,
    requiredMissing: ids.length - covered.size,
    optionalCovered: 0,
    readinessScore: 0,
    readyForP3: false,
    families: ids.map((familyId) => ({
      familyId,
      label: familyId,
      required: true,
      status: covered.has(familyId) ? "covered" : "missing",
      evidenceIds: [],
      evidenceTitles: [],
    })),
    gapRegister: [],
    ...(args.familiesAwaitingReview
      ? { familiesAwaitingReview: args.familiesAwaitingReview }
      : {}),
    ...(args.familiesWithRejectedEvidence
      ? { familiesWithRejectedEvidence: args.familiesWithRejectedEvidence }
      : {}),
  };
}

function packetsFor(r: DiscoveryEvidenceReadiness) {
  return buildMoveEvidenceNeedPackets({
    moveId: "MOVE-1",
    moveName: "Governed data foundation",
    currentPhase: 2,
    readiness: r,
  });
}

describe("resolvePendingAwareNextAction", () => {
  it("leaves the authored sentence alone when no review is pending", () => {
    expect(
      resolvePendingAwareNextAction({
        familyId: "data_governance_ownership",
        familyStatus: "missing",
        authoredNextAction: AUTHORED,
        familiesAwaitingReview: [],
      }),
    ).toBe(AUTHORED);
  });

  it("leaves the authored sentence alone when the field was never supplied", () => {
    // A readiness object built before this field existed, or one that crossed
    // an API boundary without it, must not throw and must not be rewritten.
    expect(
      resolvePendingAwareNextAction({
        familyId: "data_governance_ownership",
        familyStatus: "missing",
        authoredNextAction: AUTHORED,
      }),
    ).toBe(AUTHORED);
  });

  it("points an uncovered family at the review queue instead of an upload", () => {
    const sentence = resolvePendingAwareNextAction({
      familyId: "data_governance_ownership",
      familyStatus: "missing",
      authoredNextAction: AUTHORED,
      familiesAwaitingReview: [
        { familyId: "data_governance_ownership", pendingCount: 4 },
      ],
    });
    expect(sentence).not.toBe(AUTHORED);
    expect(sentence).not.toMatch(/^Upload /);
    expect(sentence).toContain("4 items");
    expect(sentence).toContain("awaiting your review");
    // Name a surface the reader actually has, which is the whole point.
    expect(sentence).toContain("Files & Evidence");
    // It must still say the slot is NOT satisfied.
    expect(sentence).toContain("stays uncovered");
  });

  it("keeps the authored sentence for a COVERED family even with pending rows", () => {
    // Approved evidence exists, so nothing is blocked on the reviewer.
    expect(
      resolvePendingAwareNextAction({
        familyId: "data_governance_ownership",
        familyStatus: "covered",
        authoredNextAction: AUTHORED,
        familiesAwaitingReview: [
          { familyId: "data_governance_ownership", pendingCount: 9 },
        ],
      }),
    ).toBe(AUTHORED);
  });

  it("rewrites only the family the pending rows name", () => {
    expect(
      resolvePendingAwareNextAction({
        familyId: "semantic_layer_certification",
        familyStatus: "missing",
        authoredNextAction: AUTHORED,
        familiesAwaitingReview: [
          { familyId: "data_governance_ownership", pendingCount: 3 },
        ],
      }),
    ).toBe(AUTHORED);
  });

  it("agrees in number so a single item does not read as plural", () => {
    const one = awaitingReviewNextActionSentence(1);
    expect(one).toContain("1 item ");
    expect(one).toContain(" is loaded");
    expect(one).toContain("reject it there");
    const many = awaitingReviewNextActionSentence(3);
    expect(many).toContain("3 items");
    expect(many).toContain(" are loaded");
    expect(many).toContain("reject them there");
  });
});

describe("pendingReviewCountForFamily", () => {
  it("reads 0 for a missing or unusable list", () => {
    expect(pendingReviewCountForFamily("f", undefined)).toBe(0);
    expect(pendingReviewCountForFamily("f", null)).toBe(0);
    expect(pendingReviewCountForFamily("f", [])).toBe(0);
  });

  it("sums every entry naming the family", () => {
    expect(
      pendingReviewCountForFamily("f", [
        { familyId: "f", pendingCount: 2 },
        { familyId: "other", pendingCount: 5 },
        { familyId: "f", pendingCount: 3 },
      ]),
    ).toBe(5);
  });

  it("counts a row with an unusable count as one rather than dropping it", () => {
    // The row still proves something is pending; silently dropping it would
    // re-create the upload-request bug for that family.
    expect(
      pendingReviewCountForFamily("f", [
        { familyId: "f", pendingCount: Number.NaN },
        { familyId: "f", pendingCount: 0 },
      ]),
    ).toBe(2);
  });
});

describe("buildMoveEvidenceNeedPackets with pending reviews", () => {
  it("never lets pending evidence read as covered", () => {
    const packets = packetsFor(
      readiness({
        familiesAwaitingReview: [
          { familyId: "data_governance_ownership", pendingCount: 6 },
        ],
      }),
    );
    const packet = packets.find(
      (p) => p.familyId === "data_governance_ownership",
    );
    expect(packet).toBeDefined();
    expect(packet!.status).toBe("missing");
    expect(packet!.priority).toBe("required");
    expect(packet!.canDraftBoundary.canDraft).toBe(false);
    expect(packet!.nextAction).toContain("awaiting your review");
  });

  it("changes nothing but the sentence", () => {
    // The decisive invariant: the ONLY field that may differ between a Move
    // with nothing loaded and the same Move with its evidence in the review
    // queue is `nextAction`.
    const before = packetsFor(readiness({}));
    const after = packetsFor(
      readiness({
        familiesAwaitingReview: [
          { familyId: "data_governance_ownership", pendingCount: 2 },
          { familyId: "semantic_layer_certification", pendingCount: 1 },
        ],
      }),
    );
    expect(after).toHaveLength(before.length);
    const changed: string[] = [];
    before.forEach((b, i) => {
      const a = after[i];
      for (const key of GATE_BEARING) {
        if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
          changed.push(`${b.familyId}.${key}`);
        }
      }
    });
    expect(changed).toEqual([]);
    // ...and the sentence really did change, so the above is not vacuous.
    expect(after.map((p) => p.nextAction)).not.toEqual(
      before.map((p) => p.nextAction),
    );
  });

  it("is byte-identical to today when nothing is pending", () => {
    expect(packetsFor(readiness({ familiesAwaitingReview: [] }))).toEqual(
      packetsFor(readiness({})),
    );
  });
});

describe("resolvePendingAwareNextAction with a rejected family", () => {
  it("names the rejection instead of asking for the same upload again", () => {
    const sentence = resolvePendingAwareNextAction({
      familyId: "data_governance_ownership",
      familyStatus: "missing",
      authoredNextAction: AUTHORED,
      familiesWithRejectedEvidence: [
        { familyId: "data_governance_ownership", rejectedCount: 2 },
      ],
    });
    expect(sentence).not.toBe(AUTHORED);
    expect(sentence).not.toMatch(/^Upload /);
    expect(sentence).toContain("2 items");
    expect(sentence).toContain("rejected in review");
    expect(sentence).toContain("Files & Evidence");
    // The action it asks for is one the surface offers, and it is explicitly
    // NOT "upload the same file".
    expect(sentence).toContain("CORRECTED or DIFFERENT");
  });

  it("never prescribes re-deciding the rejection, because no control can", () => {
    // `decideEvidenceReview` updates with `decision = 'pending'` in its WHERE
    // clause, so a recorded rejection is terminal. A sentence telling the
    // reader to approve or re-review it would be the same defect class this
    // module exists to remove.
    const sentence = rejectedEvidenceNextActionSentence(1);
    expect(sentence).toContain("cannot be re-decided");
    expect(sentence).not.toMatch(/\bapprove\b/i);
    expect(sentence).not.toMatch(/re-?review/i);
  });

  it("lets a pending row outrank a rejected one for the same family", () => {
    // Something is still in the queue, so recording that decision is the
    // nearer action; the rejected siblings are not what to do next.
    const sentence = resolvePendingAwareNextAction({
      familyId: "data_governance_ownership",
      familyStatus: "missing",
      authoredNextAction: AUTHORED,
      familiesAwaitingReview: [
        { familyId: "data_governance_ownership", pendingCount: 1 },
      ],
      familiesWithRejectedEvidence: [
        { familyId: "data_governance_ownership", rejectedCount: 5 },
      ],
    });
    expect(sentence).toContain("awaiting your review");
    expect(sentence).not.toContain("rejected in review");
  });

  it("keeps the authored sentence for a COVERED family with rejected rows", () => {
    expect(
      resolvePendingAwareNextAction({
        familyId: "data_governance_ownership",
        familyStatus: "covered",
        authoredNextAction: AUTHORED,
        familiesWithRejectedEvidence: [
          { familyId: "data_governance_ownership", rejectedCount: 4 },
        ],
      }),
    ).toBe(AUTHORED);
  });

  it("rewrites only the family the rejected rows name", () => {
    expect(
      resolvePendingAwareNextAction({
        familyId: "semantic_layer_certification",
        familyStatus: "missing",
        authoredNextAction: AUTHORED,
        familiesWithRejectedEvidence: [
          { familyId: "data_governance_ownership", rejectedCount: 3 },
        ],
      }),
    ).toBe(AUTHORED);
  });

  it("agrees in number so a single rejection does not read as plural", () => {
    const one = rejectedEvidenceNextActionSentence(1);
    expect(one).toContain("1 item ");
    expect(one).toContain(" was rejected");
    const many = rejectedEvidenceNextActionSentence(3);
    expect(many).toContain("3 items");
    expect(many).toContain(" were rejected");
  });
});

describe("rejectedReviewCountForFamily", () => {
  it("reads 0 for a missing or unusable list", () => {
    expect(rejectedReviewCountForFamily("f", undefined)).toBe(0);
    expect(rejectedReviewCountForFamily("f", null)).toBe(0);
    expect(rejectedReviewCountForFamily("f", [])).toBe(0);
  });

  it("sums every entry naming the family and counts an unusable row as one", () => {
    expect(
      rejectedReviewCountForFamily("f", [
        { familyId: "f", rejectedCount: 2 },
        { familyId: "other", rejectedCount: 9 },
        { familyId: "f", rejectedCount: Number.NaN },
      ]),
    ).toBe(3);
  });
});

describe("familyReviewBacklogFromDecisionRows", () => {
  it("splits one grouped read into the two backlog lists", () => {
    const backlog = familyReviewBacklogFromDecisionRows([
      {
        family_key: "data_governance_ownership",
        decision: "pending",
        decision_count: 4,
      },
      {
        family_key: "data_governance_ownership",
        decision: "rejected",
        decision_count: "2",
      },
      {
        family_key: "semantic_layer_certification",
        decision: "rejected",
        decision_count: 1,
      },
    ]);
    expect(backlog.familiesAwaitingReview).toEqual([
      { familyId: "data_governance_ownership", pendingCount: 4 },
    ]);
    expect(backlog.familiesWithRejectedEvidence).toEqual([
      { familyId: "data_governance_ownership", rejectedCount: 2 },
      { familyId: "semantic_layer_certification", rejectedCount: 1 },
    ]);
  });

  it("ignores approved rows and any value outside the CHECK constraint", () => {
    // `approved` is what coverage already grades on; anything else belongs to
    // neither list and must not be folded into one of them.
    const backlog = familyReviewBacklogFromDecisionRows([
      { family_key: "f", decision: "approved", decision_count: 7 },
      { family_key: "f", decision: "withdrawn", decision_count: 7 },
      { family_key: "f", decision: null, decision_count: 7 },
    ]);
    expect(backlog.familiesAwaitingReview).toEqual([]);
    expect(backlog.familiesWithRejectedEvidence).toEqual([]);
  });

  it("drops a row with no family key and survives a failed read", () => {
    expect(
      familyReviewBacklogFromDecisionRows([
        { family_key: "   ", decision: "pending", decision_count: 3 },
        { family_key: null, decision: "rejected", decision_count: 3 },
      ]),
    ).toEqual({
      familiesAwaitingReview: [],
      familiesWithRejectedEvidence: [],
    });
    // The producer catches a query failure to `[]`, and an older caller may
    // pass nothing at all.
    expect(familyReviewBacklogFromDecisionRows(null)).toEqual({
      familiesAwaitingReview: [],
      familiesWithRejectedEvidence: [],
    });
  });

  it("counts a row with an unusable count as one rather than dropping it", () => {
    const backlog = familyReviewBacklogFromDecisionRows([
      { family_key: "f", decision: "pending", decision_count: null },
      { family_key: "f", decision: "rejected", decision_count: 0 },
    ]);
    expect(backlog.familiesAwaitingReview).toEqual([
      { familyId: "f", pendingCount: 1 },
    ]);
    expect(backlog.familiesWithRejectedEvidence).toEqual([
      { familyId: "f", rejectedCount: 1 },
    ]);
  });
});

describe("buildMoveEvidenceNeedPackets with rejected reviews", () => {
  it("never lets rejected evidence read as covered", () => {
    const packets = packetsFor(
      readiness({
        familiesWithRejectedEvidence: [
          { familyId: "data_governance_ownership", rejectedCount: 3 },
        ],
      }),
    );
    const packet = packets.find(
      (p) => p.familyId === "data_governance_ownership",
    );
    expect(packet).toBeDefined();
    expect(packet!.status).toBe("missing");
    expect(packet!.priority).toBe("required");
    expect(packet!.canDraftBoundary.canDraft).toBe(false);
    // The proof the module's answer reaches the field every consumer reads.
    expect(packet!.nextAction).toContain("rejected in review");
  });

  it("changes nothing but the sentence", () => {
    const before = packetsFor(readiness({}));
    const after = packetsFor(
      readiness({
        familiesWithRejectedEvidence: [
          { familyId: "data_governance_ownership", rejectedCount: 2 },
          { familyId: "semantic_layer_certification", rejectedCount: 1 },
        ],
      }),
    );
    expect(after).toHaveLength(before.length);
    const changed: string[] = [];
    before.forEach((b, i) => {
      const a = after[i];
      for (const key of GATE_BEARING) {
        if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
          changed.push(`${b.familyId}.${key}`);
        }
      }
    });
    expect(changed).toEqual([]);
    expect(after.map((p) => p.nextAction)).not.toEqual(
      before.map((p) => p.nextAction),
    );
  });

  it("is byte-identical to today when nothing is rejected", () => {
    expect(packetsFor(readiness({ familiesWithRejectedEvidence: [] }))).toEqual(
      packetsFor(readiness({})),
    );
  });
});
