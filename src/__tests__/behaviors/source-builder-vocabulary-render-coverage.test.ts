import fs from "node:fs";
import path from "node:path";

import {
  AUDITED_SURFACE_ROOTS,
  COVERAGE_ARTIFACT,
  REACHABILITY_ARTIFACT,
  SOURCE_COMPONENT_DIR,
  measureRenderCoverage,
  type CoverageInputs,
} from "@/testing/source-builder-vocabulary-coverage";
// The same graph walk the route-reachability audit and the route-ownership map
// use. Three audits asking what a root reaches must not be able to disagree
// about the answer.
import {
  isExcluded,
  reachableFrom,
  walk,
} from "../../../scripts/audit/lib/route-reachability.mjs";

/**
 * Item U-405. `source-surface-builder-vocabulary.test.tsx` is a render-measured
 * control over **three** screens, and nothing anywhere said so. `N3`'s done-when
 * is a statement about shipped Source UI; a reader of the suite name, or of the
 * `2026-09-24-source-builder-vocabulary-render-control.md` release record, could
 * not tell a control over the Source surface from a control over three
 * components.
 *
 * This gate makes the coverage a committed, derived number that fails in **both**
 * directions:
 *
 *   - a Source component added to the tree and not audited moves `remainder`,
 *     so the artifact goes stale and this reddens naming the path;
 *   - an audited surface dropped from the render suite moves `coveredUpperBound`,
 *     so this reddens naming that surface;
 *   - an audited root that changes reachability makes its declaration stale, so
 *     the exemption cannot outlive its subject.
 *
 * Every assertion below is **per path or per root**, never a container-wide
 * count. A count is satisfied by a sibling: two paths swapping places leaves a
 * total unmoved, and the failure would not say which entry drifted.
 *
 * ## The population comes from the tree, not from a list here
 *
 * A hand-kept coverage figure only fails upward, which is the baseline defect
 * this backlog has now filed four times. The population is walked from
 * `src/components/source`; reachability is read from the repository's own
 * `unreachable-components.json`; the covered set is computed from the import
 * graph. Nothing in this file names a component except the three roots the
 * control mounts, and those are declared precisely so that dropping one is
 * detectable.
 *
 * ## Regenerating the artifact
 *
 * The numbers move legitimately whenever Source gains or loses a component.
 * Re-measure with:
 *
 *   ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE=1 npx jest --runTestsByPath \
 *     src/__tests__/behaviors/source-builder-vocabulary-render-coverage.test.ts
 *
 * Read the diff before committing it: a remainder that grew is work arriving
 * unaudited, which is the thing this measures, not noise to be re-baselined
 * away.
 */

const repoRoot = path.resolve(__dirname, "../../..");

function readInputs(): CoverageInputs {
  const sourceComponentFiles = (walk(path.join(repoRoot, SOURCE_COMPONENT_DIR)) as string[])
    .map((absolute) => path.relative(repoRoot, absolute))
    .filter((relative) => relative.endsWith(".tsx") && !isExcluded(relative))
    .sort();

  const unreachablePaths: string[] = JSON.parse(
    fs.readFileSync(path.join(repoRoot, REACHABILITY_ARTIFACT), "utf8"),
  ).orphans;

  const closureByRoot: Record<string, string[]> = {};
  for (const root of AUDITED_SURFACE_ROOTS) {
    closureByRoot[root.path] = [
      ...(reachableFrom(repoRoot, root.path) as Set<string>),
    ]
      .map((absolute) => path.relative(repoRoot, absolute))
      .sort();
  }

  return { sourceComponentFiles, unreachablePaths, closureByRoot };
}

interface CommittedCoverage {
  readonly population: {
    readonly sourceComponentFiles: number;
    readonly unreachable: number;
    readonly routeReachable: number;
  };
  readonly auditedRoots: readonly {
    readonly surfaceName: string;
    readonly path: string;
    readonly routeReachable: boolean;
    readonly importClosureFiles: number;
  }[];
  readonly coverage: {
    readonly coveredUpperBound: number;
    readonly population: number;
    readonly remainder: number;
  };
  readonly coveredPaths: readonly string[];
  readonly remainderPaths: readonly string[];
}

