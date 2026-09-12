import assert from "node:assert/strict";
import test from "node:test";

import { buildDocumentFileInputs, documentFileIdentityConflictMessage } from "../load-contract-depth-document-evidence.mjs";

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
