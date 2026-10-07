# Source — a seed that gives each workspace phase a subject

## Release ID

2026-10-06-source-event-phase-coverage-seed

## Status

Merged — **not run**. This adds a seed script; it writes nothing until somebody dispatches it. Not
deployed and not live-proven by this record.

## Plain-English Summary

Several merged Source New features render on no served event, so they cannot be observed on the
running product. The signed-in acceptance walks record the same reason over and over, in these
words: *"the merge's claimed behaviour has no subject on this runtime."*

Measured on the deployed runtime, four events are served and they cluster at two phases — two
normalise to Define, two to the market package. None is at Request, none at Responses, none past it.
The consequences are specific:

- The single-status **step-readiness banner** covers the Request step and returns null for every
  other step, so it renders on **none** of the four — every served event is already past Request.
- **Stage 04 vendor readiness** renders only when the stage normalises to `responses`. Nothing is
  there, so neither the Strategy authority row nor its pre-existing Request authority sibling
  appears anywhere.
- The **supplier and NDA panels** sit behind the same guard.

This seed parks one event at each phase, so each of those surfaces has a subject:

| Event code | Stage | What it gives a subject to |
|---|---|---|
| `MER-SRC-PH1-REQUEST` | `intake` | the step-readiness banner — the one step it covers |
| `MER-SRC-PH2-DEFINE` | `scope` | the Define phase, with a second event |
| `MER-SRC-PH3-SUPPLIERS` | `responses` | Stage 04 vendor readiness, the Strategy and Request authority rows, the supplier and NDA panels |
| `MER-SRC-PH4-MARKET` | `rfp` | the market package, with release state readable against another package |
| `MER-SRC-PH5-DECIDE` | `executive_decision` | the decide phase, which no served event reaches |

## Layer Impact

Release lane: **client-data-lane** — a seed for the synthetic demo tenant.

Writes `source_events` rows only. **No authority rows, no candidate suppliers, no NDAs**, so a panel
that now renders will render its honest empty state rather than invented content. No schema change,
no migration, no application code touched.

## Client Applicability

**Specific clients** — the synthetic `meridian` demo tenant only. Every row is invented for the
demo; no real organisation, vendor or person is named, and no real engagement is described. No other
tenant is read or written.

## Changes Included

- `src/scripts/seed/seed-meridian-source-event-phase-coverage.ts` — the seed, with `--dry-run`.
- `package.json` — `seed:source-event-phases:meridian`.
- `src/__tests__/behaviors/source-event-phase-coverage-seed.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 11 cases |
| `--dry-run` executed | PASS — exit 0, prints the five-event plan, touches no database |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — write the canonical key instead of the app key | PASS — failed as intended |
| Mutation — move the `responses` event off its gate | PASS — 2 cases failed as intended |
| Mutation — park an event at a stage the normaliser rejects | PASS — 2 cases failed as intended |
| Mutation — upsert on a key the schema does not enforce | PASS — failed as intended |
| Mutation — mark an event inactive | PASS — failed as intended |
| Mutation — remove the entry-point guard | PASS, differently — see below |
| ESLint, `audit:lib-orphans`, census check | PASS |
| Seed actually run | **NOT RUN** |
| Signed-in acceptance | NOT RUN |

The entry-point guard mutation kills the suite rather than failing a case: with the guard always
true, importing the module runs `main()`, which opens a database connection, so the suite cannot
run at all. That is detection, not an assertion failure, and it is recorded that way rather than
counted as a failing case.

Two assertions are made against the product's own code rather than restated in the test, because
both are mistakes that would make the seed **appear to succeed and change nothing**:

- The tenant key is compared to `appClientKeyForTenant("meridian-health")`, which returns
  `meridian`. Both keys are real and both name this tenant; the canonical key would write rows the
  Source surface never queries.
- Each stage key is round-tripped through `normalizeSourceStageKey`, so a stage that resolves to no
  phase fails rather than being parked invisibly. `intake` is exempted explicitly, because it is the
  pre-strategy state the table defaults to and is not in `SOURCE_STAGE_ORDER`.

## Rollout Plan

Merge to `main`. Then the seed must be **dispatched deliberately** — merging it writes nothing.
Per the data-build job rule, a mutating operator data build runs as an ACA job, not through a
production web request and not from a developer machine: the lab Postgres instance is private and
unreachable from localhost.

Preview the plan with `--dry-run` first; it prints the five events and their stages and touches
nothing.

## Deployment Authority

Repo-owned workflows only. No ad-hoc Azure command, no traffic or revision change. The seed is a
data build, separate from application deployment.

## Rollback Plan

Revert the commit to remove the script. Rows already written are inert demo events on the synthetic
tenant and can be retired by setting `lifecycle_state`; they are upserted on
`(client_key, event_code)`, so re-running returns each event to its declared stage rather than
creating duplicates — which is also how the demo is reset after someone advances an event while
rehearsing.

## Audit Evidence

- `--dry-run` was executed and exited 0, printing the five-event plan, so the script is proven to
  run rather than only to compile.
- The upsert key is asserted against migration `20260602100000_source_events_idempotency.sql`,
  which enforces `source_events_client_event_code_unique UNIQUE (client_key, event_code)`. An
  upsert naming a key the schema does not enforce fails at runtime, so the constraint is checked
  rather than assumed.
- A public-repo guard asserts that no real organisation is named in the seed, with a control proving
  the matcher works on that file.

## Known Gaps

- **Not run.** This records what would be written; nothing is written yet. No panel has been
  observed rendering as a result, and no acceptance row moves until it is run and walked.
- **The panels will render empty.** Only events are seeded. Accepted candidate suppliers, NDA
  authority and a strategy version are each separate slices, and without them Stage 04 shows its
  empty state. That is honest but it is not a populated demo — a panel reading "no accepted
  candidates" may read worse to a viewer than one that does not render. Whoever runs this should
  expect that and sequence the candidate seed next.
- No award row is seeded for the decide-phase event, so the award path still has no subject even
  with this applied.
- The seed does not verify afterwards that the events are served; that needs a signed-in read,
  which this record does not claim.
- Stage keys are parked directly. If a later change alters how a stage normalises to a phase, these
  events move with it and the mapping asserted here would need re-measuring.
