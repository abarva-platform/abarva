#!/usr/bin/env tsx

/** Pure manifest decision for one exact Tower stage. It never writes approval fields. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveServingApproval } from "../../src/lib/governance/dataset-manifest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestDir = path.join(root, "docs/governance/dataset-manifests");
const arg = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index < 0 ? null : process.argv[index + 1] ?? null;
};

const candidatePath = arg("--candidate");
const receiptPath = arg("--stage-receipt");
if (!candidatePath || !receiptPath) throw new Error("--candidate and --stage-receipt are required");

const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
const manifests = fs.readdirSync(manifestDir)
  .filter((name) => name.endsWith(".json") && !name.startsWith("_"))
  .sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(manifestDir, name), "utf8")));
const decision = resolveServingApproval(manifests, {
  dataset_id: receipt.dataset_id,
  tenant_key: candidate.tenant_key,
  assessment_id: candidate.assessment_id,
  source_set_hash: candidate.input_fingerprint_sha256,
  object_count: receipt.object_count,
  ingestion_method: receipt.ingestion_method,
  surface: "tower",
});

process.stdout.write(`${JSON.stringify(decision.approved
  ? { approved: true, release_record: decision.approval.release_record }
  : { approved: false, reasons: decision.reasons })}\n`);
