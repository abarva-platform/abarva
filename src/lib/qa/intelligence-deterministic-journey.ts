export type IntelligenceJourneyCheckpointKind =
  | 'route'
  | 'canvas_mode'
  | 'detail_depth'
  | 'determinism_guard';

export interface IntelligenceJourneyCheckpoint {
  id: string;
  kind: IntelligenceJourneyCheckpointKind;
  label: string;
  route?: string;
  evidence: readonly string[];
  deterministicSeedOnly: true;
}

export interface IntelligenceDeterministicJourneyManifest {
  id: 'qa33-intelligence-deterministic-journey';
  tenantSlug: 'apex-retail';
  agent: 'Sentinel';
  landingRoute: '/tenant/apex-retail/intelligence';
  patternDetailRoute: '/tenant/apex-retail/intelligence/patterns/[patternKey]';
  canvasModes: readonly ['summary', 'evidence', 'programs', 'actions'];
  detailDepth: readonly [
    'provenance_ribbon',
    'source_basis_panel',
    'evidence_dataset_drawer',
    'interaction_rail',
  ];
  checkpoints: readonly IntelligenceJourneyCheckpoint[];
  smokeStatus: 'manifest_only_pre_browser_smoke';
  caveats: readonly string[];
  createdFrom: 'deterministic_seed_manifest';
}

const CANVAS_MODES = ['summary', 'evidence', 'programs', 'actions'] as const;
const DETAIL_DEPTH = [
  'provenance_ribbon',
  'source_basis_panel',
  'evidence_dataset_drawer',
  'interaction_rail',
] as const;

export function buildIntelligenceDeterministicJourneyManifest(): IntelligenceDeterministicJourneyManifest {
  return {
    id: 'qa33-intelligence-deterministic-journey',
    tenantSlug: 'apex-retail',
    agent: 'Sentinel',
    landingRoute: '/tenant/apex-retail/intelligence',
    patternDetailRoute: '/tenant/apex-retail/intelligence/patterns/[patternKey]',
    canvasModes: CANVAS_MODES,
    detailDepth: DETAIL_DEPTH,
    checkpoints: [
      {
        id: 'qa33-route-landing',
        kind: 'route',
        label: 'Tenant Intelligence landing route is canonical',
        route: '/tenant/apex-retail/intelligence',
        evidence: [
          'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
          'IntelligenceRouteShell',
          'IntelligenceLensTabs',
        ],
        deterministicSeedOnly: true,
      },
      {
        id: 'qa33-route-pattern-detail',
        kind: 'route',
        label: 'Pattern detail route is canonical and Sentinel-owned',
        route: '/tenant/apex-retail/intelligence/patterns/[patternKey]',
        evidence: [
          'src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx',
          'SentinelPatternDetail',
          'IntelligenceCanvasModeTabs',
        ],
        deterministicSeedOnly: true,
      },
      ...CANVAS_MODES.map((mode) => ({
        id: `qa33-canvas-${mode}`,
        kind: 'canvas_mode' as const,
        label: `Canvas mode covered: ${mode}`,
        evidence: [
          'src/lib/intelligence/intelligence-canvas-modes.ts',
          `canvas=${mode}`,
        ],
        deterministicSeedOnly: true as const,
      })),
      ...DETAIL_DEPTH.map((depth) => ({
        id: `qa33-depth-${depth}`,
        kind: 'detail_depth' as const,
        label: `Pattern detail depth covered: ${depth.replace(/_/g, ' ')}`,
        evidence: ['src/components/intelligence/SentinelPatternDetail.tsx', depth],
        deterministicSeedOnly: true as const,
      })),
      {
        id: 'qa33-no-live-runtime',
        kind: 'determinism_guard',
        label: 'Journey manifest is not browser smoke and does not claim live Sentinel runtime',
        evidence: [
          'no HTTP/browser automation',
          'no live retrieval',
          'no model invocation',
          'no migrations',
        ],
        deterministicSeedOnly: true,
      },
    ],
    smokeStatus: 'manifest_only_pre_browser_smoke',
    caveats: [
      'This manifest records deterministic route and component coverage only.',
      'It is not a Playwright smoke test and does not authenticate or navigate a browser.',
      'It does not claim live Sentinel runtime, live retrieval, model invocation, migrations, or API execution.',
    ],
    createdFrom: 'deterministic_seed_manifest',
  };
}
