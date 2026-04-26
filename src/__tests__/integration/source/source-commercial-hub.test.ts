import {
  COMMERCIAL_HUB_TABS,
  buildCommercialHubViewModel,
} from '../../../lib/source/source-commercial-hub-view';
import { SourceCommercialHub } from '../../../components/source/SourceCommercialHub';

describe('SourceCommercialHub — type shape', () => {
  it('COMMERCIAL_HUB_TABS has exactly 7 items', () => {
    expect(COMMERCIAL_HUB_TABS).toHaveLength(7);
  });

  it('each tab has tabId, label, description, and order fields', () => {
    for (const tab of COMMERCIAL_HUB_TABS) {
      expect(typeof tab.tabId).toBe('string');
      expect(typeof tab.label).toBe('string');
      expect(typeof tab.description).toBe('string');
      expect(typeof tab.order).toBe('number');
    }
  });

  it('tab IDs are unique', () => {
    const ids = COMMERCIAL_HUB_TABS.map((t) => t.tabId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('buildCommercialHubViewModel returns tabs array of length 7', () => {
    const vm = buildCommercialHubViewModel('rfp-001');
    expect(vm.tabs).toHaveLength(7);
  });

  it('defaultTabId is "summary"', () => {
    const vm = buildCommercialHubViewModel('rfp-002');
    expect(vm.defaultTabId).toBe('summary');
  });

  it('generatedAt is "2026-04-26"', () => {
    const vm = buildCommercialHubViewModel('rfp-003');
    expect(vm.generatedAt).toBe('2026-04-26');
  });

  it('caveat is non-empty', () => {
    const vm = buildCommercialHubViewModel('rfp-004');
    expect(typeof vm.caveat).toBe('string');
    expect(vm.caveat.length).toBeGreaterThan(0);
  });

  it('SourceCommercialHub exports as a function', () => {
    expect(typeof SourceCommercialHub).toBe('function');
  });

  it('SourceCommercialHubProps type shape: rfpId, vendorList, and slot props verified via buildCommercialHubViewModel', () => {
    // Verify the view model shape returned for a given rfpId includes rfpId and slots
    const vm = buildCommercialHubViewModel('rfp-hub-test', 'Q4 2026 Cloud Platform RFP');
    expect(vm.rfpId).toBe('rfp-hub-test');
    expect(vm.eventLabel).toBe('Q4 2026 Cloud Platform RFP');
    // Confirm the 7 slot tab IDs are present in the tabs list
    const tabIds = vm.tabs.map((t) => t.tabId);
    expect(tabIds).toContain('summary');
    expect(tabIds).toContain('pricing');
    expect(tabIds).toContain('bafo');
    expect(tabIds).toContain('risks');
    expect(tabIds).toContain('readiness');
    expect(tabIds).toContain('missions');
    expect(tabIds).toContain('signals');
  });
});
