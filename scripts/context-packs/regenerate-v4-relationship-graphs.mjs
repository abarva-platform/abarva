#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATASETS = path.join(ROOT, "datasets");

function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim()),
  );
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  const pushField = () => {
    row.push(field.trim());
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value.trim())) rows.push(row);
    row = [];
  };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) pushRow();
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((values) => {
    const object = {};
    headers.forEach((header, index) => {
      object[header] = values[index] ?? "";
    });
    return object;
  });
}

function first(row, fields) {
  for (const field of fields) {
    const value = row[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function addAlias(map, key, value) {
  if (!key || !value) return;
  map.set(key.toLowerCase(), value);
}

function resolve(value, aliases) {
  if (!value) return "";
  return aliases.get(value.toLowerCase()) ?? value;
}

function resolveKnown(value, aliases) {
  if (!value) return "";
  return aliases.get(value.toLowerCase()) ?? "";
}

function safeId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildGraph(datasetDir) {
  const rel = (file) => path.join(datasetDir, file);
  const graphDir = rel("graph");
  const graphFile = path.join(graphDir, "context-relationships.jsonl");
  fs.mkdirSync(graphDir, { recursive: true });

  const apps = readCsv(rel("family-2-technology-estate/F05_applications-systems.csv"));
  const mappings = readCsv(rel("family-2-technology-estate/F06_system-function-mapping.csv"));
  const integrations = readCsv(rel("family-3-data-connectivity/F10_integrations-interfaces.csv"));
  const ownership = readCsv(rel("family-8-semantic-enrichment/F19_team-application-ownership.csv"));
  const dependencies = readCsv(rel("family-8-semantic-enrichment/F20_capability-system-dependency.csv"));
  const lineage = readCsv(rel("family-8-semantic-enrichment/F21_data-product-ownership-lineage.csv"));
  const contractMap = readCsv(rel("family-8-semantic-enrichment/F22_contract-system-service-map.csv"));
  const serviceMap = readCsv(rel("family-8-semantic-enrichment/F23_operational-service-map.csv"));
  const aiAssets = readCsv(rel("family-6-governance-ai-evidence/F17_ai-automation-footprint.csv"));
  const aiValueMap = readCsv(rel("family-8-semantic-enrichment/F24_ai-use-case-system-value-map.csv"));
  const kpis = readCsv(rel("family-5-execution-operations/F15_kpis-outcome-evidence.csv"));

  const appAliases = new Map();
  const teamAliases = new Map();
  const vendorAliases = new Map();
  const dataProductAliases = new Map();
  const aiAliases = new Map();
  const kpiAliases = new Map();

  for (const row of apps) {
    const appId = first(row, ["app_id", "application_id"]);
    const name = first(row, ["name", "application_name"]);
    addAlias(appAliases, appId, appId);
    addAlias(appAliases, name, appId);
  }
  for (const row of ownership) {
    const appId = first(row, ["app_id", "application_id"]);
    const appName = first(row, ["name", "application_name"]);
    const teamId = first(row, ["owning_team_id", "team_id"]);
    const teamName = first(row, ["owning_team_name", "team_name"]);
    addAlias(appAliases, appId, appId);
    addAlias(appAliases, appName, appId);
    addAlias(teamAliases, teamId, teamId);
    addAlias(teamAliases, teamName, teamId);
  }
  for (const row of contractMap) {
    const vendorId = first(row, ["vendor_id", "contract_id"]);
    const vendorName = first(row, ["vendor_name"]);
    addAlias(vendorAliases, vendorId, vendorId);
    addAlias(vendorAliases, vendorName, vendorId);
  }
  for (const row of lineage) {
    const dataProductId = first(row, ["data_product_id"]);
    const dataProductName = first(row, ["data_product_name", "name"]);
    addAlias(dataProductAliases, dataProductId, dataProductId);
    addAlias(dataProductAliases, dataProductName, dataProductId);
  }
  for (const row of aiAssets.concat(aiValueMap)) {
    const aiId = first(row, ["ai_asset_id", "tool_id", "model_id"]);
    const aiName = first(row, ["ai_asset_name", "asset_name", "tool_name", "model_name"]);
    addAlias(aiAliases, aiId, aiId);
    addAlias(aiAliases, aiName, aiId);
  }
  for (const row of kpis) {
    const kpiId = first(row, ["kpi_id"]);
    const kpiName = first(row, ["kpi_name"]);
    addAlias(kpiAliases, kpiId, kpiId);
    addAlias(kpiAliases, kpiName, kpiId);
  }

  const seen = new Set();
  const edges = [];
  function edge(from, to, type, sourceFile, properties = {}) {
    if (!from || !to || from === to) return;
    const key = `${type}:${from}:${to}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({
      relationship_key: `REL-${safeId(type)}-${safeId(from)}-${safeId(to)}`,
      relationship_type: type,
      from_record_key: from,
      to_record_key: to,
      source_file: sourceFile,
      properties,
    });
  }

  for (const row of mappings) {
    edge(
      resolve(first(row, ["app_id", "application_id"]), appAliases),
      first(row, ["capability_id"]),
      "supports_capability",
      "F06_system-function-mapping.csv",
      { process_area: first(row, ["process_area", "process_supported"]) },
    );
  }

  for (const row of integrations) {
    edge(
      resolve(first(row, ["source_app_id", "source_system_id", "source_system"]), appAliases),
      resolve(first(row, ["target_app_id", "target_system_id", "target_system"]), appAliases),
      "feeds",
      "F10_integrations-interfaces.csv",
      {
        integration_id: first(row, ["edge_id", "integration_id"]),
        integration_type: first(row, ["integration_type", "interface_type", "protocol_or_standard"]),
        criticality: first(row, ["criticality"]),
      },
    );
  }

  for (const row of ownership) {
    edge(
      resolve(first(row, ["owning_team_id", "team_id", "owning_team_name"]), teamAliases),
      resolve(first(row, ["app_id", "application_id", "application_name"]), appAliases),
      "owns",
      "F19_team-application-ownership.csv",
      {
        owner_role: first(row, ["business_owner_role", "executive_owner_role", "technical_owner_role"]),
        confidence: first(row, ["confidence"]),
      },
    );
  }

  for (const row of dependencies) {
    edge(
      first(row, ["capability_id"]),
      resolve(first(row, ["system_id", "app_id", "application_id", "system_name"]), appAliases),
      "depends_on",
      "F20_capability-system-dependency.csv",
      {
        support_level: first(row, ["support_level"]),
        criticality: first(row, ["criticality"]),
        confidence: first(row, ["confidence"]),
      },
    );
  }

  for (const row of lineage) {
    edge(
      resolveKnown(first(row, ["source_system_id", "source_system_name", "source_system"]), appAliases),
      resolve(first(row, ["data_product_id", "data_product_name"]), dataProductAliases),
      "feeds_data_product",
      "F21_data-product-ownership-lineage.csv",
      {
        platform: first(row, ["platform"]),
        trust_score: first(row, ["trust_score"]),
        confidence: first(row, ["confidence"]),
      },
    );
  }

  for (const row of contractMap) {
    edge(
      resolve(first(row, ["vendor_id", "contract_id", "vendor_name"]), vendorAliases),
      resolve(first(row, ["supported_system_id", "system_id", "app_id", "supported_system_name"]), appAliases),
      "supplies",
      "F22_contract-system-service-map.csv",
      {
        annual_value_usd: first(row, ["annual_value_usd"]),
        renewal_date: first(row, ["renewal_date"]),
        confidence: first(row, ["confidence"]),
      },
    );
  }

  for (const row of serviceMap) {
    edge(
      resolve(first(row, ["owning_team_id", "owning_team_name"]), teamAliases),
      resolve(first(row, ["related_system_id", "system_id", "app_id", "related_system_name"]), appAliases),
      "operates",
      "F23_operational-service-map.csv",
      {
        service_or_process: first(row, ["service_or_process"]),
        monthly_volume_or_count: first(row, ["monthly_volume_or_count"]),
        mttr_hours: first(row, ["mttr_hours"]),
        confidence: first(row, ["confidence"]),
      },
    );
  }

  for (const row of aiAssets) {
    edge(
      resolve(first(row, ["ai_asset_id", "tool_id", "model_id", "asset_name"]), aiAliases),
      resolve(first(row, ["parent_system_id", "app_id", "system_id"]), appAliases),
      "runs_on",
      "F17_ai-automation-footprint.csv",
      {
        status: first(row, ["status"]),
        model_risk_status: first(row, ["model_risk_status"]),
      },
    );
  }

  for (const row of aiValueMap) {
    edge(
      resolve(first(row, ["ai_asset_id", "ai_asset_name"]), aiAliases),
      resolveKnown(first(row, ["linked_kpi", "kpi_id"]), kpiAliases),
      "measured_by",
      "F24_ai-use-case-system-value-map.csv",
      {
        value_basis: first(row, ["value_basis"]),
        confidence: first(row, ["confidence"]),
      },
    );
  }

  fs.writeFileSync(graphFile, `${edges.map((item) => JSON.stringify(item)).join("\n")}\n`);
  return {
    dataset: path.basename(datasetDir),
    graphFile: path.relative(ROOT, graphFile),
    edges: edges.length,
    byType: edges.reduce((acc, item) => {
      acc[item.relationship_type] = (acc[item.relationship_type] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

const selected = process.argv.slice(2);
const dirs = fs
  .readdirSync(DATASETS)
  .filter((name) => name.endsWith("synthetic-v4"))
  .filter((name) => selected.length === 0 || selected.includes(name))
  .map((name) => path.join(DATASETS, name))
  .filter((dir) => fs.existsSync(path.join(dir, "manifest.yaml")));

const results = dirs.map(buildGraph);
console.log(JSON.stringify({ ok: true, datasets: results }, null, 2));
