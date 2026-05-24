import { withCorpusClient } from '@/lib/corpus/db';
import {
  bindResolvedFunctionPackForArtifact,
  type FunctionPackBinding,
} from './function-pack-context-binding';
import {
  type FunctionPack,
  type FunctionPackFunctionKey,
  type FunctionPackIndustryKey,
  type MovesPhaseArtifact,
} from './function-pack-types';

export const FRAMEWORK_OVERLAY_FUNCTION_PACK_KIND = 'function-pack';

export interface FrameworkOverlayFunctionPackOptions {
  clientId?: string | null;
  versionPin?: number;
  includeDraft?: boolean;
}

interface FrameworkOverlayRow {
  id: string;
  client_id: string | null;
  vertical_key: string;
  function_key: string;
  overlay_kind: string;
  status: string;
  version: number;
  framework_jsonb: unknown;
  source_corpus_pattern_ids: string[] | null;
  depth_score: string | number;
}

export interface FrameworkOverlayFunctionPack {
  overlayId: string;
  clientId: string | null;
  verticalKey: FunctionPackIndustryKey;
  functionKey: FunctionPackFunctionKey;
  version: number;
  status: string;
  depthScore: number;
  sourceCorpusPatternIds: string[];
  pack: FunctionPack;
}

function numeric(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isFunctionPack(value: unknown): value is FunctionPack {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FunctionPack>;
  return (
    typeof candidate.industryKey === 'string' &&
    typeof candidate.functionKey === 'string' &&
    typeof candidate.functionLabel === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.operatingMetrics) &&
    Array.isArray(candidate.painThemes) &&
    Array.isArray(candidate.aiUseCaseArchetypes) &&
    Array.isArray(candidate.referenceSolutionPatterns) &&
    Boolean(candidate.valueModel) &&
    Boolean(candidate.vocabulary) &&
    Array.isArray(candidate.deliverableOutlines) &&
    Array.isArray(candidate.evidenceAnchors)
  );
}

function mapRow(row: FrameworkOverlayRow): FrameworkOverlayFunctionPack {
  if (!isFunctionPack(row.framework_jsonb)) {
    throw new Error(
      `framework_overlay_invalid_function_pack_payload:${row.vertical_key}:${row.function_key}:${row.version}`,
    );
  }

  return {
    overlayId: row.id,
    clientId: row.client_id,
    verticalKey: row.vertical_key as FunctionPackIndustryKey,
    functionKey: row.function_key,
    version: row.version,
    status: row.status,
    depthScore: numeric(row.depth_score),
    sourceCorpusPatternIds: stringArray(row.source_corpus_pattern_ids),
    pack: row.framework_jsonb,
  };
}

function unboundForMissingOverlay(
  industryKey: FunctionPackIndustryKey,
  functionKey: FunctionPackFunctionKey,
): FunctionPackBinding {
  return {
    bound: false,
    deliverableOutline: [],
    expectedMetrics: [],
    seedGaps: [],
    fallbackNote:
      `No published framework overlay Function Pack exists for ` +
      `(${industryKey}, ${functionKey}). The DB-backed cutover path does ` +
      `not fall back to in-code Function Pack content; this is a migration ` +
      `gap to close in the legacy content sweep.`,
  };
}

export async function resolveFrameworkOverlayFunctionPack(
  industryKey: FunctionPackIndustryKey,
  functionKey: FunctionPackFunctionKey,
  options: FrameworkOverlayFunctionPackOptions = {},
): Promise<FrameworkOverlayFunctionPack | null> {
  return withCorpusClient(async (client) => {
    const args: unknown[] = [
      industryKey,
      functionKey,
      FRAMEWORK_OVERLAY_FUNCTION_PACK_KIND,
      options.clientId ?? null,
    ];
    const clauses = [
      'vertical_key = $1',
      'function_key = $2',
      'overlay_kind = $3',
      '(client_id IS NULL OR ($4::uuid IS NOT NULL AND client_id = $4::uuid))',
    ];

    if (!options.includeDraft) {
      clauses.push(`status = 'published'`);
    }
    if (typeof options.versionPin === 'number') {
      args.push(Math.trunc(options.versionPin));
      clauses.push(`version = $${args.length}`);
    }

    const { rows } = await client.query<FrameworkOverlayRow>(
      `
        SELECT
          id,
          client_id,
          vertical_key,
          function_key,
          overlay_kind,
          status,
          version,
          framework_jsonb,
          source_corpus_pattern_ids,
          depth_score
        FROM public.framework_overlays
        WHERE ${clauses.join(' AND ')}
        ORDER BY
          CASE WHEN client_id = $4::uuid THEN 0 ELSE 1 END,
          version DESC,
          updated_at DESC
        LIMIT 1
      `,
      args,
    );

    return rows[0] ? mapRow(rows[0]) : null;
  });
}

export async function bindFrameworkOverlayFunctionPackForArtifact(
  industryKey: FunctionPackIndustryKey,
  functionKey: FunctionPackFunctionKey,
  artifact: MovesPhaseArtifact,
  tenantMetricKeys: readonly string[],
  options: FrameworkOverlayFunctionPackOptions = {},
): Promise<FunctionPackBinding> {
  const overlay = await resolveFrameworkOverlayFunctionPack(
    industryKey,
    functionKey,
    options,
  );
  if (!overlay) {
    return unboundForMissingOverlay(industryKey, functionKey);
  }
  return bindResolvedFunctionPackForArtifact(
    overlay.pack,
    artifact,
    tenantMetricKeys,
  );
}
