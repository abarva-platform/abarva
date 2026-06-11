/*
 * AbarVa Confidential — Trade Secret (TS-03)
 * Protected under the AbarVa Trade Secret Policy (docs/ip/trade-secret-policy.md) and
 * Trade Secret Register (docs/ip/trade-secret-register.md). Do not distribute externally
 * or expose outside the tenant boundary. Access requires NDA + IP assignment (T075).
 */
import type { PoolClient } from 'pg';
import { uploadCorpusSearchDocument } from './azure-search';
import { firstRow, toJsonArray, toJsonRecord, toStringArray, withCorpusTransaction } from './db';
import { lintCorpusPatternDepth } from './depth-lint';
import { embedPatternText } from './embedding';
import type {
  CorpusMutationContext,
  CorpusPatternInput,
  CorpusPatternRecord,
  CorpusReviewInput,
  CorpusStructuredContent,
} from './types';

type CorpusPatternRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CorpusPatternRecord['status'];
  confidence: string | number;
  version: number;
  parent_version_id: string | null;
  primary_author_id: string | null;
  approved_by_id: string | null;
  published_at: string | null;
  retired_at: string | null;
  search_doc_id: string | null;
  depth_score: string | number;
  vertical_overlays: string[] | null;
  region_overlays: string[] | null;
  applicable_horizons: string[] | null;
  markdown_body: string | null;
  claims_jsonb: unknown;
  evidence_jsonb: unknown;
  counterarguments_jsonb: unknown;
  synthesis_jsonb: unknown;
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

function mapPattern(row: CorpusPatternRow): CorpusPatternRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    confidence: numberValue(row.confidence, 0.75),
    version: row.version,
    parentVersionId: row.parent_version_id,
    primaryAuthorId: row.primary_author_id,
    approvedById: row.approved_by_id,
    publishedAt: row.published_at,
    retiredAt: row.retired_at,
    searchDocId: row.search_doc_id,
    depthScore: numberValue(row.depth_score, 0),
    verticalOverlays: toStringArray(row.vertical_overlays),
    regionOverlays: toStringArray(row.region_overlays),
    applicableHorizons: toStringArray(row.applicable_horizons),
    markdownBody: row.markdown_body ?? '',
    claims: toJsonArray(row.claims_jsonb),
    evidence: toJsonArray(row.evidence_jsonb),
    counterarguments: toJsonArray(row.counterarguments_jsonb),
    synthesis: toJsonRecord(row.synthesis_jsonb),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function fetchPattern(client: PoolClient, idOrSlug: string): Promise<CorpusPatternRecord> {
  const { rows } = await client.query<CorpusPatternRow>(
    `
      SELECT
        p.*,
        c.markdown_body,
        c.claims_jsonb,
        c.evidence_jsonb,
        c.counterarguments_jsonb,
        c.synthesis_jsonb
      FROM public.corpus_patterns p
      LEFT JOIN public.corpus_pattern_content c ON c.pattern_id = p.id
      WHERE p.id::text = $1 OR p.slug = $1
      LIMIT 1
    `,
    [idOrSlug],
  );
  const row = firstRow(rows);
  if (!row) throw new Error(`corpus_pattern_not_found:${idOrSlug}`);
  return mapPattern(row);
}

async function writeTelemetry(
  client: PoolClient,
  eventType: string,
  context: CorpusMutationContext,
  patternId: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await client.query(
    `
      INSERT INTO public.corpus_telemetry(event_type, context_jsonb, client_id, actor_id, pattern_id)
      VALUES ($1, $2::jsonb, $3, $4, $5)
    `,
    [eventType, JSON.stringify(extra), context.clientId ?? null, context.userId, patternId],
  );
}

