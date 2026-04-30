export type ContradictionStatus =
  | 'open'
  | 'under-review'
  | 'resolved-toward-A'
  | 'resolved-toward-B'
  | 'accepted-as-tension';

export interface ContradictionParty {
  claim: string;
  source: string;
  evidence: string;
  confidence: number;
}

export interface ContradictionSeed {
  id: string;
  title: string;
  partyA: ContradictionParty;
  partyB: ContradictionParty;
  whyBothCannotBeTrue: string;
  status: ContradictionStatus;
  affectedPatternIds: string[];
  resolutionTimeline: string;
  sourceDocuments: string[];
  body: string;
}

export const CONTRADICTION_SEEDS: ContradictionSeed[] = [
  {
    id: 'CON-001',
    title: 'Vendor 90-day implementation claim vs 130-day internal planning median',
    partyA: {
      claim: 'The vendor BAFO submission can support a 90-day implementation timeline.',
      source: 'Vendor BAFO claim referenced by the Intelligence design contradiction example and Source verification pattern.',
      evidence:
        'The corpus preserves the 90-day timeline as an asserted vendor statement tied to the AMS sourcing dependency.',
      confidence: 0.72,
    },
    partyB: {
      claim: 'Planning should use the 130-day median from internal evidence unless stronger contrary proof appears.',
      source: 'Internal evidence ledger summary recorded in the Intelligence design spec and CDP timeline-realism pattern.',
      evidence:
        'The resolved evidence side cites 12 prior implementations with a 130-day median and records a 2026-02-14 resolution toward internal evidence.',
      confidence: 0.95,
    },
    whyBothCannotBeTrue:
      'The same implementation scope cannot be both responsibly planned at 90 days and evidence-resolved at a 130-day median.',
    status: 'resolved-toward-B',
    affectedPatternIds: ['PAT-SRC-010', 'PAT-CDP-001', 'PAT-CDP-010'],
    resolutionTimeline: 'Resolved toward Party B on 2026-02-14; keep vendor claim visible as asserted evidence during sourcing.',
    sourceDocuments: [
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
      'src/lib/intelligence/seed-patterns-sourcing.ts',
      'src/lib/intelligence/seed-patterns-cdp.ts',
    ],
    body:
      'CON-001 is the flagship contradiction-resolution seed. It links Source claim verification to CDP implementation timeline realism and prevents Atlas from treating vendor implementation timing as verified fact.',
  },
  {
    id: 'CON-002',
    title: 'M365 Copilot good-adoption narrative vs 24 percent active usage',
    partyA: {
      claim: 'The Copilot rollout has good adoption and should continue scaling.',
      source: 'Sponsor shorthand in the Tower M365 Copilot rollout storyline.',
      evidence:
        'The rollout is framed as strategically important and has enough executive attention to remain in the active AI portfolio.',
      confidence: 0.68,
    },
    partyB: {
      claim: 'Adoption is materially below breakeven and should not be treated as healthy.',
      source: 'Tower M365 Copilot value model and productivity-agent adoption pattern.',
      evidence:
        'The Tower walkthrough records 12,400 eligible users, 2,950 active users, 24 percent adoption, and a 60 percent breakeven threshold.',
      confidence: 0.9,
    },
    whyBothCannotBeTrue:
      'A rollout cannot be described as adoption-healthy when its active-use rate is less than half of the stated breakeven threshold.',
    status: 'under-review',
    affectedPatternIds: ['PAT-AI-007', 'PAT-AI-010', 'PAT-AI-014'],
    resolutionTimeline: 'Review after the next M365 active-user telemetry pull; likely resolve toward Party B unless usage materially improves.',
    sourceDocuments: [
      'docs/build/TOWER_DESIGN_SPEC.md',
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'src/lib/intelligence/seed-patterns-ai-programs.ts',
    ],
    body:
      'This contradiction keeps sponsor-language adoption claims separate from measured active usage and ROI breakeven. It should calibrate SOL-006 and the M365 Copilot storyline.',
  },
  {
    id: 'CON-003',
    title: 'Microsoft five-hour productivity claim vs 1.8-hour attributed internal evidence',
    partyA: {
      claim: 'Microsoft 365 Copilot can return roughly five hours per user per week.',
      source: 'Vendor-side productivity claim referenced in the Tower M365 rollout evidence model.',
      evidence:
        'The M365 storyline keeps the vendor claim visible as a benchmark for sponsor expectations and ROI aspiration.',
      confidence: 0.74,
    },
    partyB: {
      claim: 'The internal attributed value is closer to 1.8 hours per active user per week and still lacks complete baseline attribution.',
      source: 'Tower ROI attribution model and Copilot Finance pilot missing-input state.',
      evidence:
        'The seeded evidence references a 1.8 hour attributed figure and missing baseline_data and attribution_method inputs for Finance.',
      confidence: 0.78,
    },
    whyBothCannotBeTrue:
      'The same rollout cannot use the full vendor productivity claim as realized value while internal attribution caps the measured gain far lower.',
    status: 'under-review',
    affectedPatternIds: ['PAT-AI-007', 'PAT-AI-010'],
    resolutionTimeline:
      'Keep under review until the exact internal evidence packet behind the 1.8-hour figure and the Finance pilot attribution gaps are attached.',
    sourceDocuments: [
      'docs/build/TOWER_DESIGN_SPEC.md',
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'src/lib/intelligence/seed-patterns-ai-programs.ts',
    ],
    body:
      'Evidence enrichment: PAT-AI-010 supplies the confidence rationale for keeping the internal 1.8 hr/week figure below the vendor 5 hr/week benchmark: AI value must carry an attribution method, with cohort-matched evidence haircut to 0.85, survey evidence to 0.6, self-report to 0.4, and experimental evidence to 1.0. The Tower Finance pilot still names baseline_data and attribution_method as missing inputs, so this contradiction should not resolve to the vendor benchmark without a dated baseline and explicit attribution packet.',
  },
  {
    id: 'CON-004',
    title: 'Now Assist 40 percent deflection promise vs 28 percent delivered deflection',
    partyA: {
      claim: 'Now Assist should deliver 40 percent ticket deflection and roughly $1.5M in annual savings.',
      source: 'Now Assist deployment business case in the Tower design material.',
      evidence:
        'The program target is explicitly framed around high ticket deflection and a scaled service-desk savings case.',
      confidence: 0.79,
    },
    partyB: {
      claim: 'The actual deployment is at 28 percent deflection, $1.12M attributed value, and a $1.7M value shortfall against cost.',
      source: 'Tower Now Assist value model and service-desk AI deflection pattern.',
      evidence:
        'The Tower walkthrough records 28 percent actual deflection, $1.12M attributed value, $2.8M annual cost, and a critical shortfall.',
      confidence: 0.9,
    },
    whyBothCannotBeTrue:
      'The deployment cannot both meet the promised deflection economics and simultaneously carry a measured shortfall below target.',
    status: 'under-review',
    affectedPatternIds: ['PAT-AI-010', 'PAT-AI-011'],
    resolutionTimeline: 'Review after KB completion sprint and Q3 deflection measurement; resolve toward Party B if deflection remains below target.',
    sourceDocuments: [
      'docs/build/TOWER_DESIGN_SPEC.md',
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'src/lib/intelligence/seed-patterns-ai-programs.ts',
    ],
    body:
      'CON-004 is the Now Assist economic-underperformance contradiction. It distinguishes weak adoption from structural blockers such as knowledge-base coverage and overlapping assistant usage.',
  },
  {
    id: 'CON-005',
    title: 'Now Assist distinct-scope story vs Copilot duplication pressure',
    partyA: {
      claim: 'Copilot and Now Assist are distinct enough to justify separate spend lines.',
      source: 'AI portfolio and Tower program views where the tools appear as separate programs.',
      evidence:
        'The corpus models M365 Copilot and Now Assist as different solution stories with different operating domains.',
      confidence: 0.7,
    },
    partyB: {
      claim: 'The portfolio has unresolved duplication across summarization-heavy workflows.',
      source: 'Tower vendor-sprawl and AI portfolio evidence.',
      evidence:
        'The corpus references a 60 percent feature-overlap blind spot, $0.8M Copilot duplication pressure, $0.6M Now Assist duplication pressure, and 30 percent current-usage overlap.',
      confidence: 0.76,
    },
    whyBothCannotBeTrue:
      'The same overlapping workflow surface cannot be both fully distinct for spend approval and duplicative enough to drive consolidation savings.',
    status: 'under-review',
    affectedPatternIds: ['PAT-AI-003', 'PAT-AI-007', 'PAT-AI-011'],
    resolutionTimeline:
      'Hold under review until the overlap measures are reconciled and mapped to either additive savings or duplicate views of one opportunity.',
    sourceDocuments: [
      'docs/build/TOWER_DESIGN_SPEC.md',
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'docs/source-material/intelligence-pack/04-vendor-sprawl-ai-tool-rationalization.md',
    ],
    body:
      'Evidence enrichment: the current Phase 1 title differs from the kickoff SAP Joule example, so this enrichment follows the seeded Now Assist/Copilot contradiction. Tower evidence identifies P-DUPL overlap from M365 Copilot into Now Assist summarization at $0.8M, a consolidation path that saves $0.6M by shifting Now Assist seats to higher-value use cases, and reciprocal Now Assist overlap with M365 Copilot for FAQ summarization. Treat the $0.6M and $0.8M as directional pressure views until an overlap matrix proves whether they are additive savings or duplicate estimates of the same summarization surface.',
  },
  {
    id: 'CON-006',
    title: 'Formal AI governance policy vs documented shadow-AI bypass behavior',
    partyA: {
      claim: 'AI governance policy routes material AI usage through sanctioned review and approval channels.',
      source: 'AI governance operating model and shadow-AI governance pack.',
      evidence:
        'The policy model establishes review paths, decision rights, and sanctioned usage lanes for enterprise AI.',
      confidence: 0.84,
    },
    partyB: {
      claim: 'Shadow-AI behavior is already bypassing the formal policy through local acquisition and embedded-tool usage.',
      source: 'Shadow AI governance pack and pattern overlay.',
      evidence:
        'The source pack identifies policy contradicted by at least three documented instances, and pattern corpus describes under-threshold procurement pathways.',
      confidence: 0.82,
    },
    whyBothCannotBeTrue:
      'A governance policy cannot be treated as operationally effective when documented acquisition paths bypass its review threshold.',
    status: 'open',
    affectedPatternIds: ['PAT-AI-002', 'PAT-AI-005'],
    resolutionTimeline: 'Resolve after tenant-specific bypass examples are attached and mapped to the violated policy clauses.',
    sourceDocuments: [
      'docs/source-material/pattern-pack-01-shadow-ai-governance.md',
      'docs/source-material/tenant-overlays/pattern-intelligence-layer-overlay.md',
      'src/lib/intelligence/seed-patterns-ai-programs.ts',
    ],
    body:
      'Evidence enrichment: PAT-AI-002 establishes the formal governance lane, while PAT-AI-005 and the pattern overlay supplies the bypass mechanism: shadow AI, embedded vendor AI, and under-threshold procurement can move usage outside sanctioned review. External research ask: attach tenant procurement and usage evidence that names the tool, acquisition path, spend threshold used or avoided, approval route, violated policy clause, date, and accountable owner before resolving this from pattern-level tension to tenant-proven contradiction.',
  },
  {
    id: 'CON-007',
    title: 'AI spend portfolio discipline vs unresolved finance, procurement, and IT spend views',
    partyA: {
      claim: 'AI portfolio governance can compare investment decisions across programs using a common spend and value basis.',
      source: 'AI portfolio governance and ROI attribution patterns.',
      evidence:
        'The Phase 1 AI governance patterns require cross-program visibility, attribution discipline, and portfolio-level decision rights.',
      confidence: 0.82,
    },
    partyB: {
      claim: 'Actual AI spend is fragmented across finance, procurement, IT, embedded vendors, and local purchases.',
      source: 'Tower AI cloud spend pressure and vendor-sprawl material.',
      evidence:
        'The corpus repeatedly identifies tool sprawl, embedded AI costs, and cross-vendor inference or license normalization as unresolved spend-pressure sources.',
      confidence: 0.75,
    },
    whyBothCannotBeTrue:
      'A portfolio cannot make reliable ROI decisions from a common basis while major spend categories remain outside the reconciled view.',
    status: 'open',
    affectedPatternIds: ['PAT-AI-003', 'PAT-AI-004', 'PAT-AI-009', 'PAT-AI-010'],
    resolutionTimeline: 'Resolve after a real finance/procurement/IT spend snapshot is attached and variance is quantified.',
    sourceDocuments: [
      'docs/source-material/intelligence-pack/04-vendor-sprawl-ai-tool-rationalization.md',
      'docs/source-material/intelligence-pack/05-ai-use-case-portfolio-management.md',
      'src/lib/intelligence/seed-patterns-ai-programs.ts',
    ],
    body:
      'External research ask: the corpus supports the existence of fragmented AI spend views but does not include a dated finance/procurement/IT reconciliation snapshot. Resolve with a same-period export from finance GL/AP, procurement contract records, IT SaaS or cloud inventory, and embedded-vendor AI entitlement data; the evidence packet should quantify variance percentage, dollar delta, excluded categories, and whether embedded AI, shadow subscriptions, inference usage, and seat licenses are counted once.',
  },
  {
    id: 'CON-008',
    title: 'Embedded AI feature enablement vs explicit portfolio governance coverage',
    partyA: {
      claim: 'AI portfolio governance covers active AI initiatives through named use cases, owners, stages, and investment decisions.',
      source: 'AI use-case portfolio management pattern.',
      evidence:
        'The portfolio pattern requires visible ownership, stage assignment, and investment concentration across AI use cases.',
      confidence: 0.86,
    },
    partyB: {
      claim: 'Embedded AI features can enter through existing SaaS vendors without appearing as distinct portfolio use cases.',
      source: 'Vendor-sprawl, shadow-AI, and enterprise-agent rollout material.',
      evidence:
        'The corpus records embedded AI, vendor overlap, and tool-rationalization pressure as paths where AI capability appears before governance visibility catches up.',
      confidence: 0.8,
    },
    whyBothCannotBeTrue:
      'A portfolio cannot claim complete governance coverage if embedded vendor AI enters production workflows without named use-case representation.',
    status: 'accepted-as-tension',
    affectedPatternIds: ['PAT-AI-002', 'PAT-AI-003', 'PAT-AI-004', 'PAT-AI-005'],
    resolutionTimeline: 'Accepted as a durable governance tension; revisit when embedded-feature inventory becomes part of Phase 2 infrastructure.',
    sourceDocuments: [
      'docs/source-material/intelligence-pack/03-ai-governance-operating-model.md',
      'docs/source-material/intelligence-pack/04-vendor-sprawl-ai-tool-rationalization.md',
      'docs/source-material/pattern-pack-01-shadow-ai-governance.md',
    ],
    body:
      'CON-008 captures an operating-model tension rather than a single tenant defect: governance needs named use cases, while SaaS vendors increasingly introduce AI through existing product surfaces.',
  },
  {
    id: 'CON-009',
    title: 'Ambient clinical vendor rotation vs downstream integration readiness',
    partyA: {
      claim: 'Ambient clinical documentation value can be pursued through vendor rotation and pilot comparison.',
      source: 'Ambient clinical value-chain pattern pack.',
      evidence:
        'The healthcare industry pattern frames ambient documentation as a value-chain modernization problem that can involve vendor selection and pilot evaluation.',
      confidence: 0.79,
    },
    partyB: {
      claim: 'Vendor rotation does not resolve downstream integration, specialty workflow, and governance readiness gaps by itself.',
      source: 'Healthcare ambient and prior-authorization pattern sources.',
      evidence:
        'The pattern corpus emphasizes downstream handoffs, operating-model fit, and evidence standards rather than transcript quality alone.',
      confidence: 0.74,
    },
    whyBothCannotBeTrue:
      'A vendor rotation cannot be treated as a sufficient ambient-clinical solution when the value chain depends on downstream integration readiness.',
    status: 'open',
    affectedPatternIds: ['PAT-IND-HC-001', 'PAT-IND-HC-002', 'PAT-AI-002'],
    resolutionTimeline: 'Resolve after an actual pilot charter, vendor sequence, and downstream integration map are attached.',
    sourceDocuments: [
      'docs/source-material/intelligence-pack/06-ambient-clinical-value-chain.md',
      'docs/source-material/intelligence-pack/07-prior-authorization-automation.md',
      'src/lib/intelligence/seed-patterns-industry.ts',
    ],
    body:
      'External research ask: the current corpus supports ambient-clinical value-chain and prior-authorization readiness patterns, but not a tenant-specific pilot sequence. Resolve with the signed pilot charter, named ambient vendors or rotation sequence, EHR and downstream integration map, specialty workflow roster, governance owner, evaluation criteria, and handoff metrics showing whether vendor comparison is sufficient or downstream readiness is the binding constraint.',
  },
  {
    id: 'CON-010',
    title: 'Named AI ownership vs procurement paths outside owner authority',
    partyA: {
      claim: 'A named AI owner or sponsor can govern AI adoption and migration decisions.',
      source: 'AI governance operating model and sponsor-activation pattern.',
      evidence:
        'The governance corpus assigns decision rights and sponsor activation as core primitives for sanctioned AI migration.',
      confidence: 0.84,
    },
    partyB: {
      claim: 'Procurement paths can still introduce or expand AI tools outside that named owner authority.',
      source: 'Shadow-AI governance pack and pattern overlay.',
      evidence:
        'The source material distinguishes declared ownership from procurement control and identifies under-threshold acquisition as a bypass mechanism.',
      confidence: 0.78,
    },
    whyBothCannotBeTrue:
      'A named owner cannot be said to control AI adoption when acquisition channels outside that owner can still create sanctioned or de facto usage.',
    status: 'open',
    affectedPatternIds: ['PAT-AI-002', 'PAT-AI-005', 'PAT-AI-014'],
    resolutionTimeline: 'Resolve after a tenant-specific owner map and at least one bypassing acquisition are attached.',
    sourceDocuments: [
      'docs/source-material/pattern-pack-01-shadow-ai-governance.md',
      'docs/source-material/tenant-overlays/pattern-intelligence-layer-overlay.md',
      'src/lib/intelligence/seed-patterns-ai-programs.ts',
    ],
    body:
      'Evidence enrichment: PAT-AI-002 and PAT-AI-014 support named ownership and sponsor activation, while PAT-AI-005 plus the pattern overlay describe under-threshold acquisition as a channel that can bypass that authority. External research ask: attach the tenant AI-owner RACI, delegated procurement thresholds, intake policy, and at least one concrete acquisition record naming vendor, buyer, approval path, amount, date, and why the named owner did not control the decision.',
  },
];

export const CONTRADICTION_SEED_COUNT = CONTRADICTION_SEEDS.length;
export const CONTRADICTION_SEED_IDS = CONTRADICTION_SEEDS.map((contradiction) => contradiction.id);

export default CONTRADICTION_SEEDS;
