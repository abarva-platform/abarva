import type { PoolClient } from 'pg';
import { firstRow, toJsonArray, toJsonRecord, toStringArray, withWorkshopTransaction } from './db';
import { lintWorkshopTemplateDepth } from './depth-lint';
import type {
  WorkshopAssetInput,
  WorkshopAssetRecord,
  WorkshopInstanceInput,
  WorkshopInstanceRecord,
  WorkshopMutationContext,
  WorkshopReviewInput,
  WorkshopTemplateInput,
  WorkshopTemplateRecord,
  WorkshopTemplateStatus,
} from './types';

type TemplateRow = {
  id: string;
  client_id: string | null;
  slug: string;
  name: string;
  duration_minutes: number;
  version: number;
  parent_version_id: string | null;
  status: WorkshopTemplateStatus;
  depth_score: string | number;
  owning_gate_id: string | null;
  hypothesis_to_test: string | null;
  stakeholder_map_jsonb: unknown;
  facilitator_tactics_jsonb: unknown;
  vertical_overlays: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  published_at: string | null;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
};

type AssetRow = {
  id: string;
  client_id: string | null;
  workshop_id: string;
  asset_type: WorkshopAssetRecord['assetType'];
  sequence_index: number;
  name: string;
  format: string;
  content_text: string | null;
  content_blob_ref: string | null;
  schema_jsonb: unknown;
  time_box_minutes: number | null;
  created_at: string;
  updated_at: string;
};

type InstanceRow = {
  id: string;
  template_id: string;
  template_name: string | null;
  template_slug: string | null;
  version_pinned: number;
  client_id: string;
  move_instance_id: string | null;
  gate_id: string | null;
  scheduled_at: string | null;
  status: WorkshopInstanceRecord['status'];
  decisions_jsonb: unknown;
  dissent_log_jsonb: unknown;
  post_read_sent_at: string | null;
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

function mapAsset(row: AssetRow): WorkshopAssetRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    workshopId: row.workshop_id,
    assetType: row.asset_type,
    sequenceIndex: row.sequence_index,
    name: row.name,
    format: row.format,
    contentText: row.content_text,
    contentBlobRef: row.content_blob_ref,
    schema: toJsonRecord(row.schema_jsonb),
    timeBoxMinutes: row.time_box_minutes,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTemplate(row: TemplateRow, assets: WorkshopAssetRecord[]): WorkshopTemplateRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    slug: row.slug,
    name: row.name,
    durationMinutes: row.duration_minutes,
    version: row.version,
    parentVersionId: row.parent_version_id,
    status: row.status,
    depthScore: numberValue(row.depth_score),
    owningGateId: row.owning_gate_id,
    hypothesisToTest: row.hypothesis_to_test ?? '',
    stakeholderMap: toJsonRecord(row.stakeholder_map_jsonb),
    facilitatorTactics: toJsonRecord(row.facilitator_tactics_jsonb),
    verticalOverlays: toStringArray(row.vertical_overlays),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    approvedBy: row.approved_by,
    publishedAt: row.published_at,
    retiredAt: row.retired_at,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    assets,
  };
}

