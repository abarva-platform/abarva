import {
  buildAdminPanelInventory,
  buildAdminSurfaceCompletenessReport,
  AdminPanel,
} from '../../../lib/admin/admin-surface-completeness'

describe('buildAdminPanelInventory()', () => {
  let panels: AdminPanel[]

  beforeAll(() => {
    panels = buildAdminPanelInventory()
  })

  test('returns an array', () => {
    expect(Array.isArray(panels)).toBe(true)
  })

  test('returns at least 10 panels', () => {
    expect(panels.length).toBeGreaterThanOrEqual(10)
  })

  test('every panel has a non-empty panelId', () => {
    panels.forEach((p) => {
      expect(typeof p.panelId).toBe('string')
      expect(p.panelId.length).toBeGreaterThan(0)
    })
  })

  test('every panel has a non-empty label', () => {
    panels.forEach((p) => {
      expect(typeof p.label).toBe('string')
      expect(p.label.length).toBeGreaterThan(0)
    })
  })

  test('every panel has a non-empty sliceId', () => {
    panels.forEach((p) => {
      expect(typeof p.sliceId).toBe('string')
      expect(p.sliceId.length).toBeGreaterThan(0)
    })
  })

  test('every panel status is one of the allowed values', () => {
    const allowed = ['implemented', 'planned', 'deferred']
    panels.forEach((p) => {
      expect(allowed).toContain(p.status)
    })
  })

  test('componentPath is non-null for all implemented panels', () => {
    const implemented = panels.filter((p) => p.status === 'implemented')
    implemented.forEach((p) => {
      expect(p.componentPath).not.toBeNull()
      expect(typeof p.componentPath).toBe('string')
      expect((p.componentPath as string).length).toBeGreaterThan(0)
    })
  })

  test('componentPath is null for all planned panels', () => {
    const planned = panels.filter((p) => p.status === 'planned')
    planned.forEach((p) => {
      expect(p.componentPath).toBeNull()
    })
  })

  test('componentPath is null for all deferred panels', () => {
    const deferred = panels.filter((p) => p.status === 'deferred')
    deferred.forEach((p) => {
      expect(p.componentPath).toBeNull()
    })
  })

  test('at least 4 panels are implemented', () => {
    const implemented = panels.filter((p) => p.status === 'implemented')
    expect(implemented.length).toBeGreaterThanOrEqual(4)
  })

  test('at least 1 panel is planned', () => {
    const planned = panels.filter((p) => p.status === 'planned')
    expect(planned.length).toBeGreaterThanOrEqual(1)
  })

  test('at least 1 panel is deferred', () => {
    const deferred = panels.filter((p) => p.status === 'deferred')
    expect(deferred.length).toBeGreaterThanOrEqual(1)
  })

  test('Production Readiness Tracker panel is present with correct slice', () => {
    const panel = panels.find((p) => p.panelId === 'prod-readiness-tracker')
    expect(panel).toBeDefined()
    expect(panel!.sliceId).toBe('ADM3')
    expect(panel!.status).toBe('implemented')
    expect(panel!.componentPath).toBe('src/components/admin/ProductionReadinessTracker.tsx')
  })

  test('Deployment Status Card panel is present with correct slice', () => {
    const panel = panels.find((p) => p.panelId === 'deployment-status-card')
    expect(panel).toBeDefined()
    expect(panel!.sliceId).toBe('PROD5')
    expect(panel!.status).toBe('implemented')
    expect(panel!.componentPath).toBe('src/components/admin/DeploymentStatusCard.tsx')
  })

  test('Steward Setup Control Center panel is present with correct slice', () => {
    const panel = panels.find((p) => p.panelId === 'steward-setup-control-center')
    expect(panel).toBeDefined()
    expect(panel!.sliceId).toBe('ADM6')
    expect(panel!.status).toBe('implemented')
    expect(panel!.componentPath).toBe('src/components/admin/StewardSetupControlCenter.tsx')
  })

  test('Production Readiness Live Panel is present with correct slice', () => {
    const panel = panels.find((p) => p.panelId === 'prod-readiness-live-panel')
    expect(panel).toBeDefined()
    expect(panel!.sliceId).toBe('PROD3')
    expect(panel!.status).toBe('implemented')
    expect(panel!.componentPath).toBe('src/components/admin/ProductionReadinessLivePanel.tsx')
  })

  test('all panelIds are unique', () => {
    const ids = panels.map((p) => p.panelId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('every panel has a notes string', () => {
    panels.forEach((p) => {
      expect(typeof p.notes).toBe('string')
      expect(p.notes.length).toBeGreaterThan(0)
    })
  })

  test('implemented componentPaths start with src/', () => {
    const implemented = panels.filter((p) => p.status === 'implemented')
    implemented.forEach((p) => {
      expect(p.componentPath!.startsWith('src/')).toBe(true)
    })
  })

  test('is deterministic — two calls return identical panel count', () => {
    const first = buildAdminPanelInventory()
    const second = buildAdminPanelInventory()
    expect(first.length).toBe(second.length)
  })

  test('is deterministic — two calls return identical first panelId', () => {
    const first = buildAdminPanelInventory()
    const second = buildAdminPanelInventory()
    expect(first[0].panelId).toBe(second[0].panelId)
  })
})

describe('buildAdminSurfaceCompletenessReport()', () => {
  const report = buildAdminSurfaceCompletenessReport()

  test('returns an object', () => {
    expect(typeof report).toBe('object')
    expect(report).not.toBeNull()
  })

  test('panels array matches buildAdminPanelInventory() length', () => {
    const inventory = buildAdminPanelInventory()
    expect(report.panels.length).toBe(inventory.length)
  })

  test('implementedCount equals number of implemented panels', () => {
    const count = report.panels.filter((p) => p.status === 'implemented').length
    expect(report.implementedCount).toBe(count)
  })

  test('plannedCount equals number of planned panels', () => {
    const count = report.panels.filter((p) => p.status === 'planned').length
    expect(report.plannedCount).toBe(count)
  })

  test('deferredCount equals number of deferred panels', () => {
    const count = report.panels.filter((p) => p.status === 'deferred').length
    expect(report.deferredCount).toBe(count)
  })

  test('implementedCount + plannedCount + deferredCount === panels.length', () => {
    expect(report.implementedCount + report.plannedCount + report.deferredCount).toBe(
      report.panels.length
    )
  })

  test('completenessPercent equals implementedCount / panels.length * 100', () => {
    const expected = (report.implementedCount / report.panels.length) * 100
    expect(report.completenessPercent).toBe(expected)
  })

  test('completenessPercent is >= 0', () => {
    expect(report.completenessPercent).toBeGreaterThanOrEqual(0)
  })

  test('completenessPercent is <= 100', () => {
    expect(report.completenessPercent).toBeLessThanOrEqual(100)
  })

  test('nextPanelToBuild is null or a panel with status planned', () => {
    if (report.nextPanelToBuild !== null) {
      expect(report.nextPanelToBuild.status).toBe('planned')
    }
  })

  test('nextPanelToBuild is the first planned panel in the panels array', () => {
    const firstPlanned = report.panels.find((p) => p.status === 'planned') ?? null
    expect(report.nextPanelToBuild).toEqual(firstPlanned)
  })

  test('createdFrom is adm7_admin_surface_completeness', () => {
    expect(report.createdFrom).toBe('adm7_admin_surface_completeness')
  })

  test('generatedAt is a non-empty string', () => {
    expect(typeof report.generatedAt).toBe('string')
    expect(report.generatedAt.length).toBeGreaterThan(0)
  })

  test('generatedAt is a valid ISO date string', () => {
    const parsed = new Date(report.generatedAt)
    expect(isNaN(parsed.getTime())).toBe(false)
  })

  test('generatedAt contains a T separator (ISO 8601 datetime)', () => {
    expect(report.generatedAt).toContain('T')
  })

  test('report is not stale — implementedCount > 0', () => {
    expect(report.implementedCount).toBeGreaterThan(0)
  })

  test('nextPanelToBuild is non-null when plannedCount > 0', () => {
    if (report.plannedCount > 0) {
      expect(report.nextPanelToBuild).not.toBeNull()
    }
  })

  test('nextPanelToBuild panelId is non-empty when present', () => {
    if (report.nextPanelToBuild !== null) {
      expect(report.nextPanelToBuild.panelId.length).toBeGreaterThan(0)
    }
  })

  test('serialized report contains createdFrom value', () => {
    const serialized = JSON.stringify(report)
    expect(serialized).toContain('adm7_admin_surface_completeness')
  })
})
