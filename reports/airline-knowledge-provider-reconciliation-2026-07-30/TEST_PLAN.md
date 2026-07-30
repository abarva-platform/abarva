# Test plan

Per the task brief, this PR covers items 1 and 2 only. Full-tree/Next.js/signed-in tests are PR B/C
scope.

## 1. Provider contract tests — confirming understanding, not duplicating existing coverage

Checked first (per the brief's instruction to extend, not duplicate): `consumption-contracts/__tests__/
vnext-contract.test.ts` and `review-package.test.ts`, and `consumption-client/__tests__/
vnext-consumption.test.ts` and `activation-guard.test.ts` already cover, thoroughly:

- zod envelope validation (valid/invalid availability states, missing baseline/version fields,
  `.strict()` extra-key rejection);
- every fixture scenario × every fixture tenant produces a contract-valid envelope;
- partial-data semantics (withheld empties content + warns, not_loaded suppresses + warns,
  not_measured never coerces to 0, stale backdates + marks freshness, api_failure_lkg surfaces LKG);
- relationships one-hop default / two-hop opt-in / candidate opt-in;
- aVa refuses without evidence, is unavailable when models disabled, stays ephemeral (`promoted:
false`);
- fixture and HTTP providers are interchangeable behind the same interface;
- the fixture activation guard (`assertFixtureNamespace`) rejects every canonical tenant, including
  `airline-demo-new` by name.

**This PR does not duplicate any of that.** It adds exactly one small extension where a gap existed:

- `consumption-contracts/__tests__/vnext-contract.test.ts` — no test asserted the exact 5-value
  `AuthorityState` or 4-value `FreshnessState` enumerations (only the 10-value `AvailabilityState` had
  that assertion). Added two `it()` blocks mirroring the existing "enumerates exactly the ten contract
  availability states" pattern, because the assembler's `deriveReadiness()` depends on those exact
  enumerations being stable — a silent enum drift there would silently break the readiness derivation
  table in `VIEW_MODEL_ASSEMBLER_INTERFACES.md` §1.

## 2. View-model assembler tests (new — the substance of this PR's test coverage)

`src/lib/knowledge/view-model/__tests__/assembler.test.ts`, `deriveReadiness.test.ts`,
`lenses.test.ts`, using `createFixtureRuntime("fixture-airline-demo-new", <scenario>)` (the real fixture
provider, real fixture data, clearly labeled fixture-only per every file/tenant-key name involved) —
never SkyHarbor, Meridian, or any other tenant's fixture as a stand-in.

- **Query composition**: `getEnterpriseProfile`, `getIndustryContext`, `getEvidenceAndGaps`, etc. each
  produce the expected `ViewModelEnvelope` shape from a single `getEnterpriseBrief`/`getEvidenceAndGaps`
  call; `getDecisionReadiness` and `getCurrentVsTarget` each prove they combine ≥2 real queries (assert
  on call counts via a spy provider wrapping the fixture provider).
- **Nine-lens mapping**: `listAirlineLenses` returns exactly the 9 `AirlineLensId` values in
  `VIEW_MODEL_ASSEMBLER_INTERFACES.md` §2; `resolved` is `true` only for lenses whose
  `primaryDomainKeys` actually returned available data from the fixture, `false` for a lens scoped to a
  domain the fixture pack has no entities in.
- **Missing-data behavior**: for every `MISSING_PROVIDER_QUERY`/`MISSING_CONSUMPTION_PROJECTION` matrix
  row this PR's assembler exposes a method for (none do — per the matrix, the assembler deliberately
  does NOT implement methods for those rows; this is itself asserted via a static check that
  `KnowledgeUiViewModelAssembler`'s method list contains no `listGoals`/`listPurposeStatements`/etc.).
- **Current/target separation**: `getCurrentVsTarget` never returns a `TargetV1`'s `target` field inside
  the `current` sub-object or vice-versa; a scenario where only `current` is available (`target: null`)
  renders `current` at full readiness while `target` independently reads `NOT_ASSESSED`.
- **Candidate/proposed exclusion**: `getRelationshipNeighborhood` with a `candidate`-authority edge in
  the fixture proves that edge's per-edge `readiness` is `DATA_RECONCILED_BUT_UI_UNPROVEN`, never
  `ENABLED_AND_PROVEN`; a `TargetV1` with `contentClass: "proposed_target"` proves `readiness` is never
  `ENABLED_AND_PROVEN` regardless of its `availabilityState`.
- **`SOURCE_INCOMPLETE` for leadership/perspective sections**: two variants, both asserting
  `readiness: "SOURCE_INCOMPLETE"` and `data: null`:
  1. Against a hand-built envelope shaped exactly like `consumption-server/shape.ts`'s real (empty)
     output — proving the real, sparse `airline-demo-new` case.
  2. A companion test proving `fixture-airline-demo-new`'s populated CIO/COO perspectives (a different,
     clearly-labeled fixture tenant) DO resolve to `DATA_RECONCILED_BUT_UI_UNPROVEN` (not
     `SOURCE_INCOMPLETE`) — demonstrating the mechanism distinguishes "no data" from "fixture demo data
     that hasn't been UI-proven yet," and that the fixed allow-list in `deriveLeadershipReadiness()` is
     keyed off which fields are populated, not off which tenant string is passed.
- **Never-fabricate invariants**: a property-style test asserting that for every `ViewModelEnvelope`
  the assembler can produce across all 10 fixture scenarios × the methods it implements, `readiness !==
"ENABLED_AND_PROVEN"` whenever `data === null`, and `data === null` whenever the source envelope's
  `availabilityState` is in the real contract's `NON_VALUE_AVAILABILITY_STATES` set (imported directly
  from `consumption-contracts/states.ts`, not re-declared).

## Commands run before considering any part of this PR done

```
npx tsc --noEmit -p tsconfig.json
npx eslint src/lib/knowledge/view-model
npx jest src/lib/knowledge/consumption-contracts src/lib/knowledge/consumption-client src/lib/knowledge/view-model
```

Per this repo's own convention (`feedback_tsjest_misses_type_errors`), `tsc --noEmit` is treated as
authoritative for type correctness — a green jest run alone is not accepted as proof.
