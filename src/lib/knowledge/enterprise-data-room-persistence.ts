import type {
  EnterpriseArtifactRecord,
  EnterpriseDataRoomRecord,
  EnterpriseEvidenceRecord,
  EnterpriseFinancialRecord,
  EnterpriseGraphEdgeRecord,
  EnterpriseGraphNodeRecord,
  EnterprisePersonRecord,
  EnterpriseProgramRecord,
  EnterpriseSourcingEventRecord,
  EnterpriseSystemRecord,
  EnterpriseVendorContractRecord,
  EnterpriseVectorReadinessRecord,
} from '@/lib/knowledge/enterprise-data-room';

export const ENTERPRISE_DATA_ROOM_PERSISTENCE_MAPPER_VERSION = 'enterprise-data-room-persistence-mapper-v1';
export const ENTERPRISE_DATA_ROOM_PLACEHOLDER_CLIENT_ID_PREFIX = 'unresolved-client';

export type EnterpriseDataRoomPersistenceTable =
  | 'enterprise_data_rooms'
  | 'entities'
  | 'artifacts'
  | 'evidence'
  | 'chunks'
  | 'graph_nodes'
  | 'graph_edges';

export type EnterpriseDataRoomPersistenceRowStatus = 'ready' | 'blocked';

export interface EnterpriseDataRoomPersistenceMapperOptions {
  clientId?: string | null;
  generatedAt?: string;
}

export interface EnterpriseDataRoomPersistenceRowBase {
  id: string;
  tenantKey: string;
  clientId: string;
  rowStatus: EnterpriseDataRoomPersistenceRowStatus;
  blockedReason: string | null;
  sourceRecordId: string;
  sourceBasis: string;
  mapperVersion: typeof ENTERPRISE_DATA_ROOM_PERSISTENCE_MAPPER_VERSION;
}

export interface EnterpriseDataRoomPersistenceContext {
  tenantKey: string;
  clientId: string;
  clientIdResolved: boolean;
  placeholderClientId: boolean;
  rowStatus: EnterpriseDataRoomPersistenceRowStatus;
  blockedReason: string | null;
  generatedAt: string;
  mapperVersion: typeof ENTERPRISE_DATA_ROOM_PERSISTENCE_MAPPER_VERSION;
}

export interface EnterpriseDataRoomPersistenceBlockedRow {
  table: EnterpriseDataRoomPersistenceTable;
  rowId: string;
  tenantKey: string;
  clientId: string;
  blockedReason: string;
}

export interface EnterpriseDataRoomTableRow extends EnterpriseDataRoomPersistenceRowBase {
  generatedFrom: EnterpriseDataRoomRecord['generatedFrom'];
  legalName: string;
  displayName: string;
  industry: string;
  subIndustry: string;
  headquarters: string;
  regions: string[];
  employeeCount: number;
  revenueUsdBillions: number;
  strategicPriorities: string[];
  regulatoryPosture: string[];
  dataClassificationPolicyId: string;
  residencyMode: string;
  dataClassification: string;
  generatedAt: string;
}

export type EnterpriseEntityKind =
  | 'enterprise_profile'
  | 'person'
  | 'system'
  | 'vendor_contract'
  | 'financial_metric'
  | 'program'
  | 'sourcing_event';

export interface EnterpriseDataRoomEntityRow extends EnterpriseDataRoomPersistenceRowBase {
  entityKind: EnterpriseEntityKind;
  stableKey: string;
  label: string;
  attributes: Record<string, unknown>;
}

export interface EnterpriseDataRoomArtifactRow extends EnterpriseDataRoomPersistenceRowBase {
  title: string;
  artifactType: EnterpriseArtifactRecord['artifactType'];
  lifecyclePhase: string;
  sourcePath: string | null;
  approvalState: EnterpriseArtifactRecord['approvalState'];
  linkedEvidenceIds: string[];
  linkedProgramIds: string[];
}

export interface EnterpriseDataRoomEvidenceRow extends EnterpriseDataRoomPersistenceRowBase {
  sourceArtifactId: string;
  citationLocator: string;
  claimText: string;
  evidenceType: string;
  confidence: EnterpriseEvidenceRecord['confidence'];
  usabilityState: EnterpriseEvidenceRecord['usabilityState'];
  linkedArtifactIds: string[];
  linkedGraphNodeIds: string[];
  dataClassification: EnterpriseEvidenceRecord['dataClassification'];
  approvalState: EnterpriseEvidenceRecord['approvalState'];
}

