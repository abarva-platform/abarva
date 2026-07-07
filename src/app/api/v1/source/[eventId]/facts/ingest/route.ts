// POST /api/v1/source/:eventId/facts/ingest
//
// Deterministic structured-map fact ingest: a PARSED intake template (rows ×
// columns, extracted upstream — no bytes, no LLM here) is mapped to typed
// `source_event_facts` rows and persisted, RLS-scoped by client_key.
//
// Body:
//   {
//     templateCode: string,          // a code in TEMPLATE_FACT_MAPS
//     upload: { headers: string[], rows: Array<Record<string, string|number|null>> }
//   }
//
// Response 200:
//   { ok, eventId, templateCode, factsWritten, unmappedColumns, rejectedRows }
//
// GATING: the whole route is dark behind the `source_analytics` flag. When the
// flag is off for the tenant it returns 404 `{ error: 'not_found' }` — the route
// does not exist as far as an un-enrolled tenant is concerned. No analytics
// behavior ships until the flag is flipped per tenant, live-proven.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";
import { templateFactMapByCode } from "@/lib/source/facts/template-fact-map";
import {
  mapTemplateUploadToFacts,
  type ParsedTemplateRow,
  type ParsedTemplateUpload,
} from "@/lib/source/facts/extraction/structured-map";
import { selectSourceFactWriteAdapter } from "@/lib/data-plane/write-adapters/sourceFactWriteAdapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

/** Parse + shape the raw request body into a typed upload, or an error string. */
function parseUploadBody(body: unknown):
  | { ok: true; templateCode: string; upload: ParsedTemplateUpload }
  | { ok: false; detail: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, detail: "body must be a JSON object" };
  }
  const b = body as {
    templateCode?: unknown;
    upload?: { headers?: unknown; rows?: unknown };
  };
  if (typeof b.templateCode !== "string" || b.templateCode.trim() === "") {
    return { ok: false, detail: "templateCode (string) is required" };
  }
  const rawHeaders = b.upload?.headers;
  const rawRows = b.upload?.rows;
  if (!Array.isArray(rawHeaders) || !rawHeaders.every((h) => typeof h === "string")) {
    return { ok: false, detail: "upload.headers must be a string[]" };
  }
  if (!Array.isArray(rawRows)) {
    return { ok: false, detail: "upload.rows must be an array" };
  }
  const rows: ParsedTemplateRow[] = [];
  for (const [i, r] of rawRows.entries()) {
    if (!r || typeof r !== "object" || Array.isArray(r)) {
      return { ok: false, detail: `upload.rows[${i}] must be an object` };
    }
    rows.push(r as ParsedTemplateRow);
  }
  return {
    ok: true,
    templateCode: b.templateCode.trim(),
    upload: { headers: rawHeaders as string[], rows },
  };
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey)
        ? currentUser.metadataClientKey
        : null) ?? inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey =
      tenancy?.clientKey ?? activeClient?.key ?? fallbackClientKey;

    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        { error: "no_client", detail: "No active client for Source fact ingest" },
        { status: 403 },
      );
    }

    // ── Flag gate: dark until enrolled per tenant. Un-enrolled = route absent. ──
    const flagCtx = {
      clientKey: effectiveClientKey,
      clientId: tenancy?.clientId ?? activeClient?.id ?? null,
    };
    if (!isFeatureEnabled(flagCtx, "source_analytics")) {
      return Response.json(
        { error: "not_found", detail: "source analytics is not enabled" },
        { status: 404 },
      );
    }

    // Auth: a valid tenancy is required to write facts (past the flag gate).
    if (tenancyError) return tenancyErrorResponse(tenancyError);

    const parsed = parseUploadBody(await req.json().catch(() => null));
    if (!parsed.ok) {
      return Response.json(
        { error: "bad_request", detail: parsed.detail },
        { status: 400 },
      );
    }

    const template = templateFactMapByCode(parsed.templateCode);
    if (!template) {
      return Response.json(
        {
          error: "unknown_template",
          detail: `No template fact map for code '${parsed.templateCode}'`,
        },
        { status: 400 },
      );
    }

    // Resolve + tenant-fence the event.
    const supabase = getAzureReadFluentClient();
    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventId,
      effectiveClientKey,
    ).catch(() => null);
    const lookupId = resolvedEventId ?? eventId;
    const { data: persistedEvent, error: fetchError } = await supabase
      .from("source_events")
      .select("id, client_key")
      .eq("id", lookupId)
      .maybeSingle();

    if (fetchError) {
      return Response.json(
        { error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent || persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    // Deterministic map → typed facts.
    const mapped = mapTemplateUploadToFacts(template, parsed.upload, {
      sourceEventId: persistedEvent.id,
      clientKey: effectiveClientKey,
    });

    // Persist through the data-plane write seam (RLS-scoped by client_key).
    const writeAdapter = selectSourceFactWriteAdapter(
      undefined,
      effectiveClientKey,
    );
    const write = await writeAdapter.insertFacts(mapped.facts);
    if (!write.ok) {
      return Response.json(
        { error: "write_failed", detail: write.error },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      eventId: persistedEvent.id,
      templateCode: template.templateCode,
      factsWritten: write.data?.inserted ?? 0,
      unmappedColumns: mapped.unmappedColumns,
      rejectedRows: mapped.rejectedRows,
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/facts/ingest]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
