/**
 * Tests for the healthcare CXO answer contract.
 *
 * Goal: prove the contract is injected for Healthcare-vertical tenants
 * (Meridian / PHS) and is completely absent for non-healthcare tenants, so the
 * retail / financial-services verticals are not regressed.
 */

import { describe, expect, it } from '@jest/globals';
import {
  buildHealthcareAnswerContract,
  isHealthcareAnswerContractTenant,
  HEALTHCARE_ANSWER_CONTRACT_MARKER,
} from '../healthcareAnswerContract';

describe('healthcare answer contract gating', () => {
  it('detects Meridian (canonical client key) as a healthcare tenant', () => {
    expect(isHealthcareAnswerContractTenant('meridian')).toBe(true);
  });

  it('detects the meridian-health alias as a healthcare tenant', () => {
    expect(isHealthcareAnswerContractTenant('meridian-health')).toBe(true);
    expect(isHealthcareAnswerContractTenant('Meridian-Health')).toBe(true);
  });

  it('does not treat retail (Apex) as a healthcare tenant', () => {
    expect(isHealthcareAnswerContractTenant('apexretail')).toBe(false);
    expect(isHealthcareAnswerContractTenant('apex-retail')).toBe(false);
  });

  it('does not treat financial services (First Capital / arcturus) as healthcare', () => {
    expect(isHealthcareAnswerContractTenant('arcturus')).toBe(false);
    expect(isHealthcareAnswerContractTenant('first-capital-financial')).toBe(false);
  });

  it('returns false for null / empty / unknown tenants', () => {
    expect(isHealthcareAnswerContractTenant(null)).toBe(false);
    expect(isHealthcareAnswerContractTenant(undefined)).toBe(false);
    expect(isHealthcareAnswerContractTenant('')).toBe(false);
  });
});

describe('healthcare answer contract content', () => {
  it('emits the contract block for a Meridian/healthcare tenant', () => {
    const block = buildHealthcareAnswerContract('meridian');
    expect(block).toContain(HEALTHCARE_ANSWER_CONTRACT_MARKER);
    // Decision-grade spine is present.
    expect(block).toContain('My read');
    expect(block).toContain('Evidence basis');
    expect(block).toContain('What I\'d do next');
    expect(block).toContain('Evidence gaps');
    expect(block).toContain('Human approval / governance');
    // Healthcare domain fluency is present.
    expect(block).toMatch(/Epic/);
    expect(block).toMatch(/MLR|Stars|HEDIS/);
    expect(block).toMatch(/CDAO/);
    // No-fabrication is reinforced, not weakened.
    expect(block).toMatch(/NEVER invent/);
    expect(block).toMatch(/human-in-the-loop/i);
    // Never patient medical advice.
    expect(block).toMatch(/medical advice/i);
  });

  it('returns an empty string for non-healthcare tenants (no token bloat, no regression)', () => {
    expect(buildHealthcareAnswerContract('apexretail')).toBe('');
    expect(buildHealthcareAnswerContract('arcturus')).toBe('');
    expect(buildHealthcareAnswerContract(null)).toBe('');
  });

  it('does not leak the contract marker for non-healthcare tenants', () => {
    expect(buildHealthcareAnswerContract('apexretail')).not.toContain(
      HEALTHCARE_ANSWER_CONTRACT_MARKER,
    );
  });

  it('does not contain boastful framing', () => {
    const block = buildHealthcareAnswerContract('meridian');
    expect(block.toLowerCase()).not.toContain('better than mckinsey');
  });
});
