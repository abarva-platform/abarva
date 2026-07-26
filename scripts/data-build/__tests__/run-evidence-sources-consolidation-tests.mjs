#!/usr/bin/env node
// Regression suite for a real confirmed defect in
// consolidate-active-tenant-inputs.mjs (see reports/tenant-input-consolidation/latest/
// conflict-resolution-report.json for the historical evidence): mapRow() unconditionally
// overwrote every domain's "source_file" column with the physical consolidation-time
// path. On every other domain that's correct (source_file is lineage metadata about
// where the canonical row came from), but on evidence_sources it IS the row's business
// identity -- the source artifact being registered. Overwriting it forced every row
// consolidated from the same input file onto the same businessKey, so genuinely
// distinct evidence-source records collapsed via mergeRows()'s conflict resolution,
// silently discarding all-but-one candidate's fields per column.
//
// A row with no semantic source_file of its own is left empty (flagged
// missing_evidence_source_identity) rather than defaulted to the consolidation-time
// path -- that fallback recreates the same defect one level down, turning "unknown
// source" into a self-reference to the registry file itself. A hard
// hybrid_evidence_contract gate rejects rows carrying citation-level fields
// (evidence_id, locator, etc.) outright, since those belong to the not-yet-built
// evidence_items entity, not the source registry.
//
// These cases cover what the fixed consolidation-script layer can prove today (the
// source-registry level, with a temporary source_file+as_of_date version-aware key --
// real per-version identity is source_id/source_version_id in the v4 candidate schema).
// Per-citation cases (multiple observations extracted from one source file) are NOT
// tested here since the evidence_items pipeline does not exist yet.
//
// Run: node scripts/data-build/__tests__/run-evidence-sources-consolidation-tests.mjs
import { mapRow, businessKey, DOMAINS_WHERE_SOURCE_FILE_IS_BUSINESS_IDENTITY, HybridEvidenceContractError } from "../consolidate-active-tenant-inputs.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

const EVIDENCE_SOURCES_TEMPLATE_COLUMNS = [
  "tenant_key", "source_file", "source_type", "source_owner", "source_date", "as_of_date",
  "confidentiality", "domains_covered", "row_count_or_pages", "quality_notes", "approved_for_loading", "known_gaps",
];

function map(sourceRow, { rowNumber = 2, sourcePath = "datasets/tenant-inputs/active/test-tenant/current/13_evidence_sources.csv", packetId = "universal-standard-v3" } = {}) {
  return mapRow({
    tenant: { tenantKey: "test-tenant" },
    domain: "evidence_sources",
    templateColumns: EVIDENCE_SOURCES_TEMPLATE_COLUMNS,
    sourceRow,
    sourcePath,
    packet: { packetId, classification: "synthetic-demo" },
    rowNumber,
    fileFingerprint: "test-fingerprint",
  });
}

assert(
  DOMAINS_WHERE_SOURCE_FILE_IS_BUSINESS_IDENTITY.has("evidence_sources"),
  "evidence_sources is registered as a domain where source_file is business identity, not mere lineage",
);

// --- Case 2: two different documents with the same source_type -> no merge ---
{
  const rowA = map({ source_file: "vendor-contracts/msa-2026.pdf", source_type: "contract_document", source_owner: "Procurement" });
  const rowB = map({ source_file: "interviews/exec-interviews.csv", source_type: "contract_document", source_owner: "Transformation Office" });
  assert(rowA.source_file === "vendor-contracts/msa-2026.pdf", "row A keeps its own semantic source_file, not the consolidation-time path");
  assert(rowB.source_file === "interviews/exec-interviews.csv", "row B keeps its own semantic source_file, not the consolidation-time path");
  const keyA = businessKey("evidence_sources", rowA);
  const keyB = businessKey("evidence_sources", rowB);
  assert(keyA !== keyB, "two different source artifacts with the same source_type get different business keys (no false merge)");
}

// --- Case 4: two rows missing source_type but referencing different source_ref values -> never merged ---
{
  const rowA = map({ source_file: "docs/renewal-contract-2026.pdf", source_type: "" });
  const rowB = map({ source_file: "docs/benchmark-report-2026.pdf", source_type: "" });
  const keyA = businessKey("evidence_sources", rowA);
  const keyB = businessKey("evidence_sources", rowB);
  assert(keyA !== keyB, "two blank-source_type rows with different source_file values get different business keys");
}

// --- Case 5: a registry CSV physically contains records about other files ---
// semantic source_file survives; original_source_file records the physical
// consolidation path separately; the two are never conflated.
{
  const registryPath = "datasets/tenant-inputs/active/test-tenant/current/13_evidence_sources.csv";
  const row = map(
    { source_file: "interviews/executive_interviews.csv", source_type: "executive_interview" },
    { sourcePath: registryPath },
  );
  assert(row.source_file === "interviews/executive_interviews.csv", "semantic source_file (the real artifact) survives even though the registry CSV itself is a different physical file");
  assert(row.original_source_file === registryPath, "original_source_file still records the physical consolidation-time path -- lineage is preserved, just not conflated with business identity");
  assert(row.source_file !== row.original_source_file, "source_file (business identity) and original_source_file (lineage) are distinct values, not the same string");
}

