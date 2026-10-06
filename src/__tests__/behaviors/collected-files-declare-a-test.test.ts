/**
 * Every file Jest collects under `src/` must declare at least one test.
 *
 * A file that is collected but declares nothing fails with "Your test suite
 * must contain at least one test". That is noise, and there was enough of it
 * to matter: eleven such files under `src/` were drowning the three suites
 * that genuinely failed to COLLECT — the least visible defect in the estate,
 * because a suite that collects nothing runs zero assertions while appearing
 * in the log as an ordinary red suite, and the coverage census counts it as a
 * covered test file regardless.
 *
 * Those eleven are excluded in `jest.config.ts`. This case is what stops the
 * twelfth arriving, because `next/jest`'s default `testMatch` includes
 * `**\/__tests__\/**\/*` — so ANY file placed under a `__tests__` directory is
 * collected as a suite whether it is one or not.
 *
 * Scoped to `src/` deliberately. Outside it, 73 collected files declare no
 * test: 62 standalone `run-*.mjs` regression runners under `scripts/`, each
 * with a shebang and its own npm entry point, and 11 Playwright smoke specs.
 * None are Jest suites, none are this file's business, and a repository-wide
 * assertion would fail on arrival — which is the one thing a new gate must
 * never do.
 *
 * The ignore list is READ from the Jest config rather than restated here. A
 * second copy would be a hand-maintained list beside the one it mirrors, and
 * the two would drift the first time someone edited only one.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SRC = path.join(REPO_ROOT, "src");

/** The ignore patterns the real config applies, not a copy of them. */
function configuredIgnorePatterns(): RegExp[] {
  const source = readFileSync(path.join(REPO_ROOT, "jest.config.ts"), "utf8");
  const block = source.match(/testPathIgnorePatterns:\s*\[([\s\S]*?)\]/);
  if (!block) return [];
  return [...block[1].matchAll(/['"]([^'"]+)['"]/g)]
    .map((m) => m[1].replace("<rootDir>", REPO_ROOT).replaceAll("\\\\", "\\"))
    .map((p) => new RegExp(p));
}

/**
 * next/jest's default `testMatch`: anything under a `__tests__` directory, and
 * anything suffixed `.test.` or `.spec.`.
 */
function isCollected(file: string): boolean {
  const unix = file.replaceAll("\\", "/");
  if (!/\.(ts|tsx|js|jsx)$/.test(unix)) return false;
  return (
    unix.includes("/__tests__/") || /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(unix)
  );
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/**
 * `describe`, `it` or `test`, including `.each` forms and the tagged-template
 * spelling. Deliberately permissive: this case exists to catch a file that
 * declares NOTHING, and a false failure here would be worse than a miss.
 */
const DECLARES_A_TEST = /\b(it|test|describe)\s*(\.\w+)*\s*(\(|`)/;

describe("files Jest collects under src/", () => {
  const ignore = configuredIgnorePatterns();
  const collected = walk(SRC)
    .filter(isCollected)
    .filter((file) => !ignore.some((re) => re.test(file)));

  it("reads a non-trivial set of files, so an empty glob cannot pass vacuously", () => {
    // Without this, a walk that silently returned nothing would satisfy the
    // case below by having nothing to check. Jest collected 2337 files under
    // src/ when this was written; the floor is far enough below that to
    // survive ordinary churn and far enough above zero to mean something.
    expect(collected.length).toBeGreaterThan(1500);
  });

  it("every one of them declares at least one test", () => {
    const silent = collected
      .filter((file) => !DECLARES_A_TEST.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(REPO_ROOT, file))
      .sort();

    // Named rather than counted: a count tells the next reader to change a
    // number, a list tells them which file to move or exclude.
    expect(silent).toEqual([]);
  });
});
