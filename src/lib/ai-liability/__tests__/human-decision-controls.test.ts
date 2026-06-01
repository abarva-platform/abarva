import {
  AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
  AI_DECISION_SUPPORT_WATERMARK,
  COUNSEL_REVIEW_CHECKLIST,
  DEFAULT_CLIENT_AI_DECISION_POLICY,
  HUMAN_DECISION_ATTESTATION_TEXT,
  MODEL_RISK_REGISTER,
  buildAiDecisionEvidencePacket,
  classifyAiDecisionRisk,
  sanitizeAutonomousDecisionLanguage,
  validateAiDecisionEvidencePacket,
} from '../human-decision-controls';

describe('human decision controls', () => {
  it('sanitizes autonomous decision language into decision-support language', () => {
    const sanitized = sanitizeAutonomousDecisionLanguage(
      'AbarVa approved the vendor award. The tool decided the client must select Supplier A.',
    );

    expect(sanitized).toContain('client decision owner');
    expect(sanitized).toContain('AI-assisted workflow recommended for human review');
    expect(sanitized).not.toMatch(/\bAbarVa approved\b/i);
    expect(sanitized).not.toMatch(/\btool decided\b/i);
    expect(sanitized).not.toMatch(/\bmust select\b/i);
  });

  it('classifies regulated individual-impact uses as high risk', () => {
    const result = classifyAiDecisionRisk({
      text: 'Recommend terminating an employee after a clinical safety incident.',
    });

    expect(result.highRisk).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.domains).toEqual(expect.arrayContaining(['employment', 'healthcare_treatment', 'safety']));
  });

  it('builds and validates a complete decision evidence packet', () => {
    const packet = buildAiDecisionEvidencePacket({
      recommendationId: 'rec-001',
      surface: '/tower',
      agentName: 'Atlas',
      tenantName: 'Apex Retail',
      decisionOwner: {
        name: 'Carlos Rivera',
        title: 'CIO',
        tenantName: 'Apex Retail',
      },
      recommendationText: 'Atlas selected a pricing path for review by finance.',
      evidenceIds: ['evidence-1'],
      missingInputs: ['final supplier concession'],
      assumptions: ['current run-rate remains stable'],
      alternativesConsidered: ['rebid', 'renegotiate', 'hold'],
      humanRationale: 'Finance prefers renegotiation before rebid.',
      overrideDisposition: 'modified',
      riskDomains: ['procurement', 'financial_commitment'],
    });

    expect(packet.exportWatermark).toBe(AI_DECISION_SUPPORT_WATERMARK);
    expect(packet.attestationText).toBe(HUMAN_DECISION_ATTESTATION_TEXT);
    expect(packet.missingDataBanner).toContain('final supplier concession');
    expect(packet.sanitizedRecommendationText).toContain('AI advisor recommended for human review');
    expect(validateAiDecisionEvidencePacket(packet).passed).toBe(true);
  });

  it('fails a consequential packet that lacks owner, evidence, attestation support, and override capture', () => {
    const packet = buildAiDecisionEvidencePacket({
      recommendationId: 'rec-002',
      surface: '/source',
      agentName: 'Sentinel',
      tenantName: 'Meridian Health',
      recommendationText: 'The tool approved the clinical treatment vendor.',
      evidenceIds: [],
      missingInputs: [],
      assumptions: [],
      alternativesConsidered: [],
      riskDomains: ['healthcare_treatment'],
    });

    const validation = validateAiDecisionEvidencePacket(packet, DEFAULT_CLIENT_AI_DECISION_POLICY);
    expect(validation.passed).toBe(false);
    expect(validation.failures).toEqual(expect.arrayContaining([
      'missing_decision_owner',
      'missing_evidence_ids',
      'missing_assumptions',
      'missing_missing_inputs_record',
      'missing_human_override_or_acceptance',
    ]));
    expect(packet.escalationRequired).toBe(true);
  });

  it('exports governance evidence for prompt, model-risk, and counsel controls', () => {
    expect(AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK).toContain('decision support');
    expect(AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK).toContain('client decision owner');
    expect(MODEL_RISK_REGISTER.length).toBeGreaterThanOrEqual(2);
    expect(MODEL_RISK_REGISTER.flatMap((entry) => entry.nistAiRmfFunctions)).toEqual(
      expect.arrayContaining(['govern', 'map', 'measure', 'manage']),
    );
    expect(COUNSEL_REVIEW_CHECKLIST.join(' ')).toContain('limitation of liability');
  });
});
