#!/usr/bin/env node
// SkyHarbor Air — comprehensive synthetic dataset v2 (loader-ready, template-aligned).
//
// Emits per-dimension CSVs whose columns EXACTLY match the NORTHSTAR context
// templates (template-registry.ts), so the governed Admin bulk loader promotes
// them to structured FACTS (enterprise_context_records/facts) in stage_and_process
// mode — not just narrative chunks. Plus a bulk manifest.json mapping each file to
// its templateId.
//
// Scope: an ~$80B airline with a ~$2B IT budget, across all modules:
//   Source (apps/CMDB, infra estate, vendor contracts, SLAs, integration, IT
//   financials, org), Moves (initiatives), Tower (DORA, incidents, ERP), and
//   Intelligence (AI tooling, capability map).
//
// 100% synthetic (cover name "SkyHarbor Air"); no real carrier identity/executive.
// Deterministic (seeded) so re-runs are byte-stable → idempotent upserts.
//
// Usage: node scripts/skyharbor/generate-skyharbor-v2.mjs
// Output: datasets/skyharbor-air-synthetic-v2/{csv,manifest.json}

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..", "..");
const OUT = join(REPO, "datasets", "skyharbor-air-synthetic-v2");
const CSV_DIR = join(OUT, "csv");
const TENANT = "skyharbor-air";
const MAX_ROWS = 2000; // loader cap per CSV

// ── deterministic PRNG (mulberry32) ─────────────────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(0x5a1b0a17); // "skyharbor" seed
const pick = (arr) => arr[Math.floor(r() * arr.length)];
const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const money = (lo, hi) => int(lo, hi);

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function writeCsv(name, headers, rows) {
  if (rows.length > MAX_ROWS) throw new Error(`${name}: ${rows.length} rows > cap ${MAX_ROWS}`);
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(","));
  mkdirSync(CSV_DIR, { recursive: true });
  writeFileSync(join(CSV_DIR, name), lines.join("\n") + "\n");
  return { name, rows: rows.length };
}

// ── airline domain vocabulary (synthetic) ───────────────────────────────────
const TOWERS = ["Mainframe", "Compute", "Storage", "Network", "Application Mgmt", "Cloud", "Security", "Data & Analytics", "End User Compute", "Service Desk", "Telecom", "Integration"];
const FUNCTIONS = ["PSS", "DCS", "Loyalty", "Cargo", "MRO", "Crew", "Revenue Accounting", "Finance", "HR", "Procurement", "Flight Ops", "Network Planning", "Maintenance", "Catering", "Ground Ops", "Customer", "Commercial", "Safety"];
const AMS_VENDORS = ["IBM Global Services", "Accenture", "TCS", "Infosys", "Wipro", "Capgemini", "Internal"];
const PLATFORMS = ["SAP S/4HANA", "Oracle Fusion", "Sabre", "Amadeus", "Salesforce", "Workday", "ServiceNow", "Custom Java", "Mainframe COBOL", "Snowflake", "Databricks"];
const DEPLOY = ["on_prem_mainframe", "on_prem_distributed", "private_cloud", "aws", "azure", "gcp", "saas"];
const CRIT = ["tier1", "tier1", "tier2", "tier2", "tier3"];
const LOCS = ["DC-East (primary)", "DC-West (DR)", "AWS us-east-1", "AWS eu-west-1", "Azure East US 2", "GCP us-central1", "Colo-Hub-A"];
const FNAMES = ["Jordan", "Riya", "Marcus", "Lena", "Tomas", "Aisha", "Diego", "Priya", "Sven", "Naomi", "Hassan", "Elena", "Kenji", "Maya", "Owen", "Farah", "Luca", "Ingrid", "Rahul", "Chloe"];
const LNAMES = ["Vale", "Okafor", "Bauer", "Costa", "Nair", "Lindqvist", "Haddad", "Tanaka", "Romero", "Singh", "Petrov", "Mensah", "Lange", "Iqbal", "Reyes", "Novak", "Dubois", "Sato", "Khan", "Park"];
const fullName = () => `${pick(FNAMES)} ${pick(LNAMES)}`;
const RENEWALS = ["2026-09-30", "2026-12-31", "2027-03-31", "2027-06-30", "2027-12-31", "2028-06-30"];

