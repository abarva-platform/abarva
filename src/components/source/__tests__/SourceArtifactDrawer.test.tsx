/**
 * SRC-S4 · SourceArtifactDrawer — tier indicator snapshot tests.
 *
 * Verifies:
 *   - Renders with each tier: rich, outline, stub
 *   - TierIndicator data-testid and data-tier attributes are present
 *   - Provenance panel renders when provenance prop provided
 *   - No tier renders as stub fallback
 *   - No forbidden imports
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SourceArtifactDrawer } from '@/components/source/SourceArtifactDrawer';
import type { SourceArtifactDetail, SourceArtifactTier } from '@/lib/source/types';

const BASE_ARTIFACT: SourceArtifactDetail = {
  id: 'test-artifact-001',
  eventId: 'test-event',
  title: 'Test Artifact',
  kind: 'charter',
  status: 'draft',
  summary: 'A test artifact for tier indicator verification.',
  sourceCount: 2,
  updatedAt: '2026-04-28',
  sections: [
    { label: 'Section A', body: 'Body text for section A.' },
    { label: 'Section B', body: 'Body text for section B.' },
  ],
  governanceNotes: ['Note one.', 'Note two.'],
  patternLinks: [],
};

const PROVENANCE = {
  createdFrom: 'deterministic_seed',
  storeKey: 'source-artifact:test-event:test-artifact-001',
  freshness: '2026-04-28',
  evidenceLedgerEntryId: 'test-artifact-001',
};

// ---------------------------------------------------------------------------
// Tier variants
// ---------------------------------------------------------------------------

describe('SourceArtifactDrawer · tier indicator', () => {
  const TIERS: SourceArtifactTier[] = ['rich', 'outline', 'stub'];

  for (const tier of TIERS) {
    it(`renders tier="${tier}" with correct data-tier attribute`, () => {
      const html = renderToStaticMarkup(
        createElement(SourceArtifactDrawer, {
          artifact: { ...BASE_ARTIFACT, tier },
        }),
      );
      expect(html).toContain('data-testid="tier-indicator"');
      expect(html).toContain(`data-tier="${tier}"`);
      expect(html).toContain(tier.charAt(0).toUpperCase() + tier.slice(1));
    });
  }

  it('renders undefined tier as stub fallback', () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: undefined },
      }),
    );
    expect(html).toContain('data-tier="stub"');
  });
});

// ---------------------------------------------------------------------------
// Provenance panel
// ---------------------------------------------------------------------------

describe('SourceArtifactDrawer · provenance panel', () => {
  it('renders provenance panel when prop provided', () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: 'rich' },
        provenance: PROVENANCE,
      }),
    );
    expect(html).toContain('data-testid="provenance-panel"');
    expect(html).toContain('Visible provenance');
    expect(html).toContain('deterministic_seed');
    expect(html).toContain('Evidence ledger entry');
  });

  it('does not render provenance panel when prop omitted', () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, {
        artifact: { ...BASE_ARTIFACT, tier: 'outline' },
      }),
    );
    expect(html).not.toContain('data-testid="provenance-panel"');
    expect(html).not.toContain('Visible provenance');
  });
});

// ---------------------------------------------------------------------------
// Drawer shell
// ---------------------------------------------------------------------------

describe('SourceArtifactDrawer · shell', () => {
  it('renders sections from artifact', () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain('Section A');
    expect(html).toContain('Section B');
  });

  it('renders governance notes', () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain('Note one');
    expect(html).toContain('Note two');
  });

  it('renders deterministic disclaimer', () => {
    const html = renderToStaticMarkup(
      createElement(SourceArtifactDrawer, { artifact: BASE_ARTIFACT }),
    );
    expect(html).toContain('Deterministic seeded artifact shell only');
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('SourceArtifactDrawer · hygiene', () => {
  it('does not import from model/upload/workflow packages', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/source/SourceArtifactDrawer.tsx'), 'utf8');
    expect(src).not.toMatch(/from ['"][^'"]*(openai|anthropic|@ai-sdk)['"]/);
    expect(src).not.toMatch(/from ['"][^'"]*(upload|parser|approval-engine|workflow-engine)['"]/);
  });

  it('artifact route has updated Sentinel voice format', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx'),
      'utf8',
    );
    expect(src).toContain('Artifact tier:');
    expect(src).toContain('Provenance:');
    expect(src).toContain('Evidence chain:');
  });
});
