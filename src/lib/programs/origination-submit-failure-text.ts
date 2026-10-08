// Product sentences for the P0 origination submit failures that used to answer
// with raw internal error text.
//
// POST /api/programs/origination-submit is the deterministic P0 submit path and
// the first step of a Move: nothing else creates the `engagements` row. Both of
// its product clients render the response's `message` field FIRST --
// `StrategicMoveOriginateClient` does `payload.message ?? payload.error ??
// "Submit failed."` and `ProgramOriginationWorkspace` does `body.message ??
// ...` -- so whatever `message` carries is what a signed-in user reads, and it
// outranks the machine `error` code rather than supplementing it.
//
// Four of that path's failures put a driver/database string in `message`, so
// the user read internals instead of an instruction:
//
//   1. `person_lookup_failed`        -- `error.message` from the persons query.
//   2. `person_placeholder_failed`   -- `placeholderError?.message ?? <a good
//      sentence that was already written>`. The raw text was PREFERRED over the
//      sentence, so the sentence only ever rendered when there was no error
//      message to shadow it.
//   3. `engagement_insert_failed`    -- `insertError?.message ?? ...`, again
//      raw-preferred. This is the insert that creates the Move, so it is the
//      most likely failure at P0 and the one most likely to be read.
//   4. `origination_submit_failed`   -- the route's unexpected-failure arm,
//      `err instanceof Error ? err.message : String(err)`.
//
// A fifth did something different and worse: the `requireTenancy` arm threw
// `new OriginationSubmitError(err.code, err.code, ...)`, passing the machine
// code as the MESSAGE. `TenancyError` is `super(code)`, so there is no authored
// sentence anywhere in that chain, and a user whose session lapsed while
// filling the brief read the bare token `unauthenticated`. Its four codes need
// their own family, because the remedy is categorically different from a write
// failure: signing in again is the fix, and "submit again" is not.
//
// What leaked is not cosmetic: a Postgres/driver message can name a table, a
// column, a constraint, or a host:port from the data plane, and these are
// 500-class failures reached from a tenant-facing form.
//
// The raw text stays useful to operators -- every call site logs it under the
// file's existing `[origination-submit] ...` convention before throwing, and
// the route already logs its own arm. Only the product-facing `message`
// changes. The machine `error` code is untouched, so anything keying on the
// code keeps working.
//
// Sentences here deliberately do NOT tell a product user to read server logs:
// that is not an action they can take, and naming it is how a failure report
// stops being useful to the person reading it.
//
// No database access and no `server-only`, so a suite can import this directly.

/**
 * The origination-submit failure codes whose product sentence lives here.
 *
 * These are exactly the codes that previously answered with raw internal text.
 * Codes that already carried an authored sentence (`person_not_found`,
 * `forbidden`, `unknown_discovery_archetype`, `missing_field`, ...) are NOT
 * listed: they keep their own wording and must not be routed through here.
 */
export type OriginationSubmitFailureCode =
  | "person_lookup_failed"
  | "person_placeholder_failed"
  | "engagement_insert_failed"
  | "origination_submit_failed";

/**
 * The `TenancyError` codes `requireTenancy` can refuse the P0 submit with.
 * Mirrors the union on that class, whose constructor is `super(code)` -- so the
 * code was all the submit path ever had to show a user.
 */
export type OriginationSubmitAccessCode =
  | "unauthenticated"
  | "no_client"
  | "forbidden"
  | "tenant_lookup_unavailable";

const SENTENCES: Record<OriginationSubmitFailureCode, string> = {
  person_lookup_failed:
    "The sponsor could not be looked up, so this Move was not created and nothing was saved. " +
    "Submit again; if it refuses the same way, the people records for this client cannot be read " +
    "right now and an operator has to clear that before a Move can be originated.",
  person_placeholder_failed:
    "This Move was not created, because the named sponsor could not be registered as a pending " +
    "contact in this client's people records. Nothing was saved. Submit again; if it refuses the " +
    "same way, pick a sponsor who already exists in this client's people records instead.",
  engagement_insert_failed:
    "This Move could not be created, and nothing was saved -- there is no partial Move to clean " +
    "up. Submit again; if it refuses the same way, the Moves records for this client cannot be " +
    "written right now and an operator has to clear that first.",
  origination_submit_failed:
    "This Move could not be created because of an unexpected failure, and nothing was saved. " +
    "Submit again; if it refuses the same way, report it with the time you tried -- the failure " +
    "is recorded against this request so it can be traced without you repeating it.",
};

/**
 * The sentence a signed-in user should read for `code`.
 *
 * The final arm is defensive on purpose: a failure code added to the submit
 * path later must get a sentence that says nothing it cannot back up, rather
 * than falling through to a named cause's wording or back to raw text.
 */
export function originationSubmitFailureSentence(
  code: OriginationSubmitFailureCode | string,
): string {
  if (Object.prototype.hasOwnProperty.call(SENTENCES, code)) {
    return SENTENCES[code as OriginationSubmitFailureCode];
  }
  return (
    "This Move could not be created, and nothing was saved. Submit again; if it refuses the same " +
    "way, report it with the time you tried."
  );
}

const ACCESS_SENTENCES: Record<OriginationSubmitAccessCode, string> = {
  unauthenticated:
    "Your session is no longer signed in, so this Move was not created and nothing was saved. " +
    "Sign in again and resubmit the brief.",
  no_client:
    "This Move was not created, because your session is not currently working in a client " +
    "workspace, and a Move has to belong to one. Nothing was saved. Pick a client, then resubmit " +
    "the brief.",
  forbidden:
    "This Move was not created, because your access does not allow originating Moves for this " +
    "client. Nothing was saved. Ask an administrator for Programs access to this client, then " +
    "resubmit the brief.",
  tenant_lookup_unavailable:
    "This Move was not created, because your client access could not be checked right now. " +
    "Nothing was saved, and this is not a change to your permissions. Resubmit the brief shortly; " +
    "if it refuses the same way, an operator has to clear it.",
};

/**
 * The sentence a signed-in user should read when `requireTenancy` refuses the
 * P0 submit.
 *
 * Separate from {@link originationSubmitFailureSentence} on purpose: these
 * failures are about who the user is, not about a write that failed, so the
 * write family's "submit again" would be wrong advice for most of them.
 *
 * The final arm is defensive for the same reason as the write family's: a code
 * added to `TenancyError` later must not inherit a named cause's wording.
 */
export function originationSubmitAccessSentence(
  code: OriginationSubmitAccessCode | string,
): string {
  if (Object.prototype.hasOwnProperty.call(ACCESS_SENTENCES, code)) {
    return ACCESS_SENTENCES[code as OriginationSubmitAccessCode];
  }
  return (
    "This Move was not created, because your access to this client could not be confirmed. " +
    "Nothing was saved. Sign in again and resubmit the brief."
  );
}
