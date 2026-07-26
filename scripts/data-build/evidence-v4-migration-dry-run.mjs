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
  const lineage = [];
  const fileLevelFailures = [];
  let totalInputRows = 0;

  function recordDisposition(row_ref, input_file, disposition, reason, target_id) {
    dispositions.push({ row_ref, input_file, disposition, reason: reason ?? "", target_id: target_id ?? "" });
  }

  // isPrimaryDisposition=false: this row's PRIMARY disposition is already
  // (or will be) recorded elsewhere -- e.g. a citation-shaped row whose real
  // disposition is migrated_evidence_item, where creating/reusing a source is
  // a side effect of grouping, not an independent input row. Every real
  // input row gets exactly one disposition; this flag is how the same
  // row-processing code can be reused for both "this row IS a source
  // declaration" and "this row references a source as a side effect"
  // without double-counting the second case.
  function upsertSource({ sourceRef, sourceKind, sourceName, sourceOwner, sourceDate, asOfDate, confidentiality, qualityNotes, knownGaps, sourceFingerprintSeed, inputFile, rowRef, isPrimaryDisposition = true }) {
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
      content_fingerprint: sha256(sourceFingerprintSeed || sourceRef),
      approved_for_loading: "",
      quality_notes: qualityNotes || "",
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
  function addItem({ sourceVersionId, evidenceId, evidenceType, evidenceSummary, locatorType, locator, sourceRecordId, confidence, classification, evidenceDate, knownGaps, inputFile, rowRef, isPrimaryDisposition = true }) {
    if (!sourceVersionId) {
      if (isPrimaryDisposition) {
        unresolvedRecords.push({ tenant_key: tenantKey, input_file: inputFile, row_ref: rowRef, reason: "evidence_item_has_no_resolvable_source_version" });
        recordDisposition(rowRef, inputFile, "unresolved", "evidence_item_has_no_resolvable_source_version");
      }
      return;
    }
    if (!nonBlank(locator) && !nonBlank(evidenceSummary)) {
      if (isPrimaryDisposition) {
        unresolvedRecords.push({ tenant_key: tenantKey, input_file: inputFile, row_ref: rowRef, reason: "missing_locator_for_citeable_evidence" });
        recordDisposition(rowRef, inputFile, "unresolved", "missing_locator_for_citeable_evidence");
      }
      return;
    }
    const finalEvidenceId = nonBlank(evidenceId) ? evidenceId : `EVID-${tenantKey.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${sha256(`${sourceVersionId}|${locator}|${evidenceSummary}`).slice(0, 10).toUpperCase()}`;
    itemCandidates.push({
      tenant_key: tenantKey,
      evidence_id: finalEvidenceId,
      source_version_id: sourceVersionId,
      evidence_type: evidenceType || "loaded_fact",
      evidence_summary: evidenceSummary || "",
      locator_type: locatorType || "section",
      locator: locator || "",
      source_record_id: sourceRecordId || "",
      dimension_keys: "",
      business_object_refs: "",
      classification: classification || "",
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
  for (const relPath of predecessorPaths) {
    const commit = lastExistingCommitFor(relPath);
    if (!commit) {
      fileLevelFailures.push({ tenant_key: tenantKey, input_file: relPath, reason: "no_commit_found_in_git_history" });
      continue;
    }
    const text = readFromGit(commit, relPath);
    if (!text) {
      fileLevelFailures.push({ tenant_key: tenantKey, input_file: relPath, reason: `git_show_failed_at_${commit}` });
      continue;
    }
    const rows = parseCsv(text);
    if (rows.length === 0) continue;
    totalInputRows += rows.length;
    const shape = detectShape(Object.keys(rows[0]));
    lineage.push({ tenant_key: tenantKey, input_file: relPath, recovered_via_commit: commit, row_count: rows.length, detected_shape: shape });

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
          sourceFingerprintSeed: row.source_file,
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
            classification: row.evidence_type || "",
            evidenceDate: row.as_of_date || row.source_date || "",
            knownGaps: row.known_gaps || "",
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
          sourceFingerprintSeed: row.source_artifact_uri,
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
          sourceFingerprintSeed: row.source_artifact_ref,
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
          classification: row.retrieval_eligibility || "",
          evidenceDate: row.source_as_of_date || "",
          knownGaps: row.known_gaps || "",
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
          sourceFingerprintSeed: row.source_file,
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
          sourceFingerprintSeed: semanticRef,
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
            classification: row.dimension || "",
            evidenceDate: row.source_date || "",
            knownGaps: "",
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
      // A row that's ambiguous between "plain source" and "citation" (carries
      // a citation-level evidence_id despite living in the source-registry
      // shape) gets conflict_requires_review as its EXCLUSIVE disposition --
      // never also migrated_source, since the two are mutually exclusive states.
      if (nonBlank(row.evidence_id)) {
        conflictReview.push({ tenant_key: tenantKey, row_ref: rowRef, reason: "active row carries a citation-level evidence_id -- ambiguous between source and item, review before classifying" });
        recordDisposition(rowRef, relActivePath, "conflict_requires_review", "carries a citation-level evidence_id despite living in the source-registry shape");
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
        sourceFingerprintSeed: semanticRef,
        inputFile: relActivePath,
        rowRef,
      });
    });
  }

  // --- 3. Executive interviews ---
  const interviewFile = interviewFileFor(tenantKey);
  if (interviewFile) {
    const rows = parseCsv(fs.readFileSync(interviewFile, "utf8"));
    totalInputRows += rows.length;
    const relInterviewPath = path.relative(repoRoot, interviewFile);
    // Not a real input row -- one implicit source declaration derived from
    // the interview FILE as a whole, not from any single row within it.
    // isPrimaryDisposition=false so it isn't counted in row-level reconciliation.
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
      sourceFingerprintSeed: relInterviewPath,
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
          classification: row.priority_theme || "",
          evidenceDate: row.interview_date || "",
          knownGaps: "",
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
    lineage,
    predecessorPaths,
    fileLevelFailures,
    totalInputRows,
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
  for (const tenant of registry.activeTenants) {
    const result = migrateTenant(tenant);
    const tenantDir = path.join(outDir, result.tenantKey);

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

    allTenantSummaries.push({
      tenant_key: result.tenantKey,
      predecessor_files_read: result.predecessorPaths.length,
      file_level_failures: result.fileLevelFailures,
      total_input_rows: result.totalInputRows,
      source_versions_created: result.sourceCandidates.length,
      evidence_items_created: result.itemCandidates.length,
      interview_rows_migrated: result.interviewCandidates.length,
      duplicates_with_proof: result.sourceDeduplication.length,
      unresolved_records: result.unresolvedRecords.length,
      conflicts_requiring_review: result.conflictReview.length,
      disposition_counts: dispositionCounts,
      total_dispositioned_rows: totalDispositioned,
      reconciliation_status: reconciliationOk ? "RECONCILED" : "FAILED",
      safe_to_proceed_to_semantic_validation:
        reconciliationOk && result.conflictReview.length === 0 && result.unresolvedRecords.length === 0 && result.fileLevelFailures.length === 0,
    });
  }

  writeJson(path.join(outDir, "all-tenant-migration-summary.json"), {
    generated_by: "scripts/data-build/evidence-v4-migration-dry-run.mjs",
    note: "Zero-write dry run. No active/current, registry, Postgres, or Home pack was modified.",
    tenants: allTenantSummaries,
  });

  console.log(JSON.stringify(allTenantSummaries, null, 2));
}

main();
