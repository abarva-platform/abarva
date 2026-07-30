#!/usr/bin/env node
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const testPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testPath), "../../..");
const scriptPath = path.join(repoRoot, "scripts/foundation-v2/run-golden-slice-gates.mjs");
const proofOutput = path.join(mkdtempSync(path.join(tmpdir(), "foundation-v2-gates-")), "proof.json");

const stdout = execFileSync(
  process.execPath,
  [
    scriptPath,
    "--fixture",
    path.join(repoRoot, "fixtures/foundation-v2/golden-slice/fixture-matrix.json"),
    "--proof-output",
    proofOutput,
  ],
  { cwd: path.dirname(scriptPath), encoding: "utf8" },
);

const proof = JSON.parse(stdout);
if (proof.status !== "FOUNDATION_V2_GOLDEN_SLICE_GATES_READY") {
  throw new Error(`unexpected status ${proof.status}`);
}
if (proof.fixture_count !== 21) {
  throw new Error(`expected 21 fixtures, found ${proof.fixture_count}`);
}
if (proof.failure_injection_count < 17) {
  throw new Error(`expected at least 17 failure injections, found ${proof.failure_injection_count}`);
}
if (proof.unsupported_claim_count !== 0) {
  throw new Error(`unsupported claims must be zero, found ${proof.unsupported_claim_count}`);
}
if (!Array.isArray(proof.failure_injection_results) || proof.failure_injection_results.length < 17) {
  throw new Error("expected executable failure injection results");
}
const missedInjections = proof.failure_injection_results.filter((result) => result.status !== "passed" || result.caught !== true);
if (missedInjections.length > 0) {
  throw new Error(`failure injections were not caught: ${missedInjections.map((result) => result.failure_id).join(", ")}`);
}
for (const gate of proof.gate_results ?? []) {
  if (gate.unexplained_variance !== 0 || gate.status !== "passed") {
    throw new Error(`gate ${gate.transition} did not reconcile`);
  }
}
if (proof.database_or_azure_mutated !== false || proof.full_reload_approved !== false || proof.live_cutover_approved !== false) {
  throw new Error("gate harness crossed an unauthorized boundary");
}

const persisted = JSON.parse(readFileSync(proofOutput, "utf8"));
if (persisted.status !== proof.status) {
  throw new Error("persisted proof does not match stdout proof");
}

console.log(JSON.stringify({ status: "PASS", proofOutput }, null, 2));
