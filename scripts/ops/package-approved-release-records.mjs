#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifests = path.join(root, "docs/governance/dataset-manifests");
const destination = path.join(root, "runtime-approved-release-records");
const records = new Set();

for (const file of fs.readdirSync(manifests).filter((name) => name.endsWith(".json"))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(manifests, file), "utf8"));
  for (const field of ["load_approval", "serving_approval"]) {
    const record = manifest[field]?.release_record;
    if (!record) continue;
    if (!/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/.test(record)) {
      throw new Error(`${file}: invalid ${field}.release_record path`);
    }
    if (!fs.existsSync(path.join(root, record))) {
      throw new Error(`${file}: ${field}.release_record is absent from the image build context`);
    }
    records.add(record);
  }
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
for (const record of [...records].sort()) {
  fs.copyFileSync(path.join(root, record), path.join(destination, path.basename(record)));
}
console.log(`Packaged ${records.size} approved manifest release records`);
