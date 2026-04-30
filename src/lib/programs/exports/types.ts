// EXPORT-1 · Format-aware deliverable export · typed contracts.
//
// Pure type module — no runtime, no I/O. Consumed by the format router
// (format-router.ts), the audit module (audit.ts), and the renderer
// slices (EXPORT-2 xlsx, EXPORT-3 docx, EXPORT-4 API route).
//
// Design source: docs/build/DELIVERABLE_EXPORT_DESIGN.md §2 (taxonomy),
// §3 (architecture), §6 (slice plan).
//
// Narrow per-kind payload shapes are intentionally NOT defined in this
// slice. Each renderer slice (EXPORT-2/3/4) ships the narrow shapes for
// the kinds it covers, alongside the renderer; the envelope below keeps
// EXPORT-1 land-able without forcing 16 unfinished payload types into
// `main`.

/** Canonical formats supported by the export pipeline. PDF is deferred to EXPORT-5. */
export type DeliverableFormat = 'html' | 'xlsx' | 'docx' | 'pdf';

/** The 16 deliverable kinds the platform recognizes (per design Section 2). */
export type DeliverableKind =
  | 'program-charter'
  | 'discovery-report'
  | 'okr-baseline'
  | 'stakeholder-map'
  | 'synthesis-options-table'
  | 'architecture-sketch'
  | 'execution-plan'
  | 'pilot-result-report'
  | 'outcome-report'
  | 'bafo-scoreboard'
  | 'meeting-notes'
  | 'decision-log'
  | 'roadmap'
  | 'financial-baseline'
  | 'archetype-primer'
  | 'workshop-facilitator-guide';

/** Envelope spec — the structured input every renderer accepts. */
export interface DeliverableSpec {
  /** Deliverable kind discriminator. */
  kind: DeliverableKind;
  /** Tenant key (broker key, e.g. 'apex-retail'). */
  tenantKey: string;
  /** Optional program id; required for program-scoped deliverables. */
  programId?: string;
  /** Title shown in the rendered output. */
  title: string;
  /** Optional subtitle line. */
  subtitle?: string;
  /** Generation timestamp; renderers stamp with `now()` if omitted. */
  generatedAt?: string;
  /** Authors — name(s) of the person(s) responsible. */
  authors?: string[];
  /** The kind-specific structured payload, narrowed in renderer slices. */
  payload: Record<string, unknown>;
  /** Optional brand subtitle override (defaults to 'AbarVa · Programs'). */
  brandSubtitle?: string;
}

/** Result returned by every renderer. Format, bytes, mime, filename. */
export interface DeliverableRenderResult {
  /** Format used to render. */
  format: DeliverableFormat;
  /** Binary buffer for xlsx/docx/pdf; UTF-8 string-as-Buffer for html. */
  buffer: Buffer;
  /** Suggested download filename. */
  filename: string;
  /** Mime type matching the format. */
  contentType: string;
  /** Byte size — used for size-limit enforcement at the API layer. */
  sizeBytes: number;
}