const inputs = readInputs();
const measured = measureRenderCoverage(inputs);

const artifactPath = path.join(repoRoot, COVERAGE_ARTIFACT);

if (process.env.ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE === "1") {
  fs.writeFileSync(
    artifactPath,
    `${JSON.stringify(
      {
        note:
          "How much of the shipped Source surface the render-measured " +
          "builder-vocabulary control audits. Derived, never hand-edited — " +
          "regenerate with ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE=1 on " +
          "src/__tests__/behaviors/source-builder-vocabulary-render-coverage.test.ts.",
        item: "U-405",
        control:
          "src/components/source/__tests__/source-surface-builder-vocabulary.test.tsx",
        method:
          "Population: non-test .tsx under src/components/source, walked with " +
          "the same walk/isExcluded the route-reachability audit uses. " +
          "Reachability: docs/architecture/unreachable-components.json. " +
          "Covered: the transitive IMPORT closure of each audited root, " +
          "intersected with the route-reachable population.",
        upperBoundCaveat:
          "coveredUpperBound is an UPPER bound on what the control proves: an " +
          "import closure is a superset of a render closure, because importing " +
          "a module is not rendering it and a branch the fixtures never take " +
          "renders nothing. remainderPaths is therefore a sound LOWER bound on " +
          "the gap — no audited root can reach any of them under any props.",
        population: {
          sourceComponentFiles: measured.sourceComponentFiles.length,
          unreachable: measured.unreachable.length,
          routeReachable: measured.routeReachable.length,
        },
        auditedRoots: AUDITED_SURFACE_ROOTS.map((root) => ({
          surfaceName: root.surfaceName,
          path: root.path,
          routeReachable: root.routeReachable,
          unreachableReason: root.unreachableReason,
          importClosureFiles: measured.closureSizeByRoot[root.path],
        })),
        coverage: {
          coveredUpperBound: measured.coveredUpperBound.length,
          population: measured.routeReachable.length,
          remainder: measured.remainder.length,
        },
        coveredPaths: measured.coveredUpperBound,
        remainderPaths: measured.remainder,
      },
      null,
      2,
    )}\n`,
  );
}

if (!fs.existsSync(artifactPath)) {
  // Fails closed, and says how to fix it. A guard whose "could not tell" case
  // passes is opt-in, and the first file to reach it is the one that predates
  // the guard.
  throw new Error(
    `${COVERAGE_ARTIFACT} is missing, so no coverage number is committed for ` +
      `the builder-vocabulary render control. Generate it:\n` +
      `  ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE=1 npx jest --runTestsByPath ` +
      `src/__tests__/behaviors/source-builder-vocabulary-render-coverage.test.ts`,
  );
}

const committed: CommittedCoverage = JSON.parse(
  fs.readFileSync(artifactPath, "utf8"),
);

/** Set difference reported in both directions, so a failure names the drift. */
function drift(
  committedValues: readonly string[],
  measuredValues: readonly string[],
): { added: string[]; removed: string[] } {
  const inCommitted = new Set(committedValues);
  const inMeasured = new Set(measuredValues);
  return {
    added: measuredValues.filter((p) => !inCommitted.has(p)),
    removed: committedValues.filter((p) => !inMeasured.has(p)),
  };
}

