import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const filter = fileURLToPath(new URL("../operator-nonterminal-executions.jq", import.meta.url));

function count(statuses) {
  const input = JSON.stringify(statuses.map((status) => ({ properties: { status } })));
  const result = spawnSync("jq", ["-f", filter], { input, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return Number(result.stdout.trim());
}

test("historical terminal operator executions do not block Tower preflight", () => {
  assert.equal(count(["Succeeded", "Failed", "Cancelled", "Stopped"]), 0);
});

test("running, pending, and unknown operator executions block Tower preflight", () => {
  assert.equal(count(["Running", "Pending", "Unrecognized"]), 3);
});
