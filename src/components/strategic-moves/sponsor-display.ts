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