export interface EnterpriseDataRoomChunkRow extends EnterpriseDataRoomPersistenceRowBase {
  indexFamily: EnterpriseVectorReadinessRecord['indexFamily'];
  chunkOrdinal: number;
  chunkText: null;
  tokenCount: null;
  sourceTypes: string[];
  rawPrivateTextAllowedInSharedMetadata: false;
  tenantKeyRequired: true;
  embeddingStatus: 'not_embedded';
  embeddingModel: null;
  embeddingVector: null;
  metadata: {
    candidateChunkCount: number;
    sourceIndexPosition: number;
  };
}

export interface EnterpriseDataRoomGraphNodeRow extends EnterpriseDataRoomPersistenceRowBase {
  nodeType: EnterpriseGraphNodeRecord['nodeType'];
  stableKey: string;
  title: string;
}

export interface EnterpriseDataRoomGraphEdgeRow extends EnterpriseDataRoomPersistenceRowBase {
  fromNodeId: string;
  toNodeId: string;
  edgeType: EnterpriseGraphEdgeRecord['edgeType'];
  confidence: number;
  evidenceIds: string[];
}

export interface EnterpriseDataRoomPersistenceRowGroups {
  enterprise_data_rooms: EnterpriseDataRoomTableRow[];
  entities: EnterpriseDataRoomEntityRow[];
  artifacts: EnterpriseDataRoomArtifactRow[];
  evidence: EnterpriseDataRoomEvidenceRow[];
  chunks: EnterpriseDataRoomChunkRow[];
  graph_nodes: EnterpriseDataRoomGraphNodeRow[];
  graph_edges: EnterpriseDataRoomGraphEdgeRow[];
}

export interface EnterpriseDataRoomPersistencePlan {
  context: EnterpriseDataRoomPersistenceContext;
  rowGroups: EnterpriseDataRoomPersistenceRowGroups;
  blockedRows: EnterpriseDataRoomPersistenceBlockedRow[];
  summary: {
    totalRows: number;
    readyRows: number;
    blockedRows: number;
    chunkReadinessRows: number;
    tables: Record<EnterpriseDataRoomPersistenceTable, number>;
  };
}

export function mapEnterpriseDataRoomToPersistenceRows(
  room: EnterpriseDataRoomRecord,
  options: EnterpriseDataRoomPersistenceMapperOptions = {},
): EnterpriseDataRoomPersistencePlan {
  const context = buildPersistenceContext(room, options);
  const rowBase = createRowBaseFactory(context);

  const rowGroups: EnterpriseDataRoomPersistenceRowGroups = {
    enterprise_data_rooms: [mapDataRoomRow(room, context)],
    entities: [
      mapProfileEntity(room, rowBase),
      ...room.people.map((person) => mapPersonEntity(person, rowBase)),
      ...room.systems.map((system) => mapSystemEntity(system, rowBase)),
      ...room.vendorContracts.map((vendor) => mapVendorEntity(vendor, rowBase)),
      ...room.financials.map((financial) => mapFinancialEntity(financial, rowBase)),
      ...room.programs.map((program) => mapProgramEntity(program, rowBase)),
      ...room.sourcingEvents.map((event) => mapSourcingEventEntity(event, rowBase)),
    ],
    artifacts: room.artifacts.map((artifact) => mapArtifactRow(artifact, rowBase)),
    evidence: room.evidence.map((evidence) => mapEvidenceRow(evidence, rowBase)),
    chunks: room.vectorReadiness.flatMap((index, indexPosition) => mapChunkRows(index, indexPosition, rowBase)),
    graph_nodes: room.graph.nodes.map((node) => mapGraphNodeRow(node, rowBase)),
    graph_edges: room.graph.edges.map((edge) => mapGraphEdgeRow(edge, rowBase)),
  };

  const blockedRows = collectBlockedRows(rowGroups);
  const tables = countTables(rowGroups);
  const totalRows = Object.values(tables).reduce((sum, count) => sum + count, 0);

  return {
    context,
    rowGroups,
    blockedRows,
    summary: {
      totalRows,
      readyRows: totalRows - blockedRows.length,
      blockedRows: blockedRows.length,
      chunkReadinessRows: rowGroups.chunks.length,
      tables,
    },
  };
}

export function buildEnterpriseDataRoomPlaceholderClientId(tenantKey: string): string {
  return `${ENTERPRISE_DATA_ROOM_PLACEHOLDER_CLIENT_ID_PREFIX}:${tenantKey}`;
}

