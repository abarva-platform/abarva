import {
  isBusinessChangeAssessmentComplete,
  isSolutionRouteValidationComplete,
  type ConfirmedSolutionRoute,
} from "@/lib/programs/solution-route-assessment";
import { evaluateEstimateModel } from "@/lib/programs/estimate-model";
import { p1CharterEvidenceFamilyForSection } from "@/lib/programs/p1-charter-evidence";
import { resolveChangeProfile } from "@/lib/programs/phase-workflow-registry";

export interface PhaseCaptureSection {
  key: string;
  label: string;
  description: string;
  required: boolean;
  evidenceFamily?: string;
  /**
   * A short worked example of a good answer, shown as the input placeholder so
   * an empty field reads as empty-with-guidance ("e.g. …") instead of echoing
   * the prompt back as ghost text. The `description` is the helper above the
   * field; the `example` is what belongs INSIDE it.
   */
  example?: string;
  /**
   * When `"facts"`, this section is captured as structured metric·value·source
   * rows (stored as JSON in the value) rather than free text — see
   * `diagnosis-facts.ts`. The workspace renders a facts table for it.
   */
  structured?:
    | "facts"
    | "business-change"
    | "solution-route"
    | "estimate-model";
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
    description:
      "The event, pain, or opportunity that makes this Move worth opening now.",
    required: true,
  },
  {
    key: "problem_statement",
    label: "Problem statement",
    description:
      "The specific business/process problem the Move will test and solve.",
    required: true,
  },
  {
    key: "affected_function_process",
    label: "In scope",
    description:
      "The function, process, queue, cohort, or operating area this Move covers.",
    required: true,
  },
  {
    key: "scope_out",
    label: "Out of scope",
    description: "What this Move explicitly excludes.",
    required: true,
  },
  {
    key: "initial_value_hypothesis",
    label: "Initial value hypothesis",
    description:
      "The pain, the directional value, and the causal mechanism to test during Charter and Discovery.",
    required: true,
  },
  {
    key: "outcomes_success",
    label: "Intended outcomes / success criteria",
    description:
      "The outcomes this Move should create and how P2 discovery will know they were validated.",
    required: true,
  },
  {
    key: "discovery_questions",
    label: "Discovery questions / hypotheses to test",
    description: "What is believed but unproven, and what P2 must go answer.",
    required: true,
  },
  {
    key: "stakeholder_owner_view",
    label: "Outcome owner and stakeholder view",
    description:
      "Outcome owner, operating owner, and role-level accountability. Capture a sponsor only as a progress contact with an explicit email preference; Moves approvals belong to an authorized workspace user.",
    required: true,
  },
  {
    key: "known_evidence",
    label: "Known evidence",
    description:
      "Uploaded evidence, source families, or facts already available to support the Move.",
    required: true,
  },
  {
    key: "missing_evidence_open_questions",
    label: "Missing evidence / open questions",
    description:
      "Known gaps, caveats, client-to-complete items, unresolved questions, constraints, or dependencies.",
    required: true,
  },
  {
    key: "recommendation_to_advance",
    label: "Recommendation to advance",
    description:
      "Human rationale for proceeding, holding, or stopping at this phase gate.",
    required: true,
  },
] as const;

