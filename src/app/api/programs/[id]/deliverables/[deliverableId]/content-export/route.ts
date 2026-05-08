// GET /api/programs/[id]/deliverables/[deliverableId]/content-export
//
// Exports the latest markdown content from deliverable_versions as either:
//   ?format=html  — standalone HTML document (inline CSS, AbarVa palette)
//   ?format=docx  — Word document (.docx) built from markdown headings/lists/text
//
// This is a simpler, complementary route to the structured-spec export at
// /api/programs/[id]/deliverables/[kind]/export. That route requires a
// typed DeliverableSpec payload; this route works from the raw Nexus-authored
// markdown stored in deliverable_versions.content (the "concise markdown
// artifact" written by the agent during phase work).
//
// Auth: requireTenancy + program tenant gate (403 if program not visible).
// The deliverable row must belong to the program (defense in depth).
//
// Returns:
//   200  — binary with Content-Type + Content-Disposition: attachment
//   400  — missing params or invalid format
//   403  — not authorised for this tenant / program
//   404  — program or deliverable not found, or no content exists yet
//   500  — render failure

import 'server-only';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { getServerSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Format = 'html' | 'docx';

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status });
}

function safeFilename(title: string, ext: string): string {
  const base = title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60)
    .replace(/-+$/, '') || 'deliverable';
  return `${base}.${ext}`;
}

