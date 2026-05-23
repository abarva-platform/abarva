import type { PoolClient } from 'pg';
import { firstRow, toJsonRecord, toStringArray, withInstrumentTransaction } from './db';
import { lintInstrumentTemplateDepth } from './depth-lint';
import type {
  DiscoveryKitItem,
  InstrumentMutationContext,
  InstrumentReviewInput,
  InstrumentTemplateInput,
  InstrumentTemplateRecord,
  InstrumentTemplateStatus,
} from './types';

type InstrumentTemplateRow = {
  id: string;
  client_id: string | null;
  slug: string;
  name: string;
  category: string;
  version: number;
  parent_version_id: string | null;
  status: InstrumentTemplateStatus;
  depth_score: string | number;
  format: InstrumentTemplateRecord['format'];
  schema_jsonb: unknown;
  content_template_text: string;
  content_blob_ref: string | null;
  sample_size_math_jsonb: unknown;
  bias_controls_jsonb: unknown;
  privacy_block: string;
  validation_rules_jsonb: unknown;
  triangulation_plan_jsonb: unknown;
  edge_case_guide_jsonb: unknown;
  refresh_cadence: string;
  t_tier: number;
  owner_role: string;
  time_to_complete_days: number;
  vertical_overlays: string[] | null;
  primary_author_id: string | null;
  approved_by_id: string | null;
  published_at: string | null;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
};

