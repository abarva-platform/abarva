export type LegacyShellAuditCategory =
  | 'legacy_shell_component'
  | 'legacy_toolbar_pattern'
  | 'legacy_nav_pattern'
  | 'legacy_color_pattern'
  | 'legacy_route_binding';

export type LegacyShellAuditRisk = 'low' | 'medium' | 'high';

export interface LegacyShellAuditEntry {
  id: string;
  category: LegacyShellAuditCategory;
  filePath: string;
  routePattern?: string;
  finding: string;
  bannedPatternMatches: string[];
  canonicalReplacementCandidate: string;
  recommendedSafeChange: string;
  riskLevel: LegacyShellAuditRisk;
}

export interface LegacyShellNavAuditReport {
  generatedAt: string;
  deterministic: true;
  bannedDesignPatterns: string[];
  targetCategories: LegacyShellAuditCategory[];
  entries: LegacyShellAuditEntry[];
}

const BANNED_DESIGN_PATTERNS: string[] = [
  'dark-toolbar-dominant',
  'teal-heavy-accent',
  'purple-heavy-accent',
  'neon-cyber-gradient',
  'emoji-first-nav-icons',
];

const LEGACY_AUDIT_ENTRIES: LegacyShellAuditEntry[] = [
  {
    id: 'legacy-admin-rail-shell',
    category: 'legacy_shell_component',
    filePath: 'src/app/(maestro)/platform/admin/page.tsx',
    routePattern: '/platform/admin',
    finding:
      'Admin landing route still mounts the legacy rail shell and inline visual tokens instead of the canonical Admin shell.',
    bannedPatternMatches: ['dark-toolbar-dominant', 'emoji-first-nav-icons'],
    canonicalReplacementCandidate: '@/components/admin/AdminCanonShell',
    recommendedSafeChange:
      'Wrap existing content with AdminCanonShell while preserving auth/guards and section logic.',
    riskLevel: 'high',
  },
  {
    id: 'legacy-admin-rail-component',
    category: 'legacy_nav_pattern',
    filePath: 'src/components/admin/StewardAdminRail.tsx',
    routePattern: '/platform/admin',
    finding:
      'Legacy rail navigation is still rendered in the live admin route and visually competes with canon workflow navigation.',
    bannedPatternMatches: ['emoji-first-nav-icons'],
    canonicalReplacementCandidate: '@/components/admin/AdminRouteChrome',
    recommendedSafeChange:
      'Deprecate StewardAdminRail from active admin routes and use canon route chrome metadata orientation.',
    riskLevel: 'high',
  },
  {
    id: 'legacy-program-toolbar-css',
    category: 'legacy_toolbar_pattern',
    filePath: 'src/app/programs/programs.css',
    finding:
      'Legacy programs toolbar styles remain in repository and may reappear if old routes are mounted.',
    bannedPatternMatches: ['dark-toolbar-dominant'],
    canonicalReplacementCandidate: '@/components/programs/ProgramCanonShell',
    recommendedSafeChange:
      'Keep file for compatibility, but avoid importing toolbar classes from canonical tenant program routes.',
    riskLevel: 'medium',
  },
  {
    id: 'legacy-program-detail-route',
    category: 'legacy_route_binding',
    filePath: 'src/app/programs/[programId]/page.tsx',
    routePattern: '/programs/[programId]',
    finding:
      'Legacy non-tenant route still binds to LegacyProgramDetailPage and can bypass newer tenant program shell standards.',
    bannedPatternMatches: ['dark-toolbar-dominant'],
    canonicalReplacementCandidate: '@/components/programs/ProgramCanonicalDetail',
    recommendedSafeChange:
      'Document this route as legacy and keep tenant-scoped program routes as the canonical path.',
    riskLevel: 'medium',
  },
  {
    id: 'legacy-home-wordmark-import',
    category: 'legacy_nav_pattern',
    filePath: 'src/components/home/AgenticHomeEntry.tsx',
    routePattern: '/',
    finding:
      'Home entry imports AbarvaWordmark from AbarVaTopNav path alias, which obscures direct canonical wordmark ownership.',
    bannedPatternMatches: [],
    canonicalReplacementCandidate: '@/components/abarva/AbarVaWordmark',
    recommendedSafeChange:
      'Prefer direct canonical wordmark import to reduce accidental coupling to legacy nav wrapper.',
    riskLevel: 'low',
  },
  {
    id: 'legacy-intelligence-toolbar-css',
    category: 'legacy_toolbar_pattern',
    filePath: 'src/app/intelligence/intelligence.css',
    routePattern: '/intelligence',
    finding:
      'Legacy toolbar class remains defined and can leak non-canon styling if reused on active routes.',
    bannedPatternMatches: ['dark-toolbar-dominant'],
    canonicalReplacementCandidate: '@/components/abarva/AbarVaShellNav',
    recommendedSafeChange:
      'Avoid reusing intel-toolbar class in new route shells and enforce canon shell wrappers for surface routes.',
    riskLevel: 'low',
  },
];

export function buildLegacyShellNavAuditReport(): LegacyShellNavAuditReport {
  return {
    generatedAt: 'deterministic-static-audit-v1',
    deterministic: true,
    bannedDesignPatterns: [...BANNED_DESIGN_PATTERNS],
    targetCategories: [
      'legacy_shell_component',
      'legacy_toolbar_pattern',
      'legacy_nav_pattern',
      'legacy_color_pattern',
      'legacy_route_binding',
    ],
    entries: LEGACY_AUDIT_ENTRIES.map((entry) => ({
      ...entry,
      bannedPatternMatches: [...entry.bannedPatternMatches],
    })),
  };
}

