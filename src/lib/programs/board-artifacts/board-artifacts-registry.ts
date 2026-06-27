// Board-artifacts registry — maps a Move to its board-grade artifact decks.
//
// AbarVa generates board-grade artifact decks (costed business case, discover
// brief, solution architecture, …) for Moves. Those decks are produced by the
// Moves Expert Kernel and served from `/api/v1/moves/*` routes. The product UI
// needs a single, stable place that answers "which board-grade decks exist for
// THIS Move?" — this registry is that switchboard.
//
// TWO resolution paths, in priority order:
//
//   1. The Apex REFERENCE entry — the hand-authored Apex "Contact Center AI
//      Routing" Move carries eight fully-authored reference decks (the costed
//      pack, discover brief, solution architecture, estimate model, mobilize
//      packet, charter skeleton, CFO pack, master dossier). It is matched on
//      the stable tenant + Move-name identity, and is kept exactly as the
//      shipped reference artifact set.
//
//   2. The KEY-DRIVEN path — for EVERY OTHER Move, the registry resolves the
//      Move's `(industryKey, functionKey)` function context identity (via
//      `resolveMoveFunctionIdentity`). When that resolves, the Move gets the
//      generic generated board-grade decks — the Discover Brief, the
//      Charter Business-Case Skeleton, the Costed Business-Case deck, the
//      Solution Architecture deck, the Estimate & Financial Model, the
//      Mobilize & Go-Decision Packet, the CFO Pack, and the Master Move
//      Dossier — each `htmlHref` carrying `?moveId=<id>` so the route renders
//      THAT Move's generated artifact deck. The hardcoded Apex Move-name match is
//      no longer the gate: any Move with a resolvable function gets the
//      artifacts.
//
// HONESTY: a Move with no resolvable `(industryKey, functionKey)` identity —
// no industry code, or no `functionPackKey` in its charter — gets NO artifact.
// That is the honest signal (surfaced as a gap), never a fabricated deck.
//
// Pure module: deterministic, no I/O.

import type { StrategicMove } from '../types.ui';
import { resolveMoveFunctionIdentity } from '../function-identity';

/** One board-grade artifact deck available for a Move. */
export interface BoardArtifact {
  /** Stable artifact id — unique within a Move's artifact set. */
  id: string;
  /** Human label, e.g. "Costed Business-Case Pack". */
  label: string;
  /** The Move phase the artifact belongs to, e.g. "Design & Plan". */
  phase: string;
  /** One line describing what the artifact is. */
  blurb: string;
  /** The route that opens the HTML deck for viewing. */
  htmlHref: string;
  /** The route that downloads the editable PowerPoint, when one exists. */
  pptxHref?: string;
}

/**
 * One reference registry entry — the board-grade artifacts anchored to a
 * single, hand-authored reference Move, keyed by a stable tenant + Move
 * identity. This is the curated reference path; the key-driven path covers
 * every other Move.
 */
interface BoardArtifactEntry {
  /** Canonical short tenant key — see `EXPERT_REVIEW_CASES` ids. */
  tenantKey: string;
  /** Canonical Move name — matched case- and whitespace-insensitively. */
  moveName: string;
  /** The board-grade artifacts available for this Move. */
  artifacts: readonly BoardArtifact[];
}

/**
 * Normalise an arbitrary tenant display name to a canonical short tenant key.
 * The `StrategicMove.tenant.name` carries a display name ("Apex Retail Group"),
 * not a key; this folds known display names onto the canonical short keys the
 * kernel uses. An unknown name folds to a slugged form so it simply never
 * matches a registry entry.
 */
export function canonicalTenantKey(tenantName: string): string {
  const slug = tenantName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  // Known display-name → canonical short-key folds. The short keys mirror the
  // Expert Review Console case ids (`apexretail`, `meridian`, `arcturus`).
  const FOLDS: Record<string, string> = {
    apexretailgroup: 'apexretail',
    apexretail: 'apexretail',
    meridianhealthsystem: 'meridian',
    meridianhealth: 'meridian',
    firstcapitalfinancial: 'arcturus',
    firstcapital: 'arcturus',
  };
  return FOLDS[slug] ?? slug;
}

