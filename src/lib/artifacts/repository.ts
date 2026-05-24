import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type { BoardPackRenderInput, BoardPackRenderResult } from './types';
import { renderBoardPack } from './render-engine';

export interface GeneratedArtifactRecord {
  id: string;
  clientId: string;
  artifactType: BoardPackRenderResult['artifactType'];
  sourceArtifactRef: string;
  renderEngine: BoardPackRenderResult['renderEngine'];
  outputFormat: BoardPackRenderResult['outputFormat'];
  blobUrl: string;
  blobSha256: string;
  qualityScore: number | null;
  evidenceLedgerIds: string[];
  generationEgressAudit: string | null;
  renderedAt: string;
  renderedBy: string;
  quarantineReason: string | null;
}

function rowToRecord(row: Record<string, unknown>): GeneratedArtifactRecord {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    artifactType: row.artifact_type as GeneratedArtifactRecord['artifactType'],
    sourceArtifactRef: String(row.source_artifact_ref),
    renderEngine: row.render_engine as GeneratedArtifactRecord['renderEngine'],
    outputFormat: row.output_format as GeneratedArtifactRecord['outputFormat'],
    blobUrl: String(row.blob_url),
    blobSha256: String(row.blob_sha256),
    qualityScore: row.quality_score === null ? null : Number(row.quality_score),
    evidenceLedgerIds: Array.isArray(row.evidence_ledger_ids) ? row.evidence_ledger_ids.map(String) : [],
    generationEgressAudit: typeof row.generation_egress_audit === 'string' ? row.generation_egress_audit : null,
    renderedAt: String(row.rendered_at),
    renderedBy: String(row.rendered_by),
    quarantineReason: typeof row.quarantine_reason === 'string' ? row.quarantine_reason : null,
  };
}

export async function saveGeneratedArtifact(
  input: BoardPackRenderInput,
  rendered: BoardPackRenderResult,
): Promise<GeneratedArtifactRecord> {
  const { data, error } = await getServerSupabase()
    .from('generated_artifacts')
    .insert({
      client_id: input.clientId,
      artifact_type: rendered.artifactType,
      source_artifact_ref: rendered.sourceArtifactRef,
      render_engine: rendered.renderEngine,
      output_format: rendered.outputFormat,
      blob_url: rendered.blobUrl,
      blob_sha256: rendered.blobSha256,
      quality_score: rendered.qualityScore,
      evidence_ledger_ids: rendered.evidenceLedgerIds,
      generation_egress_audit: rendered.generationEgressAudit,
      rendered_by: input.renderedBy,
      quarantine_reason: rendered.quarantineReason,
      metadata: {
        title: input.title,
        factCount: input.facts.length,
        sectionCount: input.sections.length,
      },
    })
    .select('*')
    .single();

  if (error) throw new Error(`generated_artifacts insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
}

export async function generateAndSaveBoardPack(input: BoardPackRenderInput): Promise<{
  rendered: BoardPackRenderResult;
  record: GeneratedArtifactRecord;
}> {
  const rendered = await renderBoardPack(input);
  const record = await saveGeneratedArtifact(input, rendered);
  return { rendered, record };
}

