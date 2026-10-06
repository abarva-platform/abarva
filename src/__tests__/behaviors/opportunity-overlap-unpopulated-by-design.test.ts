import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * `source.opportunity_overlap` exists — created at
 * `20260809143000_source_contract_optimization_opportunity_spine.sql:228` with
 * `opportunity_id`, `overlaps_opportunity_id`, `overlap_type` and `treatment`
 * — and **nothing writes it**. The sole owner of the lever and opportunity
 * spine, `scripts/source/load-skyharbor-contract-optimization.ts`, never
 * references it.
 *
 * It is unpopulated **by design**, not by oversight, and the reason is worth
 * keeping: overlap is already stated elsewhere. Every opportunity row carries
 * `optimization_opportunity.overlap_treatment`, and that column is what the
 * product actually shows — `buildViewModel.ts` reads it and `ContractCanvas`
 * renders it. Populating the pair table as well would put one fact in two
 * places, which is the split that has already produced two annual values for
 * one contract and two disjoint contract-id sets.
 *
 * The hazard is that an empty table reads as "no overlaps". These cases stop
 * that being silent: nothing outside schema, cutover and guard tooling may
 * read the table while it is empty by design. A surface that wants pairwise
 * overlap must populate it first — and then delete this suite, deliberately,
 * rather than discovering later that it rendered emptiness as a finding.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TABLE = "opportunity_overlap";

/**
 * Tooling that legitimately names the table without presenting it to anyone:
 * the schema applier that creates it, and the cutover/guard scripts that must
 * account for every table in the spine.
 */
const INFRASTRUCTURE = [
  "scripts/source/apply-contract-optimization-source-schema.ts",
  "scripts/source/opportunity-ownership-cutover-job.mjs",
  "scripts/source/opportunity-rewrite-guard.mjs",
];

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next"].includes(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx|mjs|cjs)$/.test(entry)) out.push(full);
  }
  return out;
}

function readersOfTable(): string[] {
  const roots = [path.join(repoRoot, "src"), path.join(repoRoot, "scripts")];
  const found: string[] = [];
  for (const root of roots) {
    for (const file of sourceFiles(root)) {
      const rel = path.relative(repoRoot, file).split(path.sep).join("/");
      if (rel.includes("__tests__")) continue;
      if (INFRASTRUCTURE.includes(rel)) continue;
      if (readFileSync(file, "utf8").includes(TABLE)) found.push(rel);
    }
  }
  return found.sort();
}

describe("source.opportunity_overlap is unpopulated by design", () => {
  it("is read by no product path while it is empty", () => {
    // An empty table read by a surface renders "no overlaps", which is a
    // finding nobody established.
    expect(readersOfTable()).toEqual([]);
  });

  it("is not written by the owner of the opportunity spine", () => {
    // If this starts failing, the table is being populated and the decision
    // has changed — which is the moment to delete this suite on purpose.
    const loader = readFileSync(
      path.join(repoRoot, "scripts/source/load-skyharbor-contract-optimization.ts"),
      "utf8",
    );

    expect(loader).not.toContain(TABLE);
  });

  it("keeps the fact it defers to: every opportunity declares its own overlap treatment", () => {
    // The negative control. This suite is only defensible while overlap is
    // stated somewhere; if `overlap_treatment` disappeared, deferring to it
    // would be deferring to nothing, and the pair table would become the only
    // home for the fact.
    const spine = readFileSync(
      path.join(
        repoRoot,
        "supabase/migrations/20260809143000_source_contract_optimization_opportunity_spine.sql",
      ),
      "utf8",
    );

    expect(spine).toMatch(/overlap_treatment\s+TEXT\s+NOT NULL/i);
  });
});
