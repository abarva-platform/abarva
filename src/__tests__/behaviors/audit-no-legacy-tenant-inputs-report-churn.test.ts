import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A verification step must not dirty the tree it is verifying.
 *
 * `scripts/audit/check-no-legacy-tenant-inputs.mjs` runs on every
 * `node scripts/release-check.mjs`, which the standing rules tell every author to
 * run before opening a PR. It writes six reports into
 * `reports/data-standard/legacy-purge/`, and all six are committed. Two of them
 * carried a fresh `generatedAt` on every run regardless of findings, so the gate
 * left two modified files the author never touched — every run, unconditionally.
 * Three agents hit it separately on one day and each worked around it by hand.
 *
 * These cases pin the behaviour from both directions, because only one of the two
 * is a defect and an over-broad repair would trade it for the other:
 *
 *   - unchanged findings must leave every report byte-identical on disk, and
 *   - changed findings must still be written, with a new `generatedAt`.
 *
 * A fix that stops writing altogether satisfies the first and fails the second.
 * A fix that writes unconditionally satisfies the second and fails the first.
 *
 * The script is driven as a real subprocess in a scratch git repository rather
 * than imported, because the thing under test is what it leaves on the filesystem
 * and what `git status` says about it afterwards — neither of which a unit call
 * would observe. A scratch repo is used rather than this one so a regression
 * reports as a red test instead of as a dirty working tree in the repo running it.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const scriptPath = path.join(repoRoot, "scripts/audit/check-no-legacy-tenant-inputs.mjs");
const REPORT_DIR = "reports/data-standard/legacy-purge";

/** Enough rounds to reach the fixed point; unfixed code never reaches it. */
const CONVERGENCE_ROUNDS = 6;

const REPORTS = [
  "summary.json",
  "blocked-loader-paths.json",
  "deleted-legacy-files.csv",
  "remaining-allowed-legacy-references.csv",
  "summary.md",
  "no-legacy-tenant-inputs-proof.html",
] as const;

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function runAudit(cwd: string): { status: number; output: string } {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output: stdout };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

/** A tracked, committed repository carrying the audit's own committed reports. */
function makeScratchRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "legacy-purge-churn-"));
  git(dir, ["init", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  writeFileSync(path.join(dir, "README.md"), "scratch\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-m", "base"]);

  // Bring the repo to the audit's fixed point before measuring, because the audit
  // scans its own committed reports: once they are tracked they become
  // `remaining-allowed-legacy-references` rows, which changes the next run's
  // findings legitimately. The real repository has been at that fixed point since
  // the reports were first committed, so converging here is what reproduces it —
  // and it means any churn the assertions then see is churn with no finding behind
  // it, which is the whole claim.
  for (let round = 0; round < CONVERGENCE_ROUNDS; round += 1) {
    runAudit(dir);
    if (statusPorcelain(dir) === "") break;
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-m", `converge ${round}`]);
  }
  return dir;
}

function readReport(dir: string, name: string): string {
  return readFileSync(path.join(dir, REPORT_DIR, name), "utf8");
}

function statusPorcelain(dir: string): string {
  return git(dir, ["status", "--porcelain"]).trim();
}

describe("audit:no-legacy-tenant-inputs does not dirty the tree it verifies", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeScratchRepo();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("leaves the working tree clean when findings are unchanged", () => {
    expect(statusPorcelain(dir)).toBe("");

    const result = runAudit(dir);
    expect(result.status).toBe(0);

    expect(statusPorcelain(dir)).toBe("");
  });

  it("leaves every committed report byte-identical when findings are unchanged", () => {
    const before = Object.fromEntries(REPORTS.map((name) => [name, readReport(dir, name)]));

    runAudit(dir);

    for (const name of REPORTS) {
      expect(readReport(dir, name)).toBe(before[name]);
    }
  });

  it("does not rewrite a report whose content is unchanged", () => {
    // `git status` cannot see this one. Four of the six reports are fully
    // deterministic, so rewriting them with identical bytes leaves the tree clean
    // and a "don't dirty the tree" assertion passes over a writer that still fires
    // on every run. Modification time is what distinguishes "did not write" from
    // "wrote the same thing", and not writing is the property the fix claims.
    const before = Object.fromEntries(
      REPORTS.map((name) => [
        name,
        statSync(path.join(dir, REPORT_DIR, name), { bigint: true }).mtimeNs,
      ]),
    );

    runAudit(dir);

    for (const name of REPORTS) {
      expect({
        report: name,
        mtimeNs: statSync(path.join(dir, REPORT_DIR, name), { bigint: true }).mtimeNs,
      }).toEqual({ report: name, mtimeNs: before[name] });
    }
  });

  it("keeps the tree clean across repeated runs, not only the second", () => {
    runAudit(dir);
    runAudit(dir);
    runAudit(dir);

    expect(statusPorcelain(dir)).toBe("");
  });

  it("still rewrites the reports, with a new generatedAt, when findings change", () => {
    const before = JSON.parse(readReport(dir, "summary.json")) as {
      generatedAt: string;
      blockedLoaderPathCount: number;
    };
    expect(before.blockedLoaderPathCount).toBe(0);

    // `public/setup-templates/**` is a blocked loader-visible path. Tracked, so
    // `git ls-files` sees it.
    mkdirSync(path.join(dir, "public/setup-templates"), { recursive: true });
    writeFileSync(path.join(dir, "public/setup-templates/legacy.csv"), "a,b\n1,2\n");
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-m", "reintroduce a legacy path"]);

    const result = runAudit(dir);
    expect(result.status).toBe(1);

    const after = JSON.parse(readReport(dir, "summary.json")) as {
      generatedAt: string;
      blockedLoaderPathCount: number;
    };
    expect(after.blockedLoaderPathCount).toBe(1);
    expect(after.generatedAt).not.toBe(before.generatedAt);
    expect(readReport(dir, "summary.md")).toContain(
      "Blocked loader-visible legacy paths remaining: 1",
    );
  });

  it("writes the reports when they are absent", () => {
    const fresh = mkdtempSync(path.join(tmpdir(), "legacy-purge-fresh-"));
    try {
      git(fresh, ["init", "-b", "main"]);
      git(fresh, ["config", "user.email", "test@example.com"]);
      git(fresh, ["config", "user.name", "Test"]);
      writeFileSync(path.join(fresh, "README.md"), "scratch\n");
      git(fresh, ["add", "-A"]);
      git(fresh, ["commit", "-m", "base"]);

      const result = runAudit(fresh);
      expect(result.status).toBe(0);

      for (const name of REPORTS) {
        expect(readFileSync(path.join(fresh, REPORT_DIR, name), "utf8").length).toBeGreaterThan(0);
      }
    } finally {
      rmSync(fresh, { recursive: true, force: true });
    }
  });
});
