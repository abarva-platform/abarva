const LEGACY_SUPABASE_URL_PATTERN =
  /\b(?:postgres(?:ql)?:\/\/|https?:\/\/)[^\s'"`<>]*(?:pooler\.supabase\.com|supabase\.co)[^\s'"`<>]*/gi;

const LEGACY_SUPABASE_HOST_PATTERN =
  /\b(?:[a-z0-9-]+\.)*(?:pooler\.supabase\.com|supabase\.co)\b/gi;

export function redactLegacySupabaseLogReferences(value: string): string {
  return value
    .replace(LEGACY_SUPABASE_URL_PATTERN, '[redacted-legacy-supabase-url]')
    .replace(LEGACY_SUPABASE_HOST_PATTERN, '[redacted-legacy-supabase-host]');
}

export function formatRuntimeSafeError(
  error: unknown,
  fallbackMessage = 'Runtime error',
): string {
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : String(error ?? '');
  const message = rawMessage.trim() || fallbackMessage;
  return redactLegacySupabaseLogReferences(message);
}

export function toRuntimeSafeError(
  error: unknown,
  fallbackMessage = 'Runtime error',
): Error {
  const safeError = new Error(formatRuntimeSafeError(error, fallbackMessage));
  if (error instanceof Error) {
    safeError.name = error.name;
  }
  return safeError;
}
