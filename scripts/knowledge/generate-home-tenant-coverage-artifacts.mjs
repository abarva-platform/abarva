#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readCsv, writeCsv } from "../tenant-v3/lib/csv.mjs";

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();
const reportDir = path.join(repoRoot, "reports/home-tenant-coverage");
const EXISTING_GRAPH_CLEANUPS = [
  {
    tenantKey: "meridian-health",
    graphFile: "datasets/tenant-inputs/meridian-health/derived/relationship-graph.json",
  },
];

const TENANTS = [
  {
    routeKey: "skyharbor-air",
    sourceKey: "skyharbor-air",
    displayName: "Airline Demo",
    legacyApprovedKey: "skyharbor-air",
    boundary:
      "synthetic_demo_airline_planning_grade; not a real airline production dataset",
    scrub: [
      [/SkyHarbor Air/g, "Airline Demo"],
      [/SkyHarbor/g, "Airline Demo"],
    ],
  },
  {
    routeKey: "first-capital",
    sourceKey: "first-capital-financial",
    displayName: "FS Demo",
    legacyApprovedKey: "first-capital",
    boundary:
      "synthetic_demo_financial_services_planning_grade; not real bank production data",
    scrub: [
      [/First Capital Financial/g, "FS Demo"],
      [/First Capital/g, "FS Demo"],
    ],
  },
  {
    routeKey: "lakeshore-holdings",
    sourceKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    legacyApprovedKey: "lakeshore-holdings",
    boundary:
      "synthetic_demo_holding_company_planning_grade; holdco direct revenue remains zero by design",
    scrub: [[/Lakeshore Industries/g, "Lakeshore Holdings"]],
  },
  {
    routeKey: "apex-retail",
    sourceKey: "apex-retail",
    displayName: "Retail Demo",
    legacyApprovedKey: "apex-retail",
    boundary:
      "synthetic_demo_retail_planning_grade; not a real retailer production dataset",
    scrub: [[/Apex Retail Group/g, "Retail Demo"]],
  },
];

const DIMENSIONS = [
  {
    key: "profile",
    label: "Enterprise Profile",
    file: "00_enterprise_profile.csv",
    preferred: [
      "entity_name",
      "industry",
      "sub_industry",
      "revenue_usd",
      "employee_count",
      "headquarters",
      "business_model",
      "known_gaps",
    ],
    chain: ["Enterprise", "Functions", "Systems", "Programs", "Evidence"],
  },
  {
    key: "functions",
    label: "Business Functions",
    file: "01_business_functions.csv",
    preferred: [
      "function_name",
      "parent_function",
      "executive_owner",
      "business_capabilities",
      "criticality",
      "annual_budget_usd",
      "current_state_notes",
      "known_gaps",
    ],
    chain: ["Function", "Executive owner", "Systems", "Processes", "AI use cases"],
  },
  {
    key: "org",
    label: "Org Ownership",
    file: "02_org_ownership.csv",
    preferred: [
      "org_unit_name",
      "business_name",
      "function_name",
      "owner_role",
      "executive_owner",
      "operating_model",
      "confidence",
      "known_gaps",
    ],
    chain: ["Org unit", "Leader", "Function", "Decision rights", "Evidence"],
  },
  {
    key: "workforce",
    label: "Workforce Roles",
    file: "03_workforce_roles.csv",
    preferred: [
      "role_name",
      "persona_name",
      "stakeholder_role",
      "business_function",
      "executive_owner",
      "fte_count",
      "known_challenge",
      "confidence",
    ],
    chain: ["Role", "Function", "Process", "System", "Decision"],
  },
  {
    key: "apps",
    label: "Applications & Systems",
    file: "04_applications_systems.csv",
    preferred: [
      "system_name",
      "system_category",
      "business_function",
      "deployment_model",
      "hosting_location",
      "criticality",
      "business_owner",
      "technology_owner",
    ],
    chain: ["Function", "Application", "Data", "Vendor", "Risk"],
  },
  {
    key: "data",
    label: "Data Assets & Integrations",
    file: "05_data_assets_integrations.csv",
    preferred: [
      "data_asset_name",
      "data_domain",
      "source_system",
      "target_system",
      "integration_type",
      "platform_or_database",
      "data_owner",
      "quality_status",
    ],
    chain: ["Source system", "Data asset", "Target platform", "Owner", "Quality gate"],
  },
  {
    key: "infra",
    label: "Infrastructure & Platforms",
    file: "06_infrastructure_platforms.csv",
    preferred: [
      "platform_name",
      "infrastructure_name",
      "system_name",
      "platform_type",
      "deployment_model",
      "hosting_location",
      "criticality",
      "owner",
    ],
    chain: ["Platform", "Hosted systems", "Data estate", "Security", "Resilience"],
  },
  {
    key: "vendors",
    label: "Vendors & Contracts",
    file: "07_vendors_contracts.csv",
    preferred: [
      "vendor_name",
      "contract_name",
      "service_category",
      "business_owner",
      "contract_owner",
      "annual_spend_usd",
      "renewal_date",
      "supported_systems",
    ],
    chain: ["Vendor", "Contract", "Service", "System", "Commercial risk"],
  },
  {
    key: "budget",
    label: "IT Budget, Spend & Value",
    file: "08_it_budget_spend_value.csv",
    aliases: ["08_spend_value.csv"],
    preferred: [
      "spend_category",
      "business_function",
      "amount_usd",
      "budget_usd",
      "run_budget_usd",
      "change_budget_usd",
      "value_hypothesis",
      "confidence",
    ],
    chain: ["Budget", "Function", "Program", "Value claim", "Finance validation"],
  },
  {
    key: "programs",
    label: "Programs & Initiatives",
    file: "09_programs_initiatives.csv",
    preferred: [
      "program_name",
      "business_sponsor",
      "technology_owner",
      "objective",
      "status",
      "phase",
      "dependencies",
      "budget_usd",
    ],
    chain: ["Program", "Sponsor", "Systems", "Dependencies", "Outcome"],
  },
  {
    key: "ai",
    label: "AI & Automation Use Cases",
    file: "10_ai_automation_use_cases.csv",
    preferred: [
      "use_case_name",
      "business_function",
      "process_area",
      "ai_pattern",
      "current_status",
      "value_hypothesis",
      "required_data",
      "required_systems",
    ],
    chain: ["Use case", "Process", "Data", "Systems", "Risk controls"],
  },
  {
    key: "risks",
    label: "Risks & Controls",
    file: "11_risks_controls.csv",
    preferred: [
      "risk_name",
      "risk_or_gap",
      "use_case",
      "affected_systems",
      "control_owner",
      "risk_level",
      "metric_boundary",
      "forbidden_claims",
    ],
    chain: ["Risk", "Affected system", "Control", "Owner", "Decision boundary"],
  },
  {
    key: "rel",
    label: "Relationships",
    file: "12_relationships.csv",
    preferred: [
      "from_object_name",
      "from_object_type",
      "relationship_type",
      "to_object_name",
      "to_object_type",
      "relationship_strength",
      "evidence_basis",
      "confidence",
    ],
    chain: ["Source node", "Relationship", "Target node", "Evidence", "Decision path"],
  },
  {
    key: "evidence",
    label: "Evidence Sources",
    file: "13_evidence_sources.csv",
    preferred: [
      "source_file",
      "source_type",
      "source_owner",
      "source_date",
      "domains_covered",
      "row_count_or_pages",
      "approved_for_loading",
      "known_gaps",
    ],
    chain: ["File", "Owner", "Loaded rows", "Dimensions", "Evidence boundary"],
  },
  {
    key: "metrics",
    label: "Metrics & Outcomes",
    file: "14_metrics_outcomes.csv",
    preferred: [
      "metric_name",
      "business_function",
      "baseline_value",
      "target_value",
      "current_value",
      "metric_owner",
      "measurement_status",
      "confidence",
    ],
    chain: ["Metric", "Baseline", "Target", "Actual", "Owner"],
  },
  {
    key: "industry",
    label: "Industry Context Patterns",
    file: "15_industry_context_patterns.csv",
    preferred: [
      "pattern_name",
      "industry_context",
      "signals",
      "business_function",
      "module_next_actions",
      "confidence",
      "source_file",
      "known_gaps",
    ],
    chain: ["Industry pattern", "Tenant signal", "Use case", "Evidence needed", "Module"],
  },
  {
    key: "lenses",
    label: "Expert Lenses",
    file: "16_expert_lenses.csv",
    preferred: [
      "expert_lens_name",
      "lens_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
      "source_file",
      "known_gaps",
    ],
    chain: ["Expert lens", "Signal", "Function", "Decision", "Evidence"],
  },
  {
    key: "ms",
    label: "Managed Services Scope",
    file: "17_managed_services_scope.csv",
    aliases: ["17_service_scope_managed_services.csv"],
    preferred: [
      "service_tower",
      "service",
      "owning_function",
      "linked_systems",
      "vendor_name",
      "contract_risk",
      "pricing_basis",
      "confidence",
    ],
    chain: ["Service tower", "Vendor", "System", "Contract risk", "Source handoff"],
  },
  {
    key: "opev",
    label: "Operational Process Evidence",
    file: "18_operational_process_evidence.csv",
    preferred: [
      "process_name",
      "business_function",
      "process_owner",
      "systems_used",
      "volume_metric",
      "pain_points",
      "control_points",
      "automation_candidate",
    ],
    chain: ["Process", "Owner", "Systems", "Volume", "Automation candidate"],
  },
];

