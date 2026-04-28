// PDEL9 · Download / Export Contract.
//
// Pure deterministic export-readiness contract for program deliverables.
// Defines the canonical export-intent shape and a hardcoded seed manifest
// covering the five canonical deliverable types.
//
// This module does NOT generate files, does NOT trigger downloads, does
// NOT call PDF/DOCX/PPT libraries, does NOT call the model, does NOT read
// from the database, and does NOT write to any database.
//
// No live runtime, no upload pipeline, no parse engine, no model calls,
// no Date.now reads, no random IDs, no migrations.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * The export format requested for this deliverable.
 *
 * - `html_static`   — render a static HTML snapshot; the only mode
 *                     that can ever be `ready` in the current version.
 * - `pdf_later`     — PDF export is planned but deferred; always
 *                     `deferred`.
 * - `docx_later`    — Word/DOCX export is planned but deferred; always
 *                     `deferred`.
 * - `pptx_later`    — PowerPoint/PPTX export is planned but deferred;
 *                     always `deferred`.
 */
export type ExportMode = 'html_static' | 'pdf_later' | 'docx_later' | 'pptx_later';

/**
 * Whether the deliverable can currently be exported in the requested
 * mode.
 *
 * - `ready`       — html_static mode is available.
 * - `not_ready`   — pre-conditions are not yet met (e.g. content not
 *                   seeded, approval not obtained).
 * - `deferred`    — the mode itself is deferred to a future version
 *                   (pdf_later, docx_later, pptx_later).
 * - `blocked`     — a specific approval or governance gate is blocking
 *                   export even for html_static.
 */
export type ExportReadiness = 'ready' | 'not_ready' | 'deferred' | 'blocked';

/**
 * Whether an audit trail is required before or after export.
 */
export type ExportAuditRequirement = 'required' | 'recommended' | 'not_applicable';

/**
 * The export intent for a single deliverable. One intent is created
 * per (deliverable, requestedMode) pair.
 */
export interface DeliverableExportIntent {
  /** Stable artifact id (matches ProgramArtifact.id from the PDEL inventory). */
  deliverableId: string;
  /** Human-readable deliverable title. */
  deliverableName: string;
  /** The export format that was requested. */
  requestedMode: ExportMode;
  /** Whether the deliverable can be exported right now. */
  exportReadiness: ExportReadiness;
  /**
   * Plain-English reason this export cannot proceed today, or `null`
   * when `exportReadiness === 'ready'`.
   */
  exportBlocker: string | null;
  /** Whether a Steward approval is required before exporting. */
  requiresApproval: boolean;
  /** Current approval gate state. */
  approvalState: 'approved' | 'pending' | 'not_required' | 'blocked';
  /** Whether an audit record must be written for this export. */
  auditRequirement: ExportAuditRequirement;
  /** Whether the exported artifact must trace back to a cited evidence record. */
  evidenceTraceRequired: boolean;
  /**
   * Whether live export is available today. Typed as literal `false`
   * because no live export pipeline exists in this version.
   */
  isLiveExportEnabled: false;
  /** Whether a static HTML snapshot of this deliverable is already rendered. */
  staticHtmlAvailable: boolean;
  /**
   * Honest caveat explaining any limitation. All intents carry a
   * non-empty caveat; intents with pdf_later/docx_later/pptx_later
   * modes must state that those formats are planned for a future version.
   */
  caveat: string;
}

/**
 * The full export manifest for a set of deliverable export intents.
 * The manifest is point-in-time: it captures the export readiness
 * picture at a deterministic moment. No live file generation occurs.
 */
