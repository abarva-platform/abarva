// POST /api/v1/source/:eventId/facts/parse/commit
//
// Validate → commit: the human's per-candidate decisions (confirm / edit / reject)
// are applied to freshly RE-DERIVED candidates (the same document + rules are
// re-parsed server-side so the committed values are re-grounded against the
// document, never taken as arbitrary client-supplied inserts), then only the
// confirmed/edited facts are persisted through the merged sourceFactWriteAdapter.
// Rejected and still-proposed candidates are dropped — nothing enters the value
// math un-validated.
//
// Body:
//   {
//     document: { doc: string, blocks: Array<{ text: string, locator: string }> },
//     rules: Array<{ factKey, patterns: string[], entityRef?, confidence? }>,
//     decisions: Array<
//       | { candidateId: string, action: 'confirm' }
//       | { candidateId: string, action: 'edit', valueNumeric: number }
//       | { candidateId: string, action: 'reject' }
//     >
//   }
//
// Response 200:
//   { ok, eventId, doc, committed, dropped, unapplied }
//
// GATING: dark behind the `source_analytics` flag — 404 when off, per ingest.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { resolveSourceEventUuidForClient } from "@/lib/source/queries";
import { selectSourceFactWriteAdapter } from "@/lib/data-plane/write-adapters/sourceFactWriteAdapter";
import {
  applyValidationDecisions,
  commitValidatedCandidates,
  parseDocumentToCandidates,
  type FactLocatorRule,
  type LocatedBlock,
  type ParsedDocument,
  type ValidationDecision,
} from "@/lib/source/facts/extraction/parse-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

type ParsedBody =
  | {
      ok: true;
      document: ParsedDocument;
      rules: FactLocatorRule[];
      decisions: ValidationDecision[];
    }
  | { ok: false; detail: string };

function parseDocumentAndRules(b: {
  document?: { doc?: unknown; blocks?: unknown };
  rules?: unknown;
}): { document: ParsedDocument; rules: FactLocatorRule[] } | { detail: string } {
  if (typeof b.document?.doc !== "string" || b.document.doc.trim() === "") {
    return { detail: "document.doc (string) is required" };
  }
  if (!Array.isArray(b.document.blocks)) {
    return { detail: "document.blocks must be an array" };
  }
  const blocks: LocatedBlock[] = [];
  for (const [i, raw] of b.document.blocks.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { detail: `document.blocks[${i}] must be an object` };
    }
    const blk = raw as { text?: unknown; locator?: unknown };
    if (typeof blk.text !== "string") {
      return { detail: `document.blocks[${i}].text must be a string` };
    }
    if (typeof blk.locator !== "string" || blk.locator.trim() === "") {
      return { detail: `document.blocks[${i}].locator must be a non-empty string` };
    }
    blocks.push({ text: blk.text, locator: blk.locator });
  }

  if (!Array.isArray(b.rules)) {
    return { detail: "rules must be an array" };
  }
  const rules: FactLocatorRule[] = [];
  for (const [i, raw] of b.rules.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { detail: `rules[${i}] must be an object` };
    }
    const r = raw as {
      factKey?: unknown;
      patterns?: unknown;
      entityRef?: unknown;
      confidence?: unknown;
    };
    if (typeof r.factKey !== "string" || r.factKey.trim() === "") {
      return { detail: `rules[${i}].factKey must be a non-empty string` };
    }
    if (
      !Array.isArray(r.patterns) ||
      r.patterns.length === 0 ||
      !r.patterns.every((p) => typeof p === "string")
    ) {
      return {
        detail: `rules[${i}].patterns must be a non-empty string[] of RegExp sources`,
      };
    }
    let patterns: RegExp[];
    try {
      patterns = (r.patterns as string[]).map((src) => new RegExp(src));
    } catch (err) {
      return {
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
      return { detail: `rules[${i}].confidence must be 'low' | 'med' | 'high'` };
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
  return { document: { doc: b.document.doc.trim(), blocks }, rules };
}

function parseDecisions(
  raw: unknown,
): { decisions: ValidationDecision[] } | { detail: string } {
  if (!Array.isArray(raw)) {
    return { detail: "decisions must be an array" };
  }
  const decisions: ValidationDecision[] = [];
  for (const [i, d] of raw.entries()) {
    if (!d || typeof d !== "object" || Array.isArray(d)) {
      return { detail: `decisions[${i}] must be an object` };
    }
    const dec = d as {
      candidateId?: unknown;
      action?: unknown;
      valueNumeric?: unknown;
    };
    if (typeof dec.candidateId !== "string" || dec.candidateId.trim() === "") {
      return { detail: `decisions[${i}].candidateId must be a non-empty string` };
    }
    if (
      dec.action !== "confirm" &&
      dec.action !== "edit" &&
      dec.action !== "reject"
    ) {
      return {
        detail: `decisions[${i}].action must be 'confirm' | 'edit' | 'reject'`,
      };
    }
    if (dec.action === "edit") {
      if (typeof dec.valueNumeric !== "number" || !Number.isFinite(dec.valueNumeric)) {
        return {
          detail: `decisions[${i}] edit requires a finite valueNumeric`,
        };
      }
      decisions.push({
        candidateId: dec.candidateId,
        action: "edit",
        valueNumeric: dec.valueNumeric,
      });
    } else {
      decisions.push({ candidateId: dec.candidateId, action: dec.action });
    }
  }
  return { decisions };
}

function parseCommitBody(body: unknown): ParsedBody {
  if (!body || typeof body !== "object") {
    return { ok: false, detail: "body must be a JSON object" };
  }
  const b = body as {
    document?: { doc?: unknown; blocks?: unknown };
    rules?: unknown;
    decisions?: unknown;
  };
  const docRules = parseDocumentAndRules(b);
  if ("detail" in docRules) return { ok: false, detail: docRules.detail };
  const decisions = parseDecisions(b.decisions);
  if ("detail" in decisions) return { ok: false, detail: decisions.detail };
  return {
    ok: true,
    document: docRules.document,
    rules: docRules.rules,
    decisions: decisions.decisions,
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
        { error: "no_client", detail: "No active client for Source fact commit" },
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

    const parsed = parseCommitBody(await req.json().catch(() => null));
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

    const ctx = {
      sourceEventId: persistedEvent.id,
      clientKey: effectiveClientKey,
    };

    // Re-derive candidates server-side (re-grounded), apply the human decisions,
    // then commit ONLY the confirmed/edited facts through the write seam.
    const { candidates } = parseDocumentToCandidates(
      parsed.document,
      parsed.rules,
      ctx,
    );
    const { validated, unapplied } = applyValidationDecisions(
      candidates,
      parsed.decisions,
    );

    const writeAdapter = selectSourceFactWriteAdapter(
      undefined,
      effectiveClientKey,
    );
    const commit = await commitValidatedCandidates(validated, ctx, writeAdapter);
    if (!commit.ok) {
      return Response.json(
        { error: "write_failed", detail: commit.error },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      eventId: persistedEvent.id,
      doc: parsed.document.doc,
      committed: commit.committed,
      dropped: commit.dropped,
      unapplied,
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/facts/parse/commit]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
