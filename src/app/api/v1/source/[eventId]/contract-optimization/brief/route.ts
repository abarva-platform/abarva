import type { NextRequest } from "next/server";
import { Packer } from "docx";
import { pdf } from "@react-pdf/renderer";

import { requireTenancy, tenancyErrorResponse } from "../../../../_intel-auth";
import { getActiveClientRow } from "@/lib/active-client";
import { getSourcingEvent } from "@/lib/source/queries";
import {
  buildContractOptimizationBriefMarkdown,
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  isSkyHarborContractOptimizationEvent,
} from "@/lib/source/contract-optimization";
import { DOCX_CONTENT_TYPE } from "@/lib/exports-shared/docx-base";
import { PDF_CONTENT_TYPE } from "@/lib/exports-shared/pdf-base";
import {
  buildNarrativeDocx,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from "@/lib/source/exports/renderers/narrative-docx";
import { buildNarrativePdf } from "@/lib/source/exports/renderers/narrative-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ eventId?: string }>;
};

type ExportFormat = "md" | "docx" | "pdf";

const CONTRACT_OPTIMIZATION_CONFIG: NarrativeDocxConfig = {
  artifactCode: "source_contract_optimization_brief",
  headerLabel: "AMS Contract Optimization Brief",
  eyebrowFor: (tenant) => `Source · Existing Contract Optimization · ${tenant}`,
  documentTitle: "AMS Contract Optimization Brief",
  confidentialityNote:
    "Executive review only — sourcing optimization brief; not for vendor distribution",
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireTenancy();
    const { eventId } = await params;
    if (!eventId) {
      return Response.json({ ok: false, error: "missing_event" }, { status: 400 });
    }
    const [event, activeClient] = await Promise.all([
      getSourcingEvent(eventId),
      getActiveClientRow().catch(() => null),
    ]);
    if (!event) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (
      !isSkyHarborContractOptimizationEvent({
        activeClientKey: activeClient?.key,
        eventCode: event.code,
        eventName: event.name,
      })
    ) {
      return Response.json(
        {
          ok: false,
          error: "not_available",
          detail:
            "No existing-contract optimization profile is available for this Source event.",
        },
        { status: 404 },
      );
    }
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput({
        sourceEventId: event.id,
        tenantKey: activeClient?.key ?? "skyharbor-air",
      }),
    );
    const markdown = buildContractOptimizationBriefMarkdown(profile);
    const format = normalizeFormat(request.nextUrl.searchParams.get("format"));
    const generatedAt = new Date().toISOString();
    const payload: NarrativeDocxPayload = {
      tenantName: activeClient?.name ?? "SkyHarbor Air",
      eventCode: event.code,
      eventName: `${profile.contractName} Optimization Brief`,
      issuedBy: "AbarVa Source",
      generatedAt,
      body: markdown,
      bodyIsAuthored: true,
    };
    const baseName = "skyharbor-ams-contract-optimization-brief";

    if (format === "docx") {
      const document = buildNarrativeDocx(payload, CONTRACT_OPTIMIZATION_CONFIG);
      const buffer = await Packer.toBuffer(document);
      return fileResponse(buffer, DOCX_CONTENT_TYPE, `${baseName}.docx`, format, event.code);
    }
    if (format === "pdf") {
      const element = buildNarrativePdf(payload, CONTRACT_OPTIMIZATION_CONFIG);
      const stream = await pdf(element).toBuffer();
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer | string>) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      return fileResponse(Buffer.concat(chunks), PDF_CONTENT_TYPE, `${baseName}.pdf`, format, event.code);
    }
    return fileResponse(
      Buffer.from(markdown, "utf8"),
      "text/markdown; charset=utf-8",
      `${baseName}.md`,
      format,
      event.code,
    );
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: "internal_error",
          detail:
            error instanceof Error
              ? error.message
              : "Unknown Source contract optimization brief error",
        },
        { status: 500 },
      );
    }
  }
}

function normalizeFormat(value: string | null): ExportFormat {
  if (value === "docx" || value === "pdf") return value;
  return "md";
}

function fileResponse(
  body: Buffer,
  contentType: string,
  filename: string,
  format: ExportFormat,
  eventCode: string,
): Response {
  return new Response(body as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "x-source-artifact-code": "source_contract_optimization_brief",
      "x-source-event-code": eventCode,
      "x-source-artifact-format": format,
    },
  });
}
