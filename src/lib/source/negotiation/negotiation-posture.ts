// Slice 1.5 — Negotiation posture generator
//
// A pure module that turns two upstream sourcing artifacts — a should-cost
// estimate (Slice 1.3) and a proposal-normalization matrix (Slice 1.4) — into
// executive-grade commercial negotiation advice. It answers "here is exactly
// how to negotiate this deal," not "here is a checklist."
//
// The methodology backbone is SOURCE-SOURCING-METHODOLOGY.md:
//   - §5 (the TCO iceberg) — the should-cost gap is the primary lever.
//   - §6 (the AI-sourcing clause library) — the contract clauses to press.
//   - Stage 5 (negotiation & contracting) — levers are timing, competitive
//     tension, multi-year, and reference value.
//
// Pure module: no model calls, no network, no tenant data, no DB. Standalone —
// NOT wired into source-answer-engine.ts or any shared Source file.

import type {
  NormalizedDimensionRow,
  ProposalDimensionStance,
} from '../proposal-normalization/proposal-normalization-types';
import type {
  ClauseIssue,
  ConcessionToTrade,
  IncumbentLeverage,
  LeverStrength,
  NegotiationContext,
  NegotiationLever,
  NegotiationPosture,
  NegotiationPostureInput,
  WalkAwayRisk,
} from './negotiation-posture-types';

const FALLBACK_GENERATED_AT = '1970-01-01T00:00:00.000Z';

// ── Helpers ──────────────────────────────────────────────────────────────────

const usd = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;

const pct = (fraction: number): string => `${Math.round(fraction * 100)}%`;

const STRENGTH_RANK: Record<LeverStrength, number> = {
  strong: 0,
  moderate: 1,
  weak: 2,
};

/**
 * The AI-sourcing clause library from methodology §6. The generator checks the
 * proposal matrix for each and surfaces those left exposed or undisclosed.
 */
