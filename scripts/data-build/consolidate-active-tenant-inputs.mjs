#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json");
const outDir = path.join(repoRoot, "reports/tenant-input-consolidation/latest");
const archiveId = process.env.TENANT_INPUT_ARCHIVE_ID ?? "consolidated-20260714";

const lineageColumns = [
  "original_source_file",
  "original_packet",
  "original_row_number",
  "original_row_id",
  "source_classification",
  "source_fingerprint",
  "consolidation_rule_used",
  "conflict_status",
];

const domainMatchers = [
  { domain: "enterprise_profile", patterns: [/enterprise[_-]profile/i, /portfolio[_-]entity[_-]registry/i] },
  { domain: "business_functions", patterns: [/business[_-]functions/i, /business[_-]capabilities/i] },
  { domain: "org_ownership", patterns: [/org[_-]ownership/i, /org[_-]roles/i, /team[_-]topology/i] },
  { domain: "workforce_roles", patterns: [/workforce[_-](roles|personas)/i, /personas/i] },
  { domain: "applications_systems", patterns: [/applications[_-]systems/i, /application[_-]portfolio/i, /apps?[_-]systems?/i] },
  { domain: "data_assets_integrations", patterns: [/data[_-]assets?[_-]integrations?/i, /integration[_-]topology/i, /data[_-]inventory/i] },
  { domain: "infrastructure_platforms", patterns: [/infrastructure/i, /cloud[_-]estate/i, /data[_-]center/i, /platforms?/i] },
  { domain: "vendors_contracts", patterns: [/vendors?[_-]contracts?/i, /vendor[_-]contracts?/i] },
  { domain: "spend_value", patterns: [/spend[_-]value/i, /it[_-]financials/i, /financial[_-]kpi/i, /rate[_-]card/i, /cost[_-]basis/i] },
  { domain: "programs_initiatives", patterns: [/programs?[_-]initiatives?/i, /(^|\/)initiatives\.csv$/i, /business[_-]priorities/i] },
  { domain: "ai_automation_use_cases", patterns: [/ai[_-](automation[_-])?use[_-]cases/i, /ai[_-]initiatives/i, /ai[_-]tooling/i] },
  { domain: "risks_controls", patterns: [/risks?[_-]controls?/i, /operations[_-]risk[_-]controls/i, /qms/i, /controls?/i] },
  { domain: "relationships", patterns: [/relationships?/i, /graph[_-]edges?/i, /bridge/i] },
  { domain: "evidence_sources", patterns: [/evidence[_-]sources/i, /source[_-]evidence[_-]registry/i, /chunk[_-]retrieval[_-]registry/i] },
  { domain: "metrics_outcomes", patterns: [/metrics?[_-]outcomes?/i, /metric[_-]definitions/i, /dora[_-]baseline/i, /sla[_-]register/i] },
  { domain: "industry_context_patterns", patterns: [/industry[_-](context|corpus|market|knowledge)[_-]patterns/i, /market[_-]corpus/i] },
  { domain: "expert_lenses", patterns: [/expert[_-]lenses/i] },
  { domain: "service_scope_managed_services", patterns: [/service[_-](scope|tower)[_-]managed[_-]services/i, /managed[_-]services[_-]scope/i] },
  { domain: "operational_process_evidence", patterns: [/operational[_-]evidence/i, /process[_-]intelligence/i, /incidents/i] },
];

