// CTX3 - Mission Context Bridge - integration tests.
//
// Pure deterministic coverage. No model/API calls. No DOM. No
// Date.now reads. Asserts that:
// - Every seeded AG10 mission can be processed by the bridge.
// - Same input -> byte-equal output across calls.
// - Supported work-object kinds (program / phase / workshop / artifact /
//   pattern) produce a non-null context result.
// - Unsupported kinds (tower_dimension / dataset_domain / sourcing_event /
//   vendor_response) produce contextResult: null AND
//   readiness: 'work_object_unsupported' AND >=1 explanatory gap.
// - CTX2 missing inputs are promoted 1:1 as MissionContextGap entries.
// - summarizeMissionContextReadiness reconciles by-readiness counts
//   with the total result count.
// - No fake citations leak in any serialized result.
// - basis.source and createdFrom invariants hold on every result.
// - Module hygiene: no Date.now / Math.random / new Date( / fetch(,
//   no model SDK imports, no useState / useEffect, no imports from
//   forbidden runtimes.

import {
  buildAgentMissionQueue,
  type AgentMission,
  type AgentMissionWorkObjectKind,
} from '@/lib/agent/agent-mission-queue';
import {
  buildContextForAgentMission,
  buildMissionContextBatch,
  buildMissionContextBatchForAllSeededMissions,
  getMissionContextReadinessOrder,
  summarizeMissionContextReadiness,
  type MissionContextBridgeResult,
  type MissionContextBuildRequest,
  type MissionContextReadiness,
} from '@/lib/architecture/mission-context-bridge';

const SUPPORTED_KINDS: ReadonlyArray<AgentMissionWorkObjectKind> = [
  'program',
  'phase',
  'workshop',
  'artifact',
  'pattern',
];

const UNSUPPORTED_KINDS: ReadonlyArray<AgentMissionWorkObjectKind> = [
  'tower_dimension',
  'dataset_domain',
  'sourcing_event',
  'vendor_response',
];

const ALL_READINESS_KEYS: ReadonlyArray<MissionContextReadiness> = [
  'usable',
  'partial',
  'weak',
  'refused',
  'work_object_unsupported',
];

const TENANT_KEY = 'apexretail';

function buildAllRequests(): MissionContextBuildRequest[] {
  const missions = buildAgentMissionQueue();
  return missions.map((mission) => ({ mission, tenantKey: TENANT_KEY }));
}

