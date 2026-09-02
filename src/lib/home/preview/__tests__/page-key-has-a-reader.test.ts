/**
 * Every page key the product writes must have something that reads it.
 *
 * Five intake families were mapped in this module and allowed by the page-key check constraint
 * while no serving view selected them. Rows written under those keys would have landed in the
 * projection table, passed every readback, and been invisible on the page -- a load that reports
 * success and changes nothing.
 *
 * The three facts have to agree: the page key the reader maps, the serving view the reader selects
 * from, and the constraint that permits the key. This test is the only place they meet.
 */
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();

function read(relative: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relative), "utf8");
}

const READER = read("src/lib/home/preview/ecl-projection-bundle.ts");

/** The newest migration that declares the page-key constraint owns the allowed set. */
function constraintSource(): string {
  const dir = path.join(REPO_ROOT, "supabase/migrations");
  const owning = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .filter((f) =>
      read(`supabase/migrations/${f}`).includes(
        "home_enterprise_landscape_page_check",
      ),
    )
    .sort();
  expect(owning.length).toBeGreaterThan(0);
  return read(`supabase/migrations/${owning[owning.length - 1]}`);
}

/** Page keys this module filters rows by -- the keys it expects to receive. */
function pageKeysTheReaderExpects(): string[] {
  const keys = new Set<string>();
  for (const m of READER.matchAll(/intakeFamily\(\s*"([a-z_]+)"/g))
    keys.add(m[1]);
  for (const m of READER.matchAll(/page_key\s*===\s*"([a-z_]+)"/g))
    keys.add(m[1]);
  return [...keys].sort();
}

/**
 * Serving views the reader actually selects from.
 *
 * Read from the declared list rather than from the SQL, because the SQL is now assembled from that
 * list at query time -- the union is built only over views the database actually has, so that one
 * absent view costs its own family instead of collapsing the whole read. A declared array is also a
 * steadier thing to parse than a string that gets rebuilt.
 */
function viewsTheReaderSelects(): string[] {
  const block = READER.slice(
    READER.indexOf("const HOME_SERVING_VIEWS"),
    READER.indexOf("] as const;", READER.indexOf("const HOME_SERVING_VIEWS")),
  );
  const views = [
    ...new Set(
      [...block.matchAll(/"serving\.home_([a-z_]+)"/g)].map((m) => m[1]),
    ),
  ].sort();
  // A list this test could not find would make every case below pass by having nothing to check.
  if (views.length === 0) {
    throw new Error("no serving views found in HOME_SERVING_VIEWS");
  }
  return views;
}

/** Page keys the constraint permits. */
function pageKeysAllowed(): string[] {
  const sql = constraintSource();
  const block = /page_key in \(([\s\S]*?)\)/.exec(sql);
  expect(block).not.toBeNull();
  return [...block![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
}

describe("a page key the reader expects", () => {
  it.each(pageKeysTheReaderExpects())(
    "%s is selected by a serving view",
    (key) => {
      // The reader unions a fixed list of views. A key with no view in that list is a key whose rows
      // never reach the page, however cleanly they load.
      expect(viewsTheReaderSelects()).toContain(key);
    },
  );

  it.each(pageKeysTheReaderExpects())(
    "%s is permitted by the check constraint",
    (key) => {
      expect(pageKeysAllowed()).toContain(key);
    },
  );
});

describe("a serving view the reader selects", () => {
  it.each(viewsTheReaderSelects())(
    "%s is permitted by the check constraint",
    (view) => {
      // Two views are named for the page they serve rather than the key: browse_record and
      // loaded_record read browse_the_record and what_has_been_loaded.
      const alias: Record<string, string> = {
        browse_record: "browse_the_record",
        loaded_record: "what_has_been_loaded",
        needs_attention: "what_needs_attention",
      };
      expect(pageKeysAllowed()).toContain(alias[view] ?? view);
    },
  );
});

describe("the five families that had no reader", () => {
  it.each([
    "metrics_outcomes",
    "risks_controls",
    "programs_initiatives",
    "org_ownership",
    "ai_use_cases",
  ])("%s now has a view, and the constraint allows it", (key) => {
    expect(viewsTheReaderSelects()).toContain(key);
    expect(pageKeysAllowed()).toContain(key);
  });
});