async function snapshotPattern(
  client: PoolClient,
  pattern: CorpusPatternRecord,
  context: CorpusMutationContext,
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO public.corpus_pattern_versions(
        pattern_id,
        version,
        status,
        snapshot_jsonb,
        created_by_id
      )
      VALUES ($1, $2, $3, $4::jsonb, $5)
      ON CONFLICT (pattern_id, version)
      DO UPDATE SET snapshot_jsonb = EXCLUDED.snapshot_jsonb, status = EXCLUDED.status
      RETURNING id
    `,
    [
      pattern.id,
      pattern.version,
      pattern.status,
      JSON.stringify(pattern),
      context.userId,
    ],
  );
  return rows[0].id;
}

function structured(input: CorpusPatternInput): Required<CorpusStructuredContent> {
  return {
    claims: input.structured?.claims ?? [],
    evidence: input.structured?.evidence ?? [],
    counterarguments: input.structured?.counterarguments ?? [],
    synthesis: input.structured?.synthesis ?? {},
  };
}

export async function getPattern(idOrSlug: string): Promise<CorpusPatternRecord> {
  return withCorpusTransaction((client) => fetchPattern(client, idOrSlug));
}

export async function listPatterns(filters: {
  status?: string;
  category?: string;
  limit?: number;
} = {}): Promise<CorpusPatternRecord[]> {
  return withCorpusTransaction(async (client) => {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.status) {
      values.push(filters.status);
      clauses.push(`p.status = $${values.length}`);
    }
    if (filters.category) {
      values.push(filters.category);
      clauses.push(`p.category = $${values.length}`);
    }
    values.push(Math.min(Math.max(filters.limit ?? 50, 1), 200));
    const { rows } = await client.query<CorpusPatternRow>(
      `
        SELECT p.*, c.markdown_body, c.claims_jsonb, c.evidence_jsonb, c.counterarguments_jsonb, c.synthesis_jsonb
        FROM public.corpus_patterns p
        LEFT JOIN public.corpus_pattern_content c ON c.pattern_id = p.id
        ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
        ORDER BY p.updated_at DESC
        LIMIT $${values.length}
      `,
      values,
    );
    return rows.map(mapPattern);
  });
}

export async function createPattern(
  input: CorpusPatternInput,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  const body = input.markdownBody.trim();
  const content = structured(input);
  const slug = normalizeSlug(input.slug || input.title);
  if (!slug) throw new Error('slug_required');
  if (!input.title.trim()) throw new Error('title_required');

  return withCorpusTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO public.corpus_patterns(
          slug, title, category, status, confidence, depth_score,
          vertical_overlays, region_overlays, applicable_horizons, primary_author_id
        )
        VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        slug,
        input.title.trim(),
        input.category.trim() || 'uncategorized',
        input.confidence ?? 0.75,
        input.depthScore ?? 0,
        input.verticalOverlays ?? [],
        input.regionOverlays ?? [],
        input.applicableHorizons ?? [],
        context.userId,
      ],
    );
    const id = rows[0].id;
    await client.query(
      `
        INSERT INTO public.corpus_pattern_content(
          pattern_id, version, markdown_body, claims_jsonb, evidence_jsonb, counterarguments_jsonb, synthesis_jsonb
        )
        VALUES ($1, 1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb)
      `,
      [
        id,
        body,
        JSON.stringify(content.claims),
        JSON.stringify(content.evidence),
        JSON.stringify(content.counterarguments),
        JSON.stringify(content.synthesis),
      ],
    );
    const pattern = await fetchPattern(client, id);
    await snapshotPattern(client, pattern, context);
    await writeTelemetry(client, 'corpus_pattern_created', context, id, { slug });
    return pattern;
  });
}

export async function updatePattern(
  idOrSlug: string,
  input: Partial<CorpusPatternInput>,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  return withCorpusTransaction(async (client) => {
    const before = await fetchPattern(client, idOrSlug);
    if (before.status === 'published') {
      throw new Error('published_patterns_must_be_retired_or_versioned');
    }
    const nextVersion = before.version + 1;
    const content: Required<CorpusStructuredContent> = {
      claims: input.structured?.claims ?? before.claims,
      evidence: input.structured?.evidence ?? before.evidence,
      counterarguments: input.structured?.counterarguments ?? before.counterarguments,
      synthesis: input.structured?.synthesis ?? before.synthesis,
    };
    const parentVersionId = await snapshotPattern(client, before, context);
    await client.query(
      `
        UPDATE public.corpus_patterns
        SET title = $2,
            category = $3,
            confidence = $4,
            version = $5,
            parent_version_id = $6,
            depth_score = $7,
            vertical_overlays = $8,
            region_overlays = $9,
            applicable_horizons = $10
        WHERE id = $1
      `,
      [
        before.id,
        input.title?.trim() || before.title,
        input.category?.trim() || before.category,
        input.confidence ?? before.confidence,
        nextVersion,
        parentVersionId,
        input.depthScore ?? before.depthScore,
        input.verticalOverlays ?? before.verticalOverlays,
        input.regionOverlays ?? before.regionOverlays,
        input.applicableHorizons ?? before.applicableHorizons,
      ],
    );
    await client.query(
      `
        UPDATE public.corpus_pattern_content
        SET version = $2,
            markdown_body = $3,
            claims_jsonb = $4::jsonb,
            evidence_jsonb = $5::jsonb,
            counterarguments_jsonb = $6::jsonb,
            synthesis_jsonb = $7::jsonb
        WHERE pattern_id = $1
      `,
      [
        before.id,
        nextVersion,
        input.markdownBody ?? before.markdownBody,
        JSON.stringify(content.claims),
        JSON.stringify(content.evidence),
        JSON.stringify(content.counterarguments),
        JSON.stringify(content.synthesis),
      ],
    );
    const after = await fetchPattern(client, before.id);
    await snapshotPattern(client, after, context);
    await writeTelemetry(client, 'corpus_pattern_updated', context, before.id, { version: nextVersion });
    return after;
  });
}

export async function submitForReview(
  idOrSlug: string,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  return withCorpusTransaction(async (client) => {
    const pattern = await fetchPattern(client, idOrSlug);
    await client.query(`UPDATE public.corpus_patterns SET status = 'in_review' WHERE id = $1`, [pattern.id]);
    await client.query(
      `
        INSERT INTO public.corpus_review_state(pattern_id, decision, submitted_by_id, context_jsonb)
        VALUES ($1, 'submitted', $2, $3::jsonb)
      `,
      [pattern.id, context.userId, JSON.stringify({ version: pattern.version })],
    );
    const after = await fetchPattern(client, pattern.id);
    await snapshotPattern(client, after, context);
    await writeTelemetry(client, 'corpus_pattern_submitted', context, pattern.id);
    return after;
  });
}

export async function addReview(
  idOrSlug: string,
  review: CorpusReviewInput,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  return withCorpusTransaction(async (client) => {
    const pattern = await fetchPattern(client, idOrSlug);
    await client.query(
      `
        INSERT INTO public.corpus_review_state(pattern_id, decision, reviewer_id, comment, context_jsonb)
        VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [pattern.id, review.decision, context.userId, review.comment ?? null, JSON.stringify({ version: pattern.version })],
    );
    await writeTelemetry(client, 'corpus_review_added', context, pattern.id, { decision: review.decision });
    return pattern;
  });
}

