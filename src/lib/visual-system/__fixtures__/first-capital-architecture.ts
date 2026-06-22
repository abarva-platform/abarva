// First Capital — AI Trade Finance L/C Automation — sample ArchitectureModel.
//
// Grounded in the First Capital V4 substrate (FIS IST/Profile mainframe core,
// NICE Actimize + Feedzai, partial lakehouse → Databricks-on-AWS + Snowflake
// target, SR 11-7 / BSA-AML regulatory anchors). The cloud (AWS) and named
// services come from the bank's SOLUTIONED target — not a predetermined default.
//
// Used by the renderer test and as the golden architecture exhibit.

import type { ArchitectureModel } from "../architecture-model";

export const FIRST_CAPITAL_ARCHITECTURE: ArchitectureModel = {
  engagement: "AI Trade Finance Letter-of-Credit Automation",
  client: "First Capital Financial",
  decisionHeadline:
    "Approve an AI-assisted L/C processing design that automates document review and discrepancy detection while keeping a trade-finance officer on every exception — built on the bank's existing AWS/Databricks target, not a new platform.",
  provenanceNote:
    "Cloud and services below reflect the solution we designed against First Capital's own target estate (Databricks on AWS + Snowflake finance mart, FIS core integrated not replaced). A different solution would render different providers here.",
  current: {
    title: "Current state (as-is)",
    thesis:
      "L/C processing is manual and mainframe-bound: documents arrive by email, officers compare clauses by hand, and exceptions are tracked in fragmented stores — slow, hard to evidence, and costly to scale.",
    nodes: [
      { id: "c_email", label: "Email / courier intake", kind: "channel", layer: "experience", status: "existing", note: "Unstructured L/C documents arrive ad hoc." },
      { id: "c_portal", label: "Trade Finance ops portal", kind: "application", layer: "experience", status: "existing" },
      { id: "c_review", label: "Manual document review", kind: "application", layer: "application", status: "existing", note: "Officer reads, compares clauses, keys data." },
      { id: "c_exc", label: "Manual exception tracking", kind: "application", layer: "application", status: "existing", note: "Spreadsheets / email threads." },
      { id: "c_tf", label: "Trade Finance system", kind: "system", layer: "core_systems", status: "existing" },
      { id: "c_fis", label: "FIS IST/Profile core", kind: "system", layer: "core_systems", service: "FIS IST/Profile (mainframe)", status: "existing" },
      { id: "c_aml", label: "NICE Actimize", kind: "control", layer: "core_systems", service: "Actimize + Feedzai", status: "existing", note: "AML / fraud screening." },
      { id: "c_data", label: "Fragmented data stores", kind: "data_store", layer: "data_platform", status: "existing", note: "Partial lakehouse; core data still on mainframe." },
    ],
    flows: [
      { id: "cf1", from: "c_email", to: "c_review", kind: "data", label: "documents" },
      { id: "cf2", from: "c_review", to: "c_tf", kind: "data", label: "keyed data" },
      { id: "cf3", from: "c_review", to: "c_exc", kind: "data", label: "exceptions" },
      { id: "cf4", from: "c_tf", to: "c_fis", kind: "data", label: "postings" },
      { id: "cf5", from: "c_tf", to: "c_aml", kind: "event", label: "screening" },
    ],
  },
  target: {
    title: "Target state (to-be)",
    thesis:
      "An agentic workbench ingests L/C documents, an agent extracts and compares clauses against the terms and UCP rules, a discrepancy agent flags exceptions, and an officer approves — grounded in governed data and gated by model-risk and AML controls.",
    nodes: [
      { id: "t_wb", label: "Trade Finance workbench", kind: "channel", layer: "experience", status: "new", note: "Officer reviews AI findings, approves/overrides." },
      { id: "t_orch", label: "L/C orchestrator agent", kind: "agent", layer: "agentic", status: "new", note: "Routes the document through the agent pipeline." },
      { id: "t_intake", label: "Intake & extraction agent", kind: "agent", layer: "agentic", status: "new" },
      { id: "t_clause", label: "Clause-comparison agent", kind: "agent", layer: "agentic", status: "new", note: "Compares against L/C terms + UCP 600." },
      { id: "t_disc", label: "Discrepancy / exception agent", kind: "agent", layer: "agentic", status: "new" },
      { id: "t_docai", label: "Document AI service", kind: "service", layer: "application", service: "Amazon Textract + Bedrock", provider: "aws", status: "new" },
      { id: "t_model", label: "Foundation model serving", kind: "model", layer: "application", service: "Amazon Bedrock (Claude)", provider: "aws", status: "new" },
      { id: "t_lake", label: "Lakehouse", kind: "data_store", layer: "data_platform", service: "Databricks on AWS", provider: "aws", status: "new", note: "The bank's set target platform." },
      { id: "t_mart", label: "Finance mart", kind: "data_store", layer: "data_platform", service: "Snowflake", provider: "saas", status: "new" },
      { id: "t_vec", label: "Retrieval / vector index", kind: "data_store", layer: "data_platform", service: "Databricks Vector Search", provider: "aws", status: "new", note: "Grounds clause comparison in governed terms + rules." },
      { id: "t_bus", label: "Event bus", kind: "integration", layer: "integration", service: "Amazon EventBridge", provider: "aws", status: "new", note: "Document-arrival events drive the pipeline." },
      { id: "t_api", label: "API gateway", kind: "integration", layer: "integration", service: "Amazon API Gateway", provider: "aws", status: "new" },
      { id: "t_tf", label: "Trade Finance system", kind: "system", layer: "core_systems", status: "changed", note: "Integrated via API — not replaced." },
      { id: "t_fis", label: "FIS IST/Profile core", kind: "system", layer: "core_systems", service: "FIS IST/Profile (mainframe)", status: "existing" },
      { id: "t_mrisk", label: "Model-risk control", kind: "control", layer: "core_systems", status: "new", note: "SR 11-7 validation + monitoring." },
      { id: "t_aml", label: "AML / fraud control", kind: "control", layer: "core_systems", service: "Actimize + Feedzai", status: "existing" },
      { id: "t_infra", label: "AWS landing zone", kind: "external", layer: "infrastructure", service: "AWS (VPC, IAM, KMS, CloudTrail)", provider: "aws", status: "new", note: "Security, lineage, observability." },
    ],
    flows: [
      { id: "tf1", from: "t_wb", to: "t_api", kind: "data", label: "document upload" },
      { id: "tf2", from: "t_bus", to: "t_orch", kind: "event", label: "document arrived" },
      { id: "tf3", from: "t_orch", to: "t_intake", kind: "control", label: "extract" },
      { id: "tf4", from: "t_intake", to: "t_docai", kind: "control", label: "OCR + parse" },
      { id: "tf5", from: "t_orch", to: "t_clause", kind: "control", label: "compare clauses" },
      { id: "tf6", from: "t_clause", to: "t_vec", kind: "data", label: "retrieve terms + UCP rules" },
      { id: "tf7", from: "t_orch", to: "t_disc", kind: "control", label: "flag discrepancies" },
      { id: "tf8", from: "t_disc", to: "t_wb", kind: "human_approval", label: "officer reviews exception" },
      { id: "tf9", from: "t_wb", to: "t_tf", kind: "data", label: "approved posting" },
      { id: "tf10", from: "t_tf", to: "t_fis", kind: "data", label: "core update" },
      { id: "tf11", from: "t_disc", to: "t_aml", kind: "event", label: "AML screening" },
      { id: "tf12", from: "t_clause", to: "t_mrisk", kind: "control", label: "model-risk check" },
      { id: "tf13", from: "t_lake", to: "t_vec", kind: "data", label: "governed corpus" },
    ],
  },
  agentic: [
    {
      agentId: "t_intake",
      role: "Extracts structured fields from unstructured L/C documents",
      callsTools: ["t_docai"],
      grounding: ["t_lake"],
      guardrails: ["t_mrisk"],
    },
    {
      agentId: "t_clause",
      role: "Compares presented documents against L/C terms and UCP 600 rules",
      callsTools: ["t_model"],
      grounding: ["t_vec"],
      guardrails: ["t_mrisk"],
      humanInLoop: "Officer confirms any low-confidence clause match",
    },
    {
      agentId: "t_disc",
      role: "Identifies discrepancies and assembles the exception for review",
      callsTools: ["t_model", "t_tf"],
      grounding: ["t_vec"],
      guardrails: ["t_aml", "t_mrisk"],
      humanInLoop: "Trade-finance officer approves, overrides, or rejects every exception",
    },
  ],
  patterns: [
    { id: "p1", name: "RAG (grounded clause comparison)", appliesTo: ["t_clause", "t_vec"], implication: "Comparisons cite the actual L/C terms and UCP rules — auditable, not a black box." },
    { id: "p2", name: "Tool-use", appliesTo: ["t_intake", "t_disc"], implication: "Agents call governed systems (document AI, trade-finance system) rather than hold private state." },
    { id: "p3", name: "Multi-agent orchestration", appliesTo: ["t_orch"], implication: "Each step is a bounded, testable agent — easier to validate for model risk." },
    { id: "p4", name: "Event-driven", appliesTo: ["t_bus"], implication: "Document arrival drives the pipeline; throughput scales without adding headcount." },
    { id: "p5", name: "Human-in-the-loop", appliesTo: ["t_wb", "t_disc"], implication: "No exception clears without an officer — control and accountability preserved." },
  ],
  controlPoints: [
    { id: "k1", label: "SR 11-7 model risk", what: "Every model decision is validated, versioned, and monitored.", owner: "Model Risk Management" },
    { id: "k2", label: "BSA/AML screening", what: "Discrepancies route through Actimize/Feedzai before posting.", owner: "Financial Crime" },
    { id: "k3", label: "Officer approval gate", what: "Exceptions require human approval; AI never auto-clears a discrepancy.", owner: "Trade Finance Ops" },
    { id: "k4", label: "Lineage & audit", what: "Every extraction, comparison, and decision is logged with its evidence.", owner: "Architecture / Risk" },
  ],
  waves: [
    { id: "w1", label: "Wave 1 — Foundation", window: "0–90 days", scope: ["t_lake", "t_vec", "t_intake", "t_wb"], outcome: "Documents ingested and extracted; officer workbench live in shadow mode." },
    { id: "w2", label: "Wave 2 — Comparison & exceptions", window: "3–6 months", scope: ["t_clause", "t_disc", "t_mrisk"], outcome: "AI-assisted clause comparison and exception assembly, officer-approved." },
    { id: "w3", label: "Wave 3 — Scale & straight-through", window: "6–12 months", scope: ["t_orch", "t_bus", "t_aml"], outcome: "Low-risk cases flow straight through with controls hardened; throughput scales." },
  ],
  openInputs: [
    "Annual L/C volume",
    "Manual touch time per L/C",
    "Average cycle time (receipt to decision)",
    "Discrepancy rate",
    "Current fully-loaded unit cost per L/C",
  ],
};
