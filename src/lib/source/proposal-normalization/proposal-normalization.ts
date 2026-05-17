// Slice 1.4 — Proposal normalization matrix
//
// Pure module. Takes raw vendor-response data and normalizes it across eight
// proposal dimensions, producing one decision-grade comparison matrix that
// surfaces where vendors differ on terms an unwary buyer would miss.
//
// Standalone: no imports from shared Source files, no side effects, no I/O.

import type {
  DimensionDivergence,
  NormalizedDimensionCell,
  NormalizedDimensionRow,
  ProposalComparability,
  ProposalDimensionKey,
  ProposalDimensionStance,
  ProposalNormalizationInput,
  ProposalNormalizationMatrix,
  ProposalNormalizationSummary,
  RawProposalDimension,
  RawVendorProposal,
  VendorProposalSummary,
} from './proposal-normalization-types';

// ── Dimension catalog ────────────────────────────────────────────────────────

/** The fixed, ordered set of dimensions every proposal is normalized against. */
export const PROPOSAL_DIMENSIONS: ReadonlyArray<{
  key: ProposalDimensionKey;
  label: string;
  /** Phrasing of the buyer-blind-spot warning when the row diverges materially. */
  blindSpotHint: string;
}> = [
  {
    key: 'scope_exceptions',
    label: 'Scope exceptions',
    blindSpotHint: 'carve-outs that quietly shift work back to the buyer',
  },
  {
    key: 'assumptions',
    label: 'Assumptions',
    blindSpotHint: 'volume/effort assumptions that trigger change orders if wrong',
  },
  {
    key: 'rates',
    label: 'Rates',
    blindSpotHint: 'rate-card and escalation terms that compound over the term',
  },
  {
    key: 'accelerators',
    label: 'Accelerators',
    blindSpotHint: 'tooling/automation claimed but not contractually guaranteed',
  },
  {
    key: 'ip_terms',
    label: 'IP terms',
    blindSpotHint: 'output ownership and model-training rights the buyer may forfeit',
  },
  {
    key: 'security_posture',
    label: 'Security posture',
    blindSpotHint: 'certification gaps and residency terms that fail compliance review',
  },
  {
    key: 'transition_approach',
    label: 'Transition approach',
    blindSpotHint: 'dual-run and knowledge-transfer cost the buyer absorbs',
  },
  {
    key: 'sla_xla',
    label: 'SLAs / XLAs',
    blindSpotHint: 'service commitments with weak remedies or experience blind spots',
  },
];

const STANCE_RANK: Record<ProposalDimensionStance, number> = {
  favorable: 0,
  standard: 1,
  unfavorable: 2,
  undisclosed: 3,
};

const FALLBACK_GENERATED_AT = '1970-01-01T00:00:00.000Z';

// ── Stance classification ────────────────────────────────────────────────────

/**
 * Classify a single raw dimension into a normalized stance. Heuristic and
 * deterministic: undisclosed when blank; exposure and caveats push toward
 * unfavorable; protective language pulls toward favorable.
 */
function classifyStance(raw: RawProposalDimension | undefined): ProposalDimensionStance {
  const statement = raw?.statement?.trim() ?? '';
  if (!raw || statement.length === 0) {
    return 'undisclosed';
  }

  const exposure = Math.max(0, raw.exposureUsd ?? 0);
  const caveats = raw.caveats?.length ?? 0;
  const text = statement.toLowerCase();

  const favorableSignals = [
    'no exception',
    'no exclusion',
    'buyer owns',
    'customer owns',
    'no additional cost',
    'fixed rate',
    'no escalation',
    'no reuse',
    'capped',
    'guaranteed',
    'fully indemnif',
    'soc 2 type ii',
    'iso 27001',
  ];
  const unfavorableSignals = [
    'excluded',
    'out of scope',
    'subject to change',
    'time and materials',
    'best effort',
    'no remedy',
    'vendor may use',
    'to be determined',
    'tbd',
    'pending certification',
  ];

  const hasFavorable = favorableSignals.some((s) => text.includes(s));
  // Escalation is unfavorable only when it is not explicitly negated.
  const hasEscalation = /escalat/.test(text) && !/no escalation/.test(text);
  // "vendor retains" is unfavorable unless negated ("retains no ... rights").
  const hasVendorRetention =
    /vendor retains/.test(text) && !/retains no/.test(text);
  const hasUnfavorable =
    unfavorableSignals.some((s) => text.includes(s)) ||
    hasEscalation ||
    hasVendorRetention;

  if (exposure > 0 || hasUnfavorable || caveats >= 2) {
    if (hasFavorable && exposure === 0 && !hasUnfavorable) {
      return 'standard';
    }
    return 'unfavorable';
  }
  if (hasFavorable) {
    return 'favorable';
  }
  return 'standard';
}

