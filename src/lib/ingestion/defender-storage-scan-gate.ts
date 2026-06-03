import type { UploadProtectionResult } from '@/lib/security/sensitive-upload-guard';

export const DEFENDER_SCAN_RESULT_TAG = 'Malware Scanning scan result';
export const DEFENDER_SCAN_TIME_TAG = 'Malware Scanning scan time UTC';

export type DefenderStorageScanGateResult =
  | {
      readonly decision: 'allow';
      readonly scanResult: 'no_threats_found';
      readonly scanTimeUtc?: string;
    }
  | {
      readonly decision: 'quarantine';
      readonly scanResult: 'malicious' | 'error' | 'not_scanned' | 'unknown';
      readonly reasonCode: string;
      readonly message: string;
      readonly scanTimeUtc?: string;
    }
  | {
      readonly decision: 'retry';
      readonly scanResult: 'missing' | 'pending';
      readonly reason: string;
    };

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeScanResult(raw: string | undefined): string | undefined {
  return raw?.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
}

export function hasDefenderScanMetadata(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) return false;
  return Boolean(
    metadata[DEFENDER_SCAN_RESULT_TAG]
      ?? metadata.defenderScanResult
      ?? metadata.malwareScanResult
      ?? metadata.requireDefenderScan,
  );
}

export function evaluateDefenderStorageScanTags(
  tags: Record<string, unknown> | undefined,
): DefenderStorageScanGateResult {
  const rawResult = firstString(
    tags?.[DEFENDER_SCAN_RESULT_TAG],
    tags?.defenderScanResult,
    tags?.malwareScanResult,
  );
  const scanTimeUtc = firstString(tags?.[DEFENDER_SCAN_TIME_TAG], tags?.defenderScanTimeUtc);
  const normalized = normalizeScanResult(rawResult);

  if (!normalized) {
    return {
      decision: 'retry',
      scanResult: 'missing',
      reason: 'defender_scan_result_missing',
    };
  }

  if (normalized === 'no threats found' || normalized === 'no threat found' || normalized === 'clean') {
    return { decision: 'allow', scanResult: 'no_threats_found', scanTimeUtc };
  }

  if (normalized === 'malicious' || normalized.includes('malware')) {
    return {
      decision: 'quarantine',
      scanResult: 'malicious',
      reasonCode: 'malware.defender_storage',
      message: 'Upload quarantined because Microsoft Defender for Storage reported a malicious blob.',
      scanTimeUtc,
    };
  }

  if (normalized === 'not scanned') {
    return {
      decision: 'quarantine',
      scanResult: 'not_scanned',
      reasonCode: 'malware.defender_storage.not_scanned',
      message: 'Upload quarantined because Microsoft Defender for Storage reported the blob was not scanned.',
      scanTimeUtc,
    };
  }

  if (normalized === 'error' || normalized.includes('scan aborted')) {
    return {
      decision: 'quarantine',
      scanResult: 'error',
      reasonCode: 'malware.defender_storage.error',
      message: 'Upload quarantined because Microsoft Defender for Storage returned a scan error.',
      scanTimeUtc,
    };
  }

  if (normalized === 'pending' || normalized === 'in progress') {
    return {
      decision: 'retry',
      scanResult: 'pending',
      reason: 'defender_scan_pending',
    };
  }

  return {
    decision: 'quarantine',
    scanResult: 'unknown',
    reasonCode: 'malware.defender_storage.unknown_result',
    message: `Upload quarantined because Microsoft Defender for Storage returned an unknown scan result: ${rawResult}.`,
    scanTimeUtc,
  };
}

export function buildDefenderStorageProtectionResult(
  gate: Extract<DefenderStorageScanGateResult, { decision: 'quarantine' }>,
): UploadProtectionResult {
  return {
    declaredClassification: 'confidential_business',
    decision: 'quarantine',
    storageAllowed: false,
    indexingAllowed: false,
    evidenceExtractionAllowed: false,
    suspectedPhi: false,
    suspectedPii: false,
    suspectedFinancialIdentifiers: false,
    matchedRules: [
      {
        ruleId: gate.reasonCode,
        label: 'Microsoft Defender for Storage malware scan',
        severity: 'high',
        count: 1,
      },
    ],
    message: gate.message,
  };
}