function mapInstance(row: InstanceRow): WorkshopInstanceRecord {
  return {
    id: row.id,
    templateId: row.template_id,
    templateName: row.template_name,
    templateSlug: row.template_slug,
    versionPinned: row.version_pinned,
    clientId: row.client_id,
    moveInstanceId: row.move_instance_id,
    gateId: row.gate_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    decisions: toJsonArray(row.decisions_jsonb),
    dissentLog: toJsonArray(row.dissent_log_jsonb),
    postReadSentAt: row.post_read_sent_at,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function fetchAssets(client: PoolClient, workshopId: string, version?: number): Promise<WorkshopAssetRecord[]> {
  const versionClause = version
    ? `AND EXISTS (
        SELECT 1
        FROM public.workshop_templates wt
        WHERE wt.id = a.workshop_id AND wt.version = $2
      )`
    : '';
  const values = version ? [workshopId, version] : [workshopId];
  const { rows } = await client.query<AssetRow>(
    `
      SELECT *
      FROM public.workshop_template_assets a
      WHERE a.workshop_id = $1
        AND a.deleted_at IS NULL
        ${versionClause}
      ORDER BY a.sequence_index ASC, a.created_at ASC
    `,
    values,
  );
  return rows.map(mapAsset);
}

async function fetchTemplate(client: PoolClient, idOrSlug: string, version?: number): Promise<WorkshopTemplateRecord> {
  const values: unknown[] = [idOrSlug];
  let versionClause = '';
  if (version) {
    values.push(version);
    versionClause = `AND version = $${values.length}`;
  }
  const { rows } = await client.query<TemplateRow>(
    `
      SELECT *
      FROM public.workshop_templates
      WHERE deleted_at IS NULL
        AND (id::text = $1 OR slug = $1)
        ${versionClause}
      ORDER BY version DESC
      LIMIT 1
    `,
    values,
  );
  const row = firstRow(rows);
  if (!row) throw new Error(`workshop_template_not_found:${idOrSlug}`);
  return mapTemplate(row, await fetchAssets(client, row.id, version));
}

async function writeVersionSnapshot(
  client: PoolClient,
  template: WorkshopTemplateRecord,
  context: WorkshopMutationContext,
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.workshop_template_versions(
        client_id,
        workshop_id,
        version,
        status,
        snapshot_jsonb,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      ON CONFLICT (workshop_id, version)
      DO UPDATE SET snapshot_jsonb = EXCLUDED.snapshot_jsonb, status = EXCLUDED.status
      RETURNING id
    `,
    [
      template.clientId,
      template.id,
      template.version,
      template.status,
      JSON.stringify(template),
      context.userId,
    ],
  );
  return rows[0].id;
}

export async function getWorkshopTemplate(idOrSlug: string, version?: number): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction((client) => fetchTemplate(client, idOrSlug, version));
}

export async function listWorkshopTemplates(filters: {
  status?: string;
  clientId?: string | null;
  gateId?: string;
  limit?: number;
} = {}): Promise<WorkshopTemplateRecord[]> {
  return withWorkshopTransaction(async (client) => {
    const clauses = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    if (filters.status) {
      values.push(filters.status);
      clauses.push(`status = $${values.length}`);
    }
    if (filters.clientId) {
      values.push(filters.clientId);
      clauses.push(`(client_id IS NULL OR client_id = $${values.length})`);
    }
    if (filters.gateId) {
      values.push(filters.gateId);
      clauses.push(`owning_gate_id = $${values.length}`);
    }
    values.push(Math.min(Math.max(filters.limit ?? 50, 1), 200));
    const { rows } = await client.query<TemplateRow>(
      `
        SELECT *
        FROM public.workshop_templates
        WHERE ${clauses.join(' AND ')}
        ORDER BY updated_at DESC
        LIMIT $${values.length}
      `,
      values,
    );
    const out: WorkshopTemplateRecord[] = [];
    for (const row of rows) {
      out.push(mapTemplate(row, await fetchAssets(client, row.id)));
    }
    return out;
  });
}

export async function createWorkshopTemplate(
  input: WorkshopTemplateInput,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  const slug = normalizeSlug(input.slug || input.name);
  const name = input.name.trim();
  if (!slug) throw new Error('slug_required');
  if (!name) throw new Error('name_required');
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error('duration_minutes_required');
  }

  return withWorkshopTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO public.workshop_templates(
          client_id,
          slug,
          name,
          duration_minutes,
          owning_gate_id,
          hypothesis_to_test,
          stakeholder_map_jsonb,
          facilitator_tactics_jsonb,
          vertical_overlays,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $10)
        RETURNING id
      `,
      [
        input.clientId ?? context.clientId ?? null,
        slug,
        name,
        input.durationMinutes,
        input.owningGateId ?? null,
        input.hypothesisToTest?.trim() ?? '',
        JSON.stringify(input.stakeholderMap ?? {}),
        JSON.stringify(input.facilitatorTactics ?? {}),
        input.verticalOverlays ?? [],
        context.userId,
      ],
    );
    const template = await fetchTemplate(client, rows[0].id);
    await writeVersionSnapshot(client, template, context);
    return template;
  });
}

