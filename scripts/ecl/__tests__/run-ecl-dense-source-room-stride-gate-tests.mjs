#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "../../..");
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-dense-source-room-stride-gate-test-"));
const env = {
  ...process.env,
  LC_ALL: "C",
  LANG: "C",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repo,
    encoding: "utf8",
    env,
    ...options,
  });
  if (options.allowFailure) {
    return result;
  }
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

try {
  run("python3", ["scripts/ecl/generate_dense_source_room_extracts.py", "--out-dir", tmpRoot]);
  const positive = run("python3", ["scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", tmpRoot]);
  assert.match(positive.stdout, /"status": "pass"/, "fresh dense source room must pass stride gate");

  const contractPath = path.join(
    tmpRoot,
    "__synthetic_sources__",
    "SP08_Vendor_Contract",
    "Contract_Register_SYNTHETIC.csv",
  );
  const original = fs.readFileSync(contractPath, "utf8").trimEnd().split("\n");
  const headers = original[0].split(",");
  const scopeIndex = headers.indexOf("scoped_applications");
  assert.notEqual(scopeIndex, -1, "contract extract must include scoped_applications");
  const rewritten = [original[0]];
  for (let i = 1; i < original.length; i += 1) {
    const columns = original[i].split(",");
    const app = ((i - 1) % 750) + 1;
    const scoped = [
      `APP-${String(app).padStart(4, "0")}`,
      `APP-${String((app + 70) % 750 + 1).padStart(4, "0")}`,
      `APP-${String((app + 112) % 750 + 1).padStart(4, "0")}`,
    ].join(";");
    columns[scopeIndex] = csvEscape(scoped);
    rewritten.push(columns.join(","));
  }
  fs.writeFileSync(contractPath, `${rewritten.join("\n")}\n`);

  const negative = run(
    "python3",
    ["scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", tmpRoot],
    { allowFailure: true },
  );
  assert.notEqual(negative.status, 0, "fixed-stride contract scope must fail plausibility validation");
  assert.match(negative.stderr, /dominant APP stride|rotational/i);

  console.log(JSON.stringify({ accepted: true, positive: "pass", plantedFailure: "rejected" }, null, 2));
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
