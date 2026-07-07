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
  currentStateFlow: [
    {
      id: "cs1",
      label: "Document arrival",
      actor: "Client service team",
      trigger: "Applicant submits L/C documents",
      systems: ["Email / courier intake"],
      dataSources: ["Unstructured PDF scans", "Email attachments"],
      handoff: "Operations mailbox routes work to a trade-finance officer",
      bottleneck: "No structured intake queue or telemetry",
      valueLeakage: "Work waits before an officer can even start review",
    },
    {
      id: "cs2",
      label: "Manual clause comparison",
      actor: "Trade-finance officer",
      systems: ["Trade Finance ops portal", "FIS IST/Profile core"],
      dataSources: ["L/C terms", "Presented documents", "UCP rules"],
      manualWork: "Officer reads clauses, compares terms, and keys findings",
      decision:
        "Does the document package comply or require exception handling?",
      delay: "Specialist review queues create cycle-time variance",
      missingTelemetry:
        "No reliable timestamped reason trail for why a discrepancy was found",
    },
    {
      id: "cs3",
      label: "Exception tracking and posting",
      actor: "Officer and financial-crime teams",
      systems: [
        "Manual exception tracking",
        "NICE Actimize",
        "FIS IST/Profile core",
      ],
      handoff:
        "Exceptions move through email/spreadsheets before AML screening and posting",
      controlGap:
        "Model-risk style lineage is absent because there is no model-controlled workflow",
      valueLeakage: "Rework and fragmented evidence raise cost per L/C",
    },
  ],
  gapsMap: [
    {
      id: "g1",
      observation:
        "Documents arrive through email/courier and are triaged manually.",
      gap: "The process lacks a governed intake layer and reliable queue telemetry.",
      designImplication:
        "Introduce structured intake, extraction, and event telemetry before any AI recommendation is trusted.",
    },
    {
      id: "g2",
      observation:
        "Clause comparison depends on officer memory and fragmented references.",
      gap: "There is no governed retrieval layer for L/C terms, UCP rules, and decision evidence.",
      designImplication:
        "Ground clause comparison in a governed corpus with traceable retrieval and citations.",
    },
    {
      id: "g3",
      observation:
        "Exceptions are assembled in spreadsheets and email threads.",
      gap: "Human approval exists, but the approval trail is not captured as a controlled decision system.",
      designImplication:
        "Put officer approval, model-risk validation, AML screening, and audit telemetry into the target flow.",
    },
  ],
  gapToTargetBridge: [
    {
      id: "b1",
      gapId: "g1",
      observation:
        "Documents arrive through email/courier and are triaged manually.",
      gap: "The process lacks a governed intake layer and reliable queue telemetry.",
      designImplication:
        "Introduce structured intake, extraction, and event telemetry before any AI recommendation is trusted.",
      targetCapability: "Event-driven document intake and extraction",
      architectureResponse:
        "Trade Finance workbench, API gateway, EventBridge, and the intake agent create a timestamped intake path.",
    },
    {
      id: "b2",
      gapId: "g2",
      observation:
        "Clause comparison depends on officer memory and fragmented references.",
      gap: "There is no governed retrieval layer for L/C terms, UCP rules, and decision evidence.",
      designImplication:
        "Ground clause comparison in a governed corpus with traceable retrieval and citations.",
      targetCapability: "Grounded AI-assisted clause comparison",
      architectureResponse:
        "Clause-comparison agent uses Databricks Vector Search, governed lakehouse data, and Bedrock model serving.",
    },
    {
      id: "b3",
      gapId: "g3",
      observation:
        "Exceptions are assembled in spreadsheets and email threads.",
      gap: "Human approval exists, but the approval trail is not captured as a controlled decision system.",
      designImplication:
        "Put officer approval, model-risk validation, AML screening, and audit telemetry into the target flow.",
      targetCapability: "Controlled exception decision workflow",
      architectureResponse:
        "Discrepancy agent routes exceptions to the workbench, model-risk control, AML control, and audit lineage.",
    },
  ],
  current: {
    title: "Current state (as-is)",
    thesis:
      "L/C processing is manual and mainframe-bound: documents arrive by email, officers compare clauses by hand, and exceptions are tracked in fragmented stores — slow, hard to evidence, and costly to scale.",
    nodes: [
      {
        id: "c_email",
        label: "Email / courier intake",
        kind: "channel",
        layer: "experience",
        status: "existing",
        note: "Unstructured L/C documents arrive ad hoc.",
      },
      {
        id: "c_portal",
        label: "Trade Finance ops portal",
        kind: "application",
        layer: "experience",
        status: "existing",
      },
      {
        id: "c_review",
        label: "Manual document review",
        kind: "application",
        layer: "application",
        status: "existing",
        note: "Officer reads, compares clauses, keys data.",
      },
      {
        id: "c_exc",
        label: "Manual exception tracking",
        kind: "application",
        layer: "application",
        status: "existing",
        note: "Spreadsheets / email threads.",
      },
      {
        id: "c_tf",
        label: "Trade Finance system",
        kind: "system",
        layer: "core_systems",
        status: "existing",
      },
      {
        id: "c_fis",
        label: "FIS IST/Profile core",
        kind: "system",
        layer: "core_systems",
        service: "FIS IST/Profile (mainframe)",
        status: "existing",
      },
      {
        id: "c_aml",
        label: "NICE Actimize",
        kind: "control",
        layer: "core_systems",
        service: "Actimize + Feedzai",
        status: "existing",
        note: "AML / fraud screening.",
      },
      {
        id: "c_data",
        label: "Fragmented data stores",
        kind: "data_store",
        layer: "data_platform",
        status: "existing",
        note: "Partial lakehouse; core data still on mainframe.",
      },
    ],
    flows: [
      {
        id: "cf1",
        from: "c_email",
        to: "c_review",
        kind: "data",
        label: "documents",
      },
      {
        id: "cf2",
        from: "c_review",
        to: "c_tf",
        kind: "data",
        label: "keyed data",
      },
      {
        id: "cf3",
        from: "c_review",
        to: "c_exc",
        kind: "data",
        label: "exceptions",
      },
      { id: "cf4", from: "c_tf", to: "c_fis", kind: "data", label: "postings" },
      {
        id: "cf5",
        from: "c_tf",
        to: "c_aml",
        kind: "event",
        label: "screening",
      },
    ],
  },
  target: {
    title: "Target state (to-be)",
    thesis:
      "An agentic workbench ingests L/C documents, an agent extracts and compares clauses against the terms and UCP rules, a discrepancy agent flags exceptions, and an officer approves — grounded in governed data and gated by model-risk and AML controls.",
    nodes: [
      {
        id: "t_wb",
        label: "Trade Finance workbench",
        kind: "channel",
        layer: "experience",
        status: "new",
        note: "Officer reviews AI findings, approves/overrides.",
      },
      {
        id: "t_orch",
        label: "L/C orchestrator agent",
        kind: "agent",
        layer: "agentic",
        status: "new",
        note: "Routes the document through the agent pipeline.",
      },
      {
        id: "t_intake",
        label: "Intake & extraction agent",
        kind: "agent",
        layer: "agentic",
        status: "new",
      },
      {
        id: "t_clause",
        label: "Clause-comparison agent",
        kind: "agent",
        layer: "agentic",
        status: "new",
        note: "Compares against L/C terms + UCP 600.",
      },
      {
        id: "t_disc",
        label: "Discrepancy / exception agent",
        kind: "agent",
        layer: "agentic",
        status: "new",
      },
      {
        id: "t_docai",
        label: "Document AI service",
        kind: "service",
        layer: "application",
        service: "Amazon Textract + Bedrock",
        provider: "aws",
        status: "new",
      },
      {
        id: "t_model",
        label: "Foundation model serving",
        kind: "model",
        layer: "application",
        service: "Amazon Bedrock (Claude)",
        provider: "aws",
        status: "new",
      },
      {
        id: "t_lake",
        label: "Lakehouse",
        kind: "data_store",
        layer: "data_platform",
        service: "Databricks on AWS",
        provider: "aws",
        status: "new",
        note: "The bank's set target platform.",
      },
      {
        id: "t_mart",
        label: "Finance mart",
        kind: "data_store",
        layer: "data_platform",
        service: "Snowflake",
        provider: "saas",
        status: "new",
      },
      {
        id: "t_vec",
        label: "Retrieval / vector index",
        kind: "data_store",
        layer: "data_platform",
        service: "Databricks Vector Search",
        provider: "aws",
        status: "new",
        note: "Grounds clause comparison in governed terms + rules.",
      },
      {
        id: "t_bus",
        label: "Event bus",
        kind: "integration",
        layer: "integration",
        service: "Amazon EventBridge",
        provider: "aws",
        status: "new",
        note: "Document-arrival events drive the pipeline.",
      },
      {
        id: "t_api",
        label: "API gateway",
        kind: "integration",
        layer: "integration",
        service: "Amazon API Gateway",
        provider: "aws",
        status: "new",
      },
      {
        id: "t_tf",
        label: "Trade Finance system",
        kind: "system",
        layer: "core_systems",
        status: "changed",
        note: "Integrated via API — not replaced.",
      },
      {
        id: "t_fis",
        label: "FIS IST/Profile core",
        kind: "system",
        layer: "core_systems",
        service: "FIS IST/Profile (mainframe)",
        status: "existing",
      },
      {
        id: "t_mrisk",
        label: "Model-risk control",
        kind: "control",
        layer: "core_systems",
        status: "new",
        note: "SR 11-7 validation + monitoring.",
      },
      {
        id: "t_aml",
        label: "AML / fraud control",
        kind: "control",
        layer: "core_systems",
        service: "Actimize + Feedzai",
        status: "existing",
      },
      {
        id: "t_infra",
        label: "AWS landing zone",
        kind: "external",
        layer: "infrastructure",
        service: "AWS (VPC, IAM, KMS, CloudTrail)",
        provider: "aws",
        status: "new",
        note: "Security, lineage, observability.",
      },
    ],
    flows: [
      {
        id: "tf1",
        from: "t_wb",
        to: "t_api",
        kind: "data",
        label: "document upload",
      },
      {
        id: "tf2",
        from: "t_bus",
        to: "t_orch",
        kind: "event",
        label: "document arrived",
      },
      {
        id: "tf3",
        from: "t_orch",
        to: "t_intake",
        kind: "control",
        label: "extract",
      },
      {
        id: "tf4",
        from: "t_intake",
        to: "t_docai",
        kind: "control",
        label: "OCR + parse",
      },
      {
        id: "tf5",
        from: "t_orch",
        to: "t_clause",
        kind: "control",
        label: "compare clauses",
      },
      {
        id: "tf6",
        from: "t_clause",
        to: "t_vec",
        kind: "data",
        label: "retrieve terms + UCP rules",
      },
      {
        id: "tf7",
        from: "t_orch",
        to: "t_disc",
        kind: "control",
        label: "flag discrepancies",
      },
      {
        id: "tf8",
        from: "t_disc",
        to: "t_wb",
        kind: "human_approval",
        label: "officer reviews exception",
      },
      {
        id: "tf9",
        from: "t_wb",
        to: "t_tf",
        kind: "data",
        label: "approved posting",
      },
      {
        id: "tf10",
        from: "t_tf",
        to: "t_fis",
        kind: "data",
        label: "core update",
      },
      {
        id: "tf11",
        from: "t_disc",
        to: "t_aml",
        kind: "event",
        label: "AML screening",
      },
      {
        id: "tf12",
        from: "t_clause",
        to: "t_mrisk",
        kind: "control",
        label: "model-risk check",
      },
      {
        id: "tf13",
        from: "t_lake",
        to: "t_vec",
        kind: "data",
        label: "governed corpus",
      },
    ],
  },
  architectureLevels: {
    conceptual: {
      title: "Target conceptual architecture",
      thesis:
        "The business design is a governed decision system: intake, context enrichment, AI recommendation, officer approval, system action, and value telemetry.",
      soWhat:
        "First Capital can debate the operating capabilities and control points before committing to platform build choices.",
      nodes: [
        {
          id: "co_intake",
          label: "Sense: document intake",
          kind: "channel",
          layer: "experience",
          status: "new",
        },
        {
          id: "co_context",
          label: "Context: terms + UCP rules",
          kind: "data_store",
          layer: "data_platform",
          status: "new",
        },
        {
          id: "co_recommend",
          label: "Recommend: AI discrepancy finding",
          kind: "agent",
          layer: "agentic",
          status: "new",
        },
        {
          id: "co_approve",
          label: "Approve: officer judgment",
          kind: "control",
          layer: "core_systems",
          status: "new",
        },
        {
          id: "co_act",
          label: "Act: core posting",
          kind: "system",
          layer: "core_systems",
          status: "changed",
        },
        {
          id: "co_measure",
          label: "Measure: lineage + value",
          kind: "control",
          layer: "infrastructure",
          status: "new",
        },
      ],
      flows: [
        {
          id: "cof1",
          from: "co_intake",
          to: "co_context",
          kind: "data",
          label: "documents + terms",
        },
        {
          id: "cof2",
          from: "co_context",
          to: "co_recommend",
          kind: "control",
          label: "grounded recommendation",
        },
        {
          id: "cof3",
          from: "co_recommend",
          to: "co_approve",
          kind: "human_approval",
          label: "exception approval",
        },
        {
          id: "cof4",
          from: "co_approve",
          to: "co_act",
          kind: "data",
          label: "approved action",
        },
        {
          id: "cof5",
          from: "co_act",
          to: "co_measure",
          kind: "event",
          label: "audit + value telemetry",
        },
      ],
    },
    logical: {
      title: "Target logical architecture",
      thesis:
        "Logical components separate intake, orchestration, retrieval, model serving, exception assembly, approval, and system integration.",
      soWhat:
        "The design is testable by component and keeps AI control flow separate from data movement.",
      nodes: [
        {
          id: "lo_workbench",
          label: "Officer workbench",
          kind: "channel",
          layer: "experience",
          status: "new",
        },
        {
          id: "lo_api",
          label: "API facade",
          kind: "integration",
          layer: "integration",
          status: "new",
        },
        {
          id: "lo_orch",
          label: "Agent orchestrator",
          kind: "agent",
          layer: "agentic",
          status: "new",
        },
        {
          id: "lo_extract",
          label: "Extraction service",
          kind: "service",
          layer: "application",
          status: "new",
        },
        {
          id: "lo_retrieve",
          label: "Retrieval service",
          kind: "data_store",
          layer: "data_platform",
          status: "new",
        },
        {
          id: "lo_model",
          label: "Model serving",
          kind: "model",
          layer: "application",
          status: "new",
        },
        {
          id: "lo_controls",
          label: "Risk / AML controls",
          kind: "control",
          layer: "core_systems",
          status: "new",
        },
        {
          id: "lo_core",
          label: "Trade Finance core",
          kind: "system",
          layer: "core_systems",
          status: "changed",
        },
      ],
      flows: [
        {
          id: "lof1",
          from: "lo_workbench",
          to: "lo_api",
          kind: "data",
          label: "document package",
        },
        {
          id: "lof2",
          from: "lo_api",
          to: "lo_orch",
          kind: "event",
          label: "case event",
        },
        {
          id: "lof3",
          from: "lo_orch",
          to: "lo_extract",
          kind: "control",
          label: "extract",
        },
        {
          id: "lof4",
          from: "lo_orch",
          to: "lo_retrieve",
          kind: "data",
          label: "retrieve evidence",
        },
        {
          id: "lof5",
          from: "lo_orch",
          to: "lo_model",
          kind: "control",
          label: "reason over clauses",
        },
        {
          id: "lof6",
          from: "lo_model",
          to: "lo_controls",
          kind: "control",
          label: "validate / screen",
        },
        {
          id: "lof7",
          from: "lo_workbench",
          to: "lo_core",
          kind: "human_approval",
          label: "approved posting",
        },
      ],
    },
    physical: {
      title: "Target physical / deployment architecture",
      thesis:
        "The physical design uses the bank's AWS/Databricks target estate with tenant boundary, identity, encryption, audit logging, and mainframe integration explicitly shown.",
      soWhat:
        "Architecture leadership can see the deployment/control boundary and the integration points that must be approved before build.",
      nodes: [
        {
          id: "ph_vpc",
          label: "AWS landing zone",
          kind: "external",
          layer: "infrastructure",
          service: "VPC, IAM, KMS, CloudTrail",
          provider: "aws",
          status: "new",
        },
        {
          id: "ph_api",
          label: "Amazon API Gateway",
          kind: "integration",
          layer: "integration",
          service: "API Gateway",
          provider: "aws",
          status: "new",
        },
        {
          id: "ph_bus",
          label: "Amazon EventBridge",
          kind: "integration",
          layer: "integration",
          service: "EventBridge",
          provider: "aws",
          status: "new",
        },
        {
          id: "ph_docai",
          label: "Textract + Bedrock",
          kind: "service",
          layer: "application",
          service: "Amazon Textract + Bedrock",
          provider: "aws",
          status: "new",
        },
        {
          id: "ph_dbx",
          label: "Databricks on AWS",
          kind: "data_store",
          layer: "data_platform",
          service: "Databricks + Vector Search",
          provider: "aws",
          status: "new",
        },
        {
          id: "ph_sf",
          label: "Snowflake finance mart",
          kind: "data_store",
          layer: "data_platform",
          service: "Snowflake",
          provider: "saas",
          status: "new",
        },
        {
          id: "ph_fis",
          label: "FIS IST/Profile",
          kind: "system",
          layer: "core_systems",
          service: "Mainframe core",
          status: "existing",
        },
        {
          id: "ph_controls",
          label: "Actimize / Feedzai / MRM",
          kind: "control",
          layer: "core_systems",
          service: "AML + model-risk controls",
          status: "existing",
        },
      ],
      flows: [
        {
          id: "phf1",
          from: "ph_api",
          to: "ph_bus",
          kind: "event",
          label: "case created",
        },
        {
          id: "phf2",
          from: "ph_bus",
          to: "ph_docai",
          kind: "control",
          label: "parse / reason",
        },
        {
          id: "phf3",
          from: "ph_docai",
          to: "ph_dbx",
          kind: "data",
          label: "evidence + embeddings",
        },
        {
          id: "phf4",
          from: "ph_docai",
          to: "ph_controls",
          kind: "control",
          label: "risk checks",
        },
        {
          id: "phf5",
          from: "ph_api",
          to: "ph_fis",
          kind: "data",
          label: "approved posting",
        },
        {
          id: "phf6",
          from: "ph_dbx",
          to: "ph_sf",
          kind: "data",
          label: "value telemetry",
        },
        {
          id: "phf7",
          from: "ph_vpc",
          to: "ph_api",
          kind: "control",
          label: "identity / encryption / audit",
        },
      ],
    },
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
      humanInLoop:
        "Trade-finance officer approves, overrides, or rejects every exception",
    },
  ],
  patterns: [
    {
      id: "p1",
      name: "RAG (grounded clause comparison)",
      appliesTo: ["t_clause", "t_vec"],
      implication:
        "Comparisons cite the actual L/C terms and UCP rules — auditable, not a black box.",
    },
    {
      id: "p2",
      name: "Tool-use",
      appliesTo: ["t_intake", "t_disc"],
      implication:
        "Agents call governed systems (document AI, trade-finance system) rather than hold private state.",
    },
    {
      id: "p3",
      name: "Multi-agent orchestration",
      appliesTo: ["t_orch"],
      implication:
        "Each step is a bounded, testable agent — easier to validate for model risk.",
    },
    {
      id: "p4",
      name: "Event-driven",
      appliesTo: ["t_bus"],
      implication:
        "Document arrival drives the pipeline; throughput scales without adding headcount.",
    },
    {
      id: "p5",
      name: "Human-in-the-loop",
      appliesTo: ["t_wb", "t_disc"],
      implication:
        "No exception clears without an officer — control and accountability preserved.",
    },
  ],
  controlPoints: [
    {
      id: "k1",
      label: "SR 11-7 model risk",
      what: "Every model decision is validated, versioned, and monitored.",
      owner: "Model Risk Management",
    },
    {
      id: "k2",
      label: "BSA/AML screening",
      what: "Discrepancies route through Actimize/Feedzai before posting.",
      owner: "Financial Crime",
    },
    {
      id: "k3",
      label: "Officer approval gate",
      what: "Exceptions require human approval; AI never auto-clears a discrepancy.",
      owner: "Trade Finance Ops",
    },
    {
      id: "k4",
      label: "Lineage & audit",
      what: "Every extraction, comparison, and decision is logged with its evidence.",
      owner: "Architecture / Risk",
    },
  ],
  waves: [
    {
      id: "w1",
      label: "Wave 1 — Foundation",
      window: "0–90 days",
      scope: ["t_lake", "t_vec", "t_intake", "t_wb"],
      outcome:
        "Documents ingested and extracted; officer workbench live in shadow mode.",
    },
    {
      id: "w2",
      label: "Wave 2 — Comparison & exceptions",
      window: "3–6 months",
      scope: ["t_clause", "t_disc", "t_mrisk"],
      outcome:
        "AI-assisted clause comparison and exception assembly, officer-approved.",
    },
    {
      id: "w3",
      label: "Wave 3 — Scale & straight-through",
      window: "6–12 months",
      scope: ["t_orch", "t_bus", "t_aml"],
      outcome:
        "Low-risk cases flow straight through with controls hardened; throughput scales.",
    },
  ],
  exhibitPlan: [
    {
      id: "current_state_operating_flow",
      title: "Current-state operating flow",
      soWhat:
        "The current bottleneck is not one task; it is the unsupported chain from intake to exception approval.",
      decisionImplication:
        "Approve fixing the decision system, not just automating OCR.",
    },
    {
      id: "current_state_system_data_flow",
      title: "Current-state system/data flow",
      soWhat:
        "Data moves through manual handoffs before it becomes a controlled system record.",
      decisionImplication:
        "Target architecture must add structured intake and evidence lineage before AI recommendations.",
    },
    {
      id: "current_state_gaps_map",
      title: "Current-state gaps map",
      soWhat: "Each observed gap translates into a specific target capability.",
      decisionImplication: "Use the gaps as build acceptance criteria.",
    },
    {
      id: "target_conceptual_architecture",
      title: "Target conceptual architecture",
      soWhat:
        "The solution is a governed decision loop, not an isolated model.",
      decisionImplication: "Align first on capabilities and control points.",
    },
    {
      id: "target_logical_architecture",
      title: "Target logical architecture",
      soWhat:
        "The component model separates data movement from AI control flow.",
      decisionImplication:
        "Approve component ownership and integration contracts.",
    },
    {
      id: "target_physical_deployment",
      title: "Target physical / deployment architecture",
      soWhat:
        "The physical design stays inside the bank's AWS/Databricks target estate while integrating the FIS core.",
      decisionImplication:
        "Approve the deployment boundary, identity model, and mainframe integration path.",
    },
    {
      id: "end_to_end_data_flow",
      title: "End-to-end data flow",
      soWhat:
        "Document, term, retrieval, approval, and posting data flows are visible end to end.",
      decisionImplication:
        "Validate where lineage must be captured for audit and value measurement.",
    },
    {
      id: "ai_recommendation_control_flow",
      title: "AI recommendation & decision-control flow",
      soWhat:
        "AI recommends and assembles exceptions; officers approve the controlled decision.",
      decisionImplication:
        "Decide which exceptions can be AI-recommended in the pilot.",
    },
    {
      id: "human_approval_override_model",
      title: "Human approval / override model",
      soWhat:
        "The officer remains accountable for low-confidence and exception decisions.",
      decisionImplication:
        "Approve the human-in-the-loop threshold and override policy.",
    },
    {
      id: "integration_map",
      title: "Integration map",
      soWhat:
        "The design adds integration rails around the core rather than replacing it.",
      decisionImplication: "Prioritize API and event contracts early.",
    },
    {
      id: "governance_audit_telemetry_flow",
      title: "Governance, audit, and telemetry flow",
      soWhat:
        "Risk, AML, lineage, and value telemetry are part of the workflow.",
      decisionImplication:
        "Make telemetry and model-risk evidence non-negotiable build scope.",
    },
    {
      id: "implementation_waves",
      title: "Implementation waves",
      soWhat:
        "The waves de-risk by proving intake and evidence first, then comparison, then scale.",
      decisionImplication:
        "Fund Wave 1 as a controlled proof, not a full transformation bet.",
    },
    {
      id: "architecture_decision_log",
      title: "Architecture decision log",
      soWhat:
        "The key decisions are explicit enough for an architecture review board.",
      decisionImplication:
        "Resolve deployment, approval, and integration decisions before build starts.",
    },
  ],
  decisionLog: [
    {
      id: "d1",
      decision:
        "Should AI be allowed to auto-clear L/C exceptions in the pilot?",
      recommendation:
        "No — AI may recommend and assemble evidence, but officers approve every exception.",
      rationale:
        "The bank needs SR 11-7 evidence, AML alignment, and operational confidence before widening automation.",
      status: "recommended",
    },
    {
      id: "d2",
      decision: "Should the target replace the FIS core?",
      recommendation: "No — integrate via governed APIs and postings.",
      rationale:
        "The value case is trapped in review and exception handling, not core replacement.",
      status: "recommended",
    },
    {
      id: "d3",
      decision: "Which telemetry is mandatory for build approval?",
      recommendation:
        "Capture intake timestamps, retrieval evidence, model version, officer action, override reason, AML screening, and posting outcome.",
      rationale:
        "Without telemetry, the pilot cannot prove cycle-time, risk, or control value.",
      status: "open",
    },
  ],
  openInputs: [
    "Annual L/C volume",
    "Manual touch time per L/C",
    "Average cycle time (receipt to decision)",
    "Discrepancy rate",
    "Current fully-loaded unit cost per L/C",
  ],
};