const AI_CLAUSE_LIBRARY: ReadonlyArray<{
  clause: string;
  whyItMatters: string;
  /** Proposal dimensions whose weakness implies this clause is at risk. */
  matrixSignalDimensions: ReadonlyArray<string>;
  priority: ClauseIssue['priority'];
  ask: string;
}> = [
  {
    clause: 'Model-training rights',
    whyItMatters:
      'The vendor must not train its models on the buyer’s data or prompts; without an explicit bar the buyer’s proprietary signal leaks into a shared model.',
    matrixSignalDimensions: ['ip_terms'],
    priority: 'must_have',
    ask: 'Add an express prohibition on training, fine-tuning, or evaluating any vendor or third-party model on buyer data, prompts, or outputs.',
  },
  {
    clause: 'IP indemnification',
    whyItMatters:
      'If the vendor’s model was trained on copyrighted material, the vendor — not the buyer — must carry the infringement liability.',
    matrixSignalDimensions: ['ip_terms'],
    priority: 'must_have',
    ask: 'Require uncapped IP indemnification for third-party infringement claims arising from model training data.',
  },
  {
    clause: 'Output ownership',
    whyItMatters:
      'The buyer must own generated outputs outright, with no vendor reuse or derivative-rights claim.',
    matrixSignalDimensions: ['ip_terms'],
    priority: 'must_have',
    ask: 'State that the buyer owns all generated outputs and the vendor retains no licence to reuse them.',
  },
  {
    clause: 'Error / hallucination liability & remedy',
    whyItMatters:
      'Probabilistic systems fail differently than deterministic software — an uptime SLA does not cover a confidently wrong answer; the remedy must be defined.',
    matrixSignalDimensions: ['sla_xla'],
    priority: 'must_have',
    ask: 'Define accuracy/quality thresholds and a concrete remedy (rework, credit, termination right) for material output error — not just availability.',
  },
  {
    clause: 'Consumption-pricing cap & predictability',
    whyItMatters:
      'Token/usage pricing can explode without warning; the buyer needs a hard ceiling, usage alerts, and a predictable annual figure.',
    matrixSignalDimensions: ['rates'],
    priority: 'must_have',
    ask: 'Require an annual consumption cap, overage alerts at defined thresholds, and a not-to-exceed ceiling for the term.',
  },
  {
    clause: 'Sub-processor / model-provider disclosure',
    whyItMatters:
      'The vendor’s own dependency on OpenAI/Anthropic/etc. is a concentration risk the buyer inherits and must be able to see.',
    matrixSignalDimensions: ['security_posture'],
    priority: 'should_have',
    ask: 'Require disclosure of all model providers and sub-processors, with notice and a right to object before any change.',
  },
  {
    clause: 'Data residency',
    whyItMatters:
      'Where prompts and data are processed and stored determines whether the deal survives compliance review.',
    matrixSignalDimensions: ['security_posture'],
    priority: 'should_have',
    ask: 'Pin processing and storage to named jurisdictions and prohibit cross-border transfer without consent.',
  },
  {
    clause: 'Fine-tuned-model portability',
    whyItMatters:
      'On exit the buyer must be able to extract or retire any model fine-tuned on its data — otherwise the buyer is locked in by its own training investment.',
    matrixSignalDimensions: ['ip_terms', 'transition_approach'],
    priority: 'should_have',
    ask: 'Guarantee export or certified destruction of any buyer-data-derived fine-tuned model on termination.',
  },
  {
    clause: 'Right to benchmark / no gag clause',
    whyItMatters:
      'The buyer must be free to publish performance comparisons; a gag clause hides underperformance.',
    matrixSignalDimensions: ['sla_xla'],
    priority: 'should_have',
    ask: 'Strike any clause restricting the buyer from publishing benchmark or performance results.',
  },
  {
    clause: 'AI-behaviour audit rights',
    whyItMatters:
      'The buyer must be able to audit model behaviour — not just financials — to verify safety, bias, and accuracy claims.',
    matrixSignalDimensions: ['security_posture', 'sla_xla'],
    priority: 'should_have',
    ask: 'Secure a contractual right to audit model behaviour, including bias and accuracy testing, on reasonable notice.',
  },
];

/** Find the preferred vendor's normalized cell on a given dimension. */
function preferredCell(
  rows: NormalizedDimensionRow[],
  dimensionKey: string,
  preferredVendorId: string | undefined,
):
  | { stance: ProposalDimensionStance; exposureUsd: number; disclosed: boolean }
  | undefined {
  const row = rows.find((r) => r.key === dimensionKey);
  if (!row) return undefined;
  if (preferredVendorId) {
    const cell = row.cells.find((c) => c.vendorId === preferredVendorId);
    if (cell) return cell;
  }
  // No preferred vendor pinned: fall back to the worst cell on the row, since
  // negotiation posture is about the exposure the buyer must close.
  if (row.cells.length === 0) return undefined;
  return [...row.cells].sort((a, b) => b.exposureUsd - a.exposureUsd)[0];
}

// ── Lever generation ─────────────────────────────────────────────────────────

