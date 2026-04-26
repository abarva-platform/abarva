import * as fs from 'fs';
import * as path from 'path';

export type PersonaWalkStatus = 'pass' | 'partial' | 'deferred' | 'fail';
export type DesignedVsTested = 'designed' | 'scaffolded' | 'tested' | 'deferred';

export interface PersonaRouteStep {
  route: string;
  expectedAction: string;
  expectedInsight: string;
  actualStatus: PersonaWalkStatus;
  evidence: string;
}

export interface PersonaWalkResult {
  personaId: string;
  personaName: string;
  objective: string;
  routeSequence: PersonaRouteStep[];
  currentReadiness: PersonaWalkStatus;
  blockers: string[];
  evidenceRequired: string[];
  nextValidationAction: string;
  walkedAt: string;
  designedVsTested: DesignedVsTested;
}

export interface PersonaWalkResultsManifest {
  generatedAt: string;
  totalPersonas: number;
  passCount: number;
  partialCount: number;
  deferredCount: number;
  failCount: number;
  results: PersonaWalkResult[];
}

export function buildPersonaWalkResults(): PersonaWalkResultsManifest {
  const results: PersonaWalkResult[] = [
    {
      personaId: 'founder-operator',
      personaName: 'Founder / Platform Operator',
      objective: 'Validate full platform state and production readiness posture',
      routeSequence: [
        {
          route: '/home',
          expectedAction: 'Review executive entry panel and agent mission preview',
          expectedInsight: 'Platform state, active programs, pending missions',
          actualStatus: 'partial',
          evidence: 'Home route renders; mission preview uses seed data only',
        },
        {
          route: '/platform/admin',
          expectedAction: 'Review admin surface and dataset setup',
          expectedInsight: 'Dataset trust model, approval workflow, user access',
          actualStatus: 'partial',
          evidence: 'Admin surface renders with seed datasets; live dataset ingestion deferred',
        },
        {
          route: '/platform/admin/production-readiness',
          expectedAction: 'Review production readiness tracker',
          expectedInsight: 'Overall readiness percent, top blockers, component status',
          actualStatus: 'pass',
          evidence: 'ProductionReadinessTracker renders from static manifest; 24/24 tests pass',
        },
      ],
      currentReadiness: 'partial',
      blockers: ['Live agent mission queue not wired', 'Seed data only — no live ingestion'],
      evidenceRequired: ['Live mission queue integration test', 'Real dataset ingestion end-to-end'],
      nextValidationAction: 'Wire live mission queue; replace seed context with real data ingestion',
      walkedAt: '2026-04-26',
      designedVsTested: 'tested',
    },
    {
      personaId: 'client-maestro',
      personaName: 'Client Maestro',
      objective: 'Run a program workshop and capture meeting notes with proposed updates',
      routeSequence: [
        {
          route: '/tenant/apex-retail/programs',
          expectedAction: 'Browse program list and select active program',
          expectedInsight: 'Program portfolio status, phases, deliverables progress',
          actualStatus: 'partial',
          evidence: 'Programs list renders from seed data; Apex Retail programs present',
        },
        {
          route: '/tenant/apex-retail/programs/[programSlug]',
          expectedAction: 'Open program detail and enter workshop mode',
          expectedInsight: 'Program health scorecard, workshop outcomes, meeting notes',
          actualStatus: 'partial',
          evidence: 'Program detail renders; workshop mode scaffolded; proposed updates use seed',
        },
      ],
      currentReadiness: 'partial',
      blockers: ['Workshop mode uses seed outcomes only', 'Meeting notes capture not wired to live input'],
      evidenceRequired: ['Live workshop session test', 'Meeting notes round-trip test'],
      nextValidationAction: 'Implement live meeting notes capture; wire workshop outcome to real program data',
      walkedAt: '2026-04-26',
      designedVsTested: 'scaffolded',
    },
    {
      personaId: 'cio-cto',
      personaName: 'CIO / CTO',
      objective: 'Review AI portfolio performance, intelligence patterns, and tech readiness',
      routeSequence: [
        {
          route: '/tenant/apex-retail/tower',
          expectedAction: 'Review AI Control Tower dashboard — cost, adoption, risk',
          expectedInsight: 'AI tool inventory, spend, adoption rates, tech readiness signals',
          actualStatus: 'partial',
          evidence: 'Tower renders with seed metrics; ACT6/8/11/12 slices present',
        },
        {
          route: '/tenant/apex-retail/intelligence',
          expectedAction: 'Review solution intelligence and pattern library',
          expectedInsight: 'Pattern coverage, pattern playbook, sentinel rail checks',
          actualStatus: 'partial',
          evidence: 'Intelligence surface renders; SOL15/16 pattern coverage from seed manifest',
        },
      ],
      currentReadiness: 'partial',
      blockers: ['No live AI tool signals — all metrics from seed', 'Pattern confidence scores are static'],
      evidenceRequired: ['Live cost/adoption signal integration', 'Pattern coverage from real data sources'],
      nextValidationAction: 'Connect AI tool telemetry; wire real pattern evidence to sentinel',
      walkedAt: '2026-04-26',
      designedVsTested: 'scaffolded',
    },
    {
      personaId: 'cfo-value-office',
      personaName: 'CFO / Value Office',
      objective: 'Review ROI evidence, outcome ledger, and value realisation tracking',
      routeSequence: [
        {
          route: '/tenant/apex-retail/tower',
          expectedAction: 'Navigate to value/outcome view in AI Control Tower',
          expectedInsight: 'Value outcomes, cost avoidance, productivity gains',
          actualStatus: 'deferred',
          evidence: 'Value ledger slice (ACT4) not yet shipped; outcome ledger UI deferred',
        },
      ],
      currentReadiness: 'deferred',
      blockers: ['Value ledger slice not complete', 'ROI evidence model not wired'],
      evidenceRequired: ['Value Outcome Ledger (ACT4) completion', 'Evidence-backed ROI claims'],
      nextValidationAction: 'Complete ACT4 value outcome ledger slice; surface in Tower UI',
      walkedAt: '2026-04-26',
      designedVsTested: 'deferred',
    },
    {
      personaId: 'steward-admin',
      personaName: 'Steward Admin',
      objective: 'Configure datasets, trust model, user access, and approval workflows',
      routeSequence: [
        {
          route: '/platform/admin',
          expectedAction: 'Configure dataset trust and approval settings',
          expectedInsight: 'Dataset domains, trust scores, pending approvals',
          actualStatus: 'partial',
          evidence: 'Dataset trust model renders; ADM3/4/5 slices present with seed data',
        },
        {
          route: '/source',
          expectedAction: 'Review source platform entry and event canvas',
          expectedInsight: 'Source workspace scope, active events, readiness contracts',
          actualStatus: 'partial',
          evidence: 'Source surface partial; scope stage workspace added in PR #311',
        },
      ],
      currentReadiness: 'partial',
      blockers: ['Approval workflow uses seed approvers', 'Source event canvas partially implemented'],
      evidenceRequired: ['Approval workflow end-to-end test', 'Source event canvas smoke test'],
      nextValidationAction: 'Wire real approval workflow; complete source event canvas',
      walkedAt: '2026-04-26',
      designedVsTested: 'scaffolded',
    },
    {
      personaId: 'data-owner',
      personaName: 'Data Owner',
      objective: 'Review dataset trust levels, access policies, and evidence manifest',
      routeSequence: [
        {
          route: '/source',
          expectedAction: 'Access data readiness contract and trust levels',
          expectedInsight: 'Dataset trust scores, access policy, evidence manifest status',
          actualStatus: 'partial',
          evidence: 'Source data readiness panel renders with seed trust data',
        },
        {
          route: '/source/events',
          expectedAction: 'Review event canvas and active dataset events',
          expectedInsight: 'Event stream, dataset change log, ingestion status',
          actualStatus: 'partial',
          evidence: 'Event canvas shell created; live event stream deferred',
        },
      ],
      currentReadiness: 'partial',
      blockers: ['Live event stream not wired', 'Trust scoring uses static manifest'],
      evidenceRequired: ['Live event stream integration', 'Dynamic trust score computation'],
      nextValidationAction: 'Implement live event ingestion pipeline; wire dynamic trust scoring',
      walkedAt: '2026-04-26',
      designedVsTested: 'scaffolded',
    },
    {
      personaId: 'transformation-lead',
      personaName: 'Transformation Lead',
      objective: 'Review program portfolio, solution recommendations, and AI adoption patterns',
      routeSequence: [
        {
          route: '/tenant/apex-retail/programs',
          expectedAction: 'Review full program portfolio with health scorecards',
          expectedInsight: 'Program health grades, phase progress, risk signals',
          actualStatus: 'partial',
          evidence: 'Program health scorecard (PROG9) renders with seed data',
        },
        {
          route: '/tenant/apex-retail/intelligence',
          expectedAction: 'Review solution intelligence and pattern recommendations',
          expectedInsight: 'Pattern playbook, coverage summary, recommended solutions',
          actualStatus: 'partial',
          evidence: 'SOL15/16 pattern coverage from seed manifest; recommendations static',
        },
      ],
      currentReadiness: 'partial',
      blockers: ['Solution recommendations use static playbook', 'Pattern coverage not driven by real client data'],
      evidenceRequired: ['Dynamic solution recommendation test', 'Real client pattern coverage data'],
      nextValidationAction: 'Connect pattern engine to real client context; enable dynamic recommendations',
      walkedAt: '2026-04-26',
      designedVsTested: 'scaffolded',
    },
  ];

  const passCount = results.filter((r) => r.currentReadiness === 'pass').length;
  const partialCount = results.filter((r) => r.currentReadiness === 'partial').length;
  const deferredCount = results.filter((r) => r.currentReadiness === 'deferred').length;
  const failCount = results.filter((r) => r.currentReadiness === 'fail').length;

  return {
    generatedAt: '2026-04-26',
    totalPersonas: results.length,
    passCount,
    partialCount,
    deferredCount,
    failCount,
    results,
  };
}
