/**
 * POST /api/context/demo · CB-4
 *
 * Deterministic endpoint that returns a ContextBundle (or an
 * array of all four mode bundles when `mode='all'`) as JSON.
 * No LLM call — exists to demonstrate the retrieval pipeline
 * standalone of the chat surface.
 *
 * Per CONTEXT_BROKER_DESIGN.md §7 (CB-4) and the Wave-1 build
 * order in CLAUDE_CODE_INTELLIGENCE_KICKOFF.md §3.1.
 *
 * Use cases:
 *   - Frontend's Context Assembled panel (CB-5) fetches the
 *     bundle from this endpoint to render beside an answer
 *   - Demo recordings that show the retrieval pipeline without
 *     needing the LLM running
 *   - Regression / smoke tests that verify the broker is
 *     reachable end-to-end from an HTTP client
 *
 * Request shape:
 *   POST /api/context/demo
 *   {
 *     "query": "Why is Apex CDP at risk?",
 *     "tenantKey": "apex-retail",       // required for tenant/full
 *     "mode": "tenant"                  // or "generic"|"corpus"|"full"|"all"
 *   }
 *
 * Response shape (single mode):
 *   { bundle: ContextBundle }
 *
 * Response shape (mode='all'):
 *   { bundles: { generic, corpus, tenant?, full? } }
 */

import { NextResponse, type NextRequest } from 'next/server';

import {
  getContextBroker,
  MissingTenantKeyError,
  type BrokerMode,
  type ContextBundle,
} from '@/lib/knowledge/context-broker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface DemoRequestBody {
  query?: unknown;
  tenantKey?: unknown;
  /** 'generic' | 'corpus' | 'tenant' | 'full' | 'all' */
  mode?: unknown;
  maxFacts?: unknown;
  maxChunks?: unknown;
  graphTraversalDepth?: unknown;
}

const VALID_MODES: ReadonlyArray<BrokerMode> = ['generic', 'corpus', 'tenant', 'full'];
type RequestedMode = BrokerMode | 'all';

function parseMode(raw: unknown): RequestedMode | null {
  if (raw === 'all') return 'all';
  if (typeof raw === 'string' && (VALID_MODES as ReadonlyArray<string>).includes(raw)) {
    return raw as BrokerMode;
  }
  return null;
}

function bundleSummary(b: ContextBundle): {
  mode: BrokerMode;
  factCount: number;
  graphPathCount: number;
  semanticChunkCount: number;
  corpusPatternCount: number;
  provenanceCount: number;
  warningCount: number;
} {
  return {
    mode: b.mode,
    factCount: b.facts.length,
    graphPathCount: b.graphPaths.length,
    semanticChunkCount: b.semanticChunks.length,
    corpusPatternCount: b.corpusPatterns.length,
    provenanceCount: b.provenance.length,
    warningCount: b.warnings.length,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: DemoRequestBody;
  try {
    body = (await request.json()) as DemoRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return NextResponse.json(
      { error: '`query` is required and must be a non-empty string.' },
      { status: 400 },
    );
  }

  const mode = parseMode(body.mode);
  if (!mode) {
    return NextResponse.json(
      {
        error:
          "`mode` is required; must be one of 'generic'|'corpus'|'tenant'|'full'|'all'.",
      },
      { status: 400 },
    );
  }

  const tenantKey =
    typeof body.tenantKey === 'string' && body.tenantKey.trim().length > 0
      ? body.tenantKey.trim()
      : undefined;
  const maxFacts = typeof body.maxFacts === 'number' ? body.maxFacts : undefined;
  const maxChunks = typeof body.maxChunks === 'number' ? body.maxChunks : undefined;
  const graphTraversalDepth =
    typeof body.graphTraversalDepth === 'number'
      ? body.graphTraversalDepth
      : undefined;

  const broker = getContextBroker();

  // mode='all' → run all four modes in parallel
  if (mode === 'all') {
    const tenantSafe = tenantKey;
    const [generic, corpus, tenant, full] = await Promise.all([
      broker.assemble({
        query,
        mode: 'generic',
        maxFacts,
        maxChunks,
        graphTraversalDepth,
      }),
      broker.assemble({
        query,
        mode: 'corpus',
        maxFacts,
        maxChunks,
        graphTraversalDepth,
      }),
      tenantSafe
        ? broker
            .assemble({
              query,
              tenantKey: tenantSafe,
              mode: 'tenant',
              maxFacts,
              maxChunks,
              graphTraversalDepth,
            })
            .catch((err) => brokerErrorBundle(err, query, 'tenant', tenantSafe))
        : null,
      tenantSafe
        ? broker
            .assemble({
              query,
              tenantKey: tenantSafe,
              mode: 'full',
              maxFacts,
              maxChunks,
              graphTraversalDepth,
            })
            .catch((err) => brokerErrorBundle(err, query, 'full', tenantSafe))
        : null,
    ]);
    return NextResponse.json({
      bundles: { generic, corpus, tenant, full },
      summaries: {
        generic: bundleSummary(generic),
        corpus: bundleSummary(corpus),
        tenant: tenant ? bundleSummary(tenant) : null,
        full: full ? bundleSummary(full) : null,
      },
    });
  }

  // Single mode
  try {
    const bundle = await broker.assemble({
      query,
      tenantKey,
      mode,
      maxFacts,
      maxChunks,
      graphTraversalDepth,
    });
    return NextResponse.json({
      bundle,
      summary: bundleSummary(bundle),
    });
  } catch (err) {
    if (err instanceof MissingTenantKeyError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: 'broker_assemble_failed',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

function brokerErrorBundle(
  err: unknown,
  query: string,
  mode: BrokerMode,
  tenantKey: string,
): ContextBundle {
  return {
    query,
    mode,
    tenantKey,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    provenance: [],
    warnings: [
      `broker_failure: ${err instanceof Error ? err.message : String(err)}`,
    ],
    assembledAt: new Date().toISOString(),
  };
}
