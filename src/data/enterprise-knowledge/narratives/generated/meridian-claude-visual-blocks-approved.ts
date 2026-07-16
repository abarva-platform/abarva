import type { KnowledgeHomeVisualBlock } from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

// Generated from Claude-emitted structured visual_blocks data only.
// This file deliberately contains no HTML, SVG, Mermaid, or executable markup.
// Home renders these blocks through HomeVisualBlockRenderer, which reads named
// fields as escaped React text and chooses the visual component itself.
export const MERIDIAN_CLAUDE_HOME_VISUAL_BLOCKS = [
  {
    type: "context_strength_snapshot",
    title: "Where Context Is Strong and Where Evidence Is Needed",
    executive_message:
      "Business functions and risks are well represented, but the data spine and governance controls that gate production remain open.",
    why_it_matters:
      "Leadership can frame and prioritize now, but production approval must wait for identity, governance, and audit evidence.",
    data: {
      rows: [
        {
          dimension: "Business Functions",
          readiness: "Strong",
          note: "30 functions with role-level ownership",
        },
        {
          dimension: "Data Assets & Integrations",
          readiness: "Partial",
          note: "Candidate assets; owners to confirm; no identity spine",
        },
        {
          dimension: "Risks & Controls",
          readiness: "Gap",
          note: "Identity, governance, semantic, audit controls open",
        },
        {
          dimension: "Metrics & Outcomes",
          readiness: "Partial",
          note: "Definitions present, no baselines",
        },
        {
          dimension: "Relationships",
          readiness: "Not validated",
          note: "No validated relationships in this context",
        },
      ],
    },
    evidence_refs: [
      "meridian-health:current-universal:01_business_functions.csv:2",
      "meridian-health:current-universal:11_risks_controls.csv:3",
      "meridian-health:current-universal:14_metrics_outcomes.csv:2",
    ],
    caveats: [
      "Planning-grade synthetic context, not client production evidence.",
    ],
    renderer_hint: "matrix",
    display_priority: 1,
  },
  {
    type: "what_more_context_unlocks",
    title: "What Validating the Shared Foundation Unlocks",
    executive_message:
      "Validating one identity and claims spine unlocks member service, payment integrity, cost transparency, and quality analytics together.",
    why_it_matters:
      "Foundation investment compounds across use cases rather than serving a single worked example.",
    data: {
      rows: [
        {
          foundation: "Patient/member identity spine",
          unlocks: "Member service, quality, payment integrity",
        },
        {
          foundation: "Governed claims + pharmacy layer",
          unlocks: "Payment integrity and cost transparency",
        },
        {
          foundation: "Governance + audit controls",
          unlocks: "Production-safe automation",
        },
      ],
    },
    evidence_refs: [
      "meridian-health:current-universal:05_data_assets_integrations.csv:5",
      "meridian-health:current-universal:09_programs_initiatives.csv:7",
    ],
    caveats: [
      "Foundation is target-state; unlocks are hypotheses, not realized value.",
    ],
    renderer_hint: "card_list",
    display_priority: 2,
  },
  {
    type: "evidence_gap_requests",
    title: "Evidence Still Needed Before Production",
    executive_message:
      "Five gaps — identity, governance, audit/PHI controls, baselines, and program ownership — must be closed before any use case reaches production.",
    why_it_matters:
      "Each closed gap strengthens the context layer for every future use case, not just the member-service example.",
    data: {
      rows: [
        {
          gap: "Identity spine",
          owner: "CDAO",
          module: "Moves",
        },
        {
          gap: "Governance + medallion",
          owner: "CDAO",
          module: "Knowledge",
        },
        {
          gap: "Audit/PHI/HITL controls",
          owner: "CDIO",
          module: "Tower",
        },
        {
          gap: "KPI baselines",
          owner: "CFO",
          module: "Tower",
        },
        {
          gap: "Program ownership + economics",
          owner: "CDAO",
          module: "Source",
        },
      ],
    },
    evidence_refs: [
      "meridian-health:current-universal:11_risks_controls.csv:2",
      "meridian-health:current-universal:11_risks_controls.csv:6",
      "meridian-health:current-universal:14_metrics_outcomes.csv:4",
    ],
    caveats: [
      "Gaps are evidence requests, not failures; all context is planning-grade synthetic.",
    ],
    renderer_hint: "table",
    display_priority: 3,
  },
  {
    type: "module_next_actions",
    title: "Next Best Action by Module",
    executive_message:
      "Knowledge and Intelligence support discovery now; Moves, Source, and Tower need foundation, contract, and baseline evidence first.",
    why_it_matters:
      "Sequencing module use to evidence readiness keeps the program honest about what is decidable today.",
    data: {
      rows: [
        {
          module: "Knowledge",
          action: "Frame discovery; queue relationship evidence",
        },
        {
          module: "Intelligence",
          action: "Rank use cases by readiness and risk",
        },
        {
          module: "Moves",
          action: "Phase-gate identity spine and lakehouse",
        },
        {
          module: "Source",
          action: "Add contract and SLA economics",
        },
        {
          module: "Tower",
          action: "Baseline KPIs before value claims",
        },
      ],
    },
    evidence_refs: [
      "meridian-health:current-universal:09_programs_initiatives.csv:2",
      "meridian-health:current-universal:14_metrics_outcomes.csv:2",
    ],
    caveats: [
      "No realized value or production approval until evidence is validated.",
    ],
    renderer_hint: "strip",
    display_priority: 4,
  },
] satisfies KnowledgeHomeVisualBlock[];