function buildPersistenceContext(
  room: EnterpriseDataRoomRecord,
  options: EnterpriseDataRoomPersistenceMapperOptions,
): EnterpriseDataRoomPersistenceContext {
  const resolvedClientId = options.clientId?.trim();
  const clientIdResolved = Boolean(resolvedClientId);
  const clientId = resolvedClientId || buildEnterpriseDataRoomPlaceholderClientId(room.tenantKey);
  const blockedReason = clientIdResolved ? null : 'client_id_unresolved';

  return {
    tenantKey: room.tenantKey,
    clientId,
    clientIdResolved,
    placeholderClientId: !clientIdResolved,
    rowStatus: clientIdResolved ? 'ready' : 'blocked',
    blockedReason,
    generatedAt: options.generatedAt ?? 'dry-run-unpersisted',
    mapperVersion: ENTERPRISE_DATA_ROOM_PERSISTENCE_MAPPER_VERSION,
  };
}

type RowBaseFactory = (sourceRecordId: string, sourceBasis: string) => EnterpriseDataRoomPersistenceRowBase;

function createRowBaseFactory(context: EnterpriseDataRoomPersistenceContext): RowBaseFactory {
  return (sourceRecordId, sourceBasis) => ({
    id: buildPersistenceRowId(context.tenantKey, sourceRecordId),
    tenantKey: context.tenantKey,
    clientId: context.clientId,
    rowStatus: context.rowStatus,
    blockedReason: context.blockedReason,
    sourceRecordId,
    sourceBasis,
    mapperVersion: context.mapperVersion,
  });
}

function buildPersistenceRowId(tenantKey: string, sourceRecordId: string): string {
  return `edr:${tenantKey}:${sourceRecordId}`.replace(/[^a-zA-Z0-9:_-]+/g, '-').replace(/-+/g, '-');
}

function mapDataRoomRow(room: EnterpriseDataRoomRecord, context: EnterpriseDataRoomPersistenceContext): EnterpriseDataRoomTableRow {
  return {
    id: buildPersistenceRowId(room.tenantKey, `enterprise-data-room:${room.tenantKey}`),
    tenantKey: room.tenantKey,
    clientId: context.clientId,
    rowStatus: context.rowStatus,
    blockedReason: context.blockedReason,
    sourceRecordId: room.tenantKey,
    sourceBasis: room.profile.sourceBasis,
    mapperVersion: context.mapperVersion,
    generatedFrom: room.generatedFrom,
    legalName: room.profile.legalName,
    displayName: room.profile.displayName,
    industry: room.profile.industry,
    subIndustry: room.profile.subIndustry,
    headquarters: room.profile.headquarters,
    regions: room.profile.regions,
    employeeCount: room.profile.employeeCount,
    revenueUsdBillions: room.profile.revenueUsdBillions,
    strategicPriorities: room.profile.strategicPriorities,
    regulatoryPosture: room.profile.regulatoryPosture,
    dataClassificationPolicyId: room.profile.dataClassificationPolicyId,
    residencyMode: room.profile.residencyMode,
    dataClassification: room.profile.dataClassification,
    generatedAt: context.generatedAt,
  };
}

function mapProfileEntity(room: EnterpriseDataRoomRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(`entity:profile:${room.tenantKey}`, room.profile.sourceBasis),
    entityKind: 'enterprise_profile',
    stableKey: room.profile.tenantKey,
    label: room.profile.displayName,
    attributes: {
      legalName: room.profile.legalName,
      industry: room.profile.industry,
      subIndustry: room.profile.subIndustry,
      headquarters: room.profile.headquarters,
      residencyMode: room.profile.residencyMode,
      dataClassification: room.profile.dataClassification,
    },
  };
}

function mapPersonEntity(person: EnterprisePersonRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(person.id, person.sourceBasis),
    entityKind: 'person',
    stableKey: person.id,
    label: person.name,
    attributes: { ...person },
  };
}

function mapSystemEntity(system: EnterpriseSystemRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(system.id, system.sourceBasis),
    entityKind: 'system',
    stableKey: system.id,
    label: system.name,
    attributes: { ...system },
  };
}

function mapVendorEntity(vendor: EnterpriseVendorContractRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(vendor.id, vendor.sourceBasis),
    entityKind: 'vendor_contract',
    stableKey: vendor.id,
    label: vendor.vendorName,
    attributes: { ...vendor },
  };
}

function mapFinancialEntity(financial: EnterpriseFinancialRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(financial.id, financial.sourceBasis),
    entityKind: 'financial_metric',
    stableKey: financial.id,
    label: financial.metric,
    attributes: { ...financial },
  };
}

