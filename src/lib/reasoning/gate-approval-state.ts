import { recordApproval } from '@/lib/reasoning/gate-audit-state';

export interface ApprovalRecord {
  action: 'approve' | 'reject';
  justification: string;
  timestamp: string;
}

const approvalStore = new Map<string, ApprovalRecord>();

export function getApproval(
  tenantId: string,
  instanceId: string,
  criterionId: string,
): ApprovalRecord | undefined {
  return approvalStore.get(`${tenantId}::${instanceId}::${criterionId}`);
}

export function getApprovalsForInstance(
  tenantId: string,
  instanceId: string,
): Array<{ criterionId: string; record: ApprovalRecord }> {
  const prefix = `${tenantId}::${instanceId}::`;
  const results: Array<{ criterionId: string; record: ApprovalRecord }> = [];
  for (const [key, record] of approvalStore.entries()) {
    if (key.startsWith(prefix)) {
      results.push({ criterionId: key.slice(prefix.length), record });
    }
  }
  return results;
}

export function recordGateApproval(args: {
  tenantId: string;
  instanceId: string;
  criterionId: string;
  action: 'approve' | 'reject';
  justification: string;
  actorId?: string;
}): ApprovalRecord {
  const record: ApprovalRecord = {
    action: args.action,
    justification: args.justification,
    timestamp: new Date().toISOString(),
  };
  approvalStore.set(`${args.tenantId}::${args.instanceId}::${args.criterionId}`, record);
  recordApproval({
    tenantId: args.tenantId,
    instanceId: args.instanceId,
    criterionId: args.criterionId,
    action: args.action,
    justification: args.justification,
    actedAt: record.timestamp,
    actorId: args.actorId,
  });
  return record;
}

export function clearApprovals(): void {
  approvalStore.clear();
}
