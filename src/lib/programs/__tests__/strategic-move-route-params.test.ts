import {
  isStrategicMoveRouteId,
  parseStrategicMovePhaseNum,
} from "../strategic-move-route-params";

describe("isStrategicMoveRouteId", () => {
  it("accepts production engagement UUIDs", () => {
    expect(isStrategicMoveRouteId("5f5d7993-18ba-4eb6-84a3-72373aab042b")).toBe(
      true,
    );
  });

  it("rejects legacy fixture slugs before data-plane reads", () => {
    expect(isStrategicMoveRouteId("apx-cdp-2026")).toBe(false);
    expect(isStrategicMoveRouteId("APX-CDP-2026")).toBe(false);
  });
});

describe("parseStrategicMovePhaseNum", () => {
  it("accepts the canonical P0 through P5 phase workspace routes", () => {
    expect(parseStrategicMovePhaseNum("0")).toBe(0);
    expect(parseStrategicMovePhaseNum("1")).toBe(1);
    expect(parseStrategicMovePhaseNum("5")).toBe(5);
  });

  it("rejects out-of-range and non-numeric phase routes", () => {
    expect(parseStrategicMovePhaseNum("-1")).toBeNull();
    expect(parseStrategicMovePhaseNum("6")).toBeNull();
    expect(parseStrategicMovePhaseNum("charter")).toBeNull();
  });
});