export interface DeliverableExportManifest {
  /** ISO 8601 date string at which the manifest was generated. */
  generatedAt: string;
  /** Total number of intents in the manifest. Must equal `intents.length`. */
  totalIntents: number;
  /** Number of intents with `exportReadiness === 'ready'`. */
  readyCount: number;
  /** Number of intents with `exportReadiness === 'deferred'`. */
  deferredCount: number;
  /** Number of intents with `exportReadiness === 'blocked'`. */
  blockedCount: number;
  /**
   * Whether any live export pipeline is active. Typed as literal
   * `false` because no live export pipeline exists in this version.
   */
  liveExportEnabled: false;
  /** All export intents in canonical deliverable order. */
  intents: DeliverableExportIntent[];
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic deliverable export manifest. Pure: same call
 * → identical output. No file I/O, no model calls, no DB access.
 *
 * The manifest covers five canonical deliverable types:
 *   1. Program Charter       — html_static (ready with Steward approval)
 *   2. Assessment Report     — html_static (ready, audit trail required)
 *   3. Roadmap               — html_static (not_ready — content pending)
 *   4. Decision Memo         — pdf_later (deferred)
 *   5. Executive Summary     — pptx_later (deferred)
 *
 * Export honesty rules enforced here:
 *   - Only `html_static` can be `ready`.
 *   - `pdf_later`, `docx_later`, `pptx_later` are always `deferred`.
 *   - Intents with `requiresApproval: true` must not be in `ready`
 *     state unless `approvalState === 'approved'`.
 *   - Every intent carries a non-empty `caveat`.
 */
export function buildDeliverableExportManifest(): DeliverableExportManifest {
  const intents: DeliverableExportIntent[] = [
    // ------------------------------------------------------------------
    // 1. Program Charter — html_static, approved, ready
    //    The charter has gone through Steward approval so it is the one
    //    example of a fully-ready html_static export.
    // ------------------------------------------------------------------
    {
      deliverableId: 'artifact-charter-apex-retail-contact-center-ai',
      deliverableName: 'Program Charter — Contact Center AI',
      requestedMode: 'html_static',
      exportReadiness: 'ready',
      exportBlocker: null,
      requiresApproval: true,
      approvalState: 'approved',
      auditRequirement: 'required',
      evidenceTraceRequired: true,
      isLiveExportEnabled: false,
      staticHtmlAvailable: true,
      caveat:
        'Static HTML export only. Export to PDF/DOCX/PPT is planned for a future version. Audit record is required before distributing this document.',
    },

    // ------------------------------------------------------------------
    // 2. Assessment Report — html_static, not_required approval, ready
    //    Operational assessment reports do not require Steward approval
    //    before export but do require an audit trail.
    // ------------------------------------------------------------------
    {
      deliverableId: 'artifact-assessment-apex-retail-cdp-readiness',
      deliverableName: 'Assessment Report — CDP Readiness',
      requestedMode: 'html_static',
      exportReadiness: 'ready',
      exportBlocker: null,
      requiresApproval: false,
      approvalState: 'not_required',
      auditRequirement: 'recommended',
      evidenceTraceRequired: true,
      isLiveExportEnabled: false,
      staticHtmlAvailable: true,
      caveat:
        'Static HTML export only. Export to PDF/DOCX/PPT is planned for a future version. An audit record is recommended when sharing this report externally.',
    },

    // ------------------------------------------------------------------
    // 3. Roadmap — html_static, pending approval, not_ready
    //    The roadmap requires Steward sign-off before export and that
    //    sign-off has not yet been obtained.
    // ------------------------------------------------------------------
    {
      deliverableId: 'artifact-roadmap-apex-retail-store-assoc-productivity',
      deliverableName: 'Roadmap — Store Associate Productivity',
      requestedMode: 'html_static',
      exportReadiness: 'not_ready',
      exportBlocker:
        'Steward approval is required before this roadmap can be exported. Current approvalState is pending.',
      requiresApproval: true,
      approvalState: 'pending',
      auditRequirement: 'required',
      evidenceTraceRequired: true,
      isLiveExportEnabled: false,
      staticHtmlAvailable: false,
      caveat:
        'Export is blocked pending Steward approval. Static HTML export only once approved. Export to PDF/DOCX/PPT is planned for a future version.',
    },

    // ------------------------------------------------------------------
    // 4. Decision Memo — pdf_later, deferred
    //    Decision memos are intended for PDF distribution but the PDF
    //    pipeline does not yet exist.
    // ------------------------------------------------------------------
    {
      deliverableId: 'artifact-decision-memo-apex-retail-demand-forecasting',
      deliverableName: 'Decision Memo — Demand Forecasting AI Vendor Selection',
      requestedMode: 'pdf_later',
      exportReadiness: 'deferred',
      exportBlocker:
        'PDF export is not yet available. The PDF rendering pipeline is planned for a future version.',
      requiresApproval: true,
      approvalState: 'pending',
      auditRequirement: 'required',
      evidenceTraceRequired: true,
      isLiveExportEnabled: false,
      staticHtmlAvailable: false,
      caveat:
        'Export to PDF/DOCX/PPT is planned for a future version. Only html_static export is available in the current version, and it is blocked pending Steward approval.',
    },

    // ------------------------------------------------------------------
    // 5. Executive Summary — pptx_later, deferred
    //    Executive summaries are intended for PowerPoint delivery but
    //    the PPTX pipeline does not yet exist.
    // ------------------------------------------------------------------
    {
      deliverableId: 'artifact-exec-summary-meridian-intelligence-q2',
      deliverableName: 'Executive Summary — Intelligence Program Q2',
      requestedMode: 'pptx_later',
      exportReadiness: 'deferred',
      exportBlocker:
        'PowerPoint (PPTX) export is not yet available. The PPTX rendering pipeline is planned for a future version.',
      requiresApproval: false,
      approvalState: 'not_required',
      auditRequirement: 'not_applicable',
      evidenceTraceRequired: false,
      isLiveExportEnabled: false,
      staticHtmlAvailable: false,
      caveat:
        'Export to PDF/DOCX/PPT is planned for a future version. Only html_static export will be available once the static renderer is wired for this deliverable type.',
    },
  ];

  const readyCount = intents.filter((i) => i.exportReadiness === 'ready').length;
  const deferredCount = intents.filter((i) => i.exportReadiness === 'deferred').length;
  const blockedCount = intents.filter((i) => i.exportReadiness === 'blocked').length;

  return {
    generatedAt: '2026-04-26',
    totalIntents: intents.length,
    readyCount,
    deferredCount,
    blockedCount,
    liveExportEnabled: false,
    intents,
  };
}
