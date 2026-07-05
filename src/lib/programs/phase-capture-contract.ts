export interface PhaseCaptureSection {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

export interface PhaseCaptureSectionStatus extends PhaseCaptureSection {
  value: string;
  complete: boolean;
}

export interface PhaseCaptureEvaluation {
  phase: number;
  sections: PhaseCaptureSectionStatus[];
  complete: boolean;
  missing: string[];
}

const P0_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "business_trigger",
    label: "Business trigger",
    description: "The event, pain, or opportunity that makes this Move worth opening now.",
    required: true,
  },
  {
    key: "problem_statement",
    label: "Problem statement",
    description: "The specific business/process problem the Move will test and solve.",
    required: true,
  },
  {
    key: "affected_function_process",
    label: "Affected function/process",
    description: "The function, process, queue, or operating area in scope.",
    required: true,
  },
  {
    key: "initial_value_hypothesis",
    label: "Initial value hypothesis",
    description: "The directional value mechanism to test during Charter and Discovery.",
    required: true,
  },
  {
    key: "stakeholder_owner_view",
    label: "Stakeholder / owner view",
    description: "Sponsor candidate, operating owner, decision owner, or role-level accountability.",
    required: true,
  },
  {
    key: "known_evidence",
    label: "Known evidence",
    description: "Uploaded evidence, source families, or facts already available to support the Move.",
    required: true,
  },
  {
    key: "missing_evidence_open_questions",
    label: "Missing evidence / open questions",
    description: "Known gaps, caveats, client-to-complete items, or unresolved questions.",
    required: true,
  },
  {
    key: "recommendation_to_advance",
    label: "Recommendation to advance",
    description: "Human rationale for proceeding, holding, or stopping at this phase gate.",
    required: true,
  },
] as const;

const P1_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "sponsor_commitment",
    label: "Sponsor commitment",
    description: "Sponsor engagement, authority, and decision cadence for the Move.",
    required: true,
  },
  {
    key: "scope_boundary",
    label: "Scope boundary",
    description: "Included and excluded process, user, function, system, or cohort boundaries.",
    required: true,
  },
  {
    key: "success_criteria",
    label: "Success criteria",
    description: "Outcomes, KPIs, and directional targets that Discovery must validate.",
    required: true,
  },
  {
    key: "stakeholder_map",
    label: "Stakeholder map",
    description: "Business, IT, finance, risk, and operational stakeholders needed for Discovery.",
    required: true,
  },
  {
    key: "decision_rights",
    label: "Decision rights",
    description: "Who can approve scope, investment, design decisions, and phase advancement.",
    required: true,
  },
  {
    key: "evidence_plan",
    label: "Evidence plan",
    description: "Evidence families, interviews, workshops, extracts, or templates needed next.",
    required: true,
  },
] as const;

const P2_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "current_state_findings",
    label: "Current-state findings",
    description: "What works, what breaks, and what the loaded evidence says about the current process.",
    required: true,
  },
  {
    key: "baseline_metrics",
    label: "Baseline metrics",
    description: "Cycle time, effort, volume, cost, quality, control, or experience baselines.",
    required: true,
  },
  {
    key: "gaps_root_causes",
    label: "Gaps / root causes",
    description: "Evidence-backed causes, not just symptoms or solution ideas.",
    required: true,
  },
  {
    key: "process_handoffs",
    label: "Process handoffs",
    description: "Human/system handoffs, failure points, queues, and exception loops.",
    required: true,
  },
  {
    key: "data_quality_governance",
    label: "Data quality / governance",
    description: "Data quality issues, source caveats, controls, and approval boundaries.",
    required: true,
  },
  {
    key: "evidence_confidence",
    label: "Evidence confidence",
    description: "Which findings are strong, partial, stale, synthetic, or require client completion.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommendation",
    description: "Proceed, hold, stop, or continue with caveats before entering solution design.",
    required: true,
  },
] as const;

const GENERIC_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "phase_decisions",
    label: "Phase decisions",
    description: "Decisions, tradeoffs, and rationale captured for this phase.",
    required: true,
  },
  {
    key: "evidence_used",
    label: "Evidence used",
    description: "Evidence, artifacts, and client inputs used to support the phase output.",
    required: true,
  },
  {
    key: "open_questions",
    label: "Open questions",
    description: "Missing inputs, caveats, and client-to-complete items.",
    required: true,
  },
  {
    key: "approval_rationale",
    label: "Approval rationale",
    description: "Human rationale for allowing the phase gate to proceed.",
    required: true,
  },
] as const;

