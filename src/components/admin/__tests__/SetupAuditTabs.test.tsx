/**
 * SetupAuditTabs · Wave 2 PR-2 unit tests.
 *
 * Pins:
 *   - All three tabs render (Activity, Isolation, Approvals).
 *   - The active tab carries data-tab-active="true" and aria-current.
 *   - The Isolation tab's href is `/admin/audit?tab=isolation`.
 *   - `isSetupAuditTab` rejects unknown / nullish values, accepts the
 *     three canonical keys.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { SetupAuditTabs, isSetupAuditTab } from '../SetupAuditTabs';

describe('SetupAuditTabs', () => {
  it('renders three tabs with the canonical hrefs', () => {
    const html = renderToStaticMarkup(<SetupAuditTabs activeTab="activity" />);
    expect(html).toContain('href="/admin/audit"');
    expect(html).toContain('href="/admin/audit?tab=isolation"');
    expect(html).toContain('href="/admin/audit?tab=approvals"');
    expect(html).toContain('>Activity<');
    expect(html).toContain('>Isolation<');
    expect(html).toContain('>Approvals<');
  });

  it('marks the active tab with data-tab-active and aria-current', () => {
    const html = renderToStaticMarkup(<SetupAuditTabs activeTab="isolation" />);
    // The isolation tab should be active.
    expect(html).toMatch(/data-tab-key="isolation"[^>]*data-tab-active="true"/);
    // The activity tab should be inactive.
    expect(html).toMatch(/data-tab-key="activity"[^>]*data-tab-active="false"/);
    expect(html).toContain('aria-current="page"');
  });
});

describe('isSetupAuditTab', () => {
  it('accepts the three canonical tab keys', () => {
    expect(isSetupAuditTab('activity')).toBe(true);
    expect(isSetupAuditTab('isolation')).toBe(true);
    expect(isSetupAuditTab('approvals')).toBe(true);
  });

  it('rejects unknown / nullish values', () => {
    expect(isSetupAuditTab('substrate')).toBe(false);
    expect(isSetupAuditTab('')).toBe(false);
    expect(isSetupAuditTab(undefined)).toBe(false);
    expect(isSetupAuditTab(null)).toBe(false);
  });
});
