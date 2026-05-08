// deliverable-registry.ts
//
// Master registry of all deliverable documents produced during a program lifecycle.
// Each entry is ONE document — a single, purposeful artifact with a defined
// audience, format, and set of required sections.
//
// Design principles:
//   • One document per audience/purpose — never bundle CXO narrative with
//     engineering spec or finance model in the same file
//   • Format follows use — narrative docs → HTML/Word; financial models → Excel
//     (so clients can update their own assumptions); diagrams → inline SVG/Mermaid
//   • Gate artifacts are the formal gate criterion evidence; working docs support
//     the gate but are not themselves the gate blocker
//   • Backward-compat keys: legacy keys ('p3_design', 'roadmap') are retained
//     and displayed in the Evidence Hub; new keys are the canonical path forward

export type DeliverableFormat = 'html-word' | 'excel' | 'html-word-excel';

export interface ExcelSheetSpec {
  /** Tab name in the workbook */
  sheetName: string;
  /** What this sheet contains */
  purpose: string;
  /** Whether cells are user-editable inputs */
  editable: boolean;
  /** Hint for which markdown section this sheet is parsed from */
  markdownSection: string;
}

export interface DeliverableSpec {
  deliverableTypeKey: string;
  documentTitle: string;
  /** Phase this document belongs to (1–5; 0 = origination) */
  phase: number;
  /** Short label for the phase, e.g. "P3 Design Future State" */
  phaseLabel: string;
  /** Who reads and acts on this document */
  audiencePrimary: string;
  /** What question this document answers */
  documentPurpose: string;
  /** Recommended export format(s) */
  formatRecommendation: DeliverableFormat;
  /** True = this is a formal gate criterion artifact */
  gateArtifact: boolean;
  /** True = can be generated and exported standalone (vs. part of master only) */
  standAlone: boolean;
  /**
   * Ordered list of required sections (plain English — used verbatim in the
   * Claude generation prompt). Be specific about required content per section.
   */
  sections: string[];
  /**
   * For Excel-format deliverables: describes each worksheet in the workbook.
   * Claude is asked to generate content in a structured markdown table format
   * that the export route parses into the corresponding sheet.
   */
  excelSheets?: ExcelSheetSpec[];
  /** McKinsey / Big-4 analog label (shown in UI for orientation) */
  consultingAnalog: string;
  /**
   * Extra generation guidance injected into the Claude prompt for this document.
   * Use for format-specific instructions (e.g. structured tables for Excel).
   */
  generationPromptHint?: string;
  /** If true, this key is deprecated; new generations should use a replacement */
  deprecated?: boolean;
  /** The replacement key, if deprecated */
  replacedBy?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const DELIVERABLE_REGISTRY: DeliverableSpec[] = [

  // ── P1: Charter ────────────────────────────────────────────────────────────

  {
    deliverableTypeKey: 'charter',
    documentTitle: 'Program Charter',
    phase: 1,
    phaseLabel: 'P1 Charter',
    audiencePrimary: 'Sponsor · Leadership team',
    documentPurpose: 'Commitment instrument — establishes scope, value hypothesis, governance, and kill criterion',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Executive Summary (1 paragraph: problem statement, recommended approach, preliminary value hypothesis $M–$M, program duration)',
      'Sponsor Commitment (named sponsor, role, decision rights, review cadence, documented commitment evidence)',
      'Stakeholder Map (decision-makers, contributors, blockers — named individuals with decision rights assigned)',
      'Success Metrics & Value Range (primary KPI with current baseline, preliminary value range $M–$M with stated assumptions labeled PRELIMINARY_ESTIMATE)',
      'Scope Boundary (explicit in-scope / out-of-scope list — specific capabilities and business processes, not generic)',
      'Governance Model (steering committee, escalation path, decision velocity expectations)',
      'Kill Criterion (specific, observable condition that would terminate the program — not vague risk statements)',
    ],
    consultingAnalog: 'McKinsey Engagement Scope & Charter Document',
  },

  // ── P2: Discover & Diagnose ─────────────────────────────────────────────────

