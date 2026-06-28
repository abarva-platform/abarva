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

export function getPhaseCaptureSections(phase: number): readonly PhaseCaptureSection[] {
  if (phase === 0) return P0_CAPTURE_SECTIONS;
  if (phase === 1) return P1_CAPTURE_SECTIONS;
  if (phase === 2) return P2_CAPTURE_SECTIONS;
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
