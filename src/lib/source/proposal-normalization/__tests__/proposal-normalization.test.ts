// Slice 1.4 — Tests for the proposal normalization matrix.

import {
  PROPOSAL_DIMENSIONS,
  buildProposalNormalizationMatrix,
} from '../proposal-normalization';
import type {
  ProposalNormalizationInput,
} from '../proposal-normalization-types';
import { APEX_AMS_PROPOSAL_FIXTURE } from '../proposal-normalization-fixtures';

const matrix = buildProposalNormalizationMatrix(APEX_AMS_PROPOSAL_FIXTURE);

function row(key: string) {
  const r = matrix.rows.find((x) => x.key === key);
  if (!r) throw new Error(`row ${key} missing`);
  return r;
}
function cell(key: string, vendorId: string) {
  const c = row(key).cells.find((x) => x.vendorId === vendorId);
  if (!c) throw new Error(`cell ${key}/${vendorId} missing`);
  return c;
}

// ── Matrix shape ─────────────────────────────────────────────────────────────

describe('proposal normalization — matrix shape', () => {
  it('produces one row per proposal dimension', () => {
    expect(matrix.rows).toHaveLength(PROPOSAL_DIMENSIONS.length);
    expect(matrix.rows).toHaveLength(8);
  });

  it('produces one cell per vendor in every row', () => {
    for (const r of matrix.rows) {
      expect(r.cells).toHaveLength(3);
    }
  });

  it('carries event metadata through', () => {
    expect(matrix.eventId).toBe('SRC-APX-AMS-2026');
    expect(matrix.stage).toBe('BAFO');
    expect(matrix.generatedAt).toBe('2026-05-16T00:00:00.000Z');
  });

  it('summarizes every vendor', () => {
    expect(matrix.vendorSummaries).toHaveLength(3);
    expect(matrix.summary.totalVendors).toBe(3);
    expect(matrix.summary.totalDimensions).toBe(8);
  });
});

// ── Stance classification ────────────────────────────────────────────────────

describe('proposal normalization — stance classification', () => {
  it('flags excluded scope as unfavorable with exposure', () => {
    const c = cell('scope_exceptions', 'vendor-bluemaster');
    expect(c.stance).toBe('unfavorable');
    expect(c.exposureUsd).toBe(180000);
    expect(c.caveatCount).toBe(2);
  });

  it('reads no-exception scope as favorable', () => {
    expect(cell('scope_exceptions', 'vendor-northpeak').stance).toBe('favorable');
    expect(cell('scope_exceptions', 'vendor-summit').stance).toBe('favorable');
  });

  it('flags rate escalation as unfavorable', () => {
    expect(cell('rates', 'vendor-bluemaster').stance).toBe('unfavorable');
    expect(cell('rates', 'vendor-summit').stance).toBe('unfavorable');
  });

  it('reads fixed-rate-no-escalation as favorable', () => {
    expect(cell('rates', 'vendor-northpeak').stance).toBe('favorable');
  });

  it('flags vendor model-training reuse as unfavorable IP terms', () => {
    expect(cell('ip_terms', 'vendor-bluemaster').stance).toBe('unfavorable');
  });

  it('reads buyer-owns-outputs IP terms as favorable', () => {
    expect(cell('ip_terms', 'vendor-northpeak').stance).toBe('favorable');
    expect(cell('ip_terms', 'vendor-summit').stance).toBe('favorable');
  });

  it('flags pending security certification as unfavorable', () => {
    expect(cell('security_posture', 'vendor-bluemaster').stance).toBe('unfavorable');
  });

  it('marks an omitted dimension as undisclosed', () => {
    const c = cell('sla_xla', 'vendor-bluemaster');
    expect(c.stance).toBe('undisclosed');
    expect(c.disclosed).toBe(false);
    expect(c.normalizedStatement).toMatch(/not addressed/i);
  });
});

// ── Divergence + blind spots ─────────────────────────────────────────────────

describe('proposal normalization — divergence detection', () => {
  it('marks the SLA row as an undisclosed gap', () => {
    expect(row('sla_xla').divergence).toBe('undisclosed_gap');
    expect(matrix.summary.undisclosedGapRows).toBeGreaterThanOrEqual(1);
  });

  it('marks scope exceptions as material divergence', () => {
    expect(row('scope_exceptions').divergence).toBe('material');
  });

  it('flags an aligned row when all vendors match', () => {
    // IP terms: bluemaster unfavorable vs two favorable -> material, not aligned.
    // assumptions: northpeak/summit standard, bluemaster unfavorable -> material.
    // Pick a constructed all-favorable case below instead.
    const aligned = buildProposalNormalizationMatrix({
      eventId: 'e',
      eventName: 'e',
      stage: 's',
      proposals: [
        {
          vendorId: 'a',
          vendorName: 'A',
          dimensions: [{ key: 'rates', statement: 'Fixed rate, no escalation.' }],
        },
        {
          vendorId: 'b',
          vendorName: 'B',
          dimensions: [{ key: 'rates', statement: 'Fixed rate, no escalation.' }],
        },
      ],
    });
    expect(aligned.rows.find((r) => r.key === 'rates')?.divergence).toBe('aligned');
  });

  it('computes exposure spread between best and worst vendor on a row', () => {
    const r = row('scope_exceptions');
    expect(r.exposureSpreadUsd).toBe(180000);
    expect(r.worstVendorId).toBe('vendor-bluemaster');
    expect(['vendor-northpeak', 'vendor-summit']).toContain(r.bestVendorId);
  });

  it('surfaces buyer blind spots ordered by exposure spread', () => {
    expect(matrix.buyerBlindSpots.length).toBeGreaterThan(0);
    // scope exceptions ($180k spread) should outrank rates ($95k spread).
    const scopeIdx = matrix.buyerBlindSpots.findIndex((s) =>
      s.startsWith('Scope exceptions'),
    );
    const ratesIdx = matrix.buyerBlindSpots.findIndex((s) =>
      s.startsWith('Rates'),
    );
    if (scopeIdx !== -1 && ratesIdx !== -1) {
      expect(scopeIdx).toBeLessThan(ratesIdx);
    }
  });
});

