import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PptxGenJS from "pptxgenjs";

import { NORTHSTAR_CONTEXT_TEMPLATES } from "../../lib/context-ingestion/template-registry";

type Cell = string | number | boolean;
type Row = Record<string, Cell>;

interface Opco {
  id: string;
  name: string;
  shortName: string;
  revenueUsd: number;
  ebitdaUsd: number;
  employees: number;
  countries: number;
  sector: string;
  hq: string;
  cio: string;
  cfo: string;
  platforms: string[];
  primaryCapabilities: string[];
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  owner: string;
  opcoId: string;
  annualUsd: number;
  termMonths: number;
  criticality: "Tier 1" | "Tier 2" | "Tier 3";
  contractId: string;
}

const OUT_ROOT = path.resolve(process.cwd(), "docs/build/lakeshore/loaded");
const DATA_DIR = path.join(OUT_ROOT, "data");
const DOC_DIR = path.join(OUT_ROOT, "documents");
const HOW_TO_DIR = path.join(OUT_ROOT, "how-to");
const WORKBOOK_DIR = path.join(OUT_ROOT, "workbooks");
const REVIEW_DIR = path.join(OUT_ROOT, "review-bundle");

const GENERATED_AT = "2026-06-04T00:00:00.000Z";
const AS_OF = "2026-05-31";
const TENANT_KEY = "lakeshore";
const BROKER_KEY = "lakeshore-holdings";

const OPCOS: Opco[] = [
  {
    id: "LSH-HOLDCO",
    name: "Lakeshore Holdings",
    shortName: "Holdco",
    revenueUsd: 3_560_000_000,
    ebitdaUsd: 382_000_000,
    employees: 610,
    countries: 50,
    sector: "Private investment group and shared services",
    hq: "Chicago, IL",
    cio: "Meera Rao",
    cfo: "Daniel Whitaker",
    platforms: [
      "Kyriba",
      "Workday",
      "ServiceNow",
      "Microsoft 365",
      "Okta",
      "Power BI",
    ],
    primaryCapabilities: [
      "Treasury",
      "Shared IT",
      "Finance",
      "Cybersecurity",
      "Enterprise Architecture",
    ],
  },
  {
    id: "NLS",
    name: "Northline Supply Chain",
    shortName: "Northline",
    revenueUsd: 1_500_000_000,
    ebitdaUsd: 172_000_000,
    employees: 6_000,
    countries: 34,
    sector: "Foodservice supply chain, freight, cold chain, distribution",
    hq: "Rosemont, IL",
    cio: "Alicia Moreno",
    cfo: "Graham Keller",
    platforms: [
      "SAP S/4HANA",
      "Manhattan WMS",
      "Blue Yonder",
      "FourKites",
      "MuleSoft",
      "Snowflake",
    ],
    primaryCapabilities: [
      "Warehousing",
      "Freight",
      "Demand Planning",
      "Cold Chain",
      "EDI",
    ],
  },
  {
    id: "BMS",
    name: "Brightmark Marketing Services",
    shortName: "Brightmark",
    revenueUsd: 720_000_000,
    ebitdaUsd: 86_000_000,
    employees: 2_450,
    countries: 26,
    sector: "Marketing technology, sourcing, promotions, loyalty operations",
    hq: "Chicago, IL",
    cio: "Nadia Bell",
    cfo: "Priya Deshpande",
    platforms: [
      "Salesforce Marketing Cloud",
      "Adobe Experience Manager",
      "Brandfolder DAM",
      "Coupa",
      "Snowflake",
      "Braze",
    ],
    primaryCapabilities: [
      "Promotion Sourcing",
      "Loyalty",
      "Campaign Ops",
      "Packaging",
      "Brand Experience",
    ],
  },
  {
    id: "FFF",
    name: "Forge & Field Consumer Products",
    shortName: "Forge & Field",
    revenueUsd: 800_000_000,
    ebitdaUsd: 94_000_000,
    employees: 1_530,
    countries: 18,
    sector: "Premium consumer products, DTC commerce, retail channels",
    hq: "Seattle, WA",
    cio: "Ethan Brooks",
    cfo: "Marisol Chen",
    platforms: [
      "Shopify Plus",
      "Salesforce Commerce Cloud",
      "NetSuite",
      "PIM Akeneo",
      "Klaviyo",
      "ShipBob",
    ],
    primaryCapabilities: [
      "Direct Commerce",
      "Retail Wholesale",
      "Product Lifecycle",
      "3PL",
      "Customer Data",
    ],
  },
  {
    id: "GLP",
    name: "Great Lakes Pantry Services",
    shortName: "Great Lakes Pantry",
    revenueUsd: 540_000_000,
    ebitdaUsd: 58_000_000,
    employees: 1_210,
    countries: 5,
    sector: "Workplace foodservice, micro-markets, vending, onsite dining",
    hq: "Troy, MI",
    cio: "Monica Ellis",
    cfo: "Rafael Stone",
    platforms: [
      "Cantaloupe Seed",
      "365 Retail Markets",
      "Toast",
      "NetSuite",
      "Salesforce Field Service",
      "Power BI",
    ],
    primaryCapabilities: [
      "Micro-markets",
      "Office Coffee",
      "Onsite Dining",
      "Vending",
      "Meal Delivery",
    ],
  },
];

const QUARTERS = [
  "2024-Q2",
  "2024-Q3",
  "2024-Q4",
  "2025-Q1",
  "2025-Q2",
  "2025-Q3",
  "2025-Q4",
  "2026-Q1",
];

const REGIONS = ["North America", "Europe", "LATAM", "APAC", "Middle East"];
const COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Netherlands",
  "Poland",
  "China",
  "Japan",
  "Malaysia",
  "Australia",
  "Brazil",
  "United Arab Emirates",
];

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function amount(value: number): number {
  return Math.round(value);
}

