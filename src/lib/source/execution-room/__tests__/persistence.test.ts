// Source Execution Room persistence · convergence onto sourcing_work_items.
//
//   - reconcileExecutionRoom overlays persisted owner / SLA / status from
//     workplan_item + stakeholder_approval rows onto the composer baseline;
//   - slots with no persisted row are returned untouched (the room stays
//     honest about what is and is not persisted);
//   - workplanItemPayload / stakeholderApprovalPayload build valid
//     NewSourcingWorkItem rows carrying metadata.subKind.

import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';
import {
  buildRenewalCockpit,
  type RenewalCockpitInput,
} from '@/lib/source/renewal-cockpit/cockpit';
import { validateNewWorkItem } from '@/lib/source/work-items/work-item-model';
import type { SourcingWorkItem } from '@/lib/source/work-items/types';
import { buildExecutionRoom, NOT_RECORDED } from '../execution-room';
import {
  reconcileExecutionRoom,
  stakeholderApprovalPayload,
  workItemStatusFromAction,
  workplanItemPayload,
} from '../persistence';

const AS_OF = new Date('2026-05-17T00:00:00Z');

function isoOffset(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: 'vendor_contracts:apex-servicenow-itsm',
    vendorName: 'ServiceNow',
    product: 'IT Service Management',
    category: 'itsm',
    annualSpendUsd: 690_000,
    termEndDate: isoOffset(58),
    autoRenew: true,
    noticePeriodDays: 45,
    utilizationRate: 0.88,
    criticality: 'high',
    ...overrides,
  };
}

function cockpitInput(overrides: Partial<RenewalCockpitInput> = {}): RenewalCockpitInput {
  return {
    clientKey: 'apex-retail',
    contract: contract(),
    categoryBenchmarkUsd: 700_000,
    alternatives: [],
    asOf: AS_OF,
    ...overrides,
  };
}

function room() {
  return buildExecutionRoom(buildRenewalCockpit(cockpitInput()), AS_OF);
}

function workItem(overrides: Partial<SourcingWorkItem> = {}): SourcingWorkItem {
  return {
    id: 'wi-1',
    tenantClientKey: 'apexretail',
    subjectKind: 'contract',
    subjectRef: 'vendor_contracts:apex-servicenow-itsm',
    subjectLabel: 'ServiceNow — IT Service Management',
    kind: 'workplan_item',
    title: 'Serve notice or formally waive the notice right',
    owner: 'Dana Lee',
    dueDate: isoOffset(13),
    status: 'in_progress',
    legalStatus: 'drafting',
    procurementStatus: 'not_started',
    note: null,
    metadata: { subKind: 'serve_notice' },
    createdBy: 'user-1',
    createdAt: '2026-05-17T10:00:00Z',
    updatedBy: 'user-1',
    updatedAt: '2026-05-17T10:00:00Z',
    ...overrides,
  };
}

