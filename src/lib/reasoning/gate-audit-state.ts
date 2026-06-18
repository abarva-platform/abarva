export interface WaiverAuditRecord {
  tenantId: string;
  instanceId: string;
  criterionId: string;
  reason: string;
  waivedAt: string;
}

export interface ApprovalAuditRecord {
  tenantId: string;
  instanceId: string;
  criterionId: string;
  action: 'approve' | 'reject';
  justification: string;
  actedAt: string;
  actorId?: string;
}

export const waiverAuditBuffer: WaiverAuditRecord[] = [];
export const approvalAuditBuffer: ApprovalAuditRecord[] = [];

export function recordWaiver(record: WaiverAuditRecord): void {
  waiverAuditBuffer.push(record);
}

export function clearWaiverAuditBuffer(): void {
  waiverAuditBuffer.length = 0;
}

export function recordApproval(record: ApprovalAuditRecord): void {
  approvalAuditBuffer.push(record);
}

export function clearApprovalAuditBuffer(): void {
  approvalAuditBuffer.length = 0;
}
