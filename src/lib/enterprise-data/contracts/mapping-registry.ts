import type { CanonicalDomain } from './canonical-ingestion';
import type { TenantPacketSourceClass } from './tenant-packet';

export type MappingTransform =
  | 'identity'
  | 'trim'
  | 'normalize_code'
  | 'parse_number'
  | 'parse_currency'
  | 'parse_percent'
  | 'parse_date'
  | 'split_list'
  | 'json';

export interface MappingRule {
  mappingRuleId: string;
  mappingProfile: string;
  sourceClass: TenantPacketSourceClass;
  sourceField: string;
  sourceAliases?: string[];
  targetDomain: CanonicalDomain;
  targetObjectType: string;
  targetAttribute?: string;
  targetRelationshipType?: string;
  transform: MappingTransform;
  required: boolean;
  confidenceDefault?: number;
  validFrom: string;
  deprecatedAt?: string;
}

export interface MappingProfile {
  mappingProfile: string;
  version: string;
  sourceClass: TenantPacketSourceClass;
  rules: MappingRule[];
}

export interface MappingCoverageReport {
  mappingProfile: string;
  sourceClass: TenantPacketSourceClass;
  mappedFieldCount: number;
  unmappedFieldCount: number;
  requiredFieldCount: number;
  missingRequiredFieldCount: number;
  coveragePercent: number;
}
