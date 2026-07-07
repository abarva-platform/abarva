export type HelpCenterAudience = 'all-users' | 'admins' | 'operators';

export interface HelpCenterArticle {
  readonly id: string;
  readonly title: string;
  readonly audience: HelpCenterAudience;
  readonly summary: string;
  readonly route?: string;
  readonly checkpoints: readonly string[];
}

export interface HelpCenterWorkflow {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly steps: readonly string[];
}

export const HELP_CENTER_ARTICLES: readonly HelpCenterArticle[] = [
  {
    id: 'home-insights',
    title: 'Home: daily insight view',
    audience: 'all-users',
    route: '/home',
    summary:
      'Use Home as the first stop for executive insight, active work, blockers, and recent decision-support signals. Setup, templates, connectors, and data loading stay out of Home.',
    checkpoints: [
      'Confirm you are in the right client workspace.',
      'Review active insights before opening a module.',
      'Use module links for deeper work instead of changing setup from Home.',
    ],
  },
  {
    id: 'admin-setup',
    title: 'Admin/Setup: client workspace control',
    audience: 'admins',
    route: '/admin/setup',
    summary:
      'Use Admin/Setup for users, SSO readiness, connectors, templates, data-load governance, upload exceptions, quarantine, processing, and outputs exploration.',
    checkpoints: [
      'Only admins can access setup controls.',
      'Data loading is scoped to one client workspace at a time.',
      'AI-suggested setup changes require human approval and reason capture.',
    ],
  },
  {
    id: 'moves',
    title: 'Moves/Nexus: decision programs',
    audience: 'operators',
    route: '/strategic-moves',
    summary:
      'Use Moves to shape, govern, and advance transformation decisions with phase gates, evidence, business case artifacts, and explicit human approval.',
    checkpoints: [
      'Do not advance a phase without human rationale.',
      'Attach evidence before relying on a recommendation.',
      'Treat AI output as draft decision support, not an autonomous decision.',
    ],
  },
  {
    id: 'source',
    title: 'Source: sourcing events',
    audience: 'operators',
    route: '/source',
    summary:
      'Use Source for commercial events, vendor evidence, BAFO/pricing proof, scorecards, approvals, and exportable sourcing deliverables.',
    checkpoints: [
      'Check scorecard governance before using a recommendation.',
      'Confirm vendor evidence and pricing assumptions before export.',
      'Use approved artifacts for CXO or board distribution.',
    ],
  },
  {
    id: 'tower-atlas',
    title: 'Tower/Atlas: portfolio outcomes',
    audience: 'operators',
    route: '/tower',
    summary:
      'Use Tower to track portfolio outcomes, risks, execution pressure, and executive signals across active programs and sourcing events.',
    checkpoints: [
      'Review outcome evidence before acting on alerts.',
      'Treat forecasts as assumptions until approved.',
      'Use exports only when human-decision language is present.',
    ],
  },
  {
    id: 'intelligence-sentinel',
    title: 'Intelligence/Sentinel: pattern reasoning',
    audience: 'operators',
    route: '/intelligence',
    summary:
      'Use Intelligence to explore patterns, contradictions, failure modes, and grounded questions that bind back to AbarVa corpus and client context.',
    checkpoints: [
      'Ask questions inside the client/program context.',
      'Expect citations, confidence, and boundaries on unsupported questions.',
      'Use pattern findings to inform, not replace, human judgment.',
    ],
  },
];

export const HELP_CENTER_WORKFLOWS: readonly HelpCenterWorkflow[] = [
  {
    id: 'new-user-start',
    title: 'New user first session',
    owner: 'Client admin + operator',
    steps: [
      'Admin confirms user access and role.',
      'User opens Home and verifies the client workspace.',
      'User reviews the relevant module guide before entering live work.',
      'Operator captures unresolved questions in the product feedback intake.',
    ],
  },
  {
    id: 'data-load-ready',
    title: 'Client data reload readiness',
    owner: 'Client admin',
    steps: [
      'Open Admin/Setup and confirm the active client workspace.',
      'Review templates and required metadata before upload.',
      'Acknowledge data-load responsibility and sensitive-data rules.',
      'Resolve quarantine or schema-clarification items before processing commit.',
    ],
  },
  {
    id: 'artifact-approval',
    title: 'Deliverable approval and export',
    owner: 'Decision owner',
    steps: [
      'Confirm evidence coverage and missing-data banners.',
      'Review AI-assisted draft language and edit before commit.',
      'Record decision owner, approval rationale, and timestamp.',
      'Export only approved artifacts with decision-support language.',
    ],
  },
];

export const HELP_CENTER_SUPPORT_PATHS = [
  'Capture product feedback through the single intake queue.',
  'Escalate security, privacy, auth, tenant isolation, or regulated-data issues through incident response.',
  'Use roadmap status language from Now / Next / Later; do not promise dates without a release path.',
] as const;
