import type { NextRequest } from "next/server";
import { pdf } from "@react-pdf/renderer";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import {
  renderAvaAnswerStandaloneHtml,
  renderAvaChatSessionStandaloneHtml,
} from "@/lib/ava-answer/export/render-answer-html";
import {
  buildAvaAnswerPdf,
  buildAvaChatSessionPdf,
} from "@/lib/ava-answer/export/render-answer-pdf";
import type {
  AvaChatSessionExport,
  AvaChatSessionExportTurn,
} from "@/lib/ava-answer/export/session-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ExportFormat = "html" | "pdf";

interface ExportPayload {
  answer?: AvaAnswerPacket;
  session?: AvaChatSessionExport;
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

async function sessionPdfBuffer(session: AvaChatSessionExport): Promise<Buffer> {
  const stream = await pdf(buildAvaChatSessionPdf(session)).toBuffer();
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

function isTurn(value: unknown): value is AvaChatSessionExportTurn {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.role === "user" || record.role === "agent") &&
    typeof record.body === "string"
  );
}

function validateSession(
  raw: AvaChatSessionExport,
): { session?: AvaChatSessionExport; error?: Response } {
  if (!raw || typeof raw !== "object") {
    return {
      error: Response.json(
        { error: "invalid_session", detail: "Session must be an object." },
        { status: 400 },
      ),
    };
  }
  if (typeof raw.surface !== "string" || !raw.surface.trim()) {
    return {
      error: Response.json(
        { error: "invalid_session", detail: "Session surface is required." },
        { status: 400 },
      ),
    };
  }
  if (!Array.isArray(raw.turns) || raw.turns.length === 0) {
    return {
      error: Response.json(
        { error: "empty_session", detail: "Session must include at least one turn." },
        { status: 400 },
      ),
    };
  }
  if (raw.turns.length > 80) {
    return {
      error: Response.json(
        { error: "session_too_large", detail: "Session export is limited to 80 turns." },
        { status: 413 },
      ),
    };
  }

  const turns: AvaChatSessionExportTurn[] = [];
  for (const [index, turn] of raw.turns.entries()) {
    if (!isTurn(turn)) {
      return {
        error: Response.json(
          { error: "invalid_session_turn", detail: `Turn ${index + 1} is invalid.` },
          { status: 400 },
        ),
      };
    }
    const answer = turn.answer
      ? validateAvaAnswerPacket(turn.answer)
      : null;
    if (answer && !answer.passed) {
      return {
        error: Response.json(
          {
            error: "invalid_answer_packet",
            turnId: turn.id,
            violations: answer.violations,
          },
          { status: 422 },
        ),
      };
    }
    turns.push({
      id: turn.id,
      role: turn.role,
      body: turn.body.slice(0, 30_000),
      at: typeof turn.at === "string" ? turn.at : undefined,
      answer: answer?.packet ?? null,
    });
  }

  return {
    session: {
      title: typeof raw.title === "string" ? raw.title.slice(0, 180) : undefined,
      surface: raw.surface,
      tenantKey:
        typeof raw.tenantKey === "string" ? raw.tenantKey.slice(0, 120) : undefined,
      turns,
    },
  };
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

    const html = renderAvaChatSessionStandaloneHtml(session);
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
