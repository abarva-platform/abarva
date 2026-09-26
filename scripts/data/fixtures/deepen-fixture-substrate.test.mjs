/**
 * The fixture generator declares every row's name instead of copying the first row's.
 *
 * Each appended row starts life as `{ ...template }`, where the template is the file's first row.
 * For the descriptive columns that is right; for the columns that NAME a row it meant identity was
 * inherited, and the operating model says identity is declared, never inferred. Measured on the
 * substrate this script had already written: thirteen of one tenant's forty-six platforms carried the
 * first platform's `original_row_id`, `source_fingerprint` and `infrastructure_id`, and claimed its
 * `original_row_number`; the programme sheet carried ten of the same. Home's record browser keys its
 * rendered rows on that identifier, so clicking the thirty-fourth platform opened the first one's
 * detail panel under the first one's ordinal -- in a production build, with no warning.
 *
 * Every case here drives the real script as a subprocess over a SCRATCH COPY of the fixtures. The
 * script's whole job is to write files in the working tree, so a case that let it run against the
 * repo would be the hazard `T-488` and `T-490` exist to close: ~31 other readers watch these files,
 * and none of them consults a test's intention. `--write` is passed against the scratch root only.
 *
 * The no-op case asserts MTIME rather than bytes. A generator that rewrote a clean file with
 * identical content would be invisible to a content comparison, and "did not touch it" is the claim.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "deepen-fixture-substrate.mjs",
);

/** The generator reads these two alongside the file it appends to, and refuses to act without them. */
const INFRA_HEADER = [
  "tenant_key",
  "platform_name",
  "platform_type",
  "hosting_model",
  "data_center_or_region",
  "criticality",
  "lifecycle_state",
  "capacity_or_scale",
  "original_row_number",
  "original_row_id",
  "source_fingerprint",
  "consolidation_rule_used",
  "infrastructure_id",
];

const csv = (header, rows) =>
  [header.join(","), ...rows.map((r) => header.map((h) => String(r[h] ?? "")).join(","))].join("\n") +
  "\n";

function parse(text) {
  const [head, ...lines] = text.trim().split("\n");
  const header = head.split(",");
  return lines
    .filter((l) => l.trim())
    .map((l) => Object.fromEntries(header.map((h, i) => [h, (l.split(",")[i] ?? "").trim()])));
}

function infraRow(index, overrides = {}) {
  return {
    tenant_key: "skyharbor-air",
    platform_name: `Platform ${index}`,
    platform_type: "Owned Data Center",
    hosting_model: "on_premise",
    data_center_or_region: `Region ${index}`,
    criticality: "tier1",
    lifecycle_state: "current",
    capacity_or_scale: `${index} instances`,
    original_row_number: String(index + 1),
    original_row_id: `INFRA-${String(index).padStart(4, "0")}`,
    source_fingerprint: crypto.createHash("sha256").update(`row-${index}`).digest("hex"),
    consolidation_rule_used: "test_fixture",
    infrastructure_id: `INF-${crypto.createHash("sha256").update(`id-${index}`).digest("hex").slice(0, 10)}`,
    ...overrides,
  };
}

/**
 * A scratch tree the generator can write to, laid out exactly where it looks: it resolves
 * `datasets/tenant-inputs/active/<tenant>/current` against its own cwd. Only `skyharbor-air` exists
 * here, so the second declared tenant is skipped for want of files rather than by a flag.
 */
function scratchTree(infraRows) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "deepen-fixture-"));
  const dir = path.join(root, "datasets/tenant-inputs/active/skyharbor-air/current");
  fs.mkdirSync(dir, { recursive: true });
  const infraFile = path.join(dir, "06_infrastructure_platforms.csv");
  fs.writeFileSync(infraFile, csv(INFRA_HEADER, infraRows));
  // No applications file means no rows are appended, so each case measures the naming pass on the
  // rows it declared rather than on rows the generator invented alongside them.
  fs.writeFileSync(
    path.join(dir, "04_applications_systems.csv"),
    "tenant_key,system_name,hosting_location\nskyharbor-air,Only System,\n",
  );
  return { root, dir, infraFile };
}

const run = (root, args = []) =>
  execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

