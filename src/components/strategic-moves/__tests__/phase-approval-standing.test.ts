import {
  phaseApprovalCompletionHeadline,
  phaseApprovalDecisionText,
  phaseApprovalDecisionTitle,
  phaseApprovalGateNote,
  phaseApprovalHeaderBasis,
  phaseApprovalHeaderLabel,
  resolvePhaseApprovalStanding,
  type PhaseApprovalStanding,
} from "@/lib/programs/phase-approval-standing";

const ALL_STANDINGS: PhaseApprovalStanding[] = [
  "handed-off",
  "advanced-past",
  "recorded",
  "open",
];

describe("resolvePhaseApprovalStanding", () => {
  it("reads a phase the Move has advanced past as a passed gate, never as an approval", () => {
    expect(
      resolvePhaseApprovalStanding({
        terminalComplete: false,
        phaseNumber: 1,
        currentPhase: 3,
        approvalRecordedThisSession: false,
      }),
    ).toBe("advanced-past");
  });

  it("reads an approval this session performed as recorded", () => {
    expect(
      resolvePhaseApprovalStanding({
        terminalComplete: false,
        phaseNumber: 3,
        currentPhase: 3,
        approvalRecordedThisSession: true,
      }),
    ).toBe("recorded");
  });

  it("lets a recorded approval outrank both inferences", () => {
    // The regression guard for the collapsed boolean: a session approval on a
    // phase the Move has ALSO advanced past must still read as recorded.
    expect(
      resolvePhaseApprovalStanding({
        terminalComplete: true,
        phaseNumber: 0,
        currentPhase: 5,
        approvalRecordedThisSession: true,
      }),
    ).toBe("recorded");
  });

  it("reads a handed-off Move as handed off, not as advanced past", () => {
    expect(
      resolvePhaseApprovalStanding({
        terminalComplete: true,
        phaseNumber: 5,
        currentPhase: 5,
        approvalRecordedThisSession: false,
      }),
    ).toBe("handed-off");
  });

  it("reads the phase the Move is seated at, and any later one, as open", () => {
    for (const phaseNumber of [3, 4, 5]) {
      expect(
        resolvePhaseApprovalStanding({
          terminalComplete: false,
          phaseNumber,
          currentPhase: 3,
          approvalRecordedThisSession: false,
        }),
      ).toBe("open");
    }
  });

  it("agrees with the host's own permissive condition in every case", () => {
    // `isHistoricalPhase || gateApproved` still unlocks the gate controls, and
    // the header renders exactly when a label exists. If those two ever part
    // company the header would appear on an open phase, or vanish from an
    // approved one. Pin them over the whole input space.
    for (const terminalComplete of [false, true]) {
      for (const approvalRecordedThisSession of [false, true]) {
        for (let currentPhase = 0; currentPhase <= 5; currentPhase += 1) {
          for (let phaseNumber = 0; phaseNumber <= 5; phaseNumber += 1) {
            const isHistoricalPhase =
              terminalComplete || phaseNumber < currentPhase;
            const permissive = isHistoricalPhase || approvalRecordedThisSession;
            const standing = resolvePhaseApprovalStanding({
              terminalComplete,
              phaseNumber,
              currentPhase,
              approvalRecordedThisSession,
            });
            expect(phaseApprovalHeaderLabel(standing) !== null).toBe(
              permissive,
            );
          }
        }
      }
    }
  });
});

describe("phaseApprovalHeaderLabel", () => {
  it("says Approved only for a recorded decision", () => {
    expect(phaseApprovalHeaderLabel("recorded")).toBe("Approved");
  });

  it("says Gate passed for both inferences", () => {
    expect(phaseApprovalHeaderLabel("advanced-past")).toBe("Gate passed");
    expect(phaseApprovalHeaderLabel("handed-off")).toBe("Gate passed");
  });

  it("never renders the word approved for an inferred standing", () => {
    // The defect: advancing past a phase rendered "Approved". Assert the whole
    // label, so a label that merely CONTAINS the old word cannot pass.
    for (const standing of ["advanced-past", "handed-off"] as const) {
      expect(phaseApprovalHeaderLabel(standing)).not.toMatch(/approv/i);
    }
  });

  it("says nothing for an open phase, whose header states readiness instead", () => {
    expect(phaseApprovalHeaderLabel("open")).toBeNull();
  });
});

describe("phaseApprovalHeaderBasis", () => {
  it("names the inference and disclaims the record for each inferred standing", () => {
    for (const standing of ["advanced-past", "handed-off"] as const) {
      const basis = phaseApprovalHeaderBasis(standing);
      expect(basis).not.toBeNull();
      expect(basis).toContain("No approval record was read on this screen.");
    }
    expect(phaseApprovalHeaderBasis("advanced-past")).toContain(
      "advanced past this phase",
    );
    expect(phaseApprovalHeaderBasis("handed-off")).toContain("handed off");
  });

  it("offers no basis where the reader performed the decision, or there is none", () => {
    expect(phaseApprovalHeaderBasis("recorded")).toBeNull();
    expect(phaseApprovalHeaderBasis("open")).toBeNull();
  });
});

describe("phaseApprovalDecisionTitle", () => {
  it("stops telling a reader a merely-advanced-past phase is already approved", () => {
    const title = phaseApprovalDecisionTitle("advanced-past", "P1");
    expect(title).toBe("P1's gate has passed");
    expect(title).not.toMatch(/approv/i);
  });

  it("keeps the recorded and handed-off headings", () => {
    expect(phaseApprovalDecisionTitle("recorded", "P2")).toBe("P2 approved");
    expect(phaseApprovalDecisionTitle("handed-off", "P5")).toBe(
      "Move handed off to Tower",
    );
  });

  it("leaves an open phase to the caller's blocked/ready wording", () => {
    expect(phaseApprovalDecisionTitle("open", "P3")).toBeNull();
  });
});

