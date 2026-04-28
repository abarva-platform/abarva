export type BuildStatus =
  | 'not_started'
  | 'ready'
  | 'in_progress'
  | 'code_complete'
  | 'verified'
  | 'blocked';

export type BuildRisk = 'low' | 'medium' | 'high' | 'critical';

export type ValidationStatus = 'not_run' | 'passing' | 'failing' | 'partial' | 'blocked';

export interface ProductionReadiness {
  score: number;
  currentPhase: string;
  nextRecommendedAction: string;
  topBlockers: string[];
}

export interface BuildCategory {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';
  name: string;
  spine: string;
  status: BuildStatus;
  progress: number;
  completedSlices: number;
  totalSlices: number;
  currentActiveSlice: string;
  blockerCount: number;
  summary: string;
}

export interface CriticalPathMilestone {
  id: string;
  order: number;
  name: string;
  status: BuildStatus;
  owner: string;
  note: string;
}

export interface ExecutionSlice {
  id: string;
  name: string;
  category: BuildCategory['id'];
  status: BuildStatus;
  risk: BuildRisk;
  ownerRecommendation: string;
  dependencies: string[];
  acceptanceSummary: string;
}

export interface ValidationCommand {
  id: string;
  label: string;
  command: string;
  status: ValidationStatus;
  scope: string;
  latestNote: string;
}

export interface ProductionReadinessSignal {
  id: string;
  label: string;
  status: BuildStatus;
  detail: string;
}

export interface BuildProgressRoadmap {
  lastUpdated: string;
  productionReadiness: ProductionReadiness;
  categories: BuildCategory[];
  criticalPath: CriticalPathMilestone[];
  sliceQueue: ExecutionSlice[];
  validationCommands: ValidationCommand[];
  productionSignals: ProductionReadinessSignal[];
  guidance: string[];
}