const NON_PREVIEW_COLUMNS = new Set([
  "tenant_key",
  "record_key",
  "source_fingerprint",
  "original_source_file",
  "original_packet",
  "original_row_number",
  "original_row_id",
  "consolidation_rule_used",
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function exists(file) {
  return fs.existsSync(file);
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function scrubText(value, tenant) {
  let text = compactText(value);
  for (const [pattern, replacement] of tenant.scrub) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function scrubValue(value, tenant) {
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, tenant));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrubValue(item, tenant)]),
    );
  }
  if (typeof value === "string") return scrubText(value, tenant);
  return value;
}

function activeRoot(tenant) {
  return path.join(
    repoRoot,
    "datasets/tenant-inputs/active",
    tenant.sourceKey,
    "current",
  );
}

function sourceFileFor(root, dimension) {
  const candidates = [dimension.file, ...(dimension.aliases ?? [])];
  return candidates.find((file) => exists(path.join(root, file))) ?? null;
}

function activeRows(root, dimension) {
  const sourceFile = sourceFileFor(root, dimension);
  if (!sourceFile) return { rows: [], sourceFile: null };
  const rows = readCsv(path.join(root, sourceFile)).filter((row) => {
    const status = compactText(row.active_candidate_status ?? row.status).toLowerCase();
    return !/^(retired|inactive|blocked|rejected|deleted)$/.test(status);
  });
  return { rows, sourceFile };
}

function firstString(row, keys) {
  for (const key of keys) {
    const value = compactText(row[key]);
    if (value) return value;
  }
  return "";
}

function valueList(value) {
  return compactText(value)
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter((item) => item && !/^not_provided$/i.test(item))
    .slice(0, 20);
}

