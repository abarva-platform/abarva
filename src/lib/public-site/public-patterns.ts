// Filter + expose public-safe pattern data from the KF-1 corpus.
// Companion: PUB-4 build spec.

import { AI_PROGRAM_PATTERNS } from '@/lib/intelligence/seed-patterns-ai-programs';
import { ARCHITECTURE_PATTERNS } from '@/lib/intelligence/seed-patterns-architecture';
import { CDP_PATTERNS } from '@/lib/intelligence/seed-patterns-cdp';
import { INDUSTRY_PATTERNS } from '@/lib/intelligence/seed-patterns-industry';
import { META_PATTERNS } from '@/lib/intelligence/seed-patterns-meta';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';
import type { PatternSeed } from '@/lib/intelligence/seed-types';

// Re-export the shape so consumers don't need to import from intelligence directly
export type { PatternSeed };

// Domain → human-readable label for the public site
const DOMAIN_LABELS: Record<PatternSeed['domain'], string> = {
  meta: 'Meta',
  sourcing: 'Sourcing',
  cdp: 'CDP',
  ai_programs: 'AI Programs',
  architecture: 'Architecture',
  industry_specific: 'Industry',
  compliance: 'Compliance',
  future_of_work: 'Future of Work',
};

export function getDomainLabel(domain: PatternSeed['domain']): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

// All patterns from the corpus, ordered for public presentation.
// We include all 60 patterns (cap at 60 per spec).
const ALL_PUBLIC_PATTERNS: readonly PatternSeed[] = [
  ...META_PATTERNS,
  ...AI_PROGRAM_PATTERNS,
  ...ARCHITECTURE_PATTERNS,
  ...CDP_PATTERNS,
  ...INDUSTRY_PATTERNS,
  ...SOURCING_PATTERNS,
].slice(0, 60);

/** Returns the full public-safe pattern list. */
export function getPublicPatterns(): PatternSeed[] {
  return [...ALL_PUBLIC_PATTERNS];
}

/** Returns a single pattern by slug, or undefined if not found. */
export function getPublicPatternBySlug(slug: string): PatternSeed | undefined {
  return ALL_PUBLIC_PATTERNS.find((p) => p.slug === slug);
}

/** Returns deduplicated category labels derived from the public patterns. */
export function getPublicPatternCategories(): string[] {
  const seen = new Set<string>();
  for (const pattern of ALL_PUBLIC_PATTERNS) {
    seen.add(getDomainLabel(pattern.domain));
  }
  return Array.from(seen);
}

/** Returns related patterns for a given pattern (by its relatedPatternIds). */
export function getRelatedPatterns(pattern: PatternSeed): PatternSeed[] {
  return pattern.relatedPatternIds
    .map((id) => ALL_PUBLIC_PATTERNS.find((p) => p.id === id))
    .filter((p): p is PatternSeed => p !== undefined);
}
