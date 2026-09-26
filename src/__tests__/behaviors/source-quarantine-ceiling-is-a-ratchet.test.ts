import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { resolveQuarantineListPath } from "../../../scripts/quality/quarantine-list-path.mjs";

/**
 * Both ceilings in the Source integration quarantine turned one way only:
 * being over them failed, being under them did not. Clearing an entry
 * therefore left silent headroom, and the next exclusion would pass
 * unexamined.
 *
 * That was the fourth list in this repository found turning one way only —
 * the dark-directory list, the npm-script reconciliation baseline and the
 * quarantine comparison were the others — which makes it a habit rather than
 * an oversight, and worth a test rather than a fix alone.
 *
 * The checker had no test at all, so the rule added with it could have been
 * deleted silently. These cases run the real script against a modified list.
 *
 * T-488: that modified list used to be the COMMITTED file, rewritten in the
 * working tree and restored in a `finally`. The restore was faithful — the
 * bytes came back identical and `git status` stayed clean — so nothing ever
 * caught it. But `scripts/quality/test-ci-coverage-census.mjs` reads EVERY
 * `scripts/quality/*-quarantine.json`, and it is one of roughly thirty readers
 * of that directory. Measured on the pre-fix tree: a census driven while the
 * list was mutated read 34 declared quarantined suites instead of 35 and
 * credited 51 declared quarantines instead of 52, with no error raised and no
 * gate failed; a reader and a writer racing for eight seconds produced 1,037
 * unreadable reads and 111,280 wrong-length reads in 224,012. Fewer exclusions
 * read means coverage is over-credited, the same direction as T-487.
 *
 * So the checker now takes `--list <path>` and these cases mutate a scratch
 * copy. The committed file is never written, and the last case proves it by
 * mtime rather than by bytes — a write-then-restore leaves the bytes identical
 * and is invisible to every check that compares content.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");
const LIST = path.join(
  REPO_ROOT,
  "scripts/quality/source-integration-quarantine.json",
);
const CHECKER = path.join(
  REPO_ROOT,
  "scripts/quality/check-source-integration-quarantine.mjs",
);
const CHECKER_FILENAME = path.basename(CHECKER);

type Result = { code: number; output: string };

function runChecker(args: string[] = []): Result {
  try {
    const output = execFileSync(process.execPath, [CHECKER, ...args], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

/**
 * Run the checker against a modified COPY of the list.
 *
 * The scratch directory is deliberately outside `scripts/quality/`: a copy left
 * beside the committed lists would be swept up by the same `*-quarantine.json`
 * reading this exists to stop disturbing.
 */
function withList(mutate: (doc: Record<string, unknown>) => void): Result {
  const scratchDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "source-quarantine-ratchet-"),
  );
  try {
    const doc = JSON.parse(fs.readFileSync(LIST, "utf8")) as Record<
      string,
      unknown
    >;
    mutate(doc);
    const scratchList = path.join(
      scratchDir,
      "source-integration-quarantine.json",
    );
    fs.writeFileSync(scratchList, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    return runChecker(["--list", scratchList]);
  } finally {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }
}

/**
 * Every place the repository actually runs this checker, as the argv it would
 * hand the script. npm scripts and workflow steps both, because a direct
 * `node scripts/quality/...` line in a workflow would bypass package.json
 * entirely.
 */
function configuredInvocations(): { where: string; argv: string[] }[] {
  const found: { where: string; argv: string[] }[] = [];

  const argvAfterChecker = (command: string): string[] | null => {
    const tokens = command.split(/\s+/).filter(Boolean);
    const at = tokens.findIndex((token) => token.endsWith(CHECKER_FILENAME));
    return at === -1 ? null : tokens.slice(at + 1);
  };

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    const argv = argvAfterChecker(command);
    if (argv) found.push({ where: `package.json scripts.${name}`, argv });
  }

  const workflowDir = path.join(REPO_ROOT, ".github/workflows");
  if (fs.existsSync(workflowDir)) {
    for (const name of fs.readdirSync(workflowDir)) {
      if (!/\.ya?ml$/.test(name)) continue;
      const text = fs.readFileSync(path.join(workflowDir, name), "utf8");
      for (const line of text.split("\n")) {
        if (!line.includes(CHECKER_FILENAME)) continue;
        const argv = argvAfterChecker(line);
        if (argv) found.push({ where: `.github/workflows/${name}`, argv });
      }
    }
  }

  return found;
}

