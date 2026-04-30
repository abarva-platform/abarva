/**
 * FM #8 — Failure-mode narrative absent · INT-RGS
 *
 * Failure mode: J0 cards link to stub or empty pages — the
 * narrative depth that makes the cold-open compelling never
 * lands. The mechanism: every card has a slug that resolves
 * to a substantive expanded-narrative page.
 */

import {
  J0_FAILURE_MODE_CARDS,
  getJ0CardBySlug,
  slugifyEditorialName,
} from '@/lib/intelligence/j0-failure-mode-cards';

describe('FM #8 — Failure-mode narrative absent', () => {
  it('every card slug resolves via getJ0CardBySlug', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const slug = slugifyEditorialName(card.editorialName);
      const resolved = getJ0CardBySlug(slug);
      expect(resolved).toBeDefined();
      expect(resolved?.failureModeId).toBe(card.failureModeId);
    }
  });

  it('every expanded narrative is at least 500 chars (substantive depth)', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.expandedNarrative.length).toBeGreaterThan(500);
    }
  });

  it('every expanded narrative weaves a substantive thematic anchor (citation, named role, or evidence reference)', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const text = card.expandedNarrative.toLowerCase();
      // Substantive narrative should contain at least one of:
      // a number, a quoted citation marker, a named role, a
      // dollar amount, a year, or an evidence-style reference.
      const hasNumericGrounding = /\b\d+\b/.test(text);
      const hasNamedRole = /\b(?:cio|cfo|cmo|cdo|ciso|sponsor|lead|chief)\b/i.test(
        text,
      );
      const hasEvidenceMarker =
        /\b(?:evidence|study|research|gartner|mit|rand|mckinsey|forrester|bcg|deloitte)\b/i.test(
          text,
        );
      const hasGrounding =
        hasNumericGrounding || hasNamedRole || hasEvidenceMarker;
      expect(hasGrounding).toBe(true);
    }
  });

  it('whyItKills is non-empty and substantive (>50 chars)', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.whyItKills.length).toBeGreaterThan(50);
    }
  });

  it('whatGoodLooksLike is non-empty and substantive (>50 chars)', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.whatGoodLooksLike.length).toBeGreaterThan(50);
    }
  });

  it('every example scenario has industry context + scenario text', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      for (const scenario of card.exampleScenarios) {
        expect(scenario.industryContext.length).toBeGreaterThan(0);
        expect(scenario.scenario.length).toBeGreaterThan(20);
      }
    }
  });

  it('every research citation has source + citation text + lastVerifiedAt', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      for (const r of card.citedResearch) {
        expect(r.source).toBeDefined();
        expect(r.citation.length).toBeGreaterThan(0);
        expect(r.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