function datePlus(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function withMeta(
  row: Row,
  sourceSystem: string,
  sourceOwner: string,
  index: number,
): Row {
  return {
    ...row,
    source_system: sourceSystem,
    source_record_id: `${slug(sourceSystem)}-${String(index).padStart(4, "0")}`,
    source_owner: sourceOwner,
    last_validated_date: AS_OF,
    confidence: 0.86,
    evidence_usable: true,
    notes_gaps:
      "SYNTHETIC / ILLUSTRATIVE. Generated for Lakeshore pilot rehearsal.",
  };
}

function csvEscape(value: Cell | undefined): string {
  const text = value === undefined ? "" : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Row[], columns: string[]): string {
  return (
    [
      columns.join(","),
      ...rows.map((row) =>
        columns.map((column) => csvEscape(row[column])).join(","),
      ),
    ].join("\n") + "\n"
  );
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

function resetOutput(): void {
  if (existsSync(OUT_ROOT)) rmSync(OUT_ROOT, { recursive: true, force: true });
  [DATA_DIR, DOC_DIR, HOW_TO_DIR, WORKBOOK_DIR, REVIEW_DIR].forEach(ensureDir);
}

function vendors(): Vendor[] {
  const shared: Array<
    [string, string, number, "Tier 1" | "Tier 2" | "Tier 3"]
  > = [
    ["KYRIBA", "Treasury Management", 3_200_000, "Tier 1"],
    ["DELOITTE", "Treasury Implementation SI", 6_800_000, "Tier 1"],
    ["MICROSOFT", "Productivity and Azure", 12_400_000, "Tier 1"],
    ["SERVICENOW", "ITSM and CMDB", 4_600_000, "Tier 1"],
    ["OKTA", "Identity and Access", 2_100_000, "Tier 1"],
    ["CROWDSTRIKE", "Endpoint Security", 2_900_000, "Tier 1"],
    ["SNOWFLAKE", "Enterprise Data Cloud", 3_900_000, "Tier 2"],
    ["DATABRICKS", "Lakehouse Platform", 2_700_000, "Tier 2"],
  ];
  const byOpco: Record<
    string,
    Array<[string, string, number, "Tier 1" | "Tier 2" | "Tier 3"]>
  > = {
    NLS: [
      ["SAP", "ERP and Finance", 11_800_000, "Tier 1"],
      ["MANHATTAN", "Warehouse Management", 7_200_000, "Tier 1"],
      ["BLUEYONDER", "Demand Planning", 5_900_000, "Tier 1"],
      ["FOURKITES", "Supply Chain Visibility", 2_200_000, "Tier 2"],
      ["TRANSPOREON", "Freight Procurement", 1_850_000, "Tier 2"],
      ["MULESOFT", "Integration Platform", 2_700_000, "Tier 1"],
    ],
    BMS: [
      ["SALESFORCE", "Marketing Cloud and CRM", 5_800_000, "Tier 1"],
      ["ADOBE", "Experience Manager and Creative Cloud", 4_600_000, "Tier 1"],
      ["BRAZE", "Customer Engagement", 1_950_000, "Tier 2"],
      ["COUPA", "Sourcing and Procurement", 3_150_000, "Tier 1"],
      ["BRANDFOLDER", "Digital Asset Management", 900_000, "Tier 2"],
      ["MEDIAMONKS", "Creative Production Partner", 2_400_000, "Tier 2"],
    ],
    FFF: [
      ["SHOPIFY", "DTC Commerce", 3_700_000, "Tier 1"],
      ["NETSUITE", "ERP", 2_850_000, "Tier 1"],
      ["AKENEO", "Product Information Management", 820_000, "Tier 2"],
      ["KLAVIYO", "Lifecycle Marketing", 1_200_000, "Tier 2"],
      ["SHIPBOB", "3PL Fulfillment", 6_400_000, "Tier 1"],
      ["AMPLITUDE", "Product Analytics", 720_000, "Tier 3"],
    ],
    GLP: [
      ["CANTALOUPE", "Vending and Micro-Market Platform", 2_450_000, "Tier 1"],
      ["365RETAIL", "Micro-Market Checkout", 2_050_000, "Tier 1"],
      ["TOAST", "Cafe POS and Kitchen Display", 1_700_000, "Tier 2"],
      ["USFOODS", "Foodservice Distribution", 8_900_000, "Tier 1"],
      ["ARAMARK-LOCAL", "Onsite Dining Services Partner", 2_200_000, "Tier 2"],
      ["ROUTEOPTIX", "Route Optimization", 860_000, "Tier 2"],
    ],
    "LSH-HOLDCO": [],
  };
  let idx = 1;
  const out: Vendor[] = [];
  for (const [name, category, annualUsd, criticality] of shared) {
    out.push({
      id: `VEN-${name}`,
      name,
      category,
      owner: "Shared Services Procurement",
      opcoId: "LSH-HOLDCO",
      annualUsd,
      termMonths: 36,
      criticality,
      contractId: `CON-LSH-${String(idx++).padStart(3, "0")}`,
    });
  }
  for (const opco of OPCOS.filter((o) => o.id !== "LSH-HOLDCO")) {
    for (const [name, category, annualUsd, criticality] of byOpco[opco.id] ??
      []) {
      out.push({
        id: `VEN-${opco.id}-${name}`,
        name,
        category,
        owner: `${opco.shortName} Technology Sourcing`,
        opcoId: opco.id,
        annualUsd,
        termMonths: criticality === "Tier 1" ? 48 : 24,
        criticality,
        contractId: `CON-${opco.id}-${String(idx++).padStart(3, "0")}`,
      });
    }
  }
  while (out.length < 82) {
    const opco = OPCOS[out.length % OPCOS.length];
    const category = [
      "Managed Services",
      "Analytics",
      "Telecom",
      "Cybersecurity",
      "Consulting",
      "BPO",
      "Hardware",
      "Cloud Tooling",
    ][out.length % 8];
    out.push({
      id: `VEN-LSH-LONGTAIL-${String(out.length + 1).padStart(3, "0")}`,
      name: `${opco.shortName} ${category} Partner ${out.length + 1}`,
      category,
      owner: `${opco.shortName} Vendor Management`,
      opcoId: opco.id,
      annualUsd: 240_000 + (out.length % 11) * 180_000,
      termMonths: 12 + (out.length % 4) * 12,
      criticality: out.length % 5 === 0 ? "Tier 2" : "Tier 3",
      contractId: `CON-LONG-${String(out.length + 1).padStart(3, "0")}`,
    });
  }
  return out;
}

const VENDORS = vendors();

function enterpriseProfileRows(): Row[] {
  return OPCOS.map((opco, index) =>
    withMeta(
      {
        priority:
          index === 0
            ? "Holdco control spine"
            : `${opco.shortName} operating company`,
        opco_id: opco.id,
        owner_role:
          index === 0
            ? "Chairman / Global CIO / CFO"
            : `${opco.cio} / ${opco.cfo}`,
        time_horizon: "FY2026-FY2028",
        business_units: opco.name,
        revenue_usd: opco.revenueUsd,
        employees: opco.employees,
        countries: opco.countries,
        sector: opco.sector,
        hq: opco.hq,
        synthetic_label: "SYNTHETIC / ILLUSTRATIVE",
      },
      "Holdco strategy office",
      "Chief of Staff",
      index + 1,
    ),
  );
}

function financialKpiRows(): Row[] {
  const metrics = [
    "revenue_usd",
    "ebitda_usd",
    "cash_forecast_accuracy_pct",
    "working_capital_usd",
    "days_sales_outstanding",
    "days_payable_outstanding",
  ];
  const rows: Row[] = [];
  let idx = 1;
  for (const opco of OPCOS) {
    for (let q = 0; q < QUARTERS.length; q++) {
      for (const metric of metrics) {
        const base =
          metric === "revenue_usd"
            ? opco.revenueUsd / 4
            : metric === "ebitda_usd"
              ? opco.ebitdaUsd / 4
              : metric === "working_capital_usd"
                ? opco.revenueUsd * 0.11
                : metric === "cash_forecast_accuracy_pct"
                  ? 68 + q * 2 + (opco.id === "LSH-HOLDCO" ? 5 : 0)
                  : metric === "days_sales_outstanding"
                    ? 42 - q
                    : 56 + q;
        rows.push(
          withMeta(
            {
              period: QUARTERS[q],
              metric,
              value: amount(
                metric.endsWith("_pct")
                  ? Math.min(96, Number(base))
                  : Number(base) * (0.94 + q * 0.012),
              ),
              currency_or_unit: metric.includes("usd")
                ? "USD"
                : metric.includes("days")
                  ? "days"
                  : "percent",
              segment: opco.shortName,
              margin_bridge_driver:
                metric === "ebitda_usd"
                  ? "Freight cost, promotion sourcing margin, channel mix"
                  : "",
              source_report: "Lakeshore CFO flash package",
            },
            "Anaplan FP&A",
            `${opco.shortName} FP&A`,
            idx++,
          ),
        );
      }
    }
  }
  return rows;
}

function annualQuarterlyRows(): Row[] {
  return QUARTERS.map((quarter, index) =>
    withMeta(
      {
        period: quarter,
        reported_revenue: amount(
          (OPCOS.reduce((sum, o) => sum + o.revenueUsd, 0) / 4) *
            (0.96 + index * 0.011),
        ),
        reported_margin: Number((10.2 + index * 0.35).toFixed(1)),
        guidance:
          index < 4
            ? "Stabilize shared services after acquisition integration."
            : "Treasury visibility and data platform modernization are board priorities.",
        risk_factor:
          index % 2 === 0
            ? "FX exposure and freight volatility"
            : "Systems fragmentation and renewal concentration",
        document_ref: `lakeshore-quarterly-board-update-${quarter.toLowerCase()}.pdf`,
      },
      "Board reporting",
      "Corporate FP&A",
      index + 1,
    ),
  );
}

function marketRows(): Row[] {
  const signals = [
    "Foodservice logistics clients demand better cold-chain visibility.",
    "Marketing services clients are consolidating promotion sourcing vendors.",
    "DTC consumer products margin is pressured by fulfillment and return costs.",
    "Corporate foodservice buyers are adopting micro-market and pantry programs.",
    "Treasury teams are raising FX hedge discipline after currency volatility.",
  ];
  const rows: Row[] = [];
  for (let i = 0; i < 40; i++) {
    const opco = OPCOS[i % OPCOS.length];
    rows.push(
      withMeta(
        {
          signal_id: `MKT-${String(i + 1).padStart(3, "0")}`,
          market: opco.sector,
          competitor: [
            "Lineage Logistics",
            "DHL Supply Chain",
            "Bunzl",
            "Accenture Song",
            "YETI",
            "Compass Group",
          ][i % 6],
          claim: signals[i % signals.length],
          source_url: "synthetic://lakeshore/market-scan",
          confidence: 0.74 + (i % 5) * 0.03,
        },
        "Strategy market scan",
        "Corporate Strategy",
        i + 1,
      ),
    );
  }
  return rows;
}

function strategyRows(): Row[] {
  const priorities = [
    "Kyriba treasury rollout",
    "Shared data platform and reporting spine",
    "Opco application rationalization",
    "Vendor renewal and sourcing discipline",
    "Responsible AI guardrails for commercial workflows",
    "Post-acquisition integration playbook",
  ];
  return priorities.flatMap((priority, p) =>
    OPCOS.map((opco, i) =>
      withMeta(
        {
          priority,
          owner_role:
            opco.id === "LSH-HOLDCO"
              ? "Global CIO / CFO"
              : `${opco.shortName} CIO`,
          time_horizon: p < 2 ? "0-12 months" : "12-24 months",
          dissent:
            p % 2 === 0
              ? "Opco leaders want local flexibility; holdco wants shared controls."
              : "Budget sequencing depends on renewal calendar.",
          board_question: `What evidence proves ${priority.toLowerCase()} is ready for ${opco.shortName}?`,
        },
        "Executive offsite notes",
        "Chief of Staff",
        p * 10 + i + 1,
      ),
    ),
  );
}

function segmentRows(): Row[] {
  const rows: Row[] = [];
  let idx = 1;
  for (const opco of OPCOS) {
    for (let q = 0; q < QUARTERS.length; q++) {
      const gross = 28 + (opco.id.length % 5) + q * 0.4;
      rows.push(
        withMeta(
          {
            segment: opco.shortName,
            revenue_usd: amount((opco.revenueUsd / 4) * (0.95 + q * 0.012)),
            gross_margin_pct: Number(gross.toFixed(1)),
            operating_margin_pct: Number((gross - 14.5 + (q % 3)).toFixed(1)),
            r_and_d_usd: amount(opco.revenueUsd * 0.007),
            sg_and_a_usd: amount(opco.revenueUsd * 0.055),
            period: QUARTERS[q],
          },
          "Corporate FP&A segment P&L",
          "Corporate FP&A",
          idx++,
        ),
      );
    }
  }
  return rows;
}

function productRows(): Row[] {
  const families = [
    "Cold-chain services",
    "Freight brokerage",
    "Promotion kits",
    "Loyalty platforms",
    "Drinkware",
    "DTC bundles",
    "Office micro-markets",
    "Pantry services",
    "Onsite dining",
    "Route replenishment",
  ];
  return Array.from({ length: 48 }, (_, i) => {
    const opco = OPCOS[(i % (OPCOS.length - 1)) + 1];
    return withMeta(
      {
        product_family_id: `PF-${opco.id}-${String(i + 1).padStart(3, "0")}`,
        business_unit: opco.shortName,
        revenue_usd: amount(opco.revenueUsd * (0.012 + (i % 6) * 0.003)),
        margin_pct: Number((18 + (i % 9) * 1.6).toFixed(1)),
        lifecycle_state: ["invest", "sustain", "modernize", "retire"][i % 4],
        regulatory_burden:
          i % 5 === 0
            ? "High: food safety / consumer product claims"
            : "Standard commercial controls",
        plant_dependency:
          opco.id === "NLS" || opco.id === "FFF"
            ? "Warehouse / 3PL dependency"
            : "Agency and supplier network",
        product_name: families[i % families.length],
      },
      `${opco.shortName} product portfolio`,
      `${opco.shortName} Product Office`,
      i + 1,
    );
  });
}

function siteRows(): Row[] {
  return Array.from({ length: 56 }, (_, i) => {
    const opco = OPCOS[(i % (OPCOS.length - 1)) + 1];
    const country = COUNTRIES[i % COUNTRIES.length];
    return withMeta(
      {
        site_id: `SITE-${opco.id}-${String(i + 1).padStart(3, "0")}`,
        country,
        business_unit: opco.shortName,
        primary_system:
          opco.id === "NLS"
            ? "Manhattan WMS"
            : opco.id === "BMS"
              ? "Coupa / Brandfolder"
              : opco.id === "GLP"
                ? "Cantaloupe Seed / 365 Retail Markets"
                : "Shopify / NetSuite",
        validated_system_flag: i % 7 !== 0,
        quality_cost_usd: amount(80_000 + (i % 12) * 35_000),
        capacity_utilization_pct: 58 + (i % 33),
        region: REGIONS[i % REGIONS.length],
        site_type:
          opco.id === "NLS"
            ? "Distribution / freight node"
            : opco.id === "BMS"
              ? "Agency / sourcing office"
              : opco.id === "GLP"
                ? "Cafe / micro-market / vending route"
                : "Commerce / fulfillment node",
      },
      `${opco.shortName} site master`,
      `${opco.shortName} Operations`,
      i + 1,
    );
  });
}

function erpRows(): Row[] {
  const rows: Row[] = [];
  let idx = 1;
  for (const opco of OPCOS) {
    for (const area of [
      "Finance",
      "Procurement",
      "Order Management",
      "Inventory",
      "Treasury",
      "HR",
      "Revenue Recognition",
      "Planning",
      "Tax",
      "Intercompany",
      "Fixed Assets",
      "Vendor Master",
      "Customer Master",
    ]) {
      rows.push(
        withMeta(
          {
            erp_object_id: `ERP-${opco.id}-${slug(area).toUpperCase()}`,
            platform:
              opco.id === "FFF" || opco.id === "GLP"
                ? "NetSuite"
                : opco.id === "BMS"
                  ? "SAP ECC / Coupa"
                  : "SAP S/4HANA",
            process_area: area,
            owner_role: `${opco.shortName} ${area} Owner`,
            business_unit: opco.shortName,
            customization_count: (idx % 9) + (opco.id === "NLS" ? 6 : 1),
            tsa_dependency:
              opco.id === "LSH-HOLDCO" ? "Shared-services master data" : "None",
          },
          `${opco.shortName} ERP inventory`,
          `${opco.shortName} CIO Office`,
          idx++,
        ),
      );
    }
  }
  return rows;
}

function appRows(): Row[] {
  const baseApps = [
    "Finance",
    "Procurement",
    "Identity",
    "ITSM",
    "Data Warehouse",
    "BI",
    "Integration",
    "CRM",
    "Planning",
    "WMS",
    "TMS",
    "DAM",
    "PIM",
    "OMS",
    "Commerce",
    "Marketing Automation",
    "HRIS",
    "Cyber EDR",
    "Contract Lifecycle",
    "Treasury",
  ];
  return Array.from({ length: 228 }, (_, i) => {
    const opco = OPCOS[i % OPCOS.length];
    const platform = opco.platforms[i % opco.platforms.length];
    const appName = `${opco.shortName} ${baseApps[i % baseApps.length]} ${i % 4 === 0 ? "Core" : "Service"}`;
    const vendor =
      VENDORS.find((v) => v.opcoId === opco.id || v.opcoId === "LSH-HOLDCO") ??
      VENDORS[0];
    return withMeta(
      {
        app_id: `APP-${opco.id}-${String(i + 1).padStart(3, "0")}`,
        name: appName,
        criticality: i % 7 === 0 ? "Tier 1" : i % 3 === 0 ? "Tier 2" : "Tier 3",
        owner_role: `${opco.shortName} Application Owner`,
        system_of_record: i % 5 === 0,
        ams_vendor: vendor.name,
        time_classification: ["run", "change", "modernize", "retire"][i % 4],
        platform,
        hosting_model: ["Azure", "AWS", "SaaS", "On-prem", "Hybrid"][i % 5],
        data_classification: i % 6 === 0 ? "restricted" : "confidential",
      },
      "ServiceNow CMDB",
      `${opco.shortName} Enterprise Architecture`,
      i + 1,
    );
  });
}

function integrationRows(): Row[] {
  const apps = appRows().slice(0, 180);
  return Array.from({ length: 96 }, (_, i) => {
    const from = apps[(i * 3) % apps.length];
    const to = apps[(i * 7 + 11) % apps.length];
    return withMeta(
      {
        edge_id: `INT-${String(i + 1).padStart(3, "0")}`,
        source_app_id: String(from.app_id),
        target_app_id: String(to.app_id),
        integration_type: [
          "API",
          "EDI",
          "SFTP file",
          "MuleSoft flow",
          "Kafka event",
          "Batch ETL",
        ][i % 6],
        latency_sla: ["real-time", "<15 min", "hourly", "daily"][i % 4],
        kill_blocker_flag: i % 13 === 0,
        data_domain: [
          "orders",
          "inventory",
          "cash",
          "customer",
          "vendor",
          "shipment",
          "campaign",
        ][i % 7],
        criticality: i % 8 === 0 ? "high" : i % 3 === 0 ? "medium" : "low",
      },
      "MuleSoft and architecture graph",
      "VP Enterprise Architecture",
      i + 1,
    );
  });
}

function vendorRows(): Row[] {
  return VENDORS.map((vendor, i) =>
    withMeta(
      {
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        annual_value_usd: vendor.annualUsd,
        renewal_date: datePlus("2026-01-01", 30 + (i % 18) * 17),
        exit_terms:
          vendor.criticality === "Tier 1"
            ? "Requires 180 day transition assistance and data export plan."
            : "Standard 60 day termination support.",
        ai_clauses:
          i % 4 === 0
            ? "AI/data-use clause requires written approval before model training."
            : "No model training without customer consent.",
        data_rights:
          "Customer retains ownership of operational data and derived reports.",
        contract_id: vendor.contractId,
        category: vendor.category,
        opco_id: vendor.opcoId,
        opco: OPCOS.find((o) => o.id === vendor.opcoId)?.shortName ?? "Holdco",
      },
      "Coupa CLM",
      vendor.owner,
      i + 1,
    ),
  );
}

function initiativeRows(): Row[] {
  const named = [
    [
      "PGM-KYRIBA",
      "Kyriba global treasury rollout",
      "LSH-HOLDCO",
      "Global CIO / CFO",
      18_000_000,
      42_000_000,
    ],
    [
      "PGM-DATA-SPINE",
      "Shared data platform and evidence spine",
      "LSH-HOLDCO",
      "Chief Data Officer",
      12_500_000,
      31_000_000,
    ],
    [
      "PGM-WMS-MOD",
      "Northline WMS modernization",
      "NLS",
      "Northline CIO",
      9_200_000,
      24_500_000,
    ],
    [
      "PGM-FREIGHT-VIS",
      "Freight visibility and exception AI",
      "NLS",
      "Northline COO",
      6_400_000,
      18_000_000,
    ],
    [
      "PGM-LOYALTY",
      "Brightmark loyalty platform consolidation",
      "BMS",
      "Brightmark CIO",
      5_800_000,
      16_300_000,
    ],
    [
      "PGM-PROMO-SOURCE",
      "Promotion sourcing control tower",
      "BMS",
      "VP Sourcing",
      4_200_000,
      11_700_000,
    ],
    [
      "PGM-DTC-OMS",
      "Forge & Field order management modernization",
      "FFF",
      "Forge & Field CIO",
      7_900_000,
      22_000_000,
    ],
    [
      "PGM-PIM",
      "Consumer product PIM cleanup",
      "FFF",
      "VP Product Ops",
      2_700_000,
      8_500_000,
    ],
    [
      "PGM-MICROMARKET",
      "Great Lakes Pantry micro-market platform upgrade",
      "GLP",
      "Great Lakes Pantry CIO",
      4_900_000,
      12_800_000,
    ],
    [
      "PGM-ROUTE-AI",
      "Route replenishment optimization",
      "GLP",
      "VP Field Operations",
      3_600_000,
      9_400_000,
    ],
  ];
  const rows: Row[] = [];
  let idx = 1;
  for (const [id, title, opcoId, sponsor, committed, value] of named) {
    rows.push(
      withMeta(
        {
          initiative_id: id,
          opco_id: String(opcoId),
          title,
          status: idx % 3 === 0 ? "at_risk" : "active",
          sponsor_role: sponsor,
          committed_usd: Number(committed),
          projected_value_usd: Number(value),
          linked_app_ids: `APP-${opcoId}-001|APP-${opcoId}-002`,
          gate: idx < 3 ? "design" : "evidence",
        },
        "ServiceNow SPM",
        "Transformation PMO",
        idx++,
      ),
    );
  }
  while (rows.length < 40) {
    const opco = OPCOS[rows.length % OPCOS.length];
    rows.push(
      withMeta(
        {
          initiative_id: `PGM-${opco.id}-${String(rows.length + 1).padStart(3, "0")}`,
          opco_id: opco.id,
          title: `${opco.shortName} ${["integration cleanup", "reporting automation", "renewal optimization", "AI workflow pilot"][rows.length % 4]}`,
          status: [
            "idea",
            "qualify",
            "design",
            "evidence",
            "active",
            "at_risk",
          ][rows.length % 6],
          sponsor_role: `${opco.shortName} CIO`,
          committed_usd: amount(750_000 + (rows.length % 8) * 420_000),
          projected_value_usd: amount(1_800_000 + (rows.length % 10) * 900_000),
          linked_app_ids: `APP-${opco.id}-${String((rows.length % 25) + 1).padStart(3, "0")}`,
        },
        "ServiceNow SPM",
        "Transformation PMO",
        idx++,
      ),
    );
  }
  return rows;
}

function orgRows(): Row[] {
  const functions = [
    "IT",
    "Finance",
    "Treasury",
    "Operations",
    "Procurement",
    "Security",
    "Data",
    "PMO",
    "Legal",
    "HR",
    "Enterprise Architecture",
  ];
  const rows: Row[] = [];
  let idx = 1;
  rows.push(
    withMeta(
      {
        person_id: "P-SUREKHA",
        name: "Surekha Raman",
        level: "VP",
        role: "VP Innovation and Delivery",
        manager_id: "P-MEERA",
        cost_center: "LSH-IT-TRANSFORM",
        location: "Chicago, IL",
      },
      "Workday HCM",
      "CHRO",
      idx++,
    ),
  );
  rows.push(
    withMeta(
      {
        person_id: "P-MEERA",
        name: "Meera Rao",
        level: "C-Level",
        role: "Global CIO",
        manager_id: "P-RUSSELL",
        cost_center: "LSH-IT",
        location: "Chicago, IL",
      },
      "Workday HCM",
      "CHRO",
      idx++,
    ),
  );
  for (const opco of OPCOS) {
    rows.push(
      withMeta(
        {
          person_id: `P-${opco.id}-CIO`,
          name: opco.cio,
          level: "C-Level",
          role: `${opco.shortName} CIO`,
          manager_id: "P-MEERA",
          cost_center: `${opco.id}-IT`,
          location: opco.hq,
        },
        "Workday HCM",
        "CHRO",
        idx++,
      ),
    );
    rows.push(
      withMeta(
        {
          person_id: `P-${opco.id}-CFO`,
          name: opco.cfo,
          level: "C-Level",
          role: `${opco.shortName} CFO`,
          manager_id: "P-DANIEL",
          cost_center: `${opco.id}-FIN`,
          location: opco.hq,
        },
        "Workday HCM",
        "CHRO",
        idx++,
      ),
    );
    for (const fn of functions) {
      rows.push(
        withMeta(
          {
            person_id: `P-${opco.id}-${slug(fn).toUpperCase()}`,
            name: `${["Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Devon", "Quinn"][idx % 8]} ${["Patel", "Nguyen", "Keller", "Shah", "Brooks", "Moreno", "Bell", "Chen"][idx % 8]}`,
            level: idx % 4 === 0 ? "Director" : "VP",
            role: `${opco.shortName} ${fn} Lead`,
            manager_id: `P-${opco.id}-CIO`,
            cost_center: `${opco.id}-${slug(fn).toUpperCase()}`,
            location: COUNTRIES[idx % COUNTRIES.length],
          },
          "Workday HCM",
          "CHRO",
          idx++,
        ),
      );
    }
  }
  return rows.slice(0, 68);
}

function doraRows(): Row[] {
  return Array.from({ length: 84 }, (_, i) => {
    const opco = OPCOS[i % OPCOS.length];
    return withMeta(
      {
        team_id: `TEAM-${opco.id}-${String(i + 1).padStart(3, "0")}`,
        measured_at: datePlus("2026-01-01", i * 3),
        deploy_freq_per_week: Number((0.8 + (i % 8) * 0.65).toFixed(2)),
        lead_time_hours: 18 + (i % 30),
        mttr_hours: 3 + (i % 19),
        change_failure_rate_pct: Number((4 + (i % 12) * 1.3).toFixed(1)),
        product_area:
          opco.primaryCapabilities[i % opco.primaryCapabilities.length],
      },
      "GitHub / Azure DevOps telemetry",
      "VP Engineering",
      i + 1,
    );
  });
}

function riskRows(): Row[] {
  return Array.from({ length: 62 }, (_, i) => {
    const opco = OPCOS[i % OPCOS.length];
    return withMeta(
      {
        event_id: `RISK-${String(i + 1).padStart(3, "0")}`,
        event_type: [
          "SOX control",
          "PCI scope",
          "GDPR transfer",
          "Vendor risk",
          "AI policy exception",
          "Security incident",
        ][i % 6],
        product_family_id: `PF-${opco.id}-${String((i % 20) + 1).padStart(3, "0")}`,
        severity: ["low", "medium", "high", "critical"][i % 4],
        opened_at: datePlus("2025-09-01", i * 5),
        capa_id: i % 3 === 0 ? `CAPA-${String(i + 1).padStart(3, "0")}` : "",
        audit_reference: [
          "SOX-ITGC",
          "PCI-DSS",
          "GDPR-DPIA",
          "Vendor-TPRM",
          "AI-GOV",
        ][i % 5],
        opco: opco.shortName,
      },
      "GRC register",
      "Chief Risk and Compliance Officer",
      i + 1,
    );
  });
}

function aiToolRows(): Row[] {
  return Array.from({ length: 42 }, (_, i) => {
    const opco = OPCOS[i % OPCOS.length];
    return withMeta(
      {
        tool_id: `AI-${opco.id}-${String(i + 1).padStart(3, "0")}`,
        tool_name: [
          "Copilot for M365",
          "ServiceNow Now Assist",
          "Salesforce Einstein",
          "Databricks Assistant",
          "Custom freight exception model",
          "Campaign copy assistant",
        ][i % 6],
        owner_role: `${opco.shortName} AI Governance Lead`,
        workflow: opco.primaryCapabilities[i % opco.primaryCapabilities.length],
        risk_classification:
          i % 6 === 0 ? "high" : i % 3 === 0 ? "medium" : "low",
        model_name: [
          "gpt-4.1",
          "claude-sonnet",
          "databricks-dbrx",
          "vendor-managed",
        ][i % 4],
        regulated_workflow_flag: i % 5 === 0,
      },
      "AI governance inventory",
      "AI Governance Lead",
      i + 1,
    );
  });
}

function incidentsRows(): Row[] {
  return Array.from({ length: 96 }, (_, i) => {
    const opco = OPCOS[i % OPCOS.length];
    return withMeta(
      {
        incident_id: `INC-${String(i + 1).padStart(5, "0")}`,
        system_id: `APP-${opco.id}-${String((i % 60) + 1).padStart(3, "0")}`,
        severity: ["sev4", "sev3", "sev2", "sev1"][i % 4],
        opened_at: datePlus("2025-10-01", i * 2),
        closed_at: datePlus("2025-10-01", i * 2 + 1 + (i % 3)),
        root_cause: [
          "integration timeout",
          "vendor release regression",
          "network carrier issue",
          "bad master data",
          "capacity saturation",
        ][i % 5],
        business_service:
          opco.primaryCapabilities[i % opco.primaryCapabilities.length],
      },
      "ServiceNow ITSM",
      "VP IT Operations",
      i + 1,
    );
  });
}

function rowsByTemplateId(): Record<string, Row[]> {
  return {
    "enterprise-profile": enterpriseProfileRows(),
    "financial-kpi-workbook": financialKpiRows(),
    "annual-quarterly-reports": annualQuarterlyRows(),
    "market-signals": marketRows(),
    "strategy-memo": strategyRows(),
    "segment-pnl": segmentRows(),
    "product-portfolio": productRows(),
    "site-and-plant-inventory": siteRows(),
    "erp-landscape-workbook": erpRows(),
    "application-portfolio": appRows(),
    "integration-topology": integrationRows(),
    "vendor-contracts": vendorRows(),
    "initiative-portfolio": initiativeRows(),
    "org-roles": orgRows(),
    "dora-baseline": doraRows(),
    "qms-events": riskRows(),
    "ai-tool-footprint": aiToolRows(),
    "incidents-change-history": incidentsRows(),
  };
}

function templateColumns(templateId: string, rows: Row[]): string[] {
  const template = NORTHSTAR_CONTEXT_TEMPLATES.find(
    (item) => item.id === templateId,
  );
  const preferred = template
    ? [...template.requiredFields, ...template.optionalFields]
    : [];
  const all = new Set<string>([
    ...preferred,
    ...rows.flatMap((row) => Object.keys(row)),
  ]);
  return Array.from(all);
}

async function writeWorkbook(datasets: Record<string, Row[]>): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AbarVa synthetic data generator";
  workbook.created = new Date(GENERATED_AT);
  workbook.subject = "Lakeshore Holdings synthetic context data";
  workbook.title = "Lakeshore Holdings Context Data Bundle";
  workbook.description =
    "SYNTHETIC / ILLUSTRATIVE. Offline review bundle for governed Data Loads rehearsal.";

  const summary = workbook.addWorksheet("README");
  summary.columns = [
    { header: "field", key: "field", width: 34 },
    { header: "value", key: "value", width: 120 },
  ];
  [
    ["tenant_key", TENANT_KEY],
    ["broker_key", BROKER_KEY],
    ["generated_at", GENERATED_AT],
    [
      "synthetic_notice",
      "SYNTHETIC / ILLUSTRATIVE. Not a real company disclosure.",
    ],
    [
      "research_model",
      "Morgan Street / HAVI-style holdco: supply chain, marketing and sourcing, consumer products, convenience services.",
    ],
  ].forEach(([field, value]) => summary.addRow({ field, value }));

  for (const template of NORTHSTAR_CONTEXT_TEMPLATES) {
    const rows = datasets[template.id] ?? [];
    const columns = templateColumns(template.id, rows);
    const sheet = workbook.addWorksheet(template.id.slice(0, 31));
    sheet.columns = columns.map((column) => ({
      header: column,
      key: column,
      width: Math.min(Math.max(column.length + 2, 16), 42),
    }));
    rows.forEach((row) => sheet.addRow(row));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B1736" },
    };
  }

  const workbookPath = path.join(
    WORKBOOK_DIR,
    "lakeshore-context-data-bundle.xlsx",
  );
  await workbook.xlsx.writeFile(workbookPath);
  return workbookPath;
}