/** Normalise a Move name for tolerant comparison (case + whitespace). */
function normalizeMoveName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── Reference-artifact data ─────────────────────────────────────────────────
//
// The Apex "Contact Center AI Routing" Move is the hand-authored reference:
// its eight board-grade decks are served from the `/api/v1/moves/board-grade-*`
// routes; the Costed pack additionally serves an editable PowerPoint via
// `?format=pptx`.

const APEX_CONTACT_CENTER_ARTIFACTS: readonly BoardArtifact[] = [
  {
    id: 'costed-business-case',
    label: 'Costed Business-Case Pack',
    phase: 'Design & Plan',
    blurb:
      'The board-grade costed business case — baseline, value forecast, costed roadmap, and the go-decision verdict.',
    htmlHref: '/api/v1/moves/board-grade-business-case',
    pptxHref: '/api/v1/moves/board-grade-business-case?format=pptx',
  },
  {
    id: 'discover-brief',
    label: 'Discover Brief',
    phase: 'Discover',
    blurb:
      'The board-grade Discover brief — the diagnosed problem, baseline evidence, and the framed opportunity.',
    htmlHref: '/api/v1/moves/board-grade-discover-brief',
  },
  {
    id: 'solution-architecture',
    label: 'Solution Architecture Pack',
    phase: 'Design & Plan',
    blurb:
      'The board-grade solution architecture — target-state design, integration patterns, and the build approach.',
    htmlHref: '/api/v1/moves/board-grade-solution-architecture',
  },
  {
    id: 'estimate-model',
    label: 'Estimate & Financial Model',
    phase: 'Design & Plan',
    blurb:
      'The board-grade estimate — workstream cost, role mix, rate card, value forecast, sensitivity, and roadmap cash flow.',
    htmlHref: '/api/v1/moves/board-grade-estimate-model',
  },
  {
    id: 'mobilize-packet',
    label: 'Mobilize & Go-Decision Packet',
    phase: 'Mobilize',
    blurb:
      'The board-grade Mobilize packet — 30/60/90 plan, RACI, adoption approach, Tower handoff, and the go-decision verdict.',
    htmlHref: '/api/v1/moves/board-grade-mobilize-packet',
  },
  {
    id: 'charter-skeleton',
    label: 'Charter Business-Case Skeleton',
    phase: 'Charter',
    blurb:
      'The board-grade Charter skeleton — the shaping verdict, falsifiable value hypothesis, early cost/effort range, owned assumptions, and the evidence asks before funding.',
    htmlHref: '/api/v1/moves/board-grade-charter-skeleton',
  },
  {
    id: 'cfo-pack',
    label: 'CFO Pack',
    phase: 'Design & Plan',
    blurb:
      'The board-grade CFO Pack — a financial challenge: the funding ask, the downside, the do-not-fund holdbacks, what Tower will measure, and the evidence/gap audit.',
    htmlHref: '/api/v1/moves/board-grade-cfo-pack',
  },
  {
    id: 'master-dossier',
    label: 'Master Move Dossier',
    phase: 'All phases',
    blurb:
      'The board-grade Master Move Dossier — the assembled book: the whole Move pulled into one CEO/CFO/CIO read, with the executive answer, decision timeline, economics, roadmap, Tower handoff, and links to every other artifact deck.',
    htmlHref: '/api/v1/moves/board-grade-master-dossier',
  },
];

/**
 * The reference registry — hand-authored Moves with a full board-grade deck
 * set. Today this holds exactly the Apex "Contact Center AI Routing" Move.
 */
const BOARD_ARTIFACT_ENTRIES: readonly BoardArtifactEntry[] = [
  {
    tenantKey: 'apexretail',
    moveName: 'Contact Center AI Routing',
    artifacts: APEX_CONTACT_CENTER_ARTIFACTS,
  },
];

/**
 * Build the generic generated board-grade artifacts for a Move whose
 * `(industryKey, functionKey)` identity resolved. Each artifact's `htmlHref`
 * carries `?moveId=<id>` so the route renders THAT Move's generated artifact deck.
 *
 * The key-driven path serves the eight generic generated artifact decks: the
 * Discover Brief, the Charter Business-Case Skeleton, the Costed
 * Business-Case Pack, the Solution Architecture Pack, the Estimate &
 * Financial Model, the Mobilize & Go-Decision Packet, the CFO Pack, and the
 * Master Move Dossier (the assembled book that links the other seven).
 */
