import { resolveStrategicMoveOriginationRedirect } from "../resolveOriginationRedirect";

describe("resolveStrategicMoveOriginationRedirect", () => {
  it("uses the server canonical redirect when present", () => {
    expect(
      resolveStrategicMoveOriginationRedirect({
        engagementId: "108b1cbe-1bb9-4d76-95c9-091a024ceb56",
        redirectTo: "/programs/108b1cbe-1bb9-4d76-95c9-091a024ceb56",
      }),
    ).toBe("/programs/108b1cbe-1bb9-4d76-95c9-091a024ceb56");
  });

  it("falls back to the strategic-move detail route for older API responses", () => {
    expect(
      resolveStrategicMoveOriginationRedirect({
        engagementId: "108b1cbe-1bb9-4d76-95c9-091a024ceb56",
      }),
    ).toBe("/strategic-moves/108b1cbe-1bb9-4d76-95c9-091a024ceb56");
  });

  it("returns null when no routeable identifier is present", () => {
    expect(resolveStrategicMoveOriginationRedirect({})).toBeNull();
  });
});