function buildLevers(input: NegotiationPostureInput): NegotiationLever[] {
  const { shouldCost, proposalMatrix } = input;
  const ctx: NegotiationContext = input.context ?? {};
  const levers: NegotiationLever[] = [];

  // Lever 1 — the should-cost gap (methodology §5). The quote vs. the modelled
  // should-cost midpoint is the single most grounded number in the room.
  const quote = shouldCost.vendorQuotedCost;
  const visibleShare = shouldCost.visibleShareOfTotal;
  // A quote that is a *small* share of true cost means the vendor has loaded
  // the hidden layers; that hidden loading is exactly what is negotiable.
  const hiddenTotal = shouldCost.totalPoint - quote;
  if (hiddenTotal > 0) {
    const gapStrength: LeverStrength =
      visibleShare <= 0.3 ? 'strong' : visibleShare <= 0.45 ? 'moderate' : 'weak';
    levers.push({
      kind: 'should_cost_gap',
      title: 'Anchor on modelled should-cost, not the vendor quote',
      strength: gapStrength,
      rationale: `${shouldCost.headline} The quote is only ${pct(visibleShare)} of true cost — the ${usd(hiddenTotal)} of hidden iceberg layers (integration, change management, consumption, exit) is where the negotiable margin sits.`,
      ask: `Open by re-basing the conversation on the ${usd(shouldCost.totalLow)}–${usd(shouldCost.totalHigh)} should-cost range and require the vendor to itemise and justify each hidden layer rather than negotiating the headline figure.`,
      estimatedValueUsd: Math.round(hiddenTotal),
    });
  }

  // Lever 2 — competitive tension (methodology Stage 5). The strongest lever
  // when a credible alternative exists; weak/absent otherwise.
  const vendorCount = proposalMatrix.summary.totalVendors;
  if (ctx.hasCredibleAlternative || vendorCount >= 2) {
    const tensionStrength: LeverStrength = ctx.hasCredibleAlternative
      ? 'strong'
      : vendorCount >= 3
        ? 'moderate'
        : 'weak';
    levers.push({
      kind: 'competitive_tension',
      title: 'Keep a second vendor visibly in the running',
      strength: tensionStrength,
      rationale: ctx.hasCredibleAlternative
        ? `A deal-ready alternative is on the table; ${vendorCount} vendors were normalized in the proposal matrix. Competitive tension is the single strongest commercial lever — it is credible only while a real runner-up exists.`
        : `${vendorCount} vendors were normalized; no alternative is confirmed deal-ready, so the tension is real but limited. Do not let the vendor learn it has effectively won.`,
      ask: 'Hold the runner-up in active BAFO and make clear in writing that award is contingent on closing the should-cost and clause gaps — do not signal a sole-source decision.',
      estimatedValueUsd: null,
    });
  }

  // Lever 3 — commercial model: consumption volatility and rate escalation.
  const consumptionLayer = shouldCost.icebergLayers.find(
    (l) => l.layer === 'consumption_scaling',
  );
  const ratesRow = proposalMatrix.rows.find((r) => r.key === 'rates');
  const consumptionSwing = consumptionLayer
    ? consumptionLayer.high - consumptionLayer.low
    : 0;
  const ratesExposed =
    ratesRow !== undefined &&
    (ratesRow.divergence === 'material' || ratesRow.exposureSpreadUsd > 0);
  if (consumptionSwing > 0 || ratesExposed) {
    const modelStrength: LeverStrength =
      consumptionSwing > 0 && ratesExposed ? 'strong' : 'moderate';
    levers.push({
      kind: 'commercial_model',
      title: 'Convert open-ended consumption into a capped, predictable price',
      strength: modelStrength,
      rationale: consumptionSwing > 0
        ? `The should-cost model shows the consumption/scaling layer swinging ${usd(consumptionSwing)} between the low and high case — token/usage pricing volatility the buyer would otherwise carry. ${ratesExposed ? 'The proposal matrix also flags rate-card divergence between vendors.' : ''}`
        : 'The proposal matrix flags material rate-card divergence — escalation and rate terms compound silently over the term.',
      ask: 'Require an annual consumption cap with a not-to-exceed ceiling, fixed rate-card escalation (CPI-linked maximum), and usage alerts — trade predictability for the buyer against term length.',
      estimatedValueUsd: consumptionSwing > 0 ? Math.round(consumptionSwing) : null,
    });
  }

  // Lever 4 — term divergence: a normalized dimension where the preferred
  // vendor is the outlier the buyer can press on.
  const materialRows = proposalMatrix.rows
    .filter((r) => r.divergence === 'material' && r.key !== 'rates')
    .sort((a, b) => b.exposureSpreadUsd - a.exposureSpreadUsd);
  const topDivergent = materialRows[0];
  if (topDivergent) {
    const preferred = preferredCell(
      proposalMatrix.rows,
      topDivergent.key,
      ctx.preferredVendorId,
    );
    const isPreferredWorst =
      preferred !== undefined &&
      (preferred.stance === 'unfavorable' || preferred.exposureUsd > 0);
    levers.push({
      kind: 'term_divergence',
      title: `Press the ${topDivergent.label.toLowerCase()} term to the best position offered`,
      strength: isPreferredWorst ? 'strong' : 'moderate',
      rationale: `${topDivergent.buyerBlindSpot ?? `${topDivergent.label}: vendors diverge materially.`} The exposure spread across vendors is ${usd(topDivergent.exposureSpreadUsd)} — one vendor has already proved a better term is commercially possible.`,
      ask: `Require the preferred vendor to match the best ${topDivergent.label.toLowerCase()} position any vendor offered; the divergence proves the ask is reasonable, not aggressive.`,
      estimatedValueUsd:
        topDivergent.exposureSpreadUsd > 0
          ? Math.round(topDivergent.exposureSpreadUsd)
          : null,
    });
  }

  // Lever 5 — multi-year / reference value: what the buyer can offer for price.
  if (ctx.multiYearCommitmentPossible || ctx.referenceValueHigh) {
    const both = ctx.multiYearCommitmentPossible && ctx.referenceValueHigh;
    levers.push({
      kind: ctx.multiYearCommitmentPossible ? 'multi_year' : 'reference_value',
      title: 'Trade a longer commitment and reference value for price',
      strength: both ? 'strong' : 'moderate',
      rationale: `The buyer can offer ${ctx.multiYearCommitmentPossible ? 'a multi-year commitment' : ''}${both ? ' and ' : ''}${ctx.referenceValueHigh ? 'marquee reference value' : ''} — both are worth real money to the vendor's bookings and pipeline, and cost the buyer little if the exit terms are sound.`,
      ask: 'Offer a multi-year term or reference-logo rights only in exchange for a should-cost-aligned price, locked escalation, and the §6 must-have clauses — never give either away unpriced.',
      estimatedValueUsd: null,
    });
  }

  // Lever 6 (overflow) — timing: only included if the top five are not filled.
  if (ctx.decisionWindowMonths !== undefined && levers.length < 5) {
    const tight = ctx.decisionWindowMonths <= 2;
    levers.push({
      kind: 'timing',
      title: tight
        ? 'Neutralise the buyer’s own timing pressure'
        : 'Use the vendor’s quarter-end timing, not the buyer’s deadline',
      strength: tight ? 'weak' : 'moderate',
      rationale: tight
        ? `The buyer has only ${ctx.decisionWindowMonths} month(s) to sign — a deadline the vendor will exploit. Timing is a liability here, not a lever, unless it is concealed.`
        : `With ${ctx.decisionWindowMonths} months of runway the buyer can let the vendor's quarter/year-end bookings pressure work in the buyer's favour.`,
      ask: tight
        ? 'Do not disclose the internal deadline; if needed, secure a short bridge or extension so timing pressure cannot be used against the buyer.'
        : 'Schedule the close to land near the vendor’s fiscal quarter-end and let the discounting incentive come from the vendor’s side.',
      estimatedValueUsd: null,
    });
  }

  return levers
    .sort((a, b) => STRENGTH_RANK[a.strength] - STRENGTH_RANK[b.strength])
    .slice(0, 5);
}

