# Source multi-vendor fact model (Phase 2)

_The governed multi-vendor extension of the Source fact model. Phase 1
(`docs/build/source-downstream-insight-fact-model.md`) landed **Shape 1 —
per-lever status** on a `value_lever` entity kind (RFP clause coverage, Committed
value, BAFO progress). This doc designs **Shape 2 — per-vendor / vendor×lever**,
and lands the first insight built on it: **Responses coverage**._

## The gap

Shape 1 answered "what is true about lever L?" — one fact per lever, keyed by the
lever key in `entity_ref`. The downstream **Responses coverage** and **Evaluation
should-cost** insights need a second axis: **the vendor**. "Did vendor V address
lever L?" and "what did vendor V bid on line item X?" are per-vendor questions the
scalar catalog and the `value_lever` shape cannot express.

Today `buildResponseCoverageInsight` is a MODEL: every value dimension is shown as
"dodged" because there is no vendor-response fact to read. Making it live needs a
governed way to say "vendor V addressed lever L", scoped to the real vendors
bidding the event — never free text on either axis.

## Principle: reuse the governed `entity_ref` dimension, add a composite kind

We do **not** fake composite fact keys. As Shape 1 hung a per-lever fact off a
canonical lever key via `entity_ref`, Shape 2 hangs a per-**vendor×lever** fact
off a canonical **composite** `entity_ref`. Both halves of the composite must be
canonical; neither is ever free text.

### Vendor registry — chosen: derive the vendor set from the response/bid rows

Two governed options were weighed:

- **(A) A first-class `VENDORS_V1` registry template** — a `Vendor Id` +
  `Vendor Name`, `entity_kind='vendor'` template the operator uploads first to
  declare the bidding vendors, which the response/bid rows then reference.
- **(B) Derive the vendor set from the response rows themselves** — the
  `RESPONSE_COVERAGE_V1` upload already carries a `Vendor` column per row; the set
  of distinct `Vendor` values IS the event's bidding-vendor set.

**Decision: (B) — derive from the rows.** Rationale (lower-complexity governed
option):

- `CONTRACT_TERMS_V1` **already** carries a `Vendor` entity-ref column and writes
  `entity_kind='vendor'` facts keyed by that vendor id. The event therefore
  **already has a governed notion of "a vendor"** from the commercials upload — a
  separate `VENDORS_V1` registry would duplicate it and introduce a
  referential-integrity burden (a response row's `Vendor` would have to match a
  `VENDORS_V1` row, adding a second failure mode and a mandatory upload ordering).
- A vendor id does not need enrichment metadata the way a fact key does — it is an
  opaque tenant-supplied identifier (the vendor's name/short-code), not a value the
  math consumes by key. There is nothing for a registry to *describe*. The
  governance that matters is (1) the id is present and non-empty, and (2) the
  **lever** half of the composite is canonical. A registry adds a table without
  adding either guarantee.
- Deriving keeps the slice additive: no new upload ordering, no new
  cross-template join, no new entity kind beyond the one composite kind Shape 2
  actually needs.

The vendor id is thus **governed by presence** (a `vendor_lever` fact with an empty
vendor half is rejected loudly, exactly as an entity-level fact with no entity id
is today), and canonicalized only by trimming/normalizing whitespace. The **lever**
half carries the hard canonical guarantee (see below). If a future insight needs a
vendor *display name* distinct from the id, or vendor-level attributes, a
`VENDORS_V1` registry can be added then — deliberately, when a consumer needs it —
without disturbing this shape.

> Note: vendor identity is a tenant identifier, not a real-company name leak. The
> same real-name-cover-mapping governance that applies to every Source object
> applies here; the composite carries whatever cover identifier the tenant's data
> already uses for the vendor.

### The `vendor_lever` composite

- **New entity kind `entity_kind='vendor_lever'`.** A fact of this kind captures
  "vendor V's answer to lever L".
- **Canonical composite `entity_ref = '<vendorId>::<leverKey>'`.** The `::`
  separator is chosen because a canonical archetype lever key is
  dot-delimited (`AMS.VOLUME_BAND_PRICING`) and a vendor id may contain spaces or
  hyphens but not `::`; `::` is unambiguous and human-legible in a citation
  locator. Both halves are recoverable by splitting on the **first** `::`.
- **Governance — both halves canonical, never free text:**
  - The **lever** half MUST be a canonical archetype lever key, validated at
    *read* time against the resolved archetype's `valueLeverRules` (identical to
    how Shape 1 validates a `value_lever` `entity_ref`). A `vendor_lever` row whose
    lever half is not a declared lever key simply never matches a rendered lever —
    it cannot inject a phantom lever. At *ingest* time the structured-map also
    rejects a row whose lever key is not in the archetype's lever-key set, loudly
    (a `rejectedRows` entry), so a typo'd lever is surfaced at upload, not silently
    dropped.
  - The **vendor** half MUST be present and non-empty (governed by presence, per
    the vendor-registry decision).

One fact key, many rows — one per vendor×lever cell — disambiguated entirely by
`entity_ref`, never by mangling the key.

### The signal fact: `response_addressed`

A hand-authored signal fact in `DOWNSTREAM_SIGNAL_FACT_SPECS` (co-located with the
Shape 1 signals; exempt from the "every catalog key is a lever input" invariant,
since a signal is not a lever input):

- `response_addressed` — `entity_kind='vendor_lever'`, `unit='ratio'`,
  value **1 = addressed**, **0 = dodged**, **0.5 = partial**. The `ratio` unit is
  reused exactly as Shape 1 reused it for the boolean `rfp_clause_present` — no new
  `flag`/`enum` unit, no type/DB churn. `0.5` (partial) is a legitimate value on
  the same ratio scale; the insight treats `>= 1` as addressed, `> 0 && < 1` as
  partial, `0` as dodged.

