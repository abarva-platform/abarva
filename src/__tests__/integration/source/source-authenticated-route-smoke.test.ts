import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import SourceDashboardPage from '@/app/(maestro)/source/page';
import SourceEventDetailPage from '@/app/(maestro)/source/events/[eventId]/page';
import { SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source';

const sourceRouteFiles = [
  'src/app/(maestro)/source/page.tsx',
  'src/app/(maestro)/source/events/[eventId]/page.tsx',
];

function readWorkspaceFile(filePath: string) {
  return readFileSync(join(process.cwd(), filePath), 'utf8');
}

describe('Source authenticated route smoke', () => {
  it('keeps Source routes behind the authenticated route matcher', () => {
    const proxySource = readWorkspaceFile('src/proxy.ts');

    expect(proxySource).toContain("'/source(.*)'");
    expect(proxySource).toContain('authRequiredRoutes(request)');
    expect(proxySource).toContain('createSignInRedirect(request)');
    expect(proxySource).toContain("'/api/auth/demo-code-sign-in(.*)'");
    expect(proxySource).toContain('PUBLIC_ROUTE_PATTERNS');
  });

  it('keeps the dashboard and event canvas route files present', () => {
    for (const filePath of sourceRouteFiles) {
      expect(existsSync(join(process.cwd(), filePath))).toBe(true);
    }
  });

  it('keeps the Source dashboard route wired to deterministic seed-only content', () => {
    const routeSource = readWorkspaceFile('src/app/(maestro)/source/page.tsx');
    const componentSource = readWorkspaceFile('src/components/source/SourceIndexPage.tsx');

    expect(routeSource).toContain('SourceIndexPage');
    expect(componentSource).toContain('AMS Vendor Consolidation 2026');
    expect(componentSource).toContain('SOURCE_INDEX_VIEW');
    expect(componentSource).not.toMatch(/fetch\(|openai|claude|anthropic/i);
  });

  it('renders the authenticated Source event route with deterministic shell content', async () => {
    const page = await SourceEventDetailPage({
      params: Promise.resolve({ eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('Data &amp; AI Modernization SI Selection');
    expect(html).toContain('Journey map');
    expect(html).toContain('Scope stage workspace');
    expect(html).toContain('Data readiness');
  });

  it('documents the current auth test boundary without weakening auth', () => {
    const sources = [
      'src/proxy.ts',
      ...sourceRouteFiles,
      'src/components/source/NexusEngagementCanvas.tsx',
      'src/components/source/SourceDataReadinessPanel.tsx',
    ].map(readWorkspaceFile).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(ProgramSurface|programs\/mock|preview|demo)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createScorecardUi|openArtifactDrawer)\b/);
    expect(sources).not.toMatch(/\bauth\.protect\s*=\s*undefined\b/);
    expect(sources).not.toMatch(/\bclerkMiddleware\s*=\s*undefined\b/);
  });
});
