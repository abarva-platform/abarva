/**
 * portfolio-alerts tests — deterministic feed of urgent reasoning signals
 * across every active program + source-event instance.
 *
 * Pure: no LLM, no IO, no Date.now(), no randomness.
 */

import {
  buildAlertsForInstance,
  buildPortfolioAlerts,
  FAILURE_MODE_ALERT_THRESHOLD,
  type PortfolioAlert,
} from '@/lib/reasoning/portfolio-alerts';
import type {
  CascadeImpact,
  ContradictionDetection,
  FailureModeDetection,
  SynthesisContext,
} from '@/lib/reasoning/types';

// ─── Fixture helpers ─────────────────────────────────────────────────────────

function makeContradiction(
  templateId: string,
  severity: ContradictionDetection['severity'],
  label = `Contradiction ${templateId}`,
): ContradictionDetection {
  return {
    templateId,
    label,
    severity,
    confidence: 0.9,
    partyA: 'A',
    partyB: 'B',
    triggeringEvidence: [],
    resolutionPath: `Resolve ${templateId}`,
    patternRef: { patternId: 'P', patternVersion: '1.0', section: '§ test' },
    detectedAt: 0,
  };
}

function makeFailureMode(
  failureModeId: string,
  confidence: number,
): FailureModeDetection {
  return {
    id: failureModeId,
    failureModeId,
    label: `Failure ${failureModeId}`,
    description: '',
    stages: [],
    mitigations: [`Mitigate ${failureModeId}`],
    confidence,
    matchedKeywords: [],
    detectedFromKeys: [],
  };
}

function makeCascade(
  targetInstanceId: string,
  impactSeverity: CascadeImpact['impactSeverity'],
  impact = `Downstream impact on ${targetInstanceId}.`,
): CascadeImpact {
  return {
    sourceInstanceId: 'INST-1',
    targetInstanceId,
    linkType: 'unblocks',
    impact,
    severity: 'blocking',
    ...(impactSeverity !== undefined ? { impactSeverity } : {}),
  };
}

function makeContext(overrides: Partial<SynthesisContext> = {}): SynthesisContext {
  return {
    instanceId: 'INST-1',
    instanceType: 'source-event',
    patternId: 'P',
    patternVersion: '1.0',
    currentStage: 'BAFO',
    gatesSummary: { total: 0, met: 0, unmet: 0, blocked: [] },
    activeContradictions: [],
    failureModes: [],
    missingArtifacts: [],
    cascadeContext: [],
    citations: [],
    instanceSnapshot: {},
    stageGuidance: '',
    builtAt: 0,
    ...overrides,
  };
}

// ─── 1. Empty context → no alerts ────────────────────────────────────────────

describe('buildAlertsForInstance — clean context', () => {
  it('returns no alerts when nothing is wrong', () => {
    const alerts = buildAlertsForInstance(makeContext(), 'INST-1', '/x');
    expect(alerts).toEqual([]);
  });
});

// ─── 2. Red health emits a high-severity health alert ────────────────────────