export const buildProgressRoadmap: BuildProgressRoadmap = {
  lastUpdated: '2026-04-24',
  productionReadiness: {
    score: 32,
    currentPhase: 'Foundation runtime and verification hardening',
    nextRecommendedAction:
      'Create deterministic Source context validation fixtures, then wire the global Context Bundle into Nexus runPipeline().',
    topBlockers: [
      'A1 Context Bundle runtime is not globally integrated with Nexus composition.',
      'Cycle 2 fixes are code-present but still need live persona re-walks beyond tenant isolation check #1.',
      'Hero deliverables still need substantive financial and clinical content, not seeded scaffolds.',
      'Pattern library content depth is below production threshold for Tier 2 and Tier 3 use cases.',
    ],
  },
  categories: [
    {
      id: 'A',
      name: 'Foundation Runtime',
      spine: 'Runtime spine',
      status: 'in_progress',
      progress: 34,
      completedSlices: 1,
      totalSlices: 4,
      currentActiveSlice: 'A1 Context Bundle runtime',
      blockerCount: 2,
      summary:
        'Source has deterministic context contracts, but the global 5-state Context Bundle still needs to gate Nexus composition.',
    },
    {
      id: 'B',
      name: 'Agent Runtimes',
      spine: 'Agent runtime spine',
      status: 'in_progress',
      progress: 24,
      completedSlices: 1,
      totalSlices: 5,
      currentActiveSlice: 'B1 Nexus runtime integration',
      blockerCount: 3,
      summary:
        'Nexus, Sentinel, and Atlas exist as runtimes; Steward and visible cross-agent handoffs remain incomplete.',
    },
    {
      id: 'C',
      name: 'Surface Applications',
      spine: 'Product surfaces',
      status: 'in_progress',
      progress: 31,
      completedSlices: 2,
      totalSlices: 6,
      currentActiveSlice: 'C1/C2 Programs and Source readiness',
      blockerCount: 4,
      summary:
        'Programs, Source, Intelligence, Tower, and Admin routes exist; canonical readiness and live validation remain uneven.',
    },
    {
      id: 'D',
      name: 'Data Architecture',
      spine: 'State and registry spine',
      status: 'in_progress',
      progress: 26,
      completedSlices: 0,
      totalSlices: 6,
      currentActiveSlice: 'D1 workflow state machines',
      blockerCount: 2,
      summary:
        'Program, Intelligence, Tower, and auth data layers exist, but Source and workflow state need production registries.',
    },
    {
      id: 'E',
      name: 'Pattern Library Content',
      spine: 'Pattern intelligence spine',
      status: 'blocked',
      progress: 10,
      completedSlices: 0,
      totalSlices: 6,
      currentActiveSlice: 'E1 meta-pattern review and lock',
      blockerCount: 4,
      summary:
        'Content-authoring heavy. Meta-patterns, Tier 2 capabilities, and Tier 3 hero patterns need founder/domain substance.',
    },
    {
      id: 'F',
      name: 'Deliverables and Artifacts',
      spine: 'Artifact Studio and Value Ledger',
      status: 'in_progress',
      progress: 18,
      completedSlices: 0,
      totalSlices: 5,
      currentActiveSlice: 'F1 generator and F2 hero deliverable content',
      blockerCount: 3,
      summary:
        'Renderers exist, but rich deliverables need evidence-backed financial and clinical substance before persona approval.',
    },
    {
      id: 'G',
      name: 'File Ingestion and Evidence',
      spine: 'Evidence spine',
      status: 'ready',
      progress: 8,
      completedSlices: 0,
      totalSlices: 4,
      currentActiveSlice: 'G1 tenant-scoped upload pipeline',
      blockerCount: 2,
      summary:
        'Upload endpoints and parser dependencies exist, but file-to-evidence conversion is not production-grade.',
    },
    {
      id: 'H',
      name: 'Chat and Input',
      spine: 'Input and continuity spine',
      status: 'in_progress',
      progress: 18,
      completedSlices: 1,
      totalSlices: 4,
      currentActiveSlice: 'H1 three choices plus custom',
      blockerCount: 2,
      summary:
        'Choice chips and chat contracts exist; suggestion quality linting and protected-term typo tolerance are missing.',
    },
    {
      id: 'I',
      name: 'Validation Infrastructure',
      spine: 'Verification spine',
      status: 'ready',
      progress: 12,
      completedSlices: 0,
      totalSlices: 4,
      currentActiveSlice: 'I1 crawler personas and I2 golden prompts',
      blockerCount: 2,
      summary:
        'Manual persona reports drive planning today; callable crawler personas and CI prompt harness are still needed.',
    },
    {
      id: 'J',
      name: 'Governance and Build Discipline',
      spine: 'Build control spine',
      status: 'in_progress',
      progress: 35,
      completedSlices: 2,
      totalSlices: 5,
      currentActiveSlice: 'J2 page readiness contracts and J3 cycle discipline',
      blockerCount: 1,
      summary:
        'CYCLE_STATE discipline is active and Source Build Pack exists; PR packet and auto-merge retirement need lock.',
    },
    {
      id: 'K',
      name: 'Deploy and Operations',
      spine: 'Production operations',
      status: 'ready',
      progress: 8,
      completedSlices: 0,
      totalSlices: 5,
      currentActiveSlice: 'K1 production deployment readiness',
      blockerCount: 3,
      summary:
        'Vercel deployment exists for app.abarva.ai; app.abarva.com DNS was unresolved from local verification.',
    },
  ],
  criticalPath: [
    {
      id: 'cp-01',
      order: 1,
      name: 'Canon / design authority locked',
      status: 'code_complete',
      owner: 'Founder + build control',
      note: 'Source Build Pack and design canon are present; broader canon reconciliation remains open.',
    },
    {
      id: 'cp-02',
      order: 2,
      name: 'Context Bundle runtime',
      status: 'in_progress',
      owner: 'Code',
      note: 'Source context builder exists; global Nexus runPipeline integration is the next runtime gate.',
    },
    {
      id: 'cp-03',
      order: 3,
      name: 'Honest disclosure / response contract',
      status: 'code_complete',
      owner: 'Code',
      note: 'Response primitives exist; still need direct wiring to bundle quality scores.',
    },
    {
      id: 'cp-04',
      order: 4,
      name: 'Tenant isolation verified',
      status: 'code_complete',
      owner: 'Code + crawler personas',
      note: 'Dr. L check #1 passed; full live re-walk remains required for all tenant/auth fixes.',
    },
    {
      id: 'cp-05',
      order: 5,
      name: 'Nexus runtime integrated',
      status: 'in_progress',
      owner: 'Code',
      note: 'Nexus six-phase pipeline exists; Context Bundle adapter and response-mode gates remain.',
    },
    {
      id: 'cp-06',
      order: 6,
      name: 'Programs canonical surface',
      status: 'in_progress',
      owner: 'Code + content',
      note: 'Routes and rails exist; page readiness and deliverable substance are not fully verified.',
    },
    {
      id: 'cp-07',
      order: 7,
      name: 'Control Tower v1',
      status: 'in_progress',
      owner: 'Code',
      note: 'Tower pressure surfaces exist; Atlas and portfolio aggregation need production proof.',
    },
    {
      id: 'cp-08',
      order: 8,
      name: 'Source v1',
      status: 'ready',
      owner: 'Product + Code',
      note: 'Dashboard and context contracts exist; no further UI expansion before runtime validation.',
    },
    {
      id: 'cp-09',
      order: 9,
      name: 'Admin / Steward v1',
      status: 'ready',
      owner: 'Code',
      note: 'Admin surfaces exist; Steward runtime, connector health, and audit enforcement remain.',
    },
    {
      id: 'cp-10',
      order: 10,
      name: 'Intelligence / Sentinel v1',
      status: 'in_progress',
      owner: 'Code + content',
      note: 'Sentinel can reason over patterns; content depth and evidence validation are incomplete.',
    },
    {
      id: 'cp-11',
      order: 11,
      name: 'Hero deliverables',
      status: 'blocked',
      owner: 'Founder + content',
      note: 'D16/D17/D01/D10 need decision-grade financial and clinical substance.',
    },
    {
      id: 'cp-12',
      order: 12,
      name: 'Validation harness',
      status: 'ready',
      owner: 'Code',
      note: 'Manual crawler reports exist; callable persona and golden prompt harness are next.',
    },
    {
      id: 'cp-13',
      order: 13,
      name: 'Production deployment',
      status: 'not_started',
      owner: 'Founder + ops',
      note: 'app.abarva.ai resolves; app.abarva.com DNS and production readiness controls need closure.',
    },
  ],
  sliceQueue: [
    {
      id: 'S0',
      name: 'Repo guardrails and PR packet',
      category: 'J',
      status: 'ready',
      risk: 'medium',
      ownerRecommendation: 'Code owns template; founder approves merge discipline.',
      dependencies: ['CYCLE_STATE discipline', 'auto-merge retirement decision'],
      acceptanceSummary:
        'Every slice declares allowed files, forbidden files, acceptance criteria, validation commands, and review packet.',
    },
    {
      id: 'S1',
      name: 'Context Bundle contracts',
      category: 'A',
      status: 'in_progress',
      risk: 'high',
      ownerRecommendation: 'Code should align Source context contracts with global Nexus bundle shape.',
      dependencies: ['Canon AUTHORED-LOCKED', 'existing runPipeline documented'],
      acceptanceSummary:
        'Typed bundle contract covers work object, tenant, evidence, workflow, pattern, files, conversation, and quality state.',
    },
    {
      id: 'S2',
      name: 'Context scoring/classifier',
      category: 'A',
      status: 'ready',
      risk: 'high',
      ownerRecommendation: 'Code should implement deterministic quality scoring before model invocation.',
      dependencies: ['S1'],
      acceptanceSummary:
        '5-state classifier and quality scores reject insufficient or high vanilla-risk contexts at composition time.',
    },
    {
      id: 'S3',
      name: 'Source context validation fixtures',
      category: 'I',
      status: 'ready',
      risk: 'low',
      ownerRecommendation: 'Code can ship fixtures without touching Source UI.',
      dependencies: ['Source context builder', 'Source mock seed'],
      acceptanceSummary:
        'Deterministic fixtures cover portfolio, event, stage, missing event, and low-context states with assertions.',
    },
    {
      id: 'S4',
      name: 'Nexus context adapter',
      category: 'B',
      status: 'ready',
      risk: 'high',
      ownerRecommendation: 'Code should adapt runPipeline retrieve/assemble phases without prompt churn.',
      dependencies: ['S1', 'S2'],
      acceptanceSummary:
        'Nexus receives scored Context Bundle before Claude invocation and exposes bundle metadata to composition.',
    },
    {
      id: 'S5',
      name: 'Honest disclosure response contract',
      category: 'A',
      status: 'ready',
      risk: 'medium',
      ownerRecommendation: 'Code should bind existing disclosure primitives to actual bundle scores.',
      dependencies: ['S2', 'AgentResponse primitives'],
      acceptanceSummary:
        'Disclosure banner, confidence qualifier, and context-used indicators render from measured context quality.',
    },
    {
      id: 'S6',
      name: 'Agent UI score wiring',
      category: 'B',
      status: 'not_started',
      risk: 'medium',
      ownerRecommendation: 'Code should wire UI after S5, not before.',
      dependencies: ['S5'],
      acceptanceSummary:
        'Agent responses show confidence, context-used, sparse context, and handoff state consistently across surfaces.',
    },
    {
      id: 'S7',
      name: 'Tenant isolation probe tests',
      category: 'A',
      status: 'ready',
      risk: 'critical',
      ownerRecommendation: 'Code should codify Marcus T and Dr. L cross-tenant probes as regression tests.',
      dependencies: ['C2 tenant isolation fix'],
      acceptanceSummary:
        'Cross-tenant tenant/program/deliverable/API probes return 403 or equivalent blocked JSON, never content.',
    },
    {
      id: 'S8',
      name: 'Programs page readiness contract',
      category: 'J',
      status: 'ready',
      risk: 'medium',
      ownerRecommendation: 'Product and Code should lock contract before further Programs UI work.',
      dependencies: ['J2 page readiness discipline'],
      acceptanceSummary:
        'Programs index/detail contract defines data, states, agent role, validation, and forbidden legacy dependencies.',
    },
    {
      id: 'S9',
      name: 'Programs canonical index/detail proof',
      category: 'C',
      status: 'not_started',
      risk: 'high',
      ownerRecommendation: 'Code should implement only after S8 approval.',
      dependencies: ['S8', 'B1 Nexus runtime', 'D2 program model'],
      acceptanceSummary:
        'Founder can open canonical Programs index/detail and answer status, value, risk, gate, and next action in 3 seconds.',
    },
  ],
  validationCommands: [
    {
      id: 'lint',
      label: 'Lint',
      command: 'npm run lint',
      status: 'not_run',
      scope: 'full repo',
      latestNote: 'Required before PR. Run after file edits stabilize.',
    },
    {
      id: 'typecheck',
      label: 'Typecheck',
      command: 'npx tsc --noEmit --pretty false',
      status: 'not_run',
      scope: 'full repo',
      latestNote: 'Acceptance requires this to pass for the build-progress page.',
    },
    {
      id: 'build',
      label: 'Production build',
      command: 'npm run build',
      status: 'not_run',
      scope: 'full app',
      latestNote: 'Run when feasible after route/component creation.',
    },
    {
      id: 'unit',
      label: 'Unit tests',
      command: 'npm test',
      status: 'not_run',
      scope: 'full Jest suite',
      latestNote: 'Static dashboard has no dedicated tests yet.',
    },
    {
      id: 'e2e',
      label: 'E2E tests',
      command: 'npm run test:e2e',
      status: 'not_run',
      scope: 'Playwright',
      latestNote: 'Not required for static admin page unless requested.',
    },
    {
      id: 'source-lint',
      label: 'Targeted Source lint',
      command: "npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source",
      status: 'passing',
      scope: 'Source sidecar',
      latestNote: 'Last observed passing in this thread after dashboard refactor.',
    },
    {
      id: 'nexus-tests',
      label: 'Targeted Nexus tests',
      command: 'npm run test:integration:nexus',
      status: 'not_run',
      scope: 'Nexus integration',
      latestNote: 'Run before Nexus Context Bundle adapter merges.',
    },
    {
      id: 'programs-tests',
      label: 'Targeted Programs tests',
      command: 'npm run test:e2e:phase-0',
      status: 'not_run',
      scope: 'Programs phase routes',
      latestNote: 'Run when Programs readiness contract or canonical proof changes.',
    },
  ],
  productionSignals: [
    {
      id: 'tenant',
      label: 'Tenant isolation',
      status: 'code_complete',
      detail: 'Core guard exists and Dr. L tenant-isolation check passed; broader live re-walk pending.',
    },
    {
      id: 'dns',
      label: 'Production domain',
      status: 'blocked',
      detail: 'app.abarva.ai resolves; app.abarva.com did not resolve from local verification.',
    },
    {
      id: 'runtime',
      label: 'Agent runtime foundation',
      status: 'in_progress',
      detail: 'Nexus/Sentinel/Atlas exist; global Context Bundle and Steward runtime still open.',
    },
    {
      id: 'content',
      label: 'Decision-grade content',
      status: 'blocked',
      detail: 'Hero deliverables and pattern library depth need founder/domain authoring.',
    },
    {
      id: 'validation',
      label: 'Crawler validation',
      status: 'ready',
      detail: 'Manual persona reports exist; automated persona/golden prompt harness is next.',
    },
  ],
  guidance: [
    'Do not run parallel agents against overlapping file scopes.',
    'Code Complete is not Verified.',
    'No Source UI expansion before runtime foundation.',
    'No migrations without explicit approval.',
    'No model calls in tests unless explicitly approved.',
    'Every slice needs allowed files, forbidden files, acceptance criteria, and validation commands.',
  ],
};