const files = [];

// 1 ── enterprise-profile → enterprise_profile
files.push(writeCsv("enterprise-profile.csv",
  ["metric", "value", "period", "source", "revenue_usd", "employees", "countries", "business_units", "debt_usd", "it_budget_usd"],
  [{ metric: "enterprise_snapshot", value: "SkyHarbor Air FY2026", period: "FY2026", source: "board_technology_update_2026q1", revenue_usd: 81_400_000_000, employees: 92_000, countries: 64, business_units: "Passenger,Cargo,Loyalty,MRO,Holidays", debt_usd: 14_200_000_000, it_budget_usd: 2_050_000_000 }]));

// 2 ── financial-kpi-workbook → financial_kpis (IT budget line-by-line ≈ $2.05B)
{
  const cats = ["Labor (internal)", "Vendor / MSP", "Hardware", "Software & License", "Cloud", "Depreciation", "Telecom"];
  const periods = ["FY2025 actual", "FY2026 budget"];
  const rows = [];
  let id = 0;
  for (const period of periods) {
    for (const tower of TOWERS) {
      for (const cat of cats) {
        // skew: mainframe/AMS/cloud heavier
        const base = (tower === "Mainframe" ? 60 : tower === "Application Mgmt" ? 70 : tower === "Cloud" ? 55 : 18) +
          (cat === "Vendor / MSP" ? 40 : cat === "Labor (internal)" ? 25 : cat === "Cloud" ? 30 : 8);
        rows.push({
          period, metric: "it_spend", segment: `${tower} / ${cat}`,
          value: money(base * 50_000, base * 950_000), currency_or_unit: "USD",
          margin_bridge_driver: cat === "Vendor / MSP" ? "managed_services" : cat === "Cloud" ? "consumption" : "run",
          source_report: "it_budget_book_fy26.xlsx", line_id: `FIN-${String(++id).padStart(4, "0")}`,
        });
      }
    }
  }
  files.push(writeCsv("it-financials.csv",
    ["line_id", "period", "metric", "value", "currency_or_unit", "segment", "margin_bridge_driver", "source_report"], rows));
}

// 3 ── org-roles → org_roles_teams (headcount by level; answers # CXO/SVP/VP/Director)
{
  const rows = [];
  const ceo = { person_id: "ORG-0001", name: fullName(), level: "CEO", role: "Chief Executive Officer", manager_id: "", cost_center: "CORP", location: "HQ" };
  rows.push(ceo);
  const cxoRoles = ["Chief Information Officer", "Chief Technology Officer", "Chief Digital Officer", "Chief Data & Analytics Officer", "Chief Information Security Officer", "Chief Operating Officer", "Chief Financial Officer"];
  const cxos = cxoRoles.map((role, i) => ({ person_id: `ORG-${String(i + 2).padStart(4, "0")}`, name: fullName(), level: "C-Level", role, manager_id: "ORG-0001", cost_center: "EXEC", location: "HQ" }));
  rows.push(...cxos);
  let id = cxos.length + 2;
  const mk = (level, role, mgr, n) => { const out = []; for (let i = 0; i < n; i++) { const pid = `ORG-${String(id++).padStart(4, "0")}`; out.push({ person_id: pid, name: fullName(), level, role: `${role} ${i + 1}`, manager_id: mgr, cost_center: pick(["IT-RUN", "IT-CHANGE", "DATA", "SEC", "EA", "DIGITAL"]), location: pick(["HQ", "DC-East", "GCC-Bangalore", "Remote"]) }); } return out; };
  const itCxo = cxos.find((c) => c.role.includes("Information Officer"));
  const svps = mk("SVP", "SVP", itCxo.person_id, 9); rows.push(...svps);
  for (const svp of svps) rows.push(...mk("VP", `VP under ${svp.role}`, svp.person_id, int(3, 5)));
  const vps = rows.filter((x) => x.level === "VP");
  for (const vp of vps) rows.push(...mk("Director", `Director`, vp.person_id, int(2, 4)));
  const dirs = rows.filter((x) => x.level === "Director");
  for (const d of dirs.slice(0, 60)) rows.push(...mk("Sr Manager", "Sr Manager", d.person_id, int(1, 2)));
  files.push(writeCsv("org-roles.csv", ["person_id", "name", "level", "role", "manager_id", "cost_center", "location"], rows));
}