const fieldAliases = {
  tenant_key: ["tenant_key", "tenantKey", "client_key"],
  entity_name: ["entity_name", "record_name", "client_display_name", "company_name", "legal_name"],
  industry: ["industry", "industry_vertical"],
  sub_industry: ["sub_industry", "sector", "subsector"],
  revenue_usd: ["revenue_usd", "annual_revenue_usd", "revenue"],
  employee_count: ["employee_count", "employees", "fte_count"],
  headquarters: ["headquarters", "hq_location"],
  operating_regions: ["operating_regions", "locations", "region_scope"],
  business_model: ["business_model", "operating_model"],
  customer_segments: ["customer_segments", "segments"],
  mission: ["mission", "mission_statement"],
  vision: ["vision", "vision_statement"],
  strategic_priorities: ["strategic_priorities", "strategy", "priorities"],
  leadership_team: ["leadership_team", "leadership", "executive_team"],
  function_name: ["function_name", "record_name", "business_function", "capability_name"],
  parent_function: ["parent_function", "parent_capability"],
  executive_owner: ["executive_owner", "business_owner_role", "source_owner", "function_owner"],
  business_capabilities: ["business_capabilities", "business_capability", "capabilities"],
  annual_budget_usd: ["annual_budget_usd", "annual_cost_usd", "budget_usd"],
  outsourced_support: ["outsourced_support", "vendor_supported"],
  org_unit: ["org_unit", "org_unit_name", "record_name", "team_name"],
  parent_org_unit: ["parent_org_unit", "parent_org"],
  leader_name_or_role: ["leader_name_or_role", "leader_role", "leader_name", "role_name"],
  role_level: ["role_level", "level"],
  decision_rights: ["decision_rights", "decision_rights_scope"],
  owned_functions: ["owned_functions", "function_name"],
  owned_systems: ["owned_systems", "system_name", "system_id"],
  owned_data_domains: ["owned_data_domains", "data_domains"],
  location_scope: ["location_scope", "region_scope"],
  persona_or_role: ["persona_or_role", "persona_name", "role", "record_name", "role_name"],
  role_count: ["role_count", "fte_count"],
  location_model: ["location_model", "location_scope"],
  employment_type: ["employment_type"],
  vendor_supported: ["vendor_supported", "outsourced_support"],
  skills: ["skills", "skill_profile"],
  pain_points: ["pain_points", "current_state_notes"],
  automation_opportunity: ["automation_opportunity", "ai_relevance"],
  system_name: ["system_name", "record_name", "application_name", "app_name", "name", "ci_name", "app_id", "platform_name"],
  system_type: ["system_type", "ci_type", "platform_type"],
  system_category: ["system_category", "domain", "business_capability"],
  business_function: ["business_function", "business_capability", "function_name", "business_function_refs"],
  system_scope: ["system_scope", "entity_scope", "environment"],
  deployment_model: ["deployment_model", "hosting_model", "platform_type"],
  hosting_location: ["hosting_location", "hosting_model", "data_center_or_region"],
  lifecycle_state: ["lifecycle_state", "lifecycle_status", "lifecycle", "modernization_state", "modernization_disposition"],
  business_owner: ["business_owner", "primary_business_owner", "business_owner_role", "application_owner"],
  technology_owner: ["technology_owner", "technical_owner", "technical_owner_role", "technical_owner_team", "system_owner"],
  vendor: ["vendor", "vendor_id", "vendor_product"],
  data_domains: ["data_domains", "data_dependencies"],
  interfaces_count: ["interfaces_count", "integration_count", "interfaces"],
  current_state_or_target_state: ["current_state_or_target_state", "current_state", "target_state", "system_scope"],
  data_asset_name: ["data_asset_name", "record_name", "data_product_name", "integration_name", "edge_id"],
  data_domain: ["data_domain", "domain", "data_domains"],
  source_system: ["source_system", "source_app_id", "system_of_record"],
  target_system: ["target_system", "target_app_id"],
  integration_type: ["integration_type", "interface_type"],
  platform_or_database: ["platform_or_database", "platform", "database", "source_system"],
  refresh_frequency: ["refresh_frequency"],
  data_owner: ["data_owner", "owner"],
  data_steward: ["data_steward"],
  quality_status: ["quality_status", "source_validation_status"],
  regulated_data_flag: ["regulated_data_flag", "data_classification"],
  analytics_usage: ["analytics_usage", "decision_relevance"],
  platform_name: ["platform_name", "record_name", "asset_name", "system_name"],
  platform_type: ["platform_type", "asset_class", "system_category"],
  hosting_model: ["hosting_model", "virtualization", "deployment_model"],
  data_center_or_region: ["data_center_or_region", "location", "hosting_location"],
  technology_stack: ["technology_stack", "make_model", "vendor_product"],
  operational_owner: ["operational_owner", "technical_owner_role", "system_owner"],
  capacity_or_scale: ["capacity_or_scale", "capacity", "users_or_entities_supported"],
  constraints: ["constraints", "known_gaps"],
  future_target_flag: ["future_target_flag"],
  vendor_name: ["vendor_name", "vendor", "record_name"],
  contract_name: ["contract_name", "contract_id"],
  service_category: ["service_category", "system_category"],
  contract_owner: ["contract_owner", "business_owner"],
  annual_spend_usd: ["annual_spend_usd", "annual_cost_usd", "run_cost_usd"],
  term_start: ["term_start"],
  term_end: ["term_end"],
  renewal_date: ["renewal_date"],
  commercial_model: ["commercial_model", "ownership_model"],
  supported_systems: ["supported_systems", "supported_system_refs", "system_name"],
  supported_functions: ["supported_functions", "business_function_refs", "function_name"],
  risk_rating: ["risk_rating", "criticality"],
  spend_category: ["spend_category", "service_category", "record_name"],
  cost_center_or_owner: ["cost_center_or_owner", "business_owner", "cost_center"],
  run_change_transform_split: ["run_change_transform_split"],
  vendor_internal_split: ["vendor_internal_split"],
  value_driver: ["value_driver", "decision_relevance"],
  savings_opportunity_usd: ["savings_opportunity_usd"],
  calculation_basis: ["calculation_basis", "source_basis"],
  program_name: ["program_name", "initiative_name", "priority_name", "record_name"],
  business_sponsor: ["business_sponsor", "sponsor", "business_owner"],
  objective: ["objective", "program_objective", "decision_required", "value_hypothesis"],
  scope: ["scope", "system_scope", "priority_type"],
  phase: ["phase", "current_status"],
  target_outcomes: ["target_outcomes", "expected_outcomes", "value_metric", "value_hypothesis"],
  dependencies: ["dependencies", "data_dependencies", "impacted_systems"],
  risks: ["risks", "known_gaps"],
  budget_usd: ["budget_usd", "annual_budget_usd"],
  expected_value_usd: ["expected_value_usd", "value_usd"],
  use_case_name: ["use_case_name", "record_name", "ai_use_case_name", "ai_use_case"],
  process_area: ["process_area", "business_capability"],
  ai_pattern: ["ai_pattern"],
  current_status: ["current_status", "status"],
  value_hypothesis: ["value_hypothesis", "ai_relevance"],
  required_data: ["required_data", "data_domains"],
  required_systems: ["required_systems", "system_name", "system_id"],
  human_approval_points: ["human_approval_points"],
  risk_controls: ["risk_controls", "controls"],
  risk_or_control_name: ["risk_or_control_name", "record_name", "risk_name", "control_name", "process_control_name"],
  risk_domain: ["risk_domain", "domain", "risk_category"],
  systems_impacted: ["systems_impacted", "system_name", "system_id"],
  severity: ["severity", "criticality"],
  likelihood: ["likelihood"],
  control_owner: ["control_owner", "business_owner"],
  control_status: ["control_status", "status"],
  evidence_required: ["evidence_required"],
  mitigation_plan: ["mitigation_plan"],
  from_object_type: ["from_object_type", "source_object_type"],
  from_object_name: ["from_object_name", "source_object_name", "source_name"],
  relationship_type: ["relationship_type", "relationship", "edge_type"],
  to_object_type: ["to_object_type", "target_object_type"],
  to_object_name: ["to_object_name", "target_object_name", "target_name"],
  relationship_strength: ["relationship_strength", "confidence"],
  evidence_basis: ["evidence_basis", "source_basis"],
  source_type: ["source_type", "source_artifact_type"],
  source_owner: ["source_owner", "data_provider_role"],
  as_of_date: ["as_of_date", "source_as_of_date"],
  confidentiality: ["confidentiality", "data_sensitivity"],
  domains_covered: ["domains_covered", "business_object_family"],
  row_count_or_pages: ["row_count_or_pages"],
  quality_notes: ["quality_notes", "known_gaps"],
  approved_for_loading: ["approved_for_loading", "source_validation_status"],
  metric_name: ["metric_name", "record_name"],
  metric_domain: ["metric_domain", "domain"],
  definition: ["definition", "metric_definition"],
  baseline_value: ["baseline_value"],
  baseline_period: ["baseline_period"],
  target_value: ["target_value"],
  owner: ["owner", "source_owner"],
  data_source: ["data_source", "source_system"],
  pattern_name: ["pattern_name", "record_name"],
  business_context: ["business_context", "system_business_context"],
  applicability: ["applicability", "decision_relevance"],
  caveats: ["caveats", "known_gaps"],
  lens_name: ["lens_name", "record_name"],
  expert_role: ["expert_role", "source_owner"],
  questions_to_answer: ["questions_to_answer"],
  required_inputs: ["required_inputs"],
  decision_use: ["decision_use"],
  limitations: ["limitations", "known_gaps"],
  service_tower: ["service_tower", "tower_name"],
  service_name: ["service_name", "record_name"],
  scope_description: ["scope_description", "scope"],
  in_scope_functions: ["in_scope_functions", "supported_functions"],
  in_scope_systems: ["in_scope_systems", "supported_systems"],
  current_provider: ["current_provider", "vendor_name"],
  service_volume: ["service_volume"],
  sla_or_kpi: ["sla_or_kpi"],
  run_cost_usd: ["run_cost_usd", "annual_cost_usd"],
  target_state_option: ["target_state_option"],
  process_name: ["process_name", "record_name", "event_name", "incident_id"],
  process_owner: ["process_owner", "business_owner"],
  systems_used: ["systems_used", "system_name", "system_id"],
  volume_metric: ["volume_metric"],
  cycle_time: ["cycle_time"],
  control_points: ["control_points"],
  automation_candidate: ["automation_candidate", "ai_relevance"],
  source_date: ["source_date", "as_of_date", "source_as_of_date", "last_validated_date"],
  confidence: ["confidence", "source_confidence"],
  known_gaps: ["known_gaps", "notes_gaps", "caveats"],
};

