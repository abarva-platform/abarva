/**
 * Answer a route's catch block when the shared tenancy responder cannot.
 *
 * `tenancyErrorResponse` (`src/lib/auth/tenancy.ts`) matches four
 * `TenancyError` codes and its LAST statement is `throw err`. So the shape
 *
 * ```ts
 * } catch (err) {
 *   return tenancyErrorResponse(err);
 * }
 * ```
 *
 * handles tenancy and nothing else: a failed insert, a storage error, a
 * document-build throw or a model-stream failure is thrown a SECOND time from
 * inside the catch, the handler rejects, and the framework answers with an
 * unbodied 500. A product client doing
 * `await res.json().catch(() => ({}))` then has no `error` and no `detail` to
 * render, so a signed-in user is shown `HTTP 500` — or, worse, whatever
 * sentence that client keeps for "the server said nothing", which may assert a
 * write state nobody checked.
 *
 * This helper catches that second throw and answers with a NAMED refusal
 * instead. The tenancy arms are untouched: whatever `respondToTenancyError`
 * returns is returned unchanged, so a `TenancyError` still gets its own
 * 401/403/503 byte-for-byte.
 *
 * ## Why the responder is a parameter
 *
 * It would read better as `tenancyOrNamedErrorResponse(err, named)` with the
 * import done here. It cannot be: routes import `tenancyErrorResponse` from
 * their area's `_auth` re-export, and their suites mock THAT module path. A
 * responder imported here would resolve to the real `@/lib/auth/tenancy` while
 * the route under test uses the mock, so a suite's own `MockTenancyError` —
 * not an instance of the real class — would fall through to the named arm and
 * the tenancy cases would silently start returning 500. Passing the route's
 * own binding keeps the mock in force and the tenancy contract intact.
 */
export function tenancyOrNamedErrorResponse(
  err: unknown,
  respondToTenancyError: (err: unknown) => Response,
  named: {
    /** Machine code for the response body's `error`. */
    code: string;
    /** Product-language sentence for the response body's `detail`. */
    detail: string;
    /** Defaults to 500 — this arm is reached for an unhandled failure. */
    status?: number;
  },
): Response {
  try {
    return respondToTenancyError(err);
  } catch {
    // Deliberately swallowing: the re-thrown value is `err` itself, which the
    // caller already decided it cannot answer. Logging belongs to the route.
    return Response.json(
      { ok: false, error: named.code, detail: named.detail },
      { status: named.status ?? 500 },
    );
  }
}
