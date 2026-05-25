import type { PoolClient } from 'pg';
import { firstRow, toJsonArray, toJsonRecord, toStringArray, withTemplateTransaction } from './db';
import { assertTemplateDepth, scoreTemplateDepth } from './authoring';
import type {
  InstantiateTemplateOptions,
  MoveInstanceRecord,
  MoveTemplateArtifactInput,
  MoveTemplateArtifactRecord,
  MoveTemplateGateInput,
  MoveTemplateGateRecord,
  MoveTemplateInput,
  MoveTemplateRecord,
  MoveTemplateReviewInput,
  MoveTemplateStatus,
  TemplateMutationContext,
} from './types';

type TemplateRow = {
  id: string;
  slug: string;
  kind: MoveTemplateRecord['kind'];
  name: string;
  summary: string;
  sponsor_raci_jsonb: unknown;
  version: number;
  parent_version_id: string | null;
  status: MoveTemplateStatus;
  depth_score: string | number;
  published_at: string | null;
  retired_at: string | null;
  vertical_overlays: string[] | null;
  horizon_default: string | null;
  intended_personas: string[] | null;
  primary_author_id: string | null;
  approved_by_id: string | null;
  created_at: string;
  updated_at: string;
};

type GateRow = {
  id: string;
  template_id: string;
  gate_id: string;
  sequence_index: number;
  name: string;
  sponsor_raci_jsonb: unknown;
  required_artifacts: string[] | null;
  evidence_anchors: string[] | null;
  numeric_kill_criteria_jsonb: unknown;
  sensitivity_analysis_template: string | null;
  pre_mortem_required: boolean;
  time_budget_p50_days: number | null;
  time_budget_p90_days: number | null;
  hand_off_ritual: string | null;
  maturity_target: number | null;
  depth_score: string | number;
  created_at: string;
  updated_at: string;
};

type ArtifactRow = {
  id: string;
  gate_id: string;
  artifact_id: string;
  name: string;
  toc_jsonb: unknown;
  schema_jsonb: unknown;
  template_markdown: string | null;
  depth_score: string | number;
  created_at: string;
  updated_at: string;
};

