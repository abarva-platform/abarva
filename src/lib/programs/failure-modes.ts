// Slice OV2-6a — Failure-mode catalog foundation
// See docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md (Part A) for
// the research-grounded list of 10 failure modes the Programs module exists to
// prevent. This file is the single source of truth referenced by phase packs,
// pattern seeds, gate evaluators, agent doctrine, and telemetry.

export type ResearchSource =
  | 'Gartner'
  | 'RAND'
  | 'MIT/BCG'
  | 'McKinsey'
  | 'Forrester';

export interface ResearchAnchor {
  source: ResearchSource;
  citation: string;
  url?: string;
}

export interface FailureMode {
  /** Stable id 1..10. Tags reference these numbers. */
  id: number;
  /** Canonical name — used verbatim in UI and audit log. */
  name: string;
  /** One-sentence description, senior-practitioner voice. */
  shortDescription: string;
  /** Phase numbers (0..6) where prevention is most efficient. */
  primaryPhases: number[];
  /** At least two anchors; cited from major-firm research. */
  researchAnchors: ResearchAnchor[];
  /** How the Programs module prevents this failure. */
  preventionMechanism: string;
}

export const FAILURE_MODES: readonly FailureMode[] = [
  {
    id: 1,
    name: 'Lack of executive sponsorship and ownership',
    shortDescription:
      'No named executive with budget authority, decision rights, and calendar commitment owns the program.',
    primaryPhases: [0],
    researchAnchors: [
      {
        source: 'McKinsey',
        citation:
          'McKinsey State of AI: high-performer leaders are roughly 3x more likely to demonstrate active AI ownership than peers, and CEO oversight of AI governance is a primary correlate of bottom-line impact.',
      },
      {
        source: 'MIT/BCG',
        citation:
          'MIT Sloan Management Review / BCG: organizations that achieve significant financial benefits from AI consistently cite senior leadership engagement as a defining differentiator.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: AI initiatives without an empowered executive sponsor stall in early phases regardless of technical merit.',
      },
    ],
    preventionMechanism:
      'P0 step `p0-sponsor-candidate` is a complex step that requires a real sponsor 1:1 with notes uploaded; Gate 1 (P0 -> P1) cannot pass without an `engagement_participants` row carrying plausible authority and a calendar cadence commitment.',
  },
  {
    id: 2,
    name: 'Unclear problem definition or business objectives',
    shortDescription:
      'Program operates on slogans rather than a testable claim about cohort, behavior change, mechanism, and value direction.',
    primaryPhases: [0, 2],
    researchAnchors: [
      {
        source: 'RAND',
        citation:
          'RAND root-cause study of failed AI projects: misunderstanding or miscommunication of the problem to be solved is the single most common failure pattern.',
      },
      {
        source: 'MIT/BCG',
        citation:
          'MIT GenAI Divide research: the dominant reason GenAI pilots fail to deliver value is that the underlying business problem was never specified well enough to test.',
      },
      {
        source: 'Gartner',
        citation:
          'Gartner: unclear or unmeasurable business value is consistently among the top reasons AI projects are abandoned before production.',
      },
    ],
    preventionMechanism:
      'P0 value-hypothesis-seed forces cohort x behavior change x mechanism x direction before Discovery spend; P2 synthesis re-tests the hypothesis against gathered evidence and blocks advance if the claim has not converged.',
  },
  {
    id: 3,
    name: 'Lack of data foundation',
    shortDescription:
      'Insufficient data quality, ownership, lineage, or accessibility to support the program at production scale.',
    primaryPhases: [1, 2],
    researchAnchors: [
      {
        source: 'Gartner',
        citation:
          'Gartner: 43% of AI leaders cite data availability and quality as their top obstacle, and inadequate data is projected to drive ~60% of AI project abandonments through 2026.',
      },
      {
        source: 'RAND',
        citation:
          'RAND: lack of adequate, accessible, and trustworthy data is the second most-cited root cause of AI project failure across the studied portfolio.',
      },
      {
        source: 'McKinsey',
        citation:
          'McKinsey: leading AI adopters invest disproportionately in data foundations (lineage, quality, access controls) before scaling models.',
      },
    ],
    preventionMechanism:
      'P1 Discovery requires a baseline data-asset inventory and quality assessment per pattern; P2 synthesis blocks advance if data ownership, lineage, and access paths are not resolved with named owners.',
  },
  {
    id: 4,
    name: 'Lack of right talent and skills',
    shortDescription:
      'Program is staffed without the SMEs, data engineering capacity, or operating-team literacy needed to execute and adopt.',
    primaryPhases: [0, 1],
    researchAnchors: [
      {
        source: 'Gartner',
        citation:
          'Gartner: ~35% of organizations cite the AI skills and literacy gap as a primary barrier; 38% of I&O failures are attributed to skills shortfalls.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: enterprise AI programs that do not name SME and data-engineering roles up front systematically miss adoption targets.',
      },
      {
        source: 'McKinsey',
        citation:
          'McKinsey: organizations capturing AI value invest in role-specific upskilling and embed translators between business and technical teams.',
      },
    ],
    preventionMechanism:
      'Pattern catalog declares `smesNeeded[]` per phase per archetype; the Phase 0 primer renders the team the program needs and gates advance until those roles are named.',
  },
  {
    id: 5,
    name: 'Lack of business commitment to operating-model and workflow change',
    shortDescription:
      'The business will not redesign the workflow or operating model the AI capability is supposed to change, so value never lands.',
    primaryPhases: [3, 5, 6],
    researchAnchors: [
      {
        source: 'McKinsey',
        citation:
          'McKinsey State of AI: workflow redesign is the single biggest EBIT-driving practice associated with realized value from generative AI.',
      },
      {
        source: 'MIT/BCG',
        citation:
          'MIT GenAI Divide: failure to integrate GenAI into the operating workflow dominates the gap between high- and low-performers.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: AI value is unlocked when business owners commit to operating-model changes, not when models are simply deployed alongside legacy workflows.',
      },
    ],
    preventionMechanism:
      'P3 Design requires an explicit operating-model delta and named change-owners; P5 Activate requires evidence of workflow changes in production, not just deployed models; P6 Operate measures sustained behavior change.',
  },
  {
    id: 6,
    name: 'Late attention to governance, privacy, and risk',
    shortDescription:
      'Governance, privacy, and risk controls are bolted on after design, creating rework or blocking production launch.',
    primaryPhases: [2, 3],
    researchAnchors: [
      {
        source: 'Gartner',
        citation:
          'Gartner: inadequate risk controls and AI governance gaps fuel project abandonment and post-launch incident costs.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: governance complexity is rising as regulators converge on AI-specific obligations; programs that defer governance face escalating remediation cost.',
      },
      {
        source: 'McKinsey',
        citation:
          'McKinsey: leading firms embed responsible-AI controls during design, not after deployment, materially lowering downstream risk and rework.',
      },
    ],
    preventionMechanism:
      'P2 synthesis includes a governance/privacy/risk evaluation step keyed to pattern-specific controls; P3 Design requires named risk owners and approved control plans before build can begin.',
  },
  {
    id: 7,
    name: 'Vendor and build-vs-buy strategy errors',
    shortDescription:
      'Wrong sourcing decision: building what should be bought, buying what should be built, or selecting a vendor without disciplined evaluation.',
    primaryPhases: [3],
    researchAnchors: [
      {
        source: 'MIT/BCG',
        citation:
          'MIT GenAI Divide: internally built GenAI applications succeed at roughly one-third the rate of comparable purchased solutions integrated through partners.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: 75% of self-built agentic AI architectures fail to meet their original objectives, with sourcing strategy errors a leading cause.',
      },
      {
        source: 'Gartner',
        citation:
          'Gartner: undisciplined vendor selection and unclear build-vs-buy criteria drive a large share of AI program write-offs.',
      },
    ],
    preventionMechanism:
      'P3 Design includes a sourcing module: structured build-vs-buy criteria, vendor scorecard tied to pattern-specific must-haves, and a sponsor-approved sourcing decision before build commences.',
  },
  {
    id: 8,
    name: 'Pilot-to-production scaling gap',
    shortDescription:
      'Promising pilots never make it to production at the scale needed to materially change a business outcome.',
    primaryPhases: [4, 5],
    researchAnchors: [
      {
        source: 'McKinsey',
        citation:
          'McKinsey: roughly 73% of AI pilots never advance beyond the pilot phase to production-scale deployment.',
      },
      {
        source: 'MIT/BCG',
        citation:
          'MIT GenAI Divide: ~95% of GenAI pilots fail to deliver measurable revenue or margin acceleration at enterprise scale.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: most AI pilots stall short of the operational integration, change management, and measurement scaffolding required for production.',
      },
    ],
    preventionMechanism:
      'P4 Build requires a production-readiness checklist (operations, monitoring, support runbooks); P5 Activate gate requires evidence that the capability is live in the production workflow with measured usage, not a parallel pilot environment.',
  },
  {
    id: 9,
    name: 'Inability to measure outcomes and impact',
    shortDescription:
      'No baseline, no leading KPIs, no causal link between the AI capability and the business outcome being claimed.',
    primaryPhases: [1, 5, 6],
    researchAnchors: [
      {
        source: 'McKinsey',
        citation:
          'McKinsey: organizations that define leading KPIs for AI initiatives realize materially higher value and lower risk than those that do not.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: only ~15% of AI initiatives can demonstrate EBITDA-level financial gain, primarily because outcome measurement was not designed in.',
      },
      {
        source: 'Gartner',
        citation:
          'Gartner: inability to demonstrate business value is among the top causes cited when AI projects are cancelled or de-funded.',
      },
    ],
    preventionMechanism:
      'P1 Discovery captures a baseline with provenance keyed to the pattern (e.g. AHT/CSAT for Contact Center, MAPE/WAPE for Demand Forecasting); P5 and P6 require post-deployment measurement against that baseline before outcomes can be settled.',
  },
  {
    id: 10,
    name: 'Unrealistic expectations and use-case sprawl',
    shortDescription:
      'Too many concurrent initiatives, each over-promising; portfolio cannot focus and no single program gets to value.',
    primaryPhases: [0, 6],
    researchAnchors: [
      {
        source: 'Gartner',
        citation:
          'Gartner: 57% of failed AI projects are characterized by stakeholders having "expected too much too fast," outpacing realistic delivery timelines.',
      },
      {
        source: 'Forrester',
        citation:
          'Forrester: enterprises commonly run dozens of disconnected AI pilots without a prioritization framework, producing portfolio sprawl and no flagship outcome.',
      },
      {
        source: 'McKinsey',
        citation:
          'McKinsey: portfolios that focus on a small number of high-value use cases consistently outperform breadth-first portfolios on realized financial impact.',
      },
    ],
    preventionMechanism:
      'P0 Tenant Admin approval gate filters new programs against the active portfolio for overlap and capacity; P6 closeout harvests outcomes into the pattern catalog so unrealistic claims surface in the next program of the same archetype.',
  },
] as const;

/**
 * Look up a failure mode by id (1..10). Returns null when no entry matches.
 */
export function getFailureMode(id: number): FailureMode | null {
  return FAILURE_MODES.find((mode) => mode.id === id) ?? null;
}

/**
 * Return every failure mode whose `primaryPhases` includes the given phase
 * number (0..6). Order matches the catalog order.
 */
export function getFailureModesForPhase(phase: number): FailureMode[] {
  return FAILURE_MODES.filter((mode) => mode.primaryPhases.includes(phase));
}
