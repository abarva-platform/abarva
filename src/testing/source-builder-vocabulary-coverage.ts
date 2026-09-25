/**
 * Item U-405: how much of the shipped Source surface does the render-measured
 * builder-vocabulary control actually audit?
 *
 * `source-surface-builder-vocabulary.test.tsx` is a good control — it measures
 * rendered DOM text rather than source bytes, drives each surface the way an
 * operator would, and fails in both directions on its adjudication table. What
 * it never said is **how much it covers**. Its `SURFACES` array has three
 * entries; `src/components/source` holds 205 non-test `.tsx` files, 102 of them
 * route-reachable. A reader of the suite name, or of its release record, had no
 * way to tell a control over the Source surface from a control over three
 * screens.
 *
 * That is the shape backlog item 41 recorded on the Tower component and the
 * shape `N3`'s done-when assumes away: a statement about shipped UI, with no
 * number anywhere saying what fraction of it is proven.
 *
 * ## Why the number is derived here rather than written down
 *
 * A hand-kept coverage figure only ever fails upward. It is correct on the day
 * it is typed, and from then on every component added to Source silently
 * widens the gap it claims to measure. This repository has settled that twice
 * already — tenants come from `CANONICAL_TENANT_KEYS`, and the stage-front
 * exemption in the render suite is derived from the canonical requirement set
 * rather than re-typed as a list. Same rule here: the population comes from the
 * tree and from the repository's own reachability artifact, and the covered set
 * comes from the import graph, so a component added later is counted without
 * anyone editing this file.
 *
 * ## What "covered" means, stated precisely, because it is an upper bound
 *
 * A render root audits the rendered text of everything it actually mounts. The
 * closure computed here is the **transitive import** closure, which is a
 * superset of the render closure: importing a module is not rendering it, and a
 * branch the fixture props never take renders nothing. So:
 *
 *   - `covered` is an **upper bound** on what the control proves. A path in it
 *     is reached by the audited root's import graph; whether its text reached
 *     the DOM under the suite's fixtures is not decided here.
 *   - `remainder` is therefore a **sound lower bound on the gap**. Nothing in
 *     it is audited under any props, because the audited roots cannot reach it
 *     at all.
 *
 * The gap is the number that matters, and it is the one this measurement gets
 * right. Quoting `covered` as if it were proven coverage would be U-405's own
 * defect in miniature, which is why it is named an upper bound everywhere it
 * appears.
 */

/** A component file the render control mounts directly. */
export interface AuditedSurfaceRoot {
  /**
   * The `SURFACES` entry name in the render suite, verbatim. The render suite
   * asserts the two agree per entry, so dropping a surface there reddens this
   * declaration by name rather than quietly shrinking a count.
   */
  readonly surfaceName: string;
  /** Repo-relative path of the component the suite mounts. */
  readonly path: string;
  /**
   * Whether a route can reach this root, as the repository's own reachability
   * artifact answers it. Declared rather than computed so the gate can fail in
   * both directions: a root that becomes reachable, or stops being reachable,
   * makes this line stale and must reopen the question.
   */
  readonly routeReachable: boolean;
  /**
   * Required exactly when `routeReachable` is false. An audited screen no user
   * can open is not coverage of shipped UI, and the reason has to be written
   * down where the coverage claim is, not inferred by the next reader.
   */
  readonly unreachableReason?: string;
}

/**
 * The three roots the render control mounts today.
 *
 * `SimpleStageFront` is deliberately still audited and deliberately not
 * counted. U-405 is explicit that deleting it is the wrong resolution — a
 * render proof that runs is not the problem — and item 41 is the precedent for
 * the other half: an unreachable component's proof must not be billed as
 * coverage of shipped UI.
 */
