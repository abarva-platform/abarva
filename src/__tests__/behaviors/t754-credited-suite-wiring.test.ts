import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * T-475 drew the last twelve untriaged unrun suites the census's governed-risk
 * ranking could supply and gave each a verdict. Eight came back
 * `wire_into_ci`: healthy suites that reached no CI job. T-754 is the half
 * that wires them, and this file is what holds the wiring in place.
 *
 * **FIVE ARE WIRED, NOT EIGHT, AND THAT IS A CORRECTION TO THE ITEM.** Three
 * of the eight are named in the quarantine list of the sibling control
 * `source-contract-suite-ci-coverage.test.ts`, which runs today and asserts
 * that no jest command in `unit-suites.yml` mentions them. T-475's draw
 * reached `wire_into_ci` from "green, and governed risk" and did not read that
 * control; wiring all eight turns it red, and making it green again would mean
 * deleting a quarantine to let a new step pass — the shape of defect this
 * backlog exists against. T-557 hit exactly this collision over two of its own
 * fifteen and resolved it by withholding with a written reason. So does this.
 *
 * The item's acceptance therefore cannot be met as written: the mutation it
 * names must move the workflow-reached count by exactly FIVE. Eight was
 * derived from a record that had not been reconciled against the quarantine,
 * and the number is the part that was wrong, not the method.
 *
 * **Each withheld reason is checked here, not narrated.** An exemption that
 * does not assert its own defect still exists outlives the fix silently. Two
 * of the three reasons are "no non-test importer", which is measurable: the
 * probe below re-derives every importer of those two modules with the census's
 * own `runtimeModuleSpecifiers` parser and this file fails if either gains a
 * runtime caller — at which point the reason is discharged and the suite
 * should be wired in the same change that discharges it. The third reason is
 * not importer-shaped, so what is asserted instead is that the sibling control
 * still quarantines the file: remove it there and this file fails, forcing the
 * constant below to be revisited rather than quietly disagreeing.
 *
 * **The list is read, not copied.** The twelve paths and their verdicts come
 * out of `docs/architecture/t475-stale-suite-triage.json` at run time,
 * following `t557-unrun-suite-wiring.test.ts`. A hand-copied second list is a
 * second place to forget.
 *
 * **The four T-755 and T-756 own must stay out.** Two of them sit in
 * `src/lib/source/contract-evidence/__tests__` beside a credited sibling and
 * two share `src/lib/enterprise-context/__tests__`; one is red. A directory
 * sweep over either parent would satisfy every positive case here while
 * quietly wiring a suite whose own item is open. So the positives demand the
 * exact path and the negatives demand the absence, and it is the negatives
 * that make "wired" mean "named individually".
 *
 * **The quantity is measured by the mutation the acceptance names, not
 * asserted.** The last case copies the real workflow into a scratch root
 * holding nothing but the twelve paths, replaces this step's `run:` with `echo
 * skipped`, and re-measures. The mutation is checked for being a real edit
 * before its effect is believed — a no-op mutation reads exactly like a caught
 * one.
 *
 * Everything here is answered by the census's four-hop resolver — workflow run
 * step, npm script, repo script, ratchet baseline — never by searching
 * `.github/workflows` for a string. That grep answers "does a workflow NAME
 * this path", which is a different question, and three backlog items were
 * filed false on it.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t475-stale-suite-triage.json";
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const WIRING_WORKFLOW = ".github/workflows/unit-suites.yml";
const WIRING_STEP_NAME =
  "Run the five suites T-475 credited that no earlier record holds";
const QUARANTINE_CONTROL =
  "src/__tests__/behaviors/source-contract-suite-ci-coverage.test.ts";

type TriageRecord = {
  base: string;
  suites: { path: string; verdict: string }[];
};

const triage = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as TriageRecord;

const pathsWithVerdict = (verdict: string): string[] =>
  triage.suites
    .filter((suite) => suite.verdict === verdict)
    .map((suite) => suite.path)
    .sort();

/**
 * The three of T-475's eight this change deliberately does NOT wire, each with
 * the check that decides whether its reason is still live.
 *
 * `noRuntimeImporter` — the sibling control holds these two because the module
 * under test has no non-test importer, so running the suite would add a number
 * to the census without covering code any product path reaches. That is the
 * same rule this repository already applies to `src/lib/deliverables/synthesis`.
 * Re-measured at `2f6cac9d5` and still true: both modules have exactly one
 * importer and it is their own suite.
 *
 * `quarantinedBySibling` — `read-model.test.ts` is held for a reason about
 * what the suite can prove rather than about dead code: its fixture carries no
 * register contract identity, so it cannot reproduce the live identity split.
 * The module has three non-test importers including a live v1 route, so the
 * importer check would pass and would be the wrong question. Its sibling
 * `persistence.test.ts` carries the identical quarantine reason and T-475's
 * mutation pass independently found a real hole behind it (T-755), which is
 * evidence the reason is live for this directory rather than a stale note.
 */
const WITHHELD = [
  {
    testPath: "src/lib/source/contract-evidence/__tests__/read-model.test.ts",
    check: "quarantinedBySibling",
  },
  {
    testPath: "src/lib/source/contract-intelligence/__tests__/prompt.test.ts",
    check: "noRuntimeImporter",
    module: "src/lib/source/contract-intelligence/prompt.ts",
  },
  {
    testPath: "src/lib/source/contract-intelligence/__tests__/provenance.test.ts",
    check: "noRuntimeImporter",
    module: "src/lib/source/contract-intelligence/provenance.ts",
  },
] as const;

const WITHHELD_PATHS: string[] = WITHHELD.map((entry) => entry.testPath).sort();
const IMPORTER_CHECKED: string[] = WITHHELD.filter(
  (entry): entry is Extract<(typeof WITHHELD)[number], { module: string }> =>
    "module" in entry,
).map((entry) => entry.module);

const VERDICTED_WIRE = pathsWithVerdict("wire_into_ci");
const WIRED = VERDICTED_WIRE.filter(
  (testPath) => !WITHHELD_PATHS.includes(testPath),
);
const HELD_FOR_REPAIR = pathsWithVerdict("repair");
const HELD_FOR_REBASELINE = pathsWithVerdict("update_with_reason_recorded");

/**
 * Two of the three `update_with_reason_recorded` rows whose hold is discharged,
 * each named with the item that discharged it and the change it was re-baselined
 * against. This constant exists because the two per-path cases below went red on
 * a real tree the moment the suites were wired, which is what they are for: the
 * header's rule is that a discharged reason should be wired in the same change
 * that discharges it, rather than leaving an exemption that outlives the fact
 * justifying it.
 *
 * `docs/architecture/t475-stale-suite-triage.json` is deliberately NOT edited to
 * say so. It is T-475's audit artifact — its own `forbiddenEdits` field records
 * that the triage writes a verdict and hands it on, and a sibling control pins
 * the case titles each verdict was written about. The verdict stays
 * `update_with_reason_recorded`, because that is what T-475 drew; what changed
 * is the state of the world, and the state of the world belongs here, where it
 * is measured every run.
 *
 * The third row, `derived-enterprise-read.test.ts`, is NOT discharged. It is
 * still red, its dataset roots were deleted rather than renamed, and retiring
 * versus re-wiring the module is a decision rather than a re-baseline.
 */
const DISCHARGED = [
  {
    testPath: "src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts",
    byItem: "T-756",
    reason:
      "six expectations were behind #7795's record-type alias separation and copy rename, and a seventh was a spend binding lost as collateral of a bad merge rather than a stale expectation; all seven are resolved and the suite is green",
  },
  {
    testPath: "src/lib/source/contract-evidence/__tests__/templates.test.ts",
    byItem: "T-756",
    reason:
      "the ordered family list was behind `e38e5b4f5`, which prepended the application_inventory family; the list is re-baselined, still an ordered compare, and the suite is green",
  },
] as const;

const DISCHARGED_PATHS: string[] = DISCHARGED.map((entry) => entry.testPath).sort();
const HELD = [...HELD_FOR_REPAIR, ...HELD_FOR_REBASELINE]
  .filter((testPath) => !DISCHARGED_PATHS.includes(testPath))
  .sort();

/**
 * What the mutation is expected to leave covered. The mutated step is the one
 * T-754 added, and it is still worth exactly five; the two discharged paths are
 * named by two OTHER steps, so replacing T-754's step by `echo skipped` does not
 * reach them and they stay covered on both arms. Asserting `coveredAfter` is
 * empty would now be asserting that this mutation reaches a step it does not
 * touch, and the delta would stop being attributable to the step it names.
 */
const COVERED_AFTER_MUTATION = [...DISCHARGED_PATHS].sort();

type Probe = {
  unrun: string[];
  pullRequestCommands: string[];
  nonTestImporters: Record<string, string[]>;
  mutation: {
    workflowBytesChanged: boolean;
    stepMatches: number;
    scratchFiles: number;
    coveredBefore: string[];
    coveredAfter: string[];
  };
};

/**
 * One child process, four facts, so they come from one read of the tree: which
 * files no workflow runs, which commands a pull-request workflow reaches, who
 * imports the withheld modules, and what the step is worth when it is replaced
 * by `echo skipped`.
 *
 * The census is a `.mjs` build script; this suite is compiled TypeScript. The
 * spawn is what `t557-unrun-suite-wiring.test.ts` and
 * `programs-unit-directory-ci-coverage.test.ts` already do, and its reason
 * survives measurement: the required coverage floor is a product-coverage
 * number, and a well-covered build script still moves it for a reason that has
 * nothing to do with the product.
 *
 * The scratch root is under the OS temp directory and never under `src/`. A
 * case that created and deleted files inside `src/` mid-run would be the race
 * T-759 was filed against.
 */
function probeCensus(): Probe {
  const censusUrl = pathToFileURL(path.join(repoRoot, CENSUS_SCRIPT)).href;
  const source = `
    import {
      buildCensus,
      collectReachableCommands,
      collectTestFiles,
      runtimeModuleSpecifiers,
    } from ${JSON.stringify(censusUrl)};
    import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
    import os from "node:os";
    import path from "node:path";

    const root = process.env.CENSUS_ROOT;
    const workflow = process.env.WIRING_WORKFLOW;
    const stepName = process.env.WIRING_STEP_NAME;
    const subjects = JSON.parse(process.env.SUBJECT_PATHS);
    const importerTargets = JSON.parse(process.env.IMPORTER_TARGETS);

    const detailed = buildCensus(root, { includeUnrunPaths: true });
    const scripts =
      JSON.parse(readFileSync(root + "/package.json", "utf8")).scripts ?? {};
    const { reachable } = collectReachableCommands(root, scripts);

    // Who imports the withheld modules, resolved with the census's own
    // specifier parser rather than a grep, so a type-only import and a string
    // in a comment are both excluded for the same reason the census excludes
    // them. Test files are listed separately: a module imported only by its
    // own suite is the case the quarantine reason describes.
    const sourceFiles = [];
    const walk = (relative) => {
      for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const child = relative + "/" + entry.name;
        if (entry.isDirectory()) walk(child);
        else if (/\\.(?:ts|tsx|mjs|js|jsx)$/.test(entry.name)) sourceFiles.push(child);
      }
    };
    walk("src");
    const nonTestImporters = {};
    for (const target of importerTargets) {
      const withoutExtension = target.replace(/\\.tsx?$/, "");
      const importers = [];
      for (const file of sourceFiles) {
        if (file === target) continue;
        let text;
        try { text = readFileSync(path.join(root, file), "utf8"); } catch { continue; }
        const specifiers = runtimeModuleSpecifiers(text, file);
        const hit = specifiers.some((specifier) => {
          let resolved = null;
          if (specifier.startsWith("@/")) resolved = "src/" + specifier.slice(2);
          else if (specifier.startsWith(".")) {
            resolved = path.posix.normalize(
              path.posix.join(path.posix.dirname(file), specifier),
            );
          }
          if (!resolved) return false;
          return (
            resolved === target ||
            resolved === withoutExtension ||
            resolved === withoutExtension + "/index"
          );
        });
        if (hit && !/__tests__|\\.test\\./.test(file)) importers.push(file);
      }
      nonTestImporters[target] = importers.sort();
    }

    // A scratch root holding the workflow under test and nothing but the
    // twelve subject paths. Measuring the step's worth here rather than over
    // the repository is what keeps the number attributable to this step: in
    // the real tree a second workflow could reach the same file and the delta
    // would understate, or a future sweep could reach it and the delta would
    // vanish with nothing to say why.
    const scratch = mkdtempSync(path.join(os.tmpdir(), "t754-census-"));
    const workflowText = readFileSync(path.join(root, workflow), "utf8");
    const scratchWorkflow = path.join(scratch, workflow);
    try {
      writeFileSync(
        path.join(scratch, "package.json"),
        JSON.stringify({ name: "t754-scratch", scripts: {} }),
      );
      mkdirSync(path.dirname(scratchWorkflow), { recursive: true });
      writeFileSync(scratchWorkflow, workflowText);
      for (const subject of subjects) {
        mkdirSync(path.join(scratch, path.dirname(subject)), { recursive: true });
        writeFileSync(path.join(scratch, subject), "");
      }
      // Non-vacuity for the scratch root itself: a root whose tree the census
      // cannot see would report zero covered under both arms and the delta
      // would be zero for a reason that has nothing to do with the step.
      const scratchSeen = collectTestFiles(scratch).sort();

      const coveredIn = (censusRoot) => {
        const unrunHere = new Set(
          buildCensus(censusRoot, { includeUnrunPaths: true })
            .unrunTestPathsByDirectory.flatMap((row) => row.unrunTestPaths),
        );
        return subjects.filter((subject) => !unrunHere.has(subject)).sort();
      };

      const coveredBefore = coveredIn(scratch);

      // The mutation the acceptance names. The step is found by its own name
      // line and everything from its 'run:' to the next step at the same
      // indent is replaced, so a folded 'run: >-' block goes with it.
      const stepPattern = new RegExp(
        "(^[ ]{6}- name: " +
          stepName.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&") +
          "\\\\n)(?:[ ]{8}.*\\\\n|[ ]*\\\\n)*",
        "m",
      );
      const matches = workflowText.match(new RegExp(stepPattern.source, "gm"));
      const mutated = workflowText.replace(
        stepPattern,
        "$1        run: echo skipped\\n",
      );
      writeFileSync(scratchWorkflow, mutated);
      const coveredAfter = coveredIn(scratch);

      process.stdout.write(
        JSON.stringify({
          unrun: detailed.unrunTestPathsByDirectory.flatMap(
            (row) => row.unrunTestPaths,
          ),
          pullRequestCommands: reachable
            .filter((entry) => entry.pullRequest)
            .map((entry) => entry.command),
          nonTestImporters,
          mutation: {
            workflowBytesChanged: mutated !== workflowText,
            stepMatches: matches ? matches.length : 0,
            scratchFiles: scratchSeen.length,
            coveredBefore,
            coveredAfter,
          },
        }),
      );
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  `;
  const stdout = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", source],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CENSUS_ROOT: repoRoot,
        WIRING_WORKFLOW,
        WIRING_STEP_NAME,
        // All twelve of T-475's rows, including the two now discharged: the
        // scratch root must contain a path for it to be measurable at all, so
        // dropping them here would make the mutation silent about them rather
        // than proving they stay covered.
        SUBJECT_PATHS: JSON.stringify(
          [...WIRED, ...WITHHELD_PATHS, ...HELD, ...DISCHARGED_PATHS].sort(),
        ),
        IMPORTER_TARGETS: JSON.stringify(IMPORTER_CHECKED),
      },
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout) as Probe;
}

const probe = probeCensus();
const unrun = new Set(probe.unrun);
const quarantineControl = readFileSync(
  path.join(repoRoot, QUARANTINE_CONTROL),
  "utf8",
);

/**
 * The census's own matching rule, which is neither the shell's nor jest's: a
 * command names a path when the exact path appears as a whole token, with
 * shell quoting around it allowed. Reproduced here rather than imported
 * because the census does not export it; if the two ever disagree, the unrun
 * case and the naming case below disagree with each other and the failure says
 * so rather than one quietly covering for the other.
 */
function commandNamesExactly(command: string, testPath: string): boolean {
  const escaped = testPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[\\s"'\\x60=,(\\[])${escaped}(?=$|[\\s"'\\x60,)\\]])`,
  ).test(command);
}