// ---------------------------------------------------------------------
// Coverage: every seeded mission can be processed
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · seed coverage', () => {
  const missions = buildAgentMissionQueue();

  it('processes every seeded AG10 mission without throwing', () => {
    expect(missions.length).toBeGreaterThan(0);
    for (const mission of missions) {
      const result = buildContextForAgentMission({
        mission,
        tenantKey: TENANT_KEY,
      });
      expect(result.missionId).toBe(mission.id);
      expect(result.agent).toBe(mission.agent);
      expect(result.workObject).toEqual(mission.workObject);
    }
  });

  it('buildMissionContextBatch returns one result per mission, in order', () => {
    const requests = buildAllRequests();
    const results = buildMissionContextBatch(requests);
    expect(results).toHaveLength(requests.length);
    for (let i = 0; i < requests.length; i += 1) {
      expect(results[i].missionId).toBe(requests[i].mission.id);
    }
  });

  it('buildMissionContextBatchForAllSeededMissions returns one result per seeded mission', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    expect(results).toHaveLength(missions.length);
    for (let i = 0; i < missions.length; i += 1) {
      expect(results[i].missionId).toBe(missions[i].id);
    }
  });
});

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · determinism', () => {
  const missions = buildAgentMissionQueue();

  it('returns byte-equal output across calls for identical input', () => {
    for (const mission of missions) {
      const a = buildContextForAgentMission({ mission, tenantKey: TENANT_KEY });
      const b = buildContextForAgentMission({ mission, tenantKey: TENANT_KEY });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('buildMissionContextBatch is byte-equal across calls', () => {
    const requests = buildAllRequests();
    const a = buildMissionContextBatch(requests);
    const b = buildMissionContextBatch(requests);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('preserves the canonical AG10 mission order in the batch result', () => {
    const requests = buildAllRequests();
    const results = buildMissionContextBatch(requests);
    const inputIds = requests.map((r) => r.mission.id);
    const outputIds = results.map((r) => r.missionId);
    expect(outputIds).toEqual(inputIds);
  });
});

// ---------------------------------------------------------------------
// Supported work-object kinds produce a non-null contextResult
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · supported work-object kinds', () => {
  const missions = buildAgentMissionQueue();

  // Synthesize a workshop mission since AG10's deterministic seed
  // does not currently include a 'workshop' mission. The bridge must
  // still map workshop -> program, so we exercise that path with a
  // hand-built mission that mirrors the seed shape.
  const SYNTHETIC_WORKSHOP_MISSION: AgentMission = {
    id: 'mission-seed-bridge-workshop',
    agent: 'nexus',
    type: 'next_action',
    state: 'active',
    priority: 'medium',
    workObject: {
      kind: 'workshop',
      id: 'workshop-seed-apex-discovery',
      label: 'Apex Retail · Discovery Workshop',
      surface: 'programs',
    },
    rationale:
      'Workshop missions tie to the parent program scope, so the bridge must surface a CTX2 program pack.',
    recommendedAction: 'Use program-scope context to advance the workshop.',
    uiVisibility: 'right_panel',
    stopCondition: 'Workshop completes or is intentionally deferred.',
    handoff: null,
    createdFrom: 'deterministic_seed',
  };

  function findMission(kind: AgentMissionWorkObjectKind): AgentMission {
    if (kind === 'workshop') return SYNTHETIC_WORKSHOP_MISSION;
    const found = missions.find((m) => m.workObject.kind === kind);
    if (!found) {
      throw new Error(`No seed mission for kind '${kind}'`);
    }
    return found;
  }

  it.each(SUPPORTED_KINDS)(
    'kind %s produces a non-null contextResult',
    (kind) => {
      const mission = findMission(kind);
      const result = buildContextForAgentMission({
        mission,
        tenantKey: TENANT_KEY,
      });
      expect(result.contextResult).not.toBeNull();
      expect(result.readiness).not.toBe('work_object_unsupported');
    },
  );

  it('every supported-kind result carries a contextResult with twelve sections', () => {
    const supportedMissions: AgentMission[] = SUPPORTED_KINDS.map(findMission);
    expect(supportedMissions.length).toBe(SUPPORTED_KINDS.length);
    for (const mission of supportedMissions) {
      const result = buildContextForAgentMission({
        mission,
        tenantKey: TENANT_KEY,
      });
      expect(result.contextResult).not.toBeNull();
      expect(result.contextResult!.pack.sections).toHaveLength(12);
    }
  });
});

// ---------------------------------------------------------------------
// Unsupported work-object kinds
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · unsupported work-object kinds', () => {
  const missions = buildAgentMissionQueue();

  it.each(UNSUPPORTED_KINDS)(
    'kind %s produces contextResult: null + work_object_unsupported + at least one gap',
    (kind) => {
      const mission = missions.find((m) => m.workObject.kind === kind);
      expect(mission).toBeDefined();
      const result = buildContextForAgentMission({
        mission: mission as AgentMission,
        tenantKey: TENANT_KEY,
      });
      expect(result.contextResult).toBeNull();
      expect(result.readiness).toBe('work_object_unsupported');
      expect(result.gaps.length).toBeGreaterThanOrEqual(1);
      expect(result.gaps[0].reason.length).toBeGreaterThan(0);
      expect(result.gaps[0].impact).toBe('blocks_response');
    },
  );

  it('unsupported gap reason names the unsupported kind explicitly', () => {
    for (const kind of UNSUPPORTED_KINDS) {
      const mission = missions.find((m) => m.workObject.kind === kind);
      const result = buildContextForAgentMission({
        mission: mission as AgentMission,
        tenantKey: TENANT_KEY,
      });
      const reason = result.gaps[0].reason;
      expect(reason).toContain(kind);
    }
  });
});

