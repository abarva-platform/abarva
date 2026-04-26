// I5 · Intelligence Canvas mode switching helper.
//
// Pure deterministic helper that powers the "canvas mode" tabs
// surfaced on a Sentinel pattern detail page. The tenant Intelligence
// canvas exposes four read-only modes today — summary, evidence,
// programs, actions — and a server-rendered tab strip lets the user
// switch between them via a URL search parameter (`?canvas=<mode>`).
//
// This module is intentionally framework-free: no React, no DOM, no
// client-runtime directives, no React state hooks, no effect hooks.
// Mode parsing, label resolution, href construction, and body
// content are all resolved deterministically from the input
// arguments. Same inputs produce byte-equal output objects.
//
// No live Sentinel runtime, no Atlas / Nexus / Claude / OpenAI
// invocation, no wall-clock reads, no random IDs, no constructed
// dates, no network access, no model SDK imports.

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Canonical canvas modes, declared in tab order. Adding a mode is a
 * conscious schema change: every consumer (helper, component, test,
 * slice doc) must be updated together.
 */
export const INTELLIGENCE_CANVAS_MODES = [
  'summary',
  'evidence',
  'programs',
  'actions',
] as const;

export type IntelligenceCanvasMode = (typeof INTELLIGENCE_CANVAS_MODES)[number];

export interface IntelligenceCanvasModeTab {
  /** Canonical mode key. */
  key: IntelligenceCanvasMode;
  /** Server-renderable href that activates this tab. */
  href: string;
  /** Human-readable tab label. */
  label: string;
  /** Whether this tab is the active one for the current view. */
  isActive: boolean;
}

export interface IntelligenceCanvasSummaryBody {
  kind: 'summary';
  content: {
    title: string;
    rationale: string;
    bullets: ReadonlyArray<string>;
  };
}

export interface IntelligenceCanvasEvidenceBody {
  kind: 'evidence';
  content: {
    title: string;
    /**
     * Empty seed list today; live evidence wiring is deferred. Cap
     * is enforced even when seeded so consumers can rely on a
     * bounded list.
     */
    rows: ReadonlyArray<{
      id: string;
      label: string;
    }>;
    citationReadinessHint: string;
  };
}

export interface IntelligenceCanvasProgramsBody {
  kind: 'programs';
  content: {
    title: string;
    rows: ReadonlyArray<{
      key: string;
      label: string;
    }>;
    helperText: string;
  };
}

export interface IntelligenceCanvasActionsBody {
  kind: 'actions';
  content: {
    title: string;
    rows: ReadonlyArray<{
      key: string;
      label: string;
    }>;
    helperText: string;
  };
}

export type IntelligenceCanvasBody =
  | IntelligenceCanvasSummaryBody
  | IntelligenceCanvasEvidenceBody
  | IntelligenceCanvasProgramsBody
  | IntelligenceCanvasActionsBody;

export interface IntelligenceCanvasView {
  /** Currently active mode. */
  mode: IntelligenceCanvasMode;
  /** Pattern key the canvas is rendered for. */
  patternKey: string;
  /** Human-readable label of the active mode (e.g. 'Summary'). */
  surfaceLabel: string;
  /** All four mode tabs, in canonical order, with active flag set. */
  modes: ReadonlyArray<IntelligenceCanvasModeTab>;
  /** Discriminated body payload; `kind` always matches `mode`. */
  body: IntelligenceCanvasBody;
  /** Honest disclaimer about determinism / no live runtime. */
  honestDisclaimer: string;
  /** Marker so consumers know this is not a live-model output. */
  createdFrom: 'deterministic_seed';
}

export interface BuildIntelligenceCanvasViewInput {
  patternKey: string;
  mode?: IntelligenceCanvasMode;
  tenantSlug?: string;
}

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

const DEFAULT_MODE: IntelligenceCanvasMode = 'summary';

const DEFAULT_TENANT_SLUG = 'apex-retail';

const MODE_LABELS: Readonly<Record<IntelligenceCanvasMode, string>> = {
  summary: 'Summary',
  evidence: 'Evidence',
  programs: 'Programs',
  actions: 'Actions',
};

const HONEST_DISCLAIMER =
  'Canvas modes are deterministic seeds composed from the I1 Sentinel pattern detection read model. No live Sentinel runtime, no live retrieval, no Atlas / Claude / OpenAI invocation.';

/**
 * Resolve the human-readable label for a canvas mode. Pure lookup;
 * the input is statically typed so unknown values are impossible
 * inside the type system, but defensive lookup still returns the
 * default mode label for safety at the JavaScript boundary.
 */
export function getCanvasModeLabel(mode: IntelligenceCanvasMode): string {
  const label = MODE_LABELS[mode];
  if (typeof label === 'string' && label.length > 0) return label;
  return MODE_LABELS[DEFAULT_MODE];
}

/**
 * Type guard for canvas modes. Used by the search-param parser and
 * by the input normalizer.
 */
export function isIntelligenceCanvasMode(
  value: unknown,
): value is IntelligenceCanvasMode {
  return (
    typeof value === 'string' &&
    (INTELLIGENCE_CANVAS_MODES as ReadonlyArray<string>).includes(value)
  );
}

