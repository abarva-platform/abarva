// validate_synthesis tool · Surface 2 PR-INT-E.
//
// Sentinel's quality gate. Wraps three checks against a synthesis
// text the user has authored or pasted, and surfaces structured
// artifacts for each layer of the analysis:
//
//   1. runQualityGates() — provenance, voice, length, pattern shape
//   2. Pattern alignment — which corpus patterns the synthesis aligns
//      with, by keyword overlap (the same temporary substitute used
//      in search_patterns until vector retrieval lands)
//   3. Contradiction detection — for each authored
//      ContradictionTemplate across the program-lifecycle pattern
//      seeds, fire when the synthesis text trips its detectionHint
//      keywords. Surfaces the pack-authored contradiction-flag card
//      so the user sees pack/seed doctrine actively challenge their
//      synthesis.
//
// Boundary respected: pattern manifest + program-lifecycle pattern
// seeds are corpus-wide doctrine (NOT EnterpriseDataRoom), so this
// file may import them directly. Tenant-scoped reads still go
// through SentinelBrokerAdapter only.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import {
  filterPatternsByScope,
  getPatternManifestEntries,
  resolveSentinelTenant,
  scorePatternsByKeyword,
  tokenize,
} from './_shared';
import { runQualityGates } from '@/lib/programs/quality-gates';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

interface ValidateSynthesisInput {
  /** The synthesis text to validate. */
  text: string;
  /** Optional pattern IDs / slugs to scope alignment against. */
  againstPatterns?: string[];
  /** Optional max alignment results. Default 3, max 8. */
  maxAlignedPatterns?: number;
  /** Optional max contradiction surfacings. Default 3, max 8. */
  maxContradictions?: number;
}

const DEFAULT_ALIGNED = 3;
const MAX_ALIGNED = 8;
const DEFAULT_CONTRADICTIONS = 3;
const MAX_CONTRADICTIONS = 8;

interface ContradictionMatch {
  template: ContradictionTemplate;
  score: number;
  patternId: string;
}

/**
 * Score a contradiction template's detectionHint against the
 * synthesis tokens. The detectionHint is dense prose authored
 * alongside the pack — keyword overlap is a useful signal for
 * "is this template being tripped" without claiming to fully
 * evaluate the contradiction. The pattern's coAppliesWithPatternIds
 * list are NOT part of the score; only the hint itself.
 */
function scoreContradictionTemplate(
  template: ContradictionTemplate,
  synthesisTokens: ReadonlyArray<string>,
): number {
  if (synthesisTokens.length === 0) return 0;
  const haystack = `${template.detectionHint} ${template.label}`.toLowerCase();
  let hits = 0;
  for (const tok of synthesisTokens) {
    if (haystack.includes(tok)) hits += 1;
  }
  return hits;
}

