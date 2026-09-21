export const UUID_VALUE_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

export function containsUuidDisplayValue(
  value: string | null | undefined,
): boolean {
  return Boolean(value?.trim() && UUID_VALUE_PATTERN.test(value));
}
