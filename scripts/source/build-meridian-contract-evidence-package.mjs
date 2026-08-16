#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToFile,
} from "@react-pdf/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(
  REPO_ROOT,
  "datasets/source/contract-intelligence/meridian-golden-20260809",
);

const TENANT_KEY = "meridian_health_global";
const DATASET_ID = "meridian-source-v1-202608-golden-evidence";
const DATASET_VERSION = "v1-golden-evidence";
const REVIEW_STATUS = "synthetic_demo_reviewed";
const REFRESH_MONTHLY = "Monthly controlled extract; refresh before each optimization gate";
const REFRESH_ON_CHANGE = "On amendment, renewal, or contract repository change";

const contracts = [
  {
    contract_id: "CF-001",
    vendor_id: "VND-001",
    vendor_name: "Crestline Analytics Services LLC",
    contract_name: "Data and Analytics Managed Services",
    archetype: "data analytics managed services",
    annual_value_usd: 35_000_000,
    actual_annual_spend_usd: 31_820_000,
    total_committed_value_usd: 140_000_000,
    start_date: "2024-08-01",
    end_date: "2028-07-31",
    notice_deadline: "2028-04-30",
    notice_period_days: 92,
    auto_renew: "No",
    owner: "LDR-MER-SOURCE-011",
    functions: "Enterprise analytics; clinical quality reporting; payer performance; finance analytics; executive dashboards",
    systems:
      "Azure Synapse; Databricks; Northgate Insight Premium; clinical analytics marts; payer margin data products",
    overview:
      "Crestline operates Meridian's enterprise analytics managed-services tower. The agreement covers data-platform operations, clinical and financial data products, BI support, data engineering squads, production incident response, and release management for executive, payer, quality, and operational reporting. Spend is driven by named managed-service towers, offshore and onshore data-engineering capacity, platform administration, premium support, and change-order capacity. The optimization question is whether Meridian can recover missed service credits, stop paying premium blended rates where rate cards were not amended, reduce underused platform support capacity, and lock a narrower renewal scope before the next sourcing gate.",
    sourceExamples:
      "Icertis CLM; SharePoint contract repository; ServiceNow ITSM; Sterling Supplier Invoices; Coupa; Apptio; Northgate Insight admin export; Azure Cost Management",
    pricing: [
      ["MER-CF001-P01", "DATA-OPS-MANAGED", "24x7 data platform operations and monitoring", "managed service tower", 12, "monthly tower", 780_000],
      ["MER-CF001-P02", "DATA-ENG-SQUAD", "Data engineering product squad capacity", "role capacity", 96, "FTE month", 42_500],
      ["MER-CF001-P03", "BI-SUPPORT", "Northgate Insight premium workspace administration and report support", "workspace and user support", 18_000, "active user", 108],
      ["MER-CF001-P04", "CLIN-MARTS", "Clinical quality and payer performance data product support", "data product", 22, "managed data product", 245_000],
      ["MER-CF001-P05", "CHANGE-BANK", "Change-order bank for regulatory and executive dashboard requests", "change capacity", 14_400, "engineering hour", 116],
      ["MER-CF001-P06", "PREMIUM-SUPPORT", "Vendor premium support and service-management overlay", "support tier", 1, "annual package", 2_350_000],
    ],
    scope: [
      ["APP-MER-041", "Enterprise Quality Analytics Hub", "Clinical quality", "Tier 1", "clinical quality mart and executive reporting", 5_200_000],
      ["APP-MER-052", "Payer Margin Analytics", "Finance and payer performance", "Critical", "payer margin data product", 4_750_000],
      ["APP-MER-064", "Executive Performance Dashboard", "Enterprise performance management", "Tier 1", "Northgate Insight executive workspace", 2_900_000],
      ["APP-MER-077", "Population Health Data Mart", "Population health", "Tier 1", "population health analytics pipeline", 3_650_000],
      ["APP-MER-089", "Revenue Cycle Analytics", "Revenue cycle", "Tier 1", "RCM analytics model support", 3_200_000],
      ["APP-MER-103", "Clinical Registry Extracts", "Clinical operations", "Tier 2", "registry extract automation", 1_450_000],
      ["APP-MER-118", "Workforce Productivity Analytics", "HR and workforce", "Tier 2", "labor productivity dashboarding", 1_150_000],
      ["APP-MER-124", "Supply Chain Spend Cube", "Supply chain", "Tier 2", "spend analytics cube", 1_250_000],
      ["APP-MER-139", "DataOps Service Desk", "Technology operations", "Tier 1", "incident and change intake", 2_050_000],
      ["APP-MER-144", "Azure Analytics Landing Zone", "Technology platform", "Critical", "cloud data platform administration", 6_220_000],
    ],
    avoided_cost_usd: 1_920_000,
    negotiated_improvement_usd: 1_180_000,
    realized_value_usd: 735_000,
  },
  {
    contract_id: "CF-003",
    vendor_id: "VND-003",
    vendor_name: "Sterling Workforce Systems, Inc.",
    contract_name: "Sterling Finance HCM SaaS and Services",
    archetype: "enterprise SaaS and implementation services",
    annual_value_usd: 12_500_000,
    actual_annual_spend_usd: 11_680_000,
    total_committed_value_usd: 50_000_000,
    start_date: "2024-01-01",
    end_date: "2027-12-31",
    notice_deadline: "2027-09-30",
    notice_period_days: 92,
    auto_renew: "Yes",
    owner: "LDR-MER-SOURCE-019",
    functions: "Finance operations; HR operations; payroll; workforce planning; procurement intake",
    systems:
      "Sterling Financials; Sterling HCM; Sterling Planning; Sterling Prism; Sterling Extend",
    overview:
      "Sterling provides Meridian's finance and workforce SaaS platform, subscription modules, integration support, release-management advisory, and selected optimization services. The agreement includes named enterprise modules, worker and financial seat entitlements, premium support, integration capacity, and transformation advisory hours. The optimization question is whether Meridian can remove shelfware, reduce underused Extend and Prism capacity, claim service-performance credits where available, cap renewal uplift, and convert loosely scoped advisory work into outcome-bound work packages.",
    sourceExamples:
      "Sterling tenant admin exports; Icertis CLM; Sterling Supplier Invoices; Coupa PO lines; ServiceNow integration incidents; Sterling Planning usage export; Finance value attestation",
    pricing: [
      ["MER-CF003-P01", "WD-FIN-CORE", "Sterling Financials enterprise subscription", "module subscription", 18_500, "employee or worker equivalent", 178],
      ["MER-CF003-P02", "WD-HCM-CORE", "Sterling HCM enterprise subscription", "module subscription", 38_000, "worker", 112],
      ["MER-CF003-P03", "WD-PRISM", "Sterling Prism capacity", "analytics capacity", 5_200, "named user or capacity unit", 210],
      ["MER-CF003-P04", "WD-EXTEND", "Sterling Extend app capacity", "app capacity", 38, "app entitlement", 42_000],
      ["MER-CF003-P05", "WD-ADVISORY", "Optimization and release advisory hours", "advisory capacity", 9_600, "hour", 154],
    ],
    scope: [
      ["APP-MER-201", "Sterling Financials", "Finance operations", "Critical", "financial ledger and close", 3_500_000],
      ["APP-MER-202", "Sterling HCM", "HR and workforce", "Critical", "core HR and employee record", 3_100_000],
      ["APP-MER-203", "Sterling Payroll Integrations", "Payroll", "Tier 1", "payroll integration services", 1_200_000],
      ["APP-MER-204", "Sterling Planning", "Finance planning", "Tier 1", "planning and forecast model", 1_150_000],
      ["APP-MER-205", "Sterling Prism", "Finance and HR analytics", "Tier 2", "analytics module", 1_050_000],
      ["APP-MER-206", "Sterling Extend Apps", "HR operations", "Tier 2", "custom app entitlement", 900_000],
      ["APP-MER-207", "Identity Integration", "Technology operations", "Tier 1", "identity and access integration", 820_000],
      ["APP-MER-208", "Procurement Intake Bridge", "Procurement operations", "Tier 2", "supplier and procurement integration", 780_000],
    ],
    avoided_cost_usd: 820_000,
    negotiated_improvement_usd: 520_000,
    realized_value_usd: 260_000,
  },
];

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 10, lineHeight: 1.35, color: "#1b2430" },
  title: { fontSize: 16, marginBottom: 8, fontWeight: 700 },
  section: { fontSize: 12, marginTop: 12, marginBottom: 5, fontWeight: 700 },
  body: { marginBottom: 5 },
  box: {
    marginTop: 8,
    padding: 10,
    border: "1 solid #cbd5e1",
    borderRadius: 4,
  },
});

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function money(value) {
  return String(Math.round(Number(value)));
}

