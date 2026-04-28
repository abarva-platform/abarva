export type SolutionComponentKind = 'pattern' | 'signal';
export type SolutionComponentRole = 'foundation' | 'variation' | 'signal_calibrator';
export type SolutionCreatedFrom = 'human_authored' | 'deterministic_seed';

export interface SolutionCompositionComponent {
  componentId: string;
  componentKind: SolutionComponentKind;
  role: SolutionComponentRole;
  rationale: string;
}

export interface SolutionSeed {
  id: string;
  slug: string;
  title: string;
  summary: string;
  applicabilityConditions: string[];
  confidence: number;
  instanceCount: number;
  patternIds: string[];
  signalIds: string[];
  compositionManifest: SolutionCompositionComponent[];
  createdAt: string;
  createdBy: SolutionCreatedFrom;
  lastRevisedAt: string;
  lastRevisedBy: string;
}

const SEEDED_AT = '2026-04-28';

// KS-1 uses the merged Phase 1 corpus IDs already remapped by the team:
// PAT-FOW-005 -> PAT-AI-013
// PAT-IND-CROSS-001 -> PAT-AI-010
// PAT-IND-CROSS-002 -> PAT-AI-010
export const SOLUTION_SEEDS: SolutionSeed[] = [
  {
    id: 'SOL-001',
    slug: 'cdp-activation-mid-market-retail',
    title: 'CDP Activation for mid-market retail',
    summary:
      'Packages the Phase 1 CDP readiness, fragmentation, value-trace, and retail-margin signals into a single activation blueprint for retailers that need to move from discovery into a gated design decision.',
    applicabilityConditions: [
      'Mid-market retail organization with fragmented customer identity across POS, ecommerce, loyalty, and marketing channels.',
      'Executive team is actively deciding whether the CDP program is ready to clear a design or implementation gate.',
      'Value claims must be traced back to commercial evidence rather than accepted as sponsor narrative.',
    ],
    confidence: 0.88,
    instanceCount: 1,
    patternIds: ['PAT-CDP-001', 'PAT-CDP-002', 'PAT-CDP-006', 'PAT-IND-RET-001'],
    signalIds: ['SIG-MAN-2025-012'],
    compositionManifest: [
      {
        componentId: 'PAT-CDP-001',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Anchors the readiness model and the named gate conditions for a CDP activation program.',
      },
      {
        componentId: 'PAT-CDP-002',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Explains when customer-data fragmentation is severe enough to justify CDP activation rather than incremental cleanup.',
      },
      {
        componentId: 'PAT-CDP-006',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Requires the value hypothesis to stay linked to normalized commercial evidence and sponsor baselines.',
      },
      {
        componentId: 'PAT-IND-RET-001',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Specializes the solution for retail operating realities where loyalty, merchandising, and margin pressure shape CDP value.',
      },
      {
        componentId: 'SIG-MAN-2025-012',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Provides a current retail signal that AI-driven store and loyalty operations are moving closer to owned-brand and margin workflows.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-002',
    slug: 'coding-agent-rollout-engineering-org-100-500',
    title: 'AI-coding-agent rollout for engineering org of 100-500',
    summary:
      'Bundles rollout economics, ROI attribution, and talent-model implications for engineering organizations adopting coding agents at meaningful seat count rather than as isolated developer experiments.',
    applicabilityConditions: [
      'Engineering organization has roughly 100-500 developers or adjacent technical contributors in scope for coding-agent adoption.',
      'Baseline throughput, quality, and seat-cost metrics can be measured before and after rollout.',
      'Leadership expects the rollout to change review load, senior leverage, or talent-shape decisions rather than just IDE convenience.',
    ],
    confidence: 0.9,
    instanceCount: 1,
    patternIds: ['PAT-AI-006', 'PAT-AI-010', 'PAT-AI-013'],
    signalIds: ['SIG-SRC-2025-002', 'SIG-MAN-2025-001', 'SIG-MAN-2025-015'],
    compositionManifest: [
      {
        componentId: 'PAT-AI-006',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Defines the measurable rollout baseline, seat economics, and validation loop for coding-agent programs.',
      },
      {
        componentId: 'PAT-AI-010',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Normalizes value claims so productivity gains are attributed with an explicit evidence haircut instead of sponsor optimism.',
      },
      {
        componentId: 'PAT-AI-013',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Covers the talent-system consequences of coding-agent maturity, which replaced the earlier future-of-work placeholder in the Phase 1 map.',
      },
      {
        componentId: 'SIG-SRC-2025-002',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Calibrates current Anthropic platform capability for code execution, MCP connectors, files, and longer-lived agent workflows.',
      },
      {
        componentId: 'SIG-MAN-2025-001',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Reinforces that coding is already a leading Claude workload, which supports rollout relevance for engineering teams.',
      },
      {
        componentId: 'SIG-MAN-2025-015',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Adds a market-readiness signal that adoption barriers are falling for globally distributed technical teams.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-003',
    slug: 'ai-tooling-vendor-consolidation-over-10m',
    title: 'Vendor consolidation playbook for AI tooling >$10M',
    summary:
      'Composes AI vendor-sprawl rationalization with sourcing-stage leverage so enterprises can collapse overlapping AI tooling estates without reducing the decision to a feature checklist.',
    applicabilityConditions: [
      'Enterprise AI tooling spend is above $10M or fragmented enough that multiple copilots, model vendors, or agent platforms overlap materially.',
      'At least one renewal, sourcing cycle, or commercial renegotiation window exists inside the next two quarters.',
      'The operating problem is duplication and leverage, not just one product underperforming on its own.',
    ],
    confidence: 0.84,
    instanceCount: 1,
    patternIds: ['PAT-AI-003', 'PAT-SRC-005', 'PAT-SRC-009'],
    signalIds: [],
    compositionManifest: [
      {
        componentId: 'PAT-AI-003',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Defines the core rationalization logic for AI-specific vendor sprawl and overlapping tool estates.',
      },
      {
        componentId: 'PAT-SRC-005',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Introduces sourcing-stage leverage so the rationalization decision can be converted into a commercial motion instead of staying analytical only.',
      },
      {
        componentId: 'PAT-SRC-009',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Adds the downstream decision structure needed to consolidate vendors while preserving implementation accountability and comparability.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-004',
    slug: 'itsm-ai-deployment-deflection-target-35',
    title: 'ITSM AI deployment with deflection target >35%',
    summary:
      'Frames ITSM AI deployment as a deflection-and-economics problem, pairing the service-desk optimization pattern with explicit ROI attribution so underperformance is diagnosable instead of rhetorical.',
    applicabilityConditions: [
      'Service desk or ITSM program is targeting more than 35% ticket deflection through AI assist or self-service automation.',
      'Knowledge-base completeness, workflow integration, and adjacent-assistant overlap are known risk factors.',
      'Leadership needs to understand whether the program should be corrected, expanded, or stopped based on attributable value.',
    ],
    confidence: 0.88,
    instanceCount: 1,
    patternIds: ['PAT-AI-011', 'PAT-AI-010'],
    signalIds: ['SIG-SRC-2025-005', 'SIG-MAN-2025-007', 'SIG-MAN-2026-008'],
    compositionManifest: [
      {
        componentId: 'PAT-AI-011',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Explains the structural blockers behind service-desk AI underperformance, including knowledge-base and workflow readiness.',
      },
      {
        componentId: 'PAT-AI-010',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Turns deflection claims into auditable attributed value so the operating model can distinguish activity from true ROI.',
      },
      {
        componentId: 'SIG-SRC-2025-005',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Calibrates the current ServiceNow product direction toward orchestrated agents and broader enterprise automation.',
      },
      {
        componentId: 'SIG-MAN-2025-007',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Adds a current market signal that ServiceNow is positioning AI as a platform-wide orchestration layer rather than a narrow feature.',
      },
      {
        componentId: 'SIG-MAN-2026-008',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Provides a concrete scaled-deployment reference for Now Assist in operations and ITSM.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-006',
    slug: 'm365-copilot-enterprise-rollout',
    title: 'M365 Copilot enterprise rollout',
    summary:
      'Packages productivity-agent adoption and ROI attribution into an enterprise Copilot rollout model that can separate weak activation from genuinely weak value.',
    applicabilityConditions: [
      'Microsoft 365 Copilot is deployed or planned for a broad knowledge-worker population with thousands of eligible users.',
      'Active usage is below the level required for ROI breakeven or sponsor confidence.',
      'Program sponsors need repeatable evidence of adoption, value, and expansion readiness rather than anecdotes from a few power users.',
    ],
    confidence: 0.89,
    instanceCount: 1,
    patternIds: ['PAT-AI-007', 'PAT-AI-010'],
    signalIds: ['SIG-SRC-2025-001', 'SIG-MAN-2025-005', 'SIG-MAN-2025-006'],
    compositionManifest: [
      {
        componentId: 'PAT-AI-007',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Defines the enterprise adoption-curve problem for productivity agents and the thresholds that separate rollout momentum from stagnation.',
      },
      {
        componentId: 'PAT-AI-010',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Adds the value-attribution discipline required to keep Copilot ROI claims honest across large seat populations.',
      },
      {
        componentId: 'SIG-SRC-2025-001',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Calibrates the current Microsoft roadmap around tuning, custom agents, and multi-agent orchestration for large deployments.',
      },
      {
        componentId: 'SIG-MAN-2025-005',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Reinforces that Microsoft is treating enterprise adoption as an agent-era scale problem, not a narrow assistant launch.',
      },
      {
        componentId: 'SIG-MAN-2025-006',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Adds evidence that Copilot and agent adoption is moving into high-governance environments, which matters for rollout credibility.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-007',
    slug: 'shadow-ai-to-sanctioned-ai-migration',
    title: 'Shadow AI to sanctioned AI migration',
    summary:
      'Pairs the detection mechanics of shadow AI with a formal governance operating model so enterprises can migrate unsanctioned usage into named approved lanes instead of trying to ban it out of existence.',
    applicabilityConditions: [
      'Enterprise has unsanctioned or weakly governed AI usage spreading through direct purchase, embedded features, or personal-account workarounds.',
      'Compliance, privacy, or customer-risk concerns are becoming visible to leadership, legal, or audit functions.',
      'The objective is to establish sanctioned pathways and review controls, not just produce a policy memo.',
    ],
    confidence: 0.9,
    instanceCount: 1,
    patternIds: ['PAT-AI-005', 'PAT-AI-002'],
    signalIds: ['SIG-REG-2025-001', 'SIG-REG-2026-005'],
    compositionManifest: [
      {
        componentId: 'PAT-AI-005',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Defines the baseline shadow-AI condition, including how unsanctioned use becomes visible and why simple prohibition fails.',
      },
      {
        componentId: 'PAT-AI-002',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Provides the formal governance operating model needed to convert detection into sanctioned controls and decision rights.',
      },
      {
        componentId: 'SIG-REG-2025-001',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Adds direct regulatory pressure from the EU AI Act code-of-practice timeline to justify migration urgency.',
      },
      {
        componentId: 'SIG-REG-2026-005',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Provides a governance reference point showing agencies are formalizing explicit AI compliance postures and ownership models.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-010',
    slug: 'owned-brand-margin-recovery-retail',
    title: 'Owned-brand margin recovery (retail)',
    summary:
      'Turns the Phase 1 retail margin storyline into a reusable solution for retailers that need to improve owned-brand economics through better signal use, assortment focus, and operating coordination.',
    applicabilityConditions: [
      'Retail operator has explicit owned-brand or private-label margin pressure at category or store level.',
      'Merchandising, loyalty, or store-operations decisions need to connect to a narrower set of high-value margin levers.',
      'The organization is willing to use retail-specific patterns rather than relying only on generic enterprise AI framing.',
    ],
    confidence: 0.83,
    instanceCount: 1,
    patternIds: ['PAT-IND-RET-001', 'PAT-IND-RET-002'],
    signalIds: ['SIG-MAN-2025-012'],
    compositionManifest: [
      {
        componentId: 'PAT-IND-RET-001',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Provides the primary retail operating pattern that anchors margin recovery to sector-specific realities rather than generic AI narratives.',
      },
      {
        componentId: 'PAT-IND-RET-002',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Adds the second retail-specific variation needed to translate the margin theme into concrete merchandising and operating moves.',
      },
      {
        componentId: 'SIG-MAN-2025-012',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Supplies a shipped retail signal that agent capabilities are increasingly tied to store, loyalty, and margin-facing workflows.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-013',
    slug: 'ai-portfolio-governance-establishment',
    title: 'AI portfolio governance establishment',
    summary:
      'Combines governance operating model, portfolio-management cadence, and architectural dependency discipline into a single setup pattern for enterprises that need an actual AI decision system rather than disconnected steering meetings.',
    applicabilityConditions: [
      'Enterprise is running multiple AI programs and needs a cross-portfolio governance mechanism with real decision rights.',
      'Sponsors want to compare investment, risk, and continuation decisions across programs instead of evaluating each effort ad hoc.',
      'Architecture dependencies and operating-model boundaries matter because decisions affect multiple shared platforms or planes.',
    ],
    confidence: 0.91,
    instanceCount: 1,
    patternIds: ['PAT-AI-002', 'PAT-AI-004', 'PAT-ARCH-002'],
    signalIds: ['SIG-REG-2026-002', 'SIG-REG-2025-003', 'SIG-MAN-2025-004'],
    compositionManifest: [
      {
        componentId: 'PAT-AI-002',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Supplies the governance operating model, ownership, and control surface for enterprise AI decisions.',
      },
      {
        componentId: 'PAT-AI-004',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Adds the portfolio cadence and kill-or-invest logic required to govern many AI bets at once.',
      },
      {
        componentId: 'PAT-ARCH-002',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Ensures governance decisions respect the directed dependency graph across shared architecture planes and upstream constraints.',
      },
      {
        componentId: 'SIG-REG-2026-002',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Adds an active trust-and-governance signal from NIST that supports stronger control baselines for consequential AI programs.',
      },
      {
        componentId: 'SIG-REG-2025-003',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Reinforces that regulators are raising board-level scrutiny around AI risk and governance claims.',
      },
      {
        componentId: 'SIG-MAN-2025-004',
        componentKind: 'signal',
        role: 'signal_calibrator',
        rationale:
          'Provides a market signal that AI is being treated as core enterprise infrastructure rather than an isolated experiment.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
  {
    id: 'SOL-014',
    slug: 'vendor-bafo-orchestration',
    title: 'Vendor BAFO orchestration',
    summary:
      'Assembles the core sourcing-event patterns needed to run a BAFO process as an evidence-bearing decision system instead of a last-minute commercial ritual.',
    applicabilityConditions: [
      'A named sourcing event is in active comparison or BAFO phase with multiple vendors still under consideration.',
      'Executive sponsors need a normalized basis for commercial comparison before a design or award decision is taken.',
      'The team must preserve evidence trail and decision coherence across workshops, negotiations, and downstream program gates.',
    ],
    confidence: 0.87,
    instanceCount: 1,
    patternIds: ['PAT-SRC-001', 'PAT-SRC-002', 'PAT-SRC-007'],
    signalIds: [],
    compositionManifest: [
      {
        componentId: 'PAT-SRC-001',
        componentKind: 'pattern',
        role: 'foundation',
        rationale:
          'Anchors the sourcing-event structure so BAFO work stays tied to a named commercial process rather than informal negotiation drift.',
      },
      {
        componentId: 'PAT-SRC-002',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Adds the comparison discipline needed to keep vendor answers normalized and decision-ready during the competitive cycle.',
      },
      {
        componentId: 'PAT-SRC-007',
        componentKind: 'pattern',
        role: 'variation',
        rationale:
          'Carries the explicit BAFO-stage operating mechanics that convert sourcing evidence into a sponsor-ready commercial decision.',
      },
    ],
    createdAt: SEEDED_AT,
    createdBy: 'deterministic_seed',
    lastRevisedAt: SEEDED_AT,
    lastRevisedBy: 'codex',
  },
];

export const SOLUTION_SEED_COUNT = SOLUTION_SEEDS.length;
export const SOLUTION_SEED_IDS = SOLUTION_SEEDS.map((solution) => solution.id);

export default SOLUTION_SEEDS;