/** Produce a plain-language normalized restatement for a cell. */
function normalizeStatement(
  raw: RawProposalDimension | undefined,
  stance: ProposalDimensionStance,
): string {
  if (stance === 'undisclosed') {
    return 'Not addressed in vendor response.';
  }
  const statement = raw?.statement?.trim() ?? '';
  const exposure = Math.max(0, raw?.exposureUsd ?? 0);
  const caveatCount = raw?.caveats?.length ?? 0;
  const parts: string[] = [statement];
  if (exposure > 0) {
    parts.push(`(buyer exposure ~$${exposure.toLocaleString('en-US')})`);
  }
  if (caveatCount > 0) {
    parts.push(`[${caveatCount} caveat${caveatCount === 1 ? '' : 's'}]`);
  }
  return parts.join(' ');
}

// ── Row + divergence ─────────────────────────────────────────────────────────

function deriveDivergence(cells: NormalizedDimensionCell[]): DimensionDivergence {
  if (cells.length === 0) {
    return 'aligned';
  }
  if (cells.some((c) => !c.disclosed)) {
    return 'undisclosed_gap';
  }
  const ranks = cells.map((c) => STANCE_RANK[c.stance]);
  const spread = Math.max(...ranks) - Math.min(...ranks);
  if (spread === 0) {
    return 'aligned';
  }
  if (spread === 1) {
    return 'minor';
  }
  return 'material';
}

function buildRow(
  key: ProposalDimensionKey,
  label: string,
  blindSpotHint: string,
  proposals: RawVendorProposal[],
): NormalizedDimensionRow {
  const cells: NormalizedDimensionCell[] = proposals.map((proposal) => {
    const raw = proposal.dimensions.find((d) => d.key === key);
    const stance = classifyStance(raw);
    return {
      vendorId: proposal.vendorId,
      vendorName: proposal.vendorName,
      key,
      stance,
      normalizedStatement: normalizeStatement(raw, stance),
      exposureUsd: Math.max(0, raw?.exposureUsd ?? 0),
      caveatCount: raw?.caveats?.length ?? 0,
      disclosed: stance !== 'undisclosed',
    };
  });

  const disclosed = cells.filter((c) => c.disclosed);
  let bestVendorId: string | null = null;
  let worstVendorId: string | null = null;
  let exposureSpreadUsd = 0;

  if (disclosed.length > 0) {
    const sorted = [...disclosed].sort((a, b) => {
      if (a.exposureUsd !== b.exposureUsd) {
        return a.exposureUsd - b.exposureUsd;
      }
      return STANCE_RANK[a.stance] - STANCE_RANK[b.stance];
    });
    bestVendorId = sorted[0].vendorId;
    worstVendorId = sorted[sorted.length - 1].vendorId;
    exposureSpreadUsd =
      sorted[sorted.length - 1].exposureUsd - sorted[0].exposureUsd;
  }

  const divergence = deriveDivergence(cells);
  let buyerBlindSpot: string | null = null;
  if (divergence === 'material') {
    buyerBlindSpot = `${label}: vendors diverge on ${blindSpotHint}.`;
  } else if (divergence === 'undisclosed_gap') {
    const missing = cells.filter((c) => !c.disclosed).map((c) => c.vendorName);
    buyerBlindSpot = `${label}: ${missing.join(', ')} left this blank — ${blindSpotHint}.`;
  }

  return {
    key,
    label,
    divergence,
    cells,
    bestVendorId,
    worstVendorId,
    exposureSpreadUsd,
    buyerBlindSpot,
  };
}

// ── Vendor summary ───────────────────────────────────────────────────────────