function pct(value) {
  return Number(value).toFixed(3);
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
}

function writeCsv(relativePath, headers, rows) {
  const filePath = path.join(OUT_DIR, relativePath);
  ensureDir(path.dirname(filePath));
  const text = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n") + "\n";
  fs.writeFileSync(filePath, text);
}

function writeJson(relativePath, value) {
  const filePath = path.join(OUT_DIR, relativePath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function monthStarts() {
  const months = [];
  for (let offset = 0; offset < 24; offset += 1) {
    const date = new Date(Date.UTC(2025, 6 + offset, 1));
    months.push(date.toISOString().slice(0, 10));
  }
  return months;
}

function pageTexts(contract) {
  return [
    {
      title: "Agreement Overview",
      text:
        `${contract.vendor_name} and Meridian Health enter this synthetic executed agreement for ${contract.contract_name}. ` +
        `${contract.overview} The scope is intentionally limited to named services, platforms, operating responsibilities, and approved order forms.`,
    },
    {
      title: "Scope And Service Responsibilities",
      text:
        `The supplier is responsible for the services listed in the scope schedule: ${contract.systems}. ` +
        `Meridian retains ownership of business process decisions, user access approvals, clinical and financial data definitions, and finance value confirmation. ` +
        `Service changes require a written amendment, SOW, or order form linked to ${contract.contract_id}.`,
    },
    {
      title: "Commercial Terms And Pricing Schedule",
      text:
        `Annual contract value is USD ${contract.annual_value_usd}. Pricing includes subscriptions, managed-service towers, support capacity, and approved change capacity. ` +
        `Invoices must map to an active PO, a covered service period, a current rate-card or subscription line, and the executed contract scope. Credits, taxes, and pass-throughs require line-level visibility.`,
    },
    {
      title: "Service Levels, Renewal, And Value Confirmation",
      text:
        `Service levels include availability, severity response, resolution, backlog aging, and monthly service review obligations. ` +
        `The notice deadline is ${contract.notice_deadline}; auto-renew is ${contract.auto_renew}. ` +
        `Recoverable leakage, avoided cost, negotiated improvement, and realized value are separate ledgers. Realized value requires finance confirmation and cannot be inferred from opportunity size.`,
    },
  ];
}

function pdfElement(contract) {
  const pages = pageTexts(contract);
  return React.createElement(
    Document,
    null,
    ...pages.map((page, index) =>
      React.createElement(
        Page,
        { key: page.title, size: "LETTER", style: styles.page },
        React.createElement(Text, { style: styles.title }, `${contract.contract_name}`),
        React.createElement(Text, { style: styles.body }, `Synthetic contract document - ${contract.contract_id} - page ${index + 1}`),
        React.createElement(Text, { style: styles.section }, page.title),
        React.createElement(Text, { style: styles.body }, page.text),
        React.createElement(
          View,
          { style: styles.box },
          React.createElement(Text, null, `Source package: ${DATASET_ID}`),
          React.createElement(Text, null, `Review state: ${REVIEW_STATUS}`),
          React.createElement(Text, null, "No employee names, personal email addresses, phone numbers, patient identifiers, or PHI are present."),
        ),
      ),
    ),
  );
}

async function writePdf(contract, suffix) {
  const safeName = `${contract.contract_id}_${contract.vendor_name.replace(/[^A-Za-z0-9]+/gu, "_")}_${suffix}_SYNTHETIC.pdf`;
  const filePath = path.join(OUT_DIR, "documents", safeName);
  ensureDir(path.dirname(filePath));
  await renderToFile(pdfElement(contract), filePath);
  const bytes = fs.readFileSync(filePath);
  return {
    source_file_id: `${contract.contract_id}-${suffix}`,
    source_file_name: safeName,
    source_file_sha256: sha256(bytes),
    page_count: pageTexts(contract).length,
  };
}

function common(row, contract) {
  return {
    tenant_key: TENANT_KEY,
    dataset_version: DATASET_VERSION,
    contract_id: contract.contract_id,
    vendor_id: contract.vendor_id,
    vendor_name: contract.vendor_name,
    ...row,
  };
}

function buildRows(documentsByContract) {
  const months = monthStarts();
  const overview = [];
  const pricing = [];
  const invoices = [];
  const po = [];
  const rates = [];
  const renewal = [];
  const sla = [];
  const usage = [];
  const finance = [];
  const scope = [];
  const inventory = [];
  const pageText = [];
  const clauses = [];
  const reconciliation = [];
  const evidenceInventory = [];
  const talkTrack = [];

  for (const contract of contracts) {
    overview.push(common({
      contract_name: contract.contract_name,
      contract_archetype: contract.archetype,
      contract_english_overview: contract.overview,
      business_functions_supported: contract.functions,
      systems_services_supported: contract.systems,
      annual_value_usd: money(contract.annual_value_usd),
      actual_annual_spend_usd: money(contract.actual_annual_spend_usd),
      total_committed_value_usd: money(contract.total_committed_value_usd),
      start_date: contract.start_date,
      end_date: contract.end_date,
      notice_deadline: contract.notice_deadline,
      notice_period_days: contract.notice_period_days,
      auto_renew: contract.auto_renew,
      decision_owner_role_ref: contract.owner,
      source_system: "CLM plus finance and service extracts",
      source_system_examples: contract.sourceExamples,
      source_file_report: `${contract.contract_id}_contract_overview_extract.csv`,
      source_record_id: `${contract.contract_id}-OVERVIEW`,
      extraction_grain: "one row per governed contract family",
      refresh_frequency: REFRESH_ON_CHANGE,
      review_status: REVIEW_STATUS,
    }, contract));

    for (const item of contract.pricing) {
      const [id, code, desc, driver, qty, unit, unitPrice] = item;
      pricing.push(common({
        line_item_id: id,
        sku_or_service_code: code,
        line_item_description: desc,
        spend_driver: driver,
        quantity_or_commitment: qty,
        unit_of_measure: unit,
        unit_price_usd: money(unitPrice),
        annual_value_usd: money(qty * unitPrice),
        evidence_source: "executed agreement pricing schedule and PO baseline",
        source_system: "CLM/pricing schedule plus ERP PO line",
        source_system_examples: "Icertis CLM; SharePoint contract repository; Coupa; Sterling Supplier Invoices",
        source_record_id: id,
        source_file_report: `${contract.contract_id}_pricing_schedule.csv`,
        extraction_grain: "one row per contract pricing line or rate band",
        refresh_frequency: REFRESH_ON_CHANGE,
        review_status: REVIEW_STATUS,
      }, contract));
    }

    for (const [index, item] of contract.scope.entries()) {
      const [appRef, appName, businessFunction, criticality, component, cost] = item;
      scope.push(common({
        application_ref: appRef,
        application_name: appName,
        business_function: businessFunction,
        criticality,
        service_or_platform_component: component,
        annual_run_cost_usd: money(cost),
        relationship_method: "explicit_contract_scope",
        relationship_confidence: "0.94",
        source_system: "contract scope schedule plus CMDB/service owner mapping",
        source_system_examples: "Icertis CLM; ServiceNow CMDB; Apptio; application portfolio extract",
        source_record_id: `SCOPE-${contract.contract_id}-${String(index + 1).padStart(2, "0")}`,
        source_file_report: `${contract.contract_id}_application_scope_map.csv`,
        extraction_grain: "one row per contract-to-application/function relationship",
        refresh_frequency: "Monthly or on CMDB ownership change",
        review_status: REVIEW_STATUS,
      }, contract));
    }

    for (let index = 0; index < 12; index += 1) {
      const amount = Math.round(contract.annual_value_usd / 10 + index * 14_500);
      po.push(common({
        po_number: `MER-PO-${contract.contract_id}-${String(index + 1).padStart(3, "0")}`,
        po_line_id: `MER-PO-LINE-${contract.contract_id}-${String(index + 1).padStart(3, "0")}`,
        po_description: `${contract.contract_name} covered services period ${index + 1}`,
        po_amount_usd: money(amount),
        active_contract_match: index % 7 === 0 ? "partial_period_overlap" : "active_contract_match",
        coverage_start_date: months[index],
        coverage_end_date: months[index + 11],
        buyer_role_ref: "ROLE-SOURCING-MANAGER",
        cost_center_ref: index % 2 === 0 ? "CC-FINANCE-OPS" : "CC-TECH-PLATFORM",
        source_system: "Procurement / S2P",
        source_system_examples: "Coupa; Ariba; Sterling Procurement; Oracle Procurement Cloud",
        source_record_id: `PO-MATCH-${contract.contract_id}-${String(index + 1).padStart(3, "0")}`,
        source_file_report: `${contract.contract_id}_po_contract_match.csv`,
        extraction_grain: "one row per PO line to active contract coverage check",
        refresh_frequency: REFRESH_MONTHLY,
        review_status: REVIEW_STATUS,
      }, contract));
    }

    const pricingCycle = contract.pricing.slice(0, 4);
    for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
      for (let lineIndex = 0; lineIndex < pricingCycle.length; lineIndex += 1) {
        const item = pricingCycle[lineIndex];
        const qty = 40 + ((monthIndex + 1) * (lineIndex + 2));
        const contractRate = Math.round(item[6] / (item[5].includes("hour") ? 1 : 24));
        const uplift = monthIndex % 5 === 0 ? 0.13 : monthIndex % 7 === 0 ? 0.08 : 0;
        const billedRate = Math.round(contractRate * (1 + uplift));
        const exception = uplift > 0 ? (billedRate - contractRate) * qty : 0;
        invoices.push(common({
          invoice_id: `INV-${contract.contract_id}-${String(monthIndex + 1).padStart(2, "0")}`,
          invoice_line_id: `INV-${contract.contract_id}-${String(monthIndex + 1).padStart(2, "0")}-${lineIndex + 1}`,
          po_number: `MER-PO-${contract.contract_id}-${String((monthIndex % 12) + 1).padStart(3, "0")}`,
          invoice_date: months[monthIndex],
          service_period_start: months[monthIndex],
          service_period_end: months[monthIndex],
          sku_or_service_code: item[1],
          line_description: item[2],
          invoiced_amount_usd: money(billedRate * qty),
          matched_contract_rate_usd: money(contractRate),
          billed_rate_usd: money(billedRate),
          exception_type: exception > 0 ? "rate_above_contract_or_uncovered_line" : "none",
          exception_amount_usd: money(exception),
          payment_status: monthIndex < 20 ? "paid" : "approved_not_paid",
          source_system: "AP / ERP financial subledger",
          source_system_examples: "Sterling Supplier Invoices; Oracle AP; SAP AP; Coupa invoice match",
          source_record_id: `AP-${contract.contract_id}-${String(monthIndex + 1).padStart(2, "0")}-${lineIndex + 1}`,
          source_file_report: `${contract.contract_id}_invoice_lines.csv`,
          extraction_grain: "one row per supplier invoice line",
          refresh_frequency: REFRESH_MONTHLY,
          review_status: REVIEW_STATUS,
        }, contract));
      }
    }

    const roleRows = contract.contract_id === "CF-001"
      ? [
          ["Data platform lead", "US", 178, 196, 920],
          ["Clinical data engineer", "India", 74, 84, 1880],
          ["Northgate Insight workspace admin", "US", 138, 151, 740],
          ["Data quality analyst", "Philippines", 48, 56, 1260],
          ["Release manager", "US", 164, 178, 520],
          ["API integration engineer", "India", 88, 98, 1110],
        ]
      : [
          ["Sterling financials consultant", "US", 188, 204, 530],
          ["Sterling HCM analyst", "India", 82, 90, 810],
          ["Integration developer", "India", 92, 101, 760],
          ["Release advisor", "US", 168, 184, 380],
          ["Prism analytics specialist", "US", 156, 171, 410],
        ];
    for (const [index, role] of roleRows.entries()) {
      const [title, location, contractRate, billedRate, hours] = role;
      const variance = (billedRate - contractRate) * hours;
      rates.push(common({
        rate_card_line_id: `RATE-${contract.contract_id}-${String(index + 1).padStart(2, "0")}`,
        labor_or_service_role: title,
        location,
        contract_rate_usd_per_hour: money(contractRate),
        billed_rate_usd_per_hour: money(billedRate),
        hours_last_12_months: money(hours),
        rate_variance_usd: money(variance),
        rate_variance_pct: pct((billedRate - contractRate) / contractRate),
        amendment_reference: "No signed rate-card amendment found for observed uplift",
        source_system: "VMS/rate card",
        source_system_examples: "Fieldglass; Beeline; Icertis rate schedule; vendor invoice detail",
        source_record_id: `RATE-${contract.contract_id}-${String(index + 1).padStart(2, "0")}`,
        source_file_report: `${contract.contract_id}_fieldglass_rate_card.csv`,
        extraction_grain: "one row per role and location rate band",
        refresh_frequency: "On amendment or monthly when invoice reconciliation runs",
        review_status: REVIEW_STATUS,
      }, contract));
    }

    const towers = contract.contract_id === "CF-001"
      ? ["Data platform operations", "BI service desk"]
      : ["Sterling tenant operations", "Integration service desk"];
    for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
      for (let towerIndex = 0; towerIndex < towers.length; towerIndex += 1) {
        const miss = (monthIndex + towerIndex) % 4 === 0;
        const earned = miss ? 8200 + monthIndex * 350 + towerIndex * 450 : 1800 + monthIndex * 90;
        const claimed = Math.round(earned * (miss ? 0.38 : 0.72));
        const received = Math.round(claimed * 0.83);
        sla.push(common({
          period_month: months[monthIndex].slice(0, 7),
          service_tower: towers[towerIndex],
          sla_name: towerIndex === 0 ? "critical platform availability" : "severity response and backlog aging",
          target_attainment_rate: towerIndex === 0 ? "0.995" : "0.950",
          actual_attainment_rate: miss ? "0.972" : "0.991",
          sev1_incident_count: miss ? "1" : "0",
          sev2_incident_count: String(miss ? 5 + (monthIndex % 3) : 1 + (monthIndex % 2)),
          service_credits_earned_usd: money(earned),
          service_credits_claimed_usd: money(claimed),
          service_credits_received_usd: money(received),
          root_cause_category: miss ? "capacity and change backlog" : "within tolerance",
          source_system: "ITSM / service management",
          source_system_examples: "ServiceNow SLA module; monthly service review pack; CLM SLA schedule",
          source_record_id: `SLA-${contract.contract_id}-${monthIndex + 1}-${towerIndex + 1}`,
          source_file_report: `${contract.contract_id}_sla_credit_history.csv`,
          extraction_grain: "one row per contract service tower per month",
          refresh_frequency: REFRESH_MONTHLY,
          review_status: REVIEW_STATUS,
        }, contract));
      }
    }

    const usageServices = contract.contract_id === "CF-001"
      ? [
          ["Northgate Insight premium support", 18_000, 13_900, 104_000],
          ["Data engineering change bank", 14_400, 10_750, 92_000],
          ["Clinical data-product support", 22, 18, 132_000],
        ]
      : [
          ["Sterling Prism users", 5200, 3300, 74_000],
          ["Sterling Extend app entitlement", 38, 21, 94_000],
          ["Release advisory hours", 9600, 6800, 61_000],
        ];
    for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
      for (const [service, entitled, active, monthlyCost] of usageServices) {
        const activeQty = Math.round(active * (0.94 + (monthIndex % 5) * 0.012));
        usage.push(common({
          period_month: months[monthIndex].slice(0, 7),
          sku_or_service: service,
          entitled_quantity: money(entitled),
          active_quantity: money(activeQty),
          utilization_rate: pct(activeQty / entitled),
          monthly_cost_usd: money(monthlyCost),
          unused_or_underused_quantity: money(Math.max(0, entitled - activeQty)),
          optimization_signal: activeQty / entitled < 0.8 ? "underused_entitlement_review" : "within_expected_band",
          source_system: "usage / entitlement / consumption platforms",
          source_system_examples: contract.contract_id === "CF-001"
            ? "Northgate Insight admin export; Azure Cost Management; vendor monthly operating report"
            : "Sterling tenant admin export; Prism usage export; vendor monthly service pack",
          source_record_id: `USE-${contract.contract_id}-${months[monthIndex].slice(0, 7)}-${service.replace(/[^A-Za-z0-9]+/gu, "-")}`,
          source_file_report: `${contract.contract_id}_usage_entitlement_monthly.csv`,
          extraction_grain: "one row per month per subscription, capacity or service entitlement",
          refresh_frequency: REFRESH_MONTHLY,
          review_status: REVIEW_STATUS,
        }, contract));
      }
    }

    renewal.push(
      common({
        renewal_event_id: `REN-${contract.contract_id}-001`,
        event_date: contract.notice_deadline,
        event_type: "notice_deadline",
        finding_or_offer_summary: "Notice date creates the latest safe decision point for renewal, amendment, or market test.",
        estimated_value_usd: "0",
        evidence_basis: "CLM renewal and notice clause",
        review_status: REVIEW_STATUS,
        owner_role_ref: contract.owner,
        next_action: "Lock decision calendar and validate minimum data pack",
        source_system: "CLM / contract repository",
        source_system_examples: "Icertis CLM; SharePoint contract repository; legal matter workspace",
        source_record_id: `REN-${contract.contract_id}-001`,
        source_file_report: `${contract.contract_id}_renewal_negotiation_history.csv`,
        extraction_grain: "one row per renewal, offer, concession, or decision milestone",
        refresh_frequency: REFRESH_ON_CHANGE,
      }, contract),
      common({
        renewal_event_id: `REN-${contract.contract_id}-002`,
        event_date: "2027-06-30",
        event_type: "shelfware_scope_case",
        finding_or_offer_summary: "Usage and entitlement review supports scope reduction before renewal commitment.",
        estimated_value_usd: money(contract.avoided_cost_usd),
        evidence_basis: "usage entitlement extract, CLM pricing schedule, and owner review",
        review_status: REVIEW_STATUS,
        owner_role_ref: "ROLE-SOURCING-LEAD",
        next_action: "Prepare renewal scenario with entitlement removal and service tower reduction",
        source_system: "Usage plus sourcing workbench",
        source_system_examples: "Sterling admin exports; Northgate Insight admin; Coupa sourcing; Icertis CLM",
        source_record_id: `REN-${contract.contract_id}-002`,
        source_file_report: `${contract.contract_id}_renewal_negotiation_history.csv`,
        extraction_grain: "one row per renewal, offer, concession, or decision milestone",
        refresh_frequency: REFRESH_ON_CHANGE,
      }, contract),
      common({
        renewal_event_id: `REN-${contract.contract_id}-003`,
        event_date: "2027-08-15",
        event_type: "supplier_concession",
        finding_or_offer_summary: "Supplier accepted price and term improvements in draft amendment packet.",
        estimated_value_usd: money(contract.negotiated_improvement_usd),
        evidence_basis: "supplier offer, negotiation tracker, and legal redline summary",
        review_status: REVIEW_STATUS,
        owner_role_ref: "ROLE-SOURCING-LEAD",
        next_action: "Route amendment for approval and finance value case registration",
        source_system: "Sourcing / supplier offer / CLM",
        source_system_examples: "Coupa sourcing; supplier response portal; Icertis CLM",
        source_record_id: `REN-${contract.contract_id}-003`,
        source_file_report: `${contract.contract_id}_renewal_negotiation_history.csv`,
        extraction_grain: "one row per renewal, offer, concession, or decision milestone",
        refresh_frequency: REFRESH_ON_CHANGE,
      }, contract),
    );
  }

  const docs = documentsByContract;
  for (const contract of contracts) {
    const contractDocs = docs.get(contract.contract_id) || [];
    for (const document of contractDocs) {
      inventory.push(common({
        source_file_id: document.source_file_id,
        source_file_name: document.source_file_name,
        source_file_sha256: document.source_file_sha256,
        document_type: document.document_type,
        mapping_status: "mapped_to_register_contract",
        storage_target: "azure_blob_source_contract_documents",
        page_count: document.page_count,
        parser_version: "contract_pdf_adapter_v1",
        loaded_policy: "synthetic_document_extract_only_no_pii_no_phi",
      }, contract));

      pageTexts(contract).forEach((page, index) => {
        pageText.push(common({
          source_file_id: document.source_file_id,
          source_file_name: document.source_file_name,
          source_file_sha256: document.source_file_sha256,
          mapping_status: "mapped_to_register_contract",
          source_page: index + 1,
          page_text_sha256: sha256(page.text),
          page_text: `${page.title}. ${page.text}`,
        }, contract));
      });

      const concepts = [
        ["contract.english_overview", contract.overview, "", "document_evidenced", "scope", 1, "Agreement Overview"],
        ["contract.annual_value", "", contract.annual_value_usd, "document_evidenced", "commercial", 3, "Commercial Terms And Pricing Schedule"],
        ["contract.notice_deadline", contract.notice_deadline, "", "document_evidenced", "renewal", 4, "Service Levels, Renewal, And Value Confirmation"],
        ["contract.auto_renew", contract.auto_renew, "", "document_evidenced", "renewal", 4, "Service Levels, Renewal, And Value Confirmation"],
        ["contract.scope_summary", contract.systems, "", "document_evidenced", "scope", 2, "Scope And Service Responsibilities"],
      ];
      for (const [conceptRef, valueText, valueNum, evidenceClass, ledger, sourcePage, section] of concepts) {
        clauses.push(common({
          source_file_id: document.source_file_id,
          source_file_name: document.source_file_name,
          source_file_sha256: document.source_file_sha256,
          document_type: document.document_type,
          extraction_id: `EXT-${document.source_file_id}-${conceptRef.replace(/[^A-Za-z0-9]+/gu, "-")}`,
          concept_ref: conceptRef,
          subject_kind: "contract",
          subject_ref: contract.contract_id,
          value_text: valueText,
          value_num: valueNum,
          evidence_class: evidenceClass,
          ledger,
          confidence: "0.91",
          method: "pdf_text_extraction_with_human_review",
          review_state: REVIEW_STATUS,
          source_page: sourcePage,
          source_section: section,
          source_excerpt: valueText || `USD ${valueNum} annual value extracted from pricing schedule.`,
          extractor_version: "contract_pdf_adapter_v1",
          extracted_at: "2026-08-09T00:00:00Z",
        }, contract));
      }
    }
  }

  for (const contract of contracts) {
    const serviceCreditGap = sla
      .filter((row) => row.contract_id === contract.contract_id)
      .reduce((sum, row) => sum + Number(row.service_credits_earned_usd) - Number(row.service_credits_claimed_usd), 0);
    const invoiceExceptions = invoices
      .filter((row) => row.contract_id === contract.contract_id)
      .reduce((sum, row) => sum + Number(row.exception_amount_usd), 0);
    const rateVariance = rates
      .filter((row) => row.contract_id === contract.contract_id)
      .reduce((sum, row) => sum + Number(row.rate_variance_usd), 0);
    const recoverable = serviceCreditGap + invoiceExceptions + rateVariance;

    finance.push(common({
      value_claim_id: `VC-${contract.contract_id}-001`,
      optimization_state: "evidence_ready_for_door1",
      recoverable_leakage_usd: money(recoverable),
      avoided_cost_usd: money(contract.avoided_cost_usd),
      negotiated_improvement_usd: money(contract.negotiated_improvement_usd),
      realized_value_usd: money(contract.realized_value_usd),
      realized_value_basis: "finance confirmed run-rate reduction and recovered credits from synthetic canary package",
      finance_owner_role_ref: "ROLE-FINANCE-VALUE-ATTESTOR",
      confirmation_date: "2027-06-30",
      tower_claim_refs: `claim-source-contract-golden-${contract.contract_id.toLowerCase()}`,
      confidence: "0.86",
      evidence_status: "finance_validated_canary",
      source_system: "Finance value confirmation",
      source_system_examples: "Finance value ledger; AP run-rate report; amendment tracker; Tower claim gate",
      source_record_id: `FIN-${contract.contract_id}-001`,
      source_file_report: `${contract.contract_id}_finance_value_confirmation.csv`,
      extraction_grain: "one row per finance-confirmed contract value claim",
      refresh_frequency: "Monthly after amendment effective date until value stabilizes",
      review_status: REVIEW_STATUS,
    }, contract));

    reconciliation.push(common({
      annual_value_usd: money(contract.annual_value_usd),
      actual_annual_spend_usd: money(contract.actual_annual_spend_usd),
      contract_to_actual_variance_usd: money(contract.annual_value_usd - contract.actual_annual_spend_usd),
      service_credits_earned_usd: money(sla.filter((row) => row.contract_id === contract.contract_id).reduce((sum, row) => sum + Number(row.service_credits_earned_usd), 0)),
      service_credits_claimed_usd: money(sla.filter((row) => row.contract_id === contract.contract_id).reduce((sum, row) => sum + Number(row.service_credits_claimed_usd), 0)),
      service_credit_gap_usd: money(serviceCreditGap),
      invoice_line_exceptions_usd: money(invoiceExceptions),
      rate_card_variance_usd: money(rateVariance),
      recoverable_leakage_usd: money(recoverable),
      avoided_cost_usd: money(contract.avoided_cost_usd),
      negotiated_improvement_usd: money(contract.negotiated_improvement_usd),
      realized_value_usd: money(contract.realized_value_usd),
      realized_value_policy: "finance confirmed only; opportunity and target values remain separate",
      evidence_ready_lines: "5",
      evidence_gap_lines: "0",
      expected_ui_story: "fact based golden contract story with scope, economics, performance, relationship, evidence, and optimize tabs populated",
    }, contract));

    const evidenceRows = [
      ["EVID-CLM", "Executed agreement and pricing schedule", "CLM / contract repository", "contract_term;scope;benchmark;renewal", "one row per clause or pricing line", REFRESH_ON_CHANGE, "Legal operations / sourcing owner"],
      ["EVID-AP", "Invoice and payment detail", "AP / ERP financial subledger", "invoice;payment;rate_card", "one row per invoice line", REFRESH_MONTHLY, "AP operations owner"],
      ["EVID-PO", "PO and contract coverage check", "Procurement / S2P", "supplier_offer;approved_agreement;scope", "one row per PO line", REFRESH_MONTHLY, "Procurement operations owner"],
      ["EVID-SLA", "Service credit and incident history", "ITSM / service management", "sla;service_credit", "one row per month per service tower", REFRESH_MONTHLY, "Service management owner"],
      ["EVID-USE", "Usage and entitlement extract", "Usage / entitlement platform", "usage;cloud_consumption", "one row per entitlement per month", REFRESH_MONTHLY, "Platform owner"],
      ["EVID-FIN", "Finance value confirmation", "Finance value ledger", "finance_value_confirmation", "one row per finance-attested claim", "Monthly after optimization", "Finance value owner"],
    ];
    for (const [id, fileName, family, classes, grain, refresh, owner] of evidenceRows) {
      evidenceInventory.push(common({
        evidence_file_id: `${contract.contract_id}-${id}`,
        file_name: `${contract.contract_id}_${fileName.replace(/[^A-Za-z0-9]+/gu, "_")}.csv`,
        source_system_family: family,
        normalized_evidence_classes: classes,
        row_grain: grain,
        refresh_frequency: refresh,
        expected_client_owner: owner,
        collection_instruction: `Export ${fileName} for ${contract.contract_id} with contract id, vendor id, service period, source record id, and reviewer status.`,
        privacy_instruction: "Do not include employee names, personal email addresses, phone numbers, patient identifiers, or PHI.",
        signoff_required: "yes - source owner and finance/procurement owner signoff before optimization claim",
      }, contract));
    }

    [
      ["1. Why this contract", `${contract.vendor_name} is a material optimization candidate because ${contract.contract_name} carries USD ${money(contract.annual_value_usd)} annual value and supports ${contract.functions}.`, `Annual value USD ${money(contract.annual_value_usd)}`, `Actual annual spend USD ${money(contract.actual_annual_spend_usd)}`, "contract_overview.csv; contract_pricing_schedule.csv; contract_application_scope.csv", "Contract 360 > Story"],
      ["2. What it covers", contract.overview, `${contract.scope.length} scope rows`, `${contract.pricing.length} pricing lines`, "contract_overview.csv; contract_application_scope.csv; contract_pricing_schedule.csv", "Contract 360 > Scope"],
      ["3. What creates pressure", `Service, invoice, rate-card, usage, and finance records quantify the optimization thesis without converting gaps into value.`, `Recoverable leakage USD ${money(recoverable)}`, `Realized value USD ${money(contract.realized_value_usd)}`, "sla_incident_service_credit_monthly.csv; invoice_lines.csv; rate_card_variance.csv; finance_value_confirmation.csv", "Contract 360 > Performance and Evidence"],
      ["4. What action follows", `Door 1 should convert the evidence into a scoped optimization plan, an approval record, and a finance-confirmed value proof path.`, `Avoided cost USD ${money(contract.avoided_cost_usd)}`, `Negotiated improvement USD ${money(contract.negotiated_improvement_usd)}`, "renewal_negotiation_history.csv; finance_value_confirmation.csv", "Contract 360 > Optimize"],
      ["5. How to source it", `Start with controlled extracts from CLM, AP/ERP, S2P, ITSM, usage/admin exports, and finance value ledger. APIs can come later.`, "6 evidence families", "No PII or PHI", "evidence_source_inventory.csv; field_level_extraction_guide.csv", "Contract 360 > Relationship and Evidence"],
      ["6. What not to claim", `Do not claim value from spend variance, missing evidence, or negotiation targets until finance confirms realized value.`, "Opportunity separate from realized value", "Tower gate required", "finance_value_confirmation.csv", "Contract 360 > Value proof"],
    ].forEach(([story_step, client_talk_track, fact_1, fact_2, evidence_files, ui_location]) => {
      talkTrack.push({
        contract_id: contract.contract_id,
        story_step,
        client_talk_track,
        fact_1,
        fact_2,
        evidence_files,
        ui_location,
      });
    });
  }

  return {
    overview,
    pricing,
    invoices,
    po,
    rates,
    renewal,
    sla,
    usage,
    finance,
    scope,
    inventory,
    pageText,
    clauses,
    reconciliation,
    evidenceInventory,
    talkTrack,
  };
}

