// evidence_lookup tool · Surface 2 PR-INT-C.
//
// Returns evidence from the Enterprise Data Room that supports or
// contradicts a claim. Used by Sentinel on /intelligence when the
// user makes a factual assertion that should be cited or challenged.
//
// Evidence access goes through SentinelBrokerAdapter — the broker is
// the only allowed pathway from app-tier code to tenant data per the
// boundary doc. The bundle's `citations` are pre-filtered by the
// broker; this tool layers a keyword-overlap relevance score on top
// to surface the most-on-point citations for the user's claim.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { buildSentinelContextBundle } from '@/lib/intelligence/sentinel-broker-adapter';
import { resolveSentinelTenant, tokenize } from './_shared';
import type { EnterpriseEvidenceCitation } from '@/lib/knowledge/agent-context-broker';

interface EvidenceLookupInput {
  /** The claim to evidence-check. */
  claim: string;
  /** Optional — scope to a specific program. */
  programId?: string;
  /** Optional max citations to surface. Default 4, max 12. */
  limit?: number;
}

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 12;

interface ScoredCitation {
  citation: EnterpriseEvidenceCitation;
  score: number;
}

export const evidenceLookupTool: AgentTool<EvidenceLookupInput> = {
  name: 'evidence_lookup',
  description:
    'Find evidence in the Enterprise Data Room that supports or contradicts a claim. Use when the ' +
    'user makes a factual assertion that should be cited or challenged. Emits one evidence-highlight ' +
    'artifact per citation so the right pane materializes them. Cite by locator in prose; the cards ' +
    'on the right carry the metadata.',
  surfaces: ['/intelligence'],
  input_schema: {
    type: 'object',
    properties: {
      claim: {
        type: 'string',
        description: 'The claim to evidence-check.',
      },
      programId: {
        type: 'string',
        description: 'Optional program id to scope the lookup. Omit for corpus-wide search.',
      },
      limit: {
        type: 'number',
        description: 'Max citations to surface. Default 4, max 12.',
      },
    },
    required: ['claim'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    const claim = typeof input.claim === 'string' ? input.claim.trim() : '';
    if (!claim) {
      return {
        success: false,
        error: 'invalid_claim',
        recovery: "Give me the claim you want me to evidence-check and I'll cite what's in the data room.",
      };
    }

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
          "There's no active client on this session, so I can't fetch tenant evidence. " +
          'Set the active client and ask again.',
      };
    }

    const programId = typeof input.programId === 'string' ? input.programId.trim() : undefined;

    const bundle = buildSentinelContextBundle({
      tenantKey: tenant.tenantKey,
      programId: programId && programId.length > 0 ? programId : undefined,
    });

    if (bundle.citations.length === 0) {
      return {
        success: true,
        data: {
          claim,
          tenant_key: tenant.tenantKey,
          program_id: programId ?? null,
          result_count: 0,
          note:
            'The broker returned no citations for this scope. Tell the user the data room has no ' +
            'matching evidence and offer to broaden the scope (drop programId) or check a related claim.',
        },
      };
    }

    const claimTokens = tokenize(claim);
    const scored: ScoredCitation[] = bundle.citations
      .map((citation) => {
        const haystack = `${citation.citationLocator} ${citation.evidenceId}`.toLowerCase();
        let hits = 0;
        for (const tok of claimTokens) {
          if (haystack.includes(tok)) hits += 1;
        }
        return { citation, score: hits };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, limit);

    for (const { citation } of top) {
      const payload = {
        evidenceId: citation.evidenceId,
        label: citation.citationLocator,
        reason: `Confidence ${citation.confidence}; approval ${citation.approvalState}.`,
      };
      ctx.writer?.write(
        `\n[[artifact:evidence-highlight]]${JSON.stringify(payload)}[[/artifact]]\n`,
      );
    }

    return {
      success: true,
      data: {
        claim,
        tenant_key: tenant.tenantKey,
        program_id: programId ?? null,
        result_count: top.length,
        results: top.map(({ citation, score }) => ({
          evidence_id: citation.evidenceId,
          source_artifact_id: citation.sourceArtifactId,
          citation_locator: citation.citationLocator,
          confidence: citation.confidence,
          approval_state: citation.approvalState,
          score,
        })),
        retrieval_mode: 'broker_citations_keyword_v1',
        retrieval_note:
          'Broker citations re-ranked by keyword overlap. Vector + semantic ranking lands when the ' +
          'broker grows vector retrieval (SESSION_BRIEF_INTELLIGENCE.md Open Decision #2).',
      },
    };
  },
};

registerTool(evidenceLookupTool);
