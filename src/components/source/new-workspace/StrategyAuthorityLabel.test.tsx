/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { SourceNewStage04VendorReadiness } from "./SourceNewWorkspace";
import type { SourceNewEventView } from "./SourceNewWorkspace";

const eventWith = (
  strategyVersionApproval: SourceNewEventView["strategyVersionApproval"],
): SourceNewEventView =>
  ({
    id: "event-1",
    clientKey: "meridian-health",
    clientName: "Example tenant",
    currentStage: "strategy",
    lifecycle: "active",
    requestVersionApproval: "accepted",
    strategyVersionApproval,
  }) as SourceNewEventView;

const labelFor = (
  approval: SourceNewEventView["strategyVersionApproval"],
): string => {
  render(
    <SourceNewStage04VendorReadiness
      event={eventWith(approval)}
      responseRows={[]}
    />,
  );
  const term = screen.getByText("Strategy authority");
  return term.nextElementSibling?.textContent ?? "";
};

describe("Strategy authority label", () => {
  it("reports an approved Strategy version", () => {
    expect(labelFor("approved")).toBe("Strategy version approved");
  });

  it("reports a pending approval", () => {
    expect(labelFor("pending")).toBe("Strategy approval pending");
  });

  it("reports requested changes", () => {
    expect(labelFor("changes_requested")).toBe(
      "Changes requested on the Strategy version",
    );
  });

  // An unreadable authority is the case that matters: absence is not a
  // decision, and reporting it as unapproved would tell the operator that
  // somebody declined when nobody did.
  it("says 'Not recorded' when the authority could not be read", () => {
    expect(labelFor(null)).toBe("Not recorded");
  });

  it("keeps the Request authority distinct from the Strategy one", () => {
    render(
      <SourceNewStage04VendorReadiness
        event={eventWith("pending")}
        responseRows={[]}
      />,
    );
    expect(
      screen.getByText("Request authority").nextElementSibling?.textContent,
    ).toBe("Request version accepted");
  });
});
