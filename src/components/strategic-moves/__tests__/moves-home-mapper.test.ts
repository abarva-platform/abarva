import {
  strategicMoveToHomeInput,
  strategicMoveStatusTone,
  formatMoveValue,
  hasDeclaredValue,
  buildPortfolioValueLine,
  DECLARES_IN_CHARTER,
  type StrategicMoveHomeSource,
} from "../moves-home-mapper";

const move: StrategicMoveHomeSource = {
  id: "m1",
  displayCode: "IDN-MEMBER-2026",
  name: "Member Service Agent Assist",
  currentPhase: 1,
  phaseLabel: "P1 Charter",
  status: { key: "awaiting_gate", text: "Awaiting gate", description: "Confirm decision rights." },
  statusColor: "amber",
  sponsor: { name: "VP Member Services" },
  valueAtStake: { projected: null, verified: null },
  updatedAt: "2026-10-01T00:00:00Z",
};

const NOW = new Date("2026-10-04T00:00:00Z");

describe("moves-home-mapper", () => {
  it("maps status color to tone", () => {
    expect(strategicMoveStatusTone("red")).toBe("blocked");
    expect(strategicMoveStatusTone("amber")).toBe("watch");
    expect(strategicMoveStatusTone("green")).toBe("active");
    expect(strategicMoveStatusTone("teal")).toBe("done");
  });

  it("formats value from governed valueAtStake, never inventing it", () => {
    expect(formatMoveValue({ projected: null, verified: null })).toBe(
      "Declares in Charter",
    );
    expect(
      formatMoveValue({ projected: null, verified: { amount: 8_000_000, status: "tracked" } }),
    ).toMatch(/tracked/);
    expect(
      formatMoveValue({
        projected: { low: 3_000_000, high: 5_000_000, currency: "USD" },
        verified: null,
      }),
    ).toMatch(/projected/);
  });

  it("surfaces an amber/red move as waiting, using the status description as the ask", () => {
    const input = strategicMoveToHomeInput(move, NOW);
    expect(input.waitingAsk).toBe("Confirm decision rights.");
    expect(input.waitingWhere).toBe("P1 Charter");
    expect(input.ageDays).toBe(3);
    expect(input.activity).toBe("3 days ago");
    expect(input.sponsor).toBe("VP Member Services");
    expect(input.code).toBe("IDN-MEMBER-2026");
    expect(input.href).toBe("/strategic-moves/m1");
    expect(input.inFlight).toBe(true);
  });

  it("does not mark a green or terminal move as waiting", () => {
    expect(strategicMoveToHomeInput({ ...move, statusColor: "green" }, NOW).waitingAsk).toBeNull();
    expect(
      strategicMoveToHomeInput({ ...move, terminalComplete: true }, NOW).waitingAsk,
    ).toBeNull();
    expect(
      strategicMoveToHomeInput({ ...move, terminalComplete: true }, NOW).inFlight,
    ).toBe(false);
  });


  // A portfolio row's valueAtStake, in each shape the governed field takes.
  const value = (
    v: Partial<NonNullable<StrategicMoveHomeSource["valueAtStake"]>>,
  ): StrategicMoveHomeSource["valueAtStake"] => ({
    projected: v.projected ?? null,
    verified: v.verified ?? null,
  });

  const NOTHING_DECLARED: Array<
    [string, StrategicMoveHomeSource["valueAtStake"]]
  > = [
    ["no valueAtStake at all", null],
    ["both halves empty", value({})],
    // A verified row carrying zero has tracked nothing yet.
    ["verified zero, nothing projected", value({ verified: { amount: 0, status: "pending" } })],
  ];

  const DECLARED: Array<[string, StrategicMoveHomeSource["valueAtStake"]]> = [
    ["verified above zero", value({ verified: { amount: 8_000_000, status: "tracked" } })],
    ["a projected range", value({ projected: { low: 3_000_000, high: 5_000_000, currency: "USD" } })],
    // A declared zero range is still a declaration; it is not silence.
    ["a projected zero range", value({ projected: { low: 0, high: 0, currency: "USD" } })],
    [
      "projected, with verified still at zero",
      value({
        projected: { low: 1_000_000, high: 2_000_000, currency: "USD" },
        verified: { amount: 0, status: "pending" },
      }),
    ],
  ];

  it("reads 'declared a value' off the governed field, in both directions", () => {
    for (const [label, v] of NOTHING_DECLARED) {
      expect(hasDeclaredValue(v)).toBe(false);
      expect(label).toBeTruthy();
    }
    for (const [label, v] of DECLARED) {
      expect(hasDeclaredValue(v)).toBe(true);
      expect(label).toBeTruthy();
    }
  });

  // The landing's value count must not be derived from the rendered label. Pin
  // the two together so a copy change cannot move the count: the fallback copy
  // appears EXACTLY when the governed field declares nothing, and the count
  // reads the field. Without this the previous derivation (compare the
  // formatted string against the fallback copy) reports every move as having
  // declared a value the moment that copy changes.
  it("renders the fallback copy exactly when nothing is declared", () => {
    for (const [, v] of NOTHING_DECLARED) {
      expect(formatMoveValue(v)).toBe(DECLARES_IN_CHARTER);
    }
    for (const [, v] of DECLARED) {
      expect(formatMoveValue(v)).not.toBe(DECLARES_IN_CHARTER);
    }
  });

  it("counts the portfolio value line from the governed field", () => {
    expect(buildPortfolioValueLine([])).toBe("No moves yet.");
    expect(
      buildPortfolioValueLine([DECLARED[0][1], NOTHING_DECLARED[1][1], DECLARED[1][1]]),
    ).toBe(
      "2 of 3 moves have declared value; the rest declare in Charter.",
    );
    expect(
      buildPortfolioValueLine([NOTHING_DECLARED[0][1], NOTHING_DECLARED[2][1]]),
    ).toBe("0 of 2 moves have declared value; the rest declare in Charter.");
  });

  it("says 'move has' for a single move and 'moves have' for more", () => {
    expect(buildPortfolioValueLine([DECLARED[0][1]])).toContain("1 of 1 move has");
    expect(buildPortfolioValueLine([DECLARED[0][1], DECLARED[1][1]])).toContain(
      "2 of 2 moves have",
    );
  });

  it("falls back to 'Unassigned' when there is no sponsor", () => {
    expect(strategicMoveToHomeInput({ ...move, sponsor: null }, NOW).sponsor).toBe(
      "Unassigned",
    );
  });
});
