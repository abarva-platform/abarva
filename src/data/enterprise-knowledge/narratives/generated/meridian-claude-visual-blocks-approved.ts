import type { KnowledgeHomeVisualBlock } from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

// Generated from Claude-emitted structured visual_blocks data only.
// This file deliberately contains no HTML, SVG, Mermaid, or executable markup.
// Home renders these blocks through HomeVisualBlockRenderer, which reads named
// fields as escaped React text and chooses the visual component itself.
export const MERIDIAN_CLAUDE_HOME_VISUAL_BLOCKS = [
  {
    "type": "context_strength_snapshot",
    "title": "Where Context Is Strong and Where Evidence Is Needed",
    "executive_message": "Functions and systems are well understood, but certification, identity, and validated relationships are the gating gaps.",
    "why_it_matters": "It tells leadership exactly which foundations to fund before any AI use case can move to production.",
    "data": {
      "rows": [
        {
          "dimension": "Business Functions",
          "readiness": "Strong",
          "story": "Owners and capabilities readable across the enterprise"
        },
        {
          "dimension": "Applications & Systems",
          "readiness": "Strong",
          "story": "Current-state estate represented; cloud is target-state"
        },
        {
          "dimension": "Data Assets & Integrations",
          "readiness": "Partial",
          "story": "Candidate data products with owners to confirm"
        },
        {
          "dimension": "Risks & Controls",
          "readiness": "Partial",
          "story": "High-severity governance and identity gaps open"
        },
        {
          "dimension": "Relationships",
          "readiness": "Gap",
          "story": "No validated cross-domain links yet"
        }
      ]
    },
    "evidence_refs": [
      "meridian-health:current-universal:01_business_functions.csv:2",
      "meridian-health:current-universal:04_applications_systems.csv:3",
      "meridian-health:current-universal:11_risks_controls.csv:3"
    ],
    "caveats": [
      "Planning-grade synthetic context, not real Meridian production data"
    ],
    "renderer_hint": "matrix",
    "display_priority": 1
  },
  {
    "type": "what_more_context_unlocks",
    "title": "What Closing the Foundation Gaps Unlocks",
    "executive_message": "Loading identity, medallion certification, and governance turns isolated inventories into a foundation many use cases can share.",
    "why_it_matters": "It shows that one round of evidence work compounds across cost, quality, payment integrity, and member experience.",
    "data": {
      "rows": [
        {
          "if_provided": "Patient/member identity spine",
          "unlocks": "Trustworthy contact center, payment integrity, and cost transparency use cases"
        },
        {
          "if_provided": "Medallion certification and governance model",
          "unlocks": "Defensible, auditable AI outputs eligible for production approval"
        },
        {
          "if_provided": "Validated cross-domain relationships",
          "unlocks": "Connective reasoning from systems to owners to outcomes"
        },
        {
          "if_provided": "KPI baselines",
          "unlocks": "Value framing that can mature into measured realization"
        }
      ]
    },
    "evidence_refs": [
      "meridian-health:current-universal:05_data_assets_integrations.csv:5",
      "meridian-health:current-universal:09_programs_initiatives.csv:9",
      "meridian-health:current-universal:14_metrics_outcomes.csv:4"
    ],
    "caveats": [
      "Unlocks describe potential, not realized outcomes"
    ],
    "renderer_hint": "card_list",
    "display_priority": 2
  },
  {
    "type": "evidence_gap_requests",
    "title": "Evidence Still Needed Before Production",
    "executive_message": "Five focused evidence requests convert candidate context into a production-ready foundation.",
    "why_it_matters": "It gives owners a concrete, prioritized ask instead of an open-ended data hunt.",
    "data": {
      "rows": [
        {
          "request": "Identity resolution design and ownership",
          "owner": "CDAO / Data Platform"
        },
        {
          "request": "Medallion certification and governance operating model",
          "owner": "CDAO with Technology Platform"
        },
        {
          "request": "Transcript, PHI, and AI audit controls",
          "owner": "Privacy and Security"
        },
        {
          "request": "KPI baselines and measurement ownership",
          "owner": "Finance and function owners"
        },
        {
          "request": "Validated system-to-function-to-owner relationships",
          "owner": "Enterprise architecture"
        }
      ]
    },
    "evidence_refs": [
      "meridian-health:current-universal:11_risks_controls.csv:6",
      "meridian-health:current-universal:11_risks_controls.csv:8",
      "meridian-health:current-universal:14_metrics_outcomes.csv:5"
    ],
    "caveats": [
      "Gaps are evidence requests that strengthen the foundation for every future use case"
    ],
    "renderer_hint": "table",
    "display_priority": 3
  },
  {
    "type": "module_next_actions",
    "title": "Next Best Action by Module",
    "executive_message": "Each Nexus module has a clear next step keyed to the evidence it still needs.",
    "why_it_matters": "It routes the same foundation work into the right decision surface without duplicating effort.",
    "data": {
      "rows": [
        {
          "module": "Knowledge",
          "action": "Close identity, certification, and relationship gaps"
        },
        {
          "module": "Intelligence",
          "action": "Prioritize AI bets while validating PHI and audit controls"
        },
        {
          "module": "Moves",
          "action": "Phase-gate the lakehouse foundation and one worked example"
        },
        {
          "module": "Source",
          "action": "Load vendor contract economics before sourcing scope"
        },
        {
          "module": "Tower",
          "action": "Establish baselines before value realization tracking"
        }
      ]
    },
    "evidence_refs": [
      "meridian-health:current-universal:09_programs_initiatives.csv:3",
      "meridian-health:current-universal:07_vendors_contracts.csv:7"
    ],
    "caveats": [
      "Actions are planning steps on synthetic demo context, not production commitments"
    ],
    "renderer_hint": "strip",
    "display_priority": 4
  }
] satisfies KnowledgeHomeVisualBlock[];
