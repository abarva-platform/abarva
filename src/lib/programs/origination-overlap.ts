import 'server-only';

// OV2-1d · origination-brief overlap detection for /programs/new.
// Design refs: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// sections D.0.4 step 7 (pattern classification), D.0.7 Q1 (overlap
// threshold), D.0.8 Scenario A (Apex CDP overlap alert).
//
// Broker contract: this module reads the tenant's program inventory
// only via `buildProgramsContextBundle` (see programs-broker-adapter.ts
// and agent-context-broker.ts). It does NOT touch the data room
// directly. The broker exposes program items with a `summary` of the
// form `${lifecycleState}; sponsor ${executiveSponsor}; timeline ...`
// and a `provenanceIds` list that includes `system:*` and `vendor:*`
// ids — those are the runtime hooks used here for sponsor and system
// matching.
//
// OV2-1d-archetype · archetype matching is now live. The broker
// surfaces the canonical pattern id as a `pattern:${id}` entry in
// `provenanceIds` (same convention as `system:*` and `vendor:*`).
// extractProgramFacts reads it back, and detectBriefOverlap compares
// against `input.archetypeId` case-insensitively. Programs whose
// source data does not map to a canonical pattern leave patternId
// undefined and never produce an archetype hit.

import {
  buildProgramsContextBundle,
  type ProgramsBrokerRequest,
} from '@/lib/programs/programs-broker-adapter';
import type { EnterpriseAgentContextItem } from '@/lib/knowledge/agent-context-broker';

export interface BriefOverlapInput {
  /** Tenant client key (canonical broker key, e.g. 'apex-retail'). */
  tenantKey: string;
  /** Optional: archetype pattern id under consideration (e.g. 'PAT-PRG-CDP-001'). */
  archetypeId?: string;
  /** Optional: sponsor candidate name as captured in the brief so far. */
  sponsorCandidate?: string;
  /** Optional: array of system or vendor names referenced in the brief. */
  systemFootprint?: string[];
}

export interface BriefOverlapMatch {
  programId: string;
  programName: string;
  /** e.g. 'P3 Design' if known; broker exposes lifecycleState which we surface as-is. */
  programPhase?: string;
  overlapKind: 'archetype' | 'sponsor' | 'system' | 'multiple';
  /** Human-readable one-line detail naming the dimensions that matched. */
  overlapDetail: string;
  /** 0..1 for caller-side ranking; multi-dimension hits naturally rank higher. */
  matchScore: number;
}

// Per-dimension weights summed to a max of 1.0; multi-dimension hits
// naturally rank higher.
const ARCHETYPE_WEIGHT = 0.7;
const SPONSOR_WEIGHT = 0.5;
const SYSTEM_WEIGHT = 0.3;
// OV2-1d-archetype · archetype matching is enabled now that the
// broker carries pattern ids via `pattern:${patternId}` provenance.
const ARCHETYPE_MATCH_ENABLED = true;

type Dimension = 'archetype' | 'sponsor' | 'system';

interface ProgramFacts {
  programId: string;
  programName: string;
  phase?: string;
  sponsor?: string;
  /** Lower-cased system / vendor identifiers from provenanceIds (system:* and vendor:*). */
  systemTokens: string[];
  /** Pattern / archetype id when the broker carries it (OV2-1d-archetype). */
  archetypeId?: string;
}

