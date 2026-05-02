import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import SourceEventsPage from '@/app/(maestro)/source/events/page';
import SourceEventDetailPage from '@/app/(maestro)/source/events/[eventId]/page';
import SourceEventScorecardPage from '@/app/(maestro)/source/events/[eventId]/scorecard/page';
import SourceArtifactPage from '@/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page';
import SourceValuePage from '@/app/(maestro)/source/value/page';
import { getSourcingEvent, getSourcingEventArtifact } from '@/lib/source/queries';
import { SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source/constants';

jest.mock('next/navigation', () => ({
  usePathname: () => '/source/events/evt-source-data-ai-si-selection',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      primaryEmailAddress: { emailAddress: 'maya.desai@apex-retail.example.com' },
      publicMetadata: { moduleAccess: ['setup', 'programs', 'source', 'intelligence', 'tower'] },
      firstName: 'Maya',
      lastName: 'Desai',
    },
  }),
  useClerk: () => ({ signOut: jest.fn() }),
}));

describe('Source context-used and action-enforcement slices', () => {
  it('renders /source/events with context and three-choice + custom behavior', async () => {
    const html = renderToStaticMarkup(
      await SourceEventsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain('Context used');
    expect(html).toContain('Review BAFO events');
    expect(html).toContain('Review evaluation queue');
    expect(html).toContain('Review at-risk events');
    expect(html).toContain('Ask Nexus (deferred)');
    expect(html).toContain('Submit (disabled until runtime)');
  });

  it('renders event detail with deterministic context chips and 3 contextual choices', async () => {
    const html = renderToStaticMarkup(
      await SourceEventDetailPage({
        params: Promise.resolve({ eventId: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026 }),
      }),
    );

    expect(html).toContain('Context used');
    expect(html).toContain('Agent suggested stage actions');
    expect(html).toContain('Define done');
    expect(html).toContain('Attach evidence');
    expect(html).toContain('Generate packet');
    expect(html).toContain('Open gate path');
  });

  it('renders scorecard with required context and action shell', async () => {
    const html = renderToStaticMarkup(
      await SourceEventScorecardPage({
        params: Promise.resolve({ eventId: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026 }),
      }),
    );

    expect(html).toContain('Evaluation governance criteria');
    expect(html).toContain('Context used');
    expect(html).toContain('Review blockers');
    expect(html).toContain('Show evidence gaps');
    expect(html).toContain('Explain gate impact');
    expect(html).toContain('Ask custom');
  });

  it('renders artifact detail with context used and explicit artifact actions', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event).toBeDefined();
    const artifactId = 'artifact-source-001-brief';
    if (!event || !artifactId) return;

    const artifact = await getSourcingEventArtifact(event.id, artifactId);
    expect(artifact).toBeDefined();
    if (!artifact) return;

    const html = renderToStaticMarkup(
      await SourceArtifactPage({
        params: Promise.resolve({ eventId: event.id, artifactId }),
      }),
    );

    expect(html).toContain('Context used');
    expect(html).toContain('Show evidence');
    expect(html).toContain('Show version history');
    expect(html).toContain('Explain missing inputs');
    expect(html).toContain('Ask custom');
    expect(html).toContain('Submit (disabled until runtime)');
  });

  it('renders value ledger route with context and action layer', async () => {
    const html = renderToStaticMarkup(await SourceValuePage());

    expect(html).toContain('Source value ledger');
    expect(html).toContain('Context used');
    expect(html).toContain('Atlas value ledger lead');
    expect(html).toContain('Action layer');
    expect(html).toContain('Show assumptions');
    expect(html).toContain('Ask Atlas about this value ledger');
    expect(html).toContain('Submit (disabled until runtime)');
  });

  it('does not introduce model/chat/upload/workflow/approval runtime in the key source enforcement files', () => {
    const files = [
      'src/app/(maestro)/source/events/page.tsx',
      'src/app/(maestro)/source/events/[eventId]/page.tsx',
      'src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx',
      'src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx',
      'src/app/(maestro)/source/value/page.tsx',
      'src/components/source/SentinelAgentColumn.tsx',
      'src/components/source/SourceWorkingPane.tsx',
      'src/components/source/SourceArtifactDrawer.tsx',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(files).not.toMatch(/\\b(from\\s+['\"][^'\"]*(openai|claude|anthropic|ai-sdk|ai\\b)[^'\"]*['\"])\\b/gi);
    expect(files).not.toMatch(/\\b(apiClient|parseUploadedFile|parseDocument|parseFile|uploadFile|uploadArtifact|uploadDocument)\\b/g);
    expect(files).not.toMatch(/\\b(workflow\\s*engine|workflowEngine|approval\\s*engine|approvalEngine|runWorkflow\\b|runApproval\\b|approvalEngine\\b)/gi);
  });
});