function mapProgramEntity(program: EnterpriseProgramRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(program.id, program.sourceBasis),
    entityKind: 'program',
    stableKey: program.id,
    label: program.name,
    attributes: { ...program },
  };
}

function mapSourcingEventEntity(event: EnterpriseSourcingEventRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEntityRow {
  return {
    ...rowBase(event.id, event.sourceBasis),
    entityKind: 'sourcing_event',
    stableKey: event.id,
    label: event.title,
    attributes: { ...event },
  };
}

function mapArtifactRow(artifact: EnterpriseArtifactRecord, rowBase: RowBaseFactory): EnterpriseDataRoomArtifactRow {
  return {
    ...rowBase(artifact.id, artifact.sourceBasis),
    title: artifact.title,
    artifactType: artifact.artifactType,
    lifecyclePhase: artifact.lifecyclePhase,
    sourcePath: artifact.sourcePath ?? null,
    approvalState: artifact.approvalState,
    linkedEvidenceIds: artifact.linkedEvidenceIds,
    linkedProgramIds: artifact.linkedProgramIds,
  };
}

function mapEvidenceRow(evidence: EnterpriseEvidenceRecord, rowBase: RowBaseFactory): EnterpriseDataRoomEvidenceRow {
  return {
    ...rowBase(evidence.id, evidence.sourceBasis),
    sourceArtifactId: evidence.sourceArtifactId,
    citationLocator: evidence.citationLocator,
    claimText: evidence.claimText,
    evidenceType: evidence.evidenceType,
    confidence: evidence.confidence,
    usabilityState: evidence.usabilityState,
    linkedArtifactIds: evidence.linkedArtifactIds,
    linkedGraphNodeIds: evidence.linkedGraphNodeIds,
    dataClassification: evidence.dataClassification,
    approvalState: evidence.approvalState,
  };
}

function mapChunkRows(
  index: EnterpriseVectorReadinessRecord,
  indexPosition: number,
  rowBase: RowBaseFactory,
): EnterpriseDataRoomChunkRow[] {
  return Array.from({ length: index.candidateChunkCount }, (_, chunkIndex) => ({
    ...rowBase(`chunk:${index.indexFamily}:${chunkIndex + 1}`, 'derived'),
    indexFamily: index.indexFamily,
    chunkOrdinal: chunkIndex + 1,
    chunkText: null,
    tokenCount: null,
    sourceTypes: index.sourceTypes,
    rawPrivateTextAllowedInSharedMetadata: false,
    tenantKeyRequired: true,
    embeddingStatus: 'not_embedded',
    embeddingModel: null,
    embeddingVector: null,
    metadata: {
      candidateChunkCount: index.candidateChunkCount,
      sourceIndexPosition: indexPosition,
    },
  }));
}

function mapGraphNodeRow(node: EnterpriseGraphNodeRecord, rowBase: RowBaseFactory): EnterpriseDataRoomGraphNodeRow {
  return {
    ...rowBase(node.id, node.sourceBasis),
    nodeType: node.nodeType,
    stableKey: node.stableKey,
    title: node.title,
  };
}

function mapGraphEdgeRow(edge: EnterpriseGraphEdgeRecord, rowBase: RowBaseFactory): EnterpriseDataRoomGraphEdgeRow {
  return {
    ...rowBase(edge.id, 'derived'),
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    edgeType: edge.edgeType,
    confidence: edge.confidence,
    evidenceIds: edge.evidenceIds,
  };
}

function collectBlockedRows(rowGroups: EnterpriseDataRoomPersistenceRowGroups): EnterpriseDataRoomPersistenceBlockedRow[] {
  return tableEntries(rowGroups).flatMap(([table, rows]) =>
    rows.flatMap((row) => row.rowStatus === 'blocked' && row.blockedReason
      ? [{ table, rowId: row.id, tenantKey: row.tenantKey, clientId: row.clientId, blockedReason: row.blockedReason }]
      : []),
  );
}

function countTables(rowGroups: EnterpriseDataRoomPersistenceRowGroups): Record<EnterpriseDataRoomPersistenceTable, number> {
  return Object.fromEntries(tableEntries(rowGroups).map(([table, rows]) => [table, rows.length])) as Record<EnterpriseDataRoomPersistenceTable, number>;
}

function tableEntries(rowGroups: EnterpriseDataRoomPersistenceRowGroups): Array<[EnterpriseDataRoomPersistenceTable, EnterpriseDataRoomPersistenceRowBase[]]> {
  return Object.entries(rowGroups) as Array<[EnterpriseDataRoomPersistenceTable, EnterpriseDataRoomPersistenceRowBase[]]>;
}
