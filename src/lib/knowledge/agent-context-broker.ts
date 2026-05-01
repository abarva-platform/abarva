/**
 * Enterprise agent context broker — two-source consumer (TD-5).
 *
 * The broker is the single seam between app-tier callers and tenant
 * data. It returns an `EnterpriseAgentContextBundle` that callers
 * flatten into prompt blocks (Programs, Source, Intelligence). Per
 * `feedback_broker_boundary`, app-tier code MUST NOT bypass this
 * module to reach `EnterpriseDataRoom`, the tenant-data adapter,
 * vector stores, or the graph store.
 *
 * Source layering — the bundle is built from one of two sources per
 * request, never mixed within a single response:
 *
 *   1. Persisted tenant data (`TenantDataAdapter`). Used when the
 *      adapter reports `hasPersistedData(tenantKey) === true`. Records
 *      flow through `mapTenantRecordsToContextItems` (TD-4) and the
 *      bundle is tagged with a `tenant_admin_upload` source-basis
 *      warning. The synchronous `EnterpriseDataRoom` fixture is
 *      skipped entirely.
 *   2. Code-fixture (`EnterpriseDataRoom`). The legacy synchronous
 *      seeded-room path. Used when the adapter has no rows for the
 *      tenant — the bundle warns with the synthetic-fixture string.
 *
 * Per-item `sourceBasis` tagging is preserved end-to-end: persisted
 * items carry the mapper's value (defaulting to `tenant_admin_upload`),
 * fixture items carry whatever the seed declared. The bundle's
 * `warnings` array carries an explicit one-line summary so callers can
 * surface freshness in the UI without having to inspect every item.
 *
 * Callers — there are two entry points by design:
 *   • `buildEnterpriseAgentContextBundle` (sync) — fixture-only,
 *     unchanged behavior. Existing call sites keep working without
 *     code changes.
 *   • `buildEnterpriseAgentContextBundleAsync` — two-source consumer.
 *     New code paths and tests opt in here. The migration of existing
 *     call sites to the async variant is intentionally out of scope
 *     for TD-5 (surgical wiring slice; route migrations follow).
 *
 * Open question — RLS posture: reads currently use the service-role
 * Supabase client (matches the existing fixture path's trust posture
 * and TD-2's choice). A follow-on slice should evaluate whether
 * app-tier callers should flow through an RLS-aware client carrying
 * the user JWT so that PII / restricted classifications are gated by
 * row-level security rather than by the broker contract alone. See
 * design doc §3 and TD-2 follow-on note.
 */

import {
  getEnterpriseDataRoom,
  validateEnterpriseDataRoom,
  type EnterpriseApprovalState,
  type EnterpriseDataClassification,
  type EnterpriseDataRoomDomain,
  type EnterpriseDataRoomRecord,
  type EnterpriseEvidenceRecord,
} from '@/lib/knowledge/enterprise-data-room';
import { mapTenantRecordsToContextItems } from '@/lib/knowledge/tenant-data/mapper';
import {
  getTenantDataAdapter,
  type SegmentId,
  type TenantDataAdapter,
} from '@/lib/knowledge/tenant-data';

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
  | 'sourcing_event'
  | 'financial_metric'
  | 'graph_candidate'
  | 'policy_readiness'
  // TD-4 — persisted tenant-data layer surfaces two new context-item
  // kinds that have no fixture-side analog. The broker keeps emitting
  // existing kinds today; TD-5 wires the mapper output into the bundle
  // and starts emitting these.
  | 'kpi_metric'
  | 'cross_program_signal';

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

/** TD-5 — bundle-level warning strings emitted by the two-source consumer. */
export const TENANT_DATA_PERSISTED_WARNING =
  'Tenant context sourced from persisted data layer (tenant_admin_upload).';
export const TENANT_DATA_FIXTURE_WARNING =
  'Tenant context sourced from synthetic Enterprise Data Room fixture.';

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
      TENANT_DATA_FIXTURE_WARNING,
    ],
  };
}

