import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { withWorkshopTransaction } from './db';
import { getWorkshopTemplate } from './authoring';
import { uploadWorkshopPackToBlob } from './blob';
import type {
  WorkshopAssetRecord,
  WorkshopMutationContext,
  WorkshopPackResult,
  WorkshopTemplateRecord,
} from './types';

type RenderFormat = 'pdf' | 'zip';

interface TenantRenderContext {
  clientId: string;
  clientName: string;
  moveName: string | null;
  appPortfolio: string[];
}

interface RenderOptions {
  format?: RenderFormat;
  context?: WorkshopMutationContext;
  upload?: typeof uploadWorkshopPackToBlob;
  recordRender?: boolean;
}

type ContextRow = {
  client_id: string;
  client_name: string | null;
  move_name: string | null;
};

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'workshop';
}

function pdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(value: string, width = 88): string[] {
  const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export function substituteTenantContext(text: string, context: TenantRenderContext): string {
  const appPortfolio = context.appPortfolio.length
    ? context.appPortfolio.join(', ')
    : 'No application portfolio rows available';
  return text
    .replaceAll('[[client.name]]', context.clientName)
    .replaceAll('[[client.id]]', context.clientId)
    .replaceAll('[[client.app_portfolio]]', appPortfolio)
    .replaceAll('[[move.name]]', context.moveName ?? 'Unassigned Move');
}

function assetBody(asset: WorkshopAssetRecord, context: TenantRenderContext): string {
  const body = asset.contentText ?? asset.contentBlobRef ?? '';
  return substituteTenantContext(body, context);
}

export function buildWorkshopPdfBytes(
  template: WorkshopTemplateRecord,
  context: TenantRenderContext,
): Buffer {
  const textLines = [
    `${template.name} v${template.version}`,
    `Client: ${context.clientName}`,
    context.moveName ? `Move: ${context.moveName}` : 'Move: Unassigned',
    `Duration: ${template.durationMinutes} minutes`,
    `Hypothesis to test: ${substituteTenantContext(template.hypothesisToTest, context)}`,
    '',
    ...template.assets
      .slice()
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
      .flatMap((asset) => [
        `${asset.sequenceIndex + 1}. ${asset.name} (${asset.assetType}${asset.timeBoxMinutes ? `, ${asset.timeBoxMinutes} min` : ''})`,
        ...wrapLine(assetBody(asset, context)),
        '',
      ]),
  ].flatMap((line) => wrapLine(line, 96));

  const content = [
    'BT',
    '/F1 10 Tf',
    '50 770 Td',
    '14 TL',
    ...textLines.slice(0, 48).map((line, index) => `${index === 0 ? '' : 'T* '}(${pdfText(line)}) Tj`),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf-8');
}

export async function buildWorkshopZipBytes(
  template: WorkshopTemplateRecord,
  context: TenantRenderContext,
  pdfBytes: Buffer,
): Promise<Buffer> {
  const zip = new JSZip();
  const base = sanitizeFilename(template.slug);
  zip.file(`${base}-facilitator-pack.pdf`, pdfBytes);
  zip.file(`${base}-manifest.json`, JSON.stringify({
    workshopId: template.id,
    slug: template.slug,
    name: template.name,
    version: template.version,
    clientId: context.clientId,
    clientName: context.clientName,
    moveName: context.moveName,
    assetCount: template.assets.length,
  }, null, 2));
  for (const asset of template.assets.slice().sort((a, b) => a.sequenceIndex - b.sequenceIndex)) {
    const ext = asset.format.includes('json') ? 'json' : 'md';
    zip.file(
      `${String(asset.sequenceIndex + 1).padStart(2, '0')}-${sanitizeFilename(asset.name)}.${ext}`,
      asset.format.includes('json')
        ? JSON.stringify({ schema: asset.schema, body: assetBody(asset, context) }, null, 2)
        : assetBody(asset, context),
    );
  }
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

async function loadRenderContext(
  workshop: WorkshopTemplateRecord,
  moveInstanceId: string | null,
  context?: WorkshopMutationContext,
): Promise<TenantRenderContext> {
  return withWorkshopTransaction(async (client) => {
    let clientId = context?.clientId ?? workshop.clientId ?? null;
    let moveName: string | null = null;

    if (moveInstanceId) {
      const { rows } = await client.query<ContextRow>(
        `
          SELECT e.client_id, c.name AS client_name, e.name AS move_name
          FROM public.engagements e
          LEFT JOIN public.clients c ON c.id = e.client_id
          WHERE e.id = $1
          LIMIT 1
        `,
        [moveInstanceId],
      );
      const row = rows[0];
      if (row) {
        clientId = row.client_id;
        moveName = row.move_name;
      }
    }

    if (!clientId) throw new Error('client_id_required_for_render');

    const { rows: clientRows } = await client.query<{ name: string | null }>(
      `SELECT name FROM public.clients WHERE id = $1 LIMIT 1`,
      [clientId],
    );
    const { rows: appRows } = await client.query<{ name: string }>(
      `
        SELECT name
        FROM public.application_portfolio
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY annual_run_cost_usd DESC NULLS LAST, name ASC
        LIMIT 12
      `,
      [clientId],
    ).catch(() => ({ rows: [] }));

    return {
      clientId,
      clientName: clientRows[0]?.name ?? clientId,
      moveName,
      appPortfolio: appRows.map((row) => row.name),
    };
  });
}

async function recordPackRender(input: {
  clientId: string;
  workshopId: string;
  version: number;
  moveInstanceId: string | null;
  format: RenderFormat;
  blobRef: string;
  byteLength: number;
  sha: string;
  renderedBy?: string;
}): Promise<void> {
  await withWorkshopTransaction(async (client) => {
    let instanceId: string | null = null;
    if (input.moveInstanceId) {
      const { rows } = await client.query<{ id: string }>(
        `
          SELECT id
          FROM public.workshop_instances
          WHERE client_id = $1
            AND template_id = $2
            AND version_pinned = $3
            AND move_instance_id = $4
            AND deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [input.clientId, input.workshopId, input.version, input.moveInstanceId],
      );
      instanceId = rows[0]?.id ?? null;
    }

    await client.query(
      `
        INSERT INTO public.workshop_pack_renders(
          client_id,
          workshop_id,
          workshop_instance_id,
          move_instance_id,
          version,
          format,
          blob_ref,
          byte_length,
          sha256,
          rendered_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        input.clientId,
        input.workshopId,
        instanceId,
        input.moveInstanceId,
        input.version,
        input.format,
        input.blobRef,
        input.byteLength,
        input.sha,
        input.renderedBy ?? null,
      ],
    );
  });
}

export async function renderWorkshopPack(
  workshopId: string,
  version: number,
  moveInstanceId: string | null,
  options: RenderOptions = {},
): Promise<WorkshopPackResult> {
  const format = options.format ?? 'zip';
  const workshop = await getWorkshopTemplate(workshopId, version);
  const context = await loadRenderContext(workshop, moveInstanceId, options.context);
  const pdfBytes = buildWorkshopPdfBytes(workshop, context);
  const zipBytes = await buildWorkshopZipBytes(workshop, context, pdfBytes);
  const bytes = format === 'pdf' ? pdfBytes : zipBytes;
  const contentType = format === 'pdf' ? 'application/pdf' : 'application/zip';
  const sha = sha256(bytes);
  const path = [
    context.clientId,
    moveInstanceId ?? 'unassigned',
    `${sanitizeFilename(workshop.slug)}-v${version}-${sha.slice(0, 12)}.${format}`,
  ].join('/');

  const upload = options.upload ?? uploadWorkshopPackToBlob;
  const uploaded = await upload({
    path,
    bytes,
    contentType,
    metadata: {
      workshopId: workshop.id,
      version: String(version),
      clientId: context.clientId,
      moveInstanceId: moveInstanceId ?? 'none',
    },
  });

  if (options.recordRender !== false) {
    await recordPackRender({
      clientId: context.clientId,
      workshopId: workshop.id,
      version,
      moveInstanceId,
      format,
      blobRef: uploaded.blobRef,
      byteLength: bytes.byteLength,
      sha,
      renderedBy: options.context?.userId,
    });
  }

  return {
    workshopId: workshop.id,
    version,
    moveInstanceId,
    format,
    blobRef: uploaded.blobRef,
    byteLength: bytes.byteLength,
    sha256: sha,
    contentType,
    pdfBytes,
    zipBytes: format === 'zip' ? zipBytes : undefined,
  };
}
