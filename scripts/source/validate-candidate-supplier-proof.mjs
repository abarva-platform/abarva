import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateCandidateSupplierProof(contract, run) {
  assert(object(contract) && object(run), "Supplier proof files are invalid.");
  assert(["dry_run", "apply"].includes(contract.mode), "Supplier proof mode is invalid.");
  assert(run.status === "Succeeded" && run.ok === true, "Supplier operator did not succeed.");
  assert(
    run.restored?.restored === true &&
      run.restored?.idleVerification?.idleVerified === true &&
      Array.isArray(run.restored.idleVerification.problems) &&
      run.restored.idleVerification.problems.length === 0,
    "Supplier operator idle state was not verified.",
  );

  const proof = run.proof;
  const summary = proof?.summary;
  assert(proof?.extracted === true && object(summary), "Supplier quality proof is missing.");
  assert(
    ["proof_bundle", "source_candidate_supplier_summary"].includes(proof.extractionKind),
    "Supplier proof extraction kind is invalid.",
  );
  assert(
    summary.schemaVersion === 1 &&
      summary.event === "source_candidate_supplier_registry_import_proof_summary" &&
      summary.mode === contract.mode,
    "Supplier proof identity or mode does not match dispatch.",
  );
  assert(
    /^[a-f0-9]{64}$/.test(contract.input_sha256) &&
      summary.inputSha256 === contract.input_sha256 &&
      typeof contract.input_source_version === "string" &&
      contract.input_source_version.length > 0 &&
      summary.inputSourceVersion === contract.input_source_version,
    "Supplier proof input identity does not match dispatch.",
  );
  assert(
    Number.isSafeInteger(summary.rowCount) &&
      Number.isSafeInteger(summary.supplierCount) && summary.supplierCount > 0 &&
      Number.isSafeInteger(summary.archetypeCount) && summary.archetypeCount > 0 &&
      Number.isSafeInteger(summary.failClosedControlCount) &&
      summary.failClosedControlCount >= 0 &&
      summary.rowCount === summary.supplierCount + summary.failClosedControlCount &&
      Number.isSafeInteger(summary.inserted) &&
      summary.inserted >= 0 && summary.inserted <= summary.supplierCount,
    "Supplier quality gate has missing coverage or unclassified rows.",
  );
  assert(
    summary.authority?.dryRunDefault === true &&
      summary.authority.supplierRegistryRowsOnly === true &&
      summary.authority.candidateSupplierAuthoritiesWritten === false &&
      summary.authority.eventsCreated === false &&
      summary.authority.suppliersContacted === false &&
      summary.authority.emailsSent === false,
    "Supplier proof claims authority outside registry rows.",
  );
  if (contract.mode === "dry_run") {
    assert(summary.inserted === 0 && summary.committed === false, "Dry run wrote supplier data.");
  } else {
    assert(summary.committed === true, "Approved supplier apply did not commit.");
  }
  return summary;
}

if (process.argv[1]?.endsWith("validate-candidate-supplier-proof.mjs")) {
  try {
    assert(process.argv.length === 4, "Expected workflow contract and operator summary paths.");
    const contract = JSON.parse(readFileSync(process.argv[2], "utf8"));
    const run = JSON.parse(readFileSync(process.argv[3], "utf8"));
    const summary = validateCandidateSupplierProof(contract, run);
    console.log(`Supplier proof passed: ${summary.supplierCount} candidates, ${summary.archetypeCount} archetypes, ${summary.mode}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Supplier proof validation failed.");
    process.exitCode = 1;
  }
}
