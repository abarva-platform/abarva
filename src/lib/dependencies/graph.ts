import { instantiateTemplate } from '@/lib/templates/registry';
import { withDependencyTransaction } from './db';
import { IT_PRODUCTIVITY_TEMPLATE_SLUG, proposeSiblingMoves, relationWeight } from './proposals';
import type {
  AcceptSiblingRecommendationsInput,
  AcceptSiblingRecommendationsResult,
  AddDependencyInput,
  DependencyEdge,
  DependencyNode,
  DependencyNodeKind,
  DependencyRelationType,
  DependencyStatus,
  MoveDAG,
  MoveDAGFilters,
  RemoveDependencyInput,
  SiblingMoveProposal,
} from './types';

type NodeRow = {
  instance_id: string;
  template_id: string;
  template_version_pinned: number;
  client_id: string;
  engagement_id: string | null;
  sponsor_assignments_jsonb: unknown;
  current_gate: string | null;
  status: DependencyStatus;
  options_jsonb: unknown;
  created_at: string;
  updated_at: string;
  template_slug: string;
  template_name: string;
  template_kind: 'Move' | 'SourceWorkflow';
};

type EdgeRow = {
  id: string;
  client_id: string;
  from_instance_id: string;
  to_instance_id: string;
  from_node_kind: DependencyNodeKind;
  to_node_kind: DependencyNodeKind;
  relation_type: DependencyRelationType;
  note: string | null;
  estimated_impact_usd: string | number | null;
  metadata_jsonb: unknown;
  accepted_by: string | null;
  accepted_at: string | null;
  declined_by: string | null;
  declined_at: string | null;
  created_at: string;
  updated_at: string;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const match = value.find((item) => typeof item === 'string' && item.trim());
    return typeof match === 'string' ? match.trim() : null;
  }
  return null;
}

function extractSponsor(json: Record<string, unknown>): string | null {
  return firstString(json.accountable)
    ?? firstString(json.sponsor)
    ?? firstString(json.primarySponsor)
    ?? firstString(json.owner)
    ?? firstString(json.consulted);
}

function extractDollarImpact(options: Record<string, unknown>): number | null {
  return numberValue(options.dollarImpactUsd)
    ?? numberValue(options.estimatedImpactUsd)
    ?? numberValue(options.valueUsd)
    ?? numberValue(options.projectedValueUsd);
}

function nodeKindFromTemplate(kind: 'Move' | 'SourceWorkflow'): DependencyNodeKind {
  return kind === 'SourceWorkflow' ? 'source_workflow_instance' : 'move_instance';
}

