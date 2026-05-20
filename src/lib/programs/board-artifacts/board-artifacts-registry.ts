// Board-artifacts registry — maps a Move to its board-grade artifact decks.
//
// AbarVa generates board-grade artifact decks (costed business case, discover
// brief, solution architecture) for specific Moves. Those decks are produced
// by the Moves Expert Kernel and served from raw `/api/v1/moves/*` routes. The
// product UI needs a single, stable place that answers "which board-grade
// decks exist for THIS Move?" — this registry is that switchboard.
//
// The registry keys off a STABLE Move identity: the tenant + a canonical Move
// key. This mirrors the Expert Review Console case registry
// (`expert-kernel/expert-review-cases.ts`), which maps a tenant key + a Move
// ref → a kernel case. The two stay consistent: this registry reuses the same
// canonical short tenant keys (`apexretail`, `meridian`, `arcturus`) and a
// canonical Move name as the join.
//
// Identity matching — a careful, honest choice. A `StrategicMove` does NOT
// carry a stable opaque Move key on its type; its `tenant` field exposes only
// `id`, `name`, and `industryCode`. So we match on the pair we CAN read
// reliably:
//   • tenant — the Move's `tenant.name` normalised to a canonical short key
//     (e.g. "Apex Retail Group" → `apexretail`).
//   • move — the Move's `name` compared case- and whitespace-insensitively to
//     a canonical Move name (e.g. "Contact Center AI Routing").
// Both must match. This is deliberately strict: an unrelated Move on the same
// tenant, or a same-named Move on a different tenant, resolves to `[]`.
//
// EXTENSIBILITY — adding a future Move's board-grade decks is exactly ONE new
// entry in `BOARD_ARTIFACT_ENTRIES`. No other file changes. The panel and the
// Move detail page know nothing about any specific tenant — only this data
// module does.
//
// Pure module: deterministic, no I/O.

import type { StrategicMove } from '../types.ui';

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
 * One registry entry — the board-grade artifacts anchored to a single Move,
 * keyed by a stable tenant + Move identity.
 *
 * To add a future Move's decks: append ONE entry here. Nothing else changes.
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

// ── Artifact data ──────────────────────────────────────────────────────────
//
// The Apex "Contact Center AI Routing" Move is the first — and today the only
// — Move with board-grade decks. Its three decks are served from the
// `/api/v1/moves/board-grade-*` routes; the Costed pack additionally serves an
// editable PowerPoint via `?format=pptx`.

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
];

/**
 * The board-artifacts registry — one entry per Move with board-grade decks.
 *
 * TODAY this holds exactly one entry (the Apex "Contact Center AI Routing"
 * Move). A future Move's decks are added as ONE additional entry.
 */
const BOARD_ARTIFACT_ENTRIES: readonly BoardArtifactEntry[] = [
  {
    tenantKey: 'apexretail',
    moveName: 'Contact Center AI Routing',
    artifacts: APEX_CONTACT_CENTER_ARTIFACTS,
  },
];

/**
 * The board-grade artifacts available for a Move.
 *
 * Matches on a stable identity — the Move's canonical tenant key AND its
 * canonical name (case/whitespace-tolerant). Both must match. A Move with no
 * anchored decks — any unrelated Move — returns `[]`, never a fabricated set.
 */
export function boardArtifactsForMove(move: StrategicMove): BoardArtifact[] {
  const tenantKey = canonicalTenantKey(move.tenant.name);
  const moveName = normalizeMoveName(move.name);

  const entry = BOARD_ARTIFACT_ENTRIES.find(
    (candidate) =>
      candidate.tenantKey === tenantKey &&
      normalizeMoveName(candidate.moveName) === moveName,
  );

  return entry ? [...entry.artifacts] : [];
}
