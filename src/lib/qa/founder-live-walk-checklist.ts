// LIVE1 - Founder Live Walk Checklist
//
// Deterministic, file-pure catalog of the canonical steps a founder
// should walk during a live demo of the AbarVa platform. This module
// never performs any real HTTP request, never starts a server, never
// opens a browser, never imports any browser-automation library,
// never calls into the network, never reads the system clock, and
// never invokes a model provider.
//
// Every field is hardcoded. There are no dynamic lookups, no env
// reads, and no side effects.

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type WalkStepStatus = 'pass' | 'fail' | 'deferred' | 'not_run';

export interface WalkStep {
  id: string;
  route: string;
  surface: string;
  purpose: string;
  expectedQuestion: string;
  primaryAgent: string;
  whatToClick: string;
  whatToSay: string;
  expectedVisibleSignal: string;
  fallbackIfBlocked: string;
  readinessCaveat: string;
  status: WalkStepStatus;
}

export interface FounderLiveWalkChecklist {
  version: string;
  generatedAt: string;
  totalSteps: number;
  steps: WalkStep[];
}

// ---------------------------------------------------------------------
// Canonical step seed (order is contract).
// ---------------------------------------------------------------------

const WALK_STEPS: readonly WalkStep[] = Object.freeze([
  {
    id: 'LIVE1-S01',
    route: '/home',
    surface: 'home',
    purpose: 'Orient the founder to the executive entry point',
    expectedQuestion: 'What is the AI portfolio status?',
    primaryAgent: 'Atlas',
    whatToClick: 'AI Activity card or queue panel',
    whatToSay:
      'This is the command center — all active AI programs, recent alerts, and actions in one view.',
    expectedVisibleSignal: 'Queue panel visible, program count shown',
    fallbackIfBlocked: 'Navigate to /platform/admin',
    readinessCaveat: 'Home page is deterministic seed data; live DB may differ',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S02',
    route: '/platform/admin',
    surface: 'admin',
    purpose: 'Show platform steward view',
    expectedQuestion: 'How is the platform configured?',
    primaryAgent: 'Steward',
    whatToClick: 'Platform Admin nav link',
    whatToSay: 'Steward manages tenants, data readiness, and platform health.',
    expectedVisibleSignal: 'Admin panel with tenant list or tabs',
    fallbackIfBlocked: 'Show /platform/admin/build-progress',
    readinessCaveat: 'Requires admin Clerk role',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S03',
    route: '/platform/admin/production-readiness',
    surface: 'admin',
    purpose: 'Show production readiness tracker',
    expectedQuestion: 'What is actually production-ready?',
    primaryAgent: 'Steward',
    whatToClick: 'Production Readiness tab or link',
    whatToSay:
      'Every component has an honest readiness state — no false greens.',
    expectedVisibleSignal:
      'Readiness table with component rows and status chips',
    fallbackIfBlocked:
      'Show docs/build/production-readiness.json directly',
    readinessCaveat:
      'Static manifest; live Vercel/CI status requires external polling',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S04',
    route: '/platform/admin/build-progress',
    surface: 'admin',
    purpose: 'Show wave/slice build progress',
    expectedQuestion: 'How far is the build?',
    primaryAgent: 'Steward',
    whatToClick: 'Build Progress tab',
    whatToSay:
      '13 waves, 157+ slices tracked — every commit is evidence-backed.',
    expectedVisibleSignal: 'Wave progress table with percentComplete bars',
    fallbackIfBlocked: 'Show docs/build/build-waves.json',
    readinessCaveat: 'Wave 12 merged; wave 13 in progress',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S05',
    route: '/tenant/apex-retail/programs',
    surface: 'programs',
    purpose: 'Show Apex Retail AI program portfolio',
    expectedQuestion: 'What programs is Apex running?',
    primaryAgent: 'Nexus',
    whatToClick: 'Programs nav or tenant switcher',
    whatToSay:
      'Apex Retail has 4 active AI programs — Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting.',
    expectedVisibleSignal: 'Program cards grid with phase indicators',
    fallbackIfBlocked: 'Navigate directly to /programs',
    readinessCaveat:
      'Apex seed data; requires Clerk demo tenant context',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S06',
    route: '/tenant/apex-retail/programs/[programSlug]',
    surface: 'programs',
    purpose: 'Deep-dive into a single program',
    expectedQuestion: 'What is the health of this program?',
    primaryAgent: 'Nexus',
    whatToClick: 'Contact Center AI program card',
    whatToSay:
      'Phase gate enforced — milestones, risks, deliverables, sponsor commitment all tracked.',
    expectedVisibleSignal:
      'Program detail with phase tabs, milestone list, risk flags',
    fallbackIfBlocked: 'Show /programs/[programId] with seed programId',
    readinessCaveat:
      'Phase gate is deterministic; live DB required for real progress',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S07',
    route: '/tenant/apex-retail/tower',
    surface: 'tower',
    purpose: 'Show AI Control Tower',
    expectedQuestion: 'Who owns AI governance?',
    primaryAgent: 'Atlas',
    whatToClick: 'Tower tab in tenant nav',
    whatToSay:
      'Atlas surfaces cost, adoption, risk, and governance signals across the entire AI portfolio.',
    expectedVisibleSignal: 'Tower dashboard with signal cards',
    fallbackIfBlocked: 'Show /tower',
    readinessCaveat:
      'Tower seed data; real cost/adoption requires live integrations',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S08',
    route: '/tenant/apex-retail/intelligence',
    surface: 'intelligence',
    purpose: 'Show intelligence library',
    expectedQuestion: 'What patterns and signals does AbarVa surface?',
    primaryAgent: 'Sentinel',
    whatToClick: 'Intelligence tab',
    whatToSay:
      'Sentinel surfaces competitive, market, and program intelligence — grounded in evidence.',
    expectedVisibleSignal: 'Intelligence cards or pattern list',
    fallbackIfBlocked: 'Show /intelligence',
    readinessCaveat:
      'Pattern library is deterministic seed; live signals need external data',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S09',
    route: '/tenant/apex-retail/intelligence/patterns/[patternKey]',
    surface: 'intelligence',
    purpose: 'Show a specific intelligence pattern',
    expectedQuestion: 'What does this pattern tell us?',
    primaryAgent: 'Sentinel',
    whatToClick: 'Any pattern card',
    whatToSay:
      'Each pattern has evidence basis, confidence score, and recommended action.',
    expectedVisibleSignal:
      'Pattern detail with evidence section and recommended action',
    fallbackIfBlocked: 'Show /intelligence/patterns',
    readinessCaveat:
      'Pattern content is seed; confidence scores are deterministic',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S10',
    route: '/source',
    surface: 'source',
    purpose: 'Show Source procurement intelligence',
    expectedQuestion: 'How does AbarVa support vendor selection?',
    primaryAgent: 'Source',
    whatToClick: 'Source nav item',
    whatToSay:
      'Source tracks RFP events, vendor responses, pricing normalization, and commercial traps.',
    expectedVisibleSignal:
      'Source dashboard with events list or status chips',
    fallbackIfBlocked: 'Show /source/events',
    readinessCaveat:
      'Source uses seed events; live vendor data requires client input',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S11',
    route: '/source/events',
    surface: 'source',
    purpose: 'Show procurement event list',
    expectedQuestion: 'What RFP events are active?',
    primaryAgent: 'Source',
    whatToClick: 'Events tab or link',
    whatToSay:
      'Each event has a vendor scorecard, response completeness, and pricing comparability status.',
    expectedVisibleSignal: 'Event cards with status chips',
    fallbackIfBlocked: 'Show seed event detail',
    readinessCaveat: 'Events are deterministic seed data',
    status: 'not_run',
  },
  {
    id: 'LIVE1-S12',
    route: 'docs/architecture',
    surface: 'architecture',
    purpose: 'Explain Azure private data plane story',
    expectedQuestion: 'How does AbarVa handle Fortune 500 data trust?',
    primaryAgent: 'N/A (architecture doc)',
    whatToClick: 'N/A — show AZLAB1 blueprint doc',
    whatToSay:
      'AbarVa runs a SaaS control plane. Client data stays in a private Azure data plane the client controls. No raw data leaves client boundary.',
    expectedVisibleSignal:
      'AZLAB1 architecture blueprint rendered or PDF shown',
    fallbackIfBlocked:
      'Read docs/architecture/AZLAB1_SAAS_CONTROL_PLANE_PRIVATE_DATA_PLANE_BLUEPRINT.md aloud',
    readinessCaveat:
      'Lab is planned for May 4; current connector is a stub',
    status: 'not_run',
  },
] as const);

// ---------------------------------------------------------------------
// Public builder.
// ---------------------------------------------------------------------

export function buildFounderLiveWalkChecklist(): FounderLiveWalkChecklist {
  const steps = [...WALK_STEPS];

  return {
    version: '1.0.0',
    generatedAt: '2026-04-26',
    totalSteps: steps.length,
    steps,
  };
}
