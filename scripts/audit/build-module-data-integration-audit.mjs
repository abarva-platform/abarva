#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const OUT_DIR = path.join(REPO, "reports/module-data-integration-audit/2026-07-27");
const MIGRATIONS_DIR = path.join(REPO, "supabase/migrations");
const FOCUS_DIRS = [
  "src/lib/moves",
  "src/lib/source",
  "src/lib/tower",
  "src/lib/cio-tower",
  "src/app/api/v1/moves",
  "src/app/api/v1/source",
  "src/app/api/tower",
  "src/app/(maestro)/source",
  "src/app/(maestro)/tower",
  "src/app/(maestro)/strategic-moves",
  "scripts/source",
  "scripts/tower",
  "scripts/audit",
  "scripts/data-build",
  "scripts/qa",
];

const AUDIT_DATE = "2026-07-27";
const CSV_DELIM = ",";
const moduleTokens = {
  Moves: [/moves?/i, /strategic_moves/i, /move_artifact/i, /charter/i],
  Source: [/source/i, /proposal/i, /bafo/i, /supplier/i, /sourcing/i],
  Tower: [/tower/i, /cio_tower/i, /ai_control/i, /dora/i, /cmdb/i, /itsm/i],
};
const dispositionValues = [
  "retain_operational",
  "promote_link_canonical_knowledge",
  "project_shared_consumption",
  "archive",
  "replace",
];

const classificationOverrides = new Map(
  [
    [
      "public.move_artifact_review_decisions",
      [
        "retain_operational",
        "Review workflow state remains in Moves; accepted decisions may emit canonical decision/evidence records later.",
      ],
    ],
    [
      "public.move_artifacts",
      [
        "retain_operational",
        "Generated and uploaded Move artifacts remain workflow records; only approved evidence/facts should be published.",
      ],
    ],
    [
      "public.move_template_artifacts",
      [
        "retain_operational",
        "Template content is product configuration, not enterprise Knowledge.",
      ],
    ],
    [
      "public.source_artifact_chunks",
      [
        "promote_link_canonical_knowledge",
        "Evidence chunks can link to canonical evidence/corpus records after provenance, citation, and retrieval checks.",
      ],
    ],
    [
      "public.source_artifacts",
      [
        "retain_operational",
        "Source owns uploaded/generated artifact lifecycle; extracted facts/evidence publish separately.",
      ],
    ],
    [
      "public.source_event_artifact_states",
      [
        "retain_operational",
        "Artifact readiness state belongs to Source workflow; linked artifacts/facts publish separately.",
      ],
    ],
    [
      "public.source_vendor_proposal_fact_reviews",
      [
        "retain_operational",
        "Review status for extracted proposal facts stays operational; approved facts publish separately.",
      ],
    ],
    [
      "public.ai_control_sources",
      [
        "retain_operational",
        "Tower source-run metadata should remain a domain registry, not canonical business truth.",
      ],
    ],
    [
      "public.ai_control_refresh_runs",
      [
        "retain_operational",
        "Refresh runs are operational lineage for Tower publication, not enterprise facts.",
      ],
    ],
    [
      "public.ai_control_atlas_context_packs",
      [
        "project_shared_consumption",
        "Context packs are derived read bundles for aVa/Tower consumption, not canonical source truth.",
      ],
    ],
    [
      "cio_tower.question_contracts",
      [
        "retain_operational",
        "Question contracts govern Tower answer behavior; they are product configuration, not vendor contracts.",
      ],
    ],
    [
      "intelligence_v7.active_tenant_contract_versions",
      [
        "retain_operational",
        "Active contract-version pointers are runtime governance/configuration, not commercial contract facts.",
      ],
    ],
    [
      "cio_tower.measures",
      [
        "promote_link_canonical_knowledge",
        "Tower metric definitions should link to the shared metric definition registry.",
      ],
    ],
    [
      "cio_tower.measure_results",
      [
        "project_shared_consumption",
        "Tower metric observations are calculated/published results for shared consumption after parity proof.",
      ],
    ],
    [
      "cio_tower.facts",
      [
        "project_shared_consumption",
        "Tower facts are measure observations/read-model inputs; definitions and source facts must be governed separately.",
      ],
    ],
    [
      "public.tower_dora_metrics",
      [
        "project_shared_consumption",
        "DORA values are metric observations and should consume governed metric definitions.",
      ],
    ],
    [
      "public.application_portfolio",
      [
        "promote_link_canonical_knowledge",
        "Application/system inventory is an enterprise object family that should map to canonical application identity.",
      ],
    ],
    [
      "public.use_cases",
      [
        "promote_link_canonical_knowledge",
        "Use cases and initiatives are enterprise program/opportunity objects once reviewed.",
      ],
    ],
    [
      "public.tower_cmdb_cis",
      [
        "promote_link_canonical_knowledge",
        "CMDB configuration items can link to canonical application/system/service identity after quality review.",
      ],
    ],
    [
      "public.tower_cmdb_dependencies",
      [
        "project_shared_consumption",
        "CMDB dependencies should publish as governed relationship/graph projections after endpoint validation.",
      ],
    ],
    [
      "public.tower_program_financials",
      [
        "project_shared_consumption",
        "Program financial observations should publish through metric/value projections, not become a second financial truth.",
      ],
    ],
    [
      "public.tower_vendor_spend",
      [
        "project_shared_consumption",
        "Vendor-spend observations should publish through shared spend/value projections with canonical vendor links.",
      ],
    ],
  ].map(([name, value]) => [name.toLowerCase(), value]),
);