function sanitizePdfText(text: string): string {
  return text
    .replace(/[()\\]/g, (char) => `\\${char}`)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function wrapLines(text: string, width = 88): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function writeSimplePdf(
  filePath: string,
  title: string,
  sections: Array<[string, string[]]>,
): void {
  const pageHeight = 792;
  const pageWidth = 612;
  const pages: string[][] = [];
  let current: string[] = [
    `BT /F1 18 Tf 54 738 Td (${sanitizePdfText(title)}) Tj ET`,
  ];
  let y = 704;
  for (const [heading, paragraphs] of sections) {
    if (y < 120) {
      pages.push(current);
      current = [];
      y = 738;
    }
    current.push(`BT /F1 13 Tf 54 ${y} Td (${sanitizePdfText(heading)}) Tj ET`);
    y -= 24;
    for (const paragraph of paragraphs) {
      for (const line of wrapLines(paragraph)) {
        if (y < 72) {
          pages.push(current);
          current = [];
          y = 738;
        }
        current.push(
          `BT /F1 10 Tf 54 ${y} Td (${sanitizePdfText(line)}) Tj ET`,
        );
        y -= 15;
      }
      y -= 8;
    }
  }
  pages.push(current);

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  for (let i = 0; i < pages.length; i++) {
    const pageObjectId = 3 + i * 2;
    const contentObjectId = pageObjectId + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    const content = pages[i].join("\n");
    objects.push(
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  writeFileSync(filePath, pdf);
}

async function writeDocx(
  filePath: string,
  title: string,
  sections: Array<[string, string[]]>,
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [
              new TextRun({
                text: "SYNTHETIC / ILLUSTRATIVE. Generated for Lakeshore Holdings pilot rehearsal.",
                bold: true,
              }),
            ],
          }),
          ...sections.flatMap(([heading, paragraphs]) => [
            new Paragraph({ text: heading, heading: HeadingLevel.HEADING_1 }),
            ...paragraphs.map((text) => new Paragraph({ text })),
          ]),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(filePath, buffer);
}

async function writePptx(filePath: string): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.author = "AbarVa synthetic data generator";
  pptx.subject = "Lakeshore Holdings board update";
  pptx.title = "Lakeshore Holdings Board IT Update";
  pptx.layout = "LAYOUT_WIDE";
  const slides = [
    [
      "Lakeshore Holdings IT Board Update",
      "Treasury visibility, platform rationalization, and opco integration are the FY2026 priorities.",
    ],
    [
      "Opco IT estates",
      "Northline: supply chain and logistics. Brightmark: marketing, sourcing, and loyalty. Forge & Field: consumer products and DTC commerce.",
    ],
    [
      "Kyriba rollout",
      "Phase 1 covers cash visibility, bank account inventory, and FX exposure. Phase 2 adds payment factory and working-capital analytics.",
    ],
    [
      "Risks and controls",
      "Top risks: vendor renewal concentration, fragmented master data, local AI tooling, and acquisition integration debt.",
    ],
  ];
  for (const [title, body] of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: "F8FAFC" };
    slide.addText(title, {
      x: 0.6,
      y: 0.5,
      w: 12,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: "0B1736",
    });
    slide.addText("SYNTHETIC / ILLUSTRATIVE", {
      x: 0.65,
      y: 1.1,
      w: 4,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: "8A5A11",
    });
    slide.addText(body, {
      x: 0.8,
      y: 1.7,
      w: 11.2,
      h: 1.5,
      fontSize: 18,
      color: "24324B",
      breakLine: false,
      fit: "shrink",
    });
  }
  await pptx.writeFile({ fileName: filePath });
}

