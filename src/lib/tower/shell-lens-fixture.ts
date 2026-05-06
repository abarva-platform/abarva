// ─── Adoption Lens ────────────────────────────────────────────────────────────

export interface AdoptionMetric {
  program: string;
  displayId: string;
  phase: number;
  phaseLabel: string;
  adoptionRate: string;  // e.g. "68%"
  activeUsers: string;
  targetUsers: string;
  trainingComplete: boolean;
  lastActivity: string;
}

export const ADOPTION_METRICS: AdoptionMetric[] = [
  { program: 'CDP Activation', displayId: 'APX-CDP-2026', phase: 3, phaseLabel: 'Design', adoptionRate: '—', activeUsers: '0', targetUsers: 'Post-Build baseline pending', trainingComplete: false, lastActivity: 'Pre-build' },
  { program: 'Contact Center AI', displayId: 'APX-CC-2026', phase: 4, phaseLabel: 'Build', adoptionRate: '—', activeUsers: '0', targetUsers: '200 agents', trainingComplete: false, lastActivity: 'Pre-launch' },
  { program: 'Demand Forecasting v2', displayId: 'APX-DFV2-2025', phase: 6, phaseLabel: 'Tower Handoff', adoptionRate: '94%', activeUsers: '47', targetUsers: '50 planners', trainingComplete: true, lastActivity: 'Today' },
  { program: 'Store Associate Productivity', displayId: 'APX-SAP-2026', phase: 1, phaseLabel: 'Discovery', adoptionRate: '—', activeUsers: '0', targetUsers: 'Discovery baseline pending', trainingComplete: false, lastActivity: 'Pre-design' },
];

export const ADOPTION_AGENT_VOICE = {
  quote: 'Only Demand Forecasting v2 has live adoption data — 47 of 50 planners active (94%). CDP Activation and Contact Center AI are pre-launch; adoption targets set after Execution Roadmap gate approval. SAP adoption baseline not yet defined.',
  agentContext: 'Atlas · Adoption Lens',
  actions: [
    { letter: 'A' as const, text: 'Define CDP adoption baseline', detail: 'Set targets after Execution Roadmap gate once Vendor C contract is signed' },
    { letter: 'B' as const, text: 'Finalize CC-AI adoption plan', detail: 'Target: 200 agents in Phase 1 rollout (Week 1 of Activate)' },
    { letter: 'C' as const, text: 'Review DFv2 lagging 3 planners', detail: '47 of 50 active — identify and re-engage 3 non-users' },
  ],
};

// ─── Risk Lens ────────────────────────────────────────────────────────────────

export interface RiskItem {
  id: string;
  title: string;
  program: string;
  displayId: string;
  riskType: 'execution' | 'vendor' | 'privacy' | 'model' | 'budget';
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'mitigated' | 'watching';
  description: string;
  mitigation: string;
  owner: string;
}

export const RISK_ITEMS: RiskItem[] = [
  { id: 'r1', title: 'CDP privacy boundary confirmed', program: 'Apex Retail CDP Activation', displayId: 'APX-CDP-2026', riskType: 'privacy', severity: 'high', status: 'mitigated', description: 'Privacy boundary between CDP and loyalty data was formally confirmed as part of the Design gate approval on Apr 27. Gate blocker cleared.', mitigation: 'Privacy boundary exercise completed — Design gate (P2→P3) approved Apr 27', owner: 'David Chen' },
  { id: 'r2', title: 'Vendor B SOC-2 report pending', program: 'AMS Vendor Consolidation 2026', displayId: 'AMS-2026', riskType: 'vendor', severity: 'medium', status: 'open', description: 'Vendor B has not submitted SOC-2 Type II report. BAFO evaluation cannot be fully completed without it.', mitigation: 'Escalate to Vendor B procurement contact — deadline Apr 30', owner: 'Priya Sharma' },
  { id: 'r3', title: 'AI Cloud Spend over budget', program: 'Multiple programs', displayId: 'Cross-program', riskType: 'budget', severity: 'high', status: 'open', description: 'LLM inference spend is materially over budget. Rate card negotiation is the highest-leverage action.', mitigation: 'Negotiate LLM provider rate card — material run-rate recovery', owner: 'David Chen' },
  { id: 'r4', title: 'IVR migration dependency risk', program: 'Contact Center AI', displayId: 'APX-CC-2026', riskType: 'execution', severity: 'medium', status: 'watching', description: 'IVR migration is on the critical path for Execution Roadmap gate. 3 sprints remaining — no buffer.', mitigation: 'Weekly sprint review tracking. Escalate if slips.', owner: 'Marcus Webb' },
  { id: 'r5', title: 'Vendor C integration contract unsigned', program: 'Apex Retail CDP Activation', displayId: 'APX-CDP-2026', riskType: 'vendor', severity: 'medium', status: 'open', description: 'Integration contract with Vendor C is unsigned — a required criterion for the P3→P4 Execution Roadmap gate. Architecture sprint is active but contract sign-off is blocking gate approval.', mitigation: 'Legal review in progress. Target signature May 2 to maintain architecture sprint velocity.', owner: 'David Chen' },
];

