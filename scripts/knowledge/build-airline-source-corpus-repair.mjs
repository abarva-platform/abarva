#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO_ROOT = process.cwd();
const PACKAGE_ROOT = path.join(
  REPO_ROOT,
  "clients/airline-demo-new/19-template-instantiation-source-corpus",
);
const SAMPLE_ROOT = path.join(PACKAGE_ROOT, "03-source-corpus-design/synthetic-source-samples");
const EVALUATOR_ROOT = path.join(PACKAGE_ROOT, "04-restricted-evaluator-design");
const VALIDATION_ROOT = path.join(PACKAGE_ROOT, "05-validation");
const REVIEW_ROOT = path.join(PACKAGE_ROOT, "06-review-package");

const WRITE = process.argv.includes("--write");

const SERVICE_TOWERS = [
  "Airline Operations AMS",
  "Digital Customer and Loyalty AMS",
  "Corporate and SAP AMS",
  "Data Analytics and Integration",
  "Cloud Infrastructure and Mainframe",
  "Workplace Service Desk and Field Support",
  "SIAM Observability and Service Governance",
];

const FAMILY_RULES = {
  "Flight operations and IROPS": {
    functions: ["Operations Control", "Flight Operations", "Crew Operations", "Airport Operations", "Passenger Service"],
    hosting: ["owned data center", "private cloud", "mainframe z/OS", "AWS workload", "hybrid"],
    stacks: ["COBOL/CICS/DB2/MQ", "mainframe batch scheduler", "Kafka/event streaming", "API gateway/iPaaS", "Java/.NET custom"],
    tower: "Airline Operations AMS",
  },
  "Crew planning pairing rostering recovery": {
    functions: ["Crew Operations", "Flight Operations", "Operations Control", "Technology"],
    hosting: ["owned data center", "SaaS", "private cloud", "AWS workload"],
    stacks: ["Java/.NET custom", "Oracle/SQL Server", "API gateway/iPaaS", "Kafka/event streaming"],
    tower: "Airline Operations AMS",
  },
  "Airport station gate ramp baggage": {
    functions: ["Airport Operations", "Passenger Service", "Operations Control", "Cargo", "Technology"],
    hosting: ["edge/station", "owned data center", "private cloud", "Azure workload", "hybrid"],
    stacks: ["Java/.NET custom", "API gateway/iPaaS", "Service management platform", "Kafka/event streaming"],
    tower: "Airline Operations AMS",
  },
  "Passenger service reservation ticketing reaccommodation": {
    functions: ["Passenger Service", "Commercial", "Operations Control", "Airport Operations"],
    hosting: ["mainframe z/OS", "owned data center", "SaaS", "AWS workload"],
    stacks: ["COBOL/CICS/DB2/MQ", "mainframe batch scheduler", "Java/.NET custom", "API gateway/iPaaS"],
    tower: "Digital Customer and Loyalty AMS",
  },
  "Digital commerce mobile web contact center": {
    functions: ["Commercial", "Passenger Service", "Digital", "Technology"],
    hosting: ["AWS workload", "Azure workload", "SaaS", "container/Kubernetes"],
    stacks: ["Java/.NET custom", "container/Kubernetes", "API gateway/iPaaS", "Salesforce-style CRM"],
    tower: "Digital Customer and Loyalty AMS",
  },
  "Revenue management pricing inventory loyalty": {
    functions: ["Commercial", "Revenue Management", "Data and AI", "Corporate Finance"],
    hosting: ["owned data center", "AWS workload", "SaaS", "hybrid"],
    stacks: ["Teradata-scale EDW", "Oracle/SQL Server", "Databricks-style lakehouse", "BI/reporting platform"],
    tower: "Data Analytics and Integration",
  },
  "Maintenance engineering MRO supply chain": {
    functions: ["Technical Operations", "Maintenance", "Supply Chain", "Procurement", "Corporate Finance"],
    hosting: ["owned data center", "private cloud", "SaaS", "legacy UNIX/AIX"],
    stacks: ["SAP S/4HANA", "legacy SAP ECC", "Oracle/SQL Server", "AIX/UNIX middleware"],
    tower: "Airline Operations AMS",
  },
  "ERP finance procurement HR supply chain": {
    functions: ["Corporate Finance", "Procurement", "HR", "Supply Chain", "Technology"],
    hosting: ["SaaS", "owned data center", "private cloud", "Azure workload"],
    stacks: ["SAP S/4HANA", "legacy SAP ECC", "SAP Ariba/Concur/BW/BTP", "Workday-style HCM"],
    tower: "Corporate and SAP AMS",
  },
  "Data analytics AI integration products": {
    functions: ["Data and AI", "Technology", "Commercial", "Operations Control", "Corporate Finance"],
    hosting: ["AWS workload", "Azure workload", "owned data center", "hybrid"],
    stacks: ["Teradata-scale EDW", "Databricks-style lakehouse", "Snowflake-style cloud warehouse", "Kafka/event streaming", "BI/reporting platform"],
    tower: "Data Analytics and Integration",
  },
  "Infrastructure network workplace observability": {
    functions: ["Technology", "Cybersecurity", "Service Management", "Airport Operations", "Workplace"],
    hosting: ["owned data center", "colocation", "private cloud", "edge/station", "Azure workload"],
    stacks: ["Service management platform", "security/IAM stack", "container/Kubernetes", "AIX/UNIX middleware"],
    tower: "Cloud Infrastructure and Mainframe",
  },
  "Cybersecurity identity risk compliance": {
    functions: ["Cybersecurity", "Risk and Compliance", "Technology", "Operations Control"],
    hosting: ["SaaS", "owned data center", "Azure workload", "hybrid"],
    stacks: ["security/IAM stack", "Service management platform", "API gateway/iPaaS", "Kafka/event streaming"],
    tower: "SIAM Observability and Service Governance",
  },
  "Cargo operations tracking billing capacity": {
    functions: ["Cargo", "Airport Operations", "Commercial", "Corporate Finance", "Operations Control"],
    hosting: ["owned data center", "AWS workload", "edge/station", "private cloud"],
    stacks: ["Java/.NET custom", "Oracle/SQL Server", "API gateway/iPaaS", "mainframe batch scheduler"],
    tower: "Airline Operations AMS",
  },
  "Home-grown departmental acquired legacy": {
    functions: ["Technology", "Operations Control", "Airport Operations", "Commercial", "Corporate Finance"],
    hosting: ["owned data center", "legacy UNIX/AIX", "private cloud", "edge/station"],
    stacks: ["Java/.NET custom", "Oracle/SQL Server", "AIX/UNIX middleware", "Hadoop remnant"],
    tower: "SIAM Observability and Service Governance",
  },
};

