#!/usr/bin/env node
// Track A, Stage 1 (all-tenant canonical-data provenance audit) for the V4
// "quiet dimension" investigation. Read-only: never mutates active/current.
//
// For every registry-active tenant and every canonical domain file (00-18,
// SA0x), this measures whether the currently-active canonical data is
// actually populated, using the row-level provenance columns the
// consolidation process itself already writes (original_packet,
// consolidation_rule_used, conflict_status) rather than guessing. Where a
// tenant has a retired legacy-schema directory (<tenant>/standard-2026-07-v3)
// sitting alongside active/current, it's read ONLY as a read-only comparison
// source for this audit -- never as a runtime fallback -- per the standing
// rule that retired directories may inform a governed backfill but must not
// become an alternate loader root.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Papa from "papaparse";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tenant-inputs");
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const templateManifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json"), "utf8"),
);
// The 19 formally declared canonical domains. Anything observed outside this
// set (e.g. today's SA02/SA04/SA08-11 files) is an auxiliary artifact -- it
// may carry real evidence, but it is not part of the canonical denominator
// until it is formally added to the source standard (see
// canonical_migration_omission's sibling finding: interviews need the same
// treatment, not a side-channel wire-in).
const MANIFEST_DOMAIN_KEYS = new Set(templateManifest.templates.map((t) => domainKeyFromFilename(t.file)));

// Columns every consolidated active/current file carries that describe the
// row's own identity/provenance rather than its business payload. Any column
// not in this set is a "payload" column for yield-measurement purposes.
const ENVELOPE_COLUMNS = new Set([
  "tenant_key", "source_file", "source_date", "confidence", "known_gaps",
  "original_source_file", "original_packet", "original_row_number", "original_row_id",
  "source_classification", "source_fingerprint", "consolidation_rule_used", "conflict_status",
]);

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return { rows: parsed.data, hash: sha256(text), byteLength: Buffer.byteLength(text) };
}

function domainKeyFromFilename(filename) {
  const match = filename.match(/^(\d{2}|SA\d{2})_/);
  return match ? match[1] : filename.replace(/\.csv$/, "");
}

function payloadColumns(rows) {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).filter((k) => !ENVELOPE_COLUMNS.has(k));
}

