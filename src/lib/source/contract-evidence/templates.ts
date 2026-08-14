import type {
  SourceContractEvidenceArchetypeKey,
  SourceContractEvidenceTemplate,
  SourceContractEvidenceTemplatePack,
} from "./types";

const baselineColumns = [
  {
    key: "contract_name",
    label: "Contract name",
    valueType: "text" as const,
    required: true,
    description: "Name of the agreement or SOW being optimized.",
    example: "Enterprise Shared Services AMS MSA",
  },
  {
    key: "incumbent_vendor",
    label: "Incumbent vendor",
    valueType: "text" as const,
    required: true,
    description: "Vendor currently delivering the service.",
    example: "Vendor A",
  },
  {
    key: "annual_run_rate_usd",
    label: "Annual run rate USD",
    valueType: "currency" as const,
    required: true,
    description: "Current annualized managed-services run cost.",
    example: "15400000",
  },
  {
    key: "term_end",
    label: "Term end",
    valueType: "date" as const,
    required: true,
    description: "Current contract or SOW end date.",
    example: "2027-03-31",
  },
  {
    key: "renewal_notice_date",
    label: "Renewal notice date",
    valueType: "date" as const,
    required: true,
    description: "Last practical notice date before auto-renewal or leverage loss.",
    example: "2026-09-30",
  },
];

