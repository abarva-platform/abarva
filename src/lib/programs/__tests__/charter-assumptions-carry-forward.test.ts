import {
  carriedCharterAssumptions,
  charterAssumptionCarryForwardActive,
} from "@/lib/programs/charter-assumptions-carry-forward";
import { createP1CharterBasisRecord } from "@/lib/programs/p1-charter-evidence";
import type { P1CharterBasisInput } from "@/lib/programs/p1-charter-evidence";

function moduleRow(args: {
  sectionKey: string;
  value: string;
  basis?: P1CharterBasisInput;
  /** Record the basis against a DIFFERENT value, i.e. the answer was edited after. */
  basisRecordedAgainst?: string;
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

describe("charterAssumptionCarryForwardActive", () => {
  it("is active on P2 with the flag on", () => {
    expect(
      charterAssumptionCarryForwardActive({
        flagEnabled: true,
        phaseNumber: 2,
      }),
    ).toBe(true);
  });

  it("is off when the flag is off, with the phase otherwise satisfied", () => {
    expect(
      charterAssumptionCarryForwardActive({
        flagEnabled: false,
        phaseNumber: 2,
      }),
    ).toBe(false);
  });

  it.each([0, 1, 3, 4, 5])(
    "is off on P%i, with the flag otherwise satisfied",
    (phaseNumber) => {
      expect(
        charterAssumptionCarryForwardActive({ flagEnabled: true, phaseNumber }),
      ).toBe(false);
    },
  );
});

describe("carriedCharterAssumptions", () => {
  it("returns null when the surface is inactive, even with assumptions on record", () => {
    expect(
      carriedCharterAssumptions({
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

  it("returns [] — not null — when active with no assumption on record", () => {
    const carried = carriedCharterAssumptions({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "scope_boundary",
          value: "Claims intake only.",
          basis: { kind: "workspace_assertion" },
        }),
      ],
    });
    expect(carried).toEqual([]);
    expect(carried).not.toBeNull();
  });

  it("carries an owned assumption with its owner, plan, answer and label", () => {
    const carried = carriedCharterAssumptions({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "scope_boundary",
          value: "Claims intake only.",
          basis: ownedAssumption,
        }),
      ],
    });
    expect(carried).toEqual([
      {
        sectionKey: "scope_boundary",
        label: "Scope boundary",
        answer: "Claims intake only.",
        owner: "Head of Shared Services",
        validationPlan: "Confirm against the Q3 volume extract in Discover.",
        recordedAt: "2026-10-05T09:00:00.000Z",
      },
    ]);
  });

  it.each([
    [
      "an approved-evidence basis",
      { kind: "approved_evidence", evidenceId: "ev_1" },
    ],
    ["a workspace assertion", { kind: "workspace_assertion" }],
  ] as const)("does not carry %s", (_label, basis) => {
    expect(
      carriedCharterAssumptions({
        active: true,
        modules: [
          moduleRow({
            sectionKey: "scope_boundary",
            value: "Claims intake only.",
            basis: basis as P1CharterBasisInput,
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("drops an assumption whose answer was edited after the basis was declared", () => {
    const carried = carriedCharterAssumptions({
      active: true,
      modules: [
        moduleRow({
          sectionKey: "scope_boundary",
          value: "Claims intake AND adjudication.",
          basis: ownedAssumption,
          basisRecordedAgainst: "Claims intake only.",
        }),
      ],
    });
    // The stale plan was written about the previous wording; carrying it would
    // describe the new answer with validation that was never agreed for it.
    expect(carried).toEqual([]);
  });

  it("ignores a field with no basis declared at all", () => {
    expect(
      carriedCharterAssumptions({
        active: true,
        modules: [
          moduleRow({ sectionKey: "scope_boundary", value: "Claims intake." }),
        ],
      }),
    ).toEqual([]);
  });

  it("reads only P1 charter modules, not a same-named section in another phase", () => {
    const foreign = moduleRow({
      sectionKey: "scope_boundary",
      value: "Claims intake only.",
      basis: ownedAssumption,
    });
    expect(
      carriedCharterAssumptions({
        active: true,
        modules: [{ ...foreign, moduleKey: "phase_2_scope_boundary" }],
      }),
    ).toEqual([]);
  });

  it("returns every assumed field in canonical charter order", () => {
    const carried = carriedCharterAssumptions({
      active: true,
      modules: [
        // Deliberately supplied out of canonical order.
        moduleRow({
          sectionKey: "decision_rights",
          value: "Steering group decides.",
          basis: {
            kind: "assumption",
            owner: "Programme lead",
            p2ValidationPlan: "Confirm in the Discover stakeholder session.",
          },
        }),
        moduleRow({
          sectionKey: "sponsor_commitment",
          value: "Sponsor has committed two days a month.",
          basis: ownedAssumption,
        }),
      ],
    });
    expect(carried?.map((row) => row.sectionKey)).toEqual([
      "sponsor_commitment",
      "decision_rights",
    ]);
  });
});