function writeStaticGuides() {
  writeCsv(
    "templates/field_level_extraction_guide.csv",
    ["field_id", "field_name", "meaning", "expected_owner", "source_system_examples", "validation_instruction", "data_type", "applies_to_files"],
    [
      ["FLD-001", "contract_english_overview", "Plain-English scope of the contract, including services, platforms, commercial drivers, and optimization question.", "Sourcing owner plus legal operations", "Icertis CLM; SharePoint contract repository; executed agreement PDF", "Must be extracted or human-reviewed from executed agreement, SOW, order form, or statement of work.", "text", "contract_overview.csv; contract_pdf_clause_extractions.csv"],
      ["FLD-002", "annual_value_usd", "Current annual contract value from governed contract register or executed order form.", "Procurement finance", "CLM register; Coupa contract workspace; Sterling Supplier Invoices", "Must reconcile to contract register or documented approved contract value.", "number_usd", "contract_overview.csv; golden_contract_reconciliation.csv"],
      ["FLD-003", "invoice_line_exception_amount_usd", "Dollar difference where invoice line exceeds active contract rate or lacks active contract coverage.", "AP operations", "Sterling Supplier Invoices; Oracle AP; SAP AP; Coupa invoice match", "Must be derived from invoice line, PO, active contract coverage, billed rate, contract rate, and quantity.", "number_usd", "invoice_lines.csv"],
      ["FLD-004", "service_credit_gap_usd", "Earned service credits not claimed.", "Service management owner", "ServiceNow SLA module; monthly service review pack; CLM SLA schedule", "Must equal earned minus claimed at monthly service-tower grain.", "number_usd", "sla_incident_service_credit_monthly.csv"],
      ["FLD-005", "rate_card_variance_usd", "Billed role or service rate above current contract rate card.", "Vendor management office", "Fieldglass; Beeline; CLM rate schedule; invoice detail", "Must equal billed rate minus contract rate times observed hours.", "number_usd", "rate_card_variance.csv"],
      ["FLD-006", "unused_or_underused_quantity", "Entitled capacity not actively used during the month.", "Platform owner", "Sterling admin; Northgate Insight admin; Azure Cost Management; SaaS admin exports", "Must preserve entitlement and active quantity separately; do not infer value without commercial mapping.", "number", "usage_entitlement_monthly.csv"],
      ["FLD-007", "realized_value_usd", "Finance-confirmed value after action, not opportunity size.", "Finance value owner", "Finance value ledger; AP run-rate report; amendment tracker", "Must have confirmation date, owner role, basis, and claim reference.", "number_usd", "finance_value_confirmation.csv"],
    ],
  );

  writeCsv(
    "implementation/parser_persistence_mapping.csv",
    ["source_file", "evidence_classes", "canonical_objects_emitted", "read_model_projection", "ui_tabs", "parser_requirement", "quality_gate"],
    [
      ["contract_overview.csv", "contract_term;scope;renewal", "contract;vendor;contract_scope_summary", "source.contract_360; source.golden_contract_overview", "Story; Scope", "Parse contract id, vendor id, overview, dates, owner role, annual and committed value.", "Overview cannot be blank for golden contracts."],
      ["contract_pricing_schedule.csv", "contract_term;rate_card;scope", "pricing_line;contract_term", "source.golden_contract_pricing_schedule", "Scope; Economics", "Preserve SKU/service code, line description, quantity, unit, unit price and annual value.", "Line totals must sum to a materially explainable contract value bridge."],
      ["invoice_lines.csv", "invoice;payment;rate_card", "invoice_line;exception", "source.golden_contract_invoice_lines", "Economics; Evidence; Optimize", "Parse invoice line, PO, service period, billed rate, matched contract rate and exception amount.", "Exception amount must be derived and non-negative; missing evidence is not zero."],
      ["po_contract_match.csv", "approved_agreement;scope", "po_coverage_check", "source.golden_contract_po_contract_match", "Evidence; Relationship", "Parse PO line and active contract coverage dates.", "PO line must carry contract id and coverage state."],
      ["rate_card_variance.csv", "rate_card;workforce", "rate_card_variance", "source.golden_contract_rate_card_variance", "Economics; Optimize", "Parse role, location, contract rate, billed rate, hours, variance.", "Variance equals rate delta times hours."],
      ["sla_incident_service_credit_monthly.csv", "sla;service_credit", "service_credit_period", "source.golden_contract_sla_incident_service_credit_monthly", "Performance; Optimize", "Parse monthly SLA attainment, incidents, credits earned, claimed and received.", "Claimed cannot exceed earned; received cannot exceed claimed."],
      ["usage_entitlement_monthly.csv", "usage;cloud_consumption", "usage_entitlement_period", "source.golden_contract_usage_entitlement_monthly", "Scope; Economics; Optimize", "Parse entitled quantity, active quantity, utilization and monthly cost.", "Utilization must equal active divided by entitled within rounding tolerance."],
      ["finance_value_confirmation.csv", "finance_value_confirmation", "tower_value_claim;finance_attestation", "source.golden_contract_finance_value_confirmation; tower.value_claim", "Optimize; Value proof", "Parse recoverable, avoided, negotiated and realized ledgers separately.", "Realized value requires finance owner, date and basis."],
      ["contract_pdf_clause_extractions.csv", "contract_term;scope;renewal;benchmark", "doc.extraction;doc.span;meta.concept", "doc.extraction; source contract intelligence views", "Relationship; Evidence; Contract intelligence", "Parse source page, section, concept, value and source excerpt.", "Every extraction must point to file id, page and section."],
    ],
  );
}

