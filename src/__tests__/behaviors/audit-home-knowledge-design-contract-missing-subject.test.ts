import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * An audit whose declared subject is missing must say so. It must not crash.
 *
 * `scripts/audit/home-knowledge-design-contract-ui.mjs` reads
 * `src/components/home/HomeKnowledgeDesignContractSurface.tsx` twice with a bare
 * `readFileSync`. That file was deleted, so all four npm entry points that share
 * this script — `audit:home-knowledge-design-contract-ui`,
 * `audit:home-dimension-data-tab`, `audit:home-dimension-evidence-tab` and
 * `audit:home-dimension-story-claims` — die with an unhandled ENOENT stack trace
 * instead of reporting anything an operator can act on.
 *
 * The obvious repair is the wrong one. Guarding the read with
 * `existsSync(p) ? readFileSync(p) : ""` is the idiom that made the sibling audit
 * score a missing file as nine out of nine: an absent subject becomes an empty
 * string, the empty string mentions nothing forbidden, and the scan goes green.
 * These cases therefore pin three things together — the run names the missing
 * subject, it still fails, and it does not go quiet — so neither the crash nor a
 * silent pass can satisfy them.
 *
 * Deliberately NOT pinned here: whether the design-contract surface should be
 * restored or the audit retargeted. That decision belongs with the seven criteria
 * in `audit:home-cxo-story-quality` that name the same file, and is taken once,
 * for both, by the owner.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const scriptPath = path.join(
  repoRoot,
  "scripts/audit/home-knowledge-design-contract-ui.mjs",
);
const subjectRelPath =
  "src/components/home/HomeKnowledgeDesignContractSurface.tsx";

const PACK_REL =
  "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json";
const MIRROR_REL =
  "datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-home-knowledge-design-contract-pack.json";

type Run = { status: number; output: string };

function runAudit(cwd: string, mode = "ui"): Run {
  try {
    const stdout = execFileSync(
      process.execPath,
      [scriptPath, "--mode", mode],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, output: stdout };
  } catch (error) {
    const err = error as {
      status?: number;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`,
    };
  }
}

/** An unhandled throw, as opposed to a reported failure. */
function looksLikeAnUnhandledCrash(output: string): boolean {
  return /code: 'ENOENT'/.test(output) || /\n\s+at \w+ \(/.test(output);
}

/**
 * A scratch tree carrying only what the audit reads before it reaches its
 * component subject: the two approved packs. Everything else the script touches
 * before that point is either created by it (the report directory) or already
 * guarded (`loadCsvText`). Symlinked rather than copied — they are 3.5 MB each.
 */
function makeScratchTree(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "design-contract-audit-"));
  for (const rel of [PACK_REL, MIRROR_REL]) {
    mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    symlinkSync(path.join(repoRoot, rel), path.join(dir, rel));
  }
  return dir;
}

describe("home-knowledge design-contract UI audit: a missing subject is stated, not thrown", () => {
  const scratchDirs: string[] = [];

  afterAll(() => {
    for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
  });

  it("reports the missing component by path instead of an unhandled ENOENT", () => {
    const dir = makeScratchTree();
    scratchDirs.push(dir);
    expect(existsSync(path.join(dir, subjectRelPath))).toBe(false);

    const run = runAudit(dir);

    expect(run.output).toContain(subjectRelPath);
    expect(run.output).toMatch(/FAIL:/);
    expect(looksLikeAnUnhandledCrash(run.output)).toBe(false);
  });

  it("still fails, and fails for the stated reason rather than a later one", () => {
    const dir = makeScratchTree();
    scratchDirs.push(dir);

    const run = runAudit(dir);

    // Exit code alone is no evidence here: this audit has other reasons to exit
    // 1, so a silent-pass regression would still exit 1 — just further down, on
    // the visual markers it could not find in an empty string. The reason has to
    // be the missing subject, and nothing downstream may have been scored.
    expect(run.status).not.toBe(0);
    expect(run.output).toMatch(/missing declared subject/i);
    expect(run.output).not.toMatch(/visual replacement markers/i);
  });

  it("does not report a subject that is present as missing", () => {
    const dir = makeScratchTree();
    scratchDirs.push(dir);
    mkdirSync(path.join(dir, path.dirname(subjectRelPath)), {
      recursive: true,
    });
    writeFileSync(
      path.join(dir, subjectRelPath),
      "export function HomeKnowledgeDesignContractSurface() { return null; }\n",
      "utf8",
    );

    const run = runAudit(dir);

    // It will still fail — this stub carries none of the required Recharts
    // markers — but it must get past the subject read to find that out. A guard
    // that always reports "missing" would pass the two cases above and fail here.
    expect(run.output).not.toMatch(/missing declared subject/i);
    expect(looksLikeAnUnhandledCrash(run.output)).toBe(false);
  });

  it("holds on the real repository for all four npm entry points", () => {
    // The four scripts in package.json differ only by --mode, so one broken read
    // took all four down. Proving one mode would not prove that.
    for (const mode of ["ui", "data-tab", "evidence-tab", "story-claims"]) {
      const run = runAudit(repoRoot, mode);
      expect(looksLikeAnUnhandledCrash(run.output)).toBe(false);
      expect(run.output).toContain(subjectRelPath);
      expect(run.status).not.toBe(0);
    }
  });
});
