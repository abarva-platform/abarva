import { isStrategicMoveRouteId } from "../strategic-move-route-params";

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
