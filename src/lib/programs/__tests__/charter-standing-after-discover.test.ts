import {
  CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY,
  createCharterAssumptionResolutionRecord,
  type CharterAssumptionResolutionOutcome,
} from "@/lib/programs/charter-assumption-resolution";
import {
  charterStandingAfterDiscover,
  charterStandingAfterDiscoverActive,
  charterStandingForSection,
} from "@/lib/programs/charter-standing-after-discover";
import { createP1CharterBasisRecord } from "@/lib/programs/p1-charter-evidence";
import type { P1CharterBasisInput } from "@/lib/programs/p1-charter-evidence";

function moduleRow(args: {
  sectionKey: string;
  value: string;
  basis?: P1CharterBasisInput;
  /** Record the basis against a DIFFERENT value, i.e. the answer was edited after. */
  basisRecordedAgainst?: string;
  resolution?: { outcome: CharterAssumptionResolutionOutcome; note: string };
  /** Resolve against a DIFFERENT value, i.e. the answer was edited after. */
  resolvedAgainst?: string;
}) {
  const state: Record<string, unknown> = { value: args.value };
  if (args.basis) {
    state.p1_charter_basis = createP1CharterBasisRecord({
      input: args.basis,
      sectionKey: args.sectionKey,
      value: args.basisRecordedAgainst ?? args.value,
      userId: "user_1",
      email: "capture@example.test",
      recordedAt: "2026-10-05T09:00:00.000Z",
    });
  }
  if (args.resolution) {
    state[CHARTER_ASSUMPTION_RESOLUTION_STATE_KEY] =
      createCharterAssumptionResolutionRecord({
        input: args.resolution,
        sectionKey: args.sectionKey,
        value: args.resolvedAgainst ?? args.value,
        userId: "user_2",
        email: "discover@example.test",
        resolvedAt: "2026-10-05T11:00:00.000Z",
      });
  }
  return {
    moduleKey: `phase_1_${args.sectionKey}`,
    status: "completed",
    state,
  };
}

const ownedAssumption: P1CharterBasisInput = {
  kind: "assumption",
  owner: "Head of Shared Services",
  p2ValidationPlan: "Confirm against the Q3 volume extract in Discover.",
};

describe("charterStandingAfterDiscoverActive", () => {
  it.each([3, 4, 5])("is active on P%i with both flags on", (phaseNumber) => {
    expect(
      charterStandingAfterDiscoverActive({
        flagEnabled: true,
        resolutionReadEnabled: true,
        phaseNumber,
      }),
    ).toBe(true);
  });

  // Each conjunct is pinned with the OTHER TWO satisfied, so removing any one
  // of the three from the predicate fails exactly one of these.
  it("is off when its own flag is off, with the phase and the resolution read satisfied", () => {
    expect(
      charterStandingAfterDiscoverActive({
        flagEnabled: false,
        resolutionReadEnabled: true,
        phaseNumber: 3,
      }),
    ).toBe(false);
  });

  it("is off without the resolution read, with its own flag on and the phase satisfied", () => {
    expect(
      charterStandingAfterDiscoverActive({
        flagEnabled: true,
        resolutionReadEnabled: false,
        phaseNumber: 3,
      }),
    ).toBe(false);
  });

  it.each([0, 1, 2])("is off on P%i, with both flags on", (phaseNumber) => {
    expect(
      charterStandingAfterDiscoverActive({
        flagEnabled: true,
        resolutionReadEnabled: true,
        phaseNumber,
      }),
    ).toBe(false);
  });

  it("leaves P2 to the carry-forward rather than reporting the same field twice", () => {
    expect(
      charterStandingAfterDiscoverActive({
        flagEnabled: true,
        resolutionReadEnabled: true,
        phaseNumber: 2,
      }),
    ).toBe(false);
  });
});

