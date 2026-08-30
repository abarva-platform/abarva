#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "python3",
  [
    "-c",
    [
      "import sys",
      "sys.path.insert(0, 'scripts/ecl')",
      "import execute_dense_all_layer_load as load",
      "print(load.readback_sql(['contract_annualized_value_usd', 'sla_credit_owed_usd']))",
    ].join("; "),
  ],
  { encoding: "utf8" },
);

assert.equal(result.status, 0, result.stderr || result.stdout);

const sql = result.stdout;
assert.match(
  sql,
  /'metric_definition'\s*,\s*\(select count\(\*\) from ecl_context\.metric_definition where tenant_key = 'meridian-health' and metric_key in \('contract_annualized_value_usd', 'sla_credit_owed_usd'\)\)/,
  "metric_definition readback must count only this load's declared metric keys",
);
assert.match(
  sql,
  /'metric_definition_tenant_total'\s*,\s*\(select count\(\*\) from ecl_context\.metric_definition where tenant_key = 'meridian-health'\)/,
  "readback must preserve a tenant-level diagnostic metric count without using it as the row contract",
);
const calls = [];
const marker = "jsonb_build_object(";
let cursor = 0;

while (cursor < sql.length) {
  const start = sql.indexOf(marker, cursor);
  if (start === -1) break;
  let depth = 1;
  let position = start + marker.length;
  let inSingleQuote = false;
  while (position < sql.length && depth > 0) {
    const char = sql[position];
    const next = sql[position + 1];
    if (char === "'" && inSingleQuote && next === "'") {
      position += 2;
      continue;
    }
    if (char === "'") {
      inSingleQuote = !inSingleQuote;
    } else if (!inSingleQuote && char === "(") {
      depth += 1;
    } else if (!inSingleQuote && char === ")") {
      depth -= 1;
    }
    position += 1;
  }
  assert.equal(depth, 0, "readback SQL has an unclosed jsonb_build_object call");
  calls.push(sql.slice(start + marker.length, position - 1));
  cursor = position;
}

assert.ok(calls.length >= 2, "readback SQL must split count JSON into multiple jsonb_build_object calls");

const topLevelArguments = (body) => {
  const args = [];
  let current = "";
  let depth = 0;
  let inSingleQuote = false;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    const next = body[index + 1];
    if (char === "'" && inSingleQuote && next === "'") {
      current += char + next;
      index += 1;
      continue;
    }
    if (char === "'") {
      inSingleQuote = !inSingleQuote;
    } else if (!inSingleQuote && char === "(") {
      depth += 1;
    } else if (!inSingleQuote && char === ")") {
      depth -= 1;
    }
    if (!inSingleQuote && depth === 0 && char === ",") {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }
  return args;
};

for (const [index, call] of calls.entries()) {
  const argCount = topLevelArguments(call).length;
  assert.ok(
    argCount <= 100,
    `readback jsonb_build_object call ${index + 1} has ${argCount} arguments; Postgres allows at most 100`,
  );
}

const keys = calls.flatMap((call) =>
  topLevelArguments(call)
    .filter((_, index) => index % 2 === 0)
    .map((argument) => argument.match(/^'([a-z][a-z0-9_]*)'$/)?.[1])
    .filter(Boolean),
);
const uniqueKeys = new Set(keys);
assert.ok(uniqueKeys.size >= 12, `expected 12+ readback count keys, found ${uniqueKeys.size}`);
assert.ok(uniqueKeys.has("home_enterprise_landscape"), "readback must include Home projection rows");
assert.ok(uniqueKeys.has("tower_command_center"), "readback must include Tower projection rows");
assert.ok(uniqueKeys.has("intelligence_context_pack"), "readback must include Intelligence projection rows");
assert.ok(uniqueKeys.has("serving_contract_rows"), "readback must include serving contract rows");
assert.ok(uniqueKeys.has("serving_views_declared"), "readback must include declared serving view count");
assert.ok(uniqueKeys.has("serving_views_populated"), "readback must include populated serving view count");
assert.ok(uniqueKeys.has("serving_views_empty"), "readback must include empty serving view count");
assert.ok(uniqueKeys.has("serving_required_views_declared"), "readback must include required serving view count");
assert.ok(uniqueKeys.has("serving_required_views_populated"), "readback must include populated required serving view count");
assert.ok(uniqueKeys.has("serving_required_views_empty"), "readback must include empty required serving view count");
assert.equal(uniqueKeys.size, keys.length, "readback keys must be unique");

const servingViewCountQueries = Array.from(sql.matchAll(/count\(\*\)\s+as\s+row_count\s+from\s+serving\.([a-z0-9_]+)/gi)).map(
  (match) => match[1],
);
const declaredServingViews = new Set(servingViewCountQueries);
assert.equal(
  declaredServingViews.size,
  40,
  `readback must count all 40 serving views, found ${declaredServingViews.size}`,
);
assert.equal(
  servingViewCountQueries.length,
  156,
  "readback should count 40 total serving views and 38 required serving views once for populated and once for empty",
);

const extractKeyBlock = (key, nextKey) => {
  const match = sql.match(new RegExp(`'${key}'\\s*,\\s*\\(([\\s\\S]*?)\\n\\s*\\),\\n\\s*'${nextKey}'`, "i"));
  assert(match, `readback SQL must contain ${key} before ${nextKey}`);
  return match[1];
};

const towerValueChainMeasureDriftBlock = extractKeyBlock(
  "tower_value_chain_measure_drift",
  "tower_evidence_queue_missing_gate_payload",
);
const towerEvidenceQueueMeasureDriftBlock = extractKeyBlock(
  "tower_evidence_queue_measure_drift",
  "tower_ai_primary_object_drift",
);

assert.match(
  towerValueChainMeasureDriftBlock,
  /from\s+ecl_projection\.tower_value_chain\s+p[\s\S]+m\.id\s*=\s*p\.measure_id[\s\S]+p\.measure_id\s+is\s+not\s+null/i,
  "tower_value_chain_measure_drift must join through tower_value_chain.measure_id",
);
assert.doesNotMatch(
  towerValueChainMeasureDriftBlock,
  /p\.related_measure_id/i,
  "tower_value_chain does not have related_measure_id; that column belongs to tower_evidence_queue",
);
assert.match(
  towerEvidenceQueueMeasureDriftBlock,
  /from\s+ecl_projection\.tower_evidence_queue\s+p[\s\S]+m\.id\s*=\s*p\.related_measure_id[\s\S]+p\.related_measure_id\s+is\s+not\s+null/i,
  "tower_evidence_queue_measure_drift must join through tower_evidence_queue.related_measure_id",
);

console.log(
  JSON.stringify(
    {
      accepted: true,
      jsonbBuildObjectCalls: calls.length,
      maxArgumentsPerCall: Math.max(...calls.map((call) => topLevelArguments(call).length)),
      readbackKeys: uniqueKeys.size,
    },
    null,
    2,
  ),
);
