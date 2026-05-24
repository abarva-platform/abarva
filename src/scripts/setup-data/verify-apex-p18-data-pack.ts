import path from 'node:path';

const TENANT_KEY = 'apex-retail';
const RUN_KEY = 'p18-apex-synthetic-v1-2';

type CountResult = { count?: number | null; error?: { message: string } | null };

async function main() {
  const { config: loadEnv } = await import('dotenv');
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  const supabaseModule = await import('@supabase/supabase-js') as unknown as {
    createClient: (url: string, key: string, options: Record<string, unknown>) => {
      from: (table: string) => {
        select: (...args: unknown[]) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => Promise<CountResult>;
            like: (column: string, value: string) => Promise<CountResult>;
          };
        };
      };
    };
  };
  const client = supabaseModule.createClient(url.trim(), key.trim(), { auth: { persistSession: false, autoRefreshToken: false } });

  const sourceFileResult: CountResult = await client
    .from('enterprise_context_source_files')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_key', TENANT_KEY)
    .eq('source_system', 'packet_18_apex_synthetic');
  if (sourceFileResult.error) throw new Error(`enterprise_context_source_files count failed: ${sourceFileResult.error.message}`);

  const chunkResult: CountResult = await client
    .from('enterprise_context_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_key', TENANT_KEY)
    .like('chunk_id', 'APX-P18-CHUNK-%');
  if (chunkResult.error) throw new Error(`enterprise_context_chunks count failed: ${chunkResult.error.message}`);

  const embeddedChunkResult: CountResult = await client
    .from('enterprise_context_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_key', TENANT_KEY)
    .eq('embedding_status', 'embedded')
    .like('chunk_id', 'APX-P18-CHUNK-%');
  if (embeddedChunkResult.error) throw new Error(`enterprise_context_chunks embedded count failed: ${embeddedChunkResult.error.message}`);

  const templateRunResult: CountResult = await client
    .from('enterprise_context_template_runs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_key', TENANT_KEY)
    .eq('run_key', RUN_KEY);
  if (templateRunResult.error) throw new Error(`enterprise_context_template_runs count failed: ${templateRunResult.error.message}`);

  const sourceFiles = sourceFileResult.count ?? 0;
  const chunks = chunkResult.count ?? 0;
  const embeddedChunks = embeddedChunkResult.count ?? 0;
  const templateRuns = templateRunResult.count ?? 0;

  const report = {
    ok: sourceFiles === 42 && chunks === 280 && embeddedChunks === 280 && templateRuns === 1,
    tenantKey: TENANT_KEY,
    sourceFiles,
    chunks,
    embeddedChunks,
    templateRuns,
    expected: {
      sourceFiles: 42,
      chunks: 280,
      embeddedChunks: 280,
      templateRuns: 1,
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
