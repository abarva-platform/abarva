import {
  strategicMoveToHomeInput,
  strategicMoveStatusTone,
  formatMoveValue,
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

  it("falls back to 'Unassigned' when there is no sponsor", () => {
    expect(strategicMoveToHomeInput({ ...move, sponsor: null }, NOW).sponsor).toBe(
      "Unassigned",
    );
  });
});