describe("Source builder-vocabulary render control · declared coverage", () => {
  it("reconciles the population: reachable plus unreachable equals the tree, with nothing outside", () => {
    // 205 = 102 + 103 with zero orphan paths outside the component set is what
    // makes the subtraction a subtraction rather than an estimate. Asserted
    // rather than quoted.
    expect(
      measured.routeReachable.length + measured.unreachable.length,
    ).toBe(measured.sourceComponentFiles.length);
    expect(measured.orphansOutsidePopulation).toEqual([]);
    expect(measured.sourceComponentFiles.length).toBeGreaterThan(0);
  });

  it.each(AUDITED_SURFACE_ROOTS.map((r) => [r.path, r] as const))(
    "%s is a real file and its declared reachability is still true",
    (_path, root) => {
      expect(fs.existsSync(path.join(repoRoot, root.path))).toBe(true);

      const unreachable = new Set(inputs.unreachablePaths);
      // Both directions. A root declared unreachable that becomes reachable is
      // a stale exemption; a root declared reachable that goes dead is coverage
      // billed for a screen nobody can open. Neither may pass quietly.
      expect(unreachable.has(root.path)).toBe(!root.routeReachable);

      // An unreachable audited root must carry its reason where the coverage
      // claim is. An exemption without one is how a baseline stops meaning
      // anything.
      if (!root.routeReachable) {
        expect(root.unreachableReason ?? "").not.toBe("");
      } else {
        expect(root.unreachableReason).toBeUndefined();
      }
    },
  );

  it.each(AUDITED_SURFACE_ROOTS.map((r) => [r.path, r] as const))(
    "%s is the root the committed artifact records, with the closure size it records",
    (_path, root) => {
      const recorded = committed.auditedRoots.find((r) => r.path === root.path);
      expect(
        recorded
          ? ""
          : `Audited root "${root.path}" ("${root.surfaceName}") is declared in ` +
              `AUDITED_SURFACE_ROOTS but absent from ${COVERAGE_ARTIFACT}. ` +
              `Regenerate the artifact.`,
      ).toBe("");
      expect(recorded?.surfaceName).toBe(root.surfaceName);
      expect(recorded?.routeReachable).toBe(root.routeReachable);
      expect(recorded?.importClosureFiles).toBe(
        measured.closureSizeByRoot[root.path],
      );
    },
  );

  it("records no audited root the control no longer mounts", () => {
    // The other direction of the case above: a surface dropped from the render
    // suite must redden here by name rather than shrink a total.
    const declared = new Set(AUDITED_SURFACE_ROOTS.map((r) => r.path));
    const orphaned = committed.auditedRoots
      .filter((r) => !declared.has(r.path))
      .map((r) => `${r.path} ("${r.surfaceName}")`);
    expect(
      orphaned.length === 0
        ? ""
        : `${COVERAGE_ARTIFACT} bills coverage for roots the control no longer ` +
            `mounts: ${orphaned.join("; ")}. Either restore the surface in ` +
            `source-surface-builder-vocabulary.test.tsx or regenerate the ` +
            `artifact so the coverage number drops with it.`,
    ).toBe("");
  });

  it("the committed covered set is exactly the measured one", () => {
    const { added, removed } = drift(
      committed.coveredPaths,
      measured.coveredUpperBound,
    );
    expect(
      added.length === 0 && removed.length === 0
        ? ""
        : `Covered set drifted.\n  now covered, not in the artifact: ` +
            `${added.join(", ") || "(none)"}\n  in the artifact, no longer ` +
            `covered: ${removed.join(", ") || "(none)"}\nRegenerate with ` +
            `ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE=1.`,
    ).toBe("");
  });

  it("the committed remainder is exactly the measured one", () => {
    const { added, removed } = drift(
      committed.remainderPaths,
      measured.remainder,
    );
    expect(
      added.length === 0 && removed.length === 0
        ? ""
        : `Unaudited remainder drifted.\n  newly unaudited (work arrived and ` +
            `nothing audits it): ${added.join(", ") || "(none)"}\n  no longer ` +
            `in the remainder: ${removed.join(", ") || "(none)"}\nRegenerate ` +
            `with ABARVA_UPDATE_SOURCE_VOCAB_COVERAGE=1 — and read the diff, ` +
            `because a remainder that grew is the thing this measures.`,
    ).toBe("");
  });

  it("the committed totals equal the lengths of the committed lists", () => {
    // A number typed beside a list it does not describe is how a coverage claim
    // survives the list it was derived from.
    expect(committed.coverage.coveredUpperBound).toBe(
      committed.coveredPaths.length,
    );
    expect(committed.coverage.remainder).toBe(committed.remainderPaths.length);
    expect(committed.coverage.population).toBe(
      committed.coveredPaths.length + committed.remainderPaths.length,
    );
    expect(committed.population.routeReachable).toBe(
      committed.coverage.population,
    );
    expect(committed.population.sourceComponentFiles).toBe(
      committed.population.routeReachable + committed.population.unreachable,
    );
  });

  it("does not count an unreachable audited root toward coverage", () => {
    // Item 41's verdict, asserted rather than trusted to a comment. The screen
    // stays audited; it does not become coverage of shipped UI.
    for (const root of AUDITED_SURFACE_ROOTS) {
      if (root.routeReachable) continue;
      expect(committed.coveredPaths).not.toContain(root.path);
      expect(committed.remainderPaths).not.toContain(root.path);
    }
  });
});