// 4 ── application-portfolio → application_portfolio (CMDB, ~600 apps)
const APP_IDS = [];
{
  const rows = [];
  for (let i = 1; i <= 600; i++) {
    const fn = pick(FUNCTIONS); const app_id = `APP-${String(i).padStart(4, "0")}`; APP_IDS.push(app_id);
    rows.push({
      app_id, name: `${fn} ${pick(["Core", "Engine", "Hub", "Service", "Gateway", "Manager", "Ledger", "Portal"])} ${i}`,
      criticality: pick(CRIT), owner_role: `Director ${fn}`, system_of_record: pick(PLATFORMS),
      ams_vendor: pick(AMS_VENDORS), time_classification: pick(["run", "grow", "transform"]),
      business_function: fn, deployment_model: pick(DEPLOY), annual_run_cost_usd: money(80_000, 9_500_000),
    });
  }
  files.push(writeCsv("application-portfolio.csv",
    ["app_id", "name", "criticality", "owner_role", "system_of_record", "ams_vendor", "time_classification", "business_function", "deployment_model", "annual_run_cost_usd"], rows));
}

// 5 ── infrastructure-estate → infrastructure_estate (mainframe/legacy/multicloud/servers, ~700)
{
  const classes = [
    ["IBM Z mainframe LPAR", "IBM z16", 60], ["Power system", "IBM Power E1080", 40],
    ["x86 server", "Dell PowerEdge R760", 180], ["Teradata appliance", "Teradata IntelliFlex", 12],
    ["Netezza appliance", "IBM Netezza N3001 (legacy)", 8], ["Storage array", "Dell PowerMax", 50],
    ["Network core", "Cisco Nexus 9000", 70], ["AWS account", "aws-skyharbor", 90],
    ["Azure subscription", "azure-skyharbor", 60], ["GCP project", "gcp-skyharbor", 30],
    ["VMware cluster", "vSphere 8", 80], ["Data center", "Owned DC", 6],
  ];
  const rows = []; let i = 0;
  for (const [cls, model, n] of classes) {
    for (let k = 0; k < n; k++) {
      const cloud = cls.includes("AWS") ? "aws" : cls.includes("Azure") ? "azure" : cls.includes("GCP") ? "gcp" : "";
      rows.push({
        asset_name: `${cls.split(" ")[0].toUpperCase()}-${String(++i).padStart(4, "0")}`, asset_class: cls,
        make_model: model, location: cloud ? pick(LOCS.filter((l) => l.toLowerCase().includes(cloud))) || pick(LOCS) : pick(LOCS.slice(0, 2).concat(LOCS[6])),
        virtualization: cls.includes("VMware") ? "vSphere" : cls.includes("mainframe") ? "PR/SM" : "none",
        cloud_account: cloud ? `${cloud}-skyharbor-${int(1, 9)}` : "", capacity: pick(["small", "medium", "large", "xlarge"]),
        owner: `VP Infrastructure`, lifecycle: cls.includes("legacy") || cls.includes("Netezza") ? "end_of_life" : pick(["current", "current", "aging"]),
      });
    }
  }
  files.push(writeCsv("infrastructure-estate.csv",
    ["asset_name", "asset_class", "make_model", "location", "virtualization", "cloud_account", "capacity", "owner", "lifecycle"], rows));
}

