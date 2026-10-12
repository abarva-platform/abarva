import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

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
        source_page: "1",
        confidence: "0.95",
        review_state: "synthetic_demo_reviewed",
        value_text: "$1,550,000 annual commitment",
      },
    ],
    [{ source_file_id: "EVID-01", source_page: "1" }],
  );

  assert.deepEqual(rows[0], {
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
    review_state: "synthetic_demo_reviewed",
    extractor_version: null,
    clause_text_basis: "document_extracted",
  });
});

test("does not invent a page or extraction confidence from a neighbouring page", () => {
  const [row] = normalizeDocumentClauseRows(
    [
      {
        extraction_id: "C-UNREVIEWED",
        contract_id: "CONTRACT-001",
        source_file_id: "DOC-ORIGIN",
        concept_ref: "minimum",
        value_text: "A minimum is recorded.",
      },
    ],
    [originPage],
  );
  assert.equal(row.source_page, "");
  assert.equal(row.confidence, "");
  assert.equal(row.review_state, "unreviewed");
  assert.equal(row.extractor_version, null);
});

test("authored synthetic clause text cannot claim a PDF extraction", async () => {
  const clause = {
    extraction_id: "C-AUTHORED",
    contract_id: "CONTRACT-001",
    source_file_id: "DOC-ORIGIN",
    concept_ref: "minimum",
    value_text: "Synthetic scenario: minimum seats are2200.",
    source_basis: "synthetic_modelled",
    source_page: "1",
    confidence: "0.91",
    review_state: "not_reviewed",
    extractor_version: "pdf-parser-test",
    method: "pdf_text_extraction",
  };
  const rows = normalizeDocumentClauseRows([clause], []);
  assert.equal(rows[0].source_page, "");
  assert.equal(rows[0].confidence, "");
  assert.equal(rows[0].clause_text_basis, "derived_not_extracted");
  const files = buildDocumentFileInputs([], rows, originOptions);
  assert.equal(files[0].pageCount, null);
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [] };
    },
  };
  await loadDocumentEvidence(
    client,
    { ...originOptions, contractIds: ["CONTRACT-001"], loadRunId: "load-test" },
    [],
    rows,
    files,
  );
  const insert = calls.find(({ sql }) =>
    sql.includes('INSERT INTO "doc".extraction'),
  );
  assert.ok(insert);
  assert.ok(!insert.sql.includes("'contract_pdf_adapter_v1'"));
  assert.ok(insert.params.includes("authored_text_import"));
  assert.ok(!insert.params.includes("pdf_text_extraction"));
  const payload = JSON.parse(
    insert.params.find(
      (value) => typeof value === "string" && value.startsWith("{"),
    ),
  );
  assert.equal(payload.clause_text_basis, "derived_not_extracted");
});

test("genuine reviewed extraction keeps its declared parser, page and confidence", () => {
  const [row] = normalizeDocumentClauseRows(
    [
      {
        extraction_id: "C-REAL",
        contract_id: "CONTRACT-001",
        source_file_id: "DOC-ORIGIN",
        concept_ref: "availability",
        value_text: "Supplier shall maintain99.5% monthly availability.",
        source_page: "17",
        confidence: "0.74",
        review_state: "human_reviewed",
        extractor_version: "reviewed-parser-test",
      },
    ],
    [],
  );
  assert.equal(row.source_page, "17");
  assert.equal(row.confidence, "0.74");
  assert.equal(row.review_state, "human_reviewed");
  assert.equal(row.extractor_version, "reviewed-parser-test");
  assert.equal(row.clause_text_basis, "document_extracted");
});

