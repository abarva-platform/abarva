/**
 * W32B — Intelligence Programs and Actions Mode Tests
 *
 * Tests for:
 *   src/lib/intelligence/intelligence-programs-mode-view.ts
 *   src/lib/intelligence/intelligence-actions-mode-view.ts
 *
 * All tests are deterministic seed only — no React, no network, no model calls.
 */

import {
  buildIntelligenceProgramsModeView,
  type IntelligenceProgramsMode,
} from '@/lib/intelligence/intelligence-programs-mode-view';

import {
  buildIntelligenceActionsModeView,
  type IntelligenceActionsMode,
  type ActionPriority,
  type ActionAgent,
} from '@/lib/intelligence/intelligence-actions-mode-view';

// ===========================================================================
// Programs Mode — structure
// ===========================================================================

describe('buildIntelligenceProgramsModeView — structure', () => {
  it('mode is always programs', () => {
    const view = buildIntelligenceProgramsModeView('apex-retail');
    expect(view.mode).toBe('programs');
  });

  it('deterministicSeed is true', () => {
    const view = buildIntelligenceProgramsModeView('apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('caveat is a non-empty string', () => {
    const view = buildIntelligenceProgramsModeView('apex-retail');
    expect(typeof view.caveat).toBe('string');
    expect(view.caveat.length).toBeGreaterThan(10);
  });
});

// ===========================================================================
// Programs Mode — apex-retail data contract
// ===========================================================================

describe('buildIntelligenceProgramsModeView — apex-retail', () => {
  let view: IntelligenceProgramsMode;

  beforeEach(() => {
    view = buildIntelligenceProgramsModeView('apex-retail');
  });

  it('returns 3 impacted programs for apex-retail', () => {
    expect(view.impactedPrograms).toHaveLength(3);
  });

  it('lowContextDisclosure is null for apex-retail', () => {
    expect(view.lowContextDisclosure).toBeNull();
  });

  it('CDP program is included', () => {
    const cdp = view.impactedPrograms.find((p) => p.programCode === 'APX-CDP-2026');
    expect(cdp).toBeDefined();
  });

  it('AMS program is included', () => {
    const ams = view.impactedPrograms.find((p) => p.programCode === 'APX-AMS-2026');
    expect(ams).toBeDefined();
  });

  it('Contact Center AI program is included', () => {
    const cai = view.impactedPrograms.find((p) => p.programCode === 'APX-CAI-2026');
    expect(cai).toBeDefined();
  });

  it('each impacted program has at least one patternId', () => {
    for (const prog of view.impactedPrograms) {
      expect(prog.patternIds.length).toBeGreaterThan(0);
    }
  });

  it('each impacted program has non-empty sentinelSignal', () => {
    for (const prog of view.impactedPrograms) {
      expect(prog.sentinelSignal.length).toBeGreaterThan(0);
    }
  });

  it('each impacted program has non-empty evidenceBasis', () => {
    for (const prog of view.impactedPrograms) {
      expect(prog.evidenceBasis.length).toBeGreaterThan(0);
    }
  });

  it('vendor assumption divergence pattern is referenced in CDP program', () => {
    const cdp = view.impactedPrograms.find((p) => p.programCode === 'APX-CDP-2026');
    expect(cdp?.patternIds).toContain('PAT-VENDOR-ASSUMPTION-DIVERGENCE');
  });

  it('BAFO readiness gap pattern is referenced in AMS program', () => {
    const ams = view.impactedPrograms.find((p) => p.programCode === 'APX-AMS-2026');
    expect(ams?.patternIds).toContain('PAT-BAFO-READINESS-GAP');
  });
});

// ===========================================================================
// Programs Mode — meridian (thin tenant)
// ===========================================================================

describe('buildIntelligenceProgramsModeView — meridian', () => {
  let view: IntelligenceProgramsMode;

  beforeEach(() => {
    view = buildIntelligenceProgramsModeView('meridian');
  });

  it('mode is programs', () => {
    expect(view.mode).toBe('programs');
  });

  it('lowContextDisclosure is non-null for meridian', () => {
    expect(view.lowContextDisclosure).not.toBeNull();
    expect((view.lowContextDisclosure as string).length).toBeGreaterThan(10);
  });

  it('impactedPrograms is non-empty for meridian (stub program)', () => {
    expect(view.impactedPrograms.length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true for meridian', () => {
    expect(view.deterministicSeed).toBe(true);
  });
});

// ===========================================================================
// Programs Mode — unknown tenant
// ===========================================================================

describe('buildIntelligenceProgramsModeView — unknown tenant', () => {
  it('returns empty impactedPrograms for unknown tenant', () => {
    const view = buildIntelligenceProgramsModeView('unknown-org');
    expect(view.impactedPrograms).toHaveLength(0);
  });

  it('lowContextDisclosure is non-null for unknown tenant', () => {
    const view = buildIntelligenceProgramsModeView('unknown-org');
    expect(view.lowContextDisclosure).not.toBeNull();
  });
});

// ===========================================================================
// Actions Mode — structure
// ===========================================================================

describe('buildIntelligenceActionsModeView — structure', () => {
  it('mode is always actions', () => {
    const view = buildIntelligenceActionsModeView('apex-retail');
    expect(view.mode).toBe('actions');
  });

  it('deterministicSeed is true', () => {
    const view = buildIntelligenceActionsModeView('apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('caveat is a non-empty string', () => {
    const view = buildIntelligenceActionsModeView('apex-retail');
    expect(typeof view.caveat).toBe('string');
    expect(view.caveat.length).toBeGreaterThan(10);
  });
});

// ===========================================================================
// Actions Mode — apex-retail data contract
// ===========================================================================

describe('buildIntelligenceActionsModeView — apex-retail', () => {
  let view: IntelligenceActionsMode;

  beforeEach(() => {
    view = buildIntelligenceActionsModeView('apex-retail');
  });

  it('returns at least 3 actions for apex-retail', () => {
    expect(view.actions.length).toBeGreaterThanOrEqual(3);
  });

  it('lowContextDisclosure is null for apex-retail', () => {
    expect(view.lowContextDisclosure).toBeNull();
  });

  it('each action has a unique id', () => {
    const ids = view.actions.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('each action has a non-empty title', () => {
    for (const action of view.actions) {
      expect(action.title.length).toBeGreaterThan(0);
    }
  });

  it('each action has a valid priority', () => {
    const validPriorities: ActionPriority[] = ['immediate', 'this_week', 'this_month', 'deferred'];
    for (const action of view.actions) {
      expect(validPriorities).toContain(action.priority);
    }
  });

  it('each action has a valid agent', () => {
    const validAgents: ActionAgent[] = ['sentinel', 'nexus', 'steward', 'atlas'];
    for (const action of view.actions) {
      expect(validAgents).toContain(action.agent);
    }
  });

  it('each action has non-empty affectedSurface', () => {
    for (const action of view.actions) {
      expect(action.affectedSurface.length).toBeGreaterThan(0);
    }
  });

  it('each action has non-empty evidenceBasis', () => {
    for (const action of view.actions) {
      expect(action.evidenceBasis.length).toBeGreaterThan(0);
    }
  });

  it('each action has deterministicSeed true', () => {
    for (const action of view.actions) {
      expect(action.deterministicSeed).toBe(true);
    }
  });

  it('at least one action is immediate priority', () => {
    const immediate = view.actions.filter((a) => a.priority === 'immediate');
    expect(immediate.length).toBeGreaterThan(0);
  });

  it('vendor assumption divergence action is present (linked to BAFO)', () => {
    const found = view.actions.find((a) =>
      a.description.toLowerCase().includes('vendor assumption') ||
      a.title.toLowerCase().includes('vendor assumption')
    );
    expect(found).toBeDefined();
  });

  it('BAFO readiness action is present', () => {
    const found = view.actions.find((a) =>
      a.title.toLowerCase().includes('bafo') ||
      a.description.toLowerCase().includes('bafo')
    );
    expect(found).toBeDefined();
  });

  it('CDP evidence gap action is present', () => {
    const found = view.actions.find((a) =>
      a.title.toLowerCase().includes('cdp') ||
      a.description.toLowerCase().includes('cdp')
    );
    expect(found).toBeDefined();
  });
});

// ===========================================================================
// Actions Mode — meridian (thin tenant)
// ===========================================================================

describe('buildIntelligenceActionsModeView — meridian', () => {
  let view: IntelligenceActionsMode;

  beforeEach(() => {
    view = buildIntelligenceActionsModeView('meridian');
  });

  it('lowContextDisclosure is non-null for meridian', () => {
    expect(view.lowContextDisclosure).not.toBeNull();
  });

  it('actions is non-empty (at least upload evidence action)', () => {
    expect(view.actions.length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true for meridian', () => {
    expect(view.deterministicSeed).toBe(true);
  });
});

// ===========================================================================
// Actions Mode — unknown tenant
// ===========================================================================

describe('buildIntelligenceActionsModeView — unknown tenant', () => {
  it('returns empty actions for unknown tenant', () => {
    const view = buildIntelligenceActionsModeView('shell-tenant');
    expect(view.actions).toHaveLength(0);
  });

  it('lowContextDisclosure is non-null for unknown tenant', () => {
    const view = buildIntelligenceActionsModeView('shell-tenant');
    expect(view.lowContextDisclosure).not.toBeNull();
  });
});