function mapNode(row: NodeRow): DependencyNode {
  const sponsorAssignments = toRecord(row.sponsor_assignments_jsonb);
  const options = toRecord(row.options_jsonb);
  return {
    id: row.instance_id,
    kind: nodeKindFromTemplate(row.template_kind),
    templateId: row.template_id,
    templateSlug: row.template_slug,
    templateName: row.template_name,
    templateKind: row.template_kind,
    clientId: row.client_id,
    engagementId: row.engagement_id,
    status: row.status,
    currentGate: row.current_gate,
    sponsor: extractSponsor(sponsorAssignments) ?? extractSponsor(options),
    dollarImpactUsd: extractDollarImpact(options),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapEdge(row: EdgeRow): DependencyEdge {
  return {
    id: row.id,
    clientId: row.client_id,
    fromNodeId: row.from_instance_id,
    toNodeId: row.to_instance_id,
    fromNodeKind: row.from_node_kind,
    toNodeKind: row.to_node_kind,
    relationType: row.relation_type,
    note: row.note,
    estimatedImpactUsd: numberValue(row.estimated_impact_usd),
    metadata: toRecord(row.metadata_jsonb),
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    declinedBy: row.declined_by,
    declinedAt: row.declined_at,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function normalizeFilters(filters: MoveDAGFilters = {}): MoveDAG['filters'] {
  return {
    statuses: [...new Set(filters.statuses ?? [])],
    sponsors: [...new Set((filters.sponsors ?? []).map((item) => item.trim()).filter(Boolean))],
    minDollarImpactUsd: typeof filters.minDollarImpactUsd === 'number' && Number.isFinite(filters.minDollarImpactUsd)
      ? filters.minDollarImpactUsd
      : null,
  };
}

export function filterMoveDAG(dag: MoveDAG, filters: MoveDAGFilters = {}): MoveDAG {
  const normalized = normalizeFilters(filters);
  const sponsorSet = new Set(normalized.sponsors.map((item) => item.toLowerCase()));
  const statusSet = new Set(normalized.statuses);
  const nodes = dag.nodes.filter((node) => {
    if (statusSet.size > 0 && !statusSet.has(node.status)) return false;
    if (sponsorSet.size > 0 && (!node.sponsor || !sponsorSet.has(node.sponsor.toLowerCase()))) return false;
    if (normalized.minDollarImpactUsd !== null && (node.dollarImpactUsd ?? 0) < normalized.minDollarImpactUsd) return false;
    return true;
  });
  const visible = new Set(nodes.map((node) => node.id));
  return {
    clientId: dag.clientId,
    nodes,
    edges: dag.edges.filter((edge) => visible.has(edge.fromNodeId) && visible.has(edge.toNodeId)),
    filters: normalized,
  };
}

export async function getMoveDAG(clientId: string, filters: MoveDAGFilters = {}): Promise<MoveDAG> {
  const dag = await withDependencyTransaction(async (client) => {
    const { rows: nodeRows } = await client.query<NodeRow>(
      `
        SELECT
          mi.instance_id,
          mi.template_id,
          mi.template_version_pinned,
          mi.client_id,
          mi.engagement_id,
          mi.sponsor_assignments_jsonb,
          mi.current_gate,
          mi.status,
          mi.options_jsonb,
          mi.created_at,
          mi.updated_at,
          mt.slug AS template_slug,
          mt.name AS template_name,
          mt.kind AS template_kind
        FROM public.move_instances mi
        JOIN public.move_templates mt ON mt.id = mi.template_id
        WHERE mi.client_id = $1
          AND mi.status <> 'retired'
        ORDER BY mi.created_at ASC
      `,
      [clientId],
    );

    const nodes = nodeRows.map(mapNode);
    const nodeIds = nodes.map((node) => node.id);
    const { rows: edgeRows } = nodeIds.length
      ? await client.query<EdgeRow>(
          `
            SELECT
              id,
              client_id,
              from_instance_id,
              to_instance_id,
              from_node_kind,
              to_node_kind,
              relation_type,
              note,
              estimated_impact_usd,
              metadata_jsonb,
              accepted_by,
              accepted_at,
              declined_by,
              declined_at,
              created_at,
              updated_at
            FROM public.move_dependencies
            WHERE client_id = $1
              AND deleted_at IS NULL
              AND from_instance_id = ANY($2::uuid[])
              AND to_instance_id = ANY($2::uuid[])
            ORDER BY relation_type ASC, updated_at DESC
          `,
          [clientId, nodeIds],
        )
      : { rows: [] };

    return {
      clientId,
      nodes,
      edges: edgeRows.map(mapEdge),
      filters: normalizeFilters(),
    };
  });

  return filterMoveDAG(dag, filters);
}

async function getDependencyNodeKinds(
  clientId: string,
  fromNodeId: string,
  toNodeId: string,
): Promise<{ from: DependencyNodeKind; to: DependencyNodeKind }> {
  return withDependencyTransaction(async (client) => {
    const { rows } = await client.query<{ instance_id: string; kind: 'Move' | 'SourceWorkflow' }>(
      `
        SELECT mi.instance_id, mt.kind
        FROM public.move_instances mi
        JOIN public.move_templates mt ON mt.id = mi.template_id
        WHERE mi.client_id = $1
          AND mi.instance_id = ANY($2::uuid[])
      `,
      [clientId, [fromNodeId, toNodeId]],
    );
    if (rows.length !== 2) throw new Error('dependency_node_not_found');
    const from = rows.find((row) => row.instance_id === fromNodeId);
    const to = rows.find((row) => row.instance_id === toNodeId);
    if (!from || !to) throw new Error('dependency_node_not_found');
    return {
      from: nodeKindFromTemplate(from.kind),
      to: nodeKindFromTemplate(to.kind),
    };
  });
}

export async function addDependency(input: AddDependencyInput): Promise<DependencyEdge> {
  if (input.fromNodeId === input.toNodeId) throw new Error('dependency_self_edge');
  const kinds = await getDependencyNodeKinds(input.clientId, input.fromNodeId, input.toNodeId);

  return withDependencyTransaction(async (client) => {
    const { rows } = await client.query<EdgeRow>(
      `
        INSERT INTO public.move_dependencies(
          client_id,
          from_instance_id,
          to_instance_id,
          from_node_kind,
          to_node_kind,
          relation_type,
          note,
          estimated_impact_usd,
          metadata_jsonb,
          accepted_by,
          accepted_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, CASE WHEN $10::text IS NULL THEN NULL ELSE now() END, $10, $10)
        ON CONFLICT (client_id, from_instance_id, to_instance_id, relation_type)
          WHERE deleted_at IS NULL
            AND from_instance_id IS NOT NULL
            AND to_instance_id IS NOT NULL
        DO UPDATE SET
          from_node_kind = EXCLUDED.from_node_kind,
          to_node_kind = EXCLUDED.to_node_kind,
          note = EXCLUDED.note,
          estimated_impact_usd = EXCLUDED.estimated_impact_usd,
          metadata_jsonb = public.move_dependencies.metadata_jsonb || EXCLUDED.metadata_jsonb,
          accepted_by = COALESCE(public.move_dependencies.accepted_by, EXCLUDED.accepted_by),
          accepted_at = COALESCE(public.move_dependencies.accepted_at, EXCLUDED.accepted_at),
          declined_by = NULL,
          declined_at = NULL,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
        RETURNING *
      `,
      [
        input.clientId,
        input.fromNodeId,
        input.toNodeId,
        kinds.from,
        kinds.to,
        input.relationType,
        input.note ?? null,
        input.estimatedImpactUsd ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.actorId ?? null,
      ],
    );
    return mapEdge(rows[0]);
  });
}

export async function removeDependency(input: RemoveDependencyInput): Promise<DependencyEdge> {
  return withDependencyTransaction(async (client) => {
    const clauses = ['client_id = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [input.clientId];
    if (input.dependencyId) {
      values.push(input.dependencyId);
      clauses.push(`id = $${values.length}`);
    }
    if (input.fromNodeId) {
      values.push(input.fromNodeId);
      clauses.push(`from_instance_id = $${values.length}`);
    }
    if (input.toNodeId) {
      values.push(input.toNodeId);
      clauses.push(`to_instance_id = $${values.length}`);
    }
    if (input.relationType) {
      values.push(input.relationType);
      clauses.push(`relation_type = $${values.length}`);
    }
    if (clauses.length === 2) throw new Error('dependency_identifier_required');

    values.push(input.actorId ?? null);
    const { rows } = await client.query<EdgeRow>(
      `
        UPDATE public.move_dependencies
        SET deleted_at = now(),
            declined_by = COALESCE($${values.length}::text, declined_by),
            declined_at = CASE WHEN $${values.length}::text IS NULL THEN declined_at ELSE now() END,
            updated_by = COALESCE($${values.length}::text, updated_by),
            updated_at = now()
        WHERE ${clauses.join(' AND ')}
        RETURNING *
      `,
      values,
    );
    if (!rows[0]) throw new Error('dependency_not_found');
    return mapEdge(rows[0]);
  });
}

async function findParentInstance(clientId: string, parentMoveInstanceId: string): Promise<DependencyNode> {
  const dag = await getMoveDAG(clientId);
  const parent = dag.nodes.find((node) => node.id === parentMoveInstanceId);
  if (!parent) throw new Error('dependency_parent_not_found');
  return parent;
}

async function findExistingRecommendationInstance(
  clientId: string,
  parentMoveInstanceId: string,
  templateSlug: string,
): Promise<DependencyNode | null> {
  const dag = await getMoveDAG(clientId);
  return dag.nodes.find((node) =>
    node.templateSlug === templateSlug
    && node.id !== parentMoveInstanceId
  ) ?? null;
}

function acceptedIdsForProposal(input: AcceptSiblingRecommendationsInput, proposal: SiblingMoveProposal): Set<string> {
  if (input.acceptAll || !input.decisions || input.decisions.length === 0) {
    return new Set([
      ...proposal.siblingMoves.map((item) => item.id),
      ...((input.includeSourceWorkflows ?? true) ? proposal.sourceWorkflows.map((item) => item.id) : []),
    ]);
  }
  return new Set(input.decisions.filter((item) => item.decision === 'accept').map((item) => item.recommendationId));
}

export async function acceptSiblingRecommendations(
  input: AcceptSiblingRecommendationsInput,
): Promise<AcceptSiblingRecommendationsResult> {
  const parent = await findParentInstance(input.clientId, input.parentMoveInstanceId);
  const proposal = await proposeSiblingMoves(parent.templateId);
  const accepted = acceptedIdsForProposal(input, proposal);
  const allRecommendations = [
    ...proposal.siblingMoves,
    ...((input.includeSourceWorkflows ?? true) ? proposal.sourceWorkflows : []),
  ];
  const declined = allRecommendations
    .filter((item) => !accepted.has(item.id))
    .map((item) => item.id);

  const createdInstances: DependencyNode[] = [];
  const reusedInstances: DependencyNode[] = [];
  const instanceBySlug = new Map<string, DependencyNode>([[parent.templateSlug || IT_PRODUCTIVITY_TEMPLATE_SLUG, parent]]);

  for (const recommendation of allRecommendations) {
    if (!accepted.has(recommendation.id)) continue;
    const existing = await findExistingRecommendationInstance(input.clientId, input.parentMoveInstanceId, recommendation.templateSlug);
    if (existing) {
      reusedInstances.push(existing);
      instanceBySlug.set(recommendation.templateSlug, existing);
      continue;
    }

    const options = {
      instanceName: recommendation.templateName,
      sponsorAssignments: { accountable: recommendation.sponsor },
      status: 'active' as const,
      createdById: input.actorId ?? undefined,
      origin: 'p10-dependency-dag',
      createProgramShell: false,
      dependencyParentInstanceId: input.parentMoveInstanceId,
      dependencyRecommendationId: recommendation.id,
      dollarImpactUsd: recommendation.dollarImpactUsd,
    };

    const instance = await instantiateTemplate(
      recommendation.templateId ?? recommendation.templateSlug,
      undefined,
      input.clientId,
      options,
      { userId: input.actorId ?? 'p10-dependency-dag', clientId: input.clientId },
    );
    const [freshNode] = (await getMoveDAG(input.clientId)).nodes.filter((node) => node.id === instance.instanceId);
    if (freshNode) {
      createdInstances.push(freshNode);
      instanceBySlug.set(recommendation.templateSlug, freshNode);
    }
  }

  const edges: DependencyEdge[] = [];
  const acceptedSlugs = new Set([...instanceBySlug.keys()]);
  for (const edge of proposal.edges.sort((a, b) => relationWeight(b.relationType) - relationWeight(a.relationType))) {
    if (!acceptedSlugs.has(edge.fromTemplateSlug) || !acceptedSlugs.has(edge.toTemplateSlug)) continue;
    const from = instanceBySlug.get(edge.fromTemplateSlug);
    const to = instanceBySlug.get(edge.toTemplateSlug);
    if (!from || !to) continue;
    edges.push(await addDependency({
      clientId: input.clientId,
      fromNodeId: from.id,
      toNodeId: to.id,
      relationType: edge.relationType,
      note: edge.note,
      estimatedImpactUsd: edge.estimatedImpactUsd,
      actorId: input.actorId ?? null,
      metadata: {
        proposalId: edge.id,
        parentMoveInstanceId: input.parentMoveInstanceId,
        packet: 'P10',
      },
    }));
  }

  return {
    parentMoveInstanceId: input.parentMoveInstanceId,
    createdInstances,
    reusedInstances,
    declinedRecommendationIds: declined,
    edges,
  };
}
