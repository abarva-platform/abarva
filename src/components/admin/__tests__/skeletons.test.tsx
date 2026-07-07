/**
 * Skeletons · Wave 3 PR-7 unit tests.
 *
 * Per the founder principle in `SETUP_AUDIT_2026-05-30_VERDICT.md`
 * §5.6 Loading state:
 *
 *   "No spinners. No full-page spinner anywhere — that's a founder
 *    principle and it should be visible here."
 *
 * These tests pin the design contract:
 *   - Skeletons render synchronously (no async work, no images).
 *   - Placeholder text is mono `···` only — no animated dots, no
 *     `loading.gif`, no SVG spinners.
 *   - DOM shape matches the resolved zone where possible so the page
 *     doesn't shift when content streams in.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import {
  ActionQueueSkeleton,
  AuditRibbonSkeleton,
  PostureGridSkeleton,
  StewardOrientationSkeleton,
  TrustStripSkeleton,
} from '../skeletons';

describe('admin/skeletons', () => {
  // ── No-spinner principle ──────────────────────────────────────
  // Founder principle: any pattern matching a spinner / loader /
  // animation is a defect on this surface.

  const spinnerNeedles = [
    /spinner/i,
    /<svg/i, // SVG spinners
    /animation\s*:/i, // CSS animations
    /@keyframes/i,
    /loading\.gif/i,
    /role="progressbar"/i,
  ];

  function assertNoSpinner(html: string) {
    for (const needle of spinnerNeedles) {
      expect(html).not.toMatch(needle);
    }
  }

  // ── TrustStripSkeleton ────────────────────────────────────────

  describe('TrustStripSkeleton', () => {
    it('renders four chips with blank dots and `···` placeholder text', () => {
      const html = renderToStaticMarkup(<TrustStripSkeleton />);
      expect(html).toContain('data-testid="admin-trust-strip-skeleton"');
      // Four noun labels
      expect(html).toContain('Substrate');
      expect(html).toContain('Isolation');
      expect(html).toContain('Integrations');
      expect(html).toContain('Governance');
      // Placeholder ellipsis appears once per chip — at minimum four.
      const placeholderCount = (html.match(/···/g) ?? []).length;
      expect(placeholderCount).toBeGreaterThanOrEqual(4);
    });

    it('has no spinner-like markup', () => {
      assertNoSpinner(renderToStaticMarkup(<TrustStripSkeleton />));
    });

    it('uses the locked muted palette for skeleton chrome (no teal/amber/red status colors)', () => {
      const html = renderToStaticMarkup(<TrustStripSkeleton />);
      // Status colors must not leak into the skeleton — chips have no
      // live state yet.
      expect(html).not.toContain('#0E8A65'); // teal
      expect(html).not.toContain('#92400E'); // amber
      expect(html).not.toContain('#991B1B'); // red
    });

    it('declares its role for accessibility', () => {
      const html = renderToStaticMarkup(<TrustStripSkeleton />);
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label="Loading trust posture"');
    });
  });

  // ── ActionQueueSkeleton ───────────────────────────────────────

  describe('ActionQueueSkeleton', () => {
    it('renders three ghost rows', () => {
      const html = renderToStaticMarkup(<ActionQueueSkeleton />);
      expect(html).toContain('data-testid="admin-action-queue-skeleton"');
      // Row indices 01, 02, 03
      expect(html).toContain('>01<');
      expect(html).toContain('>02<');
      expect(html).toContain('>03<');
    });

    it('has no spinner-like markup', () => {
      assertNoSpinner(renderToStaticMarkup(<ActionQueueSkeleton />));
    });
  });

  // ── PostureGridSkeleton ───────────────────────────────────────

  describe('PostureGridSkeleton', () => {
    it('renders four muted cards in 2×2', () => {
      const html = renderToStaticMarkup(<PostureGridSkeleton />);
      expect(html).toContain('data-testid="admin-posture-grid-skeleton"');
      expect(html).toContain('Substrate readiness');
      expect(html).toContain('Connector health');
      expect(html).toContain('Auth &amp; isolation');
      expect(html).toContain('Approvals &amp; policy');
      // 2-column grid
      expect(html).toContain('repeat(2, minmax(0, 1fr))');
    });

    it('has no spinner-like markup', () => {
      assertNoSpinner(renderToStaticMarkup(<PostureGridSkeleton />));
    });
  });

  // ── AuditRibbonSkeleton ───────────────────────────────────────

  describe('AuditRibbonSkeleton', () => {
    it('renders six muted rows', () => {
      const html = renderToStaticMarkup(<AuditRibbonSkeleton />);
      expect(html).toContain('data-testid="admin-audit-ribbon-skeleton"');
      // Six rows -> at least 18 `···` placeholders (3 per row).
      const placeholderCount = (html.match(/···/g) ?? []).length;
      expect(placeholderCount).toBeGreaterThanOrEqual(18);
    });

    it('has no spinner-like markup', () => {
      assertNoSpinner(renderToStaticMarkup(<AuditRibbonSkeleton />));
    });
  });

  // ── StewardOrientationSkeleton ────────────────────────────────

  describe('StewardOrientationSkeleton', () => {
    it('renders the editorial frame with placeholder content', () => {
      const html = renderToStaticMarkup(<StewardOrientationSkeleton />);
      expect(html).toContain('data-testid="admin-steward-orientation-skeleton"');
      expect(html).toContain('Ava · Tenant orientation');
      expect(html).toContain('Loaded · grounded');
      expect(html).toContain('Missing · authored only');
    });

    it('has no spinner-like markup', () => {
      assertNoSpinner(renderToStaticMarkup(<StewardOrientationSkeleton />));
    });
  });
});
