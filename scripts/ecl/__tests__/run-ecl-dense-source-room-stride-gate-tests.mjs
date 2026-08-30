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
const knownProductVendorPairs = new Map([
  ["Epic Tapestry", "Epic Systems Corporation"],
  ["Facets", "TriZetto Corporation"],
  ["HealthRules Payor", "HealthEdge Software"],
  ["QNXT", "Cognizant Technology Solutions"],
  ["TruCare", "Casenet LLC"],
  ["Oracle Health Millennium", "Oracle Corporation"],
]);

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

  const cmdbPath = path.join(
    tmpRoot,
    "__synthetic_sources__",
    "SP03_CMDB",
    "ServiceNow_Business_Applications_SYNTHETIC.csv",
  );
  const cmdbLines = fs.readFileSync(cmdbPath, "utf8").trimEnd().split("\n");
  const cmdbHeaders = cmdbLines[0].split(",");
  const productIndex = cmdbHeaders.indexOf("base_product_name");
  const vendorIndex = cmdbHeaders.indexOf("vendor_name");
  assert.notEqual(productIndex, -1, "CMDB extract must include base_product_name");
  assert.notEqual(vendorIndex, -1, "CMDB extract must include vendor_name");
  const mismatches = cmdbLines.slice(1).filter((line) => {
    const columns = line.split(",");
    return knownProductVendorPairs.has(columns[productIndex]) && knownProductVendorPairs.get(columns[productIndex]) !== columns[vendorIndex];
  });
  assert.equal(mismatches.length, 0, `known application products must preserve their real vendor pairing: ${mismatches.slice(0, 3).join("; ")}`);

  const badCmdbLines = [...cmdbLines];
  const badColumns = badCmdbLines[2].split(",");
  assert.equal(badColumns[productIndex], "Facets", "second generated row should remain the planted Facets proof row");
  badColumns[vendorIndex] = "Oracle Corporation";
  badCmdbLines[2] = badColumns.join(",");
  fs.writeFileSync(cmdbPath, `${badCmdbLines.join("\n")}\n`);
  const badVendor = run(
    "python3",
    ["scripts/ecl/validate_dense_source_room_extracts.py", "--out-dir", tmpRoot],
    { allowFailure: true },
  );
  assert.notEqual(badVendor.status, 0, "known product/vendor mismatch must fail plausibility validation");
  assert.match(badVendor.stderr, /known product\/vendor mismatches/);
  fs.writeFileSync(cmdbPath, `${cmdbLines.join("\n")}\n`);

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

  console.log(JSON.stringify({ accepted: true, positive: "pass", plantedVendorFailure: "rejected", plantedStrideFailure: "rejected" }, null, 2));
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