export async function updateWorkshopTemplate(
  idOrSlug: string,
  input: Partial<WorkshopTemplateInput>,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction(async (client) => {
    const before = await fetchTemplate(client, idOrSlug);
    if (before.status === 'published') {
      throw new Error('published_workshops_must_be_retired_or_versioned');
    }
    const nextVersion = before.version + 1;
    const parentVersionId = await writeVersionSnapshot(client, before, context);
    await client.query(
      `
        UPDATE public.workshop_templates
        SET name = $2,
            duration_minutes = $3,
            version = $4,
            parent_version_id = $5,
            owning_gate_id = $6,
            hypothesis_to_test = $7,
            stakeholder_map_jsonb = $8::jsonb,
            facilitator_tactics_jsonb = $9::jsonb,
            vertical_overlays = $10,
            updated_by = $11
        WHERE id = $1
      `,
      [
        before.id,
        input.name?.trim() || before.name,
        input.durationMinutes ?? before.durationMinutes,
        nextVersion,
        parentVersionId,
        input.owningGateId ?? before.owningGateId,
        input.hypothesisToTest ?? before.hypothesisToTest,
        JSON.stringify(input.stakeholderMap ?? before.stakeholderMap),
        JSON.stringify(input.facilitatorTactics ?? before.facilitatorTactics),
        input.verticalOverlays ?? before.verticalOverlays,
        context.userId,
      ],
    );
    const after = await fetchTemplate(client, before.id);
    await writeVersionSnapshot(client, after, context);
    return after;
  });
}

export async function addWorkshopAsset(
  idOrSlug: string,
  input: WorkshopAssetInput,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  const name = input.name.trim();
  if (!name) throw new Error('asset_name_required');
  if (!input.contentText?.trim() && !input.contentBlobRef?.trim()) {
    throw new Error('asset_content_required');
  }

  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    if (template.status === 'published') {
      throw new Error('published_workshops_must_be_retired_or_versioned');
    }
    await client.query(
      `
        INSERT INTO public.workshop_template_assets(
          client_id,
          workshop_id,
          asset_type,
          sequence_index,
          name,
          format,
          content_text,
          content_blob_ref,
          schema_jsonb,
          time_box_minutes,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $11)
        ON CONFLICT (workshop_id, sequence_index)
        DO UPDATE SET
          asset_type = EXCLUDED.asset_type,
          name = EXCLUDED.name,
          format = EXCLUDED.format,
          content_text = EXCLUDED.content_text,
          content_blob_ref = EXCLUDED.content_blob_ref,
          schema_jsonb = EXCLUDED.schema_jsonb,
          time_box_minutes = EXCLUDED.time_box_minutes,
          updated_by = EXCLUDED.updated_by,
          deleted_at = NULL
      `,
      [
        template.clientId,
        template.id,
        input.assetType,
        input.sequenceIndex,
        name,
        input.format.trim() || 'markdown',
        input.contentText?.trim() || null,
        input.contentBlobRef?.trim() || null,
        JSON.stringify(input.schema ?? {}),
        input.timeBoxMinutes ?? null,
        context.userId,
      ],
    );
    const after = await fetchTemplate(client, template.id);
    await writeVersionSnapshot(client, after, context);
    return after;
  });
}

export async function submitWorkshopTemplate(
  idOrSlug: string,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(`UPDATE public.workshop_templates SET status = 'in_review', updated_by = $2 WHERE id = $1`, [
      template.id,
      context.userId,
    ]);
    await client.query(
      `
        INSERT INTO public.workshop_template_review_state(workshop_id, client_id, decision, submitted_by_id, context_jsonb)
        VALUES ($1, $2, 'submitted', $3, $4::jsonb)
      `,
      [template.id, template.clientId, context.userId, JSON.stringify({ version: template.version })],
    );
    const after = await fetchTemplate(client, template.id);
    await writeVersionSnapshot(client, after, context);
    return after;
  });
}