// ── Vendor summaries ─────────────────────────────────────────────────────────

describe('proposal normalization — vendor summaries', () => {
  it('marks a fully disclosed vendor as comparable', () => {
    const summit = matrix.vendorSummaries.find((v) => v.vendorId === 'vendor-summit');
    expect(summit?.comparability).toBe('comparable');
    expect(summit?.undisclosedDimensions).toBe(0);
  });

  it('marks a vendor with one blank dimension as partially comparable', () => {
    const bm = matrix.vendorSummaries.find((v) => v.vendorId === 'vendor-bluemaster');
    expect(bm?.undisclosedDimensions).toBe(1);
    expect(bm?.comparability).toBe('partially_comparable');
  });

  it('accumulates total buyer exposure per vendor', () => {
    const bm = matrix.vendorSummaries.find((v) => v.vendorId === 'vendor-bluemaster');
    // 180k scope + 95k rates + 140k transition = 415k
    expect(bm?.totalExposureUsd).toBe(415000);
    expect(bm?.unfavorableDimensions).toBeGreaterThanOrEqual(3);
  });

  it('gives each vendor a non-empty rationale', () => {
    for (const v of matrix.vendorSummaries) {
      expect(v.rationale.length).toBeGreaterThan(0);
    }
  });
});

// ── Recommended action + edge cases ──────────────────────────────────────────

describe('proposal normalization — recommended action', () => {
  it('recommends clarification when dimensions are undisclosed', () => {
    expect(matrix.recommendedNextAction).toMatch(/clarification/i);
  });

  it('recommends counsel review when divergence is material but all disclosed', () => {
    const allDisclosed: ProposalNormalizationInput = {
      eventId: 'e',
      eventName: 'e',
      stage: 's',
      proposals: [
        {
          vendorId: 'a',
          vendorName: 'A',
          dimensions: PROPOSAL_DIMENSIONS.map((d) => ({
            key: d.key,
            statement: 'Fixed rate, no escalation, customer owns outputs.',
          })),
        },
        {
          vendorId: 'b',
          vendorName: 'B',
          dimensions: PROPOSAL_DIMENSIONS.map((d) => ({
            key: d.key,
            statement: 'Excluded, out of scope, time and materials.',
            exposureUsd: 50000,
          })),
        },
      ],
    };
    const m = buildProposalNormalizationMatrix(allDisclosed);
    expect(m.summary.undisclosedGapRows).toBe(0);
    expect(m.recommendedNextAction).toMatch(/counsel/i);
  });

  it('recommends proceeding to scoring when proposals are aligned', () => {
    const aligned: ProposalNormalizationInput = {
      eventId: 'e',
      eventName: 'e',
      stage: 's',
      proposals: [
        {
          vendorId: 'a',
          vendorName: 'A',
          dimensions: PROPOSAL_DIMENSIONS.map((d) => ({
            key: d.key,
            statement: 'Standard market terms apply.',
          })),
        },
        {
          vendorId: 'b',
          vendorName: 'B',
          dimensions: PROPOSAL_DIMENSIONS.map((d) => ({
            key: d.key,
            statement: 'Standard market terms apply.',
          })),
        },
      ],
    };
    const m = buildProposalNormalizationMatrix(aligned);
    expect(m.recommendedNextAction).toMatch(/scoring/i);
  });

  it('handles an empty proposal set without throwing', () => {
    const m = buildProposalNormalizationMatrix({
      eventId: 'e',
      eventName: 'e',
      stage: 's',
      proposals: [],
    });
    expect(m.summary.totalVendors).toBe(0);
    expect(m.rows).toHaveLength(8);
    expect(m.rows.every((r) => r.cells.length === 0)).toBe(true);
    expect(m.recommendedNextAction).toMatch(/no vendor proposals/i);
  });

  it('is deterministic — same input yields identical output', () => {
    const a = buildProposalNormalizationMatrix(APEX_AMS_PROPOSAL_FIXTURE);
    const b = buildProposalNormalizationMatrix(APEX_AMS_PROPOSAL_FIXTURE);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
