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
  pack_version: "1.0.0",
  authoring_status: "codex_seed_pending_claude_generation",
  generated_model: "codex-static-seed",
  prompt_version: "home-claude-architecture-diagram-pack-v1",
  no_post_claude_mutation: true,
  // Diagrams are bound to the tab whose question they answer, not to the tab they were first
  // drawn for. When the tab set was renamed from our deliverable sections to the reader's
  // questions, these bindings had to move with them or five real SVGs would have gone unrendered.
  diagrams: [
    {
      id: "patterns-enterprise-operating-system",
      tab: "identity",
      title: "Enterprise operating system pattern map",
      subtitle:
        "Connects airline mission domains, technology lanes, and proof gates into one board-readable operating view.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/patterns-enterprise-operating-system.svg",
      confidence: "planning_grade_directional",
      source_refs: ["design_contract_pack", "architecture_graph"],
    },
    {
      id: "economics-value-control",
      tab: "standing",
      title: "Economics and value-control architecture",
      subtitle:
        "Shows the value path from spend and commitments through governed claims and validated outcomes.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/economics-value-control.svg",
      confidence: "planning_grade_directional",
      source_refs: ["tower_value_lane", "contract_register", "usage_observations"],
    },
    {
      id: "posture-evidence-authority",
      tab: "evidence",
      title: "Evidence and authority posture map",
      subtitle:
        "Separates loaded context, indexed evidence, cited answers, and finance-grade value authority.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/posture-evidence-authority.svg",
      confidence: "planning_grade_directional",
      source_refs: ["context_corpus_policy", "evidence_readiness"],
    },
    {
      id: "coherence-domain-architecture-index",
      tab: "architecture",
      title: "Scoped architecture diagram index",
      subtitle:
        "Splits enterprise architecture into smaller, executive-consumable domains rather than one oversized map.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/coherence-domain-architecture-index.svg",
      confidence: "planning_grade_directional",
      source_refs: ["architecture_graph", "relationship_edges"],
    },
    {
      id: "trajectory-executive-shifts",
      tab: "strategy",
      title: "Executive architecture trajectory",
      subtitle:
        "Frames current-state constraints and governed shifts across estate, data, AI, and value realization.",
      asset_path:
        "/generated/home/skyharbor-air/architecture-diagram-pack-v1/trajectory-executive-shifts.svg",
      confidence: "planning_grade_directional",
      source_refs: ["strategy_signals", "enterprise_context_chunks"],
    },
  ],
} satisfies HomeArchitectureDiagramPack;

export const SKYHARBOR_HOME_ARCHITECTURE_DIAGRAM_PACK = pack;

export function diagramForHomeTab(
  tab: HomeLandscapeTabId,
): HomeArchitectureDiagram | null {
  return pack.diagrams.find((diagram) => diagram.tab === tab) ?? null;
}
