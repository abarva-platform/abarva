#!/usr/bin/env node
/**
 * Generates the missing analytics convergence layer for a synthetic tenant.
 *
 * WHAT WAS WRONG, PRECISELY
 *
 * The existing integration rows are not junk. They are plausible operational point-to-point
 * integrations between real systems -- a CDC feed from revenue management into inventory, a SOAP
 * call from the contact centre into reservations. Those stay.
 *
 * What was missing is the layer above them. The estate declares four warehouse subject areas, two
 * cloud data domains, three ML workspaces, an event backbone, an ETL platform and two BI tools --
 * and nothing fed any of them. Every system had exactly one inbound edge, so no system was a
 * destination, so the topology had no convergence anywhere and the flow view was 499 disconnected
 * pairs. That is the shape that fails topology fitness, and beautifying it would have produced a
 * diagram that looked like an architecture and described nothing.
 *
 * WHAT THIS GENERATES
 *
 * Routing is deterministic and driven by RECORDED fields -- the flow's business domain and the
 * source system's category -- never by a random draw. Running it twice produces identical output,
 * and a reviewer can check any single edge by reading the two columns it came from.
 *
 * Every generated row is labelled `synthetic_modeled` with the generator version, so no downstream
 * reader can mistake a modelled edge for one a client stated.
 */
import fs from "node:fs";
import path from "node:path";

const GENERATOR_VERSION = "analytics-topology/v1";
const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const tenantKey = process.argv[process.argv.indexOf("--tenant") + 1];

