import { readinessPresentation } from "../state/gate-utils";
import { COMPONENT_READINESS_STATES } from "@/lib/knowledge/view-model";

describe("readinessPresentation", () => {
  it("covers all 11 real ComponentReadinessState values with a distinct title each", () => {
    const titles = COMPONENT_READINESS_STATES.map(
      (s) => readinessPresentation(s).title,
    );
    expect(new Set(titles).size).toBe(COMPONENT_READINESS_STATES.length);
  });

  it("never collapses SOURCE_INCOMPLETE into the same title as WITHHELD or STALE", () => {
    const sourceIncomplete = readinessPresentation("SOURCE_INCOMPLETE");
    const withheld = readinessPresentation("WITHHELD");
    const stale = readinessPresentation("STALE");
    expect(sourceIncomplete.title).not.toBe(withheld.title);
    expect(sourceIncomplete.title).not.toBe(stale.title);
  });

  it("marks WITHHELD and RESTRICTED with the restricted tone", () => {
    expect(readinessPresentation("WITHHELD").tone).toBe("restricted");
    expect(readinessPresentation("RESTRICTED").tone).toBe("restricted");
  });

  it("marks DISPUTED with the gap tone (mirrors the old 'sources disagree' tone)", () => {
    expect(readinessPresentation("DISPUTED").tone).toBe("gap");
  });

  it("marks STALE with the stale tone", () => {
    expect(readinessPresentation("STALE").tone).toBe("stale");
  });

  it("marks ENABLED_AND_PROVEN and NOT_ASSESSED with the neutral tone", () => {
    expect(readinessPresentation("ENABLED_AND_PROVEN").tone).toBe("neutral");
    expect(readinessPresentation("NOT_ASSESSED").tone).toBe("neutral");
  });

  it("marks DATA_RECONCILED_BUT_UI_UNPROVEN with the candidate tone (visually distinct from proven)", () => {
    expect(readinessPresentation("DATA_RECONCILED_BUT_UI_UNPROVEN").tone).toBe(
      "candidate",
    );
  });
});
