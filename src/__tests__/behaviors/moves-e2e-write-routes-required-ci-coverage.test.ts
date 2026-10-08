import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";
import { evaluateNamedSuiteRequiredness } from "../../../scripts/quality/check-named-suite-requiredness.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

/**
 * Slice 18 of the AI surface control catalog. Slice 17 took the gate-approval
 * route; these are the other two writes a Move cannot finish a phase without,
 * and both were in the state slice 17 was built to end.
 *
 * The coverage census read each directory COVERED, because `unit-suites.yml`
 * named a suite inside it. That job is in none of the required contexts, so the
 * census's answer — "is this reached by SOME workflow" — was true while every
 * case guarding either route could have been deleted with no merge-blocking
 * check going red. The census cannot see the difference; that is measured here
 * rather than asserted as a regression, in the last case below.
 *
 * Each route is named for what it does on the end-to-end path, because a
 * directory sweep can own a path that is no longer live:
 *
 *   - the phase build. POST is fetched from PhaseApproveAndBuild.tsx, the
 *     control that turns an approved phase into its deliverables. Without it a
 *     phase produces no document at all.
 *   - the evidence approval. POST is fetched from FileCabinetPanel.tsx and
 *     CurrentStateReadinessPanel.tsx — the two surfaces where a reviewer turns
 *     a pending evidence review into an approved one, which the discovery gate
 *     requires before a phase can be crossed.
 */
const REQUIRED_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

/**
 * The workflow that named both suites before. Its job blocks nothing, which is
 * why the names had to leave it: a suite a required job runs must be NAMED
 * inside a required job, or the quotable line in a log belongs to the run that
 * cannot block a merge.
 */
const NON_REQUIRED_WORKFLOW = ".github/workflows/unit-suites.yml";

type Route = {
  readonly label: string;
  /** The directory as it sits on disk. */
  readonly directory: string;
  /**
   * The same directory as jest must be given it. A bare positional argument is
   * a REGEX, so a dynamic route segment's brackets have to be escaped. Passed
   * unescaped, `[evidenceId]` is a character class, the pattern matches nothing
   * and jest exits 1 with "No tests found" — a step that looks like it owns the
   * directory while owning none of it. A route with no dynamic segment needs no
   * escaping and its two spellings are the same string.
   */
  readonly jestPattern: string;
  /** A suite that must be on disk, so the ownership cases cannot pass vacuously. */
  readonly suite: string;
};

const ROUTES: readonly Route[] = [
  {
    label: "the phase deliverable build route",
    directory: "src/app/api/v1/deliverables/generate-phase/__tests__",
    jestPattern: "src/app/api/v1/deliverables/generate-phase/__tests__",
    suite: "route.test.ts",
  },
  {
    label: "the current-state evidence approval route",
    directory:
      "src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/__tests__",
    jestPattern:
      "src/app/api/v1/programs/\\[programId\\]/current-state/evidence/\\[evidenceId\\]/approve/__tests__",
    suite: "route.test.ts",
  },
];

/**
 * `preserveEscapes` is load-bearing. The extractor's default shape rewrites
 * `\\` to `/` so a Windows-style path in a command matches a repo-relative one
 * — right for a path, wrong for a regex, and a jest positional argument is a
 * regex. Without it the escaped step reads back as `programs//[programId/]/...`
 * and every case below would assert against a spelling no workflow contains.
 */
function jestCommands(workflow: string): string[] {
  const contents = readFileSync(path.join(repoRoot, workflow), "utf8");
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  return expandWorkflowCommands(
    extractWorkflowRunCommands(contents, { preserveEscapes: true }),
    scripts,
    { preserveEscapes: true },
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
}

describe.each(ROUTES)("$label suite required-CI ownership", (route) => {
  it("is swept as a directory from the required catalog workflow", () => {
    const command = jestCommands(REQUIRED_WORKFLOW).find((candidate) =>
      candidate.includes(route.jestPattern),
    );

    // A directory sweep, not a --runTestsByPath list, so a suite added to the
    // directory is owned without editing the workflow.
    expect(command).toBeDefined();
    expect(command).not.toContain("--runTestsByPath");
  });

  it("points jest at a directory that is really there", () => {
    expect(existsSync(path.join(repoRoot, route.directory))).toBe(true);
  });

  it("holds its suite on disk, so the ownership case cannot pass vacuously", () => {
    const onDisk = readdirSync(path.join(repoRoot, route.directory))
      .filter((file) => /\.test\.tsx?$/.test(file))
      .sort();
    expect(onDisk).toContain(route.suite);
  });

  it("leaves the name out of the workflow that cannot block a merge", () => {
    const named = jestCommands(NON_REQUIRED_WORKFLOW).filter((command) =>
      command.includes(`${route.directory}/`),
    );

    // Not a rule against duplication — a second run inside another REQUIRED job
    // would be legal. The defect is a named, quotable line in a job that cannot
    // block a merge while the blocking run stays anonymous.
    expect(named).toEqual([]);
  });

  it("is a directory the requiredness control resolves, not just a string in a file", () => {
    const { requiredSweeps } = evaluateNamedSuiteRequiredness({ repoRoot });

    // The control resolves the regex escapes before asking the filesystem, so
    // this is the reading that proves the sweep is a real directory under a
    // required context — and not, say, a renamed route whose step still parses.
    expect(
      requiredSweeps.filter(
        (sweep: { directory: string }) => sweep.directory === route.directory,
      ),
    ).toEqual([
      {
        directory: route.directory,
        context: "AI surface control catalog",
        source: REQUIRED_WORKFLOW,
      },
    ]);
  });
});

describe("the dynamic route segment", () => {
  it("is escaped in the catalog step, because the unescaped spelling runs nothing", () => {
    const evidence = ROUTES[1];
    const command = jestCommands(REQUIRED_WORKFLOW).find((candidate) =>
      candidate.includes("current-state/evidence"),
    );

    expect(command).toBeDefined();
    // The failure this case refuses: a valid-looking step whose pattern is a
    // character class and selects no test at all. Measured directly — jest
    // exits 1 with "No tests found" when given the unescaped spelling.
    expect(command).not.toContain(`${evidence.directory}'`);
    expect(command).toContain(evidence.jestPattern);
  });

  it("needs no escaping on the route that has no dynamic segment", () => {
    const build = ROUTES[0];
    expect(build.jestPattern).toBe(build.directory);
    expect(build.jestPattern).not.toContain("\\");
  });
});