// P3 — Compose: choose the future-state approach before locking architecture.
const P3_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "solution_approach",
    label: "Solution approach & options",
    description: "The chosen future-state approach and the alternatives weighed against it.",
    required: true,
  },
  {
    key: "operating_model",
    label: "Operating model & work split",
    description: "How humans and AI split the redesigned work; roles and accountability.",
    required: true,
  },
  {
    key: "process_design",
    label: "Process / workflow design",
    description: "The redesigned end-to-end workflow, decision points, and exception handling.",
    required: true,
  },
  {
    key: "controls_governance",
    label: "Controls & AI governance",
    description: "Controls, risk treatment, and AI/data-rights governance for the approach.",
    required: true,
  },
  {
    key: "architecture_integration",
    label: "Architecture & integration",
    description: "Target systems, integration, and data flows — or the explicit assumptions and open questions.",
    required: true,
  },
  {
    key: "evidence_confidence",
    label: "Evidence confidence",
    description: "Which design choices are evidence-backed vs assumed, and what still needs validation.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommended approach",
    description: "The recommended approach and the rationale for choosing it at this gate.",
    required: true,
  },
] as const;

// P4 — Commit: turn the approach into a funded, sequenced plan.
const P4_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "roadmap_sequencing",
    label: "Roadmap & sequencing",
    description: "The 30/60/90 (or phased) roadmap and the sequencing logic behind it.",
    required: true,
  },
  {
    key: "estimates_capacity",
    label: "Estimates & capacity",
    description: "Effort, cost, and capacity estimates with the method and key assumptions stated.",
    required: true,
  },
  {
    key: "value_plan",
    label: "Value plan & business case",
    description: "Baseline → target value, the mechanism, and the claim rules (no unsupported savings).",
    required: true,
  },
  {
    key: "risks_dependencies",
    label: "Risks & dependencies",
    description: "Delivery risks, dependencies, and mitigations that could change the plan.",
    required: true,
  },
  {
    key: "funding_governance",
    label: "Funding ask & governance",
    description: "What is being funded, the decision requested, and the governance cadence.",
    required: true,
  },
  {
    key: "handoff_plan",
    label: "Source / Tower handoff",
    description: "How work and value-proof metrics hand off to Source and Tower.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommendation to fund",
    description: "Human rationale for funding and advancing to mobilization.",
    required: true,
  },
] as const;

// P5 — Mobilize: prepare to execute and prove value.
const P5_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "mobilization_plan",
    label: "Mobilization plan & RACI",
    description: "The mobilization plan with named owners (RACI), not role placeholders.",
    required: true,
  },
  {
    key: "launch_readiness",
    label: "Launch readiness",
    description: "Entry criteria, environments, access, and go/no-go readiness for launch.",
    required: true,
  },
  {
    key: "value_proof_rules",
    label: "Value-proof rules & metrics",
    description: "How value is measured and what counts as realized vs forecast vs unsupported.",
    required: true,
  },
  {
    key: "first_90_days",
    label: "First 90 days & milestones",
    description: "The first-90-days plan, milestones, and early proof points.",
    required: true,
  },
  {
    key: "governance_cadence",
    label: "Governance & Tower cadence",
    description: "Reporting, governance, and Tower measurement cadence after launch.",
    required: true,
  },
  {
    key: "risks_open_items",
    label: "Open risks & client-to-complete",
    description: "Remaining risks, caveats, and items the client must close before/at launch.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommendation to launch",
    description: "Human rationale for launching and handing off to Tower.",
    required: true,
  },
] as const;

export function getPhaseCaptureSections(phase: number): readonly PhaseCaptureSection[] {
  if (phase === 0) return P0_CAPTURE_SECTIONS;
  if (phase === 1) return P1_CAPTURE_SECTIONS;
  if (phase === 2) return P2_CAPTURE_SECTIONS;
  if (phase === 3) return P3_CAPTURE_SECTIONS;
  if (phase === 4) return P4_CAPTURE_SECTIONS;
  if (phase === 5) return P5_CAPTURE_SECTIONS;
  return GENERIC_CAPTURE_SECTIONS;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function evaluatePhaseCapture(
  phase: number,
  values: Record<string, unknown>,
): PhaseCaptureEvaluation {
  const sections = getPhaseCaptureSections(phase).map((section) => {
    const value = stringValue(values[section.key]);
    return {
      ...section,
      value,
      complete: !section.required || value.length > 0,
    };
  });
  const missing = sections
    .filter((section) => section.required && !section.complete)
    .map((section) => section.label);
  return {
    phase,
    sections,
    complete: missing.length === 0,
    missing,
  };
}

export function phaseCaptureModuleKey(phase: number, sectionKey: string): string {
  return `phase_${phase}_${sectionKey}`;
}
