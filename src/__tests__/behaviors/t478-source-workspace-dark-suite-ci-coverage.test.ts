import { readFileSync } from "node:fs";
import path from "node:path";

import { collectReachableCommands } from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * T-478. The census's rank-2 governed-risk directory,
 * `src/app/(maestro)/source/preview/workspace/__tests__` — band `high`, signal
 * `tenant_scoped_read` — held seven of its 35 files unwired, in two distinct
 * shapes. At T-478 three were wired and four held. T-764 then rewrote
 * `page-tenant-routing.test.ts` from a source-text scanner into a suite that
 * executes the route and wired it, so the draw is now four wired and three
 * held, and the directory resolves 33 product sources rather than 31 because
 * that rewrite imports the two route modules it drives. This file holds both
 * halves of the disposition in place.
 *
 * **The lists are read, not copied.** Both come out of
 * `docs/architecture/t478-source-workspace-wiring-triage.json` at run time. A
 * hand-copied second list is a second place to forget, and here it would be
 * worse than usual: the record is the only document that says why three of
 * these are wanted in CI and four are not.
 *
 * **Why the positive assertion reads the trigger, not just the command.** Two
 * of the seven were already `collected: true, covered: true`. They were reached
 * only `via: ["script-file"]` — `COMMAND_CHECKS` in
 * `scripts/ecl/run_product_ecl_predeploy_gate.mjs` names them, and the only
 * workflow running that gate is `ecl-product-live-proof.yml`, whose triggers
 * are `workflow_dispatch` and `workflow_run` after "ACA main deploy". Neither
 * is `pull_request` or `merge_group`, so they ran green AFTER the deploy they
 * might have stopped. Measured on `274967083`: each had one reaching command
 * and zero merge-blocking ones. A guard that asked only "does some command
 * name this file" would have passed on the day the defect was filed, which is
 * why every case below filters on `pullRequest`.
 *
 * **Why the negative half is asserted at all.** Three of the seven are
 * source-text scanners (four, before T-764 discharged one by rewriting it): they read source files at module scope and assert
 * substrings of them, so a comment carrying the same substring satisfies the
 * case. The repository's standing rule is that such a file cannot be wired
 * into CI — wiring it buys a green check and no protection. The easiest wrong
 * fix for this item is a directory sweep, which would satisfy every positive
 * case here and quietly make the remaining scanners merge-blocking. The
 * negative cases are what make the positive ones mean "named individually"
 * rather than "reached". The legitimate way off the held list is the one T-764
 * took: stop being a scanner, then wire.
 *
 * Reachability is answered by the census's own four-hop resolver — workflow run
 * step, npm script, repo script file, ratchet baseline — never by searching
 * `.github/workflows` for a string. That grep answers "does a workflow NAME
 * this path", which is a different question.
 */
const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD =
  "docs/architecture/t478-source-workspace-wiring-triage.json";

type Suite = {
  path: string;
  verdict: "wired" | "held_unwired" | string;
  sourceTextScanner: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  pendingTests: number;
  // Present only on an entry whose verdict has been superseded; see the
  // discharge case below.
  priorVerdict?: string | null;
  priorVerdictStatus?: string | null;
  priorVerdictRationale?: string | null;
  reverificationCondition?: string | null;
  ownerItem?: string | null;
};

const record = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as { directory: string; suites: Suite[] };

const WIRED = record.suites.filter((suite) => suite.verdict === "wired");
const HELD = record.suites.filter((suite) => suite.verdict === "held_unwired");

/**
 * The census's own matching rule, which is neither the shell's nor Jest's: a
 * command names a path when the exact path appears as a whole token, with
 * shell quoting around it allowed. Reproduced from the sibling
 * `t557-unrun-suite-wiring.test.ts` because the census does not export it.
 * Substring matching would report the `.test.ts` render mode as named by a
 * command that only names `.test.tsx`, and those two take opposite verdicts
 * here — so the two halves of this file would disagree with each other.
 */
function commandNamesExactly(command: string, testPath: string): boolean {
  const escaped = testPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[\\s"'\\x60=,(\\[])${escaped}(?=$|[\\s"'\\x60,)\\]])`,
  ).test(command);
}

/**
 * The file itself and every ancestor directory of it, which together are what
 * the census means by "a command naming it or a directory above it". Used only
 * by the held half: the wired half must be named by its EXACT path, because a
 * directory that also holds a scanner is not an acceptable way to wire one.
 */
function selectorsFor(testPath: string): string[] {
  const selectors = [testPath];
  let directory = path.dirname(testPath);
  while (directory !== "." && directory !== "/" && directory !== "") {
    selectors.push(directory);
    directory = path.dirname(directory);
  }
  return selectors;
}

function mergeBlockingCommands(): string[] {
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;

  const { reachable } = collectReachableCommands(repoRoot, scripts) as {
    reachable: Array<{ pullRequest: boolean; command: string }>;
  };

  return reachable
    .filter((entry) => entry.pullRequest)
    .map((entry) => entry.command);
}

const commands = mergeBlockingCommands();