const P1_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    // Keep the legacy storage key so existing phase-capture records remain
    // readable; its governed content is now contact data, never approval.
    key: "sponsor_commitment",
    evidenceFamily: p1CharterEvidenceFamilyForSection("sponsor_commitment")!.id,
    label: "Sponsor contact and progress updates",
    description:
      "The sponsor's name, role, and email. We only record them for progress updates — sponsor sign-off is not required to complete the charter.",
    example:
      "e.g. Priya Nair, Chief Data & Analytics Officer — priya.nair@company.example · wants a weekly progress email",
    required: true,
  },
  {
    key: "scope_boundary",
    evidenceFamily: p1CharterEvidenceFamilyForSection("scope_boundary")!.id,
    label: "Scope boundary",
    description:
      "The process, users, functions, systems, or cohorts this move will — and won't — touch.",
    example:
      "e.g. In: member-services voice & chat queues and the claims-status lookup. Out: self-service channels and changes to the claims platform.",
    required: true,
  },
  {
    key: "success_criteria",
    evidenceFamily: p1CharterEvidenceFamilyForSection("success_criteria")!.id,
    label: "Success criteria",
    description:
      "The outcomes and directional targets Discovery will validate. Rough is fine at this stage.",
    example:
      "e.g. First-contact resolution up and average handle time down against a loaded baseline; CSAT held flat or better.",
    required: true,
  },
  {
    key: "stakeholder_map",
    evidenceFamily: p1CharterEvidenceFamilyForSection("stakeholder_map")!.id,
    label: "Stakeholder map",
    description:
      "The business, IT, finance, risk, and operational stakeholders Discovery will need.",
    example:
      "e.g. Member Experience (owner), Contact Center ops, Health Plan Operations, Privacy, Enterprise Architecture, CRM & claims app owners.",
    required: true,
  },
  {
    key: "decision_rights",
    evidenceFamily: p1CharterEvidenceFamilyForSection("decision_rights")!.id,
    label: "Decision rights",
    description:
      "Who can approve scope, investment, design decisions, and advancing to the next phase.",
    example:
      "e.g. Chief Experience Officer approves scope and each gate; Privacy approves member-data handling; EA approves the integration pattern.",
    required: true,
  },
  {
    key: "evidence_plan",
    evidenceFamily: p1CharterEvidenceFamilyForSection("evidence_plan")!.id,
    label: "Evidence plan",
    description:
      "The evidence, interviews, workshops, or data extracts to gather next.",
    example:
      "e.g. Transcript governance, a real-time claims-integration test, the intent taxonomy, and the first-contact-resolution baseline.",
    required: true,
  },
  {
    key: "business_change_assessment",
    evidenceFamily: p1CharterEvidenceFamilyForSection(
      "business_change_assessment",
    )!.id,
    label: "Business change & adoption owner",
    description:
      "Record the expected workflow and role impact from approved evidence or accountable business-owner input, who owns adoption, and who validates the assessment. This is a P1 hypothesis to test in P2, not the final route decision.",
    structured: "business-change",
    required: true,
  },
] as const;

const P2_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "current_state_findings",
    label: "Current-state findings",
    description:
      "What works, what breaks, and what the loaded evidence says about the current process.",
    required: true,
  },
  {
    key: "baseline_metrics",
    label: "Baseline metrics",
    structured: "facts",
    description:
      "Cycle time, effort, volume, cost, quality, control, or experience baselines.",
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
    description:
      "Human/system handoffs, failure points, queues, and exception loops.",
    required: true,
  },
  {
    key: "data_quality_governance",
    label: "Data quality / governance",
    description:
      "Data quality issues, source caveats, controls, and approval boundaries.",
    required: true,
  },
  {
    key: "evidence_confidence",
    label: "Evidence confidence",
    description:
      "Which findings are strong, partial, stale, synthetic, or require client completion.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommendation",
    description:
      "Proceed, hold, stop, or continue with caveats before entering solution design.",
    required: true,
  },
  {
    key: "solution_route_validation",
    label: "Validate solution route",
    description:
      "Use current-state findings and cited evidence to confirm or correct Nexus's route recommendation. P3 depth changes only after this human validation.",
    structured: "solution-route",
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
    description:
      "Evidence, artifacts, and client inputs used to support the phase output.",
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

// P3 — Design Future State: define the approach to an estimate-ready level.
const P3_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "solution_approach",
    label: "Solution approach & options",
    description:
      "The chosen future-state approach and the alternatives weighed against it.",
    required: true,
  },
  {
    key: "operating_model",
    label: "Operating model & work split",
    description:
      "How humans and AI split the redesigned work; roles and accountability.",
    required: true,
  },
  {
    key: "process_design",
    label: "Process / workflow design",
    description:
      "The redesigned end-to-end workflow, decision points, and exception handling.",
    required: true,
  },
  {
    key: "controls_governance",
    label: "Controls & AI governance",
    description:
      "Controls, risk treatment, and AI/data-rights governance for the approach.",
    required: true,
  },
  {
    key: "architecture_integration",
    label: "Architecture & integration",
    description:
      "Target systems, integration, and data flows — or the explicit assumptions and open questions.",
    required: true,
  },
  {
    key: "evidence_confidence",
    label: "Evidence confidence",
    description:
      "Which design choices are evidence-backed vs assumed, and what still needs validation.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommended approach",
    description:
      "The recommended approach and the rationale for choosing it at this gate.",
    required: true,
  },
] as const;

