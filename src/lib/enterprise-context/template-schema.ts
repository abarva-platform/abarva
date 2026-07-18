import type { EnterpriseContextTenantKey } from "./schema";

export const ENTERPRISE_CONTEXT_TEMPLATE_VERSION = "2026.05.day-one.v1";

export type EnterpriseContextColumnType =
  | "string"
  | "number"
  | "date"
  | "enum"
  | "boolean"
  | "list";

export interface EnterpriseContextTemplateColumn {
  key: string;
  label: string;
  type: EnterpriseContextColumnType;
  required?: boolean;
  enumValues?: readonly string[];
  description: string;
  example: string;
}

export interface EnterpriseContextTemplateWorkbook {
  key: string;
  title: string;
  filenameBase: string;
  domain:
    | "org"
    | "facilities"
    | "cmdb"
    | "vendor"
    | "financial"
    | "policy"
    | "operations"
    | "initiative"
    | "data"
    | "risk";
  description: string;
  sourceSystems: readonly string[];
  columns: readonly EnterpriseContextTemplateColumn[];
}

export interface EnterpriseContextTemplateTenant {
  tenantKey: EnterpriseContextTenantKey;
  tenantSlug: string;
  displayName: string;
  vertical: string;
}

export const ENTERPRISE_CONTEXT_TEMPLATE_TENANTS: readonly EnterpriseContextTemplateTenant[] =
  [
    {
      tenantKey: "meridian",
      tenantSlug: "meridian",
      displayName: "Meridian Health",
      vertical: "Healthcare IDN",
    },
    {
      tenantKey: "apexretail",
      tenantSlug: "apexretail",
      displayName: "Apex Retail Group",
      vertical: "Retail",
    },
    {
      tenantKey: "arcturus",
      tenantSlug: "arcturus",
      displayName: "FS Demo",
      vertical: "Financial Services",
    },
  ] as const;

export const ENTERPRISE_CONTEXT_COMMON_COLUMNS: readonly EnterpriseContextTemplateColumn[] =
  [
    {
      key: "source_system",
      label: "source_system",
      type: "string",
      required: true,
      description:
        "Originating system or template source, such as ServiceNow, Workday, Coupa, Epic, or manual attestation.",
      example: "ServiceNow",
    },
    {
      key: "source_record_id",
      label: "source_record_id",
      type: "string",
      required: true,
      description:
        "Stable source-system identifier. Keep this unchanged across weekly or monthly refreshes.",
      example: "SYS-000123",
    },
    {
      key: "source_owner",
      label: "source_owner",
      type: "string",
      required: true,
      description:
        "Person or group accountable for the source extract or attestation.",
      example: "IT Service Management",
    },
    {
      key: "last_validated_date",
      label: "last_validated_date",
      type: "date",
      required: true,
      description:
        "Date the row was last validated by the source owner, formatted YYYY-MM-DD.",
      example: "2026-05-01",
    },
    {
      key: "confidence",
      label: "confidence",
      type: "number",
      required: true,
      description:
        "Confidence score from 0 to 1. Use lower values for manually estimated or partially reconciled records.",
      example: "0.86",
    },
    {
      key: "evidence_usable",
      label: "evidence_usable",
      type: "boolean",
      required: true,
      description:
        "Whether this row can be cited as evidence in Source, Moves, Tower, or Intelligence.",
      example: "true",
    },
    {
      key: "notes_gaps",
      label: "notes_gaps",
      type: "string",
      description:
        "Known gaps, caveats, stale fields, conflicts, or follow-up needed before this row is trusted.",
      example: "Owner validated; renewal date needs Legal confirmation.",
    },
  ] as const;

function col(
  key: string,
  type: EnterpriseContextColumnType,
  description: string,
  example: string,
  required = false,
  enumValues?: readonly string[],
): EnterpriseContextTemplateColumn {
  return { key, label: key, type, required, enumValues, description, example };
}

function withCommon(
  columns: readonly EnterpriseContextTemplateColumn[],
): readonly EnterpriseContextTemplateColumn[] {
  return [...columns, ...ENTERPRISE_CONTEXT_COMMON_COLUMNS];
}

