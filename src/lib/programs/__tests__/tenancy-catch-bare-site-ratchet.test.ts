import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * A route whose catch is nothing but `return tenancyErrorResponse(err)` does
 * not handle anything except tenancy: that helper's last statement is
 * `throw err`, so a failed write, a storage error or a document-build throw is
 * thrown a second time from inside the catch, the handler rejects, and the
 * framework answers with no body. The client's
 * `await res.json().catch(() => ({}))` then has nothing to render.
 *
 * The population was measured at 84 sites across 72 files, so this is fixed in
 * lanes rather than in one sweep. This control is the ratchet between lanes: it
 * keeps the population from growing, and it keeps a lane's own routes at zero
 * so a fix cannot be quietly reverted. `CEILING` comes DOWN as lanes land; it
 * never goes up.
 */
const API_ROOT = join(process.cwd(), "src/app/api");

/** The ceiling after the Moves evidence-upload lane. */
const CEILING = 81;

/**
 * Routes a lane has fixed. Each must hold at zero. Repo-relative, POSIX.
 */
const FIXED_ROUTES = [
  "src/app/api/v1/programs/[programId]/current-state/evidence/[evidenceId]/approve/route.ts",
  "src/app/api/v1/programs/[programId]/artifacts/upload/route.ts",
] as const;

const BARE_CATCH =
  /catch\s*(?:\(\s*\w+(?:\s*:\s*unknown)?\s*\))?\s*\{\s*return\s+tenancyErrorResponse\(\s*\w*\s*\)\s*;?\s*\}/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      walk(full, out);
    } else if (entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function bareSites(): { file: string; count: number }[] {
  const found: { file: string; count: number }[] = [];
  for (const file of walk(API_ROOT)) {
    const source = readFileSync(file, "utf8");
    if (!source.includes("tenancyErrorResponse")) continue;
    const count = (source.match(BARE_CATCH) ?? []).length;
    if (count > 0) {
      found.push({
        file: file
          .slice(process.cwd().length + 1)
          .split("\\")
          .join("/"),
        count,
      });
    }
  }
  return found;
}

describe("the bare tenancy catch does not spread", () => {
  it("finds the sites it is scanning for", () => {
    // Non-vacuous: a scanner that matched nothing would satisfy every ceiling
    // below while proving nothing at all. The population is known to be large,
    // so an empty read is a broken scanner, not a clean repo.
    const sites = bareSites();
    expect(sites.length).toBeGreaterThan(10);
    expect(sites.some((site) => site.count > 0)).toBe(true);
  });

  it("holds the population at or below the recorded ceiling", () => {
    const total = bareSites().reduce((sum, site) => sum + site.count, 0);
    expect(total).toBeLessThanOrEqual(CEILING);
  });

  it("keeps every route a lane has already fixed at zero", () => {
    const byFile = new Map(bareSites().map((site) => [site.file, site.count]));
    for (const route of FIXED_ROUTES) {
      expect(byFile.get(route) ?? 0).toBe(0);
    }
  });

  it("scans the routes the fixed list names", () => {
    // Guards the pairing the case above depends on: a renamed or moved route
    // would read zero because it is absent, not because it is fixed.
    const scanned = new Set(
      walk(API_ROOT).map((file) =>
        file
          .slice(process.cwd().length + 1)
          .split("\\")
          .join("/"),
      ),
    );
    for (const route of FIXED_ROUTES) {
      expect(scanned.has(route)).toBe(true);
    }
  });
});