/**
 * TD-5 — async two-source consumer.
 *
 * Returns the same `EnterpriseAgentContextBundle` shape as the
 * synchronous entry point, but populates `items` from the persisted
 * tenant-data layer when {@link TenantDataAdapter.hasPersistedData}
 * reports true, and falls back to the existing code-fixture path
 * otherwise. Sources are never mixed within a single response — the
 * bundle picks one and tags itself in `warnings`.
 *
 * Per-item `sourceBasis` is preserved end-to-end: persisted items
 * carry the value from {@link mapTenantRecordsToContextItems} (default
 * `tenant_admin_upload`); fixture items carry whatever the seed
 * declared. The bundle's `warnings` array carries an explicit
 * one-line summary identifying the source basis the bundle was
 * assembled from.
 */
export async function buildEnterpriseAgentContextBundleAsync(
  request: EnterpriseAgentContextRequest,
): Promise<EnterpriseAgentContextBundle> {
  const room = getEnterpriseDataRoom(request.tenantKey);
  if (!room) {
    return buildUnknownTenantBundle(request);
  }

  const validation = validateEnterpriseDataRoom(room);
  const blockedItems = buildBlockedItems(request, room);
  const citations = room.evidence.slice(0, 12).map(toCitation);

  const adapter = getTenantDataAdapter();
  const persisted = await adapter.hasPersistedData(request.tenantKey);

  let items: EnterpriseAgentContextItem[];
  let extraWarnings: string[];
  if (persisted) {
    items = [
      buildTenantSummaryItem(room, citations),
      ...(await selectPersistedContextItems(adapter, request)),
    ];
    extraWarnings = [TENANT_DATA_PERSISTED_WARNING];
  } else {
    items = selectContextItems(room, request, citations);
    extraWarnings = [TENANT_DATA_FIXTURE_WARNING];
  }

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
      ...extraWarnings,
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
  return [
    buildTenantSummaryItem(room, citations),
    ...selectFixtureContextItems(room, request, citations),
  ];
}

/**
 * The original code-fixture per-agent selection. Extracted so the
 * two-source async consumer can compose the tenant-summary item with
 * either fixture items or persisted items without duplication.
 */