export const RISK_AGENT_VOICE = {
  quote: '4 open risk items — 1 high, 3 medium. AI Cloud Spend and Vendor C contract are the most urgent. CDP privacy boundary was resolved at the Design gate on Apr 27.',
  agentContext: 'Atlas · Risk Lens',
  actions: [
    { letter: 'A' as const, text: 'Negotiate LLM rate card', detail: 'High severity · material recovery potential' },
    { letter: 'B' as const, text: 'Close Vendor C contract', detail: 'CDP Execution Roadmap gate blocked · target signature May 2' },
    { letter: 'C' as const, text: 'Chase Vendor B SOC-2', detail: 'Medium · BAFO evaluation blocked until Apr 30' },
  ],
};

// ─── Inventory Lens ──────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  category: 'use_case' | 'program' | 'vendor_stack' | 'integration';
  status: 'production' | 'pilot' | 'design' | 'discovery' | 'shadow';
  owner: string;
  programs: number;
  notes: string;
}

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'inv1', name: 'Apex Retail CDP Activation', category: 'program', status: 'design', owner: 'David Chen', programs: 1, notes: 'P3 Design — Vendor C contract pending; architecture sprint active' },
  { id: 'inv2', name: 'Contact Center AI', category: 'program', status: 'pilot', owner: 'Marcus Webb', programs: 1, notes: 'P4 Build — IVR migration on critical path; 3 sprints remaining' },
  { id: 'inv3', name: 'Demand Forecasting v2', category: 'program', status: 'production', owner: 'Anika Patel', programs: 1, notes: 'P6 Tower Handoff — 47 of 50 planners active' },
  { id: 'inv4', name: 'Store Associate Productivity', category: 'program', status: 'discovery', owner: 'Marcus Webb', programs: 1, notes: 'P1 Discovery — baseline definition pending' },
  { id: 'inv5', name: 'AMS Vendor Consolidation 2026', category: 'use_case', status: 'design', owner: 'Priya Sharma', programs: 0, notes: 'Sourcing event — BAFO evaluation in progress, 3 vendors' },
  { id: 'inv6', name: 'OpenAI / Anthropic / Bedrock', category: 'vendor_stack', status: 'production', owner: 'David Chen', programs: 4, notes: 'Foundation model dependencies across 4 active programs — concentration risk medium' },
  { id: 'inv7', name: 'Snowflake / dbt / Fivetran', category: 'vendor_stack', status: 'production', owner: 'Anika Patel', programs: 3, notes: 'Data platform stack — used by CDP, DFv2, and SAP discovery' },
  { id: 'inv8', name: 'Salesforce ↔ Snowflake', category: 'integration', status: 'production', owner: 'David Chen', programs: 2, notes: 'CDP-bound; identity match-rate at 71% (12 systems expected, 11 connected)' },
  { id: 'inv9', name: 'NICE inContact ↔ ServiceNow', category: 'integration', status: 'design', owner: 'Marcus Webb', programs: 1, notes: 'CC-AI bound — IVR migration dependency' },
  { id: 'inv10', name: 'Unmanaged: 4 Copilot trials', category: 'use_case', status: 'shadow', owner: 'IT Ops', programs: 0, notes: 'Shadow IT — surfaced via license discovery; not in CDP or governance' },
];

