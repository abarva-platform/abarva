// ─────────────────────────────────────────────────────────────────────────────
// Shared structured-map ingest — the map + validate + write core BOTH the
// `/facts/ingest` (parsed-JSON) and `/facts/ingest-file` (multipart file) routes
// call, so their persistence behavior is byte-for-byte identical and tested once.
//
// This owns ONLY the deterministic pipeline once a template + a parsed upload are
// in hand: resolve the template map, tenant-fence the event, map columns → typed
// facts via `mapTemplateUploadToFacts`, and persist through the RLS-scoped
// `sourceFactWriteAdapter`. Auth, the `source_analytics` flag gate, and (for the
// file route) byte parsing stay in the route — this is the shared TAIL, not the
// whole route. A malformed / unmapped upload surfaces `unmappedColumns` +
// `rejectedRows` rather than silently dropping, and a write failure is returned
// loudly (never a fake success).
// ─────────────────────────────────────────────────────────────────────────────

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";
import {
  templateFactMapByCode,
  type TemplateFactMap,
} from "@/lib/source/facts/template-fact-map";
import {
  mapTemplateUploadToFacts,
  type ParsedTemplateUpload,
} from "@/lib/source/facts/extraction/structured-map";
import { resolveValueArchetype } from "@/lib/source/facts/view/stage-analytics-builder";
import {
  selectSourceFactWriteAdapter,
  type SourceFactWriteAdapter,
} from "@/lib/data-plane/write-adapters/sourceFactWriteAdapter";

/** The scope every ingested fact is stamped with + fenced against. */
export interface IngestScope {
  /** The URL event id/slug (resolved to a UUID + tenant-checked here). */
  readonly eventId: string;
  /** The caller's effective client key (tenant scope). */
  readonly clientKey: string;
}

/**
 * A structured, non-throwing ingest outcome. `ok:false` carries a machine code +
 * detail the route maps to an HTTP status; `ok:true` carries the persisted result
 * the route returns verbatim.
 */
export type IngestTemplateUploadResult =
  | {
      readonly ok: true;
      readonly eventId: string;
      readonly templateCode: string;
      readonly factsWritten: number;
      readonly unmappedColumns: string[];
      readonly rejectedRows: ReturnType<
        typeof mapTemplateUploadToFacts
      >["rejectedRows"];
    }
  | {
      readonly ok: false;
      /** Machine code → HTTP status: unknown_template=400, not_found=404, … */
      readonly code:
        | "unknown_template"
        | "lookup_failed"
        | "not_found"
        | "write_failed";
      readonly detail: string;
    };

/** Injectable dependencies so the core is unit-tested without a live backend. */
export interface IngestTemplateUploadDeps {
  readonly getReadClient?: typeof getAzureReadFluentClient;
  readonly resolveEventUuid?: typeof resolveSourceEventUuidForClient;
  readonly templateByCode?: (code: string) => TemplateFactMap | undefined;
  readonly selectWriteAdapter?: (
    plane: undefined,
    clientKey: string,
  ) => SourceFactWriteAdapter;
}

/**
 * Map a parsed template upload to typed facts and persist them, tenant-fenced.
 *
 * The single shared tail of both fact-ingest routes. Given a resolved template
 * code + a parsed `{ headers, rows }` upload + the event/tenant scope, this:
 *   1. resolves the template fact-map (400 `unknown_template` if absent),
 *   2. resolves + tenant-fences the event (404 `not_found` on miss/other tenant),
 *   3. deterministically maps columns → typed facts (`structured_map`, cited),
 *   4. persists them through the RLS-scoped write adapter (500 `write_failed`).
 *
 * Never throws for an expected failure — returns a typed `ok:false`. The caller
 * owns auth + the flag gate; this owns the deterministic map+write only.
 */
export async function ingestTemplateUpload(
  args: {
    readonly templateCode: string;
    readonly upload: ParsedTemplateUpload;
    readonly scope: IngestScope;
  },
  deps: IngestTemplateUploadDeps = {},
): Promise<IngestTemplateUploadResult> {
  const getReadClient = deps.getReadClient ?? getAzureReadFluentClient;
  const resolveEventUuid =
    deps.resolveEventUuid ?? resolveSourceEventUuidForClient;
  const templateByCode = deps.templateByCode ?? templateFactMapByCode;
  const selectWriteAdapter =
    deps.selectWriteAdapter ?? selectSourceFactWriteAdapter;

  const template = templateByCode(args.templateCode);
  if (!template) {
    return {
      ok: false,
      code: "unknown_template",
      detail: `No template fact map for code '${args.templateCode}'`,
    };
  }

  // Resolve + tenant-fence the event (same discipline as /facts/ingest).
  const supabase = getReadClient();
  const resolvedEventId = await resolveEventUuid(
    args.scope.eventId,
    args.scope.clientKey,
  ).catch(() => null);
  const lookupId = resolvedEventId ?? args.scope.eventId;
  const { data: persistedEvent, error: fetchError } = await supabase
    .from("source_events")
    .select("id, client_key")
    .eq("id", lookupId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, code: "lookup_failed", detail: fetchError.message };
  }
  if (
    !persistedEvent ||
    persistedEvent.client_key !== args.scope.clientKey
  ) {
    return {
      ok: false,
      code: "not_found",
      detail: `No source event with id ${args.scope.eventId}`,
    };
  }

  // For a COMPOSITE template whose entity_ref carries a canonical lever key (e.g.
  // RESPONSE_COVERAGE_V1's Vendor::Lever Key), resolve the archetype's lever-key
  // set so the structured map can reject a non-canonical lever loudly. Resolved
  // the same way the insight builder does (first archetype with value-lever rules
  // today — AMS); a phantom lever never enters the model. Non-composite templates
  // pass no set and are unaffected.
  let validLeverKeys: ReadonlySet<string> | undefined;
  if ((template.entityRefColumns?.length ?? 0) > 0) {
    const archetype = resolveValueArchetype(undefined);
    const keys = (archetype?.valueLeverRules ?? []).map((r) => r.key);
    validLeverKeys = new Set<string>(keys);
  }

  // Deterministic map → typed facts.
  const mapped = mapTemplateUploadToFacts(template, args.upload, {
    sourceEventId: persistedEvent.id,
    clientKey: args.scope.clientKey,
    validLeverKeys,
  });

  // Persist through the data-plane write seam (RLS-scoped by client_key).
  const writeAdapter = selectWriteAdapter(undefined, args.scope.clientKey);
  const write = await writeAdapter.insertFacts(mapped.facts);
  if (!write.ok) {
    return {
      ok: false,
      code: "write_failed",
      detail: write.error ?? "fact write failed",
    };
  }

  return {
    ok: true,
    eventId: persistedEvent.id,
    templateCode: template.templateCode,
    factsWritten: write.data?.inserted ?? 0,
    unmappedColumns: mapped.unmappedColumns,
    rejectedRows: mapped.rejectedRows,
  };
}

/** Map an ingest failure code to its HTTP status. */
export function ingestFailureStatus(
  code: Extract<IngestTemplateUploadResult, { ok: false }>["code"],
): number {
  switch (code) {
    case "unknown_template":
      return 400;
    case "not_found":
      return 404;
    case "lookup_failed":
    case "write_failed":
      return 500;
  }
}
