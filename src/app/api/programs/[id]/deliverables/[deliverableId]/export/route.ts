// EXPORT-4 · Format-aware deliverable export route.
//
// POST /api/programs/[id]/deliverables/[kind]/export
//
// Accepts either:
//   { format?: DeliverableFormat, spec: DeliverableSpec }
// or (preferred path used by the agent):
//   { format?: DeliverableFormat, specId: string }
//
// Resolves the format via the format router (kind-aware), dispatches
// to the right renderer (xlsx / docx / html / pdf), audits the attempt
// to `program_export_log`, and returns the binary with the right
// `Content-Type` + `Content-Disposition` headers.
//
// Auth + tenant gating mirror OV2-4b (attachments/upload):
//   - 401 unauthenticated (requireTenancy throws TenancyError)
//   - 403 wrong tenant (program not visible to the active client)
//   - 410 archived/deleted programs
// Mismatches between path `kind` and body `spec.kind` return 400 to
// surface authoring bugs at the boundary instead of silently dropping
// the wrong spec into the wrong renderer.
//
// Per design doc DELIVERABLE_EXPORT_DESIGN.md §6 (slice EXPORT-4) and
// §5 (pilot-readiness floor: auth, audit, telemetry, filename safety).

import { getProgramById } from '@/lib/programs/queries';
import {
  requireTenancy,
  tenancyErrorResponse,
} from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';

import {
  recordExportAudit,
  routeFormat,
  getSpec,
} from '@/lib/programs/exports';
import type {
  DeliverableFormat,
  DeliverableKind,
  DeliverableRenderResult,
  DeliverableSpec,
} from '@/lib/programs/exports';
import { renderDeliverableAsXlsx } from '@/lib/programs/exports/renderers/xlsx';
import { renderDeliverableAsDocx } from '@/lib/programs/exports/renderers/docx';
import { renderDeliverableAsHtml } from '@/lib/programs/exports/renderers/html';
import { renderDeliverableAsPdf } from '@/lib/programs/exports/renderers/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Set of valid deliverable kinds — kept in sync with types.ts. */
const KNOWN_KINDS: ReadonlySet<DeliverableKind> = new Set<DeliverableKind>([
  'program-charter',
  'discovery-report',
  'okr-baseline',
  'stakeholder-map',
  'synthesis-options-table',
  'architecture-sketch',
  'execution-plan',
  'pilot-result-report',
  'outcome-report',
  'bafo-scoreboard',
  'meeting-notes',
  'decision-log',
  'roadmap',
  'financial-baseline',
  'archetype-primer',
  'workshop-facilitator-guide',
]);

/** Set of valid format codes. */
const KNOWN_FORMATS: ReadonlySet<DeliverableFormat> = new Set<DeliverableFormat>([
  'html',
  'xlsx',
  'docx',
  'pdf',
]);

function jsonError(
  status: number,
  code: string,
  detail?: string,
): Response {
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status });
}

function isDeliverableKind(value: unknown): value is DeliverableKind {
  return typeof value === 'string' && KNOWN_KINDS.has(value as DeliverableKind);
}

function isDeliverableFormat(value: unknown): value is DeliverableFormat {
  return typeof value === 'string' && KNOWN_FORMATS.has(value as DeliverableFormat);
}

/**
 * Shallow validator for an inline DeliverableSpec body. Per-kind
 * payload shape is enforced by the renderer (which throws for malformed
 * payloads); here we only confirm the envelope.
 */
function isDeliverableSpecShape(value: unknown): value is DeliverableSpec {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (!isDeliverableKind(obj.kind)) return false;
  if (typeof obj.tenantKey !== 'string' || obj.tenantKey.length === 0) return false;
  if (typeof obj.title !== 'string' || obj.title.length === 0) return false;
  if (!obj.payload || typeof obj.payload !== 'object') return false;
  return true;
}

interface ParsedBody {
  format?: DeliverableFormat;
  spec: DeliverableSpec;
}

/**
 * Parse the POST body, resolving `{ specId }` against the in-memory
 * cache when present and falling back to inline `{ spec }`. Either
 * shape is accepted; the route layer handles the choice transparently.
 */
function parseBody(raw: unknown): ParsedBody | { error: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: 'invalid_body' };
  }
  const body = raw as Record<string, unknown>;
  const format = body.format;
  if (format !== undefined && !isDeliverableFormat(format)) {
    return { error: 'invalid_format' };
  }

  // specId branch — cache lookup.
  if (typeof body.specId === 'string' && body.specId.length > 0) {
    const cached = getSpec(body.specId);
    if (!cached) {
      return { error: 'spec_not_found' };
    }
    return { format: format as DeliverableFormat | undefined, spec: cached };
  }

  // Inline spec branch.
  const spec = body.spec;
  if (!isDeliverableSpecShape(spec)) {
    return { error: 'invalid_spec' };
  }
  return { format: format as DeliverableFormat | undefined, spec };
}

