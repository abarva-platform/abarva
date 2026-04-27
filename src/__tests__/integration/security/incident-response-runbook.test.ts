/**
 * Wave 31 SEC2 — Incident Response Runbook
 *
 * Verifies the canonical incident response playbook:
 * - Runbook structure is well-formed
 * - All 6 phases are covered by steps
 * - Escalation matrix covers all 4 severities
 * - queryRunbook returns consistent results
 * - Post-incident template is complete
 */

import {
  getIncidentResponseRunbook,
  getStepsByPhase,
  getStepsBySeverity,
  getEscalationEntry,
  getStepsWithEscalationConditions,
  getPostIncidentTemplate,
  getRequiredReviewSections,
  queryRunbook,
  INCIDENT_SEVERITIES_IN_ORDER,
  INCIDENT_RESPONSE_PHASES_IN_ORDER,
} from '@/lib/security/incident-response-runbook';

// ---------------------------------------------------------------------------
// getIncidentResponseRunbook()
// ---------------------------------------------------------------------------

describe('SEC2 — getIncidentResponseRunbook()', () => {
  it('returns a runbook object', () => {
    const runbook = getIncidentResponseRunbook();
    expect(runbook).toBeDefined();
  });

  it('runbook has version 1.0', () => {
    const runbook = getIncidentResponseRunbook();
    expect(runbook.version).toBe('1.0');
  });

  it('runbook has createdFrom sentinel', () => {
    const runbook = getIncidentResponseRunbook();
    expect(runbook.createdFrom).toBe('sec2_w31_incident_response_runbook');
  });

  it('runbook has a name', () => {
    const runbook = getIncidentResponseRunbook();
    expect(typeof runbook.name).toBe('string');
    expect(runbook.name.length).toBeGreaterThan(0);
  });

  it('runbook has exactly 6 phases', () => {
    const runbook = getIncidentResponseRunbook();
    expect(runbook.phases.length).toBe(6);
    expect(runbook.phases).toContain('detect');
    expect(runbook.phases).toContain('triage');
    expect(runbook.phases).toContain('contain');
    expect(runbook.phases).toContain('investigate');
    expect(runbook.phases).toContain('recover');
    expect(runbook.phases).toContain('review');
  });

  it('runbook has non-empty steps array', () => {
    const runbook = getIncidentResponseRunbook();
    expect(Array.isArray(runbook.steps)).toBe(true);
    expect(runbook.steps.length).toBeGreaterThan(0);
  });

  it('runbook has escalationMatrix with 4 entries', () => {
    const runbook = getIncidentResponseRunbook();
    expect(runbook.escalationMatrix.length).toBe(4);
  });

  it('runbook has postIncidentTemplate with entries', () => {
    const runbook = getIncidentResponseRunbook();
    expect(Array.isArray(runbook.postIncidentTemplate)).toBe(true);
    expect(runbook.postIncidentTemplate.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Step structure
// ---------------------------------------------------------------------------

describe('SEC2 — Step structure', () => {
  it('every step has required fields', () => {
    const runbook = getIncidentResponseRunbook();
    for (const step of runbook.steps) {
      expect(typeof step.stepId).toBe('string');
      expect(step.stepId.length).toBeGreaterThan(0);
      expect(typeof step.phase).toBe('string');
      expect(typeof step.label).toBe('string');
      expect(step.label.length).toBeGreaterThan(0);
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
      expect(Array.isArray(step.applicableSeverities)).toBe(true);
      expect(step.applicableSeverities.length).toBeGreaterThan(0);
      expect(typeof step.deterrent).toBe('boolean');
      expect(Array.isArray(step.actions)).toBe(true);
      expect(step.actions.length).toBeGreaterThan(0);
      expect(Array.isArray(step.toolsRequired)).toBe(true);
    }
  });

  it('all step IDs are unique', () => {
    const runbook = getIncidentResponseRunbook();
    const ids = runbook.steps.map((s) => s.stepId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every step phase is one of the 6 canonical phases', () => {
    const runbook = getIncidentResponseRunbook();
    const validPhases = new Set(INCIDENT_RESPONSE_PHASES_IN_ORDER);
    for (const step of runbook.steps) {
      expect(validPhases.has(step.phase)).toBe(true);
    }
  });

  it('every step severity is a valid severity level', () => {
    const runbook = getIncidentResponseRunbook();
    const validSeverities = new Set(INCIDENT_SEVERITIES_IN_ORDER);
    for (const step of runbook.steps) {
      for (const sev of step.applicableSeverities) {
        expect(validSeverities.has(sev)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getStepsByPhase()
// ---------------------------------------------------------------------------

describe('SEC2 — getStepsByPhase()', () => {
  it('returns detect-phase steps', () => {
    const steps = getStepsByPhase('detect');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.phase === 'detect')).toBe(true);
  });

  it('returns triage-phase steps', () => {
    const steps = getStepsByPhase('triage');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.phase === 'triage')).toBe(true);
  });

  it('returns contain-phase steps', () => {
    const steps = getStepsByPhase('contain');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.phase === 'contain')).toBe(true);
  });

  it('returns investigate-phase steps', () => {
    const steps = getStepsByPhase('investigate');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.phase === 'investigate')).toBe(true);
  });

  it('returns recover-phase steps', () => {
    const steps = getStepsByPhase('recover');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.phase === 'recover')).toBe(true);
  });

  it('returns review-phase steps', () => {
    const steps = getStepsByPhase('review');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.phase === 'review')).toBe(true);
  });

  it('returns empty for unknown phase', () => {
    const steps = getStepsByPhase('unknown-phase' as never);
    expect(steps).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getStepsBySeverity()
// ---------------------------------------------------------------------------

describe('SEC2 — getStepsBySeverity()', () => {
  it('SEV1 has the most steps (most comprehensive coverage)', () => {
    const sev1 = getStepsBySeverity('SEV1');
    const sev4 = getStepsBySeverity('SEV4');
    expect(sev1.length).toBeGreaterThan(sev4.length);
  });

  it('every SEV1 step includes SEV1 in applicableSeverities', () => {
    const steps = getStepsBySeverity('SEV1');
    expect(steps.every((s) => s.applicableSeverities.includes('SEV1'))).toBe(true);
  });

  it('every SEV4 step includes SEV4 in applicableSeverities', () => {
    const steps = getStepsBySeverity('SEV4');
    expect(steps.every((s) => s.applicableSeverities.includes('SEV4'))).toBe(true);
  });

  it('SEV2 has at least 2 steps', () => {
    const steps = getStepsBySeverity('SEV2');
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// getEscalationEntry()
// ---------------------------------------------------------------------------

describe('SEC2 — getEscalationEntry()', () => {
  it('returns an entry for SEV1', () => {
    const entry = getEscalationEntry('SEV1');
    expect(entry).toBeDefined();
    expect(entry!.severity).toBe('SEV1');
  });

  it('SEV1 has the shortest maxResponseTimeMinutes', () => {
    const sev1 = getEscalationEntry('SEV1')!;
    const sev4 = getEscalationEntry('SEV4')!;
    expect(sev1.maxResponseTimeMinutes).toBeLessThan(sev4.maxResponseTimeMinutes);
  });

  it('SEV1 requires post-mortem', () => {
    const entry = getEscalationEntry('SEV1')!;
    expect(entry.requiresPostMortem).toBe(true);
  });

  it('SEV3 does not require post-mortem', () => {
    const entry = getEscalationEntry('SEV3')!;
    expect(entry.requiresPostMortem).toBe(false);
  });

  it('SEV1 notifies affected tenants', () => {
    const entry = getEscalationEntry('SEV1')!;
    expect(entry.notifyAffectedTenants).toBe(true);
  });

  it('SEV4 does not notify affected tenants', () => {
    const entry = getEscalationEntry('SEV4')!;
    expect(entry.notifyAffectedTenants).toBe(false);
  });

  it('every escalation entry has required fields', () => {
    for (const sev of INCIDENT_SEVERITIES_IN_ORDER) {
      const entry = getEscalationEntry(sev)!;
      expect(typeof entry.severity).toBe('string');
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.initialResponder).toBe('string');
      expect(Array.isArray(entry.escalateTo)).toBe(true);
      expect(typeof entry.maxResponseTimeMinutes).toBe('number');
      expect(typeof entry.maxContainmentTimeMinutes).toBe('number');
      expect(typeof entry.notifyAffectedTenants).toBe('boolean');
      expect(typeof entry.requiresPostMortem).toBe('boolean');
    }
  });

  it('returns undefined for unknown severity', () => {
    const entry = getEscalationEntry('SEV9' as never);
    expect(entry).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getStepsWithEscalationConditions()
// ---------------------------------------------------------------------------

describe('SEC2 — getStepsWithEscalationConditions()', () => {
  it('returns a non-empty array', () => {
    const steps = getStepsWithEscalationConditions();
    expect(steps.length).toBeGreaterThan(0);
  });

  it('all returned steps have non-null escalateIf', () => {
    const steps = getStepsWithEscalationConditions();
    expect(steps.every((s) => s.escalateIf !== null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPostIncidentTemplate() and getRequiredReviewSections()
// ---------------------------------------------------------------------------

describe('SEC2 — Post-incident review template', () => {
  it('getPostIncidentTemplate returns a non-empty array', () => {
    const template = getPostIncidentTemplate();
    expect(Array.isArray(template)).toBe(true);
    expect(template.length).toBeGreaterThan(0);
  });

  it('every section has required fields', () => {
    const template = getPostIncidentTemplate();
    for (const section of template) {
      expect(typeof section.sectionId).toBe('string');
      expect(section.sectionId.length).toBeGreaterThan(0);
      expect(typeof section.label).toBe('string');
      expect(section.label.length).toBeGreaterThan(0);
      expect(Array.isArray(section.prompts)).toBe(true);
      expect(section.prompts.length).toBeGreaterThan(0);
      expect(typeof section.required).toBe('boolean');
    }
  });

  it('all section IDs are unique', () => {
    const template = getPostIncidentTemplate();
    const ids = template.map((s) => s.sectionId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('getRequiredReviewSections returns only required sections', () => {
    const required = getRequiredReviewSections();
    expect(required.every((s) => s.required)).toBe(true);
  });

  it('required sections include Incident Summary', () => {
    const required = getRequiredReviewSections();
    const hasTimeline = required.some((s) => s.sectionId === 'pir-1-summary');
    expect(hasTimeline).toBe(true);
  });

  it('required sections include Root Cause', () => {
    const required = getRequiredReviewSections();
    const hasRootCause = required.some((s) => s.sectionId === 'pir-3-root-cause');
    expect(hasRootCause).toBe(true);
  });

  it('required sections include Action Items', () => {
    const required = getRequiredReviewSections();
    const hasActionItems = required.some((s) => s.sectionId === 'pir-6-action-items');
    expect(hasActionItems).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// queryRunbook()
// ---------------------------------------------------------------------------

describe('SEC2 — queryRunbook()', () => {
  it('SEV1 query returns steps and escalation entry', () => {
    const result = queryRunbook('SEV1');
    expect(result.deterministicSeed).toBe(true);
    expect(result.severity).toBe('SEV1');
    expect(result.phase).toBeNull();
    expect(result.matchedSteps.length).toBeGreaterThan(0);
    expect(result.escalationEntry.severity).toBe('SEV1');
  });

  it('SEV1 + detect phase returns only detect steps applicable to SEV1', () => {
    const result = queryRunbook('SEV1', 'detect');
    expect(result.phase).toBe('detect');
    expect(result.matchedSteps.every((s) => s.phase === 'detect')).toBe(true);
    expect(result.matchedSteps.every((s) => s.applicableSeverities.includes('SEV1'))).toBe(true);
  });

  it('SEV4 + contain returns empty or limited steps', () => {
    const result = queryRunbook('SEV4', 'contain');
    // SEV4 is unlikely to have contain steps
    expect(result.matchedSteps.every((s) => s.applicableSeverities.includes('SEV4'))).toBe(true);
  });

  it('result is deterministic — same inputs yield same outputs', () => {
    const result1 = queryRunbook('SEV2', 'investigate');
    const result2 = queryRunbook('SEV2', 'investigate');
    expect(result1.matchedSteps.length).toBe(result2.matchedSteps.length);
    expect(result1.escalationEntry.maxResponseTimeMinutes).toBe(
      result2.escalationEntry.maxResponseTimeMinutes,
    );
  });

  it('escalation entry matches expected values for SEV2', () => {
    const result = queryRunbook('SEV2');
    expect(result.escalationEntry.maxResponseTimeMinutes).toBe(15);
    expect(result.escalationEntry.requiresPostMortem).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('SEC2 — Constants', () => {
  it('INCIDENT_SEVERITIES_IN_ORDER has 4 entries', () => {
    expect(INCIDENT_SEVERITIES_IN_ORDER.length).toBe(4);
  });

  it('INCIDENT_SEVERITIES_IN_ORDER starts with SEV1', () => {
    expect(INCIDENT_SEVERITIES_IN_ORDER[0]).toBe('SEV1');
  });

  it('INCIDENT_SEVERITIES_IN_ORDER ends with SEV4', () => {
    expect(INCIDENT_SEVERITIES_IN_ORDER[3]).toBe('SEV4');
  });

  it('INCIDENT_RESPONSE_PHASES_IN_ORDER has 6 entries', () => {
    expect(INCIDENT_RESPONSE_PHASES_IN_ORDER.length).toBe(6);
  });

  it('INCIDENT_RESPONSE_PHASES_IN_ORDER starts with detect', () => {
    expect(INCIDENT_RESPONSE_PHASES_IN_ORDER[0]).toBe('detect');
  });

  it('INCIDENT_RESPONSE_PHASES_IN_ORDER ends with review', () => {
    expect(INCIDENT_RESPONSE_PHASES_IN_ORDER[5]).toBe('review');
  });

  it('recover comes before review in phases', () => {
    const recoverIdx = INCIDENT_RESPONSE_PHASES_IN_ORDER.indexOf('recover');
    const reviewIdx = INCIDENT_RESPONSE_PHASES_IN_ORDER.indexOf('review');
    expect(recoverIdx).toBeLessThan(reviewIdx);
  });
});
