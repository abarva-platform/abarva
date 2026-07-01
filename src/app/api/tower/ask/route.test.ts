import { buildAvaTowerAskPrompt } from "./route";

describe("Tower Ava ask prompt", () => {
  it("inherits the shared consultant answer shape", () => {
    const prompt = buildAvaTowerAskPrompt("USER CONTEXT");

    expect(prompt).toContain("CONSULTANT ANSWER SHAPE");
    expect(prompt).toContain("Open with the active tenant display name");
    expect(prompt).toContain("direct recommendation or judgment");
    expect(prompt).toContain("specific tenant facts");
    expect(prompt).toContain("executive decision and the next useful action");
    expect(prompt).toContain("Do not print visible section labels");
  });
});