export const validateSynthesisTool: AgentTool<ValidateSynthesisInput> = {
  name: 'validate_synthesis',
  description:
    "Run Sentinel's quality gates against a synthesis text. Surfaces patterns the synthesis aligns " +
    'with, contradictions it triggers, and provenance/voice/length gate issues. Use when the user asks ' +
    'Sentinel to vet, audit, or stress-test their synthesis. Emits pattern-match artifacts for aligned ' +
    'patterns and contradiction-flag artifacts for fired contradictions.',
  surfaces: ['/intelligence'],
  input_schema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The synthesis text to validate.',
      },
      againstPatterns: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional pattern IDs or slugs to scope alignment against. When omitted, the tool checks ' +
          'against the full corpus.',
      },
      maxAlignedPatterns: {
        type: 'number',
        description: 'Max aligned-pattern artifacts to surface. Default 3, max 8.',
      },
      maxContradictions: {
        type: 'number',
        description: 'Max contradiction-flag artifacts to surface. Default 3, max 8.',
      },
    },
    required: ['text'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    const text = typeof input.text === 'string' ? input.text.trim() : '';
    if (!text) {
      return {
        success: false,
        error: 'invalid_text',
        recovery: 'Give me the synthesis text to validate and I will run the gates.',
      };
    }

    const maxAligned = Math.min(
      MAX_ALIGNED,
      Math.max(
        1,
        typeof input.maxAlignedPatterns === 'number'
          ? Math.trunc(input.maxAlignedPatterns)
          : DEFAULT_ALIGNED,
      ),
    );
    const maxContradictions = Math.min(
      MAX_CONTRADICTIONS,
      Math.max(
        1,
        typeof input.maxContradictions === 'number'
          ? Math.trunc(input.maxContradictions)
          : DEFAULT_CONTRADICTIONS,
      ),
    );

    const tenant = await resolveSentinelTenant();
    if (!tenant) {
      return {
        success: false,
        error: 'no_active_client',
        recovery:
          "There's no active client on this session, so I can't run a tenant-scoped synthesis " +
          'validation. Set the active client and ask again.',
      };
    }

    // ── Step 1 · Quality gates ──────────────────────────────────────────────────
    const gates = runQualityGates(text);

    // ── Step 2 · Pattern alignment via keyword overlap ──────────────────────────
    const allPatterns = getPatternManifestEntries();
    const scopedPatterns = filterPatternsByScope(allPatterns, 'all');
    const candidatePool = Array.isArray(input.againstPatterns) && input.againstPatterns.length > 0
      ? scopedPatterns.filter((pattern) => {
          return input.againstPatterns!.some(
            (anchor) =>
              pattern.id === anchor || pattern.slug === anchor,
          );
        })
      : scopedPatterns;
    const ranked = scorePatternsByKeyword(text, candidatePool).slice(0, maxAligned);

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

    // ── Step 3 · Contradiction detection across program-lifecycle seeds ────────
    const synthesisTokens = tokenize(text);
    const contradictionMatches: ContradictionMatch[] = [];
    for (const lifecycle of PROGRAM_LIFECYCLE_PATTERNS) {
      for (const template of lifecycle.contradictionTemplates) {
        const score = scoreContradictionTemplate(template, synthesisTokens);
        if (score > 0) {
          contradictionMatches.push({
            template,
            score,
            patternId: lifecycle.patternId,
          });
        }
      }
    }
    contradictionMatches.sort((a, b) => b.score - a.score);
    const topContradictions = contradictionMatches.slice(0, maxContradictions);

    for (const { template } of topContradictions) {
      const payload = {
        contradictionId: template.id,
        label: template.label,
        severity: template.severity,
        partyA: template.partyA,
        partyB: template.partyB,
        detectionDescription: template.detectionHint,
        resolutionPath: template.resolutionPath,
      };
      ctx.writer?.write(
        `\n[[artifact:contradiction-flag]]${JSON.stringify(payload)}[[/artifact]]\n`,
      );
    }

    return {
      success: true,
      data: {
        tenant_key: tenant.tenantKey,
        word_count: gates.metadata.wordCount,
        gates: {
          pass: gates.pass,
          provenance_hits: gates.metadata.provenanceHints,
          forbidden_phrases_stripped: gates.metadata.forbiddenPhrasesStripped,
          issues: gates.issues.map((issue) => ({
            gate: issue.gate,
            severity: issue.severity,
            message: issue.message,
          })),
        },
        aligned_patterns: ranked.map(({ pattern, score }) => ({
          pattern_id: pattern.id,
          name: pattern.name,
          score,
        })),
        contradictions: topContradictions.map(({ template, score, patternId }) => ({
          contradiction_id: template.id,
          source_pattern_id: patternId,
          label: template.label,
          severity: template.severity,
          score,
        })),
        retrieval_mode: 'quality_gates_v1+keyword_overlap',
        retrieval_note:
          'Quality gates from runQualityGates(); pattern alignment via keyword overlap until ' +
          'broker vector retrieval lands. Contradiction detection scans authored ' +
          'ContradictionTemplate.detectionHint strings across PROGRAM_LIFECYCLE_PATTERNS.',
      },
    };
  },
};

registerTool(validateSynthesisTool);
