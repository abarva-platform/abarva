import type { HomeLandscapeTabId } from "./homeEnterpriseLandscapeV2Model";

export interface HomeArchitectureDiagram {
  id: string;
  tab: HomeLandscapeTabId;
  title: string;
  subtitle: string;
  asset_path: string;
  confidence: string;
  source_refs: string[];
}

export interface HomeArchitectureDiagramPack {
  pack_id: string;
  tenant_key: string;
  tenant_name: string;
  artifact_type: "home_architecture_diagram_pack";
  pack_version: string;
  authoring_status: string;
  generated_model: string;
  prompt_version: string;
  no_post_claude_mutation: boolean;
  diagrams: HomeArchitectureDiagram[];
}

const pack = {
  pack_id: "skyharbor-home-architecture-diagram-pack-v1",
  tenant_key: "skyharbor-air",
  tenant_name: "SkyHarbor Global",
  artifact_type: "home_architecture_diagram_pack",
  pack_version: "v1.0.0",
  authoring_status: "claude_generated_validation_pass",
  generated_model: "claude-sonnet-4-6",
  prompt_version: "home-claude-architecture-diagram-pack-v1",
  no_post_claude_mutation: true,
  diagrams: [
    {
      id: "patterns-enterprise-operating-system",
      tab: "patterns",
      title: "Enterprise operating system pattern map",
      subtitle:
        "A board-level view of how SkyHarbor Global's airline domains, technology estate, data proof, AI gates, and value controls operate as one integrated system.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/patterns-enterprise-operating-system.svg",
      confidence: "planning_grade",
      source_refs: [
        "enterprise_context",
        "architecture_graph",
        "contract_register",
        "tower_value_lane",
      ],
    },
    {
      id: "economics-value-control",
      tab: "economics",
      title: "Economics and value-control architecture",
      subtitle:
        "Maps SkyHarbor Global's $2.35B FY2027 technology budget from committed base through AI use cost to claimable-value gates and finance validation.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/economics-value-control.svg",
      confidence: "planning_grade",
      source_refs: [
        "it_budget_spend_value",
        "vendors_contracts",
        "ai_automation_use_cases",
        "tower_value_lane",
      ],
    },
    {
      id: "posture-evidence-authority",
      tab: "posture",
      title: "Evidence and authority posture map",
      subtitle:
        "Shows where evidence is loaded and indexed, which relationships are directional versus confirmed, and which authority gates must clear before recommendations advance.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/posture-evidence-authority.svg",
      confidence: "planning_grade",
      source_refs: [
        "home_evidence_contract",
        "relationship_edges",
        "architecture_advisory_result",
      ],
    },
    {
      id: "coherence-domain-architecture-index",
      tab: "coherence",
      title: "Scoped architecture diagram index",
      subtitle:
        "Four scoped architecture views - digital channels, ERP/back-office, data and AI, and mainframe/private-cloud infrastructure - mapped across SkyHarbor Global's 444-node estate.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/coherence-domain-architecture-index.svg",
      confidence: "planning_grade",
      source_refs: [
        "applications_systems",
        "data_assets_integrations",
        "infrastructure_platforms",
        "relationship_edges",
      ],
    },
    {
      id: "trajectory-executive-shifts",
      tab: "trajectory",
      title: "Executive shift and gate map",
      subtitle:
        "Gated movement from current-state constraints toward governed modernization across architecture, sourcing, data, and AI - no target-state commitment asserted.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/trajectory-executive-shifts.svg",
      confidence: "planning_grade",
      source_refs: [
        "intelligence_route",
        "moves_route",
        "source_route",
        "tower_route",
      ],
    },
  ],
} satisfies HomeArchitectureDiagramPack;

export const SKYHARBOR_HOME_ARCHITECTURE_DIAGRAM_PACK = pack;

export function diagramForHomeTab(
  tab: HomeLandscapeTabId,
): HomeArchitectureDiagram | null {
  return pack.diagrams.find((diagram) => diagram.tab === tab) ?? null;
}