type DiscoveryKitRow = {
  assignment_id: string;
  move_id: string;
  template_id: string;
  template_version: number;
  slug: string;
  name: string;
  category: string;
  format: InstrumentTemplateRecord['format'];
  status: string;
  owner_name: string | null;
  owner_role: string;
  due_date: string | null;
  evidence_link: string | null;
  t_tier: number;
  completion_pct: string | number;
  gate_label: string | null;
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

function tierValue(value: number): 1 | 2 | 3 {
  return value === 1 || value === 2 ? value : 3;
}

function mapTemplate(row: InstrumentTemplateRow): InstrumentTemplateRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    version: row.version,
    parentVersionId: row.parent_version_id,
    status: row.status,
    depthScore: numberValue(row.depth_score),
    format: row.format,
    schema: toJsonRecord(row.schema_jsonb),
    contentTemplateText: row.content_template_text,
    contentBlobRef: row.content_blob_ref,
    sampleSizeMath: toJsonRecord(row.sample_size_math_jsonb),
    biasControls: toJsonRecord(row.bias_controls_jsonb),
    privacyBlock: row.privacy_block,
    validationRules: toJsonRecord(row.validation_rules_jsonb),
    triangulationPlan: toJsonRecord(row.triangulation_plan_jsonb),
    edgeCaseGuide: toJsonRecord(row.edge_case_guide_jsonb),
    refreshCadence: row.refresh_cadence,
    tTier: tierValue(row.t_tier),
    ownerRole: row.owner_role,
    timeToCompleteDays: row.time_to_complete_days,
    verticalOverlays: toStringArray(row.vertical_overlays),
    primaryAuthorId: row.primary_author_id,
    approvedById: row.approved_by_id,
    publishedAt: row.published_at,
    retiredAt: row.retired_at,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapKitItem(row: DiscoveryKitRow): DiscoveryKitItem {
  return {
    assignmentId: row.assignment_id,
    moveId: row.move_id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    slug: row.slug,
    name: row.name,
    category: row.category,
    format: row.format,
    status: row.status,
    ownerName: row.owner_name,
    ownerRole: row.owner_role,
    dueDate: row.due_date,
    evidenceLink: row.evidence_link,
    tTier: tierValue(row.t_tier),
    completionPct: numberValue(row.completion_pct),
    gateLabel: row.gate_label ?? 'Discovery',
  };
}

async function fetchTemplate(client: PoolClient, idOrSlug: string, version?: number): Promise<InstrumentTemplateRecord> {
  const values: unknown[] = [idOrSlug];
  const versionClause = version ? `AND version = $2` : '';
  if (version) values.push(version);
  const { rows } = await client.query<InstrumentTemplateRow>(
    `
      SELECT *
      FROM public.instrument_templates
      WHERE (id::text = $1 OR slug = $1)
      ${versionClause}
      ORDER BY version DESC
      LIMIT 1
    `,
    values,
  );
  const row = firstRow(rows);
  if (!row) throw new Error(`instrument_template_not_found:${idOrSlug}`);
  return mapTemplate(row);
}

async function auditTemplate(
  client: PoolClient,
  eventType: string,
  context: InstrumentMutationContext,
  templateId: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await client.query(
    `
      INSERT INTO public.instrument_template_audit(event_type, context_jsonb, client_id, actor_id, template_id)
      VALUES ($1, $2::jsonb, $3, $4, $5)
    `,
    [eventType, JSON.stringify(extra), context.clientId ?? null, context.userId, templateId],
  );
}

async function snapshotTemplate(
  client: PoolClient,
  template: InstrumentTemplateRecord,
  context: InstrumentMutationContext,
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.instrument_template_versions(
        template_id,
        client_id,
        version,
        status,
        snapshot_jsonb,
        created_by_id
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      ON CONFLICT (template_id, version)
      DO UPDATE SET snapshot_jsonb = EXCLUDED.snapshot_jsonb, status = EXCLUDED.status
      RETURNING id
    `,
    [
      template.id,
      template.clientId,
      template.version,
      template.status,
      JSON.stringify(template),
      context.userId,
    ],
  );
  return rows[0].id;
}

export async function getInstrumentTemplate(
  idOrSlug: string,
  version?: number,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction((client) => fetchTemplate(client, idOrSlug, version));
}

export async function listInstrumentTemplates(filters: {
  status?: string;
  category?: string;
  clientId?: string | null;
  limit?: number;
} = {}): Promise<InstrumentTemplateRecord[]> {
  return withInstrumentTransaction(async (client) => {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.status) {
      values.push(filters.status);
      clauses.push(`status = $${values.length}`);
    }
    if (filters.category) {
      values.push(filters.category);
      clauses.push(`category = $${values.length}`);
    }
    if (filters.clientId) {
      values.push(filters.clientId);
      clauses.push(`(client_id IS NULL OR client_id = $${values.length})`);
    }
    values.push(Math.min(Math.max(filters.limit ?? 50, 1), 200));
    const { rows } = await client.query<InstrumentTemplateRow>(
      `
        SELECT *
        FROM public.instrument_templates
        ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
        ORDER BY updated_at DESC
        LIMIT $${values.length}
      `,
      values,
    );
    return rows.map(mapTemplate);
  });
}

export async function createInstrumentTemplate(
  input: InstrumentTemplateInput,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  const slug = normalizeSlug(input.slug || input.name);
  if (!slug) throw new Error('slug_required');
  if (!input.name.trim()) throw new Error('name_required');

  return withInstrumentTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO public.instrument_templates(
          client_id, slug, name, category, status, depth_score, format,
          schema_jsonb, content_template_text, content_blob_ref,
          sample_size_math_jsonb, bias_controls_jsonb, privacy_block,
          validation_rules_jsonb, triangulation_plan_jsonb, edge_case_guide_jsonb,
          refresh_cadence, t_tier, owner_role, time_to_complete_days,
          vertical_overlays, primary_author_id
        )
        VALUES (
          $1, $2, $3, $4, 'draft', $5, $6,
          $7::jsonb, $8, $9,
          $10::jsonb, $11::jsonb, $12,
          $13::jsonb, $14::jsonb, $15::jsonb,
          $16, $17, $18, $19,
          $20, $21
        )
        RETURNING id
      `,
      [
        input.clientId ?? null,
        slug,
        input.name.trim(),
        input.category.trim() || 'discovery',
        input.depthScore ?? 0,
        input.format,
        JSON.stringify(input.schema ?? {}),
        input.contentTemplateText ?? '',
        input.contentBlobRef ?? null,
        JSON.stringify(input.sampleSizeMath ?? {}),
        JSON.stringify(input.biasControls ?? {}),
        input.privacyBlock ?? '',
        JSON.stringify(input.validationRules ?? {}),
        JSON.stringify(input.triangulationPlan ?? {}),
        JSON.stringify(input.edgeCaseGuide ?? {}),
        input.refreshCadence ?? '',
        input.tTier,
        input.ownerRole ?? '',
        input.timeToCompleteDays ?? 1,
        input.verticalOverlays ?? [],
        context.userId,
      ],
    );
    const template = await fetchTemplate(client, rows[0].id);
    await snapshotTemplate(client, template, context);
    await auditTemplate(client, 'instrument_template_created', context, template.id, { slug });
    return template;
  });
}