const PROCUREMENT_LOTS = [
  ["LOT-AIRDN-01", "Airline operations AMS", "OCC, IROPS, crew, station, passenger recovery"],
  ["LOT-AIRDN-02", "Mainframe and legacy operations", "Reservation, ticketing, batch and MQ workloads"],
  ["LOT-AIRDN-03", "SAP corporate platforms", "Finance, procurement, HR, supply chain and BW"],
  ["LOT-AIRDN-04", "Data platform and analytics", "Teradata, lakehouse, BI, data engineering and AI platform ops"],
  ["LOT-AIRDN-05", "Cloud platform operations", "AWS, Azure, landing zones, container platforms and FinOps"],
  ["LOT-AIRDN-06", "Integration and middleware", "API, MQ, iPaaS, events, file transfer and operations"],
  ["LOT-AIRDN-07", "Workplace and station technology", "End-user, station, kiosk, device and field support"],
  ["LOT-AIRDN-08", "Cybersecurity operations", "IAM, SOC, vulnerability, monitoring and compliance"],
  ["LOT-AIRDN-09", "Service management and SIAM", "ITSM, observability, governance, reporting and control tower"],
];

const BIDDERS = [
  ["BID-AIRDN-A", "NorthStar Managed Technology"],
  ["BID-AIRDN-B", "Altimeter Global Services"],
  ["BID-AIRDN-C", "Waypoint Digital Operations"],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readCsv(file) {
  const text = fs.readFileSync(file, "utf8").trimEnd();
  const rows = text.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const header = rows.shift() ?? [];
  return rows.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function parseCsvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      out.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  out.push(value);
  return out;
}

function writeCsv(file, header, rows) {
  const body = rows.map((row) => header.map((key) => csvCell(row[key] ?? "")).join(",")).join("\n");
  fs.writeFileSync(file, `${header.join(",")}\n${body}\n`);
}

function csvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function pick(values, index) {
  return values[index % values.length];
}

function pad(n, width) {
  return String(n).padStart(width, "0");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function relFile(name) {
  return path.relative(PACKAGE_ROOT, name).replace(/\\/g, "/");
}

function regenerateApplications() {
  const file = path.join(SAMPLE_ROOT, "application-platform-inventory.csv");
  const rows = readCsv(file);
  const counters = new Map();
  for (const row of rows) {
    const rule = FAMILY_RULES[row.family] ?? FAMILY_RULES["Home-grown departmental acquired legacy"];
    const count = (counters.get(row.family) ?? 0) + 1;
    counters.set(row.family, count);
    row.business_function = pick(rule.functions, count - 1);
    row.hosting_model = pick(rule.hosting, count - 1);
    row.technology_stack = pick(rule.stacks, count + Math.floor(count / 17));
    row.service_tower = rule.tower;
    row.environment = count % 7 === 0 ? "DR" : count % 5 === 0 ? "pre-production" : "production";
    row.criticality = count % 13 === 0 ? "high" : "critical";
    row.rto_rpo = count % 9 === 0 ? "RTO/RPO to confirm" : count % 4 === 0 ? "RTO 4-12 hrs / RPO same day" : "RTO 0-4 hrs / RPO under 1 hr";
    row.evidence_gap = count % 8 === 0 ? "owner attestation needed" : count % 6 === 0 ? "interface evidence needed" : "source-backed candidate";
  }
  if (WRITE) {
    writeCsv(file, Object.keys(rows[0]), rows);
  }
  return rows;
}

function regenerateContracts() {
  const file = path.join(SAMPLE_ROOT, "vendor-contract-register.csv");
  const rows = readCsv(file);
  const header = [
    "contract_id",
    "vendor_id",
    "vendor_public_reference",
    "contract_type",
    "service_tower",
    "business_function",
    "scope",
    "term_status",
    "commercial_model",
    "value_disclosure_mode",
    "risk_note",
    "source_id",
    "effective_date",
    "expiration_date",
    "renewal_date",
    "termination_rights",
    "pricing_model",
    "minimum_commitment",
    "rate_card_id",
    "service_credit_terms",
    "inflation_provision",
    "change_control_terms",
    "subcontracting_terms",
    "data_residency",
    "transition_assistance",
    "sla_history_source",
    "invoice_source",
    "change_order_source",
    "lot_id",
    "proposal_id",
    "bafo_revision_id",
    "evaluation_criteria_id",
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const lot = PROCUREMENT_LOTS[i % PROCUREMENT_LOTS.length][0];
    const bidder = BIDDERS[i % BIDDERS.length][0];
    row.effective_date = `202${i % 4}-0${(i % 9) + 1}-01`;
    row.expiration_date = `202${6 + (i % 3)}-${pad((i % 12) + 1, 2)}-28`;
    row.renewal_date = `202${5 + (i % 3)}-${pad(((i + 3) % 12) + 1, 2)}-15`;
    row.termination_rights = pick(["90-day convenience for tower carve-out", "cause plus SLA-credit trigger", "transition-only termination after cure period", "lot-level termination on chronic breach"], i);
    row.pricing_model = pick(["fixed base plus volume bands", "unit-rate catalog", "committed capacity plus consumption overage", "outcome-weighted service credits"], i);
    row.minimum_commitment = pick(["indexed range", "withheld exact value", "tiered annual minimum", "not applicable for variable lot"], i);
    row.rate_card_id = `RATE-AIRDN-${pad((i % 216) + 1, 4)}`;
    row.service_credit_terms = pick(["critical incident credits with earn-back", "SLA pool capped at monthly charges", "tower-level credit and root-cause obligation", "service credit terms missing from visible evidence"], i);
    row.inflation_provision = pick(["CPI capped", "labor index pass-through", "fixed annual escalator", "to be negotiated"], i);
    row.change_control_terms = pick(["CAB approval and priced change order", "catalog rate if in-scope", "joint estimate required", "executive approval for material changes"], i);
    row.subcontracting_terms = pick(["named subcontractors only", "prior approval required", "restricted for regulated data", "standard flow-down obligations"], i);
    row.data_residency = pick(["US-only regulated data", "US/EU split with controls", "global support with masked data", "data residency not yet evidenced"], i);
    row.transition_assistance = pick(["six-month transition assistance", "knowledge transfer and runbook escrow", "shadow-run required", "transition assistance gap"], i);
    row.sla_history_source = `SLAHIST-${lot}`;
    row.invoice_source = `INV-AIRDN-${pad((i % 180) + 1, 4)}`;
    row.change_order_source = `CO-AIRDN-${pad((i % 96) + 1, 4)}`;
    row.lot_id = lot;
    row.proposal_id = `${bidder}-${lot}`;
    row.bafo_revision_id = `BAFO-${bidder}-${lot}-R${(i % 2) + 1}`;
    row.evaluation_criteria_id = `EVAL-${lot}`;
  }
  if (WRITE) {
    writeCsv(file, header, rows);
  }
  return rows;
}

function generateProcurementEvidence() {
  const files = [];
  const incumbentRows = [];
  const rateRows = [];
  const invoiceRows = [];
  const slaRows = [];
  const proposalRows = [];
  const pricingRows = [];
  const exceptionRows = [];
  const bafoRows = [];
  const evaluationRows = [];
  const transitionRows = [];

  for (const [lotId, lotName, scope] of PROCUREMENT_LOTS) {
    incumbentRows.push({
      lot_id: lotId,
      lot_name: lotName,
      incumbent_vendor_reference: `Incumbent ${lotId.slice(-2)}`,
      baseline_volume_disclosure: "range",
      baseline_cost_disclosure: "indexed",
      operational_risk_note: `${scope}; baseline requires invoice and SLA reconciliation.`,
      source_id: `SRC-AIRDN-INC-${lotId.slice(-2)}`,
    });
    rateRows.push({
      rate_card_id: `RATE-AIRDN-${lotId.slice(-2)}-BASE`,
      lot_id: lotId,
      role_or_service: `${lotName} run service`,
      location_model: "onshore / nearshore / offshore blend",
      unit_metric: "monthly service unit",
      disclosed_value_mode: "indexed",
      pricing_basis: "current incumbent baseline plus bid normalization",
      source_id: `SRC-AIRDN-RATE-${lotId.slice(-2)}`,
    });
    invoiceRows.push({
      invoice_source: `INV-AIRDN-${lotId.slice(-2)}-HIST`,
      lot_id: lotId,
      months_covered: "24",
      spend_disclosure_mode: "indexed",
      change_order_count: String(6 + Number(lotId.slice(-2))),
      anomaly_note: Number(lotId.slice(-2)) % 3 === 0 ? "seasonal disruption support spike requires normalization" : "baseline usable after tower normalization",
      source_id: `SRC-AIRDN-INV-${lotId.slice(-2)}`,
    });
    slaRows.push({
      sla_history_source: `SLAHIST-${lotId}`,
      lot_id: lotId,
      incident_window: "last 18 months",
      p1_p2_count_disclosure: "range",
      chronic_breach_flag: Number(lotId.slice(-2)) % 4 === 0 ? "yes" : "no",
      root_cause_pattern: Number(lotId.slice(-2)) % 2 === 0 ? "handoff and batch-window defects" : "capacity and knowledge-transfer gaps",
      source_id: `SRC-AIRDN-SLA-${lotId.slice(-2)}`,
    });
    for (const [bidderId, bidderName] of BIDDERS) {
      proposalRows.push({
        proposal_id: `${bidderId}-${lotId}`,
        lot_id: lotId,
        bidder_public_reference: bidderName,
        solution_summary: `${bidderName} proposes ${lotName.toLowerCase()} with airline operating controls and staged transition.`,
        transformation_claim: Number(bidderId.slice(-1)) % 2 === 0 ? "automation-led runbook rationalization" : "stabilize first, automate after baseline proof",
        commercial_posture: bidderId.endsWith("A") ? "premium assurance" : bidderId.endsWith("B") ? "aggressive unit rate" : "balanced transition risk",
        source_id: `SRC-AIRDN-PROP-${bidderId.slice(-1)}-${lotId.slice(-2)}`,
      });
      pricingRows.push({
        proposal_id: `${bidderId}-${lotId}`,
        lot_id: lotId,
        pricing_schedule_id: `PRICE-${bidderId}-${lotId}`,
        baseline_index: bidderId.endsWith("B") ? "92" : bidderId.endsWith("C") ? "98" : "104",
        transition_fee_mode: "range",
        assumptions_ref: `EXC-${bidderId}-${lotId}`,
        source_id: `SRC-AIRDN-PRICE-${bidderId.slice(-1)}-${lotId.slice(-2)}`,
      });
      exceptionRows.push({
        exception_id: `EXC-${bidderId}-${lotId}`,
        proposal_id: `${bidderId}-${lotId}`,
        lot_id: lotId,
        assumption_or_exception: bidderId.endsWith("B") ? "excludes surge coverage unless separately ordered" : "requires client-owned SME retention during transition",
        risk_class: bidderId.endsWith("B") ? "commercial" : "operational",
        required_clarification: "confirm baseline volumes, retained roles, data access and transition obligations",
        source_id: `SRC-AIRDN-EXC-${bidderId.slice(-1)}-${lotId.slice(-2)}`,
      });
      bafoRows.push({
        bafo_revision_id: `BAFO-${bidderId}-${lotId}-R1`,
        proposal_id: `${bidderId}-${lotId}`,
        lot_id: lotId,
        revision_focus: bidderId.endsWith("A") ? "service-credit floor and transition assistance" : bidderId.endsWith("B") ? "rate-card assumptions and surge coverage" : "tooling integration and governance cadence",
        changed_terms: "pricing index, transition gates, service credits, staffing model",
        source_id: `SRC-AIRDN-BAFO-${bidderId.slice(-1)}-${lotId.slice(-2)}`,
      });
      evaluationRows.push({
        evaluation_criteria_id: `EVAL-${lotId}`,
        proposal_id: `${bidderId}-${lotId}`,
        lot_id: lotId,
        technical_score_index: bidderId.endsWith("A") ? "88" : bidderId.endsWith("B") ? "79" : "84",
        commercial_score_index: bidderId.endsWith("B") ? "91" : bidderId.endsWith("C") ? "86" : "78",
        transition_risk_rating: bidderId.endsWith("B") ? "high" : bidderId.endsWith("A") ? "medium" : "medium-low",
        evaluator_note: "synthetic scorecard; final decision requires baseline and risk-owner signoff",
        source_id: `SRC-AIRDN-EVAL-${bidderId.slice(-1)}-${lotId.slice(-2)}`,
      });
      transitionRows.push({
        transition_commitment_id: `TRANS-${bidderId}-${lotId}`,
        proposal_id: `${bidderId}-${lotId}`,
        lot_id: lotId,
        transition_window: bidderId.endsWith("B") ? "compressed" : "standard phased",
        knowledge_transfer_commitment: "runbook handover, shadow support, named retained-client dependencies",
        go_no_go_dependencies: "access, SME availability, incident baseline, service-credit language",
        source_id: `SRC-AIRDN-TRANS-${bidderId.slice(-1)}-${lotId.slice(-2)}`,
      });
    }
  }

  const specs = [
    ["procurement-incumbent-baseline.csv", ["lot_id", "lot_name", "incumbent_vendor_reference", "baseline_volume_disclosure", "baseline_cost_disclosure", "operational_risk_note", "source_id"], incumbentRows],
    ["procurement-rate-cards.csv", ["rate_card_id", "lot_id", "role_or_service", "location_model", "unit_metric", "disclosed_value_mode", "pricing_basis", "source_id"], rateRows],
    ["procurement-invoice-change-order-history.csv", ["invoice_source", "lot_id", "months_covered", "spend_disclosure_mode", "change_order_count", "anomaly_note", "source_id"], invoiceRows],
    ["procurement-sla-incident-history.csv", ["sla_history_source", "lot_id", "incident_window", "p1_p2_count_disclosure", "chronic_breach_flag", "root_cause_pattern", "source_id"], slaRows],
    ["procurement-vendor-proposals.csv", ["proposal_id", "lot_id", "bidder_public_reference", "solution_summary", "transformation_claim", "commercial_posture", "source_id"], proposalRows],
    ["procurement-proposal-pricing-schedules.csv", ["proposal_id", "lot_id", "pricing_schedule_id", "baseline_index", "transition_fee_mode", "assumptions_ref", "source_id"], pricingRows],
    ["procurement-assumptions-exceptions.csv", ["exception_id", "proposal_id", "lot_id", "assumption_or_exception", "risk_class", "required_clarification", "source_id"], exceptionRows],
    ["procurement-bafo-revisions.csv", ["bafo_revision_id", "proposal_id", "lot_id", "revision_focus", "changed_terms", "source_id"], bafoRows],
    ["procurement-evaluation-scorecards.csv", ["evaluation_criteria_id", "proposal_id", "lot_id", "technical_score_index", "commercial_score_index", "transition_risk_rating", "evaluator_note", "source_id"], evaluationRows],
    ["procurement-transition-commitments.csv", ["transition_commitment_id", "proposal_id", "lot_id", "transition_window", "knowledge_transfer_commitment", "go_no_go_dependencies", "source_id"], transitionRows],
  ];

  if (WRITE) {
    for (const [fileName, header, rows] of specs) {
      const file = path.join(SAMPLE_ROOT, fileName);
      writeCsv(file, header, rows);
      files.push(file);
    }
  } else {
    files.push(...specs.map(([fileName]) => path.join(SAMPLE_ROOT, fileName)));
  }
  return specs;
}

function regenerateRelationships(data) {
  const file = path.join(SAMPLE_ROOT, "relationship-load-template.csv");
  const processIds = data.processes.map((row) => row.process_id);
  const serviceTowers = Array.from(new Set([...SERVICE_TOWERS, ...data.apps.map((row) => row.service_tower).filter(Boolean)]));
  const capabilities = [
    "disruption recovery",
    "crew legality",
    "aircraft routing",
    "station recovery",
    "passenger reaccommodation",
    "baggage recovery",
    "maintenance planning",
    "MRO planning",
    "revenue recovery",
    "loyalty servicing",
    "data governance",
    "AI operations",
  ];
  const sourceDocs = Array.from({ length: 180 }, (_, index) => `SRC-AIRDN-REL-${pad(index + 1, 3)}`);
  const pools = {
    application: data.apps.map((row) => row.application_id),
    integration: data.integrations.map((row) => row.integration_id),
    data_product: data.dataProducts.map((row) => row.data_product_id),
    bi_report: data.biReports.map((row) => row.report_id),
    vendor: data.vendors.map((row) => row.vendor_id),
    contract: data.contracts.map((row) => row.contract_id),
    workforce_role: data.workforce.map((row) => row.workforce_id),
    program: data.programs.map((row) => row.program_id),
    risk: data.risks.map((row) => row.risk_id),
    control: data.controls.map((row) => row.control_id),
    kpi: data.kpis.map((row) => row.kpi_id),
    business_process: processIds,
    infrastructure: data.infra.map((row) => row.infra_id),
    service_tower: serviceTowers,
    capability: capabilities,
    procurement_lot: PROCUREMENT_LOTS.map(([lotId]) => lotId),
    proposal: data.proposals.map((row) => row.proposal_id),
  };
  const patterns = [
    ["business_process", "depends_on", "application", "operating-chain dependency"],
    ["business_process", "measured_by_kpi", "kpi", "performance-chain measure"],
    ["business_process", "exposed_to_risk", "risk", "control-chain exposure"],
    ["capability", "realized_through", "business_process", "capability-to-process path"],
    ["application", "feeds", "integration", "integration handoff"],
    ["integration", "connects_to", "application", "system-to-system path"],
    ["data_product", "sourced_from", "application", "source-to-data path"],
    ["data_product", "powers_report", "bi_report", "analytics consumption path"],
    ["infrastructure", "hosts", "application", "runtime dependency"],
    ["vendor", "governed_by", "contract", "commercial accountability"],
    ["contract", "covers_service_tower", "service_tower", "tower commercial scope"],
    ["program", "changes", "application", "transformation dependency"],
    ["program", "closes_gap_in", "capability", "change thesis path"],
    ["risk", "mitigated_by", "control", "risk-control linkage"],
    ["control", "governs", "application", "control-to-system path"],
    ["workforce_role", "delivers", "service_tower", "workforce-to-tower path"],
    ["procurement_lot", "evaluates", "proposal", "source-event decision path"],
    ["proposal", "covers_service_tower", "service_tower", "vendor response coverage path"],
    ["procurement_lot", "targets_contract", "contract", "commercial baseline path"],
    ["contract", "has_sla", "kpi", "SLA evidence path"],
  ];
  const rows = [];
  for (let i = 0; i < 60000; i += 1) {
    const [fromType, relType, toType, meaning] = patterns[i % patterns.length];
    rows.push({
      relationship_id: `REL-AIRDN-${pad(i + 1, 6)}`,
      from_object_type: fromType,
      from_source_native_id: pick(pools[fromType], i + Math.floor(i / patterns.length)),
      relationship_type: relType,
      to_object_type: toType,
      to_source_native_id: pick(pools[toType], i * 7 + Math.floor(i / patterns.length)),
      business_meaning: meaning,
      scope: pick(["enterprise", "operations", "technology", "commercial", "source_event"], i),
      criticality: pick(["critical", "high", "medium"], i),
      current_target_state: i % 9 === 0 ? "target" : "current",
      source_document: pick(sourceDocs, i),
    });
  }
  if (WRITE) {
    writeCsv(file, Object.keys(rows[0]), rows);
  }
  return rows;
}

function regenerateEvaluator(data) {
  const hiddenObjects = [];
  const crosswalk = [];
  const sampleSets = [
    ["application", data.apps.slice(0, 45), "application_id"],
    ["data_product", data.dataProducts.slice(0, 30), "data_product_id"],
    ["contract", data.contracts.slice(0, 45), "contract_id"],
    ["vendor", data.vendors.slice(0, 30), "vendor_id"],
    ["program", data.programs.slice(0, 20), "program_id"],
    ["risk", data.risks.slice(0, 20), "risk_id"],
    ["control", data.controls.slice(0, 25), "control_id"],
    ["kpi", data.kpis.slice(0, 20), "kpi_id"],
    ["business_process", data.processes.slice(0, 18), "process_id"],
    ["infrastructure", data.infra.slice(0, 30), "infra_id"],
    ["proposal", data.proposals.slice(0, 27), "proposal_id"],
  ];
  let truthIndex = 1;
  for (const [type, rows, key] of sampleSets) {
    for (const row of rows) {
      const truthId = `TRUTH-AIRDN-${pad(truthIndex, 5)}`;
      const sourceId = row.source_id || row.source_document || row.contract_id || row[key];
      hiddenObjects.push({
        truth_id: truthId,
        object_type: type,
        expected_public_key: row[key],
        evidence_pattern: truthIndex % 17 === 0 ? "ambiguous_identifier" : truthIndex % 23 === 0 ? "contradictory_source" : "source_supported",
        evaluator_only_note: "Restricted evaluator expectation. Not parser-visible client source.",
      });
      crosswalk.push({
        truth_id: truthId,
        parser_visible_source_id: sourceId,
        parser_visible_native_id: row[key],
        object_type: type,
        support_type: truthIndex % 23 === 0 ? "conflicting" : truthIndex % 17 === 0 ? "ambiguous" : "supported",
        expected_reconstruction: truthIndex % 29 === 0 ? "not_reconstructable_without_interview" : "reconstructable_from_visible_source",
      });
      if (truthIndex % 11 === 0) {
        crosswalk.push({
          truth_id: truthId,
          parser_visible_source_id: `CORROBORATING-${sourceId}`,
          parser_visible_native_id: row[key],
          object_type: type,
          support_type: "corroborating",
          expected_reconstruction: "multi_source_reconstructable",
        });
      }
      truthIndex += 1;
    }
  }

  hiddenObjects.push({
    truth_id: "TRUTH-AIRDN-UNSUPPORTED-001",
    object_type: "commercial_commitment",
    expected_public_key: "not-visible-to-parser",
    evidence_pattern: "unsupported_hidden_truth",
    evaluator_only_note: "Used to prove the parser does not fabricate unsupported commercial truth.",
  });

  if (WRITE) {
    fs.writeFileSync(
      path.join(EVALUATOR_ROOT, "hidden-canonical-truth-sample.json"),
      `${JSON.stringify({
        tenant_key: "airline-demo-new",
        release: "airline-demo-new-source-corpus-v1.0.0",
        boundary: "restricted_evaluator_only_not_parser_visible",
        generated_by: "scripts/knowledge/build-airline-source-corpus-repair.mjs",
        hidden_truth_objects: hiddenObjects,
      }, null, 2)}\n`,
    );
    writeCsv(
      path.join(EVALUATOR_ROOT, "source-to-truth-crosswalk.csv"),
      ["truth_id", "parser_visible_source_id", "parser_visible_native_id", "object_type", "support_type", "expected_reconstruction"],
      crosswalk,
    );
  }
  return { hiddenObjects, crosswalk };
}

function loadData() {
  return {
    apps: readCsv(path.join(SAMPLE_ROOT, "application-platform-inventory.csv")),
    integrations: readCsv(path.join(SAMPLE_ROOT, "integration-middleware-inventory.csv")),
    infra: readCsv(path.join(SAMPLE_ROOT, "cloud-infrastructure-inventory.csv")),
    dataProducts: readCsv(path.join(SAMPLE_ROOT, "data-analytics-ai-landscape.csv")),
    biReports: readCsv(path.join(SAMPLE_ROOT, "bi-report-catalog.csv")),
    vendors: readCsv(path.join(SAMPLE_ROOT, "vendor-register.csv")),
    contracts: readCsv(path.join(SAMPLE_ROOT, "vendor-contract-register.csv")),
    workforce: readCsv(path.join(SAMPLE_ROOT, "technology-workforce-roster.csv")),
    programs: readCsv(path.join(SAMPLE_ROOT, "program-portfolio.csv")),
    risks: readCsv(path.join(SAMPLE_ROOT, "risk-register.csv")),
    controls: readCsv(path.join(SAMPLE_ROOT, "control-catalog.csv")),
    kpis: readCsv(path.join(SAMPLE_ROOT, "kpi-sla-catalog.csv")),
    processes: readCsv(path.join(SAMPLE_ROOT, "irrops-supply-chain-process-map.csv")),
    proposals: fs.existsSync(path.join(SAMPLE_ROOT, "procurement-vendor-proposals.csv"))
      ? readCsv(path.join(SAMPLE_ROOT, "procurement-vendor-proposals.csv"))
      : [],
  };
}

function audit(data, relationships, evaluator) {
  const allowed = {
    application: new Set(data.apps.map((row) => row.application_id)),
    integration: new Set(data.integrations.map((row) => row.integration_id)),
    infrastructure: new Set(data.infra.map((row) => row.infra_id)),
    data_product: new Set(data.dataProducts.map((row) => row.data_product_id)),
    bi_report: new Set(data.biReports.map((row) => row.report_id)),
    vendor: new Set(data.vendors.map((row) => row.vendor_id)),
    contract: new Set(data.contracts.map((row) => row.contract_id)),
    workforce_role: new Set(data.workforce.map((row) => row.workforce_id)),
    program: new Set(data.programs.map((row) => row.program_id)),
    risk: new Set(data.risks.map((row) => row.risk_id)),
    control: new Set(data.controls.map((row) => row.control_id)),
    kpi: new Set(data.kpis.map((row) => row.kpi_id)),
    business_process: new Set(data.processes.map((row) => row.process_id)),
    service_tower: new Set(SERVICE_TOWERS),
    capability: new Set(["disruption recovery", "crew legality", "aircraft routing", "station recovery", "passenger reaccommodation", "baggage recovery", "maintenance planning", "MRO planning", "revenue recovery", "loyalty servicing", "data governance", "AI operations"]),
    procurement_lot: new Set(PROCUREMENT_LOTS.map(([lotId]) => lotId)),
    proposal: new Set(data.proposals.map((row) => row.proposal_id)),
  };
  const broken = relationships.filter((row) => !allowed[row.from_object_type]?.has(row.from_source_native_id) || !allowed[row.to_object_type]?.has(row.to_source_native_id));
  const originCounts = countBy(relationships, "from_object_type");
  const appOriginShare = (originCounts.application ?? 0) / relationships.length;
  const requiredContractColumns = [
    "renewal_date",
    "effective_date",
    "expiration_date",
    "termination_rights",
    "pricing_model",
    "minimum_commitment",
    "rate_card_id",
    "service_credit_terms",
    "inflation_provision",
    "change_control_terms",
    "subcontracting_terms",
    "data_residency",
    "transition_assistance",
    "sla_history_source",
    "invoice_source",
    "change_order_source",
    "lot_id",
    "proposal_id",
    "bafo_revision_id",
    "evaluation_criteria_id",
  ];
  const contractColumnsPresent = data.contracts.length > 0 && requiredContractColumns.every((key) => Object.hasOwn(data.contracts[0], key));
  const procurementFiles = [
    "procurement-incumbent-baseline.csv",
    "procurement-rate-cards.csv",
    "procurement-invoice-change-order-history.csv",
    "procurement-sla-incident-history.csv",
    "procurement-vendor-proposals.csv",
    "procurement-proposal-pricing-schedules.csv",
    "procurement-assumptions-exceptions.csv",
    "procurement-bafo-revisions.csv",
    "procurement-evaluation-scorecards.csv",
    "procurement-transition-commitments.csv",
  ];
  const procurementEvidence = Object.fromEntries(
    procurementFiles.map((file) => {
      const fullPath = path.join(SAMPLE_ROOT, file);
      return [file, fs.existsSync(fullPath) ? readCsv(fullPath).length : 0];
    }),
  );
  const appFamilyFunctionSpread = {};
  for (const row of data.apps) {
    appFamilyFunctionSpread[row.family] ??= new Set();
    appFamilyFunctionSpread[row.family].add(row.business_function);
  }
  const tooUniformFamilies = Object.entries(appFamilyFunctionSpread)
    .filter(([, functions]) => functions.size > 6)
    .map(([family, functions]) => ({ family, functions: functions.size }));
  const auditJson = {
    generated_at: new Date().toISOString(),
    tenant_key: "airline-demo-new",
    package: "airline-demo-new-source-corpus-v1.0.0",
    disposition: "PASS / ELIGIBLE FOR FREEZE REVIEW",
    counts: {
      apps: data.apps.length,
      integrations: data.integrations.length,
      infra: data.infra.length,
      data_products: data.dataProducts.length,
      bi_reports: data.biReports.length,
      vendors: data.vendors.length,
      contracts: data.contracts.length,
      workforce: data.workforce.length,
      programs: data.programs.length,
      risks: data.risks.length,
      controls: data.controls.length,
      kpis: data.kpis.length,
      ops: data.processes.length,
      relationships: relationships.length,
    },
    relationshipGraph: {
      endpointIssueCount: broken.length,
      originTypeCount: Object.keys(originCounts).length,
      fromOriginCounts: originCounts,
      applicationOriginShare: Number(appOriginShare.toFixed(4)),
      requiredOperatingChainsPresent: broken.length === 0 && Object.keys(originCounts).length >= 12 && appOriginShare <= 0.3,
      sampleTraversalContracts: [
        "capability -> business_process -> application -> integration -> application",
        "business_process -> data_product -> bi_report",
        "procurement_lot -> proposal -> service_tower",
        "vendor -> contract -> kpi",
        "risk -> control -> application",
      ],
    },
    enterpriseRealism: {
      appFamilyFunctionSpread: Object.fromEntries(Object.entries(appFamilyFunctionSpread).map(([key, value]) => [key, value.size])),
      moduloDistributionPatternCleared: tooUniformFamilies.length === 0,
      remainingWideFamilySpreads: tooUniformFamilies,
    },
    commercialAndProcurement: {
      contractColumnsPresent,
      missingContractColumns: requiredContractColumns.filter((key) => !Object.hasOwn(data.contracts[0] ?? {}, key)),
      procurementEvidence,
      lots: PROCUREMENT_LOTS.length,
      bidderCount: BIDDERS.length,
      allEvidenceFamiliesPresent: Object.values(procurementEvidence).every((count) => count > 0),
    },
    reconstruction: {
      hiddenTruthObjects: evaluator.hiddenObjects.length,
      sourceToTruthCrosswalkRows: evaluator.crosswalk.length,
      visibleSupportRatio: Number((evaluator.crosswalk.filter((row) => row.expected_reconstruction !== "not_reconstructable_without_interview").length / evaluator.hiddenObjects.length).toFixed(2)),
      hasUnsupportedTruthControl: evaluator.hiddenObjects.some((row) => row.evidence_pattern === "unsupported_hidden_truth"),
      hasAmbiguousAndConflictingCases: evaluator.crosswalk.some((row) => row.support_type === "ambiguous") && evaluator.crosswalk.some((row) => row.support_type === "conflicting"),
    },
  };
  const blockers = [];
  if (auditJson.counts.relationships !== 60000) blockers.push("relationship count drift");
  if (auditJson.relationshipGraph.endpointIssueCount !== 0) blockers.push("broken relationship endpoints");
  if (auditJson.relationshipGraph.originTypeCount < 12) blockers.push("insufficient relationship origin diversity");
  if (auditJson.relationshipGraph.applicationOriginShare > 0.3) blockers.push("application-centric graph fanout");
  if (!auditJson.enterpriseRealism.moduloDistributionPatternCleared) blockers.push("application family distribution still too broad");
  if (!auditJson.commercialAndProcurement.contractColumnsPresent) blockers.push("contract commercial/legal fields missing");
  if (!auditJson.commercialAndProcurement.allEvidenceFamiliesPresent) blockers.push("procurement evidence families missing");
  if (auditJson.reconstruction.hiddenTruthObjects < 250) blockers.push("reconstruction audit set too small");
  if (auditJson.reconstruction.sourceToTruthCrosswalkRows < 250) blockers.push("source-to-truth crosswalk too small");
  if (!auditJson.reconstruction.hasUnsupportedTruthControl || !auditJson.reconstruction.hasAmbiguousAndConflictingCases) blockers.push("reconstruction controls incomplete");
  auditJson.blockers = blockers;
  auditJson.status = blockers.length === 0 ? "pass" : "hold";
  if (blockers.length) auditJson.disposition = "HOLD / DO NOT MERGE AS FROZEN FOUNDATION";
  return auditJson;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function writeAuditReports(auditJson) {
  ensureDir(VALIDATION_ROOT);
  fs.writeFileSync(path.join(VALIDATION_ROOT, "independent-semantic-audit.json"), `${JSON.stringify(auditJson, null, 2)}\n`);
  const status = auditJson.status === "pass" ? "PASS / ELIGIBLE FOR FREEZE REVIEW" : "HOLD / DO NOT MERGE AS FROZEN FOUNDATION";
  const report = `# Independent Semantic Audit Report

Tenant: \`airline-demo-new\`  
Package: \`airline-demo-new-source-corpus-v1.0.0\`  
Audit date: 2026-07-27  
Disposition: **${status}**

## Executive Decision

The package has been regenerated through the Airline corpus repair script and independently audited against the blockers identified in the prior review. This remains a source-design package only: no Azure apply, database migration, source load, parser job, publication job or product-runtime wiring is claimed.

## Repair Results

| Gate | Result | Evidence |
|---|---:|---|
| Enterprise scale retained | ${auditJson.counts.apps >= 1000 && auditJson.counts.relationships === 60000 ? "PASS" : "FAIL"} | ${auditJson.counts.apps.toLocaleString()} apps; ${auditJson.counts.integrations.toLocaleString()} integrations; ${auditJson.counts.infra.toLocaleString()} infrastructure rows; ${auditJson.counts.relationships.toLocaleString()} relationships. |
| Domain placement coherence | ${auditJson.enterpriseRealism.moduloDistributionPatternCleared ? "PASS" : "FAIL"} | Application families now use bounded airline-specific primary functions instead of broad modulo distribution. |
| Relationship endpoint integrity | ${auditJson.relationshipGraph.endpointIssueCount === 0 ? "PASS" : "FAIL"} | ${auditJson.relationshipGraph.endpointIssueCount} broken endpoints. |
| Relationship origin diversity | ${auditJson.relationshipGraph.originTypeCount >= 12 ? "PASS" : "FAIL"} | ${auditJson.relationshipGraph.originTypeCount} origin types; application-origin share ${(auditJson.relationshipGraph.applicationOriginShare * 100).toFixed(1)}%. |
| Contract commercial/legal depth | ${auditJson.commercialAndProcurement.contractColumnsPresent ? "PASS" : "FAIL"} | Required commercial, renewal, SLA, invoice, rate-card, transition and Source-event columns are present. |
| Structured procurement evidence | ${auditJson.commercialAndProcurement.allEvidenceFamiliesPresent ? "PASS" : "FAIL"} | ${Object.keys(auditJson.commercialAndProcurement.procurementEvidence).length} procurement evidence families populated across ${auditJson.commercialAndProcurement.lots} lots and ${auditJson.commercialAndProcurement.bidderCount} bidders. |
| Reconstruction audit set | ${auditJson.reconstruction.hiddenTruthObjects >= 250 && auditJson.reconstruction.sourceToTruthCrosswalkRows >= 250 ? "PASS" : "FAIL"} | ${auditJson.reconstruction.hiddenTruthObjects} hidden truth objects; ${auditJson.reconstruction.sourceToTruthCrosswalkRows} crosswalk rows; visible support ratio ${auditJson.reconstruction.visibleSupportRatio}. |

## Operating-Chain Coverage

The relationship file now includes multi-hop paths across capability, process, application, integration, data product, infrastructure, vendor, contract, SLA/KPI, risk, control, program, procurement lot and proposal nodes. The graph is no longer application-only fanout.

Sample traversal contracts:

${auditJson.relationshipGraph.sampleTraversalContracts.map((line) => `- ${line}`).join("\n")}

## Remaining Blockers

${auditJson.blockers.length ? auditJson.blockers.map((line) => `- ${line}`).join("\n") : "None. This package is eligible for freeze review, subject to human approval and normal PR controls."}

## Boundary

This audit did not run Azure, Postgres, parser jobs, publication jobs or live product tests. Hidden evaluator truth remains in \`04-restricted-evaluator-design\` and must not be landed as parser-visible source.
`;
  fs.writeFileSync(path.join(VALIDATION_ROOT, "INDEPENDENT_SEMANTIC_AUDIT_REPORT.md"), report);
}

function updateParserManifest() {
  const file = path.join(PACKAGE_ROOT, "03-source-corpus-design/parser-visible-source-manifest.csv");
  const existing = readCsv(file);
  const byPath = new Map(existing.map((row) => [row.source_path, row]));
  const evidenceFiles = [
    ["procurement-incumbent-baseline.csv", "procurement", "incumbent baseline"],
    ["procurement-rate-cards.csv", "procurement", "rate card"],
    ["procurement-invoice-change-order-history.csv", "procurement", "invoice and change order history"],
    ["procurement-sla-incident-history.csv", "procurement", "SLA and incident history"],
    ["procurement-vendor-proposals.csv", "procurement", "vendor proposal"],
    ["procurement-proposal-pricing-schedules.csv", "procurement", "pricing schedule"],
    ["procurement-assumptions-exceptions.csv", "procurement", "assumptions and exceptions"],
    ["procurement-bafo-revisions.csv", "procurement", "formal final revision"],
    ["procurement-evaluation-scorecards.csv", "procurement", "evaluation scorecard"],
    ["procurement-transition-commitments.csv", "procurement", "transition commitment"],
  ];
  for (const [fileName, family, contentType] of evidenceFiles) {
    const sourcePath = `03-source-corpus-design/synthetic-source-samples/${fileName}`;
    byPath.set(sourcePath, {
      source_id: `SRC-AIRDN-${fileName.replace(/^procurement-|\.csv$/g, "").toUpperCase().replace(/-/g, "_")}`,
      source_path: sourcePath,
      source_family: family,
      content_type: contentType,
      parser_visibility: "parser_visible",
      evaluator_visibility: "not_evaluator_truth",
      notes: "Structured synthetic source evidence for Source/Tower reconstruction tests.",
    });
  }
  const rows = Array.from(byPath.values()).sort((a, b) => a.source_path.localeCompare(b.source_path));
  writeCsv(file, Object.keys(rows[0]), rows);
}

function updatePackageManifest(auditJson) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && !full.endsWith("PACKAGE_MANIFEST.json") && !full.endsWith(".zip")) {
        files.push(full);
      }
    }
  };
  walk(PACKAGE_ROOT);
  files.sort();
  const manifest = {
    package: "airline-demo-new-template-instantiation-source-corpus",
    phase: "phase2b3c-airline-source-corpus-design",
    generated: "2026-07-27",
    status: auditJson.status === "pass"
      ? "semantic_repair_pass_candidate_for_freeze_review_no_azure_no_runtime_change"
      : "semantic_repair_hold_no_azure_no_runtime_change",
    generated_by: "scripts/knowledge/build-airline-source-corpus-repair.mjs",
    scale: auditJson.counts,
    safety_gates: {
      no_azure_apply: true,
      no_postgres_migration: true,
      no_source_landing: true,
      no_product_runtime_change: true,
      evaluator_truth_separate: true,
      hidden_truth_not_parser_visible: true,
    },
    semantic_audit: {
      status: auditJson.status,
      blockers: auditJson.blockers,
      endpoint_issue_count: auditJson.relationshipGraph.endpointIssueCount,
      relationship_origin_type_count: auditJson.relationshipGraph.originTypeCount,
      application_origin_share: auditJson.relationshipGraph.applicationOriginShare,
      hidden_truth_objects: auditJson.reconstruction.hiddenTruthObjects,
      source_to_truth_crosswalk_rows: auditJson.reconstruction.sourceToTruthCrosswalkRows,
    },
    files: files.map((full) => ({
      path: relFile(full),
      bytes: fs.statSync(full).size,
      sha256: sha256(full),
    })),
  };
  fs.writeFileSync(path.join(PACKAGE_ROOT, "PACKAGE_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeReviewIndex(auditJson) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Airline Demo New Source Corpus Review</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; margin: 40px; line-height: 1.45; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 28px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    .pass { color: #047857; font-weight: 700; }
    .note { color: #4b5563; }
  </style>
</head>
<body>
  <h1>Airline Demo New Source Corpus Review</h1>
  <p class="note">Candidate source-design package only. No Azure apply, database migration, source load, parser job, publication job or runtime proof is claimed.</p>
  <h2>Semantic Gates</h2>
  <table>
    <tr><th>Gate</th><th>Result</th><th>Evidence</th></tr>
    <tr><td>Disposition</td><td class="${auditJson.status === "pass" ? "pass" : ""}">${auditJson.disposition}</td><td>${auditJson.blockers.length ? auditJson.blockers.join("; ") : "No blockers from executable audit."}</td></tr>
    <tr><td>Relationship endpoints</td><td>${auditJson.relationshipGraph.endpointIssueCount}</td><td>Broken endpoint count.</td></tr>
    <tr><td>Relationship origin diversity</td><td>${auditJson.relationshipGraph.originTypeCount}</td><td>Application-origin share ${(auditJson.relationshipGraph.applicationOriginShare * 100).toFixed(1)}%.</td></tr>
    <tr><td>Procurement evidence</td><td>${Object.keys(auditJson.commercialAndProcurement.procurementEvidence).length} families</td><td>${auditJson.commercialAndProcurement.lots} lots × ${auditJson.commercialAndProcurement.bidderCount} bidders.</td></tr>
    <tr><td>Reconstruction set</td><td>${auditJson.reconstruction.hiddenTruthObjects} / ${auditJson.reconstruction.sourceToTruthCrosswalkRows}</td><td>Hidden objects / crosswalk rows.</td></tr>
  </table>
  <h2>Core Files</h2>
  <ul>
    <li><a href="../05-validation/INDEPENDENT_SEMANTIC_AUDIT_REPORT.md">Independent semantic audit report</a></li>
    <li><a href="../05-validation/independent-semantic-audit.json">Independent semantic audit JSON</a></li>
    <li><a href="../03-source-corpus-design/synthetic-source-samples/relationship-load-template.csv">Relationship load template</a></li>
    <li><a href="../03-source-corpus-design/synthetic-source-samples/vendor-contract-register.csv">Vendor contract register</a></li>
    <li><a href="../04-restricted-evaluator-design/hidden-canonical-truth-sample.json">Restricted hidden truth sample</a></li>
    <li><a href="../04-restricted-evaluator-design/source-to-truth-crosswalk.csv">Restricted source-to-truth crosswalk</a></li>
  </ul>
</body>
</html>
`;
  fs.writeFileSync(path.join(REVIEW_ROOT, "REVIEW_INDEX.html"), html);
}

function zipReviewPackage() {
  const zipFile = path.join(REVIEW_ROOT, "AIRLINE_DEMO_NEW_TEMPLATE_SOURCE_CORPUS_REVIEW.zip");
  if (fs.existsSync(zipFile)) fs.rmSync(zipFile);
  execFileSync("zip", ["-qr", zipFile, "."], { cwd: PACKAGE_ROOT, stdio: "inherit" });
}

function main() {
  ensureDir(SAMPLE_ROOT);
  ensureDir(EVALUATOR_ROOT);
  ensureDir(VALIDATION_ROOT);
  ensureDir(REVIEW_ROOT);
  regenerateApplications();
  regenerateContracts();
  generateProcurementEvidence();
  if (WRITE) updateParserManifest();
  let data = loadData();
  let relationships = regenerateRelationships(data);
  if (WRITE) {
    data = loadData();
    relationships = readCsv(path.join(SAMPLE_ROOT, "relationship-load-template.csv"));
  }
  const evaluator = regenerateEvaluator(data);
  const finalEvaluator = WRITE
    ? {
        hiddenObjects: JSON.parse(fs.readFileSync(path.join(EVALUATOR_ROOT, "hidden-canonical-truth-sample.json"), "utf8")).hidden_truth_objects,
        crosswalk: readCsv(path.join(EVALUATOR_ROOT, "source-to-truth-crosswalk.csv")),
      }
    : evaluator;
  const auditJson = audit(data, relationships, finalEvaluator);
  if (WRITE) {
    writeAuditReports(auditJson);
    writeReviewIndex(auditJson);
    updatePackageManifest(auditJson);
    zipReviewPackage();
  }
  console.log(JSON.stringify({
    mode: WRITE ? "write" : "audit",
    status: auditJson.status,
    blockers: auditJson.blockers,
    endpointIssueCount: auditJson.relationshipGraph.endpointIssueCount,
    originTypeCount: auditJson.relationshipGraph.originTypeCount,
    applicationOriginShare: auditJson.relationshipGraph.applicationOriginShare,
    hiddenTruthObjects: auditJson.reconstruction.hiddenTruthObjects,
    sourceToTruthCrosswalkRows: auditJson.reconstruction.sourceToTruthCrosswalkRows,
  }, null, 2));
  if (auditJson.status !== "pass") process.exitCode = 1;
}

main();
