import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A typecheck that crashed must never read as a typecheck that passed.
 *
 * On this repository a bare `npx tsc --noEmit` exhausts the default V8 heap and
 * exits 134, printing a V8 crash trace that contains no diagnostic. Filtering
 * that output for `error TS` — the habit in this repo's release records —
 * returns nothing, so the crash reports as a clean run and any real type error
 * inside it is invisible. A release record on `main`
 * (`2026-09-17-visible-answer-contract-restore.md`) carries a correction saying
 * precisely that about a typecheck it had already claimed as passing.
 *
 * The backlog item behind these cases (40) blamed a stale `tsconfig.tsbuildinfo`
 * for re-reporting diagnostics on files that had since been fixed. That
 * mechanism was driven on `main` in both directions and does not reproduce:
 * TypeScript versions files by content hash, so an edit is always re-checked and
 * a fix is always believed. The reproducible defect is the crash above, and the
 * reason it survived is that the repository had no single typecheck command to
 * fix — `package.json` defined none, and the two workflows that run tsc invoked
 * it two different ways, neither of them this one.
 *
 * Every case below runs a byte-copy of the real script inside a scratch tree.
 * The script resolves its own repository root from its file location, so it
 * cannot be pointed at a fixture any other way, and the copy is taken at test
 * time — a mutation of the real script is a mutation of what runs here.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const realScript = path.join(repoRoot, "scripts/quality/typecheck.mjs");
const realTypescript = path.join(repoRoot, "node_modules/typescript");

const scratchDirs: string[] = [];

type Run = { status: number; output: string };

function runScript(cwd: string): Run {
  const script = path.join(cwd, "scripts/quality/typecheck.mjs");
  try {
    const stdout = execFileSync(process.execPath, [script], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      // The scratch runs must not inherit a heap flag from the outer jest
      // process, or the case proving the floor is applied would be reading
      // its own environment back.
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    return { status: 0, output: stdout };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

/**
 * A minimal project the real script can operate on: its own copy at the path it
 * expects, a tsconfig that asks for an incremental build-info, and either the
 * real TypeScript compiler or a stand-in standing where the script looks for it.
 */
function makeTree(options: {
  sources: Record<string, string>;
  compiler: "real" | { js: string };
  staleBuildInfo?: string;
}): string {
  const root = mkdtempSync(path.join(tmpdir(), "typecheck-command-"));
  scratchDirs.push(root);

  mkdirSync(path.join(root, "scripts/quality"), { recursive: true });
  copyFileSync(realScript, path.join(root, "scripts/quality/typecheck.mjs"));

  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "scratch", private: true }, null, 2),
  );
  writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          incremental: true,
          skipLibCheck: true,
          target: "ES2020",
          module: "ESNext",
          moduleResolution: "bundler",
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );

  mkdirSync(path.join(root, "src"), { recursive: true });
  for (const [name, body] of Object.entries(options.sources)) {
    writeFileSync(path.join(root, "src", name), body);
  }

  mkdirSync(path.join(root, "node_modules"), { recursive: true });
  if (options.compiler === "real") {
    symlinkSync(realTypescript, path.join(root, "node_modules/typescript"));
  } else {
    mkdirSync(path.join(root, "node_modules/typescript/bin"), {
      recursive: true,
    });
    const standIn = path.join(root, "node_modules/typescript/bin/tsc");
    writeFileSync(standIn, options.compiler.js);
    chmodSync(standIn, 0o755);
  }

  if (options.staleBuildInfo !== undefined) {
    writeFileSync(
      path.join(root, "tsconfig.tsbuildinfo"),
      options.staleBuildInfo,
    );
  }

  return root;
}

afterAll(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

describe("the typecheck command distinguishes a crash from a result", () => {
  /**
   * The case the whole script exists for. A compiler that dies without
   * producing a diagnostic exits non-zero and prints text that contains no
   * `error TS` — byte-for-byte the shape of the real 134 abort measured on
   * `main`. Classifying on the presence of diagnostics alone calls this clean.
   */
  it("reports a non-zero exit carrying no diagnostic as CRASHED, not clean", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: {
        js: [
          "process.stderr.write('\\n<--- Last few GCs --->\\n\\n');",
          "process.stderr.write('FATAL ERROR: Ineffective mark-compacts near heap limit " +
            "Allocation failed - JavaScript heap out of memory\\n');",
          "process.stderr.write('----- Native stack trace -----\\n');",
          "process.exit(134);",
        ].join("\n"),
      },
    });

    const run = runScript(tree);

    expect(run.output).toContain("CRASHED");
    expect(run.output).toContain("NOT a clean typecheck");
    expect(run.status).toBe(3);
    // The exact trap: the crash output survives a diagnostic filter untouched.
    expect(run.output).not.toMatch(/error TS\d+/);
  });

  it("reports a compiler killed by a signal as CRASHED", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: { js: "process.kill(process.pid, 'SIGABRT');\n" },
    });

    const run = runScript(tree);

    expect(run.output).toContain("CRASHED");
    expect(run.status).toBe(3);
  });

  /**
   * The case that makes the signal check load-bearing rather than decorative.
   * A compiler that prints some diagnostics and is then killed has not finished
   * checking, so its partial output is not the answer — but it carries
   * `error TS`, so classifying on diagnostics alone would call it a complete
   * result and report only the errors it happened to reach. Without this case a
   * mutation deleting the signal branch survives, because every other crash
   * this suite drives is also non-zero with no diagnostic.
   */
  it("reports a compiler killed AFTER printing diagnostics as CRASHED, not as a result", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: {
        js: [
          "process.stdout.write('src/a.ts(1,1): error TS2322: partial output\\n');",
          "process.kill(process.pid, 'SIGABRT');",
        ].join("\n"),
      },
    });

    const run = runScript(tree);

    expect(run.output).toMatch(/error TS2322/);
    expect(run.output).toContain("CRASHED");
    expect(run.status).toBe(3);
  });

  it("reports a missing compiler as CRASHED rather than passing", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: { js: "process.exit(0);\n" },
    });
    rmSync(path.join(tree, "node_modules/typescript/bin/tsc"), { force: true });

    const run = runScript(tree);

    expect(run.output).toContain("CRASHED");
    expect(run.status).toBe(3);
    // Without this the branch is redundant — node already exits non-zero with
    // no diagnostic on a missing entry point, so the verdict would be right and
    // the reader would get a module-resolution stack instead of the fix.
    expect(run.output).toContain("npm ci");
  });
});

