import {
  DEFENDER_SCAN_RESULT_TAG,
  DEFENDER_SCAN_TIME_TAG,
  buildDefenderStorageProtectionResult,
  evaluateDefenderStorageScanTags,
  hasDefenderScanMetadata,
} from '../defender-storage-scan-gate';

describe('Defender for Storage scan gate', () => {
  it('allows blobs only when Defender reports no threats found', () => {
    expect(evaluateDefenderStorageScanTags({
      [DEFENDER_SCAN_RESULT_TAG]: 'No threats found',
      [DEFENDER_SCAN_TIME_TAG]: '2026-06-03T13:35:00Z',
    })).toEqual({
      decision: 'allow',
      scanResult: 'no_threats_found',
      scanTimeUtc: '2026-06-03T13:35:00Z',
    });
  });

  it('retries when scan tags are missing or pending', () => {
    expect(evaluateDefenderStorageScanTags({})).toMatchObject({
      decision: 'retry',
      reason: 'defender_scan_result_missing',
    });
    expect(evaluateDefenderStorageScanTags({ [DEFENDER_SCAN_RESULT_TAG]: 'Pending' })).toMatchObject({
      decision: 'retry',
      reason: 'defender_scan_pending',
    });
  });

  it('quarantines malicious, error, not scanned, and unknown scan results', () => {
    for (const result of ['Malicious', 'Error', 'Not scanned', 'Unexpected']) {
      expect(evaluateDefenderStorageScanTags({ [DEFENDER_SCAN_RESULT_TAG]: result }).decision)
        .toBe('quarantine');
    }
  });

  it('builds a sensitive-upload compatible protection result for quarantine audit rows', () => {
    const gate = evaluateDefenderStorageScanTags({ [DEFENDER_SCAN_RESULT_TAG]: 'Malicious' });
    expect(gate.decision).toBe('quarantine');
    if (gate.decision !== 'quarantine') return;

    expect(buildDefenderStorageProtectionResult(gate)).toMatchObject({
      decision: 'quarantine',
      storageAllowed: false,
      indexingAllowed: false,
      evidenceExtractionAllowed: false,
      matchedRules: [{ ruleId: 'malware.defender_storage', severity: 'high' }],
    });
  });

  it('detects either Microsoft tag keys or normalized metadata aliases', () => {
    expect(hasDefenderScanMetadata({ [DEFENDER_SCAN_RESULT_TAG]: 'No threats found' })).toBe(true);
    expect(hasDefenderScanMetadata({ defenderScanResult: 'No threats found' })).toBe(true);
    expect(hasDefenderScanMetadata({ somethingElse: 'No threats found' })).toBe(false);
  });
});