function nonBlank(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function fieldYield(rows, columns) {
  const counts = {};
  for (const col of columns) counts[col] = 0;
  for (const row of rows) {
    for (const col of columns) {
      if (nonBlank(row[col])) counts[col] += 1;
    }
  }
  return counts;
}

// A row counts as "identity-bearing" if its first payload column (by
// convention, every domain's schema puts its primary name/label field first
// after tenant_key) is non-blank; "substantive" if 2+ payload columns are
// non-blank; "placeholder-only" if it has an identity but nothing else at all
// (a bare name/role_level with zero further payload) -- distinct from a row
// that's entirely blank, which is the row simply not existing in any
// meaningful sense. This is a deliberately conservative, generic heuristic
// that works across all domains without a hand-maintained per-domain field
// list.
function rowRichness(rows, columns) {
  const identityCol = columns[0];
  let identityBearing = 0;
  let substantive = 0;
  let placeholderOnly = 0;
  const distinctIdentities = new Set();
  for (const row of rows) {
    const filledCount = columns.filter((c) => nonBlank(row[c])).length;
    const hasIdentity = identityCol && nonBlank(row[identityCol]);
    if (hasIdentity) {
      identityBearing += 1;
      distinctIdentities.add(String(row[identityCol]).trim().toLowerCase());
    }
    if (filledCount >= 2) substantive += 1;
    if (hasIdentity && filledCount <= 1) placeholderOnly += 1;
  }
  return { identityBearing, substantive, placeholderOnly, distinctIdentityCount: distinctIdentities.size };
}

// Direct transformation-bug signature: a row whose conflict_status says a
// conflict was actively resolved, but whose own identity/payload is blank --
// i.e. the resolution process picked the empty candidate. This is checked
// independent of any predecessor file, since it's visible from the active
// file's own provenance columns alone.
function registeredFieldLossRows(rows, columns) {
  const identityCol = columns[0];
  return rows.filter((row) => {
    if ((row.conflict_status || "") !== "conflict_resolved") return false;
    const hasIdentity = identityCol && nonBlank(row[identityCol]);
    return !hasIdentity;
  });
}

const LEGACY_TRUST_UNCERTAIN_MARKERS = [
  /do not treat as active until promotion proof passes/i,
  /upgrade candidate/i,
  /not yet promoted/i,
];

function legacyTrustIsUncertain(rows) {
  return rows.some((row) => {
    const text = [row.known_gaps, row.active_candidate_status, row.source_type].filter(Boolean).join(" | ");
    return LEGACY_TRUST_UNCERTAIN_MARKERS.some((re) => re.test(text));
  });
}

function legacyDirFor(tenantKey) {
  const candidates = [
    path.join(repoRoot, "datasets/tenant-inputs", tenantKey, "standard-2026-07-v3"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function findLegacyFile(legacyDir, domainKey) {
  if (!legacyDir) return null;
  const files = fs.readdirSync(legacyDir).filter((f) => f.endsWith(".csv"));
  const match = files.find((f) => domainKeyFromFilename(f) === domainKey);
  return match ? path.join(legacyDir, match) : null;
}

// Two independent axes, deliberately kept apart -- content quality is a
// property of the active file alone; provenance is a property of how it got
// that way. Conflating them (the original 7-category taxonomy) made
// "genuine_source_gap" ambiguous: it could mean "no predecessor exists" OR
// "the active file happens to be thin," which are different findings with
// different remediations.
//
// content_quality_status:
//   canonical_sufficient  -- identity>=80%, substantive>=60%, placeholder-only<=5%, lineage/status-only<=10%.
//   canonical_partial     -- some real content, but short of the sufficiency bar.
//   placeholder_dominant  -- most rows are placeholder-only (bare identity, nothing else).
//   canonical_empty       -- zero rows, or zero identity-bearing rows.
//   schema_invalid        -- parse failure or no payload columns at all.
function classifyContentQuality({ activeRowCount, identityBearingRate, activeSubstantiveRate, placeholderOnlyRate, parseError }) {
  if (parseError) return "schema_invalid";
  if (activeRowCount === 0 || identityBearingRate === 0) return "canonical_empty";
  if (identityBearingRate >= 0.8 && activeSubstantiveRate >= 0.6 && placeholderOnlyRate <= 0.1) return "canonical_sufficient";
  if (placeholderOnlyRate > 0.5) return "placeholder_dominant";
  return "canonical_partial";
}

// provenance_status:
//   provenance_complete        -- no richer predecessor exists to reconcile against, or one exists but
//                                 isn't meaningfully richer than what's active -- nothing left to chase.
//   canonical_only_no_predecessor -- no predecessor directory/file exists at all for this domain.
//   registered_source_field_loss  -- a conflict was recorded as "resolved" for a row, but the row's own
//                                 identity/payload came out blank -- the resolution itself picked
//                                 emptiness. A transformation bug, not a migration-scope question.
//   migration_omission         -- a materially richer predecessor exists, but this domain's active rows
//                                 show zero evidence any other source was ever registered/considered
//                                 (single original_packet, no conflict_resolved rows at all).
//   conflict_resolution_review -- a richer predecessor exists AND this domain's active rows DO show
//                                 conflict-resolution activity -- multiple sources were considered, but
//                                 the retained value may not be the best one.
//   predecessor_requires_review -- a predecessor is richer, but its OWN trust/freshness/compatibility is
//                                 not established (self-labels as an unpromoted upgrade candidate).
//   provenance_unresolved      -- lineage cannot be established at all (parse failure, no provenance columns).
function classifyProvenance({
  hasRegisteredFieldLossSignature,
  parseError,
  legacyAvailable,
  legacySubstantiveRate,
  activeSubstantiveRate,
  legacyTrustUncertain,
  distinctOriginalPackets,
  sawConflictResolved,
}) {
  if (parseError) return "provenance_unresolved";
  if (hasRegisteredFieldLossSignature) return "registered_source_field_loss";
  if (!legacyAvailable) return "canonical_only_no_predecessor";
  if (legacySubstantiveRate <= activeSubstantiveRate + 0.05) return "provenance_complete";
  if (legacyTrustUncertain) return "predecessor_requires_review";
  if (distinctOriginalPackets <= 1 && !sawConflictResolved) return "migration_omission";
  return "conflict_resolution_review";
}

// Deriving remediation from the (content, provenance) pair rather than a
// single flat label -- e.g. "genuine evidence gap" should mean no useful
// evidence exists anywhere, not merely "no richer predecessor was found" for
// an already-adequate file.
function deriveRemediation(contentStatus, provenanceStatus) {
  if (contentStatus === "schema_invalid") return "fix_parse_or_schema";
  if (contentStatus === "canonical_sufficient" && provenanceStatus === "registered_source_field_loss") {
    return "usable_but_migration_defect_requires_repair";
  }
  if (contentStatus === "canonical_sufficient") return "ready";
  if (provenanceStatus === "registered_source_field_loss") return "fix_transformation_defect";
  if (provenanceStatus === "migration_omission") return "governed_backfill_required";
  if (provenanceStatus === "conflict_resolution_review") return "row_level_conflict_review";
  if (provenanceStatus === "predecessor_requires_review") return "human_trust_review_of_predecessor";
  if (contentStatus === "canonical_empty" && provenanceStatus === "canonical_only_no_predecessor") return "genuine_evidence_gap";
  if (contentStatus === "canonical_partial" && (provenanceStatus === "canonical_only_no_predecessor" || provenanceStatus === "provenance_complete")) {
    // Thin, but nothing left to reconcile from migration/predecessor history --
    // the data genuinely is what it is. The path forward is enriching the
    // canonical source itself, not chasing a predecessor that doesn't help.
    return "enrich_via_governed_synthetic_generation";
  }
  if (contentStatus === "placeholder_dominant") return "row_level_conflict_review";
  return "human_review_required";
}

function auditTenantDomain(tenantKey, activeDir, filename) {
  const activePath = path.join(activeDir, filename);
  const domainKey = domainKeyFromFilename(filename);
  const { rows: activeRows, hash: activeHash } = readCsv(activePath);
  const columns = payloadColumns(activeRows);
  const activeFieldYield = fieldYield(activeRows, columns);
  const { identityBearing, substantive, placeholderOnly, distinctIdentityCount } = rowRichness(activeRows, columns);
  const activeRowCount = activeRows.length;
  const activeSubstantiveRate = activeRowCount > 0 ? substantive / activeRowCount : 0;
  const identityBearingRate = activeRowCount > 0 ? identityBearing / activeRowCount : 0;
  const placeholderOnlyRate = activeRowCount > 0 ? placeholderOnly / activeRowCount : 0;
  const registeredLossRows = registeredFieldLossRows(activeRows, columns);

  const originalPackets = new Set(activeRows.map((r) => r.original_packet).filter(Boolean));
  const conflictStatuses = {};
  for (const r of activeRows) {
    const key = r.conflict_status || "(none)";
    conflictStatuses[key] = (conflictStatuses[key] || 0) + 1;
  }
  const consolidationRules = {};
  for (const r of activeRows) {
    const key = r.consolidation_rule_used || "(none)";
    consolidationRules[key] = (consolidationRules[key] || 0) + 1;
  }
  const sawConflictResolved = Boolean(conflictStatuses.conflict_resolved);

  const legacyDir = legacyDirFor(tenantKey);
  const legacyPath = findLegacyFile(legacyDir, domainKey);
  let legacy = null;
  if (legacyPath) {
    const { rows: legacyRows, hash: legacyHash } = readCsv(legacyPath);
    const legacyColumns = payloadColumns(legacyRows).filter((c) => !["record_id", "entity_id", "evidence_id", "active_candidate_status", "source_type", "source_basis", "synthetic_data_flag", "evidence_boundary", "module_usage_notes"].includes(c));
    const { substantive: legacySubstantive } = rowRichness(legacyRows, legacyColumns.length ? legacyColumns : payloadColumns(legacyRows));
    const legacyRowCount = legacyRows.length;
    legacy = {
      path: path.relative(repoRoot, legacyPath),
      row_count: legacyRowCount,
      substantive_rows: legacySubstantive,
      substantive_rate: legacyRowCount > 0 ? legacySubstantive / legacyRowCount : 0,
      hash: legacyHash,
      trust_uncertain: legacyTrustIsUncertain(legacyRows),
      classification: "retired-legacy-schema-read-only-comparison-source",
    };
  }

  const isAuxiliary = !MANIFEST_DOMAIN_KEYS.has(domainKey);
  const contentQualityStatus = classifyContentQuality({ activeRowCount, identityBearingRate, activeSubstantiveRate, placeholderOnlyRate, parseError: false });
  const provenanceStatus = classifyProvenance({
    hasRegisteredFieldLossSignature: registeredLossRows.length > 0,
    parseError: false,
    legacyAvailable: Boolean(legacy),
    legacySubstantiveRate: legacy?.substantive_rate ?? 0,
    activeSubstantiveRate,
    legacyTrustUncertain: legacy?.trust_uncertain ?? false,
    distinctOriginalPackets: originalPackets.size,
    sawConflictResolved,
  });
  const remediation = isAuxiliary ? "not_canonical_pending_formal_domain_addition" : deriveRemediation(contentQualityStatus, provenanceStatus);

  const backfillEligible = ["governed_backfill_required", "row_level_conflict_review", "human_trust_review_of_predecessor"].includes(remediation);

  return {
    tenant_key: tenantKey,
    domain_key: domainKey,
    is_auxiliary: isAuxiliary,
    active_canonical_path: path.relative(repoRoot, activePath),
    active_file_hash: activeHash,
    active_row_count: activeRowCount,
    payload_columns: columns,
    active_identity_bearing_rows: identityBearing,
    active_identity_bearing_rate: Number(identityBearingRate.toFixed(4)),
    active_distinct_identity_count: distinctIdentityCount,
    active_substantive_rows: substantive,
    active_substantive_rate: Number(activeSubstantiveRate.toFixed(4)),
    active_placeholder_only_rows: placeholderOnly,
    active_placeholder_only_rate: Number(placeholderOnlyRate.toFixed(4)),
    registered_source_field_loss_row_count: registeredLossRows.length,
    active_field_nonempty_counts: activeFieldYield,
    distinct_original_packets: [...originalPackets],
    conflict_status_counts: conflictStatuses,
    consolidation_rule_counts: consolidationRules,
    predecessor: legacy,
    content_quality_status: isAuxiliary ? "ungoverned_auxiliary_artifact" : contentQualityStatus,
    provenance_status: isAuxiliary ? null : provenanceStatus,
    remediation,
    backfill_eligible: backfillEligible,
    required_human_decision: backfillEligible
      ? `Review whether ${legacy.path} rows for domain ${domainKey} should be transformed into the current universal schema and promoted as a versioned canonical candidate for ${tenantKey}. content=${contentQualityStatus}, provenance=${provenanceStatus}.`
      : provenanceStatus === "registered_source_field_loss"
        ? `Investigate the transformation rule for domain ${domainKey}/${tenantKey}: ${registeredLossRows.length} row(s) show conflict_status=conflict_resolved with no surviving identity -- the resolution picked an empty candidate.`
        : null,
  };
}

// Before trusting any classification totals, prove the audit actually
// covered the universe it thinks it covered -- a stale tenant alias, a
// retired tenant slipping back in, or an undocumented domain set mixed into
// the count would silently invalidate every downstream number. Fails hard
// (non-zero exit) rather than annotating a warning, since a wrong universe
// makes every classification below it unreliable, not just cosmetically
// incomplete.
function buildAndCheckAuditUniverse(tenants, allResults) {
  const manifestDomains = templateManifest.templates.map((t) => domainKeyFromFilename(t.file)).sort();
  const observedTenants = [...new Set(allResults.map((r) => r.tenant_key))].sort();
  const observedDomains = [...new Set(allResults.map((r) => r.domain_key).filter(Boolean))].sort();
  const registryTenantKeys = tenants.map((t) => t.tenantKey).sort();
  const retiredKeys = new Set((registry.retiredTenants ?? []).map((t) => t.tenantKey));

  const unexpectedTenants = observedTenants.filter((t) => !registryTenantKeys.includes(t) || retiredKeys.has(t));
  const unexpectedDomains = observedDomains.filter((d) => !manifestDomains.includes(d));

  // Duplicate-alias check: two distinct registry entries whose
  // canonicalInputRoot resolves to the same real path, or whose tenantKey
  // differs only by a naming variant (e.g. "first-capital" vs
  // "first-capital-financial") -- either would double-count a tenant.
  const rootByTenant = new Map(tenants.map((t) => [t.tenantKey, path.resolve(repoRoot, t.canonicalInputRoot)]));
  const seenRoots = new Map();
  const duplicateAliases = [];
  for (const [key, root] of rootByTenant) {
    if (seenRoots.has(root)) duplicateAliases.push({ tenant_a: seenRoots.get(root), tenant_b: key, shared_root: path.relative(repoRoot, root) });
    else seenRoots.set(root, key);
  }

  const expectedCellCount = registryTenantKeys.length * manifestDomains.length;
  const actualCellCount = allResults.length;
  const unexpectedDomainCellCount = allResults.filter((r) => r.domain_key && !manifestDomains.includes(r.domain_key)).length;
  const residual = actualCellCount - expectedCellCount - unexpectedDomainCellCount;

  const universe = {
    registry_tenants: registryTenantKeys,
    observed_tenants: observedTenants,
    manifest_domains: manifestDomains,
    observed_domains: observedDomains,
    expected_cell_count: expectedCellCount,
    actual_cell_count: actualCellCount,
    unexpected_tenants: unexpectedTenants,
    unexpected_domains: unexpectedDomains,
    duplicate_aliases: duplicateAliases,
    accounting: {
      manifest_domain_count: manifestDomains.length,
      registry_tenant_count: registryTenantKeys.length,
      unexpected_domain_cell_count: unexpectedDomainCellCount,
      unexplained_residual_cell_count: residual,
      note:
        residual === 0
          ? "actual_cell_count fully reconciles to expected_cell_count plus cells contributed by unexpected (non-manifest) domains -- no unexplained residue."
          : "UNRECONCILED: actual cell count cannot be fully explained by the 19-domain manifest plus observed unexpected domains. Do not trust downstream classification totals until this is resolved.",
    },
    status: unexpectedTenants.length === 0 && duplicateAliases.length === 0 && residual === 0 ? "RECONCILED" : "UNRECONCILED",
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "audit-universe.json"), `${JSON.stringify(universe, null, 2)}\n`);

  if (universe.status !== "RECONCILED") {
    console.error(JSON.stringify(universe, null, 2));
    throw new Error(
      `Audit universe did not reconcile (unexpected_tenants=${unexpectedTenants.length}, duplicate_aliases=${duplicateAliases.length}, unexplained_residual=${residual}). See reports/tenant-inputs/audit-universe.json.`,
    );
  }
  return universe;
}

function main() {
  const tenants = registry.activeTenants;
  const allResults = [];
  for (const tenant of tenants) {
    const activeDir = path.join(repoRoot, tenant.canonicalInputRoot);
    if (!fs.existsSync(activeDir)) {
      allResults.push({
        tenant_key: tenant.tenantKey, domain_key: null, is_auxiliary: false,
        content_quality_status: "schema_invalid", provenance_status: "provenance_unresolved", remediation: "fix_parse_or_schema",
        note: `canonicalInputRoot ${tenant.canonicalInputRoot} does not exist`,
      });
      continue;
    }
    const files = fs.readdirSync(activeDir).filter((f) => f.endsWith(".csv")).sort();
    for (const filename of files) {
      try {
        allResults.push(auditTenantDomain(tenant.tenantKey, activeDir, filename));
      } catch (error) {
        const domainKey = domainKeyFromFilename(filename);
        allResults.push({
          tenant_key: tenant.tenantKey, domain_key: domainKey, is_auxiliary: !MANIFEST_DOMAIN_KEYS.has(domainKey),
          content_quality_status: "schema_invalid", provenance_status: "provenance_unresolved", remediation: "fix_parse_or_schema",
          note: String(error.message || error),
        });
      }
    }
  }

  const universe = buildAndCheckAuditUniverse(tenants, allResults);

  fs.mkdirSync(outDir, { recursive: true });

  const canonicalResults = allResults.filter((r) => !r.is_auxiliary);
  const auxiliaryResults = allResults.filter((r) => r.is_auxiliary);

  function countBy(results, field) {
    const counts = {};
    for (const r of results) counts[r[field]] = (counts[r[field]] || 0) + 1;
    return counts;
  }

  // 1. all-tenant-canonical-data-yield.json -- canonical and auxiliary
  // universes reported separately so an ungoverned artifact never dilutes
  // the canonical denominator.
  fs.writeFileSync(
    path.join(outDir, "all-tenant-canonical-data-yield.json"),
    `${JSON.stringify(
      {
        generated_by: "scripts/audit/tenant-canonical-data-consolidation-audit.mjs",
        registry_schema_version: registry.schemaVersion,
        canonical_universe: {
          expected_cells: universe.expected_cell_count,
          actual_cells: canonicalResults.length,
          content_quality_counts: countBy(canonicalResults, "content_quality_status"),
          provenance_counts: countBy(canonicalResults, "provenance_status"),
          remediation_counts: countBy(canonicalResults, "remediation"),
          results: canonicalResults,
        },
        auxiliary_universe: {
          observed_cells: auxiliaryResults.length,
          governance_status: "undocumented",
          files: [...new Set(auxiliaryResults.map((r) => r.domain_key))],
          note: "These domains are not declared in template-manifest.json's 19 required domains or manifest.json's 6 official source_adapters (SA01-SA06). They may carry real evidence but are not canonical until formally added to the source standard.",
          results: auxiliaryResults,
        },
      },
      null,
      2,
    )}\n`,
  );

  // 2. all-tenant-source-field-loss-matrix.csv (flattened per-field view, canonical universe only)
  const lossRows = [];
  for (const r of canonicalResults) {
    if (!r.active_field_nonempty_counts) continue;
    for (const [field, count] of Object.entries(r.active_field_nonempty_counts)) {
      lossRows.push({
        tenant_key: r.tenant_key,
        domain_key: r.domain_key,
        field,
        active_nonempty_count: count,
        active_row_count: r.active_row_count,
        active_nonempty_rate: r.active_row_count > 0 ? (count / r.active_row_count).toFixed(4) : "0",
        content_quality_status: r.content_quality_status,
        provenance_status: r.provenance_status,
        remediation: r.remediation,
        predecessor_available: r.predecessor ? "yes" : "no",
        predecessor_substantive_rate: r.predecessor ? r.predecessor.substantive_rate.toFixed(4) : "",
      });
    }
  }
  const lossHeaders = ["tenant_key", "domain_key", "field", "active_nonempty_count", "active_row_count", "active_nonempty_rate", "content_quality_status", "provenance_status", "remediation", "predecessor_available", "predecessor_substantive_rate"];
  const csvEscape = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  fs.writeFileSync(
    path.join(outDir, "all-tenant-source-field-loss-matrix.csv"),
    `${[lossHeaders.join(","), ...lossRows.map((row) => lossHeaders.map((h) => csvEscape(row[h])).join(","))].join("\n")}\n`,
  );

  // 3. all-tenant-consolidation-provenance.html
  const contentCounts = countBy(canonicalResults, "content_quality_status");
  const provenanceCounts = countBy(canonicalResults, "provenance_status");
  const remediationCounts = countBy(canonicalResults, "remediation");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>All-Tenant Consolidation Provenance Audit</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:28px;background:#f7f8fa;color:#17202a}
table{border-collapse:collapse;width:100%;background:#fff;margin-top:14px;font-size:12.5px}
td,th{border:1px solid #d9dee7;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f0f2f5;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
.canonical_sufficient{color:#166534;font-weight:700}
.canonical_partial{color:#9a3412;font-weight:700}
.placeholder_dominant{color:#991b1b;font-weight:700}
.canonical_empty{color:#7c2d12;font-weight:700}
.schema_invalid{color:#7c2d12;font-weight:700}
</style></head><body>
<h1>All-Tenant Consolidation Provenance Audit</h1>
<p>Read-only audit. Never mutates active/current. Retired legacy-schema directories used only as a read-only comparison source, never as a runtime fallback.</p>
<p>Canonical universe: ${canonicalResults.length}/${universe.expected_cell_count} cells. Auxiliary (ungoverned) universe: ${auxiliaryResults.length} cells, excluded from canonical totals below.</p>
<p>Content quality: ${Object.entries(contentCounts).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
<p>Provenance: ${Object.entries(provenanceCounts).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
<p>Remediation: ${Object.entries(remediationCounts).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
<table><thead><tr><th>Tenant</th><th>Domain</th><th>Active rows</th><th>Substantive rate</th><th>Predecessor</th><th>Predecessor substantive rate</th><th>Content quality</th><th>Provenance</th><th>Remediation</th><th>Required decision</th></tr></thead><tbody>
${canonicalResults.map((r) => `<tr><td>${r.tenant_key}</td><td>${r.domain_key ?? ""}</td><td>${r.active_row_count ?? ""}</td><td>${r.active_substantive_rate ?? ""}</td><td>${r.predecessor ? r.predecessor.path : "none"}</td><td>${r.predecessor ? r.predecessor.substantive_rate.toFixed(4) : ""}</td><td class="${r.content_quality_status}">${r.content_quality_status}</td><td>${r.provenance_status ?? ""}</td><td>${r.remediation}</td><td>${r.required_human_decision ?? r.note ?? ""}</td></tr>`).join("\n")}
</tbody></table>
<h2>Auxiliary (ungoverned) artifacts</h2>
<table><thead><tr><th>Tenant</th><th>Domain</th><th>Active rows</th><th>Status</th></tr></thead><tbody>
${auxiliaryResults.map((r) => `<tr><td>${r.tenant_key}</td><td>${r.domain_key ?? ""}</td><td>${r.active_row_count ?? ""}</td><td>ungoverned_auxiliary_artifact</td></tr>`).join("\n")}
</tbody></table>
</body></html>`;
  fs.writeFileSync(path.join(outDir, "all-tenant-consolidation-provenance.html"), html);

  // 5. canonical-backfill-plan.json (eligible domains only, canonical universe only)
  const backfillPlan = canonicalResults
    .filter((r) => r.backfill_eligible)
    .map((r) => ({
      tenant_key: r.tenant_key,
      domain_key: r.domain_key,
      active_canonical_path: r.active_canonical_path,
      active_substantive_rate: r.active_substantive_rate,
      predecessor_path: r.predecessor?.path,
      predecessor_substantive_rate: r.predecessor?.substantive_rate,
      content_quality_status: r.content_quality_status,
      provenance_status: r.provenance_status,
      remediation: r.remediation,
      proposed_action: "Build an explicit source-to-canonical transform from the predecessor into the current universal schema; preserve lineage; never overwrite a populated canonical value with an empty one; surface conflicts for human review; create a versioned canonical candidate; promote through tenant-input-registry.json only after approval.",
      status: "proposed_not_started",
    }));
  fs.writeFileSync(
    path.join(outDir, "canonical-backfill-plan.json"),
    `${JSON.stringify({ generated_by: "scripts/audit/tenant-canonical-data-consolidation-audit.mjs", note: "Proposed backfill candidates only. Nothing in this file has been executed. No file under active/current has been modified.", domains: backfillPlan }, null, 2)}\n`,
  );

  console.log(JSON.stringify({
    tenants: tenants.length,
    canonical_cells: canonicalResults.length,
    auxiliary_cells: auxiliaryResults.length,
    content_quality_counts: contentCounts,
    provenance_counts: provenanceCounts,
    remediation_counts: remediationCounts,
    out_dir: path.relative(repoRoot, outDir),
  }, null, 2));
}

main();