// 6 ── integration-topology → integration_topology (~500 edges)
{
  const rows = [];
  for (let i = 1; i <= 500; i++) {
    rows.push({
      edge_id: `INT-${String(i).padStart(4, "0")}`, source_app_id: pick(APP_IDS), target_app_id: pick(APP_IDS),
      integration_type: pick(["MQ", "REST", "SOAP", "file/SFTP", "Kafka", "ETL batch", "DB link"]),
      latency_sla: pick(["realtime", "near-realtime", "batch-daily", "batch-hourly"]),
      kill_blocker_flag: r() < 0.12 ? "true" : "false",
    });
  }
  files.push(writeCsv("integration-topology.csv",
    ["edge_id", "source_app_id", "target_app_id", "integration_type", "latency_sla", "kill_blocker_flag"], rows));
}

// 7 ── vendor-contracts → vendor_contracts (~120, total ≈ $2B)
{
  const anchors = [
    ["VEN-0001", "IBM Global Services", 280_000_000, "AMS + mainframe managed services"],
    ["VEN-0002", "Amazon Web Services", 180_000_000, "Cloud consumption + EDP"],
    ["VEN-0003", "Accenture", 120_000_000, "Application modernization + AMS"],
    ["VEN-0004", "TCS", 95_000_000, "Offshore AMS + testing"],
    ["VEN-0005", "Microsoft Azure", 70_000_000, "Cloud + M365"],
    ["VEN-0006", "Oracle", 60_000_000, "ERP + database"],
    ["VEN-0007", "SAP", 55_000_000, "S/4HANA + licenses"],
    ["VEN-0008", "Sabre", 48_000_000, "PSS platform"],
    ["VEN-0009", "Salesforce", 22_000_000, "CRM + loyalty"],
    ["VEN-0010", "Workday", 18_000_000, "HCM + finance"],
  ];
  const rows = anchors.map(([vendor_id, vendor_name, annual_value_usd, scope]) => ({
    vendor_id, vendor_name, annual_value_usd, renewal_date: pick(RENEWALS),
    exit_terms: pick(["12mo termination assistance", "6mo notice", "TSA up to 9mo"]),
    ai_clauses: r() < 0.4 ? "no-train-on-our-data" : "none", data_rights: pick(["buyer-owned", "shared", "vendor-hosted"]),
    category: "strategic", scope,
  }));
  for (let i = 11; i <= 120; i++) {
    rows.push({
      vendor_id: `VEN-${String(i).padStart(4, "0")}`, vendor_name: `${pick(["Apex", "Northwind", "Helios", "Vertex", "Orbit", "Cardinal", "Summit", "Beacon"])} ${pick(["Systems", "Technologies", "Software", "Consulting", "Cloud", "Data"])}`,
      annual_value_usd: money(500_000, 18_000_000), renewal_date: pick(RENEWALS),
      exit_terms: pick(["90d notice", "6mo notice", "auto-renew"]), ai_clauses: r() < 0.2 ? "no-train-on-our-data" : "none",
      data_rights: pick(["buyer-owned", "shared", "vendor-hosted"]), category: pick(["tactical", "commodity", "specialist"]), scope: pick(["SaaS", "staff aug", "licenses", "support", "niche AMS"]),
    });
  }
  files.push(writeCsv("vendor-contracts.csv",
    ["vendor_id", "vendor_name", "annual_value_usd", "renewal_date", "exit_terms", "ai_clauses", "data_rights", "category", "scope"], rows));
}

// 8 ── sla-register → service_levels (~120 SLAs across towers) [NEW dimension]
{
  const metrics = [["Availability", "99.9%", "monthly"], ["P1 resolution", "4h", "per-incident"], ["P2 resolution", "8h", "per-incident"], ["Batch completion", "06:00 local", "daily"], ["Change success rate", "98%", "monthly"], ["First-contact resolution", "75%", "monthly"]];
  const rows = []; let i = 0;
  for (const tower of TOWERS) {
    for (const [metric, target, win] of metrics) {
      const actualNum = 90 + r() * 10;
      rows.push({
        sla_id: `SLA-${String(++i).padStart(4, "0")}`, service_name: `${tower} service`, metric, target, measurement_window: win,
        actual: metric === "Availability" ? `${actualNum.toFixed(2)}%` : metric.includes("resolution") ? `${(parseFloat(target) * (0.8 + r() * 0.6)).toFixed(1)}h` : `${(85 + r() * 14).toFixed(0)}%`,
        breach_count: int(0, 6), credit_at_risk_usd: money(0, 1_200_000), tower, owner_role: "VP IT Service Management",
      });
    }
  }
  files.push(writeCsv("sla-register.csv",
    ["sla_id", "service_name", "metric", "target", "measurement_window", "actual", "breach_count", "credit_at_risk_usd", "tower", "owner_role"], rows));
}

