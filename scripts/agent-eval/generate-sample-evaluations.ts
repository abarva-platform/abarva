// Generates REAL rubric output over synthetic-but-realistic traces, so the
// committed sample-evaluations.json is genuine evaluateAgentResponse() output
// (not hand-authored). Deterministic dimensions are real; subjective
// dimensions use illustrative injected judgments. Live Azure scores must come
// from the PR-5 harness run on Azure Container Apps.
//
// Run: npx ts-node -r tsconfig-paths/register scripts/agent-eval/generate-sample-evaluations.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildNexusTrace, buildSentinelTrace } from '@/lib/agent-trace/build';
import { hashModelInput } from '@/lib/agent-trace/redaction';
import { evaluateAgentResponse } from '@/lib/agent-eval/rubric';
import type { InjectedJudgments } from '@/lib/agent-eval/types';

const hash = hashModelInput({ system: 'system', user: 'user' });
const emittedAt = '2026-06-09T00:00:00.000Z';

const strongJudge: InjectedJudgments = {
  business_judgment: { score: 4, rationale: 'sound sequencing and scoping' },
  specificity: { score: 4, rationale: 'tenant-specific figures and systems' },
  actionability: { score: 4, rationale: 'clear next action' },
  no_hallucination: { score: 5, rationale: 'no invented facts' },
  executive_usefulness: { score: 4, rationale: 'board-ready framing' },
};

const evaluations = [
  {
    label: 'apex-retail · grounded move answer',
    evaluation: evaluateAgentResponse({
      trace: buildNexusTrace({
        questionId: 'sample-apex-1',
        tenantId: 'apexretail',
        tenantKey: 'apex-retail',
        surface: 'moves',
        userIntent: 'research',
        modelInputHash: hash,
        emittedAt,
        patternNamespace: 'retail',
        citationObjectsEmitted: ['p1', 'f1', 'f2'],
        sources: [
          { id: 'p1', type: 'pattern', name: 'Contact Center AI', confidence: 'high' },
          { id: 'f1', type: 'client_fact', name: 'Apex CC volume', confidence: 'high' },
          { id: 'f2', type: 'client_fact', name: 'Apex AHT baseline', confidence: 'medium' },
        ],
      }),
      answerText:
        'Apex should pilot contact-center AI on the highest-volume queue. The main failure mode is poor intent coverage; mitigate with a human-in-the-loop fallback and a 4-week shadow period.',
      judgments: strongJudge,
    }),
  },
  {
    label: 'meridian-health · thin answer that over-claims (should fail)',
    evaluation: evaluateAgentResponse({
      trace: buildSentinelTrace({
        questionId: 'sample-meridian-1',
        tenantId: 'meridian',
        tenantKey: 'meridian-health',
        surface: 'intelligence',
        userIntent: 'general_synthesis',
        modelInputHash: hash,
        emittedAt,
        citationObjectsEmitted: [],
        sources: [],
      }),
      answerText: 'Meridian will cut nursing overtime by 30% within two quarters across all sites.',
      unsupportedClaims: [
        {
          claimText: '30% overtime reduction',
          claimType: 'kpi_outcome_claim',
          critical: true,
          recommendedFixLane: 'answer_prompt_synthesis',
        },
      ],
    }),
  },
  {
    label: 'skyharbor-air · grounded answer, no judge (subjective not assessed)',
    evaluation: evaluateAgentResponse({
      trace: buildSentinelTrace({
        questionId: 'sample-skyharbor-1',
        tenantId: 'skyharbor',
        tenantKey: 'skyharbor-air',
        surface: 'intelligence',
        userIntent: 'vendor_comparison',
        modelInputHash: hash,
        emittedAt,
        patternNamespace: 'airline',
        citationObjectsEmitted: ['pat-1', 'ten-1'],
        sources: [
          { id: 'pat-1', type: 'PATTERN', name: 'Irregular Ops Recovery', confidence: 0.8 },
          { id: 'ten-1', type: 'TENANT', name: 'SkyHarbor OTP baseline', confidence: 0.7 },
        ],
      }),
      answerText:
        'SkyHarbor should prioritise irregular-ops recovery automation; the key risk is crew-rostering integration. This is judgment given the loaded baseline.',
    }),
  },
  {
    label: 'apex-retail · cross-tenant leakage (auto-fail)',
    evaluation: evaluateAgentResponse({
      trace: buildNexusTrace({
        questionId: 'sample-leakage-1',
        tenantId: 'apexretail',
        tenantKey: 'apex-retail',
        surface: 'moves',
        userIntent: 'research',
        modelInputHash: hash,
        emittedAt,
        citationObjectsEmitted: ['f1'],
        sources: [{ id: 'f1', type: 'client_fact', name: 'Apex fact', confidence: 'high' }],
      }),
      answerText: 'Like Meridian Health did in their EHR rollout, Apex should...',
      tenantLeakage: [{ detail: 'referenced Meridian Health', offendingTenantKey: 'meridian-health' }],
    }),
  },
];

const out = {
  generated: '2026-06-09',
  illustrative: true,
  note: 'Real evaluateAgentResponse() output over synthetic traces. Deterministic dimensions are genuine; subjective dimensions use illustrative injected judgments. Live Azure scores require the PR-5 harness on Azure Container Apps.',
  tenants_not_loaded: ['lakeshore', 'morgan-street'],
  evaluations,
};

const dir = path.join('docs', 'build', 'agent-context-bundle-verification-2026-06-09');
mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'sample-evaluations.json');
writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.info(`wrote ${file} (${evaluations.length} evaluations)`);
