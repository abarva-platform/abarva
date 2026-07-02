import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const QUERIES_FILE = resolve(__dirname, '../queries.ts');

describe('B7 — event code as URL slug', () => {
  let source: string;
  beforeAll(() => {
    source = readFileSync(QUERIES_FILE, 'utf8');
  });

  it('detects UUIDs with the documented regex', () => {
    expect(source).toContain('UUID_REGEX');
    expect(source).toMatch(/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$/);
    expect(source).toMatch(/UUID_REGEX\.test\(value\)/);
  });

  it('queries source_events by id when slug is a UUID, falls back to event_code otherwise', () => {
    expect(source).toMatch(/if \(isUuid\(eventId\)\)/);
    // Corrected expectation: the raw Supabase builder chains (.eq('id', …),
    // .eq('event_code', …)) were moved out of queries.ts into the
    // data-plane read adapter (sourceEventsReadAdapter.ts). queries.ts now
    // routes UUID slugs to getEventByIdForClient and event_code slugs to
    // getEventByCodeForClient; both branches still live in
    // getPersistedSourceEventRow.
    expect(source).toMatch(/adapter\.getEventByIdForClient\(\s*eventId,\s*key,\s*\)/);
    expect(source).toMatch(/adapter\.getEventByCodeForClient\(\s*eventId,\s*key,\s*\)/);
  });

  it('event_code path tolerates duplicate codes via order+limit (regression: prod 404)', () => {
    // Substrate has known duplicate event_codes. .maybeSingle() errors
    // when more than one row matches, which produced silent 404s on
    // /source/events/<code> in prod. The fix orders by updated_at and
    // takes the most-recent row.
    //
    // Corrected expectation: that order+limit query now lives in the
    // data-plane adapter's getEventByCodeForClient, not inline in
    // queries.ts. queries.ts documents the resilience contract and
    // delegates to the by-code adapter method.
    expect(source).toMatch(/getEventByCodeForClient/);
    expect(source).toMatch(/duplicate event_codes/);
  });

  it('access check uses the resolved row.id (UUID), never the raw slug', () => {
    // After B7 the access policy is checked against persistedEvent.id,
    // not the URL slug — otherwise an event_code slug would always 403.
    expect(source).toMatch(/canReadSourceEvent\([\s\S]*activeClient\.key,[\s\S]*persistedEvent\.id/);
  });
});
