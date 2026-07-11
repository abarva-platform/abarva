import type { CanonicalIngestionRecord } from './canonical-ingestion';

export interface SourceAdapterInput {
  tenantKey: string;
  packetVersion: string;
  sourcePath: string;
  sourceProfile: string;
  parserVersion: string;
  mappingProfile: string;
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
  quarantinedRecordCount: number;
  contentFingerprint: string;
}

export interface SourceAdapter {
  adapterKey: string;
  adapterVersion: string;
  acceptedSourceShapes: string[];
  parse(input: SourceAdapterInput): Promise<SourceAdapterResult>;
}
