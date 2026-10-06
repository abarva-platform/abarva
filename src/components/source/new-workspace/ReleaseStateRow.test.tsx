/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import {
  SourceNewStage04VendorReadiness,
  type SourceNewEventView,
} from "./SourceNewWorkspace";

const eventWith = (
  releaseState: SourceNewEventView["releaseState"],
): SourceNewEventView =>
  ({
    id: "event-1",
    clientKey: "meridian-health",
    clientName: "Example tenant",
    currentStage: "rfp",
    lifecycle: "active",
    requestVersionApproval: "accepted",
    strategyVersionApproval: "approved",
    releaseState,
  }) as SourceNewEventView;

// Scoped to its own container: several cases render more than once, and a
// document-wide query would then match every copy rather than this one.
const releaseText = (
  releaseState: SourceNewEventView["releaseState"],
): string => {
  const { container } = render(
    <SourceNewStage04VendorReadiness
      event={eventWith(releaseState)}
      responseRows={[]}
    />,
  );
  const term = Array.from(container.querySelectorAll("dt")).find(
    (node) => node.textContent === "RFx release",
  );
  return term?.nextElementSibling?.textContent ?? "";
};

describe("RFx release row", () => {
  it("shows the prepared version with its counts", () => {
    expect(
      releaseText({
        kind: "prepared",
        version: 2,
        recipientCount: 4,
        artifactCount: 3,
        approvedAt: "2026-11-01T00:00:00Z",
      }),
    ).toBe("Version 2 prepared · 4 recipients · 3 artefacts");
  });

  it("distinguishes nothing prepared from an unreadable store", () => {
    expect(releaseText({ kind: "none" })).toBe("No package prepared");
    expect(releaseText({ kind: "unread" })).toBe("Not recorded");
  });

  // An absent prop is the same claim as an unreadable store, and must never
  // render as "no package prepared": that would tell the operator a release
  // was never made when the page simply did not ask.
  it("treats an absent prop as unread, not as nothing prepared", () => {
    expect(releaseText(null)).toBe("Not recorded");
    expect(releaseText(undefined)).toBe("Not recorded");
  });

  it("keeps the authority rows distinct from the release row", () => {
    render(
      <SourceNewStage04VendorReadiness
        event={eventWith({ kind: "none" })}
        responseRows={[]}
      />,
    );
    expect(
      screen.getByText("Strategy authority").nextElementSibling?.textContent,
    ).toBe("Strategy version approved");
    expect(
      screen.getByText("RFx release").nextElementSibling?.textContent,
    ).toBe("No package prepared");
  });
});