async function dispatchRenderer(
  spec: DeliverableSpec,
  format: DeliverableFormat,
): Promise<DeliverableRenderResult> {
  switch (format) {
    case 'xlsx':
      return renderDeliverableAsXlsx(spec);
    case 'docx':
      return renderDeliverableAsDocx(spec);
    case 'html':
      // EXPORT-4-EXTEND wires the HTML renderer for every kind the
      // format router advertises HTML for (program-charter,
      // outcome-report, stakeholder-map, synthesis-options-table,
      // architecture-sketch, roadmap). `archetype-primer` keeps its
      // own dedicated route at /api/programs/[id]/primer-html and is
      // not advertised for HTML through this generic route.
      return renderDeliverableAsHtml(spec);
    case 'pdf':
      // EXPORT-5 wires the PDF renderer for the print-/archive-ready
      // kinds (program-charter, outcome-report, roadmap).
      return renderDeliverableAsPdf(spec);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; deliverableId: string }> },
): Promise<Response> {
  // Resolve auth FIRST. 401 short-circuits everything downstream so
  // we don't audit unauthenticated probes.
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return jsonError(500, 'internal_error');
    }
  }

  const { id: programId, deliverableId: kindParam } = await params;
  if (!programId) return jsonError(400, 'missing_program_id');
  if (!isDeliverableKind(kindParam)) {
    return jsonError(400, 'invalid_kind', `unknown deliverable kind: ${kindParam}`);
  }
  const pathKind: DeliverableKind = kindParam;

  // Tenant gate — fetch the program scoped by client_id. Returns 403
  // (not 404) so tenants can't enumerate other-tenant program ids.
  const program = await getProgramById(ctx, programId);
  if (!program) {
    return jsonError(403, 'forbidden');
  }
  if (program.archivedAt || program.deletedAt) {
    return jsonError(410, 'archived_or_deleted');
  }

  // Resolve broker-tenant key for the audit row. The split between
  // app ClientKey ('apexretail') and broker key ('apex-retail') is
  // documented in feedback_apex_tenant_key_split.
  const client = await getActiveClientRow();
  if (!client) {
    return jsonError(403, 'no_client');
  }
  const tenantKey = clientKeyToBrokerTenantKey(client.key);

  // Parse + validate body.
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const parsed = parseBody(bodyJson);
  if ('error' in parsed) {
    return jsonError(400, parsed.error);
  }
  const { spec, format: requestedFormat } = parsed;

  // Path/body kind agreement — surface authoring bugs at the boundary.
  if (spec.kind !== pathKind) {
    return jsonError(
      400,
      'kind_mismatch',
      `path kind "${pathKind}" does not match body spec kind "${spec.kind}"`,
    );
  }

  // Resolve format — router enforces the kind's allowed-format set.
  let format: DeliverableFormat;
  try {
    format = routeFormat(pathKind, requestedFormat);
  } catch (err) {
    return jsonError(
      400,
      'format_not_allowed',
      err instanceof Error ? err.message : 'format not allowed for this kind',
    );
  }

  // Render. On any failure (renderer throw or pdf/html-not-yet)
  // record an `outcome: error` audit row and return 500 with a
  // sanitized message. We don't leak stack traces or internal paths.
  let result: DeliverableRenderResult;
  try {
    result = await dispatchRenderer(spec, format);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'render_failed';
    console.error('[POST /api/programs/:id/deliverables/:kind/export] render_failed', {
      programId,
      kind: pathKind,
      format,
      message,
    });
    // Best-effort audit; if the audit insert itself fails, fall through.
    try {
      await recordExportAudit({
        tenantKey,
        programId,
        deliverableKind: pathKind,
        format,
        filename: '',
        sizeBytes: 0,
        actorUserId: ctx.userId,
        outcome: 'error',
        errorMessage: message.slice(0, 500),
      });
    } catch (auditErr) {
      console.error('[POST /api/programs/:id/deliverables/:kind/export] audit_failed_on_render_error', auditErr);
    }
    // Every advertised format now has a working renderer; a failure
    // here is a genuine 500 (malformed payload, layout-engine throw).
    return jsonError(500, 'render_failed', message);
  }

  // Success audit — records the byte length, filename, format. Do
  // not bail the response on audit failure; we log and continue so
  // the user still gets the binary they asked for.
  try {
    await recordExportAudit({
      tenantKey,
      programId,
      deliverableKind: pathKind,
      format: result.format,
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      actorUserId: ctx.userId,
      outcome: 'success',
    });
  } catch (auditErr) {
    console.error('[POST /api/programs/:id/deliverables/:kind/export] audit_failed_on_success', auditErr);
  }

  // Sanitize Content-Disposition. The renderer's filename helper
  // already strips to RFC 6266 ASCII, but defense-in-depth: any
  // residual quotes/backslashes get coerced to safe chars.
  const safeFilename = result.filename.replace(/["\\]/g, '_');

  // Buffer is a Uint8Array subclass but the lib.dom BodyInit type
  // wants `ArrayBufferView<ArrayBuffer>` specifically — a Buffer's
  // backing store is `ArrayBufferLike` (could be SharedArrayBuffer
  // in some runtimes). Copy into a fresh ArrayBuffer-backed view to
  // satisfy the strict typing without leaking memory layout details
  // into the response.
  const arrayBuffer = new ArrayBuffer(result.buffer.byteLength);
  new Uint8Array(arrayBuffer).set(result.buffer);
  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'private, max-age=0',
    },
  });
}
