import {
  assessSourceReadModelContract,
  SOURCE_READ_MODEL_INVENTORY,
} from "../../src/lib/source/data-model/read-model-inventory";

const requireComplete = process.argv.includes("--require-complete");
let incomplete = 0;

for (const model of SOURCE_READ_MODEL_INVENTORY) {
  const assessment = assessSourceReadModelContract(model);
  if (!assessment.metadataComplete) incomplete += 1;
  process.stdout.write(
    `${model.id}: ${assessment.metadataComplete ? "metadata complete" : "proposed; missing " + assessment.missing.join(", ")}\n`,
  );
}

process.stdout.write(`${incomplete}/${SOURCE_READ_MODEL_INVENTORY.length} models lack complete metadata. Completeness does not prove approval, build, or readback.\n`);
if (requireComplete && incomplete > 0) process.exitCode = 1;
