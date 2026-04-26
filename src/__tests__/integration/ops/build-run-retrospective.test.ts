// OPS9 — Build Run Retrospective integration tests.
//
// Deterministic, file-pure suite. No model providers, no shell, no
// spawning, no live cloud, no live CI / Vercel polling.

import {
  buildCurrentRunRetrospective,
  getWaveRetrospectives,
} from '../../../lib/ops/build-run-retrospective'

describe('buildCurrentRunRetrospective', () => {
  const retro = buildCurrentRunRetrospective()

  test('returns a non-null object', () => {
    expect(retro).not.toBeNull()
    expect(typeof retro).toBe('object')
  })

  test('totalWavesPlanned === 6', () => {
    expect(retro.totalWavesPlanned).toBe(6)
  })

  test('totalWavesCompleted equals count of waves with status completed', () => {
    const completedCount = retro.waves.filter((w) => w.status === 'completed').length
    expect(retro.totalWavesCompleted).toBe(completedCount)
  })

  test('all 6 waves have status completed', () => {
    expect(retro.totalWavesCompleted).toBe(6)
  })

  test('totalSlicesLanded > 0', () => {
    expect(retro.totalSlicesLanded).toBeGreaterThan(0)
  })

  test('totalSlicesLanded matches sum of slicesCompleted across waves', () => {
    const sum = retro.waves.reduce((acc, w) => acc + w.slicesCompleted.length, 0)
    expect(retro.totalSlicesLanded).toBe(sum)
  })

  test('totalTestsAdded > 0', () => {
    expect(retro.totalTestsAdded).toBeGreaterThan(0)
  })

  test('totalPrsMerged > 0', () => {
    expect(retro.totalPrsMerged).toBeGreaterThan(0)
  })

  test('waves.length === 6', () => {
    expect(retro.waves).toHaveLength(6)
  })

  test('each wave has a non-empty waveId', () => {
    for (const wave of retro.waves) {
      expect(typeof wave.waveId).toBe('string')
      expect(wave.waveId.length).toBeGreaterThan(0)
    }
  })

  test('each wave has a non-empty waveName', () => {
    for (const wave of retro.waves) {
      expect(typeof wave.waveName).toBe('string')
      expect(wave.waveName.length).toBeGreaterThan(0)
    }
  })

  test('each wave has a non-empty keyAccomplishment', () => {
    for (const wave of retro.waves) {
      expect(typeof wave.keyAccomplishment).toBe('string')
      expect(wave.keyAccomplishment.length).toBeGreaterThan(0)
    }
  })

  test('each wave has a non-empty mainDeferred', () => {
    for (const wave of retro.waves) {
      expect(typeof wave.mainDeferred).toBe('string')
      expect(wave.mainDeferred.length).toBeGreaterThan(0)
    }
  })

  test('each wave has a valid WaveStatus', () => {
    const validStatuses = new Set(['completed', 'partial', 'skipped', 'deferred'])
    for (const wave of retro.waves) {
      expect(validStatuses.has(wave.status)).toBe(true)
    }
  })

  test('topAccomplishments.length is between 3 and 5', () => {
    expect(retro.topAccomplishments.length).toBeGreaterThanOrEqual(3)
    expect(retro.topAccomplishments.length).toBeLessThanOrEqual(5)
  })

  test('keyDeferrals.length is between 3 and 5', () => {
    expect(retro.keyDeferrals.length).toBeGreaterThanOrEqual(3)
    expect(retro.keyDeferrals.length).toBeLessThanOrEqual(5)
  })

  test('nextRunPriorities.length is between 3 and 5', () => {
    expect(retro.nextRunPriorities.length).toBeGreaterThanOrEqual(3)
    expect(retro.nextRunPriorities.length).toBeLessThanOrEqual(5)
  })

  test('overallHealthScore is a number in [0, 1]', () => {
    expect(typeof retro.overallHealthScore).toBe('number')
    expect(retro.overallHealthScore).toBeGreaterThanOrEqual(0)
    expect(retro.overallHealthScore).toBeLessThanOrEqual(1)
  })

  test('createdFrom === ops9_build_run_retrospective', () => {
    expect(retro.createdFrom).toBe('ops9_build_run_retrospective')
  })

  test('runId is a non-empty string', () => {
    expect(typeof retro.runId).toBe('string')
    expect(retro.runId.length).toBeGreaterThan(0)
  })

  test('runDate is a non-empty string', () => {
    expect(typeof retro.runDate).toBe('string')
    expect(retro.runDate.length).toBeGreaterThan(0)
  })
})

describe('getWaveRetrospectives', () => {
  test('returns the same waves as buildCurrentRunRetrospective', () => {
    const retro = buildCurrentRunRetrospective()
    const waves = getWaveRetrospectives()
    expect(waves).toEqual(retro.waves)
  })

  test('returns an array of length 6', () => {
    expect(getWaveRetrospectives()).toHaveLength(6)
  })

  test('each wave prsmerged >= 1', () => {
    for (const wave of getWaveRetrospectives()) {
      expect(wave.prsmerged).toBeGreaterThanOrEqual(1)
    }
  })

  test('each wave testsAdded >= 0', () => {
    for (const wave of getWaveRetrospectives()) {
      expect(wave.testsAdded).toBeGreaterThanOrEqual(0)
    }
  })

  test('each wave slicesCompleted is an array', () => {
    for (const wave of getWaveRetrospectives()) {
      expect(Array.isArray(wave.slicesCompleted)).toBe(true)
    }
  })

  test('each wave slicesDeferred is an array', () => {
    for (const wave of getWaveRetrospectives()) {
      expect(Array.isArray(wave.slicesDeferred)).toBe(true)
    }
  })
})