async function writeDocuments(): Promise<
  Array<{ fileName: string; kind: string; mappedTemplate: string }>
> {
  const docs: Array<{
    fileName: string;
    kind: string;
    mappedTemplate: string;
  }> = [];
  const contractVendors = VENDORS.filter(
    (v) => v.criticality !== "Tier 3",
  ).slice(0, 12);
  for (const vendor of contractVendors) {
    const fileName = `${slug(vendor.contractId)}-${slug(vendor.name)}-contract.pdf`;
    writeSimplePdf(path.join(DOC_DIR, fileName), `${vendor.name} Agreement`, [
      [
        "Synthetic notice",
        [
          "This document is SYNTHETIC / ILLUSTRATIVE and exists only for Lakeshore Holdings data-load rehearsal.",
        ],
      ],
      [
        "Parties and scope",
        [
          `Lakeshore Holdings or the named operating company contracts with ${vendor.name} for ${vendor.category}. The agreement supports ${vendor.owner}.`,
        ],
      ],
      [
        "Commercial terms",
        [
          `Annual value is USD ${vendor.annualUsd.toLocaleString("en-US")}. Term is ${vendor.termMonths} months. Contract id is ${vendor.contractId}.`,
        ],
      ],
      [
        "Data and AI use",
        [
          "Customer data remains owned by Lakeshore. Vendor may not use operational data for model training without written approval.",
        ],
      ],
      [
        "Service levels",
        [
          `Criticality is ${vendor.criticality}. Monthly service review, security attestation, and exit plan are required.`,
        ],
      ],
    ]);
    docs.push({
      fileName,
      kind: "pdf_contract",
      mappedTemplate: "vendor-contracts",
    });
  }

  const pdfs: Array<[string, string, string, Array<[string, string[]]>]> = [
    [
      "lakeshore-fy2026-board-it-update.pdf",
      "Board IT Update",
      "annual-quarterly-reports",
      [
        [
          "Executive summary",
          [
            "The board is tracking treasury visibility, opco systems fragmentation, and value realization from modernization programs.",
          ],
        ],
        [
          "Financial snapshot",
          [
            "Revenue is modeled at roughly USD 3.0B with meaningful exposure to logistics cost, promotion sourcing margin, and DTC fulfillment economics.",
          ],
        ],
      ],
    ],
    [
      "lakeshore-target-state-data-architecture.pdf",
      "Target State Data Architecture",
      "annual-quarterly-reports",
      [
        [
          "Architecture",
          [
            "Shared lakehouse, source-system contracts, evidence ledger, and KPI semantic layer connect the operating companies without collapsing local autonomy.",
          ],
        ],
        [
          "Controls",
          [
            "Every data product has an owner, sensitivity class, refresh cadence, and approved use case.",
          ],
        ],
      ],
    ],
    [
      "lakeshore-integration-topology-overview.pdf",
      "Integration Topology Overview",
      "annual-quarterly-reports",
      [
        [
          "Current state",
          [
            "Northline has high EDI and WMS/TMS dependency. Brightmark has supplier and campaign platform flows. Forge & Field has OMS, PIM, DTC commerce, and 3PL integrations.",
          ],
        ],
        [
          "Modernization hook",
          [
            "Duplicate point-to-point file flows are candidates for API/event modernization.",
          ],
        ],
      ],
    ],
    [
      "lakeshore-quarterly-segment-performance.pdf",
      "Quarterly Segment Performance",
      "annual-quarterly-reports",
      [
        [
          "Segment trends",
          [
            "Northline is freight-sensitive, Brightmark is promotion and sourcing-margin sensitive, and Forge & Field is DTC fulfillment-margin sensitive.",
          ],
        ],
        [
          "Board question",
          [
            "Which platform investments improve working capital and reduce operating risk first?",
          ],
        ],
      ],
    ],
  ];
  for (const [fileName, title, template, sections] of pdfs) {
    writeSimplePdf(path.join(DOC_DIR, fileName), title, sections);
    docs.push({ fileName, kind: "pdf_report", mappedTemplate: template });
  }

  const docxs: Array<[string, string, Array<[string, string[]]>]> = [
    [
      "lakeshore-ai-usage-policy.docx",
      "AI Usage Policy",
      [
        [
          "Allowed uses",
          [
            "Approved copilots may summarize internal evidence and draft non-binding analysis.",
          ],
        ],
        [
          "Blocked uses",
          [
            "No client, employee, or supplier data may be used to train external models without written approval.",
          ],
        ],
      ],
    ],
    [
      "lakeshore-data-governance-policy.docx",
      "Data Governance Policy",
      [
        [
          "Ownership",
          [
            "Every domain has a data owner, steward, quality score, and accepted refresh cadence.",
          ],
        ],
        [
          "Evidence",
          ["Agent answers must cite approved context with source locators."],
        ],
      ],
    ],
    [
      "lakeshore-security-classification-standard.docx",
      "Security Classification Standard",
      [
        [
          "Classes",
          ["Public, internal, confidential, restricted, and regulated."],
        ],
        [
          "Handling",
          [
            "Restricted data requires approved storage, access logging, and explicit load attestation.",
          ],
        ],
      ],
    ],
    [
      "lakeshore-vendor-risk-standard.docx",
      "Vendor Risk Standard",
      [
        [
          "Renewal controls",
          [
            "Tier 1 vendors require exit plans, cyber attestations, and data-use clauses.",
          ],
        ],
        [
          "AI clauses",
          ["Vendor AI use requires contract approval and auditability."],
        ],
      ],
    ],
  ];
  for (const [fileName, title, sections] of docxs) {
    await writeDocx(path.join(DOC_DIR, fileName), title, sections);
    docs.push({ fileName, kind: "docx_policy", mappedTemplate: "qms-events" });
  }

  await writePptx(path.join(DOC_DIR, "lakeshore-board-it-update.pptx"));
  docs.push({
    fileName: "lakeshore-board-it-update.pptx",
    kind: "pptx_board_update",
    mappedTemplate: "annual-quarterly-reports",
  });

  return docs;
}