test("a synthetic file name does not establish an executed agreement", async () => {
  const rows = normalizeDocumentClauseRows(
    [
      {
        extraction_id: "C-NAME",
        contract_id: "CONTRACT-001",
        source_file_id: "DOC-NAME-MSA",
        concept_ref: "minimum",
        value_text: "Synthetic minimum quantity.",
        source_basis: "synthetic_modelled",
      },
    ],
    [],
  );
  const args = {
    ...originOptions,
    manifest: [],
    contractIds: ["CONTRACT-001"],
    loadRunId: "load-name",
  };
  const calls = [];
  await loadDocumentEvidence(
    {
      async query(sql, params) {
        calls.push({ sql, params });
        return { rows: [] };
      },
    },
    args,
    [],
    rows,
    buildDocumentFileInputs([], rows, args),
  );
  const file = calls.find((call) =>
    call.sql.includes('INSERT INTO "doc".file'),
  );
  assert.equal(file.params[7], "authored_contract_reference");
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
  manifest: [
    {
      tenant_key: "synthetic-test",
      dataset_version: "synthetic-v1",
      contract_id: "CONTRACT-001",
      source_file_id: "DOC-ORIGIN",
      source_row_id: "manifest:001",
      file_name: "agreement-export.docx",
      source_system: "Synthetic CLM export",
      source_owner: "Contract manager",
      document_type: "contract",
    },
  ],
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
  for (const manifest of [
    [],
    [{ ...originOptions.manifest[0], source_system: "" }],
  ]) {
    const [file] = buildDocumentFileInputs([originPage], [], {
      ...originOptions,
      manifest,
    });
    assert.equal(file.metadata?.upstream_source_system, null);
    assert.equal(
      file.metadata?.processor_system,
      "source_contract_depth_document_evidence_loader",
    );
    assert.equal(
      file.metadata?.source_basis,
      manifest.length ? "declared_synthetic_manifest" : "not_declared",
    );
  }
});

for (const field of ["tenant_key", "dataset_version", "contract_id"]) {
  test(`refuses a manifest with a conflicting ${field}`, () => {
    assert.throws(
      () =>
        buildDocumentFileInputs([originPage], [], {
          ...originOptions,
          manifest: [{ ...originOptions.manifest[0], [field]: "other" }],
        }),
      /Document origin identity conflict/,
    );
  });
}

for (const field of ["tenant_key", "dataset_version"]) {
  test(`refuses document rows with a conflicting ${field} even when the manifest matches`, () => {
    assert.throws(
      () =>
        buildDocumentFileInputs(
          [{ ...originPage, [field]: "other" }],
          [],
          originOptions,
        ),
      /Document row identity conflict/,
    );
  });
}

test("refuses ambiguous manifest entries and cross-contract page ownership", () => {
  assert.throws(
    () =>
      buildDocumentFileInputs([originPage], [], {
        ...originOptions,
        manifest: [originOptions.manifest[0], originOptions.manifest[0]],
      }),
    /Ambiguous document origin/,
  );
  assert.throws(
    () =>
      buildDocumentFileInputs(
        [
          originPage,
          {
            ...originPage,
            contract_id: "CONTRACT-OTHER",
            source_page: "2",
          },
        ],
        [],
        originOptions,
      ),
    /Document file contract identity conflict/,
  );
});

test("writes upstream metadata into the document projection instead of dropping it", async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [] };
    },
  };
  const args = {
    ...originOptions,
    contractIds: ["CONTRACT-001"],
    loadRunId: "load-001",
  };
  const files = buildDocumentFileInputs([originPage], [], args);
  await loadDocumentEvidence(client, args, [originPage], [], files);
  const insert = calls.find(({ sql }) =>
    sql.includes('INSERT INTO "doc".file'),
  );
  const stored = JSON.parse(insert.params[10]);
  assert.equal(stored.upstream_source_system, "Synthetic CLM export");
  assert.equal(stored.upstream_source_row_id, "manifest:001");
  assert.equal(stored.source_manifest_sha256, "a".repeat(64));
  assert.equal(
    stored.processor_system,
    "source_contract_depth_document_evidence_loader",
  );
});