const primaryKeyByDomain = {
  enterprise_profile: ["entity_name", "tenant_key"],
  business_functions: ["function_name"],
  org_ownership: ["org_unit", "leader_name_or_role"],
  workforce_roles: ["persona_or_role", "function_name"],
  applications_systems: ["system_name"],
  data_assets_integrations: ["data_asset_name", "source_system", "target_system"],
  infrastructure_platforms: ["platform_name"],
  vendors_contracts: ["vendor_name", "contract_name"],
  spend_value: ["spend_category", "cost_center_or_owner"],
  programs_initiatives: ["program_name"],
  ai_automation_use_cases: ["use_case_name"],
  risks_controls: ["risk_or_control_name"],
  relationships: ["from_object_name", "relationship_type", "to_object_name"],
  evidence_sources: ["source_file", "source_type"],
  metrics_outcomes: ["metric_name"],
  industry_context_patterns: ["pattern_name"],
  expert_lenses: ["lens_name"],
  service_scope_managed_services: ["service_tower", "service_name"],
  operational_process_evidence: ["process_name"],
};

const tenantProfileDefaults = {
  "apex-retail": {
    customer_segments: "store shoppers; digital commerce customers; loyalty members; marketplace sellers; retail media advertisers",
  },
  "first-capital-financial": {
    customer_segments: "consumer banking households; small business clients; commercial banking clients; cardholders; wealth clients",
  },
  "lakeshore-holdings": {
    customer_segments: "portfolio company operators; corporate shared-services leaders; operating-company customers; distribution and industrial customers",
  },
  "lakeshore-industries": {
    customer_segments: "industrial customers; foodservice distribution customers; packaging customers; field services customers; portfolio company operators",
  },
  "meridian-health": {
    customer_segments: "patients; members; providers; employer groups; clinical operations leaders; health-plan operations teams",
  },
  "skyharbor-air": {
    headquarters: "Chicago, IL",
    customer_segments: "passengers; loyalty members; corporate travel buyers; cargo customers; airport station operations; crew and operations teams",
  },
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    if (entry.isFile()) files.push(full);
  }
  return files;
}