export const AUDITED_SURFACE_ROOTS: readonly AuditedSurfaceRoot[] = [
  {
    surfaceName: "renewal cockpit · action bar (all panels opened)",
    path: "src/components/source/RenewalCockpitActionBar.tsx",
    routeReachable: true,
  },
  {
    surfaceName: "stage front · working session guide",
    path: "src/components/source/canvas/SimpleStageFront.tsx",
    routeReachable: false,
    unreachableReason:
      "No file outside a test imports it — verified by search, and it is in " +
      "the orphans list of docs/architecture/unreachable-components.json. It " +
      "stays audited because it is the surface carrying the derived " +
      "canonical-critical-field exemption, and a render proof that runs is " +
      "worth keeping; it is excluded from the coverage numerator because a " +
      "screen no route can open is not shipped UI. Same verdict item 41 " +
      "records for ProgramPressureCards.",
  },
  {
    surfaceName: "artifact blocker list",
    path: "src/components/source/canvas/ArtifactBlockerList.tsx",
    routeReachable: true,
  },
];

/** The tree whose shipped surface `N3` is a statement about. */
export const SOURCE_COMPONENT_DIR = "src/components/source";

/** The repository's own answer to "can a route reach this file". */
export const REACHABILITY_ARTIFACT =
  "docs/architecture/unreachable-components.json";

/** Where the measurement is committed, so a reader can quote a number. */
export const COVERAGE_ARTIFACT =
  "docs/architecture/source-builder-vocabulary-render-coverage.json";

export interface CoverageInputs {
  /** Every non-test `.tsx` under `SOURCE_COMPONENT_DIR`, repo-relative. */
  readonly sourceComponentFiles: readonly string[];
  /** Every path the reachability artifact lists as reachable by no route. */
  readonly unreachablePaths: readonly string[];
  /** Audited root path → its transitive import closure, repo-relative. */
  readonly closureByRoot: Readonly<Record<string, readonly string[]>>;
}

export interface CoverageMeasurement {
  /** Non-test `.tsx` under the Source component tree, sorted. */
  readonly sourceComponentFiles: readonly string[];
  /** Those of them a route cannot reach, sorted. */
  readonly unreachable: readonly string[];
  /** Those of them a route can reach — the population `N3` speaks about. */
  readonly routeReachable: readonly string[];
  /**
   * Orphan paths under the Source component tree that are not in the file
   * population. Must be empty, or the subtraction below is not a subtraction;
   * reported rather than assumed so the reconciliation is checkable.
   */
  readonly orphansOutsidePopulation: readonly string[];
  /** Route-reachable population members some audited root's graph reaches. */
  readonly coveredUpperBound: readonly string[];
  /** Route-reachable population members no audited root's graph reaches. */
  readonly remainder: readonly string[];
  /** Audited root path → closure size, for reporting how wide each walk was. */
  readonly closureSizeByRoot: Readonly<Record<string, number>>;
}

function sorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

/**
 * Derive the coverage measurement from inputs.
 *
 * Pure on purpose: the behavioral gate feeds it the real tree and compares the
 * result with the committed artifact, and the unit cases feed it a synthetic
 * tree to prove the arithmetic moves by exactly one in each direction. A
 * measurement whose only caller is the thing it measures cannot be shown to
 * move at all.
 */
export function measureRenderCoverage(
  inputs: CoverageInputs,
): CoverageMeasurement {
  const population = sorted(inputs.sourceComponentFiles);
  const unreachableAll = new Set(inputs.unreachablePaths);
  const inTree = population.filter((p) => unreachableAll.has(p));
  const routeReachable = population.filter((p) => !unreachableAll.has(p));

  const orphansOutsidePopulation = sorted(
    [...unreachableAll].filter(
      (p) => p.startsWith(`${SOURCE_COMPONENT_DIR}/`) && !population.includes(p),
    ),
  );

  const closureUnion = new Set<string>();
  const closureSizeByRoot: Record<string, number> = {};
  for (const [root, closure] of Object.entries(inputs.closureByRoot)) {
    closureSizeByRoot[root] = new Set(closure).size;
    for (const file of closure) closureUnion.add(file);
  }

  const coveredUpperBound = routeReachable.filter((p) => closureUnion.has(p));
  const remainder = routeReachable.filter((p) => !closureUnion.has(p));

  return {
    sourceComponentFiles: population,
    unreachable: sorted(inTree),
    routeReachable,
    orphansOutsidePopulation,
    coveredUpperBound,
    remainder,
    closureSizeByRoot,
  };
}
