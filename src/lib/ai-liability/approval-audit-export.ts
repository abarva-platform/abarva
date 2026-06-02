import {
  HUMAN_DECISION_CONTROLS_VERSION,
  type AiDecisionEvidencePacket,
} from './human-decision-controls';

export interface AiApprovalAuditExportInput {
  readonly packet: AiDecisionEvidencePacket;
  readonly approvalId: string;
  readonly action: 'approved' | 'rejected' | 'modified' | 'more_evidence_requested';
  readonly approver?: {
    readonly name?: string | null;
    readonly email?: string | null;
    readonly role?: string | null;
    readonly userId?: string | null;
  } | null;
  readonly approvedAt: string;
  readonly sourceSystem?: string | null;
  readonly sourceRefs?: readonly string[];
}

export interface AiApprovalAuditExportRecord {
  readonly schemaVersion: 'abarva.ai-approval-audit-export.v1';
  readonly controlsVersion: string;
  readonly approvalId: string;
  readonly recommendationId: string;
  readonly tenantName: string;
  readonly surface: string;
  readonly agentName: AiDecisionEvidencePacket['agentName'];
  readonly action: AiApprovalAuditExportInput['action'];
  readonly overrideDisposition: AiDecisionEvidencePacket['overrideDisposition'];
  readonly approvedAt: string;
  readonly approverName: string | null;
  readonly approverEmail: string | null;
  readonly approverRole: string | null;
  readonly approverUserId: string | null;
  readonly decisionOwnerName: string | null;
  readonly decisionOwnerTitle: string | null;
  readonly decisionOwnerUserId: string | null;
  readonly humanRationale: string | null;
  readonly evidenceIds: readonly string[];
  readonly missingInputs: readonly string[];
  readonly assumptions: readonly string[];
  readonly alternativesConsidered: readonly string[];
  readonly riskDomains: readonly string[];
  readonly highRisk: boolean;
  readonly escalationRequired: boolean;
  readonly sanitizedRecommendationText: string;
  readonly missingDataBanner: string;
  readonly attestationText: string;
  readonly exportWatermark: string;
  readonly sourceSystem: string | null;
  readonly sourceRefs: readonly string[];
}

const CSV_COLUMNS: ReadonlyArray<keyof AiApprovalAuditExportRecord> = [
  'controlsVersion',
  'approvalId',
  'recommendationId',
  'tenantName',
  'surface',
  'agentName',
  'action',
  'overrideDisposition',
  'approvedAt',
  'approverName',
  'approverEmail',
  'approverRole',
  'decisionOwnerName',
  'decisionOwnerTitle',
  'humanRationale',
  'evidenceIds',
  'missingInputs',
  'assumptions',
  'alternativesConsidered',
  'riskDomains',
  'highRisk',
  'escalationRequired',
  'sanitizedRecommendationText',
  'missingDataBanner',
  'attestationText',
  'exportWatermark',
  'sourceSystem',
  'sourceRefs',
];

export function buildAiApprovalAuditExportRecord(
  input: AiApprovalAuditExportInput,
): AiApprovalAuditExportRecord {
  const { packet, approver } = input;
  return {
    schemaVersion: 'abarva.ai-approval-audit-export.v1',
    controlsVersion: packet.version || HUMAN_DECISION_CONTROLS_VERSION,
    approvalId: input.approvalId,
    recommendationId: packet.recommendationId,
    tenantName: packet.tenantName,
    surface: packet.surface,
    agentName: packet.agentName,
    action: input.action,
    overrideDisposition: packet.overrideDisposition,
    approvedAt: input.approvedAt,
    approverName: approver?.name ?? null,
    approverEmail: approver?.email ?? null,
    approverRole: approver?.role ?? null,
    approverUserId: approver?.userId ?? null,
    decisionOwnerName: packet.decisionOwner?.name ?? null,
    decisionOwnerTitle: packet.decisionOwner?.title ?? null,
    decisionOwnerUserId: packet.decisionOwner?.userId ?? null,
    humanRationale: packet.humanRationale,
    evidenceIds: packet.evidenceIds,
    missingInputs: packet.missingInputs,
    assumptions: packet.assumptions,
    alternativesConsidered: packet.alternativesConsidered,
    riskDomains: packet.riskDomains,
    highRisk: packet.highRisk,
    escalationRequired: packet.escalationRequired,
    sanitizedRecommendationText: packet.sanitizedRecommendationText,
    missingDataBanner: packet.missingDataBanner,
    attestationText: packet.attestationText,
    exportWatermark: packet.exportWatermark,
    sourceSystem: input.sourceSystem ?? null,
    sourceRefs: input.sourceRefs ?? [],
  };
}

export function renderAiApprovalAuditJson(
  records: readonly AiApprovalAuditExportRecord[],
): string {
  return `${JSON.stringify(
    {
      schemaVersion: 'abarva.ai-approval-audit-export.v1',
      controlsVersion: HUMAN_DECISION_CONTROLS_VERSION,
      exportedAt: new Date(0).toISOString(),
      records,
    },
    null,
    2,
  )}\n`;
}

export function renderAiApprovalAuditCsv(
  records: readonly AiApprovalAuditExportRecord[],
): string {
  const header = CSV_COLUMNS.join(',');
  const rows = records.map((record) =>
    CSV_COLUMNS.map((column) => encodeCsvCell(record[column])).join(','),
  );
  return [header, ...rows].join('\n') + '\n';
}

function encodeCsvCell(value: unknown): string {
  const serialized = Array.isArray(value)
    ? value.join('; ')
    : value === null || value === undefined
      ? ''
      : String(value);
  const safe = protectSpreadsheetFormula(serialized);
  return `"${safe.replace(/"/g, '""')}"`;
}

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
