import type { StrategicMove } from "@/lib/programs/types.ui";

export const UNASSIGNED_SPONSOR_LABEL = "To be assigned";

export function sponsorDisplayName(
  sponsor: StrategicMove["sponsor"],
): string {
  return sponsor?.name?.trim() || UNASSIGNED_SPONSOR_LABEL;
}

export function sponsorDisplayWithRole(
  sponsor: StrategicMove["sponsor"],
  formatRole: (role: string) => string,
): string {
  if (!sponsor?.name?.trim()) return UNASSIGNED_SPONSOR_LABEL;
  return `${sponsor.name} · ${formatRole(sponsor.role)}`;
}

/**
 * A short, header-safe sponsor label. The sponsor name can carry a full
 * governance breakdown ("Sponsor X. Business value Y. Technology Z. …"); a
 * header only needs the primary sponsor, so take the first clause and cap it.
 */
export function conciseSponsorLabel(
  sponsor: StrategicMove["sponsor"],
  maxLen = 64,
): string {
  const full = sponsorDisplayName(sponsor);
  if (full === UNASSIGNED_SPONSOR_LABEL) return full;
  const firstClause = full.split(/\.\s/)[0].trim() || full;
  return firstClause.length > maxLen
    ? `${firstClause.slice(0, maxLen).trim()}…`
    : firstClause;
}
