import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * A component can pass every test, clear CI and deploy successfully while no
 * route mounts it. That happened: a 425-line change landed in
 * `canvas/workspace-tabs/EvidenceTab.tsx`, whose only importer is
 * `canvas/UniversalCanvasShell.tsx`, which the event route no longer mounts.
 * The change was correct, tested and deployed, and no user could reach it.
 *
 * This runs the reachability audit and fails when a NEW unreachable component
 * appears, or when the baseline lists something that is reachable again.
 */
describe("source canvas reachability", () => {
  it("has no component that no route can reach", () => {
    const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
    const script = path.join(
      repoRoot,
      "scripts",
      "audit",
      "source-canvas-reachability.mjs",
    );

    try {
      execFileSync("node", [script], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
      throw new Error(
        `${failure.stdout ?? ""}${failure.stderr ?? ""}`.trim() ||
          "source canvas reachability audit failed",
      );
    }
  });
});
