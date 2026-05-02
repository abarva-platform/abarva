export interface ApprovalPersonDisplay {
  name: string;
  role?: string | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

export function formatApprovalPersonDisplay(
  person: ApprovalPersonDisplay | null | undefined,
): string | null {
  if (!person?.name?.trim()) return null;
  const name = person.name.trim();
  const role = person.role?.trim();
  return role ? `${name} (${role})` : name;
}

export function safeApprovalActorLabel(
  value: string | null | undefined,
  fallback = 'Registered user',
): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return isUuidLike(trimmed) ? fallback : trimmed;
}

export function safeApprovalPersonLabel(
  value: string | null | undefined,
  fallback: string,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return isUuidLike(trimmed) ? fallback : trimmed;
}
