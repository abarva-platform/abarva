import { getTemplateById } from "./template-registry";
import type {
  ContextValidationFinding,
  ExtractedContextFact,
  FileClassification,
} from "./types";

const VALID_TIME_CLASSIFICATIONS = new Set([
  "invest",
  "migrate",
  "tolerate",
  "retire",
]);

export const VALID_DOMAIN_SEGMENTS = new Set([
  "DATA_ANALYTICS",
  "ERP",
  "DIGITAL_CX",
  "OPERATIONS",
  "INFRASTRUCTURE",
  "SECURITY_IDENTITY",
  "HR_WORKFORCE",
  "COLLABORATION",
]);
export const VALID_BUSINESS_FUNCTIONS = new Set([
  "FINANCE",
  "SUPPLY_CHAIN",
  "HUMAN_RESOURCES",
  "OPERATIONS",
  "COMMERCIAL_SALES",
  "IT",
  "COMPLIANCE_LEGAL",
  "CORPORATE",
  "INDUSTRY_OPS",
]);
const VALID_CRITICALITIES = new Set(["TIER_1", "TIER_2", "TIER_3"]);
const VALID_VENDOR_CATEGORIES = new Set([
  "SOFTWARE_SAAS",
  "PROFESSIONAL_SERVICES",
  "HARDWARE",
  "CLOUD_SERVICES",
  "MANAGED_SERVICES",
  "TELCO",
  "DATA_SERVICES",
]);
const VALID_AUTO_RENEW = new Set(["YES", "NO", "UNKNOWN"]);

export interface DomainSegmentInferenceResult {
  segment: string | null;
  confidence: "high" | "low";
}

const DOMAIN_SEGMENT_KEYWORDS: Array<{ keywords: string[]; segment: string }> =
  [
    {
      keywords: [
        "sap",
        "oracle",
        "erp",
        "workday",
        "peoplesoft",
        "netsuite",
        "dynamics",
        "epicor",
        "infor",
      ],
      segment: "ERP",
    },
    {
      keywords: [
        "epic",
        "cerner",
        "meditech",
        "allscripts",
        "ehr",
        "emr",
        "fhir",
        "hl7",
        "pacs",
        "ris",
      ],
      segment: "OPERATIONS",
    },
    {
      keywords: [
        "aws",
        "azure",
        "gcp",
        "vmware",
        "server",
        "network",
        "storage",
        "datacenter",
        "infra",
        "cloud",
      ],
      segment: "INFRASTRUCTURE",
    },
    {
      keywords: ["salesforce", "crm", "adobe", "twilio", "zendesk"],
      segment: "DIGITAL_CX",
    },
    {
      keywords: [
        "servicenow",
        "itsm",
        "jira",
        "confluence",
        "sharepoint",
        "teams",
        "slack",
        "microsoft",
      ],
      segment: "COLLABORATION",
    },
    {
      keywords: [
        "hr",
        "payroll",
        "talent",
        "recruit",
        "hris",
        "workforce",
        "headcount",
        "org",
        "people",
      ],
      segment: "HR_WORKFORCE",
    },
    {
      keywords: [
        "finance",
        "accounting",
        "billing",
        "invoice",
        "ap",
        "ar",
        "gl",
        "ledger",
        "treasury",
        "budget",
      ],
      segment: "ERP",
    },
    {
      keywords: [
        "data",
        "analytics",
        "warehouse",
        "lake",
        "etl",
        "bi",
        "tableau",
        "powerbi",
        "snowflake",
        "databricks",
      ],
      segment: "DATA_ANALYTICS",
    },
    {
      keywords: [
        "crowdstrike",
        "okta",
        "palo",
        "qualys",
        "cyberark",
        "sailpoint",
        "identity",
        "security",
      ],
      segment: "SECURITY_IDENTITY",
    },
  ];