const P3_TECHNICAL_PRODUCT_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  P3_CAPTURE_SECTIONS[0],
  {
    key: "business_change_boundary",
    label: "Business change boundary & adoption",
    description:
      "Confirm the evidence-backed boundary: the technical team designs and estimates the data product; the named business owner is accountable for training, adoption, and any future process change. Do not produce a full process or operating-model design unless P2 evidence changes the route.",
    required: true,
  },
  P3_CAPTURE_SECTIONS[3],
  P3_CAPTURE_SECTIONS[4],
  P3_CAPTURE_SECTIONS[5],
  P3_CAPTURE_SECTIONS[6],
] as const;

const P3_LIMITED_PROCESS_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  P3_CAPTURE_SECTIONS[0],
  {
    key: "workflow_delta",
    label: "Workflow change delta",
    description:
      "Capture only the affected steps, handoffs, exceptions, and decisions needed to estimate the change. Do not produce a full end-to-end process redesign.",
    required: true,
  },
  {
    key: "process_adoption_boundary",
    label: "Role and adoption boundary",
    description:
      "State what changes for people, what remains unchanged, and the accountable business adoption owner. Do not design a new operating model unless evidence shows material role or accountability change.",
    required: true,
  },
  P3_CAPTURE_SECTIONS[3],
  P3_CAPTURE_SECTIONS[4],
  P3_CAPTURE_SECTIONS[5],
  {
    key: "estimate_assumptions",
    label: "Estimate assumptions and open inputs",
    description:
      "List the evidence-backed sizing inputs, explicit assumptions, confidence, and questions that P4 must resolve before the estimate is final.",
    required: true,
  },
  P3_CAPTURE_SECTIONS[6],
] as const;

// P4 — Roadmap & Business Case: turn the approach into a funded, sequenced plan.
const P4_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "roadmap_sequencing",
    label: "Roadmap & sequencing",
    description:
      "The 30/60/90 (or phased) roadmap and the sequencing logic behind it.",
    required: true,
  },
  {
    key: "estimates_capacity",
    label: "Estimates & capacity",
    description:
      "Human-reviewable low/base/high effort and cost by work package and role: internal, vendor, or hybrid; effort × rate arithmetic; capacity and rate sources; evidence versus assumptions; confidence; Claude Code/Codex productivity assumptions where relevant; and review adjustments before final approval.",
    required: true,
    structured: "estimate-model",
  },
  {
    key: "value_plan",
    label: "Value plan & business case",
    description:
      "Baseline → target value, the mechanism, and the claim rules (no unsupported savings).",
    required: true,
  },
  {
    key: "risks_dependencies",
    label: "Risks & dependencies",
    description:
      "Delivery risks, dependencies, and mitigations that could change the plan.",
    required: true,
  },
  {
    key: "funding_governance",
    label: "Funding ask & governance",
    description:
      "What is being funded, the decision requested, and the governance cadence.",
    required: true,
  },
  {
    key: "handoff_plan",
    label: "Source / Tower handoff",
    description:
      "How work and value-proof metrics hand off to Source and Tower.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Recommendation to fund",
    description: "Human rationale for funding and advancing to mobilization.",
    required: true,
  },
] as const;