export async function updateInstrumentTemplate(
  idOrSlug: string,
  input: Partial<InstrumentTemplateInput>,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction(async (client) => {
    const before = await fetchTemplate(client, idOrSlug);
    if (before.status === 'published') {
      throw new Error('published_instruments_must_be_retired_or_versioned');
    }
    const nextVersion = before.version + 1;
    const parentVersionId = await snapshotTemplate(client, before, context);
    await client.query(
      `
        UPDATE public.instrument_templates
        SET client_id = $2,
            name = $3,
            category = $4,
            version = $5,
            parent_version_id = $6,
            depth_score = $7,
            format = $8,
            schema_jsonb = $9::jsonb,
            content_template_text = $10,
            content_blob_ref = $11,
            sample_size_math_jsonb = $12::jsonb,
            bias_controls_jsonb = $13::jsonb,
            privacy_block = $14,
            validation_rules_jsonb = $15::jsonb,
            triangulation_plan_jsonb = $16::jsonb,
            edge_case_guide_jsonb = $17::jsonb,
            refresh_cadence = $18,
            t_tier = $19,
            owner_role = $20,
            time_to_complete_days = $21,
            vertical_overlays = $22
        WHERE id = $1
      `,
      [
        before.id,
        input.clientId === undefined ? before.clientId : input.clientId,
        input.name?.trim() || before.name,
        input.category?.trim() || before.category,
        nextVersion,
        parentVersionId,
        input.depthScore ?? before.depthScore,
        input.format ?? before.format,
        JSON.stringify(input.schema ?? before.schema),
        input.contentTemplateText ?? before.contentTemplateText,
        input.contentBlobRef === undefined ? before.contentBlobRef : input.contentBlobRef,
        JSON.stringify(input.sampleSizeMath ?? before.sampleSizeMath),
        JSON.stringify(input.biasControls ?? before.biasControls),
        input.privacyBlock ?? before.privacyBlock,
        JSON.stringify(input.validationRules ?? before.validationRules),
        JSON.stringify(input.triangulationPlan ?? before.triangulationPlan),
        JSON.stringify(input.edgeCaseGuide ?? before.edgeCaseGuide),
        input.refreshCadence ?? before.refreshCadence,
        input.tTier ?? before.tTier,
        input.ownerRole ?? before.ownerRole,
        input.timeToCompleteDays ?? before.timeToCompleteDays,
        input.verticalOverlays ?? before.verticalOverlays,
      ],
    );
    const after = await fetchTemplate(client, before.id);
    await snapshotTemplate(client, after, context);
    await auditTemplate(client, 'instrument_template_updated', context, after.id, { version: nextVersion });
    return after;
  });
}

export async function submitInstrumentTemplate(
  idOrSlug: string,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(`UPDATE public.instrument_templates SET status = 'in_review' WHERE id = $1`, [template.id]);
    await client.query(
      `
        INSERT INTO public.instrument_template_review_state(template_id, client_id, decision, submitted_by_id, context_jsonb)
        VALUES ($1, $2, 'submitted', $3, $4::jsonb)
      `,
      [template.id, template.clientId, context.userId, JSON.stringify({ version: template.version })],
    );
    const after = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, after, context);
    await auditTemplate(client, 'instrument_template_submitted', context, after.id);
    return after;
  });
}