type InstanceRow = {
  instance_id: string;
  template_id: string;
  template_version_pinned: number;
  client_id: string;
  engagement_id: string | null;
  sponsor_assignments_jsonb: unknown;
  current_gate: string | null;
  status: MoveInstanceRecord['status'];
  artifact_completion_jsonb: unknown;
  gate_skeleton_jsonb: unknown;
  options_jsonb: unknown;
  originating_intelligence_session_id: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function numberValue(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapArtifact(row: ArtifactRow): MoveTemplateArtifactRecord {
  return {
    id: row.id,
    gateId: row.gate_id,
    artifactId: row.artifact_id,
    name: row.name,
    toc: toJsonArray(row.toc_jsonb),
    schema: toJsonRecord(row.schema_jsonb),
    templateMarkdown: row.template_markdown ?? '',
    depthScore: numberValue(row.depth_score),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapGate(row: GateRow, artifacts: MoveTemplateArtifactRecord[]): MoveTemplateGateRecord {
  return {
    id: row.id,
    templateId: row.template_id,
    gateId: row.gate_id,
    sequenceIndex: row.sequence_index,
    name: row.name,
    sponsorRaci: toJsonRecord(row.sponsor_raci_jsonb),
    requiredArtifacts: toStringArray(row.required_artifacts),
    evidenceAnchors: toStringArray(row.evidence_anchors),
    numericKillCriteria: toJsonRecord(row.numeric_kill_criteria_jsonb),
    sensitivityAnalysisTemplate: row.sensitivity_analysis_template ?? '',
    preMortemRequired: row.pre_mortem_required,
    timeBudgetP50Days: row.time_budget_p50_days,
    timeBudgetP90Days: row.time_budget_p90_days,
    handOffRitual: row.hand_off_ritual ?? '',
    maturityTarget: row.maturity_target,
    depthScore: numberValue(row.depth_score),
    artifacts,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTemplate(row: TemplateRow, gates: MoveTemplateGateRecord[]): MoveTemplateRecord {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    name: row.name,
    summary: row.summary,
    sponsorRaci: toJsonRecord(row.sponsor_raci_jsonb),
    version: row.version,
    parentVersionId: row.parent_version_id,
    status: row.status,
    depthScore: numberValue(row.depth_score),
    publishedAt: row.published_at,
    retiredAt: row.retired_at,
    verticalOverlays: toStringArray(row.vertical_overlays),
    horizonDefault: row.horizon_default,
    intendedPersonas: toStringArray(row.intended_personas),
    primaryAuthorId: row.primary_author_id,
    approvedById: row.approved_by_id,
    gates,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapInstance(row: InstanceRow): MoveInstanceRecord {
  return {
    instanceId: row.instance_id,
    templateId: row.template_id,
    templateVersionPinned: row.template_version_pinned,
    clientId: row.client_id,
    engagementId: row.engagement_id,
    sponsorAssignments: toJsonRecord(row.sponsor_assignments_jsonb),
    currentGate: row.current_gate,
    status: row.status,
    artifactCompletion: toJsonRecord(row.artifact_completion_jsonb),
    gateSkeleton: toJsonArray(row.gate_skeleton_jsonb),
    options: toJsonRecord(row.options_jsonb),
    originatingIntelligenceSessionId: row.originating_intelligence_session_id,
    createdById: row.created_by_id,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function fetchTemplate(client: PoolClient, idOrSlug: string): Promise<MoveTemplateRecord> {
  const { rows } = await client.query<TemplateRow>(
    `
      SELECT *
      FROM public.move_templates
      WHERE id::text = $1 OR slug = $1
      LIMIT 1
    `,
    [idOrSlug],
  );
  const row = firstRow(rows);
  if (!row) throw new Error(`move_template_not_found:${idOrSlug}`);

  const { rows: gateRows } = await client.query<GateRow>(
    `
      SELECT *
      FROM public.move_template_gates
      WHERE template_id = $1
      ORDER BY sequence_index ASC
    `,
    [row.id],
  );
  const gateIds = gateRows.map((gate) => gate.id);
  const artifactRows = gateIds.length
    ? (await client.query<ArtifactRow>(
        `
          SELECT *
          FROM public.move_template_artifacts
          WHERE gate_id = ANY($1::uuid[])
          ORDER BY artifact_id ASC
        `,
        [gateIds],
      )).rows
    : [];
  const artifactsByGate = new Map<string, MoveTemplateArtifactRecord[]>();
  artifactRows.map(mapArtifact).forEach((artifact) => {
    const current = artifactsByGate.get(artifact.gateId) ?? [];
    current.push(artifact);
    artifactsByGate.set(artifact.gateId, current);
  });
  return mapTemplate(row, gateRows.map((gate) => mapGate(gate, artifactsByGate.get(gate.id) ?? [])));
}

async function writeAudit(
  client: PoolClient,
  eventType: string,
  context: TemplateMutationContext,
  extra: {
    templateId?: string | null;
    instanceId?: string | null;
    clientId?: string | null;
    data?: Record<string, unknown>;
  } = {},
): Promise<void> {
  await client.query(
    `
      INSERT INTO public.move_template_audit_log(template_id, instance_id, client_id, actor_id, event_type, context_jsonb)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      extra.templateId ?? null,
      extra.instanceId ?? null,
      extra.clientId ?? context.clientId ?? null,
      context.userId,
      eventType,
      JSON.stringify(extra.data ?? {}),
    ],
  );
}

async function snapshotTemplate(
  client: PoolClient,
  template: MoveTemplateRecord,
  context: TemplateMutationContext,
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.move_template_versions(template_id, version, status, snapshot_jsonb, created_by_id)
      VALUES ($1, $2, $3, $4::jsonb, $5)
      ON CONFLICT (template_id, version)
      DO UPDATE SET snapshot_jsonb = EXCLUDED.snapshot_jsonb, status = EXCLUDED.status
      RETURNING id
    `,
    [template.id, template.version, template.status, JSON.stringify(template), context.userId],
  );
  return rows[0].id;
}

async function insertGate(
  client: PoolClient,
  templateId: string,
  gate: MoveTemplateGateInput,
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.move_template_gates(
        template_id, gate_id, sequence_index, name, sponsor_raci_jsonb,
        required_artifacts, evidence_anchors, numeric_kill_criteria_jsonb,
        sensitivity_analysis_template, pre_mortem_required, time_budget_p50_days,
        time_budget_p90_days, hand_off_ritual, maturity_target, depth_score
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `,
    [
      templateId,
      gate.gateId,
      gate.sequenceIndex,
      gate.name,
      JSON.stringify(gate.sponsorRaci ?? {}),
      gate.requiredArtifacts ?? [],
      gate.evidenceAnchors ?? [],
      JSON.stringify(gate.numericKillCriteria ?? {}),
      gate.sensitivityAnalysisTemplate ?? '',
      gate.preMortemRequired ?? true,
      gate.timeBudgetP50Days ?? null,
      gate.timeBudgetP90Days ?? null,
      gate.handOffRitual ?? '',
      gate.maturityTarget ?? null,
      gate.depthScore ?? 0,
    ],
  );
  return rows[0].id;
}

async function insertArtifact(
  client: PoolClient,
  gateDbId: string,
  artifact: MoveTemplateArtifactInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO public.move_template_artifacts(
        gate_id, artifact_id, name, toc_jsonb, schema_jsonb, template_markdown, depth_score
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
    `,
    [
      gateDbId,
      artifact.artifactId,
      artifact.name,
      JSON.stringify(artifact.toc ?? []),
      JSON.stringify(artifact.schema ?? {}),
      artifact.templateMarkdown ?? '',
      artifact.depthScore ?? 0,
    ],
  );
}

async function replaceGates(
  client: PoolClient,
  templateId: string,
  gates: MoveTemplateGateInput[],
): Promise<void> {
  await client.query('DELETE FROM public.move_template_gates WHERE template_id = $1', [templateId]);
  for (const gate of gates) {
    const gateDbId = await insertGate(client, templateId, gate);
    for (const artifact of gate.artifacts ?? []) {
      await insertArtifact(client, gateDbId, artifact);
    }
  }
}

export async function listTemplates(filters: {
  kind?: MoveTemplateRecord['kind'];
  status?: MoveTemplateStatus;
  limit?: number;
} = {}): Promise<MoveTemplateRecord[]> {
  return withTemplateTransaction(async (client) => {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.kind) {
      values.push(filters.kind);
      clauses.push(`kind = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      clauses.push(`status = $${values.length}`);
    }
    values.push(Math.min(Math.max(filters.limit ?? 100, 1), 200));
    const { rows } = await client.query<TemplateRow>(
      `
        SELECT *
        FROM public.move_templates
        ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
        ORDER BY updated_at DESC
        LIMIT $${values.length}
      `,
      values,
    );
    return Promise.all(rows.map((row) => fetchTemplate(client, row.id)));
  });
}

export async function getTemplate(idOrSlug: string): Promise<MoveTemplateRecord> {
  return withTemplateTransaction((client) => fetchTemplate(client, idOrSlug));
}

export async function createTemplate(
  input: MoveTemplateInput,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  const slug = normalizeSlug(input.slug || input.name);
  if (!slug) throw new Error('slug_required');
  if (!input.name.trim()) throw new Error('name_required');

  return withTemplateTransaction(async (client) => {
    const depth = input.gates?.length ? await scoreTemplateDepth({ ...input, slug }, context.userId) : null;
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO public.move_templates(
          slug, kind, name, summary, sponsor_raci_jsonb, depth_score,
          vertical_overlays, horizon_default, intended_personas, primary_author_id
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        slug,
        input.kind,
        input.name.trim(),
        input.summary?.trim() ?? '',
        JSON.stringify(input.sponsorRaci ?? {}),
        depth?.score ?? input.depthScore ?? 0,
        input.verticalOverlays ?? [],
        input.horizonDefault ?? null,
        input.intendedPersonas ?? [],
        context.userId,
      ],
    );
    const id = rows[0].id;
    await replaceGates(client, id, input.gates ?? []);
    const template = await fetchTemplate(client, id);
    await snapshotTemplate(client, template, context);
    await writeAudit(client, 'move_template_created', context, { templateId: id, data: { slug } });
    return template;
  });
}

export async function updateTemplate(
  idOrSlug: string,
  input: Partial<MoveTemplateInput>,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  return withTemplateTransaction(async (client) => {
    const current = await fetchTemplate(client, idOrSlug);
    const nextInput: MoveTemplateInput = {
      slug: input.slug ?? current.slug,
      kind: input.kind ?? current.kind,
      name: input.name ?? current.name,
      summary: input.summary ?? current.summary,
      sponsorRaci: input.sponsorRaci ?? current.sponsorRaci,
      verticalOverlays: input.verticalOverlays ?? current.verticalOverlays,
      horizonDefault: input.horizonDefault ?? current.horizonDefault,
      intendedPersonas: input.intendedPersonas ?? current.intendedPersonas,
      gates: input.gates ?? current.gates,
    };
    const depth = nextInput.gates?.length ? await scoreTemplateDepth(nextInput, context.userId) : null;
    const slug = normalizeSlug(nextInput.slug);
    await client.query(
      `
        UPDATE public.move_templates
        SET slug = $2,
            kind = $3,
            name = $4,
            summary = $5,
            sponsor_raci_jsonb = $6::jsonb,
            depth_score = $7,
            vertical_overlays = $8,
            horizon_default = $9,
            intended_personas = $10,
            version = version + 1,
            status = 'draft',
            published_at = NULL,
            retired_at = NULL
        WHERE id = $1
      `,
      [
        current.id,
        slug,
        nextInput.kind,
        nextInput.name.trim(),
        nextInput.summary?.trim() ?? '',
        JSON.stringify(nextInput.sponsorRaci ?? {}),
        depth?.score ?? input.depthScore ?? current.depthScore,
        nextInput.verticalOverlays ?? [],
        nextInput.horizonDefault ?? null,
        nextInput.intendedPersonas ?? [],
      ],
    );
    if (input.gates) {
      await replaceGates(client, current.id, input.gates);
    }
    const template = await fetchTemplate(client, current.id);
    const versionId = await snapshotTemplate(client, template, context);
    await client.query('UPDATE public.move_templates SET parent_version_id = $2 WHERE id = $1', [template.id, versionId]);
    const updated = await fetchTemplate(client, current.id);
    await writeAudit(client, 'move_template_updated', context, { templateId: updated.id, data: { version: updated.version } });
    return updated;
  });
}

export async function submitTemplate(
  idOrSlug: string,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  return withTemplateTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query('UPDATE public.move_templates SET status = $2 WHERE id = $1', [template.id, 'in_review']);
    await client.query(
      `
        INSERT INTO public.move_template_review_state(template_id, decision, submitted_by_id, depth_score)
        VALUES ($1, 'submitted', $2, $3)
      `,
      [template.id, context.userId, template.depthScore],
    );
    const updated = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, updated, context);
    await writeAudit(client, 'move_template_submitted', context, { templateId: template.id });
    return updated;
  });
}

export async function addTemplateReview(
  idOrSlug: string,
  review: MoveTemplateReviewInput,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  return withTemplateTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(
      `
        INSERT INTO public.move_template_review_state(template_id, decision, reviewer_id, submitted_by_id, comment, depth_score)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [template.id, review.decision, context.userId, template.primaryAuthorId, review.comment ?? null, template.depthScore],
    );
    await writeAudit(client, 'move_template_reviewed', context, { templateId: template.id, data: { decision: review.decision } });
    return template;
  });
}

export async function approveTemplate(
  idOrSlug: string,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  return withTemplateTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    const depth = await assertTemplateDepth(template, context.userId);
    await client.query(
      `
        UPDATE public.move_templates
        SET status = 'approved', approved_by_id = $2, depth_score = $3
        WHERE id = $1
      `,
      [template.id, context.userId, depth.score],
    );
    await client.query(
      `
        INSERT INTO public.move_template_review_state(template_id, decision, reviewer_id, submitted_by_id, depth_score)
        VALUES ($1, 'approved', $2, $3, $4)
      `,
      [template.id, context.userId, template.primaryAuthorId, depth.score],
    );
    const updated = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, updated, context);
    await writeAudit(client, 'move_template_approved', context, { templateId: template.id, data: { depthScore: depth.score } });
    return updated;
  });
}

export async function publishTemplate(
  idOrSlug: string,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  return withTemplateTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    const depth = await assertTemplateDepth(template, context.userId);
    await client.query(
      `
        UPDATE public.move_templates
        SET status = 'published', depth_score = $2, published_at = now(), retired_at = NULL
        WHERE id = $1
      `,
      [template.id, depth.score],
    );
    const updated = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, updated, context);
    await writeAudit(client, 'move_template_published', context, { templateId: template.id, data: { version: updated.version } });
    return updated;
  });
}

export async function retireTemplate(
  idOrSlug: string,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  return withTemplateTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(
      `
        UPDATE public.move_templates
        SET status = 'retired', retired_at = now()
        WHERE id = $1
      `,
      [template.id],
    );
    const updated = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, updated, context);
    await writeAudit(client, 'move_template_retired', context, { templateId: template.id });
    return updated;
  });
}

