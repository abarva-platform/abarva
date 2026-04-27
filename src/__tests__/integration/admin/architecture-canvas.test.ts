// ── ARCH5: Architecture Canvas type-shape + source-scan tests ────────────────
// No jsdom, no React rendering. Pure type/data + filesystem assertions.

import * as fs from 'fs'
import * as path from 'path'
import {
  buildArchitectureCanvasView,
  type ArchitectureCanvasViewModel,
  type ArchitecturePlaneId,
} from '../../../lib/admin/architecture-canvas-view'
import { ArchitectureCanvas } from '../../../components/admin/ArchitectureCanvas'

const repoRoot = path.resolve(__dirname, '../../../../')

describe('buildArchitectureCanvasView()', () => {
  let view: ArchitectureCanvasViewModel

  beforeAll(() => {
    view = buildArchitectureCanvasView()
  })

  it('returns 9 planes', () => {
    expect(view.planes).toHaveLength(9)
  })

  it('returns all 9 expected plane IDs', () => {
    const expectedIds: ArchitecturePlaneId[] = [
      'app-plane',
      'agent-plane',
      'context-plane',
      'knowledge-plane',
      'data-plane',
      'model-gateway-plane',
      'tool-plane',
      'governance-plane',
      'deployment-plane',
    ]
    const actualIds = view.planes.map((p) => p.id).sort()
    expect(actualIds).toEqual([...expectedIds].sort())
  })

  it('requestFlow.steps length === 4', () => {
    expect(view.requestFlow.steps).toHaveLength(4)
  })

  it('dataFlow.steps length === 3', () => {
    expect(view.dataFlow.steps).toHaveLength(3)
  })

  it('controlPlaneModel exposes saasControlPlane and privateDataPlane with non-empty names', () => {
    expect(view.controlPlaneModel.saasControlPlane.name.length).toBeGreaterThan(0)
    expect(view.controlPlaneModel.privateDataPlane.name.length).toBeGreaterThan(0)
  })

  it('azureReference.targetServices.length >= 4', () => {
    expect(view.azureReference.targetServices.length).toBeGreaterThanOrEqual(4)
  })

  it('modelGatewayBoundary gateway and toolRegistry both have non-empty names', () => {
    expect(view.modelGatewayBoundary.gateway.name.length).toBeGreaterThan(0)
    expect(view.modelGatewayBoundary.toolRegistry.name.length).toBeGreaterThan(0)
  })

  it('builtVsDeferred has at least 8 items', () => {
    expect(view.builtVsDeferred.length).toBeGreaterThanOrEqual(8)
  })

  it('nextActions has at least 4 items', () => {
    expect(view.nextActions.length).toBeGreaterThanOrEqual(4)
  })

  it('generatedAt === "2026-04-26"', () => {
    expect(view.generatedAt).toBe('2026-04-26')
  })

  it('caveat is a non-empty string', () => {
    expect(typeof view.caveat).toBe('string')
    expect(view.caveat.length).toBeGreaterThan(0)
  })
})

describe('ArchitectureCanvas component', () => {
  it('exports as a function', () => {
    expect(typeof ArchitectureCanvas).toBe('function')
  })

  it('source does not contain teal #14B8A6 and does not import "mermaid"', () => {
    const componentPath = path.join(repoRoot, 'src/components/admin/ArchitectureCanvas.tsx')
    const source = fs.readFileSync(componentPath, 'utf8')
    expect(source.toLowerCase()).not.toContain('#14b8a6')
    expect(source).not.toMatch(/from\s+['"]mermaid['"]/)
    expect(source).not.toMatch(/require\(['"]mermaid['"]\)/)
  })

  // ADMIN4 → ADMIN17: the /admin/architecture route was rewired to
  // AdminCanonShellV2 + EditorialCanvas + ArchitecturePlaneDrilldown
  // (ADMIN17 swapped ArchitecturePlaneStack for the drillable variant).
  // ArchitectureCanvas + ArchitecturePlaneStack remain on disk for other
  // consumers / future cleanup, but the page itself now imports the new
  // drilldown instead.
  it('architecture page imports a plane stack/drilldown component (new wiring)', () => {
    // ADMIN8 — admin tree consolidated; canonical Architecture page lives at /admin/architecture.
    const pagePath = path.join(repoRoot, 'src/app/(maestro)/admin/architecture/page.tsx')
    const source = fs.readFileSync(pagePath, 'utf8')
    // ADMIN17 — accept either the original stack or the new drilldown.
    const usesStack =
      source.includes('ArchitecturePlaneStack') &&
      /import\s*\{[^}]*ArchitecturePlaneStack[^}]*\}\s*from/.test(source)
    const usesDrilldown =
      source.includes('ArchitecturePlaneDrilldown') &&
      /import\s*\{[^}]*ArchitecturePlaneDrilldown[^}]*\}\s*from/.test(source)
    expect(usesStack || usesDrilldown).toBe(true)
  })
})
