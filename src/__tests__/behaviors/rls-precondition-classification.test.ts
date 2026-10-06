/**
 * C-632 · the runner must keep calling a precondition a precondition.
 *
 * The three messages below are NOT hand-written for this test. Each was
 * captured verbatim from `tests/security/rls-regression.sql` driven against a
 * disposable Postgres by `tests/security/test_rls_precondition_cause.ts`, whose
 * fixture puts the real `FOR ALL TO service_role` policy on `public.clients`
 * and connects as a role that policy does not cover. They are pinned here
 * because this half of the control runs in the ordinary behaviour gate, while
 * the SQL half needs a database; if the suite's wording drifts away from these,
 * the fixture test is where it is re-captured.
 *
 * What is actually at stake: `scripts/run-rls-regression.ts` exits 2 (NOT
 * CHECKED) for a precondition and 1 (FAILED) for a finding. Reporting a
 * precondition miss as a finding cries wolf on a P0 channel; reporting a
 * finding as a precondition miss hides one.
 */
import { readFileSync } from 'node:fs';

import {
  PRECONDITION_TOKEN,
  classifyPreconditionCause,
  isNotCheckedPrecondition,
  prescribesCanonicalizationMigration,
} from '@/lib/security/rls-precondition-classification';

const INVISIBLE =
  'rls-regression precondition: canonical tenant rows unresolved [cause=invisible] for tenant(s) ' +
  'fixture-tenant-alpha, fixture-tenant-beta. OBSERVED: connecting role=c632_probe_noinherit, session role=' +
  'c632_probe_noinherit, row security on public.clients enabled=true, forced=false, owner=' +
  'c632_table_owner, enforced against this role=true; rows this connection can see=0. PRIVILEGED ' +
  'VANTAGE: borrowed service_role, which resolved every key this connection could not see. The ' +
  'rows EXIST and are filtered from this connection by row security. Do NOT run a canonicalization ' +
  'migration — the directory is not missing these rows.';

const ABSENT =
  'rls-regression precondition: canonical tenant rows unresolved [cause=absent] for tenant(s) ' +
  'fixture-tenant-alpha, fixture-tenant-beta. OBSERVED: connecting role=c632_probe_noinherit, session role=' +
  'c632_probe_noinherit, row security on public.clients enabled=true, forced=false, owner=' +
  'c632_table_owner, enforced against this role=true; rows this connection can see=0. PRIVILEGED ' +
  'VANTAGE: borrowed service_role, which also could not resolve fixture-tenant-alpha, fixture-tenant-beta. ' +
  'The rows are absent from an unfiltered vantage. Run db:migrate + the canonicalization migration ' +
  'before this suite.';

const INDETERMINATE =
  'rls-regression precondition: canonical tenant rows unresolved [cause=indeterminate] for ' +
  'tenant(s) fixture-tenant-alpha, fixture-tenant-beta. OBSERVED: connecting role=c632_probe_nosvc, session ' +
  'role=c632_probe_nosvc, row security on public.clients enabled=true, forced=false, owner=' +
  'c632_table_owner, enforced against this role=true; rows this connection can see=0. PRIVILEGED ' +
  'VANTAGE: none reachable — this role is not a member of service_role and does not bypass row ' +
  'security, so it has no unfiltered read to compare against. BOTH causes remain consistent with ' +
  'what was observed: the rows may be absent, or they may exist and be filtered from this ' +
  'connection.';

const A_REAL_FINDING =
  'RLS regression FAILED: 3 (tenant, table) pairs leaked rows across the tenant boundary';

describe('C-632 · RLS precondition classification', () => {
  it('reports all three causes as NOT CHECKED, because none of them probed anything', () => {
    for (const message of [INVISIBLE, ABSENT, INDETERMINATE]) {
      expect(isNotCheckedPrecondition(message)).toBe(true);
    }
  });

  it('still reports the no-tenants-supplied precondition, which predates C-632', () => {
    expect(
      isNotCheckedPrecondition(
        'RLS regression expected tenants were not supplied. Run this suite through scripts/run-rls-regression.ts.',
      ),
    ).toBe(true);
  });

  it('does not swallow a real leak finding as a precondition', () => {
    expect(isNotCheckedPrecondition(A_REAL_FINDING)).toBe(false);
    expect(classifyPreconditionCause(A_REAL_FINDING)).toBeNull();
  });

  it('names the cause the suite named, and keeps the three apart', () => {
    expect(classifyPreconditionCause(INVISIBLE)).toBe('invisible');
    expect(classifyPreconditionCause(ABSENT)).toBe('absent');
    expect(classifyPreconditionCause(INDETERMINATE)).toBe('indeterminate');
  });

  it('prescribes the canonicalization migration for absent only — never for the other two', () => {
    expect(prescribesCanonicalizationMigration(ABSENT)).toBe(true);
    // These are the two the pre-C-632 message prescribed it for, and the reason
    // the item was filed: the remedy mutates a shared control database.
    expect(prescribesCanonicalizationMigration(INVISIBLE)).toBe(false);
    expect(prescribesCanonicalizationMigration(INDETERMINATE)).toBe(false);
  });

  it('treats a precondition raise whose cause it cannot read as NOT CHECKED, not as a finding', () => {
    // Forward compatibility: a future cause this build does not know about must
    // not be reclassified as a leak.
    const unknown = `${PRECONDITION_TOKEN} canonical tenant rows unresolved [cause=something-new] for tenant(s) x.`;
    expect(isNotCheckedPrecondition(unknown)).toBe(true);
    expect(classifyPreconditionCause(unknown)).toBeNull();
    expect(prescribesCanonicalizationMigration(unknown)).toBe(false);
  });

  it('keeps the suite and the classifier on one token, so a reworded suite cannot drift silently', () => {
    // Read the shipped suite, not a copy: the token the classifier keys on must
    // be the token the suite raises.
    const sql = readFileSync('tests/security/rls-regression.sql', 'utf8');
    expect(sql).toContain(PRECONDITION_TOKEN);
  });
});
