// POST /api/v1/source/:eventId/facts/parse
//
// Parse-and-PROPOSE: a vendor document already extracted into located text blocks
// (page/section/cell/clause locators — no bytes, no upstream LLM here) plus a set
// of catalog-typed locator rules are turned into CANDIDATE facts for human review.
// Nothing is written; candidates come back `validationState: 'proposed'`. A value
// that cannot be located + cited is not proposed (returned under `rejected`).
//
// Body:
//   {
//     document: { doc: string, blocks: Array<{ text: string, locator: string }> },
//     rules: Array<{
//       factKey: string,
//       patterns: string[],          // RegExp sources; first capture = value token
//       entityRef?: string | null,
//       confidence?: 'low'|'med'|'high'
//     }>
//   }
//
// Response 200:
//   { ok, eventId, doc, candidates, rejected }
//
// GATING: dark behind the `source_analytics` flag. When the flag is off for the
// tenant the route returns 404 `{ error: 'not_found' }` — identical to the ingest
// route. No analytics behavior ships until the flag is flipped per tenant.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";
import {
  parseDocumentToCandidates,
  type FactLocatorRule,
  type LocatedBlock,
  type ParsedDocument,
} from "@/lib/source/facts/extraction/parse-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

type ParsedBody =
  | { ok: true; document: ParsedDocument; rules: FactLocatorRule[] }
  | { ok: false; detail: string };

/** Parse + shape the raw request body into a document + typed locator rules. */
function parseParseBody(body: unknown): ParsedBody {
  if (!body || typeof body !== "object") {
    return { ok: false, detail: "body must be a JSON object" };
  }
  const b = body as {
    document?: { doc?: unknown; blocks?: unknown };
    rules?: unknown;
  };

  if (typeof b.document?.doc !== "string" || b.document.doc.trim() === "") {
    return { ok: false, detail: "document.doc (string) is required" };
  }
  if (!Array.isArray(b.document.blocks)) {
    return { ok: false, detail: "document.blocks must be an array" };
  }
  const blocks: LocatedBlock[] = [];
  for (const [i, raw] of b.document.blocks.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, detail: `document.blocks[${i}] must be an object` };
    }
    const blk = raw as { text?: unknown; locator?: unknown };
    if (typeof blk.text !== "string") {
      return { ok: false, detail: `document.blocks[${i}].text must be a string` };
    }
    if (typeof blk.locator !== "string" || blk.locator.trim() === "") {
      return {
        ok: false,
        detail: `document.blocks[${i}].locator must be a non-empty string`,
      };
    }
    blocks.push({ text: blk.text, locator: blk.locator });
  }

  if (!Array.isArray(b.rules)) {
    return { ok: false, detail: "rules must be an array" };
  }
  const rules: FactLocatorRule[] = [];
  for (const [i, raw] of b.rules.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, detail: `rules[${i}] must be an object` };
    }
    const r = raw as {
      factKey?: unknown;
      patterns?: unknown;
      entityRef?: unknown;
      confidence?: unknown;
    };
    if (typeof r.factKey !== "string" || r.factKey.trim() === "") {
      return { ok: false, detail: `rules[${i}].factKey must be a non-empty string` };
    }
    if (
      !Array.isArray(r.patterns) ||
      r.patterns.length === 0 ||
      !r.patterns.every((p) => typeof p === "string")
    ) {
      return {
        ok: false,
        detail: `rules[${i}].patterns must be a non-empty string[] of RegExp sources`,
      };
    }
    let patterns: RegExp[];
    try {
      patterns = (r.patterns as string[]).map((src) => new RegExp(src));
    } catch (err) {
      return {
        ok: false,
        detail: `rules[${i}].patterns has an invalid RegExp: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
    if (
      r.confidence !== undefined &&
      r.confidence !== "low" &&
      r.confidence !== "med" &&
      r.confidence !== "high"
    ) {
      return {
        ok: false,
        detail: `rules[${i}].confidence must be 'low' | 'med' | 'high'`,
      };
    }
    rules.push({
      factKey: r.factKey.trim(),
      patterns,
      entityRef:
        typeof r.entityRef === "string"
          ? r.entityRef
          : r.entityRef === null
            ? null
            : undefined,
      confidence: r.confidence as FactLocatorRule["confidence"],
    });
  }

  return { ok: true, document: { doc: b.document.doc.trim(), blocks }, rules };
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
        { error: "no_client", detail: "No active client for Source fact parse" },
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

    // Auth: a valid tenancy is required past the flag gate.
    if (tenancyError) return tenancyErrorResponse(tenancyError);

    const parsed = parseParseBody(await req.json().catch(() => null));
    if (!parsed.ok) {
      return Response.json(
        { error: "bad_request", detail: parsed.detail },
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

    // Parse → PROPOSE candidates. Nothing is written here.
    const result = parseDocumentToCandidates(parsed.document, parsed.rules, {
      sourceEventId: persistedEvent.id,
      clientKey: effectiveClientKey,
    });

    return Response.json({
      ok: true,
      eventId: persistedEvent.id,
      doc: parsed.document.doc,
      candidates: result.candidates,
      rejected: result.rejected,
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/facts/parse]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