// ---------------------------------------------------------------------
// CTX2 missing inputs are preserved as gaps
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · gaps preserve CTX2 missing inputs', () => {
  const missions = buildAgentMissionQueue();

  it('1:1 promotes CTX2 missingInputs into MissionContextGap entries', () => {
    const programMission = missions.find((m) => m.workObject.kind === 'program');
    expect(programMission).toBeDefined();
    const result = buildContextForAgentMission({
      mission: programMission as AgentMission,
      tenantKey: TENANT_KEY,
    });
    expect(result.contextResult).not.toBeNull();
    const ctx2Inputs = result.contextResult!.missingInputs;
    expect(result.gaps).toHaveLength(ctx2Inputs.length);
    for (let i = 0; i < ctx2Inputs.length; i += 1) {
      expect(result.gaps[i].kind).toBe(ctx2Inputs[i].kind);
      expect(result.gaps[i].impact).toBe(ctx2Inputs[i].impact);
      expect(result.gaps[i].reason).toBe(ctx2Inputs[i].reason);
    }
  });

  it('empty tenantKey surfaces a blocks_response gap from CTX2', () => {
    const programMission = missions.find((m) => m.workObject.kind === 'program');
    const result = buildContextForAgentMission({
      mission: programMission as AgentMission,
      tenantKey: '',
    });
    expect(result.contextResult).not.toBeNull();
    const blocking = result.gaps.filter((g) => g.impact === 'blocks_response');
    expect(blocking.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// summarizeMissionContextReadiness
// ---------------------------------------------------------------------

describe('summarizeMissionContextReadiness', () => {
  it('total equals result count', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    const summary = summarizeMissionContextReadiness(results);
    expect(summary.total).toBe(results.length);
  });

  it('byReadiness counts sum to total', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    const summary = summarizeMissionContextReadiness(results);
    let sum = 0;
    for (const key of ALL_READINESS_KEYS) {
      sum += summary.byReadiness[key];
    }
    expect(sum).toBe(summary.total);
  });

  it('totalGaps equals the sum of per-result gap counts', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    const summary = summarizeMissionContextReadiness(results);
    const expected = results.reduce(
      (acc: number, r: MissionContextBridgeResult) => acc + r.gaps.length,
      0,
    );
    expect(summary.totalGaps).toBe(expected);
  });

  it('unsupportedWorkObjectKinds is sorted and deduplicated', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    const summary = summarizeMissionContextReadiness(results);
    const sorted = [...summary.unsupportedWorkObjectKinds].sort();
    expect(summary.unsupportedWorkObjectKinds).toEqual(sorted);
    const set = new Set(summary.unsupportedWorkObjectKinds);
    expect(set.size).toBe(summary.unsupportedWorkObjectKinds.length);
  });

  it('unsupportedWorkObjectKinds contains every AG10 unsupported kind seen', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    const summary = summarizeMissionContextReadiness(results);
    const observed = new Set(
      results
        .filter((r) => r.readiness === 'work_object_unsupported')
        .map((r) => r.workObject.kind),
    );
    for (const kind of observed) {
      expect(summary.unsupportedWorkObjectKinds).toContain(kind);
    }
  });

  it('empty input returns zeroed summary', () => {
    const summary = summarizeMissionContextReadiness([]);
    expect(summary.total).toBe(0);
    expect(summary.totalGaps).toBe(0);
    expect(summary.unsupportedWorkObjectKinds).toEqual([]);
    for (const key of ALL_READINESS_KEYS) {
      expect(summary.byReadiness[key]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------
// Honesty: no fake evidence citations
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · no fabricated evidence citations', () => {
  it('serialized batch contains no /E-\\d+/ citations', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    const serialized = JSON.stringify(results);
    expect(serialized).not.toMatch(/E-\d+/);
    expect(serialized).not.toMatch(/"E-\d+"/);
  });
});

// ---------------------------------------------------------------------
// Basis invariants
// ---------------------------------------------------------------------

describe('buildContextForAgentMission · basis invariants', () => {
  it('every result names mission_context_bridge as the basis source', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    for (const result of results) {
      expect(result.basis.source).toBe('mission_context_bridge');
      expect(result.basis.bridgeVersion).toBe('ctx3.v1');
      expect(result.createdFrom).toBe('deterministic_seed');
    }
  });

  it('readiness is always one of the canonical keys', () => {
    const results = buildMissionContextBatchForAllSeededMissions(TENANT_KEY);
    for (const result of results) {
      expect(ALL_READINESS_KEYS).toContain(result.readiness);
    }
  });

  it('exposes the canonical readiness order constant', () => {
    expect(getMissionContextReadinessOrder()).toEqual(ALL_READINESS_KEYS);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · mission-context-bridge.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/mission-context-bridge.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  // Strip line + block comments so hygiene assertions fire on real
  // code only (the file's own header references some of these tokens
  // honestly).
  const codeOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  it('imports only the two allowed cross-modules (CTX2 + AG10)', () => {
    expect(source).toMatch(/from '@\/lib\/architecture\/unified-context-builder'/);
    expect(source).toMatch(/from '@\/lib\/agents\/agent-mission-queue'/);
  });

  it('does not import from forbidden runtimes', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch( or import model SDKs', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/from '@anthropic-ai\//);
    expect(codeOnly).not.toMatch(/from 'openai/);
    expect(codeOnly).not.toMatch(/from 'anthropic/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });
});
