import {
  buildMovesHomeProps,
  type MovesHomeMoveInput,
} from "../moves-home-adapter";

const base: MovesHomeMoveInput = {
  id: "m",
  name: "A move",
  code: "CODE",
  currentPhase: 1,
  phaseLabel: "P1 Charter",
  sponsor: "Sponsor",
  value: "Declares in Charter",
  status: "In charter",
  statusTone: "active",
  activity: "Today",
  href: "/strategic-moves/m",
};

describe("buildMovesHomeProps", () => {
  it("derives the headline from in-flight and waiting counts", () => {
    const props = buildMovesHomeProps({
      tenantName: "T",
      newMoveHref: "/new",
      valueLine: "value line",
      moves: [
        { ...base, id: "1" },
        { ...base, id: "2", waitingAsk: "Approve scope", ageDays: 1 },
        { ...base, id: "3", inFlight: false },
      ],
    });
    // 2 in flight (3 is terminal), 1 waiting
    expect(props.headline).toBe("2 moves in flight · 1 waiting on a decision");
    expect(props.valueLine).toBe("value line");
  });

  it("omits the waiting clause when nothing is waiting, and singularizes 'move'", () => {
    const props = buildMovesHomeProps({
      tenantName: "T",
      newMoveHref: "/new",
      valueLine: "v",
      moves: [{ ...base, id: "1" }],
    });
    expect(props.headline).toBe("1 move in flight");
    expect(props.waiting).toHaveLength(0);
  });

  it("builds the waiting triage oldest-first, using the ask and where", () => {
    const props = buildMovesHomeProps({
      tenantName: "T",
      newMoveHref: "/new",
      valueLine: "v",
      moves: [
        { ...base, id: "new", waitingAsk: "Newer ask", ageDays: 1, waitingWhere: "P1 · step 1" },
        { ...base, id: "old", waitingAsk: "Older ask", ageDays: 5 },
        { ...base, id: "none", waitingAsk: "   " }, // blank ask → not waiting
      ],
    });
    expect(props.waiting.map((w) => w.id)).toEqual(["old", "new"]); // oldest first
    expect(props.waiting[0].ask).toBe("Older ask");
    expect(props.waiting[1].where).toBe("P1 · step 1");
  });

  it("maps rows and clamps the phase index to the six-dot rail", () => {
    const props = buildMovesHomeProps({
      tenantName: "T",
      newMoveHref: "/new",
      valueLine: "v",
      moves: [
        { ...base, id: "hi", currentPhase: 9 },
        { ...base, id: "lo", currentPhase: -2 },
      ],
    });
    expect(props.moves.find((m) => m.id === "hi")?.phaseIndex).toBe(5);
    expect(props.moves.find((m) => m.id === "lo")?.phaseIndex).toBe(0);
  });

  it("passes reconciliation through untouched (host owns the governed numbers)", () => {
    const recon = {
      declaredPrograms: "38 programmes",
      trackedRecords: "52 records",
      declaredBudget: "$739.7M",
      declaredValue: "$845.9M",
    };
    const props = buildMovesHomeProps({
      tenantName: "T",
      newMoveHref: "/new",
      valueLine: "v",
      reconciliation: recon,
      moves: [base],
    });
    expect(props.reconciliation).toEqual(recon);
  });
});