const canonicalOverrides = new Map(
  [
    ["cio_tower.facts", "knowledge.metric_observation"],
    ["cio_tower.measure_results", "knowledge.metric_observation"],
    ["cio_tower.measures", "knowledge.metric_definition"],
    ["cio_tower.question_contracts", "product.tower_question_contract"],
    ["intelligence_v7.active_tenant_contract_versions", "governance.publication_contract_version"],
    ["public.ai_control_atlas_context_packs", "consumption.context_pack"],
    ["public.ai_control_refresh_runs", "operations.refresh_run"],
    ["public.application_portfolio", "knowledge.application"],
    ["public.source_artifact_acceptances", "knowledge.evidence_acceptance"],
    ["public.source_artifact_chunks", "knowledge.evidence_chunk"],
    ["public.source_artifact_facts", "knowledge.fact"],
    ["public.source_event_facts", "knowledge.fact"],
    ["public.source_vendor_proposal_fact_reviews", "governance.review_state"],
    ["public.tower_cmdb_cis", "knowledge.application"],
    ["public.tower_cmdb_dependencies", "knowledge.relationship_projection"],
    ["public.tower_dora_metrics", "knowledge.metric_observation"],
    ["public.tower_program_financials", "knowledge.metric_observation"],
    ["public.tower_vendor_spend", "knowledge.metric_observation"],
    ["public.use_cases", "knowledge.program"],
  ].map(([name, value]) => [name.toLowerCase(), value]),
);

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function normalizeObjectName(name) {
  if (!name) return "";
  return name
    .replace(/[";]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\($/, "")
    .trim();
}

function splitSchema(name) {
  const clean = normalizeObjectName(name);
  const pieces = clean.split(".");
  if (pieces.length >= 2) {
    return { schema: pieces[0], objectName: pieces.slice(1).join(".") };
  }
  return { schema: "public", objectName: clean };
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("; ") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(fileName, rows, headers) {
  const lines = [headers.join(CSV_DELIM)];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(CSV_DELIM));
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${lines.join("\n")}\n`);
}

function moduleFor(name, refs = []) {
  const haystack = `${name} ${refs.join(" ")}`;
  const scores = Object.fromEntries(Object.keys(moduleTokens).map((key) => [key, 0]));
  for (const [module, patterns] of Object.entries(moduleTokens)) {
    for (const pattern of patterns) if (pattern.test(haystack)) scores[module] += 1;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : "Cross-module";
}

function purposeFor(fullName) {
  const name = fullName.toLowerCase();
  if (name.includes("approval")) return "Approval and human review workflow state.";
  if (name.includes("artifact")) return "Generated or reviewed deliverable/artifact persistence.";
  if (name.includes("proposal") || name.includes("bafo")) return "Supplier proposal, revision, or sourcing-response evidence.";
  if (name.includes("event")) return "Operational event or sourcing-workflow state.";
  if (name.includes("mart") || name.includes("mv_") || name.includes("rollup")) return "Derived read model or reporting projection.";
  if (name.includes("metric") || name.includes("kpi") || name.includes("value") || name.includes("outcome")) return "Metric, KPI, value, or outcome measurement substrate.";
  if (name.includes("trace") || name.includes("prompt") || name.includes("generation")) return "AI generation trace, prompt package, or audit record.";
  if (name.includes("risk") || name.includes("control")) return "Risk/control governance or monitoring substrate.";
  if (name.includes("move") || name.includes("charter") || name.includes("phase")) return "Moves lifecycle, phase, charter, or execution planning state.";
  if (name.includes("vendor") || name.includes("contract")) return "Vendor, contract, or commercial-evidence substrate.";
  return "Persisted module object requiring owner review.";
}

function classificationFor({ fullName, module, objectKind, columns }) {
  const name = fullName.toLowerCase();
  const colText = columns.join(" ").toLowerCase();
  const override = classificationOverrides.get(name);
  if (override) return override;
  if (objectKind.includes("view") || name.includes("mart") || name.includes("rollup") || name.includes("mv_")) {
    return ["project_shared_consumption", "Derived object shaped for reuse by screens, reports, exports, or aVa."];
  }
  if (name.includes("trace") || name.includes("generation_job") || name.includes("log") || name.includes("snapshot")) {
    return ["archive", "Audit/history object should be retained but not promoted as enterprise truth."];
  }
  if (name.includes("legacy") || name.includes("deprecated") || name.includes("old_")) {
    return ["replace", "Name suggests replacement by a governed canonical or consumption model."];
  }
  if (
    /(?:template|review|approval|activity|event|job|stage|gate|dependency|instance|session|draft|submission|state)/.test(name) &&
    !/(?:^|_)(?:accepted|acceptance|selected|executed|published|fact|facts|commitment|commitments|contract|contracts|metric|metrics|kpi|outcome|outcomes|value|risk|control)(?:_|$)/.test(name)
  ) {
    return ["retain_operational", "Workflow, review, template, or draft state remains domain-owned unless it emits accepted/published facts."];
  }
  if (name.includes("artifact") && !/(?:accepted|acceptance|fact|chunk|evidence|published)/.test(name)) {
    return ["retain_operational", "Generated or draft artifacts remain operational; only accepted facts/evidence promote."];
  }
  if (
    /(?:^|_)(?:accepted|acceptance|selected|executed|published|fact|facts|commitment|commitments|contract|contracts|vendor|vendors|supplier|suppliers|metric|metrics|kpi|outcome|outcomes|value|risk|control)(?:_|$)/.test(name) ||
    colText.includes("canonical")
  ) {
    return ["promote_link_canonical_knowledge", "Contains enterprise-meaningful accepted, factual, commercial, metric, risk, or control data that should link through canonical IDs after review."];
  }
  if (name.includes("evidence") && /(?:source|lineage|citation|provenance|document|file)/.test(colText)) {
    return ["promote_link_canonical_knowledge", "Evidence-bearing object can link to canonical evidence after tenant, provenance, and review-state checks."];
  }
  if (module === "Moves" && /decision|risk|action|program|initiative/.test(name) && /(?:approved|accepted|published|final|outcome|metric|evidence)/.test(colText)) {
    return ["promote_link_canonical_knowledge", "Moves object has enterprise decision/program/risk/action meaning only after approval or publication."];
  }
  return ["retain_operational", "Needed for domain workflow unless a later live data review proves it obsolete."];
}

function canonicalEquivalent(fullName) {
  const name = fullName.toLowerCase();
  const override = canonicalOverrides.get(name);
  if (override) return override;
  if (name.includes("vendor") || name.includes("supplier")) return "knowledge.vendor";
  if (name.includes("contract") || name.includes("agreement")) return "knowledge.contract";
  if (name.includes("program") || name.includes("initiative") || name.includes("move")) return "knowledge.program";
  if (name.includes("metric") || name.includes("kpi") || name.includes("outcome") || name.includes("value")) return "knowledge.metric";
  if (name.includes("decision")) return "knowledge.decision";
  if (name.includes("risk") || name.includes("control")) return "knowledge.risk_control";
  if (name.includes("artifact") || name.includes("evidence")) return "knowledge.evidence";
  if (name.includes("application") || name.includes("app")) return "knowledge.application";
  if (name.includes("tenant") || name.includes("client")) return "governance.tenant";
  return "to_be_mapped";
}

function complexityFor(row) {
  const linkCount = (row.main_relationships || "").split(";").filter(Boolean).length;
  if (row.future_classification === "archive" || row.future_classification === "retain_operational") return "Low";
  if (linkCount >= 5 || row.module === "Cross-module") return "High";
  return "Medium";
}

function cutoverFor(row) {
  if (row.future_classification === "archive") return "Archive-only; no runtime cutover.";
  if (row.future_classification === "retain_operational") return "Keep domain owner path; publish outbox if facts are accepted.";
  if (row.future_classification === "promote_link_canonical_knowledge") return "Backfill identity map; shadow-read canonical projection; switch consumers after reconciliation.";
  if (row.future_classification === "project_shared_consumption") return "Build stable projection; dual-read compare; switch dashboards/aVa after parity.";
  return "Replace with canonical/consumption equivalent after read-parity proof.";
}

function extractCreateTables(sql, file) {
  const objects = [];
  const createRe = /create\s+(table|view|materialized\s+view)\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_".]+)\s*(?:\(|as\b)/gi;
  let match;
  while ((match = createRe.exec(sql))) {
    const objectKind = match[1].toLowerCase();
    const { schema, objectName } = splitSchema(match[2]);
    const fullName = `${schema}.${objectName}`;
    let body = "";
    if (objectKind === "table") {
      const start = sql.indexOf("(", match.index);
      if (start !== -1) {
        let depth = 0;
        for (let i = start; i < sql.length; i += 1) {
          const char = sql[i];
          if (char === "(") depth += 1;
          if (char === ")") depth -= 1;
          if (depth === 0) {
            body = sql.slice(start + 1, i);
            break;
          }
        }
      }
    }
    const columns = [];
    const primaryKeys = [];
    for (const raw of body.split("\n")) {
      const line = raw.trim().replace(/,$/, "");
      if (!line || /^(constraint|primary key|foreign key|unique|check|\))/i.test(line)) {
        if (/primary key\s*\(([^)]+)\)/i.test(line)) primaryKeys.push(RegExp.$1.replace(/["\s]/g, ""));
        continue;
      }
      const column = line.match(/^"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s+(.+)$/);
      if (column) {
        columns.push(column[1]);
        if (/primary key/i.test(line)) primaryKeys.push(column[1]);
      }
    }
    objects.push({
      fullName,
      schema,
      table: objectName,
      objectKind,
      migrationFile: path.relative(REPO, file),
      columns: [...new Set(columns)],
      primaryKeys: [...new Set(primaryKeys)],
    });
  }
  return objects;
}

function extractRls(sql) {
  const rls = new Map();
  const enableRe = /alter\s+table\s+([a-zA-Z0-9_".]+)\s+enable\s+row\s+level\s+security/gi;
  let match;
  while ((match = enableRe.exec(sql))) {
    const { schema, objectName } = splitSchema(match[1]);
    rls.set(`${schema}.${objectName}`, true);
  }
  const policyRe = /create\s+policy\s+[^;]+?\s+on\s+([a-zA-Z0-9_".]+)/gis;
  while ((match = policyRe.exec(sql))) {
    const { schema, objectName } = splitSchema(match[1]);
    rls.set(`${schema}.${objectName}`, true);
  }
  return rls;
}

function extractCodeRefs(files) {
  const refs = new Map();
  const regexes = [
    /\.from\s*\(\s*['"`]([a-zA-Z0-9_.-]+)['"`]\s*\)/g,
    /\b(?:from|join|into|update)\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi,
  ];
  for (const file of files) {
    const rel = path.relative(REPO, file);
    const text = fs.readFileSync(file, "utf8");
    for (const re of regexes) {
      let match;
      while ((match = re.exec(text))) {
        const raw = normalizeObjectName(match[1]).replace(/\.$/, "");
        if (!raw || /^(select|where|values|set|returning|with|jsonb|lateral|unnest)$/i.test(raw)) continue;
        const { schema, objectName } = splitSchema(raw);
        const fullName = `${schema}.${objectName}`;
        if (!refs.has(fullName)) refs.set(fullName, new Set());
        refs.get(fullName).add(rel);
      }
    }
  }
  return refs;
}

function isRelevant(fullName, refs = []) {
  const haystack = `${fullName} ${refs.join(" ")}`;
  return /(source|tower|cio_tower|ai_control|move|moves|strategic_moves|proposal|supplier|bafo|dora|cmdb|itsm|value_state|artifact_review|pricing_estimates_moves)/i.test(haystack);
}

function buildInventory() {
  const migrations = walk(MIGRATIONS_DIR, (file) => file.endsWith(".sql"));
  const byName = new Map();
  const rls = new Map();
  for (const file of migrations) {
    const sql = fs.readFileSync(file, "utf8");
    for (const [key, value] of extractRls(sql)) rls.set(key, value);
    for (const obj of extractCreateTables(sql, file)) {
      const existing = byName.get(obj.fullName);
      if (existing) {
        existing.migrationFile = `${existing.migrationFile}; ${obj.migrationFile}`;
        existing.columns = [...new Set([...existing.columns, ...obj.columns])];
        existing.primaryKeys = [...new Set([...existing.primaryKeys, ...obj.primaryKeys])];
      } else {
        byName.set(obj.fullName, obj);
      }
    }
  }
  const codeFiles = FOCUS_DIRS.flatMap((dir) =>
    walk(path.join(REPO, dir), (file) => /\.(ts|tsx|js|jsx|mjs|cjs|sql)$/.test(file)),
  );
  const refs = extractCodeRefs(codeFiles);
  const rows = [];
  for (const obj of byName.values()) {
    const codeRefs = [...(refs.get(obj.fullName) || [])].sort();
    if (!isRelevant(obj.fullName, codeRefs)) continue;
    const moduleName = moduleFor(obj.fullName, codeRefs);
    const [futureClassification, rationale] = classificationFor({ ...obj, module: moduleName });
    const relationships = obj.columns.filter((col) => /(^|_)id$/.test(col) || col.endsWith("_key"));
    const stateCols = obj.columns.filter((col) => /(status|state|stage|phase|approval|published|superseded)/i.test(col));
    const temporalCols = obj.columns.filter((col) => /(created_at|updated_at|valid_from|valid_to|effective|period|date|history|version)/i.test(col));
    const evidenceCols = obj.columns.filter((col) => /(source|evidence|artifact|lineage|provenance|citation|confidence)/i.test(col));
    const tenantCols = obj.columns.filter((col) => /(tenant|client|org|organization|user_id|owner_id)/i.test(col));
    const tenantIsolation =
      rls.get(obj.fullName) || tenantCols.length
        ? `${rls.get(obj.fullName) ? "RLS/policy marker observed" : "tenant/user column observed"} (${tenantCols.join("; ") || "policy only"})`
        : "Needs live DB/RLS verification; no tenant column parsed statically";
    const row = {
      audit_date: AUDIT_DATE,
      module: moduleName,
      schema_table: obj.fullName,
      object_kind: obj.objectKind,
      business_purpose: purposeFor(obj.fullName),
      system_of_record: futureClassification === "retain_operational" ? "Domain workflow system of record" : "Candidate/domain-derived; not canonical until promoted",
      tenant_isolation: tenantIsolation,
      primary_business_keys: obj.primaryKeys.length ? obj.primaryKeys.join("; ") : relationships.slice(0, 6).join("; ") || "Not resolved statically",
      main_relationships: relationships.slice(0, 14).join("; ") || "Not resolved statically",
      state_model: stateCols.join("; ") || "Not explicit in parsed columns",
      temporal_support: temporalCols.join("; ") || "Current-state unknown; live profiling required",
      evidence_lineage: evidenceCols.join("; ") || "No parsed lineage fields; inspect write path before promotion",
      data_quality: "Static repo audit only: requires live row profiling for nulls, duplicates, stale rows, broken links",
      current_consumers: codeRefs.slice(0, 8).join("; ") || "No focused code consumer found",
      metrics_produced: /(metric|kpi|value|budget|spend|cost|outcome|sla|dora|financial)/i.test(obj.fullName)
        ? "Metric/value/cost family candidate"
        : "",
      canonical_equivalent: canonicalEquivalent(obj.fullName),
      future_classification: futureClassification,
      classification_rationale: rationale,
      migration_complexity: "",
      cutover_requirement: "",
      source_files: obj.migrationFile,
      parsed_columns_sample: obj.columns.slice(0, 24).join("; "),
      code_reference_count: codeRefs.length,
      confidence: obj.objectKind === "referenced_object" ? "medium: code reference only" : "high: migration DDL parsed",
    };
    row.migration_complexity = complexityFor(row);
    row.cutover_requirement = cutoverFor(row);
    rows.push(row);
  }
  return rows.sort((a, b) => `${a.module}|${a.schema_table}`.localeCompare(`${b.module}|${b.schema_table}`));
}

function buildMatrices(inventory) {
  const identityFamilies = [
    ["Tenant", /tenant|client/i],
    ["Vendor/Supplier", /vendor|supplier/i],
    ["Contract/Agreement", /contract|agreement/i],
    ["Program/Initiative/Move", /program|initiative|move|charter/i],
    ["Application/System", /application|system|cmdb|itsm/i],
    ["Metric/KPI/Outcome", /metric|kpi|outcome|value|budget|spend|cost|sla|dora/i],
    ["Decision", /decision|approval/i],
    ["Risk/Control", /risk|control/i],
    ["Evidence/Artifact", /evidence|artifact|source|lineage/i],
  ];
  const collisions = identityFamilies.map(([family, pattern]) => {
    const hits = inventory.filter((row) => pattern.test(`${row.schema_table} ${row.primary_business_keys} ${row.main_relationships} ${row.canonical_equivalent}`));
    const modules = [...new Set(hits.map((row) => row.module))].sort();
    return {
      object_family: family,
      modules_seen: modules.join("; "),
      local_objects: hits.slice(0, 18).map((row) => row.schema_table).join("; "),
      collision_risk: modules.length >= 3 ? "High" : modules.length === 2 ? "Medium" : hits.length ? "Low" : "Not observed",
      recommended_mapping: "Preserve local IDs; map reviewed objects through governance.object_identity_map before cross-module use.",
      review_priority: modules.length >= 2 ? "P0" : hits.length ? "P1" : "P2",
    };
  });

  const promotion = inventory
    .filter((row) => row.future_classification === "promote_link_canonical_knowledge")
    .map((row) => ({
      module: row.module,
      schema_table: row.schema_table,
      canonical_equivalent: row.canonical_equivalent,
      promotion_trigger: "Approved/accepted/published state plus evidence lineage and tenant identity verified",
      required_crosswalk: "governance.object_identity_map",
      lineage_required: "source/evidence/provenance fields or outbox payload evidence",
      complexity: row.migration_complexity,
      blocker: row.evidence_lineage.startsWith("No parsed") ? "Lineage field not found statically" : "",
    }));

  const projection = inventory
    .filter((row) => row.future_classification === "project_shared_consumption")
    .map((row) => ({
      module: row.module,
      source_object: row.schema_table,
      projection_type: row.object_kind.includes("view") || row.schema_table.includes("mart") ? "existing derived read model" : "candidate shared projection",
      target_consumers: "Cube; Nexus; aVa; Superset; Observable; module dashboards",
      refresh_pattern: "Domain publication/outbox to stable consumption projection",
      parity_test: "Compare existing module output to projection output before switching consumers",
      rollback: "Keep domain read path until projection parity and signed-in proof pass",
    }));

  const metricDuplication = inventory
    .filter((row) => /(metric|kpi|outcome|value|budget|spend|cost|sla|dora|financial|measure)/i.test(`${row.schema_table} ${row.metrics_produced}`))
    .map((row) => ({
      metric_family: row.canonical_equivalent === "knowledge.metric" ? inferMetricFamily(row.schema_table) : row.canonical_equivalent,
      module: row.module,
      schema_table: row.schema_table,
      current_role: row.business_purpose,
      duplication_risk: /tower|source|move|value|budget|spend|cost|metric|kpi|outcome/i.test(row.schema_table) ? "Medium" : "Low",
      required_definition_owner: "shared metric definition registry; domain observations remain local until published",
      consolidation_action: "Separate metric definition from observation; reconcile units, period, tenant, and source lineage before consumption.",
    }));

  return { collisions, promotion, projection, metricDuplication };
}

function inferMetricFamily(name) {
  if (/budget|spend|cost|financial/i.test(name)) return "Cost / spend / budget";
  if (/value|benefit|savings|outcome/i.test(name)) return "Value / outcome";
  if (/sla|incident|dora|performance/i.test(name)) return "Operational performance";
  if (/risk|control/i.test(name)) return "Risk / control";
  return "Generic metric";
}

function writeMarkdownReports(inventory) {
  const countsBy = (key) => inventory.reduce((acc, row) => ((acc[row[key]] = (acc[row[key]] || 0) + 1), acc), {});
  const moduleCounts = countsBy("module");
  const dispositionCounts = countsBy("future_classification");
  const reportHeader = `> Scope: static repository audit only. No Azure resources, production data, schemas, APIs, dashboards, or tenant records were mutated. Live row counts, RLS policies, null rates, and broken-link checks require a later controlled DB read audit.\n\n`;
  const commonSummary = `Inventory captured ${inventory.length} module-relevant persisted objects parsed from migration DDL across Moves, Source, and Tower.\n\nModule counts: ${Object.entries(moduleCounts).map(([k, v]) => `${k}: ${v}`).join("; ")}.\n\nDisposition counts: ${Object.entries(dispositionCounts).map(([k, v]) => `${k}: ${v}`).join("; ")}.\n`;

  const moduleFiles = [
    ["MOVES_DATA_MODEL_ASSESSMENT.md", "Moves", "Moves should retain workflow drafting/execution state locally, promote approved programs, decisions, risks, actions, outcomes, and KPIs through canonical identity mapping, and publish stable portfolio/readiness summaries only after parity proof."],
    ["SOURCE_DATA_MODEL_ASSESSMENT.md", "Source", "Source should retain sourcing-event workflow state locally, promote selected suppliers, accepted proposal facts, contracts, commercial commitments, and decision evidence, and project event comparisons/value proof as shared consumption outputs."],
    ["TOWER_DATA_MODEL_ASSESSMENT.md", "Tower", "Tower should retain monitoring/control workflow state locally, promote governed metric definitions and material risks, and publish metric observations, value realization, vendor performance, and command-center marts as controlled consumption projections."],
  ];
  for (const [file, module, thesis] of moduleFiles) {
    const rows = inventory.filter((row) => row.module === module);
    const byDisposition = rows.reduce((acc, row) => ((acc[row.future_classification] = (acc[row.future_classification] || 0) + 1), acc), {});
    const examples = dispositionValues
      .map((disp) => {
        const hits = rows.filter((row) => row.future_classification === disp).slice(0, 8);
        if (!hits.length) return "";
        return `\n### ${disp}\n${hits.map((row) => `- \`${row.schema_table}\` — ${row.business_purpose}`).join("\n")}`;
      })
      .filter(Boolean)
      .join("\n");
    fs.writeFileSync(
      path.join(OUT_DIR, file),
      `# ${module} Data Model Assessment\n\n${reportHeader}## Executive Read\n\n${thesis}\n\n## Static Findings\n\nObjects reviewed: ${rows.length}.\n\nDisposition mix: ${Object.entries(byDisposition).map(([k, v]) => `${k}: ${v}`).join("; ") || "none"}.\n\n## Representative Objects${examples}\n\n## Required Next Proof\n\n- Run a live read-only DB inventory for row counts, RLS status, tenant keys, and referential quality.\n- Build identity-map candidates before any promotion.\n- Shadow-read any consumption projection before dashboard or aVa cutover.\n- Keep operational workflow tables domain-owned; do not force draft/process state into Knowledge.\n`,
    );
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "TENANT_ISOLATION_AND_RLS_AUDIT.md"),
    `# Tenant Isolation and RLS Audit\n\n${reportHeader}## Static Result\n\n${commonSummary}\n\n## What This Audit Can Prove\n\n- Migration files and focused code references were scanned for tenant/client/user identity markers.\n- Objects without parsed tenant or policy markers are flagged for live DB review, not declared unsafe.\n\n## Main Risks\n\n- Legacy/public tables may rely on application-layer tenant filtering rather than strict RLS.\n- Referenced objects not found in parsed DDL need live schema confirmation.\n- Cross-module consumption projections must never become wildcard tenant readers.\n\n## Required Live Checks\n\n1. Query Postgres catalog for every table's RLS enabled state.\n2. Verify policies include tenant-scoped predicates or controlled service-role exceptions.\n3. Verify every module read adapter accepts tenant identity from the request/session, not a display label or folder name.\n4. Prove no Source/Tower/Moves projection can return another tenant's IDs under signed-in browser/API tests.\n`,
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "DATA_QUALITY_AND_LINEAGE_REPORT.md"),
    `# Data Quality and Lineage Report\n\n${reportHeader}## Static Result\n\n${commonSummary}\n\n## What Was Observed\n\n- Evidence lineage markers were inferred from parsed columns containing source, evidence, artifact, lineage, provenance, citation, or confidence language.\n- Metric duplication candidates were extracted into \`METRIC_DEFINITION_DUPLICATION_MATRIX.xlsx\`.\n- Identity collision candidates were extracted into \`CROSS_MODULE_IDENTITY_COLLISION_MATRIX.xlsx\`.\n\n## What Remains Unknown Until Live DB Audit\n\n- Null rates and duplicate business keys.\n- Broken foreign-key-like references where no explicit FK exists.\n- Superseded/stale rows versus current accepted rows.\n- Whether generated artifacts are being treated as source truth.\n\n## Minimum Quality Gate Before Migration\n\n- Every promoted fact needs tenant identity, canonical object type, local object ref, evidence/provenance, effective dates where applicable, and review state.\n- Every consumption projection needs a domain owner, refresh cadence, parity test, and rollback path.\n`,
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "MODULE_DATA_INTEGRATION_TARGET_ARCHITECTURE.md"),
    `# Module Data Integration Target Architecture\n\n${reportHeader}## Target Pattern\n\n\`\`\`text\nOperational workflow tables\n        ↓\nDomain outbox / change events\n        ↓\nCanonical identity mapping\n        ↓\nKnowledge promotion where appropriate\n        ↓\nDomain publication\n        ↓\nShared consumption projections\n        ↓\nCube / Nexus / aVa / Superset / Observable\n\`\`\`\n\n## Architecture Rules\n\n- Products do not own enterprise data; they own workflow state and projections.\n- Local module IDs are preserved, then linked through \`governance.object_identity_map\`.\n- Accepted/published enterprise facts promote or link to canonical Knowledge; draft artifacts stay operational.\n- Metric definitions are governed separately from observations and chart-ready projections.\n- No synchronous multi-write of the same fact into Moves, Source, Tower, Knowledge, and reporting tables.\n\n## Proposed Crosswalk Fields\n\n| Field | Purpose |\n| --- | --- |\n| tenant_key | Tenant fence |\n| module | Source module |\n| local_object_type | Domain object type |\n| local_object_ref | Domain-local ID |\n| canonical_object_type | Canonical Knowledge type |\n| canonical_object_ref | Canonical ID |\n| match_method | exact, deterministic, reviewed, manual |\n| match_confidence | confidence score or tier |\n| review_state | candidate, approved, rejected, superseded |\n| valid_from / valid_to | temporal boundary |\n`,
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "MODULE_MIGRATION_WAVE_PLAN.md"),
    `# Module Migration Wave Plan\n\n${reportHeader}## Wave Sequence\n\n1. **Read-only live inventory** — confirm tables, RLS, row counts, tenant filters, and consumers.\n2. **Identity-map design** — create candidate crosswalks for tenant, vendor, contract, program, application, metric, decision, risk, action, and evidence objects.\n3. **Moves shadow publication** — publish approved decisions/programs/outcomes to canonical candidates; keep workflow local.\n4. **Source shadow publication** — publish selected supplier/contract/proposal facts; keep event workflow local.\n5. **Tower shadow publication** — publish governed metrics/value/risk observations; keep monitoring controls local.\n6. **Shared consumption projections** — build stable read models for Cube, Nexus, aVa, Superset, and Observable.\n7. **Signed-in parity certification** — module screens, aVa answers, exports, and dashboards match or improve.\n8. **Cutover** — switch consumers only after parity, rollback, and tenant isolation proofs pass.\n\n## Stop Conditions\n\n- Tenant leakage, unscoped read path, conflicting metric definitions, missing lineage for promoted facts, or dashboard/aVa quality regression.\n`,
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "MODULE_CUTOVER_AND_ROLLBACK_PLAN.md"),
    `# Module Cutover and Rollback Plan\n\n${reportHeader}## Cutover Pattern\n\n- Use shadow-read and parity reports first.\n- Promote one object family at a time, not an entire module in one step.\n- Keep original operational read path until signed-in product proof passes.\n- Maintain feature flags for consumers, not data writes.\n\n## Rollback Pattern\n\n- Revert consumer flag to domain read path.\n- Preserve published projection rows for audit; mark superseded rather than deleting.\n- Stop outbox processing if projection quality fails.\n- Do not roll back canonical IDs once approved without a reversal record.\n\n## Required Evidence Per Cutover\n\n- Tenant-scoped row counts.\n- Identity-map reconciliation report.\n- Metric definition parity report.\n- aVa answer regression.\n- Dashboard/export signed-in screenshots.\n- Rollback command and owner.\n`,
  );
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const inventory = buildInventory();
  const matrices = buildMatrices(inventory);
  const inventoryHeaders = [
    "audit_date",
    "module",
    "schema_table",
    "object_kind",
    "business_purpose",
    "system_of_record",
    "tenant_isolation",
    "primary_business_keys",
    "main_relationships",
    "state_model",
    "temporal_support",
    "evidence_lineage",
    "data_quality",
    "current_consumers",
    "metrics_produced",
    "canonical_equivalent",
    "future_classification",
    "classification_rationale",
    "migration_complexity",
    "cutover_requirement",
    "source_files",
    "parsed_columns_sample",
    "code_reference_count",
    "confidence",
  ];
  writeCsv("CURRENT_MODULE_DATA_INVENTORY.csv", inventory, inventoryHeaders);
  writeCsv("CROSS_MODULE_IDENTITY_COLLISION_MATRIX.csv", matrices.collisions, [
    "object_family",
    "modules_seen",
    "local_objects",
    "collision_risk",
    "recommended_mapping",
    "review_priority",
  ]);
  writeCsv("CANONICAL_PROMOTION_MATRIX.csv", matrices.promotion, [
    "module",
    "schema_table",
    "canonical_equivalent",
    "promotion_trigger",
    "required_crosswalk",
    "lineage_required",
    "complexity",
    "blocker",
  ]);
  writeCsv("CONSUMPTION_PROJECTION_MATRIX.csv", matrices.projection, [
    "module",
    "source_object",
    "projection_type",
    "target_consumers",
    "refresh_pattern",
    "parity_test",
    "rollback",
  ]);
  writeCsv("METRIC_DEFINITION_DUPLICATION_MATRIX.csv", matrices.metricDuplication, [
    "metric_family",
    "module",
    "schema_table",
    "current_role",
    "duplication_risk",
    "required_definition_owner",
    "consolidation_action",
  ]);
  writeMarkdownReports(inventory);
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(
      {
        auditDate: AUDIT_DATE,
        scope: "static repo audit only; no Azure/Postgres mutation",
        inventoryRows: inventory.length,
        byModule: inventory.reduce((acc, row) => ((acc[row.module] = (acc[row.module] || 0) + 1), acc), {}),
        byClassification: inventory.reduce((acc, row) => ((acc[row.future_classification] = (acc[row.future_classification] || 0) + 1), acc), {}),
        matrixRows: {
          identityCollisions: matrices.collisions.length,
          canonicalPromotion: matrices.promotion.length,
          consumptionProjection: matrices.projection.length,
          metricDuplication: matrices.metricDuplication.length,
        },
      },
      null,
      2,
    ),
  );
  console.log(`Wrote module data integration audit to ${path.relative(REPO, OUT_DIR)}`);
  console.log(`Inventory rows: ${inventory.length}`);
}

main();
