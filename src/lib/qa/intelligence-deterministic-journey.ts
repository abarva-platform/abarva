export type IntelligenceJourneyCheckpointKind =
  | 'route'
  | 'canvas_mode'
  | 'detail_depth'
  | 'determinism_guard';

/**
 * Whether the thing this checkpoint covers still exists.
 *
 * The July sunset removed the tenant-scoped Intelligence journey: its landing
 * route moved, its pattern-detail route went away entirely, and
 * `src/components/intelligence/` no longer exists. Nine of the eleven
 * checkpoints here covered surfaces that are gone.
 *
 * Deleting them would have shrunk a coverage claim silently, which is how a
 * manifest ends up describing a product nobody ships. Marking them keeps the
 * shrinkage on the page.
 */
export type IntelligenceJourneySubjectState = 'present' | 'removed';

export interface IntelligenceJourneyCheckpoint {
  id: string;
  kind: IntelligenceJourneyCheckpointKind;
  label: string;
  route?: string;
  evidence: readonly string[];
  subjectState: IntelligenceJourneySubjectState;
  /** Required when the subject is removed; says what went and when. */
  removedNote?: string;
  deterministicSeedOnly: true;
}

/**
 * An evidence entry that names a file in this repository, as opposed to a
 * marker token like `canvas=summary` or `no live retrieval`.
 *
 * Only these are resolvable, and only these were ever a claim that could be
 * false. Demanding that a marker resolve would be a gate nothing could pass.
 */
export function isRepoPathEvidence(entry: string): boolean {
  return /^src\/.+\.(?:ts|tsx|js|jsx|json|css)$/.test(entry.trim());
}

export type JourneyEvidenceDefect = {
  checkpointId: string;
  entry: string;
  reason: 'path_does_not_resolve' | 'removed_subject_cites_a_live_path';
};

/**
 * Resolve every path-shaped evidence entry.
 *
 * A QA claim whose evidence path is never resolved is a claim about nothing —
 * this manifest's own suite passed through the deletion of three of the four
 * files it cited, because it only ever asserted the manifest's shape.
 *
 * `exists` is injected so the rule itself can be exercised in both directions
 * without staging files on disk. The suite also runs it against the real
 * filesystem, because a resolver that only ever sees a stub predicate proves
 * nothing about the repository.
 */
export function describeJourneyEvidenceDefects(
  manifest: IntelligenceDeterministicJourneyManifest,
  exists: (repoPath: string) => boolean,
): JourneyEvidenceDefect[] {
  const defects: JourneyEvidenceDefect[] = [];
  for (const checkpoint of manifest.checkpoints) {
    for (const entry of checkpoint.evidence) {
      if (!isRepoPathEvidence(entry)) continue;
      if (checkpoint.subjectState === 'removed') {
        // A checkpoint whose subject is gone must not cite a live file. That
        // is how a retired claim quietly starts looking supported again.
        defects.push({
          checkpointId: checkpoint.id,
          entry,
          reason: 'removed_subject_cites_a_live_path',
        });
        continue;
      }
      if (!exists(entry)) {
        defects.push({
          checkpointId: checkpoint.id,
          entry,
          reason: 'path_does_not_resolve',
        });
      }
    }
  }
  return defects;
}

export interface IntelligenceDeterministicJourneyManifest {
  id: 'qa33-intelligence-deterministic-journey';
  tenantSlug: 'apex-retail';
  agent: 'Sentinel';
  landingRoute: '/intelligence';
  /**
   * Null because there is no Intelligence pattern-detail route. Typing it as
   * a string literal is what let this manifest keep naming one for two
   * months after the route was deleted.
   */
  patternDetailRoute: null;
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
    landingRoute: '/intelligence',
    patternDetailRoute: null,
    canvasModes: CANVAS_MODES,
    detailDepth: DETAIL_DEPTH,
    checkpoints: [
      {
        id: 'qa33-route-landing',
        kind: 'route',
        label: 'Intelligence landing route is canonical',
        // The tenant segment is gone; the surviving route is unscoped and
        // renders the advisory page.
        route: '/intelligence',
        evidence: [
          'src/app/(maestro)/intelligence/page.tsx',
          'src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx',
        ],
        subjectState: 'present',
        deterministicSeedOnly: true,
      },
      {
        id: 'qa33-route-pattern-detail',
        kind: 'route',
        label: 'Pattern detail route is canonical and Sentinel-owned',
        evidence: ['SentinelPatternDetail', 'IntelligenceCanvasModeTabs'],
        subjectState: 'removed',
        removedNote:
          'No Intelligence pattern-detail route exists. The July sunset removed it along with '
          + 'both components; nothing in src/app serves a pattern detail under Intelligence.',
        deterministicSeedOnly: true,
      },
      // `intelligence-canvas-modes.ts` still exists, but the canvas it
      // described is not rendered anywhere, so covering a mode is covering a
      // module rather than a journey. Keeping the file path here would let a
      // resolvable path stand in for a surface nobody can reach.
      ...CANVAS_MODES.map((mode) => ({
        id: `qa33-canvas-${mode}`,
        kind: 'canvas_mode' as const,
        label: `Canvas mode covered: ${mode}`,
        evidence: [`canvas=${mode}`],
        subjectState: 'removed' as const,
        removedNote:
          'The canvas-mode tabs surface was removed with the pattern-detail route. The mode '
          + 'module remains, but no route renders it.',
        deterministicSeedOnly: true as const,
      })),
      ...DETAIL_DEPTH.map((depth) => ({
        id: `qa33-depth-${depth}`,
        kind: 'detail_depth' as const,
        label: `Pattern detail depth covered: ${depth.replace(/_/g, ' ')}`,
        evidence: [depth],
        subjectState: 'removed' as const,
        removedNote:
          'src/components/intelligence/ no longer exists, so there is no detail surface with '
          + 'depth to cover.',
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
        subjectState: 'present',
        deterministicSeedOnly: true,
      },
    ],
    smokeStatus: 'manifest_only_pre_browser_smoke',
    caveats: [
      'This manifest records deterministic route and component coverage only.',
      'It is not a Playwright smoke test and does not authenticate or navigate a browser.',
      'It does not claim live Sentinel runtime, live retrieval, model invocation, migrations, or API execution.',
      'Nine of its eleven checkpoints cover surfaces the July sunset removed and are marked '
        + 'subjectState "removed". They are kept so the loss is visible; they are not coverage.',
    ],
    createdFrom: 'deterministic_seed_manifest',
  };
}
