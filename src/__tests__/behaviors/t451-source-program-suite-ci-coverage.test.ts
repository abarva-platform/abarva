import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const censusScript = "scripts/quality/test-ci-coverage-census.mjs";

const OWNED_DIRECTORIES = [
  {
    directory: "src/app/api/programs/__tests__",
    suites: [
      "attachments-download.smoke.test.ts",
      "attachments-upload.smoke.test.ts",
    ],
  },
  {
    directory: "src/app/api/setup/initiatives/__tests__",
    suites: ["route-post.test.ts", "route.test.ts"],
  },
  {
    directory: "src/lib/source/contract-depth-package/__tests__",
    // `clause-text-basis.test.ts` added with item D-402. It is named by the
    // required `Routes and disclaimers` job in `integrity.yml` as well as by
    // the directory sweep in `unit-suites.yml`, so the ownership assertions
    // below hold for it unchanged: the directory is still named by a workflow
    // jest command, and the census still reports it neither partially covered
    // nor uncovered (coveredTestFiles 2546 -> 2547, uncoveredTestFiles
    // unchanged at 164).
    //
    // This list is a DECLARATION of the directory's contents, and the case
    // that reads it is the reason a new suite here cannot arrive unowned. It
    // failed on the branch that added the file, which is the gate working;
    // declaring the suite is the sanctioned update, and no assertion is
    // loosened to do it.
    suites: [
      "adapter.test.ts",
      "clause-text-basis.test.ts",
      "projection.test.ts",
    ],
  },
  {
    directory: "src/lib/source/file-cabinet/__tests__",
    suites: ["file-cabinet.test.ts", "repository.test.ts"],
  },
] as const;

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: { directory: string }[];
  uncoveredDirectories: { directory: string }[];
};

function runCensus(): Census {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, censusScript), "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout.slice(stdout.indexOf("{"))) as Census;
}

function workflowJestCommands(): string[] {
  const workflowDir = path.join(repoRoot, ".github/workflows");
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;

  return expandWorkflowCommands(
    readdirSync(workflowDir)
      .filter((name) => /\.ya?ml$/.test(name))
      .flatMap((name) =>
        extractWorkflowRunCommands(
          readFileSync(path.join(workflowDir, name), "utf8"),
        ),
      ),
    scripts,
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
}

const census = runCensus();
const jestCommands = workflowJestCommands();

describe("T-451 Source and Programs suite ownership", () => {
  it("measures exactly the nine named suites", () => {
    expect(
      OWNED_DIRECTORIES.flatMap(({ directory, suites }) =>
        suites.map((suite) => `${directory}/${suite}`),
      ),
    ).toHaveLength(9);

    for (const { directory, suites } of OWNED_DIRECTORIES) {
      expect(
        readdirSync(path.join(repoRoot, directory))
          .filter((entry) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry))
          .sort(),
      ).toEqual([...suites].sort());
    }
  });

  it("resolves all workflow Jest invocations before making ownership claims", () => {
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it.each(OWNED_DIRECTORIES)(
    "gives every suite in $directory a workflow owner",
    ({ directory }) => {
      const escaped = directory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(
        jestCommands.some((command) =>
          new RegExp(`(?:^|[\\s"'\`=])${escaped}(?=$|[\\s"'\`])`).test(
            command,
          ),
        ),
      ).toBe(true);

      expect(
        census.partiallyCoveredDirectories.some(
          (row) => row.directory === directory,
        ),
      ).toBe(false);
      expect(
        census.uncoveredDirectories.some((row) => row.directory === directory),
      ).toBe(false);
    },
  );
});