// --- Correction: a row with NO source_file of its own must NOT fall back to the
// consolidation-time path. That fallback recreates the original defect -- it turns
// "the evidence source is unknown" into "the evidence source is 13_evidence_sources.csv
// itself" (the exact self-reference confirmed live in SkyHarbor's active rows). The
// identity is left empty and flagged for validation instead. ---
{
  const row = map({ source_type: "unspecified" });
  assert(row.source_file === "", "a row with no semantic source_file of its own is left empty -- never defaulted to the consolidation-time path");
  assert(row.original_source_file === "datasets/tenant-inputs/active/test-tenant/current/13_evidence_sources.csv", "the consolidation-time path still lands in original_source_file (lineage), just not in the business-identity field");
  assert(row.__validationFailure === "missing_evidence_source_identity", "a row with no semantic identity is flagged missing_evidence_source_identity rather than silently accepted");
}

// --- Hard hybrid-evidence-contract gate: a v3 evidence_sources row carrying
// citation-level fields (evidence_id, source_row_id, evidence_location, locator, claim,
// citation, excerpt) is a citation from the not-yet-built evidence_items entity, wrongly
// placed in the source registry. It must be rejected outright -- never merged, never
// silently treated as its own valid source. ---
{
  let threw = null;
  try {
    map({ source_file: "interviews/executive_interviews.csv", evidence_id: "EVID-001", evidence_location: "row 42" });
  } catch (error) {
    threw = error;
  }
  assert(threw instanceof HybridEvidenceContractError, "a row with populated citation-level fields throws HybridEvidenceContractError rather than being mapped");
  assert(threw?.code === "hybrid_evidence_contract", "the thrown error carries the hybrid_evidence_contract code");
  assert(threw?.details?.populatedCitationFields?.includes("evidence_id"), "the error reports exactly which citation-level field(s) triggered the gate");
}
{
  // A row with none of the citation-signature fields populated passes through normally.
  const row = map({ source_file: "interviews/executive_interviews.csv", source_type: "executive_interview" });
  assert(row.source_file === "interviews/executive_interviews.csv", "a genuine source-registry row (no citation fields) is unaffected by the hybrid-contract gate");
}

// --- Source-version-aware temporary v3 key: source_file alone would collapse two
// snapshots/versions of the same artifact. as_of_date (falling back to source_date) is
// folded into the business key so distinct versions survive as distinct records. This
// is deliberately imperfect -- the real fix is the v4 candidate's source_id/
// source_version_id -- but it must not regress below what v3 can express today. ---
{
  const snapshot1 = map({ source_file: "interviews/executive_interviews.csv", as_of_date: "2026-06-01" });
  const snapshot2 = map({ source_file: "interviews/executive_interviews.csv", as_of_date: "2026-07-01" });
  assert(
    businessKey("evidence_sources", snapshot1) !== businessKey("evidence_sources", snapshot2),
    "the same artifact with two different as_of_date values produces two distinct source-version business keys",
  );

  const repeat1 = map({ source_file: "interviews/executive_interviews.csv", as_of_date: "2026-06-01", source_owner: "Transformation Office" });
  const repeat2 = map({ source_file: "interviews/executive_interviews.csv", as_of_date: "2026-06-01", source_owner: "Transformation Office" });
  assert(
    businessKey("evidence_sources", repeat1) === businessKey("evidence_sources", repeat2),
    "the same artifact and same as_of_date is treated as the same source-version (a duplicate/merge candidate)",
  );

  const noAsOfDate = map({ source_file: "interviews/executive_interviews.csv", source_date: "2026-06-15" });
  assert(
    businessKey("evidence_sources", noAsOfDate).includes("2026_06_15") || businessKey("evidence_sources", noAsOfDate).includes("2026-06-15"),
    "source_date is used as the version-key fallback when as_of_date is absent",
  );
}

// --- mergeRows: confirm two genuinely distinct evidence_sources rows (different
// business keys) are never candidates for merging in the first place -- the fix is at
// the key-computation layer, not inside mergeRows() itself. ---
{
  const rowA = map({ source_file: "vendor-contracts/msa-2026.pdf", source_type: "contract_document", source_owner: "Procurement" });
  const rowB = map({ source_file: "interviews/exec-interviews.csv", source_type: "contract_document", source_owner: "Transformation Office" });
  assert(businessKey("evidence_sources", rowA) !== businessKey("evidence_sources", rowB), "distinct evidence sources never share a merge key -- mergeRows() is never invoked on them together");
}

// --- Non-evidence_sources domains: source_file behavior is UNCHANGED (still lineage,
// still always the consolidation-time path) -- this fix must not regress the 18 other
// domains where the old behavior is correct. ---
{
  const row = mapRow({
    tenant: { tenantKey: "test-tenant" },
    domain: "applications_systems",
    templateColumns: ["tenant_key", "system_name", "source_file"],
    sourceRow: { system_name: "Reservation Platform", source_file: "some-other-claimed-value.csv" },
    sourcePath: "datasets/tenant-inputs/active/test-tenant/current/04_applications_systems.csv",
    packet: { packetId: "universal-standard-v3", classification: "synthetic-demo" },
    rowNumber: 2,
    fileFingerprint: "test-fingerprint",
  });
  assert(
    row.source_file === "datasets/tenant-inputs/active/test-tenant/current/04_applications_systems.csv",
    "non-evidence_sources domains still always overwrite source_file with the consolidation-time path (unchanged, correct behavior)",
  );
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