function summarizeVendor(
  proposal: RawVendorProposal,
  rows: NormalizedDimensionRow[],
): VendorProposalSummary {
  const cells = rows
    .map((row) => row.cells.find((c) => c.vendorId === proposal.vendorId))
    .filter((c): c is NormalizedDimensionCell => Boolean(c));

  const disclosedDimensions = cells.filter((c) => c.disclosed).length;
  const undisclosedDimensions = cells.length - disclosedDimensions;
  const unfavorableDimensions = cells.filter((c) => c.stance === 'unfavorable').length;
  const totalExposureUsd = cells.reduce((sum, c) => sum + c.exposureUsd, 0);

  let comparability: ProposalComparability;
  if (undisclosedDimensions === 0) {
    comparability = 'comparable';
  } else if (undisclosedDimensions <= 2) {
    comparability = 'partially_comparable';
  } else {
    comparability = 'not_comparable';
  }

  const rationale: string[] = [];
  rationale.push(
    `${disclosedDimensions}/${cells.length} dimensions disclosed.`,
  );
  if (undisclosedDimensions > 0) {
    rationale.push(
      `${undisclosedDimensions} dimension${undisclosedDimensions === 1 ? '' : 's'} left blank — not yet fully comparable.`,
    );
  }
  if (unfavorableDimensions > 0) {
    rationale.push(
      `${unfavorableDimensions} dimension${unfavorableDimensions === 1 ? '' : 's'} shift cost or risk onto the buyer.`,
    );
  }
  if (totalExposureUsd > 0) {
    rationale.push(
      `Quantified buyer exposure ~$${totalExposureUsd.toLocaleString('en-US')}.`,
    );
  }

  return {
    vendorId: proposal.vendorId,
    vendorName: proposal.vendorName,
    comparability,
    disclosedDimensions,
    undisclosedDimensions,
    unfavorableDimensions,
    totalExposureUsd,
    rationale,
  };
}

// ── Public entrypoint ────────────────────────────────────────────────────────

/**
 * Normalize a set of raw vendor proposals into one decision-grade comparison
 * matrix. Pure and deterministic — same input always yields the same output.
 */
export function buildProposalNormalizationMatrix(
  input: ProposalNormalizationInput,
): ProposalNormalizationMatrix {
  const proposals = input.proposals ?? [];

  const rows = PROPOSAL_DIMENSIONS.map((dim) =>
    buildRow(dim.key, dim.label, dim.blindSpotHint, proposals),
  );

  const vendorSummaries = proposals.map((proposal) =>
    summarizeVendor(proposal, rows),
  );

  const materialDivergenceRows = rows.filter(
    (r) => r.divergence === 'material',
  ).length;
  const undisclosedGapRows = rows.filter(
    (r) => r.divergence === 'undisclosed_gap',
  ).length;
  const totalExposureSpreadUsd = rows.reduce(
    (sum, r) => sum + r.exposureSpreadUsd,
    0,
  );

  const summary: ProposalNormalizationSummary = {
    totalVendors: proposals.length,
    totalDimensions: PROPOSAL_DIMENSIONS.length,
    comparableVendors: vendorSummaries.filter(
      (v) => v.comparability === 'comparable',
    ).length,
    materialDivergenceRows,
    undisclosedGapRows,
    totalExposureSpreadUsd,
  };

  // Highest-impact blind spots first: material divergence sorted by exposure
  // spread, then undisclosed gaps.
  const buyerBlindSpots = [
    ...rows
      .filter((r) => r.divergence === 'material' && r.buyerBlindSpot)
      .sort((a, b) => b.exposureSpreadUsd - a.exposureSpreadUsd),
    ...rows.filter((r) => r.divergence === 'undisclosed_gap' && r.buyerBlindSpot),
  ]
    .map((r) => r.buyerBlindSpot)
    .filter((s): s is string => Boolean(s));

  let recommendedNextAction: string;
  if (proposals.length === 0) {
    recommendedNextAction =
      'No vendor proposals submitted — cannot normalize. Collect responses first.';
  } else if (undisclosedGapRows > 0) {
    recommendedNextAction =
      'Issue clarification requests for undisclosed dimensions before scoring — the matrix is not yet fully comparable.';
  } else if (materialDivergenceRows > 0) {
    recommendedNextAction =
      'Review the buyer blind spots with procurement counsel before award — vendors diverge on terms a buyer would miss.';
  } else {
    recommendedNextAction =
      'Proposals are normalized and comparable — proceed to weighted scoring.';
  }

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    stage: input.stage,
    generatedAt: input.generatedAt ?? FALLBACK_GENERATED_AT,
    rows,
    vendorSummaries,
    summary,
    buyerBlindSpots,
    recommendedNextAction,
  };
}
