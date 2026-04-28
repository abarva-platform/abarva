// src/lib/programs/__tests__/program-instance.test.ts
//
// REASON-13 — ProgramInstance type + Apex Retail program instances tests

import { buildProgramEvidenceMap } from '../program-instance';
import {
  APX_CDP_2026_INSTANCE,
  APX_LPM_2026_INSTANCE,
  APX_SAP_2026_INSTANCE,
  APX_DFV2_INSTANCE,
  APEX_RETAIL_PROGRAM_INSTANCES,
} from '../program-instances';

// ── 1. APX_CDP_2026_INSTANCE identity ─────────────────────────────────────────

describe('APX_CDP_2026_INSTANCE', () => {
  it('has the correct patternId', () => {
    expect(APX_CDP_2026_INSTANCE.patternId).toBe('PAT-PRG-CDP-001');
  });

  it('has currentPhase 3 (Design)', () => {
    expect(APX_CDP_2026_INSTANCE.currentPhase).toBe(3);
  });

  it('has AMS source event in linkedSourceEvents', () => {
    const amsLink = APX_CDP_2026_INSTANCE.linkedSourceEvents.find(
      l => l.sourceEventId === 'SRC-AMS-2026',
    );
    expect(amsLink).toBeDefined();
  });

  it('AMS source event link has linkType depends-on', () => {
    const amsLink = APX_CDP_2026_INSTANCE.linkedSourceEvents.find(
      l => l.sourceEventId === 'SRC-AMS-2026',
    );
    expect(amsLink?.linkType).toBe('depends-on');
  });

  it('AMS source event link has blockedAtPhase 3', () => {
    const amsLink = APX_CDP_2026_INSTANCE.linkedSourceEvents.find(
      l => l.sourceEventId === 'SRC-AMS-2026',
    );
    expect(amsLink?.blockedAtPhase).toBe(3);
  });
});

// ── 2. buildProgramEvidenceMap ─────────────────────────────────────────────────

describe('buildProgramEvidenceMap', () => {
  it('returns an object with evidence-count >= 0', () => {
    const map = buildProgramEvidenceMap(APX_CDP_2026_INSTANCE);
    expect(typeof map['evidence-count']).toBe('number');
    expect(map['evidence-count'] as number).toBeGreaterThanOrEqual(0);
  });

  it('populates current-phase correctly', () => {
    const map = buildProgramEvidenceMap(APX_CDP_2026_INSTANCE);
    expect(map['current-phase']).toBe(3);
  });

  it('marks approved gates with gate-pN-approved', () => {
    const map = buildProgramEvidenceMap(APX_CDP_2026_INSTANCE);
    // P0, P1, P2 are done with gateStatus approved
    expect(map['gate-p0-approved']).toBe(true);
    expect(map['gate-p1-approved']).toBe(true);
    expect(map['gate-p2-approved']).toBe(true);
  });

  it('sets linked-source-event-blocking true when CDP blocks at current phase', () => {
    const map = buildProgramEvidenceMap(APX_CDP_2026_INSTANCE);
    expect(map['linked-source-event-blocking']).toBe(true);
  });

  it('returns deliverables-complete as number', () => {
    const map = buildProgramEvidenceMap(APX_CDP_2026_INSTANCE);
    expect(typeof map['deliverables-complete']).toBe('number');
  });

  it('works for a P6 steady-state instance (no blocking)', () => {
    const map = buildProgramEvidenceMap(APX_DFV2_INSTANCE);
    expect(map['current-phase']).toBe(6);
    expect(map['linked-source-event-blocking']).toBe(false);
  });
});

// ── 3. All 4 instances have tenantSlug apex-retail ───────────────────────────

describe('APEX_RETAIL_PROGRAM_INSTANCES', () => {
  it('contains exactly 4 instances', () => {
    expect(APEX_RETAIL_PROGRAM_INSTANCES).toHaveLength(4);
  });

  it('all instances have tenantSlug apex-retail', () => {
    for (const instance of APEX_RETAIL_PROGRAM_INSTANCES) {
      expect(instance.tenantSlug).toBe('apex-retail');
    }
  });

  it('flagship CDP instance is first in the array', () => {
    expect(APEX_RETAIL_PROGRAM_INSTANCES[0].id).toBe('APX-CDP-2026');
  });

  it('all instances have a sponsor with name and title', () => {
    for (const instance of APEX_RETAIL_PROGRAM_INSTANCES) {
      expect(instance.sponsor.name.length).toBeGreaterThan(0);
      expect(instance.sponsor.title.length).toBeGreaterThan(0);
    }
  });

  it('all instances have exactly 7 phases', () => {
    for (const instance of APEX_RETAIL_PROGRAM_INSTANCES) {
      expect(instance.phases).toHaveLength(7);
    }
  });
});

// ── 4. AMS depends-on link on CDP ────────────────────────────────────────────

describe('APX-CDP-2026 linked source events', () => {
  it('has exactly one linked source event', () => {
    expect(APX_CDP_2026_INSTANCE.linkedSourceEvents).toHaveLength(1);
  });

  it('AMS link sourceEventName contains AMS Vendor Consolidation', () => {
    const link = APX_CDP_2026_INSTANCE.linkedSourceEvents[0];
    expect(link.sourceEventName).toContain('AMS Vendor Consolidation');
  });

  it('LPM, SAP, and DFV2 have no linked source events', () => {
    expect(APX_LPM_2026_INSTANCE.linkedSourceEvents).toHaveLength(0);
    expect(APX_SAP_2026_INSTANCE.linkedSourceEvents).toHaveLength(0);
    expect(APX_DFV2_INSTANCE.linkedSourceEvents).toHaveLength(0);
  });
});

// ── 5. Phase state ordering invariant ────────────────────────────────────────

describe('phase state ordering', () => {
  const cases = [
    { label: 'CDP (P3)', instance: APX_CDP_2026_INSTANCE },
    { label: 'LPM (P2)', instance: APX_LPM_2026_INSTANCE },
    { label: 'SAP (P1)', instance: APX_SAP_2026_INSTANCE },
    { label: 'DFV2 (P6)', instance: APX_DFV2_INSTANCE },
  ];

  for (const { label, instance } of cases) {
    it(`${label}: phases before currentPhase are 'done'`, () => {
      for (const phase of instance.phases) {
        if (phase.phaseId < instance.currentPhase) {
          expect(phase.status).toBe('done');
        }
      }
    });

    it(`${label}: currentPhase phase is 'current'`, () => {
      const current = instance.phases.find(p => p.phaseId === instance.currentPhase);
      expect(current?.status).toBe('current');
    });
  }
});
