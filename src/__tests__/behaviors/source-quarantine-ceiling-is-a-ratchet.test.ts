import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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
 * deleted silently. These cases run the real script against a temporarily
 * modified list and restore it, which is the only way to exercise a check
 * that reads its own repository.
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

type Result = { code: number; output: string };

function runChecker(): Result {
  try {
    const output = execFileSync(process.execPath, [CHECKER], {
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

/** Run the checker against a modified list, then put the list back. */
function withList(mutate: (doc: Record<string, unknown>) => void): Result {
  const original = fs.readFileSync(LIST, "utf8");
  try {
    const doc = JSON.parse(original) as Record<string, unknown>;
    mutate(doc);
    fs.writeFileSync(LIST, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    return runChecker();
  } finally {
    fs.writeFileSync(LIST, original, "utf8");
  }
}

describe("the Source quarantine ceilings are ratchets in both directions", () => {
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
    const result = withList((doc) => {
      doc.alsoIgnored = [];
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
    expect(result.output).toContain("ceiling is 1");
  });

  it("puts the list back after each case", () => {
    // The cases above rewrite a real repository file. If a restore ever
    // failed, every later run would be measuring a corrupted list and this
    // is the case that would say so.
    const doc = JSON.parse(fs.readFileSync(LIST, "utf8")) as {
      quarantined: unknown[];
      alsoIgnored: unknown[];
      alsoIgnoredCeiling: number;
    };

    expect(doc.quarantined).toHaveLength(8);
    expect(doc.alsoIgnored).toHaveLength(1);
    expect(doc.alsoIgnoredCeiling).toBe(1);
  });
});
