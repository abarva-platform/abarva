import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Eight modules under `src/lib` sat in the tree for ten weeks after a sunset
 * removed their only product consumer. Nothing reported them, because the only
 * reachability audit in the repository watched `src/components`. Their suites
 * stayed green the whole time, and "the suite is green" was nearly accepted as
 * "the code is reached".
 *
 * Extending route-reachability to `src/lib` unchanged does not fix that — it
 * reports the wrong thing in both directions, and both were measured on this
 * tree before this suite was written:
 *
 *   - Route-only reachability calls 799 modules dead, most of which are reached
 *     from an operator script or an ACA job.
 *   - "Is it imported anywhere" calls all 565 real orphans live, because each
 *     one's own test imports it.
 *
 * So the load-bearing claim is not that a module is unreached but WHICH class
 * of entry point reaches it, and specifically that **a test is not an entry
 * point**. These cases construct each of the four states in a fixture tree
 * rather than asserting the count this repository happens to print today: a
 * count is a snapshot, and a snapshot cannot tell you the classifier still
 * separates a test importer from a product importer.
 */

const repoRoot = path.resolve(__dirname, "../../..");

type Classification = {
  product: string[];
  tooling: string[];
  testOnly: string[];
  unreferenced: string[];
  scanned: number;
  entryPointCounts: { product: number; tooling: number; test: number };
};

/**
 * Run the classifier in a child process.
 *
 * The classifier is ESM on disk and this suite is compiled to CommonJS, so a
 * direct import would test the transform rather than the module.
 */
function classify(fixtureRoot: string, watchedDir: string): Classification {
  const libPath = path.join(
    repoRoot,
    "scripts/audit/lib/module-referrers.mjs",
  );
  const source = `
    import { classifyModuleReferrers } from ${JSON.stringify(libPath)};
    process.stdout.write(JSON.stringify(classifyModuleReferrers(${JSON.stringify(
      fixtureRoot,
    )}, ${JSON.stringify(watchedDir)})));
  `;
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out) as Classification;
}

function collectRoots(fixtureRoot: string): string[] {
  const libPath = path.join(
    repoRoot,
    "scripts/audit/lib/route-reachability.mjs",
  );
  const source = `
    import { collectRoots } from ${JSON.stringify(libPath)};
    process.stdout.write(JSON.stringify(collectRoots(${JSON.stringify(fixtureRoot)})));
  `;
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return (JSON.parse(out) as string[]).map((file) =>
    path.relative(fixtureRoot, file),
  );
}

function write(root: string, relative: string, contents: string): void {
  const full = path.join(root, relative);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

let fixtureRoot: string;

/**
 * A tree holding one module of every state, and nothing else, so a
 * misclassification names exactly one module.
 */
beforeAll(() => {
  fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lib-orphan-fixture-"));

  // Reached from a route.
  write(fixtureRoot, "src/app/page.tsx", `import "@/lib/reached-by-route";\n`);
  write(fixtureRoot, "src/lib/reached-by-route.ts", "export const a = 1;\n");

  // Reached only through the Next.js 16 proxy entry point.
  write(fixtureRoot, "src/proxy.ts", `import "@/lib/reached-by-proxy";\n`);
  write(fixtureRoot, "src/lib/reached-by-proxy.ts", "export const b = 1;\n");

  // Reached only from an ACA job.
  write(fixtureRoot, "src/jobs/nightly-job.ts", `import "@/lib/reached-by-job";\n`);
  write(fixtureRoot, "src/lib/reached-by-job.ts", "export const c = 1;\n");

  // Reached only from an operator script — alive, but not product.
  write(fixtureRoot, "scripts/an-operator-script.mjs", `import "../src/lib/reached-by-script.ts";\n`);
  write(fixtureRoot, "src/lib/reached-by-script.ts", "export const d = 1;\n");

  // Reached only from its own test. The finding.
  write(
    fixtureRoot,
    "src/lib/__tests__/reached-by-its-own-test.test.ts",
    `import "@/lib/reached-by-its-own-test";\n`,
  );
  write(fixtureRoot, "src/lib/reached-by-its-own-test.ts", "export const e = 1;\n");

  // Reached only by being mocked in a test. Still the finding, but a different
  // repair: there is no assertion to keep.
  write(
    fixtureRoot,
    "src/__tests__/behaviors/mocks-a-module.test.ts",
    `jest.mock("@/lib/only-ever-mocked");\n`,
  );
  write(fixtureRoot, "src/lib/only-ever-mocked.ts", "export const f = 1;\n");

  // Nothing imports it at all. The finding.
  write(fixtureRoot, "src/lib/imported-by-nothing.ts", "export const g = 1;\n");

  // Transitively dead: its only importer is itself test-only. A per-file
  // "does a product file import this" check would call it live.
  write(
    fixtureRoot,
    "src/lib/reached-only-by-a-dead-module.ts",
    "export const h = 1;\n",
  );
  write(
    fixtureRoot,
    "src/lib/reached-by-its-own-test.ts",
    `import "@/lib/reached-only-by-a-dead-module";\nexport const e = 1;\n`,
  );
});

afterAll(() => {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("a test is not an entry point", () => {
  it("classifies a module whose only importer is its own test as test-only, not live", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.testOnly).toContain("src/lib/reached-by-its-own-test.ts");
    expect(result.product).not.toContain("src/lib/reached-by-its-own-test.ts");
    expect(result.tooling).not.toContain("src/lib/reached-by-its-own-test.ts");
  });

  it("classifies a module reached only by jest.mock as test-only, not unreferenced", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.testOnly).toContain("src/lib/only-ever-mocked.ts");
    expect(result.unreferenced).not.toContain("src/lib/only-ever-mocked.ts");
  });

  it("separates a module nothing imports from one only a test imports", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.unreferenced).toContain("src/lib/imported-by-nothing.ts");
    expect(result.testOnly).not.toContain("src/lib/imported-by-nothing.ts");
  });

  it("follows the chain, so a module reached only through a dead module is also dead", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.testOnly).toContain(
      "src/lib/reached-only-by-a-dead-module.ts",
    );
    expect(result.product).not.toContain(
      "src/lib/reached-only-by-a-dead-module.ts",
    );
  });
});

