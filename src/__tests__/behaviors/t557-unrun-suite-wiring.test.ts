import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * T-556 drew twenty untriaged unrun suites from the census's own governed-risk
 * ranking and gave each a verdict. Fifteen came back `wire_into_ci`: healthy
 * suites, 280 tests between them, that no workflow reached. T-557 is the half
 * that wires them, and this file is what holds the wiring in place.
 *
 * Three things decide the shape of these cases.
 *
 * **The list is read, not copied.** The fifteen paths come out of
 * `docs/architecture/t556-stale-suite-triage.json` at run time. A hand-copied
 * second list is a second place to forget — the defect T-053 named — and here
 * it would be worse than usual, because the triage record is the only document
 * that says why each of these fifteen is wanted and the other five are not.
 *
 * **The suites that must NOT be wired are asserted too, and there are two
 * kinds.** The acceptance for T-557 forbids folding the workspace directory
 * into a sweep, because it also holds the three suites T-556 verdicted
 * `rewrite_as_behavior` — they assert substrings of source files rather than
 * behaviour, and T-558 owns rewriting them. A directory sweep would run all of
 * them and satisfy every positive case in this file while quietly wiring those
 * three as well. So the negative is asserted from the same record, against the
 * same census, and it is what makes the positive cases mean "named
 * individually" rather than merely "reached".
 *
 * The second kind is `WITHHELD` below: one of the fifteen that T-556 verdicted
 * `wire_into_ci` and this change does not wire, because an older record
 * quarantines it on a condition that is not yet discharged. Two repo-owned
 * records disagree about that one file, and the fail-closed reading is the one
 * encoded here.
 *
 * **The census runs in a child process, not in this one**, following the
 * sibling `programs-unit-directory-ci-coverage.test.ts`. The usual reason
 * given for that shape — that importing a 1,380-line build script into a
 * `src/__tests__/behaviors` suite would drag its branches into the required
 * floor's denominator — was measured here and is FALSE for this module: with
 * the import in process the floor reads lines 91.64 / branches 70.53, against
 * 90.92 / 69.22 with the spawn. It helps, because a census call walks the
 * whole tree and exercises most of what it loads. The spawn is kept anyway,
 * for the reason that survives measurement: the floor is a product-coverage
 * number, and a build script that happens to be well covered still moves it
 * for a reason that has nothing to do with the product. Written down because
 * the next person to copy this shape will otherwise copy the wrong reason.
 *
 * Everything here is answered by the census's four-hop resolver — workflow run
 * step, npm script, repo script, ratchet baseline — never by searching
 * `.github/workflows` for a string. That grep answers "does a workflow NAME
 * this path", which is a different question, and three backlog items were
 * filed false on it.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t556-stale-suite-triage.json";
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const WIRING_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

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
 * The two of T-556's fifteen that are deliberately NOT wired. In both cases an
 * EARLIER record already quarantines the file for a reason T-556's draw did not
 * read — it reached `wire_into_ci` from "green, and governed risk" — and wiring
 * past a stated reason on the strength of green is the shape of defect this
 * backlog exists to stop. T-599 owns both.
 *
 * `tenant-resolution-source-contract.test.tsx`.
 * `docs/releases/records/2026-09-21-source-readiness-route-suite-ownership.md`
 * holds it unwired "until it is green, derives expectations from the chosen
 * canonical tenant authority, and proves opposite-tenant refusal". Only the
 * first third is discharged: the suite was rewritten from source-text matching
 * to rendering and is green, but it derives from neither of the two
 * `CANONICAL_TENANT_KEYS` exports, and its strongest isolation case proves that
 * an UNRESOLVED tenant fails closed — not that one tenant is refused another's
 * data.
 *
 * `supabase-server.test.ts`. The record that wired its siblings,
 * `2026-09-20-wire-governance-tenant-green-suites.md`, left it out because "the
 * architecture gate rejects newly owned legacy client dependencies". Measured
 * rather than taken on trust: wiring it and running `audit:architecture-rules`
 * returns `[fail] NO_SUPABASE_RUNTIME` against the workflow step itself. A
 * required check forbids the step, so this one is not a judgement call.
 *
 * This is a ratchet with a written reason rather than a silent exclusion:
 * wiring either file fails the case below until somebody discharges its
 * reason and amends this constant in the same change.
 */
const WITHHELD = [
  "src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.tsx",
  "src/lib/__tests__/supabase-server.test.ts",
] as const;

const VERDICTED_WIRE = pathsWithVerdict("wire_into_ci");
const WIRED = VERDICTED_WIRE.filter(
  (testPath) => !WITHHELD.includes(testPath as (typeof WITHHELD)[number]),
);
const NOT_YET_BEHAVIOUR = pathsWithVerdict("rewrite_as_behavior");

type Probe = {
  indeterminateInvocations: number;
  unrun: string[];
  pullRequestCommands: string[];
};