test("a duplicated row name is separated, and the first carrier keeps its own", () => {
  const rows = [
    infraRow(1),
    infraRow(2),
    // Two later rows carrying row 1's whole naming block -- the shape `{ ...template }` produced.
    infraRow(3, {
      original_row_id: "INFRA-0001",
      original_row_number: "2",
      source_fingerprint: rowsFingerprintOf(1),
    }),
    infraRow(4, {
      original_row_id: "INFRA-0001",
      original_row_number: "2",
      source_fingerprint: rowsFingerprintOf(1),
    }),
  ];
  const { root, infraFile } = scratchTree(rows);
  try {
    const out = run(root, ["--write"]);
    assert.match(out, /"infrastructureRenamed": 2/);

    const after = parse(fs.readFileSync(infraFile, "utf8"));
    assert.equal(after.length, 4);

    // Per column, per row -- not one "all distinct" assertion over the file. A container-wide check
    // is satisfied by any one column being unique, which is how a partial repair reads as a whole one.
    //
    // `infrastructure_id` is deliberately absent: it is minted and ledger-declared by
    // `scripts/data/assign-stable-identity.mjs`, so this script neither writes nor asserts it. The
    // case below pins that boundary rather than leaving it to a reader of this list.
    for (const column of [
      "original_row_id",
      "original_row_number",
      "source_fingerprint",
    ]) {
      const values = after.map((r) => r[column]);
      assert.equal(
        new Set(values).size,
        4,
        `${column} still repeats: ${JSON.stringify(values)}`,
      );
    }

    // The first carrier is untouched, because release records cite these identifiers.
    assert.equal(after[0].original_row_id, "INFRA-0001");
    assert.equal(after[0].original_row_number, "2");
    assert.equal(after[1].original_row_id, "INFRA-0002");

    // The renamed rows point at the line they actually occupy, header counted as line 1.
    assert.equal(after[2].original_row_number, "4");
    assert.equal(after[3].original_row_number, "5");
    // And their ids continue past the highest number the file actually still uses. Rows 3 and 4 here
    // carry row 1's id, so INFRA-0003 and INFRA-0004 are free and are what they get -- the sequence
    // follows the file's own state rather than its row count.
    assert.deepEqual(
      [after[2].original_row_id, after[3].original_row_id],
      ["INFRA-0003", "INFRA-0004"],
    );

    // Descriptive columns are left exactly as the row declared them: this pass names rows, and
    // nothing else. A rename that also rewrote the estate would be a different change.
    assert.equal(after[2].platform_name, "Platform 3");
    assert.equal(after[3].capacity_or_scale, "4 instances");

    // And the canonical id is left exactly as it was found on every row. That is the boundary, not an
    // oversight: minting one here would put ids in the ledger's shape into no ledger at all.
    assert.deepEqual(
      after.map((r) => r.infrastructure_id),
      rows.map((r) => r.infrastructure_id),
    );
  } finally {
    fs.rmSync(path.dirname(path.dirname(infraFile)), { recursive: true, force: true });
  }
});

/** The fingerprint row 1 carries, reproduced so a later row can be made to claim it. */
function rowsFingerprintOf(index) {
  return infraRow(index).source_fingerprint;
}

test("a file whose row names are already distinct is not rewritten at all", () => {
  const { root, infraFile } = scratchTree([infraRow(1), infraRow(2), infraRow(3)]);
  try {
    const before = fs.statSync(infraFile).mtimeMs;
    const bytes = fs.readFileSync(infraFile);
    // A faithful rewrite is invisible to a content comparison, which is the whole reason this defect
    // survived in two files at once -- so mtime is the instrument, and bytes are only a backstop.
    const out = run(root, ["--write"]);
    assert.match(out, /"infrastructureRenamed": 0/);
    assert.equal(fs.statSync(infraFile).mtimeMs, before, "the generator rewrote a clean file");
    assert.deepEqual(fs.readFileSync(infraFile), bytes);
  } finally {
    fs.rmSync(path.dirname(path.dirname(infraFile)), { recursive: true, force: true });
  }
});

test("the guard refuses a write it cannot make distinct, and leaves the file alone", () => {
  // The restamped line number lands on one another row already claims. Row 3 carries row 1's id and
  // line number, so it is restamped -- and a restamped row is given the line it actually occupies,
  // which here is 4, and row 2 already says 4. The naming pass writes each row once and does not
  // re-check what it has just written, so nothing downstream of it notices.
  //
  // Refusing is the right answer rather than a shortcoming: a file whose rows disagree about which
  // line they are on cannot be repaired by renumbering one of them, and a reader following either
  // number arrives somewhere a different row claims.
  const rows = [
    infraRow(1, { original_row_number: "2", original_row_id: "INFRA-0001" }),
    infraRow(2, { original_row_number: "4", original_row_id: "INFRA-0002" }),
    infraRow(3, { original_row_number: "2", original_row_id: "INFRA-0001" }),
  ];
  const { root, infraFile } = scratchTree(rows);
  try {
    const before = fs.statSync(infraFile).mtimeMs;
    let failed = false;
    try {
      run(root, ["--write"]);
    } catch (error) {
      failed = true;
      const text = `${error.stdout ?? ""}${error.stderr ?? ""}`;
      assert.match(text, /refusing to write/);
      assert.match(text, /original_row_number="4" on 2 rows/);
    }
    assert.ok(failed, "the generator wrote a file with two rows claiming one line");
    // mtime, not bytes: a refusal that had already written and then thrown would leave content that
    // happens to match on this fixture, and the claim being tested is that it never wrote at all.
    assert.equal(fs.statSync(infraFile).mtimeMs, before, "the refusal still touched the file");
  } finally {
    fs.rmSync(path.dirname(path.dirname(infraFile)), { recursive: true, force: true });
  }
});

test("a dry run reports what it would rename and writes nothing", () => {
  const rows = [infraRow(1), infraRow(2, { original_row_id: "INFRA-0001" })];
  const { root, infraFile } = scratchTree(rows);
  try {
    const before = fs.statSync(infraFile).mtimeMs;
    const out = run(root);
    assert.match(out, /"infrastructureRenamed": 1/);
    assert.match(out, /dry-run/);
    assert.equal(fs.statSync(infraFile).mtimeMs, before, "a dry run wrote to the tree");
  } finally {
    fs.rmSync(path.dirname(path.dirname(infraFile)), { recursive: true, force: true });
  }
});