describe("the typecheck command still reports what tsc actually found", () => {
  /**
   * A command hardened until it says "crashed" to everything is not a repair.
   * These two drive the real TypeScript compiler.
   */
  it("exits 0 and says clean on a project with no type errors", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: "real",
    });

    const run = runScript(tree);

    expect(run.status).toBe(0);
    expect(run.output).toContain("clean");
  });

  it("exits 1 and surfaces the diagnostic on a project with a type error", () => {
    const tree = makeTree({
      sources: { "bad.ts": 'export const value: number = "nope";\n' },
      compiler: "real",
    });

    const run = runScript(tree);

    expect(run.output).toMatch(/error TS2322/);
    expect(run.output).not.toContain("CRASHED");
    expect(run.status).toBe(1);
  });
});

describe("the typecheck command cannot read or leave a build-info", () => {
  it("removes an existing tsconfig.tsbuildinfo before the compiler runs", () => {
    const sentinel = '{"stale":"from an earlier tree"}';
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      // Exits 0 without writing anything, so a surviving build-info can only
      // be the one that was there before the run.
      compiler: { js: "process.exit(0);\n" },
      staleBuildInfo: sentinel,
    });
    const buildInfo = path.join(tree, "tsconfig.tsbuildinfo");
    expect(readFileSync(buildInfo, "utf8")).toBe(sentinel);

    const run = runScript(tree);

    expect(run.status).toBe(0);
    expect(existsSync(buildInfo)).toBe(false);
  });

  it("asks the compiler not to write one either", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: {
        js: "process.stdout.write('ARGS:' + process.argv.slice(2).join(' ') + '\\n');\n",
      },
    });

    const run = runScript(tree);

    expect(run.output).toContain("--incremental false");
    expect(run.output).toContain("--noEmit");
  });

  it("leaves no build-info behind after a real compiler run", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: "real",
    });

    runScript(tree);

    expect(existsSync(path.join(tree, "tsconfig.tsbuildinfo"))).toBe(false);
  });
});

describe("the typecheck command raises the heap above where this project dies", () => {
  /**
   * 6144 is not decoration. The measured crash on `main` is an allocation
   * failure just past 4 GB, which is where Node's default lands on this
   * machine, and both workflows already set 6144 and complete.
   */
  it("hands the compiler a heap floor of 6144 MB", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: {
        js: "process.stdout.write('NODE_OPTIONS:' + (process.env.NODE_OPTIONS || '') + '\\n');\n",
      },
    });

    const run = runScript(tree);

    expect(run.output).toContain("--max-old-space-size=6144");
  });

  it("does not lower a caller who asked for more, and keeps their other flags", () => {
    const tree = makeTree({
      sources: { "ok.ts": "export const value: number = 1;\n" },
      compiler: {
        js: "process.stdout.write('NODE_OPTIONS:' + (process.env.NODE_OPTIONS || '') + '\\n');\n",
      },
    });
    const script = path.join(tree, "scripts/quality/typecheck.mjs");

    const stdout = execFileSync(process.execPath, [script], {
      cwd: tree,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_OPTIONS: "--enable-source-maps --max-old-space-size=8192",
      },
    });

    expect(stdout).toContain("--max-old-space-size=8192");
    expect(stdout).toContain("--enable-source-maps");
    expect(stdout).not.toContain("--max-old-space-size=6144");
  });
});

describe("the command is the one the repository actually runs", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };

  const workflowsWithTypecheck = [
    ".github/workflows/production-readiness-gate.yml",
    ".github/workflows/reasoning-layer-guard.yml",
  ];

  it("is defined as `npm run typecheck`", () => {
    expect(packageJson.scripts?.typecheck).toContain(
      "scripts/quality/typecheck.mjs",
    );
  });

  it("is what every workflow that typechecks invokes", () => {
    for (const workflow of workflowsWithTypecheck) {
      const text = readFileSync(path.join(repoRoot, workflow), "utf8");
      expect(text).toContain("npm run typecheck");
    }
  });

  /**
   * The anti-regression. The bare form is the one that crashes silently; if it
   * returns to a workflow, this fails rather than waiting for the next release
   * record to carry a correction.
   */
  it("leaves no workflow invoking tsc directly", () => {
    const offenders: string[] = [];
    for (const workflow of workflowsWithTypecheck) {
      const text = readFileSync(path.join(repoRoot, workflow), "utf8");
      for (const line of text.split("\n")) {
        if (/^\s*(run:\s*)?(npx |node_modules\/\.bin\/)?tsc\b/.test(line.trim())) {
          offenders.push(`${workflow}: ${line.trim()}`);
        }
        if (/\bnpx tsc\b/.test(line)) offenders.push(`${workflow}: ${line.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
