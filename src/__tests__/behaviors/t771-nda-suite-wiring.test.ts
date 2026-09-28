import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * T-771 drew twenty stale suites. Eleven of them already carried a verdict in a
 * repo-owned triage record, which is the finding in
 * `docs/architecture/t771-stale-suite-triage.json`; one of those eleven carried
 * a verdict whose reason is DISCHARGED, and that is what this file holds in
 * place.
 *
 * `src/lib/source/nda/__tests__/nda-authority-repository.test.ts` was measured
 * red by T-472 — 1 of 4, an exhaustive `toEqual` that had not been widened when
 * the repository gained a signature-evidence field group. T-472 forbade
 * repairing it there and assigned the widening to T-519, with the instruction
 * not to reach green by switching to `toMatchObject`, because that would delete
 * the exhaustiveness the test exists for. T-519 landed the widening in
 * `bd63332ea4` (#8183) and did not wire the suite, so it has run nowhere since.
 *
 * The rule that makes this a close rather than a new judgement is already
 * written in the sibling `t754-credited-suite-wiring.test.ts`: a discharged
 * reason should be wired in the change that discharges it. Three cases here,
 * and each is a different kind of claim.
 *
 * 1. **Reached.** The directory is no longer a directory no workflow runs.
 *    Answered through the census's own four-hop resolver — workflow run step,
 *    npm script, repo script, ratchet baseline — never by searching
 *    `.github/workflows` for a string. That grep answers "does a workflow NAME
 *    this path", which is a different question, and three backlog items were
 *    filed false on it.
 *
 * 2. **Still worth wiring.** The reason T-754 withheld three of its own eight
 *    is that their subject had no non-test importer, so running them would add
 *    a number to the census without covering code a product path reaches. That
 *    same question is asked here in the opposite direction: this subject has
 *    non-test importers today, and if it ever loses them the reason to wire it
 *    is gone and this case says so rather than leaving the step unexamined.
 *
 * 3. **Still exhaustive.** The discharge is that T-519 WIDENED the expectation.
 *    A later change could reach green again by narrowing it back —
 *    `toMatchObject`, or dropping the field group — and every other case in this
 *    file would stay green while the thing that was fixed was undone. So the
 *    widening itself is asserted.
 *
 * And the mutation the acceptance asks for: the wiring step is replaced by
 * `echo skipped` in a scratch copy of the workflow and the census is
 * re-measured, so the step's worth is a measured number rather than a claim.
 * The mutation is checked for being a real edit before its effect is believed —
 * a no-op mutation reads exactly like a caught one.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t771-stale-suite-triage.json";
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const WIRING_WORKFLOW = ".github/workflows/unit-suites.yml";
const WIRING_STEP_NAME = "Run the T-771 Source NDA authority suite";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

type TriageRecord = {
  base: string;
  recordedAt: string;
  wiring: { directories: string[]; suitesWired: number; casesWired: number };
  dischargedHold: { path: string; owningItem: string };
  suites: {
    path: string;
    directory: string;
    verdict: string;
    green: boolean;
    totalTests: number;
    sourceTextScanner: boolean;
    wiredInThisItem: boolean;
  }[];
};

const triage = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as TriageRecord;

/**
 * The partition is read out of the record, never copied. A hand-copied second
 * list is a second place to forget, and the sibling controls for T-475, T-493
 * and T-557 all read their own records for this reason.
 */
const WIRED = triage.suites
  .filter((suite) => suite.wiredInThisItem)
  .map((suite) => suite.path)
  .sort();

/**
 * A path T-771 left unwired that a STRICTLY LATER triage record declares it
 * wired. Resolved by `recordedAt`, the same supersession rule
 * `t770-scanner-wiring-refusal.test.ts` documents and for the same reason: a
 * suite that later gets rewritten and wired legitimately must not be held dark
 * by a control whose subject is what an earlier item did.
 *
 * Read from the records rather than listed here, so a later item cannot free a
 * path by editing this file.
 */
function wiredByALaterRecord(): Map<string, string> {
  const freed = new Map<string, string>();
  for (const file of readdirSync(path.join(repoRoot, "docs/architecture")).filter(
    (name) => /triage.*\.json$/.test(name),
  )) {
    const relative = `docs/architecture/${file}`;
    if (relative === TRIAGE_RECORD) continue;
    let record: { recordedAt?: string; item?: string; suites?: Record<string, unknown>[] };
    try {
      record = JSON.parse(readFileSync(path.join(repoRoot, relative), "utf8")) as typeof record;
    } catch {
      continue;
    }
    if (!record.recordedAt || record.recordedAt <= triage.recordedAt) continue;
    for (const suite of record.suites ?? []) {
      if (suite.wiredInThisItem === true) {
        freed.set(String(suite.path), `${relative} (${String(record.item ?? "?")})`);
      }
    }
  }
  return freed;
}

const FREED_BY_A_LATER_RECORD = wiredByALaterRecord();

/**
 * Every judged path this change does NOT wire, minus any a later record has
 * since wired. The positives above would all pass under an ancestor sweep,
 * which would also reach these, so the negatives are what make "wired" mean the
 * narrow claim.
 *
 * The subtraction is NOT a weakening: every path it removes is asserted below
 * to be named by a later record AND to be genuinely reached today, so a path
 * cannot leave this list by going quiet.
 */
const NOT_WIRED = triage.suites
  .filter((suite) => !suite.wiredInThisItem)
  .map((suite) => suite.path)
  .filter((suitePath) => !FREED_BY_A_LATER_RECORD.has(suitePath))
  .sort();

/** The freed paths that T-771 actually judged — the others are not this file's business. */
const FREED_FROM_THIS_DRAW = triage.suites
  .filter((suite) => !suite.wiredInThisItem && FREED_BY_A_LATER_RECORD.has(suite.path))
  .map((suite) => suite.path)
  .sort();

const SUBJECT_MODULE = "src/lib/source/nda/nda-authority-repository.ts";
const SUBJECT_SUITE = triage.dischargedHold.path;

type Probe = {
  unrun: string[];
  pullRequestCommands: string[];
  nonTestImporters: string[];
  mutation: {
    workflowBytesChanged: boolean;
    stepMatches: number;
    scratchFiles: number;
    coveredBefore: string[];
    coveredAfter: string[];
  };
};

/**
 * One child process, three facts, so they come from one read of the tree: which
 * files no workflow runs, which commands a pull-request workflow reaches, and
 * who imports the subject module.
 *
 * The census is a `.mjs` build script and this suite is compiled TypeScript, so
 * it is spawned rather than imported — the same choice
 * `t754-credited-suite-wiring.test.ts` and `t557-unrun-suite-wiring.test.ts`
 * make, for the same reason: the required coverage floor is a product-coverage
 * number and a well-covered build script moves it for a reason that has
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
    const target = process.env.IMPORTER_TARGET;

    const detailed = buildCensus(root, { includeUnrunPaths: true });
    const scripts =
      JSON.parse(readFileSync(root + "/package.json", "utf8")).scripts ?? {};
    const { reachable } = collectReachableCommands(root, scripts);

    // Who imports the subject, resolved with the census's own specifier parser
    // rather than a grep, so a type-only import and a path inside a comment are
    // both excluded for the same reason the census excludes them.
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
    const withoutExtension = target.replace(/\\.tsx?$/, "");
    const nonTestImporters = [];
    for (const file of sourceFiles) {
      if (file === target) continue;
      let text;
      try { text = readFileSync(path.join(root, file), "utf8"); } catch { continue; }
      const hit = runtimeModuleSpecifiers(text, file).some((specifier) => {
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
      if (hit && !/__tests__|\\.test\\./.test(file)) nonTestImporters.push(file);
    }

    // A scratch root holding the workflow under test and nothing but the judged
    // paths. Measuring the step's worth here rather than over the repository is
    // what keeps the number attributable to this step: in the real tree a
    // second workflow could reach the same file and the delta would understate.
    const scratch = mkdtempSync(path.join(os.tmpdir(), "t771-census-"));
    const workflowText = readFileSync(path.join(root, workflow), "utf8");
    const scratchWorkflow = path.join(scratch, workflow);
    try {
      writeFileSync(
        path.join(scratch, "package.json"),
        JSON.stringify({ name: "t771-scratch", scripts: {} }),
      );
      mkdirSync(path.dirname(scratchWorkflow), { recursive: true });
      writeFileSync(scratchWorkflow, workflowText);
      for (const subject of subjects) {
        mkdirSync(path.join(scratch, path.dirname(subject)), { recursive: true });
        writeFileSync(path.join(scratch, subject), "");
      }
      // Non-vacuity for the scratch root itself: a root whose tree the census
      // cannot see would report zero covered under both arms and the delta
      // would be zero for a reason unrelated to the step.
      const scratchSeen = collectTestFiles(scratch).sort();

      const coveredIn = (censusRoot) => {
        const unrunHere = new Set(
          buildCensus(censusRoot, { includeUnrunPaths: true })
            .unrunTestPathsByDirectory.flatMap((row) => row.unrunTestPaths),
        );
        return subjects.filter((subject) => !unrunHere.has(subject)).sort();
      };

      const coveredBefore = coveredIn(scratch);

      // The mutation. The step is found by its own name line and everything
      // from its 'run:' to the next step at the same indent is replaced, so a
      // folded 'run: >-' block goes with it.
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
          nonTestImporters: nonTestImporters.sort(),
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
        // The whole draw, including paths a later record has since wired. The
        // probe measures coverage over every path T-771 judged; narrowing it to
        // the paths still unwired would shrink the probe every time the corpus
        // improved, which is the same inversion this file was just repaired for.
        SUBJECT_PATHS: JSON.stringify(
          [...WIRED, ...NOT_WIRED, ...FREED_FROM_THIS_DRAW].sort(),
        ),
        IMPORTER_TARGET: SUBJECT_MODULE,
      },
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout) as Probe;
}

const probe = probeCensus();
const unrun = new Set(probe.unrun);
const darkBaseline = JSON.parse(
  readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
) as string[];
const suiteText = readFileSync(path.join(repoRoot, SUBJECT_SUITE), "utf8");

/**
 * The suite's code with comments removed. The first version of the case below
 * asserted `toMatchObject` was absent from the file and went red on the suite's
 * own comment explaining why `toMatchObject` was rejected — a text scan
 * answering a syntax question, which is the defect this whole family is about.
 * Stripping comments is still not a parse, so the case asserts the CALL shape
 * `toMatchObject(` rather than the bare word, and the key set is checked
 * separately.
 */
const suiteCode = suiteText
  .split("\n")
  .filter((line) => !line.trim().startsWith("//"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * The census's own matching rule, which is neither the shell's nor jest's: a
 * command names a path when the exact path appears as a whole token, with shell
 * quoting around it allowed. Reproduced here rather than imported because the
 * census does not export it; if the two ever disagree, the unrun case and the
 * naming case disagree with each other and the failure says so rather than one
 * quietly covering for the other.
 */
function commandNamesExactly(command: string, target: string): boolean {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[\\s"'\\x60=,(\\[])${escaped}(?=$|[\\s"'\\x60,)\\]])`,
  ).test(command);
}

describe("T-771: the one directory the ninth draw could wire", () => {
  it("reads its partition out of the triage record rather than a copied list", () => {
    // Non-vacuous first. Every case below iterates one of these lists, so a
    // renamed field or a moved record would turn this whole file into passing
    // assertions about nothing.
    //
    // The partition is asserted as CONSERVED arithmetic rather than as three
    // fixed numbers. `notWired` shrinks every time a later item legitimately
    // wires one of this draw's paths, and a case that pinned it would fail
    // that pull request and teach the next author to lower a constant instead
    // of reading one. What cannot move is the total and the split: 25 judged,
    // exactly 1 wired by T-771 itself, and every one of the other 24 either
    // still unreached or accounted for by name in `FREED_FROM_THIS_DRAW` —
    // which the case below then makes pay for its exemption twice.
    expect({
      judged: triage.suites.length,
      wired: WIRED.length,
      notWiredPlusFreed: NOT_WIRED.length + FREED_FROM_THIS_DRAW.length,
      freedAreDisjointFromNotWired: FREED_FROM_THIS_DRAW.every(
        (suitePath) => !NOT_WIRED.includes(suitePath),
      ),
      wiredIsTheDischargedHold: WIRED.includes(SUBJECT_SUITE),
      recordAgreesOnCount: triage.wiring.suitesWired,
      probedSubjectsCoverTheDraw:
        probe.mutation.scratchFiles === WIRED.length + NOT_WIRED.length + FREED_FROM_THIS_DRAW.length,
    }).toEqual({
      judged: 25,
      wired: 1,
      notWiredPlusFreed: 24,
      freedAreDisjointFromNotWired: true,
      wiredIsTheDischargedHold: true,
      recordAgreesOnCount: 1,
      probedSubjectsCoverTheDraw: true,
    });
  });

  it.each(WIRED)("no longer reports %s as a file no workflow runs", (testPath) => {
    expect(unrun.has(testPath)).toBe(false);
  });

  it.each(WIRED)(
    "reaches %s through a command that names its DIRECTORY, not the file",
    (testPath) => {
      // The acceptance's wiring unit is the directory: a suite added beside this
      // one tomorrow has to run the day it lands. Naming the file would satisfy
      // "reached" and defeat the reason the unit is the directory.
      const directory = path.posix.dirname(testPath);
      const namingDirectory = probe.pullRequestCommands.filter((command) =>
        commandNamesExactly(command, directory),
      );
      const namingFile = probe.pullRequestCommands.filter((command) =>
        commandNamesExactly(command, testPath),
      );
      expect({
        byDirectory: namingDirectory.length > 0,
        byFile: namingFile.length,
      }).toEqual({ byDirectory: true, byFile: 0 });
    },
  );

  it("keeps the wired directory out of the dark-directory baseline", () => {
    // The ratchet asserts set equality, so a re-add would be caught there too.
    // It is asserted here as well because this file is what a future reader
    // consults to learn why the line left, and an exemption that does not
    // assert its own state is the defect this family exists against.
    for (const directory of triage.wiring.directories) {
      expect(darkBaseline).not.toContain(directory);
    }
  });

  it.each(NOT_WIRED)("still leaves %s unreached, and says why in the record", (testPath) => {
    // An ancestor sweep would reach the twelve green operator-integration
    // suites and the eleven files other items own. The negatives are what make
    // the positive above the narrow claim it has to be.
    expect(unrun.has(testPath)).toBe(true);
    expect(
      probe.pullRequestCommands.filter((command) =>
        commandNamesExactly(command, testPath),
      ),
    ).toEqual([]);
  });

  it("frees a path from the unreached list only when a later record names it AND it is reached", () => {
    // The subtraction above is the only way a path leaves NOT_WIRED, so it is
    // the place this control could be quietly emptied. Each freed path has to
    // pay for its exemption twice: a strictly later triage record declares it
    // wired, and a command in a required job actually selects it. A path that
    // went quiet, or a record that claims a wiring nobody performed, fails
    // here rather than disappearing from the list above.
    expect(
      FREED_FROM_THIS_DRAW.map((suitePath) => ({
        path: suitePath,
        namedBy: FREED_BY_A_LATER_RECORD.get(suitePath) ?? null,
        stillUnrun: unrun.has(suitePath),
        selectingCommands: probe.pullRequestCommands.filter((command) =>
          commandNamesExactly(command, suitePath),
        ).length,
      })),
    ).toEqual(
      FREED_FROM_THIS_DRAW.map((suitePath) => ({
        path: suitePath,
        namedBy: FREED_BY_A_LATER_RECORD.get(suitePath) ?? null,
        stillUnrun: false,
        selectingCommands: 1,
      })),
    );
  });

  it("wires a subject that product code actually imports", () => {
    // The mirror of T-754's withholding reason. If this subject ever loses its
    // runtime callers, the reason to run its suite in a required job is gone
    // and this case is what says so.
    expect(probe.nonTestImporters.length).toBeGreaterThan(0);
    expect(probe.nonTestImporters).toContain(
      "src/lib/source/new-workspace/stage05-nda-coverage.ts",
    );
  });

  it("keeps T-519's discharge a widening rather than a narrowing", () => {
    // The hold was discharged by extending an exhaustive expectation to carry
    // the signature-evidence group. Reaching green again by narrowing it back
    // would undo the discharge while every other case here stayed green.
    expect(suiteCode).toContain("signatureEvidence");
    expect(suiteCode).toContain("expect(result).toEqual(");
    expect(suiteCode).not.toContain("toMatchObject(");
    // The field group T-472 named, each key asserted rather than the group's
    // presence: `signatureEvidence: {}` would satisfy a check for the property
    // name alone and would be exactly the narrowing this case exists to refuse.
    for (const key of [
      "signedAt",
      "signatureMethod",
      "buyerSignatoryName",
      "supplierSignatoryName",
      "documentSha256",
      "certificateSha256",
      "privateEvidenceRef",
    ]) {
      expect(suiteCode).toContain(key);
    }
  });

  it("is worth exactly the suites it claims, measured by replacing its step with echo skipped", () => {
    // The mutation has to be a real edit before its effect means anything.
    expect({
      changed: probe.mutation.workflowBytesChanged,
      stepMatches: probe.mutation.stepMatches,
    }).toEqual({ changed: true, stepMatches: 1 });

    expect(probe.mutation.coveredBefore).toEqual(WIRED);
    expect(probe.mutation.coveredAfter).toEqual([]);
  });
});
