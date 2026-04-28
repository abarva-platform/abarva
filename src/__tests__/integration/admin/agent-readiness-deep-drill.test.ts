import {
  buildAgentReadinessDeepDrill,
  type AgentReadinessDeepDrill,
  type AgentReadinessLevel,
} from '../../../lib/admin/agent-readiness-deep-drill'

const ALLOWED_LEVELS: AgentReadinessLevel[] = ['ready', 'partial', 'deferred', 'blocked']

describe('buildAgentReadinessDeepDrill()', () => {
  let drill: AgentReadinessDeepDrill

  beforeAll(() => {
    drill = buildAgentReadinessDeepDrill()
  })

  // ── Shape ──────────────────────────────────────────────────────────────

  test('returns an object', () => {
    expect(typeof drill).toBe('object')
    expect(drill).not.toBeNull()
  })

  test('agents is an array', () => {
    expect(Array.isArray(drill.agents)).toBe(true)
  })

  // ── Required agents present ────────────────────────────────────────────

  test('all 4 agents are present by agentId', () => {
    const ids = drill.agents.map((a) => a.agentId)
    expect(ids).toContain('nexus')
    expect(ids).toContain('sentinel')
    expect(ids).toContain('atlas')
    expect(ids).toContain('steward')
  })

  test('exactly 4 agents are returned', () => {
    expect(drill.agents.length).toBe(4)
  })

  // ── Per-agent shape ────────────────────────────────────────────────────

  test('each agent has a non-empty agentId', () => {
    drill.agents.forEach((a) => {
      expect(typeof a.agentId).toBe('string')
      expect(a.agentId.length).toBeGreaterThan(0)
    })
  })

  test('each agent has a non-empty agentName', () => {
    drill.agents.forEach((a) => {
      expect(typeof a.agentName).toBe('string')
      expect(a.agentName.length).toBeGreaterThan(0)
    })
  })

  test('each agent has a non-empty missionType', () => {
    drill.agents.forEach((a) => {
      expect(typeof a.missionType).toBe('string')
      expect(a.missionType.length).toBeGreaterThan(0)
    })
  })

  test('each agent has a valid readinessLevel', () => {
    drill.agents.forEach((a) => {
      expect(ALLOWED_LEVELS).toContain(a.readinessLevel)
    })
  })

  test('each agent has at least 1 factor', () => {
    drill.agents.forEach((a) => {
      expect(Array.isArray(a.factors)).toBe(true)
      expect(a.factors.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('each agent has a blockers array', () => {
    drill.agents.forEach((a) => {
      expect(Array.isArray(a.blockers)).toBe(true)
    })
  })

  test('each agent has a non-empty nextAction', () => {
    drill.agents.forEach((a) => {
      expect(typeof a.nextAction).toBe('string')
      expect(a.nextAction.length).toBeGreaterThan(0)
    })
  })

  // ── Per-factor shape ───────────────────────────────────────────────────

  test('every factor has a non-empty factor string', () => {
    drill.agents.forEach((a) => {
      a.factors.forEach((f) => {
        expect(typeof f.factor).toBe('string')
        expect(f.factor.length).toBeGreaterThan(0)
      })
    })
  })

  test('every factor has a valid status', () => {
    drill.agents.forEach((a) => {
      a.factors.forEach((f) => {
        expect(ALLOWED_LEVELS).toContain(f.status)
      })
    })
  })

  test('every factor has a non-empty note', () => {
    drill.agents.forEach((a) => {
      a.factors.forEach((f) => {
        expect(typeof f.note).toBe('string')
        expect(f.note.length).toBeGreaterThan(0)
      })
    })
  })

  // ── Top-level fields ───────────────────────────────────────────────────

  test('deterministicSourceCaption is exactly the canonical string', () => {
    expect(drill.deterministicSourceCaption).toBe(
      'Static manifest — not live agent execution'
    )
  })

  test('overallReadiness is one of the allowed levels', () => {
    expect(ALLOWED_LEVELS).toContain(drill.overallReadiness)
  })

  test('topBlockers is an array', () => {
    expect(Array.isArray(drill.topBlockers)).toBe(true)
  })

  test('generatedAt is exactly 2026-04-26', () => {
    expect(drill.generatedAt).toBe('2026-04-26')
  })

  test('missionQueueReadiness is a valid level', () => {
    expect(ALLOWED_LEVELS).toContain(drill.missionQueueReadiness)
  })

  test('contextReadiness is a valid level', () => {
    expect(ALLOWED_LEVELS).toContain(drill.contextReadiness)
  })

  test('evidenceReadiness is a valid level', () => {
    expect(ALLOWED_LEVELS).toContain(drill.evidenceReadiness)
  })

  test('modelGatewayReadiness is a valid level', () => {
    expect(ALLOWED_LEVELS).toContain(drill.modelGatewayReadiness)
  })

  test('toolRegistryReadiness is a valid level', () => {
    expect(ALLOWED_LEVELS).toContain(drill.toolRegistryReadiness)
  })

  test('nextAction is a non-empty string', () => {
    expect(typeof drill.nextAction).toBe('string')
    expect(drill.nextAction.length).toBeGreaterThan(0)
  })

  // ── Specific agent data ────────────────────────────────────────────────

  test('nexus agent has orchestration mission type', () => {
    const nexus = drill.agents.find((a) => a.agentId === 'nexus')
    expect(nexus).toBeDefined()
    expect(nexus!.missionType).toBe('orchestration')
  })

  test('sentinel agent has intelligence mission type', () => {
    const sentinel = drill.agents.find((a) => a.agentId === 'sentinel')
    expect(sentinel).toBeDefined()
    expect(sentinel!.missionType).toBe('intelligence')
  })

  test('atlas agent has cost-value mission type', () => {
    const atlas = drill.agents.find((a) => a.agentId === 'atlas')
    expect(atlas).toBeDefined()
    expect(atlas!.missionType).toBe('cost-value')
  })

  test('steward agent has governance mission type', () => {
    const steward = drill.agents.find((a) => a.agentId === 'steward')
    expect(steward).toBeDefined()
    expect(steward!.missionType).toBe('governance')
  })

  test('nexus blockers are non-empty', () => {
    const nexus = drill.agents.find((a) => a.agentId === 'nexus')!
    expect(nexus.blockers.length).toBeGreaterThan(0)
  })

  test('steward has a blocked factor (deployment_pipeline)', () => {
    const steward = drill.agents.find((a) => a.agentId === 'steward')!
    const blocked = steward.factors.find((f) => f.status === 'blocked')
    expect(blocked).toBeDefined()
  })

  test('sentinel has a deferred factor (confidence_scoring)', () => {
    const sentinel = drill.agents.find((a) => a.agentId === 'sentinel')!
    const deferred = sentinel.factors.find((f) => f.status === 'deferred')
    expect(deferred).toBeDefined()
  })

  // ── Determinism ────────────────────────────────────────────────────────

  test('is deterministic — two calls return same number of agents', () => {
    const a = buildAgentReadinessDeepDrill()
    const b = buildAgentReadinessDeepDrill()
    expect(a.agents.length).toBe(b.agents.length)
  })

  test('is deterministic — two calls return same generatedAt', () => {
    const a = buildAgentReadinessDeepDrill()
    const b = buildAgentReadinessDeepDrill()
    expect(a.generatedAt).toBe(b.generatedAt)
  })

  test('is deterministic — two calls return same overallReadiness', () => {
    const a = buildAgentReadinessDeepDrill()
    const b = buildAgentReadinessDeepDrill()
    expect(a.overallReadiness).toBe(b.overallReadiness)
  })

  // ── No runtime side effects ────────────────────────────────────────────

  test('function returns shape without throwing (no network calls)', () => {
    expect(() => buildAgentReadinessDeepDrill()).not.toThrow()
  })

  test('serialized output contains deterministicSourceCaption', () => {
    const serialized = JSON.stringify(drill)
    expect(serialized).toContain('Static manifest')
  })

  test('serialized output does not contain an affirmative live-execution claim', () => {
    // The deterministicSourceCaption says "not live agent execution" (a denial, which is correct).
    // We guard against affirmative claims like "is live agent execution" or "running live agents".
    const serialized = JSON.stringify(drill).toLowerCase()
    expect(serialized).not.toContain('running live agent')
    expect(serialized).not.toContain('live agent runtime is active')
  })
})