function writeHowToFiles(datasets: Record<string, Row[]>): void {
  for (const template of NORTHSTAR_CONTEXT_TEMPLATES) {
    const rows = datasets[template.id] ?? [];
    const columns = templateColumns(template.id, rows);
    const text = [
      `# ${template.label} - Lakeshore Load Guide`,
      "",
      "SYNTHETIC / ILLUSTRATIVE.",
      "",
      `Template ID: \`${template.id}\``,
      `Dimension: \`${template.dimension}\``,
      `Rows generated: ${rows.length}`,
      `Owner role: ${template.ownerRole}`,
      `Accepted formats: ${template.acceptedFormats.join(", ")}`,
      "",
      "## Required fields",
      ...template.requiredFields.map((field) => `- \`${field}\``),
      "",
      "## Columns in generated file",
      ...columns.map((field) => `- \`${field}\``),
      "",
      "## Loader note",
      "Load through `/admin/setup` or the governed upload API. Do not side-load into operational tables.",
      "",
    ].join("\n");
    writeFileSync(path.join(HOW_TO_DIR, `${template.id}.md`), text);
  }
}

function researchNotes(): string {
  return [
    "# Lakeshore Holdings Synthetic Context Research Notes",
    "",
    "SYNTHETIC / ILLUSTRATIVE. Lakeshore Holdings is fictional. These notes explain the public-company patterns used to make the synthetic context package realistic without copying confidential operating data.",
    "",
    "## Public Pattern Used",
    "",
    "Morgan Street Holdings is the closest public analog for the Lakeshore rehearsal package: a Chicago holding company/private investment group with a portfolio spanning supply-chain services, marketing/sourcing, consumer products, and workplace food/convenience services. The synthetic package uses that structure only as an operating-model pattern.",
    "",
    "## Source Observations",
    "",
    "- Morgan Street describes itself as a holding company and private investment group with 50 years in business, 300+ customer brands served, 10k+ people employed, and operating companies/brands in more than 50 countries.",
    "- Morgan Street lists operating companies/brands including HAVI, tms, Stanley, and Continental, with capabilities across sourcing and supply chain, marketing and promotion services, consumer products, and convenience/vending solutions.",
    "- Morgan Street's history page links the heritage back to HAVI's 1974 supply-chain roots and later expansion into logistics, packaging, marketing analytics, tms, Stanley/PMI, Continental, and Morgan Street Holdings.",
    "- HAVI describes a global supply-chain organization with warehousing, logistics, planning, freight management, control-tower style operations, and leadership functions including CIO, CFO, strategy, markets, planning/analytics, distribution/freight, and people.",
    "- tms describes a global technology, marketing, and sourcing company with offices across Chicago, Seattle, London, Munich, Hong Kong, Tokyo, Paris, Duisburg, Dubai, Singapore, Shenzhen, and Shanghai, and public scale signals around packaging, brand partnerships, spend management, suppliers, and countries served.",
    "- Continental Services describes workplace food and beverage offerings such as micro-markets, vending, onsite dining, meal delivery, coffee/pantry services, event catering, logistics, and technology-enabled operations.",
    "- HAVI's acquisition of PMI Worldwide/Stanley 1913 supplies the consumer-products pattern: sustainable food and beverage container products, global retail/foodservice channels, manufacturing/sourcing complexity, and consumer brand operations.",
    "",
    "## How This Shaped Lakeshore",
    "",
    "- `Lakeshore Holdings` is the holdco/shared-services spine: treasury, identity, ITSM, cyber, data, finance, legal, and enterprise architecture.",
    "- `Northline Supply Chain` mimics the HAVI-like supply-chain and freight business: WMS/TMS, demand planning, freight visibility, cold-chain operations, EDI, and distribution sites.",
    "- `Brightmark Marketing Services` mimics the tms-like marketing, sourcing, and promotion business: loyalty, campaign operations, DAM, sourcing, packaging, suppliers, and agency operations.",
    "- `Forge & Field Consumer Products` mimics the Stanley/PMI-like product business: DTC commerce, wholesale, PIM, 3PL, product lifecycle, and consumer data.",
    "- `Great Lakes Pantry Services` mimics the Continental-like workplace food/convenience business: micro-markets, vending, onsite dining, meal delivery, route optimization, cafe POS, and field service.",
    "",
    "## Guardrails",
    "",
    "- No real Morgan Street/HAVI/tms/Stanley/Continental employee names, financials, contracts, customers, systems inventories, or private operating facts were copied.",
    "- Public facts are used only to calibrate realistic business variety and scale.",
    "- Every generated row and document is labeled `SYNTHETIC / ILLUSTRATIVE`.",
    "- All generated files are intended for AbarVa governed-loader rehearsal and one-time offline client review, not as source-of-truth business records.",
    "",
    "## Sources",
    "",
    "- https://morganstreet.com/",
    "- https://morganstreet.com/who-we-are/",
    "- https://havi.com/about/",
    "- https://www.tmsw.com/",
    "- https://www.continentalserves.com/about-us/",
    "- https://www.continentalserves.com/client-services/",
    "- https://www.epicos.com/article/705786/havi-acquires-pmi-worldwide",
    "",
  ].join("\n");
}

