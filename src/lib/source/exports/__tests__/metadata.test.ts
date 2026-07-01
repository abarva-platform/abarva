import { eventCodeFromPayload, eventCodeFromSpec } from "../metadata";
import type { SourceDeliverableSpec } from "../types";

describe("Source export metadata helpers", () => {
  it("prefers rendered payload eventCode over persisted source-event code", () => {
    expect(
      eventCodeFromPayload(
        { eventCode: "SKYH-AMS-RFP-2026" },
        "SKYH-NORMALIZE-THE-SECTIONED-2026",
      ),
    ).toBe("SKYH-AMS-RFP-2026");
  });

  it("falls back safely when payload has no eventCode", () => {
    expect(eventCodeFromPayload({ eventName: "Example" }, "EVENT-1")).toBe(
      "EVENT-1",
    );
  });

  it("reads the same clean code from a deliverable spec", () => {
    const spec: SourceDeliverableSpec = {
      tenantKey: "skyharbor-air",
      sourceEventId: "76a42ef7-ce5b-4e7c-a540-2f73cebb730f",
      kind: "decision-brief",
      title: "SkyHarbor Air AMS Outsourcing RFP",
      generatedAt: "2026-07-01T12:00:00.000Z",
      payload: {
        eventCode: "SKYH-AMS-RFP-2026",
        body: "# Brief",
      },
    };

    expect(
      eventCodeFromSpec(spec, "SKYH-NORMALIZE-THE-SECTIONED-2026"),
    ).toBe("SKYH-AMS-RFP-2026");
  });
});