export const INVENTORY_AGENT_VOICE = {
  quote: '4 active programs, 1 sourcing event in flight. Foundation model concentration is medium across OpenAI/Anthropic/Bedrock — 4 of 4 programs depend. 4 shadow Copilot trials surfaced this week — needs governance review.',
  agentContext: 'Atlas · Inventory Lens',
  actions: [
    { letter: 'A' as const, text: 'Review shadow Copilot trials', detail: '4 unmanaged use cases — bring under governance or sunset' },
    { letter: 'B' as const, text: 'Diversify foundation model dependency', detail: 'All 4 programs share OpenAI/Anthropic/Bedrock — concentration risk medium' },
    { letter: 'C' as const, text: 'Close CDP integration gap', detail: '11 of 12 expected source systems connected' },
  ],
};

// ─── Cost Lens ──────────────────────────────────────────────────────────────

export interface CostItem {
  id: string;
  category: string;
  program: string;
  displayId: string;
  monthlyRunRate: string;
  ytdSpend: string;
  budget: string;
  varianceLabel: string;
  variance: 'over' | 'under' | 'on_track';
  driver: string;
}

export const COST_ITEMS: CostItem[] = [
  { id: 'c1', category: 'LLM Inference', program: 'AI Cloud (cross-program)', displayId: 'CROSS-AI-2026', monthlyRunRate: '$184K/mo', ytdSpend: '$1.42M', budget: '$1.20M', varianceLabel: '+18%', variance: 'over', driver: 'Foundation model token cost — rate card negotiation pending' },
  { id: 'c2', category: 'Data Platform', program: 'CDP Activation', displayId: 'APX-CDP-2026', monthlyRunRate: '$72K/mo', ytdSpend: '$0.46M', budget: '$0.50M', varianceLabel: '-8%', variance: 'under', driver: 'Snowflake compute — design phase below projection' },
  { id: 'c3', category: 'Contact Center Platform', program: 'Contact Center AI', displayId: 'APX-CC-2026', monthlyRunRate: '$28K/mo', ytdSpend: '$0.18M', budget: '$0.18M', varianceLabel: 'On track', variance: 'on_track', driver: 'NICE inContact base license + AI add-on' },
  { id: 'c4', category: 'Implementation', program: 'AMS Consolidation', displayId: 'AMS-2026', monthlyRunRate: '$0/mo', ytdSpend: '$0.32M', budget: '$0.30M', varianceLabel: '+7%', variance: 'on_track', driver: 'BAFO evaluation costs — within tolerance' },
  { id: 'c5', category: 'Foundation Model — premium tier', program: 'Demand Forecasting v2', displayId: 'APX-DFV2-2025', monthlyRunRate: '$22K/mo', ytdSpend: '$0.21M', budget: '$0.25M', varianceLabel: '-16%', variance: 'under', driver: 'Routing optimization reducing premium-tier calls 28%' },
  { id: 'c6', category: 'Vector / Embeddings', program: 'CDP + Intelligence', displayId: 'CROSS-2026', monthlyRunRate: '$8K/mo', ytdSpend: '$0.05M', budget: '$0.08M', varianceLabel: '-38%', variance: 'under', driver: 'Pinecone usage below projection — corpus growth slower' },
];

export const COST_AGENT_VOICE = {
  quote: 'AI Cloud is the dominant lever — $184K/mo run rate, +18% over budget. Rate card negotiation with foundation model providers is the highest-leverage action. DFv2 is running 16% under budget on routing optimization — share the pattern with other programs.',
  agentContext: 'Atlas · Cost Lens',
  actions: [
    { letter: 'A' as const, text: 'Negotiate LLM rate card', detail: '$1.42M YTD, +18% over — material run-rate recovery available' },
    { letter: 'B' as const, text: 'Replicate DFv2 routing optimization', detail: '28% reduction in premium-tier calls — pattern transferable to CDP and CC-AI' },
    { letter: 'C' as const, text: 'Reforecast Q3 AI Cloud budget', detail: 'Current trajectory points to $2.6M YTD vs $2.4M annual budget' },
  ],
};