describe("the entry classes a route walk alone would miss", () => {
  it("counts src/proxy.ts as a runtime entry point", () => {
    // collectRoots names `middleware.ts`, which Next.js 16 renamed. Without
    // the proxy in the root set, the one src/lib module reached only from it
    // in the real tree — a route tenancy guard — reads as a finding.
    expect(collectRoots(fixtureRoot)).toContain("src/proxy.ts");
  });

  it("classifies a module reached only through the proxy as product", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.product).toContain("src/lib/reached-by-proxy.ts");
    expect(result.testOnly).not.toContain("src/lib/reached-by-proxy.ts");
    expect(result.unreferenced).not.toContain("src/lib/reached-by-proxy.ts");
  });

  it("classifies a module reached only from an ACA job as product", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.product).toContain("src/lib/reached-by-job.ts");
  });

  it("classifies a module reached only from an operator script as tooling, separately from product", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.tooling).toContain("src/lib/reached-by-script.ts");
    expect(result.product).not.toContain("src/lib/reached-by-script.ts");
    expect(result.unreferenced).not.toContain("src/lib/reached-by-script.ts");
  });

  it("classifies a module reached from a route as product", () => {
    const result = classify(fixtureRoot, "src/lib");

    expect(result.product).toContain("src/lib/reached-by-route.ts");
  });
});

describe("the report can tell a finding from an empty walk", () => {
  it("reports how many entry points each class contributed", () => {
    const result = classify(fixtureRoot, "src/lib");

    // A walk that found no product entry points would classify the whole tree
    // as dead. That is a tooling failure, and the caller has to be able to see
    // the difference without re-deriving it.
    expect(result.entryPointCounts.product).toBeGreaterThan(0);
    expect(result.entryPointCounts.tooling).toBeGreaterThan(0);
    expect(result.entryPointCounts.test).toBeGreaterThan(0);
  });

  it("puts every scanned module in exactly one state", () => {
    const result = classify(fixtureRoot, "src/lib");

    const total =
      result.product.length +
      result.tooling.length +
      result.testOnly.length +
      result.unreferenced.length;
    expect(total).toBe(result.scanned);

    const all = [
      ...result.product,
      ...result.tooling,
      ...result.testOnly,
      ...result.unreferenced,
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it("does not classify the tests themselves", () => {
    const result = classify(fixtureRoot, "src/lib");

    const all = [
      ...result.product,
      ...result.tooling,
      ...result.testOnly,
      ...result.unreferenced,
    ];
    expect(all).not.toContain(
      "src/lib/__tests__/reached-by-its-own-test.test.ts",
    );
  });
});
