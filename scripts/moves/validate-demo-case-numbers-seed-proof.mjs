// Validate the private operator dry-run artifact against workflow dispatch.
// This is plain Node so the workflow does not need to install dependencies.
import { readFileSync } from "node:fs";
import path from "node:path";

const fail = (message) => { throw new Error(message); };
const check = (condition, message) => { if (!condition) fail(message); };
export function validateCaseNumbersDryRun(contract, run, read = (name) => readFileSync(name,"utf8")) {
  check(run?.status === "Succeeded" && run.ok === true,"operator_job_not_succeeded");
  check(run.restored?.restored === true && run.restored?.idleVerification?.idleVerified === true,
    "operator_idle_restore_unverified");
  check(run.proof?.extracted === true && run.proof.extractDir,"proof_bundle_missing");
  const dir=path.join(run.proof.extractDir,"moves-demo-case-numbers-seed-job");
  const proof=JSON.parse(read(path.join(dir,"proof-manifest.json")));
  const gate=JSON.parse(read(path.join(dir,"quality-gate.json")));
  check(proof.schemaVersion === 1 && proof.status === "succeeded" && proof.mode === "dry_run",
    "proof_identity_or_mode_mismatch");
  check(proof.datasetId === "moves_demo_case_numbers_seed_v1" &&
    proof.moveId === "1557f032-5a5c-4475-abe5-b1a841576649" &&
    proof.tenantScope === "meridian-health" && proof.appClientKey === "meridian",
    "proof_scope_mismatch");
  check(proof.sourceSetHash === contract.sourceSetHash && proof.idempotencyKey === contract.idempotencyKey &&
    proof.runId === contract.runId && proof.imageDigest === contract.imageDigest,
    "proof_contract_mismatch");
  check(proof.committed === false && proof.actualWrites === 0 &&
    proof.liveReadback === "not_run" && proof.blobProofLocation === "not_written" &&
    gate.passed === true && gate.applyBlocked === true,
    "dry_run_mutation_or_quality_gate_mismatch");
  check(Array.isArray(proof.rows) && proof.rows.length === 17 &&
    proof.valuePlan?.levers?.length === 2,"proof_dataset_incomplete");
  return proof;
}

if (process.argv[1]?.endsWith("validate-demo-case-numbers-seed-proof.mjs")) {
  try {
    check(process.argv.length === 4,"expected_contract_and_operator_summary");
    const contract=JSON.parse(readFileSync(process.argv[2],"utf8"));
    const run=JSON.parse(readFileSync(process.argv[3],"utf8"));
    const proof=validateCaseNumbersDryRun(contract,run);
    console.log(`Case-number dry-run proof passed: ${proof.rows.length} proposed rows, 0 writes`);
  } catch (error) {
    console.error(error instanceof Error?error.message:String(error));
    process.exitCode=1;
  }
}
