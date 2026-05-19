// GET /programs/expert-kernel/expert-review/export
//
// Streams a Moves Expert Kernel artifact as a downloadable file. Query params:
//   ?case=<caseId>        — apexretail | meridian | arcturus
//   ?artifact=<artifactId>— discover_brief | charter_case | business_case_pack
//                           | financial_model | cfo_pack | mobilize_pack
//   ?format=<docx|xlsx|pdf>
//
// The route validates every param (400 on bad input), resolves the tenant
// case through the `expert-review-cases` registry, renders the artifact via
// the pure renderer modules, and streams the bytes with the correct
// Content-Type and Content-Disposition: attachment headers.
//
// It never 500s on a known-thin case: a `kill` verdict, a null payback or a
// declared seed gap are valid, rendered outcomes — not errors. The renderers
// are deterministic and pure; a 500 here would mean a genuine renderer bug.
//
// Auth: a valid Clerk session. The exported content is the fixed kernel
// anchors (Apex / Meridian / First Capital demo substrate) — no per-tenant
// customer data — so a session is the gate, consistent with the console page.

import type { NextRequest } from 'next/server';
import { Packer } from 'docx';
import { pdf } from '@react-pdf/renderer';

import { getCurrentUser } from '@/lib/auth/current-user';
import {
  isExpertReviewCaseId,
  resolveExpertReviewCase,
} from '@/lib/programs/expert-kernel/expert-review-cases';
import {
  ARTIFACT_CONTENT_TYPE,
  artifactSupportsFormat,
  isArtifactFormat,
  isKernelArtifactId,
  kernelArtifactFilename,
  renderKernelArtifact,
  resolveKernelArtifact,
} from '@/lib/programs/expert-kernel/exports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function badRequest(detail: string): Response {
  return Response.json({ error: 'bad_request', detail }, { status: 400 });
}

export async function GET(req: NextRequest): Promise<Response> {
  // --- Auth — a valid session. -------------------------------------------
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return Response.json(
      { error: 'unauthorized', detail: 'A signed-in session is required.' },
      { status: 401 },
    );
  }

  // --- Param validation — 400 on anything malformed. ----------------------
  const { searchParams } = new URL(req.url);
  const caseParam = searchParams.get('case');
  const artifactParam = searchParams.get('artifact');
  const formatParam = searchParams.get('format');

  if (!caseParam || !isExpertReviewCaseId(caseParam)) {
    return badRequest(
      `Unknown or missing ?case — expected one of apexretail, meridian, ` +
        `arcturus (got ${JSON.stringify(caseParam)}).`,
    );
  }
  if (!artifactParam || !isKernelArtifactId(artifactParam)) {
    return badRequest(
      `Unknown or missing ?artifact (got ${JSON.stringify(artifactParam)}).`,
    );
  }
  if (!formatParam || !isArtifactFormat(formatParam)) {
    return badRequest(
      `Unknown or missing ?format — expected docx, xlsx or pdf (got ` +
        `${JSON.stringify(formatParam)}).`,
    );
  }
  if (!artifactSupportsFormat(artifactParam, formatParam)) {
    return badRequest(
      `Artifact '${artifactParam}' is not available as ${formatParam}.`,
    );
  }

  const caseEntry = resolveExpertReviewCase(caseParam);
  const artifact = resolveKernelArtifact(artifactParam);
  if (!artifact) {
    // Defensive — isKernelArtifactId already guaranteed resolution.
    return badRequest(`Artifact '${artifactParam}' could not be resolved.`);
  }

  const generatedOn = new Date().toISOString().slice(0, 10);

  // --- Render + serialize. -----------------------------------------------
  let body: Uint8Array;
  try {
    const rendered = renderKernelArtifact({
      caseEntry,
      artifact,
      format: formatParam,
      generatedOn,
    });
    if (rendered.format === 'docx') {
      body = await Packer.toBuffer(rendered.document);
    } else if (rendered.format === 'xlsx') {
      const buf = await rendered.workbook.xlsx.writeBuffer();
      body = new Uint8Array(buf as ArrayBuffer);
    } else {
      const stream = await pdf(rendered.element).toBuffer();
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer | string>) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      body = Buffer.concat(chunks);
    }
  } catch (err) {
    console.error(
      '[GET /programs/expert-kernel/expert-review/export] render error',
      { case: caseParam, artifact: artifactParam, format: formatParam, err },
    );
    return Response.json(
      {
        error: 'render_failed',
        detail:
          err instanceof Error ? err.message : 'Kernel artifact render failed.',
      },
      { status: 500 },
    );
  }

  const filename = kernelArtifactFilename(
    caseEntry.tenantKey,
    artifact.id,
    formatParam,
    generatedOn,
  );

  return new Response(body as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': ARTIFACT_CONTENT_TYPE[formatParam],
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-kernel-case': caseEntry.id,
      'x-kernel-artifact': artifact.id,
      'x-kernel-format': formatParam,
    },
  });
}