function writePackageRows(rows) {
  writeCsv("synthetic/contract_overview.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "contract_name", "contract_archetype", "contract_english_overview", "business_functions_supported", "systems_services_supported", "annual_value_usd", "actual_annual_spend_usd", "total_committed_value_usd", "start_date", "end_date", "notice_deadline", "notice_period_days", "auto_renew", "decision_owner_role_ref", "source_system", "source_system_examples", "source_file_report", "source_record_id", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.overview);
  writeCsv("synthetic/contract_pricing_schedule.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "line_item_id", "sku_or_service_code", "line_item_description", "spend_driver", "quantity_or_commitment", "unit_of_measure", "unit_price_usd", "annual_value_usd", "evidence_source", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.pricing);
  writeCsv("synthetic/invoice_lines.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "invoice_id", "invoice_line_id", "po_number", "invoice_date", "service_period_start", "service_period_end", "sku_or_service_code", "line_description", "invoiced_amount_usd", "matched_contract_rate_usd", "billed_rate_usd", "exception_type", "exception_amount_usd", "payment_status", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.invoices);
  writeCsv("synthetic/po_contract_match.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "po_number", "po_line_id", "po_description", "po_amount_usd", "active_contract_match", "coverage_start_date", "coverage_end_date", "buyer_role_ref", "cost_center_ref", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.po);
  writeCsv("synthetic/rate_card_variance.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "rate_card_line_id", "labor_or_service_role", "location", "contract_rate_usd_per_hour", "billed_rate_usd_per_hour", "hours_last_12_months", "rate_variance_usd", "rate_variance_pct", "amendment_reference", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.rates);
  writeCsv("synthetic/renewal_negotiation_history.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "renewal_event_id", "event_date", "event_type", "finding_or_offer_summary", "estimated_value_usd", "evidence_basis", "review_status", "owner_role_ref", "next_action", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency",
  ], rows.renewal);
  writeCsv("synthetic/sla_incident_service_credit_monthly.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "period_month", "service_tower", "sla_name", "target_attainment_rate", "actual_attainment_rate", "sev1_incident_count", "sev2_incident_count", "service_credits_earned_usd", "service_credits_claimed_usd", "service_credits_received_usd", "root_cause_category", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.sla);
  writeCsv("synthetic/usage_entitlement_monthly.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "period_month", "sku_or_service", "entitled_quantity", "active_quantity", "utilization_rate", "monthly_cost_usd", "unused_or_underused_quantity", "optimization_signal", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.usage);
  writeCsv("synthetic/finance_value_confirmation.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "value_claim_id", "optimization_state", "recoverable_leakage_usd", "avoided_cost_usd", "negotiated_improvement_usd", "realized_value_usd", "realized_value_basis", "finance_owner_role_ref", "confirmation_date", "tower_claim_refs", "confidence", "evidence_status", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.finance);
  writeCsv("synthetic/contract_application_scope.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "application_ref", "application_name", "business_function", "criticality", "service_or_platform_component", "annual_run_cost_usd", "relationship_method", "relationship_confidence", "source_system", "source_system_examples", "source_record_id", "source_file_report", "extraction_grain", "refresh_frequency", "review_status",
  ], rows.scope);
  writeCsv("synthetic/contract_pdf_document_inventory.csv", [
    "tenant_key", "dataset_version", "source_file_id", "source_file_name", "source_file_sha256", "document_type", "contract_id", "vendor_name", "mapping_status", "storage_target", "page_count", "parser_version", "loaded_policy",
  ], rows.inventory);
  writeCsv("synthetic/contract_pdf_page_text.csv", [
    "tenant_key", "dataset_version", "source_file_id", "source_file_name", "source_file_sha256", "contract_id", "vendor_name", "mapping_status", "source_page", "page_text_sha256", "page_text",
  ], rows.pageText);
  writeCsv("synthetic/contract_pdf_clause_extractions.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "source_file_id", "source_file_name", "source_file_sha256", "document_type", "extraction_id", "concept_ref", "subject_kind", "subject_ref", "value_text", "value_num", "evidence_class", "ledger", "confidence", "method", "review_state", "source_page", "source_section", "source_excerpt", "extractor_version", "extracted_at",
  ], rows.clauses);
  writeCsv("reconciliation/golden_contract_reconciliation.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "annual_value_usd", "actual_annual_spend_usd", "contract_to_actual_variance_usd", "service_credits_earned_usd", "service_credits_claimed_usd", "service_credit_gap_usd", "invoice_line_exceptions_usd", "rate_card_variance_usd", "recoverable_leakage_usd", "avoided_cost_usd", "negotiated_improvement_usd", "realized_value_usd", "realized_value_policy", "evidence_ready_lines", "evidence_gap_lines", "expected_ui_story",
  ], rows.reconciliation);
  writeCsv("templates/evidence_source_inventory.csv", [
    "tenant_key", "dataset_version", "contract_id", "vendor_id", "vendor_name", "evidence_file_id", "file_name", "source_system_family", "normalized_evidence_classes", "row_grain", "refresh_frequency", "expected_client_owner", "collection_instruction", "privacy_instruction", "signoff_required",
  ], rows.evidenceInventory);
  writeCsv("story/contract_fact_based_talk_track.csv", [
    "contract_id", "story_step", "client_talk_track", "fact_1", "fact_2", "evidence_files", "ui_location",
  ], rows.talkTrack);
}

function validateRows(rows) {
  const failures = [];
  for (const contract of contracts) {
    const contractId = contract.contract_id;
    const rec = rows.reconciliation.find((row) => row.contract_id === contractId);
    const serviceGap = rows.sla
      .filter((row) => row.contract_id === contractId)
      .reduce((sum, row) => sum + Number(row.service_credits_earned_usd) - Number(row.service_credits_claimed_usd), 0);
    const invoiceExceptions = rows.invoices
      .filter((row) => row.contract_id === contractId)
      .reduce((sum, row) => sum + Number(row.exception_amount_usd), 0);
    const rateVariance = rows.rates
      .filter((row) => row.contract_id === contractId)
      .reduce((sum, row) => sum + Number(row.rate_variance_usd), 0);
    const recoverable = serviceGap + invoiceExceptions + rateVariance;
    if (Number(rec.service_credit_gap_usd) !== serviceGap) failures.push(`${contractId} service credit gap does not reconcile`);
    if (Number(rec.invoice_line_exceptions_usd) !== invoiceExceptions) failures.push(`${contractId} invoice exceptions do not reconcile`);
    if (Number(rec.rate_card_variance_usd) !== rateVariance) failures.push(`${contractId} rate-card variance does not reconcile`);
    if (Number(rec.recoverable_leakage_usd) !== recoverable) failures.push(`${contractId} recoverable leakage does not reconcile`);
    if (!rows.overview.find((row) => row.contract_id === contractId)?.contract_english_overview) failures.push(`${contractId} missing English overview`);
    if (rows.scope.filter((row) => row.contract_id === contractId).length < 6) failures.push(`${contractId} scope rows too shallow`);
    if (rows.clauses.filter((row) => row.contract_id === contractId).length < 10) failures.push(`${contractId} clause extraction rows too shallow`);
  }
  if (failures.length) throw new Error(`Meridian evidence package validation failed: ${failures.join("; ")}`);
}

async function main() {
  rmDir(OUT_DIR);
  ensureDir(OUT_DIR);
  const documentsByContract = new Map();
  for (const contract of contracts) {
    const executed = await writePdf(contract, "EXECUTED-AGREEMENT");
    executed.document_type = "executed_agreement";
    const pricing = await writePdf(contract, "PRICING-SCHEDULE");
    pricing.document_type = "pricing_schedule";
    const sla = await writePdf(contract, "SLA-SCHEDULE");
    sla.document_type = "sla_schedule";
    documentsByContract.set(contract.contract_id, [executed, pricing, sla]);
  }
  const rows = buildRows(documentsByContract);
  validateRows(rows);
  writePackageRows(rows);
  writeStaticGuides();
  writeJson("manifest.json", {
    dataset_id: DATASET_ID,
    dataset_version: DATASET_VERSION,
    tenant_key: TENANT_KEY,
    generated_at: new Date().toISOString(),
    status: "synthetic_demo_not_loaded",
    grain: "two golden contract families with contract PDFs, source extracts, four-ledger economics, and finance confirmation",
    contracts: contracts.map((contract) => ({
      contract_id: contract.contract_id,
      vendor_id: contract.vendor_id,
      vendor_name: contract.vendor_name,
      contract_name: contract.contract_name,
      contract_archetype: contract.archetype,
      annual_value_usd: contract.annual_value_usd,
      evidence_contract: "complete_for_demo_canary_not_client_fact",
    })),
    row_counts: Object.fromEntries(
      Object.entries(rows).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
    ),
    non_additive_measures: [
      "recoverable_leakage_usd",
      "avoided_cost_usd",
      "negotiated_improvement_usd",
      "realized_value_usd",
      "annual_value_usd",
      "actual_annual_spend_usd",
    ],
  });
  writeJson("package_summary.json", {
    package_name: "Meridian golden contract evidence package",
    dataset_id: DATASET_ID,
    tenant_key: TENANT_KEY,
    contract_ids: contracts.map((contract) => contract.contract_id),
    total_csv_rows: Object.values(rows).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0),
    validation: "detail rows reconcile mechanically to golden_contract_reconciliation.csv",
    privacy: "Synthetic, PHI-free, PII-free; role references only.",
  });
  writeJson("documents/pdf_extraction_quality_report.json", {
    dataset_id: DATASET_ID,
    tenant_key: TENANT_KEY,
    mapped_golden_pdf_count: rows.inventory.length,
    supplemental_prior_pdf_count: 0,
    extraction_rows: rows.clauses.length,
    prior_corpus_policy: "All selected synthetic PDFs were processed through the same contract_pdf_* extract path. No separate V1 hiding place.",
    quality_gates: {
      file_rows_have_sha256: true,
      extraction_rows_have_file_page_section: true,
      no_pii_no_phi: true,
      golden_contracts_have_english_overview: true,
    },
  });
  fs.writeFileSync(
    path.join(OUT_DIR, "README.md"),
    [
      "# Meridian Golden Contract Evidence Package",
      "",
      "Synthetic, PHI-free, PII-free evidence package for two Meridian contract families.",
      "",
      "The package is designed to prove that Source Contract 360 and Door 1 optimization are tenant-agnostic. It uses the same shared source.golden_contract_* CSV tables, doc.* PDF extraction tables, and Tower value-claim path as the SkyHarbor canary.",
      "",
      "The important QA rule: four-ledger totals in reconciliation/golden_contract_reconciliation.csv are mechanically derived from the line-level files in synthetic/.",
      "",
    ].join("\n"),
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        out_dir: OUT_DIR,
        dataset_id: DATASET_ID,
        contracts: contracts.map((contract) => contract.contract_id),
        csv_rows: Object.values(rows).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