export async function addInstrumentReview(
  idOrSlug: string,
  review: InstrumentReviewInput,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(
      `
        INSERT INTO public.instrument_template_review_state(template_id, client_id, decision, reviewer_id, comment, context_jsonb)
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
    await auditTemplate(client, 'instrument_review_added', context, template.id, { decision: review.decision });
    return template;
  });
}

export async function approveInstrumentTemplate(
  idOrSlug: string,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    const lint = await lintInstrumentTemplateDepth(template);
    if (!lint.pass || lint.score < 8) {
      await auditTemplate(client, 'instrument_template_depth_blocked', context, template.id, { ...lint });
      throw new Error(`depth_lint_blocked:${lint.score}`);
    }
    await client.query(
      `
        UPDATE public.instrument_templates
        SET status = 'approved', approved_by_id = $2, depth_score = $3
        WHERE id = $1
      `,
      [template.id, context.userId, lint.score],
    );
    await client.query(
      `
        INSERT INTO public.instrument_template_review_state(template_id, client_id, decision, reviewer_id, depth_score, context_jsonb)
        VALUES ($1, $2, 'approved', $3, $4, $5::jsonb)
      `,
      [template.id, template.clientId, context.userId, lint.score, JSON.stringify({ findings: lint.findings ?? [] })],
    );
    const after = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, after, context);
    await auditTemplate(client, 'instrument_template_approved', context, after.id, { depthScore: lint.score });
    return after;
  });
}

export async function publishInstrumentTemplate(
  idOrSlug: string,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    const lint = await lintInstrumentTemplateDepth(template);
    if (!lint.pass || lint.score < 8) {
      await auditTemplate(client, 'instrument_template_depth_blocked', context, template.id, { ...lint });
      throw new Error(`depth_lint_blocked:${lint.score}`);
    }
    await client.query(
      `
        UPDATE public.instrument_templates
        SET status = 'published',
            depth_score = $2,
            published_at = coalesce(published_at, now())
        WHERE id = $1
      `,
      [template.id, lint.score],
    );
    const after = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, after, context);
    await auditTemplate(client, 'instrument_template_published', context, after.id, { depthScore: lint.score });
    return after;
  });
}

export async function retireInstrumentTemplate(
  idOrSlug: string,
  context: InstrumentMutationContext,
): Promise<InstrumentTemplateRecord> {
  return withInstrumentTransaction(async (client) => {
    const template = await fetchTemplate(client, idOrSlug);
    await client.query(
      `
        UPDATE public.instrument_templates
        SET status = 'retired',
            retired_at = coalesce(retired_at, now())
        WHERE id = $1
      `,
      [template.id],
    );
    const after = await fetchTemplate(client, template.id);
    await snapshotTemplate(client, after, context);
    await auditTemplate(client, 'instrument_template_retired', context, after.id);
    return after;
  });
}

export async function listDiscoveryKitForMove(
  moveId: string,
  clientId: string,
): Promise<DiscoveryKitItem[]> {
  return withInstrumentTransaction(async (client) => {
    const { rows } = await client.query<DiscoveryKitRow>(
      `
        SELECT
          di.id AS assignment_id,
          di.move_id,
          it.id AS template_id,
          it.version AS template_version,
          it.slug,
          it.name,
          it.category,
          it.format,
          di.status,
          p.name AS owner_name,
          it.owner_role,
          di.due_date,
          di.evidence_link,
          di.t_tier,
          di.completion_pct,
          COALESCE(gc.title, 'Discovery') AS gate_label
        FROM public.discovery_instruments di
        JOIN public.instrument_templates it ON it.id = di.instrument_template_id
        LEFT JOIN public.persons p ON p.id = di.owner_id
        LEFT JOIN LATERAL (
          SELECT title
          FROM public.gate_criteria
          WHERE program_id = di.move_id
          ORDER BY stage_key ASC, criterion_id ASC
          LIMIT 1
        ) gc ON true
        WHERE di.client_id = $1
          AND di.move_id = $2
          AND di.deleted_at IS NULL
        ORDER BY di.t_tier ASC, di.due_date ASC NULLS LAST, it.name ASC
      `,
      [clientId, moveId],
    );
    return rows.map(mapKitItem);
  });
}

export async function updateDiscoveryInstrumentEvidence(
  assignmentId: string,
  input: { evidenceLink?: string | null; completionPct?: number; status?: string },
  context: InstrumentMutationContext,
): Promise<DiscoveryKitItem | null> {
  if (!context.clientId) throw new Error('client_id_required');
  return withInstrumentTransaction(async (client) => {
    await client.query(
      `
        UPDATE public.discovery_instruments
        SET evidence_link = COALESCE($3, evidence_link),
            completion_pct = COALESCE($4, completion_pct),
            status = COALESCE($5::discovery_instrument_status, status),
            updated_by = $6
        WHERE id = $1
          AND client_id = $2
          AND deleted_at IS NULL
      `,
      [
        assignmentId,
        context.clientId,
        input.evidenceLink ?? null,
        input.completionPct ?? null,
        input.status ?? null,
        context.userId,
      ],
    );
    await client.query(
      `
        INSERT INTO public.instrument_template_audit(event_type, client_id, actor_id, context_jsonb)
        VALUES ('discovery_instrument_evidence_updated', $1, $2, $3::jsonb)
      `,
      [context.clientId, context.userId, JSON.stringify({ assignmentId, ...input })],
    );
    const items = await client.query<DiscoveryKitRow>(
      `
        SELECT
          di.id AS assignment_id,
          di.move_id,
          it.id AS template_id,
          it.version AS template_version,
          it.slug,
          it.name,
          it.category,
          it.format,
          di.status,
          p.name AS owner_name,
          it.owner_role,
          di.due_date,
          di.evidence_link,
          di.t_tier,
          di.completion_pct,
          'Discovery' AS gate_label
        FROM public.discovery_instruments di
        JOIN public.instrument_templates it ON it.id = di.instrument_template_id
        LEFT JOIN public.persons p ON p.id = di.owner_id
        WHERE di.id = $1
          AND di.client_id = $2
        LIMIT 1
      `,
      [assignmentId, context.clientId],
    );
    return items.rows[0] ? mapKitItem(items.rows[0]) : null;
  });
}
