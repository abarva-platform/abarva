import {
  classifySourceReadModelDeclaration,
  SOURCE_READ_MODEL_INVENTORY,
} from "../../src/lib/source/data-model/read-model-inventory";

const requireComplete = process.argv.includes("--require-complete");
let incomplete = 0;
let partial = 0;

for (const model of SOURCE_READ_MODEL_INVENTORY) {
  const assessment = classifySourceReadModelDeclaration(model);
  if (!assessment.metadataComplete) incomplete += 1;
  if (assessment.state === "partial") partial += 1;
  const detail =
    assessment.state === "contracted"
      ? "metadata complete"
      : [
          assessment.state,
          assessment.missing.length ? `missing ${assessment.missing.join(", ")}` : null,
          // A field that is PRESENT and not fail-closed is a different defect
          // from one that is absent, and until item D-031 it printed as
          // "metadata complete" (see the module doc).
          ...assessment.invalid.map(
            (violation) => `invalid ${violation.field}: ${violation.reason}`,
          ),
        ]
          .filter(Boolean)
          .join("; ");
  process.stdout.write(`${model.id}: ${detail}\n`);
}

process.stdout.write(
  `${incomplete}/${SOURCE_READ_MODEL_INVENTORY.length} models lack a complete contract (${partial} half-declared). Completeness does not prove approval, build, or readback — it proves the declaration is fail-closed as written.\n`,
);
if (requireComplete && incomplete > 0) process.exitCode = 1;
