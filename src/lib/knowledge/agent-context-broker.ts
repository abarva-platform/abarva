import {
  getEnterpriseDataRoom,
  validateEnterpriseDataRoom,
  type EnterpriseApprovalState,
  type EnterpriseDataClassification,
  type EnterpriseDataRoomDomain,
  type EnterpriseDataRoomRecord,
  type EnterpriseEvidenceRecord,
} from '@/lib/knowledge/enterprise-data-room';

export type EnterpriseAgentName = 'Nexus' | 'Sentinel' | 'Atlas' | 'Steward';

export type EnterpriseContextSurface =
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'chat'
  | 'unknown';

export type EnterpriseContextItemKind =
  | 'tenant_summary'
  | 'person'
  | 'program'
  | 'artifact'
  | 'evidence'
  | 'system'
  | 'vendor_contract'
  | 'financial_metric'
  | 'graph_candidate'
  | 'policy_readiness';

export type EnterpriseContextSensitivity = 'summary' | 'structured' | 'l4_raw';

export interface EnterpriseAgentContextRequest {
  tenantKey: string;
  agentName: EnterpriseAgentName;
  surface: EnterpriseContextSurface;
  programId?: string;
  requestedDomains?: EnterpriseDataRoomDomain[];
  includeGraphNeighborhood?: boolean;
  allowL4RawContext?: boolean;
}

export interface EnterpriseEvidenceCitation {
  evidenceId: string;
  sourceArtifactId: string;
  citationLocator: string;
  confidence: EnterpriseEvidenceRecord['confidence'];
  approvalState: EnterpriseApprovalState;
}

export interface EnterpriseAgentContextItem {
  id: string;
  kind: EnterpriseContextItemKind;
  title: string;
  summary: string;
  tenantKey: string;
  sourceBasis: string;
  dataClassification: EnterpriseDataClassification;
  sensitivity: EnterpriseContextSensitivity;
  provenanceIds: string[];
  linkedEvidence: EnterpriseEvidenceCitation[];
}

export interface EnterpriseBlockedContextItem {
  id: string;
  tenantKey: string;
  reason:
    | 'unknown_tenant'
    | 'l4_raw_not_allowed'
    | 'domain_not_available'
    | 'canonicalization_pending';
  message: string;
  requestedDomain?: EnterpriseDataRoomDomain;
}

export interface EnterpriseGraphNeighborhoodSummary {
  tenantKey: string;
  included: boolean;
  nodeCount: number;
  edgeCount: number;
  topNodeTitles: string[];
  edgeTypes: string[];
  note: string;
}

export interface EnterpriseAgentContextBundle {
  tenantKey: string;
  agentName: EnterpriseAgentName;
  surface: EnterpriseContextSurface;
  generatedFrom: 'enterprise_agent_context_broker_v1';
  runtimeSafe: true;
  directStoreAccess: false;
  items: EnterpriseAgentContextItem[];
  blockedItems: EnterpriseBlockedContextItem[];
  citations: EnterpriseEvidenceCitation[];
  graphNeighborhood: EnterpriseGraphNeighborhoodSummary;
  warnings: string[];
}

const BROKER_VERSION = 'enterprise_agent_context_broker_v1';

export function buildEnterpriseAgentContextBundle(
  request: EnterpriseAgentContextRequest,
): EnterpriseAgentContextBundle {
  const room = getEnterpriseDataRoom(request.tenantKey);
  if (!room) {
    return buildUnknownTenantBundle(request);
  }

  const validation = validateEnterpriseDataRoom(room);
  const blockedItems = buildBlockedItems(request, room);
  const citations = room.evidence.slice(0, 12).map(toCitation);
  const items = selectContextItems(room, request, citations);

  return {
    tenantKey: request.tenantKey,
    agentName: request.agentName,
    surface: request.surface,
    generatedFrom: BROKER_VERSION,
    runtimeSafe: true,
    directStoreAccess: false,
    items,
    blockedItems,
    citations,
    graphNeighborhood: buildGraphNeighborhood(room, Boolean(request.includeGraphNeighborhood)),
    warnings: [
      'Context broker is contract-only; it does not query persistent stores, generate embeddings, or mutate runtime routes.',
      validation.isRichTenantReady
        ? 'Tenant meets current rich-readiness thresholds for synthetic demo context.'
        : 'Tenant does not meet rich-readiness thresholds; use partial context with explicit provenance.',
    ],
  };
}

function buildUnknownTenantBundle(request: EnterpriseAgentContextRequest): EnterpriseAgentContextBundle {
  return {
    tenantKey: request.tenantKey,
    agentName: request.agentName,
    surface: request.surface,
    generatedFrom: BROKER_VERSION,
    runtimeSafe: true,
    directStoreAccess: false,
    items: [],
    blockedItems: [
      {
        id: `blocked:${request.tenantKey}:unknown-tenant`,
        tenantKey: request.tenantKey,
        reason: 'unknown_tenant',
        message: 'No Enterprise Data Room exists for this tenant key; broker returned no fabricated context.',
      },
    ],
    citations: [],
    graphNeighborhood: {
      tenantKey: request.tenantKey,
      included: false,
      nodeCount: 0,
      edgeCount: 0,
      topNodeTitles: [],
      edgeTypes: [],
      note: 'Graph neighborhood withheld because the tenant data room was not found.',
    },
    warnings: ['Unknown tenant context request produced a blocked bundle instead of synthetic filler.'],
  };
}

