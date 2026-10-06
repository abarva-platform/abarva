/**
 * Set-difference reporting for the dark test directory ratchet.
 *
 * The ratchet used to compare `darkProductDirectories.length` against a
 * committed integer. That equality was correct — a decrease has to fail as
 * loudly as a rise — but two integers cannot say WHICH directories moved, and
 * the two actions a maintainer must choose between are opposites:
 *
 *   - a directory that ENTERED the dark set is the regression the gate exists
 *     to refuse;
 *   - a directory that LEFT it is a wiring to be recorded in the baseline.
 *
 * A change that does both at once moves the count by zero. That case is not
 * hypothetical bookkeeping: the ratchet's own log carries three entries
 * written only to explain, in prose, why a count did or did not move the way
 * a reader would expect. Per-directory is the resolution that makes those
 * judgements checkable instead of narrated.
 *
 * Nothing here loosens the equality. Both directions still fail; they now
 * fail by name.
 */

export const DARK_DIRECTORY_BASELINE_PATH =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

/**
 * The second ratchet built on this module, added by C-414.
 *
 * `programs-unit-directory-ci-coverage.test.ts` held the same equality as a
 * COUNT long after its sibling had been converted, for the reason its own
 * header gives: the conversion was a separate change with a separate id. It
 * keeps a separate list because the two gates are scoped to different roots
 * and a single file would make each one's failure ambiguous about which
 * ratchet moved.
 */
export const DARK_PROGRAMS_BASELINE_PATH =
  "src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json";

export const NO_DRIFT_MESSAGE =
  "no drift: the dark test directory set matches the committed baseline exactly";

export type DarkDirectoryDrift = {
  /** Dark now, absent from the baseline. The regression. */
  entered: string[];
  /** In the baseline, no longer dark. A wiring to record. */
  left: string[];
  inAgreement: boolean;
};

function assertClean(label: string, directories: readonly string[]): void {
  const seen = new Set<string>();
  for (const directory of directories) {
    if (seen.has(directory)) {
      throw new Error(
        `${label} contains a duplicate entry: ${directory}. A duplicate makes a ` +
          `set difference lie about what moved, so it is refused rather than ` +
          `collapsed.`,
      );
    }
    seen.add(directory);
  }
}

/**
 * Compare an observed dark set against the committed baseline.
 *
 * Order is not significant on either side — both are treated as sets — but a
 * duplicate is an error, not something to absorb quietly.
 */
export function diffDarkDirectories(
  baseline: readonly string[],
  observed: readonly string[],
): DarkDirectoryDrift {
  assertClean("baseline", baseline);
  assertClean("observed dark set", observed);

  const baselineSet = new Set(baseline);
  const observedSet = new Set(observed);

  const entered = [...observedSet].filter((d) => !baselineSet.has(d)).sort();
  const left = [...baselineSet].filter((d) => !observedSet.has(d)).sort();

  return {
    entered,
    left,
    inAgreement: entered.length === 0 && left.length === 0,
  };
}

function section(
  heading: string,
  directories: readonly string[],
  guidance: string,
): string {
  const body =
    directories.length === 0
      ? "    (none)"
      : directories.map((d) => `    - ${d}`).join("\n");
  return `  ${heading} (${directories.length}) — ${guidance}\n${body}`;
}

/**
 * Render the drift for a human reading a red CI job.
 *
 * Both sections are always printed when there is any drift, including an
 * empty one. That is deliberate: in the cancelling case the net count does
 * not move, and a reader has to be able to see two events rather than infer a
 * silence.
 *
 * `baselinePath` names the file the reader must edit. It defaults to the
 * product ratchet's baseline so the original caller is unchanged, and C-414
 * passes the programs one: a message that names the wrong file is worse than
 * one that names none, because the cheap correct action becomes a wrong edit
 * to a gate the change never touched.
 */
export function formatDarkDirectoryDrift(
  drift: DarkDirectoryDrift,
  baselinePath: string = DARK_DIRECTORY_BASELINE_PATH,
): string {
  if (drift.inAgreement) return NO_DRIFT_MESSAGE;

  return [
    `Dark test directory set has drifted from ${baselinePath}.`,
    "",
    section(
      "ENTERED the dark set",
      drift.entered,
      "NEW dark directories. This is the regression this gate refuses: each " +
        "holds tests no workflow runs. Wire them into CI rather than adding " +
        "them to the baseline.",
    ),
    "",
    section(
      "LEFT the dark set",
      drift.left,
      "wired into CI, or no longer resolving as fully uncovered. Remove these " +
        "lines from the baseline in the same change, and say in the commit " +
        "which it was — a directory moving out of the PARTIAL set is not the " +
        "same event as one being wired.",
    ),
  ].join("\n");
}