function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && q && n === '"') { cell += '"'; i += 1; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { row.push(cell); cell = ""; continue; }
    if ((c === "\n" || c === "\r") && !q) { if (c === "\r" && n === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const esc = (v) => (/[",\n\r]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const toCsv = (headers, rows) =>
  [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n") + "\n";
function load(p) {
  const raw = parseCsv(fs.readFileSync(p, "utf8"));
  const headers = (raw.shift() ?? []).map((h) => h.trim());
  return { headers, rows: raw.filter((r) => r.some((v) => v.trim())).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()]))) };
}

const root = path.join(ROOT, "datasets/tenant-inputs/active", tenantKey, "current");
const fivePath = path.join(root, "05_data_assets_integrations.csv");
const four = load(path.join(root, "04_applications_systems.csv"));
const five = load(fivePath);

const systems = new Map(four.rows.map((r) => [r.system_name, r]));
const has = (name) => systems.has(name);
const need = (name) => { if (!has(name)) { console.error(`ABORT: routing target "${name}" is not a system in 04. The generator must not invent destinations.`); process.exit(1); } return name; };

/** Business domain -> the subject area or data domain that owns its analytics. */
const DOMAIN_ROUTES = {
  // Operational domains land in the warehouse subject area that owns them.
  "Airport & Ground Operations": "Teradata Enterprise Warehouse — Crew & Ops Subject Area",
  "Flight Operations": "Teradata Enterprise Warehouse — Crew & Ops Subject Area",
  "Crew Operations": "Teradata Enterprise Warehouse — Crew & Ops Subject Area",
  "Network Planning & Scheduling": "Teradata Enterprise Warehouse — Crew & Ops Subject Area",
  "Finance & Accounting": "Teradata Enterprise Warehouse — Finance Subject Area",
  "Procurement & Supply Chain": "Teradata Enterprise Warehouse — Finance Subject Area",
  "Corporate Real Estate & Facilities": "Teradata Enterprise Warehouse — Finance Subject Area",
  "Legal, Regulatory & Compliance": "Teradata Enterprise Warehouse — Finance Subject Area",
  "Cargo & Logistics": "Teradata Enterprise Warehouse — Cargo Subject Area",
  "Loyalty & Customer Marketing": "Teradata Enterprise Warehouse — Loyalty Legacy Subject Area",

  // Commercial and customer domains are the ones already migrated to the cloud platform.
  "Distribution, Sales & E-Commerce": "Snowflake — Commercial Analytics Domain",
  "Revenue Management & Pricing": "Snowflake — Commercial Analytics Domain",
  "Corporate Strategy & M&A Integration": "Snowflake — Commercial Analytics Domain",
  "Customer Experience & Contact Center": "Snowflake — Loyalty & Personalization Domain",
  "In-Flight Services & Catering": "Snowflake — Loyalty & Personalization Domain",

  // Domains whose analytics is model-led rather than report-led.
  "Maintenance & Engineering (MRO)": "Databricks — MRO Predictive Workspace",
  "Fuel Management & Sustainability": "Databricks — Ops AI Workspace",
  "Safety & Security": "Databricks — Ops AI Workspace",

  // Corporate function domains.
  "Human Resources & Labor Relations": "Teradata Enterprise Warehouse — Finance Subject Area",
  "Information Technology & Digital": "Snowflake — Commercial Analytics Domain",
  "Cybersecurity & IT Risk": "Databricks — Ops AI Workspace",
  "Data, Analytics & AI": "Snowflake — Commercial Analytics Domain",
};
/** Used only when a source system's category, not its domain, decides where its data goes. */
const CATEGORY_ROUTES = {
  "Data & Analytics Platform": "Tableau Enterprise BI",
  "Integration Platform": "Confluent Kafka Event Backbone",
};
const DEFAULT_ROUTE = "Snowflake — Commercial Analytics Domain";

/** Mechanism follows the cadence the row already records, rather than being chosen freshly. */
const MECHANISM_FOR = {
  real_time: "Kafka Streaming",
  near_real_time: "Kafka Streaming",
  hourly: "Database Replication (CDC)",
  daily_batch: "Batch File Transfer (SFTP)",
  nightly_batch: "Batch File Transfer (SFTP)",
  weekly: "Batch File Transfer (SFTP)",
};

for (const target of [...Object.values(DOMAIN_ROUTES), ...Object.values(CATEGORY_ROUTES), DEFAULT_ROUTE]) need(target);

// An unrouted business domain falls to the default and quietly concentrates there, which is how
// one destination ended up with 59 feeds in the first draft. Every domain present in the data must
// be routed deliberately.
const unrouted = [...new Set(five.rows.map((r) => r.data_domain).filter(Boolean))].filter((d) => !DOMAIN_ROUTES[d]);
if (unrouted.length) {
  console.error(`ABORT: ${unrouted.length} business domains have no declared analytics owner:`);
  for (const d of unrouted) console.error(`    ${d}`);
  process.exit(1);
}
const BI = { warehouse: need("Tableau Enterprise BI"), finance: need("Power BI Premium (Finance & Ops)") };

// One analytics feed per distinct operational SOURCE system, routed by what the record says.
const feeds = new Map();
for (const row of five.rows) {
  const source = row.source_system;
  if (!source || !has(source)) continue;
  const category = systems.get(source)?.system_category ?? "";
  // Platforms are destinations, not feeders; feeding them from themselves would be circular.
  if (category === "Data & Analytics Platform" || category === "Integration Platform") continue;
  const target = DOMAIN_ROUTES[row.data_domain] ?? CATEGORY_ROUTES[category] ?? DEFAULT_ROUTE;
  if (source === target) continue;
  const key = `${source}::${target}`;
  if (feeds.has(key)) continue;
  feeds.set(key, { source, target, domain: row.data_domain, cadence: row.refresh_frequency || "nightly_batch", regulated: row.regulated_data_flag });
}

// And the serving hop: each analytics platform publishes to BI.
const servings = [];
for (const platform of new Set([...feeds.values()].map((f) => f.target))) {
  const bi = platform.includes("Finance") ? BI.finance : BI.warehouse;
  if (platform === bi) continue;
  servings.push({ source: platform, target: bi, domain: "Data, Analytics & AI", cadence: "nightly_batch", regulated: "false" });
}

const headers = [...five.headers];
for (const c of ["source_system_ref_id", "target_system_ref_id"]) if (!headers.includes(c)) headers.push(c);

const stamp = new Date(0).toISOString().slice(0, 10);
let seq = 0;
const generated = [...feeds.values(), ...servings].map((f) => {
  seq += 1;
  const row = Object.fromEntries(headers.map((h) => [h, ""]));
  row.tenant_key = tenantKey;
  row.data_asset_name = servings.includes(f)
    ? `${f.source} curated publication to ${f.target}`
    : `${f.source} analytics feed to ${f.target}`;
  row.data_domain = f.domain;
  row.source_system = f.source;
  row.target_system = f.target;
  row.integration_type = MECHANISM_FOR[f.cadence] ?? "Batch File Transfer (SFTP)";
  row.platform_or_database = "Informatica PowerCenter ETL";
  row.current_state_or_target_state = "current_state";
  row.refresh_frequency = f.cadence;
  row.quality_status = "partially_governed";
  row.regulated_data_flag = f.regulated || "false";
  row.analytics_usage = "enterprise_reporting";
  row.source_file = "generated:analytics-topology";
  row.source_date = stamp;
  row.confidence = "synthetic_modeled";
  row.known_gaps = `Modelled analytics edge, not client-stated. Generator ${GENERATOR_VERSION}; routed from recorded data_domain and system_category.`;
  row.source_classification = "synthetic_modeled";
  row.consolidation_rule_used = GENERATOR_VERSION;
  if (headers.includes("data_asset_id")) row.data_asset_id = `GEN-ANL-${String(seq).padStart(4, "0")}`;
  return row;
});

const all = [...five.rows, ...generated];
const fanIn = new Map();
for (const r of all) {
  const t = r.target_system, s = r.source_system;
  if (!t || !s) continue;
  if (!fanIn.has(t)) fanIn.set(t, new Set());
  fanIn.get(t).add(s);
}
const counts = [...fanIn.values()].map((s) => s.size).sort((a, b) => b - a);

console.log(`tenant: ${tenantKey}  generator: ${GENERATOR_VERSION}`);
console.log(`  existing operational flows: ${five.rows.length}   (kept, unchanged)`);
console.log(`  generated analytics feeds:  ${feeds.size}`);
console.log(`  generated serving hops:     ${servings.length}`);
console.log(`  total flows after:          ${all.length}`);
console.log(`  distinct targets:           ${fanIn.size}`);
console.log(`  fan-in max/p50/singletons:  ${counts[0]} / ${counts[Math.floor(counts.length / 2)]} / ${counts.filter((c) => c === 1).length}`);
console.log(`\n  top destinations:`);
for (const [t, s] of [...fanIn].sort((a, b) => b[1].size - a[1].size).slice(0, 8)) {
  console.log(`    ${String(s.size).padStart(3)} sources -> ${t}`);
}

if (!APPLY) { console.log(`\n(dry run — pass --apply to write)`); process.exit(0); }
fs.writeFileSync(fivePath, toCsv(headers, all), "utf8");
console.log(`\nwrote ${path.relative(ROOT, fivePath)}`);