export async function addWorkshopReview(
  idOrSlug: string,
  review: WorkshopReviewInput,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(
      `
        INSERT INTO public.workshop_template_review_state(
          workshop_id,
          client_id,
          decision,
          reviewer_id,
          comment,
          context_jsonb
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        template.id,
        template.clientId,
        review.decision,
        context.userId,
        review.comment ?? null,
        JSON.stringify({ version: template.version }),
      ],
    );
    return template;
  });
}

export async function approveWorkshopTemplate(
  idOrSlug: string,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    const lint = await lintWorkshopTemplateDepth(template, context.userId);
    if (!lint.pass || lint.score < 8) {
      throw new Error(`depth_lint_blocked:${lint.score}`);
    }
    await client.query(
      `
        UPDATE public.workshop_templates
        SET status = 'approved',
            depth_score = $2,
            approved_by = $3,
            updated_by = $3
        WHERE id = $1
      `,
      [template.id, lint.score, context.userId],
    );
    await client.query(
      `
        INSERT INTO public.workshop_template_review_state(
          workshop_id,
          client_id,
          decision,
          reviewer_id,
          depth_score,
          context_jsonb
        )
        VALUES ($1, $2, 'approved', $3, $4, $5::jsonb)
      `,
      [
        template.id,
        template.clientId,
        context.userId,
        lint.score,
        JSON.stringify({ findings: lint.findings, reasoning: lint.reasoning }),
      ],
    );
    const after = await fetchTemplate(client, template.id);
    await writeVersionSnapshot(client, after, context);
    return after;
  });
}

export async function publishWorkshopTemplate(
  idOrSlug: string,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    const lint = await lintWorkshopTemplateDepth(template, context.userId);
    if (!lint.pass || lint.score < 8) {
      throw new Error(`depth_lint_blocked:${lint.score}`);
    }
    await client.query(
      `
        UPDATE public.workshop_templates
        SET status = 'published',
            depth_score = $2,
            published_at = coalesce(published_at, now()),
            updated_by = $3
        WHERE id = $1
      `,
      [template.id, lint.score, context.userId],
    );
    const after = await fetchTemplate(client, template.id);
    await writeVersionSnapshot(client, after, context);
    return after;
  });
}

export async function retireWorkshopTemplate(
  idOrSlug: string,
  context: WorkshopMutationContext,
): Promise<WorkshopTemplateRecord> {
  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(
      `
        UPDATE public.workshop_templates
        SET status = 'retired',
            retired_at = coalesce(retired_at, now()),
            updated_by = $2
        WHERE id = $1
      `,
      [template.id, context.userId],
    );
    const after = await fetchTemplate(client, template.id);
    await writeVersionSnapshot(client, after, context);
    return after;
  });
}

export async function createWorkshopInstance(
  input: WorkshopInstanceInput,
  context: WorkshopMutationContext,
): Promise<WorkshopInstanceRecord> {
  const clientId = input.clientId ?? context.clientId;
  if (!clientId) throw new Error('client_id_required');
  return withWorkshopTransaction(async (client) => {
    const template = await fetchTemplate(client, input.templateId);
    const versionPinned = input.versionPinned ?? template.version;
    const { rows } = await client.query<InstanceRow>(
      `
        INSERT INTO public.workshop_instances(
          template_id,
          version_pinned,
          client_id,
          move_instance_id,
          gate_id,
          scheduled_at,
          status,
          decisions_jsonb,
          dissent_log_jsonb,
          post_read_sent_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $11)
        RETURNING
          *,
          (SELECT name FROM public.workshop_templates WHERE id = template_id) AS template_name,
          (SELECT slug FROM public.workshop_templates WHERE id = template_id) AS template_slug
      `,
      [
        template.id,
        versionPinned,
        clientId,
        input.moveInstanceId ?? null,
        input.gateId ?? null,
        input.scheduledAt ?? null,
        input.status ?? 'scheduled',
        JSON.stringify(input.decisions ?? []),
        JSON.stringify(input.dissentLog ?? []),
        input.postReadSentAt ?? null,
        context.userId,
      ],
    );
    return mapInstance(rows[0]);
  });
}

export async function listWorkshopInstances(filters: {
  clientId: string;
  moveInstanceId?: string;
  gateId?: string;
  limit?: number;
}): Promise<WorkshopInstanceRecord[]> {
  return withWorkshopTransaction(async (client) => {
    const clauses = ['wi.deleted_at IS NULL', 'wi.client_id = $1'];
    const values: unknown[] = [filters.clientId];
    if (filters.moveInstanceId) {
      values.push(filters.moveInstanceId);
      clauses.push(`wi.move_instance_id = $${values.length}`);
    }
    if (filters.gateId) {
      values.push(filters.gateId);
      clauses.push(`wi.gate_id = $${values.length}`);
    }
    values.push(Math.min(Math.max(filters.limit ?? 50, 1), 200));
    const { rows } = await client.query<InstanceRow>(
      `
        SELECT
          wi.*,
          wt.name AS template_name,
          wt.slug AS template_slug
        FROM public.workshop_instances wi
        LEFT JOIN public.workshop_templates wt ON wt.id = wi.template_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY wi.scheduled_at DESC NULLS LAST, wi.created_at DESC
        LIMIT $${values.length}
      `,
      values,
    );
    return rows.map(mapInstance);
  });
}
