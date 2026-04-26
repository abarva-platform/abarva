// DEMO2 - Founder Demo Route Checklist
//
// Deterministic, file-pure catalog of the canonical routes a founder
// should walk during a boardroom or seed-round demo of the AbarVa
// platform. This module never performs any real HTTP request, never
// starts a server, never opens a browser, never imports any
// browser-automation library, never calls into the network, never
// reads the system clock, and never invokes a model provider.
//
// Every field is hardcoded. There are no dynamic lookups, no env
// reads, and no side effects.

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export interface DemoRoute {
  route: string;
  purpose: string;
  primaryAgent: string;
  demoTalkingPoint: string;
  expectedComponent: string;
  readinessCaveat: string;
  fallbackIfBlocked: string;
  validationStatus: 'ready' | 'partial' | 'deferred' | 'blocked';
}

export interface FounderDemoRouteChecklist {
  generatedAt: string; // hardcoded '2026-04-26'
  totalRoutes: number;
  readyRoutes: number;
  partialRoutes: number;
  deferredRoutes: number;
  blockedRoutes: number;
  routes: DemoRoute[];
}

// ---------------------------------------------------------------------
// Canonical route seed (order is contract).
// ---------------------------------------------------------------------

const DEMO_ROUTES: readonly DemoRoute[] = Object.freeze([
  {
    route: '/home',
    purpose: 'Executive entry point — establishes the agentic operating model and surfaces the platform mission before any tenant context is loaded.',
    primaryAgent: 'Nexus',
    demoTalkingPoint: 'This is the front door every operator sees. Within seconds they understand that four specialist AI agents — Nexus, Atlas, Sentinel, and Steward — are coordinating on their behalf. The interface is intentionally calm: one headline, one call-to-action, no noise.',
    expectedComponent: 'src/components/home/AgenticHomeEntry.tsx',
    readinessCaveat: 'None — route is fully rendered and design-canon compliant.',
    fallbackIfBlocked: 'Show a screenshot of the home screen captured during the 2026-04-26 smoke run.',
    validationStatus: 'ready',
  },
  {
    route: '/platform/admin',
    purpose: 'Platform administration hub — lets the operator see all tenant accounts, agent health, and global system controls in one place.',
    primaryAgent: 'Steward',
    demoTalkingPoint: 'Steward is the reliability and governance agent. From this hub a platform operator can see every tenant, inspect agent dispatch queues, and confirm that the runtime safety gates are in position before going live.',
    expectedComponent: 'src/components/admin/StewardSetupControlCenter.tsx',
    readinessCaveat: 'None — surface renders with deterministic seed data.',
    fallbackIfBlocked: 'Navigate to /platform/admin/production-readiness as a substitute to demonstrate Steward governance depth.',
    validationStatus: 'ready',
  },
  {
    route: '/platform/admin/production-readiness',
    purpose: 'Production readiness tracker — gives the operator a live, component-by-component view of platform readiness across ten dimensions before any go-live decision.',
    primaryAgent: 'Steward',
    demoTalkingPoint: 'Before we take a single enterprise client live, Steward produces a readiness report across functionality, data readiness, agent readiness, tenant isolation, test coverage, and deployment health. The tracker is honest about what is deferred — no fake green indicators.',
    expectedComponent: 'src/components/admin/ProductionReadinessLivePanel.tsx',
    readinessCaveat: 'Live CI and Vercel polling tokens are absent in the demo environment; liveStatus is correctly reported as unavailable rather than fabricated.',
    fallbackIfBlocked: 'Show the static production-readiness.json manifest in docs/build/ to demonstrate the canonical readiness schema.',
    validationStatus: 'ready',
  },
  {
    route: '/platform/admin/build-progress',
    purpose: 'Build progress tracker — shows the founder exactly which of the eleven build waves have merged, which slices are complete, and what the next action is.',
    primaryAgent: 'Steward',
    demoTalkingPoint: 'We track every slice of platform work in a machine-readable wave manifest. This page surfaces that manifest so investors and the founding team can see progress at a glance — no spreadsheet required.',
    expectedComponent: 'src/lib/admin/build-progress',
    readinessCaveat: 'None — reads from the deterministic build-waves.json manifest; no live GitHub or Vercel polling.',
    fallbackIfBlocked: 'Open docs/build/build-waves.json directly and narrate the completed-wave list.',
    validationStatus: 'ready',
  },
  {
    route: '/tenant/apex-retail/programs',
    purpose: 'Programs list for the Apex Retail demo tenant — shows four active AI programs across Contact Center AI, CDP, Store Associate Productivity, and Demand Forecasting.',
    primaryAgent: 'Nexus',
    demoTalkingPoint: 'Apex Retail is running four AI programs simultaneously. Nexus keeps them all coordinated: priority order, risk signals, next milestones, and the stakeholder map are visible in one view. This is what the client\'s program office sees every morning.',
    expectedComponent: 'src/lib/programs/programs-canonical-view.ts',
    readinessCaveat: 'None — programs render from the Apex Retail seed data installed in the demo environment.',
    fallbackIfBlocked: 'Show the seed data in src/lib/programs/ to demonstrate program structure and fields.',
    validationStatus: 'ready',
  },
  {
    route: '/tenant/apex-retail/programs/[programSlug]',
    purpose: 'Program detail page — deep-dives a single program showing phase timeline, deliverables, evidence panel, and agent recommendations.',
    primaryAgent: 'Nexus',
    demoTalkingPoint: 'Click into the Contact Center AI program. You\'ll see the phase map, the active deliverables, and the evidence the agent used to set the current priority. The evidence panel shows exactly which source documents and data events informed each recommendation — full transparency, no black box.',
    expectedComponent: 'src/components/programs/ProgramCanonicalDetail.tsx',
    readinessCaveat: 'Content is seeded data only; live program-state ingestion, real deliverable generation, and workshop mode execution are deferred.',
    fallbackIfBlocked: 'Remain on the programs list and walk the summary cards in detail rather than drilling into a specific program.',
    validationStatus: 'partial',
  },
  {
    route: '/tenant/apex-retail/tower',
    purpose: 'AI Control Tower — Atlas\'s portfolio-level view showing adoption, value, risk, cost-consumption, and DORA dimensions across all active programs.',
    primaryAgent: 'Atlas',
    demoTalkingPoint: 'This is Atlas\'s command center. In a single glance the CTO or COO can see where AI investment is generating value, where adoption is lagging, and which programs are carrying the most technical risk. Pressure cards surface the most urgent signals automatically.',
    expectedComponent: 'src/components/tower/ProgramPressureCards.tsx',
    readinessCaveat: 'None — Tower renders with the full deterministic read model including proactive pressure-card surfacing from the Atlas FM-10 slice.',
    fallbackIfBlocked: 'Describe the five Tower dimensions (portfolio inventory, adoption, value, risk, DORA) using the ACT slice documentation in docs/build/slices/.',
    validationStatus: 'ready',
  },
  {
    route: '/tenant/apex-retail/intelligence',
    purpose: 'Solution Intelligence canvas — Sentinel\'s active-pattern detection surface showing which AI solution patterns are active, which are at risk, and which are emerging across the tenant.',
    primaryAgent: 'Sentinel',
    demoTalkingPoint: 'Sentinel watches for recurring patterns across all of Apex Retail\'s AI initiatives. If a data-quality pattern is undermining three programs at once, it surfaces here before any individual program team notices. This is enterprise-level signal aggregation that no human analyst can replicate at speed.',
    expectedComponent: 'src/components/intelligence/SentinelActivePatterns.tsx',
    readinessCaveat: 'None — Intelligence canvas renders with the full active-pattern seed and the SentinelPatternRail is installed on the tenant pattern pages.',
    fallbackIfBlocked: 'Walk the Intelligence section of the production-readiness tracker to describe the validated contract.',
    validationStatus: 'ready',
  },
  {
    route: '/tenant/apex-retail/intelligence/patterns/[patternKey]',
    purpose: 'Pattern detail page — drill-down into a specific Sentinel detection showing evidence sources, affected programs, severity trend, and recommended remediation actions.',
    primaryAgent: 'Sentinel',
    demoTalkingPoint: 'Click into the top-ranked active pattern. Sentinel shows every data point that informed the detection, the programs affected, and a prioritized list of actions. The evidence trail is immutable — the founder or auditor can trace every recommendation back to source.',
    expectedComponent: 'src/lib/intelligence/sentinel-pattern-detections.ts',
    readinessCaveat: 'Pattern detail content is seeded data only; live detection ingestion, real-time severity scoring, and automated remediation dispatch are deferred.',
    fallbackIfBlocked: 'Show the active pattern list on the Intelligence canvas without drilling into a specific pattern, and narrate the evidence model.',
    validationStatus: 'partial',
  },
  {
    route: '/source',
    purpose: 'Source platform entry — the data-ingestion and event-governance surface where operators configure what data flows into Nexus, Atlas, Sentinel, and Steward.',
    primaryAgent: 'Steward',
    demoTalkingPoint: 'Source is where enterprise data becomes agent-grade signal. Steward governs every intake: schema validation, trust level assignment, and retention policy are set here before any agent is allowed to reason over client data.',
    expectedComponent: 'src/lib/source/',
    readinessCaveat: 'Source surfaces are partially implemented; admin/setup readiness contract, data readiness panel, and event canvas are code-complete but live event ingestion and authenticated route smoke automation are deferred.',
    fallbackIfBlocked: 'Describe the data trust model (L0–L4 sharing levels and the five-state trust ladder) using the TRUST1 documentation in docs/build/slices/.',
    validationStatus: 'partial',
  },
  {
    route: '/source/events',
    purpose: 'Event canvas — shows the live stream of data events flowing into the platform, filterable by source, type, trust level, and processing status.',
    primaryAgent: 'Steward',
    demoTalkingPoint: 'Every data event entering the platform is logged here. The founder can show a prospective enterprise client exactly how their existing data pipelines would connect, what the trust classification looks like, and how Steward quarantines untrusted records before agents touch them.',
    expectedComponent: 'src/lib/source/events',
    readinessCaveat: 'Event canvas renders from seed data; live event stream ingestion, real-time filtering, and authenticated persona-walk automation are deferred.',
    fallbackIfBlocked: 'Show the Source admin/setup readiness contract documentation to explain the event data governance model without a live feed.',
    validationStatus: 'partial',
  },
] as const);

// ---------------------------------------------------------------------
// Public builder.
// ---------------------------------------------------------------------

export function buildFounderDemoRouteChecklist(): FounderDemoRouteChecklist {
  const routes = [...DEMO_ROUTES];

  let readyRoutes = 0;
  let partialRoutes = 0;
  let deferredRoutes = 0;
  let blockedRoutes = 0;

  for (const r of routes) {
    if (r.validationStatus === 'ready') readyRoutes += 1;
    else if (r.validationStatus === 'partial') partialRoutes += 1;
    else if (r.validationStatus === 'deferred') deferredRoutes += 1;
    else if (r.validationStatus === 'blocked') blockedRoutes += 1;
  }

  return {
    generatedAt: '2026-04-26',
    totalRoutes: routes.length,
    readyRoutes,
    partialRoutes,
    deferredRoutes,
    blockedRoutes,
    routes,
  };
}
