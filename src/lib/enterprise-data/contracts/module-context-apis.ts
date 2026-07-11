export interface TenantContextRequest {
  tenantKey: string;
  tenantDataVersion?: string;
  actorKey?: string;
}

export interface EvidenceBoundary {
  evidenceKeys: string[];
  excludedEvidenceKeys: string[];
  staleEvidenceKeys: string[];
  unsupportedClaimRisk: 'low' | 'medium' | 'high';
}

export interface ModuleContextPacket {
  tenantKey: string;
  tenantDataVersion: string;
  generatedAt: string;
  evidenceBoundary: EvidenceBoundary;
  facts: unknown[];
  relationships: unknown[];
  derivedInsights: unknown[];
  moduleMemory: unknown[];
}

export interface MoveContextRequest extends TenantContextRequest {
  moveId: string;
  phase?: string;
}

export interface SourceContextRequest extends TenantContextRequest {
  sourceEventId: string;
  stage?: string;
}

export interface TowerContextRequest extends TenantContextRequest {
  scopeKey?: string;
}

export interface ClaimValidationRequest extends TenantContextRequest {
  claim: string;
  evidenceKeys: string[];
}

export interface ClaimValidationResult {
  status: 'supported' | 'unsupported' | 'assumption_required' | 'blocked';
  supportingEvidenceKeys: string[];
  blockedReason?: string;
}

export interface ModuleContextApis {
  getHomeContext(request: TenantContextRequest): Promise<ModuleContextPacket>;
  getIntelligenceContext(request: TenantContextRequest & { question?: string }): Promise<ModuleContextPacket>;
  getMoveContext(request: MoveContextRequest): Promise<ModuleContextPacket>;
  getSourceContext(request: SourceContextRequest): Promise<ModuleContextPacket>;
  getTowerContext(request: TowerContextRequest): Promise<ModuleContextPacket>;
  validateClaimAgainstSources(request: ClaimValidationRequest): Promise<ClaimValidationResult>;
}
