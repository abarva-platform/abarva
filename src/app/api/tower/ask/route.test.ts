import { buildAvaTowerAskPrompt } from "./route";

describe("Tower Ava ask prompt", () => {
  it("inherits the shared consultant answer shape", () => {
    const prompt = buildAvaTowerAskPrompt("USER CONTEXT");

    expect(prompt).toContain("CONSULTANT ANSWER SHAPE");
    expect(prompt).toContain("Read: the direct recommendation or judgment");
    expect(prompt).toContain("Evidence: the specific tenant facts");
    expect(prompt).toContain("Implication: what this means for the executive decision");
    expect(prompt).toContain("Next move: the owner, artifact, gate");
  });
});