describe("the coverage measurement can actually move", () => {
  /**
   * Proving the gate above can fail requires showing the measurement responds
   * to each change by exactly one, per entry. Doing that against the real tree
   * would mean adding and deleting components inside a run, which is what made
   * this directory non-deterministically red once already (item T-759). So the
   * arithmetic is proven over a synthetic tree instead, and the real-tree
   * mutation is recorded in the pull request.
   */
  const base: CoverageInputs = {
    sourceComponentFiles: [
      "src/components/source/A.tsx",
      "src/components/source/B.tsx",
      "src/components/source/Dead.tsx",
    ],
    unreachablePaths: ["src/components/source/Dead.tsx"],
    closureByRoot: {
      "src/components/source/A.tsx": [
        "src/components/source/A.tsx",
        "src/lib/source/thing.ts",
      ],
    },
  };

  it("counts only route-reachable components a root's graph reaches", () => {
    const m = measureRenderCoverage(base);
    expect(m.coveredUpperBound).toEqual(["src/components/source/A.tsx"]);
    expect(m.remainder).toEqual(["src/components/source/B.tsx"]);
    expect(m.unreachable).toEqual(["src/components/source/Dead.tsx"]);
  });

  it("adding one unaudited route-reachable component moves the remainder by exactly one, and names it", () => {
    const withNew = measureRenderCoverage({
      ...base,
      sourceComponentFiles: [
        ...base.sourceComponentFiles,
        "src/components/source/New.tsx",
      ],
    });
    const before = measureRenderCoverage(base);
    expect(withNew.remainder.length - before.remainder.length).toBe(1);
    // Naming it is the point: a container-wide count is satisfied by a sibling.
    expect(
      withNew.remainder.filter((p) => !before.remainder.includes(p)),
    ).toEqual(["src/components/source/New.tsx"]);
    expect(withNew.coveredUpperBound).toEqual(before.coveredUpperBound);
  });

  it("dropping an audited root drops exactly that path from the covered set", () => {
    const withoutRoot = measureRenderCoverage({ ...base, closureByRoot: {} });
    const before = measureRenderCoverage(base);
    expect(
      before.coveredUpperBound.filter(
        (p) => !withoutRoot.coveredUpperBound.includes(p),
      ),
    ).toEqual(["src/components/source/A.tsx"]);
    expect(withoutRoot.remainder).toContain("src/components/source/A.tsx");
  });

  it("an unreachable component a root DOES reach is still not coverage", () => {
    const m = measureRenderCoverage({
      ...base,
      closureByRoot: {
        ...base.closureByRoot,
        "src/components/source/Dead.tsx": ["src/components/source/Dead.tsx"],
      },
    });
    expect(m.coveredUpperBound).toEqual(["src/components/source/A.tsx"]);
    expect(m.remainder).not.toContain("src/components/source/Dead.tsx");
  });

  it("reports an orphan path outside the population rather than silently subtracting it", () => {
    const m = measureRenderCoverage({
      ...base,
      unreachablePaths: [
        ...base.unreachablePaths,
        "src/components/source/Vanished.tsx",
      ],
    });
    expect(m.orphansOutsidePopulation).toEqual([
      "src/components/source/Vanished.tsx",
    ]);
  });
});
