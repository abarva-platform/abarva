import {
  buildPhaseNavigationStatus,
  parseRequestedPhase,
} from "../phase-navigation-status";

describe("phase-navigation-status", () => {
  it("allows the requested phase when it is already reachable", () => {
    expect(
      buildPhaseNavigationStatus({
        currentPhase: 2,
        requestedPhase: 2,
      }),
    ).toMatchObject({
      currentPhase: 2,
      requestedPhase: 2,
      canOpenRequestedPhase: true,
      blockedRequest: null,
    });
  });

  it("blocks future P2 with the workbook review action", () => {
    const status = buildPhaseNavigationStatus({
      currentPhase: 1,
      requestedPhase: 2,
    });

    expect(status.canOpenRequestedPhase).toBe(false);
    expect(status.blockedRequest).toMatchObject({
      requestedPhase: 2,
      currentPhase: 1,
      title: "Discovery cannot begin yet",
      nextActionLabel: "Review workbook responses",
    });
    expect(status.blockedRequest?.remaining).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Completed Discovery Workbook reviewed",
          required: true,
        }),
        expect.objectContaining({
          label: "Optional supporting evidence attached",
          required: false,
        }),
      ]),
    );
  });

  it("reconstructs a redirected blocker from the current phase URL", () => {
    const status = buildPhaseNavigationStatus({
      currentPhase: 1,
      requestedPhase: 1,
      blockedPhase: 2,
    });

    expect(status.canOpenRequestedPhase).toBe(true);
    expect(status.blockedRequest?.requestedPhase).toBe(2);
  });

  it("parses a phase query value without accepting invalid phases", () => {
    expect(parseRequestedPhase("2")).toBe(2);
    expect(parseRequestedPhase(["3"])).toBe(3);
    expect(parseRequestedPhase("not-a-phase")).toBeNull();
    expect(parseRequestedPhase("6")).toBeNull();
  });
});