// ── Markdown → HTML ───────────────────────────────────────────────────────────
//
// Simple line-by-line converter for the subset of markdown Nexus produces:
//   # / ## / ### headings, **bold**, *italic*, - bullets, > blockquote,
//   --- separator, plain paragraphs. Does NOT handle tables or code blocks.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function markdownToHtml(md: string, title: string): string {
  const lines = md.split('\n');
  const bodyParts: string[] = [];
  let inUl = false;

  function closeUl() {
    if (inUl) {
      bodyParts.push('</ul>');
      inUl = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^# /.test(line)) {
      closeUl();
      bodyParts.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (/^## /.test(line)) {
      closeUl();
      bodyParts.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (/^### /.test(line)) {
      closeUl();
      bodyParts.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (/^[-*] /.test(line)) {
      if (!inUl) { bodyParts.push('<ul>'); inUl = true; }
      bodyParts.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else if (/^> /.test(line)) {
      closeUl();
      bodyParts.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    } else if (/^---+$/.test(line)) {
      closeUl();
      bodyParts.push('<hr>');
    } else if (line.trim() === '') {
      closeUl();
    } else {
      closeUl();
      bodyParts.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeUl();

  const body = bodyParts.join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.65;
      color: #1A1A18;
      background: #F8F7F4;
      max-width: 780px;
      margin: 48px auto;
      padding: 0 24px 80px;
    }
    h1 { font-family: Georgia, serif; font-size: 26px; font-weight: normal; margin: 0 0 8px; }
    h2 { font-family: Georgia, serif; font-size: 19px; font-weight: normal; margin: 32px 0 8px; border-bottom: 1px solid #E2DFD8; padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #525866; margin: 24px 0 6px; }
    p  { margin: 0 0 12px; }
    ul { padding-left: 22px; margin: 0 0 12px; }
    li { margin-bottom: 4px; }
    blockquote { border-left: 3px solid #1B2B5C; margin: 16px 0; padding: 4px 16px; background: rgba(27,43,92,0.04); color: #525866; }
    hr { border: none; border-top: 1px solid #E2DFD8; margin: 24px 0; }
    strong { font-weight: 600; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: #ECEAE4; padding: 1px 5px; border-radius: 3px; }
    .doc-header { border-bottom: 2px solid #1B2B5C; padding-bottom: 16px; margin-bottom: 32px; }
    .doc-meta { font-size: 11px; color: #9AA3B2; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-meta">Nexus · Deliverable Output</div>
    <h1>${escapeHtml(title)}</h1>
  </div>
  ${body}
</body>
</html>`;
}

// ── Markdown → DOCX ──────────────────────────────────────────────────────────
//
// Converts the same markdown subset into a Word document using the `docx`
// package (already installed at ^9.6.1). Handles: H1/H2/H3, bullet lists,
// bold/italic inline, blockquote (indented), horizontal rule, paragraphs.

interface ParsedInline {
  text: string;
  bold?: boolean;
  italics?: boolean;
  monospace?: boolean;
}

function parseInline(text: string): ParsedInline[] {
  const result: ParsedInline[] = [];
  // Simple state machine: scan for **bold**, *italic*, `code`
  let i = 0;
  let buf = '';
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      if (buf) { result.push({ text: buf }); buf = ''; }
      const end = text.indexOf('**', i + 2);
      if (end === -1) { buf += text.slice(i); break; }
      result.push({ text: text.slice(i + 2, end), bold: true });
      i = end + 2;
    } else if (text[i] === '*' && text[i + 1] !== '*') {
      if (buf) { result.push({ text: buf }); buf = ''; }
      const end = text.indexOf('*', i + 1);
      if (end === -1) { buf += text.slice(i); break; }
      result.push({ text: text.slice(i + 1, end), italics: true });
      i = end + 1;
    } else if (text[i] === '`') {
      if (buf) { result.push({ text: buf }); buf = ''; }
      const end = text.indexOf('`', i + 1);
      if (end === -1) { buf += text.slice(i); break; }
      result.push({ text: text.slice(i + 1, end), monospace: true });
      i = end + 1;
    } else {
      buf += text[i++];
    }
  }
  if (buf) result.push({ text: buf });
  return result;
}

function textRuns(text: string): TextRun[] {
  return parseInline(text).map(
    (p) =>
      new TextRun({
        text: p.text,
        bold: p.bold,
        italics: p.italics,
        font: p.monospace ? 'Courier New' : undefined,
        size: p.monospace ? 20 : undefined,
      }),
  );
}

function markdownToDocx(md: string, title: string): Promise<Uint8Array> {
  const lines = md.split('\n');
  const paragraphs: Paragraph[] = [];

  // Document title as H1
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  );

  let inBulletList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^# /.test(line)) {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(2)), heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
    } else if (/^## /.test(line)) {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(3)), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }));
    } else if (/^### /.test(line)) {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(4)), heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 } }));
    } else if (/^[-*] /.test(line)) {
      inBulletList = true;
      paragraphs.push(new Paragraph({ children: textRuns(line.slice(2)), bullet: { level: 0 }, spacing: { after: 60 } }));
    } else if (/^> /.test(line)) {
      inBulletList = false;
      paragraphs.push(
        new Paragraph({
          children: textRuns(line.slice(2)),
          indent: { left: 720 },
          spacing: { after: 80 },
          alignment: AlignmentType.LEFT,
        }),
      );
    } else if (/^---+$/.test(line)) {
      inBulletList = false;
      // Blank spacer paragraph as section separator
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200, before: 200 } }));
    } else if (line.trim() === '') {
      inBulletList = false;
    } else {
      inBulletList = false;
      paragraphs.push(new Paragraph({ children: textRuns(line), spacing: { after: 100 } }));
    }
  }

  const doc = new Document({
    creator: 'Nexus',
    title,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 }, // 11pt
        },
      },
    },
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc) as Promise<Uint8Array>;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; deliverableId: string }> },
): Promise<Response> {
  // Auth
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch { return jsonError(500, 'internal_error'); }
  }
  void ctx; // used implicitly by requireTenancy side-effects (session + tenant check)

  const { id: programId, deliverableId } = await params;
  if (!programId || !deliverableId) return jsonError(400, 'missing_params');

  const url = new URL(req.url);
  const formatParam = url.searchParams.get('format') ?? 'html';
  if (formatParam !== 'html' && formatParam !== 'docx') {
    return jsonError(400, 'invalid_format', 'format must be html or docx');
  }
  const format: Format = formatParam;

  const sb = getServerSupabase();

  // Fetch deliverable row — must belong to this program
  const { data: delivRow, error: delivErr } = await sb
    .from('deliverables_v2')
    .select('id, engagement_id, deliverable_type_key, title')
    .eq('id', deliverableId)
    .eq('engagement_id', programId)
    .maybeSingle();
  if (delivErr) {
    console.error('[content-export] deliverable fetch error', delivErr);
    return jsonError(500, 'db_error');
  }
  if (!delivRow) return jsonError(404, 'deliverable_not_found');

  const deliverable = delivRow as { id: string; engagement_id: string; deliverable_type_key: string; title: string | null };

  // Fetch latest version content
  const { data: vRow, error: vErr } = await sb
    .from('deliverable_versions')
    .select('content, version, generated_at')
    .eq('deliverable_id', deliverableId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (vErr) {
    console.error('[content-export] version fetch error', vErr);
    return jsonError(500, 'db_error');
  }

  const version = vRow as { content: string | null; version: number; generated_at: string } | null;
  const content = version?.content ?? null;
  if (!content || content.trim().length === 0) {
    return jsonError(404, 'no_content', 'This deliverable has no content yet. Generate it in the phase workspace first.');
  }

  const title = deliverable.title || deliverable.deliverable_type_key.replace(/_/g, ' ');

  try {
    if (format === 'html') {
      const html = markdownToHtml(content, title);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(html);
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename(title, 'html')}"`,
          'Cache-Control': 'private, max-age=0',
        },
      });
    }

    // docx
    const rawBuffer = await markdownToDocx(content, title);
    // Copy into a guaranteed ArrayBuffer-backed Uint8Array (Node Buffer's
    // backing is ArrayBufferLike which may not satisfy BodyInit in strict mode).
    const arrayBuffer = new ArrayBuffer(rawBuffer.byteLength);
    new Uint8Array(arrayBuffer).set(rawBuffer);
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFilename(title, 'docx')}"`,
        'Cache-Control': 'private, max-age=0',
      },
    });
  } catch (err) {
    console.error('[content-export] render error', err);
    return jsonError(500, 'render_failed', err instanceof Error ? err.message : 'render_failed');
  }
}
