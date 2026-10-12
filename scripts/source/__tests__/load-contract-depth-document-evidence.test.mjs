import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildDocumentFileInputs,
  documentFileIdentityConflictMessage,
  normalizeDocumentClauseRows,
  loadDocumentEvidence,
  staleDocumentFileIds,
} from "../load-contract-depth-document-evidence.mjs";

test("normalizes dense package clauses before document projection", () => {
  const rows = normalizeDocumentClauseRows(
    [
      {
        clause_id: "CL-01",
        clause_type: "committed_purchase_amount",
        contract_id: "CONTRACT-001",
        source_file_id: "EVID-01",
        source_page_ref: "Order Form Sec. 2",
        value_text: "$1,550,000 annual commitment",
      },
    ],
    [{ source_file_id: "EVID-01", source_page: "1" }],
  );

  assert.deepEqual(
    rows[0],
    {
      clause_id: "CL-01",
      clause_type: "committed_purchase_amount",
      contract_id: "CONTRACT-001",
      source_file_id: "EVID-01",
      source_page_ref: "Order Form Sec. 2",
      value_text: "$1,550,000 annual commitment",
      extraction_id: "CL-01",
      concept_ref: "committed_purchase_amount",
      subject_kind: "contract",
      subject_ref: "CONTRACT-001",
      source_section: "Order Form Sec. 2",
      source_page: "1",
      evidence_class: "contract_clause",
      confidence: "0.95",
      review_state: "system_extracted_synthetic_demo",
    },
  );
});

test("materializes file inputs for page-backed and clause-only evidence", () => {
  const rows = buildDocumentFileInputs(
    [
      {
        source_file_id: "DOC-PAGE",
        source_page: "1",
        page_text: "Page-backed evidence",
        contract_id: "CONTRACT-001",
      },
    ],
    [
      {
        source_file_id: "DOC-CLAUSE-ONLY",
        source_page: "7",
        value_text: "Clause-only evidence",
        contract_id: "CONTRACT-001",
      },
    ],
  );

  assert.deepEqual(
    rows.map((row) => ({
      sourceFileId: row.sourceFileId,
      pageCount: row.pageCount,
      combinedText: row.combinedText,
    })),
    [
      {
        sourceFileId: "DOC-CLAUSE-ONLY",
        pageCount: 7,
        combinedText: "Clause-only evidence",
      },
      {
        sourceFileId: "DOC-PAGE",
        pageCount: 1,
        combinedText: "Page-backed evidence",
      },
    ],
  );
});

test("describes cross-contract document identity conflicts instead of overwriting ownership", () => {
  assert.equal(
    documentFileIdentityConflictMessage([
      { file_id: "DOC-SHARED", contract_ref: "CONTRACT-A" },
    ]),
    "Source file identity conflict: DOC-SHARED -> CONTRACT-A. A document file id cannot be reused across contract ids.",
  );
});

test("only identifies stale files from the same governed package and contract", () => {
  const args = {
    datasetVersion: "dataset-v1",
    contractIds: ["CONTRACT-001"],
  };
  assert.deepEqual(
    staleDocumentFileIds(
      [
        {
          file_id: "DOC-OLD",
          contract_ref: "CONTRACT-001",
          metadata_json: { source_package: "dataset-v1/source-files" },
        },
        {
          file_id: "DOC-OTHER-CONTRACT",
          contract_ref: "CONTRACT-002",
          metadata_json: { source_package: "dataset-v1/source-files" },
        },
        {
          file_id: "DOC-OTHER-PACKAGE",
          contract_ref: "CONTRACT-001",
          metadata_json: { source_package: "dataset-v2/source-files" },
        },
      ],
      ["DOC-CURRENT"],
      args,
    ),
    ["DOC-OLD"],
  );
});

const originPage = {
  source_file_id: "DOC-ORIGIN",
  contract_id: "CONTRACT-001",
  page_text: "Synthetic agreement passage",
  source_page: "1",
};
const originOptions = {
  tenantKey: "synthetic-test",
  datasetVersion: "synthetic-v1",
  manifestSha256: "a".repeat(64),
  manifest: [{
    tenant_key: "synthetic-test",
    dataset_version: "synthetic-v1",
    contract_id: "CONTRACT-001",
    source_file_id: "DOC-ORIGIN",
    source_row_id: "manifest:001",
    file_name: "agreement-export.docx",
    source_system: "Synthetic CLM export",
    source_owner: "Contract manager",
    document_type: "contract",
  }],
};