function buildBlockedItems(
  request: EnterpriseAgentContextRequest,
  room: EnterpriseDataRoomRecord,
): EnterpriseBlockedContextItem[] {
  const blocked: EnterpriseBlockedContextItem[] = [];
  if (!request.allowL4RawContext) {
    blocked.push({
      id: `blocked:${room.tenantKey}:l4-raw`,
      tenantKey: room.tenantKey,
      reason: 'l4_raw_not_allowed',
      message: 'Raw L4 client/private context is blocked unless the caller explicitly requests and is authorized for raw context.',
    });
  }

  for (const domain of request.requestedDomains ?? []) {
    if (domain === 'operating_telemetry') {
      blocked.push({
        id: `blocked:${room.tenantKey}:${domain}`,
        tenantKey: room.tenantKey,
        reason: 'domain_not_available',
        requestedDomain: domain,
        message: 'Operating telemetry is not loaded into the source-code seeded Enterprise Data Room yet.',
      });
    }
  }

  return blocked;
}

function selectContextItems(
  room: EnterpriseDataRoomRecord,
  request: EnterpriseAgentContextRequest,
  citations: EnterpriseEvidenceCitation[],
): EnterpriseAgentContextItem[] {
  const items: EnterpriseAgentContextItem[] = [buildTenantSummaryItem(room, citations)];

  if (request.agentName === 'Nexus') {
    // PR-R · founder feedback #1 — "Nexus doesn't have context of
    // existing org structure ... who is who in IT". Expose the
    // executive bench (people domain) so Nexus can resolve role
    // titles ("CIO", "VP of Applications") into actual named people
    // when discussing sponsorship, lead candidates, or escalation
    // paths on the /programs surfaces. Slice 8 keeps the prompt
    // bounded; the seeded executive bench is sized so the top 8
    // already covers C-suite + IT/Apps leadership for Apex.
    items.push(...room.people.slice(0, 8).map((person) => ({
      id: `ctx:${person.id}`,
      kind: 'person' as const,
      title: `${person.name} — ${person.role}`,
      summary: [
        `Org unit: ${person.orgUnit}`,
        person.reportsToRole ? `Reports to: ${person.reportsToRole}` : null,
        person.decisionRights.length > 0
          ? `Decision rights: ${person.decisionRights.slice(0, 3).join('; ')}`
          : null,
        person.priorities.length > 0
          ? `Priorities: ${person.priorities.slice(0, 3).join('; ')}`
          : null,
      ]
        .filter(Boolean)
        .join('. '),
      tenantKey: room.tenantKey,
      sourceBasis: person.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'structured' as const,
      provenanceIds: [person.id, ...person.sponsorsPrograms, ...person.ownsSystems],
      linkedEvidence: [],
    })));
    items.push(...room.programs.slice(0, 6).map((program) => ({
      id: `ctx:${program.id}`,
      kind: 'program' as const,
      title: program.name,
      summary: `${program.lifecycleState}; sponsor ${program.executiveSponsor}; timeline ${program.timeline}`,
      tenantKey: room.tenantKey,
      sourceBasis: program.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'structured' as const,
      provenanceIds: [program.id, ...program.linkedSystemIds, ...program.linkedVendorIds],
      linkedEvidence: citationsForIds(citations, program.linkedEvidenceIds),
    })));
    items.push(...room.artifacts.slice(0, 5).map((artifact) => ({
      id: `ctx:${artifact.id}`,
      kind: 'artifact' as const,
      title: artifact.title,
      summary: `${artifact.artifactType} in ${artifact.lifecyclePhase}; approval ${artifact.approvalState}`,
      tenantKey: room.tenantKey,
      sourceBasis: artifact.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'structured' as const,
      provenanceIds: [artifact.id, ...artifact.linkedProgramIds],
      linkedEvidence: citationsForIds(citations, artifact.linkedEvidenceIds),
    })));
  }

  if (request.agentName === 'Sentinel') {
    items.push(...room.evidence.slice(0, 8).map((evidence) => ({
      id: `ctx:${evidence.id}`,
      kind: 'evidence' as const,
      title: evidence.citationLocator,
      summary: `${evidence.claimText} (${evidence.usabilityState}; confidence ${evidence.confidence})`,
      tenantKey: room.tenantKey,
      sourceBasis: evidence.sourceBasis,
      dataClassification: evidence.dataClassification,
      sensitivity: 'structured' as const,
      provenanceIds: [evidence.id, evidence.sourceArtifactId, ...evidence.linkedArtifactIds],
      linkedEvidence: [toCitation(evidence)],
    })));
    items.push(...room.graph.nodes.slice(0, 6).map((node) => ({
      id: `ctx:${node.id}`,
      kind: 'graph_candidate' as const,
      title: node.title,
      summary: `${node.nodeType} graph candidate with stable key ${node.stableKey}`,
      tenantKey: room.tenantKey,
      sourceBasis: node.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'structured' as const,
      provenanceIds: [node.id],
      linkedEvidence: [],
    })));
  }

  if (request.agentName === 'Atlas') {
    items.push(...room.financials.slice(0, 6).map((metric) => ({
      id: `ctx:${metric.id}`,
      kind: 'financial_metric' as const,
      title: metric.metric,
      summary: `${metric.value} ${metric.unit}; category ${metric.category}`,
      tenantKey: room.tenantKey,
      sourceBasis: metric.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'summary' as const,
      provenanceIds: [metric.id],
      linkedEvidence: citationsForIds(citations, metric.evidenceIds),
    })));
    items.push(...room.systems.slice(0, 4).map((system) => ({
      id: `ctx:${system.id}`,
      kind: 'system' as const,
      title: system.name,
      summary: `${system.vendor}; ${system.category}; criticality ${system.criticality}; lifecycle ${system.lifecycleState}`,
      tenantKey: room.tenantKey,
      sourceBasis: system.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'summary' as const,
      provenanceIds: [system.id],
      linkedEvidence: [],
    })));
  }

  if (request.agentName === 'Steward') {
    items.push({
      id: `ctx:${room.tenantKey}:policy-readiness`,
      kind: 'policy_readiness',
      title: 'Enterprise Data Room policy readiness',
      summary: `Residency ${room.profile.residencyMode}; data policy ${room.profile.dataClassificationPolicyId}; vector indexes require tenant key: ${room.vectorReadiness.every((index) => index.tenantKeyRequired)}`,
      tenantKey: room.tenantKey,
      sourceBasis: room.profile.sourceBasis,
      dataClassification: room.profile.dataClassification,
      sensitivity: 'summary',
      provenanceIds: [room.profile.tenantKey],
      linkedEvidence: [],
    });
    items.push(...room.vendorContracts.slice(0, 4).map((contract) => ({
      id: `ctx:${contract.id}`,
      kind: 'vendor_contract' as const,
      title: `${contract.vendorName} - ${contract.product}`,
      summary: `${contract.category}; risk ${contract.riskLevel}; ${contract.keyRisk}`,
      tenantKey: room.tenantKey,
      sourceBasis: contract.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'structured' as const,
      provenanceIds: [contract.id],
      linkedEvidence: [],
    })));
  }

  return items;
}

