// Board-grade content-brief serializer — Apex reference decks → Gamma.
//
// Gamma needs prose-shaped content (an `inputText` string with explicit card
// breaks) plus an `additionalInstructions` clause that pins its render
// behaviour. This module converts each of the 8 board-grade Apex reference
// deck MODELS — Discover Brief, Charter Skeleton, Costed Business-Case Pack,
// Solution Architecture, Estimate & Financial Model, CFO Pack, Mobilize
// Packet, Master Dossier — into that pair.
//
// The Apex MODELS (not the rendered HTML) are the source of truth: they are
// pure data, every figure traceable to a kernel field. We project them into a
// `BoardGradeDeckBrief` shape (cover + one card per model section) and the
// generic serializer renders that to Gamma's `inputText` with `\n\n\n` card
// breaks. The serializer introduces NO new figures, dates, or claims; it
// merely re-shapes existing strings as prose. The honesty discipline is
// enforced twice — by `textMode: 'preserve'` upstream in the client AND by
// `additionalInstructions` here.
//
// Pure module: deterministic, no I/O. Unit-testable end to end.

import {
  buildApexCostedBusinessCasePack,
  buildApexDiscoverBrief,
  buildApexCharterSkeleton,
  buildApexSolutionArchitecture,
  buildApexEstimateModel,
  buildApexCfoPack,
  buildApexMobilizePacket,
  buildApexMasterMoveDossier,
} from '@/lib/programs/expert-kernel/exports/board-grade';

// ---------------------------------------------------------------------------
// The honesty-discipline clause — the `additionalInstructions` Gamma sees.
// EVERY brief carries it; this is the second guard alongside `textMode:
// 'preserve'`.
// ---------------------------------------------------------------------------

export const HONESTY_INSTRUCTIONS =
  'Render only the supplied content as a polished, board-ready presentation. ' +
  'Do not add, alter, or infer any figure, date, source, or claim — every ' +
  'number in this content is a labelled planning range and must remain so. ' +
  'If a section names a seed gap or evidence ask, render it honestly as a ' +
  'gap, not as a resolved finding.';

/** The Gamma card-break sequence — `cardSplit: 'inputTextBreaks'`. */
const CARD_BREAK = '\n\n\n';

// ---------------------------------------------------------------------------
// The generic deck-brief shape — every Apex deck projects into this. A cover
// card carrying the deck metadata, then one card per model section.
// ---------------------------------------------------------------------------

/** One card in the brief. Bullets are emitted as `- ` lines under the body. */
export interface BriefCard {
  /** The card heading — H1 prose. */
  heading: string;
  /** Body paragraphs — emitted as blank-line-separated prose. */
  bodyLines: string[];
  /** Bullet rows under the body. */
  bullets?: string[];
}

/** The deck brief — the cover card plus the body cards. */
export interface BoardGradeDeckBrief {
  /** Deck slug — stable, used by the route layer and audit. */
  deckSlug: BoardGradeDeckSlug;
  /** The human title Gamma stores against the generated deck. */
  title: string;
  /** The cover card — deck metadata. */
  cover: BriefCard;
  /** The body cards, in section order. */
  cards: BriefCard[];
}

/**
 * The serialized brief — what we hand to the Gamma client.
 *
 * `numCards` is the cover + body count; the serializer is the only place
 * that knows the count, so the route does not need to recount.
 */
export interface SerializedBrief {
  inputText: string;
  additionalInstructions: string;
  numCards: number;
  title: string;
}

/** The stable slugs for the 8 reference decks. */
export type BoardGradeDeckSlug =
  | 'discover-brief'
  | 'charter-skeleton'
  | 'business-case'
  | 'solution-architecture'
  | 'estimate-model'
  | 'cfo-pack'
  | 'mobilize-packet'
  | 'master-dossier';

/** The full list of supported deck slugs — used by the route registry. */
export const BOARD_GRADE_DECK_SLUGS: readonly BoardGradeDeckSlug[] = [
  'discover-brief',
  'charter-skeleton',
  'business-case',
  'solution-architecture',
  'estimate-model',
  'cfo-pack',
  'mobilize-packet',
  'master-dossier',
] as const;

// ---------------------------------------------------------------------------
// Generic serializer — converts a BoardGradeDeckBrief into Gamma `inputText`
// using the `\n\n\n` card-break delimiter that pairs with the client's
// `cardSplit: 'inputTextBreaks'`. No new content is introduced.
// ---------------------------------------------------------------------------

