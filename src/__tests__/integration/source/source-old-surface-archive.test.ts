import fs from "node:fs";
import path from "node:path";
import { SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER } from "@/lib/source/new-workspace/phase-state";
import {
  SOURCE_JOURNEYS,
  sourceJourneyStageHref,
  sourceJourneyStageKeys,
} from "@/lib/source/sourcing-motion-journeys";
import { SOURCE_STAGE_ORDER, normalizeSourceStageKey } from "@/lib/source/constants";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Source old surface archive guard", () => {
  const eventRoute = "src/app/(maestro)/source/events/[eventId]/page.tsx";

  it("hard-mounts SourceAnalyticsCanvas for event detail routes", () => {
    const source = read(eventRoute);

    expect(source).toContain("SourceAnalyticsCanvas");
    expect(source).toContain("Source event shell v2");
    expect(source).not.toContain("UniversalCanvasShell");
    expect(source).not.toContain("workspaceExplorerEnabled");
    expect(source).not.toContain("strategyAutoDraftEnabled");
    expect(source).not.toContain("simpleFrontEnabled");
  });

  it("keeps old Source entry surfaces free of the retired shell", () => {
    const root = read("src/app/(maestro)/source/page.tsx");
    const events = read("src/app/(maestro)/source/events/page.tsx");

    expect(root).not.toContain("UniversalCanvasShell");
    expect(events).not.toContain("UniversalCanvasShell");
  });

  it("keeps the external Source New flow separate from the internal stage spine", () => {
    expect(SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER).toEqual([
      "request_intake",
      "request",
      "define",
      "suppliers",
      "rfi",
    ]);
    expect(SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER).toHaveLength(5);

    expect(SOURCE_STAGE_ORDER).toEqual([
      "strategy",
      "scope",
      "rfp",
      "responses",
      "evaluation",
      "pricing",
      "bafo",
      "executive_decision",
      "selection",
      "transition",
      "value",
    ]);
    expect(SOURCE_STAGE_ORDER).toHaveLength(11);
  });

  it("normalizes legacy stage keys before event-route journey coercion", () => {
    expect(normalizeSourceStageKey(" RFP_RFI_PACKAGE ")).toBe("rfp");
    expect(normalizeSourceStageKey("vendor_responses")).toBe("responses");
    expect(normalizeSourceStageKey("contract_mobilization")).toBe("transition");

    expect(sourceJourneyStageKeys(SOURCE_JOURNEYS.contract_optimization)).toEqual([
      "strategy",
      "scope",
      "pricing",
      "bafo",
      "executive_decision",
      "transition",
      "value",
    ]);
    expect(
      sourceJourneyStageHref({
        eventId: "evt-stage-contract",
        journey: SOURCE_JOURNEYS.contract_optimization,
        stageKey: "rfp_rfi_package",
      }),
    ).toBe("/source/events/evt-stage-contract?stage=pricing");
    expect(
      sourceJourneyStageHref({
        eventId: "evt-stage-contract",
        journey: SOURCE_JOURNEYS.contract_optimization,
        stageKey: "contract_mobilization",
      }),
    ).toBe("/source/events/evt-stage-contract?stage=transition");
  });
});
