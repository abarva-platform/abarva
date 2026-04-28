/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => function MockLink({ href, children, ...r }: { href: string; children: React.ReactNode; [k: string]: unknown }) {
  return React.createElement('a', { href, ...r }, children);
});
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: () => { throw new Error('NOT_FOUND'); },
}));

import {
  getPublicContradictions,
  getPublicContradictionById,
  getStatusLabel,
  getStatusColor,
  getConfidenceDelta,
} from '@/lib/public-site/public-corpus';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

// ─── pure function tests ─────────────────────────────────────────────────────

describe('getPublicContradictions', () => {
  it('returns exactly 5 items', () => {
    expect(getPublicContradictions()).toHaveLength(5);
  });

  it('all 5 have IDs in the public set', () => {
    const publicIds = new Set(['CON-001', 'CON-002', 'CON-004', 'CON-005', 'CON-008']);
    for (const c of getPublicContradictions()) {
      expect(publicIds.has(c.id)).toBe(true);
    }
  });
});

describe('getPublicContradictionById', () => {
  it('returns CON-001 data for id CON-001', () => {
    const c = getPublicContradictionById('CON-001');
    expect(c).toBeDefined();
    expect(c!.id).toBe('CON-001');
  });

  it('returns undefined for a non-public id', () => {
    expect(getPublicContradictionById('CON-999')).toBeUndefined();
  });
});

describe('getStatusLabel', () => {
  it('returns "Open" for open', () => {
    expect(getStatusLabel('open')).toBe('Open');
  });

  it('returns "Resolved → B" for resolved-toward-B', () => {
    expect(getStatusLabel('resolved-toward-B')).toBe('Resolved → B');
  });

  it('returns "Accepted as tension" for accepted-as-tension', () => {
    expect(getStatusLabel('accepted-as-tension')).toBe('Accepted as tension');
  });
});

describe('getStatusColor', () => {
  it('returns amber color for open', () => {
    expect(getStatusColor('open')).toBe('#ba7517');
  });

  it('returns green color for resolved-toward-B', () => {
    expect(getStatusColor('resolved-toward-B')).toBe('#1d7a4a');
  });
});

describe('getConfidenceDelta', () => {
  it('returns "+23%" for (0.72, 0.95)', () => {
    expect(getConfidenceDelta(0.72, 0.95)).toBe('+23%');
  });

  it('returns "-22%" for (0.9, 0.68)', () => {
    expect(getConfidenceDelta(0.9, 0.68)).toBe('-22%');
  });
});

// ─── component rendering tests ───────────────────────────────────────────────

import { ContradictionRow } from '@/components/public-site/ContradictionRow';
import { ContradictionsScoreboard } from '@/components/public-site/ContradictionsScoreboard';

const sampleContradiction = getPublicContradictions()[0];

describe('ContradictionRow', () => {
  it('renders the contradiction title', () => {
    render(React.createElement(ContradictionRow, { contradiction: sampleContradiction, index: 0 }));
    expect(screen.getByText(sampleContradiction.title)).toBeTruthy();
  });

  it('renders a status badge', () => {
    render(React.createElement(ContradictionRow, { contradiction: sampleContradiction, index: 0 }));
    const label = getStatusLabel(sampleContradiction.status);
    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe('ContradictionsScoreboard', () => {
  it('renders the heading "Vendor claim vs. measured reality"', () => {
    render(React.createElement(ContradictionsScoreboard));
    expect(screen.getByText('Vendor claim vs. measured reality')).toBeTruthy();
  });

  it('renders 5 contradiction rows', () => {
    render(React.createElement(ContradictionsScoreboard));
    // Each row has an aria-label "View contradiction: <title>"
    const rows = screen.getAllByRole('link', { name: /View contradiction:/i });
    expect(rows).toHaveLength(5);
  });
});

// ─── page-level heading test ──────────────────────────────────────────────────

import ContradictionsPage from '@/app/(public)/contradictions/page';

describe('Contradictions list page', () => {
  it('renders "Contradictions we publish" heading', () => {
    render(React.createElement(ContradictionsPage));
    expect(screen.getByRole('heading', { name: /Contradictions we publish/i })).toBeTruthy();
  });
});

// ─── CANONICAL_URLS test ──────────────────────────────────────────────────────

describe('CANONICAL_URLS', () => {
  it('contradiction("CON-001") includes CON-001', () => {
    expect(CANONICAL_URLS.contradiction('CON-001')).toContain('CON-001');
  });
});
