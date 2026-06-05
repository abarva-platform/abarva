import {
  NORTHSTAR_CONTEXT_TEMPLATES,
  getTemplateForDimension,
} from "./template-registry";
import type {
  ContextDimension,
  FileClassification,
  UploadedFileFormat,
  UploadedFileInput,
} from "./types";

function extension(fileName: string): UploadedFileFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".jsonl")) return "jsonl";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".pptx")) return "pptx";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".zip")) return "zip";
  return "unknown";
}

const DIMENSION_MATCHERS: Array<{
  dimension: ContextDimension;
  terms: string[];
  source: string;
}> = [
  {
    dimension: "erp_landscape",
    terms: [
      "erp",
      "sap",
      "s4",
      "s_4",
      "oracle_ebs",
      "jde",
      "jd_edwards",
      "infor",
      "dynamics_ax",
      "as400",
      "as_400",
    ],
    source: "ERP export",
  },
  {
    dimension: "application_portfolio",
    terms: [
      "cmdb",
      "application",
      "app_portfolio",
      "servicenow",
      "systems_inventory",
    ],
    source: "ServiceNow CMDB",
  },
  {
    dimension: "financial_kpis",
    terms: [
      "financial",
      "kpi",
      "margin",
      "pnl",
      "p&l",
      "run_cost",
      "capex",
      "opex",
    ],
    source: "Finance workbook",
  },
  {
    dimension: "annual_quarterly_reports",
    terms: ["annual_report", "10k", "10-q", "quarterly", "qbr", "board_pack"],
    source: "Finance / board reporting",
  },
  {
    dimension: "c_suite_strategy",
    terms: [
      "strategy",
      "board_priorities",
      "offsite",
      "ceo",
      "cfo",
      "cio",
      "coo",
    ],
    source: "C-suite strategy artifact",
  },
  {
    dimension: "market_competitor_intel",
    terms: ["market", "competitor", "benchmark", "analyst"],
    source: "Market intelligence",
  },
  {
    dimension: "business_units_segment_pnl",
    terms: ["segment", "business_unit", "bu_pnl"],
    source: "FP&A export",
  },
  {
    dimension: "product_portfolio",
    terms: ["product", "sku", "portfolio", "family"],
    source: "Product portfolio export",
  },
  {
    dimension: "manufacturing_sites",
    terms: ["plant", "site", "manufacturing", "mes"],
    source: "Manufacturing operations",
  },
  {
    dimension: "integration_topology",
    terms: ["integration", "topology", "edge", "dependency"],
    source: "Architecture graph",
  },
  {
    dimension: "vendor_contracts",
    terms: ["vendor", "contract", "msa", "sow", "renewal", "coupa", "ariba"],
    source: "Procurement / CLM",
  },
  {
    dimension: "transformation_initiatives",
    terms: ["initiative", "program", "portfolio", "transformation"],
    source: "Transformation PMO",
  },
  {
    dimension: "org_roles_teams",
    terms: ["org", "roles", "team", "roster", "workday", "hierarchy"],
    source: "Workday org export",
  },
  {
    dimension: "delivery_dora_devex",
    terms: ["dora", "devex", "jira", "azure_devops", "deploy", "lead_time"],
    source: "Delivery telemetry",
  },
  {
    dimension: "regulatory_qms_risk",
    terms: [
      "qms",
      "capa",
      "fda",
      "483",
      "mdr",
      "complaint",
      "trackwise",
      "veeva",
    ],
    source: "Quality / regulatory system",
  },
  {
    dimension: "ai_tooling_model_inventory",
    terms: ["ai_tool", "model_inventory", "model", "genai", "ml"],
    source: "AI governance inventory",
  },
  {
    dimension: "incidents_ops_telemetry",
    terms: ["incident", "change", "problem", "ops", "outage"],
    source: "ITSM telemetry",
  },
  {
    dimension: "enterprise_profile",
    terms: ["enterprise_profile", "company_profile", "truth_spine"],
    source: "Enterprise profile",
  },
];

function normalizeName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function classifyUploadedFile(
  file: UploadedFileInput,
): FileClassification {
  const format = extension(file.fileName);
  const normalized = normalizeName(file.fileName);
  const match =
    DIMENSION_MATCHERS.find((candidate) =>
      candidate.terms.some((term) => normalized.includes(term)),
    ) ?? DIMENSION_MATCHERS[0];
  const template =
    getTemplateForDimension(match.dimension) ?? NORTHSTAR_CONTEXT_TEMPLATES[0];
  const workbook = format === "xlsx";
  const document =
    format === "pdf" || format === "docx" || format === "markdown";
  const slide = format === "pptx";
  const batch = format === "zip";

  return {
    templateType: template.id,
    dimension: match.dimension,
    format,
    likelySourceSystem: match.source,
    confidence: normalized.includes(template.id.replace(/-/g, "_"))
      ? 0.96
      : 0.82,
    extractionStrategy: batch
      ? "batch_archive"
      : workbook
        ? "workbook_sheets"
        : slide
          ? "slide_facts"
          : document
            ? "document_facts"
            : "structured_rows",
    requiredApprovalRole: template.ownerRole,
    llmExtractionNeeded:
      format === "pdf" || format === "docx" || format === "pptx",
  };
}