test("preserves declared upstream origin separately from processing provenance", () => {
  const [file] = buildDocumentFileInputs([originPage], [], originOptions);
  assert.deepEqual(file.metadata, {
    dataset_version: "synthetic-v1",
    synthetic_policy: "synthetic_demo_only_not_client_truth",
    vendor_name: undefined,
    source_package: "synthetic-v1/source-files",
    processor_system: "source_contract_depth_document_evidence_loader",
    source_basis: "declared_synthetic_manifest",
    upstream_source_system: "Synthetic CLM export",
    upstream_source_file: "agreement-export.docx",
    upstream_source_row_id: "manifest:001",
    upstream_source_owner: "Contract manager",
    upstream_document_type: "contract",
    source_manifest: "source-files/evidence_manifest.csv",
    source_manifest_sha256: "a".repeat(64),
  });
});

test("does not invent an upstream system when a manifest or declaration is absent", () => {
  for (const manifest of [[], [{ ...originOptions.manifest[0], source_system: "" }]]) {
    const [file] = buildDocumentFileInputs([originPage], [], { ...originOptions, manifest });
    assert.equal(file.metadata?.upstream_source_system, null);
    assert.equal(file.metadata?.processor_system, "source_contract_depth_document_evidence_loader");
    assert.equal(file.metadata?.source_basis, manifest.length ? "declared_synthetic_manifest" : "not_declared");
  }
});

for (const field of ["tenant_key", "dataset_version", "contract_id"]) {
  test(`refuses a manifest with a conflicting ${field}`, () => {
    assert.throws(() => buildDocumentFileInputs([originPage], [], {
      ...originOptions,
      manifest: [{ ...originOptions.manifest[0], [field]: "other" }],
    }), /Document origin identity conflict/);
  });
}

test("refuses ambiguous manifest entries and cross-contract page ownership", () => {
  assert.throws(() => buildDocumentFileInputs([originPage], [], {
    ...originOptions,
    manifest: [originOptions.manifest[0], originOptions.manifest[0]],
  }), /Ambiguous document origin/);
  assert.throws(() => buildDocumentFileInputs([originPage, {
    ...originPage, contract_id: "CONTRACT-OTHER", source_page: "2",
  }], [], originOptions), /Document file contract identity conflict/);
});

test("writes upstream metadata into the document projection instead of dropping it", async () => {
  const calls = [];
  const client = { async query(sql, params) { calls.push({ sql, params }); return { rows: [] }; } };
  const args = { ...originOptions, contractIds: ["CONTRACT-001"], loadRunId: "load-001" };
  const files = buildDocumentFileInputs([originPage], [], args);
  await loadDocumentEvidence(client, args, [originPage], [], files);
  const insert = calls.find(({ sql }) => sql.includes('INSERT INTO "doc".file'));
  const stored = JSON.parse(insert.params[10]);
  assert.equal(stored.upstream_source_system, "Synthetic CLM export");
  assert.equal(stored.upstream_source_row_id, "manifest:001");
  assert.equal(stored.source_manifest_sha256, "a".repeat(64));
  assert.equal(stored.processor_system, "source_contract_depth_document_evidence_loader");
});

test("plan reads the manifest and refuses conflicts before any database connection", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "document-origin-test-"));
  fs.mkdirSync(path.join(dir, "source-files"));
  fs.writeFileSync(path.join(dir, "source-files", "contract_page_text.csv"),
    "source_file_id,contract_id,page_text,source_page\nDOC-ORIGIN,CONTRACT-001,Synthetic passage,1\n");
  fs.writeFileSync(path.join(dir, "source-files", "contract_clauses.csv"), "source_file_id,contract_id\n");
  const headers = Object.keys(originOptions.manifest[0]);
  const writeManifest = (row) => fs.writeFileSync(path.join(dir, "source-files", "evidence_manifest.csv"),
    `${headers.join(",")}\n${headers.map((header) => row[header]).join(",")}\n`);
  const run = () => spawnSync(process.execPath, [
    new URL("../load-contract-depth-document-evidence.mjs", import.meta.url).pathname,
    "--package-dir", dir, "--contract-id", "CONTRACT-001",
    "--tenant-key", "synthetic-test", "--dataset-version", "synthetic-v1",
  ], { encoding: "utf8", timeout: 5000, env: { ...process.env,
    CONTRACT_DEPTH_DOC_EVIDENCE_APPLY: "false", DATABASE_URL: "invalid-for-connection" } });
  try {
    writeManifest(originOptions.manifest[0]);
    const valid = run();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(JSON.parse(valid.stdout).document_origins[0].upstream_source_system, "Synthetic CLM export");
    writeManifest({ ...originOptions.manifest[0], contract_id: "CONTRACT-OTHER" });
    const conflict = run();
    assert.equal(conflict.status, 1);
    assert.match(conflict.stderr, /Document origin identity conflict/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