/**
 * One child process, both facts, so the two answers come from the same read of
 * the tree: which files no workflow runs, and which commands a pull-request
 * workflow reaches. Splitting them across two spawns would let a change land
 * between them.
 */
function probeCensus(): Probe {
  const censusUrl = pathToFileURL(path.join(repoRoot, CENSUS_SCRIPT)).href;
  const source = `
    import { buildCensus, collectReachableCommands } from ${JSON.stringify(censusUrl)};
    import { readFileSync } from "node:fs";
    const root = process.env.CENSUS_ROOT;
    const detailed = buildCensus(root, { includeUnrunPaths: true });
    const scripts =
      JSON.parse(readFileSync(root + "/package.json", "utf8")).scripts ?? {};
    const { reachable } = collectReachableCommands(root, scripts);
    process.stdout.write(
      JSON.stringify({
        indeterminateInvocations: detailed.counts.indeterminateInvocations,
        unrun: detailed.unrunTestPathsByDirectory.flatMap(
          (row) => row.unrunTestPaths,
        ),
        pullRequestCommands: reachable
          .filter((entry) => entry.pullRequest)
          .map((entry) => entry.command),
      }),
    );
  `;
  const stdout = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", source],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, CENSUS_ROOT: repoRoot },
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout) as Probe;
}

const probe = probeCensus();
const unrun = new Set(probe.unrun);

/**
 * The census's own matching rule, which is neither the shell's nor jest's: a
 * command names a path when the exact path appears as a whole token, with
 * shell quoting around it allowed. Reproduced here rather than imported
 * because the census does not export it; if the two ever disagree, the unrun
 * case and the naming case below disagree with each other and the failure says
 * so rather than one of them quietly covering for the other.
 */
function commandNamesExactly(command: string, testPath: string): boolean {
  const escaped = testPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[\\s"'\\x60=,(\\[])${escaped}(?=$|[\\s"'\\x60,)\\]])`,
  ).test(command);
}

describe("the fifteen suites T-556 verdicted wire_into_ci", () => {
  it("reads a non-empty list of both verdicts out of the triage record", () => {
    // Non-vacuous first. Every case below iterates one of these two lists, so
    // a renamed verdict string or a moved record would turn this whole file
    // into passing assertions about nothing.
    expect({
      verdictedWire: VERDICTED_WIRE.length,
      wiredHere: WIRED.length,
      withheld: WITHHELD.length,
      notYet: NOT_YET_BEHAVIOUR.length,
    }).toEqual({
      verdictedWire: 15,
      wiredHere: 13,
      withheld: 2,
      notYet: 3,
    });
  });

  it.each(WITHHELD)(
    "still holds %s out, because an earlier record quarantines it for a reason nobody has discharged",
    (testPath) => {
      // Non-vacuous: the file must be in the record's own wire_into_ci list,
      // or this case is holding out something nobody proposed to wire.
      expect(VERDICTED_WIRE).toContain(testPath);
      expect(existsSync(path.join(repoRoot, testPath))).toBe(true);
      expect(unrun.has(testPath)).toBe(true);
    },
  );

  it("resolves every jest invocation to literal paths, so the coverage answer is not a guess", () => {
    // While any invocation is unresolved the covered set is an upper bound and
    // every case below is reading that guess as a fact.
    expect(probe.indeterminateInvocations).toBe(0);
  });

  it.each(WIRED)("still has %s on disk", (testPath) => {
    // A deleted suite leaves the unrun list too, and would otherwise read as
    // success in the case below.
    expect(existsSync(path.join(repoRoot, testPath))).toBe(true);
  });

  it.each(WIRED)(
    "no longer reports %s as a file no workflow runs",
    (testPath) => {
      expect(unrun.has(testPath)).toBe(false);
    },
  );

  it.each(WIRED)(
    "reaches %s from a workflow that gates a pull request, naming the exact path",
    (testPath) => {
      const naming = probe.pullRequestCommands.filter((command) =>
        commandNamesExactly(command, testPath),
      );
      // The exact path, not an ancestor directory. A directory sweep would
      // cover the file and leave this empty, which is the distinction the
      // acceptance turns on.
      expect(naming.length).toBeGreaterThan(0);
    },
  );

  it.each(WIRED)("names %s in the wiring workflow itself", (testPath) => {
    // So the step cannot drift into a job that does not run on a pull request
    // while the case above stays green on some other workflow's command.
    expect(readFileSync(path.join(repoRoot, WIRING_WORKFLOW), "utf8")).toContain(
      testPath,
    );
  });

  it.each(NOT_YET_BEHAVIOUR)(
    "leaves %s unrun, because T-558 owns it and a sweep would have taken it",
    (testPath) => {
      expect(existsSync(path.join(repoRoot, testPath))).toBe(true);
      expect(unrun.has(testPath)).toBe(true);
    },
  );
});
