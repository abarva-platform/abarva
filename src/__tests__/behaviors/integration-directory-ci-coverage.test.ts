import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * `src/__tests__/integration/source` held 92 suites that no workflow ran. It was
 * found by accident — a pull request added two suites there and the "changed
 * integration suites have a CI owner" gate blocked it, because that gate only
 * ever fires on a suite the current pull request *changes*. Every untouched
 * suite sat unexecuted indefinitely.
 *
 * Wiring that one directory did not answer the question it raised: how much of
 * the rest of the integration tree is in the same position. Measured on
 * `2a1a87dd0`, through the census's own resolver rather than by reading YAML:
 * **467 integration suites exist, 172 were reached by a workflow, 295 by
 * nothing**, across 21 leaf directories with zero coverage. The directory that
 * revealed the blind spot was a third of it.
 *
 * These cases hold two separate things, and the second is the one that lasts:
 *
 *   1. the directories this repository claims to run really are reached — proved
 *      through the same four-hop resolver the census uses, never by searching
 *      the workflow file for a string. A wrapper script that shells out to jest
 *      satisfies a string search and registers nothing; that exact draft was
 *      written and discarded when the `source` directory was wired; and
 *   2. no *new* integration directory joins the dark set. A ratchet, not a
 *      floor: wiring one of the named twelve is always allowed and needs no
 *      edit here, while adding a twenty-second dark directory fails.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const INTEGRATION_ROOT = "src/__tests__/integration";

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: { directory: string; testFiles: number; coveredTestFiles: number }[];
  uncoveredDirectories: { directory: string; testFiles: number; coveredTestFiles: number }[];
};

/**
 * Directories wired by `.github/workflows/integration-suites.yml`. Each one was
 * run in full on `2a1a87dd0` and passed with no exclusions, which is why none of
 * them needs a quarantine list the way `source` does.
 */
const WIRED_DIRECTORIES = [
  "architecture",
  "corpus",
  "data-trust",
  "demo",
  "deployment",
  "engagement",
  "knowledge",
  "nexus",
  "observability",
  "programs",
  "security",
  "sentinel",
  "solutions",
  "story-pack",
  "tenants",
] as const;

/**
 * The directories still reached by nothing, each with the reason it was not
 * wired in the same change. Every one of them failed when run on `2a1a87dd0`;
 * a red directory is wired by fixing it or by quarantining named suites with
 * named reasons, never by adding it here.
 *
 * `""` is the integration root itself — 45 loose suites directly under
 * `src/__tests__/integration`, 11 of which a workflow reaches. It cannot be
 * wired by naming the root, because that command would also run every red
 * subdirectory below it.
 */
const KNOWN_DARK_DIRECTORIES = new Set([
  "",
  "admin",
  "admin/data",
  "agent",
  "agents",
  "design",
  "intelligence",
  "ops",
  "qa",
  "setup",
]);

function runCensus(): Census {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, CENSUS_SCRIPT), "--json"],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(stdout.slice(stdout.indexOf("{"))) as Census;
}

/** Every directory under the integration root that directly holds a test file. */
function integrationLeafDirectories(): string[] {
  const found: string[] = [];
  const walk = (relative: string) => {
    const absolute = path.join(repoRoot, relative);
    const entries = readdirSync(absolute);
    if (entries.some((entry) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry))) {
      found.push(relative);
    }
    for (const entry of entries) {
      if (entry === "__snapshots__" || entry === "fixtures") continue;
      if (statSync(path.join(absolute, entry)).isDirectory()) walk(path.join(relative, entry));
    }
  };
  walk(INTEGRATION_ROOT);
  return found;
}

const census = runCensus();
const zeroCoverage = new Set(
  census.uncoveredDirectories
    .filter((row) => row.directory === INTEGRATION_ROOT || row.directory.startsWith(`${INTEGRATION_ROOT}/`))
    .map((row) => row.directory),
);
const partialCoverage = new Map(
  census.partiallyCoveredDirectories
    .filter((row) => row.directory === INTEGRATION_ROOT || row.directory.startsWith(`${INTEGRATION_ROOT}/`))
    .map((row) => [row.directory, row]),
);

