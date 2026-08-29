import { performanceActual } from "../WorkspaceExecutiveShell";

describe("WorkspaceExecutiveShell performance formatting", () => {
  it("renders numeric performance actuals from governed rows without throwing", () => {
    expect(performanceActual(89, null)).toBe("89.0%");
    expect(performanceActual(null, 0.91)).toBe("91.0%");
    expect(performanceActual(null, 96)).toBe("96.0%");
    expect(performanceActual("89%", null)).toBe("89%");
  });
});
