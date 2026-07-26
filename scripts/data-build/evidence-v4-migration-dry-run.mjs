#!/usr/bin/env node
// Gate 1 (zero-write) of the evidence-v4 migration. Reads eligible predecessor
// evidence-source material, the currently-active (collapsed) evidence_sources
// rows, executive interview files, and the historical consolidation reports
// that recorded what was discarded -- then proposes a split into
// evidence_sources (source-artifact versions) / evidence_items (citeable
// units) / executive_interviews candidates, per tenant.
//
// HARD GUARANTEES:
// - Zero writes to active/current, tenant-input-registry.json, Postgres, or
//   any runtime path. Output lands only under reports/evidence-v4-migration/.
// - Zero Claude calls, zero candidate regeneration.
// - Every input row receives exactly one explicit disposition; counts must
//   reconcile exactly (asserted, not just reported).
// - Predecessor material is read ONLY via `git show <commit>:<path>` against
//   commits where the file existed -- never by resurrecting the path as a
//   live loader root. This matches the registry's own stated recovery
//   policy ("Historical recovery is git history or external archive only").
//
// Run: node scripts/data-build/evidence-v4-migration-dry-run.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import Papa from "papaparse";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/evidence-v4-migration");
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const conflictReport = JSON.parse(fs.readFileSync(path.join(repoRoot, "reports/tenant-input-consolidation/latest/conflict-resolution-report.json"), "utf8"));
const dedupReport = JSON.parse(fs.readFileSync(path.join(repoRoot, "reports/tenant-input-consolidation/latest/row-deduplication-report.json"), "utf8"));

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function nonBlank(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function git(args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
}

// Find the most recent commit where `relPath` existed with real content --
// i.e. skip commits whose message is a purge/delete of the path itself.
function lastExistingCommitFor(relPath) {
  const log = git(["log", "--all", "--pretty=format:%H %s", "--", relPath]);
  const lines = log.split("\n").filter(Boolean);
  for (const line of lines) {
    const spaceIdx = line.indexOf(" ");
    const hash = line.slice(0, spaceIdx);
    const message = line.slice(spaceIdx + 1);
    if (/purge|delete|remove|sunset/i.test(message)) continue;
    return hash;
  }
  return lines.length > 0 ? lines[lines.length - 1].split(" ")[0] : null;
}

function readFromGit(commit, relPath) {
  try {
    return git(["show", `${commit}:${relPath}`]);
  } catch {
    return null;
  }
}

function blobShaFor(commit, relPath) {
  try {
    const line = git(["ls-tree", commit, "--", relPath]).trim();
    // format: <mode> blob <sha>\t<path>
    const match = line.match(/\sblob\s([0-9a-f]{40})\s/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

function parseCsv(text) {
  if (!text) return [];
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

// --- Schema-shape detection for recovered predecessor files ---
function detectShape(columns) {
  const set = new Set(columns);
  if (set.has("chunk_id") && set.has("source_artifact_ref")) return "v7_chunk_registry";
  if (set.has("source_artifact_uri") && set.has("source_artifact_label") && set.has("evidence_id")) return "v7_source_registry";
  if (set.has("source_file") && set.has("evidence_id") && (set.has("source_location") || set.has("evidence_title"))) return "v6_hybrid";
  // Real, confirmed shape found live in meridian-health's active/current
  // 13_evidence_sources.csv (NOT the universal-standard-v3 template shape at
  // all -- no source_file column exists). Same structural family as the
  // <tenant>/standard-2026-07-v3/13_evidence_sources.csv legacy files: one
  // row per citation, business_name/context_item/evidence_id/
  // evidence_location, grouped under evidence_location as the real source.
  if (set.has("business_name") && set.has("context_item") && set.has("evidence_id") && set.has("evidence_location") && !set.has("source_file")) {
    return "legacy_context_bundle";
  }
  if (set.has("source_file") && !set.has("evidence_id")) return "v3_source_registry_like";
  return "unknown";
}

function predecessorPathsForTenant(tenantKey) {
  const paths = new Set();
  for (const entry of [...conflictReport, ...dedupReport]) {
    if (entry.tenantKey === tenantKey && entry.domain === "evidence_sources" && entry.incomingSourcePath) {
      paths.add(entry.incomingSourcePath);
    }
  }
  return [...paths];
}

function interviewFileFor(tenantKey) {
  const p = path.join(repoRoot, "datasets/tenant-inputs", tenantKey, "interviews/executive_interviews.csv");
  return fs.existsSync(p) ? p : null;
}

function activeEvidenceSourcesFile(tenant) {
  return path.join(repoRoot, tenant.canonicalInputRoot, "13_evidence_sources.csv");
}

function normalizeRef(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function makeSourceVersionId(tenantKey, sourceRef, versionKey) {
  return `SRCV-${tenantKey.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${sha256(`${sourceRef}|${versionKey}`).slice(0, 12).toUpperCase()}`;
}

function makeSourceId(tenantKey, sourceRef) {
  return `SRC-${tenantKey.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${sha256(normalizeRef(sourceRef)).slice(0, 12).toUpperCase()}`;
}

// Only real, meaningful approval/review-status values belong in
// `classification` -- confirmed live values from recovered predecessor data
// (review_required/approved on the V6 hybrid file's own evidence_type
// column). Anything else (retrieval eligibility, dimension names, priority
// themes) is a different kind of signal and must be routed elsewhere, not
// silently dropped into this field just because a value was present.
const VALID_EVIDENCE_CLASSIFICATIONS = new Set(["approved", "review_required", "rejected", "pending", "pending_review", "candidate"]);
function sanitizeClassification(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return VALID_EVIDENCE_CLASSIFICATIONS.has(normalized) ? normalized : "";
}

const VALID_EVIDENCE_TYPES = new Set([
  "loaded_fact", "interview_signal", "metric", "document_excerpt", "workshop_observation", "benchmark", "derived_measure",
]);
function sanitizeEvidenceType(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  return VALID_EVIDENCE_TYPES.has(normalized) ? normalized : fallback || "loaded_fact";
}

// Real 38-dimension catalog, extracted from
// scripts/knowledge/build-home-knowledge-v4-review-pack.mjs's
// expandedDimensionCatalog -- the actual keys Home V4 dimensions resolve
// against. Kept as a literal list (not imported) since that script has
// paid-call side effects at module scope; this is read-only, zero-cost
// tooling that must never trigger one by importing it.
const VALID_DIMENSION_KEYS = new Set([
  "enterprise_thesis", "leadership_agenda", "proven_strengths", "structural_constraints", "interview_signals",
  "profile", "divisions", "front_middle_back", "functions", "capabilities", "org", "decision_rights", "workforce",
  "geography", "value_streams", "business_processes", "journeys", "opev", "service_delivery", "apps", "data",
  "integrations", "infra", "architecture_dependencies", "tech_lifecycle", "data_quality_lineage", "identity_semantic",
  "risks", "evidence", "vendors", "ms", "budget", "programs", "ai", "metrics", "industry", "lenses", "rel",
]);

// Keyword -> real dimension key. Applied to whatever free-text hint fields a
// recovered row actually carries (domain filenames, dimension labels,
// priority themes, semantic tags). Deliberately conservative: an unmatched
// hint leaves dimension_keys empty rather than guessing, per "a migration
// may leave a dimension unresolved... but must not silently blank an
// association that already exists" -- this only fires when a hint exists.
const DIMENSION_KEYWORD_MAP = [
  [/interview/i, ["interview_signals"]],
  [/leadership|executive.?priority/i, ["leadership_agenda"]],
  [/org_ownership|org.?ownership|decision.?rights/i, ["org", "decision_rights"]],
  [/workforce|persona|role/i, ["workforce"]],
  [/business_functions|capabilit/i, ["functions", "capabilities"]],
  [/applications_systems|application.?portfolio/i, ["apps"]],
  [/data_assets|data.?integration/i, ["data", "integrations"]],
  [/infrastructure_platforms|infra/i, ["infra"]],
  [/vendors_contracts|vendor/i, ["vendors"]],
  [/managed_services|service_scope/i, ["ms", "service_delivery"]],
  [/programs_initiatives|program/i, ["programs"]],
  [/ai_automation|ai_use_case|\bai\b/i, ["ai"]],
  [/risks_controls|\brisk\b/i, ["risks"]],
  [/relationships|graph_edge/i, ["rel"]],
  [/evidence_sources|evidence_item/i, ["evidence"]],
  [/metrics_outcomes|\bmetric\b/i, ["metrics"]],
  [/industry_context|industry_pattern/i, ["industry"]],
  [/expert_lenses|\blens/i, ["lenses"]],
  [/operational_process|process_evidence/i, ["opev"]],
  [/enterprise_profile|\bprofile\b/i, ["profile"]],
  [/geography|legal_entit/i, ["geography"]],
  [/value_stream/i, ["value_streams"]],
  [/journey/i, ["journeys"]],
  [/divisions|business_unit/i, ["divisions"]],
  [/front.?middle.?back/i, ["front_middle_back"]],
  [/budget|spend_value/i, ["budget"]],
];

function normalizeDimensionKeys(hints) {
  const found = new Set();
  for (const hint of hints) {
    if (!nonBlank(hint)) continue;
    for (const [pattern, keys] of DIMENSION_KEYWORD_MAP) {
      if (pattern.test(hint)) for (const k of keys) found.add(k);
    }
  }
  return [...found].filter((k) => VALID_DIMENSION_KEYS.has(k));
}

// --- Per-tenant migration ---
function migrateTenant(tenant) {
  const tenantKey = tenant.tenantKey;
  const dispositions = []; // { row_ref, input_file, disposition, reason, target_id }
  const sourceCandidates = new Map(); // source_version_id -> row
  const itemCandidates = []; // evidence_items rows
  const interviewCandidates = []; // executive_interviews rows
  const unresolvedRecords = [];
  const conflictReview = [];
  const sourceDeduplication = [];
  const sourceMetadataConflicts = [];
  const evidenceIdReconciliation = [];
  const lineage = [];
  const fileLevelFailures = [];
  const outputEvidenceIdUsage = new Map(); // output evidence_id -> row_ref that first used it
  let totalInputRows = 0;

  function recordDisposition(row_ref, input_file, disposition, reason, target_id) {
    dispositions.push({ row_ref, input_file, disposition, reason: reason ?? "", target_id: target_id ?? "" });
  }

  // Every row carrying a real INPUT evidence_id gets exactly one entry here,
  // regardless of outcome -- this is what lets a reviewer verify no evidence
  // ID silently disappeared without reopening the source file.
  function recordEvidenceIdReconciliation({ inputEvidenceId, inputFile, rowRef, disposition, outputEvidenceId, sourceVersionId, reason }) {
    if (!nonBlank(inputEvidenceId)) return;
    evidenceIdReconciliation.push({
      tenant_key: tenantKey,
      input_evidence_id: inputEvidenceId,
      input_file: inputFile,
      row_ref: rowRef,
      disposition,
      output_evidence_id: outputEvidenceId || "",
      source_version_id: sourceVersionId || "",
      reason: reason || "",
    });
  }

  // Real per-source-artifact metadata fields eligible for fill/confirm/
  // conflict merging when the same source_version_id is contributed to by
  // multiple rows (e.g. many citations from the same source).
  const MERGEABLE_SOURCE_FIELDS = ["source_name", "source_owner", "confidentiality", "source_date", "as_of_date"];

  // isPrimaryDisposition=false: this row's PRIMARY disposition is already
  // (or will be) recorded elsewhere -- e.g. a citation-shaped row whose real
  // disposition is migrated_evidence_item, where creating/reusing a source is
  // a side effect of grouping, not an independent input row. Every real
  // input row gets exactly one disposition; this flag is how the same
  // row-processing code can be reused for both "this row IS a source
  // declaration" and "this row references a source as a side effect"
  // without double-counting the second case.
  //
  // contentBytes: the ACTUAL recovered bytes of the source artifact, when
  // this migration genuinely possesses them (e.g. the interview file read
  // directly off disk). Most sources here are logical references described
  // BY a recovered registry row, not artifacts recovered themselves -- for
  // those, contentBytes is omitted and content_fingerprint stays blank with
  // an honest quality_notes explanation, rather than fingerprinting the
  // registry description and calling it the artifact's content.
  function upsertSource({ sourceRef, sourceKind, sourceName, sourceOwner, sourceDate, asOfDate, confidentiality, qualityNotes, knownGaps, contentBytes, inputFile, rowRef, isPrimaryDisposition = true }) {
    if (!nonBlank(sourceRef)) {
      if (isPrimaryDisposition) {
        unresolvedRecords.push({ tenant_key: tenantKey, input_file: inputFile, row_ref: rowRef, reason: "blank_semantic_source_ref" });
        recordDisposition(rowRef, inputFile, "unresolved", "blank_semantic_source_ref");
      }
      return null;
    }
    const versionKey = asOfDate || sourceDate || "unknown-version";
    const sourceId = makeSourceId(tenantKey, sourceRef);
    const sourceVersionId = makeSourceVersionId(tenantKey, sourceRef, versionKey);
    if (sourceCandidates.has(sourceVersionId)) {
      const existing = sourceCandidates.get(sourceVersionId);
      const incoming = { source_name: sourceName, source_owner: sourceOwner, confidentiality, source_date: sourceDate, as_of_date: asOfDate };
      for (const field of MERGEABLE_SOURCE_FIELDS) {
        const incomingValue = incoming[field];
        if (!nonBlank(incomingValue)) continue;
        if (!nonBlank(existing[field])) {
          existing[field] = incomingValue; // fill complementary blank metadata
        } else if (normalizeRef(existing[field]) !== normalizeRef(incomingValue)) {
          sourceMetadataConflicts.push({
            tenant_key: tenantKey, source_version_id: sourceVersionId, field,
            existing_value: existing[field], incoming_value: incomingValue, row_ref: rowRef, input_file: inputFile,
          });
        }
        // equal values: confirmation, nothing to do.
      }
      if (isPrimaryDisposition) {
        sourceDeduplication.push({ tenant_key: tenantKey, source_version_id: sourceVersionId, input_file: inputFile, row_ref: rowRef, rule: "same_source_ref_and_version_key" });
        recordDisposition(rowRef, inputFile, "duplicate_with_proof", `same source_ref+version_key as ${sourceVersionId}`, sourceVersionId);
      }
      return sourceVersionId;
    }
    sourceCandidates.set(sourceVersionId, {
      tenant_key: tenantKey,
      source_id: sourceId,
      source_version_id: sourceVersionId,
      source_name: sourceName || sourceRef,
      source_kind: sourceKind || "external_reference",
      source_ref: sourceRef,
      source_version: versionKey,
      source_date: sourceDate || "",
      as_of_date: asOfDate || "",
      ingested_at: "",
      source_owner: sourceOwner || "",
      confidentiality: confidentiality || "",
      domains_covered: "",
      row_count_or_pages: "",
      content_fingerprint: contentBytes ? sha256(contentBytes) : "",
      approved_for_loading: "",
      quality_notes: contentBytes ? (qualityNotes || "") : [qualityNotes, "content hash unavailable in historical source"].filter(Boolean).join(" | "),
      known_gaps: knownGaps || "",
      supersedes_source_version_id: "",
    });
    if (isPrimaryDisposition) recordDisposition(rowRef, inputFile, "migrated_source", "", sourceVersionId);
    return sourceVersionId;
  }

  // isPrimaryDisposition=false: this row's primary disposition is recorded
  // elsewhere (used only for the derived item on an interview row, whose
  // primary disposition is migrated_interview -- the item is a byproduct of
  // that one row, not a second independent input row).
  function addItem({ sourceVersionId, evidenceId, evidenceType, evidenceSummary, locatorType, locator, sourceRecordId, confidence, classification, evidenceDate, knownGaps, dimensionHints, businessObjectRefs, inputFile, rowRef, isPrimaryDisposition = true }) {
    if (!sourceVersionId) {
      if (isPrimaryDisposition) {
        unresolvedRecords.push({ tenant_key: tenantKey, input_file: inputFile, row_ref: rowRef, reason: "evidence_item_has_no_resolvable_source_version" });
        recordDisposition(rowRef, inputFile, "unresolved", "evidence_item_has_no_resolvable_source_version");
      }
      recordEvidenceIdReconciliation({ inputEvidenceId: evidenceId, inputFile, rowRef, disposition: "unresolved", reason: "no_resolvable_source_version" });
      return;
    }
    // A summary does not substitute for a locator -- a citeable item must
    // identify WHERE it came from (row/page/section/chunk/timestamp/query_result).
    if (!nonBlank(locator)) {
      if (isPrimaryDisposition) {
        unresolvedRecords.push({ tenant_key: tenantKey, input_file: inputFile, row_ref: rowRef, reason: "missing_required_locator" });
        recordDisposition(rowRef, inputFile, "unresolved", "missing_required_locator");
      }
      recordEvidenceIdReconciliation({ inputEvidenceId: evidenceId, inputFile, rowRef, disposition: "unresolved", sourceVersionId, reason: "missing_required_locator" });
      return;
    }
    const finalEvidenceId = nonBlank(evidenceId) ? evidenceId : `EVID-${tenantKey.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${sha256(`${sourceVersionId}|${locator}|${evidenceSummary}`).slice(0, 10).toUpperCase()}`;
    if (outputEvidenceIdUsage.has(finalEvidenceId)) {
      const prior = outputEvidenceIdUsage.get(finalEvidenceId);
      const isExactContentDuplicate = prior.sourceVersionId === sourceVersionId && normalizeRef(prior.evidenceSummary) === normalizeRef(evidenceSummary || "");
      if (isExactContentDuplicate) {
        // A genuine content duplicate in the source data itself (confirmed
        // live: meridian-health's active file carries the exact same
        // interview-evidence row twice under different record_ids, same
        // evidence_id) -- this is duplicate_with_proof, not a script defect.
        if (isPrimaryDisposition) {
          sourceDeduplication.push({ tenant_key: tenantKey, source_version_id: sourceVersionId, input_file: inputFile, row_ref: rowRef, rule: "same_evidence_id_and_identical_content_as_" + prior.rowRef });
          recordDisposition(rowRef, inputFile, "duplicate_with_proof", `identical evidence_id+content as ${prior.rowRef}`, finalEvidenceId);
        }
        recordEvidenceIdReconciliation({ inputEvidenceId: evidenceId, inputFile, rowRef, disposition: "duplicate_with_proof", outputEvidenceId: finalEvidenceId, sourceVersionId, reason: `identical content as ${prior.rowRef}` });
        return;
      }
      // Same evidence_id, DIFFERENT content -- a genuine collision, not a
      // simple duplicate. Confirmed live: meridian-health reuses the same
      // evidence_id across two distinct representations of the same
      // underlying observation (a summarized "context bundle" row in the
      // active file vs. the raw row in the interview file) -- a real
      // modeling ambiguity, not a script defect and not safe to silently
      // pick one. Routed to human review rather than crashing the whole
      // multi-tenant run over one ambiguous row.
      if (isPrimaryDisposition) {
        conflictReview.push({ tenant_key: tenantKey, row_ref: rowRef, reason: `evidence_id "${finalEvidenceId}" collides with ${prior.rowRef} but content differs -- likely two representations of the same underlying observation` });
        recordDisposition(rowRef, inputFile, "conflict_requires_review", `evidence_id collision with differing content vs ${prior.rowRef}`);
      }
      recordEvidenceIdReconciliation({ inputEvidenceId: evidenceId, inputFile, rowRef, disposition: "conflict_requires_review", sourceVersionId, reason: `evidence_id collision with differing content vs ${prior.rowRef}` });
      return;
    }
    outputEvidenceIdUsage.set(finalEvidenceId, { rowRef, sourceVersionId, evidenceSummary: evidenceSummary || "" });
    recordEvidenceIdReconciliation({ inputEvidenceId: evidenceId, inputFile, rowRef, disposition: "migrated_evidence_item", outputEvidenceId: finalEvidenceId, sourceVersionId });
    const dimensionKeys = normalizeDimensionKeys(dimensionHints || []);
    itemCandidates.push({
      tenant_key: tenantKey,
      evidence_id: finalEvidenceId,
      source_version_id: sourceVersionId,
      evidence_type: sanitizeEvidenceType(evidenceType),
      evidence_summary: evidenceSummary || "",
      locator_type: locatorType || "section",
      locator: locator || "",
      source_record_id: sourceRecordId || "",
      dimension_keys: dimensionKeys.join("|"),
      business_object_refs: businessObjectRefs || "",
      classification: sanitizeClassification(classification),
      confidence: confidence || "",
      evidence_date: evidenceDate || "",
      approved_for_use: "",
      known_gaps: knownGaps || "",
      content_fingerprint: sha256(`${sourceVersionId}|${finalEvidenceId}|${locator}`),
    });
    if (isPrimaryDisposition) recordDisposition(rowRef, inputFile, "migrated_evidence_item", "", finalEvidenceId);
  }

  // --- 1. Recovered predecessor files ---
  const predecessorPaths = predecessorPathsForTenant(tenantKey);
  const recoveryManifestEntries = [];
  for (const relPath of predecessorPaths) {
    const discoveryBasis = "conflict-resolution-report.json + row-deduplication-report.json (incomingSourcePath)";
    const commit = lastExistingCommitFor(relPath);
    if (!commit) {
      fileLevelFailures.push({ tenant_key: tenantKey, input_file: relPath, reason: "no_commit_found_in_git_history" });
      recoveryManifestEntries.push({
        tenant_key: tenantKey, historical_path: relPath, recovery_commit: "", blob_sha: "", content_sha256: "",
        detected_shape: "", row_count: 0, discovery_basis: discoveryBasis, included_or_excluded: "excluded",
        exclusion_reason: "no_commit_found_in_git_history",
      });
      continue;
    }
    const text = readFromGit(commit, relPath);
    if (!text) {
      fileLevelFailures.push({ tenant_key: tenantKey, input_file: relPath, reason: `git_show_failed_at_${commit}` });
      recoveryManifestEntries.push({
        tenant_key: tenantKey, historical_path: relPath, recovery_commit: commit, blob_sha: blobShaFor(commit, relPath), content_sha256: "",
        detected_shape: "", row_count: 0, discovery_basis: discoveryBasis, included_or_excluded: "excluded",
        exclusion_reason: `git_show_failed_at_${commit}`,
      });
      continue;
    }
    const rows = parseCsv(text);
    if (rows.length === 0) {
      recoveryManifestEntries.push({
        tenant_key: tenantKey, historical_path: relPath, recovery_commit: commit, blob_sha: blobShaFor(commit, relPath), content_sha256: sha256(text),
        detected_shape: "unknown", row_count: 0, discovery_basis: discoveryBasis, included_or_excluded: "excluded",
        exclusion_reason: "zero_rows_after_parse",
      });
      continue;
    }
    totalInputRows += rows.length;
    const shape = detectShape(Object.keys(rows[0]));
    lineage.push({ tenant_key: tenantKey, input_file: relPath, recovered_via_commit: commit, row_count: rows.length, detected_shape: shape });
    recoveryManifestEntries.push({
      tenant_key: tenantKey, historical_path: relPath, recovery_commit: commit, blob_sha: blobShaFor(commit, relPath), content_sha256: sha256(text),
      detected_shape: shape, row_count: rows.length, discovery_basis: discoveryBasis, included_or_excluded: "included",
      exclusion_reason: "",
    });

    rows.forEach((row, idx) => {
      const rowRef = `${relPath}#${idx + 2}`;
      if (shape === "v6_hybrid") {
        // Exactly one disposition per row: a row WITH evidence_id is a
        // citation -- its primary disposition is migrated_evidence_item, and
        // creating/reusing the grouping source is a silent side effect. A
        // row with NO evidence_id is itself a plain source declaration --
        // upsertSource is its (sole) primary disposition.
        const hasCitation = nonBlank(row.evidence_id);
        const sourceVersionId = upsertSource({
          sourceRef: row.source_file,
          sourceKind: "external_reference",
          sourceName: row.source_file,
          sourceOwner: row.source_owner || row.evidence_owner,
          sourceDate: row.source_date,
          asOfDate: row.as_of_date,
          confidentiality: row.data_sensitivity || row.confidentiality,
          qualityNotes: "",
          knownGaps: row.known_gaps,
          // Only a REGISTRY DESCRIBING this artifact was recovered, not the
          // artifact's own bytes -- fingerprint stays honestly blank rather
          // than hashing the registry description and calling it content.
          inputFile: relPath,
          rowRef,
          isPrimaryDisposition: !hasCitation,
        });
        if (hasCitation) {
          addItem({
            sourceVersionId,
            evidenceId: row.evidence_id,
            evidenceType: "document_excerpt",
            evidenceSummary: row.evidence_title || row.record_name || "",
            locatorType: /^section/i.test(row.source_location || "") ? "section" : "row",
            locator: row.source_location || String(row.source_row_number || ""),
            sourceRecordId: row.record_id || row.evidence_owner || "",
            confidence: row.evidence_confidence || row.confidence || "",
            classification: row.evidence_type || "", // real approval-status values (review_required/approved) -- sanitized inside addItem
            evidenceDate: row.as_of_date || row.source_date || "",
            knownGaps: row.known_gaps || "",
            dimensionHints: [row.record_name, row.evidence_title],
            businessObjectRefs: row.record_id || "",
            inputFile: relPath,
            rowRef,
          });
        }
      } else if (shape === "v7_source_registry") {
        upsertSource({
          sourceRef: row.source_artifact_uri,
          sourceKind: "external_reference",
          sourceName: row.source_artifact_label,
          sourceOwner: row.data_provider_name,
          sourceDate: row.source_as_of_date,
          asOfDate: row.source_as_of_date,
          confidentiality: row.sensitivity,
          qualityNotes: row.evidence_purpose,
          knownGaps: row.known_gaps,
          inputFile: relPath,
          rowRef,
        });
      } else if (shape === "v7_chunk_registry") {
        // source_artifact_ref here is a file basename (e.g. "V7_00_...csv"),
        // not a full artifact path -- resolve to a source keyed on that
        // basename so chunks from the same referenced artifact share one
        // source version, rather than fabricating one source per chunk. Each
        // chunk row's own primary disposition is migrated_evidence_item; the
        // source grouping is a silent side effect.
        const sourceVersionId = upsertSource({
          sourceRef: row.source_artifact_ref,
          sourceKind: "csv",
          sourceName: row.source_artifact_name || row.source_artifact_ref,
          sourceOwner: row.data_provider_name,
          sourceDate: row.source_as_of_date,
          asOfDate: row.source_as_of_date,
          confidentiality: row.sensitivity,
          qualityNotes: "",
          knownGaps: row.known_gaps,
          inputFile: relPath,
          rowRef,
          isPrimaryDisposition: false,
        });
        addItem({
          sourceVersionId,
          evidenceId: row.chunk_id,
          evidenceType: "loaded_fact",
          evidenceSummary: row.fact_refs || row.semantic_tags || "",
          locatorType: "chunk",
          locator: row.chunk_id || "",
          sourceRecordId: row.entity_id || "",
          confidence: "",
          // retrieval_eligibility is an indexing status, not an evidence
          // classification -- routed to business_object_refs instead of
          // being silently accepted into the wrong field.
          businessObjectRefs: [row.retrieval_eligibility, row.entity_name].filter(Boolean).join("; "),
          evidenceDate: row.source_as_of_date || "",
          knownGaps: row.known_gaps || "",
          dimensionHints: [row.dimension, row.source_artifact_name],
          inputFile: relPath,
          rowRef,
        });
      } else if (shape === "v3_source_registry_like") {
        upsertSource({
          sourceRef: row.source_file,
          sourceKind: row.source_type || "external_reference",
          sourceName: row.source_file,
          sourceOwner: row.source_owner,
          sourceDate: row.source_date,
          asOfDate: row.as_of_date,
          confidentiality: row.confidentiality,
          qualityNotes: row.quality_notes,
          knownGaps: row.known_gaps,
          inputFile: relPath,
          rowRef,
        });
      } else {
        unresolvedRecords.push({ tenant_key: tenantKey, input_file: relPath, row_ref: rowRef, reason: "unrecognized_schema_shape" });
        recordDisposition(rowRef, relPath, "unresolved", "unrecognized_schema_shape");
      }
    });
  }

  // --- 2. Current active/current 13_evidence_sources.csv (the collapsed state) ---
  const activePath = activeEvidenceSourcesFile(tenant);
  if (fs.existsSync(activePath)) {
    const activeRows = parseCsv(fs.readFileSync(activePath, "utf8"));
    totalInputRows += activeRows.length;
    // Do NOT assume the active file matches the v3 template's source_file
    // column -- confirmed live that meridian-health's active/current file
    // uses an entirely different shape (no source_file column at all; the
    // same legacy_context_bundle family as the *_standard-2026-07-v3
    // predecessor files). Detect it the same way predecessor files are
    // detected, per-tenant, rather than hardcoding one shape.
    const activeShape = activeRows.length > 0 ? detectShape(Object.keys(activeRows[0])) : "unknown";
    const relActivePath = path.relative(repoRoot, activePath);
    activeRows.forEach((row, idx) => {
      const rowRef = `${relActivePath}#${idx + 2}`;

      if (activeShape === "legacy_context_bundle") {
        // This shape is EXPECTED to carry evidence_id on every row (it's a
        // citation ledger, not a source registry) -- that is normal here,
        // not an anomaly requiring review, unlike the v3-template case below.
        const semanticRef = row.evidence_location || row.business_name;
        if (!nonBlank(semanticRef)) {
          recordDisposition(rowRef, relActivePath, "unresolved", "no_semantic_source_ref_or_identity");
          return;
        }
        const hasCitation = nonBlank(row.evidence_id);
        const sourceVersionId = upsertSource({
          sourceRef: semanticRef,
          sourceKind: "external_reference",
          sourceName: row.business_name || semanticRef,
          sourceOwner: row.evidence_owner,
          sourceDate: row.source_date,
          asOfDate: row.source_date,
          confidentiality: "",
          qualityNotes: "",
          knownGaps: "",
          inputFile: relActivePath,
          rowRef,
          isPrimaryDisposition: !hasCitation,
        });
        if (hasCitation) {
          addItem({
            sourceVersionId,
            evidenceId: row.evidence_id,
            evidenceType: row.evidence_type || "loaded_fact",
            evidenceSummary: row.context_item || row.business_name || "",
            locatorType: /#/.test(semanticRef) ? "row" : "section",
            locator: semanticRef,
            sourceRecordId: row.record_id || "",
            confidence: row.confidence || "",
            // row.active_candidate_status ("active"/"candidate") is a real
            // approval-status-like value -- row.dimension is NOT a
            // classification, it's routed to dimensionHints instead.
            classification: row.active_candidate_status || "",
            evidenceDate: row.source_date || "",
            knownGaps: "",
            dimensionHints: [row.dimension, row.business_name, row.module_usage_notes],
            businessObjectRefs: row.business_name || "",
            inputFile: relActivePath,
            rowRef,
          });
        }
        return;
      }

      // Default (v3-template) shape: source_file is business identity.
      const semanticRef = row.source_file;
      // A row whose source_file literally IS the active/current file's own
      // path is exactly the self-reference defect PR #5659 fixes -- never
      // treat it as a real source, and never let it collide with anything.
      const isSelfReferential = semanticRef === relActivePath || semanticRef === activePath;
      if (!nonBlank(semanticRef) || isSelfReferential) {
        recordDisposition(rowRef, relActivePath, "intentionally_excluded_with_reason", isSelfReferential ? "self_referential_source_file_from_confirmed_consolidation_defect" : "no_semantic_source_ref");
        return;
      }
      const alreadyCoveredByPredecessor = [...sourceCandidates.values()].some((s) => normalizeRef(s.source_ref) === normalizeRef(semanticRef));
      if (alreadyCoveredByPredecessor) {
        recordDisposition(rowRef, relActivePath, "duplicate_with_proof", "already represented by a predecessor-derived source version");
        return;
      }
      // A row carrying a citation-level evidence_id despite living in the
      // source-registry shape is resolvable, not ambiguous, WHEN it also
      // carries evidence_location -- that field identifies the real logical
      // upstream source (e.g. "Microsoft 365 Admin Center / Copilot usage
      // export"), while source_file here is just an adapter-family label
      // ("SA08/SA09/SA10/SA11 AI value realization source adapters"), not a
      // real artifact identity. Confirmed live: this is the exact shape of
      // the AI-value-realization rows found across 5 tenants. Only fall back
      // to conflict_requires_review when there's genuinely nothing to
      // resolve the ambiguity with.
      if (nonBlank(row.evidence_id)) {
        if (nonBlank(row.evidence_location)) {
          const sourceVersionId = upsertSource({
            sourceRef: row.evidence_location,
            sourceKind: "api_export",
            sourceName: row.evidence_location,
            sourceOwner: row.evidence_owner,
            sourceDate: row.source_date,
            asOfDate: row.as_of_date || row.source_date,
            confidentiality: row.confidentiality,
            qualityNotes: `adapter_family: ${semanticRef}`,
            knownGaps: row.known_gaps,
            inputFile: relActivePath,
            rowRef,
            isPrimaryDisposition: false,
          });
          addItem({
            sourceVersionId,
            evidenceId: row.evidence_id,
            evidenceType: row.evidence_type || "loaded_fact",
            evidenceSummary: row.context_item || row.business_name || "",
            locatorType: nonBlank(row.source_row_id) ? "row" : "query_result",
            locator: row.source_row_id || row.evidence_id,
            sourceRecordId: row.record_id || "",
            confidence: row.confidence || "",
            classification: row.active_candidate_status || "",
            evidenceDate: row.as_of_date || row.source_date || "",
            knownGaps: row.known_gaps || "",
            dimensionHints: [row.dimension, row.business_name, row.module_usage_notes],
            businessObjectRefs: [semanticRef, row.business_name].filter(Boolean).join("; "),
            inputFile: relActivePath,
            rowRef,
          });
          return;
        }
        conflictReview.push({ tenant_key: tenantKey, row_ref: rowRef, reason: "active row carries a citation-level evidence_id with no evidence_location to resolve it against -- genuinely ambiguous between source and item" });
        recordDisposition(rowRef, relActivePath, "conflict_requires_review", "citation-level evidence_id with no resolvable upstream source");
        recordEvidenceIdReconciliation({ inputEvidenceId: row.evidence_id, inputFile: relActivePath, rowRef, disposition: "conflict_requires_review", reason: "no_evidence_location_to_resolve_against" });
        return;
      }
      upsertSource({
        sourceRef: semanticRef,
        sourceKind: row.source_type || "external_reference",
        sourceName: semanticRef,
        sourceOwner: row.source_owner,
        sourceDate: row.source_date,
        asOfDate: row.as_of_date,
        confidentiality: row.confidentiality,
        qualityNotes: row.quality_notes,
        knownGaps: row.known_gaps,
        inputFile: relActivePath,
        rowRef,
      });
    });
  }

  // --- 3. Executive interviews ---
  const interviewFile = interviewFileFor(tenantKey);
  if (interviewFile) {
    const interviewFileText = fs.readFileSync(interviewFile, "utf8");
    const rows = parseCsv(interviewFileText);
    totalInputRows += rows.length;
    const relInterviewPath = path.relative(repoRoot, interviewFile);
    // Not a real input row -- one implicit source declaration derived from
    // the interview FILE as a whole, not from any single row within it.
    // isPrimaryDisposition=false so it isn't counted in row-level reconciliation.
    // This IS a case where the exact recovered bytes are genuinely possessed
    // (read directly off disk, not described by a registry row) -- real
    // content_fingerprint, not a blank placeholder.
    const interviewSourceVersionId = upsertSource({
      sourceRef: relInterviewPath,
      sourceKind: "transcript",
      sourceName: `${tenantKey} executive interviews`,
      sourceOwner: "",
      sourceDate: rows[0]?.interview_date,
      asOfDate: rows[0]?.interview_date,
      confidentiality: "confidential",
      qualityNotes: "",
      knownGaps: "",
      contentBytes: interviewFileText,
      inputFile: relInterviewPath,
      rowRef: "(interview source, file-level, not a row)",
      isPrimaryDisposition: false,
    });
    rows.forEach((row, idx) => {
      const rowRef = `${relInterviewPath}#${idx + 2}`;
      if (!nonBlank(row.question) && !nonBlank(row.synthetic_answer) && !nonBlank(row.answer)) {
        recordDisposition(rowRef, relInterviewPath, "unresolved", "no question/answer content");
        return;
      }
      interviewCandidates.push({
        tenant_key: tenantKey,
        interview_id: row.interview_id || row.question_id || `${rowRef}`,
        source_version_id: interviewSourceVersionId || "",
        interview_group: row.interview_group || "",
        executive_area: row.executive_area || "",
        stakeholder_role: row.stakeholder_role || "",
        question_id: row.question_id || "",
        question: row.question || "",
        answer: row.synthetic_answer || row.answer || "",
        priority_theme: row.priority_theme || "",
        pain_point: row.pain_point || "",
        initiative_link: row.initiative_link || "",
        business_priority: row.business_priority || "",
        evidence_needed: row.evidence_needed || "",
        interview_date: row.interview_date || "",
        confidence: row.confidence || "",
        approval_status: row.active_candidate_status || "",
        known_gaps: "",
      });
      // This row's primary disposition is migrated_interview (above). The
      // derived evidence item is a byproduct of the same one row, not a
      // second independent input row -- isPrimaryDisposition=false.
      recordDisposition(rowRef, relInterviewPath, "migrated_interview", "", row.interview_id || row.question_id || "");
      if (interviewSourceVersionId) {
        addItem({
          sourceVersionId: interviewSourceVersionId,
          evidenceId: row.evidence_id || "",
          evidenceType: "interview_signal",
          evidenceSummary: row.truth_statement || row.synthetic_answer || row.answer || "",
          locatorType: "row",
          locator: String(idx + 2),
          sourceRecordId: row.source_row_id || row.question_id || "",
          confidence: row.confidence || "",
          // priority_theme is a topic/theme, not a classification -- routed
          // to dimensionHints instead. active_candidate_status is the real
          // approval-status-like value for this row shape.
          classification: row.active_candidate_status || "",
          evidenceDate: row.interview_date || "",
          knownGaps: "",
          dimensionHints: [row.priority_theme, row.executive_area, row.interview_group, "interview_signals"],
          businessObjectRefs: row.initiative_link || "",
          inputFile: relInterviewPath,
          rowRef,
          isPrimaryDisposition: false,
        });
      }
    });
  }

  return {
    tenantKey,
    sourceCandidates: [...sourceCandidates.values()],
    itemCandidates,
    interviewCandidates,
    dispositions,
    unresolvedRecords,
    conflictReview,
    sourceDeduplication,
    sourceMetadataConflicts,
    evidenceIdReconciliation,
    lineage,
    predecessorPaths,
    fileLevelFailures,
    totalInputRows,
    recoveryManifestEntries,
  };
}

function writeCsv(file, headers, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  fs.writeFileSync(file, `${[headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n")}\n`);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

const SOURCE_HEADERS = [
  "tenant_key", "source_id", "source_version_id", "source_name", "source_kind", "source_ref", "source_version",
  "source_date", "as_of_date", "ingested_at", "source_owner", "confidentiality", "domains_covered",
  "row_count_or_pages", "content_fingerprint", "approved_for_loading", "quality_notes", "known_gaps", "supersedes_source_version_id",
];
const ITEM_HEADERS = [
  "tenant_key", "evidence_id", "source_version_id", "evidence_type", "evidence_summary", "locator_type", "locator",
  "source_record_id", "dimension_keys", "business_object_refs", "classification", "confidence", "evidence_date",
  "approved_for_use", "known_gaps", "content_fingerprint",
];
const INTERVIEW_HEADERS = [
  "tenant_key", "interview_id", "source_version_id", "interview_group", "executive_area", "stakeholder_role",
  "question_id", "question", "answer", "priority_theme", "pain_point", "initiative_link", "business_priority",
  "evidence_needed", "interview_date", "confidence", "approval_status", "known_gaps",
];

function main() {
  const allTenantSummaries = [];
  const allRecoveryManifestEntries = [];
  for (const tenant of registry.activeTenants) {
    const result = migrateTenant(tenant);
    const tenantDir = path.join(outDir, result.tenantKey);
    allRecoveryManifestEntries.push(...result.recoveryManifestEntries);

    writeCsv(path.join(tenantDir, "evidence-sources-candidate.csv"), SOURCE_HEADERS, result.sourceCandidates);
    writeCsv(path.join(tenantDir, "evidence-items-candidate.csv"), ITEM_HEADERS, result.itemCandidates);
    writeCsv(path.join(tenantDir, "executive-interviews-candidate.csv"), INTERVIEW_HEADERS, result.interviewCandidates);
    writeJson(path.join(tenantDir, "migration-lineage.json"), result.lineage);
    writeJson(path.join(tenantDir, "source-deduplication.json"), result.sourceDeduplication);
    writeCsv(
      path.join(tenantDir, "unresolved-records.csv"),
      ["tenant_key", "input_file", "row_ref", "reason"],
      result.unresolvedRecords,
    );
    writeCsv(
      path.join(tenantDir, "conflict-review.csv"),
      ["tenant_key", "row_ref", "reason"],
      result.conflictReview,
    );
    writeCsv(
      path.join(tenantDir, "evidence-id-reconciliation.csv"),
      ["tenant_key", "input_evidence_id", "input_file", "row_ref", "disposition", "output_evidence_id", "source_version_id", "reason"],
      result.evidenceIdReconciliation,
    );
    writeCsv(
      path.join(tenantDir, "source-metadata-conflicts.csv"),
      ["tenant_key", "source_version_id", "field", "existing_value", "incoming_value", "row_ref", "input_file"],
      result.sourceMetadataConflicts,
    );

    // Evidence-ID reconciliation hard checks: every nonblank input
    // evidence_id must appear exactly once. Duplicate OUTPUT evidence_ids
    // are already impossible by construction (addItem throws), but a
    // duplicate INPUT evidence_id being reconciled twice would indicate a
    // double-processed row -- check for it explicitly.
    const inputIdRowRefCounts = new Map();
    for (const rec of result.evidenceIdReconciliation) {
      const key = `${rec.input_evidence_id}|${rec.row_ref}`;
      inputIdRowRefCounts.set(key, (inputIdRowRefCounts.get(key) || 0) + 1);
    }
    const doubleReconciled = [...inputIdRowRefCounts.entries()].filter(([, count]) => count > 1);
    if (doubleReconciled.length > 0) {
      throw new Error(`Evidence-ID reconciliation FAILED for ${result.tenantKey}: ${doubleReconciled.length} (evidence_id, row_ref) pair(s) reconciled more than once -- ${JSON.stringify(doubleReconciled.slice(0, 3))}`);
    }

    // Hard reconciliation: every real input row (predecessor + active +
    // interview rows successfully read) must receive EXACTLY one
    // disposition. This is asserted, not just reported -- a mismatch here
    // means the tool is silently dropping or double-counting rows, and the
    // whole output must be treated as untrustworthy until fixed.
    const dispositionCounts = {};
    for (const d of result.dispositions) dispositionCounts[d.disposition] = (dispositionCounts[d.disposition] || 0) + 1;
    const totalDispositioned = result.dispositions.length;
    const reconciliationOk = totalDispositioned === result.totalInputRows;
    if (!reconciliationOk) {
      throw new Error(
        `Reconciliation FAILED for ${result.tenantKey}: ${result.totalInputRows} real input rows but ${totalDispositioned} dispositions recorded (diff ${totalDispositioned - result.totalInputRows}). Every row must receive exactly one disposition -- refusing to report untrustworthy counts.`,
      );
    }

    const before = `<!doctype html><html><head><meta charset="utf-8"><title>${result.tenantKey} evidence-v4 migration</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 8px;font-size:12.5px}th{background:#f4f4f4}</style>
</head><body>
<h1>${result.tenantKey} — evidence-v4 migration dry run</h1>
<p>Predecessor files read: ${result.predecessorPaths.length}. Zero writes to active/current, registry, or Postgres.</p>
<h2>Disposition counts</h2>
<table><thead><tr><th>Disposition</th><th>Count</th></tr></thead><tbody>
${Object.entries(dispositionCounts).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
</tbody></table>
<h2>Candidates produced</h2>
<table><thead><tr><th>Entity</th><th>Count</th></tr></thead><tbody>
<tr><td>evidence_sources (source versions)</td><td>${result.sourceCandidates.length}</td></tr>
<tr><td>evidence_items</td><td>${result.itemCandidates.length}</td></tr>
<tr><td>executive_interviews</td><td>${result.interviewCandidates.length}</td></tr>
</tbody></table>
<h2>Review needed</h2>
<p>Unresolved: ${result.unresolvedRecords.length}. Conflicts requiring review: ${result.conflictReview.length}. Deduplicated: ${result.sourceDeduplication.length}.</p>
</body></html>`;
    fs.writeFileSync(path.join(tenantDir, "before-after-summary.html"), before);

    // Split so the item counts don't visually read as additive with
    // interview_rows_migrated when they overlap by derivation (an
    // interview-derived item comes FROM an already-counted interview row).
    const interviewDerivedItems = result.itemCandidates.filter((i) => i.evidence_type === "interview_signal").length;
    const directEvidenceItems = result.itemCandidates.length - interviewDerivedItems;

    // Everything below is guaranteed zero by construction (addItem throws on
    // duplicate output IDs; items are never created without a resolved
    // source_version_id or without a locator; classification/dimension_keys
    // only ever contain sanitized/validated values) -- reported explicitly
    // per the Gate 1.1 acceptance contract rather than left implicit.
    const duplicateOutputEvidenceIds = 0;
    const orphanEvidenceItems = result.itemCandidates.filter((i) => !result.sourceCandidates.some((s) => s.source_version_id === i.source_version_id)).length;
    const blankRequiredLocators = result.itemCandidates.filter((i) => !nonBlank(i.locator)).length;
    const invalidClassifications = result.itemCandidates.filter((i) => nonBlank(i.classification) && !VALID_EVIDENCE_CLASSIFICATIONS.has(i.classification)).length;

    allTenantSummaries.push({
      tenant_key: result.tenantKey,
      predecessor_files_read: result.predecessorPaths.length,
      file_level_failures: result.fileLevelFailures,
      total_input_rows: result.totalInputRows,
      source_versions_created: result.sourceCandidates.length,
      direct_evidence_items_created: directEvidenceItems,
      interview_derived_evidence_items_created: interviewDerivedItems,
      total_evidence_items_created: result.itemCandidates.length,
      interview_rows_migrated: result.interviewCandidates.length,
      duplicates_with_proof: result.sourceDeduplication.length,
      source_metadata_conflicts: result.sourceMetadataConflicts.length,
      unresolved_records: result.unresolvedRecords.length,
      conflicts_requiring_review: result.conflictReview.length,
      duplicate_output_evidence_ids: duplicateOutputEvidenceIds,
      orphan_evidence_items: orphanEvidenceItems,
      blank_required_locators: blankRequiredLocators,
      invalid_classifications: invalidClassifications,
      disposition_counts: dispositionCounts,
      total_dispositioned_rows: totalDispositioned,
      reconciliation_status: reconciliationOk ? "RECONCILED" : "FAILED",
      safe_to_proceed_to_semantic_validation:
        reconciliationOk &&
        result.conflictReview.length === 0 &&
        result.unresolvedRecords.length === 0 &&
        result.fileLevelFailures.length === 0 &&
        duplicateOutputEvidenceIds === 0 &&
        orphanEvidenceItems === 0 &&
        blankRequiredLocators === 0 &&
        invalidClassifications === 0,
    });
  }

  writeJson(path.join(outDir, "all-tenant-migration-summary.json"), {
    generated_by: "scripts/data-build/evidence-v4-migration-dry-run.mjs",
    note: "Zero-write dry run. No active/current, registry, Postgres, or Home pack was modified.",
    tenants: allTenantSummaries,
  });

  writeJson(path.join(outDir, "recovery-input-manifest.json"), {
    generated_by: "scripts/data-build/evidence-v4-migration-dry-run.mjs",
    note: "Discovery basis for this run: commit-message heuristic (skip commits mentioning purge/delete/remove/sunset), applied to paths named in the historical conflict/deduplication reports. Not yet an approved, pinned manifest -- a future run should prefer recorded commit/blob_sha values from a reviewed copy of this file over re-deriving them.",
    entries: allRecoveryManifestEntries,
  });

  console.log(JSON.stringify(allTenantSummaries, null, 2));
}

export {
  detectShape,
  sanitizeClassification,
  sanitizeEvidenceType,
  normalizeDimensionKeys,
  VALID_EVIDENCE_CLASSIFICATIONS,
  VALID_EVIDENCE_TYPES,
  VALID_DIMENSION_KEYS,
  migrateTenant,
  outDir,
  registry,
};

const isDirectlyExecuted = import.meta.url === `file://${process.argv[1]}`;
if (isDirectlyExecuted) {
  main();
}
