# Data-Access Adapter — VIP-profile read (Slice 2 follow-up)

Date: 2026-05-15
Lane: Claude Code (Azure data-access adapter)
Status: shipped

## Why this exists

Slice 2 migrated three genuine tenant-scoped read GET routes behind the
data-plane seam and explicitly **deferred `GET /api/debug/vip`** because
it is not a clean tenant-scoped read — it is entangled with Clerk
identity resolution. This follow-up does the smallest honest extraction
that still puts the route's Postgres-backed reads behind the seam.

The seam is unchanged: `ABARVA_DATA_PLANE` selects `supabase` (default —
unchanged production behavior) vs `azure-postgres` (opt-in).

## What was extracted

`vipProfileReadAdapter.ts` — a per-domain read adapter (same pattern as
`programsReadAdapter` / `turnTraceReadAdapter`), with a `supabase` and an
`azure-postgres` implementation selected by `resolveDataPlane()`.

Its single contract method, `getVipProfileLookup(personId, displayName)`,
owns the **three diagnostic `vip_profiles` lookups** the route performs
to explain a missing greeting:

1. by `person_id`
2. by exact `display_name` (case-insensitive `ILIKE` without wildcard)
3. by fuzzy first+last `display_name` (`first%last`, only when the name
   has >= 2 whitespace tokens — matching the pre-seam route exactly)

The route now calls `selectVipProfileReadAdapter().getVipProfileLookup()`
and assembles `result.vip_lookup` from the returned shape. The column
projection (`id, person_id, display_name, demo_tier, current_title,
current_company`) is lifted verbatim, so the route response is
byte-identical.

The adapter is **diagnostic-grade**: a query/connection failure yields
`null` for that lookup rather than throwing, mirroring the pre-seam route
which discarded Supabase errors and still returned the other results.

## What stayed coupled to Clerk — and why

These remain in `route.ts` because they are **identity / business logic,
not data-plane concerns**:

- **`currentUser()`** — Clerk session resolution. Not a Postgres read.
- **`getCurrentPerson()`** — resolves the `persons` row from the Clerk
  email. It is an identity-resolution helper; the adapter takes its
  output (`person.id`, `person.name`) as plain string inputs.
- **Prescription logic** — the `result.prescription[]` advice strings
  are pure business logic over the lookup results; no DB access.
- **`loadVipGreetingData()`** — left as a Supabase-direct read. It is a
  *separate* helper in `src/lib/agent/prompts/_shared/user-context.ts`
  that performs its **own** `vip_profiles` reads interleaved with
  greeting assembly and executive-profile fallback business logic
  (`loadExecutiveGreetingData`). Pulling it behind the seam would mean
  relocating that greeting/fallback business logic into the data plane —
  out of scope for a read-adapter slice, and a violation of the "adapter
  owns only the physical read" rule the slice pattern establishes. It
  remains a candidate for a future slice if/when that helper is itself
  refactored to separate its read from its assembly logic.

So the separation is honest but **partial**: the route's own three
diagnostic `vip_profiles` reads are fully behind the seam; the
`vip_profiles` reads buried inside `loadVipGreetingData` are not.

## Constraints honored

- No production data mutated; all queries read-only.
- No visible UI/product behavior change; route response shape unchanged.
- Supabase remains the default; the Azure path is opt-in only.
- Codex-lane and write-adapter files untouched.

## Tests

`src/lib/data-plane/read-adapters/__tests__/vip-profile-read-adapter.test.ts`
— 10 tests: default plane = supabase, Azure selectable by env/argument,
all three lookups map through on both planes, fuzzy lookup skipped for
single-token names, query failure degrades to nulls rather than a throw.