export async function cloneTemplate(
  idOrSlug: string,
  context: TemplateMutationContext,
): Promise<MoveTemplateRecord> {
  const source = await getTemplate(idOrSlug);
  return createTemplate(
    {
      slug: `${source.slug}-copy`,
      kind: source.kind,
      name: `${source.name} Copy`,
      summary: source.summary,
      sponsorRaci: source.sponsorRaci,
      verticalOverlays: source.verticalOverlays,
      horizonDefault: source.horizonDefault,
      intendedPersonas: source.intendedPersonas,
      gates: source.gates.map((gate) => ({
        gateId: gate.gateId,
        sequenceIndex: gate.sequenceIndex,
        name: gate.name,
        sponsorRaci: gate.sponsorRaci,
        requiredArtifacts: gate.requiredArtifacts,
        evidenceAnchors: gate.evidenceAnchors,
        numericKillCriteria: gate.numericKillCriteria,
        sensitivityAnalysisTemplate: gate.sensitivityAnalysisTemplate,
        preMortemRequired: gate.preMortemRequired,
        timeBudgetP50Days: gate.timeBudgetP50Days,
        timeBudgetP90Days: gate.timeBudgetP90Days,
        handOffRitual: gate.handOffRitual,
        maturityTarget: gate.maturityTarget,
        artifacts: gate.artifacts.map((artifact) => ({
          artifactId: artifact.artifactId,
          name: artifact.name,
          toc: artifact.toc,
          schema: artifact.schema,
          templateMarkdown: artifact.templateMarkdown,
        })),
      })),
    },
    context,
  );
}