// P5 — Mobilize & Handoff: prepare the approved roadmap for external execution.
const P5_CAPTURE_SECTIONS: readonly PhaseCaptureSection[] = [
  {
    key: "mobilization_plan",
    label: "Handoff owners & RACI",
    description:
      "Named receiving, delivery, business, and Tower owners; responsibilities and handoff acceptance. This is not a project execution plan.",
    required: true,
  },
  {
    key: "launch_readiness",
    label: "Handoff readiness",
    description:
      "Approved P4 roadmap, required authorizations, access/dependency owners, open conditions, and explicit handoff acceptance. Do not claim execution has started.",
    required: true,
  },
  {
    key: "value_proof_rules",
    label: "Tower measurement handoff",
    description:
      "Accepted metric definitions, baselines, sources, owners, cadence, and forecast-versus-realized distinctions for Tower after handoff.",
    required: true,
  },
  {
    key: "first_90_days",
    label: "Initial delivery milestones to hand off",
    description:
      "The approved roadmap's initial milestones, owners, dependencies, and reporting fields to transfer to the external execution team; do not run or manage those activities in Moves.",
    required: true,
  },
  {
    key: "governance_cadence",
    label: "Governance & Tower cadence",
    description:
      "Reporting, governance, and Tower measurement cadence after launch.",
    required: true,
  },
  {
    key: "risks_open_items",
    label: "Open risks & client-to-complete",
    description:
      "Remaining risks, caveats, and items the client must close before/at launch.",
    required: true,
  },
  {
    key: "recommendation",
    label: "Handoff recommendation",
    description:
      "Human rationale to accept, condition, defer, or return the roadmap handoff; execution remains outside Moves and Tower tracks outcomes.",
    required: true,
  },
] as const;

export function getPhaseCaptureSections(
  phase: number,
  confirmedSolutionRoute?: ConfirmedSolutionRoute | null,
): readonly PhaseCaptureSection[] {
  if (phase === 0) return P0_CAPTURE_SECTIONS;
  if (phase === 1) return P1_CAPTURE_SECTIONS;
  if (phase === 2) return P2_CAPTURE_SECTIONS;
  if (phase === 3) {
    // The change profile is declared once, in the phase workflow registry, so
    // capture and the step depths read the same rule.
    const profile = resolveChangeProfile(confirmedSolutionRoute);
    if (profile === "technical") return P3_TECHNICAL_PRODUCT_CAPTURE_SECTIONS;
    if (profile === "limited") return P3_LIMITED_PROCESS_CAPTURE_SECTIONS;
    return P3_CAPTURE_SECTIONS;
  }
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
  context: {
    businessChangeAssessment?: unknown;
    approvedEvidenceReferences?: readonly string[];
    confirmedSolutionRoute?: ConfirmedSolutionRoute | null;
  } = {},
): PhaseCaptureEvaluation {
  const sections = getPhaseCaptureSections(
    phase,
    context.confirmedSolutionRoute,
  ).map((section) => {
    const value = stringValue(values[section.key]);
    const structuredComplete =
      section.structured === "business-change"
        ? isBusinessChangeAssessmentComplete(value)
        : section.structured === "solution-route"
          ? isSolutionRouteValidationComplete({
              businessChangeAssessment: context.businessChangeAssessment,
              routeValidation: value,
              approvedEvidenceReferences:
                context.approvedEvidenceReferences ?? [],
            })
          : section.structured === "estimate-model"
            ? evaluateEstimateModel(value).readyForApproval
            : true;
    return {
      ...section,
      value,
      complete: !section.required || (value.length > 0 && structuredComplete),
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

export function phaseCaptureModuleKey(
  phase: number,
  sectionKey: string,
): string {
  return `phase_${phase}_${sectionKey}`;
}