export function detectBriefOverlap(input: BriefOverlapInput): BriefOverlapMatch[] {
  const archetypeId = input.archetypeId?.trim();
  const sponsorCandidate = input.sponsorCandidate?.trim();
  const systemFootprint = (input.systemFootprint ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // No dimensions to match on → nothing to do.
  if (!archetypeId && !sponsorCandidate && systemFootprint.length === 0) {
    return [];
  }

  const brokerRequest: ProgramsBrokerRequest = {
    tenantKey: input.tenantKey,
    agentName: 'Nexus',
  };

  let bundle;
  try {
    bundle = buildProgramsContextBundle(brokerRequest);
  } catch {
    return [];
  }

  // Unknown tenant returns a blocked bundle with an empty items[] —
  // nothing to overlap against.
  const programItems = bundle.items.filter((i) => i.kind === 'program');
  if (programItems.length === 0) {
    return [];
  }

  const matches: BriefOverlapMatch[] = [];
  const sponsorLower = sponsorCandidate?.toLowerCase();
  const systemTokensLower = systemFootprint.map((s) => s.toLowerCase());

  for (const item of programItems) {
    const facts = extractProgramFacts(item);

    const dimensionsHit: Dimension[] = [];
    let score = 0;

    if (ARCHETYPE_MATCH_ENABLED && archetypeId && facts.archetypeId) {
      if (facts.archetypeId.toLowerCase() === archetypeId.toLowerCase()) {
        dimensionsHit.push('archetype');
        score += ARCHETYPE_WEIGHT;
      }
    }

    if (sponsorLower && facts.sponsor) {
      const sponsorNameLower = facts.sponsor.toLowerCase();
      if (
        sponsorNameLower.includes(sponsorLower) ||
        sponsorLower.includes(sponsorNameLower)
      ) {
        dimensionsHit.push('sponsor');
        score += SPONSOR_WEIGHT;
      }
    }

    if (systemTokensLower.length > 0 && facts.systemTokens.length > 0) {
      const systemHit = systemTokensLower.some((needle) =>
        facts.systemTokens.some(
          (hay) => hay.includes(needle) || needle.includes(hay),
        ),
      );
      if (systemHit) {
        dimensionsHit.push('system');
        score += SYSTEM_WEIGHT;
      }
    }

    if (dimensionsHit.length === 0) {
      continue;
    }

    const cappedScore = Math.min(score, 1);
    const overlapKind: BriefOverlapMatch['overlapKind'] =
      dimensionsHit.length >= 2 ? 'multiple' : dimensionsHit[0];

    matches.push({
      programId: facts.programId,
      programName: facts.programName,
      programPhase: facts.phase,
      overlapKind,
      overlapDetail: buildDetail(facts, dimensionsHit),
      matchScore: cappedScore,
    });
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
}

function extractProgramFacts(item: EnterpriseAgentContextItem): ProgramFacts {
  // Broker contract id format is `ctx:${program.id}` — strip the `ctx:`
  // prefix so callers see the underlying program id (matches what the
  // overlap-alert artifact uses).
  const programId = item.id.startsWith('ctx:') ? item.id.slice('ctx:'.length) : item.id;

  // Broker `summary` format (see agent-context-broker.ts):
  //   `${lifecycleState}; sponsor ${executiveSponsor}; timeline ${timeline}`
  const summary = item.summary;
  const phase = readPart(summary, /^([^;]+);/);
  const sponsor = readPart(summary, /;\s*sponsor\s+(.+?);\s*timeline\s+/i);

  // provenanceIds is `[program.id, ...linkedSystemIds, ...linkedVendorIds, pattern:${patternId}?]`.
  // Filter to system:/vendor: prefixed ids, lower-cased for matching.
  const systemTokens = item.provenanceIds
    .filter((id) => /^(system|vendor):/i.test(id))
    .map((id) => id.toLowerCase());

  // OV2-1d-archetype · pull the canonical pattern id off the
  // `pattern:` provenance entry when the broker carries one.
  const patternProvenance = item.provenanceIds.find((id) => /^pattern:/i.test(id));
  const archetypeId = patternProvenance
    ? patternProvenance.slice('pattern:'.length)
    : undefined;

  return {
    programId,
    programName: item.title,
    phase: phase ?? undefined,
    sponsor: sponsor ?? undefined,
    systemTokens,
    archetypeId,
  };
}

function readPart(input: string, pattern: RegExp): string | null {
  const match = pattern.exec(input);
  if (!match) {
    return null;
  }
  const value = match[1]?.trim();
  return value && value.length > 0 ? value : null;
}

function buildDetail(facts: ProgramFacts, dimensionsHit: Dimension[]): string {
  const dims = dimensionsHit.join(', ');
  const phaseSuffix = facts.phase ? ` (${facts.phase})` : '';
  return `Overlap with ${facts.programName}${phaseSuffix} on ${dims}.`;
}
