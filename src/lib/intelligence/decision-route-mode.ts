export type IntelligenceDecisionRouteMode =
  | 'tenant-selection'
  | 'tenant-empty'
  | 'reference-example';

interface ResolveIntelligenceDecisionRouteModeInput {
  activeClientKey: string | null | undefined;
  industryKey: string | null | undefined;
  bindingExpectedClientKey?: string | null | undefined;
}

export function firstClientSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function resolveIntelligenceDecisionRouteMode({
  activeClientKey,
  industryKey,
  bindingExpectedClientKey,
}: ResolveIntelligenceDecisionRouteModeInput): IntelligenceDecisionRouteMode {
  if (!industryKey) {
    return activeClientKey ? 'tenant-empty' : 'reference-example';
  }

  if (
    activeClientKey &&
    bindingExpectedClientKey &&
    bindingExpectedClientKey !== activeClientKey
  ) {
    return 'tenant-empty';
  }

  return 'tenant-selection';
}