describe("the Source quarantine ceilings are ratchets in both directions", () => {
  let committedBytes: string;
  let committedMtimeMs: number;

  beforeAll(() => {
    committedBytes = fs.readFileSync(LIST, "utf8");
    committedMtimeMs = fs.statSync(LIST).mtimeMs;
  });

  it("passes on the list as it stands", () => {
    // The control. Every case below asserts a failure, and a checker that
    // failed unconditionally would satisfy all of them.
    const result = runChecker();

    expect(result.code).toBe(0);
    expect(result.output).toContain("quarantine is clean");
  });

  it("refuses a cleared suite that left its ceiling where it was", () => {
    const result = withList((doc) => {
      const quarantined = doc.quarantined as unknown[];
      quarantined.pop();
    });

    expect(result.code).not.toBe(0);
    expect(result.output).toContain("headroom");
    expect(result.output).toContain("in the same change that removed them");
  });

  it("refuses a cleared swept-in path that left its ceiling where it was", () => {
    // Rewritten by C-502, and the reason is the point of the case rather
    // than an accommodation to it. This used to empty `alsoIgnored` while
    // the ceiling stood at 1. The list is now EMPTY and the ceiling is 0
    // — C-502 fixed the shaper, so its one entry was removed and the
    // ceiling lowered in the same change, which is exactly the move this
    // case exists to require. Emptying an already-empty list creates no
    // headroom and would assert nothing, so the case now raises the
    // ceiling above the list instead. That is the same condition stated
    // from the other side: a ceiling above what the list holds is the
    // headroom, however it got there.
    const result = withList((doc) => {
      doc.alsoIgnored = [];
      doc.alsoIgnoredCeiling = 1;
    });

    expect(result.code).not.toBe(0);
    expect(result.output).toContain("headroom");
  });

  it("still refuses a list that grew past its ceiling", () => {
    // The original direction, which the new one must not have displaced.
    const result = withList((doc) => {
      const alsoIgnored = doc.alsoIgnored as Record<string, unknown>[];
      alsoIgnored.push({
        path: "scripts/quality/check-source-integration-quarantine.mjs",
        reason: "invented for this case",
        owner: "T-000",
      });
    });

    expect(result.code).not.toBe(0);
    // "ceiling is 0" since C-502 emptied the list and lowered the ceiling
    // with it. The direction under test is unchanged: one entry against a
    // ceiling of zero is over the ceiling exactly as two against one was.
    expect(result.output).toContain("ceiling is 0");
  });

  it("reads the committed list when no --list is given", () => {
    // The default is the whole safety of the override. If it ever resolved
    // anywhere else, every case above would still pass while the gate judged
    // a different file.
    expect(resolveQuarantineListPath([], LIST)).toBe(LIST);
  });

  it("refuses a --list with no path rather than falling back to the default", () => {
    // Documented as a property of the resolver, so it is asserted as one. The
    // dangerous spelling is the silent fallback: `--list` with its value lost
    // to a shell would then read the committed file while the caller believed
    // it had redirected, and the mutation cases would pass against the wrong
    // list without saying so.
    expect(() => resolveQuarantineListPath(["--list"], LIST)).toThrow(/needs a path/);
    expect(() => resolveQuarantineListPath(["--list", "--other"], LIST)).toThrow(
      /needs a path/,
    );
    expect(() => resolveQuarantineListPath(["--list="], LIST)).toThrow(/needs a path/);
  });

  it("refuses to resolve without a committed default", () => {
    // Without a default an absent `--list` would resolve to nothing and the
    // checker would read no list at all — a gate that passes because it
    // measured an empty set.
    expect(() =>
      (resolveQuarantineListPath as (a: string[], b?: unknown) => string)([]),
    ).toThrow(/needs the committed list/);
    expect(() =>
      (resolveQuarantineListPath as (a: string[], b?: unknown) => string)([], "  "),
    ).toThrow(/needs the committed list/);
  });

  it("actually reads the file --list names, not the committed one", () => {
    // Paired with the case above: together they say the override works AND
    // that it is not the default. A checker that ignored --list would pass
    // the default case alone.
    const result = withList((doc) => {
      const quarantined = doc.quarantined as { suite: string }[];
      quarantined[0] = {
        ...quarantined[0],
        suite: "t488-scratch-sentinel-does-not-exist.test.ts",
      };
    });

    expect(result.code).not.toBe(0);
    expect(result.output).toContain(
      "t488-scratch-sentinel-does-not-exist.test.ts",
    );
  });

  it("resolves every configured invocation back to the committed list", () => {
    // The destination, not the departure. Whatever flags a command carries,
    // what matters is the file the checker ends up reading — so the real argv
    // goes through the real resolver rather than being scanned for text.
    const invocations = configuredInvocations();

    expect(invocations.length).toBeGreaterThan(0);
    for (const { where, argv } of invocations) {
      expect([where, resolveQuarantineListPath(argv, LIST)]).toEqual([
        where,
        LIST,
      ]);
    }
  });

  it("never writes the committed list", () => {
    // T-488. The cases above used to rewrite this real repository file and
    // restore it. Comparing bytes cannot see that — the restore was faithful.
    // mtime can, and it is the only signal a concurrent reader's corruption
    // would have shared.
    const now = fs.statSync(LIST);

    expect(fs.readFileSync(LIST, "utf8")).toBe(committedBytes);
    expect(now.mtimeMs).toBe(committedMtimeMs);
  });

  it("holds the shape the cases above assume", () => {
    // The mutations are written against these counts; if the committed list
    // moves, they stop testing the direction they were written for.
    const doc = JSON.parse(fs.readFileSync(LIST, "utf8")) as {
      quarantined: unknown[];
      alsoIgnored: unknown[];
      alsoIgnoredCeiling: number;
    };

    expect(doc.quarantined).toHaveLength(8);
    expect(doc.alsoIgnored).toHaveLength(0);
    expect(doc.alsoIgnoredCeiling).toBe(0);
  });
});
