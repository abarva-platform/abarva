import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateServiceNowRequestProof(contract, run) {
  assert(object(contract) && object(run), "Request proof files are invalid.");
  assert(["dry_run", "apply"].includes(contract.mode), "Request proof mode is invalid.");
  assert(run.status === "Succeeded" && run.ok === true, "Request operator did not succeed.");
  assert(
    run.restored?.restored === true &&
      run.restored?.idleVerification?.idleVerified === true &&
      Array.isArray(run.restored.idleVerification.problems) &&
      run.restored.idleVerification.problems.length === 0,
    "Request operator idle state was not verified.",
  );

  const proof = run.proof;
  const summary = proof?.summary;
  assert(proof?.extracted === true && object(summary), "Request quality proof is missing.");
  assert(
    ["proof_bundle", "source_servicenow_request_summary"].includes(proof.extractionKind),
    "Request proof extraction kind is invalid.",
  );
  assert(
    summary.schemaVersion === 1 &&
      summary.event === "source_servicenow_request_import_proof_summary" &&
      summary.mode === contract.mode,
    "Request proof identity or mode does not match dispatch.",
  );
  assert(
    /^[a-f0-9]{64}$/.test(contract.input_sha256) &&
      summary.inputSha256 === contract.input_sha256 &&
      typeof contract.input_source_version === "string" &&
      contract.input_source_version.length > 0 &&
      summary.inputSourceVersion === contract.input_source_version,
    "Request proof input identity does not match dispatch.",
  );
  assert(
    Number.isSafeInteger(summary.requestCount) && summary.requestCount > 0 &&
      Number.isSafeInteger(summary.archetypeCount) && summary.archetypeCount > 0 &&
      summary.requiredFactGapCount === 0 && summary.missingArchetypeCount === 0,
    "Request quality gate has missing coverage or facts.",
  );
  assert(
    summary.authority?.requestVersionsOnly === true &&
      summary.authority.mappingDecisionsWritten === false &&
      summary.authority.eventsCreated === false &&
      summary.authority.suppliersContacted === false,
    "Request proof claims authority outside request versions.",
  );
  if (contract.mode === "dry_run") {
    assert(summary.inserted === 0 && summary.committed === false, "Dry run wrote request data.");
  } else {
    assert(summary.committed === true, "Approved request apply did not commit.");
  }
  return summary;
}

if (process.argv[1]?.endsWith("validate-servicenow-request-proof.mjs")) {
  try {
    assert(process.argv.length === 4, "Expected workflow contract and operator summary paths.");
    const contract = JSON.parse(readFileSync(process.argv[2], "utf8"));
    const run = JSON.parse(readFileSync(process.argv[3], "utf8"));
    const summary = validateServiceNowRequestProof(contract, run);
    console.log(`Request proof passed: ${summary.requestCount} requests, ${summary.archetypeCount} archetypes, ${summary.mode}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Request proof validation failed.");
    process.exitCode = 1;
  }
}
