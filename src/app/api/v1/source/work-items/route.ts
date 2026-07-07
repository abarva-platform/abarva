// POST /api/v1/source/work-items
//
// Creates a persisted sourcing work item — the real backing for the Renewal
// Cockpit action-bar actions (serve notice, assign owner, create Tower watch
// item). Iteration 1 of the cockpit shipped these as honest pending stubs;
// this route makes them persist with an owner, a due date, a status, and an
// audit trail.
//
// Tenant-scoped: the work item is always written under the caller's active
// client key, and `created_by` carries the acting user — so a VP and an
// auditor can see who served notice and when.

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import {
  SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS,
  validateSourceExternalActionGate,
} from '@/lib/source/external-action-gate';
import { createWorkItem } from '@/lib/source/work-items/service';
import {
  WORK_ITEM_KINDS,
  WORK_ITEM_SUBJECT_KINDS,
  type NewSourcingWorkItem,
  type WorkItemKind,
  type WorkItemLegalStatus,
  type WorkItemProcurementStatus,
  type WorkItemSubjectKind,
} from '@/lib/source/work-items/types';

interface CreateWorkItemBody {
  subjectKind?: string;
  subjectRef?: string;
  subjectLabel?: string;
  kind?: string;
  title?: string;
  owner?: string;
  dueDate?: string;
  legalStatus?: string;
  procurementStatus?: string;
  note?: string;
  humanConfirmed?: unknown;
  humanJustification?: unknown;
  evidenceRefs?: unknown;
}

const LEGAL_STATUSES = ['not_started', 'drafting', 'in_review', 'served', 'not_applicable'];
const PROC_STATUSES = ['not_started', 'in_progress', 'completed', 'not_applicable'];
const SOURCE_EXTERNAL_ACTION_GATE_ERROR =
  'human_external_action_gate_required';

function parseString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      { error: 'no_client', detail: 'No active client for work-item creation' },
      { status: 403 },
    );
  }

  let body: CreateWorkItemBody;
  try {
    body = (await request.json()) as CreateWorkItemBody;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const kind = parseString(body.kind);
  const subjectKind = parseString(body.subjectKind);
  const subjectRef = parseString(body.subjectRef);
  const title = parseString(body.title);

  if (!kind || !(WORK_ITEM_KINDS as readonly string[]).includes(kind)) {
    return Response.json(
      {
        error: 'invalid_kind',
        detail: `kind must be one of: ${WORK_ITEM_KINDS.join(', ')}`,
      },
      { status: 400 },
    );
  }
  if (
    !subjectKind ||
    !(WORK_ITEM_SUBJECT_KINDS as readonly string[]).includes(subjectKind)
  ) {
    return Response.json(
      {
        error: 'invalid_subject_kind',
        detail: `subjectKind must be one of: ${WORK_ITEM_SUBJECT_KINDS.join(', ')}`,
      },
      { status: 400 },
    );
  }
  if (!subjectRef || !title) {
    return Response.json(
      {
        error: 'missing_required_fields',
        detail: 'subjectRef and title are required.',
      },
      { status: 400 },
    );
  }

  const legalStatusRaw = parseString(body.legalStatus);
  const procurementStatusRaw = parseString(body.procurementStatus);
  const legalStatus: WorkItemLegalStatus | null =
    legalStatusRaw && LEGAL_STATUSES.includes(legalStatusRaw)
      ? (legalStatusRaw as WorkItemLegalStatus)
      : null;
  const procurementStatus: WorkItemProcurementStatus | null =
    procurementStatusRaw && PROC_STATUSES.includes(procurementStatusRaw)
      ? (procurementStatusRaw as WorkItemProcurementStatus)
      : null;
  const externalActionGate = validateSourceExternalActionGate({
    kind: kind as WorkItemKind,
    humanConfirmed: body.humanConfirmed,
    humanJustification: body.humanJustification,
    evidenceRefs: body.evidenceRefs,
  });

  if (!externalActionGate.ok) {
    return Response.json(
      {
        error: SOURCE_EXTERNAL_ACTION_GATE_ERROR,
        detail: externalActionGate.detail,
        minimumRationaleChars: SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS,
        requiredFields: [
          'humanConfirmed',
          'humanJustification',
          'evidenceRefs',
        ],
      },
      { status: 400 },
    );
  }

  const baseNote = parseString(body.note) ?? null;
  const metadata: NewSourcingWorkItem['metadata'] = {};
  let note = baseNote;
  if (externalActionGate.required) {
    metadata.externalActionGate = 'human_confirmed';
    metadata.externalActionControl = 'ai_draft_human_review_human_sends';
    metadata.externalActionJustification =
      externalActionGate.normalizedJustification ?? '';
    metadata.externalActionEvidenceRefs =
      externalActionGate.normalizedEvidenceRefs.join(', ');

    const approvalNote = [
      `Human external-action approval: ${metadata.externalActionJustification}`,
      `Evidence refs: ${metadata.externalActionEvidenceRefs}`,
      'AbarVa records the work item only; a human remains responsible for any off-platform transmission.',
    ].join(' ');
    note = [baseNote, approvalNote].filter(Boolean).join('\n');
  }

  const input: NewSourcingWorkItem = {
    tenantClientKey: activeClient.key,
    subjectKind: subjectKind as WorkItemSubjectKind,
    subjectRef,
    subjectLabel: parseString(body.subjectLabel) ?? '',
    kind: kind as WorkItemKind,
    title,
    owner: parseString(body.owner) ?? null,
    dueDate: parseString(body.dueDate) ?? null,
    status: 'open',
    legalStatus,
    procurementStatus,
    note,
    metadata,
    createdBy: tenancy.userId,
  };

  const outcome = await createWorkItem(input);
  if (!outcome.ok) {
    return Response.json(
      {
        error: 'work_item_write_failed',
        detail: outcome.error ?? 'failed to create the sourcing work item',
      },
      { status: 400 },
    );
  }

  return Response.json({ ok: true, workItem: outcome.data });
}
