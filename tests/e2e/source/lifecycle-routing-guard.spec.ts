import { expect, test } from "@playwright/test";
import { resolveSourceLifecycleRoute } from "../../../src/lib/source/lifecycle-routing-guard";

test.describe("Source lifecycle routing guard", () => {
  test("waiting events route direct canvas attempts to approval before canvas work", () => {
    const action = resolveSourceLifecycleRoute({
      eventId: "apex-retail-ams-outsourcing-2026",
      lifecycleState: "waiting_on_client",
      currentStageKey: "strategy",
      pathname: "/source/events/apex-retail-ams-outsourcing-2026",
    });

    expect(action).toEqual({
      type: "redirect",
      destination: "/source/events/apex-retail-ams-outsourcing-2026/approval",
      status: 302,
    });
  });

  test("active events route approval attempts back to the current stage", () => {
    const action = resolveSourceLifecycleRoute({
      eventId: "apex-retail-ams-outsourcing-2026",
      lifecycleState: "active",
      currentStageKey: "bafo",
      pathname: "/source/events/apex-retail-ams-outsourcing-2026/approval",
    });

    expect(action).toEqual({
      type: "redirect",
      destination: "/source/events/apex-retail-ams-outsourcing-2026?stage=bafo",
      status: 302,
    });
  });
});
