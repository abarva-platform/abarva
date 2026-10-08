import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";
import { evaluateNamedSuiteRequiredness } from "../../../scripts/quality/check-named-suite-requiredness.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

/**
 * Slice 19 of the AI surface control catalog. Slices 17 and 18 took the
 * gate-approval, phase-advance, phase-build and evidence-approval routes. These
 * are the three writes that turn a GENERATED document into an APPROVED one, and
 * phase gate criteria read the signed-off state they produce, so a phase cannot
 * be crossed without them.
 *
 * All three were in the state those slices were built to end. The coverage
 * census read each directory COVERED — two because the non-required job named a
 * suite inside it, and all three because that job's broad
 * `src/app/api/v1/programs` argument selects them. The census's question is "is
 * this reached by SOME workflow", and the answer was honestly yes while every
 * case guarding any of the three routes could have been deleted with no
 * merge-blocking check going red. A release landed cases in two of these
 * directories with exactly that gap in place, which is what made this the next
 * slice rather than a later one.
 *
 * Each route is named for what it does on the end-to-end path, because a
 * directory sweep can own a path that is no longer live:
 *
 *   - sign-off records a deliverable as signed off. POST is fetched from
 *     DeliverableApprovalAction.tsx, which PhaseApproveAndBuild.tsx and
 *     PhaseDocumentsPanel.tsx both mount.
 *   - client-approval and review-decision are the two dispositions a reviewer
 *     records against a generated artifact. Both are fetched from
 *     FileCabinetPanel.tsx, which MovesPhaseStandaloneClient.tsx mounts.
 */
const REQUIRED_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

/**
 * The workflow that named two of the three suites before. Its job blocks
 * nothing, which is why the names had to leave it: a suite a required job runs
 * must be NAMED inside a required job, or the quotable line in a log belongs to
 * the run that cannot block a merge.
 */
const NON_REQUIRED_WORKFLOW = ".github/workflows/unit-suites.yml";

type Route = {
  readonly label: string;
  /** The directory as it sits on disk. */
  readonly directory: string;
  /**
   * The same directory as jest must be given it. A bare positional argument is
   * a REGEX, so a dynamic route segment's brackets have to be escaped. Passed
   * unescaped, `[programId]` is a character class, the pattern matches nothing
   * and jest reports `0 matches` — a step that looks like it owns the directory
   * while owning none of it. Measured directly on the sign-off path before this
   * slice was wired.
   */
  readonly jestPattern: string;
  /** A suite that must be on disk, so the ownership cases cannot pass vacuously. */
  readonly suite: string;
};

const ROUTES: readonly Route[] = [
  {
    label: "the deliverable sign-off route",
    directory:
      "src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__",
    jestPattern:
      "src/app/api/v1/programs/\\[programId\\]/deliverables/\\[deliverableId\\]/sign-off/__tests__",
    suite: "route.test.ts",
  },
  {
    label: "the artifact client-approval route",
    directory:
      "src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__",
    jestPattern:
      "src/app/api/v1/programs/\\[programId\\]/artifacts/\\[artifactId\\]/client-approval/__tests__",
    suite: "route.test.ts",
  },
  {
    label: "the artifact review-decision route",
    directory:
      "src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-decision/__tests__",
    jestPattern:
      "src/app/api/v1/programs/\\[programId\\]/artifacts/\\[artifactId\\]/review-decision/__tests__",
    suite: "route.test.ts",
  },
];

/**
 * `preserveEscapes` is load-bearing. The extractor's default shape rewrites
 * `\\` to `/` so a Windows-style path in a command matches a repo-relative one
 * — right for a path, wrong for a regex, and a jest positional argument is a
 * regex. Without it an escaped step reads back as `programs//[programId/]/...`
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

describe("the dynamic route segments", () => {
  it.each(ROUTES)(
    "are escaped in $label's catalog step, because the unescaped spelling runs nothing",
    (route) => {
      const command = jestCommands(REQUIRED_WORKFLOW).find((candidate) =>
        candidate.includes(route.jestPattern),
      );

      expect(command).toBeDefined();
      // The failure these cases refuse: a valid-looking step whose pattern is a
      // character class and selects no test at all. Measured directly — jest
      // reports `0 matches` for the unescaped sign-off spelling.
      expect(command).not.toContain(`${route.directory}'`);
      expect(command).toContain(route.jestPattern);
    },
  );

  it("needs escaping on every route in this slice, because all three are nested dynamic routes", () => {
    // Slice 18 carried one route with no dynamic segment, whose two spellings
    // were the same string. None of these three are that shape, so there is no
    // unescaped-is-fine case here and an escape dropped from any of them is a
    // step that owns nothing.
    for (const route of ROUTES) {
      expect(route.jestPattern).not.toBe(route.directory);
      expect(route.jestPattern).toContain("\\[");
    }
  });
});