export const ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS: readonly EnterpriseContextTemplateWorkbook[] =
  [
    {
      key: "org_decision_rights",
      title: "Org + Decision Rights",
      filenameBase: "01-org-decision-rights",
      domain: "org",
      description:
        "Leadership, ownership, decision rights, approval paths, and escalation model.",
      sourceSystems: ["Workday", "Okta", "Manual attestation"],
      columns: withCommon([
        col(
          "org_unit_id",
          "string",
          "Stable organization or department identifier.",
          "ORG-CLINOPS",
          true,
        ),
        col(
          "person_or_group_id",
          "string",
          "Person, committee, or group identifier.",
          "PERSON-AKRISHNA",
          true,
        ),
        col(
          "name",
          "string",
          "Person or group display name.",
          "Anita Krishnamurthy",
          true,
        ),
        col(
          "role_title",
          "string",
          "Formal role or decision group title.",
          "EVP Digital and Technology",
          true,
        ),
        col(
          "reports_to_id",
          "string",
          "Manager or governing body identifier.",
          "PERSON-CEO",
        ),
        col(
          "decision_domain",
          "string",
          "Domain where this role can make or recommend decisions.",
          "Clinical platform investment",
          true,
        ),
        col(
          "decision_right",
          "enum",
          "Decision authority level.",
          "Approve",
          true,
          ["Approve", "Recommend", "Consult", "Inform"],
        ),
        col(
          "approval_authority",
          "string",
          "Scope or dollar threshold of the authority.",
          "Technology sourcing up to $5M",
        ),
        col(
          "delegated_to_id",
          "string",
          "Delegated approver when applicable.",
          "PERSON-CIOOPS",
        ),
        col(
          "escalation_path",
          "string",
          "Where blockers or conflicts escalate.",
          "CIO Council > Executive Steering Committee",
        ),
      ]),
    },
    {
      key: "facilities_business_units",
      title: "Facilities + Business Units",
      filenameBase: "02-facilities-business-units",
      domain: "facilities",
      description:
        "Facilities, service lines, business units, regions, and operating accountability.",
      sourceSystems: ["Workday", "ERP", "Facilities master"],
      columns: withCommon([
        col(
          "facility_id",
          "string",
          "Stable facility or site identifier.",
          "FAC-MH-ATL-01",
          true,
        ),
        col(
          "business_unit_id",
          "string",
          "Business unit or service line identifier.",
          "BU-AMBULATORY",
          true,
        ),
        col(
          "facility_name",
          "string",
          "Facility or site display name.",
          "Meridian Atlanta Medical Center",
          true,
        ),
        col("facility_type", "enum", "Facility type.", "Hospital", true, [
          "Hospital",
          "Clinic",
          "Contact Center",
          "Research Center",
          "Shared Services",
          "Data Center",
        ]),
        col("region", "string", "Region or market.", "Southeast", true),
        col("service_line", "string", "Primary service line.", "Acute Care"),
        col("bed_count", "number", "Licensed beds where applicable.", "420"),
        col(
          "annual_encounters",
          "number",
          "Annual encounters, calls, visits, or transactions.",
          "285000",
        ),
        col(
          "revenue_owner",
          "string",
          "Accountable finance or operational owner.",
          "Regional CFO",
        ),
        col(
          "it_site_owner",
          "string",
          "Technology owner for this site.",
          "Field Technology Services",
        ),
        col(
          "critical_services",
          "list",
          "Pipe-separated services that must remain available.",
          "Epic|PACS|Contact Center",
        ),
      ]),
    },
    {
      key: "cmdb_applications_services",
      title: "CMDB Applications + Services",
      filenameBase: "03-cmdb-applications-services",
      domain: "cmdb",
      description:
        "Application, service, and configuration-item inventory with ownership and criticality.",
      sourceSystems: ["ServiceNow", "CMDB", "Cloud consoles"],
      columns: withCommon([
        col(
          "ci_id",
          "string",
          "Stable configuration item identifier.",
          "CI-APP-EPIC-HYPERSPACE",
          true,
        ),
        col(
          "ci_name",
          "string",
          "Configuration item display name.",
          "Epic Hyperspace",
          true,
        ),
        col(
          "ci_type",
          "enum",
          "Configuration item type.",
          "Application",
          true,
          [
            "Application",
            "Business Service",
            "Database",
            "Integration",
            "Infrastructure",
            "Endpoint",
            "Data Platform",
          ],
        ),
        col(
          "business_service",
          "string",
          "Business service supported by the CI.",
          "Clinical Documentation",
          true,
        ),
        col(
          "application_owner",
          "string",
          "Business or product owner.",
          "Clinical Informatics",
        ),
        col(
          "technical_owner",
          "string",
          "Technical accountable owner.",
          "EHR Platform Engineering",
          true,
        ),
        col(
          "support_group",
          "string",
          "Operational support group.",
          "Epic Support Tier 2",
          true,
        ),
        col("criticality", "enum", "Operational criticality.", "Tier 1", true, [
          "Tier 1",
          "Tier 2",
          "Tier 3",
          "Tier 4",
        ]),
        col("hosting_model", "enum", "Hosting model.", "Hosted", true, [
          "SaaS",
          "Hosted",
          "Private Cloud",
          "Public Cloud",
          "On Premise",
          "Hybrid",
        ]),
        col(
          "environment",
          "enum",
          "Environment for the CI.",
          "Production",
          true,
          ["Production", "Non Production", "DR", "Shared"],
        ),
        col("vendor_id", "string", "Linked vendor identifier.", "VEN-EPIC"),
        col(
          "contract_id",
          "string",
          "Linked contract identifier.",
          "CON-EPIC-2026",
        ),
        col(
          "data_classification",
          "enum",
          "Highest data classification handled.",
          "Restricted",
          true,
          ["Public", "Internal", "Confidential", "Restricted"],
        ),
        col(
          "service_tier",
          "enum",
          "Service tier used for SLA and risk reporting.",
          "Gold",
          true,
          ["Gold", "Silver", "Bronze", "Unclassified"],
        ),
      ]),
    },
    {
      key: "ci_relationships_dependencies",
      title: "CI Relationships / Dependencies",
      filenameBase: "04-ci-relationships-dependencies",
      domain: "cmdb",
      description:
        "System, service, integration, and operational dependency relationships.",
      sourceSystems: [
        "ServiceNow",
        "Integration catalog",
        "Architecture repository",
      ],
      columns: withCommon([
        col(
          "relationship_id",
          "string",
          "Stable relationship identifier.",
          "REL-EPIC-MIRTH-001",
          true,
        ),
        col(
          "from_ci_id",
          "string",
          "Source CI identifier.",
          "CI-APP-EPIC-HYPERSPACE",
          true,
        ),
        col(
          "to_ci_id",
          "string",
          "Target CI identifier.",
          "CI-INT-MIRTH",
          true,
        ),
        col(
          "relationship_type",
          "enum",
          "Relationship category.",
          "Depends On",
          true,
          [
            "Depends On",
            "Integrates With",
            "Hosted On",
            "Owned By",
            "Secured By",
            "Feeds",
            "Consumes",
          ],
        ),
        col(
          "dependency_direction",
          "enum",
          "Directionality of dependency.",
          "Outbound",
          true,
          ["Inbound", "Outbound", "Bidirectional"],
        ),
        col(
          "integration_pattern",
          "string",
          "Integration or dependency pattern.",
          "HL7 ADT feed",
        ),
        col(
          "data_flow",
          "string",
          "Brief description of the data or transaction flow.",
          "Encounter and patient-administration event feed",
        ),
        col(
          "criticality",
          "enum",
          "Impact if relationship fails.",
          "High",
          true,
          ["Low", "Medium", "High", "Critical"],
        ),
        col(
          "recovery_dependency",
          "boolean",
          "Whether DR or recovery sequencing depends on this relationship.",
          "true",
        ),
        col(
          "known_gap",
          "string",
          "Known mapping or discovery gap.",
          "Interface ownership split between EHR and Integration teams",
        ),
      ]),
    },
    {
      key: "vendors_contract_inventory",
      title: "Vendors + Contract Inventory",
      filenameBase: "05-vendors-contract-inventory",
      domain: "vendor",
      description:
        "Vendor, contract, owner, risk, value, and sourcing posture.",
      sourceSystems: ["Coupa", "Legal CLM", "Finance ERP"],
      columns: withCommon([
        col(
          "vendor_id",
          "string",
          "Stable vendor identifier.",
          "VEN-EPIC",
          true,
        ),
        col(
          "vendor_name",
          "string",
          "Vendor legal or commercial name.",
          "Epic Systems",
          true,
        ),
        col(
          "contract_id",
          "string",
          "Stable contract identifier.",
          "CON-EPIC-2026",
          true,
        ),
        col(
          "contract_name",
          "string",
          "Contract display name.",
          "Epic Hosting and Integration Services",
          true,
        ),
        col(
          "category",
          "string",
          "Sourcing or spend category.",
          "Clinical Systems",
        ),
        col(
          "contract_owner",
          "string",
          "Contract owner or accountable function.",
          "IT Sourcing",
        ),
        col(
          "relationship_owner",
          "string",
          "Executive or business relationship owner.",
          "Chief Digital Officer",
        ),
        col("start_date", "date", "Contract start date.", "2024-07-01"),
        col("end_date", "date", "Contract end date.", "2027-06-30", true),
        col(
          "annual_spend_usd",
          "number",
          "Current annualized spend in USD.",
          "18400000",
        ),
        col(
          "termination_notice_days",
          "number",
          "Notice period required before termination or non-renewal.",
          "180",
        ),
        col(
          "baa_required",
          "boolean",
          "Whether a business associate agreement or equivalent is required.",
          "true",
        ),
        col(
          "security_review_status",
          "enum",
          "Security review posture.",
          "Current",
          true,
          ["Current", "Due", "Overdue", "Not Required"],
        ),
      ]),
    },
    {
      key: "renewal_calendar",
      title: "Renewal Calendar",
      filenameBase: "06-renewal-calendar",
      domain: "vendor",
      description:
        "Upcoming renewals, notice windows, value exposure, and sourcing decision timing.",
      sourceSystems: ["Coupa", "Legal CLM", "Finance ERP"],
      columns: withCommon([
        col(
          "renewal_id",
          "string",
          "Stable renewal identifier.",
          "REN-EPIC-2027",
          true,
        ),
        col(
          "contract_id",
          "string",
          "Linked contract identifier.",
          "CON-EPIC-2026",
          true,
        ),
        col(
          "vendor_id",
          "string",
          "Linked vendor identifier.",
          "VEN-EPIC",
          true,
        ),
        col(
          "renewal_date",
          "date",
          "Renewal or expiration date.",
          "2027-06-30",
          true,
        ),
        col(
          "notice_date",
          "date",
          "Latest safe notice or sourcing decision date.",
          "2026-12-31",
          true,
        ),
        col(
          "renewal_type",
          "enum",
          "Renewal type.",
          "Negotiated renewal",
          true,
          [
            "Auto-renewal",
            "Negotiated renewal",
            "Competitive sourcing",
            "Extension",
            "Termination",
          ],
        ),
        col(
          "estimated_value_usd",
          "number",
          "Estimated contract value or exposure in USD.",
          "55200000",
        ),
        col(
          "sourcing_required",
          "boolean",
          "Whether a Source event should be considered.",
          "true",
        ),
        col(
          "decision_owner",
          "string",
          "Decision owner for renewal path.",
          "CIO Office",
        ),
        col(
          "renewal_risk",
          "enum",
          "Risk level for the renewal.",
          "High",
          true,
          ["Low", "Medium", "High", "Critical"],
        ),
        col("status", "enum", "Current renewal status.", "Planning", true, [
          "Not Started",
          "Planning",
          "In Sourcing",
          "Negotiating",
          "Completed",
        ]),
      ]),
    },
    {
      key: "spend_baseline",
      title: "Spend Baseline",
      filenameBase: "07-spend-baseline",
      domain: "financial",
      description:
        "Spend baseline by period, vendor, category, business unit, and contract.",
      sourceSystems: ["Finance ERP", "Coupa", "Cloud billing"],
      columns: withCommon([
        col(
          "spend_id",
          "string",
          "Stable spend row identifier.",
          "SPEND-2026-01-EPIC",
          true,
        ),
        col("period_start", "date", "Period start date.", "2026-01-01", true),
        col("period_end", "date", "Period end date.", "2026-01-31", true),
        col(
          "business_unit_id",
          "string",
          "Linked business unit identifier.",
          "BU-CLINICAL",
          true,
        ),
        col("cost_center", "string", "Finance cost center.", "CC-44010"),
        col("vendor_id", "string", "Linked vendor identifier.", "VEN-EPIC"),
        col(
          "contract_id",
          "string",
          "Linked contract identifier.",
          "CON-EPIC-2026",
        ),
        col("category", "string", "Spend category.", "Clinical Systems"),
        col(
          "actual_spend_usd",
          "number",
          "Actual spend in USD for the period.",
          "1533333",
          true,
        ),
        col(
          "run_rate_usd",
          "number",
          "Annualized run-rate implied by the period.",
          "18400000",
        ),
        col("capex_opex", "enum", "Spend classification.", "Opex", true, [
          "Capex",
          "Opex",
          "Mixed",
        ]),
        col(
          "budget_owner",
          "string",
          "Budget owner or cost-center owner.",
          "Clinical Technology Finance",
        ),
      ]),
    },
    {
      key: "policies_procedures",
      title: "Policies + Procedures",
      filenameBase: "08-policies-procedures",
      domain: "policy",
      description:
        "Policies, procedures, controls, constraints, effective dates, and review posture.",
      sourceSystems: ["Policy management", "GRC", "SharePoint"],
      columns: withCommon([
        col(
          "policy_id",
          "string",
          "Stable policy or procedure identifier.",
          "POL-AI-002",
          true,
        ),
        col(
          "policy_name",
          "string",
          "Policy or procedure name.",
          "AI Use and Clinical Safety Review",
          true,
        ),
        col("policy_type", "enum", "Policy type.", "Policy", true, [
          "Policy",
          "Procedure",
          "Control",
          "Standard",
          "Guideline",
        ]),
        col("effective_date", "date", "Effective date.", "2026-01-15", true),
        col("version", "string", "Version label.", "v2.1", true),
        col(
          "policy_owner",
          "string",
          "Policy owner.",
          "AI Governance Council",
          true,
        ),
        col(
          "applies_to_systems",
          "list",
          "Pipe-separated linked CI identifiers.",
          "CI-APP-EPIC-HYPERSPACE|CI-DATA-RESEARCH-LAKE",
        ),
        col(
          "data_domains",
          "list",
          "Pipe-separated data domains covered.",
          "Clinical|Research|Contact Center",
        ),
        col(
          "control_requirement",
          "string",
          "Control or procedural requirement.",
          "Clinical AI use requires safety review before production.",
        ),
        col(
          "ai_constraint",
          "string",
          "Specific AI-related constraint or approval requirement.",
          "No autonomous clinical decisioning without physician attestation.",
        ),
        col(
          "review_cycle_days",
          "number",
          "Expected review cadence in days.",
          "365",
        ),
        col(
          "next_review_date",
          "date",
          "Next scheduled review date.",
          "2027-01-15",
        ),
      ]),
    },
    {
      key: "incidents",
      title: "Incidents",
      filenameBase: "09-incidents",
      domain: "operations",
      description:
        "Operational incidents by CI, service, severity, SLA, and resolution posture.",
      sourceSystems: ["ServiceNow", "ITSM"],
      columns: withCommon([
        col(
          "incident_id",
          "string",
          "Stable incident identifier.",
          "INC0012459",
          true,
        ),
        col("opened_at", "date", "Incident opened date.", "2026-04-03", true),
        col(
          "closed_at",
          "date",
          "Incident closed date if resolved.",
          "2026-04-04",
        ),
        col("ci_id", "string", "Impacted CI identifier.", "CI-INT-MIRTH", true),
        col(
          "business_service",
          "string",
          "Impacted business service.",
          "Clinical Integration",
        ),
        col("priority", "enum", "Incident priority.", "P2", true, [
          "P1",
          "P2",
          "P3",
          "P4",
        ]),
        col("severity", "enum", "Incident severity.", "High", true, [
          "Low",
          "Medium",
          "High",
          "Critical",
        ]),
        col(
          "assignment_group",
          "string",
          "Assigned resolver group.",
          "Integration Operations",
        ),
        col(
          "short_description",
          "string",
          "Non-PHI operational summary.",
          "HL7 queue latency exceeded operational threshold.",
        ),
        col(
          "resolution_code",
          "string",
          "Resolution code or disposition.",
          "Capacity tuning",
        ),
        col("breach_sla", "boolean", "Whether SLA was breached.", "false"),
        col(
          "related_problem_id",
          "string",
          "Linked problem identifier if known.",
          "PRB0001842",
        ),
      ]),
    },
    {
      key: "problems",
      title: "Problems",
      filenameBase: "10-problems",
      domain: "operations",
      description:
        "Problems, root causes, known errors, workarounds, and initiative blockers.",
      sourceSystems: ["ServiceNow", "ITSM"],
      columns: withCommon([
        col(
          "problem_id",
          "string",
          "Stable problem identifier.",
          "PRB0001842",
          true,
        ),
        col("opened_at", "date", "Problem opened date.", "2026-03-12", true),
        col(
          "closed_at",
          "date",
          "Problem closed date if resolved.",
          "2026-04-20",
        ),
        col(
          "ci_id",
          "string",
          "Primary linked CI identifier.",
          "CI-INT-MIRTH",
          true,
        ),
        col(
          "business_service",
          "string",
          "Impacted business service.",
          "Clinical Integration",
        ),
        col("priority", "enum", "Problem priority.", "P2", true, [
          "P1",
          "P2",
          "P3",
          "P4",
        ]),
        col(
          "root_cause_category",
          "string",
          "Root-cause category.",
          "Capacity management",
        ),
        col("known_error", "boolean", "Whether this is a known error.", "true"),
        col("status", "enum", "Problem status.", "Known Error", true, [
          "Open",
          "Known Error",
          "Fix In Progress",
          "Resolved",
          "Accepted Risk",
        ]),
        col("owner", "string", "Problem owner.", "Integration Operations"),
        col(
          "linked_incident_count",
          "number",
          "Number of linked incidents.",
          "14",
        ),
        col(
          "workaround_available",
          "boolean",
          "Whether a workaround exists.",
          "true",
        ),
      ]),
    },
    {
      key: "changes",
      title: "Changes",
      filenameBase: "11-changes",
      domain: "operations",
      description:
        "Change records, approvals, implementation ownership, windows, and incident outcomes.",
      sourceSystems: ["ServiceNow", "ITSM"],
      columns: withCommon([
        col(
          "change_id",
          "string",
          "Stable change identifier.",
          "CHG0048120",
          true,
        ),
        col("planned_start", "date", "Planned start date.", "2026-05-12", true),
        col("planned_end", "date", "Planned end date.", "2026-05-12", true),
        col(
          "ci_id",
          "string",
          "Primary CI identifier.",
          "CI-APP-EPIC-HYPERSPACE",
          true,
        ),
        col(
          "business_service",
          "string",
          "Business service impacted.",
          "Clinical Documentation",
        ),
        col("change_type", "enum", "Change type.", "Normal", true, [
          "Standard",
          "Normal",
          "Emergency",
        ]),
        col("risk_level", "enum", "Change risk level.", "Medium", true, [
          "Low",
          "Medium",
          "High",
          "Critical",
        ]),
        col(
          "approval_group",
          "string",
          "Approval group.",
          "Clinical Change Advisory Board",
        ),
        col(
          "implementation_owner",
          "string",
          "Implementation owner.",
          "EHR Platform Engineering",
        ),
        col("status", "enum", "Change status.", "Scheduled", true, [
          "Draft",
          "Scheduled",
          "Implemented",
          "Failed",
          "Cancelled",
        ]),
        col(
          "backout_plan_tested",
          "boolean",
          "Whether rollback/backout plan is tested.",
          "true",
        ),
        col(
          "caused_incident_id",
          "string",
          "Incident caused by the change, if any.",
          "INC0012459",
        ),
      ]),
    },
    {
      key: "slas",
      title: "SLAs",
      filenameBase: "12-slas",
      domain: "operations",
      description:
        "Service-level targets, measurement sources, breaches, trends, and business impact.",
      sourceSystems: ["ServiceNow", "APM", "ITSM"],
      columns: withCommon([
        col(
          "sla_id",
          "string",
          "Stable SLA identifier.",
          "SLA-EPIC-AVAILABILITY",
          true,
        ),
        col(
          "business_service",
          "string",
          "Business service covered.",
          "Clinical Documentation",
          true,
        ),
        col(
          "ci_id",
          "string",
          "Linked CI identifier.",
          "CI-APP-EPIC-HYPERSPACE",
        ),
        col(
          "sla_name",
          "string",
          "SLA display name.",
          "Epic Production Availability",
          true,
        ),
        col("metric_name", "string", "Metric measured.", "Availability"),
        col("target_value", "number", "Target value.", "99.95", true),
        col("unit", "string", "Unit of measure.", "percent"),
        col(
          "measurement_source",
          "string",
          "Source of measurement.",
          "ServiceNow APM",
        ),
        col("owner", "string", "SLA owner.", "EHR Platform Engineering"),
        col(
          "breach_count_90d",
          "number",
          "Breaches over trailing 90 days.",
          "1",
        ),
        col("trending_status", "enum", "Trend status.", "Stable", true, [
          "Improving",
          "Stable",
          "Worsening",
          "Unknown",
        ]),
        col(
          "penalty_or_impact",
          "string",
          "Penalty, business impact, or operating consequence.",
          "Clinical documentation delay during downtime.",
        ),
      ]),
    },
    {
      key: "initiative_portfolio",
      title: "Initiative Portfolio",
      filenameBase: "13-initiative-portfolio",
      domain: "initiative",
      description:
        "Strategic, technology, sourcing, AI, and operational initiatives with dependencies.",
      sourceSystems: ["PMO", "Jira", "Aha", "Manual attestation"],
      columns: withCommon([
        col(
          "initiative_id",
          "string",
          "Stable initiative identifier.",
          "INIT-CCAI-ROUTING",
          true,
        ),
        col(
          "initiative_name",
          "string",
          "Initiative display name.",
          "Contact Center AI Routing",
          true,
        ),
        col(
          "sponsor",
          "string",
          "Executive sponsor.",
          "EVP Digital and Technology",
          true,
        ),
        col(
          "initiative_owner",
          "string",
          "Initiative owner.",
          "Customer Operations Technology",
        ),
        col("status", "enum", "Current initiative status.", "In Design", true, [
          "Proposed",
          "In Design",
          "Approved",
          "In Flight",
          "Paused",
          "Completed",
        ]),
        col("stage", "string", "Phase, stage, or gate.", "P3 Design"),
        col(
          "start_date",
          "date",
          "Planned or actual start date.",
          "2026-03-01",
        ),
        col(
          "target_date",
          "date",
          "Target completion or gate date.",
          "2026-09-30",
        ),
        col(
          "value_hypothesis",
          "string",
          "Value hypothesis or outcome target.",
          "Reduce call transfers and improve first-contact resolution.",
        ),
        col(
          "dependent_ci_ids",
          "list",
          "Pipe-separated dependent CI identifiers.",
          "CI-APP-CRM|CI-SVC-CONTACT-CENTER",
        ),
        col(
          "dependent_contract_ids",
          "list",
          "Pipe-separated dependent contract identifiers.",
          "CON-GENESYS-2026|CON-SALESFORCE-2026",
        ),
        col(
          "policy_constraints",
          "list",
          "Pipe-separated policy or control identifiers constraining the initiative.",
          "POL-AI-002|CTRL-DATA-RETENTION",
        ),
      ]),
    },
    {
      key: "data_domains_stewardship",
      title: "Data Domains + Stewardship",
      filenameBase: "14-data-domains-stewardship",
      domain: "data",
      description:
        "Data domains, assets, ownership, classification, quality, retention, and AI usage posture.",
      sourceSystems: [
        "Data catalog",
        "Collibra",
        "Purview",
        "Manual attestation",
      ],
      columns: withCommon([
        col(
          "data_domain_id",
          "string",
          "Stable data domain identifier.",
          "DATA-CLINICAL-ENCOUNTER",
          true,
        ),
        col(
          "domain_name",
          "string",
          "Domain display name.",
          "Clinical Encounter",
          true,
        ),
        col(
          "data_owner",
          "string",
          "Business data owner.",
          "Chief Medical Information Officer",
          true,
        ),
        col(
          "data_steward",
          "string",
          "Operational data steward.",
          "Clinical Data Governance",
        ),
        col(
          "source_systems",
          "list",
          "Pipe-separated source systems.",
          "Epic|Mirth|Clinical Data Lake",
        ),
        col(
          "critical_data_elements",
          "list",
          "Pipe-separated critical data elements.",
          "Encounter ID|Location|Provider ID",
        ),
        col(
          "classification",
          "enum",
          "Highest classification.",
          "Restricted",
          true,
          ["Public", "Internal", "Confidential", "Restricted"],
        ),
        col("quality_score", "number", "Quality score from 0 to 1.", "0.82"),
        col(
          "retention_policy",
          "string",
          "Retention policy or rule.",
          "Clinical retention schedule",
        ),
        col(
          "ai_use_allowed",
          "enum",
          "Whether this data can be used in AI workflows.",
          "Conditional",
          true,
          ["Allowed", "Conditional", "Prohibited", "Unknown"],
        ),
        col(
          "last_quality_review",
          "date",
          "Most recent quality review date.",
          "2026-04-15",
        ),
      ]),
    },
    {
      key: "risk_compliance_register",
      title: "Risk + Compliance Register",
      filenameBase: "15-risk-compliance-register",
      domain: "risk",
      description:
        "Internal risk, control, compliance, remediation, and evidence requirements.",
      sourceSystems: [
        "GRC",
        "Audit",
        "Security risk register",
        "Manual attestation",
      ],
      columns: withCommon([
        col(
          "risk_id",
          "string",
          "Stable risk or finding identifier.",
          "RISK-AI-003",
          true,
        ),
        col(
          "risk_title",
          "string",
          "Risk or finding title.",
          "AI routing model lacks monthly drift attestation",
          true,
        ),
        col("risk_type", "enum", "Risk type.", "AI Governance", true, [
          "Operational",
          "Security",
          "Privacy",
          "Compliance",
          "Financial",
          "AI Governance",
          "Vendor",
        ]),
        col(
          "control_id",
          "string",
          "Linked control identifier.",
          "CTRL-AI-MONITORING",
        ),
        col("policy_id", "string", "Linked policy identifier.", "POL-AI-002"),
        col("owner", "string", "Risk owner.", "AI Governance Council", true),
        col("severity", "enum", "Risk severity.", "High", true, [
          "Low",
          "Medium",
          "High",
          "Critical",
        ]),
        col("likelihood", "enum", "Likelihood.", "Medium", true, [
          "Low",
          "Medium",
          "High",
        ]),
        col("status", "enum", "Risk status.", "Open", true, [
          "Open",
          "Mitigating",
          "Accepted",
          "Closed",
        ]),
        col(
          "linked_ci_ids",
          "list",
          "Pipe-separated linked CI identifiers.",
          "CI-SVC-CONTACT-CENTER|CI-APP-CRM",
        ),
        col(
          "linked_vendor_ids",
          "list",
          "Pipe-separated linked vendor identifiers.",
          "VEN-GENESYS|VEN-SALESFORCE",
        ),
        col(
          "remediation_due_date",
          "date",
          "Remediation due date.",
          "2026-08-31",
        ),
        col(
          "evidence_required",
          "string",
          "Evidence required to close or downgrade the risk.",
          "Monthly model performance and drift report",
        ),
      ]),
    },
  ] as const;