// 9 ── initiative-portfolio → transformation_initiatives (Moves, ~60)
{
  const titles = ["Mainframe offload to cloud", "AMS re-sourcing", "PSS migration", "Loyalty replatform", "Data lakehouse consolidation", "GenAI service desk", "Network SD-WAN", "Zero-trust security", "Cargo digitization", "MRO predictive maintenance", "Crew optimization AI", "Revenue accounting automation", "FinOps program", "Legacy Teradata exit", "Integration modernization"];
  const rows = [];
  for (let i = 1; i <= 60; i++) {
    rows.push({
      initiative_id: `INI-${String(i).padStart(3, "0")}`, title: `${pick(titles)} (wave ${int(1, 4)})`,
      status: pick(["proposed", "approved", "in_flight", "in_flight", "at_risk", "complete"]),
      sponsor_role: pick(["CIO", "CTO", "CDO", "CDAO", "COO"]), committed_usd: money(2_000_000, 90_000_000),
      projected_value_usd: money(3_000_000, 140_000_000), linked_app_ids: `${pick(APP_IDS)};${pick(APP_IDS)}`,
    });
  }
  files.push(writeCsv("initiatives.csv",
    ["initiative_id", "title", "status", "sponsor_role", "committed_usd", "projected_value_usd", "linked_app_ids"], rows));
}

// 10 ── dora-baseline → delivery_dora_devex (Tower, ~40 teams)
{
  const rows = [];
  for (let i = 1; i <= 40; i++) {
    rows.push({
      team_id: `TEAM-${String(i).padStart(3, "0")}`, measured_at: "2026-05-31",
      deploy_freq_per_week: (r() * 14).toFixed(1), lead_time_hours: (r() * 240).toFixed(0),
      mttr_hours: (r() * 24).toFixed(1), change_failure_rate_pct: (r() * 25).toFixed(1),
    });
  }
  files.push(writeCsv("dora-baseline.csv",
    ["team_id", "measured_at", "deploy_freq_per_week", "lead_time_hours", "mttr_hours", "change_failure_rate_pct"], rows));
}

// 11 ── incidents-change-history → incidents_ops_telemetry (Tower, ~400)
{
  const rows = [];
  for (let i = 1; i <= 400; i++) {
    const opened = `2026-0${int(1, 5)}-${String(int(1, 28)).padStart(2, "0")}`;
    rows.push({
      incident_id: `INC-${String(i).padStart(5, "0")}`, system_id: pick(APP_IDS), severity: pick(["P1", "P2", "P2", "P3", "P3", "P4"]),
      opened_at: opened, closed_at: opened, root_cause: pick(["change", "capacity", "vendor outage", "data quality", "mainframe batch", "integration", "human error", "unknown"]),
    });
  }
  files.push(writeCsv("incidents.csv", ["incident_id", "system_id", "severity", "opened_at", "closed_at", "root_cause"], rows));
}

// 12 ── ai-tool-footprint → ai_tooling_model_inventory (Intelligence, ~40)
{
  const rows = [];
  const tools = ["GitHub Copilot", "Claude Code", "ServiceNow Now Assist", "Salesforce Einstein", "Custom RAG assistant", "Amazon Q", "Azure OpenAI app"];
  for (let i = 1; i <= 40; i++) {
    rows.push({
      tool_id: `AIT-${String(i).padStart(3, "0")}`, tool_name: pick(tools), owner_role: pick(["CDAO", "VP Engineering", "Director Data"]),
      workflow: pick(["code", "service desk", "revenue accounting", "crew comms", "fraud", "forecasting"]),
      risk_classification: pick(["low", "medium", "high"]), model_name: pick(["claude-opus", "gpt-4o", "internal-llm", "gemini"]), regulated_workflow_flag: r() < 0.3 ? "true" : "false",
    });
  }
  files.push(writeCsv("ai-tooling.csv",
    ["tool_id", "tool_name", "owner_role", "workflow", "risk_classification", "model_name", "regulated_workflow_flag"], rows));
}

