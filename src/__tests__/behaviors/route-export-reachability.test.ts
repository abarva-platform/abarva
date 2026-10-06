import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * A file the product reaches can still hold a component nothing mounts.
 *
 * The route-reachability audit answers "can a route reach this FILE", and that
 * grain is blind to an exported symbol with no importer: the file is reached,
 * so the symbol reads as reached, while nothing renders it. Two surfaces went
 * dead inside reachable files and the audit reported neither. One of them,
 * `ContractRefusalChips`, is still exported with no product importer today —
 * so it is used here as a real known-true positive. A check that cannot flag
 * it does not work, and a fixture cannot establish that.
 *
 * The fixture cases below pin the classifier's semantics, because a repository
 * count is a snapshot and a snapshot cannot say the classifier still separates
 * a test importer from a product one. The false negative each case exists to
 * prevent was observed while building this: counting a symbol's occurrences in
 * its own file to decide "used locally" scored `ContractRefusalChips` as used,
 * because the file's own doc comment names it.
 */

const repoRoot = path.resolve(__dirname, "../../..");

type ExportReachability = {
  orphanExports: string[];
  scannedFiles: number;
};

function analyse(root: string, watched: string[]): ExportReachability {
  const libPath = path.join(
    repoRoot,
    "scripts/audit/lib/route-reachability.mjs",
  );
  const source = `
    import { computeExportReachability } from ${JSON.stringify(libPath)};
    process.stdout.write(JSON.stringify(computeExportReachability(${JSON.stringify(
      root,
    )}, ${JSON.stringify(watched)})));
  `;
  const out = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", source],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(out) as ExportReachability;
}