## Structured-map extension — additive composite `entityRefColumns`

`structured-map.ts` builds a fact's `entity_ref` from a **single**
`entityRefColumn` today. Shape 2 needs a composite from **two** columns
(`Vendor` + `Lever Key`). This is designed as an **additive template option**, not
a rewrite:

- `TemplateFactMap` gains an optional `entityRefColumns?: string[]`. When present,
  the row's `entity_ref` is the canonical join of those columns' trimmed values
  with `::` (`<Vendor>::<Lever Key>`). When absent, the existing single
  `entityRefColumn` path is used **unchanged** — every existing single-column
  template keeps working byte-for-byte.
- Exactly one of `entityRefColumn` / `entityRefColumns` is set per template
  (a template-fact-map test asserts this).
- The composite path adds two loud rejections (never silent):
  1. any composite column blank on a row → `rejectedRows` (a composite fact needs
     both halves);
  2. the lever half not in the archetype's canonical lever-key set →
     `rejectedRows`. To validate the lever half at ingest, `mapTemplateUploadToFacts`
     takes an optional `validLeverKeys?: ReadonlySet<string>` (the resolved
     archetype's lever keys); the ingest caller passes it. When not supplied
     (unit tests of non-composite templates), lever validation is skipped and the
     existing behavior is unchanged.
- The single-column entity-ref rejection ("entity-level fact requires a value in
  entity-ref column …") is preserved for single-column templates.

The citation carries the composite: `source_citation.entity_ref_column` becomes
`'Vendor::Lever Key'` and `entity_ref` the joined value, so provenance is legible.

## The reader + the insight — what "live" means for Responses coverage

A `readVendorLeverResponses`-style reader (mirroring
`readRfpClausePresentLeverKeys`) reads the newest non-stale `response_addressed`
facts for the event, tenant-scoped, and returns:

- `signalPresent` — whether ANY non-stale `response_addressed` fact exists
  (drives live vs model);
- `addressedByVendorLever` — a map `vendorId → (leverKey → status)` where status ∈
  {addressed, partial, dodged}, newest-per-(vendor,lever) wins.

`buildResponseCoverageInsight` goes **LIVE** when `signalPresent`:

- **Per-lever `rows`** (the existing view shape, unchanged for the current
  renderer): a lever's `status` is `answered` iff **≥1 vendor addressed it**
  (value ≥ 1), else `dodged`. A lever no vendor has a fact for stays `dodged`
  ("not yet answered") — never fabricated as answered.
- **Per-vendor coverage** (new, additive `vendors` field on the view): for each
  vendor in the derived set, its coverage across the archetype's levers
  (addressed / partial / dodged / not-yet-answered counts + the $ at stake it
  addressed vs left exposed). A vendor×lever with no fact is "not yet answered",
  never fabricated.
- `provenance: 'live'`, `isModel: false` when ≥1 fact; the honest MODEL
  (`isModel: true`, every dimension dodged, the flip-fact note) is preserved
  unchanged when none exist.

The view model extension is **purely additive** — an optional `vendors` field and
an `isModel` flag. The existing `ResponseCoverageInsight` renderer reads `rows`
and keeps working with no change; the per-vendor breakdown renders additively.

## Build order

1. **Responses coverage (THIS increment).** `vendor_lever` kind + migration +
   composite structured-map + `response_addressed` signal + `RESPONSE_COVERAGE_V1`
   template + live `buildResponseCoverageInsight` + reader + page wiring + Responses
   stage scaffold dropzone.
2. **Evaluation should-cost (NEXT increment).** Needs per-vendor **bid line items**
   — `entity_kind='vendor'` facts with **multiple numeric fact keys per vendor**
   (e.g. `vendor_bid_price_usd`, `vendor_should_cost_gap_usd`), one row per vendor,
   plus the derived vendor set for normalization. Its shape:
   - reuse the derived vendor set (same rows-as-registry decision);
   - a `VENDOR_BIDS_V1` template, `rowEntity='vendor'`, single `entityRefColumn =
     'Vendor'` (NOT composite — bid line items are per-vendor, not per-vendor×lever),
     with one fact column per bid metric mapped to a new numeric signal fact key;
   - `buildShouldCostModelInsight` reads the per-vendor bid facts and normalizes
     each bid to should-cost, flipping the winner after normalization when a fact
     set exists; MODEL (illustrative vendors) otherwise.
   Left to the next increment; declared here so the shape is governed before it is
   built.

## DB — additive migration (applied by the VNet migrate job at deploy)

Migration `supabase/migrations/20260707190000_source_event_facts_vendor_lever_kind.sql`
widens the `source_event_facts` `entity_kind` CHECK to include `vendor_lever`
(mirrors `20260707130000_..._value_lever_kind.sql`). It only ADDS an allowed value
— every existing row already satisfies the widened set, so no data migration.

**This migration MUST be applied via the VNet migrate job at deploy time**
(`job-abarva-db-migrate-lab-eastus`), per the ACA data-build-job rule — it is NOT
run from this branch, from localhost (which cannot reach the private Postgres), or
by any product web request. The release record flags it as a pending migration
gated on the VNet job. The TS `FactEntityKind` mirror is kept in lockstep.

## Everything stays behind `source_analytics`

Deterministic, no LLM. The Scope / Pricing / Exec / Transition insights, the value
economics, the gate engine, the baseline guard, and aVa are untouched. This slice
adds a new entity kind, a new signal fact, a new template, a composite entity-ref
option, a reader, and a live read — nothing else.
</content>
</invoke>
