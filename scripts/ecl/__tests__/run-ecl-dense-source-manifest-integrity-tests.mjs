#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const outDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "ecl-dense-source-integrity-"),
);
const candidateDir = `${outDir}-structure-candidate`;

function candidate(output = candidateDir) {
  return spawnSync(
    "python3",
    [
      "scripts/ecl/write_dense_enterprise_structure_candidate.py",
      "--base-dir",
      outDir,
      "--out-dir",
      output,
      "--tenant-key",
      "meridian-health",
    ],
    { cwd: repo, encoding: "utf8" },
  );
}

function verifyCandidate() {
  return spawnSync(
    "python3",
    [
      "scripts/ecl/validate_dense_enterprise_structure_candidate.py",
      "--candidate-dir",
      candidateDir,
    ],
    { cwd: repo, encoding: "utf8" },
  );
}

function csvRows(file) {
  const parsed = Papa.parse(fs.readFileSync(file, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  assert.deepEqual(parsed.errors, []);
  return parsed.data;
}

function run(script) {
  return spawnSync("python3", [script, "--out-dir", outDir], {
    cwd: repo,
    encoding: "utf8",
  });
}

try {
  const generate = run("scripts/ecl/generate_dense_source_room_extracts.py");
  assert.equal(generate.status, 0, generate.stderr);
  const validate = () =>
    run("scripts/ecl/validate_dense_source_room_extracts.py");
  assert.equal(validate().status, 0, "untouched source set must validate");

  const prepared = candidate();
  assert.equal(prepared.status, 0, prepared.stderr);
  const reviewSet = JSON.parse(
    fs.readFileSync(
      path.join(candidateDir, "candidate_source_set.json"),
      "utf8",
    ),
  );
  assert.equal(reviewSet.state, "candidate_not_approved_or_loaded");
  assert.equal(reviewSet.client_attestation_state, "not_client_attested");
  assert.equal(reviewSet.file_count, 16);
  assert.equal(reviewSet.row_count, 7095);
  assert.deepEqual(reviewSet.structure, {
    segment_count: 3,
    function_count: 12,
    mapped_function_count: 11,
    unmapped_functions: ["Revenue Cycle"],
    revenue_and_owner_basis: "not_declared",
  });
  assert.equal(Object.hasOwn(reviewSet, "approved_by"), false);
  assert.equal(
    reviewSet.source_set_hash,
    crypto
      .createHash("sha256")
      .update(
        JSON.stringify(
          reviewSet.files
            .map((file) => [file.path, file.sha256])
            .sort(([left], [right]) => left.localeCompare(right)),
        ),
      )
      .digest("hex"),
  );
  const plannerHash = spawnSync(
    path.join(repo, "node_modules/.bin/tsx"),
    [
      "-e",
      `import fs from "node:fs"; import { homeSegmentSourceSetHash } from "./scripts/data-build/home-segment-serving-plan.ts";
       const manifest = JSON.parse(fs.readFileSync(process.env.CANDIDATE_MANIFEST, "utf8"));
       const files = Object.fromEntries(manifest.files.map((file) => [file.path, file.sha256]));
       if (homeSegmentSourceSetHash(files) !== manifest.source_set_hash) process.exit(1);`,
    ],
    {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        CANDIDATE_MANIFEST: path.join(
          candidateDir,
          "candidate_source_set.json",
        ),
      },
    },
  );
  assert.equal(plannerHash.status, 0, plannerHash.stderr);
  const segments = csvRows(
    path.join(
      candidateDir,
      "__synthetic_sources__/SP15_Enterprise_Structure/01b_business_segments.csv",
    ),
  );
  const functions = csvRows(
    path.join(
      candidateDir,
      "__synthetic_sources__/SP16_Organization_Functions/01_business_functions.csv",
    ),
  );
  assert.equal(segments.length, 3);
  assert.equal(functions.length, 12);
  assert.ok(
    segments.every(
      (row) =>
        row.revenue_share_pct === "" &&
        row.revenue_usd === "" &&
        row.pnl_owner_role === "" &&
        row.classification_basis === "synthetic_fixture_not_client_declared" &&
        row.review_state === "candidate" &&
        row.client_attestation_state === "not_client_attested" &&
        row.source_file.endsWith("01b_business_segments.csv"),
    ),
  );
  assert.ok(
    functions.every(
      (row) =>
        row.review_state === "candidate" &&
        row.client_attestation_state === "not_client_attested" &&
        row.source_file.endsWith("01_business_functions.csv") &&
        row.executive_owner === "",
    ),
  );
  assert.deepEqual(
    functions
      .filter((row) => !row.business_segment_key)
      .map((row) => row.function_name),
    ["Revenue Cycle"],
  );
  assert.equal(verifyCandidate().status, 0, "unmodified candidate must verify");
  const candidateManifestPath = path.join(
    candidateDir,
    "candidate_source_set.json",
  );
  const originalCandidateManifest = fs.readFileSync(
    candidateManifestPath,
    "utf8",
  );
  const functionPath = path.join(
    candidateDir,
    "__synthetic_sources__/SP16_Organization_Functions/01_business_functions.csv",
  );
  const originalFunctions = fs.readFileSync(functionPath, "utf8");
  const wrongMapping = originalFunctions.replace(
    "meridian-health,Revenue Cycle,,",
    "meridian-health,Revenue Cycle,payer_operations,",
  );
  assert.notEqual(wrongMapping, originalFunctions);
  fs.writeFileSync(functionPath, wrongMapping);
  const rehashed = JSON.parse(originalCandidateManifest);
  rehashed.files.find((file) =>
    file.path.endsWith("01_business_functions.csv"),
  ).sha256 = crypto.createHash("sha256").update(wrongMapping).digest("hex");
  rehashed.source_set_hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify(
        rehashed.files
          .map((file) => [file.path, file.sha256])
          .sort(([left], [right]) => left.localeCompare(right)),
      ),
    )
    .digest("hex");
  fs.writeFileSync(candidateManifestPath, JSON.stringify(rehashed));
  const fabricatedEdge = verifyCandidate();
  assert.notEqual(fabricatedEdge.status, 0);
  assert.match(
    fabricatedEdge.stderr,
    /function mapping or owner boundary is invalid/,
  );
  fs.writeFileSync(functionPath, originalFunctions);
  const promoted = JSON.parse(originalCandidateManifest);
  promoted.state = "approved";
  fs.writeFileSync(candidateManifestPath, JSON.stringify(promoted));
  const falseApproval = verifyCandidate();
  assert.notEqual(falseApproval.status, 0);
  assert.match(falseApproval.stderr, /approval boundary is invalid/);
  promoted.state = "candidate_not_approved_or_loaded";
  promoted.tenant_key = "unregistered-tenant";
  fs.writeFileSync(candidateManifestPath, JSON.stringify(promoted));
  const wrongTenant = verifyCandidate();
  assert.notEqual(wrongTenant.status, 0);
  assert.match(
    wrongTenant.stderr,
    /not the declared synthetic base-package tenant/,
  );
  fs.writeFileSync(candidateManifestPath, originalCandidateManifest);
  assert.equal(verifyCandidate().status, 0, "restored candidate must verify");
  assert.equal(
    validate().status,
    0,
    "candidate build must not alter the historical package",
  );

  const sourcePath = path.join(
    outDir,
    "__synthetic_sources__",
    "SP01_Documents_Interviews",
    "Leadership_Interview_Notes_SYNTHETIC.csv",
  );
  const originalSource = fs.readFileSync(sourcePath, "utf8");
  fs.writeFileSync(
    sourcePath,
    originalSource.replace(
      "deterministic_depth_simulation",
      "changed_simulation_basis",
    ),
  );
  const tampered = validate();
  assert.notEqual(tampered.status, 0);
  assert.match(
    tampered.stderr,
    /source file sha256 does not match the manifest/,
  );
  const refused = candidate(`${candidateDir}-tampered`);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Base source-room validation failed/);
  assert.equal(fs.existsSync(`${candidateDir}-tampered`), false);
  fs.writeFileSync(sourcePath, originalSource);

  const manifestPath = path.join(outDir, "dense_source_room_manifest.csv");
  const originalManifest = fs.readFileSync(manifestPath, "utf8");
  fs.writeFileSync(
    manifestPath,
    originalManifest.replace(
      "__synthetic_sources__/SP01_Documents_Interviews/Leadership_Interview_Notes_SYNTHETIC.csv",
      "../outside.csv",
    ),
  );
  const escaped = validate();
  assert.notEqual(escaped.status, 0);
  assert.match(
    escaped.stderr,
    /source path is missing or outside its declared family/,
  );
  assert.doesNotMatch(escaped.stderr, /Traceback/);
  fs.writeFileSync(manifestPath, originalManifest);

  const manifestLines = originalManifest.trimEnd().split("\n");
  fs.writeFileSync(
    manifestPath,
    `${manifestLines.concat(manifestLines[1]).join("\n")}\n`,
  );
  const duplicated = validate();
  assert.notEqual(duplicated.status, 0);
  assert.match(duplicated.stderr, /duplicate source family/);
  assert.match(duplicated.stderr, /duplicate source path/);

  console.log(
    "Dense source manifest integrity: intact candidate pass; tamper, escaped path and duplicate refused.",
  );
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.rmSync(candidateDir, { recursive: true, force: true });
}