export const CONTRACT_EVIDENCE_TEMPLATES: SourceContractEvidenceTemplate[] = [
  {
    family: "contract_baseline",
    sheetName: "Contract Baseline",
    fileName: "contract-baseline.csv",
    required: true,
    purpose: "Anchor the current contract, run rate, renewal date, and decision posture.",
    sourceGuidance: "Pull from CLM / contract repository such as Icertis, Ironclad, DocuSign CLM, Agiloft, Conga, or the controlled SharePoint contract library. Map contract name, vendor, run rate, term end, and notice date from the executed agreement, SOW, order form, pricing schedule, and renewal calendar.",
    notFor: "Do not paste the full contract body here; attach it separately as an artifact.",
    columns: baselineColumns,
  },
  {
    family: "invoice_summary",
    sheetName: "Invoice Summary",
    fileName: "invoice-summary.csv",
    required: true,
    purpose: "Summarize billed run cost by period and category so Source can detect spend drift.",
    sourceGuidance: "Pull from AP / ERP / invoice systems such as SAP S/4HANA, Oracle Fusion, Workday Financials, NetSuite, Coupa Invoice, or Ariba Invoice. Map month, category, contracted amount, invoiced amount, and variance reason from invoice register, PO match, GL coding, accrual summary, and contract baseline.",
    notFor: "Not a raw invoice dump; aggregate by month/category unless an exception needs detail.",
    columns: [
      { key: "month", label: "Month", valueType: "date", required: true, description: "Month or period start.", example: "2026-03-01" },
      { key: "category", label: "Category", valueType: "text", required: true, description: "Run, project, pass-through, change order, credit, or other.", example: "Run" },
      { key: "contracted_amount_usd", label: "Contracted amount USD", valueType: "currency", required: true, description: "Expected contract baseline for the period.", example: "1250000" },
      { key: "invoiced_amount_usd", label: "Invoiced amount USD", valueType: "currency", required: true, description: "Amount invoiced for the same period/category.", example: "1325000" },
      { key: "variance_reason", label: "Variance reason", valueType: "text", required: false, description: "Known explanation for variance.", example: "After-hours support uplift" },
    ],
  },
  {
    family: "invoice_exception",
    sheetName: "Invoice Exceptions",
    fileName: "invoice-exceptions.csv",
    required: true,
    purpose: "Capture material invoice exceptions that can drive recovery or cure language.",
    sourceGuidance: "Pull from AP exception queues, Coupa/Ariba disputed invoice workflow, SAP/Oracle payment blocks, internal audit samples, or vendor-management issue trackers. Map exception id, month, vendor claim, supported amount, and issue from the invoice line, PO, payment status, and contract entitlement evidence.",
    notFor: "Not every line item; include decision-grade exceptions above the agreed threshold.",
    columns: [
      { key: "exception_id", label: "Exception ID", valueType: "text", required: true, description: "Client or audit identifier.", example: "INV-EX-1042" },
      { key: "month", label: "Month", valueType: "date", required: true, description: "Month or period of the exception.", example: "2026-03-01" },
      { key: "vendor_claim_usd", label: "Vendor claim USD", valueType: "currency", required: true, description: "Amount charged or claimed by vendor.", example: "96000" },
      { key: "supported_amount_usd", label: "Supported amount USD", valueType: "currency", required: true, description: "Amount supported by contract/evidence.", example: "42000" },
      { key: "issue", label: "Issue", valueType: "text", required: true, description: "Plain-English issue.", example: "Run work charged as change order" },
    ],
  },
  {
    family: "sla_performance",
    sheetName: "SLA Performance",
    fileName: "sla-performance.csv",
    required: true,
    purpose: "Show service commitment, actual performance, and whether remedies are meaningful.",
    sourceGuidance: "Pull from ServiceNow, Jira Service Management, PagerDuty, BMC Helix, vendor service-review decks, or observability tools such as Datadog, Splunk, Dynatrace, New Relic, CloudWatch, Azure Monitor, and GCP Operations. Map service level, target, actual, credit cap, and period from contract-governed SLA reports.",
    notFor: "Do not include every operational metric; include contract-governed SLAs.",
    columns: [
      { key: "service_level", label: "Service level", valueType: "text", required: true, description: "SLA name.", example: "P1 restoration" },
      { key: "target_pct", label: "Target %", valueType: "percent", required: true, description: "Contractual target.", example: "99" },
      { key: "actual_pct", label: "Actual %", valueType: "percent", required: true, description: "Actual measured performance.", example: "96.7" },
      { key: "credit_cap_pct", label: "Credit cap %", valueType: "percent", required: false, description: "Maximum monthly credit cap.", example: "5" },
      { key: "period", label: "Period", valueType: "date", required: true, description: "Period start.", example: "2026-03-01" },
    ],
  },
  {
    family: "ticket_volume",
    sheetName: "Usage / Demand Volumes",
    fileName: "usage-demand-volumes.csv",
    required: true,
    purpose: "Compare operating demand, usage, or entitlement consumption with the commercial baseline.",
    sourceGuidance: "Pull monthly aggregate exports from ServiceNow, Jira Service Management, PagerDuty, BMC Helix, SaaS admin consoles, cloud consumption exports, or the vendor operations dashboard. Map month, tower/SKU/service, baseline demand or entitlement, actual demand or usage, and variance signal from aggregate summaries, not raw ticket text or user-level activity.",
    notFor: "Do not upload sensitive ticket text, user-level activity, or individual user narratives.",
    columns: [
      { key: "month", label: "Month", valueType: "date", required: true, description: "Month or period start.", example: "2026-03-01" },
      { key: "demand_unit", label: "Demand unit", valueType: "text", required: true, description: "Service tower, queue, SKU, product, or consumption unit.", example: "Data Cloud Enterprise" },
      { key: "baseline_quantity", label: "Baseline quantity", valueType: "number", required: true, description: "Contracted baseline, entitlement, or expected monthly volume.", example: "28500" },
      { key: "actual_quantity", label: "Actual quantity", valueType: "number", required: true, description: "Actual monthly demand, usage, or active quantity.", example: "20697" },
      { key: "variance_signal", label: "Variance signal", valueType: "text", required: false, description: "Observed signal such as reclaim, rebalance, growth, or reopen-rate issue.", example: "reclaim_or_rebalance" },
    ],
  },
  {
    family: "staffing_model",
    sheetName: "Staffing Model",
    fileName: "staffing-model.csv",
    required: true,
    purpose: "Reconcile committed staffing/coverage to observed staffing reality.",
    sourceGuidance: "Pull role-level staffing evidence from vendor governance packs, Fieldglass / SAP Fieldglass, Beeline, Magnit, contract staffing schedules, or monthly service-review decks. Map tower, committed FTE, observed FTE, coverage, and location mix without employee names or IDs.",
    notFor: "Do not include personal employee data; roles, towers, and location mix are enough.",
    columns: [
      { key: "tower", label: "Tower", valueType: "text", required: true, description: "Service tower.", example: "Finance apps" },
      { key: "committed_fte", label: "Committed FTE", valueType: "number", required: true, description: "Committed staffing in contract or SOW.", example: "32" },
      { key: "observed_fte", label: "Observed FTE", valueType: "number", required: true, description: "Observed staffing from roster/governance report.", example: "28" },
      { key: "coverage", label: "Coverage", valueType: "text", required: true, description: "Coverage model.", example: "16x5 plus on-call" },
      { key: "location_mix", label: "Location mix", valueType: "text", required: false, description: "Onshore/offshore or region mix.", example: "30% onshore / 70% offshore" },
    ],
  },
  {
    family: "change_order",
    sheetName: "Change Orders",
    fileName: "change-orders.csv",
    required: true,
    purpose: "Separate true project change from recurring run work that should be normalized.",
    sourceGuidance: "Pull from CLM amendments, SOW/change-order register, Jira/ServiceNow project intake, SAP Ariba/Coupa change requests, or vendor governance packs. Map request id, category, amount, recurring flag, and approval evidence from the approved change record and billing tracker.",
    notFor: "Do not include unrelated transformation project detail unless it changes run baseline.",
    columns: [
      { key: "request_id", label: "Request ID", valueType: "text", required: true, description: "Change-order identifier.", example: "CO-2026-018" },
      { key: "category", label: "Category", valueType: "text", required: true, description: "Change category.", example: "Recurring support" },
      { key: "amount_usd", label: "Amount USD", valueType: "currency", required: true, description: "Change-order amount.", example: "84000" },
      { key: "recurring", label: "Recurring?", valueType: "boolean", required: true, description: "Whether the work repeats or should be catalogued.", example: "true" },
      { key: "approval_evidence", label: "Approval evidence", valueType: "text", required: false, description: "Complete, partial, or missing.", example: "partial" },
    ],
  },
  {
    family: "renewal_terms",
    sheetName: "Renewal Terms",
    fileName: "renewal-terms.csv",
    required: true,
    purpose: "Capture dates, notice windows, auto-renewal risks, and cure rights.",
    sourceGuidance: "Pull from CLM renewal metadata, legal clause summary, contract admin tracker, sourcing calendar, or vendor-management renewal register. Map term key, date, summary, and risk level from the renewal, cure, termination, notice, auto-renew, benchmark, and termination-assistance clauses.",
    notFor: "Not legal advice; this is sourcing timeline evidence for decision support.",
    columns: [
      { key: "term_key", label: "Term key", valueType: "text", required: true, description: "Renewal, cure, termination, or notice.", example: "non_renewal_notice" },
      { key: "date", label: "Date", valueType: "date", required: false, description: "Relevant date when applicable.", example: "2026-09-30" },
      { key: "summary", label: "Summary", valueType: "text", required: true, description: "Plain-English clause summary.", example: "Notice required 180 days before term end" },
      { key: "risk_level", label: "Risk level", valueType: "text", required: true, description: "Low, medium, or high.", example: "high" },
    ],
  },
  {
    family: "evidence_reference",
    sheetName: "Evidence References",
    fileName: "evidence-references.csv",
    required: false,
    purpose: "Map each extract back to source documents, exports, pages, tabs, or reports.",
    sourceGuidance: "For every extract above, capture the artifact filename or system report, page/sheet/cell/report section, report date, export run id, and owner role. Use Blob-backed document inventory for original files and keep this sheet as the lightweight citation map.",
    notFor: "Do not paste confidential raw content; cite where the evidence lives.",
    columns: [
      { key: "evidence_id", label: "Evidence ID", valueType: "text", required: true, description: "Stable reference id.", example: "EVID-SLA-MAR26" },
      { key: "source_file", label: "Source file", valueType: "text", required: true, description: "Filename or system report.", example: "March SLA Report.xlsx" },
      { key: "reference", label: "Reference", valueType: "text", required: true, description: "Page/sheet/cell/report section.", example: "SLA Summary!B4:F18" },
      { key: "owner_role", label: "Owner role", valueType: "text", required: false, description: "Business owner of evidence.", example: "Vendor management lead" },
    ],
  },
];

