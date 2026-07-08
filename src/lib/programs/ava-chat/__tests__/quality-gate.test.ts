import { buildMovesAvaChatPacket } from "../packet";
import { classifyMovesAvaQuestion, buildOutOfScopeRedirect } from "../answer-modes";
import { runMovesAvaQualityGate } from "../quality-gate";

const BASE_INPUT = {
  tenant: "lakeshore",
  moveId: "908c9bf8-e745-45dc-9ad8-3d493a2a1c8a",
  moveTitle: "Legal and Vendor Contract Obligation Control",
  currentPhase: 2,
  currentPhaseClientLabel: "P2 Discover & Diagnose",
  checklistStatus: {
    evidenceDone: false,
    evidenceLabel: "2 of 4 in",
    gateDone: false,
    gateLabel: "2 of 5 met",
    canAdvance: false,
    nextPhaseLabel: "P3 Design Future State",
  },
  gateCriteria: [{ label: "Baseline confirmed", met: false, severity: "hard" as const }],
};

describe("runMovesAvaQualityGate — a well-formed answer passes every check", () => {
  it("passes when grounded, deterministic, caveated, actionable, and clean", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What evidence is missing?");
    const { mode } = classifyMovesAvaQuestion("What evidence is missing?");
    const answer =
      "For Legal and Vendor Contract Obligation Control at P2 Discover & Diagnose, 2 of 4 required evidence items are in and 2 of 5 gate criteria are met. " +
      "The baseline confirmation is still missing — treat that as needs confirmation. Next action: upload the current-state process map.";
    const result = runMovesAvaQualityGate(answer, packet, mode);
    expect(result.pass).toBe(true);
    expect(result.failedChecks).toEqual([]);
  });
});

describe("runMovesAvaQualityGate — catches each failure mode with a repair instruction", () => {
  it("fails no_banned_language on Claude-deflection and gives a repair instruction", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should I do next?");
    const answer =
      "For this Move at P2, you could ask Claude for a better answer. Next action: upload evidence.";
    const result = runMovesAvaQualityGate(answer, packet, "phase_guidance");
    expect(result.pass).toBe(false);
    expect(result.failedChecks).toContain("no_banned_language");
    expect(result.repairInstructions.join(" ")).toMatch(/Claude-deflection/);
  });

  it("fails includes_caveat_when_incomplete when evidence is missing but no caveat is stated", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should I do next?");
    const answer = "For this Move at P2, everything looks fine. Next action: proceed.";
    const result = runMovesAvaQualityGate(answer, packet, "phase_guidance");
    expect(result.failedChecks).toContain("includes_caveat_when_incomplete");
  });

  it("fails references_move_or_phase on a generic, ungrounded answer", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should I do next?");
    const answer = "In general, teams should gather more evidence before proceeding. Next action: review.";
    const result = runMovesAvaQualityGate(answer, packet, "phase_guidance");
    expect(result.failedChecks).toContain("references_move_or_phase");
  });

  it("fails includes_next_action when no action is stated", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should I do next?");
    const answer =
      "This Move at P2 Discover & Diagnose has 2 of 4 evidence items in, with the remainder outstanding.";
    const result = runMovesAvaQualityGate(answer, packet, "phase_guidance");
    expect(result.failedChecks).toContain("includes_next_action");
  });

  it("fails mentions_source_when_relevant when Source is implicated but not named", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "How does the vendor renewal affect this?");
    const answer =
      "For this Move at P2, the vendor renewal should be tracked. Next action: confirm the contract terms.";
    const result = runMovesAvaQualityGate(answer, packet, "source_implication");
    expect(result.failedChecks).toContain("mentions_source_when_relevant");
  });

  it("fails mentions_tower_when_relevant when Tower is implicated but not named", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What should we measure for adoption?");
    const answer = "For this Move at P2, adoption should be tracked. Next action: define the KPI.";
    const result = runMovesAvaQualityGate(answer, packet, "tower_measurement");
    expect(result.failedChecks).toContain("mentions_tower_when_relevant");
  });

  it("does not require a next action or Move grounding on an out-of-scope redirect", () => {
    const packet = buildMovesAvaChatPacket(BASE_INPUT, "What are the top AI trends in supply chain?");
    const answer = buildOutOfScopeRedirect(packet.moveTitle);
    const result = runMovesAvaQualityGate(answer, packet, "out_of_scope_redirect");
    expect(result.checks.references_move_or_phase).toBe(true);
    expect(result.checks.includes_next_action).toBe(true);
  });
});