function genericBoardArtifacts(moveId: string): BoardArtifact[] {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return [
    {
      id: 'discover-brief',
      label: 'Discover Brief',
      phase: 'Discover',
      blurb:
        'The board-grade Discover Brief — evidence-backed for this Move, with ' +
        'the function-specific Discover outline, the recorded baseline, ' +
        'the framed opportunity, the named missing evidence, and the go/no-go ' +
        'verdict.',
      htmlHref: `/api/v1/moves/board-grade-discover-brief${q}`,
    },
    {
      id: 'charter-skeleton',
      label: 'Charter Business-Case Skeleton',
      phase: 'Charter',
      blurb:
        'The board-grade Charter skeleton — evidence-backed for this Move, ' +
        'with the function-specific Charter outline, the shaping ' +
        'verdict, the falsifiable value hypothesis, the early cost/effort ' +
        'range, the owned assumptions, and the named evidence asks before ' +
        'funding.',
      htmlHref: `/api/v1/moves/board-grade-charter-skeleton${q}`,
    },
    {
      id: 'costed-business-case',
      label: 'Costed Business-Case Pack',
      phase: 'Design & Plan',
      blurb:
        'The board-grade costed business case — evidence-backed for this ' +
        'Move, with the function-specific outline, value forecast, ' +
        'costed investment range, and the readiness verdict.',
      htmlHref: `/api/v1/moves/board-grade-business-case${q}`,
    },
    genericSolutionArchitectureArtifact(moveId),
    genericEstimateModelArtifact(moveId),
    genericMobilizePacketArtifact(moveId),
    genericCfoPackArtifact(moveId),
    genericMasterDossierArtifact(moveId),
  ];
}

/**
 * Build the generic generated board-grade Master Move Dossier for a Move
 * whose `(industryKey, functionKey)` identity resolved. The `htmlHref` carries
 * `?moveId=<id>` so the route renders THAT Move's generated artifact deck via
 * `renderMoveMasterDossierHtml` — the assembled book that pulls the whole Move
 * into one CEO/CFO/CIO read and links every other generic board-grade deck for
 * the Move. The verdict is the kernel's real recommendation.
 */
function genericMasterDossierArtifact(moveId: string): BoardArtifact {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return {
    id: 'master-dossier',
    label: 'Master Move Dossier',
    phase: 'All phases',
    blurb:
      'The board-grade Master Move Dossier — evidence-backed for this Move, ' +
      'the assembled book: the whole Move pulled into one CEO/CFO/CIO read, ' +
      'with the executive answer, decision timeline, economics, roadmap, ' +
      'Tower handoff, and links to every other generic artifact deck.',
    htmlHref: `/api/v1/moves/board-grade-master-dossier${q}`,
  };
}

/**
 * Build the generic generated board-grade Estimate & Financial Model for
 * a Move whose `(industryKey, functionKey)` identity resolved. The `htmlHref`
 * carries `?moveId=<id>` so the route renders THAT Move's generated artifact deck
 * via `buildMoveEstimateModel` — the effort decomposition, role-mix cost
 * build-up, rate card, value forecast and haircuts, every figure a labelled
 * planning estimate or range, never a quote.
 */
function genericEstimateModelArtifact(moveId: string): BoardArtifact {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return {
    id: 'estimate-model',
    label: 'Estimate & Financial Model',
    phase: 'Design & Plan',
    blurb:
      'The board-grade estimate — evidence-backed for this Move, with the ' +
      'workstream cost build-up, role-mix lanes, rate card, value forecast, ' +
      'sensitivity, and the staged cash-flow shape. Every figure is a ' +
      'labelled planning estimate or range, never a quote.',
    htmlHref: `/api/v1/moves/board-grade-estimate-model${q}`,
  };
}

/**
 * Build the generic generated board-grade CFO Pack for a Move whose
 * `(industryKey, functionKey)` identity resolved. The `htmlHref` carries
 * `?moveId=<id>` so the route renders THAT Move's generated artifact deck via
 * `renderMoveCfoPackHtml` — the financial-challenge deck with the funding ask,
 * the downside, the do-not-fund holdbacks, the Tower measurement, and the
 * evidence/gap audit; the verdict is the kernel's real recommendation.
 */