test("plan reads the manifest and refuses conflicts before any database connection", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "document-origin-test-"));
  fs.mkdirSync(path.join(dir, "source-files"));
  fs.writeFileSync(
    path.join(dir, "source-files", "contract_page_text.csv"),
    "source_file_id,contract_id,page_text,source_page\nDOC-ORIGIN,CONTRACT-001,Synthetic passage,1\n",
  );
  fs.writeFileSync(
    path.join(dir, "source-files", "contract_clauses.csv"),
    "source_file_id,contract_id\n",
  );
  const headers = Object.keys(originOptions.manifest[0]);
  const writeManifest = (row) =>
    fs.writeFileSync(
      path.join(dir, "source-files", "evidence_manifest.csv"),
      `${headers.join(",")}\n${headers.map((header) => row[header]).join(",")}\n`,
    );
  const run = () =>
    spawnSync(
      process.execPath,
      [
        new URL("../load-contract-depth-document-evidence.mjs", import.meta.url)
          .pathname,
        "--package-dir",
        dir,
        "--contract-id",
        "CONTRACT-001",
        "--tenant-key",
        "synthetic-test",
        "--dataset-version",
        "synthetic-v1",
      ],
      {
        encoding: "utf8",
        timeout: 5000,
        env: {
          ...process.env,
          CONTRACT_DEPTH_DOC_EVIDENCE_APPLY: "false",
          DATABASE_URL: "invalid-for-connection",
        },
      },
    );
  try {
    writeManifest(originOptions.manifest[0]);
    const valid = run();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(
      JSON.parse(valid.stdout).document_origins[0].upstream_source_system,
      "Synthetic CLM export",
    );
    writeManifest({
      ...originOptions.manifest[0],
      contract_id: "CONTRACT-OTHER",
    });
    const conflict = run();
    assert.equal(conflict.status, 1);
    assert.match(conflict.stderr, /Document origin identity conflict/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const documentDatabase = process.env.SOURCE_DOCUMENT_TEST_DATABASE_URL;
if (documentDatabase) {
  const url = new URL(documentDatabase);
  assert.ok(
    ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.pathname === "/origin_repair_fixture",
    "Disposable localhost fixture only",
  );
}
test(
  "real document writer persists authored versus reviewed extraction provenance",
  { skip: !documentDatabase },
  async () => {
    const client = new pg.Client({ connectionString: documentDatabase });
    await client.connect();
    await client.query("BEGIN");
    try {
      const args = {
        ...originOptions,
        contractIds: ["CONTRACT-001"],
        loadRunId: "load-test",
      };
      const imported = normalizeDocumentClauseRows(
        [
          {
            extraction_id: "C-PG",
            contract_id: "CONTRACT-001",
            source_file_id: "DOC-ORIGIN",
            concept_ref: "minimum",
            value_text: "Synthetic scenario: minimum seats are2200.",
            source_basis: "synthetic_modelled",
            source_page: "1",
            confidence: "0.91",
            review_state: "not_reviewed",
            extractor_version: "pdf-parser-test",
            method: "pdf_text_extraction",
          },
        ],
        [],
      );
      await loadDocumentEvidence(
        client,
        args,
        [],
        imported,
        buildDocumentFileInputs([], imported, args),
      );
      let extraction = (
        await client.query(
          "SELECT * FROM doc.extraction WHERE extraction_id='C-PG'",
        )
      ).rows[0];
      assert.equal(extraction.source_page, null);
      assert.equal(extraction.confidence, null);
      assert.equal(extraction.extractor_version, null);
      assert.equal(extraction.method, "authored_text_import");
      assert.equal(extraction.source_kind, "file");
      assert.equal(extraction.source_span_id, null);
      assert.equal(
        extraction.payload_json.clause_text_basis,
        "derived_not_extracted",
      );
      assert.equal(
        (
          await client.query(
            "SELECT page_count FROM doc.file WHERE file_id='DOC-ORIGIN'",
          )
        ).rows[0].page_count,
        null,
      );
      const reviewed = normalizeDocumentClauseRows(
        [
          {
            ...imported[0],
            source_basis: "document_extracted",
            value_text: "Supplier shall maintain99.5% monthly availability.",
            source_page: "17",
            confidence: "0.74",
            review_state: "human_reviewed",
            extractor_version: "reviewed-parser-test",
          },
        ],
        [],
      );
      await loadDocumentEvidence(
        client,
        args,
        [],
        reviewed,
        buildDocumentFileInputs([], reviewed, args),
      );
      extraction = (
        await client.query(
          "SELECT * FROM doc.extraction WHERE extraction_id='C-PG'",
        )
      ).rows[0];
      assert.equal(extraction.source_page, 17);
      assert.equal(Number(extraction.confidence), 0.74);
      assert.equal(extraction.extractor_version, "reviewed-parser-test");
      assert.equal(extraction.review_state, "human_reviewed");
      assert.equal(
        extraction.payload_json.clause_text_basis,
        "document_extracted",
      );
    } finally {
      try {
        await client.query("ROLLBACK");
      } finally {
        await client.end();
      }
    }
  },
);
