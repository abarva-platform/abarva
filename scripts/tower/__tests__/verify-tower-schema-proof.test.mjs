import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const verifier = fileURLToPath(new URL("../verify-tower-schema-proof.mjs", import.meta.url));
const targets = [
  { name: "20261011210000_tower_active_lifecycle_fail_closed.sql",
    sha256: "b8dd9e6fd0f7bc941e3b908ad07db0c5779528c28f3efda7efca7e2b0ef0ce21" },
  { name: "20261012133000_tower_foundations_page_key.sql",
    sha256: "d17d7b84ef94ebd1fa0dce5a00b01fab27d8169570ec41fed256c973756d5857" },
];

test("read-only status accepts the actual ready state when workflow requests any", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "tower-schema-proof-"));
  try {
    const log = path.join(root, "logs.txt");
    const proof = {
      mode: "status", state: "ready", targets, private_readback_verified: true,
      private_proof_sha256: "a".repeat(64),
      private_proof_uri: "https://proof.blob.core.windows.net/private/status.json",
      active_selector_unchanged: true, active_page_fingerprints_unchanged: true,
      active_page_count: 9, candidate_rows_absent: true, unrelated_ledger_rows_changed: 0,
      target_ledger_after: [],
    };
    writeFileSync(log, `timestamp TOWER_ONLY_SCHEMA_PROOF\t${JSON.stringify(proof)}\n`);
    const output = execFileSync(process.execPath, [verifier, log, "status", "any"], { encoding: "utf8" });
    assert.match(output, /"state":"ready"/);
    const mismatch = spawnSync(process.execPath, [verifier, log, "status", "applied"], { encoding: "utf8" });
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stderr, /ready.*applied|applied.*ready/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