function topValues(rows, keys, limit = 5) {
  const counts = new Map();
  for (const row of rows) {
    for (const key of keys) {
      for (const value of valueList(row[key])) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function evidenceStatus(rows) {
  if (!rows.length) return "not-evidenced";
  const text = rows.map((row) => JSON.stringify(row)).join(" ").toLowerCase();
  if (/needs evidence|not evidenced|not_provided|unknown|gap/.test(text)) {
    return rows.length > 8 ? "directional" : "needs-evidence";
  }
  if (/low/.test(text)) return "directional";
  return "source-backed";
}

function statusPct(status) {
  if (status === "source-backed") return "90%";
  if (status === "directional") return "70%";
  if (status === "needs-evidence") return "45%";
  return "0%";
}

function evidenceRefCount(rows) {
  const refs = new Set();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (/evidence|source_file|source_record|record_id/i.test(key)) {
        for (const item of valueList(value)) refs.add(item);
      }
    }
  }
  return refs.size || rows.length;
}

function humanize(key) {
  return compactText(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function columnsFor(dimension, rows) {
  const headers = new Set(rows.flatMap((row) => Object.keys(row)));
  const preferred = dimension.preferred.filter((key) => headers.has(key));
  const fallback = [...headers].filter(
    (key) =>
      !preferred.includes(key) &&
      !NON_PREVIEW_COLUMNS.has(key) &&
      rows.some((row) => compactText(row[key])),
  );
  return [...preferred, ...fallback].slice(0, 8).map((key) => ({
    k: key,
    label: humanize(key),
    pill: /status|confidence|readiness|quality|criticality/i.test(key)
      ? "status"
      : undefined,
  }));
}

function rowName(row) {
  return firstString(row, [
    "entity_name",
    "function_name",
    "org_unit_name",
    "role_name",
    "persona_name",
    "stakeholder_role",
    "system_name",
    "data_asset_name",
    "platform_name",
    "vendor_name",
    "contract_name",
    "program_name",
    "initiative_name",
    "use_case_name",
    "risk_name",
    "risk_or_gap",
    "source_file",
    "metric_name",
    "pattern_name",
    "expert_lens_name",
    "service_tower",
    "process_name",
    "from_object_name",
    "to_object_name",
  ]);
}

function projectRows(rows, columns, tenant) {
  return rows.map((row) => {
    const output = {};
    for (const column of columns) {
      output[column.k] = scrubValue(row[column.k] ?? "", tenant);
    }
    for (const key of ["evidence_id", "evidence_refs", "source_file", "source_date"]) {
      if (row[key]) output[key] = scrubValue(row[key], tenant);
    }
    return output;
  });
}

function sourceFileCard(root, dimension, sourceFile, rows, evidenceByFile, tenant) {
  if (!sourceFile) {
    return {
      name: `${dimension.label} source file`,
      type: "csv",
      date: "",
      rows: "0",
      facts: "0 rows loaded",
      status: "missing",
      fields: "No current file found",
      supports: `${dimension.label} cannot render a source-backed data tab until a current file is loaded.`,
      missing: `Load ${dimension.file}.`,
    };
  }
  const filePath = path.join(root, sourceFile);
  const stat = fs.statSync(filePath);
  const evidenceRows = evidenceByFile.get(sourceFile) ?? [];
  const owner = firstString(evidenceRows[0] ?? {}, [
    "source_owner",
    "data_provider_name",
    "owner",
  ]);
  const sourceDate = firstString(evidenceRows[0] ?? {}, [
    "source_date",
    "as_of_date",
  ]);
  const knownGaps = firstString(evidenceRows[0] ?? {}, ["known_gaps", "quality_notes"]);
  const headers = fs.readFileSync(filePath, "utf8").split(/\r?\n/, 1)[0] ?? "";
  return scrubValue(
    {
      name: sourceFile,
      type: "csv",
      date: sourceDate || stat.mtime.toISOString().slice(0, 10),
      rows: rows.length.toLocaleString(),
      facts: `${rows.length.toLocaleString()} current rows`,
      st: owner ? `Owner: ${owner}` : "Owner not supplied",
      status: evidenceStatus(rows),
      fields: `${headers.split(",").length} columns · ${(stat.size / 1024).toFixed(1)} KB`,
      supports: `${dimension.label} source preview, filters, relationship extraction, and evidence-bound aVa grounding.`,
      missing: knownGaps || "Client certification, owner attestation, and refresh cadence should be confirmed before board-grade use.",
    },
    tenant,
  );
}

function evidenceIndex(root) {
  const file = path.join(root, "13_evidence_sources.csv");
  const map = new Map();
  if (!exists(file)) return map;
  for (const row of readCsv(file)) {
    const source = path.basename(compactText(row.source_file));
    if (!source) continue;
    const list = map.get(source) ?? [];
    list.push(row);
    map.set(source, list);
  }
  return map;
}

function loadApprovedStoryBlocks(tenant) {
  const candidates = [
    path.join(
      repoRoot,
      "datasets/context-artifacts/approved",
      tenant.legacyApprovedKey,
      "home-knowledge/approved-cxo-story-blocks.json",
    ),
    path.join(
      repoRoot,
      "datasets/tenant-inputs",
      tenant.routeKey,
      "approved-content/home/story-blocks.json",
    ),
  ];
  for (const file of candidates) {
    if (!exists(file)) continue;
    const payload = readJson(file);
    const blocks = Array.isArray(payload) ? payload : payload.story_blocks ?? [];
    if (blocks.length) return scrubValue(blocks, tenant);
  }
  return [];
}

function storyBlockFor(blocks, dimension) {
  const label = dimension.label.toLowerCase();
  return blocks.find((block) => {
    const dim = compactText(block.dimension).toLowerCase();
    const title = compactText(block.title).toLowerCase();
    return dim.includes(label.split(" ")[0]) || title.includes(label.split(" ")[0]);
  });
}

function dimensionStory(tenant, dimension, rows, blocks) {
  const block = storyBlockFor(blocks, dimension);
  const status = evidenceStatus(rows);
  const top = topValues(rows, [
    "business_function",
    "system_category",
    "data_domain",
    "service_category",
    "process_area",
    "criticality",
    "current_status",
    "quality_status",
  ]);
  const topText = top.length
    ? ` Most visible patterns: ${top.map((item) => `${item.label} (${item.count})`).join(", ")}.`
    : "";
  const summary =
    block?.executive_summary ||
    `${tenant.displayName} has ${rows.length.toLocaleString()} ${dimension.label.toLowerCase()} records loaded.${topText}`;
  return {
    meaning: summary,
    observed:
      block?.what_context_reveals ||
      `${dimension.label} is ${statusLabel(status)}: ${rows.length.toLocaleString()} rows are available for CXO context, current-state grounding, and module handoff.${topText}`,
    matters:
      block?.why_it_matters ||
      `This context decides whether aVa can answer like a client-aware advisor instead of a generic model. The more complete this layer is, the easier it is to tie AI recommendations to real systems, owners, vendors, processes, metrics, and evidence gaps.`,
    supports:
      block?.decision_implication ||
      `${dimension.label} supports prioritization, evidence requests, and module routing across Intelligence, Moves, Source, and Tower when its owners and source files are confirmed.`,
  };
}

function statusLabel(status) {
  if (status === "source-backed") return "source-backed";
  if (status === "directional") return "directional";
  if (status === "needs-evidence") return "needs-evidence";
  return "not-evidenced";
}

function dimensionInsights(dimension, rows) {
  const topA = topValues(rows, [
    "business_function",
    "parent_function",
    "system_category",
    "data_domain",
    "service_category",
    "process_area",
    "ai_pattern",
  ]);
  const topB = topValues(rows, [
    "criticality",
    "current_status",
    "quality_status",
    "readiness_status",
    "risk_level",
    "deployment_model",
    "hosting_location",
  ]);
  const findings = [
    rows.length
      ? `${rows.length.toLocaleString()} loaded rows give ${dimension.label.toLowerCase()} enough surface area for client-specific exploration.`
      : `No loaded rows are available yet for ${dimension.label.toLowerCase()}.`,
    topA.length
      ? `The strongest clusters are ${topA.map((item) => `${item.label} (${item.count})`).join(", ")}.`
      : "The loaded file has no repeated business cluster strong enough to summarize yet.",
    topB.length
      ? `Operational posture is concentrated around ${topB.map((item) => `${item.label} (${item.count})`).join(", ")}.`
      : "Readiness and operating posture fields need richer client completion.",
  ];
  return {
    findings,
    breakdown: {
      title: `${dimension.label} evidence posture`,
      rows: [
        { label: "Loaded rows", value: rows.length.toLocaleString() },
        { label: "Evidence status", value: statusLabel(evidenceStatus(rows)) },
        { label: "Distinct record names", value: String(new Set(rows.map(rowName).filter(Boolean)).size) },
      ],
    },
  };
}

function dimensionGaps(dimension, rows) {
  const text = rows.map((row) => JSON.stringify(row)).join(" ").toLowerCase();
  const gaps = [];
  if (!rows.length) {
    gaps.push({
      missing: `${dimension.label} source rows`,
      blocks: "The cockpit cannot show a source-backed summary or support client-grounded aVa answers for this dimension.",
      needed: `Load and approve ${dimension.file}.`,
      handoff: "Knowledge",
    });
  }
  if (/not_provided|unknown|needs evidence|gap/.test(text)) {
    gaps.push({
      missing: "Client-confirmed field completion",
      blocks: `${dimension.label} can support exploration, but unsupported claims should stay caveated until owners validate missing fields.`,
      needed: "Owner, source date, validation status, and evidence references for the highest-value rows.",
      handoff: handoffForDimension(dimension.key),
    });
  }
  if (dimension.key === "rel") {
    gaps.push({
      missing: "Graph materialization proof",
      blocks: "Relationship tabs and aVa path reasoning are weaker if source references are not converted into graph edges.",
      needed: "Run the relationship derivation job after each tenant context load and review unresolved endpoint rows.",
      handoff: "Knowledge",
    });
  }
  if (!gaps.length) {
    gaps.push({
      missing: "Board-grade certification",
      blocks: "The demo data is useful for planning, but a client executive still needs source-owner attestation before board use.",
      needed: "Evidence owner, refresh cadence, and source-system certification.",
      handoff: handoffForDimension(dimension.key),
    });
  }
  return gaps;
}

function handoffForDimension(key) {
  if (["vendors", "ms"].includes(key)) return "Source";
  if (["budget", "metrics"].includes(key)) return "Tower";
  if (["programs", "ai", "workforce", "org"].includes(key)) return "Moves";
  return "Knowledge";
}

function graphNodeId(tenant, type, name) {
  const key = `${tenant.routeKey}:${type}:${name}`.toLowerCase();
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);
}

function edgeId(tenant, fromType, fromName, rel, toType, toName) {
  const key = `${tenant.routeKey}:${fromType}:${fromName}:${rel}:${toType}:${toName}`.toLowerCase();
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 18);
}

function addEdge(graph, tenant, edge) {
  const fromName = scrubText(edge.fromName, tenant);
  const toName = scrubText(edge.toName, tenant);
  const rel = compactText(edge.relationshipType);
  const fromType = compactText(edge.fromType || "entity");
  const toType = compactText(edge.toType || "entity");
  if (!fromName || !toName || !rel) return false;
  if (fromName.toLowerCase() === toName.toLowerCase()) {
    graph.selfLoopsFiltered += 1;
    return false;
  }
  const id = edgeId(tenant, fromType, fromName, rel, toType, toName);
  if (graph.edgeIds.has(id)) return false;
  const fromId = graphNodeId(tenant, fromType, fromName);
  const toId = graphNodeId(tenant, toType, toName);
  graph.nodes.set(fromId, { id: fromId, label: fromName, type: fromType });
  graph.nodes.set(toId, { id: toId, label: toName, type: toType });
  graph.edgeIds.add(id);
  graph.edges.push({
    id,
    edge_id: id,
    tenant_key: tenant.routeKey,
    from_object_id: fromId,
    from_object_type: fromType,
    from_object_name: fromName,
    relationship_type: rel,
    to_object_id: toId,
    to_object_type: toType,
    to_object_name: toName,
    relationship_strength: compactText(edge.relationshipStrength || "directional"),
    evidence_basis: scrubText(edge.evidenceBasis || edge.sourceFile || "derived from active source rows", tenant),
    source_file: edge.sourceFile ?? "",
    source_row_number: edge.sourceRowNumber ?? "",
    derivation_method: edge.derivationMethod ?? "field_cross_reference",
    active_candidate_status: edge.activeCandidateStatus ?? "active_source_derived",
    confidence: edge.confidence ?? "medium",
  });
  return true;
}

function addSplitEdges(graph, tenant, row, fromType, fromName, relationshipType, toType, value, sourceFile, derivationMethod) {
  for (const item of valueList(value)) {
    addEdge(graph, tenant, {
      fromType,
      fromName,
      relationshipType,
      toType,
      toName: item,
      relationshipStrength: row.relationship_strength || row.criticality || "directional",
      evidenceBasis: row.evidence_basis || row.source_file || sourceFile,
      sourceFile,
      sourceRowNumber: row.__sourceRowNumber,
      derivationMethod,
      confidence: row.confidence || "medium",
    });
  }
}

function buildRelationshipGraph(tenant, dataByKey) {
  const graph = {
    nodes: new Map(),
    edges: [],
    edgeIds: new Set(),
    selfLoopsFiltered: 0,
    unresolvedEndpointRows: 0,
  };

  for (const row of dataByKey.rel?.rows ?? []) {
    const fromName = firstString(row, ["from_object_name", "from_object_ref"]);
    const toName = firstString(row, ["to_object_name", "to_object_ref"]);
    if (!fromName || !toName) graph.unresolvedEndpointRows += 1;
    addEdge(graph, tenant, {
      fromType: row.from_object_type || "entity",
      fromName,
      relationshipType: row.relationship_type,
      toType: row.to_object_type || "entity",
      toName,
      relationshipStrength: row.relationship_strength,
      evidenceBasis: row.evidence_basis,
      sourceFile: dataByKey.rel.sourceFile,
      sourceRowNumber: row.__sourceRowNumber,
      derivationMethod: "explicit_relationship_row",
      confidence: row.confidence,
    });
  }

  for (const row of dataByKey.functions?.rows ?? []) {
    const fn = firstString(row, ["function_name", "business_name"]);
    addSplitEdges(graph, tenant, row, "function", fn, "owned_by", "leader", row.executive_owner, dataByKey.functions.sourceFile, "function_owner_field");
  }
  for (const row of dataByKey.apps?.rows ?? []) {
    const system = firstString(row, ["system_name", "application_name", "business_name"]);
    addSplitEdges(graph, tenant, row, "function", row.business_function, "uses", "system", system, dataByKey.apps.sourceFile, "app_business_function_field");
    addSplitEdges(graph, tenant, row, "leader", row.business_owner, "owns_business_use_of", "system", system, dataByKey.apps.sourceFile, "app_owner_field");
    addSplitEdges(graph, tenant, row, "leader", row.technology_owner, "owns_technology_for", "system", system, dataByKey.apps.sourceFile, "app_technology_owner_field");
    addSplitEdges(graph, tenant, row, "system", system, "integrates_with", "system", row.integrations, dataByKey.apps.sourceFile, "app_integrations_field");
    addSplitEdges(graph, tenant, row, "system", system, "depends_on_data", "data_domain", row.data_dependencies, dataByKey.apps.sourceFile, "app_data_dependency_field");
  }
  for (const row of dataByKey.data?.rows ?? []) {
    const asset = firstString(row, ["data_asset_name", "data_domain", "business_name"]);
    addSplitEdges(graph, tenant, row, "system", row.source_system, "feeds", "data_asset", asset, dataByKey.data.sourceFile, "data_source_system_field");
    addSplitEdges(graph, tenant, row, "data_asset", asset, "feeds", "system", row.target_system, dataByKey.data.sourceFile, "data_target_system_field");
    addSplitEdges(graph, tenant, row, "owner", row.data_owner, "owns", "data_asset", asset, dataByKey.data.sourceFile, "data_owner_field");
    addSplitEdges(graph, tenant, row, "data_asset", asset, "runs_on", "platform", row.platform_or_database, dataByKey.data.sourceFile, "data_platform_field");
  }
  for (const row of dataByKey.vendors?.rows ?? []) {
    const vendor = firstString(row, ["vendor_name"]);
    const contract = firstString(row, ["contract_name", "service_category"]);
    addSplitEdges(graph, tenant, row, "vendor", vendor, "provides", "contract", contract, dataByKey.vendors.sourceFile, "vendor_contract_field");
    addSplitEdges(graph, tenant, row, "vendor", vendor, "supports", "system", row.supported_systems || row.linked_systems, dataByKey.vendors.sourceFile, "vendor_supported_systems_field");
    addSplitEdges(graph, tenant, row, "owner", row.business_owner || row.contract_owner, "owns_relationship_with", "vendor", vendor, dataByKey.vendors.sourceFile, "vendor_owner_field");
  }
  for (const row of dataByKey.programs?.rows ?? []) {
    const program = firstString(row, ["program_name", "initiative_name", "business_name"]);
    addSplitEdges(graph, tenant, row, "program", program, "sponsored_by", "leader", row.business_sponsor, dataByKey.programs.sourceFile, "program_sponsor_field");
    addSplitEdges(graph, tenant, row, "program", program, "depends_on", "dependency", row.dependencies, dataByKey.programs.sourceFile, "program_dependencies_field");
    addSplitEdges(graph, tenant, row, "leader", row.technology_owner, "owns_technology_for", "program", program, dataByKey.programs.sourceFile, "program_technology_owner_field");
  }
  for (const row of dataByKey.ai?.rows ?? []) {
    const useCase = firstString(row, ["use_case_name", "ai_use_case", "business_name"]);
    addSplitEdges(graph, tenant, row, "function", row.business_function, "has_ai_use_case", "ai_use_case", useCase, dataByKey.ai.sourceFile, "ai_function_field");
    addSplitEdges(graph, tenant, row, "process", row.process_area, "is_automated_by", "ai_use_case", useCase, dataByKey.ai.sourceFile, "ai_process_field");
    addSplitEdges(graph, tenant, row, "ai_use_case", useCase, "requires_data", "data_domain", row.required_data, dataByKey.ai.sourceFile, "ai_required_data_field");
    addSplitEdges(graph, tenant, row, "ai_use_case", useCase, "requires_system", "system", row.required_systems, dataByKey.ai.sourceFile, "ai_required_systems_field");
  }
  for (const row of dataByKey.risks?.rows ?? []) {
    const risk = firstString(row, ["risk_name", "risk_or_gap", "control_name"]);
    addSplitEdges(graph, tenant, row, "risk", risk, "affects", "system", row.affected_systems, dataByKey.risks.sourceFile, "risk_affected_systems_field");
    addSplitEdges(graph, tenant, row, "owner", row.control_owner, "owns_control_for", "risk", risk, dataByKey.risks.sourceFile, "risk_owner_field");
  }
  for (const row of dataByKey.opev?.rows ?? []) {
    const processName = firstString(row, ["process_name", "process"]);
    addSplitEdges(graph, tenant, row, "function", row.business_function, "operates_process", "process", processName, dataByKey.opev.sourceFile, "process_function_field");
    addSplitEdges(graph, tenant, row, "process", processName, "uses", "system", row.systems_used, dataByKey.opev.sourceFile, "process_systems_field");
    addSplitEdges(graph, tenant, row, "owner", row.process_owner, "owns", "process", processName, dataByKey.opev.sourceFile, "process_owner_field");
  }

  const nodes = [...graph.nodes.values()].sort((a, b) => a.label.localeCompare(b.label));
  const edges = graph.edges.sort((a, b) => a.edge_id.localeCompare(b.edge_id));
  return {
    tenant_key: tenant.routeKey,
    source_tenant_key: tenant.sourceKey,
    generated_at: generatedAt,
    graph_basis: "active CSV cross-reference fields plus explicit relationship rows",
    nodes,
    edges,
    quality_report: {
      node_count: nodes.length,
      edge_count: edges.length,
      self_loops_filtered: graph.selfLoopsFiltered,
      unresolved_explicit_relationship_rows: graph.unresolvedEndpointRows,
      source_files_used: Object.values(dataByKey)
        .map((item) => item.sourceFile)
        .filter(Boolean),
      caveat:
        "Relationship graph is source-derived and planning-grade until an ACA data-build job promotes it into the governed Azure graph substrate.",
    },
  };
}

function dataViewFor(dimension, rows, sourceFile, tenant, graph) {
  const workingRows =
    dimension.key === "rel" && graph?.edges?.length
      ? graph.edges
      : rows;
  const columns =
    dimension.key === "rel" && graph?.edges?.length
      ? [
          { k: "from_object_name", label: "From" },
          { k: "relationship_type", label: "Relationship" },
          { k: "to_object_name", label: "To" },
          { k: "relationship_strength", label: "Strength", pill: "status" },
          { k: "source_file", label: "Source File" },
          { k: "derivation_method", label: "Derived From" },
        ]
      : columnsFor(dimension, rows);
  return {
    columns,
    rows: projectRows(workingRows, columns, tenant),
    facet: columns.find((column) =>
      /function|category|domain|owner|status|criticality|type/i.test(column.k),
    )?.k,
    row_count: workingRows.length,
    source_file: sourceFile,
  };
}

function buildFacts(tenant, profileRows, dataByKey, graph) {
  const profile = profileRows[0] ?? {};
  const revenue = Number(profile.revenue_usd || 0);
  const employees = Number(profile.employee_count || 0);
  const budget = compactText(profile.strategic_priorities).match(/technology_budget_usd:(\d+)/i)?.[1];
  const facts = [
    { label: "Industry", value: scrubText(profile.industry || "Demo tenant", tenant) },
    { label: "Employees", value: employees ? employees.toLocaleString() : "Not provided" },
    {
      label: tenant.routeKey === "lakeshore-holdings" ? "Portfolio revenue" : "Revenue",
      value:
        tenant.routeKey === "lakeshore-holdings"
          ? "$7.12B portfolio rollup; $0 direct holdco revenue"
          : revenue
            ? formatUsd(revenue)
            : "Not provided",
    },
    { label: "Technology budget", value: budget ? formatUsd(Number(budget)) : "Needs validation" },
    { label: "Applications", value: String(dataByKey.apps?.rows?.length ?? 0) },
    { label: "Data assets", value: String(dataByKey.data?.rows?.length ?? 0) },
    { label: "Vendors", value: String(dataByKey.vendors?.rows?.length ?? 0) },
    { label: "AI candidates", value: String(dataByKey.ai?.rows?.length ?? 0) },
    { label: "Graph edges", value: graph.edges.length.toLocaleString() },
    { label: "Evidence files", value: String(dataByKey.evidence?.rows?.length ?? 0) },
  ];
  return scrubValue(facts, tenant);
}

function formatUsd(value) {
  if (!Number.isFinite(value) || value <= 0) return "Not provided";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function buildUseCases(tenant, rows) {
  return rows.slice(0, 8).map((row) =>
    scrubValue(
      {
        name: firstString(row, ["use_case_name", "ai_use_case", "business_name"]) || "AI opportunity",
        fn: firstString(row, ["business_function", "process_area"]) || "Owner to confirm",
        stage: firstString(row, ["current_status", "use_case_status", "readiness_status"]) || "Planning-grade",
        value: firstString(row, ["value_hypothesis", "value_outcome", "target_or_promise"]) || "Value hypothesis needs validation",
        gate: firstString(row, ["evidence_needed", "required_data", "risk_controls"]) || "Confirm data, systems, controls, and owner evidence.",
        readiness: firstString(row, ["readiness_status", "current_status"]) || "directional",
      },
      tenant,
    ),
  );
}

function buildPack(tenant) {
  const root = activeRoot(tenant);
  if (!exists(root)) throw new Error(`Missing active current root for ${tenant.sourceKey}`);
  const evidenceByFile = evidenceIndex(root);
  const blocks = loadApprovedStoryBlocks(tenant);
  const dataByKey = {};
  for (const dimension of DIMENSIONS) {
    const { rows, sourceFile } = activeRows(root, dimension);
    dataByKey[dimension.key] = { rows, sourceFile };
  }
  const graph = buildRelationshipGraph(tenant, dataByKey);
  const dims = [];
  const data = {};
  const stories = {};
  const insights = {};
  const rel = {};
  const dgaps = {};
  const evid = {};
  const visualBlocks = {};

  for (const dimension of DIMENSIONS) {
    const source = dataByKey[dimension.key];
    const rows = source.rows;
    const status = dimension.key === "rel" && graph.edges.length
      ? "source-backed"
      : evidenceStatus(rows);
    const story = dimensionStory(tenant, dimension, rows, blocks);
    dims.push({
      key: dimension.key,
      name: dimension.label,
      count: dimension.key === "rel" && graph.edges.length ? graph.edges.length : rows.length,
      status,
      pct: statusPct(status),
      evCount: evidenceRefCount(rows),
      summary: story.meaning,
      covers: topValues(rows, [
        "business_function",
        "system_category",
        "data_domain",
        "service_category",
        "process_area",
      ]).map((item) => `${item.label} (${item.count})`),
      sources: source.sourceFile
        ? [`${source.sourceFile} — ${rows.length.toLocaleString()} active rows`]
        : [`${dimension.file} — missing`],
    });
    stories[dimension.key] = story;
    insights[dimension.key] = dimensionInsights(dimension, rows);
    rel[dimension.key] = {
      chain: dimension.chain,
      note:
        dimension.key === "rel"
          ? `${graph.edges.length.toLocaleString()} source-derived relationship edges connect systems, functions, data, vendors, programs, processes, and risks.`
          : `${dimension.label} connects through ${dimension.chain.join(" → ")}. Use the Relationships dimension for the full graph slice.`,
    };
    dgaps[dimension.key] = dimensionGaps(dimension, rows);
    evid[dimension.key] = [sourceFileCard(root, dimension, source.sourceFile, rows, evidenceByFile, tenant)];
    data[dimension.key] = dataViewFor(dimension, rows, source.sourceFile, tenant, graph);
    visualBlocks[dimension.key] = [
      {
        type: "metric_strip",
        title: `${dimension.label} context snapshot`,
        subtitle: "Loaded rows, evidence posture, and relationship relevance.",
        data: {
          rows: rows.length,
          status,
          evidence_items: evidenceRefCount(rows),
          relationship_edges: dimension.key === "rel" ? graph.edges.length : undefined,
        },
      },
    ];
  }

  const evidenceCards = DIMENSIONS.map((dimension) => evid[dimension.key][0]);
  const useCases = buildUseCases(tenant, dataByKey.ai.rows);
  const topGaps = DIMENSIONS.flatMap((dimension) =>
    dgaps[dimension.key].slice(0, 1).map((gap) => ({
      title: gap.missing,
      blocks: gap.blocks,
      type: dimension.label,
      severity: dimension.key === "rel" ? "High" : "Medium",
    })),
  ).slice(0, 10);

  const profileRows = dataByKey.profile.rows;
  const pack = scrubValue(
    {
      tenant_key: tenant.routeKey,
      tenant_name: tenant.displayName,
      artifact_type: "NexusHomeKnowledgeDesignContractPack",
      prompt_version: "home-tenant-coverage-deterministic-v1",
      generated_model: "deterministic-active-source-generator",
      generated_at: generatedAt,
      design_contract_source:
        "scripts/knowledge/generate-home-tenant-coverage-artifacts.mjs",
      source_context: {
        canonical_input_location: path.relative(repoRoot, root),
        source_tenant_key: tenant.sourceKey,
        relationship_graph:
          `datasets/tenant-inputs/${tenant.routeKey}/derived/relationship-graph.json`,
        boundary: tenant.boundary,
      },
      design_slots: {
        DIMS: dims,
        FACTS: buildFacts(tenant, profileRows, dataByKey, graph),
        KPIS: [
          { label: "Dimensions loaded", value: `${DIMENSIONS.length}/19` },
          { label: "Source rows", value: String(Object.values(dataByKey).reduce((sum, item) => sum + item.rows.length, 0)) },
          { label: "Graph edges", value: graph.edges.length.toLocaleString() },
          { label: "Evidence posture", value: graph.edges.length ? "Relationship-ready" : "Needs relationship data" },
        ],
        BRIEF_COLS: [
          {
            title: "Operating context",
            body: `${tenant.displayName} has ${Object.values(dataByKey).reduce((sum, item) => sum + item.rows.length, 0).toLocaleString()} active context rows across enterprise, systems, data, vendors, AI, risks, evidence, and metrics.`,
          },
          {
            title: "AI constraint",
            body: "AI recommendations should stay tied to current systems, owners, data readiness, controls, and evidence gaps instead of generic industry claims.",
          },
          {
            title: "Strategic implication",
            body: "The cockpit is the landing point for deciding what aVa can safely ground, what needs client confirmation, and which module should act next.",
          },
          {
            title: "Evidence boundary",
            body: tenant.boundary,
          },
        ],
        PRIORITIES: useCases.slice(0, 5).map((item) => ({
          title: item.name,
          body: item.gate,
          owner: item.fn,
          status: item.stage,
        })),
        SIGNALS: topValues(dataByKey.apps.rows.concat(dataByKey.data.rows), [
          "business_function",
          "system_category",
          "data_domain",
          "hosting_location",
        ], 6).map((item) => ({
          title: item.label,
          body: `${item.count} loaded references across systems/data context.`,
        })),
        DEC_CAN: [
          "Ground aVa answers in the tenant's loaded systems, data, vendors, programs, AI use cases, risks, and evidence files.",
          "Show source rows and file-level evidence behind each dimension.",
          "Trace planning-grade relationships across functions, systems, data, vendors, programs, processes, and risks.",
        ],
        DEC_CANNOT: [
          "Claim board-certified financials, realized value, or production readiness without source-owner validation.",
          "Treat synthetic demo context as real client production evidence.",
          "Use stale aliases or retired tenant source folders as active context.",
        ],
        CONF_TABLE: dims.map((dimension) => ({
          dimension: dimension.name,
          status: dimension.status,
          rows: dimension.count,
          evidence_items: dimension.evCount,
          decision_boundary: dimension.status === "source-backed" ? "usable for planning" : "needs client confirmation",
        })),
        GAPS: topGaps,
        USE_CASES: useCases,
        EVIDENCE: evidenceCards,
        NEXT_EVIDENCE: topGaps.map((gap) => ({
          item: gap.title,
          unlocks: gap.blocks,
          owner_hint: gap.type,
        })),
        DATA: data,
        INSIGHTS: insights,
        STORY: stories,
        REL: rel,
        DGAPS: dgaps,
        EVID: evid,
        VISUAL_BLOCKS: visualBlocks,
      },
      narrative_sections: {
        enterprise_brief_title: `${tenant.displayName} — Enterprise Context Cockpit`,
        enterprise_brief_summary:
          `${tenant.displayName} now has an approved Home design pack sourced from active tenant CSVs. The cockpit should tell a CXO what context is loaded, why it matters for AI success, which evidence is missing, and where Intelligence, Moves, Source, and Tower should take over.`,
        context_confidence_summary:
          "Context confidence separates loaded data from board-grade truth. Stronger answers require source-owner validation, relationship materialization, and evidence lineage.",
        evidence_gaps_summary:
          "Evidence gaps are framed as business blockers: what cannot be claimed yet, what source evidence is needed, and which module should own the next action.",
        use_cases_summary:
          "AI opportunities are planning-grade until the required systems, data, controls, owners, and value evidence are confirmed.",
        proof_summary:
          "The proof tab shows source files, row counts, dates, owners when supplied, fields loaded, and the evidence boundary behind the cockpit.",
        proof_relationship_visual: {
          title: "Context becomes a relationship graph",
          caption:
            "Active source rows are converted into a planning-grade graph so aVa can reason across functions, systems, data, vendors, programs, processes, and risks.",
          nodes: ["Source files", "Context dimensions", "Relationship graph", "aVa grounding packet", "Module handoff"],
          edges: ["loaded into", "materialized as", "grounds", "routes"],
        },
        render_contract:
          "renderer_displays_design_slots_from_approved_pack_no_raw_source_aliases",
      },
      quality_assessment: {
        generator: "deterministic",
        renderer_rewrite_allowed: false,
        source_rows_are_active_csv_projection: true,
        relationship_graph_source: "derived_from_active_csv_cross_references",
        azure_promotion_status: "not_promoted_by_this_script",
      },
      validation: {
        status: "pass",
        issues: [],
      },
    },
    tenant,
  );
  const issues = validatePack(pack);
  pack.validation = { status: issues.length ? "fail" : "pass", issues };
  return { pack, graph, dataByKey };
}

function validatePack(pack) {
  const issues = [];
  const slots = pack.design_slots ?? {};
  if (pack.artifact_type !== "NexusHomeKnowledgeDesignContractPack") {
    issues.push("unexpected artifact type");
  }
  if (!slots.DIMS?.length) issues.push("missing dimensions");
  if (!slots.DATA || Object.keys(slots.DATA).length < 19) issues.push("missing data slots");
  if (!slots.STORY || Object.keys(slots.STORY).length < 19) issues.push("missing story slots");
  for (const dimension of DIMENSIONS) {
    if (!slots.EVID?.[dimension.key]?.length) {
      issues.push(`missing evidence for ${dimension.key}`);
    }
    if (!slots.DGAPS?.[dimension.key]?.length) {
      issues.push(`missing gaps for ${dimension.key}`);
    }
  }
  const text = JSON.stringify(pack);
  if (/Lakeshore Industries|First Capital Financial|SkyHarbor Air/.test(text)) {
    issues.push("visible stale/internal tenant alias remains");
  }
  return issues;
}

function writeTenantArtifacts(tenant, pack, graph) {
  const approvedMirrorDir = path.join(
    repoRoot,
    "datasets/context-artifacts/approved",
    tenant.routeKey,
    "home-knowledge",
  );
  const canonicalApprovedDir = path.join(
    repoRoot,
    "datasets/tenant-inputs",
    tenant.routeKey,
    "approved-content/home",
  );
  const derivedDir = path.join(
    repoRoot,
    "datasets/tenant-inputs",
    tenant.routeKey,
    "derived",
  );
  writeJson(
    path.join(approvedMirrorDir, "approved-home-knowledge-design-contract-pack.json"),
    pack,
  );
  writeJson(path.join(canonicalApprovedDir, "design-contract-pack.json"), pack);
  writeJson(path.join(derivedDir, "relationship-graph.json"), graph);
}

function reportRows(results) {
  return results.map(({ tenant, pack, graph, dataByKey }) => ({
    tenant_key: tenant.routeKey,
    source_tenant_key: tenant.sourceKey,
    display_name: tenant.displayName,
    validation: pack.validation.status,
    dimensions: pack.design_slots.DIMS.length,
    source_rows: Object.values(dataByKey).reduce((sum, item) => sum + item.rows.length, 0),
    graph_nodes: graph.nodes.length,
    graph_edges: graph.edges.length,
    self_loops_filtered: graph.quality_report.self_loops_filtered,
    unresolved_explicit_relationship_rows:
      graph.quality_report.unresolved_explicit_relationship_rows,
    approved_pack:
      `datasets/context-artifacts/approved/${tenant.routeKey}/home-knowledge/approved-home-knowledge-design-contract-pack.json`,
    canonical_pack:
      `datasets/tenant-inputs/${tenant.routeKey}/approved-content/home/design-contract-pack.json`,
    graph_file: `datasets/tenant-inputs/${tenant.routeKey}/derived/relationship-graph.json`,
  }));
}

function cleanExistingRelationshipGraphs() {
  return EXISTING_GRAPH_CLEANUPS.flatMap((item) => {
    const file = path.join(repoRoot, item.graphFile);
    if (!exists(file)) return [];
    const graph = readJson(file);
    const edges = Array.isArray(graph.edges) ? graph.edges : [];
    const cleanedEdges = edges.filter((edge) => {
      if (edge.from_object_id && edge.from_object_id === edge.to_object_id) {
        return false;
      }
      if (edge.from_object_name && edge.from_object_name === edge.to_object_name) {
        return false;
      }
      if (edge.from_node_id && edge.from_node_id === edge.to_node_id) {
        return false;
      }
      return true;
    });
    const removed = edges.length - cleanedEdges.length;
    if (removed) {
      graph.edges = cleanedEdges;
      graph.quality_report = {
        ...(graph.quality_report ?? {}),
        self_loops_filtered: Number(graph.quality_report?.self_loops_filtered ?? 0) + removed,
        edge_count: cleanedEdges.length,
        cleanup_note:
          "Self-loop relationship edges were filtered so the graph visual layer does not imply a relationship where source and target are identical.",
        cleanup_generated_at: generatedAt,
      };
      writeJson(file, graph);
    }
    return [
      {
        tenant_key: item.tenantKey,
        graph_file: item.graphFile,
        graph_nodes: (graph.nodes ?? []).length,
        graph_edges_before: edges.length,
        graph_edges_after: cleanedEdges.length,
        self_loops_removed: removed,
      },
    ];
  });
}

function writeReports(results, graphCleanups) {
  ensureDir(reportDir);
  const rows = reportRows(results);
  writeJson(path.join(reportDir, "home-tenant-artifacts-summary.json"), {
    generated_at: generatedAt,
    rows,
    graph_cleanups: graphCleanups,
    note:
      "Local artifacts generated only. Azure/Postgres promotion still requires the governed ACA data-build job lane.",
  });
  writeCsv(path.join(reportDir, "home-tenant-artifacts-summary.csv"), Object.keys(rows[0]), rows);
  const lines = [
    "# Home Tenant Coverage Artifacts",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This run generated missing Home design-contract packs and source-derived relationship graphs from active tenant CSVs. It did not mutate Azure/Postgres or production data.",
    "",
    "| Tenant | Source tenant | Validation | Source rows | Graph nodes | Graph edges | Unresolved explicit relationship rows |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${row.tenant_key} | ${row.source_tenant_key} | ${row.validation} | ${row.source_rows.toLocaleString()} | ${row.graph_nodes.toLocaleString()} | ${row.graph_edges.toLocaleString()} | ${row.unresolved_explicit_relationship_rows.toLocaleString()} |`,
    ),
    "",
    "## Generated Files",
    "",
    ...rows.flatMap((row) => [
      `- ${row.tenant_key}: ${row.approved_pack}`,
      `- ${row.tenant_key}: ${row.canonical_pack}`,
      `- ${row.tenant_key}: ${row.graph_file}`,
    ]),
    "",
    "## Existing Graph Cleanup",
    "",
    graphCleanups.length
      ? "| Tenant | Graph | Edges before | Edges after | Self-loops removed |"
      : "No existing graph cleanups were configured.",
    graphCleanups.length
      ? "| --- | --- | ---: | ---: | ---: |"
      : "",
    ...graphCleanups.map(
      (row) =>
        `| ${row.tenant_key} | ${row.graph_file} | ${row.graph_edges_before.toLocaleString()} | ${row.graph_edges_after.toLocaleString()} | ${row.self_loops_removed.toLocaleString()} |`,
    ),
    "",
    "## Boundary",
    "",
    "- These are approved local render artifacts for Home cockpit coverage.",
    "- They are planning-grade synthetic/demo context, not client-certified production evidence.",
    "- Azure layer promotion still requires the governed ACA data-build job, idempotency key, quality gate, and release evidence.",
  ];
  fs.writeFileSync(path.join(reportDir, "home-tenant-artifacts-summary.md"), `${lines.join("\n")}\n`);
}

function parseTenantArg() {
  const tenantArg = process.argv.find((arg) => arg.startsWith("--tenant="));
  if (!tenantArg) return TENANTS;
  const wanted = tenantArg.split("=", 2)[1].split(",").map((item) => item.trim());
  if (wanted.includes("all")) return TENANTS;
  return TENANTS.filter((tenant) =>
    wanted.includes(tenant.routeKey) || wanted.includes(tenant.sourceKey),
  );
}

function main() {
  const tenants = parseTenantArg();
  if (!tenants.length) throw new Error("No matching tenants selected");
  const results = tenants.map((tenant) => {
    const { pack, graph, dataByKey } = buildPack(tenant);
    if (pack.validation.status !== "pass") {
      throw new Error(`${tenant.routeKey} pack validation failed: ${pack.validation.issues.join("; ")}`);
    }
    writeTenantArtifacts(tenant, pack, graph);
    return { tenant, pack, graph, dataByKey };
  });
  const graphCleanups = cleanExistingRelationshipGraphs();
  writeReports(results, graphCleanups);
  for (const row of reportRows(results)) {
    console.log(
      `${row.tenant_key}: ${row.validation}, rows=${row.source_rows}, graph=${row.graph_nodes} nodes/${row.graph_edges} edges`,
    );
  }
  console.log(`Report: ${path.relative(repoRoot, path.join(reportDir, "home-tenant-artifacts-summary.md"))}`);
}

main();
