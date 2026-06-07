import {
  formatRuntimeSafeError,
  redactLegacySupabaseLogReferences,
  toRuntimeSafeError,
} from '../runtime-log-redaction';

describe('runtime log redaction', () => {
  it('redacts legacy Supabase URLs and hostnames from log text', () => {
    const value = [
      'connect ECONNREFUSED postgres://user:secret@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
      'fallback host db.xtbymdryojmvoulaotce.supabase.co was unreachable',
    ].join('\n');

    const redacted = redactLegacySupabaseLogReferences(value);

    expect(redacted).not.toContain('pooler.supabase.com');
    expect(redacted).not.toContain('supabase.co');
    expect(redacted).not.toContain('secret');
    expect(redacted).toContain('[redacted-legacy-supabase-url]');
    expect(redacted).toContain('[redacted-legacy-supabase-host]');
  });

  it('formats errors without exposing legacy Supabase hostnames', () => {
    const formatted = formatRuntimeSafeError(
      new Error('getaddrinfo ENOTFOUND aws-1-us-east-2.pooler.supabase.com'),
    );

    expect(formatted).toBe('getaddrinfo ENOTFOUND [redacted-legacy-supabase-host]');
    expect(formatted).not.toContain('pooler.supabase.com');
  });

  it('creates a safe error without preserving a raw cause', () => {
    const safeError = toRuntimeSafeError(
      new Error('failed to connect to db.xtbymdryojmvoulaotce.supabase.co'),
    );

    expect(safeError.message).not.toContain('supabase.co');
    expect('cause' in safeError).toBe(false);
  });
});
