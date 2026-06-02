import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
  buildAiDecisionEvidencePacket,
} from '../human-decision-controls';
import {
  buildAiApprovalAuditExportRecord,
  renderAiApprovalAuditCsv,
  renderAiApprovalAuditJson,
} from '../approval-audit-export';

function makePacket() {
  return buildAiDecisionEvidencePacket({
    recommendationId: 'moves-phase-gate:APX-01:P1->P2',
    surface: 'Moves phase gate',
    agentName: 'Nexus',
    tenantName: 'Apex Retail',
    decisionOwner: {
      name: 'Carlos Rivera',
      title: 'CIO',
      tenantName: 'Apex Retail',
      userId: 'user-carlos',
    },
    recommendationText: 'Nexus selected the phase advance for human review.',
    evidenceIds: ['charter-approved', 'stakeholder-map-reviewed'],
    missingInputs: ['final sponsor commitment timestamp'],
    assumptions: ['Program evidence visible to approver is current.'],
    alternativesConsidered: ['Hold in discovery', 'Request more evidence'],
    humanRationale: 'I reviewed the evidence and accept responsibility for this gate advance.',
    overrideDisposition: 'accepted',
    riskDomains: ['financial_commitment', 'general_business'],
  });
}

describe('approval audit export', () => {
  it('builds a client-exportable approval audit record from a decision packet', () => {
    const record = buildAiApprovalAuditExportRecord({
      packet: makePacket(),
      approvalId: 'approval-001',
      action: 'approved',
      approvedAt: '2026-06-02T14:45:00.000Z',
      approver: {
        name: 'Carlos Rivera',
        email: 'carlos@example.com',
        role: 'sponsor',
        userId: 'user-carlos',
      },
      sourceSystem: 'programs.phase-gate',
      sourceRefs: ['program_audit_log:row-001'],
    });

    expect(record.schemaVersion).toBe('abarva.ai-approval-audit-export.v1');
    expect(record.approvalId).toBe('approval-001');
    expect(record.decisionOwnerName).toBe('Carlos Rivera');
    expect(record.approverEmail).toBe('carlos@example.com');
    expect(record.evidenceIds).toEqual(['charter-approved', 'stakeholder-map-reviewed']);
    expect(record.exportWatermark).toBe(AI_DECISION_SUPPORT_WATERMARK);
    expect(record.attestationText).toBe(HUMAN_DECISION_ATTESTATION_TEXT);
    expect(record.sanitizedRecommendationText).not.toMatch(/\bNexus selected\b/i);
  });

  it('renders stable JSON for client audit export packages', () => {
    const record = buildAiApprovalAuditExportRecord({
      packet: makePacket(),
      approvalId: 'approval-001',
      action: 'approved',
      approvedAt: '2026-06-02T14:45:00.000Z',
    });

    const parsed = JSON.parse(renderAiApprovalAuditJson([record]));
    expect(parsed.schemaVersion).toBe('abarva.ai-approval-audit-export.v1');
    expect(parsed.exportedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].missingDataBanner).toContain('final sponsor commitment timestamp');
  });

  it('renders spreadsheet-safe CSV with arrays flattened for review', () => {
    const packet = buildAiDecisionEvidencePacket({
      recommendationId: 'rec-evil',
      surface: 'Source award',
      agentName: 'Sentinel',
      tenantName: 'Apex Retail',
      decisionOwner: {
        name: '=cmd|calc!A0',
        title: 'Procurement',
        tenantName: 'Apex Retail',
      },
      recommendationText: 'The tool approved the supplier award.',
      evidenceIds: ['rfp-scorecard', 'bafo-summary'],
      missingInputs: ['signed legal review'],
      assumptions: ['Savings model is directional.'],
      alternativesConsidered: ['Rebid'],
      humanRationale: 'Procurement reviewed the award evidence and rejected the AI recommendation.',
      overrideDisposition: 'rejected',
      riskDomains: ['procurement', 'financial_commitment'],
    });
    const record = buildAiApprovalAuditExportRecord({
      packet,
      approvalId: 'approval-evil',
      action: 'rejected',
      approvedAt: '2026-06-02T14:45:00.000Z',
    });

    const csv = renderAiApprovalAuditCsv([record]);
    expect(csv).toContain('controlsVersion,approvalId,recommendationId');
    expect(csv).toContain('"rfp-scorecard; bafo-summary"');
    expect(csv).toContain('"\'=cmd|calc!A0"');
    expect(csv).toContain('"the AI-assisted workflow recommended for human review the supplier award."');
  });
});