function buildTenantSummaryItem(
  room: EnterpriseDataRoomRecord,
  citations: EnterpriseEvidenceCitation[],
): EnterpriseAgentContextItem {
  return {
    id: `ctx:${room.tenantKey}:tenant-summary`,
    kind: 'tenant_summary',
    title: room.profile.displayName,
    summary: `${room.profile.industry} / ${room.profile.subIndustry}; ${room.profile.employeeCount} employees; ${room.profile.strategicPriorities.slice(0, 3).join('; ')}`,
    tenantKey: room.tenantKey,
    sourceBasis: room.profile.sourceBasis,
    dataClassification: room.profile.dataClassification,
    sensitivity: 'summary',
    provenanceIds: [room.profile.tenantKey],
    linkedEvidence: citations.slice(0, 3),
  };
}

function buildGraphNeighborhood(
  room: EnterpriseDataRoomRecord,
  included: boolean,
): EnterpriseGraphNeighborhoodSummary {
  if (!included) {
    return {
      tenantKey: room.tenantKey,
      included: false,
      nodeCount: 0,
      edgeCount: 0,
      topNodeTitles: [],
      edgeTypes: [],
      note: 'Graph neighborhood was available but not requested for this broker call.',
    };
  }

  return {
    tenantKey: room.tenantKey,
    included: true,
    nodeCount: room.graph.nodes.length,
    edgeCount: room.graph.edges.length,
    topNodeTitles: room.graph.nodes.slice(0, 8).map((node) => node.title),
    edgeTypes: Array.from(new Set(room.graph.edges.map((edge) => edge.edgeType))).sort(),
    note: 'Graph summary is metadata-only; raw private node payloads are not exposed by this broker contract.',
  };
}

function toCitation(evidence: EnterpriseEvidenceRecord): EnterpriseEvidenceCitation {
  return {
    evidenceId: evidence.id,
    sourceArtifactId: evidence.sourceArtifactId,
    citationLocator: evidence.citationLocator,
    confidence: evidence.confidence,
    approvalState: evidence.approvalState,
  };
}

function citationsForIds(
  citations: EnterpriseEvidenceCitation[],
  ids: string[],
): EnterpriseEvidenceCitation[] {
  if (ids.length === 0) {
    return [];
  }
  const idSet = new Set(ids);
  return citations.filter((citation) => idSet.has(citation.evidenceId));
}
