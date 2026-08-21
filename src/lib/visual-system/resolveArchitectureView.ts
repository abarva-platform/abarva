import type { TechRecordType } from "@/lib/home/preview/types";
import type { ArchitectureView } from "@/lib/visual-system/architecture-view-contract";
import { buildBusinessCapabilityLandscapeView } from "@/lib/visual-system/projections/capability-landscape";
import { buildCapabilityToTechnologyView } from "@/lib/visual-system/projections/capability-to-technology";
import {
  buildCurrentStateFlow,
  type CurrentStateFlowResult,
} from "@/lib/visual-system/projections/current-state-flow";
import {
  ARCHITECTURE_VIEW_POLICIES,
  type ArchitectureViewFormat,
} from "@/lib/visual-system/semantics/architecture-view-formats";

export interface ArchitectureAdmissionFailure {
  ruleId: string;
  headline: string;
  detail: string;
  measurement?: string;
}

export interface ArchitectureEvidenceRequest {
  evidenceType: string;
  description: string;
}

export interface ArchitectureViewRefusal {
  format: ArchitectureViewFormat;
  question: string;
  failedRules: ArchitectureAdmissionFailure[];
  evidenceNeeded: ArchitectureEvidenceRequest[];
  supportedAlternatives: ArchitectureViewFormat[];
}

export type ResolvedArchitectureView =
  | { status: "ready"; view: ArchitectureView }
  | {
      status: "refused";
      refusal: ArchitectureViewRefusal;
      attemptedView?: ArchitectureView;
    };

export interface ResolveArchitectureViewRequest {
  format: ArchitectureViewFormat;
  tenantKey: string;
  tenantDisplayName: string;
  canonicalBuild?: string;
  applications?: TechRecordType;
  integrations?: TechRecordType;
  capability?: string | null;
}

export function resolveArchitectureView(
  request: ResolveArchitectureViewRequest,
): ResolvedArchitectureView {
  if (request.format === "executive_landscape") {
    if (!request.applications) return missingInputRefusal(request, "applications");
    return {
      status: "ready",
      view: request.capability
        ? buildCapabilityToTechnologyView({
            tenantKey: request.tenantKey,
            tenantDisplayName: request.tenantDisplayName,
            applications: request.applications,
            capability: request.capability,
            canonicalBuild: request.canonicalBuild,
          })
        : buildBusinessCapabilityLandscapeView({
            tenantKey: request.tenantKey,
            tenantDisplayName: request.tenantDisplayName,
            applications: request.applications,
            audienceLevel: "L1_domain",
            canonicalBuild: request.canonicalBuild,
          }),
    };
  }

  if (request.format === "end_to_end_data_flow") {
    if (!request.integrations) return missingInputRefusal(request, "integrations");
    const result = buildCurrentStateFlow({
      tenantKey: request.tenantKey,
      tenantDisplayName: request.tenantDisplayName,
      integrations: request.integrations,
      applications: request.applications,
      canonicalBuild: request.canonicalBuild,
    });
    const failures = flowAdmissionFailures(result);
    if (failures.length) {
      return {
        status: "refused",
        attemptedView: result.view,
        refusal: {
          format: request.format,
          question: questionFor(request.format),
          failedRules: failures,
          evidenceNeeded: dataFlowEvidenceRequests(),
          supportedAlternatives:
            result.view.edges.length > 0
              ? ["movement_profile", "executive_landscape"]
              : ["estate_evidence", "executive_landscape"],
        },
      };
    }
    return { status: "ready", view: result.view };
  }

  return {
    status: "refused",
    refusal: {
      format: request.format,
      question: questionFor(request.format),
      failedRules: [
        {
          ruleId: "VIEW-NOT-BUILT",
          headline: "This architecture view is not built yet",
          detail:
            "The format is part of the Home architecture taxonomy, but the client-facing renderer has not been implemented.",
        },
      ],
      evidenceNeeded: [
        {
          evidenceType: `${request.format}_renderer`,
          description:
            "A renderer and proof case for this format, routed through resolveArchitectureView.",
        },
      ],
      supportedAlternatives: ["executive_landscape", "estate_evidence"],
    },
  };
}

function flowAdmissionFailures(
  result: CurrentStateFlowResult,
): ArchitectureAdmissionFailure[] {
  const failures: ArchitectureAdmissionFailure[] = [];
  const hasLanding = result.view.nodes.some((node) =>
    ["data_warehouse", "data_mart"].includes(node.layer),
  );
  const hasConsumption = result.view.nodes.some((node) =>
    ["analytics_bi"].includes(node.layer),
  );

  if (!hasLanding || !hasConsumption) {
    failures.push({
      ruleId: "FLOW-LANDING-CONSUMPTION",
      headline: "Landing and consumption are not established",
      detail:
        "The requested view must show where data lands and where it is consumed before Home can render an end-to-end data-flow diagram.",
      measurement: `landing=${hasLanding ? "present" : "missing"}; consumption=${
        hasConsumption ? "present" : "missing"
      }`,
    });
  }

  if (!result.fitness.fitForExecutiveFlow) {
    failures.push({
      ruleId: "FLOW-CONVERGENCE",
      headline: "Shared convergence is not established",
      detail:
        "The requested question requires evidence of multi-hop or shared paths. The current record is mostly one-to-one destinations, so a flow diagram would overstate architecture convergence.",
      measurement: `${Math.round(
        result.fitness.oneToOneTargetRatio * 100,
      )}% of destinations receive exactly one flow; max inbound ${result.fitness.maxInbound}.`,
    });
  }

  return failures;
}

function missingInputRefusal(
  request: ResolveArchitectureViewRequest,
  missing: string,
): ResolvedArchitectureView {
  return {
    status: "refused",
    refusal: {
      format: request.format,
      question: questionFor(request.format),
      failedRules: [
        {
          ruleId: "VIEW-INPUT-MISSING",
          headline: "Required record slice is missing",
          detail: `The ${request.format} view requires ${missing}, but that record slice was not supplied.`,
        },
      ],
      evidenceNeeded: [
        {
          evidenceType: missing,
          description: `Provide the ${missing} record slice from the Home review bundle.`,
        },
      ],
      supportedAlternatives: ["estate_evidence"],
    },
  };
}

function dataFlowEvidenceRequests(): ArchitectureEvidenceRequest[] {
  return [
    {
      evidenceType: "platform_host_relationship",
      description:
        "System, mart, warehouse, integration service and consumption tool relationships with host or landing platform IDs.",
    },
    {
      evidenceType: "intermediate_hop",
      description:
        "Recorded intermediate services, pipelines, event streams, ETL jobs or API gateways between origin and consumption.",
    },
    {
      evidenceType: "consumption_destination",
      description:
        "Report, analytics, AI, workflow, or business-process destinations that consume each flow.",
    },
  ];
}

function questionFor(format: ArchitectureViewFormat): string {
  return ARCHITECTURE_VIEW_POLICIES[format].executiveQuestion;
}