// ── Walk-away risks ──────────────────────────────────────────────────────────

function buildWalkAwayRisks(input: NegotiationPostureInput): WalkAwayRisk[] {
  const { shouldCost, proposalMatrix } = input;
  const ctx: NegotiationContext = input.context ?? {};
  const risks: WalkAwayRisk[] = [];

  // Budget ceiling breached by the modelled should-cost.
  if (
    ctx.budgetCeilingUsd !== undefined &&
    shouldCost.totalPoint > ctx.budgetCeilingUsd
  ) {
    const overrun = shouldCost.totalPoint - ctx.budgetCeilingUsd;
    risks.push({
      title: 'Modelled should-cost exceeds the budget ceiling',
      rationale: `The should-cost midpoint of ${usd(shouldCost.totalPoint)} is ${usd(overrun)} over the ${usd(ctx.budgetCeilingUsd)} ceiling — even before negotiation the deal does not fit, and the vendor quote alone hides that gap.`,
      mitigationAsk: `Require the total TCO to land at or below ${usd(ctx.budgetCeilingUsd)}, or de-scope; do not approve a deal whose modelled cost is already over budget.`,
      severity: 'high',
    });
  }

  // Undisclosed-gap rows mean the buyer cannot yet score the field.
  if (proposalMatrix.summary.undisclosedGapRows > 0) {
    risks.push({
      title: 'Material proposal terms are still undisclosed',
      rationale: `${proposalMatrix.summary.undisclosedGapRows} dimension(s) were left blank by at least one vendor — the buyer cannot price or compare what it cannot see, and signing on an incomplete proposal is signing blind.`,
      mitigationAsk: 'Require complete, written answers on every undisclosed dimension before any award decision; treat continued non-disclosure as disqualifying.',
      severity: 'high',
    });
  }

  // An unfavorable IP-terms stance for the preferred vendor — a §6 red line.
  const ipCell = preferredCell(
    proposalMatrix.rows,
    'ip_terms',
    ctx.preferredVendorId,
  );
  if (ipCell && (ipCell.stance === 'unfavorable' || !ipCell.disclosed)) {
    risks.push({
      title: 'IP, output-ownership, or model-training terms are unresolved',
      rationale: 'The preferred vendor’s IP-terms position is unfavorable or undisclosed. Per methodology §6 this risks the buyer forfeiting output ownership and letting its data train a shared model — a structural loss no price discount offsets.',
      mitigationAsk: 'Make award strictly contingent on the §6 must-have IP clauses (no model training on buyer data, buyer output ownership, IP indemnification); walk if the vendor will not commit.',
      severity: 'high',
    });
  }

  // High aggregate buyer exposure across the matrix.
  const totalExposure = proposalMatrix.summary.totalExposureSpreadUsd;
  if (totalExposure > 0) {
    risks.push({
      title: 'Quantified buyer exposure is concentrated in divergent terms',
      rationale: `The proposal matrix quantifies ${usd(totalExposure)} of exposure spread across divergent dimensions — cost the buyer silently absorbs if the weaker terms are accepted as written.`,
      mitigationAsk: 'Drive every divergent term to the best position offered before signature; price any residual exposure into the commercial comparison.',
      severity: 'moderate',
    });
  }

  // No alternative + incumbent re-compete = the buyer can be cornered.
  if (
    ctx.hasCredibleAlternative === false &&
    ctx.incumbentVendorId !== undefined
  ) {
    risks.push({
      title: 'No credible alternative to the incumbent',
      rationale: 'This is an incumbent re-compete with no deal-ready alternative. Without competitive tension the buyer has little leverage and the incumbent knows it — a structurally weak negotiating position.',
      mitigationAsk: 'Either qualify a credible alternative before negotiating, or be explicit internally that this is a renewal, not a competition, and set expectations accordingly.',
      severity: 'moderate',
    });
  }

  return risks.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === 'high' ? -1 : 1,
  );
}

