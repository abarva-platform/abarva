import { CONTRADICTION_SEEDS, type ContradictionSeed } from '@/lib/intelligence/seed-contradictions';
import { CANONICAL_URLS } from './canonical-urls';

// The 5 publicly safe contradictions per spec §14.3
const PUBLIC_CONTRADICTION_IDS = new Set(['CON-001', 'CON-002', 'CON-004', 'CON-005', 'CON-008']);

export function getPublicContradictions(): ContradictionSeed[] {
  return CONTRADICTION_SEEDS.filter(c => PUBLIC_CONTRADICTION_IDS.has(c.id));
}

export function getPublicContradictionById(id: string): ContradictionSeed | undefined {
  if (!PUBLIC_CONTRADICTION_IDS.has(id)) return undefined;
  return CONTRADICTION_SEEDS.find(c => c.id === id);
}

export function contradictionPermalink(id: string): string {
  return CANONICAL_URLS.contradiction(id);
}

export function getStatusLabel(status: ContradictionSeed['status']): string {
  switch (status) {
    case 'open': return 'Open';
    case 'under-review': return 'Under review';
    case 'resolved-toward-A': return 'Resolved → A';
    case 'resolved-toward-B': return 'Resolved → B';
    case 'accepted-as-tension': return 'Accepted as tension';
  }
}

export function getStatusColor(status: ContradictionSeed['status']): string {
  switch (status) {
    case 'resolved-toward-A':
    case 'resolved-toward-B':
      return '#1d7a4a';
    case 'open':
      return '#ba7517';
    default:
      return '#888780';
  }
}

export function getConfidenceDelta(a: number, b: number): string {
  const delta = Math.round((b - a) * 100);
  return delta >= 0 ? `+${delta}%` : `${delta}%`;
}