describe("the suites T-475 verdicted wire_into_ci", () => {
  it("reads the partition out of the triage record rather than a copied list", () => {
    // Non-vacuous first. Every case below iterates one of these lists, so a
    // renamed verdict string or a moved record would turn this whole file into
    // passing assertions about nothing. The split between wired and withheld
    // is asserted too: if the withheld constant stopped matching any drawn
    // path, every withholding case below would become a case about nothing.
    expect({
      verdictedWire: VERDICTED_WIRE.length,
      wiredHere: WIRED.length,
      withheld: WITHHELD_PATHS.length,
      withheldAreAllDrawn: WITHHELD_PATHS.filter((p) =>
        VERDICTED_WIRE.includes(p),
      ).length,
      heldForRepair: HELD_FOR_REPAIR.length,
      heldForRebaseline: HELD_FOR_REBASELINE.length,
      probedSubjects: probe.mutation.scratchFiles,
    }).toEqual({
      verdictedWire: 8,
      wiredHere: 5,
      withheld: 3,
      withheldAreAllDrawn: 3,
      heldForRepair: 1,
      heldForRebaseline: 3,
      probedSubjects: 12,
    });
  });

  it.each(WIRED)("no longer reports %s as a file no workflow runs", (testPath) => {
    expect(unrun.has(testPath)).toBe(false);
  });

  it.each(WIRED)("names %s by its exact path in a pull-request command", (testPath) => {
    // "Reached" is not enough. An ancestor sweep would reach these and would
    // also reach the withheld and held files, so the positive has to be the
    // narrow claim or the negatives mean nothing.
    const naming = probe.pullRequestCommands.filter((command) =>
      commandNamesExactly(command, testPath),
    );
    expect(naming.length).toBeGreaterThan(0);
  });

  it.each(WITHHELD_PATHS)(
    "still holds %s out, because an earlier control quarantines it",
    (testPath) => {
      expect(unrun.has(testPath)).toBe(true);
      expect(
        probe.pullRequestCommands.filter((command) =>
          commandNamesExactly(command, testPath),
        ),
      ).toEqual([]);
    },
  );

  it.each(IMPORTER_CHECKED)(
    "still finds no runtime importer of %s, which is the reason it is withheld",
    (modulePath) => {
      // The exemption asserts its own defect still exists. The day a product
      // path imports this module the reason is discharged, this case goes red,
      // and the suite should be wired in the same change that discharges it —
      // rather than the quarantine outliving the fact that justified it.
      expect(probe.nonTestImporters[modulePath]).toEqual([]);
    },
  );

  it("keeps the sibling quarantine and this withholding in agreement", () => {
    // `read-model.test.ts` is withheld for a reason that is not importer-
    // shaped, so what is checked is that the control holding it still does.
    // Delete the entry there and this fails, which forces the constant above
    // to be revisited instead of two repo-owned records quietly disagreeing.
    for (const { testPath } of WITHHELD) {
      expect(quarantineControl).toContain(testPath);
    }
  });

  it.each(HELD)(
    "still holds %s out of CI, because its own item is open",
    (testPath) => {
      // T-755 owns the `repair` row: its per-row tenant fence is unasserted,
      // so every structured evidence row could be written under the wrong
      // tenant with the suite green. T-756 owns the three
      // `update_with_reason_recorded` rows, two of which are red against
      // deliberate product changes. Wiring a red suite into a blocking job is
      // how a lane gets stuck.
      expect(unrun.has(testPath)).toBe(true);
      expect(
        probe.pullRequestCommands.filter((command) =>
          commandNamesExactly(command, testPath),
        ),
      ).toEqual([]);
    },
  );

  it.each(DISCHARGED_PATHS)(
    "now runs %s, because the reason it was held no longer describes anything",
    (testPath) => {
      // The mirror of the two `HELD` cases above, and the reason this constant
      // cannot be a comment: a path listed as discharged but still red, or
      // discharged and quietly not wired, fails here by name.
      expect(unrun.has(testPath)).toBe(false);
      expect(
        probe.pullRequestCommands.filter((command) =>
          commandNamesExactly(command, testPath),
        ),
      ).toHaveLength(1);
      const entry = DISCHARGED.find((candidate) => candidate.testPath === testPath);
      expect(entry?.byItem).toMatch(/^[A-Z]-\d{3}$/);
      expect((entry?.reason ?? "").length).toBeGreaterThan(80);
    },
  );

  it("keeps every discharged path out of the held set, and the still-red one in it", () => {
    // The two sets must not overlap, or a path could satisfy both the "still
    // held" case and the "now runs" case depending on which ran first.
    for (const testPath of DISCHARGED_PATHS) expect(HELD).not.toContain(testPath);
    expect(HELD).toContain(
      "src/lib/enterprise-context/__tests__/derived-enterprise-read.test.ts",
    );
    expect(
      [...HELD, ...DISCHARGED_PATHS].sort(),
    ).toEqual([...HELD_FOR_REPAIR, ...HELD_FOR_REBASELINE].sort());
  });

  it("moves the workflow-reached count by exactly five when the step is replaced by `echo skipped`", () => {
    // The mutation the acceptance names, run by the control rather than by
    // hand, with the number corrected from eight to five for the reason in the
    // header. Two guards before the effect is believed: the step was found
    // exactly once, and the replacement actually changed the file. A no-op
    // mutation and a caught one are indistinguishable from the delta alone.
    expect({
      stepMatches: probe.mutation.stepMatches,
      workflowBytesChanged: probe.mutation.workflowBytesChanged,
    }).toEqual({ stepMatches: 1, workflowBytesChanged: true });

    expect(probe.mutation.coveredBefore).toEqual(
      [...WIRED, ...DISCHARGED_PATHS].sort(),
    );
    expect(probe.mutation.coveredAfter).toEqual(COVERED_AFTER_MUTATION);
    expect(
      probe.mutation.coveredBefore.length - probe.mutation.coveredAfter.length,
    ).toBe(5);
  });
});