// ── Concessions to trade ─────────────────────────────────────────────────────

function buildConcessions(input: NegotiationPostureInput): ConcessionToTrade[] {
  const ctx: NegotiationContext = input.context ?? {};
  const concessions: ConcessionToTrade[] = [];

  if (ctx.multiYearCommitmentPossible) {
    concessions.push({
      title: 'Multi-year term commitment',
      buyerCost: 'Low if exit and portability clauses are sound — the buyer keeps a clean way out.',
      vendorValue: 'High: multi-year bookings improve the vendor’s revenue predictability and salesperson commission.',
      tradeFor: 'A should-cost-aligned price, a locked escalation cap, and the §6 must-have clauses.',
    });
  }

  if (ctx.referenceValueHigh) {
    concessions.push({
      title: 'Reference-logo and case-study rights',
      buyerCost: 'Low: a controlled, approval-gated reference costs the buyer time, not money.',
      vendorValue: 'High: a marquee logo accelerates the vendor’s pipeline and is worth real discount.',
      tradeFor: 'Incremental price reduction or fee waivers — never give reference rights away unpriced.',
    });
  }

  // Predictable payment cadence is almost always cheap for the buyer to offer.
  concessions.push({
    title: 'Faster or milestone-front-loaded payment schedule',
    buyerCost: 'Low-to-moderate: a working-capital cost the buyer can quantify against treasury rates.',
    vendorValue: 'Moderate: improved cash flow and DSO matter to the vendor’s finance team.',
    tradeFor: 'A price reduction at least equal to the buyer’s working-capital cost of the acceleration.',
  });

  // Scope flexibility — phasing — is cheap when the buyer controls sequencing.
  concessions.push({
    title: 'Phased rollout the vendor can resource smoothly',
    buyerCost: 'Low when the buyer controls sequencing — phasing can match the buyer’s own change capacity.',
    vendorValue: 'Moderate: predictable, smoothed delivery demand is easier for the vendor to staff.',
    tradeFor: 'Better blended rates or waived ramp/transition fees on the later phases.',
  });

  if (ctx.decisionWindowMonths !== undefined && ctx.decisionWindowMonths > 3) {
    concessions.push({
      title: 'Flexible signature timing aligned to the vendor’s quarter-end',
      buyerCost: 'None: the buyer has runway and can choose when to close.',
      vendorValue: 'High: closing the deal in the vendor’s fiscal quarter helps it hit its number.',
      tradeFor: 'An additional discount the vendor books against its own quarter-end incentive.',
    });
  }

  return concessions;
}

