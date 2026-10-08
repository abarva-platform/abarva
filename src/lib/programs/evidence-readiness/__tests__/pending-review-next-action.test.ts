/**
 * Coverage is graded on APPROVED evidence rows only, so an uncovered family
 * whose evidence is already sitting in the reviewer's queue used to present the
 * same authored *"Upload a …"* sentence as one where nothing was ever provided
 * — including through the live aVa prompt. These cases pin the rewrite AND the
 * harder half: that pending evidence never reads as covered, so nothing the
 * gate layer consumes moves.
 */
import {
  awaitingReviewNextActionSentence,
  pendingReviewCountForFamily,
  resolvePendingAwareNextAction,
  type FamilyAwaitingReview,
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
