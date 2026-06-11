// Generator → File Cabinet bridge.
//
// Takes a generated RenderableDeliverable (from the Deliverable Intelligence
// Orchestrator) and persists it durably into the Source File Cabinet: the primary DOCX,
// an HTML preview, and — when the deliverable has wide tables — an Excel companion. Each
// format is a distinct artifact_type so they version independently (regeneration bumps
// each and supersedes its prior version). No artifact is left in Downloads/browser only.

import 'server-only';

import { Packer } from 'docx';
import {
  renderDeliverableDocx,
  renderDeliverableExcelCompanion,
  renderDeliverableHtml,
} from '@/lib/deliverables/orchestrator/renderers';
import type { RenderableDeliverable } from '@/lib/deliverables/orchestrator/types';
import { persistSourceArtifact as defaultPersist } from './service';
import type { ArtifactStatus, SourceArtifactRecord } from './types';

function slug(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'deliverable';
}

export interface PersistGeneratedDeliverableOptions {
  clientId: string;
  tenantKey: string;
  sourceEventId: string;
  /** base artifact type, e.g. 'rfp_package'. Formats are suffixed for independent versioning. */
  artifactType: string;
  sourcingStage?: string;
  generatedBy?: string;
  /** issue_ready only when the gate allows it; otherwise preliminary (caller decides). */
  status?: ArtifactStatus;
  evidenceFamiliesUsed?: string[];
  contextBundleTraceId?: string;
  sourceRegisterId?: string;
  citationReady?: boolean;
  missingInputs?: string[];
  clientCompleteItems?: string[];
}

export interface PersistGeneratedDeliverableDeps {
  persist?: typeof defaultPersist;
}

/**
 * Render + persist the deliverable's DOCX, HTML preview, and (if any wide tables) Excel
 * companion into the File Cabinet. Returns the persisted artifact records.
 */
export async function persistGeneratedDeliverable(
  doc: RenderableDeliverable,
  opts: PersistGeneratedDeliverableOptions,
  deps: PersistGeneratedDeliverableDeps = {},
): Promise<SourceArtifactRecord[]> {
  const persist = deps.persist ?? defaultPersist;
  const base = slug(doc.title);
  const status = opts.status ?? 'preliminary';
  const shared = {
    clientId: opts.clientId,
    tenantKey: opts.tenantKey,
    sourceEventId: opts.sourceEventId,
    artifactGroup: 'generated' as const,
    sourcingStage: opts.sourcingStage,
    generatedBy: opts.generatedBy,
    status,
    evidenceFamiliesUsed: opts.evidenceFamiliesUsed ?? [],
    contextBundleTraceId: opts.contextBundleTraceId,
    sourceRegisterId: opts.sourceRegisterId,
    citationReady: opts.citationReady ?? false,
    missingInputs: opts.missingInputs ?? [],
    clientCompleteItems: opts.clientCompleteItems ?? [],
  };

  const records: SourceArtifactRecord[] = [];

  // 1 · primary DOCX
  const docxBuf = await Packer.toBuffer(renderDeliverableDocx(doc));
  records.push(await persist({ ...shared, artifactType: opts.artifactType, title: doc.title, fileName: `${base}.docx`, fileFormat: 'docx', bytes: docxBuf }));

  // 2 · HTML preview (distinct type → independent versioning)
  const htmlBuf = Buffer.from(renderDeliverableHtml(doc), 'utf8');
  records.push(await persist({ ...shared, artifactType: `${opts.artifactType}__preview`, title: `${doc.title} — Preview`, fileName: `${base}_preview.html`, fileFormat: 'html', bytes: htmlBuf }));

  // 3 · Excel companion when there are wide tables
  const wb = renderDeliverableExcelCompanion(doc);
  if (wb) {
    const xlsxBuf = Buffer.from(await wb.xlsx.writeBuffer());
    records.push(await persist({ ...shared, artifactType: `${opts.artifactType}__companion`, title: `${doc.title} — Data Companion`, fileName: `${base}_companion.xlsx`, fileFormat: 'xlsx', bytes: xlsxBuf }));
  }

  return records;
}