// ── Incumbent leverage ───────────────────────────────────────────────────────

function buildIncumbentLeverage(
  input: NegotiationPostureInput,
): IncumbentLeverage {
  const ctx: NegotiationContext = input.context ?? {};
  const { shouldCost } = input;

  if (ctx.incumbentVendorId === undefined) {
    return {
      hasIncumbent: false,
      leverageHolder: 'buyer',
      assessment:
        'This is not an incumbent re-compete — there is no switching cost weighing on the buyer, so the buyer keeps full competitive freedom.',
      recommendedPlay:
        'Run a genuine competition to the end; the absence of switching cost is itself a lever — every vendor knows the buyer can walk.',
    };
  }

  // Exit/transition layer from the should-cost model proxies switching cost.
  const exitLayer = shouldCost.icebergLayers.find(
    (l) => l.layer === 'exit_transition',
  );
  const switchingCost = exitLayer ? exitLayer.point : 0;
  const hasAlt = ctx.hasCredibleAlternative === true;

  if (hasAlt) {
    return {
      hasIncumbent: true,
      leverageHolder: 'buyer',
      assessment: `There is an incumbent, but a credible alternative is deal-ready. The modelled exit/transition cost of ${usd(switchingCost)} is a real but bounded switching cost — with a live alternative the competitive tension outweighs it and leverage sits with the buyer.`,
      recommendedPlay:
        'Make the incumbent earn the renewal: require it to match the alternative on price and the §6 clauses, and be visibly willing to switch.',
    };
  }

  return {
    hasIncumbent: true,
    leverageHolder: switchingCost > 0 ? 'vendor' : 'balanced',
    assessment: `There is an incumbent and no confirmed alternative. The modelled exit/transition cost of ${usd(switchingCost)} is switching cost the incumbent can lean on — leverage tilts to the vendor until the buyer creates competitive tension.`,
    recommendedPlay:
      'Qualify a credible alternative before negotiating hard; failing that, lean on multi-year and reference value, and use the should-cost model to challenge the incumbent’s hidden-layer loading rather than the headline price.',
  };
}