describe('reconcileExecutionRoom', () => {
  it('returns the room unchanged when there are no persisted work items', () => {
    const base = room();
    expect(reconcileExecutionRoom(base, [])).toEqual(base);
  });

  it('overlays persisted owner, SLA and status onto a matching action', () => {
    const reconciled = reconcileExecutionRoom(room(), [workItem()]);
    const serveNotice = reconciled.actions.find((a) => a.kind === 'serve_notice');

    expect(serveNotice?.owner).toBe('Dana Lee');
    expect(serveNotice?.dueDate).toBe(isoOffset(13));
    expect(serveNotice?.status).toBe('in_progress');
  });

  it('maps a done work item onto a complete action status', () => {
    const reconciled = reconcileExecutionRoom(room(), [
      workItem({ status: 'done' }),
    ]);
    const serveNotice = reconciled.actions.find((a) => a.kind === 'serve_notice');
    expect(serveNotice?.status).toBe('complete');
  });

  it('replaces a pending linked-action with a recorded marker once persisted', () => {
    const reconciled = reconcileExecutionRoom(room(), [workItem()]);
    const serveNotice = reconciled.actions.find((a) => a.kind === 'serve_notice');
    expect(serveNotice?.linkedAction.type).toBe('pending');
    if (serveNotice?.linkedAction.type === 'pending') {
      expect(serveNotice.linkedAction.label).toMatch(/recorded/i);
      expect(serveNotice.linkedAction.reason).toContain('wi-1');
    }
  });

  it('leaves un-persisted action slots exactly as the composer produced them', () => {
    const base = room();
    const reconciled = reconcileExecutionRoom(base, [workItem()]);
    const baseLegal = base.actions.find((a) => a.kind === 'legal_review');
    const reconciledLegal = reconciled.actions.find((a) => a.kind === 'legal_review');
    expect(reconciledLegal).toEqual(baseLegal);
  });

  it('overlays a persisted stakeholder approval onto the matching role', () => {
    const reconciled = reconcileExecutionRoom(room(), [
      workItem({
        id: 'wi-appr',
        kind: 'stakeholder_approval',
        owner: 'Priya Shah',
        status: 'done',
        metadata: { subKind: 'finance' },
      }),
    ]);
    const finance = reconciled.approvals.find((a) => a.role === 'finance');
    expect(finance?.owner).toBe('Priya Shah');
    expect(finance?.status).toBe('complete');
  });

  it('promotes a persisted owner onto the room accountableOwner', () => {
    const base = room();
    expect(base.accountableOwner).toBe(NOT_RECORDED);
    const reconciled = reconcileExecutionRoom(base, [workItem()]);
    expect(reconciled.accountableOwner).toBe('Dana Lee');
  });

  it('ignores work items whose subKind matches no room slot', () => {
    const base = room();
    const reconciled = reconcileExecutionRoom(base, [
      workItem({ metadata: { subKind: 'unknown_slot' } }),
    ]);
    expect(reconciled.actions).toEqual(base.actions);
  });

  it('is deterministic for identical input', () => {
    const base = room();
    const items = [workItem()];
    expect(reconcileExecutionRoom(base, items)).toEqual(
      reconcileExecutionRoom(base, items),
    );
  });
});

describe('work-item payload builders', () => {
  it('builds a valid workplan_item payload carrying metadata.subKind', () => {
    const base = room();
    const serveNotice = base.actions.find((a) => a.kind === 'serve_notice')!;
    const payload = workplanItemPayload(base, serveNotice, 'user-1');

    expect(payload.kind).toBe('workplan_item');
    expect(payload.metadata?.subKind).toBe('serve_notice');
    expect(payload.subjectKind).toBe('contract');
    expect(payload.subjectRef).toBe('vendor_contracts:apex-servicenow-itsm');
    expect(payload.legalStatus).toBe('not_started');
    expect(validateNewWorkItem(payload).ok).toBe(true);
  });

  it('builds a valid stakeholder_approval payload carrying the role', () => {
    const base = room();
    const finance = base.approvals.find((a) => a.role === 'finance')!;
    const payload = stakeholderApprovalPayload(base, finance, 'user-1');

    expect(payload.kind).toBe('stakeholder_approval');
    expect(payload.metadata?.subKind).toBe('finance');
    expect(payload.legalStatus).toBeNull();
    expect(validateNewWorkItem(payload).ok).toBe(true);
  });

  it('maps a not-recorded action owner to a null work-item owner', () => {
    const base = room();
    const finance = base.approvals.find((a) => a.role === 'finance')!;
    expect(finance.owner).toBe(NOT_RECORDED);
    expect(stakeholderApprovalPayload(base, finance, null).owner).toBeNull();
  });

  it('maps action statuses onto work-item lifecycle statuses', () => {
    expect(workItemStatusFromAction('complete')).toBe('done');
    expect(workItemStatusFromAction('in_progress')).toBe('in_progress');
    expect(workItemStatusFromAction('pending_external')).toBe('in_progress');
    expect(workItemStatusFromAction('not_started')).toBe('open');
    expect(workItemStatusFromAction('blocked')).toBe('open');
  });
});
