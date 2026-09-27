import { execFileSync } from "node:child_process";
import path from "node:path";

describe("process-deliverable-queue worker boundary", () => {
  it("imports under the ACA react-server condition without request-only auth imports", () => {
    const root = process.cwd();
    const tsx = path.join(root, "node_modules/tsx/dist/cli.mjs");
    const script = [
      "import('./src/scripts/process-deliverable-queue.ts')",
      ".then((m) => {",
      "if (typeof m.processDeliverableQueue !== 'function') process.exit(2);",
      "console.log('deliverable-worker-import-ok');",
      "})",
      ".catch((e) => { console.error(e.stack || e); process.exit(1); });",
    ].join(" ");

    const output = execFileSync(
      process.execPath,
      [tsx, "--conditions=react-server", "-e", script],
      { cwd: root, encoding: "utf8" },
    );

    expect(output).toContain("deliverable-worker-import-ok");
  });
});
