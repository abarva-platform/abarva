// Approvals overview labels — the per-phase approvals table may not state an
// approval, an approver or a quantity that nothing on the screen measured.
//
// What these cases pin, and what each would catch:
//
//  - A "done" row states "Gate passed", not "Approved". `state: "done"` is
//    inferred from the Move having advanced past the phase; no approval event,
//    approver or date is read anywhere on this surface, so naming it an
//    approval is the over-claim. Restoring "Approved" reds the first case.
//  - The approver cell cannot be given a name it was not handed. Its only
//    argument is the recorded approver, so the old shape — a constant string
//    returned for every phase — is not expressible; what the cases can still
//    pin is that an absent record renders a readable absence rather than a
//    dash, and that `recorded` tells the host which it got.
//  - The status cell does not restate the tally. The tally column and the
//    status column used to carry the same quantity in two notations
//    ("0 of 2 met" and "0/2 met - not yet submitted"), which reads as two
//    measurements. Re-adding a figure to any status string reds the case that
//    asserts no status text contains a digit.
//  - The noun is agreed to the count, so a one-criterion gate cannot read
//    "1 gate criteria" (the fixed-plural trap).

import {
  agreeGateCriterionNoun,
  approvalsRowStatusBasis,
  approvalsRowStatusClass,
  approvalsRowStatusText,
  formatApproverCell,
  formatGateCriteriaCell,
  formatGateCriteriaTitle,
  type ApprovalsRow,
} from "@/lib/programs/approvals-overview-labels";

const row = (over: Partial<ApprovalsRow> = {}): ApprovalsRow => ({
  met: 0,
  total: 2,
  state: "current",
  ...over,
});

describe("approvals overview labels · the status column", () => {
  it("states a passed gate, not an approval nobody recorded", () => {
    const text = approvalsRowStatusText(
      row({ met: 3, total: 3, state: "done" }),
    );

    expect(text).toBe("Gate passed");
    expect(text).not.toMatch(/approv/i);
  });

  it("says where a passed gate's reading comes from, naming the inference", () => {
    const basis = approvalsRowStatusBasis(
      row({ met: 3, total: 3, state: "done" }),
    );

    expect(basis).toMatch(/advanced past/i);
    expect(basis).toMatch(/no approval record/i);
  });

  it("distinguishes a current phase that is ready to submit from one that is not", () => {
    expect(approvalsRowStatusText(row({ met: 2, total: 2 }))).toBe(
      "Ready to submit",
    );
    expect(approvalsRowStatusText(row({ met: 0, total: 2 }))).toBe(
      "Not yet submitted",
    );
  });

  it("carries no digit in any status text, so it cannot restate the tally", () => {
    const every: ApprovalsRow[] = [
      row({ met: 3, total: 3, state: "done" }),
      row({ met: 0, total: 2 }),
      row({ met: 2, total: 2 }),
      row({ met: 0, total: 4, state: "upcoming" }),
    ];

    for (const r of every) {
      expect(approvalsRowStatusText(r)).not.toMatch(/\d/);
    }
  });

  it("reports an unreached phase as unreached and gives it no basis to claim", () => {
    const upcoming = row({ met: 0, total: 4, state: "upcoming" });

    expect(approvalsRowStatusText(upcoming)).toBe("Not reached");
    expect(approvalsRowStatusBasis(upcoming)).toBeUndefined();
  });

  it("classes a passed gate distinctly from a submittable one", () => {
    expect(
      approvalsRowStatusClass(row({ met: 3, total: 3, state: "done" })),
    ).toBe("passed");
    expect(approvalsRowStatusClass(row({ met: 2, total: 2 }))).toBe("ready");
    expect(approvalsRowStatusClass(row({ met: 0, total: 2 }))).toBe("pending");
    expect(approvalsRowStatusClass(row({ state: "upcoming" }))).toBe(
      "upcoming",
    );
  });
});

describe("approvals overview labels · the tally column", () => {
  it("renders the bare figure in the cell and names the set in its title", () => {
    const r = row({ met: 1, total: 2 });

    expect(formatGateCriteriaCell(r)).toBe("1 of 2 met");
    expect(formatGateCriteriaTitle(r)).toBe("1 of 2 gate criteria met");
  });

  it("agrees the noun to the count, so a single-criterion gate reads singular", () => {
    expect(agreeGateCriterionNoun(1)).toBe("gate criterion");
    expect(agreeGateCriterionNoun(0)).toBe("gate criteria");
    expect(agreeGateCriterionNoun(2)).toBe("gate criteria");
    expect(formatGateCriteriaTitle(row({ met: 1, total: 1 }))).toBe(
      "1 of 1 gate criterion met",
    );
  });
});

describe("approvals overview labels · the approver column", () => {
  it("renders a readable absence, not a dash, when no approver was recorded", () => {
    const cell = formatApproverCell(null);

    expect(cell).toEqual({ text: "Not recorded", recorded: false });
    // A dash is unreadable as absence rather than zero, so the cell spells it.
    expect(cell.text).not.toMatch(/^[\u2014\u2013-]$/);
  });

  it("treats an empty or whitespace record as no record at all", () => {
    expect(formatApproverCell("")).toEqual({
      text: "Not recorded",
      recorded: false,
    });
    expect(formatApproverCell("   ")).toEqual({
      text: "Not recorded",
      recorded: false,
    });
    expect(formatApproverCell(undefined)).toEqual({
      text: "Not recorded",
      recorded: false,
    });
  });

  it("renders a recorded approver, trimmed, and reports it as recorded", () => {
    expect(formatApproverCell("  Gate approver  ")).toEqual({
      text: "Gate approver",
      recorded: true,
    });
  });
});
