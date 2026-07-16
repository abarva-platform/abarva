import { resolveStrategicMoveOriginationRedirect } from "../resolveOriginationRedirect";

describe("resolveStrategicMoveOriginationRedirect", () => {
  it("rewrites stale Programs redirects to the Moves P0 gate route", () => {
    expect(
      resolveStrategicMoveOriginationRedirect({
        engagementId: "108b1cbe-1bb9-4d76-95c9-091a024ceb56",
        redirectTo: "/programs/108b1cbe-1bb9-4d76-95c9-091a024ceb56",
      }),
    ).toBe(
      "/strategic-moves/108b1cbe-1bb9-4d76-95c9-091a024ceb56/phase/0?focus=gate",
    );
  });

  it("uses non-legacy server redirects when present", () => {
    expect(
      resolveStrategicMoveOriginationRedirect({
        engagementId: "108b1cbe-1bb9-4d76-95c9-091a024ceb56",
        redirectTo:
          "/strategic-moves/108b1cbe-1bb9-4d76-95c9-091a024ceb56/phase/0?focus=gate",
      }),
    ).toBe(
      "/strategic-moves/108b1cbe-1bb9-4d76-95c9-091a024ceb56/phase/0?focus=gate",
    );
  });

  it("falls back to the strategic-move P0 gate route for older API responses", () => {
    expect(
      resolveStrategicMoveOriginationRedirect({
        engagementId: "108b1cbe-1bb9-4d76-95c9-091a024ceb56",
      }),
    ).toBe(
      "/strategic-moves/108b1cbe-1bb9-4d76-95c9-091a024ceb56/phase/0?focus=gate",
    );
  });

  it("returns null when no routeable identifier is present", () => {
    expect(resolveStrategicMoveOriginationRedirect({})).toBeNull();
  });
});
