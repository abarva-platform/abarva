/**
 * Test-time boundary for the Postgres driver. T-469.
 *
 * WHY THIS FILE EXISTS, measured rather than assumed. Whether an unstubbed
 * data-plane read under jest is safe is a property of **which client the code
 * sits behind**, and it is invisible from the test file. Probed by execution
 * against a dead local port (`127.0.0.1:59999`) on `1902350b2`:
 *
 *   • `read-adapters/azureSession.ts` — `import { Pool } from 'pg'`, static.
 *     Unstubbed read: `ECONNREFUSED` in ~3 ms. It **opened a socket**. With a
 *     real `DATABASE_URL` in the environment that is a live tenant read.
 *   • `read-adapters/azurePostgresReadAdapter.ts` — `import { Client } from
 *     'pg'`, static. Same: `ECONNREFUSED`, socket opened.
 *   • per-domain pools (`@/lib/corpus/db` and its siblings) — `import { Pool }
 *     from 'pg'`, static. Same.
 *   • `postgresCompat.ts` — reaches `pg` through
 *     `new Function('specifier', 'return import(specifier)')`, which the jest
 *     VM refuses without `--experimental-vm-modules`. The refusal is swallowed
 *     into `{data: null, error: {...}}` in 0 ms with no socket.
 *
 * So "it went green" tells you nothing: on one client it means the read was
 * stubbed, on the other it can mean the read failed and the failure was read
 * back as "no rows". The verdicts are recorded in
 * `docs/architecture/data-plane-test-boundary.json` and re-proved on every run
 * by `src/lib/data-plane/__tests__/test-boundary.test.ts`.
 *
 * WHAT THIS FILE DOES. `jest.config.ts` maps `^pg$` here, so every module that
 * imports the driver under jest gets this wrapper instead. A `connect()` or
 * `query()` that would open a socket **throws by name** instead of reading.
 * That is the opposite of today's default on both paths: loud beats a live read
 * and loud beats a swallowed null.
 *
 * HOW TO OPT OUT, explicitly and never by accident:
 *   • stub the boundary the code imports — `jest.mock('pg', ...)` resolves here
 *     and replaces this module wholesale, so the guard is not in the path;
 *   • or set `ABARVA_TEST_ALLOW_DATA_PLANE_CONNECT=1` for a suite that is
 *     supposed to reach a real database (the integration lane).
 *
 * The real driver is reached as `pg/lib/index.js` because the `^pg$` mapping
 * would otherwise resolve this file's own import back to itself.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

const realPg = require('pg/lib/index.js');

const ALLOW_ENV = 'ABARVA_TEST_ALLOW_DATA_PLANE_CONNECT';

/** Read at CALL time, not at load time, so a single suite can toggle it. */
function connectAllowed(): boolean {
  return process.env[ALLOW_ENV] === '1';
}

class DataPlaneTestBoundaryError extends Error {
  readonly code = 'ABARVA_TEST_DATA_PLANE_CONNECT_BLOCKED';

  constructor(call: string) {
    super(
      `[data-plane test boundary] ${call} was called under jest with no stand-in installed.\n` +
        'This would have opened a Postgres socket. If DATABASE_URL or ' +
        'ABARVA_AZURE_DATABASE_URL points at a real database, that is a live ' +
        'tenant read on every pull request.\n' +
        'Fix it by stubbing the boundary the code under test actually imports ' +
        '(see src/lib/atlas/__tests__/tower-grounding-client-name.test.ts for a ' +
        'strict stand-in that also proves which table was touched).\n' +
        `If this suite is meant to reach a real database, set ${ALLOW_ENV}=1 for it.`,
    );
    this.name = 'DataPlaneTestBoundaryError';
  }
}

function guard<T extends (...args: any[]) => any>(original: T, call: string): T {
  return function guarded(this: unknown, ...args: any[]) {
    if (!connectAllowed()) throw new DataPlaneTestBoundaryError(call);
    return original.apply(this, args);
  } as unknown as T;
}

for (const name of ['Pool', 'Client'] as const) {
  const ctor = realPg[name];
  if (!ctor?.prototype) continue;
  for (const method of ['connect', 'query'] as const) {
    const original = ctor.prototype[method];
    if (typeof original !== 'function' || original.__abarvaGuarded) continue;
    const guarded = guard(original, `${name}.prototype.${method}()`);
    (guarded as any).__abarvaGuarded = true;
    ctor.prototype[method] = guarded;
  }
}

// Re-exported by name rather than with `export =`, which this project's module
// target rejects. Every own key of `pg`'s entry module is listed (checked
// against `Object.keys(require('pg/lib/index.js'))` rather than from memory),
// plus the `native` getter, so a consumer's `import { X } from 'pg'` resolves
// exactly as it does without the mapping. The objects are the real ones — only
// `Pool`/`Client`'s `connect` and `query` are wrapped, above.
export const defaults = realPg.defaults;
export const Client = realPg.Client;
export const Query = realPg.Query;
export const Pool = realPg.Pool;
export const Connection = realPg.Connection;
export const types = realPg.types;
export const DatabaseError = realPg.DatabaseError;
export const TypeOverrides = realPg.TypeOverrides;
export const escapeIdentifier = realPg.escapeIdentifier;
export const escapeLiteral = realPg.escapeLiteral;
export const Result = realPg.Result;
export const utils = realPg.utils;
export const native = realPg.native;

export { DataPlaneTestBoundaryError };

export default realPg;
