// Type-shape integration tests for the Source Commercial Missions Panel.
// No React rendering, no jsdom — pure TypeScript contract verification.

import {
  buildCommercialMissionsViewModel,
  type SourceMissionDisplayItem,
  type SourceCommercialMissionsViewModel,
} from '../../../lib/source/source-commercial-missions-view';
import { SourceCommercialMissionsPanel } from '../../../components/source/SourceCommercialMissionsPanel';

const RFP_ID = 'rfp-test-001';
const VENDORS = ['vendor-alpha', 'vendor-beta', 'vendor-gamma'];

describe('SourceCommercialMissionsPanel — type-shape tests', () => {
  // 1. missions array length ≤ 5 (default)
  it('buildCommercialMissionsViewModel returns missions array with length ≤ 5 by default', () => {
    const vm: SourceCommercialMissionsViewModel = buildCommercialMissionsViewModel(
      RFP_ID,
      VENDORS,
    );
    expect(vm.missions.length).toBeLessThanOrEqual(5);
  });

  // 2. totalMissionCount ≥ missions.length
  it('totalMissionCount is >= missions.length', () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    expect(vm.totalMissionCount).toBeGreaterThanOrEqual(vm.missions.length);
  });

  // 3. hasMore is true when totalMissionCount > 5
  it('hasMore is true when totalMissionCount > 5', () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    if (vm.totalMissionCount > 5) {
      expect(vm.hasMore).toBe(true);
    } else {
      expect(vm.hasMore).toBe(false);
    }
  });

  // 4. highPriorityCount ≥ 0
  it('highPriorityCount is a non-negative integer', () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    expect(vm.highPriorityCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(vm.highPriorityCount)).toBe(true);
  });

  // 5. agentSummary is an object with string keys and number values
  it('agentSummary has string keys and number values', () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    expect(typeof vm.agentSummary).toBe('object');
    expect(vm.agentSummary).not.toBeNull();
    for (const [key, value] of Object.entries(vm.agentSummary)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });

  // 6. generatedAt === '2026-04-26'
  it("generatedAt equals '2026-04-26'", () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    expect(vm.generatedAt).toBe('2026-04-26');
  });

  // 7. caveat is non-empty
  it('caveat is a non-empty string', () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    expect(typeof vm.caveat).toBe('string');
    expect(vm.caveat.length).toBeGreaterThan(0);
  });

  // 8. Component exports SourceCommercialMissionsPanel as a function
  it('exports SourceCommercialMissionsPanel as a function', () => {
    expect(typeof SourceCommercialMissionsPanel).toBe('function');
  });

  // 9. Each mission item has missionId, agentOwner, label, priority fields
  it('each mission item has required fields with correct types', () => {
    const vm = buildCommercialMissionsViewModel(RFP_ID, VENDORS);
    // Ensure we have at least one mission to check
    expect(vm.missions.length).toBeGreaterThan(0);
    for (const item of vm.missions) {
      const m = item as SourceMissionDisplayItem;
      expect(typeof m.missionId).toBe('string');
      expect(m.missionId.length).toBeGreaterThan(0);
      expect(typeof m.agentOwner).toBe('string');
      expect(m.agentOwner.length).toBeGreaterThan(0);
      expect(typeof m.label).toBe('string');
      expect(m.label.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(m.priority);
    }
  });
});