function selectFixtureContextItems(
  room: EnterpriseDataRoomRecord,
  request: EnterpriseAgentContextRequest,
  citations: EnterpriseEvidenceCitation[],
): EnterpriseAgentContextItem[] {
  const items: EnterpriseAgentContextItem[] = [];

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
    // OV2-1d-archetype · when the program carries a canonical pattern
    // id, surface it in provenanceIds as `pattern:${patternId}` (same
    // prefix-namespace convention used for `system:*` and `vendor:*`
    // ids). Consumers like detectBriefOverlap filter by the prefix.
    items.push(...room.programs.slice(0, 6).map((program) => ({
      id: `ctx:${program.id}`,
      kind: 'program' as const,
      title: program.name,
      summary: `${program.lifecycleState}; sponsor ${program.executiveSponsor}; timeline ${program.timeline}`,
      tenantKey: room.tenantKey,
      sourceBasis: program.sourceBasis,
      dataClassification: 'synthetic' as const,
      sensitivity: 'structured' as const,
      provenanceIds: [
        program.id,
        ...program.linkedSystemIds,
        ...program.linkedVendorIds,
        ...(program.patternId ? [`pattern:${program.patternId}`] : []),
      ],
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
    if (request.surface === 'source') {
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
      items.push(...room.systems.slice(0, 8).map((system) => ({
        id: `ctx:${system.id}`,
        kind: 'system' as const,
        title: system.name,
        summary: `${system.vendor}; ${system.category}; owner ${system.itOwner}; annual spend ${system.annualSpendUsd}; expiry ${system.contractExpiry}; risk ${system.criticality}`,
        tenantKey: room.tenantKey,
        sourceBasis: system.sourceBasis,
        dataClassification: 'synthetic' as const,
        sensitivity: 'structured' as const,
        provenanceIds: [system.id],
        linkedEvidence: [],
      })));
      items.push(...room.vendorContracts.slice(0, 8).map((contract) => ({
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
      items.push(...room.sourcingEvents.slice(0, 4).map((event) => ({
        id: `ctx:${event.id}`,
        kind: 'sourcing_event' as const,
        title: event.title,
        summary: `${event.workType}; status ${event.status}; recommended vendor ${event.recommendedVendorId}; linked programs ${event.linkedProgramIds.join(', ') || 'none'}`,
        tenantKey: room.tenantKey,
        sourceBasis: event.sourceBasis,
        dataClassification: 'synthetic' as const,
        sensitivity: 'structured' as const,
        provenanceIds: [event.id, ...event.linkedProgramIds, ...event.linkedArtifactIds],
        linkedEvidence: [],
      })));
    }
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

/**
 * TD-5 — per-agent selector for the persisted tenant-data path.
 *
 * Mirrors the slice plan's segment-mapping table. Each agent reads a
 * curated set of segments through {@link TenantDataAdapter.listRecords},
 * runs results through {@link mapTenantRecordsToContextItems}, and
 * returns the mapped items in segment order.
 *
 * Limits are aligned with the corresponding code-fixture slices so
 * prompt budgets stay comparable across the two source paths.
 *
 * Records whose `(segment_id, record_kind)` pairs have no mapping in
 * TD-4 (e.g. the `compliance_posture` segment, which is provisional
 * and has no mapper case yet) are dropped silently by the mapper. A
 * follow-on TD-4 extension can add the mappings.
 */
async function selectPersistedContextItems(
  adapter: TenantDataAdapter,
  request: EnterpriseAgentContextRequest,
): Promise<EnterpriseAgentContextItem[]> {
  const tenantKey = request.tenantKey;
  const fetches: Array<Promise<EnterpriseAgentContextItem[]>> = [];

  const fetch = (segmentId: SegmentId, limit: number): void => {
    fetches.push(
      adapter
        .listRecords(tenantKey, segmentId, { limit })
        .then((records) => mapTenantRecordsToContextItems(records)),
    );
  };

  switch (request.agentName) {
    case 'Nexus':
      // Founder feedback #1 — Nexus needs the executive bench, the
      // active program inventory, the cross-program signals (so it can
      // talk about portfolio-wide patterns), and the top evidence
      // claims (provenance for any factual statement).
      fetch('org_structure', 8);
      fetch('program_inventory', 6);
      fetch('cross_program_signals', 4);
      fetch('evidence_ledger', 5);
      break;
    case 'Sentinel':
      // Sentinel is the librarian agent — corpus-wide retrieval and
      // citation discipline. Intelligence-surface questions often ask
      // for current-state technology, so include it_landscape before
      // falling back to doctrine/pattern-only answers.
      fetch('evidence_ledger', 8);
      fetch('kpi_dictionary', 6);
      fetch('it_landscape', request.surface === 'intelligence' ? 8 : 4);
      break;
    case 'Atlas':
      // Atlas reasons over financial / system-landscape posture. KPI
      // metrics carry their own provenance (source_system, data_owner,
      // confidence) — surface those verbatim instead of folding into
      // financial_metric (per design doc §3.1).
      fetch('kpi_dictionary', 8);
      fetch('it_landscape', 4);
      break;
    case 'Steward':
      // Steward owns vendor + policy posture. Compliance segment has
      // no mapper case yet; the mapper drops those records and a
      // follow-on TD-4 extension can add the mapping.
      fetch('vendor_contracts', 6);
      break;
    default:
      break;
  }

  const settled = await Promise.all(fetches);
  return settled.flat();
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
