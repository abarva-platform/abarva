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

import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

export type DeliverableFormat =
  | "html-word"
  | "excel"
  | "html-word-excel"
  | "pptx";

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
  /** P3b dependency. The worker may claim this deliverable only after this predecessor persists successfully. */
  dependsOnDeliverableTypeKey?: string;
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
    deliverableTypeKey: "charter",
    documentTitle: "Program Charter",
    phase: 1,
    phaseLabel: "P1 Charter",
    audiencePrimary: "Sponsor · Leadership team",
    documentPurpose:
      "Commitment instrument — establishes scope, value hypothesis, governance, and kill criterion",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Executive Summary (1 paragraph: problem statement, recommended approach, preliminary value hypothesis $M–$M, program duration)",
      "Sponsor Contact (name, role, and explicit phase-progress email preference; no approval or commitment evidence)",
      "Stakeholder Map (decision-makers, contributors, blockers — named individuals with decision rights assigned)",
      "Success Metrics & Value Range (primary KPI with current baseline, preliminary value range $M–$M with stated assumptions labeled PRELIMINARY_ESTIMATE)",
      "Scope Boundary (explicit in-scope / out-of-scope list — specific capabilities and business processes, not generic)",
      "Governance Model (steering committee, escalation path, decision velocity expectations)",
      "Kill Criterion (specific, observable condition that would terminate the program — not vague risk statements)",
    ],
    consultingAnalog: "McKinsey Engagement Scope & Charter Document",
  },

  {
    deliverableTypeKey: "discovery_plan",
    documentTitle: "Discovery Workshop Guide",
    phase: 1,
    phaseLabel: "P1 Charter",
    audiencePrimary: "Sponsor · Move lead · Workshop participants",
    documentPurpose:
      "Working guide for P2 Discovery — sessions, evidence requests, interview prompts, and client preparation instructions derived from the approved charter",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Charter recap (what is already known and must not be re-collected)",
      "Discovery session plan (workshops, interviews, participants, objectives, and expected outputs)",
      "Evidence request list (what files/extracts are needed, why they matter, likely owner, required format, and priority)",
      "Workshop facilitation guide (questions, decisions to test, evidence to capture, and how notes will be reviewed)",
      "Readiness checklist for the next phase gate (what must be uploaded, reviewed, and accepted before Discovery closes)",
    ],
    consultingAnalog: "Discovery Workshop Guide / Evidence Request Pack",
    generationPromptHint:
      "This is the detailed working guide that the Charter must not contain. Be operational: name sessions, roles, evidence requests, intake templates, outputs, and next-gate readiness checks. Keep all assumptions labeled and cite the approved Charter or evidence where used.",
  },

  // ── P2: Discover & Diagnose ─────────────────────────────────────────────────

  {
    deliverableTypeKey: "discovery_report",
    documentTitle: "Discovery & Diagnosis Report",
    phase: 2,
    phaseLabel: "P2 Discover & Diagnose",
    audiencePrimary: "Sponsor · Engagement team",
    documentPurpose:
      "Establishes the evidence base: quantified current state, ranked root causes, and explicit gate recommendation",
    formatRecommendation: "pptx",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Current State Baseline (quantified metrics with source citations for every value — no estimates without labeling)",
      "Root Cause Analysis (3–5 root causes ranked by impact and confidence, each with supporting evidence citation and business consequence)",
      "Data & AI Readiness Assessment (data availability by domain, quality gaps, governance posture, integration constraints)",
      "Stakeholder Findings Summary (key themes from interviews/workshops — named participants, not anonymous)",
      "Continuation Verdict (explicit: CONTINUE_TO_P3 or DISCONTINUE_WITH_RATIONALE — with justification paragraph)",
    ],
    consultingAnalog: "McKinsey Diagnostic & Root Cause Report",
  },

  {
    deliverableTypeKey: "root_cause_worksheet",
    documentTitle: "Root Cause Analysis Worksheet",
    phase: 2,
    phaseLabel: "P2 Discover & Diagnose",
    audiencePrimary: "Engagement team (working document)",
    documentPurpose:
      "Working document for root cause decomposition — shows the full causal chain for team alignment, not executive distribution",
    formatRecommendation: "pptx",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Problem Statement (precise, measurable, bounded — not the symptom)",
      "Causal Chain Decomposition (5-Why or Ishikawa for each top-level root cause — every branch goes 3+ levels deep)",
      "Evidence Map (each root cause node linked to specific data point, interview, or upload reference)",
      "Root Cause Ranking (ranked matrix: impact × confidence × addressability)",
      "Design Implications (for each ranked root cause: what design requirement does it generate in P3?)",
    ],
    consultingAnalog: "Root Cause Analysis Working Paper",
  },

  {
    deliverableTypeKey: "design_workshop_guide",
    documentTitle: "Design Workshop Guide",
    phase: 2,
    phaseLabel: "P2 Discover & Diagnose",
    audiencePrimary: "Sponsor · Move lead · Workshop participants",
    documentPurpose:
      "Working guide for Design — design workshops, decision sessions, evidence carry-forward, and client preparation instructions derived from the accepted Discovery record",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Discovery recap (what has been proven, what is insufficient evidence, and what must not be re-litigated)",
      "Design session plan (future-state workshops, option-decision sessions, participants, objectives, and expected outputs)",
      "Evidence carry-forward list (root causes, metrics, constraints, source files, and open gaps needed to ground design)",
      "Workshop facilitation guide (questions, design decisions to test, trade-offs to record, and note-review method)",
      "Readiness checklist for the design gate (what must be uploaded, reviewed, and accepted before Design closes)",
    ],
    consultingAnalog: "Future-State Design Workshop Guide",
    generationPromptHint:
      "This is the design working guide, not a second Discovery Report. Be operational: name design sessions, decision forums, participants, evidence carry-forward, trade-off questions, outputs, and design-gate readiness checks. Preserve insufficient-evidence labels.",
  },

  // ── P3: Design Future State ─────────────────────────────────────────────────

  {
    deliverableTypeKey: "target_state_architecture",
    documentTitle: "Target State Reference Architecture",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "CTO · IT Leadership · Enterprise Architect",
    documentPurpose:
      "Estimate-ready target-state reference architecture — enough business, application, data, integration, security, and deployment detail for technical leadership and delivery teams to validate scope and size the work, without becoming a build specification",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "## Business and Solution Context\nValidated use case, outcomes, in-scope users/processes, and approved P2 evidence that drives the design. Distinguish facts, assumptions, and unresolved decisions.",
      "## Target Architecture\nShow the major business capabilities, application/services, data sources and flows, interfaces, and trust boundaries needed for this use case. For analytics, distinguish raw/bronze, curated/silver, and serving/gold layers and map each requested report or dashboard to its source and transformation path. Use one readable architecture diagram; avoid speculative product names.",
      "## Integration, Security, and Operations\nFor each material interface or data feed: source, target, method/frequency when known, owner, key control/privacy constraint, and unresolved sizing question. State deployment, resilience, support, and security assumptions only to the level that affects estimate or approval.",
      "## Design Decisions and Alternatives\nRecord the few consequential architecture choices, alternatives considered, evidence basis, trade-offs, reversibility, and what would change the choice. Do not manufacture a 3–5 ADR quota.",
      "## Estimate Drivers and Open Questions\nData volume/quality, environments, access, migration, integration complexity, non-functional needs, dependencies, and assumptions that materially change effort, cost, risk, or timeline.",
    ],
    consultingAnalog: "McKinsey / Gartner Target State Reference Architecture",
    generationPromptHint:
      "Create a concise, evidence-linked target architecture that a CTO and delivery lead can use to validate scope and size work. Prefer one legible diagram. Do not turn unknowns into facts or expand into low-level build instructions, exhaustive interface contracts, detailed network topology, or full implementation design. Label each assumption and identify who must validate it during P4 or delivery.",
  },

  {
    deliverableTypeKey: "solution_design",
    dependsOnDeliverableTypeKey: "target_state_architecture",
    documentTitle: "Solution Design Specification",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "Delivery lead · Architect · Senior engineers",
    documentPurpose:
      "Estimate-ready solution scope brief — clarifies what is built, bought, configured, or integrated and the complexity drivers, without specifying the complete implementation",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Solution boundary (capabilities and outcomes included/excluded; trace to approved findings)",
      "Build / buy / configure / integrate posture by major component, with rationale and decision status (confirmed vs. assumption)",
      "Estimate-driving functional and non-functional needs, with evidence source or explicit assumption and owner to validate",
      "Data, integration, security, environment, testing, migration, and operational complexity drivers that affect effort or risk",
      "AI-enabled development approach where applicable: skills, Claude Code/Codex use cases, access controls, human review, testing, and productivity assumption for P4 to model",
      "Open design decisions and questions that belong in the delivery roadmap; do not write code-level specifications, detailed configuration, API schemas, prompts, or test scripts",
    ],
    consultingAnalog: "Solution Design Document (SDD)",
    generationPromptHint:
      "Keep this at estimate-ready scope. Trace requirements to approved findings, but describe implementation detail only where it changes sizing or risk. Do not produce a complete solution design, low-level requirements specification, detailed configuration/API contract, prompt specification, or execution backlog. Record human-review and security controls for AI-assisted development and carry productivity assumptions to P4 for explicit adjustment.",
  },

  {
    deliverableTypeKey: "process_change_estimate_brief",
    documentTitle: "Process Change Estimate Brief",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "Business process owner · Delivery lead · Sponsor",
    documentPurpose:
      "Bounded description of the workflow delta, controls, adoption ownership, and sizing assumptions needed to estimate a limited process change",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Change boundary (affected workflow steps only; explicitly state what remains unchanged and exclude full-process redesign)",
      "Current-to-proposed delta (affected handoffs, decisions, exceptions, and expected volumes, each traced to approved evidence or labeled as an assumption)",
      "People and adoption impact (none / limited impacts, named accountable business owner, and the adoption responsibilities that remain with the business)",
      "Controls and dependencies (human approvals, policy boundaries, data/security constraints, integrations, and unresolved dependencies)",
      "Sizing basis and open inputs (work packages, evidence-backed drivers, assumptions, confidence, and questions P4 must resolve before final estimates)",
      "Decision and conditions (recommended bounded change, alternatives rejected, evidence gaps, and conditions for roadmap approval)",
    ],
    consultingAnalog: "Estimate-ready process delta and decision brief",
    generationPromptHint:
      "Keep this at estimate-ready strategy depth. Describe only the affected workflow delta; do not create a complete future-state process map, detailed work instructions, role-by-role operating model, implementation specification, or execution plan. Separate approved evidence from assumptions and identify what must be sized or validated in P4.",
  },

  {
    deliverableTypeKey: "operating_model_design",
    dependsOnDeliverableTypeKey: "solution_design",
    documentTitle: "Operating Model Design",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "CHRO · Operations lead · Sponsor",
    documentPurpose:
      "Estimate-ready operating-model delta for use cases with evidence-validated material workflow or accountability change; not a full organisation redesign",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Validated change boundary: what role/accountability changes, what does not, and which approved evidence supports the conclusion",
      "Only the affected role/accountability deltas and decision rights needed to estimate; label unvalidated assignments as assumptions",
      "Material handoffs, controls, and service expectations that alter scope, dependencies, risk, or cost",
      "Adoption and training owner, responsibility split, and estimate-relevant effort assumption; detailed training design remains for roadmap execution",
      "Open questions and evidence gaps that P4 must price or resolve before final approval",
    ],
    consultingAnalog: "Estimate-Ready Operating Model Delta Brief",
    generationPromptHint:
      "Generate this only when the evidence-validated P2 route establishes material operating-model change. Do not create a whole-org operating model, detailed role catalogue, full governance redesign, change plan, or training curriculum. If the route is technical-only or has no material accountability shift, the artifact is not applicable and must not be generated.",
  },

  {
    deliverableTypeKey: "requirements_traceability",
    dependsOnDeliverableTypeKey: "target_state_architecture",
    documentTitle: "Requirements Traceability Matrix",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "Sponsor · Delivery lead · Architect",
    documentPurpose:
      "Governed trace from P2 findings and P3 design choices to intended outcomes, acceptance evidence, and open gates",
    formatRecommendation: "html-word-excel",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Traceability Summary (what P3 is committing to, what remains explicitly gated, and which downstream phase consumes each trace)",
      "Requirement-to-Design Matrix (requirement, source finding, chosen design response, owner, acceptance evidence, open gap)",
      "Outcome Linkage (how each design response maps to intended operational, risk, or value outcomes without inventing unsupported financial totals)",
      "Evidence and Confidence Register (approved source, confidence, missing evidence, and whether the item is ready for P4 business-case use)",
      "Open Gates Carried Forward (hard blockers, insufficient-evidence items, and the exact owner/action needed before value or funding claims)",
    ],
    consultingAnalog:
      "Requirements Traceability Matrix / Design-to-Outcome Trace",
    generationPromptHint:
      "This is a governance trace artifact. Do not introduce new facts. Trace P2 findings and the approved P3 option into design choices, outcomes, acceptance evidence, owners, and open gaps. Preserve insufficient-evidence labels and explicitly block unsupported value claims.",
  },

  {
    deliverableTypeKey: "sourcing_strategy",
    dependsOnDeliverableTypeKey: "requirements_traceability",
    documentTitle: "Sourcing Strategy Brief",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "Procurement · Sponsor · CTO",
    documentPurpose:
      "Delivery-model and sourcing assumptions for estimation; formal vendor selection and procurement remain in Source or later execution",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Internal / vendor / hybrid delivery assumption by major work package, with rationale and decision status",
      "Skills and capacity required internally, including product-development and data/AI engineering skills where applicable",
      "Vendor or partner scope assumption and unresolved procurement dependencies; do not shortlist or select vendors",
      "AI coding accelerator assumptions (Claude Code/Codex or equivalent): eligible work, controls, human review, quality checks, and estimated productivity effect as an adjustable assumption",
      "Commercial, licensing, data sovereignty, access, and lock-in risks that could materially affect estimate or approach",
      "P4 sizing inputs: role mix, duration/capacity, rate source, license/infrastructure basis, confidence, and open decisions",
    ],
    consultingAnalog: "Delivery Approach and Sourcing Assumptions Brief",
    generationPromptHint:
      "This is an estimation input, not a sourcing event. Do not recommend, rank, contact, or select vendors; do not claim procurement decisions have occurred. Put role, capacity, rate, and productivity assumptions in a form the human team can revise in P4.",
  },

  {
    deliverableTypeKey: "planning_workshop_guide",
    documentTitle: "Planning Workshop Guide",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary:
      "Sponsor · Delivery lead · Finance · Workshop participants",
    documentPurpose:
      "Working guide for Roadmap & Business Case — roadmap, finance, measurement, readiness, and change sessions derived from the accepted design",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Design recap (approved target state, option decisions, operating implications, and unresolved design caveats)",
      "Planning session plan (roadmap, business case, finance, metrics, readiness/change workshops, participants, objectives, and outputs)",
      "Planning evidence request list (cost inputs, benefit baselines, dependency evidence, resource model, metric definitions, and readiness evidence)",
      "Workshop facilitation guide (questions, funding assumptions to validate, sequencing decisions, risk decisions, and note-review method)",
      "Readiness checklist for the planning gate (what must be uploaded, reviewed, and accepted before planning closes)",
    ],
    consultingAnalog:
      "Execution Planning Workshop Guide / Business Case Preparation Pack",
    generationPromptHint:
      "This is the planning working guide, not a business case or roadmap. Be operational: name sessions, owners, evidence requests, finance inputs, metric baselines, decision questions, and planning-gate readiness checks. Do not invent benefits or funding approval.",
  },

  // Backward-compat key for P3 monolithic doc
  {
    deliverableTypeKey: "p3_design",
    documentTitle: "P3 Design (Legacy)",
    phase: 3,
    phaseLabel: "P3 Design Future State",
    audiencePrimary: "Sponsor · Delivery team",
    documentPurpose:
      "Legacy combined design document (deprecated — new generations use split documents)",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    deprecated: true,
    replacedBy: [
      "target_state_architecture",
      "solution_design",
      "operating_model_design",
      "requirements_traceability",
      "sourcing_strategy",
    ],
    sections: [],
    consultingAnalog: "Legacy combined P3 document",
  },

  // ── P4: Roadmap & Business Case ──────────────────────────────────────────────

  {
    deliverableTypeKey: "execution_roadmap",
    documentTitle: "Execution Roadmap",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary: "Delivery lead · Workstream leads",
    documentPurpose:
      "The execution plan — sequenced workstreams, milestones, critical path, and resource model",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Workstream Breakdown (named workstreams with scope, lead, team composition, and interdependencies — Mermaid dependency diagram)",
      "Phased Delivery Timeline (quarters/months; value realization milestones explicitly called out; critical path identified)",
      "Resource and Estimate Model (low/base/high person-hours or FTE-months by role/workstream; internal capacity and loaded-rate basis; vendor/partner effort and rate basis; duration, dependencies, confidence, and source/assumption for each input. Make internal, vendor, and hybrid scenarios comparable.)",
      "AI-Assisted Product Development (where relevant: Claude Code/Codex use cases, required product/data/security skills, human review and testing effort, and an explicit adjustable productivity assumption. Do not treat tool use as guaranteed savings.)",
      "Critical Path Analysis (which workstreams gate others; float in non-critical paths; risk to timeline)",
      "Change Management Timeline (stakeholder communication plan, training schedule, cutover approach)",
      "Governance Cadence (steering committee, workstream sync, escalation triggers)",
    ],
    consultingAnalog: "McKinsey Implementation Roadmap",
  },

  {
    deliverableTypeKey: "business_case",
    documentTitle: "Business Case",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary: "CFO · Board · Sponsor",
    documentPurpose:
      "Investment decision document — value thesis, cost structure, and financial returns for funding approval",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Executive Summary (1 page: investment ask, value thesis, headline NPV/IRR/payback only when computed from reviewed inputs; otherwise show the open decision and missing inputs)",
      "Value Architecture (benefit levers traced to root causes from P2; each lever with magnitude, confidence, and baseline reference)",
      "Investment Summary (total cost by category; phasing; peak cash requirement)",
      "Financial Returns (NPV, IRR, payback period — base case; note: detailed model in Financial Model workbook)",
      "Scenario Analysis (Conservative / Base / Optimistic — key assumption difference per scenario; not sensitivity table — that is in the Financial Model)",
      "Investment Risks (5 risks that could impair value; mitigation; residual exposure)",
      "Funding Ask & Approval Path (amount requested; phasing; approval authority; conditions)",
    ],
    consultingAnalog: "McKinsey Business Case & Investment Memo",
    generationPromptHint:
      "This is an executive document — every number must be traceable to the approved finance baseline. Do NOT include detailed financial tables (those belong in the Financial Model Excel). Focus on the narrative investment thesis and headline returns.",
  },

  {
    deliverableTypeKey: "financial_model",
    documentTitle: "Financial Model",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary: "Finance team · CFO · Engagement team",
    documentPurpose:
      "Interactive financial model — client can update assumptions (discount rate, FTE rates, adoption curves) and see recalculated NPV/IRR",
    formatRecommendation: "excel",
    gateArtifact: false,
    standAlone: true,
    excelSheets: [
      {
        sheetName: "Assumptions",
        purpose:
          "Editable input parameters — clients update these cells to run scenarios",
        editable: true,
        markdownSection: "ASSUMPTIONS",
      },
      {
        sheetName: "Benefit Levers",
        purpose:
          "Named benefit levers with year-by-year magnitude estimates and confidence ratings",
        editable: true,
        markdownSection: "BENEFIT_LEVERS",
      },
      {
        sheetName: "Implementation Costs",
        purpose:
          "Editable role-based internal/vendor effort, rates, other cost drivers, and year-by-year phasing",
        editable: true,
        markdownSection: "IMPLEMENTATION_COSTS",
      },
      {
        sheetName: "Value Model",
        purpose:
          "Year-by-year cash flows, cumulative NPV, IRR, payback period — formulas reference Assumptions tab",
        editable: false,
        markdownSection: "VALUE_MODEL",
      },
      {
        sheetName: "Scenarios",
        purpose: "Conservative / Base / Optimistic scenario comparison",
        editable: false,
        markdownSection: "SCENARIOS",
      },
    ],
    sections: [
      "## ASSUMPTIONS\nGenerate a markdown table with columns: Parameter | Low | Base | High | Unit | Evidence or assumption | Owner to validate. Include discount rate, analysis period, implementation start, internal loaded rates by role, vendor rate basis by role/work package, adoption curve, data readiness, integration complexity, environments, migration, security/testing, and any AI-assisted development productivity assumption. Keep every input editable and identify who reviews it.",
      "## BENEFIT_LEVERS\nGenerate a markdown table with columns: Lever Name | Category | Baseline Ref | Year 1 ($M) | Year 2 ($M) | Year 3 ($M) | Year 4 ($M) | Year 5 ($M) | Confidence | Notes\nTrace each lever to a root cause from P2. Include all identified value levers.",
      "## IMPLEMENTATION_COSTS\nGenerate a markdown table with columns: Work Package | Role / Cost Category | Delivery Model (Internal/Vendor/Hybrid) | Effort (hours or FTE-months) | Rate | Rate Source | Low Cost | Base Cost | High Cost | Timing | Assumption / Evidence | Human Reviewer. Include software, implementation services, internal labor, vendor labor, infrastructure, data migration, security/testing, and adoption/change only when in scope. Show the arithmetic for effort × rate and phase totals; do not fabricate rates.",
      "## VALUE_MODEL\nGenerate a markdown table with columns: Year | Total Benefits ($M) | Total Costs ($M) | Net Cash Flow ($M) | Cumulative Cash Flow ($M) | Discounted Cash Flow ($M)\nAlso include a summary row: NPV ($M) | IRR (%) | Payback Period (years)",
      "## SCENARIOS\nGenerate a markdown table with columns: Scenario | Key Assumption Difference | NPV ($M) | IRR (%) | Payback (years) | Probability Weight\nRows: Conservative, Base Case, Optimistic",
    ],
    consultingAnalog: "McKinsey Financial Model / Investment Analysis Workbook",
    generationPromptHint:
      "Generate ONLY structured markdown tables in the exact section format specified. Do NOT add narrative paragraphs between sections. Separate internal, vendor, and hybrid cases. Show role-level effort × rate arithmetic, confidence, evidence/assumption status, and editable inputs. Where Claude Code/Codex or similar AI coding tools may accelerate product development, model the productivity effect as a user-editable assumption and include human review, testing, security, and rework effort; never assert automatic savings. If finance-grade baseline, cost, benefit, and sensitivity inputs are absent, produce an input register with open inputs and formulas rather than a filled model. Every numeric value must be cited, explicitly labelled as an assumption, or left open. Final estimates require named human review before approval.",
  },

  {
    deliverableTypeKey: "tower_metrics_plan",
    documentTitle: "Tower Metrics Plan",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary: "Tower team · Delivery lead · Sponsor",
    documentPurpose:
      "Defines what Tower measures post-handoff — KPIs, measurement methodology, owners, and reporting cadence",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Measurement Philosophy (how success is defined post-handoff; lag vs. lead indicators; attribution approach)",
      "KPI Definitions (for each value lever: metric name, definition, calculation methodology, data source, baseline, target, measurement frequency)",
      "Ownership Matrix (per KPI: accountable owner, reporting owner, data owner — named individuals)",
      "Reporting Design (dashboard structure, cadence, audience, escalation triggers)",
      "Baseline Establishment Plan (how baselines are locked before go-live; required data infrastructure)",
      "Risk to Measurement (data quality risks, attribution challenges, mitigations)",
    ],
    consultingAnalog: "McKinsey Measurement Framework & KPI Design",
    generationPromptHint:
      "Produce a compact measurement plan, not a second business case. Use tables for metric definition, owner, source, baseline status, cadence, and acceptance rule. Do not assert realized value, annual savings, ROI, NPV, payback, or target value without cited evidence.",
  },

  {
    deliverableTypeKey: "readiness_and_change_plan",
    documentTitle: "Readiness & Change Plan",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary: "Sponsor · Delivery lead · Change owner",
    documentPurpose:
      "Confirms the organization, governance cadence, adoption path, risks, and handoff conditions needed before mobilization.",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Executive Readiness Verdict (ready / ready with conditions / not ready, with the evidence basis)",
      "Stakeholder and Decision-Rights Map (sponsor, business owner, technology owner, finance reviewer, delivery/change owner, unresolved seats)",
      "Adoption and Change Workplan (communications, training, operating transition, pilot-readiness activities)",
      "Governance and Cadence (steering forum, decision calendar, escalation path, evidence reviews)",
      "Dependency and Risk Register (change, data, operational, vendor, control, and measurement dependencies)",
      "Mobilization Conditions (what must be true before P5 mobilization and Tower handoff)",
    ],
    consultingAnalog: "McKinsey Change Readiness & Mobilization Readiness Plan",
    generationPromptHint:
      "Produce a compact readiness and change plan for the mobilization decision. Use tables for owners, cadence, risks, dependencies, and mobilization conditions. Do not assert funding approval, annual savings, ROI, NPV, payback, target value, or implementation authorization beyond the evidence-backed readiness recommendation.",
  },

  {
    deliverableTypeKey: "mobilization_workshop_guide",
    documentTitle: "Mobilization Workshop Guide",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary:
      "Sponsor · Delivery lead · Tower lead · Workshop participants",
    documentPurpose:
      "Working guide for Mobilize & Handoff — Tower handoff, value-measurement, delivery-readiness, and approval sessions derived from the approved roadmap",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Plan recap (approved roadmap, business case, metrics, readiness conditions, and open caveats)",
      "Mobilization session plan (handoff, execution-readiness, value-measurement, governance, and Tower transition sessions)",
      "Mobilization evidence request list (RACI, workstream plans, approval evidence, baseline locks, Tower measurement inputs, and open risks)",
      "Workshop facilitation guide (questions, execution decisions, acceptance conditions, handoff decisions, and note-review method)",
      "Readiness checklist for the execution handoff gate (what must be uploaded, reviewed, and accepted before execution handoff)",
    ],
    consultingAnalog:
      "Mobilization Workshop Guide / Execution Handoff Preparation Pack",
    generationPromptHint:
      "This is the mobilization working guide, not a roadmap, business case, or handoff package. Be operational: name handoff sessions, owners, evidence requests, value-measurement inputs, readiness decisions, and execution-handoff gate checks. Do not assert execution approval unless evidence supports it.",
  },

  // Backward-compat key for P4 monolithic doc
  {
    deliverableTypeKey: "roadmap",
    documentTitle: "Roadmap & Business Case (Legacy)",
    phase: 4,
    phaseLabel: "P4 Roadmap & Business Case",
    audiencePrimary: "Sponsor · Delivery team",
    documentPurpose:
      "Legacy combined roadmap and business case (deprecated — new generations use split documents)",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    deprecated: true,
    replacedBy: [
      "execution_roadmap",
      "business_case",
      "financial_model",
      "tower_metrics_plan",
    ],
    sections: [],
    consultingAnalog: "Legacy combined P4 document",
  },

  // ── P5: Mobilize & Handoff ─────────────────────────────────────────────────

  {
    deliverableTypeKey: "handoff_package",
    documentTitle: "Mobilization & Tower Handoff Package",
    phase: 5,
    phaseLabel: "P5 Mobilize & Handoff",
    audiencePrimary: "Delivery team · Tower team",
    documentPurpose:
      "Everything the delivery team needs to execute without returning to the program team",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Delivery RACI (named people for every workstream, with accountable owners and escalation paths)",
      "Open Decisions Register (every unresolved decision: what it is, who decides, by when, what is blocked)",
      "Risk Handoff Register (open risks transferring to Tower: likelihood, impact, mitigation owner, trigger)",
      "Artifact Inventory (complete list of all P1–P4 artifacts with status: final / approved / pending)",
      "Operating Procedure Summary (critical operating procedures the delivery team must follow on Day 1)",
    ],
    consultingAnalog: "McKinsey Mobilization & Handoff Package",
  },

  {
    deliverableTypeKey: "value_measurement_contract",
    documentTitle: "Value Measurement Contract",
    phase: 5,
    phaseLabel: "P5 Mobilize & Handoff",
    audiencePrimary: "Executive sponsor · Accountable owner",
    documentPurpose:
      "Formal commitment document — what outcomes are promised, how they will be measured, who is accountable",
    formatRecommendation: "html-word",
    gateArtifact: true,
    standAlone: true,
    sections: [
      "Committed Outcomes (each value lever: baseline, target, timeline, confidence level — no vague ranges)",
      "Measurement Methodology (how each outcome is measured: data source, calculation, frequency)",
      "Accountability Table (named individual accountable for each outcome — with their explicit acknowledgment)",
      "Review Cadence (when outcomes are reviewed, who reviews, what triggers escalation)",
      "Revision Conditions (under what conditions targets can be revised; approval process for revision)",
    ],
    consultingAnalog: "Value Realization Contract / Benefits Realization Plan",
    generationPromptHint:
      'This is a formal accountability document. Every outcome must have a single named accountable individual. No "team" accountability. Target ranges must be specific ($M or %) not qualitative.',
  },

  {
    deliverableTypeKey: "execution_kickoff_guide",
    documentTitle: "Execution Kickoff Guide",
    phase: 5,
    phaseLabel: "P5 Mobilize & Handoff",
    audiencePrimary: "Delivery lead · Tower lead · Accountable owners",
    documentPurpose:
      "Working guide for the first execution cadence — kickoff sessions, handoff validation, value-measurement startup, governance cadence, and first-review instructions after the Move leaves planning",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Execution-ready recap (approved handoff, committed measures, accountabilities, conditions, and open execution caveats)",
      "Kickoff session plan (delivery kickoff, Tower measurement startup, risk review, governance cadence, and owner handoff sessions)",
      "Execution evidence checklist (baseline locks, workstream artifacts, measurement feeds, approval evidence, risk triggers, and first-report inputs)",
      "Facilitation guide for first governance cadence (questions, decisions, escalation rules, and evidence review method)",
      "First-review readiness checklist (what must be captured before the first execution/Tower review)",
    ],
    consultingAnalog: "Execution Kickoff Guide / First Governance Cadence Pack",
    generationPromptHint:
      "This is the execution kickoff working guide, not a new phase-gate approval. Be operational: name sessions, owners, cadence, evidence checks, first-review inputs, and escalation rules. Preserve all caveats and conditions from the approved handoff.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getDeliverableSpec(
  deliverableTypeKey: string,
): DeliverableSpec | undefined {
  return DELIVERABLE_REGISTRY.find(
    (d) => d.deliverableTypeKey === deliverableTypeKey,
  );
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
  1: ["charter", "discovery_plan"],
  2: ["discovery_report", "root_cause_worksheet", "design_workshop_guide"],
  3: [
    "target_state_architecture",
    "solution_design",
    "operating_model_design",
    "requirements_traceability",
    "sourcing_strategy",
    "planning_workshop_guide",
  ],
  4: [
    "execution_roadmap",
    "business_case",
    "financial_model",
    "tower_metrics_plan",
    "readiness_and_change_plan",
    "mobilization_workshop_guide",
  ],
  5: [
    "handoff_package",
    "value_measurement_contract",
    "execution_kickoff_guide",
  ],
};

/** Route-specific P3 scope keeps limited changes estimate-ready, not implementation-designed. */
export function phaseCanonicalKeysForRoute(
  phase: number,
  route?: ConfirmedSolutionRoute | null,
): string[] {
  if (phase === 3 && route?.route === "technical_product") {
    return ["target_state_architecture", "requirements_traceability"];
  }
  if (
    phase === 3 &&
    route?.route === "process_change" &&
    route.workflowChange !== "material" &&
    route.roleAccountabilityChange !== "material"
  ) {
    return [
      "target_state_architecture",
      "process_change_estimate_brief",
      "requirements_traceability",
    ];
  }
  return [...(PHASE_CANONICAL_KEYS[phase] ?? [])];
}

/** Format badge labels */
export const FORMAT_LABELS: Record<DeliverableFormat, string[]> = {
  "html-word": ["HTML", "Word"],
  excel: ["Excel"],
  "html-word-excel": ["HTML", "Word", "Excel"],
  pptx: ["PowerPoint"],
};
