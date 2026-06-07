import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { understandBatch } from "@/lib/context-ingestion/loader/understand-pipeline";
import { productionUnderstandDeps } from "@/lib/context-ingestion/loader/understand-pipeline";
import type { LoaderDimension } from "@/lib/context-ingestion/loader/contract";
import { LOADER_DIMENSIONS } from "@/lib/context-ingestion/loader/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 40;

function asDimension(value: string | null): LoaderDimension | undefined {
  if (!value) return undefined;
  return (LOADER_DIMENSIONS as string[]).includes(value) ? (value as LoaderDimension) : undefined;
}

/**
 * Admin Loader — "understand" stage. Preserves each original to Blob (Gate 0),
 * parses it, proposes a mapping with Claude, and runs Steward validation.
 * NOTHING is committed here; the response is a reviewable proposal + validation.
 */
export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const clientId = (formData.get("clientId") as string | null)?.trim();
  if (clientId && clientId !== tenancy.clientId) {
    return NextResponse.json({ error: "forbidden_cross_tenant" }, { status: 403 });
  }

  const rawFiles = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "files required" }, { status: 400 });
  }
  if (rawFiles.length > MAX_FILES) {
    return NextResponse.json({ error: `too_many_files:${MAX_FILES}` }, { status: 413 });
  }
  for (const file of rawFiles) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `file exceeds ${MAX_FILE_BYTES} bytes`, fileName: file.name },
        { status: 413 },
      );
    }
  }

  // Optional per-file dimension hints: form fields "dimension:<filename>".
  const dimensionHint = (name: string): LoaderDimension | undefined =>
    asDimension(formData.get(`dimension:${name}`) as string | null);

  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  try {
    const files = await Promise.all(
      rawFiles.map(async (file) => {
        const hint = dimensionHint(file.name);
        return {
          filename: file.name,
          ...(file.type ? { contentType: file.type } : {}),
          bytes: await file.arrayBuffer(),
          ...(hint ? { targetDimension: hint } : {}),
        };
      }),
    );

    const deps = productionUnderstandDeps({ tenantId: tenancy.clientId, userId: tenancy.userId });
    const results = await understandBatch({
      files,
      tenantKey,
      uploadedBy: tenancy.userId,
      deps,
    });

    return NextResponse.json(
      {
        ok: true,
        tenantKey,
        understood: results,
        note: "No data committed. Confirm the proposal(s) to run the governed commit.",
      },
      { status: 200 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: "loader_understand_failed", detail }, { status: 500 });
  }
}
