import { buildMovesAvaChatPacket } from "../packet";
import { formatMovesAvaChatPacketForPrompt } from "../system-prompt";

const BASE_INPUT = {
  tenant: "lakeshore",
  moveId: "908c9bf8-e745-45dc-9ad8-3d493a2a1c8a",
  moveTitle: "Legal and Vendor Contract Obligation Control",
  currentPhase: 2,
  currentPhaseClientLabel: "P2 Discover & Diagnose",
};

describe("buildMovesAvaChatPacket — no blank-prompt chat", () => {
  it("records every unloaded optional field in missingInputs with a matching caveat", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should I do next?");
    expect(packet.missingInputs.length).toBeGreaterThan(0);
    expect(packet.caveats.length).toBe(packet.missingInputs.length);
    expect(packet.caveats[0]).toMatch(/needs confirmation, do not guess/);
  });

  it("does not record fields as missing once they are supplied", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        checklistStatus: {
          evidenceDone: false,
          evidenceLabel: "2 of 4 in",
          gateDone: false,
          gateLabel: "2 of 5 met",
          canAdvance: false,
          nextPhaseLabel: "P3 Design Future State",
        },
        gateCriteria: [{ label: "Baseline confirmed", met: false, severity: "hard" }],
      },
      "What should I do next?",
    );
    expect(packet.missingInputs).not.toContain("phase checklist status");
    expect(packet.missingInputs).not.toContain("gate criteria");
    expect(packet.checklistStatus?.evidenceLabel).toBe("2 of 4 in");
  });

  it("always carries the fixed allowed/disallowed action lists", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "Can we advance?");
    expect(packet.allowedActions.length).toBeGreaterThan(0);
    expect(packet.disallowedActions).toEqual(
      expect.arrayContaining([expect.stringMatching(/approve a phase or advance a gate/i)]),
    );
  });

  it("detects Source implication from the question text and attaches it to the packet", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "How does this affect Source given the vendor renewal?");
    expect(packet.sourceImplication.relevant).toBe(true);
  });

  it("detects Tower implication from the question text and attaches it to the packet", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should Tower measure for adoption?");
    expect(packet.towerMeasurement.relevant).toBe(true);
  });

  it("leaves both awareness flags false when the question is unrelated to either", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should I do next in this phase?");
    expect(packet.sourceImplication.relevant).toBe(false);
    expect(packet.towerMeasurement.relevant).toBe(false);
  });

  it("renders live Moves gate state as authoritative over generic phase-pack criteria", () => {
    const packet = buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        checklistStatus: {
          evidenceDone: false,
          evidenceLabel: "0 evidence items visible",
          gateDone: false,
          gateLabel: "1 hard gate open",
          canAdvance: false,
          nextPhaseLabel: "P2",
        },
        gateCriteria: [
          {
            label: "Sponsor committed and decision rights named",
            met: true,
            severity: "hard",
          },
          {
            label: "Charter signed off by sponsor",
            met: false,
            severity: "hard",
          },
          {
            label: "Initial value range and success metrics ratified",
            met: false,
            severity: "soft",
          },
        ],
      },
      "What is the current gate status?",
    );

    const prompt = formatMovesAvaChatPacketForPrompt(packet, "gate_blocker");

    expect(prompt).toContain("AUTHORITATIVE LIVE MOVES STATE");
    expect(prompt).toContain(
      "Live gate tally: 1 of 2 blocking hard gate criteria met; 1 open.",
    );
    expect(prompt).toContain(
      "Checklist: evidence not done (0 evidence items visible); gate not met (1 hard gate open); can advance: no",
    );
  });
});