async function writeZip(files: string[]): Promise<string> {
  const zip = new JSZip();
  for (const file of files) {
    const abs = path.join(OUT_ROOT, file);
    const data = await import("node:fs/promises").then((fs) =>
      fs.readFile(abs),
    );
    zip.file(file, data);
  }
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  const zipPath = path.join(REVIEW_DIR, "lakeshore-offline-review-bundle.zip");
  writeFileSync(zipPath, out);
  return zipPath;
}

async function main(): Promise<void> {
  resetOutput();
  const datasets = rowsByTemplateId();
  const dataFiles: string[] = [];

  for (const template of NORTHSTAR_CONTEXT_TEMPLATES) {
    const rows = datasets[template.id] ?? [];
    const columns = templateColumns(template.id, rows);
    const rel = `data/${template.id}.csv`;
    writeFileSync(path.join(OUT_ROOT, rel), toCsv(rows, columns));
    dataFiles.push(rel);
  }

  const workbookPath = await writeWorkbook(datasets);
  const docs = await writeDocuments();
  writeHowToFiles(datasets);

  const totalRows = Object.values(datasets).reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  const manifest = {
    tenantKey: TENANT_KEY,
    brokerKey: BROKER_KEY,
    displayName: "Lakeshore Holdings",
    generatedAt: GENERATED_AT,
    syntheticNotice: "SYNTHETIC / ILLUSTRATIVE. Not a real company disclosure.",
    researchModel: {
      basis: "Morgan Street / HAVI-style diversified holding company",
      sources: [
        "https://morganstreet.com/",
        "https://morganstreet.com/who-we-are/",
        "https://havi.com/about",
        "https://www.tmsw.com/",
        "https://www.tmsw.com/services/",
      ],
    },
    opcos: OPCOS,
    totals: {
      structuredRecords: totalRows,
      csvFiles: dataFiles.length,
      generatedDocuments: docs.length,
      workbook: path.relative(OUT_ROOT, workbookPath),
    },
    dataFiles: NORTHSTAR_CONTEXT_TEMPLATES.map((template) => ({
      templateId: template.id,
      dimension: template.dimension,
      label: template.label,
      rows: datasets[template.id]?.length ?? 0,
      path: `data/${template.id}.csv`,
      acceptedFormats: template.acceptedFormats,
      ownerRole: template.ownerRole,
    })),
    documents: docs.map((doc) => ({
      ...doc,
      path: `documents/${doc.fileName}`,
    })),
    crossChecks: [
      "Kyriba contract CON-LSH-001 ties to PGM-KYRIBA and treasury KPIs.",
      "Vendor annual spend reconciles to contract rows and spend/KPI narratives.",
      "Each opco has its own CIO, CFO, org roles, application estate, vendors, risks, and initiatives.",
      "Holdco owns shared treasury, identity, ITSM, security, and enterprise architecture controls.",
    ],
  };
  writeFileSync(
    path.join(OUT_ROOT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  const readme = [
    "# Lakeshore Holdings Synthetic Context Load Package",
    "",
    "SYNTHETIC / ILLUSTRATIVE. This is not a real company disclosure.",
    "",
    `Generated at: ${GENERATED_AT}`,
    `Structured records: ${totalRows}`,
    `Documents: ${docs.length}`,
    "",
    "## What is included",
    "",
    "- CSV files for every canonical context-ingestion template.",
    "- XLSX workbook for offline review.",
    "- Synthetic PDF contracts and reports.",
    "- Synthetic DOCX policies.",
    "- Synthetic PPTX board update.",
    "- Per-template how-to pages.",
    "- ZIP archive for one-time offline review.",
    "",
    "## Operating model",
    "",
    "Lakeshore mimics a Morgan Street / HAVI-style diversified holding company: a Chicago holdco with supply-chain, marketing/sourcing, consumer-products, and convenience-services operating companies. Each operating company has its own org structure, IT systems, vendors, KPIs, risk controls, and program backlog.",
    "",
    "## Load path",
    "",
    "Use `/admin/setup` or the governed upload API. Do not side-load records directly into operational tables.",
    "",
  ].join("\n");
  writeFileSync(path.join(OUT_ROOT, "README.md"), readme);
  writeFileSync(path.join(OUT_ROOT, "RESEARCH_NOTES.md"), researchNotes());

  const zipFiles = [
    "README.md",
    "RESEARCH_NOTES.md",
    "manifest.json",
    ...dataFiles,
    ...docs.map((doc) => `documents/${doc.fileName}`),
    "workbooks/lakeshore-context-data-bundle.xlsx",
    ...NORTHSTAR_CONTEXT_TEMPLATES.map(
      (template) => `how-to/${template.id}.md`,
    ),
  ];
  const zipPath = await writeZip(zipFiles);

  console.log(
    JSON.stringify(
      {
        outRoot: OUT_ROOT,
        structuredRecords: totalRows,
        csvFiles: dataFiles.length,
        documents: docs.length,
        workbook: workbookPath,
        zip: zipPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
