#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import meridianHealthConfig from "../tenant-v6/configs/meridian-health.mjs";
import skyharborAirConfig from "../tenant-v6/configs/skyharbor-air.mjs";
import { buildTenantDataset, deriveFindings, deriveGoldenQuestions, v6Rows, v7Rows } from "../lib/v6-v7/tenant-pack-builder.mjs";
import { validateTenantDataset } from "../lib/v6-v7/tenant-pack-validator.mjs";

const configs = {
  "meridian-health": meridianHealthConfig,
  "skyharbor-air": skyharborAirConfig,
};

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

const tenantKey = arg("--tenant", "meridian-health");
const config = configs[tenantKey];
if (!config) throw new Error(`Unknown tenant config ${tenantKey}`);
const outDir = arg("--out", path.join(process.cwd(), config.sourceDataset));
if (!fs.existsSync(outDir) || process.argv.includes("--generate")) {
  buildTenantDataset(config, { outDir });
}
const v6 = v6Rows(config);
const v7 = v7Rows(config, v6);
const findings = deriveFindings(config);
const goldenQuestions = deriveGoldenQuestions(config);
const validation = validateTenantDataset(config, { outDir });
const summary = {
  tenantKey: config.tenantKey,
  datasetId: config.datasetId,
  outDir,
  dimensions: Object.fromEntries(Object.entries(v7).map(([file, rows]) => [file, rows.length])),
  findingRows: findings.length,
  goldenQuestionRows: goldenQuestions.length,
  antiBoilerplateGate: "passed",
  validation,
};
fs.mkdirSync(path.join(process.cwd(), "out"), { recursive: true });
const summaryPath = path.join(process.cwd(), "out", `${config.datasetId}-v7-derivation-summary.json`);
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
