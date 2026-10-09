import {
  movesWorkspaceV2Spine,
  type MovesV2SpineStage,
} from "@/lib/programs/moves-workspace-v2-spine";

const TITLES = ["Scope the bet", "People & decisions", "Plan the proof"];

function byKind(
  stages: MovesV2SpineStage[],
  kind: MovesV2SpineStage["kind"],
): MovesV2SpineStage[] {
  return stages.filter((s) => s.kind === kind);
}

describe("movesWorkspaceV2Spine", () => {
  it("always appends exactly one generate, outcome and gate after the capture stages", () => {
    const stages = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 0,
      handoffReachable: false,
    });
    expect(stages.map((s) => s.kind)).toEqual([
      "capture",
      "capture",
      "capture",
      "generate",
      "outcome",
      "gate",
    ]);
    // Positions are sequential and 1-based across the whole spine.
    expect(stages.map((s) => s.position)).toEqual([1, 2, 3, 4, 5, 6]);
    // The capture labels are the phase's real step titles, in order.
    expect(byKind(stages, "capture").map((s) => s.label)).toEqual(TITLES);
  });

  it("marks the current capture step and leaves later capture/post stages upcoming", () => {
    const stages = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 0,
      handoffReachable: false,
    });
    const captures = byKind(stages, "capture");
    expect(captures.map((s) => s.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(byKind(stages, "generate")[0].state).toBe("upcoming");
    expect(byKind(stages, "outcome")[0].state).toBe("upcoming");
    expect(byKind(stages, "gate")[0].state).toBe("upcoming");
  });

  it("marks passed capture steps done and the current one current", () => {
    const captures = byKind(
      movesWorkspaceV2Spine({
        captureTitles: TITLES,
        view: 1,
        handoffReachable: false,
      }),
      "capture",
    );
    expect(captures.map((s) => s.state)).toEqual([
      "done",
      "current",
      "upcoming",
    ]);
  });

  it("lights GENERATE on the last capture step — where the flow produces output", () => {
    const onLast = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 2,
      handoffReachable: false,
    });
    expect(byKind(onLast, "generate")[0].state).toBe("current");
    // Not before the last step.
    const earlier = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 1,
      handoffReachable: false,
    });
    expect(byKind(earlier, "generate")[0].state).toBe("upcoming");
  });

  it("at the recap, every capture + generate reads done and OUTCOME is current", () => {
    const stages = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 3,
      handoffReachable: true,
    });
    expect(byKind(stages, "capture").map((s) => s.state)).toEqual([
      "done",
      "done",
      "done",
    ]);
    expect(byKind(stages, "generate")[0].state).toBe("done");
    expect(byKind(stages, "outcome")[0].state).toBe("current");
    expect(byKind(stages, "gate")[0].state).toBe("current");
  });

  it("navigates capture stages backward only — never forward", () => {
    const stages = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 1,
      handoffReachable: false,
    });
    const captures = byKind(stages, "capture");
    expect(captures[0].targetView).toBe(0); // done → clickable back to view 0
    expect(captures[1].targetView).toBeNull(); // current → no self-nav
    expect(captures[2].targetView).toBeNull(); // upcoming → not reachable forward
  });

  it("lets any capture step be selected from the recap (all are behind you)", () => {
    const captures = byKind(
      movesWorkspaceV2Spine({
        captureTitles: TITLES,
        view: 3,
        handoffReachable: true,
      }),
      "capture",
    );
    expect(captures.map((s) => s.targetView)).toEqual([0, 1, 2]);
  });

  it("makes OUTCOME navigable to the recap only when the host says it is reachable", () => {
    const reachable = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 2,
      handoffReachable: true,
    });
    expect(byKind(reachable, "outcome")[0].targetView).toBe(3);

    const closed = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 2,
      handoffReachable: false,
    });
    // Mirrors the product's closed recap (approveSlot present, no review): a
    // marker, not a new path into view 3.
    expect(byKind(closed, "outcome")[0].targetView).toBeNull();
  });

  it("opens OUTCOME when a findings surface is present, even with the recap closed", () => {
    // Increment 2: the findings surface is a no-submit review, so it makes
    // OUTCOME navigable to view 3 where the plain recap would stay a marker.
    const stages = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 2,
      handoffReachable: false,
      outcomeFindingsPresent: true,
    });
    const outcome = byKind(stages, "outcome")[0];
    expect(outcome.targetView).toBe(3);
    // It labels the stage "Findings" rather than the generic "Review".
    expect(outcome.label).toBe("Findings");
  });

  it("without a findings surface, OUTCOME stays labelled Review and closed", () => {
    const outcome = byKind(
      movesWorkspaceV2Spine({
        captureTitles: TITLES,
        view: 2,
        handoffReachable: false,
        outcomeFindingsPresent: false,
      }),
      "outcome",
    )[0];
    expect(outcome.label).toBe("Review");
    expect(outcome.targetView).toBeNull();
  });

  it("keeps GENERATE and GATE as non-interactive markers", () => {
    const stages = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 2,
      handoffReachable: true,
    });
    expect(byKind(stages, "generate")[0].targetView).toBeNull();
    expect(byKind(stages, "gate")[0].targetView).toBeNull();
  });

  // ─── the navigational stage is distinct from the emphasis channel ──────────
  // `state === "current"` is shared with a co-located marker by design; only
  // `isCurrentView` may drive `aria-current`, which names ONE item in a set.

  it("marks exactly one stage as the current VIEW at every view", () => {
    for (const outcomeFindingsPresent of [false, true]) {
      for (const view of [0, 1, 2, 3]) {
        const stages = movesWorkspaceV2Spine({
          captureTitles: TITLES,
          view,
          handoffReachable: false,
          outcomeFindingsPresent,
        });
        expect(stages.filter((s) => s.isCurrentView)).toHaveLength(1);
      }
    }
  });

  it("the current VIEW is the rendered capture step, and the recap screen is OUTCOME", () => {
    const current = (view: number) =>
      movesWorkspaceV2Spine({
        captureTitles: TITLES,
        view,
        handoffReachable: false,
      }).find((s) => s.isCurrentView);

    expect(current(0)).toMatchObject({ kind: "capture", label: TITLES[0] });
    expect(current(1)).toMatchObject({ kind: "capture", label: TITLES[1] });
    // The last capture step, NOT the GENERATE bridge that lights beside it.
    expect(current(2)).toMatchObject({ kind: "capture", label: TITLES[2] });
    // At the recap the flow renders the OUTCOME screen, not the GATE marker.
    expect(current(3)).toMatchObject({ kind: "outcome" });
  });

  it("the GENERATE and GATE markers are never the current view, even when they carry the emphasis", () => {
    // view 2: GENERATE lights beside the last capture step.
    const onLast = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 2,
      handoffReachable: false,
    });
    expect(byKind(onLast, "generate")[0].state).toBe("current");
    expect(byKind(onLast, "generate")[0].isCurrentView).toBe(false);

    // view 3: GATE lights beside OUTCOME (the approve control travels there).
    const atRecap = movesWorkspaceV2Spine({
      captureTitles: TITLES,
      view: 3,
      handoffReachable: true,
    });
    expect(byKind(atRecap, "gate")[0].state).toBe("current");
    expect(byKind(atRecap, "gate")[0].isCurrentView).toBe(false);
  });

  it("leaves the emphasis channel alone: two stages still read current at views 2 and 3", () => {
    // The shell's intended look is unchanged by the aria fix — this pins that
    // the fix did not quietly re-style the spine.
    const emphasis = (view: number) =>
      movesWorkspaceV2Spine({
        captureTitles: TITLES,
        view,
        handoffReachable: true,
      })
        .filter((s) => s.state === "current")
        .map((s) => s.kind);

    expect(emphasis(0)).toEqual(["capture"]);
    expect(emphasis(2)).toEqual(["capture", "generate"]);
    expect(emphasis(3)).toEqual(["outcome", "gate"]);
  });

  it("never marks more than one current view when the capture set is short or empty", () => {
    for (const captureTitles of [[], TITLES.slice(0, 1), TITLES.slice(0, 2)]) {
      for (const view of [0, 1, 2, 3]) {
        const stages = movesWorkspaceV2Spine({
          captureTitles,
          view,
          handoffReachable: false,
        });
        expect(
          stages.filter((s) => s.isCurrentView).length,
        ).toBeLessThanOrEqual(1);
      }
    }
  });
});
