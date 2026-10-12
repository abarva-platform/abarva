import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  assertUnknownAmountCheck,
  classifyLedger,
  parseMode,
  PRIOR_PAGE_KEYS,
  priorServingSelection,
  stripFrozenFoundationTransaction,
  verifyTargetFiles,
} from "../tower-only-schema-lane";

const ROOT = path.resolve(import.meta.dirname, "../../..");

test("only an explicit single mode is accepted", () => {
  assert.equal(parseMode(["--mode=status"]), "status");
  assert.equal(parseMode(["--mode=apply"]), "apply");
  assert.throws(() => parseMode([]), /Exact --mode/);
  assert.throws(() => parseMode(["--mode=apply", "--force"]), /Only one/);
});

test("only two frozen SQL files can enter the Tower lane", () => {
  const files = verifyTargetFiles(ROOT);
  assert.deepEqual([...files.keys()], [
    "20261011210000_tower_active_lifecycle_fail_closed.sql",
    "20261012133000_tower_foundations_page_key.sql",
  ]);
  const foundation = files.get("20261012133000_tower_foundations_page_key.sql")!;
  const wrapped = stripFrozenFoundationTransaction(foundation);
  assert.doesNotMatch(wrapped, /^\s*begin;/im);
  assert.doesNotMatch(wrapped, /^\s*commit;/im);
  assert.match(wrapped, /tower_command_center_page_key_check/);
  assert.throws(() => stripFrozenFoundationTransaction("select 1;"), /Unexpected Foundation/);
});

test("mixed or hash-drifted target ledger states are refused", () => {
  const targets = verifyTargetFiles(ROOT);
  const entries = [...targets].map(([name, sql]) => [name, createHash("sha256").update(sql).digest("hex")] as const);
  assert.equal(classifyLedger(new Map()), "ready");
  assert.equal(classifyLedger(new Map(entries)), "applied");
  assert.throws(() => classifyLedger(new Map([entries[0]])), /Partial Tower/);
  assert.throws(() => classifyLedger(new Map([[entries[0][0], "incorrect"]])), /hash mismatch/);
});

test("approved unknown-amount check may remain NOT VALID while still protecting new rows", () => {
  const migration = readFileSync(path.join(ROOT,
    "supabase/migrations/20261011173000_tower_value_chain_unknown_amounts.sql"), "utf8");
  assert.match(migration, /not valid;/i);
  const definition = "CHECK (value_state NOT IN ('unknown', 'not_applicable') OR " +
    "(claimable_value_usd IS NULL AND blocked_value_usd IS NULL)) NOT VALID";
  assert.doesNotThrow(() => assertUnknownAmountCheck([{ definition, convalidated: false }]));
  assert.doesNotThrow(() => assertUnknownAmountCheck([{ definition, convalidated: true }]));
  assert.throws(() => assertUnknownAmountCheck([]), /absent or ambiguous/);
  assert.throws(() => assertUnknownAmountCheck([{ definition: "CHECK (true)", convalidated: true }]), /lacks value_state/);
});

test("prior serving identity comes from the governed delegated scope", () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT,
    "docs/governance/dataset-manifests/tower-registered-intake-source-fields-20261012.json"), "utf8"));
  assert.deepEqual(priorServingSelection(manifest), {
    assessment_id: "tower-registry-candidate-a70df3b56bffc9be", projection_version: 5,
  });
});

test("prior physical page keys match the registered Tower stage contract", () => {
  const stage = readFileSync(path.join(ROOT, "scripts/tower/stage-registered-intake-partial.mjs"), "utf8");
  const pageTable = stage.match(/const PAGE_TABLE = \{([\s\S]*?)\};/)?.[1];
  assert(pageTable, "Tower stage PAGE_TABLE is absent");
  const physicalKeys = [...pageTable.matchAll(/^\s*([a-z_]+): "tower_[a-z_]+",?$/gm)]
    .map((match) => match[1]).filter((key) => key !== "foundations").sort();
  assert.deepEqual([...PRIOR_PAGE_KEYS], physicalKeys);
});

test("workflow guards broad apply before mutation and confines narrow apply", () => {
  const broad = readFileSync(path.join(ROOT, ".github/workflows/db-migration-lab.yml"), "utf8");
  const narrow = readFileSync(path.join(ROOT, ".github/workflows/tower-only-schema-lab.yml"), "utf8");
  assert.ok(broad.indexOf("name: Block broad apply on schema and ledger drift") < broad.indexOf("name: Apply pending migrations"));
  assert.match(narrow, /group: db-migration-lab/);
  assert.match(narrow, /--script tower:schema:apply-job/);
  assert.doesNotMatch(narrow, /--script db:migrate:ci/);
  assert.match(narrow, /--secret-env DATABASE_URL=azure-postgres-control-database-url/);
});