function genericCfoPackArtifact(moveId: string): BoardArtifact {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return {
    id: 'cfo-pack',
    label: 'CFO Pack',
    phase: 'Design & Plan',
    blurb:
      'The board-grade CFO Pack — evidence-backed for this Move, a financial ' +
      'challenge: the funding ask, the downside, the do-not-fund holdbacks, ' +
      'what Tower will measure, and the evidence/gap audit. The verdict is ' +
      'the readiness recommendation.',
    htmlHref: `/api/v1/moves/board-grade-cfo-pack${q}`,
  };
}

/**
 * Build the generic generated board-grade Solution Architecture artifact
 * for a Move whose `(industryKey, functionKey)` identity resolved. The
 * `htmlHref` carries `?moveId=<id>` so the route renders THAT Move's
 * pack-bound, generated target-state architecture deck via
 * `buildMoveSolutionArchitecture`.
 */
function genericSolutionArchitectureArtifact(moveId: string): BoardArtifact {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return {
    id: 'solution-architecture',
    label: 'Solution Architecture Pack',
    phase: 'Design & Plan',
    blurb:
      'The board-grade solution architecture — evidence-bound for this Move, ' +
      'with the function-specific outline, the curated reference ' +
      'solution patterns, the AI use-case archetypes, and the control ' +
      'posture.',
    htmlHref: `/api/v1/moves/board-grade-solution-architecture${q}`,
  };
}

/**
 * Build the generic generated board-grade Mobilize & Go-Decision Packet
 * for a Move whose `(industryKey, functionKey)` identity resolved. The
 * `htmlHref` carries `?moveId=<id>` so the route renders THAT Move's
 * generated packet via `buildMoveMobilizePacket` — the mobilization-plan
 * structure inherited from the curated Function Pack, the go-decision the
 * readiness verdict.
 */
function genericMobilizePacketArtifact(moveId: string): BoardArtifact {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return {
    id: 'mobilize-packet',
    label: 'Mobilize & Go-Decision Packet',
    phase: 'Mobilize',
    blurb:
      'The board-grade Mobilize packet — evidence-backed for this Move, with ' +
      'the function-specific mobilization outline, readiness gates, ' +
      'Tower handoff, and the readiness go-decision verdict.',
    htmlHref: `/api/v1/moves/board-grade-mobilize-packet${q}`,
  };
}

/**
 * The board-grade artifacts available for a Move.
 *
 * Resolution, in priority order:
 *  1. The Apex reference entry — matched on the stable tenant + Move-name
 *     identity. When it matches, the Move gets the full eight-deck reference
 *     set.
 *  2. The key-driven path — for every other Move, the Move's
 *     `(industryKey, functionKey)` function context identity is resolved from its
 *     `tenant.industryCode` + `charter`. When it resolves, the Move gets the
 *     eight generic generated board-grade decks (the Discover Brief, the
 *     Charter Business-Case Skeleton, the Costed Business-Case Pack, the
 *     Solution Architecture Pack, the Estimate & Financial Model, the Mobilize
 *     & Go-Decision Packet, the CFO Pack, and the Master Move Dossier), each
 *     `htmlHref` carrying `?moveId=`.
 *
 * A Move that matches neither — no reference entry and no resolvable function
 * identity — returns `[]`. That is the honest signal (a gap), never a
 * fabricated deck.
 */
export function boardArtifactsForMove(move: StrategicMove): BoardArtifact[] {
  // (1) The Apex reference entry — the curated, hand-authored deck set.
  const tenantKey = canonicalTenantKey(move.tenant.name);
  const moveName = normalizeMoveName(move.name);
  const referenceEntry = BOARD_ARTIFACT_ENTRIES.find(
    (candidate) =>
      candidate.tenantKey === tenantKey &&
      normalizeMoveName(candidate.moveName) === moveName,
  );
  if (referenceEntry) {
    return [...referenceEntry.artifacts];
  }

  // (2) The key-driven path — any Move with a resolvable function context
  // identity gets the five generic generated board-grade decks, each
  // carrying `?moveId=` so its route renders THAT Move's generated artifact deck.
  const identity = resolveMoveFunctionIdentity({
    industryCode: move.tenant.industryCode,
    functionPackKey: move.functionPackKey,
    charter: move.charter,
  });
  if (identity) {
    return genericBoardArtifacts(move.id);
  }

  // No reference entry, no resolvable function — honestly, no artifact.
  return [];
}