describe("integration directories a workflow actually reaches", () => {
  it("resolves every wired directory through the real four-hop resolver, not a text search", () => {
    // If the census cannot resolve some Jest invocation to literal paths its
    // coverage answer is an upper bound, and these assertions would be reading
    // a guess. Fail loudly rather than pass on one.
    expect(census.counts.indeterminateInvocations).toBe(0);

    const unreached = WIRED_DIRECTORIES.filter((name) => {
      const directory = `${INTEGRATION_ROOT}/${name}`;
      return zeroCoverage.has(directory) || partialCoverage.has(directory);
    });
    expect(unreached).toEqual([]);
  });

  it("names each wired directory literally in a workflow command, so the visibility gate can see it", () => {
    const workflow = readFileSync(
      path.join(repoRoot, ".github/workflows/integration-suites.yml"),
      "utf8",
    );
    const runLines = workflow
      .split("\n")
      .filter((line) => /\bjest\b/.test(line))
      .join("\n");

    for (const name of WIRED_DIRECTORIES) {
      // Followed by whitespace or end of line: the visibility gate requires the
      // path to end the token, so a trailing slash would make it stop matching.
      expect(runLines).toMatch(new RegExp(`${INTEGRATION_ROOT}/${name}(?=\\s|$)`));
    }
  });

  it("records every extra path a wired directory's jest pattern also selects", () => {
    // A jest path argument is a regex tested against the full path, not a
    // directory handle. Naming `…/agent` also runs `…/agents`; naming
    // `…/programs` also runs the loose root file `…/programs-api-contracts.test.ts`.
    // Anchoring the pattern is not available — a trailing slash is exactly what
    // makes the visibility gate stop seeing the path — so the collisions are
    // enumerated and each one has to have been measured.
    const entries = readdirSync(path.join(repoRoot, INTEGRATION_ROOT));
    const collisions: string[] = [];
    for (const name of WIRED_DIRECTORIES) {
      for (const entry of entries) {
        if (entry === name || !entry.startsWith(name)) continue;
        collisions.push(entry);
      }
    }
    // The eight below are root-level suites the `programs` pattern also selects.
    // All eight were run on `2a1a87dd0` as part of the wired command and passed,
    // which is the only reason they are acceptable here: they are 8 of the 45
    // loose root suites, and they now run rather than not running. A NEW
    // colliding entry has been measured by nobody, so it fails this case until
    // somebody runs it and decides.
    expect(collisions.sort()).toEqual([
      // The `demo` pattern selects these three root-level suites. All three
      // were run on `66acc1a2a` as part of the wired command and pass;
      // `demo-code-sign-in-panel.test.ts` is one of the five this change
      // repaired, so it is measured rather than assumed.
      "demo-code-sign-in-panel.test.tsx",
      "demo-code-sign-in-route.test.ts",
      "demo-p0-graceful-degradation.test.ts",
      "programs-api-contracts.test.ts",
      "programs-demo-beats.test.ts",
      "programs-enhancement-seed-planner.test.ts",
      "programs-enhancement-seed-writer.test.ts",
      "programs-enhancement-spec.test.ts",
      "programs-nexus-ask-route.test.ts",
      "programs-nexus-free-text.test.ts",
      "programs-quality-gates.test.ts",
    ]);
  });

  it("admits no integration directory that is newly reached by nothing", () => {
    const dark = integrationLeafDirectories()
      .filter((directory) => zeroCoverage.has(directory) || partialCoverage.has(directory))
      .map((directory) => directory.slice(INTEGRATION_ROOT.length).replace(/^\//, ""))
      .sort();

    const unrecorded = dark.filter((name) => !KNOWN_DARK_DIRECTORIES.has(name));
    // A ratchet: the set may shrink without editing this file. It may not grow.
    // A new integration directory belongs in a workflow command on the day it
    // lands, not on the day somebody trips over it.
    expect(unrecorded).toEqual([]);
  });
});
