import { getPhsHealthPlanCorpusPatterns } from '@/lib/corpus/seeds/phs-health-plan-patterns';

type LoadMode = 'dry-run' | 'apply';

type Options = {
  mode: LoadMode;
  status: 'draft' | 'in_review';
  actor: string;
};

function parseOptions(argv: string[]): Options {
  const statusFlag = argv.find((arg) => arg.startsWith('--status='))?.split('=')[1];
  const status = statusFlag === 'in_review' ? 'in_review' : 'draft';
  return {
    mode: argv.includes('--apply') ? 'apply' : 'dry-run',
    status,
    actor: argv.find((arg) => arg.startsWith('--actor='))?.split('=')[1] ?? 'phs-health-plan-corpus-loader',
  };
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const patterns = getPhsHealthPlanCorpusPatterns();

  if (options.mode === 'dry-run') {
    console.log(JSON.stringify({
      ok: true,
      mode: options.mode,
      target_tables: ['corpus_patterns', 'corpus_pattern_content', 'corpus_pattern_versions', 'corpus_telemetry'],
      would_upsert: patterns.length,
      status: options.status,
      slugs: patterns.map((pattern) => pattern.slug),
      note: 'Dry run only. Re-run with --apply to write draft/in_review rows. This script never publishes or embeds patterns.',
    }, null, 2));
    return;
  }

  const { withCorpusTransaction } = await import('@/lib/corpus/db');
  const result = await withCorpusTransaction(async (client) => {
    const written: string[] = [];
    for (const pattern of patterns) {
      const { rows } = await client.query<{ id: string; created: boolean }>(
        `
          INSERT INTO public.corpus_patterns(
            slug,
            title,
            category,
            status,
            confidence,
            depth_score,
            vertical_overlays,
            region_overlays,
            applicable_horizons,
            primary_author_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (slug)
          DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            status = CASE
              WHEN public.corpus_patterns.status = 'published' THEN public.corpus_patterns.status
              ELSE EXCLUDED.status
            END,
            confidence = EXCLUDED.confidence,
            depth_score = EXCLUDED.depth_score,
            vertical_overlays = EXCLUDED.vertical_overlays,
            region_overlays = EXCLUDED.region_overlays,
            applicable_horizons = EXCLUDED.applicable_horizons,
            primary_author_id = COALESCE(public.corpus_patterns.primary_author_id, EXCLUDED.primary_author_id)
          RETURNING id, (xmax = 0) AS created
        `,
        [
          pattern.slug,
          pattern.title,
          pattern.category,
          options.status,
          pattern.confidence ?? 0.75,
          pattern.depthScore ?? 0,
          pattern.verticalOverlays ?? [],
          pattern.regionOverlays ?? [],
          pattern.applicableHorizons ?? [],
          options.actor,
        ],
      );
      const id = rows[0].id;

      await client.query(
        `
          INSERT INTO public.corpus_pattern_content(
            pattern_id,
            version,
            markdown_body,
            claims_jsonb,
            evidence_jsonb,
            counterarguments_jsonb,
            synthesis_jsonb
          )
          VALUES ($1, 1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb)
          ON CONFLICT (pattern_id)
          DO UPDATE SET
            markdown_body = EXCLUDED.markdown_body,
            claims_jsonb = EXCLUDED.claims_jsonb,
            evidence_jsonb = EXCLUDED.evidence_jsonb,
            counterarguments_jsonb = EXCLUDED.counterarguments_jsonb,
            synthesis_jsonb = EXCLUDED.synthesis_jsonb
        `,
        [
          id,
          pattern.markdownBody,
          JSON.stringify(pattern.structured?.claims ?? []),
          JSON.stringify(pattern.structured?.evidence ?? []),
          JSON.stringify(pattern.structured?.counterarguments ?? []),
          JSON.stringify(pattern.structured?.synthesis ?? {}),
        ],
      );

      const { rows: versionRows } = await client.query<{ status: string; version: number; snapshot_jsonb: unknown }>(
        `
          SELECT p.status::text AS status,
                 p.version,
                 jsonb_build_object(
                   'slug', p.slug,
                   'title', p.title,
                   'category', p.category,
                   'status', p.status,
                   'confidence', p.confidence,
                   'depth_score', p.depth_score,
                   'vertical_overlays', p.vertical_overlays,
                   'region_overlays', p.region_overlays,
                   'applicable_horizons', p.applicable_horizons,
                   'source_starter_id', $2::text
                 ) AS snapshot_jsonb
          FROM public.corpus_patterns p
          WHERE p.id = $1
        `,
        [id, pattern.sourceStarterId],
      );

      await client.query(
        `
          INSERT INTO public.corpus_pattern_versions(pattern_id, version, status, snapshot_jsonb, created_by_id)
          VALUES ($1, $2, $3, $4::jsonb, $5)
          ON CONFLICT (pattern_id, version)
          DO UPDATE SET status = EXCLUDED.status, snapshot_jsonb = EXCLUDED.snapshot_jsonb
        `,
        [
          id,
          versionRows[0].version,
          versionRows[0].status,
          JSON.stringify(versionRows[0].snapshot_jsonb),
          options.actor,
        ],
      );

      await client.query(
        `
          INSERT INTO public.corpus_telemetry(event_type, context_jsonb, actor_id, pattern_id)
          VALUES ('phs_health_plan_corpus_loaded', $1::jsonb, $2, $3)
        `,
        [
          JSON.stringify({
            source_starter_id: pattern.sourceStarterId,
            status: options.status,
            loader: 'load-phs-health-plan-corpus',
          }),
          options.actor,
          id,
        ],
      );

      written.push(pattern.slug);
    }
    return written;
  });

  console.log(JSON.stringify({
    ok: true,
    mode: options.mode,
    written: result.length,
    status: options.status,
    slugs: result,
    note: 'Patterns were upserted but not published, embedded, indexed, or marked agent_ready.',
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
