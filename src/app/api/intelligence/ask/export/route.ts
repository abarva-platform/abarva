import type { NextRequest } from "next/server";
import { pdf } from "@react-pdf/renderer";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import { renderAvaAnswerStandaloneHtml } from "@/lib/ava-answer/export/render-answer-html";
import { buildAvaAnswerPdf } from "@/lib/ava-answer/export/render-answer-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ExportFormat = "html" | "pdf";

interface ExportPayload {
  answer?: AvaAnswerPacket;
  format?: ExportFormat;
}

function filenameFor(answer: AvaAnswerPacket, format: ExportFormat): string {
  const tenant = answer.tenantKey.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `ava-answer__${tenant}__${date}.${format}`;
}

async function pdfBuffer(answer: AvaAnswerPacket): Promise<Buffer> {
  const stream = await pdf(buildAvaAnswerPdf(answer)).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  let payload: ExportPayload;
  try {
    payload = (await req.json()) as ExportPayload;
  } catch {
    return Response.json(
      { error: "invalid_json", detail: "Request body must be JSON." },
      { status: 400 },
    );
  }

  if (!payload.answer) {
    return Response.json(
      { error: "missing_answer", detail: "Provide an AvaAnswerPacket." },
      { status: 400 },
    );
  }

  const validation = validateAvaAnswerPacket(payload.answer);
  if (!validation.passed) {
    return Response.json(
      {
        error: "invalid_answer_packet",
        violations: validation.violations,
      },
      { status: 422 },
    );
  }

  const format = payload.format ?? "html";
  if (format === "pdf") {
    const buffer = await pdfBuffer(validation.packet);
    return new Response(buffer as unknown as ArrayBuffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filenameFor(
          validation.packet,
          "pdf",
        )}"`,
        "cache-control": "no-store",
        "x-ava-export-format": "pdf",
      },
    });
  }

  const html = renderAvaAnswerStandaloneHtml(validation.packet);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `attachment; filename="${filenameFor(
        validation.packet,
        "html",
      )}"`,
      "cache-control": "no-store",
      "x-ava-export-format": "html",
    },
  });
}