// ── Clause issues (methodology §6) ───────────────────────────────────────────

function buildClauseIssues(input: NegotiationPostureInput): ClauseIssue[] {
  const { proposalMatrix } = input;
  const ctx: NegotiationContext = input.context ?? {};

  /** A dimension is "weak" if the preferred vendor is unfavorable/undisclosed. */
  const dimensionWeak = (key: string): boolean => {
    const cell = preferredCell(proposalMatrix.rows, key, ctx.preferredVendorId);
    if (!cell) return false;
    return cell.stance === 'unfavorable' || !cell.disclosed;
  };

  const issues: ClauseIssue[] = AI_CLAUSE_LIBRARY.map((entry) => {
    const surfacedByMatrix = entry.matrixSignalDimensions.some((d) =>
      dimensionWeak(d),
    );
    return {
      clause: entry.clause,
      whyItMatters: entry.whyItMatters,
      surfacedByMatrix,
      ask: entry.ask,
      priority: entry.priority,
    };
  });

  // Must-haves first; within a tier, the matrix-surfaced issues lead because
  // the proposal data already proves they are live for this deal.
  return issues.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === 'must_have' ? -1 : 1;
    }
    if (a.surfacedByMatrix !== b.surfacedByMatrix) {
      return a.surfacedByMatrix ? -1 : 1;
    }
    return 0;
  });
}

// ── Public entrypoint ────────────────────────────────────────────────────────

/**
 * Build a negotiation posture from a should-cost estimate and a proposal-
 * normalization matrix. Pure and deterministic — the same input always yields
 * the same output; no model calls, no clock, no I/O.
 */
export function buildNegotiationPosture(
  input: NegotiationPostureInput,
): NegotiationPosture {
  const levers = buildLevers(input);
  const walkAwayRisks = buildWalkAwayRisks(input);
  const concessions = buildConcessions(input);
  const incumbentLeverage = buildIncumbentLeverage(input);
  const clauseIssues = buildClauseIssues(input);

  const strongLevers = levers.filter((l) => l.strength === 'strong').length;
  const highRisks = walkAwayRisks.filter((r) => r.severity === 'high').length;
  const surfacedClauses = clauseIssues.filter((c) => c.surfacedByMatrix).length;

  const headline =
    `${input.shouldCost.headline} ` +
    `Posture: ${strongLevers} strong lever(s) in hand` +
    (highRisks > 0
      ? `, but ${highRisks} non-negotiable walk-away risk(s) must be retired before signature.`
      : ' and no hard walk-away risks — negotiate from strength.');

  let recommendedOpening: string;
  if (highRisks > 0) {
    const topRisk = walkAwayRisks[0];
    recommendedOpening = `Do not negotiate price first. Open by making award contingent on retiring the highest walk-away risk — ${topRisk.title.toLowerCase()} — then anchor on the modelled should-cost range and require the §6 must-have clauses.`;
  } else if (strongLevers > 0) {
    recommendedOpening = `Lead with the strongest lever — ${levers[0].title.toLowerCase()} — anchor the room on the should-cost range rather than the vendor quote, and table the §6 must-have clauses as non-negotiable.`;
  } else {
    recommendedOpening = `Leverage is thin: focus on closing the ${surfacedClauses} matrix-surfaced clause gap(s) and on converting open-ended consumption into a capped, predictable price rather than pressing hard on headline discount.`;
  }

  return {
    dealLabel: input.dealLabel,
    modelVersion: '1.0',
    generatedAt: input.generatedAt ?? FALLBACK_GENERATED_AT,
    headline,
    levers,
    walkAwayRisks,
    concessions,
    incumbentLeverage,
    clauseIssues,
    recommendedOpening,
  };
}
