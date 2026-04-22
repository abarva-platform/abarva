import type { NexusTurnData } from '@/lib/intelligence/types'
import { deriveIntelligenceState } from '@/hooks/useIntelligenceState'

function makeTurn(overrides: Partial<NexusTurnData> = {}): NexusTurnData {
  return {
    id: overrides.id ?? `turn-${Math.random().toString(36).slice(2, 8)}`,
    threadId: overrides.threadId ?? 'thread-meridian',
    index: overrides.index ?? 0,
    role: overrides.role ?? 'nexus',
    mode: overrides.mode ?? 'research',
    format: overrides.format ?? 'one_sentence',
    confidence: overrides.confidence ?? 'medium',
    payload: overrides.payload ?? { hero: 'Turn', answer: 'Answer' },
    sources: overrides.sources ?? [],
    capabilitiesActive: overrides.capabilitiesActive ?? [],
    counterOfTurnId: overrides.counterOfTurnId ?? null,
    contradictionSelfCheck: overrides.contradictionSelfCheck ?? null,
    personaKey: overrides.personaKey ?? null,
    latencyMs: overrides.latencyMs ?? null,
    firstTokenMs: overrides.firstTokenMs ?? null,
    createdAt: overrides.createdAt ?? '2026-04-21T09:00:00.000Z',
  }
}

describe('deriveIntelligenceState', () => {
  test('returns State A with no nexus turns and no active stream', () => {
    expect(deriveIntelligenceState([])).toBe('A')
  })

  test('returns State B while the first Nexus answer is streaming', () => {
    expect(
      deriveIntelligenceState([makeTurn({ role: 'user', mode: null, format: null, confidence: null })], {
        isStreaming: true,
      }),
    ).toBe('B')
  })

  test('returns State B after the first Nexus turn lands', () => {
    expect(deriveIntelligenceState([makeTurn()])).toBe('B')
  })

  test('returns State C once the thread has reached three Nexus turns', () => {
    expect(
      deriveIntelligenceState([
        makeTurn({ id: 't1' }),
        makeTurn({ id: 't2', index: 1 }),
        makeTurn({ id: 't3', index: 2 }),
      ]),
    ).toBe('C')
  })

  test('forceState wins over derived turn count', () => {
    expect(
      deriveIntelligenceState([makeTurn({ id: 't1' }), makeTurn({ id: 't2', index: 1 })], {
        forceState: 'C',
      }),
    ).toBe('C')
  })
})
