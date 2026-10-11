import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { readPack, reconcilePack } from "./reconcile";
import { DATASET_ID } from "./scenario";

async function main() {
  const directory = path.resolve(
    process.argv[2] ??
      "datasets/tenant-inputs/meridian-health/moves/denials-pack-v1",
  );
  const result = reconcilePack(await readPack(directory));
  const sourceSetHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(Object.entries(result.hashes).sort()))
    .digest("hex");
  const proof = {
    status: "offline_fixture_validation_only",
    datasetId: DATASET_ID,
    sourceSetHash,
    ...result,
    moveId: null,
    loadApproval: null,
    liveProof: false,
  };
  await fs.writeFile(
    path.join(directory, "reconciliation-proof.json"),
    JSON.stringify(proof, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      ok: result.ok,
      files: result.files,
      claimRows: result.claimRows,
      denialRows: result.denialRows,
      sourceSetHash,
      errors: result.errors.slice(0, 20),
    }),
  );
  if (!result.ok) process.exitCode = 1;
}
void main();
