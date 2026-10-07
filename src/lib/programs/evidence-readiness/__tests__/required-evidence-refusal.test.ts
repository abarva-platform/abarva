import {
  MAX_NAMED_EVIDENCE_SLOTS,
  describeRequiredEvidenceRefusal,
  readRequiredEvidenceGaps,
} from "../required-evidence-refusal";

/**
 * The route-shaped bodies under test. Both are copied from what the two live
 * refusals actually send, so a change to either payload shape fails here.
 */
const GATE_DETAIL =
  "Required evidence must be approved, linked to a sourced workbook answer, or formally resolved before this phase can close.";
const BUILD_DETAIL =
  "1 required evidence item is not yet approved in Files & Evidence. No phase build was queued.";

describe("readRequiredEvidenceGaps", () => {
  it("returns nothing when the body carries no list", () => {
    expect(readRequiredEvidenceGaps(undefined)).toEqual([]);
    expect(readRequiredEvidenceGaps(null)).toEqual([]);
    expect(readRequiredEvidenceGaps("P1 to P2 readiness workbook")).toEqual([]);
    expect(readRequiredEvidenceGaps({ evidenceSlot: "a" })).toEqual([]);
    expect(readRequiredEvidenceGaps([])).toEqual([]);
  });

  it("keeps payload order and carries the slot with its next action", () => {
    expect(
      readRequiredEvidenceGaps([
        {
          evidenceSlot: "P1 to P2 readiness workbook",
          status: "open",
          nextAction: "Complete the readiness review.",
        },
        { evidenceSlot: "Data governance ownership", nextAction: "Upload it." },
      ]),
    ).toEqual([
      {
        slot: "P1 to P2 readiness workbook",
        nextAction: "Complete the readiness review.",
      },
      { slot: "Data governance ownership", nextAction: "Upload it." },
    ]);
  });

  it("drops an entry with no readable slot label rather than rendering a blank row", () => {
    expect(
      readRequiredEvidenceGaps([
        { nextAction: "Upload it." },
        { evidenceSlot: "   ", nextAction: "Upload it." },
        { evidenceSlot: 7, nextAction: "Upload it." },
        null,
        ["P1 to P2 readiness workbook"],
        { evidenceSlot: "Data quality rules" },
      ]),
    ).toEqual([{ slot: "Data quality rules", nextAction: null }]);
  });

  it("reads a blank or non-string next action as absent, not as empty text", () => {
    expect(
      readRequiredEvidenceGaps([
        { evidenceSlot: "Data quality rules", nextAction: "  " },
        { evidenceSlot: "Source system access", nextAction: 3 },
      ]),
    ).toEqual([
      { slot: "Data quality rules", nextAction: null },
      { slot: "Source system access", nextAction: null },
    ]);
  });
});

describe("describeRequiredEvidenceRefusal", () => {
  it("returns null when nothing is named, so the caller keeps its own ladder", () => {
    expect(describeRequiredEvidenceRefusal(null)).toBeNull();
    expect(describeRequiredEvidenceRefusal(undefined)).toBeNull();
    expect(describeRequiredEvidenceRefusal({ detail: GATE_DETAIL })).toBeNull();
    expect(
      describeRequiredEvidenceRefusal({
        detail: GATE_DETAIL,
        requiredEvidenceGaps: [],
      }),
    ).toBeNull();
    // Every entry unreadable is the same as no list: the count-only message
    // the caller already had is better than a blank bullet.
    expect(
      describeRequiredEvidenceRefusal({
        detail: GATE_DETAIL,
        requiredEvidenceGaps: [{ nextAction: "Upload it." }],
      }),
    ).toBeNull();
  });

  it("names the one slot holding a gate close, after the route's own wording", () => {
    expect(
      describeRequiredEvidenceRefusal({
        detail: GATE_DETAIL,
        requiredEvidenceGaps: [
          {
            evidenceSlot: "P1 to P2 readiness workbook",
            status: "open",
            nextAction:
              "Complete the P1 to P2 readiness review and accept each answer.",
          },
        ],
      }),
    ).toBe(
      `${GATE_DETAIL} Open: P1 to P2 readiness workbook (Complete the P1 to P2 readiness review and accept each answer.).`,
    );
  });

  it("names the one slot holding a phase build", () => {
    expect(
      describeRequiredEvidenceRefusal({
        detail: BUILD_DETAIL,
        requiredEvidenceGaps: [
          {
            evidenceSlot: "Data governance ownership",
            status: "open",
            nextAction: "Upload the ownership record and approve it.",
          },
        ],
      }),
    ).toBe(
      `${BUILD_DETAIL} Open: Data governance ownership (Upload the ownership record and approve it.).`,
    );
  });

  it("names a slot with no next action without an empty bracket", () => {
    expect(
      describeRequiredEvidenceRefusal({
        requiredEvidenceGaps: [{ evidenceSlot: "Data quality rules" }],
      }),
    ).toBe("Open: Data quality rules.");
  });

  it("separates several named slots", () => {
    expect(
      describeRequiredEvidenceRefusal({
        requiredEvidenceGaps: [
          { evidenceSlot: "Data quality rules" },
          { evidenceSlot: "Source system access", nextAction: "Upload it." },
        ],
      }),
    ).toBe("Open: Data quality rules; Source system access (Upload it.).");
  });

  it("names up to the cap and counts the remainder", () => {
    const gaps = Array.from(
      { length: MAX_NAMED_EVIDENCE_SLOTS + 7 },
      (_, i) => ({
        evidenceSlot: `Family ${i + 1}`,
      }),
    );
    const message = describeRequiredEvidenceRefusal({
      requiredEvidenceGaps: gaps,
    });
    expect(message).toBe(
      `Open: ${gaps
        .slice(0, MAX_NAMED_EVIDENCE_SLOTS)
        .map((gap) => gap.evidenceSlot)
        .join("; ")} and 7 more.`,
    );
    expect(message).not.toContain(`Family ${MAX_NAMED_EVIDENCE_SLOTS + 1}`);
  });

  it("names exactly the cap without a remainder clause", () => {
    const message = describeRequiredEvidenceRefusal({
      requiredEvidenceGaps: Array.from(
        { length: MAX_NAMED_EVIDENCE_SLOTS },
        (_, i) => ({ evidenceSlot: `Family ${i + 1}` }),
      ),
    });
    expect(message).toContain(`Family ${MAX_NAMED_EVIDENCE_SLOTS}`);
    expect(message).not.toContain("more");
  });

  it("omits the lead when the body carries no usable detail", () => {
    for (const detail of [undefined, null, "   ", 12]) {
      expect(
        describeRequiredEvidenceRefusal({
          detail,
          requiredEvidenceGaps: [{ evidenceSlot: "Data quality rules" }],
        }),
      ).toBe("Open: Data quality rules.");
    }
  });

  it("bounds a hostile payload instead of rendering it whole", () => {
    const message = describeRequiredEvidenceRefusal({
      detail: "d".repeat(5000),
      requiredEvidenceGaps: [
        { evidenceSlot: "s".repeat(500), nextAction: "n".repeat(900) },
      ],
    });
    expect(message).not.toBeNull();
    expect(message).toContain(`${"d".repeat(600)} Open:`);
    expect(message).toContain(`${"s".repeat(160)} (${"n".repeat(240)}).`);
    expect(message).not.toContain("d".repeat(601));
    expect(message).not.toContain("s".repeat(161));
    expect(message).not.toContain("n".repeat(241));
  });
});