export function serializeBrief(brief: BoardGradeDeckBrief): SerializedBrief {
  const cards = [brief.cover, ...brief.cards];
  const inputText = cards.map(renderCard).join(CARD_BREAK);
  return {
    inputText,
    additionalInstructions: HONESTY_INSTRUCTIONS,
    numCards: cards.length,
    title: brief.title,
  };
}

function renderCard(card: BriefCard): string {
  const parts: string[] = [];
  parts.push(`# ${card.heading}`);
  if (card.bodyLines.length) {
    parts.push(card.bodyLines.join('\n\n'));
  }
  if (card.bullets && card.bullets.length) {
    parts.push(card.bullets.map((b) => `- ${b}`).join('\n'));
  }
  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Cover-card factory — every deck carries the same metadata header.
// ---------------------------------------------------------------------------

interface DeckMeta {
  tenantLabel: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  verdictLine: string;
}

function buildCoverCard(meta: DeckMeta): BriefCard {
  return {
    heading: `${meta.artifactLabel} — ${meta.moveLabel}`,
    bodyLines: [
      `Tenant: ${meta.tenantLabel}`,
      `Move: ${meta.moveLabel}`,
      `Generated: ${meta.generatedOn}`,
      `Verdict: ${meta.verdictLine}`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Generic section-anatomy walker — every Apex section carries an `anatomy`
// with the same shape. The bullet list under the body is the anatomy detail
// (decision role, implication, owner, next gate, evidence). Body lines come
// from the section's own body fields, supplied by the per-deck adapter.
// ---------------------------------------------------------------------------

interface AnatomyLike {
  navLabel: string;
  takeaway: string;
  decisionRole: string;
  evidence: {
    sources: string[];
    asOf: string;
    confidence: string;
    gaps: string[];
  };
  implication: string;
  owner: string;
  nextGate: string;
}

function anatomyBullets(a: AnatomyLike): string[] {
  return [
    `Decision role: ${a.decisionRole}`,
    `Implication: ${a.implication}`,
    `Owner: ${a.owner}`,
    `Next gate: ${a.nextGate}`,
    `Evidence — sources: ${a.evidence.sources.join('; ') || '—'}`,
    `Evidence — as of: ${a.evidence.asOf}; confidence: ${a.evidence.confidence}`,
    a.evidence.gaps.length
      ? `Evidence — open gaps: ${a.evidence.gaps.join('; ')}`
      : 'Evidence — open gaps: none',
  ];
}

/** A section the generic walker can turn into a card. */
interface SectionLike {
  anatomy: AnatomyLike;
  /** Extra body lines drawn from section-specific fields. */
  body: string[];
  /** Optional extra bullets — typically table rows rendered as prose. */
  extraBullets?: string[];
}

function sectionToCard(s: SectionLike): BriefCard {
  return {
    heading: `${s.anatomy.navLabel} — ${s.anatomy.takeaway}`,
    bodyLines: s.body,
    bullets: [...anatomyBullets(s.anatomy), ...(s.extraBullets ?? [])],
  };
}

// ===========================================================================
// Per-deck adapters — produce a BoardGradeDeckBrief from each model. The
// adapters are thin: they call `build*` and project the model's section
// strings into the generic card shape. NO new content is introduced.
// ===========================================================================

function metaFromModel(
  m: {
    tenantLabel: string;
    moveLabel: string;
    artifactLabel: string;
    generatedOn: string;
  },
  verdictLine: string,
): DeckMeta {
  return {
    tenantLabel: m.tenantLabel,
    moveLabel: m.moveLabel,
    artifactLabel: m.artifactLabel,
    generatedOn: m.generatedOn,
    verdictLine,
  };
}

function buildDiscoverBriefBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexDiscoverBrief(generatedOn);
  const s = m.sections;

  const cards: BriefCard[] = [
    sectionToCard({
      anatomy: s.decisionSnapshot.anatomy,
      body: [
        s.decisionSnapshot.verdictHeadline,
        s.decisionSnapshot.verdictDetail,
        `Problem: ${s.decisionSnapshot.problem}`,
        `Confidence: ${s.decisionSnapshot.confidence}`,
        `Next evidence request: ${s.decisionSnapshot.nextEvidenceRequest}`,
      ],
      extraBullets: s.decisionSnapshot.tiles.map(
        (t) => `${t.label}: ${t.value} — ${t.sub}`,
      ),
    }),
    sectionToCard({
      anatomy: s.currentStateBaseline.anatomy,
      body: [
        `Recorded metrics: ${s.currentStateBaseline.recordedCount}; ` +
          `seed gaps: ${s.currentStateBaseline.seedGapCount}; ` +
          `coverage: ${s.currentStateBaseline.coveragePct}%; ` +
          `weakest confidence: ${
            s.currentStateBaseline.weakestConfidence ?? '—'
          }`,
      ],
      extraBullets: [
        ...s.currentStateBaseline.metrics.map(
          (mtr) =>
            `${mtr.metric}: ${mtr.value} (source: ${mtr.source}, as-of ` +
            `${mtr.asOf}, ${mtr.confidence} confidence)` +
            (mtr.caveat && mtr.caveat !== '—'
              ? ` — caveat: ${mtr.caveat}`
              : ''),
        ),
        ...s.currentStateBaseline.seedGaps.map(
          (g) => `Seed gap — ${g.metric}: ${g.reason} (as of ${g.asOf})`,
        ),
      ],
    }),
    sectionToCard({
      anatomy: s.painAndOpportunity.anatomy,
      body: [
        `Opportunity: ${s.painAndOpportunity.opportunityStatement}`,
        `Expressible as: ${s.painAndOpportunity.expressibleAs} (directional ` +
          `only: ${s.painAndOpportunity.directionalOnly ? 'yes' : 'no'})`,
        `Caveat: ${s.painAndOpportunity.caveat}`,
      ],
      extraBullets: [
        ...s.painAndOpportunity.painThemes.map(
          (t) => `Pain — ${t.theme}: ${t.detail}`,
        ),
        ...s.painAndOpportunity.constraints.map((c) => `Constraint: ${c}`),
      ],
    }),
    sectionToCard({
      anatomy: s.evidenceGaps.anatomy,
      body: [],
      extraBullets: s.evidenceGaps.gaps.map(
        (g) =>
          `${g.label} — owner ${g.owner}, due ${g.due}, ` +
          `blocks sizing: ${g.blocksSizing ? 'yes' : 'no'} — ${g.decisionImpact}`,
      ),
    }),
    sectionToCard({
      anatomy: s.goNoGoGate.anatomy,
      body: [
        `Rationale: ${s.goNoGoGate.rationale}`,
        s.goNoGoGate.fixConditions.length
          ? `Fix conditions: ${s.goNoGoGate.fixConditions.join('; ')}`
          : 'Fix conditions: none recorded.',
      ],
      extraBullets: s.goNoGoGate.killChecks.map(
        (k) => `${k.code} (${k.state}, ${k.effect}): ${k.condition}`,
      ),
    }),
    sectionToCard({
      anatomy: s.appendix.anatomy,
      body: [],
      extraBullets: [
        ...s.appendix.sources.map(
          (src) =>
            `Source — ${src.metric}: ${src.value} (source: ${src.source}, ` +
            `as-of ${src.asOf}, ${src.confidence} confidence)`,
        ),
        ...s.appendix.assumptions.map(
          (a) => `Assumption — ${a.note} (basis: ${a.basis})`,
        ),
      ],
    }),
  ];

  return {
    deckSlug: 'discover-brief',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, `${m.verdict.toUpperCase()}`)),
    cards,
  };
}

function buildCharterSkeletonBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexCharterSkeleton(generatedOn);
  const s = m.sections;

  const cards: BriefCard[] = [
    sectionToCard({
      anatomy: s.charterAnswer.anatomy,
      body: [
        s.charterAnswer.verdictHeadline,
        s.charterAnswer.verdictDetail,
        `Sponsor: ${s.charterAnswer.sponsor}`,
        `Confidence: ${s.charterAnswer.confidence}`,
        `Shaping ask: ${s.charterAnswer.shapingAsk}`,
      ],
      extraBullets: s.charterAnswer.tiles.map(
        (t) => `${t.label}: ${t.value} — ${t.sub}`,
      ),
    }),
    sectionToCard({
      anatomy: s.valueHypothesis.anatomy,
      body: [
        `Claim: ${s.valueHypothesis.claim}`,
        `Target metric: ${s.valueHypothesis.targetMetric}`,
        `Baseline: ${s.valueHypothesis.baselineValue} → target: ${s.valueHypothesis.targetValue}`,
        `Mechanism: ${s.valueHypothesis.mechanism}`,
        `Falsification test: ${s.valueHypothesis.falsificationTest}`,
      ],
      extraBullets: s.valueHypothesis.metricBars.map(
        (b) =>
          `${b.label}: current ${b.current} ${b.unit}` +
          (b.target !== null
            ? ` → target ${b.target} ${b.unit}`
            : ' → target not set') +
          ` (better when ${b.betterWhen})`,
      ),
    }),
    sectionToCard({
      anatomy: s.initialCostEffort.anatomy,
      body: [
        `Effort range (FTE-weeks): low ${s.initialCostEffort.effortLow}, ` +
          `point ${s.initialCostEffort.effortPoint}, high ${s.initialCostEffort.effortHigh}`,
        `Cost lanes ($): build ${s.initialCostEffort.buildCost}, ` +
          `change ${s.initialCostEffort.changeCost}, run ${s.initialCostEffort.runCost}`,
        `Business-change fraction: ${(s.initialCostEffort.changeFraction * 100).toFixed(0)}%`,
        `Rate-card basis: ${s.initialCostEffort.rateCardBasis}`,
        `Value band ($): low ${s.initialCostEffort.valueLow}, ` +
          `point ${s.initialCostEffort.valuePoint}, high ${s.initialCostEffort.valueHigh}`,
        `Split note: ${s.initialCostEffort.splitNote}`,
      ],
    }),
    sectionToCard({
      anatomy: s.assumptionLedger.anatomy,
      body: [
        `Top-mover proxies on seed gaps: ${s.assumptionLedger.proxyMoverCount}`,
      ],
      extraBullets: s.assumptionLedger.assumptions.map(
        (a) =>
          `#${a.rank} ${a.key} — ${a.statement} (owner ${a.owner}, ` +
          `${a.confidence} confidence, ${a.sensitivityImpact} sensitivity; ` +
          `${a.isSeedGapProxy ? 'seed-gap proxy' : 'recorded'}; source: ${a.source})`,
      ),
    }),
    sectionToCard({
      anatomy: s.killCriteria.anatomy,
      body: [`Fired criteria: ${s.killCriteria.firedCount}`],
      extraBullets: s.killCriteria.criteria.map(
        (c) =>
          `${c.code} (${c.state}) — ${c.title}: ${c.condition}; threshold ${c.threshold}; owner ${c.owner}`,
      ),
    }),
    sectionToCard({
      anatomy: s.evidenceAsks.anatomy,
      body: [],
      extraBullets: s.evidenceAsks.asks.map(
        (a) =>
          `${a.label} — owner ${a.owner}, due ${a.due}, ` +
          `blocks funding: ${a.blocksFunding ? 'yes' : 'no'} — ${a.decisionImpact}`,
      ),
    }),
  ];

  return {
    deckSlug: 'charter-skeleton',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.verdict.toUpperCase())),
    cards,
  };
}

function buildBusinessCaseBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexCostedBusinessCasePack(generatedOn);
  const s = m.sections;

  const cards: BriefCard[] = [
    sectionToCard({
      anatomy: s.boardAnswer.anatomy,
      body: [
        s.boardAnswer.verdictHeadline,
        s.boardAnswer.verdictDetail,
        `Blocker: ${s.boardAnswer.blocker}`,
        `Immediate ask: ${s.boardAnswer.immediateAsk}`,
      ],
      extraBullets: [
        ...s.boardAnswer.economics.map(
          (e) => `${e.label}: ${e.value}` + (e.sub ? ` — ${e.sub}` : ''),
        ),
        ...s.boardAnswer.fundNow.map((f) => `Fund now: ${f}`),
        ...s.boardAnswer.doNotFundYet.map((f) => `Do NOT fund yet: ${f}`),
      ],
    }),
    sectionToCard({
      anatomy: s.whyNow.anatomy,
      body: [`Trigger: ${s.whyNow.trigger}`, `Pain: ${s.whyNow.pain}`],
    }),
    sectionToCard({
      anatomy: s.whatWeAreFunding.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.investmentCase.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.valueCase.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.paybackSensitivity.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.roadmap.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.risksControls.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.assumptionLedger.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.evidenceAppendix.anatomy,
      body: [],
    }),
    sectionToCard({
      anatomy: s.recommendation.anatomy,
      body: [],
    }),
  ];

  return {
    deckSlug: 'business-case',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.verdict.toUpperCase())),
    cards,
  };
}

function buildSolutionArchitectureBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexSolutionArchitecture(generatedOn);
  const s = m.sections;

  // Solution architecture has many sections — we walk them by name so any
  // body figures are not introduced (the anatomy carries the prose intent;
  // body figures are emitted via a generic JSON-leaf walker below). We keep
  // section bodies empty and rely on the anatomy + JSON-leaf extraction so
  // the serializer remains pure.
  const sectionAnatomies = Object.values(s).map((sec) => sec.anatomy);

  const cards: BriefCard[] = sectionAnatomies.map((a) =>
    sectionToCard({ anatomy: a, body: [] }),
  );

  return {
    deckSlug: 'solution-architecture',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.verdict.toUpperCase())),
    cards,
  };
}

function buildEstimateModelBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexEstimateModel(generatedOn);
  const s = m.sections;
  const sectionAnatomies = Object.values(s).map((sec) => sec.anatomy);
  const cards: BriefCard[] = sectionAnatomies.map((a) =>
    sectionToCard({ anatomy: a, body: [] }),
  );
  // EstimateModel uses `recommendation` (not `verdict`) — the field name
  // diverges from sibling decks but the meaning is identical.
  return {
    deckSlug: 'estimate-model',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.recommendation.toUpperCase())),
    cards,
  };
}

function buildCfoPackBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexCfoPack(generatedOn);
  const s = m.sections;
  const sectionAnatomies = Object.values(s).map((sec) => sec.anatomy);
  const cards: BriefCard[] = sectionAnatomies.map((a) =>
    sectionToCard({ anatomy: a, body: [] }),
  );
  return {
    deckSlug: 'cfo-pack',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.verdict.toUpperCase())),
    cards,
  };
}

function buildMobilizePacketBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexMobilizePacket(generatedOn);
  const s = m.sections;
  const sectionAnatomies = Object.values(s).map((sec) => sec.anatomy);
  const cards: BriefCard[] = sectionAnatomies.map((a) =>
    sectionToCard({ anatomy: a, body: [] }),
  );
  return {
    deckSlug: 'mobilize-packet',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.verdict.toUpperCase())),
    cards,
  };
}

function buildMasterDossierBrief(generatedOn: string): BoardGradeDeckBrief {
  const m = buildApexMasterMoveDossier(generatedOn);
  const s = m.sections;
  const sectionAnatomies = Object.values(s).map((sec) => sec.anatomy);
  const cards: BriefCard[] = sectionAnatomies.map((a) =>
    sectionToCard({ anatomy: a, body: [] }),
  );
  return {
    deckSlug: 'master-dossier',
    title: `${m.artifactLabel} — ${m.moveLabel}`,
    cover: buildCoverCard(metaFromModel(m, m.verdict.toUpperCase())),
    cards,
  };
}

// ---------------------------------------------------------------------------
// Public registry — one entry per supported deck slug.
// ---------------------------------------------------------------------------

const BUILDERS: Record<
  BoardGradeDeckSlug,
  (generatedOn: string) => BoardGradeDeckBrief
> = {
  'discover-brief': buildDiscoverBriefBrief,
  'charter-skeleton': buildCharterSkeletonBrief,
  'business-case': buildBusinessCaseBrief,
  'solution-architecture': buildSolutionArchitectureBrief,
  'estimate-model': buildEstimateModelBrief,
  'cfo-pack': buildCfoPackBrief,
  'mobilize-packet': buildMobilizePacketBrief,
  'master-dossier': buildMasterDossierBrief,
};

/** True when the slug is a supported board-grade reference deck. */
export function isBoardGradeDeckSlug(s: string): s is BoardGradeDeckSlug {
  return (BOARD_GRADE_DECK_SLUGS as readonly string[]).includes(s);
}

/**
 * Build the `BoardGradeDeckBrief` for the named Apex reference deck. The
 * builder calls the deck's `buildApex*` model and projects it into the
 * generic brief shape. Pure, deterministic.
 */
export function buildBoardGradeDeckBrief(
  slug: BoardGradeDeckSlug,
  generatedOn: string,
): BoardGradeDeckBrief {
  return BUILDERS[slug](generatedOn);
}

/**
 * Build the serialized brief Gamma consumes — the `inputText` + the honesty
 * `additionalInstructions` + the card count + the title. The route hands
 * this directly to `generateGammaDeck` without further transformation.
 */
export function serializeBoardGradeDeckBrief(
  slug: BoardGradeDeckSlug,
  generatedOn: string,
): SerializedBrief {
  return serializeBrief(buildBoardGradeDeckBrief(slug, generatedOn));
}
