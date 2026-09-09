import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

  test("completed events route to an implemented read-only Value summary", () => {
    const eventId = "apex-retail-ams-outsourcing-2026";
    const action = resolveSourceLifecycleRoute({
      eventId,
      lifecycleState: "completed",
      currentStageKey: "value",
      pathname: `/source/events/${eventId}`,
    });

    expect(action).toEqual({
      type: "redirect",
      destination: `/source/events/${eventId}/summary`,
      status: 302,
    });

    const summaryPagePath = join(
      process.cwd(),
      "src/app/(maestro)/source/events/[eventId]/summary/page.tsx",
    );
    expect(existsSync(summaryPagePath), summaryPagePath).toBe(true);

    const summaryPage = readFileSync(summaryPagePath, "utf8");
    expect(summaryPage).toContain('stage: "value"');
    expect(summaryPage).toContain('workspace: "approvals"');
    expect(summaryPage).toContain("SourceEventDetailPage");
  });
});
