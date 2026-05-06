import { readFileSync } from 'node:fs';

describe('Tower broadsheet design', () => {
  it('renders the broadsheet layout with confidence underlines, pressure type colors, atlas column, and lens tabs', () => {
    const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');
    const componentSource = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');

    // page.tsx must use the new simplified TowerIndexPage interface
    expect(pageSource).toContain('TowerIndexPage');
    expect(pageSource).toContain('tenantName');
    expect(pageSource).toContain('getActiveClientRow');
    // no old slot props
    expect(pageSource).not.toContain('towerSubmenuSlot');
    expect(pageSource).not.toContain('towerHandoffSlot');
    expect(pageSource).not.toContain('towerLensSlot');

    // Broadsheet 70/30 layout shell
    expect(componentSource).toContain("data-testid=\"tower-main-lens-canvas\"");
    // Lens tabs nav
    expect(componentSource).toContain("data-testid=\"tower-main-submenu\"");
    expect(componentSource).toContain("LENS_TABS");
    expect(componentSource).toContain("Contract");

    // Confidence underline system — THE Tower differentiator
    expect(componentSource).toContain('confStyle');
    expect(componentSource).toContain('borderBottom');
    expect(componentSource).toContain('dashed');
    expect(componentSource).toContain('dotted');

    // Pressure type color system
    expect(componentSource).toContain('pressureTypeColor');
    expect(componentSource).toContain('P_COST');
    expect(componentSource).toContain('P_ADOPT');

    // Broadsheet fixture constants wired
    expect(componentSource).toContain('BROADSHEET_KPIS');
    expect(componentSource).toContain('BROADSHEET_PRESSURES');
    expect(componentSource).toContain('BROADSHEET_ATLAS');

    // Atlas right column present and sticky
    expect(componentSource).toContain('AtlasColumn');
    expect(componentSource).toContain("position: 'sticky'");

    // Canon cream palette
    expect(componentSource).toContain("PAGE_BG: '#f5f1eb'");

    // Client component (required for useState in lens tabs + atlas input)
    expect(componentSource).toContain("'use client'");

    // Default tenant name
    expect(componentSource).toContain("tenantName = 'Meridian Enterprises'");
    expect(componentSource).not.toContain("tenantName: 'Apex Retail Group'");
  });
});