  {
    deliverableTypeKey: 'discovery_report',
    documentTitle: 'Discovery & Diagnosis Report',
    phase: 2,
    phaseLabel: 'P2 Discover & Diagnose',
    audiencePrimary: 'Sponsor · Engagement team',
    documentPurpose: 'Establishes the evidence base: quantified current state, ranked root causes, and explicit gate recommendation',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Current State Baseline (quantified metrics with source citations for every value — no estimates without labeling)',
      'Root Cause Analysis (3–5 root causes ranked by impact and confidence, each with supporting evidence citation and business consequence)',
      'Data & AI Readiness Assessment (data availability by domain, quality gaps, governance posture, integration constraints)',
      'Stakeholder Findings Summary (key themes from interviews/workshops — named participants, not anonymous)',
      'Continuation Verdict (explicit: CONTINUE_TO_P3 or DISCONTINUE_WITH_RATIONALE — with justification paragraph)',
    ],
    consultingAnalog: 'McKinsey Diagnostic & Root Cause Report',
  },

  {
    deliverableTypeKey: 'root_cause_worksheet',
    documentTitle: 'Root Cause Analysis Worksheet',
    phase: 2,
    phaseLabel: 'P2 Discover & Diagnose',
    audiencePrimary: 'Engagement team (working document)',
    documentPurpose: 'Working document for root cause decomposition — shows the full causal chain for team alignment, not executive distribution',
    formatRecommendation: 'html-word',
    gateArtifact: false,
    standAlone: true,
    sections: [
      'Problem Statement (precise, measurable, bounded — not the symptom)',
      'Causal Chain Decomposition (5-Why or Ishikawa for each top-level root cause — every branch goes 3+ levels deep)',
      'Evidence Map (each root cause node linked to specific data point, interview, or upload reference)',
      'Root Cause Ranking (ranked matrix: impact × confidence × addressability)',
      'Design Implications (for each ranked root cause: what design requirement does it generate in P3?)',
    ],
    consultingAnalog: 'Root Cause Analysis Working Paper',
  },

  // ── P3: Design Future State ─────────────────────────────────────────────────

  {
    deliverableTypeKey: 'target_state_architecture',
    documentTitle: 'Target State Reference Architecture',
    phase: 3,
    phaseLabel: 'P3 Design Future State',
    audiencePrimary: 'CTO · IT Leadership · Enterprise Architect',
    documentPurpose: 'Architecture decision record — conceptual to physical stack for sign-off by technical leadership',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      '## Conceptual Architecture\nBusiness capabilities and domains (NO technology product names in this section). What the system does, organized as capability domains. Audience: business leadership. Include a Mermaid diagram showing capability domains and their relationships.',
      '## Logical Architecture\nSystem components, integration patterns, data flows, AI/agent placement, security boundaries. Technology-neutral (vendor-agnostic component names). Include a detailed Mermaid diagram. Audience: enterprise architect, IT leadership.',
      '## Physical Architecture\nActual vendor products, infrastructure topology, deployment model (cloud/hybrid/on-prem), security zones, network segments, HA/DR approach. Include a Mermaid deployment diagram. Audience: delivery team, IT ops, security.',
      '## Architecture Patterns Applied\nWhich canonical patterns from the pattern library are applied in this architecture. For each pattern: why it was selected, which root causes it addresses, known failure modes and mitigations.',
      '## Architecture Decision Records (ADRs)\n3–5 key decisions made. Format: Decision | Options Considered | Rationale | Trade-offs Accepted | Reversibility.',
      '## Integration Contracts\nFor every system integration: source, target, protocol, data payload, frequency, SLA, failure handling.',
    ],
    consultingAnalog: 'McKinsey / Gartner Target State Reference Architecture',
    generationPromptHint: 'This is a technical architecture document for a CTO audience. Include three Mermaid diagrams (conceptual capability map, logical component diagram, physical deployment diagram). Every integration must be explicitly specified. Architecture Decision Records must show rejected alternatives.',
  },

  {
    deliverableTypeKey: 'solution_design',
    documentTitle: 'Solution Design Specification',
    phase: 3,
    phaseLabel: 'P3 Design Future State',
    audiencePrimary: 'Delivery lead · Architect · Senior engineers',
    documentPurpose: 'How we build and configure it — feature specs, configuration requirements, and integration contracts for the delivery team',
    formatRecommendation: 'html-word',
    gateArtifact: false,
    standAlone: true,
    sections: [
      'Solution Scope (what is being built vs. configured vs. integrated — explicit build/buy/configure decision per component)',
      'Functional Requirements (numbered requirements derived from root causes; each requirement must reference its parent root cause from RCA-P2)',
      'Non-Functional Requirements (performance, availability, scalability, security, compliance — quantified targets, not qualitative)',
      'Configuration Specifications (for COTS/SaaS: specific configuration decisions, module selections, parameterization)',
      'Custom Build Specifications (for build components: data model, API contracts, business logic)',
      'AI / Agent Design (for AI components: model selection rationale, prompt architecture, guardrails, fallback behavior, human-in-the-loop design)',
      'Testing & Acceptance Criteria (per requirement: how it will be verified, who signs off, definition of done)',
    ],
    consultingAnalog: 'Solution Design Document (SDD)',
    generationPromptHint: 'This is a delivery-facing specification document. Every requirement must be numbered and traceable to a root cause. AI/agent design sections must specify guardrails and human-in-the-loop points explicitly. Acceptance criteria must be testable.',
  },

  {
    deliverableTypeKey: 'operating_model_design',
    documentTitle: 'Operating Model Design',
    phase: 3,
    phaseLabel: 'P3 Design Future State',
    audiencePrimary: 'CHRO · Operations lead · Sponsor',
    documentPurpose: 'How the organisation runs with the new capability — roles, responsibilities, governance, and Today vs. Tomorrow comparison',
    formatRecommendation: 'html-word',
    gateArtifact: false,
    standAlone: true,
    sections: [
      'Today vs. Tomorrow Operating Model (side-by-side comparison: current roles/responsibilities vs. target state — named roles, not generic)',
      'New Role Definitions (for each new or changed role: responsibilities, decision rights, required skills, reporting line)',
      'Handoff Map (where work crosses role/team boundaries: trigger, handoff mechanism, SLA, escalation path)',
      'Governance Design (decision rights model: who decides what, at what threshold, with what speed)',
      'Change Impact Assessment (per stakeholder group: what changes for them, volume of impact, readiness assessment)',
      'Capability Gap & Training Plan (skills required vs. available; training approach by role; timeline)',
    ],
    consultingAnalog: 'McKinsey Operating Model Design Document',
  },

  {
    deliverableTypeKey: 'sourcing_strategy',
    documentTitle: 'Sourcing Strategy Brief',
    phase: 3,
    phaseLabel: 'P3 Design Future State',
    audiencePrimary: 'Procurement · Sponsor · CTO',
    documentPurpose: 'Build/buy/configure/partner decisions with vendor shortlist and evaluation rationale',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Sourcing Decision Summary (for each major component: build / buy / configure / partner — one-line rationale)',
      'Vendor Evaluation (for COTS/SaaS components: evaluation criteria, shortlisted vendors, score matrix, recommended vendor with rationale)',
      'Make vs. Buy Analysis (for custom build candidates: cost to build vs. buy, long-term maintenance, differentiation argument)',
      'Partnership Model (for SI/partner-delivered components: scope, governance, IP ownership, exit provisions)',
      'Commercial Risk Register (vendor concentration, licence risk, data sovereignty, lock-in mitigations)',
      'Procurement Pathway (RFP/RFI/direct award rationale; timeline; approvals required)',
    ],
    consultingAnalog: 'Sourcing Strategy & Vendor Selection Brief',
  },

  // Backward-compat key for P3 monolithic doc
  {
    deliverableTypeKey: 'p3_design',
    documentTitle: 'P3 Design (Legacy)',
    phase: 3,
    phaseLabel: 'P3 Design Future State',
    audiencePrimary: 'Sponsor · Delivery team',
    documentPurpose: 'Legacy combined design document (deprecated — new generations use split documents)',
    formatRecommendation: 'html-word',
    gateArtifact: false,
    standAlone: true,
    deprecated: true,
    replacedBy: ['target_state_architecture', 'solution_design', 'operating_model_design', 'sourcing_strategy'],
    sections: [],
    consultingAnalog: 'Legacy combined P3 document',
  },

  // ── P4: Roadmap & Business Case ──────────────────────────────────────────────

  {
    deliverableTypeKey: 'execution_roadmap',
    documentTitle: 'Execution Roadmap',
    phase: 4,
    phaseLabel: 'P4 Roadmap & Business Case',
    audiencePrimary: 'Delivery lead · Workstream leads',
    documentPurpose: 'The execution plan — sequenced workstreams, milestones, critical path, and resource model',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Workstream Breakdown (named workstreams with scope, lead, team composition, and interdependencies — Mermaid dependency diagram)',
      'Phased Delivery Timeline (quarters/months; value realization milestones explicitly called out; critical path identified)',
      'Resource Model (FTEs by role and workstream; SI/partner scope; named leads for each workstream)',
      'Critical Path Analysis (which workstreams gate others; float in non-critical paths; risk to timeline)',
      'Change Management Timeline (stakeholder communication plan, training schedule, cutover approach)',
      'Governance Cadence (steering committee, workstream sync, escalation triggers)',
    ],
    consultingAnalog: 'McKinsey Implementation Roadmap',
  },

  {
    deliverableTypeKey: 'business_case',
    documentTitle: 'Business Case',
    phase: 4,
    phaseLabel: 'P4 Roadmap & Business Case',
    audiencePrimary: 'CFO · Board · Sponsor',
    documentPurpose: 'Investment decision document — value thesis, cost structure, and financial returns for funding approval',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Executive Summary (1 page: investment ask, value thesis, headline NPV/IRR, payback period, recommendation)',
      'Value Architecture (benefit levers traced to root causes from P2; each lever with magnitude, confidence, and baseline reference)',
      'Investment Summary (total cost by category; phasing; peak cash requirement)',
      'Financial Returns (NPV, IRR, payback period — base case; note: detailed model in Financial Model workbook)',
      'Scenario Analysis (Conservative / Base / Optimistic — key assumption difference per scenario; not sensitivity table — that is in the Financial Model)',
      'Investment Risks (5 risks that could impair value; mitigation; residual exposure)',
      'Funding Ask & Approval Path (amount requested; phasing; approval authority; conditions)',
    ],
    consultingAnalog: 'McKinsey Business Case & Investment Memo',
    generationPromptHint: 'This is an executive document — every number must be traceable to the FIN-BASE-P2 baseline. Do NOT include detailed financial tables (those belong in the Financial Model Excel). Focus on the narrative investment thesis and headline returns.',
  },

  {
    deliverableTypeKey: 'financial_model',
    documentTitle: 'Financial Model',
    phase: 4,
    phaseLabel: 'P4 Roadmap & Business Case',
    audiencePrimary: 'Finance team · CFO · Engagement team',
    documentPurpose: 'Interactive financial model — client can update assumptions (discount rate, FTE rates, adoption curves) and see recalculated NPV/IRR',
    formatRecommendation: 'excel',
    gateArtifact: false,
    standAlone: true,
    excelSheets: [
      {
        sheetName: 'Assumptions',
        purpose: 'Editable input parameters — clients update these cells to run scenarios',
        editable: true,
        markdownSection: 'ASSUMPTIONS',
      },
      {
        sheetName: 'Benefit Levers',
        purpose: 'Named benefit levers with year-by-year magnitude estimates and confidence ratings',
        editable: true,
        markdownSection: 'BENEFIT_LEVERS',
      },
      {
        sheetName: 'Implementation Costs',
        purpose: 'Cost categories with year-by-year phasing',
        editable: true,
        markdownSection: 'IMPLEMENTATION_COSTS',
      },
      {
        sheetName: 'Value Model',
        purpose: 'Year-by-year cash flows, cumulative NPV, IRR, payback period — formulas reference Assumptions tab',
        editable: false,
        markdownSection: 'VALUE_MODEL',
      },
      {
        sheetName: 'Scenarios',
        purpose: 'Conservative / Base / Optimistic scenario comparison',
        editable: false,
        markdownSection: 'SCENARIOS',
      },
    ],
    sections: [
      '## ASSUMPTIONS\nGenerate a markdown table with columns: Parameter | Value | Unit | Description\nInclude: Discount Rate (%), Analysis Period (years), Implementation Start Quarter, FTE Blended Rate ($/year), Adoption Curve Year 1 (%), Adoption Curve Year 2 (%), Adoption Curve Year 3+ (%)',
      '## BENEFIT_LEVERS\nGenerate a markdown table with columns: Lever Name | Category | Baseline Ref | Year 1 ($M) | Year 2 ($M) | Year 3 ($M) | Year 4 ($M) | Year 5 ($M) | Confidence | Notes\nTrace each lever to a root cause from P2. Include all identified value levers.',
      '## IMPLEMENTATION_COSTS\nGenerate a markdown table with columns: Cost Category | Year 0 ($M) | Year 1 ($M) | Year 2 ($M) | Year 3 ($M) | One-Time or Recurring | Notes\nCategories: Software Licenses, Implementation Services, Internal FTE, Infrastructure, Training, Change Management',
      '## VALUE_MODEL\nGenerate a markdown table with columns: Year | Total Benefits ($M) | Total Costs ($M) | Net Cash Flow ($M) | Cumulative Cash Flow ($M) | Discounted Cash Flow ($M)\nAlso include a summary row: NPV ($M) | IRR (%) | Payback Period (years)',
      '## SCENARIOS\nGenerate a markdown table with columns: Scenario | Key Assumption Difference | NPV ($M) | IRR (%) | Payback (years) | Probability Weight\nRows: Conservative, Base Case, Optimistic',
    ],
    consultingAnalog: 'McKinsey Financial Model / Investment Analysis Workbook',
    generationPromptHint: 'Generate ONLY structured markdown tables in the exact section format specified. Do NOT add narrative paragraphs between sections. Use realistic numbers grounded in the engagement context and baseline data from P2. Every benefit lever must reference its parent root cause.',
  },

  {
    deliverableTypeKey: 'tower_metrics_plan',
    documentTitle: 'Tower Metrics Plan',
    phase: 4,
    phaseLabel: 'P4 Roadmap & Business Case',
    audiencePrimary: 'Tower team · Delivery lead · Sponsor',
    documentPurpose: 'Defines what Tower measures post-handoff — KPIs, measurement methodology, owners, and reporting cadence',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Measurement Philosophy (how success is defined post-handoff; lag vs. lead indicators; attribution approach)',
      'KPI Definitions (for each value lever: metric name, definition, calculation methodology, data source, baseline, target, measurement frequency)',
      'Ownership Matrix (per KPI: accountable owner, reporting owner, data owner — named individuals)',
      'Reporting Design (dashboard structure, cadence, audience, escalation triggers)',
      'Baseline Establishment Plan (how baselines are locked before go-live; required data infrastructure)',
      'Risk to Measurement (data quality risks, attribution challenges, mitigations)',
    ],
    consultingAnalog: 'McKinsey Measurement Framework & KPI Design',
  },

  // Backward-compat key for P4 monolithic doc
  {
    deliverableTypeKey: 'roadmap',
    documentTitle: 'Roadmap & Business Case (Legacy)',
    phase: 4,
    phaseLabel: 'P4 Roadmap & Business Case',
    audiencePrimary: 'Sponsor · Delivery team',
    documentPurpose: 'Legacy combined roadmap and business case (deprecated — new generations use split documents)',
    formatRecommendation: 'html-word',
    gateArtifact: false,
    standAlone: true,
    deprecated: true,
    replacedBy: ['execution_roadmap', 'business_case', 'financial_model', 'tower_metrics_plan'],
    sections: [],
    consultingAnalog: 'Legacy combined P4 document',
  },

  // ── P5: Approval & Mobilization ─────────────────────────────────────────────

  {
    deliverableTypeKey: 'handoff_package',
    documentTitle: 'Mobilization & Tower Handoff Package',
    phase: 5,
    phaseLabel: 'P5 Approval & Mobilization',
    audiencePrimary: 'Delivery team · Tower team',
    documentPurpose: 'Everything the delivery team needs to execute without returning to the program team',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Delivery RACI (named people for every workstream — not roles, not "TBD")',
      'Open Decisions Register (every unresolved decision: what it is, who decides, by when, what is blocked)',
      'Risk Handoff Register (open risks transferring to Tower: likelihood, impact, mitigation owner, trigger)',
      'Artifact Inventory (complete list of all P1–P4 artifacts with status: final / approved / pending)',
      'Operating Procedure Summary (critical operating procedures the delivery team must follow on Day 1)',
    ],
    consultingAnalog: 'McKinsey Mobilization & Handoff Package',
  },

  {
    deliverableTypeKey: 'value_measurement_contract',
    documentTitle: 'Value Measurement Contract',
    phase: 5,
    phaseLabel: 'P5 Approval & Mobilization',
    audiencePrimary: 'Executive sponsor · Accountable owner',
    documentPurpose: 'Formal commitment document — what outcomes are promised, how they will be measured, who is accountable',
    formatRecommendation: 'html-word',
    gateArtifact: true,
    standAlone: true,
    sections: [
      'Committed Outcomes (each value lever: baseline, target, timeline, confidence level — no vague ranges)',
      'Measurement Methodology (how each outcome is measured: data source, calculation, frequency)',
      'Accountability Table (named individual accountable for each outcome — with their explicit acknowledgment)',
      'Review Cadence (when outcomes are reviewed, who reviews, what triggers escalation)',
      'Revision Conditions (under what conditions targets can be revised; approval process for revision)',
    ],
    consultingAnalog: 'Value Realization Contract / Benefits Realization Plan',
    generationPromptHint: 'This is a formal accountability document. Every outcome must have a single named accountable individual. No "team" accountability. Target ranges must be specific ($M or %) not qualitative.',
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getDeliverableSpec(deliverableTypeKey: string): DeliverableSpec | undefined {
  return DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === deliverableTypeKey);
}

