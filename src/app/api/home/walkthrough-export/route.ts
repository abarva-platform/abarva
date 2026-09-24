import type { NextRequest } from "next/server";
import { pdf } from "@react-pdf/renderer";

import {
  canonicalClientDisplayName,
  type ClientKey,
} from "@/lib/client-config";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
  isHomePreviewTenantKey,
  type HomePreviewTenantKey,
} from "@/lib/home/preview/golden-snapshot";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";
import {
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import {
  buildHomeWalkthroughPdf,
  homeWalkthroughFilename,
  renderHomeWalkthroughHtml,
} from "@/lib/home/export/walkthrough-export";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ExportFormat = "html" | "pdf";

function toHomeTenantKey(
  value: string | null | undefined,
): HomePreviewTenantKey | null {
  if (!value) return null;
  const tenantKey = canonicalTenantKey(value);
  return isHomePreviewTenantKey(tenantKey) ? tenantKey : null;
}

function exportFormat(value: string | null): ExportFormat {
  return value === "pdf" ? "pdf" : "html";
}

async function pdfBuffer(element: ReturnType<typeof buildHomeWalkthroughPdf>) {
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const requestedTenantKey = toHomeTenantKey(url.searchParams.get("tenant"));

  try {
    await requireTenancy(
      requestedTenantKey
        ? {
            requestedClientKey: (appClientKeyForTenant(requestedTenantKey) ??
              requestedTenantKey) as ClientKey,
          }
        : undefined,
    );
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const activeTenant = await resolveTenant().catch(() => null);
  const activeTenantKey =
    toHomeTenantKey(activeTenant?.appClientKey) ??
    toHomeTenantKey(activeTenant?.displayName);
  const tenantKey =
    requestedTenantKey ?? activeTenantKey ?? HOME_PREVIEW_TENANT_KEYS[0];
  const provider = resolveEclProductProvider(url.searchParams.get("provider"));
  const served = isEclProductProvider(provider)
    ? await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey)
    : null;
  const bundle = served?.bundle ?? getHomeReviewBundle(tenantKey);

  if (!bundle) {
    return Response.json(
      {
        error: "missing_home_bundle",
        detail: `No Home bundle for ${tenantKey}.`,
      },
      { status: 404 },
    );
  }

  const recordSource: HomeRecordRenderSource = served?.recordSource ?? {
    kind: "reviewed_snapshot",
    canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
  };
  const tenantLabel =
    canonicalClientDisplayName({ key: tenantKey }) ??
    activeTenant?.displayName ??
    tenantKey;
  const format = exportFormat(url.searchParams.get("format"));

  if (format === "pdf") {
    const buffer = await pdfBuffer(
      buildHomeWalkthroughPdf({
        bundle,
        recordSource,
        tenantLabel,
        format,
      }),
    );
    return new Response(buffer as unknown as ArrayBuffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${homeWalkthroughFilename(
          tenantKey,
          "pdf",
        )}"`,
        "cache-control": "no-store",
        "x-home-export-format": "pdf",
        "x-home-export-kind": "walkthrough",
        "x-home-record-source": recordSource.kind,
      },
    });
  }

  const html = renderHomeWalkthroughHtml({
    bundle,
    recordSource,
    tenantLabel,
    format,
  });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `attachment; filename="${homeWalkthroughFilename(
        tenantKey,
        "html",
      )}"`,
      "cache-control": "no-store",
      "x-home-export-format": "html",
      "x-home-export-kind": "walkthrough",
      "x-home-record-source": recordSource.kind,
    },
  });
}
