import type { CanonicalIngestionRecord } from './canonical-ingestion';
import type { TenantPacketFile } from './tenant-packet';

export interface SourceAdapterInput {
  tenantKey: string;
  packetId: string;
  packetVersion: string;
  sourcePath: string;
  packetFile: TenantPacketFile;
  sourceProfile: string;
  parserVersion: string;
  mappingProfile: string;
  observedAt?: string;
}

export interface SourceAdapterFinding {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  sourceField?: string;
  sourceObjectId?: string;
}

export interface SourceAdapterResult {
  records: CanonicalIngestionRecord[];
  findings: SourceAdapterFinding[];
  unmappedFields: string[];
  sourceFieldCount: number;
  mappedFieldCount: number;
  requiredFieldCount: number;
  missingRequiredFieldCount: number;
  quarantinedRecordCount: number;
  contentFingerprint: string;
  mappingCoveragePercent: number;
}

export interface SourceAdapter {
  adapterKey: string;
  adapterVersion: string;
  acceptedSourceShapes: string[];
  acceptedSourceClasses: string[];
  parse(input: SourceAdapterInput): Promise<SourceAdapterResult>;
}
