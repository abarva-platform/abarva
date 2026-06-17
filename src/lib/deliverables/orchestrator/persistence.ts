// Persistence — save a completed deliverable through the existing artifacts repository.
//
// Maps an OrchestrationResult (passed plan gate + quality gate) into the repository's
// BoardPackRenderInput/Result contract and persists to generated_artifacts. The save
// function is injectable so the mapping is unit-tested without the data plane. A result
// that did not pass the gates is refused — the quality gate is integrated here too.

import 'server-only';

import { createHash } from 'node:crypto';
import type { TenantAiPolicy } from '@/lib/integrations/ai-egress';
import type {
  BoardPackRenderInput,
  BoardPackRenderResult,
  GeneratedArtifactFormat,
  GeneratedArtifactType,
} from '@/lib/artifacts/types';
import { saveGeneratedArtifact, type GeneratedArtifactRecord } from '@/lib/artifacts/repository';
import { prescribedFormatForDeliverableType } from '@/lib/programs/orchestrated-deliverable-map';
import { renderDeliverableHtml } from './renderers';
import type { OrchestrationResult } from './orchestrator';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PersistDeliverableOptions {
  clientId: string;
  renderedBy: string;
  /** the move / source-event id this deliverable was generated for. */
  sourceArtifactRef: string;
  tenantPolicy: TenantAiPolicy;
  outputFormat?: GeneratedArtifactFormat; // default 'docx'
  /** governed evidence ledger ids used (for the artifact's audit trail). */
  evidenceLedgerIds?: string[];
  userId?: string;
}

export interface PersistDeps {
  save?: typeof saveGeneratedArtifact;
}

function artifactTypeFor(module: string): GeneratedArtifactType {
  if (module === 'source') return 'source_board_pack';
  if (module === 'moves') return 'move_board_pack';
  return 'dossier_board_pack';
}

/** Quality → 0..1 score: starts at 1.0, small penalty per advisory warning. */
function qualityScore(result: OrchestrationResult): number {
  const warnings = result.quality?.warnings.length ?? 0;
  return Math.max(0.5, Math.round((1 - warnings * 0.1) * 100) / 100);
}

export async function persistDeliverable(
  result: OrchestrationResult,
  opts: PersistDeliverableOptions,
  deps: PersistDeps = {},
): Promise<GeneratedArtifactRecord> {
  if (!result.ok || !result.document) {
    throw new Error(`cannot persist deliverable: ${result.blockedReason ?? 'generation did not pass the gates'}`);
  }
  const doc = result.document;
  const html = renderDeliverableHtml(doc);
  const artifactType = artifactTypeFor(result.brief.module);
  // The prescribed primary format follows the deliverable type: most narrative
  // documents are Word/DOCX; the financial model (orchestrator 'estimate_model')
  // is an Excel workbook. An explicit caller override (opts.outputFormat) wins so
  // existing callers can still force a format; otherwise we resolve from the brief.
  const prescribedFormat = prescribedFormatForDeliverableType(
    result.brief.deliverableType,
  );
  const outputFormat: GeneratedArtifactFormat = opts.outputFormat ?? prescribedFormat;

  const facts: BoardPackRenderInput['facts'] = doc.sourceRegister.map((r) => ({
    id: `cite-${r.citationNumber}`,
    label: r.label,
    value: `${r.evidenceFamily} (${r.confidence}${r.asOf ? `, ${r.asOf}` : ''})`,
    evidenceLedgerId: String(r.citationNumber),
  }));
  const sections: BoardPackRenderInput['sections'] = doc.generatedSections.map((s) => ({
    id: s.key,
    title: s.title,
    claims: [s.bodyMarkdown.slice(0, 500)],
  }));

  const input: BoardPackRenderInput = {
    clientId: opts.clientId,
    sourceArtifactRef: opts.sourceArtifactRef,
    artifactType,
    outputFormat,
    renderEngine: 'internal',
    renderedBy: opts.renderedBy,
    title: doc.title,
    sections,
    facts,
    tenantPolicy: opts.tenantPolicy,
    ...(opts.userId !== undefined ? { userId: opts.userId } : {}),
  };

  const rendered: BoardPackRenderResult = {
    artifactType,
    sourceArtifactRef: opts.sourceArtifactRef,
    renderEngine: 'internal',
    outputFormat,
    html,
    blobUrl: '',
    blobSha256: createHash('sha256').update(html).digest('hex'),
    qualityScore: qualityScore(result),
    evidenceLedgerIds: opts.evidenceLedgerIds ?? doc.sourceRegister.map((r) => String(r.citationNumber)),
    // generation_egress_audit is a single UUID FK to ai_egress_audit(id). Pass responseIds
    // are Anthropic message ids (msg_…), not audit UUIDs — and the decomposed flow makes many
    // calls, so a joined string would never be one valid UUID. Link the first pass whose
    // responseId is a genuine audit UUID, else null (the per-call audit rows persist
    // independently in ai_egress_audit regardless).
    generationEgressAudit: result.passTrace.map((t) => t.responseId).find((r): r is string => !!r && UUID_RE.test(r)) ?? null,
    quarantined: false,
    quarantineReason: null,
  };

  const save = deps.save ?? saveGeneratedArtifact;
  // Persist the FULL structured document alongside the HTML so the download route
  // can render any prescribed format (docx/xlsx/html) on demand without re-running
  // the orchestrator. Backward-compatible: older artifacts lack this and fall back
  // to the stored HTML.
  return save(input, rendered, { renderableDoc: doc });
}
