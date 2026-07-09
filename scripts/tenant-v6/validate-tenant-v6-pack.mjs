#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import meridianHealthConfig from "./configs/meridian-health.mjs";
import { validateTenantDataset } from "../lib/v6-v7/tenant-pack-validator.mjs";

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
const proof = validateTenantDataset(config, { outDir });
fs.mkdirSync(path.join(process.cwd(), "out"), { recursive: true });
const proofPath = path.join(process.cwd(), "out", `${config.datasetId}-validation.json`);
fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify({ ...proof, proofPath }, null, 2));