describe('buildAlertsForInstance — health grade red', () => {
  it('emits a health alert when computeInstanceHealth returns red', () => {
    // 4 high-sev contradictions = -60 → score 40 → red
    const ctx = makeContext({
      activeContradictions: [
        makeContradiction('c1', 'high'),
        makeContradiction('c2', 'high'),
        makeContradiction('c3', 'high'),
        makeContradiction('c4', 'high'),
      ],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/x');
    const health = alerts.find((a) => a.kind === 'health');
    expect(health).toBeDefined();
    expect(health?.severity).toBe('high');
    expect(health?.label).toMatch(/Health red/);
    expect(health?.instanceId).toBe('INST-1');
    expect(health?.link).toBe('/x');
  });

  it('does not emit a health alert when health is amber/green', () => {
    // 1 high-sev contradiction = -15 → score 85 → green
    const ctx = makeContext({
      activeContradictions: [makeContradiction('c1', 'high')],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/x');
    expect(alerts.find((a) => a.kind === 'health')).toBeUndefined();
  });
});

// ─── 3. High-severity contradictions emit alerts; medium/low are filtered ───

describe('buildAlertsForInstance — contradictions', () => {
  it('emits one alert per high-severity contradiction and ignores medium/low', () => {
    const ctx = makeContext({
      activeContradictions: [
        makeContradiction('c1', 'high', 'High one'),
        makeContradiction('c2', 'medium', 'Medium one'),
        makeContradiction('c3', 'low', 'Low one'),
        makeContradiction('c4', 'high', 'High two'),
      ],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/x').filter(
      (a) => a.kind === 'contradiction',
    );
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.label).sort()).toEqual(['High one', 'High two']);
    expect(alerts.every((a) => a.severity === 'high')).toBe(true);
    expect(alerts.every((a) => a.detail.startsWith('Resolve'))).toBe(true);
  });
});

// ─── 4. Failure modes — confidence ≥ 0.8 alerts ──────────────────────────────

describe('buildAlertsForInstance — failure modes', () => {
  it('emits an alert only when confidence ≥ 0.8', () => {
    expect(FAILURE_MODE_ALERT_THRESHOLD).toBe(0.8);
    const ctx = makeContext({
      failureModes: [
        makeFailureMode('f-low', 0.5),
        makeFailureMode('f-mid', 0.79),
        makeFailureMode('f-edge', 0.8),
        makeFailureMode('f-high', 0.95),
      ],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/x').filter(
      (a) => a.kind === 'failure-mode',
    );
    expect(alerts.map((a) => a.id)).toEqual([
      'failure-mode::INST-1::f-edge',
      'failure-mode::INST-1::f-high',
    ]);
    expect(alerts[0]?.detail).toBe('Mitigate f-edge');
  });
});

// ─── 5. Cascade impacts — only impactSeverity 'high' ─────────────────────────

describe('buildAlertsForInstance — cascade impacts', () => {
  it('emits one alert per high-impact cascade and ignores medium/low/undefined', () => {
    const ctx = makeContext({
      cascadeContext: [
        makeCascade('T-A', 'high', 'Blocks T-A P3 gate.'),
        makeCascade('T-B', 'medium'),
        makeCascade('T-C', 'low'),
        makeCascade('T-D', undefined),
        makeCascade('T-E', 'high'),
      ],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/x').filter(
      (a) => a.kind === 'cascade',
    );
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.label)).toEqual([
      'Cascade impact → T-A',
      'Cascade impact → T-E',
    ]);
    expect(alerts[0]?.detail).toBe('Blocks T-A P3 gate.');
  });
});

// ─── 6. Sort order — high before medium, then by instanceId ──────────────────

describe('buildAlertsForInstance — deterministic sort', () => {
  it('orders by severity then instanceId then kind then id', () => {
    // Build a fixture with one health (red) + multiple contradictions + a
    // failure mode + a cascade so all four kinds participate in the sort.
    const ctx = makeContext({
      activeContradictions: [
        makeContradiction('c2', 'high'),
        makeContradiction('c1', 'high'),
        makeContradiction('c3', 'high'),
        makeContradiction('c4', 'high'),
      ],
      failureModes: [makeFailureMode('f1', 0.95)],
      cascadeContext: [makeCascade('T-A', 'high')],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/x');

    // All alerts share instanceId = 'INST-1' and severity 'high', so the
    // tiebreaker is kind asc → id asc.
    const order = alerts.map((a) => `${a.kind}::${a.id}`);
    expect(order).toEqual([
      'cascade::cascade::INST-1::T-A::unblocks',
      'contradiction::contradiction::INST-1::c1',
      'contradiction::contradiction::INST-1::c2',
      'contradiction::contradiction::INST-1::c3',
      'contradiction::contradiction::INST-1::c4',
      'failure-mode::failure-mode::INST-1::f1',
      'health::health::INST-1',
    ]);
  });
});

// ─── 7. Portfolio alerts — non-empty and properly sorted ─────────────────────

describe('buildPortfolioAlerts — fixture sanity', () => {
  it('returns a non-empty deterministic feed across the demo fixtures', () => {
    const a1 = buildPortfolioAlerts();
    const a2 = buildPortfolioAlerts();
    expect(a1).toEqual(a2); // determinism
    expect(a1.length).toBeGreaterThan(0);
    // High alerts must come before any medium alerts.
    const firstMediumIdx = a1.findIndex((a) => a.severity === 'medium');
    if (firstMediumIdx !== -1) {
      const before = a1.slice(0, firstMediumIdx);
      expect(before.every((a) => a.severity === 'high')).toBe(true);
    }
  });

  it('includes the AMS source instance which has high-severity contradictions', () => {
    const alerts = buildPortfolioAlerts();
    const ams = alerts.filter(
      (a) => a.instanceId === 'apex-retail-ams-outsourcing-2026',
    );
    expect(ams.length).toBeGreaterThan(0);
    expect(ams.every((a) => a.link.startsWith('/source/events/'))).toBe(true);
    expect(ams.some((a) => a.kind === 'contradiction' && a.severity === 'high')).toBe(true);
  });
});

// ─── 8. Alert id stability + link wiring ─────────────────────────────────────

describe('PortfolioAlert id + link wiring', () => {
  it('encodes kind, instanceId, and source identifier into the id', () => {
    const ctx = makeContext({
      activeContradictions: [makeContradiction('TEMPLATE-X', 'high')],
    });
    const alerts = buildAlertsForInstance(ctx, 'INST-1', '/source/events/INST-1');
    const ca = alerts.find((a) => a.kind === 'contradiction');
    expect(ca?.id).toBe('contradiction::INST-1::TEMPLATE-X');
    expect(ca?.link).toBe('/source/events/INST-1');
  });

  it('routes program instances to /tower/programs/{lower-id} and source events to /source/events/{id}', () => {
    const alerts = buildPortfolioAlerts();
    for (const a of alerts) {
      if (a.link.startsWith('/tower/programs/')) {
        expect(a.link).toBe(a.link.toLowerCase());
      } else {
        expect(a.link.startsWith('/source/events/')).toBe(true);
      }
    }
  });
});

// ─── 9. PortfolioAlert shape contract ────────────────────────────────────────

describe('PortfolioAlert — shape contract', () => {
  it('every emitted alert satisfies the documented shape', () => {
    const alerts = buildPortfolioAlerts();
    for (const a of alerts) {
      const keys: ReadonlyArray<keyof PortfolioAlert> = [
        'id',
        'severity',
        'kind',
        'label',
        'instanceId',
        'instanceLabel',
        'detail',
        'link',
      ];
      for (const k of keys) {
        expect(a[k]).toBeDefined();
        expect(typeof a[k]).toBe('string');
        expect((a[k] as string).length).toBeGreaterThan(0);
      }
      expect(['high', 'medium']).toContain(a.severity);
      expect(['contradiction', 'failure-mode', 'health', 'cascade']).toContain(a.kind);
    }
  });
});