function write(root: string, relative: string, contents: string): void {
  const full = path.join(root, relative);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

describe("export-level route reachability — the real tree", () => {
  let real: ExportReachability;

  beforeAll(() => {
    real = analyse(repoRoot, ["src/components", "src/app"]);
  }, 120_000);

  /**
   * The load-bearing case. `ContractRefusalChips` is exported from a file every
   * Source route reaches, has no product importer, and renders nowhere.
   */
  /**
   * When T-589 settles mount-or-delete for this component, this case goes red
   * and that is correct: update it to a then-current known-true positive with
   * the reason recorded. Do not delete it — without a real case, the check is
   * proved only against fixtures it was written to satisfy.
   */
  it("reports an exported component that no reachable file imports", () => {
    expect(real.orphanExports).toContain(
      "src/app/(maestro)/source/preview/workspace/ContractOptimizeMethod.tsx#ContractRefusalChips",
    );
  });

  /** The same file's mounted export must not be reported, or the check is noise. */
  it("does not report the mounted export in the same file", () => {
    expect(real.orphanExports).not.toContain(
      "src/app/(maestro)/source/preview/workspace/ContractOptimizeMethod.tsx#ContractOptimizeMethod",
    );
  });

  it("scans both watched trees", () => {
    expect(real.scannedFiles).toBeGreaterThan(500);
  });

  /**
   * The control watched `src/components` alone, so the whole of `src/app` —
   * every route group's colocated component — was examined by nothing. Pinned
   * here because narrowing it back is silent: the audit still passes, it just
   * stops looking.
   */
  it("the control watches src/app as well as src/components", () => {
    const out = execFileSync(
      process.execPath,
      [path.join(repoRoot, "scripts/audit/route-reachability-check.mjs"), "--json"],
      { encoding: "utf8", cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 },
    );
    const report = JSON.parse(out) as { watched: string[] };
    expect(report.watched).toEqual(
      expect.arrayContaining(["src/components", "src/app"]),
    );
  }, 120_000);
});

describe("export-level route reachability — classifier semantics", () => {
  let fixtureRoot: string;
  let result: ExportReachability;

  beforeAll(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "export-reach-"));

    write(
      fixtureRoot,
      "src/app/page.tsx",
      `import { Mounted } from "@/components/Mounted";\n` +
        `import { ReExported } from "@/components/barrel";\n` +
        `import { Sibling } from "@/components/TestOnly";\n` +
        `import { Shown } from "@/components/Documented";\n` +
        `import { Mounted2 } from "@/components/LocallyUsed";\n` +
        `export const metadata = { title: "t" };\n` +
        `export default function Page() { return <><Mounted /><ReExported /><Sibling /><Shown /><Mounted2 /></>; }\n`,
    );

    // Imported by a route. Not a finding.
    write(
      fixtureRoot,
      "src/components/Mounted.tsx",
      `export function Mounted() { return null; }\n` +
        `export function NeverImported() { return null; }\n`,
    );

    // The file is mounted through `Sibling`; `TestOnly`'s only importer is a
    // test. A test is not an entry point, and the file grain cannot see this.
    write(
      fixtureRoot,
      "src/components/TestOnly.tsx",
      `export function Sibling() { return null; }\n` +
        `export function TestOnly() { return null; }\n`,
    );
    write(
      fixtureRoot,
      "src/components/__tests__/TestOnly.test.tsx",
      `import { TestOnly } from "../TestOnly";\ntest("t", () => { TestOnly(); });\n`,
    );

    // Named only by its own doc comment. The false negative this suite exists for.
    write(
      fixtureRoot,
      "src/components/Documented.tsx",
      `/**\n * \`OnlyInAComment\` shows the three refusal states.\n */\n` +
        `export function Shown() { return null; }\n` +
        `export function OnlyInAComment() { return null; }\n`,
    );
    // Used by real code inside its own file. Over-exported, not unreachable.
    write(
      fixtureRoot,
      "src/components/LocallyUsed.tsx",
      `export function Helper() { return 1; }\n` +
        `export function Mounted2() { return Helper(); }\n`,
    );

    // Reached through a star re-export. Conservative: not a finding.
    write(
      fixtureRoot,
      "src/components/barrel.tsx",
      `export * from "./ReExportedImpl";\n`,
    );
    write(
      fixtureRoot,
      "src/components/ReExportedImpl.tsx",
      `export function ReExported() { return null; }\n`,
    );

    // A whole file no route reaches. Reported by the FILE baseline, not here.
    write(
      fixtureRoot,
      "src/components/OrphanFile.tsx",
      `export function InsideAnOrphanFile() { return null; }\n`,
    );

    result = analyse(fixtureRoot, ["src/components", "src/app"]);
  });

  afterAll(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("does not report an export a route imports", () => {
    expect(result.orphanExports).not.toContain("src/components/Mounted.tsx#Mounted");
  });

  it("reports an export nothing imports, in a file a route reaches", () => {
    expect(result.orphanExports).toContain(
      "src/components/Mounted.tsx#NeverImported",
    );
  });

  it("reports an export whose only importer is a test", () => {
    expect(result.orphanExports).toContain("src/components/TestOnly.tsx#TestOnly");
  });

  it("does not count a mention in the file's own comment as a use", () => {
    expect(result.orphanExports).toContain(
      "src/components/Documented.tsx#OnlyInAComment",
    );
  });

  it("does not report an export used by real code in its own file", () => {
    expect(result.orphanExports).not.toContain(
      "src/components/LocallyUsed.tsx#Helper",
    );
  });

  it("does not report a route entry's framework exports", () => {
    expect(result.orphanExports).not.toContain("src/app/page.tsx#metadata");
    expect(result.orphanExports).not.toContain("src/app/page.tsx#default");
  });

  it("does not report an export reached through a star re-export", () => {
    expect(result.orphanExports).not.toContain(
      "src/components/ReExportedImpl.tsx#ReExported",
    );
  });

  it("leaves exports inside a file-level orphan to the file baseline", () => {
    expect(result.orphanExports).not.toContain(
      "src/components/OrphanFile.tsx#InsideAnOrphanFile",
    );
  });
});
