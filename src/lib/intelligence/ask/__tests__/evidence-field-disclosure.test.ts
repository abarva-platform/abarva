import {
  buildEvidenceFieldDisclosure,
  countExactEvidenceFieldHandles,
  shouldAppendEvidenceFieldDisclosure,
} from '../evidence-field-disclosure';
import type { AskSource } from '../types';

const tenantSource: AskSource = {
  type: 'TENANT',
  name: 'Tenant enterprise context',
  id: 'tenant:enterprise',
  detail: 'Loaded tenant context with initiatives, vendors, and value evidence.',
  confidence: 0.94,
};

describe('evidence field disclosure', () => {
  it('detects hard audit questions that need exact evidence handles', () => {
    expect(shouldAppendEvidenceFieldDisclosure('Which claims are not grounded in tenant data?')).toBe(true);
    expect(shouldAppendEvidenceFieldDisclosure('What should the CFO refuse to fund until evidence improves?')).toBe(true);
    expect(shouldAppendEvidenceFieldDisclosure('What should I ask the vendor before signing?')).toBe(true);
    expect(shouldAppendEvidenceFieldDisclosure('Tell me about AI in healthcare')).toBe(false);
  });

  it('builds a readable disclosure with crawl-detectable exact handles', () => {
    const disclosure = buildEvidenceFieldDisclosure(
      'What exact intake field blocks the procurement recommendation?',
      [tenantSource],
    );

    expect(disclosure).toContain('Evidence checked:');
    expect(disclosure).toContain('intake.tenant_context (loaded tenant context)');
    expect(disclosure).toContain('selection_memo.decision_rationale (decision logic)');
    expect(countExactEvidenceFieldHandles(disclosure ?? '')).toBeGreaterThanOrEqual(2);
  });

  it('uses value and contract handles for CFO and vendor questions', () => {
    const disclosure = buildEvidenceFieldDisclosure(
      'What value has been verified versus merely projected, and what should I ask the vendor before signing?',
      [tenantSource],
    );

    expect(disclosure).toContain('contract_terms.renewal_controls');
    expect(disclosure).toContain('telemetry.value_attestation');
    expect(countExactEvidenceFieldHandles(disclosure ?? '')).toBeGreaterThanOrEqual(2);
  });
});