function buildGateSkeleton(template: MoveTemplateRecord): unknown[] {
  return template.gates.map((gate) => ({
    gateId: gate.gateId,
    name: gate.name,
    sequenceIndex: gate.sequenceIndex,
    status: gate.sequenceIndex === 0 ? 'open' : 'locked',
    requiredArtifacts: gate.artifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      name: artifact.name,
      status: 'not_started',
    })),
  }));
}

function buildArtifactCompletion(template: MoveTemplateRecord): Record<string, unknown> {
  return Object.fromEntries(
    template.gates.flatMap((gate) =>
      gate.artifacts.map((artifact) => [`${gate.gateId}:${artifact.artifactId}`, {
        gateId: gate.gateId,
        artifactId: artifact.artifactId,
        status: 'not_started',
      }]),
    ),
  );
}

async function createEngagementShell(
  client: PoolClient,
  template: MoveTemplateRecord,
  clientId: string,
  options: InstantiateTemplateOptions,
): Promise<string> {
  const name = options.instanceName?.trim() || template.name;
  const graphNodeId = `move_${normalizeSlug(name).replace(/-/g, '_')}_${Date.now().toString(36)}`;
  const uniqueSolution = `${name} · ${Date.now().toString(36)}`;
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.engagements(
        graph_node_id,
        client_id,
        name,
        solution,
        status,
        current_phase,
        origin_source,
        current_module_key,
        charter,
        metadata
      )
      VALUES ($1, $2, $3, $4, 'active', 0, 'user_initiated', $5, $6::jsonb, $7::jsonb)
      RETURNING id
    `,
    [
      graphNodeId,
      clientId,
      name,
      uniqueSolution,
      template.gates[0]?.gateId ?? null,
      JSON.stringify({
        templateId: template.id,
        templateSlug: template.slug,
        templateVersion: template.version,
        templateKind: template.kind,
      }),
      JSON.stringify({ instantiated_from_template: template.slug, packet: 'P3' }),
    ],
  );
  const engagementId = rows[0].id;
  for (const gate of template.gates) {
    await client.query(
      `
        INSERT INTO public.program_modules(
          engagement_id, module_key, module_name, phase_number, module_order, status, state_jsonb
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (engagement_id, module_key) DO NOTHING
      `,
      [
        engagementId,
        gate.gateId,
        gate.name,
        gate.sequenceIndex,
        gate.sequenceIndex,
        gate.sequenceIndex === 0 ? 'in_progress' : 'not_started',
        JSON.stringify({
          templateGateId: gate.id,
          requiredArtifacts: gate.requiredArtifacts,
          evidenceAnchors: gate.evidenceAnchors,
        }),
      ],
    );
  }
  return engagementId;
}

export async function instantiateTemplate(
  templateId: string,
  version: number | undefined,
  clientId: string,
  options: InstantiateTemplateOptions = {},
  context: TemplateMutationContext = { userId: options.createdById ?? 'template-instantiation', clientId },
): Promise<MoveInstanceRecord> {
  return withTemplateTransaction(async (client) => {
    const template = await fetchTemplate(client, templateId);
    const pinnedVersion = version ?? template.version;
    if (pinnedVersion !== template.version) {
      const { rows } = await client.query<{ id: string }>(
        `
          SELECT id
          FROM public.move_template_versions
          WHERE template_id = $1 AND version = $2
          LIMIT 1
        `,
        [template.id, pinnedVersion],
      );
      if (rows.length === 0) throw new Error(`move_template_version_not_found:${template.slug}:${pinnedVersion}`);
    }
    if (template.status !== 'published') {
      throw new Error(`move_template_not_published:${template.slug}`);
    }

    const gateSkeleton = buildGateSkeleton(template);
    const artifactCompletion = buildArtifactCompletion(template);
    const engagementId = options.createProgramShell === false
      ? null
      : await createEngagementShell(client, template, clientId, options);
    const { rows } = await client.query<InstanceRow>(
      `
        INSERT INTO public.move_instances(
          template_id, template_version_pinned, client_id, engagement_id,
          sponsor_assignments_jsonb, current_gate, status, artifact_completion_jsonb,
          gate_skeleton_jsonb, options_jsonb, originating_intelligence_session_id, created_by_id
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12)
        RETURNING *
      `,
      [
        template.id,
        pinnedVersion,
        clientId,
        engagementId,
        JSON.stringify(options.sponsorAssignments ?? {}),
        template.gates[0]?.gateId ?? null,
        options.status ?? 'active',
        JSON.stringify(artifactCompletion),
        JSON.stringify(gateSkeleton),
        JSON.stringify(options),
        options.originatingIntelligenceSessionId ?? null,
        context.userId,
      ],
    );
    const instance = mapInstance(rows[0]);
    await writeAudit(client, 'move_template_instantiated', context, {
      templateId: template.id,
      instanceId: instance.instanceId,
      clientId,
      data: { version: pinnedVersion, engagementId },
    });
    return instance;
  });
}
