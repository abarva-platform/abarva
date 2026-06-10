// PR-5 — intake capture → governed context.
//
// Captured intake (chat answer or upload) becomes a GOVERNED object — never stored only
// in chat, never auto-promoted to agent_ready. Pure functions here produce the governed
// write spec + loader manifest; the actual commit goes through the existing Admin bulk
// loader / a service. Hard rules enforced: source_basis=user_attested, promotion_status
// is at most promotion_candidate, and applying capture to readiness lifts client-decision
// inputs immediately but does NOT mark evidence families agent_ready (that needs governed
// promotion + indexing + cite-render verification).

import type { SectionResolutionContext, SourceIntakeEvidenceTemplate } from './types';
import { getIntakeTemplate } from './intake-template-registry';

export type CaptureMethod = 'chat_answer' | 'file_upload' | 'mark_client_complete' | 'mark_assumption';

export interface IntakeCaptureRequest {
  tenantId: string;
  clientKey: string;
  sourceEventId: string;
  rfpSectionId: string;
  evidenceFamily?: string; // present for evidence-family inputs; absent for free client decisions
  inputKey: string; // the section input key being satisfied
  method: CaptureMethod;
  value?: string; // chat answer / decision text
  fileName?: string; // for uploads
  confidenceLevel?: 'high' | 'medium' | 'low' | 'unverified';
  owner?: string;
  intakeBatchId: string;
  /** only an authorized procurement/legal user may finalize client-complete decisions. */
  authorized?: boolean;
}

/** The governed object an intake capture commits (mirrors the context-corpus contract). */
export interface GovernedIntakeRecord {
  tenant_id: string;
  client_key: string;
  source_event_id: string;
  rfp_section_id: string;
  evidence_family: string | null;
  input_key: string;
  value: string | null;
  source_basis: 'user_attested';
  confidence_level: 'high' | 'medium' | 'low' | 'unverified';
  owner: string | null;
  intake_batch_id: string;
  lifecycle_state: 'active';
  /** never 'agent_ready' from capture; uploads become promotion_candidate after commit+index. */
  promotion_status: 'captured' | 'promotion_candidate';
  capture_method: CaptureMethod;
  target_context_dimension: string | null;
  target_record_type: string | null;
  captured_at_field: 'set_by_service'; // service stamps the timestamp (deterministic here)
}

/** Loader manifest entry for an uploaded file (routes through the governed bulk path). */
export interface IntakeUploadManifestEntry {
  path: string;
  templateId: string;
  evidenceFamily: string;
  targetContextDimension: string;
  targetRecordType: string;
}

/** Build the governed record for a captured intake answer/decision/upload. */
export function buildGovernedIntakeRecord(req: IntakeCaptureRequest): GovernedIntakeRecord {
  const tmpl: SourceIntakeEvidenceTemplate | undefined = req.evidenceFamily
    ? getIntakeTemplate(req.evidenceFamily)
    : undefined;
  // uploads of structured evidence are eligible to become promotion_candidate after
  // commit+index; chat answers / decisions are 'captured' (user_attested) only.
  const promotion_status: GovernedIntakeRecord['promotion_status'] =
    req.method === 'file_upload' ? 'promotion_candidate' : 'captured';
  return {
    tenant_id: req.tenantId,
    client_key: req.clientKey,
    source_event_id: req.sourceEventId,
    rfp_section_id: req.rfpSectionId,
    evidence_family: req.evidenceFamily ?? null,
    input_key: req.inputKey,
    value: req.value ?? null,
    source_basis: 'user_attested',
    confidence_level: req.confidenceLevel ?? (req.method === 'mark_assumption' ? 'low' : 'medium'),
    owner: req.owner ?? null,
    intake_batch_id: req.intakeBatchId,
    lifecycle_state: 'active',
    promotion_status,
    capture_method: req.method,
    target_context_dimension: tmpl?.targetContextDimension ?? null,
    target_record_type: tmpl?.targetRecordType ?? null,
    captured_at_field: 'set_by_service',
  };
}

export function buildUploadManifestEntry(req: IntakeCaptureRequest): IntakeUploadManifestEntry | null {
  if (req.method !== 'file_upload' || !req.evidenceFamily || !req.fileName) return null;
  const tmpl = getIntakeTemplate(req.evidenceFamily);
  if (!tmpl) return null;
  return {
    path: req.fileName, templateId: tmpl.templateId, evidenceFamily: req.evidenceFamily,
    targetContextDimension: tmpl.targetContextDimension, targetRecordType: tmpl.targetRecordType,
  };
}

/**
 * Apply captured records to a readiness context for recompute. RULES:
 *  - chat answers / decisions satisfy client-decision inputs immediately (capturedInputs),
 *    UNLESS the input is a CLIENT-COMPLETE decision that requires an authorized signoff.
 *  - uploads of evidence families do NOT become agent_ready here — they are recorded as
 *    pending promotion; the family becomes agent_ready only via governed promotion.
 */
export function applyCaptureToContext(
  ctx: SectionResolutionContext,
  records: GovernedIntakeRecord[],
  opts: { clientCompleteKeysNeedingAuth?: Set<string> } = {},
): { ctx: SectionResolutionContext; pendingPromotion: string[] } {
  const captured = new Set(ctx.capturedInputs);
  const pendingPromotion: string[] = [];
  for (const r of records) {
    if (r.promotion_status === 'promotion_candidate') {
      // upload → pending governed promotion; NOT agent_ready yet
      if (r.evidence_family) pendingPromotion.push(r.evidence_family);
      continue;
    }
    // chat answer / decision / assumption
    const needsAuth = opts.clientCompleteKeysNeedingAuth?.has(r.input_key);
    if (needsAuth) continue; // stays client_to_complete until an authorized record arrives
    captured.add(r.input_key);
  }
  return { ctx: { ...ctx, capturedInputs: captured }, pendingPromotion };
}
