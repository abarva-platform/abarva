// ── ARCH4: Architecture Overview type-shape tests ────────────────────────────
// No React rendering, no jsdom. Pure type and data-shape assertions.

import {
  buildArchitectureOverview,
  type ArchitectureLayer,
  type ArchitectureWaveSummary,
  type ArchitectureOverviewData,
} from '@/lib/admin/architecture-overview'

// Verify the component file exports a function without importing React/jsdom
import ArchitectureOverviewPage from '@/components/admin/ArchitectureOverviewPage'

describe('buildArchitectureOverview()', () => {
  let data: ArchitectureOverviewData

  beforeAll(() => {
    data = buildArchitectureOverview()
  })

  it('returns systemName === "Nexus"', () => {
    expect(data.systemName).toBe('Nexus')
  })

  it('layers has exactly 6 items', () => {
    expect(data.layers).toHaveLength(6)
  })

  it('each layer has layerId, name, description, keyModules, waveRange', () => {
    data.layers.forEach((layer: ArchitectureLayer) => {
      expect(typeof layer.layerId).toBe('string')
      expect(layer.layerId.length).toBeGreaterThan(0)
      expect(typeof layer.name).toBe('string')
      expect(layer.name.length).toBeGreaterThan(0)
      expect(typeof layer.description).toBe('string')
      expect(layer.description.length).toBeGreaterThan(0)
      expect(Array.isArray(layer.keyModules)).toBe(true)
      expect(layer.keyModules.length).toBeGreaterThan(0)
      expect(typeof layer.waveRange).toBe('string')
      expect(layer.waveRange.length).toBeGreaterThan(0)
    })
  })

  it('waveSummaries has at least 15 items (wave-0 through wave-14)', () => {
    expect(data.waveSummaries.length).toBeGreaterThanOrEqual(15)
  })

  it('totalWaves > 0', () => {
    expect(data.totalWaves).toBeGreaterThan(0)
  })

  it('generatedAt === "2026-04-26"', () => {
    expect(data.generatedAt).toBe('2026-04-26')
  })

  it('caveat is a non-empty string', () => {
    expect(typeof data.caveat).toBe('string')
    expect(data.caveat.length).toBeGreaterThan(0)
  })

  it('each wave summary has waveId, title, status, percentComplete', () => {
    data.waveSummaries.forEach((wave: ArchitectureWaveSummary) => {
      expect(typeof wave.waveId).toBe('string')
      expect(wave.waveId.length).toBeGreaterThan(0)
      expect(typeof wave.title).toBe('string')
      expect(wave.title.length).toBeGreaterThan(0)
      expect(typeof wave.status).toBe('string')
      expect(wave.status.length).toBeGreaterThan(0)
      expect(typeof wave.percentComplete).toBe('number')
      expect(wave.percentComplete).toBeGreaterThanOrEqual(0)
      expect(wave.percentComplete).toBeLessThanOrEqual(100)
    })
  })

  it('ArchitectureOverviewPage component exports as a function', () => {
    expect(typeof ArchitectureOverviewPage).toBe('function')
  })
})
