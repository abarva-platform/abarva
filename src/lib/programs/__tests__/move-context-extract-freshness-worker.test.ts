import { execFileSync } from "node:child_process";
import path from "node:path";

describe("Move Context Extract freshness worker boundary", () => {
  it("imports under the real ACA react-server condition without loading request UI dependencies", () => {
    const root = process.cwd();
    const tsx = path.join(root, "node_modules/tsx/dist/cli.mjs");
    const script = [
      "import('./src/lib/programs/move-context-extract-freshness.ts')",
      ".then(m => {",
      "if (typeof m.loadCurrentMoveContextExtractFreshness !== 'function') process.exit(2);",
      "console.log('freshness-leaf-ok');",
      "})",
      ".catch(e => { console.error(e.stack || e); process.exit(1); });",
    ].join(" ");

    const output = execFileSync(
      process.execPath,
      [tsx, "--conditions=react-server", "-e", script],
      { cwd: root, encoding: "utf8" },
    );

    expect(output).toContain("freshness-leaf-ok");
  });
});
