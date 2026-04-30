// EXPORT-1 · Public surface for the format-aware deliverable export
// pipeline. Re-exports types, the format router, the filename helper,
// and the audit writer.
//
// Renderer entrypoints (`renderDeliverable(spec)`) land in EXPORT-2
// (XLSX), EXPORT-3 (DOCX), and EXPORT-4 (API route + agent
// integration). This slice exposes only the typed contract surface.

export type {
  DeliverableFormat,
  DeliverableKind,
  DeliverableRenderResult,
  DeliverableSpec,
} from './types';

export {
  getDefaultFormat,
  isFormatAllowed,
  listAllowedFormats,
  routeFormat,
} from './format-router';

export { buildExportFilename } from './filename';

export { recordExportAudit } from './audit';
export type { ExportAuditInput, ExportAuditOutcome } from './audit';

// EXPORT-4 · ephemeral spec cache the agent uses to hand a composed
// deliverable spec to the export route via a short-lived id.
export { storeSpec, getSpec, SPEC_CACHE_TTL_MS } from './spec-cache';
