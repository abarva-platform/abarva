import { createdTables, stripSqlComments } from '../reconcile-schema-ledger';

/**
 * The reconciliation's parser, which is the half that can be wrong silently.
 *
 * A migration apply failed against the live database because
 * `source_event_pricing_submissions` was absent while the ledger recorded its
 * creating migration as applied. 267 of 415 ledger rows carry no hash, so for
 * those the ledger is a claim rather than evidence. This script turns that into
 * a list — but only if it reads each migration's DDL correctly. A parser that
 * finds fewer tables than a file creates reports a clean database that is not.
 */

describe('createdTables', () => {
  it('reads a plain create', () => {
    expect(createdTables('CREATE TABLE source_events (id UUID);')).toEqual([
      'source_events',
    ]);
  });

  it('reads the IF NOT EXISTS form every migration here uses', () => {
    expect(
      createdTables('CREATE TABLE IF NOT EXISTS source_event_vendors (id UUID);'),
    ).toEqual(['source_event_vendors']);
  });

  it('keeps a schema-qualified name qualified', () => {
    expect(createdTables('CREATE TABLE IF NOT EXISTS source.vendor (id UUID);')).toEqual([
      'source.vendor',
    ]);
  });

  it('reads every table in a multi-table migration', () => {
    const sql = `
      BEGIN;
      CREATE TABLE IF NOT EXISTS source_event_vendors (id UUID);
      CREATE TABLE IF NOT EXISTS source_event_vendor_sessions (id UUID);
      CREATE TABLE IF NOT EXISTS source_event_vendor_events (id UUID);
      COMMIT;`;
    expect(createdTables(sql)).toHaveLength(3);
  });

  it('ignores a CREATE TABLE that is commented out', () => {
    /*
     * The failure this prevents: a migration header that documents an earlier
     * shape in a comment would otherwise be read as DDL, and the
     * reconciliation would report a table missing that was never meant to
     * exist — sending someone to repair a hole that is not there.
     */
    const sql = `
      -- CREATE TABLE source_event_legacy (id UUID);
      /* CREATE TABLE source_event_also_legacy (id UUID); */
      CREATE TABLE IF NOT EXISTS source_event_real (id UUID);`;
    expect(createdTables(sql)).toEqual(['source_event_real']);
  });

  it('does not treat ALTER TABLE as a creation', () => {
    // The portal migration ALTERs source_event_pricing_submissions. Reading
    // that as a creation would hide the very gap this script exists to find,
    // by attributing the table to a migration that only adds a column.
    const sql = `
      CREATE TABLE IF NOT EXISTS source_event_vendors (id UUID);
      ALTER TABLE source_event_pricing_submissions ADD COLUMN vendor_id UUID;`;
    expect(createdTables(sql)).toEqual(['source_event_vendors']);
  });

  it('reports each table once when a migration is re-runnable', () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS t (id UUID);
      CREATE TABLE IF NOT EXISTS t (id UUID);`;
    expect(createdTables(sql)).toEqual(['t']);
  });

  it('finds nothing in a migration that only adds policies', () => {
    const sql = `
      ALTER TABLE source_event_vendors ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "p" ON source_event_vendors FOR SELECT TO authenticated USING (true);`;
    expect(createdTables(sql)).toEqual([]);
  });
});

describe('stripSqlComments', () => {
  it('leaves a double dash inside a string literal alone', () => {
    const out = stripSqlComments("SELECT '--not a comment' AS a;");
    expect(out).toContain("'--not a comment'");
  });

  it('preserves length so offsets still point at real SQL', () => {
    const raw = '-- gone\nCREATE TABLE t (id UUID);';
    expect(stripSqlComments(raw)).toHaveLength(raw.length);
  });

  it('blanks a block comment but keeps the statement after it', () => {
    const out = stripSqlComments('/* gone */ CREATE TABLE t (id UUID);');
    expect(out).not.toContain('gone');
    expect(out).toContain('CREATE TABLE t');
  });
});
