/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  CaptureGateMetNotice,
  isGateMetWithCaptureUnfinished,
} from "../CaptureGateMetNotice";

describe("CaptureGateMetNotice", () => {
  it("states the gate is met with the exact met/total counts", () => {
    render(<CaptureGateMetNotice met={3} total={3} />);
    const notice = screen.getByTestId("capture-gate-met-notice");
    expect(notice).toBeInTheDocument();
    // The whole point of the band: it names the gate count so an empty capture
    // strip beside it does not read as a contradiction.
    expect(notice).toHaveTextContent("3 of 3 criteria");
    expect(notice).toHaveTextContent(/optional/i);
  });

  it("renders the counts it is given, not a hardcoded pair", () => {
    render(<CaptureGateMetNotice met={2} total={5} />);
    expect(screen.getByTestId("capture-gate-met-notice")).toHaveTextContent(
      "2 of 5 criteria",
    );
  });

  it("is a status region, not an alert — it is informational, not a blocker", () => {
    render(<CaptureGateMetNotice met={1} total={1} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});


describe("isGateMetWithCaptureUnfinished", () => {
  // A satisfied baseline both halves can be removed from one at a time, so each
  // conjunct is pinned with the others true (not hidden behind a both-false row).
  const doneTally = { state: "done", total: 3 } as const;
  const unfinishedCapture = { total: 11, answered: 0 } as const;

  it("is true for an advanced phase whose measured capture is not fully answered", () => {
    expect(
      isGateMetWithCaptureUnfinished(doneTally, unfinishedCapture),
    ).toBe(true);
  });

  it("is false once the capture is fully answered", () => {
    expect(
      isGateMetWithCaptureUnfinished(doneTally, { total: 11, answered: 11 }),
    ).toBe(false);
  });

  it("is false for a phase still current (not advanced past)", () => {
    expect(
      isGateMetWithCaptureUnfinished(
        { state: "current", total: 3 },
        unfinishedCapture,
      ),
    ).toBe(false);
  });

  it("is false when the capture count is unmeasured (null)", () => {
    expect(
      isGateMetWithCaptureUnfinished(doneTally, { total: 11, answered: null }),
    ).toBe(false);
  });

  it("is false when the gate has no criteria", () => {
    expect(
      isGateMetWithCaptureUnfinished({ state: "done", total: 0 }, unfinishedCapture),
    ).toBe(false);
  });

  it("is false when either row is missing", () => {
    expect(isGateMetWithCaptureUnfinished(undefined, unfinishedCapture)).toBe(
      false,
    );
    expect(isGateMetWithCaptureUnfinished(doneTally, undefined)).toBe(false);
  });
});
