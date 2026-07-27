/**
 * Legacy-boundary test. Fails if the Knowledge vNext feature imports or
 * references any forbidden upstream: old Home packs, V6/V7 demo packs, SkyHarbor
 * or other legacy tenant fixtures, current Source/Moves/Tower operational
 * repositories/marts, hidden truth, or evaluator assets.
 *
 * This is a static scan of import specifiers across the isolated feature roots.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const FEATURE_DIRS = [
  "src/components/knowledge/vnext",
  "src/lib/knowledge/consumption-contracts",
  "src/lib/knowledge/consumption-client",
  "src/lib/knowledge/fixtures",
  "src/app/(maestro)/knowledge-preview",
];

/** Forbidden import-specifier patterns. Matched against the module path only. */
const FORBIDDEN: { label: string; re: RegExp }[] = [
  { label: "legacy Home packs", re: /home\/(v4|v6|v7)|home-knowledge-v\d|home-pack/i },
  { label: "V6/V7 demo packs", re: /intelligence_v[67]|v[67]-demo|demo-pack-v[67]/i },
  { label: "SkyHarbor / legacy tenant fixtures", re: /skyharbor|_fixtures\/(skyharbor|meridian|first-capital|apex)/i },
  { label: "Source operational tables", re: /lib\/source\/(?!.*evidence-trace)(repositor|operational|events?-store)/i },
  { label: "Moves deliverable repositories", re: /lib\/(moves|deliverables)\/.*(repositor|ledger|worker|persist)/i },
  { label: "Tower mart loaders", re: /tower\/.*(mart|loader)|lib\/tower\/.*load/i },
  { label: "hidden truth", re: /hidden[-_]?truth|ground[-_]?truth|_truth\//i },
  { label: "evaluator assets", re: /evaluator|atlas-eval|eval-fixtures|golden-truth/i },
];

function walk(dir: string, acc: string[]): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) {
      if (e === "__tests__") continue; // don't scan the tests themselves
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(e)) {
      acc.push(full);
    }
  }
  return acc;
}

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const importRe = /import\s[^'"]*['"]([^'"]+)['"]/g;
  const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(source))) specs.push(m[1]);
  while ((m = requireRe.exec(source))) specs.push(m[1]);
  return specs;
}

describe("Knowledge vNext legacy boundary", () => {
  const files = FEATURE_DIRS.flatMap((d) => walk(join(ROOT, d), []));

  it("scans a non-trivial number of feature files", () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it("imports no forbidden legacy/operational modules", () => {
    const violations: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const spec of importSpecifiers(src)) {
        for (const rule of FORBIDDEN) {
          if (rule.re.test(spec)) {
            violations.push(`${file.replace(ROOT + "/", "")} imports "${spec}" → ${rule.label}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("fixtures use only synthetic fixture-* tenant namespaces", () => {
    const fixtureFiles = walk(join(ROOT, "src/lib/knowledge/fixtures"), []);
    for (const file of fixtureFiles) {
      const src = readFileSync(file, "utf8");
      // no canonical/real tenant keys embedded as tenant identity
      const realKeys = /tenantKey:\s*["'](apex-retail|meridian-health|northstar-clinical|first-capital|skyharbor-air|lakeshore-holdings)["']/;
      expect(realKeys.test(src)).toBe(false);
    }
  });
});
