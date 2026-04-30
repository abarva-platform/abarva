/**
 * Node CJS preload (used via NODE_OPTIONS='--require <this>')
 * that no-ops `server-only` and `client-only` for CLI scripts.
 *
 * `server-only` throws unconditionally so the Next.js bundler
 * can detect a server-only module accidentally imported into a
 * Client Component. At plain Node runtime (a CLI script that
 * pulls in transitively-server-only modules), that throw is a
 * false positive — the script is server-side, just not in a
 * Next.js request.
 *
 * Pattern: `require('server-only')` resolution is rerouted to
 * this same file (which has no exports), so the throw never
 * executes. Production code paths still get the real package
 * because this preload is opt-in via `NODE_OPTIONS`.
 */

const Module = require('node:module');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, ...rest) {
  if (request === 'server-only' || request === 'client-only') {
    return require.resolve(__filename);
  }
  return originalResolve.call(this, request, parent, ...rest);
};
