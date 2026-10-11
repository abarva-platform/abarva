import {
  detectPhaseCatchUp,
  firstCatchUpHref,
  phaseStatusWithCatchUp,
} from "@/lib/programs/phase-catch-up";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";

const moveId = "synthetic-move";
const input = {
  moveId,
  phase: 2,
  currentPhase: 3,
  gatePassed: true,
  gateRecordConfirmed: true,
};
const register = (
  causes: Array<{
    id: string;
    cause: string;
    status: "accepted" | "no_evidence" | "draft";
    evidence?: string[];
  }>,
  orderConfirmed = true,
) =>
  serializeRootCauseRegister({
    kind: "root_cause_register",
    version: 1,
    causes,
    ...(orderConfirmed ? { orderConfirmedAt: "2026-10-01" } : {}),
  });

describe("phase catch-up", () => {
  it("returns no gap when the passed phase has settled records", () => {
    expect(
      detectPhaseCatchUp({
        ...input,
        rootCauses: register([
          {
            id: "RC-1",
            cause: "Identity mapping",
            status: "accepted",
            evidence: ["Synthetic profile"],
          },
        ]),
      }),
    ).toBeNull();
  });

  it("names one unsettled cause and links to its actual step", () => {
    const catchUp = detectPhaseCatchUp({
      ...input,
      rootCauses: register(
        [{ id: "RC-1", cause: "Identity mapping", status: "no_evidence" }],
        false,
      ),
    });
    expect(catchUp?.gateRecordConfirmed).toBe(true);
    expect(catchUp?.items).toEqual([
      {
        phase: 2,
        stepId: "P2.3",
        id: "RC-1",
        label: "Settle RC-1 · add its evidence",
        href: "/strategic-moves/synthetic-move/phase/2?step=root-causes",
      },
    ]);
  });

  it("keeps workflow order, then asks for the order only after causes settle", () => {
    const causes = [
      { id: "RC-2", cause: "Manual reconciliation", status: "draft" as const },
      { id: "RC-1", cause: "Identity mapping", status: "no_evidence" as const },
    ];
    expect(
      detectPhaseCatchUp({
        ...input,
        rootCauses: register(causes, false),
      })?.items.map((item) => item.id),
    ).toEqual(["RC-2", "RC-1"]);
    expect(
      detectPhaseCatchUp({
        ...input,
        rootCauses: register(
          [
            {
              id: "RC-1",
              cause: "Identity mapping",
              status: "accepted",
              evidence: ["Synthetic profile"],
            },
          ],
          false,
        ),
      })?.items.map((item) => item.id),
    ).toEqual(["root-cause-order"]);
  });

  it("does not turn a current phase or an unpassed gate into catch-up", () => {
    const rootCauses = register([
      { id: "RC-1", cause: "Identity mapping", status: "no_evidence" },
    ]);
    expect(
      detectPhaseCatchUp({ ...input, currentPhase: 2, rootCauses }),
    ).toBeNull();
    expect(
      detectPhaseCatchUp({
        ...input,
        currentPhase: 2,
        terminalComplete: true,
        rootCauses,
      }),
    ).toBeNull();
    expect(
      detectPhaseCatchUp({ ...input, gatePassed: false, rootCauses }),
    ).toBeNull();
  });

  it("describes a missing record as a confirmation gap without claiming the old UI", () => {
    expect(
      detectPhaseCatchUp({
        ...input,
        gateRecordConfirmed: false,
        rootCauses: "",
      }),
    ).toMatchObject({
      gateRecordConfirmed: false,
      items: [
        { id: "root-cause-record", label: "Confirm the root-cause record" },
      ],
    });
    expect(
      detectPhaseCatchUp({ ...input, rootCauses: "Earlier free-text answer" })
        ?.items[0].label,
    ).toBe("Review the earlier root-cause answer");
  });

  it("chooses the first phase and item in workflow order", () => {
    const p2 = detectPhaseCatchUp({ ...input, rootCauses: "" })!;
    expect(
      firstCatchUpHref([
        { ...p2, phase: 3, items: [{ ...p2.items[0], href: "/later" }] },
        p2,
      ]),
    ).toBe(p2.items[0].href);
    expect(firstCatchUpHref([])).toBeNull();
  });

  it("keeps the phase Done while showing the confirmation count", () => {
    const catchUp = detectPhaseCatchUp({
      ...input,
      rootCauses: register([
        { id: "RC-1", cause: "Identity mapping", status: "no_evidence" },
      ]),
    })!;
    expect(phaseStatusWithCatchUp(2, true, catchUp)).toBe(
      "Done · 1 to confirm",
    );
    expect(phaseStatusWithCatchUp(2, true, null)).toBe("Done");
    expect(phaseStatusWithCatchUp(2, false, catchUp)).toBe("Not started");
  });
});