describe("charterStandingAfterDiscover", () => {
  it("returns null when inactive, so the host renders nothing at all", () => {
    expect(
      charterStandingAfterDiscover({
        active: false,
        modules: [
          moduleRow({
            sectionKey: "scope_boundary",
            value: "Claims intake only.",
            basis: ownedAssumption,
          }),
        ],
      }),
    ).toBeNull();
  });

  it("distinguishes an active all-clear from an inactive surface", () => {
    expect(
      charterStandingAfterDiscover({
        active: true,
        modules: [
          moduleRow({
            sectionKey: "scope_boundary",
            value: "Claims intake only.",
            basis: { kind: "workspace_assertion" },
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("reports an assumption Discover never resolved as unvalidated, with the plan named as a plan", () => {
    const rows = charterStandingAfterDiscover({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "scope_boundary",
          value: "Claims intake only.",
          basis: ownedAssumption,
        }),
      ],
    });
    expect(rows).toEqual([
      {
        sectionKey: "scope_boundary",
        label: "Scope boundary",
        answer: "Claims intake only.",
        owner: "Head of Shared Services",
        recordedAt: "2026-10-05T09:00:00.000Z",
        standing: "unvalidated",
        plannedValidation: "Confirm against the Q3 volume extract in Discover.",
      },
    ]);
  });

  it("reports a corrected answer that still carries the wording Discover judged wrong", () => {
    const rows = charterStandingAfterDiscover({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "success_criteria",
          value: "Cycle time falls to two days.",
          basis: ownedAssumption,
          resolution: {
            outcome: "corrected",
            note: "The floor the current routing allows is four days.",
          },
        }),
      ],
    });
    expect(rows).toEqual([
      {
        sectionKey: "success_criteria",
        label: "Success criteria",
        answer: "Cycle time falls to two days.",
        owner: "Head of Shared Services",
        recordedAt: "2026-10-05T09:00:00.000Z",
        standing: "known_wrong",
        correction: "The floor the current routing allows is four days.",
        resolvedAt: "2026-10-05T11:00:00.000Z",
      },
    ]);
  });

  it.each<CharterAssumptionResolutionOutcome>(["confirmed", "superseded"])(
    "reports nothing for an assumption Discover resolved as %s",
    (outcome) => {
      expect(
        charterStandingAfterDiscover({
          active: true,
          modules: [
            moduleRow({
              sectionKey: "scope_boundary",
              value: "Claims intake only.",
              basis: ownedAssumption,
              resolution: { outcome, note: "Checked in Discover." },
            }),
          ],
        }),
      ).toEqual([]);
    },
  );

  it("reports nothing for a field answered from approved evidence", () => {
    expect(
      charterStandingAfterDiscover({
        active: true,
        modules: [
          moduleRow({
            sectionKey: "scope_boundary",
            value: "Claims intake only.",
            basis: { kind: "approved_evidence", evidenceId: "ev_1" },
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("reports nothing for a field with no declared basis at all", () => {
    expect(
      charterStandingAfterDiscover({
        active: true,
        modules: [
          moduleRow({
            sectionKey: "scope_boundary",
            value: "Claims intake only.",
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("drops a field whose answer was edited after the basis was declared", () => {
    expect(
      charterStandingAfterDiscover({
        active: true,
        modules: [
          moduleRow({
            sectionKey: "scope_boundary",
            value: "Claims intake and adjudication.",
            basis: ownedAssumption,
            basisRecordedAgainst: "Claims intake only.",
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("falls back to unvalidated when a correction was written about older wording", () => {
    // The answer was edited after Discover corrected it, so the correction no
    // longer describes it. The basis was re-declared against the new wording,
    // so the field is an open assumption again -- never `known_wrong` off a
    // correction that cannot be read.
    const rows = charterStandingAfterDiscover({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "success_criteria",
          value: "Cycle time falls to three days.",
          basis: ownedAssumption,
          resolution: {
            outcome: "corrected",
            note: "The floor the current routing allows is four days.",
          },
          resolvedAgainst: "Cycle time falls to two days.",
        }),
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.standing).toBe("unvalidated");
  });

  it("keeps canonical charter order rather than module order", () => {
    const rows = charterStandingAfterDiscover({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "evidence_plan",
          value: "Two extracts and one interview.",
          basis: ownedAssumption,
        }),
        moduleRow({
          sectionKey: "sponsor_commitment",
          value: "Weekly written update.",
          basis: ownedAssumption,
        }),
      ],
    });
    expect(rows?.map((row) => row.sectionKey)).toEqual([
      "sponsor_commitment",
      "evidence_plan",
    ]);
  });

  it("reports both standings together, each carrying only its own fields", () => {
    const rows = charterStandingAfterDiscover({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "scope_boundary",
          value: "Claims intake only.",
          basis: ownedAssumption,
        }),
        moduleRow({
          sectionKey: "success_criteria",
          value: "Cycle time falls to two days.",
          basis: ownedAssumption,
          resolution: {
            outcome: "corrected",
            note: "The floor the current routing allows is four days.",
          },
        }),
      ],
    });
    expect(rows?.map((row) => [row.sectionKey, row.standing])).toEqual([
      ["scope_boundary", "unvalidated"],
      ["success_criteria", "known_wrong"],
    ]);
    const unvalidated = rows?.[0];
    const knownWrong = rows?.[1];
    expect(unvalidated).not.toHaveProperty("correction");
    expect(knownWrong).not.toHaveProperty("plannedValidation");
  });

  it("ignores a charter module that is absent from the loaded rows", () => {
    expect(charterStandingAfterDiscover({ active: true, modules: [] })).toEqual(
      [],
    );
  });
});

describe("charterStandingForSection", () => {
  const rows = charterStandingAfterDiscover({
    active: true,
    modules: [
      moduleRow({
        sectionKey: "success_criteria",
        value: "Cycle time falls to two days.",
        basis: ownedAssumption,
      }),
    ],
  });

  it("finds the standing against the field a later phase is about to quote", () => {
    expect(charterStandingForSection(rows, "success_criteria")?.standing).toBe(
      "unvalidated",
    );
  });

  it("returns null for a field that carries no standing", () => {
    expect(charterStandingForSection(rows, "scope_boundary")).toBeNull();
  });

  it("returns null when the surface is inactive, never a stale hit", () => {
    expect(charterStandingForSection(null, "success_criteria")).toBeNull();
  });
});
