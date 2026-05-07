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
    expect(source).toMatch(
      /UUID_REGEX = \/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$\/i/,
    );
  });

  it('queries source_events by id when slug is a UUID, falls back to event_code otherwise', () => {
    expect(source).toMatch(/if \(isUuid\(eventId\)\)/);
    // Both lookup paths exist in getPersistedSourceEventRow.
    expect(source).toMatch(/\.eq\('id', eventId\)/);
    expect(source).toMatch(/\.eq\('event_code', eventId\)/);
  });

  it('access check uses the resolved row.id (UUID), never the raw slug', () => {
    // After B7 the access policy is checked against persistedEvent.id,
    // not the URL slug — otherwise an event_code slug would always 403.
    expect(source).toMatch(/canReadSourceEvent\([^,]+,\s*activeClient\.key,\s*persistedEvent\.id\)/);
  });
});
