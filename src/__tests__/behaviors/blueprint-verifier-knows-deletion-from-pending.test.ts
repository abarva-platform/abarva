import {
  retirementFor,
  runIntelTowerBlueprintVerification,
  type IntelTowerCheck,
} from "@/lib/qa/intelligence-tower-blueprint-verification";

/**
 * This verifier answers "is this file here" and, finding nothing, said
 * `deferred`: "not yet present … Deferred pending INTEL1 merge". For a
 * component the July shell retirement removed, that is the opposite of
 * true — it reads as a promise that the work is still coming.
 *
 * A check that cannot tell "not built yet" from "deliberately deleted"
 * reports the wrong state in whichever direction the tree moves. Splitting
 * the absent case is the fix; the cases below hold it to all three states
 * and, more importantly, to the boundary between the last two.
 */

function checkById(checks: readonly IntelTowerCheck[], id: string): IntelTowerCheck {
  const found = checks.find((c) => c.checkId === id);
  if (!found) throw new Error(`no check with id ${id}`);
  return found;
}

describe("the blueprint verifier tells a deletion from a pending merge", () => {
  it("reports a retired component as retired, naming what removed it", () => {
    // The live instance. IntelligenceRouteShell.tsx is absent because the
    // retirement removed it, and the route renders the advisory page
    // directly. It is not waiting on a merge.
    const report = runIntelTowerBlueprintVerification();
    const check = checkById(report.checks, "INTEL1-SHELL-01");

    expect(check.status).toBe("retired");
    expect(check.detail).toContain("Removed on purpose by I1");
    expect(check.detail).not.toContain("not yet present");
    // "not pending" legitimately contains "pending", so the thing to forbid
    // is the deferral sentence itself, not the word.
    expect(check.detail).not.toContain("Deferred pending");
  });

  it("still reports a present component as a pass", () => {
    // The control on the other side. TowerRouteShell.tsx exists, so the
    // new branch must not have swallowed the ordinary case.
    const report = runIntelTowerBlueprintVerification();
    const check = checkById(report.checks, "TOWER1-SHELL-01");

    expect(check.status).toBe("pass");
    expect(check.detail).toContain("Component found");
  });

  it("counts retired separately from deferred", () => {
    // Folding them together would leave the report saying the same wrong
    // thing in a summary line after saying the right thing per check.
    const report = runIntelTowerBlueprintVerification();

    expect(report.retiredCount).toBe(
      report.checks.filter((c) => c.status === "retired").length,
    );
    expect(report.deferredCount).toBe(
      report.checks.filter((c) => c.status === "deferred").length,
    );
    expect(report.retiredCount).toBeGreaterThan(0);

    // And no check is counted in both.
    for (const check of report.checks) {
      expect(["retired", "deferred"].filter((s) => s === check.status).length)
        .toBeLessThanOrEqual(1);
    }
  });

  it("does not call an unexplained absence a retirement", () => {
    // The rule that keeps `retired` meaning something. Only a path with a
    // recorded reason may claim it; everything else absent stays deferred,
    // which is the behaviour this had before and should keep.
    //
    // Asserted over the real report rather than a stub: every retired
    // check must name its cause, so a future entry added without evidence
    // fails here.
    const report = runIntelTowerBlueprintVerification();

    for (const check of report.checks) {
      if (check.status !== "retired") continue;
      expect(check.detail).toMatch(/Removed on purpose by \S+/);
      expect(check.detail.length).toBeGreaterThan(80);
    }

    for (const check of report.checks) {
      if (check.status !== "deferred") continue;
      // A deferred check is one nobody has explained, and it should still
      // say what it is waiting for.
      expect(check.detail).toMatch(/pre-integration|pending/i);
    }
  });

  it("does not promise in the caveat what it denied per check", () => {
    // The summary line said "All deferred checks will resolve to pass after
    // integration." Fixing the per-check detail and leaving that in place
    // would say the right thing once and the wrong thing again underneath.
    const report = runIntelTowerBlueprintVerification();

    expect(report.caveat).not.toContain("All deferred checks will resolve to pass");
    if (report.retiredCount > 0) {
      expect(report.caveat).toContain("Retired checks will not");
    }
  });

  it("answers the same way at the other seam that reads the same file", () => {
    // The presence check was not the only place the absent case was decided.
    // The caveat check reads the SAME retired shell for a marker string,
    // found nothing, and repeated the same "Deferred pending INTEL1 merge".
    // Fixing one and not the other leaves the report making the wrong
    // promise from whichever seam nobody looked at.
    const report = runIntelTowerBlueprintVerification();
    const caveat = checkById(report.checks, "INTEL1-CAVEAT-01");

    expect(caveat.status).toBe("retired");
    expect(caveat.detail).toContain("Removed on purpose by I1");
    expect(caveat.detail).not.toContain("Deferred pending");

    // And the equivalent check on the shell that still exists is unaffected.
    const towerCaveat = checkById(report.checks, "TOWER1-CAVEAT-01");
    expect(["pass", "fail"]).toContain(towerCaveat.status);
  });

  it("leaves every present component reporting exactly what it did", () => {
    // Four view-model checks were routed through the same shared verdict.
    // They all read paths that exist, so all four must still pass with the
    // noun they used before — the refactor is not allowed to change what a
    // passing check says.
    const report = runIntelTowerBlueprintVerification();

    const expected: ReadonlyArray<readonly [string, string]> = [
      ["INTEL2-CANVAS-01", "View model found: src/lib/intelligence/intelligence-workflow-canvas-view.ts"],
      ["INTEL3-EVID-01", "View model found: src/lib/intelligence/sentinel-brief-evidence-view.ts"],
      ["TOWER2-CANVAS-01", "Canvas model found: src/lib/tower/atlas-executive-brief-canvas.ts"],
      ["TOWER3-LENS-01", "View model found: src/lib/tower/control-tower-active-lens-view.ts"],
    ];

    for (const [id, detail] of expected) {
      const check = checkById(report.checks, id);
      expect(check.status).toBe("pass");
      expect(check.detail).toBe(detail);
    }
  });

  it("calls an absent path nobody has explained deferred, not retired", () => {
    // The negative control, driven directly at the seam.
    //
    // Every other blueprint path is present in the tree today, so the real
    // report exercises only the `retired` arm — a check written against the
    // report alone would pass with the `deferred` arm deleted. Driving the
    // classifier is what makes this case able to fail.
    expect(retirementFor("src/lib/does-not-exist-and-nobody-removed-it.ts"))
      .toBeUndefined();

    // A near-miss on the recorded path is not a retirement either: the
    // registry is keyed on the exact path a check reads, so a lookup that
    // ignored the key and handed back whatever entry it had first would be
    // wrong here even while the one real retirement still resolved.
    expect(retirementFor("src/components/intelligence/IntelligenceRouteShell.ts"))
      .toBeUndefined();
    expect(retirementFor("IntelligenceRouteShell.tsx")).toBeUndefined();

    // Inherited object properties are not retirements.
    expect(retirementFor("toString")).toBeUndefined();
    expect(retirementFor("constructor")).toBeUndefined();

    // And the one real entry still resolves, with its evidence attached.
    const real = retirementFor("src/components/intelligence/IntelligenceRouteShell.tsx");
    expect(real?.retiredBy).toBe("I1");
    expect(real?.evidence).toContain("shell retirement");
  });

  it("keeps the report deterministic", () => {
    // The module's own contract: no clock, no randomness. Two builds must
    // agree, or none of the counts above mean anything run to run.
    const first = runIntelTowerBlueprintVerification();
    const second = runIntelTowerBlueprintVerification();

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
