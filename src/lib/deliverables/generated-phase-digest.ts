import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import type {
  PhaseDigest,
  SolutionContext,
} from "@/lib/programs/solution-context";

function compactArtifactPointer(
  artifact: DeliverableKey,
  html: string,
): string {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${artifact} generated artifact: ${text.slice(0, 1200)}`;
}

export function buildGeneratedPhaseDigest(args: {
  artifact: DeliverableKey;
  phase: number;
  html: string;
  context: SolutionContext;
}): PhaseDigest {
  const { artifact, phase, html, context } = args;
  const pointer = compactArtifactPointer(artifact, html);

  if (artifact === "charter") {
    return {
      useCase:
        context.useCase ?? context.useCaseCandidate ?? context.problemSeed,
      kpis: context.kpis ?? [
        { name: "KPI baseline and target to be confirmed", domain: "other" },
      ],
      priority: context.priority ?? "Priority to be confirmed at charter gate.",
      valueHypothesis:
        context.valueHypothesis ??
        "Value hypothesis captured in the generated charter.",
      decisions: [
        {
          phase,
          decision: "Charter artifact generated",
          rationale:
            "Use case, KPI frame, scope, and value hypothesis are ready for human review.",
        },
      ],
    };
  }

  if (artifact === "discovery_report" || artifact === "root_cause_worksheet") {
    return {
      currentState: context.currentState,
      gaps: context.gaps?.length
        ? context.gaps
        : ["Gap analysis captured in the generated discovery artifact."],
      rootCauses: context.rootCauses?.length
        ? context.rootCauses
        : [
            "Root-cause narrative captured in the generated discovery artifact.",
          ],
      evidenceMap: context.evidenceMap,
      decisions: [
        {
          phase,
          decision: "Discovery and gap analysis generated",
          rationale:
            "Current state, data flows, gaps, and diagnosis are available for approach options.",
        },
      ],
    };
  }

  if (artifact === "solution_approach_options") {
    return {
      approach: context.approach ?? pointer,
      options: context.options,
      tradeoffsAccepted: context.tradeoffsAccepted,
      decisions: [
        {
          phase,
          decision: "Solution approach options generated",
          rationale:
            "Human must approve a chosen option before target architecture generation proceeds.",
        },
      ],
    };
  }

  if (artifact === "target_state_architecture") {
    return {
      architecture: pointer,
      patterns: context.patterns,
      integrationContracts: context.integrationContracts,
      securityModel: context.securityModel,
      decisions: [
        {
          phase,
          decision: "Target-state architecture generated",
          rationale: `Architecture is anchored to approved option: ${context.chosenOption ?? "not recorded"}.`,
        },
      ],
    };
  }

  if (
    artifact === "solution_design" ||
    artifact === "operating_model_design" ||
    artifact === "sourcing_strategy"
  ) {
    return {
      solutionDesign: pointer,
      decisions: [
        {
          phase,
          decision: `${artifact} generated`,
          rationale:
            "Solution design detail is available for roadmap and business case.",
        },
      ],
    };
  }

  if (artifact === "execution_roadmap") {
    return {
      roadmap: pointer,
      risks: context.risks,
      decisions: [
        {
          phase,
          decision: "Execution roadmap generated",
          rationale:
            "3/6/9/12-month path is available for business case and handoff.",
        },
      ],
    };
  }

  if (
    artifact === "business_case" ||
    artifact === "financial_model" ||
    artifact === "tower_metrics_plan"
  ) {
    return {
      businessCase: pointer,
      investmentAsk: context.investmentAsk,
      valuePlan: context.valuePlan,
    };
  }

  return {
    decisions: [
      {
        phase,
        decision: `${artifact} generated`,
        rationale:
          "Artifact generated and recorded in the cumulative move history.",
      },
    ],
  };
}
