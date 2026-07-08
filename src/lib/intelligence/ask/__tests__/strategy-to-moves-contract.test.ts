import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("strategy-to-AbarVa solution synthesis contract", () => {
  const synthesizerCode = readFileSync(
    join(__dirname, "..", "synthesizer.ts"),
    "utf8",
  );

  it("injects the strategy-to-AbarVa solution contract into the active synthesis path", () => {
    expect(synthesizerCode).toContain(
      "needsAbarvaSolutionGuidance(args.query)",
    );
    expect(synthesizerCode).toContain(
      "STRATEGY_TO_ABARVA_SOLUTION_CONTRACT",
    );
    expect(synthesizerCode).toContain(
      "STRATEGY_TO_MOVES_EXECUTION_CONTRACT",
    );
    expect(synthesizerCode).toContain("strategy_to_abarva_solution");
    expect(synthesizerCode).toContain("ACTIVE ANSWER MODE:");
    expect(synthesizerCode).toContain("strategy_to_moves_execution");
    expect(synthesizerCode).toContain("How AbarVa would solve this");
    expect(synthesizerCode).toContain("Home for current-state evidence");
    expect(synthesizerCode).toContain("Source for vendor/commercial levers");
    expect(synthesizerCode).toContain("compact Moves phase table");
    expect(synthesizerCode).toContain("P0 Originate");
    expect(synthesizerCode).toContain("P5 Prepare to Execute");
    expect(synthesizerCode).toContain("Tower Track Outcomes");
  });
});