function parseCsv(text) {
  const rows = [];
  let current = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      current.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      current.push(field);
      if (current.some((value) => value.length > 0)) rows.push(current);
      current = [];
      field = "";
    } else {
      field += char;
    }
  }
  current.push(field);
  if (current.some((value) => value.length > 0)) rows.push(current);
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((header) => header.trim());
  return {
    headers,
    rows: rows.slice(1).map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, (row[index] ?? "").trim()])),
    ),
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header] ?? "")).join(","));
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function detectDomain(relativePath) {
  for (const matcher of domainMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(relativePath))) return matcher.domain;
  }
  return null;
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function firstValue(sourceRow, aliases) {
  for (const alias of aliases) {
    const value = sourceRow[alias];
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function sourcePrecedence(packetId, relativePath) {
  const combined = `${packetId}/${relativePath}`.toLowerCase();
  if (combined.includes("rich-enterprise") || combined.includes("rich-substrate")) return 400;
  if (combined.includes("current-state")) return 300;
  if (combined.includes("upgrade-candidate")) return 200;
  if (combined.includes("legacy-pack") || combined.includes("legacy-pack")) return 350;
  return 100;
}

function fingerprint(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function rowId(row) {
  return firstValue(row, [
    "record_id",
    "entity_id",
    "system_id",
    "application_id",
    "app_id",
    "edge_id",
    "asset_name",
    "ci_id",
    "source_record_id",
    "id",
  ]);
}

function businessKey(domain, row) {
  const fields = primaryKeyByDomain[domain] ?? [];
  const parts = fields.map((field) => normalize(row[field])).filter(Boolean);
  if (parts.length > 0) return parts.join("|");
  return normalize(JSON.stringify(row));
}

function exactKey(row) {
  return fingerprint(JSON.stringify(Object.keys(row).sort().map((key) => [key, row[key] ?? ""])));
}

function mergeRows(existing, incoming, context, reports) {
  let conflicts = 0;
  let fills = 0;
  const existingPrecedence = Number(existing.__precedence ?? 0);
  const incomingPrecedence = Number(incoming.__precedence ?? 0);
  for (const [field, value] of Object.entries(incoming)) {
    if (field.startsWith("__")) continue;
    if (!value) continue;
    if (!existing[field]) {
      existing[field] = value;
      fills += 1;
    } else if (existing[field] !== value) {
      conflicts += 1;
      if (incomingPrecedence > existingPrecedence) {
        reports.conflictResolution.push({
          ...context,
          field,
          retained: value,
          replaced: existing[field],
          rule: "higher_source_precedence",
        });
        existing[field] = value;
        existing.__precedence = incomingPrecedence;
      } else {
        reports.conflictResolution.push({
          ...context,
          field,
          retained: existing[field],
          discarded: value,
          rule: "existing_source_precedence",
        });
      }
    }
  }
  if (conflicts > 0) existing.conflict_status = "conflict_resolved";
  if (fills > 0 && conflicts === 0) existing.consolidation_rule_used = "merged_non_conflicting_fields";
  return existing;
}

function mapRow({ tenant, domain, templateColumns, sourceRow, sourcePath, packet, rowNumber, fileFingerprint }) {
  const mapped = {};
  for (const column of templateColumns) {
    if (column === "tenant_key") {
      mapped[column] = tenant.tenantKey;
    } else if (column === "source_file") {
      mapped[column] = sourcePath;
    } else {
      mapped[column] = firstValue(sourceRow, fieldAliases[column] ?? [column]);
    }
  }
  if (domain === "enterprise_profile") {
    const defaults = tenantProfileDefaults[tenant.tenantKey] ?? {};
    for (const [field, value] of Object.entries(defaults)) {
      if (!mapped[field] || /^not_|unknown|tbd|n\/a$/i.test(mapped[field])) mapped[field] = value;
    }
  }
  mapped.original_source_file = sourcePath;
  mapped.original_packet = packet.packetId;
  mapped.original_row_number = String(rowNumber);
  mapped.original_row_id = rowId(sourceRow);
  mapped.source_classification = packet.classification;
  mapped.source_fingerprint = fileFingerprint;
  mapped.consolidation_rule_used = "retained_from_active_source";
  mapped.conflict_status = "none";
  mapped.__precedence = sourcePrecedence(packet.packetId, sourcePath);
  mapped.__exactKey = exactKey(mapped);
  mapped.__businessKey = businessKey(domain, mapped);
  return mapped;
}

function sourceFilesForPacket(packetPath) {
  return walk(packetPath).filter((file) => file.toLowerCase().endsWith(".csv"));
}

function countRows(file) {
  const parsed = parseCsv(fs.readFileSync(file, "utf8"));
  return parsed.rows.length;
}

function moveToArchive(tenant, packet, reports) {
  const fromAbs = path.join(repoRoot, packet.path);
  if (!fs.existsSync(fromAbs)) return null;
  const moved = {
    tenantKey: tenant.tenantKey,
    packetId: packet.packetId,
    from: packet.path,
    to: "external archive / git history only",
    action: "not written to repo",
  };
  reports.archivedActiveFiles.push(moved);
  return moved;
}

function sourcePacketsForTenant(tenant) {
  const activePackets = tenant.packets.filter((packet) => packet.packetId !== "current-universal");
  if (activePackets.length > 0) return { sourcePackets: activePackets, packetsToArchive: activePackets };

  return { sourcePackets: tenant.packets, packetsToArchive: [] };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "/")).join(" | ")} |`),
  ];
}

function writeReports(reports, registry, afterInventory) {
  ensureDir(outDir);
  const reportFiles = {
    "tenant-consolidation-index.json": reports.index,
    "before-after-file-inventory.json": reports.beforeAfterFileInventory,
    "before-after-domain-counts.json": reports.beforeAfterDomainCounts,
    "row-deduplication-report.json": reports.rowDeduplication,
    "source-precedence-report.json": reports.sourcePrecedence,
    "conflict-resolution-report.json": reports.conflictResolution,
    "archived-active-files.json": reports.archivedActiveFiles,
    "registry-update-report.json": reports.registryUpdate,
    "guardrails.json": reports.guardrails,
  };
  for (const [file, data] of Object.entries(reportFiles)) {
    fs.writeFileSync(path.join(outDir, file), `${JSON.stringify(data, null, 2)}\n`);
  }

  const summary = [
    "# Tenant Input Consolidation",
    "",
    `Generated: ${reports.generatedAt}`,
    "",
    "## Outcome",
    "",
    `- Active tenants processed: ${registry.activeTenants.length}`,
    `- Universal files per active tenant: ${reports.guardrails.expectedUniversalFilesPerTenant}`,
    `- Legacy/versioned active files remaining: ${reports.guardrails.legacyActiveFilesRemaining}`,
    `- Nested active packet directories remaining: ${reports.guardrails.nestedActivePacketDirectoriesRemaining}`,
    `- Northstar processed: ${reports.guardrails.northstarProcessed}`,
    `- Production tenant data written: ${reports.guardrails.productionTenantDataWritten}`,
    "",
    "## Before / After",
    "",
    ...markdownTable(
      ["Tenant", "Before active CSV files", "After active CSV files", "Before domain duplicates", "After domain duplicates"],
      reports.beforeAfterFileInventory.tenants.map((tenant) => [
        tenant.displayName,
        tenant.before.csvFiles,
        tenant.after.csvFiles,
        tenant.before.duplicateDomainCount,
        tenant.after.duplicateDomainCount,
      ]),
    ),
    "",
    "## Meridian Applications & Systems",
    "",
    ...markdownTable(
      ["Before file", "Rows"],
      reports.beforeAfterDomainCounts.meridianApplicationsSystems.beforeFiles.map((file) => [file.path, file.rows]),
    ),
    "",
    ...markdownTable(
      ["After file", "Rows"],
      [[reports.beforeAfterDomainCounts.meridianApplicationsSystems.afterFile.path, reports.beforeAfterDomainCounts.meridianApplicationsSystems.afterFile.rows]],
    ),
    "",
    "## Data Layer Truth Split",
    "",
    "- This PR consolidates active source inputs and rebuild artifacts.",
    "- It does not write production tenant data.",
    "- It does not change module runtime behavior.",
    "- Active module-context promotion remains report-backed metadata unless a later data-build job writes physical tables.",
    "",
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${summary.join("\n")}\n`);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Tenant Input Consolidation</title><style>
  body{font-family:Inter,Arial,sans-serif;margin:0;background:#f7f4ef;color:#071633}main{max-width:1180px;margin:0 auto;padding:44px}
  h1{font-size:42px;margin:0 0 10px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}
  .card{background:white;border:1px solid #ded7ca;border-radius:10px;padding:18px}.kpi{font-size:30px;font-weight:800}
  table{width:100%;border-collapse:collapse;background:white;border:1px solid #ded7ca}th,td{padding:10px;border-bottom:1px solid #eee;text-align:left;font-size:13px}th{color:#667085;text-transform:uppercase;letter-spacing:.08em}
  .ok{color:#087443;font-weight:700}.bad{color:#b42318;font-weight:700}
  </style></head><body><main><p class="muted">DATA-INPUT-CANONICAL-PR1</p><h1>Tenant Input Consolidation Control</h1>
  <p class="muted">One active universal file per dimension per tenant. Legacy packs archived out of the active build path.</p>
  <section class="grid">
  <div class="card"><div class="muted">Active tenants</div><div class="kpi">${registry.activeTenants.length}</div></div>
  <div class="card"><div class="muted">Files per tenant</div><div class="kpi">${reports.guardrails.expectedUniversalFilesPerTenant}</div></div>
  <div class="card"><div class="muted">Legacy active files</div><div class="kpi ${reports.guardrails.legacyActiveFilesRemaining === 0 ? "ok" : "bad"}">${reports.guardrails.legacyActiveFilesRemaining}</div></div>
  <div class="card"><div class="muted">Northstar processed</div><div class="kpi ${reports.guardrails.northstarProcessed ? "bad" : "ok"}">${reports.guardrails.northstarProcessed}</div></div>
  </section>
  <h2>Before / After</h2><table><thead><tr><th>Tenant</th><th>Before CSV</th><th>After CSV</th><th>Archived</th></tr></thead><tbody>
  ${reports.beforeAfterFileInventory.tenants.map((tenant) => `<tr><td>${tenant.displayName}</td><td>${tenant.before.csvFiles}</td><td>${tenant.after.csvFiles}</td><td>${tenant.archivedPackets}</td></tr>`).join("")}
  </tbody></table>
  <h2>Meridian Applications & Systems</h2><table><thead><tr><th>State</th><th>File</th><th>Rows</th></tr></thead><tbody>
  ${reports.beforeAfterDomainCounts.meridianApplicationsSystems.beforeFiles.map((file) => `<tr><td>Before</td><td><code>${file.path}</code></td><td>${file.rows}</td></tr>`).join("")}
  <tr><td>After</td><td><code>${reports.beforeAfterDomainCounts.meridianApplicationsSystems.afterFile.path}</code></td><td>${reports.beforeAfterDomainCounts.meridianApplicationsSystems.afterFile.rows}</td></tr>
  </tbody></table></main></body></html>`;
  fs.writeFileSync(path.join(outDir, "tenant-input-consolidation-control.html"), html);

  fs.writeFileSync(path.join(outDir, "canonical-build-after-consolidation.json"), JSON.stringify({ pending: true, command: "npm run build:canonical-tenant-data" }, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "candidate-build-after-consolidation.json"), JSON.stringify({ pending: true, command: "npm run build:candidate-version" }, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "active-module-context-after-consolidation.json"), JSON.stringify({ pending: true, command: "npm run audit:active-module-context-promotion -- --all-active-tenants" }, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "home-quality-after-consolidation.json"), JSON.stringify({ pending: true, command: "npm run smoke:home:full" }, null, 2) + "\n");
}

function run() {
  const registry = readJson(registryPath);
  const manifest = readJson(path.join(repoRoot, registry.universalTemplateSet.manifest));
  const templateByDomain = new Map();
  for (const template of manifest.templates) {
    const domain = template.file.replace(/^\d+_/, "").replace(/\.csv$/, "");
    templateByDomain.set(domain, template);
  }

  const reports = {
    generatedAt: new Date().toISOString(),
    index: { tenants: [] },
    beforeAfterFileInventory: { tenants: [] },
    beforeAfterDomainCounts: { tenants: [], meridianApplicationsSystems: { beforeFiles: [], afterFile: null } },
    rowDeduplication: [],
    sourcePrecedence: [],
    conflictResolution: [],
    archivedActiveFiles: [],
    registryUpdate: { tenants: [] },
    guardrails: {
      expectedUniversalFilesPerTenant: manifest.templates.length,
      legacyActiveFilesRemaining: 0,
      nestedActivePacketDirectoriesRemaining: 0,
      northstarProcessed: false,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
      candidatePromoted: false,
    },
  };

  if (registry.activeTenants.some((tenant) => /northstar/i.test(tenant.tenantKey))) {
    reports.guardrails.northstarProcessed = true;
    throw new Error("Northstar appears in active tenants; refusing to consolidate.");
  }

  for (const tenant of registry.activeTenants) {
    const currentRootAbs = path.join(repoRoot, tenant.canonicalInputRoot);
    const beforeFiles = [];
    const rowsByDomain = new Map();
    const exactSeenByDomain = new Map();
    const mergedByDomain = new Map();
    const { sourcePackets, packetsToArchive } = sourcePacketsForTenant(tenant);

    for (const packet of sourcePackets) {
      const packetAbs = path.join(repoRoot, packet.path);
      for (const sourceAbs of sourceFilesForPacket(packetAbs)) {
        const sourcePath = path.relative(repoRoot, sourceAbs);
        const relativePath = path.relative(packetAbs, sourceAbs);
        const domain = detectDomain(sourcePath);
        const text = fs.readFileSync(sourceAbs, "utf8");
        const parsed = parseCsv(text);
        beforeFiles.push({ packetId: packet.packetId, path: sourcePath, domain, rows: parsed.rows.length });
        if (!domain || !templateByDomain.has(domain)) continue;
        const template = templateByDomain.get(domain);
        const headers = [...template.columns, ...lineageColumns];
        if (!rowsByDomain.has(domain)) rowsByDomain.set(domain, { template, headers });
        if (!exactSeenByDomain.has(domain)) exactSeenByDomain.set(domain, new Set());
        if (!mergedByDomain.has(domain)) mergedByDomain.set(domain, new Map());

        const fileFingerprint = fingerprint(text);
        parsed.rows.forEach((sourceRow, index) => {
          const mapped = mapRow({
            tenant,
            domain,
            templateColumns: template.columns,
            sourceRow,
            sourcePath,
            packet,
            rowNumber: index + 2,
            fileFingerprint,
          });
          const exact = mapped.__exactKey;
          const business = mapped.__businessKey || `${sourcePath}:${index + 2}`;
          if (exactSeenByDomain.get(domain).has(exact)) {
            reports.rowDeduplication.push({
              tenantKey: tenant.tenantKey,
              domain,
              sourcePath,
              rowNumber: index + 2,
              rule: "exact_duplicate_removed",
            });
            return;
          }
          exactSeenByDomain.get(domain).add(exact);
          const domainRows = mergedByDomain.get(domain);
          if (domainRows.has(business)) {
            mergeRows(
              domainRows.get(business),
              mapped,
              { tenantKey: tenant.tenantKey, domain, businessKey: business, incomingSourcePath: sourcePath, incomingRowNumber: index + 2 },
              reports,
            );
            reports.rowDeduplication.push({
              tenantKey: tenant.tenantKey,
              domain,
              sourcePath,
              rowNumber: index + 2,
              rule: "business_key_merged",
              businessKey: business,
            });
          } else {
            domainRows.set(business, mapped);
          }
          reports.sourcePrecedence.push({
            tenantKey: tenant.tenantKey,
            domain,
            packetId: packet.packetId,
            sourcePath,
            precedence: sourcePrecedence(packet.packetId, relativePath),
          });
        });
      }
    }

    const beforeDomainCounts = Object.fromEntries(
      [...beforeFiles.reduce((map, file) => {
        if (!file.domain) return map;
        const current = map.get(file.domain) ?? { files: 0, rows: 0 };
        current.files += 1;
        current.rows += file.rows;
        map.set(file.domain, current);
        return map;
      }, new Map()).entries()].sort(),
    );

    const stagedDir = path.join(currentRootAbs, ".consolidated-staging");
    fs.rmSync(stagedDir, { recursive: true, force: true });
    ensureDir(stagedDir);

    for (const [domain, { template, headers }] of rowsByDomain.entries()) {
      const rows = [...mergedByDomain.get(domain).values()].map((row) => {
        const clean = {};
        for (const header of headers) clean[header] = row[header] ?? "";
        clean.source_file = path.posix.join(tenant.canonicalInputRoot, template.file);
        return clean;
      });
      writeCsv(path.join(stagedDir, template.file), headers, rows);
    }
    for (const template of manifest.templates) {
      const target = path.join(stagedDir, template.file);
      if (!fs.existsSync(target)) writeCsv(target, [...template.columns, ...lineageColumns], []);
    }

    const archivedPackets = [];
    for (const packet of packetsToArchive) {
      const moved = moveToArchive(tenant, packet, reports);
      if (moved) archivedPackets.push(moved);
    }

    ensureDir(currentRootAbs);
    for (const entry of fs.readdirSync(stagedDir)) {
      fs.renameSync(path.join(stagedDir, entry), path.join(currentRootAbs, entry));
    }
    fs.rmSync(stagedDir, { recursive: true, force: true });

    const afterFiles = walk(currentRootAbs)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => ({
        path: path.relative(repoRoot, file),
        domain: detectDomain(path.relative(repoRoot, file)),
        rows: countRows(file),
      }));
    const afterDomainCounts = Object.fromEntries(
      [...afterFiles.reduce((map, file) => {
        if (!file.domain) return map;
        const current = map.get(file.domain) ?? { files: 0, rows: 0 };
        current.files += 1;
        current.rows += file.rows;
        map.set(file.domain, current);
        return map;
      }, new Map()).entries()].sort(),
    );

    tenant.packets = [
      {
        packetId: "current-universal",
        path: tenant.canonicalInputRoot,
        classification: "synthetic-demo",
        status: "active-input",
        note: "Consolidated universal one-file-per-domain packet. Legacy source packets are archived outside active current.",
      },
    ];

    const beforeDuplicates = Object.values(beforeDomainCounts).filter((count) => count.files > 1).length;
    const afterDuplicates = Object.values(afterDomainCounts).filter((count) => count.files > 1).length;
    reports.beforeAfterFileInventory.tenants.push({
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      before: {
        csvFiles: beforeFiles.length,
        duplicateDomainCount: beforeDuplicates,
        files: beforeFiles,
      },
      after: {
        csvFiles: afterFiles.length,
        duplicateDomainCount: afterDuplicates,
        files: afterFiles,
      },
      archivedPackets: archivedPackets.length,
    });
    reports.beforeAfterDomainCounts.tenants.push({
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      before: beforeDomainCounts,
      after: afterDomainCounts,
    });
    reports.index.tenants.push({
      tenantKey: tenant.tenantKey,
      currentRoot: tenant.canonicalInputRoot,
      activeFiles: afterFiles,
    });
    reports.registryUpdate.tenants.push({
      tenantKey: tenant.tenantKey,
      packets: tenant.packets,
    });

    if (tenant.tenantKey === "meridian-health") {
      reports.beforeAfterDomainCounts.meridianApplicationsSystems.beforeFiles = beforeFiles
        .filter((file) => file.domain === "applications_systems")
        .map((file) => ({ path: file.path, rows: file.rows }));
      const afterFile = afterFiles.find((file) => file.path.endsWith("04_applications_systems.csv"));
      reports.beforeAfterDomainCounts.meridianApplicationsSystems.afterFile = afterFile;
    }
  }

  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  const activeFiles = walk(path.join(repoRoot, registry.activeRoot));
  reports.guardrails.legacyActiveFilesRemaining = activeFiles.filter((file) =>
    /(^|\/)(V[0-9]+_|.*legacy[-_]pack.*)/i.test(path.relative(repoRoot, file)),
  ).length;
  reports.guardrails.nestedActivePacketDirectoriesRemaining = registry.activeTenants.filter((tenant) => {
    const entries = fs.readdirSync(path.join(repoRoot, tenant.canonicalInputRoot), { withFileTypes: true });
    return entries.some((entry) => entry.isDirectory());
  }).length;

  writeReports(reports, registry);

  if (reports.guardrails.legacyActiveFilesRemaining > 0) {
    throw new Error(`Legacy active files remain: ${reports.guardrails.legacyActiveFilesRemaining}`);
  }
  if (reports.guardrails.nestedActivePacketDirectoriesRemaining > 0) {
    throw new Error(`Nested active packet directories remain: ${reports.guardrails.nestedActivePacketDirectoriesRemaining}`);
  }

  console.log(`Tenant input consolidation complete: ${registry.activeTenants.length} active tenants`);
  console.log(path.relative(repoRoot, path.join(outDir, "summary.md")));
}

run();