/**
 * Parse a Next.js `searchParams` value (string | string[] | undefined)
 * into a canonical canvas mode. Returns `'summary'` for any of:
 *   - undefined
 *   - null
 *   - empty string
 *   - array (search param appeared more than once)
 *   - any unknown / non-canonical mode
 *
 * The default-on-unknown contract keeps the URL forgiving and the
 * component server-renderable without try/catch.
 */
export function parseCanvasModeFromSearchParam(
  value: string | string[] | undefined | null,
): IntelligenceCanvasMode {
  if (value === undefined || value === null) return DEFAULT_MODE;
  if (Array.isArray(value)) return DEFAULT_MODE;
  if (typeof value !== 'string') return DEFAULT_MODE;
  if (value.length === 0) return DEFAULT_MODE;
  if (!isIntelligenceCanvasMode(value)) return DEFAULT_MODE;
  return value;
}

/**
 * Compose the canonical href for a given pattern + canvas mode pair.
 * Tenant slug defaults to the canonical demo tenant so the helper is
 * usable in tests without plumbing a tenant.
 */
function buildCanvasHref(
  tenantSlug: string,
  patternKey: string,
  mode: IntelligenceCanvasMode,
): string {
  const slug = tenantSlug.length > 0 ? tenantSlug : DEFAULT_TENANT_SLUG;
  return `/tenant/${slug}/intelligence/patterns/${patternKey}?canvas=${mode}`;
}

/**
 * Build the canonical IntelligenceCanvasView for a given pattern and
 * (optional) mode. Same inputs → byte-equal view. The body payload
 * is a deterministic seed: the live evidence registry, program graph
 * traversal, and action handoff binding are intentionally deferred.
 *
 * Body content lists are capped at 5 enumerable items per mode so
 * UI consumers can rely on a bounded list. Today the seeds carry
 * fewer than the cap, but the cap is enforced as an invariant.
 */
export function buildIntelligenceCanvasView(
  input: BuildIntelligenceCanvasViewInput,
): IntelligenceCanvasView {
  const patternKey = input.patternKey;
  const mode = input.mode && isIntelligenceCanvasMode(input.mode)
    ? input.mode
    : DEFAULT_MODE;
  const tenantSlug =
    input.tenantSlug && input.tenantSlug.length > 0
      ? input.tenantSlug
      : DEFAULT_TENANT_SLUG;

  const modes: ReadonlyArray<IntelligenceCanvasModeTab> =
    INTELLIGENCE_CANVAS_MODES.map((key) => ({
      key,
      href: buildCanvasHref(tenantSlug, patternKey, key),
      label: getCanvasModeLabel(key),
      isActive: key === mode,
    }));

  const body = buildCanvasBody(mode, patternKey);

  return {
    mode,
    patternKey,
    surfaceLabel: getCanvasModeLabel(mode),
    modes,
    body,
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
  };
}

// ---------------------------------------------------------------------
// Body composition (deterministic seeds, capped at 5 enumerables)
// ---------------------------------------------------------------------

const BODY_LIST_CAP = 5;

function capList<T>(items: ReadonlyArray<T>): ReadonlyArray<T> {
  if (items.length <= BODY_LIST_CAP) return items;
  return items.slice(0, BODY_LIST_CAP);
}

function buildCanvasBody(
  mode: IntelligenceCanvasMode,
  patternKey: string,
): IntelligenceCanvasBody {
  switch (mode) {
    case 'summary':
      return {
        kind: 'summary',
        content: {
          title: `Pattern summary · ${patternKey}`,
          rationale:
            'Sentinel composed this pattern brief deterministically from the seed plan; no live runtime is reading evidence today.',
          bullets: capList([
            'Severity, confidence, and source label are read directly from the I1 detection.',
            'Affected programs trace back to canonical seed program rows for this tenant.',
            'Recommended action is the deterministic top action declared by the I1 read model.',
          ]),
        },
      };
    case 'evidence':
      return {
        kind: 'evidence',
        content: {
          title: `Evidence trail · ${patternKey}`,
          rows: capList([]),
          citationReadinessHint:
            'Citations are not yet wired today. The evidence trail enumerates source signal IDs and program codes only.',
        },
      };
    case 'programs':
      return {
        kind: 'programs',
        content: {
          title: `Affected programs · ${patternKey}`,
          rows: capList([]),
          helperText:
            'Each affected program row links to its canonical /tenant/.../programs/<programSlug> detail; no programs are duplicated.',
        },
      };
    case 'actions':
      return {
        kind: 'actions',
        content: {
          title: `Recommended actions · ${patternKey}`,
          rows: capList([]),
          helperText:
            'Action handoffs (Nexus, Atlas, Steward, Sentinel) are visible-but-disabled today; live action wiring is deferred.',
        },
      };
    default: {
      // Exhaustiveness guard: if a new mode is ever added to the union
      // without updating this switch, the type system flags it here.
      const _exhaustive: never = mode;
      void _exhaustive;
      return {
        kind: 'summary',
        content: {
          title: `Pattern summary · ${patternKey}`,
          rationale: 'Default summary body.',
          bullets: capList([]),
        },
      };
    }
  }
}