export async function approvePattern(
  idOrSlug: string,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  return withCorpusTransaction(async (client) => {
    const pattern = await fetchPattern(client, idOrSlug);
    const lint = await lintCorpusPatternDepth(pattern);
    if (!lint.pass || lint.score < 8) {
      await writeTelemetry(client, 'corpus_pattern_depth_blocked', context, pattern.id, { ...lint });
      throw new Error(`depth_lint_blocked:${lint.score}`);
    }
    await client.query(
      `
        UPDATE public.corpus_patterns
        SET status = 'approved', approved_by_id = $2, depth_score = $3
        WHERE id = $1
      `,
      [pattern.id, context.userId, lint.score],
    );
    await client.query(
      `
        INSERT INTO public.corpus_review_state(pattern_id, decision, reviewer_id, depth_score, context_jsonb)
        VALUES ($1, 'approved', $2, $3, $4::jsonb)
      `,
      [pattern.id, context.userId, lint.score, JSON.stringify({ findings: lint.findings ?? [] })],
    );
    const after = await fetchPattern(client, pattern.id);
    await snapshotPattern(client, after, context);
    await writeTelemetry(client, 'corpus_pattern_approved', context, pattern.id, { depthScore: lint.score });
    return after;
  });
}

export async function publishPattern(
  idOrSlug: string,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  const pattern = await withCorpusTransaction(async (client) => {
    const current = await fetchPattern(client, idOrSlug);
    const lint = await lintCorpusPatternDepth(current);
    if (!lint.pass || lint.score < 8) {
      await writeTelemetry(client, 'corpus_pattern_depth_blocked', context, current.id, { ...lint });
      throw new Error(`depth_lint_blocked:${lint.score}`);
    }
    await client.query(
      `
        UPDATE public.corpus_patterns
        SET status = 'published', depth_score = $2, published_at = coalesce(published_at, now())
        WHERE id = $1
      `,
      [current.id, lint.score],
    );
    const after = await fetchPattern(client, current.id);
    await snapshotPattern(client, after, context);
    await writeTelemetry(client, 'corpus_pattern_publish_started', context, after.id, { depthScore: lint.score });
    return after;
  });

  const clientId = context.clientId;
  if (!clientId) throw new Error('client_id_required_for_embedding_publish');
  const embedding = await embedPatternText({
    text: `${pattern.title}\n\n${pattern.markdownBody}`,
    clientId,
    userId: context.userId,
    patternId: pattern.id,
  });
  const searchDocId = await uploadCorpusSearchDocument({
    pattern,
    embedding: embedding.embedding,
    clientId,
    clientKey: context.clientKey,
  });

  return withCorpusTransaction(async (client) => {
    await client.query(
      `UPDATE public.corpus_patterns SET search_doc_id = $2 WHERE id = $1`,
      [pattern.id, searchDocId],
    );
    const after = await fetchPattern(client, pattern.id);
    await writeTelemetry(client, 'corpus_pattern_published', context, pattern.id, {
      searchDocId,
      embeddingAuditId: embedding.auditId,
    });
    return after;
  });
}

export async function retirePattern(
  idOrSlug: string,
  context: CorpusMutationContext,
): Promise<CorpusPatternRecord> {
  return withCorpusTransaction(async (client) => {
    const pattern = await fetchPattern(client, idOrSlug);
    await client.query(
      `UPDATE public.corpus_patterns SET status = 'retired', retired_at = coalesce(retired_at, now()) WHERE id = $1`,
      [pattern.id],
    );
    const after = await fetchPattern(client, pattern.id);
    await snapshotPattern(client, after, context);
    await writeTelemetry(client, 'corpus_pattern_retired', context, pattern.id);
    return after;
  });
}