export const CONTRACT_EVIDENCE_TEMPLATE_PACKS: Record<
  SourceContractEvidenceArchetypeKey,
  SourceContractEvidenceTemplatePack
> = {
  ams_contract_optimization: {
    archetypeKey: "ams_contract_optimization",
    label: "AMS Contract Optimization Evidence Pack",
    purpose:
      "Collect the minimum evidence needed to decide whether to renew, renegotiate, cure, or rebid an application-managed-services contract.",
    operatingRule:
      "Use summarized extracts and citations. Full raw invoices, tickets, and contract files stay in the client's source systems or Blob-backed artifact cabinet.",
    templates: CONTRACT_EVIDENCE_TEMPLATES,
  },
  bpo_contract_optimization: {
    archetypeKey: "bpo_contract_optimization",
    label: "BPO Contract Optimization Evidence Pack",
    purpose:
      "Collect commercial, service, staffing, and volume evidence for business-process outsourcing optimization.",
    operatingRule:
      "Use the same minimum viable sourcing evidence model; tailor tower labels to the BPO process.",
    templates: CONTRACT_EVIDENCE_TEMPLATES,
  },
  saas_renewal_optimization: {
    archetypeKey: "saas_renewal_optimization",
    label: "SaaS Renewal Optimization Evidence Pack",
    purpose:
      "Collect renewal, usage, commercial, support, and risk evidence for SaaS renewal optimization.",
    operatingRule:
      "Use summarized license, usage, support, renewal, and exception extracts rather than raw user activity logs.",
    templates: CONTRACT_EVIDENCE_TEMPLATES.filter(
      (template) => template.family !== "staffing_model",
    ),
  },
};

export function getContractEvidenceTemplatePack(
  archetypeKey: SourceContractEvidenceArchetypeKey,
): SourceContractEvidenceTemplatePack {
  return CONTRACT_EVIDENCE_TEMPLATE_PACKS[archetypeKey];
}

export function getRequiredContractEvidenceFamilies(
  archetypeKey: SourceContractEvidenceArchetypeKey,
) {
  return getContractEvidenceTemplatePack(archetypeKey).templates
    .filter((template) => template.required)
    .map((template) => template.family);
}
