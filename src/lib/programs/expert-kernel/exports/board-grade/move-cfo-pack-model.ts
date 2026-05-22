// Generic Move CFO Pack — view-model.
//
// The Apex reference CFO Pack (`cfo-pack-model.ts`) projects a financial
// challenge deck from the hand-authored Apex Contact Center case. This module
// is its generic sibling: it projects a board-grade CFO Pack from
// `buildMoveBusinessCase(move)` — the kernel run for a REAL, originated Move.
//
// The two seams it honours, exactly as the established pattern requires:
//   • the kernel `skeleton` (a `BusinessCaseSkeleton` from `compileBusinessCase`)
//     drives the funding ask, the downside, the kill triggers, the Tower
//     measurement and the verdict — every figure traces to a kernel field, no
//     number is fabricated;
//   • the binding's `seedGaps` drive the evidence/gap audit and the
//     monetisation gaps — the precise, named seed gaps inherited from the
//     curated Function Pack are rendered honestly, never blank.
//
// HONESTY DISCIPLINE (mandatory): the verdict shown is the kernel's REAL
// recommendation (`fund` / `shape` / `kill`) — never a fabricated `go`. The CFO
// Pack reads as a FINANCIAL CHALLENGE, not product advocacy: the do-not-fund
// holdbacks and the downside case are first-class. When a Move binds no curated
// pack, `buildMoveCfoPack` returns an honest UNBOUND result (`bound:false`) —
// the renderer shows the honest "no curated Function Pack" state, never a fake
// CFO pack.
//
// `buildApexCfoPack` is left intact as the reference implementation — this
// module is added alongside it, not in place of it.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import type {
  BusinessCaseSkeleton,
  Recommendation,
} from '../../business-case-compiler';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex CFO Pack's `CfoSectionAnatomy` so the
// generic deck reuses the same shell scaffold (`slideShell`, footer facts).
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MoveCfoEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex CFO Pack. */
export interface MoveCfoSectionAnatomy {
  /** Section number among the deck's section slides. */
  page: number;
  /** Anchor id for the deck slide. */
  id: string;
  /** Short menu / eyebrow label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view. */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: MoveCfoEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic CFO Pack view-model.
// ---------------------------------------------------------------------------

export type MoveCfoVerdict = Recommendation;

/**
 * The generic Move CFO Pack — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields `MoveCfoUnboundResult`
 * instead. The discriminated union (`MoveCfoPackResult`) lets the renderer
 * branch honestly.
 */
export interface MoveCfoPack {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The kernel verdict — the REAL recommendation, never fabricated. */
  verdict: MoveCfoVerdict;
  /** True when value rests on a seed-gap proxy — payback cannot be claimed. */
  monetisationBlocked: boolean;
  /** The seven sections, page-ordered. */
  sections: MoveCfoSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated CFO pack.
 */
export interface MoveCfoUnboundResult {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveCfoPackResult = MoveCfoPack | MoveCfoUnboundResult;

export interface MoveCfoSections {
  /** §1 — the answer: what is finance asked to approve? */
  theAnswer: MoveCfoAnswerSection;
  /** §2 — the case: why does this create value? */
  theCase: MoveCfoCaseSection;
  /** §3 — assumptions: the top five case-moving assumptions, owned. */
  assumptions: MoveCfoAssumptionsSection;
  /** §4 — what would make it wrong: the downside, breakpoints, gaps. */
  whatWouldMakeItWrong: MoveCfoWrongSection;
  /** §5 — what not to fund yet: the do-not-fund holdbacks. */
  whatNotToFundYet: MoveCfoHoldbackSection;
  /** §6 — what Tower will measure: metrics, baseline, readiness. */
  towerMeasurement: MoveCfoTowerSection;
  /** §7 — evidence and gaps: the source ledger and the seed gaps. */
  evidenceAndGaps: MoveCfoEvidenceSection;
}

// --- §1 The answer ----------------------------------------------------------

export interface MoveCfoAnswerSection {
  anatomy: MoveCfoSectionAnatomy;
  /** The verdict word, plain — APPROVE SHAPING / APPROVE CAPITAL / REJECT. */
  verdictHeadline: string;
  verdictDetail: string;
  /** What finance is being asked to approve now — stated plainly. */
  fundingAsk: string;
  /** The single open blocker that gates capital approval. */
  blocker: string;
  /** Economics tiles — verdict, investment, value, payback, gate. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** Honesty notes raised while deriving the kernel inputs. */
  derivationNotes: string[];
}

// --- §2 The case ------------------------------------------------------------

export interface MoveCfoCaseSection {
  anatomy: MoveCfoSectionAnatomy;
  investmentLow: number;
  investmentPoint: number;
  investmentHigh: number;
  netValueLow: number;
  netValuePoint: number;
  netValueHigh: number;
  /** Payback status — null months means not computable. */
  paybackMonths: number | null;
  /** Where the value comes from — stated plainly. */
  valueSource: string;
}

// --- §3 Assumptions ---------------------------------------------------------

export interface MoveCfoAssumptionsSection {
  anatomy: MoveCfoSectionAnatomy;
  /** The top five case-moving assumptions, owned. */
  assumptions: Array<{
    rank: number;
    key: string;
    statement: string;
    owner: string;
    confidence: 'high' | 'medium' | 'low';
    sensitivityImpact: 'high' | 'medium' | 'low';
    isSeedGapProxy: boolean;
    source: string;
  }>;
  /** Count of top-five assumptions that are seed-gap proxies. */
  proxyCount: number;
}

// --- §4 What would make it wrong --------------------------------------------

export interface MoveCfoWrongSection {
  anatomy: MoveCfoSectionAnatomy;
  /** The single statement of what breaks the case. */
  whatBreaksTheCase: string;
  /** The downside read — the conservative case in plain words. */
  downsideRead: string;
  conservativeNetReturn: number;
  baseNetReturn: number;
  upsideNetReturn: number;
  /** Tornado drivers — the assumptions that swing the case. */
  drivers: Array<{ label: string; swing: number; isProxy: boolean }>;
  /** The monetisation gaps — the seed gaps that block a hard return. */
  monetisationGaps: string[];
}

// --- §5 What not to fund yet ------------------------------------------------

export interface MoveCfoHoldbackSection {
  anatomy: MoveCfoSectionAnatomy;
  /** The do-not-fund checklist — what finance should withhold. */
  holdbacks: Array<{
    title: string;
    detail: string;
    /** The condition that releases the holdback. */
    releaseCondition: string;
    owner: string;
  }>;
}

// --- §6 What Tower will measure ---------------------------------------------

export interface MoveCfoTowerSection {
  anatomy: MoveCfoSectionAnatomy;
  /** The Tower measurement table — metric, baseline, readiness. */
  metrics: Array<{
    metric: string;
    baseline: string;
    unit: string;
    owner: string;
    readiness: string;
    /** True when the metric rests on a seed gap and is not yet measurable. */
    isSeedGap: boolean;
  }>;
}

// --- §7 Evidence and gaps ---------------------------------------------------

export interface MoveCfoEvidenceSection {
  anatomy: MoveCfoSectionAnatomy;
  recordedCount: number;
  gapCount: number;
  coveragePct: number;
  /** The source ledger — every recorded metric's provenance. */
  sources: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  /** The precise seed gaps inherited from the binding — never blank. */
  seedGaps: Array<{
    metric: string;
    reason: string;
    expectedDataSource: string;
  }>;
  /** Recorded and seed-gap rows for the evidence/gap matrix. */
  matrix: Array<{ label: string; recorded: boolean; detail: string }>;
  /** Assumption provenance notes carried into the funding decision. */
  provenance: Array<{ note: string; basis: string }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the CFO Pack. */
const ARTIFACT_LABEL = 'CFO Pack';

/**
 * Build the generic Move CFO Pack view-model.
 *
 * Runs `buildMoveBusinessCase(move)`. When the Move binds a curated pack and
 * the kernel produces a real skeleton, projects the bound CFO Pack. When the
 * Move is unbound, returns the honest `MoveCfoUnboundResult` — never a
 * fabricated deck.
 *
 * Deterministic — same Move + `generatedOn` → same result.
 */
export function buildMoveCfoPack(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveCfoPackResult {
  const result = buildMoveBusinessCase(move);
  const moveLabel = readMoveLabel(move, result.binding);

  // Unbound — the honest dead end. No curated depth, no kernel skeleton.
  if (!result.bound || !result.skeleton) {
    return {
      bound: false,
      moveLabel,
      generatedOn,
      unboundReason: result.unboundReason,
    };
  }

  const skeleton = result.skeleton;
  const binding = result.binding;
  const monetisationBlocked = !skeleton.economics.monetisable;
  const functionLabel = binding.functionLabel ?? 'this function';
  const verdict = skeleton.recommendation;

  const theAnswer = buildAnswer(
    skeleton,
    generatedOn,
    monetisationBlocked,
    result.derivationNotes,
  );
  const theCase = buildCase(skeleton, generatedOn, monetisationBlocked);
  const assumptions = buildAssumptions(skeleton, generatedOn);
  const whatWouldMakeItWrong = buildWrong(
    skeleton,
    binding,
    generatedOn,
    monetisationBlocked,
  );
  const whatNotToFundYet = buildHoldbacks(
    skeleton,
    binding,
    generatedOn,
    monetisationBlocked,
    functionLabel,
  );
  const towerMeasurement = buildTower(skeleton, generatedOn);
  const evidenceAndGaps = buildEvidence(skeleton, binding, generatedOn);

  const sections: MoveCfoSections = {
    theAnswer,
    theCase,
    assumptions,
    whatWouldMakeItWrong,
    whatNotToFundYet,
    towerMeasurement,
    evidenceAndGaps,
  };

  const ordered: MoveCfoSectionAnatomy[] = [
    theAnswer.anatomy,
    theCase.anatomy,
    assumptions.anatomy,
    whatWouldMakeItWrong.anatomy,
    whatNotToFundYet.anatomy,
    towerMeasurement.anatomy,
    evidenceAndGaps.anatomy,
  ];

  return {
    bound: true,
    tenantLabel: skeleton.tenantKey,
    tenantKey: skeleton.tenantKey,
    moveLabel,
    artifactLabel: ARTIFACT_LABEL,
    functionLabel,
    generatedOn,
    verdict,
    monetisationBlocked,
    sections,
    toc: ordered.map((a) => ({
      page: a.page,
      id: a.id,
      label: a.navLabel,
      takeaway: a.takeaway,
    })),
  };
}

// ---------------------------------------------------------------------------
// Section builders.
// ---------------------------------------------------------------------------

function buildAnswer(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
  derivationNotes: string[],
): MoveCfoAnswerSection {
  const verdict = skeleton.recommendation;
  const seedGapLabels = skeleton.baseline.seedGaps.map((g) => g.label);
  const primaryBlocker = skeleton.critic.blockers[0]?.message ?? '';

  return {
    anatomy: {
      page: 1,
      id: 'the-answer',
      navLabel: 'The answer',
      takeaway: verdictTakeaway(verdict, monetisationBlocked),
      decisionRole:
        'Approve the funding the kernel verdict supports, reject, or request ' +
        'the evidence that closes the open blocker.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case compiler + critic',
          'The Move’s recorded data + its bound Domain Function Pack',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: monetisationBlocked
          ? ['Monetisation blocker — the return is unverifiable until closed']
          : seedGapLabels,
      },
      implication:
        'The verdict is the kernel’s real recommendation — it is read, not ' +
        'negotiated. Capital approval is conditional on the open blocker and ' +
        'the seed gaps closing.',
      owner: 'CFO · Finance Committee',
      nextGate: 'The next phase gate for this Move — a conditional decision',
    },
    verdictHeadline: verdictHeadlineText(verdict, monetisationBlocked),
    verdictDetail: skeleton.recommendationRationale,
    fundingAsk: fundingAskText(verdict, monetisationBlocked),
    blocker:
      primaryBlocker ||
      (monetisationBlocked
        ? 'Monetisation is blocked — gross value rests on a curated benchmark ' +
          'proxy (a seed gap), so the net return cannot be expressed as a ' +
          'hard, auditable dollar figure.'
        : 'No critic blocker — the kernel raised no funding-blocking finding.'),
    tiles: [
      {
        label: 'Finance verdict',
        value:
          verdict === 'shape'
            ? 'SHAPING'
            : verdict === 'fund'
              ? 'CAPITAL'
              : 'REJECT',
        sub:
          verdict === 'shape'
            ? 'Approve shaping, not capital'
            : verdict === 'fund'
              ? 'Capital approvable'
              : 'Do not fund',
        tone: verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn',
      },
      {
        label: 'Investment',
        value: `${compact(skeleton.economics.investment.low)}–${compact(
          skeleton.economics.investment.high,
        )}`,
        sub: 'Planning range — never a point',
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr)',
        value: `${compact(skeleton.valueRange.low)}–${compact(
          skeleton.valueRange.high,
        )}`,
        sub: monetisationBlocked
          ? 'Proxy ceiling — not a verified return'
          : 'Post-haircut planning range',
        tone: monetisationBlocked ? 'warn' : 'good',
      },
      {
        label: 'Payback',
        value:
          skeleton.economics.paybackMonths === null
            ? 'Blocked'
            : `${skeleton.economics.paybackMonths} mo`,
        sub:
          skeleton.economics.paybackMonths === null
            ? 'Monetisation seed gap open'
            : 'Base case',
        tone: skeleton.economics.paybackMonths === null ? 'bad' : 'good',
      },
      {
        label: 'Open blockers',
        value: String(skeleton.critic.blockers.length),
        sub: `${skeleton.baseline.seedGaps.length} seed gaps`,
        tone: skeleton.critic.blockers.length > 0 ? 'warn' : 'good',
      },
    ],
    derivationNotes,
  };
}

function buildCase(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveCfoCaseSection {
  return {
    anatomy: {
      page: 2,
      id: 'the-case',
      navLabel: 'The case',
      takeaway: monetisationBlocked
        ? 'The value is a planning range built on curated benchmark proxies — ' +
          'the net is a proxy ceiling, not a verified return, because the ' +
          'unit economics are a seed gap.'
        : `Net 3-year value lands at ${compact(skeleton.valueRange.point)} ` +
          'after the mandatory six-factor haircut — investment is a planning ' +
          'range, not a quote.',
      decisionRole:
        'Test whether the case creates verifiable value, not advocacy.',
      evidence: {
        sources: [
          'Moves Expert Kernel — value forecast (six-factor haircut)',
          'Moves Expert Kernel — effort estimator (eight workstreams)',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: monetisationBlocked
          ? [
              'The gross value rests on the Function Pack’s curated benchmark ' +
                'ranges — a planning proxy until the tenant’s spend base lands.',
            ]
          : [],
      },
      implication: monetisationBlocked
        ? 'The case is fundable to SHAPE, not to build — the value cannot be ' +
          'verified until the unit economics land.'
        : 'The net value is a defensible planning figure for the funding ' +
          'decision.',
      owner: 'Move sponsor (to be confirmed with the tenant) · CFO',
      nextGate: 'The next gate — value re-expressed against measured tenant data',
    },
    investmentLow: skeleton.economics.investment.low,
    investmentPoint: skeleton.economics.investment.point,
    investmentHigh: skeleton.economics.investment.high,
    netValueLow: skeleton.valueRange.low,
    netValuePoint: skeleton.valueRange.point,
    netValueHigh: skeleton.valueRange.high,
    paybackMonths: skeleton.economics.paybackMonths,
    valueSource:
      'Value is built from the curated Function-Pack value benchmarks — ' +
      'labelled planning ranges — and discounted by the mandatory six-factor ' +
      'haircut. The dollar conversion needs the tenant’s own spend base and ' +
      'the seed-gapped operating metrics; until those land, the value is a ' +
      'planning proxy, not a forecast.',
  };
}

function buildAssumptions(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveCfoAssumptionsSection {
  const ledger = skeleton.assumptions;
  const topFive = ledger.byImpact.slice(0, 5);
  return {
    anatomy: {
      page: 3,
      id: 'assumptions',
      navLabel: 'Assumptions',
      takeaway:
        'The case-moving assumptions are ranked by sensitivity — the seed-gap ' +
        'proxies are the highest-leverage evidence the funding spend must ' +
        'replace with measured tenant data.',
      decisionRole:
        'Confirm every case-moving assumption is owned and challengeable.',
      evidence: {
        sources: [
          'Moves Expert Kernel — assumption ledger (ranked by sensitivity)',
          'The bound Domain Function Pack — haircut factors + evidence anchors',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: ledger.seedGapProxies
          .slice(0, 3)
          .map((a) => `${a.key} — a seed-gap proxy until tenant data lands`),
      },
      implication:
        'No assumption is unowned; the seed-gap proxies are the highest-' +
        'leverage evidence the funding spend must close.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The next gate — proxies replaced with measured tenant data',
    },
    assumptions: topFive.map((a, i) => ({
      rank: i + 1,
      key: a.key,
      statement: a.statement,
      owner: a.owner,
      confidence: a.confidence,
      sensitivityImpact: a.sensitivityImpact,
      isSeedGapProxy: a.isSeedGapProxy,
      source: a.source,
    })),
    proxyCount: topFive.filter((a) => a.isSeedGapProxy).length,
  };
}

function buildWrong(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveCfoWrongSection {
  // The monetisation gaps are the binding's precise seed gaps — each names the
  // metric and where it is sourced. Never blank, never fabricated.
  const monetisationGaps = binding.seedGaps
    .slice(0, 4)
    .map((g) => `${g.metricName} — ${g.gapStatement}`);

  return {
    anatomy: {
      page: 4,
      id: 'what-would-make-it-wrong',
      navLabel: 'What would make it wrong',
      takeaway: monetisationBlocked
        ? 'The case breaks the same way it is built — on the missing unit ' +
          'economics. Until the seed gaps close, every dollar in the case is ' +
          'a proxy, not a forecast.'
        : 'A CFO Pack shows what breaks the case before the upside — the ' +
          'widest movers below are the assumptions to validate before funding.',
      decisionRole:
        'See the downside, the breakpoints and the monetisation gaps before ' +
        'committing capital.',
      evidence: {
        sources: [
          'Moves Expert Kernel — sensitivity view + critic',
          'Moves Expert Kernel — value forecast haircut factors',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: monetisationBlocked
          ? ['Monetisation seed gap — the single biggest case breaker']
          : skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication: monetisationBlocked
        ? 'The downside is not a number yet — it is a proxy. That is itself ' +
          'the reason capital is withheld.'
        : 'The downside is a defensible range; the case-moving assumptions ' +
          'are the things to validate before the funding gate.',
      owner: 'CFO · Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The next gate — downside re-modelled on measured economics',
    },
    whatBreaksTheCase: skeleton.sensitivity.whatBreaksTheCase,
    downsideRead: monetisationBlocked
      ? 'The conservative case cannot be expressed in hard dollars — the value ' +
        'rests on a seed-gap proxy. A CFO funds the downside, not the point ' +
        'estimate; this case has no verifiable downside until the baseline ' +
        'gaps close. That is a withhold-capital signal, not a fund signal.'
      : 'The conservative scenario is the figure a CFO funds against — it is ' +
        'a planning range, honestly discounted, not a single-point estimate.',
    conservativeNetReturn: skeleton.sensitivity.conservative.point,
    baseNetReturn: skeleton.sensitivity.base.point,
    upsideNetReturn: skeleton.sensitivity.upside.point,
    drivers: skeleton.assumptions.byImpact.map((a) => ({
      label: assumptionShortLabel(a.key, a.statement),
      swing:
        a.sensitivityImpact === 'high'
          ? a.isSeedGapProxy
            ? 100
            : 78
          : a.sensitivityImpact === 'medium'
            ? 58
            : 26,
      isProxy: a.isSeedGapProxy,
    })),
    monetisationGaps:
      monetisationGaps.length > 0
        ? monetisationGaps
        : [
            'No seed-gapped metric blocks a hard return — the case rests on ' +
              'recorded tenant data, with the value still discounted by the ' +
              'mandatory six-factor haircut.',
          ],
  };
}

function buildHoldbacks(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
  monetisationBlocked: boolean,
  functionLabel: string,
): MoveCfoHoldbackSection {
  const seedGapLabels = skeleton.baseline.seedGaps.map((g) => g.label);
  const tenantOwner = 'Move sponsor (to be confirmed with the tenant)';

  // The holdbacks are derived from the kernel's real findings — the verdict,
  // the monetisation block, the kill criteria and the seed gaps. None is
  // fabricated; each carries a release condition tied to a real kernel signal.
  const holdbacks: MoveCfoHoldbackSection['holdbacks'] = [];

  // (1) Build / capital funding — withheld unless the verdict is `fund`.
  if (skeleton.recommendation !== 'fund') {
    holdbacks.push({
      title: 'Build / capital funding',
      detail:
        `Do not approve capital for the ${functionLabel} build. The kernel ` +
        `verdict is ${skeleton.recommendation.toUpperCase()} — a costed ` +
        'roadmap exists, but the case does not yet clear the critic for a ' +
        'capital commitment.',
      releaseCondition:
        'The kernel verdict moves to FUND once the named blockers and seed ' +
        'gaps close and the case is re-run.',
      owner: tenantOwner,
    });
  }

  // (2) Any value claim in dollars — withheld while monetisation is blocked.
  if (monetisationBlocked) {
    holdbacks.push({
      title: 'Any value claim in dollars',
      detail:
        'Do not let the case be quoted as a dollar return. Gross value rests ' +
        'on the Function Pack’s curated benchmark proxies; the net is a proxy ' +
        'ceiling, not a forecast.',
      releaseCondition:
        'The seed-gapped operating metrics close and the tenant’s own spend ' +
        'base is supplied — then the value forecast can be stated in hard ' +
        'dollars.',
      owner: tenantOwner,
    });
  }

  // (3) Each kill criterion is a thing finance must not let the Move drift
  // past — surfaced as an explicit holdback.
  for (const kill of skeleton.killCriteria.slice(0, 2)) {
    holdbacks.push({
      title: 'Scope past a kill criterion',
      detail:
        'Do not let the Move proceed past a kernel kill criterion without a ' +
        `re-decision. Kill criterion: ${kill.condition}`,
      releaseCondition:
        'Only after the kill criterion is explicitly cleared and the case ' +
        're-run against the new evidence.',
      owner: tenantOwner,
    });
  }

  // (4) When the binding has unrecorded metrics, the baseline itself is a
  // holdback — the case cannot be funded against an incomplete baseline.
  if (binding.seedGaps.length > 0) {
    const firstGap = binding.seedGaps[0];
    holdbacks.push({
      title: 'Funding against an incomplete baseline',
      detail:
        `Do not fund against the current baseline — ${binding.seedGaps.length} ` +
        `operating metric(s) the curated ${functionLabel} pack expects are ` +
        `not recorded by the Move (e.g. ${firstGap.metricName}).`,
      releaseCondition:
        `The seed-gapped metrics are captured from their named data sources ` +
        `(e.g. ${firstGap.expectedDataSource}) before the funding gate.`,
      owner: tenantOwner,
    });
  }

  // Honest floor — a CFO Pack without a holdback list is a hard fail. If the
  // kernel raised none of the above (a clean `fund` with full coverage), name
  // the standing holdback every Move carries: the planning-grade estimate.
  if (holdbacks.length === 0) {
    holdbacks.push({
      title: 'Treating the estimate as a quote',
      detail:
        'Do not treat the investment range as a committed quote. It is a ' +
        'planning estimate derived from the Function Pack archetypes on a ' +
        'researched benchmark rate card.',
      releaseCondition:
        'A client-specific estimate replaces the planning rate card before ' +
        'any capital commitment.',
      owner: tenantOwner,
    });
  }

  return {
    anatomy: {
      page: 5,
      id: 'what-not-to-fund-yet',
      navLabel: 'What not to fund yet',
      takeaway:
        `${holdbacks.length} thing${holdbacks.length === 1 ? '' : 's'} must ` +
        'be explicitly withheld at this gate — each with the condition that ' +
        'releases it. A CFO Pack without an explicit holdback list is a hard ' +
        'fail.',
      decisionRole: 'Decide what scope finance withholds at this gate.',
      evidence: {
        sources: [
          'Moves Expert Kernel — kill criteria + critic blockers',
          'The bound Domain Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'A CFO Pack without an explicit holdback list is a hard fail — these ' +
        'are the holdbacks, each released only against its stated condition.',
      owner: 'CFO · Finance Committee',
      nextGate: 'The next gate — each holdback released against its condition',
    },
    holdbacks,
  };
}

function buildTower(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveCfoTowerSection {
  return {
    anatomy: {
      page: 6,
      id: 'tower-measurement',
      navLabel: 'What Tower will measure',
      takeaway:
        'Value will be proven, not asserted — every metric with a recorded ' +
        'baseline is measurable from day one; the seed-gapped metrics are ' +
        'honestly carried as not-yet-measurable.',
      decisionRole:
        'Confirm value will be proven, not asserted, after funding.',
      evidence: {
        sources: [
          'Moves Expert Kernel — Tower measurement handoff',
          'The Move’s recorded baseline + the Function Pack operating metrics',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: skeleton.towerHandoff
          .filter((t) => t.baselineValue === null)
          .map((t) => `${t.metricLabel} — Tower cannot verify until captured`),
      },
      implication:
        'Tower can verify value on every recorded metric from day one; the ' +
        'seed-gapped metrics are unwired until their gaps close.',
      owner: 'Move sponsor (to be confirmed with the tenant) · Tower',
      nextGate: 'Tower handoff — forecast-to-actual once the Move is live',
    },
    metrics: skeleton.towerHandoff.map((t) => {
      const isSeedGap = t.baselineValue === null;
      return {
        metric: t.metricLabel,
        baseline: isSeedGap
          ? 'Not recorded — seed gap'
          : `${t.baselineValue} ${t.unit}`,
        unit: t.unit,
        owner: 'Move sponsor (to be confirmed with the tenant)',
        readiness: t.readinessNote,
        isSeedGap,
      };
    }),
  };
}

function buildEvidence(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveCfoEvidenceSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  // The matrix reuses the binding's precise seed gaps so each gap names what
  // the metric is and where it is sourced.
  const seedGapByKey = new Map(binding.seedGaps.map((g) => [g.metricKey, g]));

  const matrix: Array<{ label: string; recorded: boolean; detail: string }> = [
    ...recorded.map((m) => ({
      label: m.label,
      recorded: true,
      detail: `${m.value} ${m.unit} · ${m.source} · ${m.confidence}`,
    })),
    ...seedGaps.map((m) => ({
      label: m.label,
      recorded: false,
      detail:
        seedGapByKey.get(m.key)?.gapStatement ??
        m.seedGapReason ??
        'Not recorded by the tenant.',
    })),
  ];

  return {
    anatomy: {
      page: 7,
      id: 'evidence-and-gaps',
      navLabel: 'Evidence and gaps',
      takeaway:
        `Finance can audit every number in this pack — ${recorded.length} ` +
        `metric${recorded.length === 1 ? '' : 's'} trace to a named source, ` +
        `and the ${seedGaps.length} missing one${
          seedGaps.length === 1 ? ' is a' : 's are'
        } declared seed gap${seedGaps.length === 1 ? '' : 's'}, never silent.`,
      decisionRole: 'Audit every claim back to a source or a declared gap.',
      evidence: {
        sources: [
          'The Move’s recorded baseline metrics',
          'The bound Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: coveragePct >= 60 ? 'medium' : 'low',
        gaps: seedGaps.map((g) => g.label),
      },
      implication:
        'The pack is auditable end to end; the seed gaps are the declared ' +
        'limits of what finance can verify today.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The next gate inherits this source ledger unchanged',
    },
    recordedCount: recorded.length,
    gapCount: seedGaps.length,
    coveragePct,
    sources: recorded.map((m) => ({
      metric: m.label,
      value: m.value === null ? '—' : `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
    })),
    seedGaps: binding.seedGaps.map((g) => ({
      metric: g.metricName,
      reason: g.gapStatement,
      expectedDataSource: g.expectedDataSource,
    })),
    matrix,
    provenance: [
      {
        note:
          'The gross value range is built from the Function Pack’s curated ' +
          'value benchmarks — labelled planning ranges, not the tenant’s own ' +
          'measured unit economics.',
        basis:
          'It is carried as a proxy; the value forecast flags monetisation as ' +
          'blocked until the tenant’s spend base lands. No hard return is ' +
          'claimed.',
      },
      {
        note:
          'The value forecast applies a mandatory six-factor haircut before ' +
          'any figure is reported.',
        basis: 'Gross value is never reported as net — the haircut is applied ' +
          'to every figure in this pack.',
      },
      {
        note:
          'The recommendation is the kernel critic verdict — a blocker ' +
          'downgrades the case from fund to shape or kill.',
        basis:
          skeleton.critic.blockers.length > 0
            ? `The critic raised ${skeleton.critic.blockers.length} ` +
              'blocker(s); the case is not advocacy, it is the critic-' +
              'challenged output.'
            : 'The critic raised no blocker; the verdict is the kernel’s ' +
              'unchallenged recommendation.',
      },
      {
        note:
          'The effort and cost figures are a planning range, not a quote.',
        basis:
          'They are derived from the Function Pack archetypes on a researched ' +
          'benchmark rate card and must be replaced with a client-specific ' +
          'estimate before any funding commitment.',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

/** The Move title — prefers the Move's own name, falls back to the function. */
function readMoveLabel(
  move: MoveBusinessCaseInput,
  binding: FunctionPackBinding,
): string {
  const name = typeof move.name === 'string' ? move.name.trim() : '';
  if (name) return name;
  if (binding.functionLabel) return `${binding.functionLabel} Move`;
  return 'Move';
}

/** The verdict takeaway — the kernel's REAL verdict, never a fabricated `go`. */
function verdictTakeaway(
  verdict: MoveCfoVerdict,
  monetisationBlocked: boolean,
): string {
  if (verdict === 'fund') {
    return 'Finance is asked to approve capital — the costed case clears the ' +
      'critic and the downside holds.';
  }
  if (verdict === 'kill') {
    return 'Finance should reject this Move — the case does not pay back on ' +
      'current evidence.';
  }
  return monetisationBlocked
    ? 'Finance is asked to approve shaping spend only — not capital. The ' +
        'monetisation blocker means the return cannot yet be verified, so ' +
        'capital approval is withheld.'
    : 'Finance is asked to approve shaping spend only — the case must be ' +
        'shaped to protect the floor before capital is committed.';
}

/** The verdict headline — the plain verdict word, never the word "go". */
function verdictHeadlineText(
  verdict: MoveCfoVerdict,
  monetisationBlocked: boolean,
): string {
  if (verdict === 'fund') {
    return 'APPROVE CAPITAL — FUND. The costed case clears the critic.';
  }
  if (verdict === 'kill') {
    return 'REJECT — KILL. The case does not pay back on current evidence.';
  }
  return monetisationBlocked
    ? 'APPROVE SHAPING SPEND ONLY — SHAPE. The return is not yet verifiable, ' +
        'so capital approval is withheld.'
    : 'APPROVE SHAPING SPEND ONLY — SHAPE. Shape the Move to protect the ' +
        'floor before capital is committed.';
}

/** What finance is being asked to approve now — stated plainly. */
function fundingAskText(
  verdict: MoveCfoVerdict,
  monetisationBlocked: boolean,
): string {
  if (verdict === 'fund') {
    return 'Approve the capital for the costed build. The case clears the ' +
      'critic; the holdbacks on this deck are the standing conditions, not ' +
      'open blockers.';
  }
  if (verdict === 'kill') {
    return 'Do not fund this Move. The case does not pay back on current ' +
      'evidence — re-present only if the assumptions that break it can be ' +
      'shown to be wrong.';
  }
  return monetisationBlocked
    ? 'Approve the shaping spend that closes the seed-gapped operating ' +
        'metrics and grounds the value forecast in measured tenant data. ' +
        'Capital for the build is a separate, conditional decision.'
    : 'Approve the shaping spend that validates the case-moving assumptions ' +
        'and protects the conservative floor. Capital for the build is a ' +
        'separate, conditional decision.';
}

/** Compact USD — kept local so the model has no chart-library dependency. */
function compact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `${sign}$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

/** A short label for an assumption — first clause of the statement. */
function assumptionShortLabel(key: string, statement: string): string {
  const firstClause = statement.split(/[:.—]/)[0]?.trim() ?? '';
  if (firstClause && firstClause.length <= 48) return firstClause;
  if (firstClause) return `${firstClause.slice(0, 45).trimEnd()}…`;
  return key;
}