/**
 * Infers a domain segment from a vendor or system name using keyword matching.
 * Returns high confidence only when a unique keyword match is found.
 */
export function inferDomainSegment(
  nameHint: string,
): DomainSegmentInferenceResult {
  if (!nameHint || nameHint.trim() === "") {
    return { segment: null, confidence: "low" };
  }
  const lower = nameHint.toLowerCase();
  const matches: string[] = [];
  for (const entry of DOMAIN_SEGMENT_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      if (!matches.includes(entry.segment)) {
        matches.push(entry.segment);
      }
    }
  }
  if (matches.length === 1) {
    return { segment: matches[0]!, confidence: "high" };
  }
  return { segment: null, confidence: "low" };
}

export function validateExtractedFacts(args: {
  classification: FileClassification;
  facts: ExtractedContextFact[];
}): ContextValidationFinding[] {
  const template = getTemplateById(args.classification.templateType);
  const findings: ContextValidationFinding[] = [];
  const factsByEntity = new Map<string, ExtractedContextFact[]>();
  for (const fact of args.facts) {
    const existing = factsByEntity.get(fact.entityKey) ?? [];
    existing.push(fact);
    factsByEntity.set(fact.entityKey, existing);
  }

  for (const [entityKey, facts] of factsByEntity) {
    const byField = new Map(facts.map((fact) => [fact.field, fact]));
    for (const required of template?.requiredFields ?? []) {
      const fact = byField.get(required);
      if (!fact || fact.valueText.trim() === "") {
        findings.push({
          severity: "error",
          code: "missing_required_field",
          message: `${entityKey} is missing required field ${required}.`,
          row: fact?.sourceLocator.row,
          field: required,
          expected: "non-empty value",
          actual: fact?.valueText ?? "",
        });
      }
    }

    const costFact =
      byField.get("annual_value_usd") ??
      byField.get("revenue_usd") ??
      byField.get("committed_usd");
    if (
      costFact &&
      costFact.valueText !== "" &&
      Number.isNaN(Number(costFact.valueText))
    ) {
      findings.push({
        severity: "error",
        code: "invalid_numeric_value",
        message: `${entityKey}.${costFact.field} must be numeric.`,
        row: costFact.sourceLocator.row,
        field: costFact.field,
        expected: "number",
        actual: costFact.valueText,
      });
    }

    const timeClassification = byField.get("time_classification");
    if (
      timeClassification &&
      timeClassification.valueText &&
      !VALID_TIME_CLASSIFICATIONS.has(timeClassification.valueText)
    ) {
      findings.push({
        severity: "error",
        code: "invalid_enum_value",
        message: `${entityKey}.time_classification must be invest, migrate, tolerate, or retire.`,
        row: timeClassification.sourceLocator.row,
        field: "time_classification",
        expected: "invest | migrate | tolerate | retire",
        actual: timeClassification.valueText,
      });
    }

    const domainSegmentFact = byField.get("domain_segment");
    if (
      domainSegmentFact &&
      domainSegmentFact.valueText &&
      !VALID_DOMAIN_SEGMENTS.has(domainSegmentFact.valueText)
    ) {
      findings.push({
        severity: "error",
        code: "invalid_enum_value",
        message: `${entityKey}.domain_segment must be one of: ${[...VALID_DOMAIN_SEGMENTS].join(" | ")}.`,
        row: domainSegmentFact.sourceLocator.row,
        field: "domain_segment",
        expected: [...VALID_DOMAIN_SEGMENTS].join(" | "),
        actual: domainSegmentFact.valueText,
      });
    } else if (!domainSegmentFact || !domainSegmentFact.valueText) {
      const vendorFact =
        byField.get("vendor_name") ??
        byField.get("name") ??
        byField.get("title");
      const vendorName = vendorFact?.valueText ?? entityKey;
      const inferred = inferDomainSegment(vendorName);
      if (inferred.segment && inferred.confidence === "high") {
        findings.push({
          severity: "info",
          code: "auto_inferred_domain_segment",
          message: `${entityKey}.domain_segment was not set; inferred value '${inferred.segment}' from vendor name '${vendorName}'.`,
          field: "domain_segment",
          expected: inferred.segment,
          actual: "",
        });
      } else {
        findings.push({
          severity: "warning",
          code: "missing_domain_segment",
          message: `${entityKey} has no domain_segment; set to one of: ${[...VALID_DOMAIN_SEGMENTS].join(" | ")}.`,
          field: "domain_segment",
        });
      }
    }

    const businessFunctionFact = byField.get("business_function");
    if (
      businessFunctionFact &&
      businessFunctionFact.valueText &&
      !VALID_BUSINESS_FUNCTIONS.has(businessFunctionFact.valueText)
    ) {
      findings.push({
        severity: "error",
        code: "invalid_enum_value",
        message: `${entityKey}.business_function must be one of: ${[...VALID_BUSINESS_FUNCTIONS].join(" | ")}.`,
        row: businessFunctionFact.sourceLocator.row,
        field: "business_function",
        expected: [...VALID_BUSINESS_FUNCTIONS].join(" | "),
        actual: businessFunctionFact.valueText,
      });
    }

    const criticalityFact = byField.get("criticality");
    if (
      criticalityFact &&
      criticalityFact.valueText &&
      !VALID_CRITICALITIES.has(criticalityFact.valueText)
    ) {
      findings.push({
        severity: "error",
        code: "invalid_enum_value",
        message: `${entityKey}.criticality must be one of: ${[...VALID_CRITICALITIES].join(" | ")}.`,
        row: criticalityFact.sourceLocator.row,
        field: "criticality",
        expected: [...VALID_CRITICALITIES].join(" | "),
        actual: criticalityFact.valueText,
      });
    }

    const vendorCategoryFact = byField.get("vendor_category");
    if (
      vendorCategoryFact &&
      vendorCategoryFact.valueText &&
      !VALID_VENDOR_CATEGORIES.has(vendorCategoryFact.valueText)
    ) {
      findings.push({
        severity: "error",
        code: "invalid_enum_value",
        message: `${entityKey}.vendor_category must be one of: ${[...VALID_VENDOR_CATEGORIES].join(" | ")}.`,
        row: vendorCategoryFact.sourceLocator.row,
        field: "vendor_category",
        expected: [...VALID_VENDOR_CATEGORIES].join(" | "),
        actual: vendorCategoryFact.valueText,
      });
    }

    const autoRenewFact = byField.get("auto_renew");
    if (
      autoRenewFact &&
      autoRenewFact.valueText &&
      !VALID_AUTO_RENEW.has(autoRenewFact.valueText)
    ) {
      findings.push({
        severity: "error",
        code: "invalid_enum_value",
        message: `${entityKey}.auto_renew must be one of: ${[...VALID_AUTO_RENEW].join(" | ")}.`,
        row: autoRenewFact.sourceLocator.row,
        field: "auto_renew",
        expected: [...VALID_AUTO_RENEW].join(" | "),
        actual: autoRenewFact.valueText,
      });
    }

    const owner = byField.get("owner_role") ?? byField.get("sponsor_role");
    if (owner && owner.valueText.trim() === "") {
      findings.push({
        severity: "warning",
        code: "missing_owner",
        message: `${entityKey} has no named owner; approve only after steward assignment.`,
        row: owner.sourceLocator.row,
        field: owner.field,
      });
    }
  }

  return findings;
}

export function attachValidationFindings(
  facts: ExtractedContextFact[],
  findings: ContextValidationFinding[],
): ExtractedContextFact[] {
  return facts.map((fact) => ({
    ...fact,
    validationFindings: findings.filter(
      (finding) =>
        finding.row === fact.sourceLocator.row &&
        (!finding.field || finding.field === fact.field),
    ),
  }));
}
