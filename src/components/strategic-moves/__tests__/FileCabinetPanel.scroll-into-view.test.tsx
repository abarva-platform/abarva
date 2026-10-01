/** @jest-environment jsdom */

// U-550: opening a review schedules a requestAnimationFrame that scrolls the
// review panel into view. jsdom does not implement Element.scrollIntoView, so
// an unguarded call threw whenever the frame fired before teardown — a
// timing-dependent failure in "Unit suites that pass on main". These cases take
// the frame out of the scheduler's hands and run it deterministically.

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FileCabinetPanel } from "../FileCabinetPanel";

function mockCabinetFetch() {
  global.fetch = jest.fn(async (url: string) => {
    if (url.endsWith("/review-decision")) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          reviewPackage: null,
          packet: null,
          latestDecision: null,
          readiness: null,
        }),
      } as Response;
    }
    return {
      ok: true,
      json: async () => ({
        artifacts: [
          {
            artifactId: "artifact-1",
            artifactType: "discovery_report",
            family: "generated_deliverable",
            title: "Service diagnostic",
            phase: 2,
            fileFormat: "html",
            fileName: "diagnostic.html",
            version: 1,
            status: "review_required",
            lifecycleState: "current",
            qualityScore: null,
            unsupportedClaims: 0,
            createdAt: "2026-09-30T00:00:00Z",
            fileSize: 1000,
            stored: "azure_blob",
            openItems: [],
            downloadUrl: "/api/v1/programs/move-1/artifacts/artifact-1/download",
          },
        ],
        pendingEvidenceReviews: [],
        evidenceReviewStatus: "available",
      }),
    } as Response;
  }) as typeof fetch;
}

describe("Moves File Cabinet review scroll", () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 1;
  const originalScroll = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "scrollIntoView",
  );

  beforeEach(() => {
    frames.clear();
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        const id = nextFrame++;
        frames.set(id, cb);
        return id;
      });
    jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id: number) => {
        frames.delete(id);
      });
    mockCabinetFetch();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalScroll) {
      Object.defineProperty(Element.prototype, "scrollIntoView", originalScroll);
    } else {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  function flushFrames() {
    const pending = [...frames.values()];
    frames.clear();
    act(() => {
      for (const cb of pending) cb(0);
    });
  }

  it("does not throw when the element has no scrollIntoView", async () => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
    expect(typeof Element.prototype.scrollIntoView).toBe("undefined");

    render(<FileCabinetPanel moveId="move-1" phase={2} />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));

    expect(frames.size).toBeGreaterThan(0);
    expect(() => flushFrames()).not.toThrow();
  });

  it("scrolls the review panel into view when the method exists", async () => {
    const scroll = jest.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scroll,
    });

    render(<FileCabinetPanel moveId="move-1" phase={2} />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    flushFrames();

    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
  });

  it("cancels the pending scroll frame when the panel unmounts", async () => {
    const { unmount } = render(<FileCabinetPanel moveId="move-1" phase={2} />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    expect(frames.size).toBeGreaterThan(0);

    unmount();

    expect(frames.size).toBe(0);
  });
});
