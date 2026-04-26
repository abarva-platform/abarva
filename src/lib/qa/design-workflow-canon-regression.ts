/**
 * QA24: Wave-17 Design + Workflow Canon Regression Manifest
 *
 * Manifest-driven verification lib for AbarVa visual canon and workflow content
 * canon. Tracks banned visual tokens (teal, cyber black, sparkle, Sanskrit,
 * neon), required canon colors (navy accent, off-white surface, ink text),
 * workflow contract keywords (pageQuestion, primaryAgent, recommendedNextAction,
 * deterministic), and the canonical UI surfaces those rules apply to.
 *
 * Pure TypeScript. Manifest-driven. No file IO at import time.
 */

export interface BannedTokenRule {
  ruleId: string;
  pattern: string | RegExp;
  description: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface RequiredCanonRule {
  ruleId: string;
  pattern: string | RegExp;
  description: string;
  appliesTo: 'all-ui' | 'shell' | 'admin' | 'source';
}

export interface WorkflowContractRule {
  ruleId: string;
  requiredKeyword: string;
  description: string;
  appliesTo: 'all-pages' | 'admin' | 'source' | 'architecture';
}

export interface TargetPage {
  pageId: string;
  routePath: string;
  filePath: string;
  primaryAgent: 'nexus' | 'sentinel' | 'atlas' | 'steward';
  requiredWorkflowSections: string[];
}

export interface DesignWorkflowCanonReport {
  generatedAt: string;
  bannedTokens: BannedTokenRule[];
  requiredCanons: RequiredCanonRule[];
  workflowContracts: WorkflowContractRule[];
  targetPages: TargetPage[];
  summary: string;
}

export const BANNED_TOKENS: BannedTokenRule[] = [
  {
    ruleId: 'banned-teal-1',
    pattern: '#14B8A6',
    description: 'Tailwind teal-500 — banned in canon',
    severity: 'critical',
  },
  {
    ruleId: 'banned-teal-2',
    pattern: '#0E9F8C',
    description: 'Custom teal accent — banned in canon',
    severity: 'critical',
  },
  {
    ruleId: 'banned-teal-3',
    pattern: '#0D9488',
    description: 'Tailwind teal-600 — banned in canon',
    severity: 'critical',
  },
  {
    ruleId: 'banned-cyber-bg-1',
    pattern: '#0A0A0A',
    description: 'Solid black "cyber dashboard" bg — banned',
    severity: 'high',
  },
  {
    ruleId: 'banned-sparkle-1',
    pattern: '✨',
    description: 'AI sparkle emoji — banned',
    severity: 'high',
  },
  {
    ruleId: 'banned-sparkle-2',
    pattern: 'sparkle',
    description:
      'Sparkle reference — banned in source comments and visible text',
    severity: 'medium',
  },
  {
    ruleId: 'banned-sanskrit',
    pattern: /[ऀ-ॿ]/,
    description: 'Sanskrit/Devanagari characters — banned',
    severity: 'critical',
  },
  {
    ruleId: 'banned-neon-1',
    pattern: '#39FF14',
    description: 'Neon green — banned',
    severity: 'critical',
  },
  {
    ruleId: 'banned-neon-2',
    pattern: '#00FFFF',
    description: 'Neon cyan — banned',
    severity: 'critical',
  },
  {
    ruleId: 'banned-purple-1',
    pattern: '#A855F7',
    description: 'Heavy purple — banned',
    severity: 'medium',
  },
];

export const REQUIRED_CANON: RequiredCanonRule[] = [
  {
    ruleId: 'canon-navy-accent',
    pattern: '#1B2B5C',
    description: 'Navy accent canonical color',
    appliesTo: 'all-ui',
  },
  {
    ruleId: 'canon-warm-offwhite',
    pattern: '#FBFAF7',
    description: 'Warm off-white surface',
    appliesTo: 'all-ui',
  },
  {
    ruleId: 'canon-card-white',
    pattern: '#FFFFFF',
    description: 'Card white',
    appliesTo: 'all-ui',
  },
  {
    ruleId: 'canon-ink-text',
    pattern: '#0A0C12',
    description: 'Ink near-black text',
    appliesTo: 'all-ui',
  },
];

export const WORKFLOW_CONTRACT: WorkflowContractRule[] = [
  {
    ruleId: 'wf-page-question',
    requiredKeyword: 'pageQuestion',
    description: 'Page exposes primary user question',
    appliesTo: 'all-pages',
  },
  {
    ruleId: 'wf-primary-agent',
    requiredKeyword: 'primaryAgent',
    description: 'Page declares anchor agent',
    appliesTo: 'all-pages',
  },
  {
    ruleId: 'wf-recommended-action',
    requiredKeyword: 'recommendedNextAction',
    description: 'Page surfaces recommended next action',
    appliesTo: 'all-pages',
  },
  {
    ruleId: 'wf-deterministic-caveat',
    requiredKeyword: 'deterministic',
    description:
      'Page makes deterministic vs live status explicit',
    appliesTo: 'all-pages',
  },
  {
    ruleId: 'wf-arch-private-plane',
    requiredKeyword: 'private-plane',
    description: 'Architecture page references private data plane',
    appliesTo: 'architecture',
  },
  {
    ruleId: 'wf-arch-request-flow',
    requiredKeyword: 'request',
    description: 'Architecture page describes request flow',
    appliesTo: 'architecture',
  },
  {
    ruleId: 'wf-prod-demo',
    requiredKeyword: 'demo',
    description: 'Production readiness asks "can we demo?"',
    appliesTo: 'admin',
  },
  {
    ruleId: 'wf-prod-pilot',
    requiredKeyword: 'pilot',
    description: 'Production readiness asks "can we pilot?"',
    appliesTo: 'admin',
  },
  {
    ruleId: 'wf-source-bafo',
    requiredKeyword: 'BAFO',
    description: 'Source commercial includes BAFO stage',
    appliesTo: 'source',
  },
  {
    ruleId: 'wf-source-readiness',
    requiredKeyword: 'readiness',
    description: 'Source commercial includes readiness stage',
    appliesTo: 'source',
  },
];

export const TARGET_PAGES: TargetPage[] = [
  {
    pageId: 'admin-home',
    routePath: '/platform/admin',
    filePath: 'src/app/(maestro)/platform/admin/page.tsx',
    primaryAgent: 'steward',
    requiredWorkflowSections: ['platform readiness', 'next actions'],
  },
  {
    pageId: 'admin-architecture',
    routePath: '/platform/admin/architecture',
    filePath: 'src/app/(maestro)/platform/admin/architecture/page.tsx',
    primaryAgent: 'atlas',
    requiredWorkflowSections: [
      'planes',
      'request flow',
      'private data plane',
      'azure',
      'gateway',
      'mission runtime',
      'built vs deferred',
      'next actions',
    ],
  },
  {
    pageId: 'admin-production-readiness',
    routePath: '/platform/admin/production-readiness',
    filePath:
      'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
    primaryAgent: 'steward',
    requiredWorkflowSections: [
      'can we demo',
      'can we pilot',
      'production blockers',
      'next actions',
    ],
  },
  {
    pageId: 'source-event-detail',
    routePath: '/source/events/[eventId]',
    filePath: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
    primaryAgent: 'nexus',
    requiredWorkflowSections: ['commercial intelligence', 'event canvas'],
  },
];

export function buildDesignWorkflowCanonReport(): DesignWorkflowCanonReport {
  return {
    generatedAt: '2026-04-26',
    bannedTokens: BANNED_TOKENS,
    requiredCanons: REQUIRED_CANON,
    workflowContracts: WORKFLOW_CONTRACT,
    targetPages: TARGET_PAGES,
    summary:
      'AbarVa design + workflow canon regression manifest. Tracks banned visual tokens, required canon colors, and workflow contract keywords across canonical UI surfaces.',
  };
}
