# Application-side tenant fence on `source_events` — enumeration, 2026-09-20

Read-only code audit. No database was queried, no Azure command was run, nothing
was mutated. Every statement below is about source code in this repository at
`db3ebada7`.

## Question

Every application read or write of `source_events` was to be **enumerated, not
sampled**, and each checked for a tenant predicate.

## Result

| | |
|---|---|
| Non-test files mentioning `source_events` | 88 |
| **Query call sites** (`.from("source_events")`, comments excluded) | **55** |
| Carrying an executable tenant predicate or comparison | **53** |
| **Without one** | **2** |
| Reachable with caller-controlled input from a request path | **0** |

**No cross-tenant read or write was found.** Both unfenced sites are in
`src/lib/source/value-chain.ts`, and neither is reachable from a request path
with an identifier the caller chooses.

## The two unfenced sites

### `value-chain.ts:142` — `loadSourceEvent`

Selects by `.eq("id", resolvedEventId)` with no tenant predicate, on the
**write** client.

It is reached only by five exports — `computeBaseline`, `recordIntervention`,
`recordNegotiatedOutcome`, `attestRealized`, `computeCumulativeSavings` — and
**nothing in the repository imports any of them at runtime.** The only
references outside the module are a smoke check that asserts those names appear
in the file's text, and two tests asserting the strings do *not* appear in buyer
copy. So the unfenced read sits behind code no request can enter.

### `value-chain.ts:165` — `resolveSourceEventIdForValue`

Matches `event_code` with `.ilike()` **across all tenants**, ordered newest
first, `limit 1`. If two tenants ever hold the same event code, this returns
whichever was updated last.

This one *is* reached from a live path, by `getValueChain`. It is safe today for
a reason outside the function: `getValueChain`'s only importer is
`src/app/(maestro)/source/events/[eventId]/value/page.tsx`, which first calls
`getSourcingEvent(eventId)`, `notFound()`s when that returns nothing, and then
passes `event.id` — a UUID the database returned. `resolveSourceEventIdForValue`
short-circuits on UUID input, so the cross-tenant branch never executes.

`getSourcingEvent` is fenced thoroughly: it resolves the active client, looks the
row up scoped to that client's key, gates on the read policy, and then re-checks
tenant ownership a second time with a comment saying the re-check exists so a
future policy bug cannot leak data.

**So the boundary here holds because of the caller, not the function.** A second
caller passing an event code rather than a UUID would cross tenants, and nothing
in the module would stop it. That is the finding worth carrying forward; it is a
latent fragility, not a live defect, and it is not repaired here because the
repair would touch only code that nothing reaches.

## What this audit does not establish

The item's premise was that the deployed database has tenant-scoped policies on
`source_events` but the application connects with a role that bypasses row-level
security, making application checks the real boundary. **That database-side claim
is not verified by this audit** and is not asserted. Verifying it requires
inspecting the deployed role, which is outside a read-only code audit.

Separately, `getValueChain` reads `source_value_states` and `source_value_chain`
filtered only by `source_event_id`. Those tables are outside this audit's scope,
and their fence was not assessed.

## The instrument was wrong five times

The scan that triaged the 55 sites was corrected five times, and every
correction is a reason not to trust this class of tool on its own. Four made the
code look **worse** than it is and one made it look **better**:

| Defect | Direction |
|---|---|
| Fence window of ±30 lines — real fences sit up to 32 lines after the query | 4 false alarms |
| Counted a query inside a block comment as a call site | 2 false alarms |
| Recognised `.eq("client_key", …)` but not a `client_key:` insert payload | 3 false alarms |
| Recognised `.eq()` but not `.in("client_key", …)` | 2 false alarms |
| `\s*` outside a negative lookahead backtracks to zero width, so a **TypeScript field declaration** `client_key: string \| null` was accepted as a tenant fence | **1 missed site** |

The last one is the important one: it silently marked `value-chain.ts:142` as
fenced. It was caught by a self-check asserting the fence pattern must *reject* a
type declaration — not by reading the output, which looked entirely reasonable.

The final figures rest on **reading all four flagged sites and every site whose
fence was attributed to a token**, not on the regex verdict. The scan reports
which token fenced each site and at which line, so the attribution is checkable
rather than asserted.

## No guard is proposed

The obvious follow-up — a check that fails when a new unfenced `source_events`
query appears — would assert source text rather than run its subject, which is
the same shape as the smoke check that is currently keeping five unreachable
exports alive. A tenant fence is a runtime property; a grep for `.eq(` cannot
distinguish a fence from a type declaration, as demonstrated above. Recording
the enumeration is the deliverable.
