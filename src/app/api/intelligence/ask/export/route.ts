import type { NextRequest } from "next/server";
import { pdf } from "@react-pdf/renderer";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import { validateSession } from "@/lib/ava-answer/export/validate-session";
import { buildModelAuthoredSessionPdf } from "@/lib/ava-answer/export/render-model-authored-pdf";
import { renderModelAuthoredSessionHtml } from "@/lib/ava-answer/export/render-model-authored-html";
import {
  renderAvaAnswerStandaloneHtml,
  renderAvaChatSessionStandaloneHtml,
} from "@/lib/ava-answer/export/render-answer-html";
import {
  buildAvaAnswerPdf,
  buildAvaChatSessionPdf,
} from "@/lib/ava-answer/export/render-answer-pdf";
import type { AvaChatSessionExport } from "@/lib/ava-answer/export/session-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ExportFormat = "html" | "pdf";

interface ExportPayload {
  answer?: AvaAnswerPacket;
  session?: AvaChatSessionExport;
  format?: ExportFormat;
}

async function readExportPayload(req: NextRequest): Promise<ExportPayload> {
  const contentType = req.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await req.formData();
    const rawPayload = formData.get("payload");
    if (typeof rawPayload !== "string") {
      throw new Error("missing_form_payload");
    }
    return JSON.parse(rawPayload) as ExportPayload;
  }

  return (await req.json()) as ExportPayload;
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

async function sessionPdfBuffer(
  session: AvaChatSessionExport,
): Promise<Buffer> {
  const authored =
    session.qualityReview || session.turns.some((t) => t.answer?.modelAuthored);
  const stream = await pdf(
    authored
      ? buildModelAuthoredSessionPdf(session)
      : buildAvaChatSessionPdf(session),
  ).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function sessionFilenameFor(
  session: AvaChatSessionExport,
  format: ExportFormat,
): string {
  const tenant = (
    session.tenantKey ||
    session.turns.find((turn) => turn.answer)?.answer?.tenantKey ||
    "tenant"
  )
    .replace(/[^a-z0-9-]+/gi, "-")
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `ava-session__${tenant}__${date}.${format}`;
}

export async function POST(req: NextRequest) {
  try {
    await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  let payload: ExportPayload;
  try {
    payload = await readExportPayload(req);
  } catch {
    return Response.json(
      {
        error: "invalid_payload",
        detail: "Request body must be JSON or a form payload field.",
      },
      { status: 400 },
    );
  }

  if (payload.answer?.modelAuthored && !payload.session) {
    payload.session = {
      title: payload.answer.question,
      surface: "intelligence",
      tenantKey: payload.answer.tenantKey,
      turns: [
        { id: "question", role: "user", body: payload.answer.question },
        {
          id: "answer",
          role: "agent",
          body: payload.answer.prose ?? payload.answer.directAnswer,
          answer: payload.answer,
        },
      ],
    };
  }
  if (payload.session) {
    const validation = validateSession(payload.session);
    if (validation.error) return validation.error;
    const session = validation.session;
    if (!session) {
      return Response.json(
        { error: "invalid_session", detail: "Session validation failed." },
        { status: 400 },
      );
    }

    const format = payload.format ?? "html";
    if (format === "pdf") {
      const buffer = await sessionPdfBuffer(session);
      return new Response(buffer as unknown as ArrayBuffer, {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${sessionFilenameFor(
            session,
            "pdf",
          )}"`,
          "cache-control": "no-store",
          "x-ava-export-format": "pdf",
          "x-ava-export-kind": "session",
        },
      });
    }

    const html =
      session.qualityReview ||
      session.turns.some((t) => t.answer?.modelAuthored)
        ? renderModelAuthoredSessionHtml(session)
        : renderAvaChatSessionStandaloneHtml(session);
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="${sessionFilenameFor(
          session,
          "html",
        )}"`,
        "cache-control": "no-store",
        "x-ava-export-format": "html",
        "x-ava-export-kind": "session",
      },
    });
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