describe("T-478 Source workspace dark-suite disposition", () => {
  it("reads both verdicts out of the record, so no case below iterates an empty list", () => {
    // Non-vacuous first. A renamed verdict string or a moved record would turn
    // every case in this file into a passing assertion about nothing.
    //
    // Stated per file rather than as a pair of counts. The counts were 3 and 4
    // until T-764 rewrote `page-tenant-routing.test.ts` from a scanner into an
    // executed-route suite and wired it, making them 4 and 3 — and a count
    // cannot say WHICH verdict moved, so updating one is indistinguishable from
    // two moving in opposite directions. This map fails in both directions and
    // names the file when it does.
    const disposition = Object.fromEntries(
      record.suites.map((suite) => [suite.path, suite.verdict]),
    );

    expect(disposition).toEqual({
      "src/app/(maestro)/source/preview/workspace/__tests__/contractDetailRetry.test.tsx":
        "wired",
      "src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.browser.test.tsx":
        "wired",
      "src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts":
        "wired",
      "src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts":
        "wired",
      "src/app/(maestro)/source/preview/workspace/__tests__/sourceFreshness.test.tsx":
        "held_unwired",
      "src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts":
        "held_unwired",
      "src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts":
        "held_unwired",
    });
    // And the derived lists both still have members, which is what the cases
    // below iterate.
    expect(WIRED.length).toBe(4);
    expect(HELD.length).toBe(3);
  });

  it("records a discharge rather than a silent flip when a held verdict moves", () => {
    // T-763's subject is verdicts that outlive their reason. The inverse failure
    // is a verdict quietly reversed with no trace of what it used to say, which
    // would leave this file's expectations looking like they were always 4/3.
    // Any suite now wired that the record shows was previously held must carry
    // the discharge fields.
    const discharged = record.suites.filter(
      (suite) => suite.verdict === "wired" && suite.priorVerdict === "held_unwired",
    );

    // Non-vacuous, but deliberately NOT a pinned list of paths. The identity of
    // the discharged set is already pinned by the verdict map above, and pinning
    // it a second time here would make the next legitimate discharge fail this
    // case for doing the right thing. What this case is for is the fields, so it
    // asserts the fields on whatever is in the set and only that the set is not
    // empty — a renamed `priorVerdict` empties it and fails here.
    expect(discharged.length).toBeGreaterThan(0);

    for (const suite of discharged) {
      expect({
        path: suite.path,
        status: suite.priorVerdictStatus,
        owner: suite.ownerItem,
        keptRationale: Boolean(suite.priorVerdictRationale?.trim()),
        statesWhatWouldInvalidateIt: Boolean(
          suite.reverificationCondition?.trim(),
        ),
      }).toEqual({
        path: suite.path,
        status: "discharged",
        owner: "T-764",
        keptRationale: true,
        statesWhatWouldInvalidateIt: true,
      });
    }
  });

  it("resolves a non-empty set of merge-blocking commands", () => {
    // The other direction of the same worry: with an inverted filter or a
    // broken resolver this set is empty, and then every `held` case below
    // passes for the wrong reason.
    expect(commands.length).toBeGreaterThan(0);
  });

  it.each(record.suites.map((suite) => [suite.path, suite] as const))(
    "%s is still on disk",
    (_path, suite) => {
      // A deleted file satisfies "not merge-blocking" trivially, which would
      // read as success in the held cases.
      expect(() =>
        readFileSync(path.join(repoRoot, suite.path), "utf8"),
      ).not.toThrow();
    },
  );

  it.each(WIRED.map((suite) => [suite.path] as const))(
    "%s is named by a command that can block a merge",
    (testPath) => {
      const naming = commands.filter((command) =>
        commandNamesExactly(command, testPath),
      );

      expect(naming.length).toBeGreaterThan(0);
    },
  );

  it.each(WIRED.map((suite) => [suite.path] as const))(
    "%s is named by its exact path, because `(maestro)` is a capture group to Jest",
    (testPath) => {
      const naming = commands.find((command) =>
        commandNamesExactly(command, testPath),
      );

      expect(naming).toContain("--runTestsByPath");
    },
  );

  it.each(HELD.map((suite) => [suite.path] as const))(
    "%s is not reached by any command that can block a merge, by file OR by ancestor directory",
    (testPath) => {
      // The census's rule is "a command naming it OR a directory above it", and
      // the held half has to be asserted under the WHOLE rule. Checking the
      // file path alone leaves the easiest wrong fix for this item wide open: a
      // `jest <directory>` sweep names none of these four paths, so a
      // file-only assertion stays green while all four become merge-blocking —
      // which is precisely the outcome the record forbids.
      const reaching = commands.filter((command) =>
        selectorsFor(testPath).some((selector) =>
          commandNamesExactly(command, selector),
        ),
      );

      expect(reaching).toEqual([]);
    },
  );

  it("wires no source-text scanner, which is the rule the held half exists to keep", () => {
    for (const suite of WIRED) {
      expect({ path: suite.path, scanner: suite.sourceTextScanner }).toEqual({
        path: suite.path,
        scanner: false,
      });
    }
  });

  it("wires nothing that was not measured green with nothing skipped", () => {
    for (const suite of WIRED) {
      expect({
        path: suite.path,
        green: suite.green,
        failed: suite.failedTests,
        pending: suite.pendingTests,
        total: suite.totalTests > 0,
      }).toEqual({
        path: suite.path,
        green: true,
        failed: 0,
        pending: 0,
        total: true,
      });
    }
  });

  it("holds every scanner in the draw, so a later sweep cannot wire one silently", () => {
    // Stated as the set rather than a count: every scanner in the draw must be
    // on the held list, not merely as many things as there are scanners.
    const scanners = record.suites
      .filter((suite) => suite.sourceTextScanner)
      .map((suite) => suite.path)
      .sort();

    expect(HELD.map((suite) => suite.path).sort()).toEqual(scanners);
  });
});
