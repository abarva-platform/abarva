import type {
  WorkItemKind,
  WorkItemMetadata,
} from '@/lib/source/work-items/types';

export const SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS = 24;

const EXTERNAL_WORK_ITEM_KINDS: ReadonlySet<WorkItemKind> = new Set([
  'serve_notice',
]);

const EXTERNAL_WORKPLAN_SUBKINDS = new Set([
  'serve_notice',
  'vendor_notification',
  'rfp_send',
  'contract_draft_commit',
]);

export interface SourceExternalActionGateInput {
  kind: WorkItemKind;
  metadata?: WorkItemMetadata;
  humanConfirmed?: unknown;
  humanJustification?: unknown;
  evidenceRefs?: unknown;
}

export type SourceExternalActionGateResult =
  | {
      ok: true;
      required: boolean;
      normalizedJustification: string | null;
      normalizedEvidenceRefs: string[];
    }
  | {
      ok: false;
      required: true;
      error: 'human_external_action_gate_required';
      detail: string;
    };

export function isSourceExternalActionWorkItem(
  kind: WorkItemKind,
  metadata?: WorkItemMetadata,
): boolean {
  if (EXTERNAL_WORK_ITEM_KINDS.has(kind)) return true;
  if (kind !== 'workplan_item') return false;

  const subKind = metadata?.subKind?.trim();
  return Boolean(subKind && EXTERNAL_WORKPLAN_SUBKINDS.has(subKind));
}

export function normalizeSourceExternalActionEvidenceRefs(
  evidenceRefs: unknown,
): string[] {
  if (Array.isArray(evidenceRefs)) {
    return evidenceRefs
      .filter((ref): ref is string => typeof ref === 'string')
      .map((ref) => ref.trim())
      .filter(Boolean);
  }

  if (typeof evidenceRefs === 'string') {
    return evidenceRefs
      .split(',')
      .map((ref) => ref.trim())
      .filter(Boolean);
  }

  return [];
}

export function validateSourceExternalActionGate(
  input: SourceExternalActionGateInput,
): SourceExternalActionGateResult {
  const required = isSourceExternalActionWorkItem(input.kind, input.metadata);
  if (!required) {
    return {
      ok: true,
      required: false,
      normalizedJustification: null,
      normalizedEvidenceRefs: [],
    };
  }

  if (input.humanConfirmed !== true) {
    return {
      ok: false,
      required: true,
      error: 'human_external_action_gate_required',
      detail:
        'External Source actions require explicit human confirmation before a work item can be created.',
    };
  }

  const justification =
    typeof input.humanJustification === 'string'
      ? input.humanJustification.trim()
      : '';
  if (justification.length < SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS) {
    return {
      ok: false,
      required: true,
      error: 'human_external_action_gate_required',
      detail: `External Source actions require a human rationale of at least ${SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS} characters.`,
    };
  }

  const evidenceRefs = normalizeSourceExternalActionEvidenceRefs(
    input.evidenceRefs,
  );
  if (evidenceRefs.length === 0) {
    return {
      ok: false,
      required: true,
      error: 'human_external_action_gate_required',
      detail:
        'External Source actions require at least one evidence reference reviewed by the human approver.',
    };
  }

  return {
    ok: true,
    required: true,
    normalizedJustification: justification,
    normalizedEvidenceRefs: evidenceRefs,
  };
}
