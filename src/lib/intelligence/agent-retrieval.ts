// agent-retrieval.ts
//
// Corpus-backed retrieval functions for the /api/chat/agent route.
//
// Replaces the freestanding src/lib/agent/stage-playbooks.ts and
// src/lib/agent/service-category-playbooks.ts files.  All playbook
// content now lives in the sourcing pattern corpus (seed-patterns-sourcing.ts),
// making it available to the intelligence layer, the reasoning runtime, and
// the agent prompt in one consistent place.
//
// Retrieval approach: synchronous in-memory lookup against the SOURCING_PATTERNS
// array.  No network, no vector search — the corpus is small enough that a
// linear scan is O(n) with n ≤ 30.  If the corpus grows beyond ~200 patterns
// a map index should be built at module load time.
//
// Naming convention for the corpus maps:
//   STAGE_PATTERN_MAP  — stage label → pattern ID
//   CATEGORY_KEYWORD_MAP — keyword list → pattern ID

import SOURCING_PATTERNS from './seed-patterns-sourcing';

// ── Stage → pattern ID map ────────────────────────────────────────────────────
//
// Keys must match the exact stage label strings used in the Source tracker UI
// (same contract as the old STAGE_PLAYBOOKS record in stage-playbooks.ts).
//
// Stage → hosting pattern:
//   Plan        → PAT-SRC-013  (dedicated stage doctrine pattern)
//   RFI         → PAT-SRC-014  (dedicated stage doctrine pattern)
//   Shortlist   → PAT-SRC-015  (dedicated stage doctrine pattern)
//   RFP         → PAT-SRC-016  (dedicated stage doctrine pattern)
//   Q&A         → PAT-SRC-017  (dedicated stage doctrine pattern)
//   Initial-Bid → PAT-SRC-018  (dedicated stage doctrine pattern)
//   BAFO        → PAT-SRC-001  (body extended with "Stage doctrine — BAFO")
//   Selection   → PAT-SRC-011  (body extended with "Stage doctrine — Selection")
//   Award       → PAT-SRC-012  (body extended with "Stage doctrine — Award")
//   Onboard     → PAT-SRC-019  (dedicated stage doctrine pattern)

const STAGE_PATTERN_MAP: Record<string, string> = {
  Plan:           'PAT-SRC-013',
  RFI:            'PAT-SRC-014',
  Shortlist:      'PAT-SRC-015',
  RFP:            'PAT-SRC-016',
  'Q&A':          'PAT-SRC-017',
  'Initial-Bid':  'PAT-SRC-018',
  BAFO:           'PAT-SRC-001',
  Selection:      'PAT-SRC-011',
  Award:          'PAT-SRC-012',
  Onboard:        'PAT-SRC-019',
};

// ── Category keyword → pattern ID map ────────────────────────────────────────
//
// AMS is listed first because its name is short enough to be a substring of
// other strings (e.g. "managed services") and should match before generic terms.
//
//   AMS            → PAT-SRC-020
//   SaaS           → PAT-SRC-021
//   Infrastructure → PAT-SRC-022
//   Implementation → PAT-SRC-023
//   Consulting     → PAT-SRC-024

const CATEGORY_KEYWORD_MAP: Array<{ patternId: string; keywords: string[] }> = [
  {
    patternId: 'PAT-SRC-020',
    keywords: [
      'ams',
      'application managed service',
      'managed service',
      'application management',
    ],
  },
  {
    patternId: 'PAT-SRC-021',
    keywords: [
      'saas',
      'software as a service',
      'platform',
      'license',
      'licence',
      'subscription',
      'crm',
      'erp',
      'cloud software',
    ],
  },
  {
    patternId: 'PAT-SRC-022',
    keywords: [
      'infrastructure',
      'cloud',
      'hosting',
      'iaas',
      'paas',
      'data centre',
      'datacenter',
      'network',
    ],
  },
  {
    patternId: 'PAT-SRC-023',
    keywords: [
      'implementation',
      'integration',
      'delivery',
      'si',
      'systems integrator',
      'build',
      'deployment',
    ],
  },
  {
    patternId: 'PAT-SRC-024',
    keywords: [
      'consulting',
      'advisory',
      'strategy',
      'assessment',
      'review',
    ],
  },
];

// ── Pattern lookup helpers ────────────────────────────────────────────────────

/**
 * Build a map from pattern ID → body at module load time so repeated
 * agent calls are O(1) lookups rather than O(n) scans.
 */
const PATTERN_BODY_MAP: Map<string, string> = new Map(
  SOURCING_PATTERNS.map((p) => [p.id, p.body]),
);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the corpus-backed stage doctrine for the given stage label,
 * formatted for injection into the agent system prompt.
 *
 * Returns null when stage is absent or unrecognised.
 *
 * @param stage  Stage label string, e.g. 'BAFO', 'Plan', 'Initial-Bid'.
 *               Accepts null/undefined for call-site convenience.
 */
export function retrieveStageContext(stage: string | null | undefined): string | null {
  if (!stage) return null;
  const patternId = STAGE_PATTERN_MAP[stage];
  if (!patternId) return null;
  const body = PATTERN_BODY_MAP.get(patternId);
  if (!body) return null;
  return body;
}

/**
 * Returns the corpus-backed service-category playbook for the given event
 * name and optional event type string, formatted for injection into the
 * agent system prompt.
 *
 * Keyword matching is case-insensitive substring search, same contract as
 * the old getCategoryPlaybook function.  AMS keywords are checked first.
 *
 * Returns null when no category matches.
 *
 * @param eventName  Source event name, e.g. 'AMS Vendor Consolidation 2026'.
 * @param eventType  Optional event type string, e.g. 'managed-services'.
 */
export function retrieveCategoryContext(
  eventName: string,
  eventType?: string,
): string | null {
  const haystack = [
    eventName.toLowerCase(),
    eventType ? eventType.toLowerCase() : '',
  ].join(' ');

  for (const { patternId, keywords } of CATEGORY_KEYWORD_MAP) {
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        return PATTERN_BODY_MAP.get(patternId) ?? null;
      }
    }
  }

  return null;
}
