#!/usr/bin/env node
import path from "node:path";
import meridianHealthConfig from "./configs/meridian-health.mjs";
import { buildTenantDataset } from "../lib/v6-v7/tenant-pack-builder.mjs";

const configs = {
  "meridian-health": meridianHealthConfig,
};

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

const tenantKey = arg("--tenant", "meridian-health");
const config = configs[tenantKey];
if (!config) throw new Error(`Unknown tenant config ${tenantKey}`);
const outDir = arg("--out", path.join(process.cwd(), config.sourceDataset));
const result = buildTenantDataset(config, { outDir });
console.log(JSON.stringify({
  tenantKey: config.tenantKey,
  datasetId: config.datasetId,
  outDir: result.outDir,
  rowCounts: result.rowCounts,
  findingRows: result.findings.length,
  goldenQuestionRows: result.goldenQuestions.length,
  v7ContractVersion: result.payload.contractVersion,
}, null, 2));
