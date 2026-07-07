// POST /api/v1/source/:eventId/facts/ingest-file
//
// Deterministic FILE → typed facts ingest. Where `/facts/ingest` takes an already
// parsed `{ headers, rows }` upload (bytes extracted upstream), THIS route takes
// the raw file (multipart) and parses it in-process — CSV via papaparse, XLSX via
// exceljs, NO LLM — then hands the parsed rows to the SAME shared map+validate+
// write tail (`ingestTemplateUpload`) `/facts/ingest` uses. Behavior past the
// parse step is byte-for-byte identical and tested once.
//
// Multipart form fields:
//   file          — the CSV / XLSX to parse (required)
//   templateCode  — a code in TEMPLATE_FACT_MAPS (required)
//
// Response 200:
//   { ok, eventId, templateCode, factsWritten, unmappedColumns, rejectedRows }
//
// GATING: identical to /facts/ingest — dark behind the `source_analytics` flag.
// When the flag is off for the tenant it returns 404 `{ error: 'not_found' }`; the
// route does not exist as far as an un-enrolled tenant is concerned. Honesty: a
// malformed / unparseable file returns a 4xx and persists NOTHING; unmapped
// columns + rejected rows are surfaced, never silently dropped.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { parseFileToRows } from "@/lib/source/facts/extraction/file-to-rows";
import {
  ingestTemplateUpload,
  ingestFailureStatus,
} from "@/lib/source/facts/ingest/ingest-template-upload";
import {
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
} from "@/lib/source/artifact-registry/mime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string }> };

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
        {
          error: "no_client",
          detail: "No active client for Source fact file ingest",
        },
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

    // Parse the multipart body.
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return Response.json(
        { error: "bad_request", detail: "invalid multipart form data" },
        { status: 400 },
      );
    }

    const templateRaw = formData.get("templateCode");
    const templateCode =
      typeof templateRaw === "string" ? templateRaw.trim() : "";
    if (templateCode.length === 0) {
      return Response.json(
        { error: "bad_request", detail: "templateCode (string) is required" },
        { status: 400 },
      );
    }

    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return Response.json(
        { error: "bad_request", detail: "file is required" },
        { status: 400 },
      );
    }
    const file = fileEntry as File;

    if (!isWithinSourceArtifactSizeLimit(file.size)) {
      return Response.json(
        {
          error: "oversize",
          detail: `size ${file.size} exceeds limit ${MAX_SOURCE_ARTIFACT_SIZE_BYTES}`,
        },
        { status: 413 },
      );
    }

    // Deterministic file → { headers, rows }. A malformed / unsupported file
    // throws here and NOTHING is persisted.
    const bytes = Buffer.from(await file.arrayBuffer());
    let upload;
    try {
      upload = await parseFileToRows({
        bytes,
        filename: file.name,
        mimeType: file.type,
      });
    } catch (parseError) {
      return Response.json(
        {
          error: "unparseable_file",
          detail:
            parseError instanceof Error
              ? parseError.message
              : "file could not be parsed",
        },
        { status: 400 },
      );
    }

    // Shared map+validate+write tail — identical to /facts/ingest.
    const result = await ingestTemplateUpload({
      templateCode,
      upload,
      scope: { eventId, clientKey: effectiveClientKey },
    });
    if (!result.ok) {
      return Response.json(
        { error: result.code, detail: result.detail },
        { status: ingestFailureStatus(result.code) },
      );
    }

    return Response.json({
      ok: true,
      eventId: result.eventId,
      templateCode: result.templateCode,
      factsWritten: result.factsWritten,
      unmappedColumns: result.unmappedColumns,
      rejectedRows: result.rejectedRows,
    });
  } catch (err) {
    console.error("[POST /api/v1/source/:eventId/facts/ingest-file]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
