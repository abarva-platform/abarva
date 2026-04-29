// search_patterns tool · Surface 2 PR-INT-C.
//
// Retrieves patterns from the AbarVa pattern corpus that match a
// natural-language query. Used by Sentinel on /intelligence when the
// user describes a problem or solution shape and wants to find
// precedents or related patterns.
//
// Vector retrieval is not yet live (GRAPH_VECTOR_READINESS.md +
// SESSION_BRIEF_INTELLIGENCE.md Open Decision #2). Until the broker
// contract gains a vectorQuery field and pgvector retrieval is wired,
// this tool scores patterns by keyword token overlap. The signal is
// good enough to drive demo conversations and seeds the artifact
// channel cleanly. When the broker grows vector support, swap the
// scoring call for a SentinelBrokerAdapter call with vectorQuery —
// no client-side change needed.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import {
  filterPatternsByScope,
  getPatternManifestEntries,
  resolveSentinelTenant,
  scorePatternsByKeyword,
  type SentinelSearchScope,
} from './_shared';
import { patternIdToSlug } from '@/lib/intelligence/pattern-manifest';

interface SearchPatternsInput {
  /** Natural-language description of what to match against. */
  query: string;
  /** Optional scope filter; defaults to 'all'. */
  scope?: SentinelSearchScope;
  /** Optional max results; default 5, max 20. */
  limit?: number;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

export const searchPatternsTool: AgentTool<SearchPatternsInput> = {
  name: 'search_patterns',
  description:
    'Vector-similarity search across the AbarVa pattern corpus. Use when the user describes a problem, ' +
    'scenario, or solution shape and wants to find precedents or related patterns. Emits one ' +
    'pattern-match artifact per result so the right pane materializes them. Reference results in ' +
    'prose by name, not by raw ID — the cards on the right do the heavy lifting.',
  surfaces: ['/intelligence'],
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural-language description of what to match against.',
      },
      scope: {
        type: 'string',
        enum: ['all', 'sourcing', 'lifecycle', 'programs', 'evidence'],
        description:
          "Restrict by pattern domain. 'all' returns every pattern; otherwise the manifest is " +
          "soft-filtered by category keywords. Defaults to 'all'.",
      },
      limit: {
        type: 'number',
        description: 'Max results, default 5, max 20.',
      },
    },
    required: ['query'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    const query = typeof input.query === 'string' ? input.query.trim() : '';
    if (!query) {
      return {
        success: false,
        error: 'invalid_query',
        recovery: 'Tell me what to search for in plain English and I will retry.',
      };
    }
    const scope: SentinelSearchScope =
      input.scope === 'sourcing' ||
      input.scope === 'lifecycle' ||
      input.scope === 'programs' ||
      input.scope === 'evidence'
        ? input.scope
        : 'all';
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, typeof input.limit === 'number' ? Math.trunc(input.limit) : DEFAULT_LIMIT),
    );

    const tenant = await resolveSentinelTenant();
    if (!tenant) {
      return {
        success: false,
        error: 'no_active_client',
        recovery:
          "There's no active client on this session, so I can't run a tenant-scoped pattern search. " +
          'Set the active client and ask again.',
      };
    }

    const candidatePool = filterPatternsByScope(getPatternManifestEntries(), scope);
    const ranked = scorePatternsByKeyword(query, candidatePool).slice(0, limit);

    if (ranked.length === 0) {
      return {
        success: true,
        data: {
          query,
          scope,
          tenant_key: tenant.tenantKey,
          result_count: 0,
          note:
            'No corpus patterns matched the query under keyword scoring. Tell the user the corpus ' +
            'has no precedent for this shape and ask what to search for next.',
        },
      };
    }

    for (const { pattern } of ranked) {
      const summary =
        pattern.shortDescription ?? pattern.longDescription ?? `${pattern.category ?? ''}`.trim();
      const payload = {
        patternId: pattern.id,
        name: pattern.name,
        summary: summary.length > 0 ? summary : pattern.name,
      };
      ctx.writer?.write(
        `\n[[artifact:pattern-match]]${JSON.stringify(payload)}[[/artifact]]\n`,
      );
    }

    return {
      success: true,
      data: {
        query,
        scope,
        tenant_key: tenant.tenantKey,
        result_count: ranked.length,
        results: ranked.map(({ pattern, score }) => ({
          pattern_id: pattern.id,
          slug: patternIdToSlug(pattern.id),
          name: pattern.name,
          score,
        })),
        retrieval_mode: 'keyword_overlap_v1',
        retrieval_note:
          'Keyword-overlap fallback in use until the broker exposes vector retrieval ' +
          '(see SESSION_BRIEF_INTELLIGENCE.md Open Decision #2).',
      },
    };
  },
};

registerTool(searchPatternsTool);
