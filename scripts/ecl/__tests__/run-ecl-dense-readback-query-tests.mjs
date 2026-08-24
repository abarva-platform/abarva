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
      "print(load.readback_sql())",
    ].join("; "),
  ],
  { encoding: "utf8" },
);

assert.equal(result.status, 0, result.stderr || result.stdout);

const sql = result.stdout;
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
assert.equal(uniqueKeys.size, keys.length, "readback keys must be unique");

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
