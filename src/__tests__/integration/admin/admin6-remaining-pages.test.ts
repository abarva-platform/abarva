import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildOverviewPageView } from '@/lib/admin/overview-page-view';
import { buildDataTrustPageView } from '@/lib/admin/data-trust-page-view';
import { buildConnectorsPageView } from '@/lib/admin/connectors-page-view';
import { buildUsersAccessPageView } from '@/lib/admin/users-access-page-view';
import { buildAgentReadinessPageView } from '@/lib/admin/agent-readiness-page-view';
import { buildBuildProgressPageView } from '@/lib/admin/build-progress-page-view';

interface BasePageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: string;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: string;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
}

const builders: ReadonlyArray<readonly [string, () => BasePageView]> = [
  ['Overview', buildOverviewPageView],
  ['Data Trust', buildDataTrustPageView],
  ['Connectors', buildConnectorsPageView],
  ['Users & Access', buildUsersAccessPageView],
  ['Agent Readiness', buildAgentReadinessPageView],
  ['Build Progress', buildBuildProgressPageView],
];

describe('ADMIN6 — Remaining sub-pages', () => {
  describe.each(builders)('%s page view', (label, builder) => {
    const view = builder();

    it('returns deterministicSeed: true', () => {
      expect(view.deterministicSeed).toBe(true);
    });
    it('has non-empty eyebrow', () => {
      expect(view.eyebrow.length).toBeGreaterThan(0);
    });
    it('has non-empty title', () => {
      expect(view.title.length).toBeGreaterThan(0);
    });
    it('has non-empty subtitle', () => {
      expect(view.subtitle.length).toBeGreaterThan(0);
    });
    it('context has all 5 cells defined', () => {
      expect(view.context.tenant).toBeTruthy();
      expect(view.context.mode).toBeTruthy();
      expect(view.context.agent).toBeTruthy();
      expect(view.context.data).toBeTruthy();
      expect(view.context.liveStatus).toBeTruthy();
    });
    it('context.liveStatusKind is one of canonical values', () => {
      expect(['live', 'partial', 'deferred']).toContain(view.context.liveStatusKind);
    });
    it('editorial title is present', () => {
      expect(view.editorial.title).toBeTruthy();
    });
    it('editorial body is present', () => {
      expect(view.editorial.body).toBeTruthy();
    });
    it('editorial contextUsed is non-empty', () => {
      expect(view.editorial.contextUsed.length).toBeGreaterThan(0);
    });
    it('editorial evidenceStrength is canonical', () => {
      expect(['strong', 'partial', 'thin']).toContain(view.editorial.evidenceStrength);
    });
    it('editorial primary action has label + href', () => {
      expect(view.editorial.primaryAction.label).toBeTruthy();
      expect(view.editorial.primaryAction.href).toBeTruthy();
    });
    it('does not promote production_ready', () => {
      const s = JSON.stringify(view).toLowerCase();
      expect(s).not.toContain('production_ready');
    });
    it('primary agent is one of the canonical 4', () => {
      expect(['Steward', 'Nexus', 'Sentinel', 'Atlas']).toContain(view.primaryAgentLabel);
    });
    it('primaryActionLabel is non-empty', () => {
      expect(view.primaryActionLabel.length).toBeGreaterThan(0);
    });
    it('primaryActionHref is non-empty', () => {
      expect(view.primaryActionHref.length).toBeGreaterThan(0);
    });
    it('contains no banned tokens in the JSON snapshot', () => {
      const s = JSON.stringify(view).toLowerCase();
      expect(s).not.toContain('#14b8a6');
      expect(s).not.toContain('#7c3aed');
      expect(s).not.toContain('#d946ef');
      expect(s).not.toContain('sparkle');
    });
    // sanity that label was used (silences unused warning)
    it('label is non-empty', () => {
      expect(label.length).toBeGreaterThan(0);
    });
  });

  // page route file existence + canonical imports
  const pages = [
    {
      label: 'Overview',
      candidates: [
        'src/app/(maestro)/admin/page.tsx',
        'src/app/(maestro)/platform/admin/page.tsx',
      ],
    },
    {
      label: 'Data Trust',
      candidates: [
        'src/app/(maestro)/admin/data-trust/page.tsx',
        'src/app/(maestro)/platform/admin/data-trust/page.tsx',
      ],
    },
    {
      label: 'Connectors',
      candidates: [
        'src/app/(maestro)/admin/connectors/page.tsx',
        'src/app/(maestro)/platform/admin/connectors/page.tsx',
      ],
    },
    {
      label: 'Users & Access',
      candidates: [
        'src/app/(maestro)/admin/users-access/page.tsx',
        'src/app/(maestro)/platform/admin/users-access/page.tsx',
      ],
    },
    {
      label: 'Agent Readiness',
      candidates: [
        'src/app/(maestro)/admin/agent-readiness/page.tsx',
        'src/app/(maestro)/platform/admin/agent-readiness/page.tsx',
      ],
    },
    {
      label: 'Build Progress',
      candidates: [
        'src/app/(maestro)/admin/build-progress/page.tsx',
        'src/app/(maestro)/platform/admin/build-progress/page.tsx',
      ],
    },
  ];

  describe('Page route files', () => {
    const root = process.cwd();

    pages.forEach(({ label, candidates }) => {
      describe(label, () => {
        const found = candidates.find((p) => existsSync(resolve(root, p)));

        it('exists at one of the canonical paths', () => {
          expect(found).toBeDefined();
        });

        if (found) {
          const src = readFileSync(resolve(root, found), 'utf8');

          // We only enforce canonical-shell imports on the new /admin/... routes.
          // The pre-existing /platform/admin/... routes are owned by other lanes.
          const isNewCanonRoute = found.startsWith('src/app/(maestro)/admin/');

          if (isNewCanonRoute) {
            it('imports AdminCanonShellV2', () => {
              expect(src).toContain('AdminCanonShellV2');
            });
            it('imports EditorialCanvas', () => {
              expect(src).toContain('EditorialCanvas');
            });
            it('imports AgentRail', () => {
              expect(src).toContain('AgentRail');
            });
            it('imports ContextBar', () => {
              expect(src).toContain('ContextBar');
            });
            it('imports StewardEditorial', () => {
              expect(src).toContain('StewardEditorial');
            });
            it('contains no banned tokens', () => {
              const s = src.toLowerCase();
              expect(s).not.toContain('#14b8a6');
              expect(s).not.toContain('#7c3aed');
              expect(s).not.toContain('#d946ef');
              expect(s).not.toContain('sparkle');
            });
            it('does not contain <input> or <textarea>', () => {
              expect(src).not.toMatch(/<input\b/);
              expect(src).not.toMatch(/<textarea\b/);
            });
          }
        }
      });
    });
  });
});