describe("phaseApprovalDecisionText", () => {
  it("stops calling the carried output the approved output", () => {
    const text = phaseApprovalDecisionText("advanced-past", "P2 Discover");
    expect(text).toBe(
      "This phase's output is carrying forward into P2 Discover. Its gate passed when the Move advanced; no approval record is read on this screen.",
    );
  });

  it("keeps the recorded and handed-off bodies", () => {
    expect(phaseApprovalDecisionText("recorded", "P2 Discover")).toContain(
      "The governed build and gate record are on file.",
    );
    expect(phaseApprovalDecisionText("handed-off", "P2 Discover")).toContain(
      "Tower is now the execution and value-tracking surface",
    );
  });

  it("leaves an open phase to the caller", () => {
    expect(phaseApprovalDecisionText("open", "P2 Discover")).toBeNull();
  });
});

describe("the two renderings cannot disagree", () => {
  it("gives every standing a label exactly when it gives it a decision title", () => {
    for (const standing of ALL_STANDINGS) {
      expect(phaseApprovalHeaderLabel(standing) === null).toBe(
        phaseApprovalDecisionTitle(standing, "P1") === null,
      );
      expect(phaseApprovalDecisionTitle(standing, "P1") === null).toBe(
        phaseApprovalDecisionText(standing, "P2 Discover") === null,
      );
    }
  });

  it("never claims an approval in any string of an inferred standing", () => {
    for (const standing of ["advanced-past", "handed-off"] as const) {
      expect(phaseApprovalHeaderLabel(standing)).not.toMatch(/approv/i);
      expect(phaseApprovalDecisionTitle(standing, "P1")).not.toMatch(/approv/i);
      // The body may say "no approval record is read" — a denial, not a claim.
      // Assert no POSITIVE claim by excluding the denial sentence first.
      const body = phaseApprovalDecisionText(standing, "P2 Discover") ?? "";
      expect(
        body.replace(/no approval record is read on this screen\.?/i, ""),
      ).not.toMatch(/approv/i);
    }
  });
});

describe("phaseApprovalGateNote", () => {
  it("keeps read-only and drops the twice-claimed approval", () => {
    const note = phaseApprovalGateNote("advanced-past", "P2 Discover");
    expect(note).toContain("read-only");
    expect(note).toContain("gate has passed");
    expect(note).toContain("carrying forward into P2 Discover");
    expect(note).toContain("No approval record is read on this screen.");
    // The old copy said "approved" AND "the approved output" in one sentence.
    expect(note?.replace(/no approval record is read[^.]*\./i, "")).not.toMatch(
      /approv/i,
    );
  });

  it("words the handed-off Move without claiming an approval either", () => {
    const note = phaseApprovalGateNote("handed-off", "P2 Discover");
    expect(note).toContain("handed off to Tower");
    expect(note).not.toMatch(/approv/i);
  });

  it("may say approved for a decision this session recorded", () => {
    expect(phaseApprovalGateNote("recorded", "P2 Discover")).toContain(
      "approved in this session",
    );
  });

  it("says nothing on an open phase, which words its own readiness", () => {
    expect(phaseApprovalGateNote("open", "P2 Discover")).toBeNull();
  });
});

describe("phaseApprovalCompletionHeadline", () => {
  it("stops the closed-phase banner claiming the phase was approved", () => {
    expect(phaseApprovalCompletionHeadline("advanced-past", "P1")).toBe(
      "P1's gate has passed.",
    );
    expect(phaseApprovalCompletionHeadline("handed-off", "P5")).toBe(
      "P5's gate has passed and the Move handed off to Tower.",
    );
    for (const standing of ["advanced-past", "handed-off"] as const) {
      expect(phaseApprovalCompletionHeadline(standing, "P1")).not.toMatch(
        /approv/i,
      );
    }
  });

  it("keeps the hand-off fact the old copy carried", () => {
    // The old string appended " and handed off to Tower" on terminalComplete.
    // Losing that in the rewording would drop a true fact from the banner.
    expect(phaseApprovalCompletionHeadline("handed-off", "P5")).toContain(
      "handed off to Tower",
    );
    expect(
      phaseApprovalCompletionHeadline("advanced-past", "P1"),
    ).not.toContain("handed off");
  });

  it("may say approved for a decision this session recorded", () => {
    expect(phaseApprovalCompletionHeadline("recorded", "P2")).toBe(
      "P2 approved.",
    );
  });

  it("says nothing on an open phase", () => {
    expect(phaseApprovalCompletionHeadline("open", "P2")).toBeNull();
  });
});

describe("every standing-worded string agrees on when it speaks", () => {
  it("gives all five strings a value for the same standings", () => {
    for (const standing of ALL_STANDINGS) {
      const speaks = standing !== "open";
      expect(phaseApprovalHeaderLabel(standing) !== null).toBe(speaks);
      expect(phaseApprovalDecisionTitle(standing, "P1") !== null).toBe(speaks);
      expect(phaseApprovalDecisionText(standing, "P2") !== null).toBe(speaks);
      expect(phaseApprovalGateNote(standing, "P2") !== null).toBe(speaks);
      expect(phaseApprovalCompletionHeadline(standing, "P1") !== null).toBe(
        speaks,
      );
    }
  });
});