export function getDeliverablesByPhase(phase: number): DeliverableSpec[] {
  return DELIVERABLE_REGISTRY.filter((d) => d.phase === phase && !d.deprecated);
}

export function getGateArtifacts(phase: number): DeliverableSpec[] {
  return getDeliverablesByPhase(phase).filter((d) => d.gateArtifact);
}

export function getWorkingDocs(phase: number): DeliverableSpec[] {
  return getDeliverablesByPhase(phase).filter((d) => !d.gateArtifact);
}

/** Returns the canonical (non-deprecated) document set for a phase, grouped */
export function getPhaseDocumentSet(phase: number): {
  gateArtifacts: DeliverableSpec[];
  workingDocs: DeliverableSpec[];
  allDocs: DeliverableSpec[];
} {
  const all = getDeliverablesByPhase(phase);
  return {
    gateArtifacts: all.filter((d) => d.gateArtifact),
    workingDocs: all.filter((d) => !d.gateArtifact),
    allDocs: all,
  };
}

/** Map phase number → ordered list of canonical deliverable type keys (non-deprecated) */
export const PHASE_CANONICAL_KEYS: Record<number, string[]> = {
  1: ['charter'],
  2: ['discovery_report', 'root_cause_worksheet'],
  3: ['target_state_architecture', 'solution_design', 'operating_model_design', 'sourcing_strategy'],
  4: ['execution_roadmap', 'business_case', 'financial_model', 'tower_metrics_plan'],
  5: ['handoff_package', 'value_measurement_contract'],
};

/** Format badge labels */
export const FORMAT_LABELS: Record<DeliverableFormat, string[]> = {
  'html-word': ['HTML', 'Word'],
  'excel': ['Excel'],
  'html-word-excel': ['HTML', 'Word', 'Excel'],
};