// 13 ── business-capability-map → business_capability (~80)
{
  const caps = ["Reservations", "Check-in", "Boarding", "Baggage", "Loyalty", "Pricing & RM", "Cargo booking", "MRO planning", "Crew scheduling", "Flight planning", "Disruption mgmt", "Revenue accounting", "Procurement", "HR", "Finance close", "Customer care", "Fraud", "Network planning", "Fuel mgmt", "Safety reporting"];
  const rows = [];
  let i = 0;
  for (const cap of caps) for (let k = 0; k < 4; k++) rows.push({ capability_name: `${cap} L${k + 1}`, business_function: pick(FUNCTIONS), value_stream: pick(["Sell", "Serve", "Operate", "Support"]), owner: `Director ${cap.split(" ")[0]}`, cap_id: `CAP-${String(++i).padStart(3, "0")}` });
  files.push(writeCsv("business-capabilities.csv", ["cap_id", "capability_name", "business_function", "value_stream", "owner"], rows));
}

// 14 ── erp-landscape-workbook → erp_landscape (~60)
{
  const rows = [];
  const procs = ["Record to Report", "Procure to Pay", "Order to Cash", "Hire to Retire", "Plan to Inventory", "Acquire to Retire"];
  for (let i = 1; i <= 60; i++) {
    rows.push({
      erp_object_id: `ERP-${String(i).padStart(3, "0")}`, platform: pick(["SAP S/4HANA", "Oracle Fusion", "Legacy ECC"]),
      process_area: pick(procs), owner_role: pick(["CFO FP&A", "VP Finance Systems", "Director ERP"]), business_unit: pick(["Passenger", "Cargo", "Group", "MRO"]),
      customization_count: int(0, 240), tsa_dependency: r() < 0.3 ? "true" : "false",
    });
  }
  files.push(writeCsv("erp-landscape.csv",
    ["erp_object_id", "platform", "process_area", "owner_role", "business_unit", "customization_count", "tsa_dependency"], rows));
}

// ── bulk manifest (file → templateId) ───────────────────────────────────────
const MANIFEST_FILES = [
  ["enterprise-profile.csv", "enterprise-profile"],
  ["it-financials.csv", "financial-kpi-workbook"],
  ["org-roles.csv", "org-roles"],
  ["application-portfolio.csv", "application-portfolio"],
  ["infrastructure-estate.csv", "infrastructure-estate"],
  ["integration-topology.csv", "integration-topology"],
  ["vendor-contracts.csv", "vendor-contracts"],
  ["sla-register.csv", "sla-register"],
  ["initiatives.csv", "initiative-portfolio"],
  ["dora-baseline.csv", "dora-baseline"],
  ["incidents.csv", "incidents-change-history"],
  ["ai-tooling.csv", "ai-tool-footprint"],
  ["business-capabilities.csv", "business-capability-map"],
  ["erp-landscape.csv", "erp-landscape-workbook"],
];
const manifest = {
  loadName: "SkyHarbor Air comprehensive substrate v2",
  tenantClientKey: TENANT,
  datasetId: "skyharbor-air-synthetic-v2",
  sourceBasis: "synthetic_comparable",
  attestation: { dataAuthority: "synthetic", containsSensitive: false, version: "v1" },
  files: MANIFEST_FILES.map(([path, templateId]) => ({ path, templateId })),
};
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const totalRows = files.reduce((s, f) => s + f.rows, 0);
console.log(JSON.stringify({ out: OUT, files, totalFiles: files.length, totalRows, manifest: "manifest.json" }, null, 2));
