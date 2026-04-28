# Production Readiness Update Protocol

Status: active protocol
Owner: Steward
Source manifest: `docs/build/production-readiness.json`
Last updated: 2026-04-25

## Purpose

`production-readiness.json` is the deterministic, machine-readable
readiness manifest for AbarVa. It tracks progress toward full-system
testing, pilot readiness, and production readiness across product,
agent, data, governance, validation, and deployment areas.

The manifest is a read model. It is not live monitoring. It does not
poll Vercel. It does not call Claude, OpenAI, or any model/API.

## Who Updates It

- Founder: after manual review, live walk, pilot decision, or production
  readiness decision.
- Codex: after implementation slices, validation runs, manifest hygiene,
  and deterministic read-model updates.
- Claude Code: after explicitly assigned implementation or validation
  work, using the same evidence standard.
- CI later: after automated route smoke, persona crawler, security scan,
  Vercel deploy checks, and observability checks exist.

## When To Update It

- After each slice lands.
- After each PR is opened, amended, merged, or rejected.
- After validation commands pass or fail.
- After a live founder/persona walk.
- After a Vercel deploy is created and verified.
- After a blocker is resolved or a new blocker is discovered.
- During morning review before choosing the next build slice.

## Future Slice Readiness Requirement

Every future Codex or Claude Code build slice must evaluate whether it
changes production readiness.

If a slice changes readiness for any tracked component, update
`docs/build/production-readiness.json` in the same slice and record:

- component changed
- prior status
- new status
- readiness dimensions affected
- readiness gates affected
- blockers added
- blockers removed
- next recommended readiness action

If the tracker is not updated, the final report must explicitly say why
not. Valid examples:

- "No production-readiness.json update: docs-only slice changed no
  tracked component status, gate, blocker, or next action."
- "No production-readiness.json update: refactor-only slice preserved all
  readiness evidence and gates."

Every final report for a future slice must include:

1. whether `production-readiness.json` was updated
2. which component changed
3. prior status and new status
4. readiness gates affected
5. blockers added or removed
6. next recommended readiness action

## Cross-session Update Rule

Any GPT, Codex, Claude Code, or other agent session that changes
readiness must update the canonical `docs/build/production-readiness.json`
manifest. Do not create local readiness trackers, duplicate readiness
JSON files, or alternate admin readiness pages that conflict with the
canonical manifest.

Component ownership for future sessions:

- Source work updates `Source / Outsourcing`.
- Programs work updates `Programs`, `Program Workshop Mode`, and
  `Deliverables / Artifacts` as appropriate.
- Intelligence work updates `Intelligence` and
  `Data / Evidence / Knowledge Fabric` as appropriate.
- Control Tower work updates `AI Control Tower`.
- Admin/Setup work updates `Admin / Setup`.
- Runtime, API, or Model Gateway work updates `Agent Runtime`,
  `Model Gateway`, and `Validation / QA` as appropriate.
- Ingestion, parsing, evidence, or trust work updates
  `Ingestion / Parsing`, `Data / Evidence / Knowledge Fabric`, and
  `Audit / Governance` as appropriate.
- Deployment, CI, route smoke, observability, or release work updates
  `Production / Deployment` and `Validation / QA` as appropriate.

If no readiness change occurred, the final report must explicitly state
why `production-readiness.json` was not updated.

Every future work order final report must include this readiness section:

- `production-readiness.json updated`: yes/no
- `components changed`: component ids or none
- `prior status`: previous status by component or unchanged
- `new status`: new status by component or unchanged
- `gates changed`: gate names or none
- `blockers added/removed`: blocker ids or none
- `next readiness action`: updated action or unchanged

Do not overstate readiness:

- Docs/spec completion is not runtime readiness.
- Deterministic validation is not live production readiness.
- Seeded data is not production data.
- `code_complete` is not `production_ready`.
- UI scaffold is not `full_flow_ready`.
- No component should be `pilot_ready` or `production_ready` without
  evidence from the required gates.

## Updating Component Status

Use only the canonical status enum:

- `not_started`: no usable contract, read model, UI, test, or runtime.
- `scaffolded`: shape exists, but not enough code or validation for use.
- `code_complete`: deterministic implementation exists and compiles.
- `tested`: focused tests pass, but full-flow readiness is not proven.
- `full_flow_ready`: route smoke and end-to-end flow are verified.
- `pilot_ready`: a limited pilot can run with known controls.
- `production_ready`: all gates pass with production evidence.
- `blocked`: a named blocker prevents readiness promotion.

Rules:

- Never promote because a PR merged.
- Never promote because the UI looks done.
- Never promote because a local build passed.
- If the component is `production_ready`, every testing gate must be
  `passing` and the blocker list must be empty.
- If the component has unresolved critical production blockers, it must
  not be `pilot_ready` or `production_ready`.

## Updating Gates

Every component must include every testing gate:

- `unit_tests`
- `integration_tests`
- `route_smoke`
- `live_persona_walk`
- `no_fabrication_check`
- `tenant_isolation_check`
- `vercel_build`
- `security_governance_review`

Allowed gate states today:

- `not_started`
- `partial`
- `passing`
- `blocked`
- `not_automated`
- `not_run`

Set a gate to `passing` only when the evidence field names the command,
run, report, PR, commit, or live review that proved it. Keep
`vercel_build` as `not_run` unless the specific deployment was checked.

## Recording Blockers

Each blocker needs:

- stable `id`
- `severity`: `low`, `medium`, `high`, or `critical`
- concrete `description`
- `unblocks`: the readiness status the blocker prevents

Good blockers name what cannot be claimed yet. Example:

`Model Gateway is not production-ready because the live gateway module
and provider/audit path are not implemented.`

Bad blockers are vague. Example:

`Needs polish.`

## Setting Pilot Ready

A component can be `pilot_ready` only when:

- The primary route or workflow has passed route smoke.
- A founder/persona live walk has been recorded.
- No high or critical blocker prevents a controlled pilot.
- No fabrication checks are passing for the relevant user journey.
- Tenant isolation has passed for the route or inherited path.
- Security/governance gaps are understood and acceptable for pilot scope.
- The next action does not name an implementation blocker required for
  the pilot itself.

## Setting Production Ready

A component can be `production_ready` only when:

- Every testing gate is `passing`.
- The blocker list is empty.
- Production deployment or runtime behavior has been verified.
- The component has production observability or an accepted manual
  fallback with owner and review cadence.
- Security/governance review has passed.
- No model/API path bypasses the Model Gateway.
- No evidence/citation path bypasses the Evidence Ledger.
- No tenant-isolation path is unverified.

## Never Mark Ready Without Evidence

Do not mark any of these ready without explicit evidence:

- Code complete as production ready.
- Local build pass as deployed.
- Merged PR as live.
- Live monitoring, unless a monitor exists and is checked.
- Vercel polling, unless an integration exists and is checked.
- Route/persona testing, unless the exact route/persona run is recorded.
- Model Gateway, unless the live gateway module and audit path exist.
- Evidence Ledger, unless tenant-bound evidence resolution exists.
- Ingestion/parsing, unless upload to parse to classify to evidence is
  deterministic and tested.
- Security/governance, unless the review or scan actually passed.

## Morning Review Checklist

1. Confirm branch, HEAD, and working tree status.
2. Read `production-readiness.json` and compare `overallStatus` with
   the current blocker list.
3. Review the lowest-readiness components.
4. Review top blockers by severity.
5. Check whether the last slice changed any component status, dimension,
   testing gate, blocker, or next action.
6. If validation ran, record the command and result in the relevant gate
   evidence.
7. If a live walk ran, record the route, persona, date, and result.
8. If a Vercel deploy happened, record the exact deploy and route checks.
9. Keep `production_ready` empty unless every gate is passing and blockers
   are gone.
10. Choose the next slice from the highest-severity blocker that unlocks
   full-flow, pilot, or production readiness.

## Future Automation Path

Later automation can update or validate the manifest through:

- GitHub Actions for TypeScript, Jest, build, lint, route-smoke, and
  manifest schema checks.
- Vercel deploy hooks and build status checks.
- Route smoke tests across canonical admin, Programs, Tower,
  Intelligence, Source, and home routes.
- Persona crawler runs for founder, Client Maestro, CIO, CFO, CMIO, and
  governance reviewer journeys.
- Security scan and dependency review.
- Tenant isolation probes against live routes and APIs.
- Production observability checks for runtime errors, latency, and
  gateway/audit/evidence health.
- A DB-backed readiness state once deterministic file-backed readiness is
  no longer enough.

Until those exist, the manifest remains deterministic and manually
updated from verifiable evidence.

## §H · Mandatory tracker update on every batch

Every multi-lane build pack must:

- Read `docs/build/production-readiness.json` if present.
- Read this protocol if present.
- If the slice changes readiness for any tracked component, update the
  JSON manifest in the same slice (status, dimensions, gates, blockers,
  notes, or `nextAction`).
- The final report for the pack must explicitly state, in this order:
  - `tracker updated: yes/no`
  - components changed (component ids, comma separated)
  - readiness/status changes (prior status -> new status, per component)
  - blockers added or removed (blocker ids, with severity)
  - `nextAction` updated (yes/no, per component)
- If the slice did not change readiness, the report must say so with one
  of the canonical `No production-readiness.json update:` justifications
  and still include `tracker updated: no`.

This applies to every lane in the pack, including documentation-only,
contract-only, and read-model-only lanes. Lanes that do not touch the
manifest must still report `tracker updated: no` and explain why.

## §I · Parallel-lane conflict policy

When N lanes touch `docs/build/production-readiness.json` in parallel
and integrate via cherry-pick, conflicts are resolved by these rules:

- **Conservative status**: when two lanes set different statuses for the
  same component, keep the lower status by canonical readiness order
  (`not_started` < `blocked` < `scaffolded` < `code_complete` < `tested`
  < `full_flow_ready` < `pilot_ready` < `production_ready`). Never
  auto-promote on merge.
- **No false promotions**: if either lane wanted a promotion (a higher
  status than currently recorded), require an explicit founder-marked
  verification before applying the promotion. Land the lower status
  during cherry-pick and follow up in a dedicated promotion slice.
- **Union blockers**: combine both lanes' blockers and dedupe by blocker
  `id`. If two lanes recorded the same blocker `id` with different
  severities, keep the higher severity (`critical` > `high` > `medium` >
  `low`).
- **Latest `nextAction` wins** when both lanes touched the same component
  and the prior `nextAction` is no longer relevant. When the prior
  `nextAction` is still relevant, take the conservative path: union the
  two `nextAction` strings with a newline separator rather than letting
  one lane stomp the other.
- **Preserve notes from both sides**: no note-stomping. If both lanes
  appended a note, append both notes to the merged component. Order is
  the order the lanes were cherry-picked.
- **Manifest `lastUpdated`** is bumped to the latest cherry-pick date.
- **`updatedBy`** can be a comma-separated list of pack lane ids that
  touched the file (for example `"Lane A, Lane C"`). The list must be
  human-readable and must not invent lane names.
- **`overallReadinessPercent`** is recomputed from the merged component
  list using the same scoring as the read model. It must remain inside
  the `production_readiness` indicator's planned `percentLow` and
  `percentHigh` range. If the merge would push the percent outside that
  range, treat the merge as a status conflict and apply conservative
  status.
- **Maturity snapshot indicators and areas** are not auto-merged. If
  both lanes change the snapshot, the pack's lead lane resolves the
  conflict by hand and records the resolution in the lead-lane report.

## §J · Validator usage (PROD2)

PROD2 lands a deterministic validator at
`src/lib/admin/production-readiness-validator.ts`. The validator imports
canonical types from `@/lib/admin/production-readiness` and reports
findings against the rules listed in
`PRODUCTION_READINESS_VALIDATION_RULES`.

Usage rules:

- After every cherry-pick that touches
  `docs/build/production-readiness.json`, run
  `validateProductionReadinessManifest(loadProductionReadinessManifest())`
  via the integration test
  `src/__tests__/integration/admin/production-readiness-validator.test.ts`.
- The validator test must pass before the pack is considered mergeable.
  A failing validator finding is a hard stop, not a warning.
- The validator does not promote, demote, or mutate the manifest. It
  only reports findings. Manifest authorship remains the responsibility
  of the agent or founder making the change.
- CI integration is deferred. PROD2 only adds the deterministic library
  and its integration test. A later slice will wire the validator into a
  GitHub Action and into the schema-check step of the readiness gate.
- Findings have severity `error`, `warning`, or `info`. The validator's
  `passed` boolean is true only when `errorCount === 0`. Lanes must not
  downgrade their own findings to `warning` to make the build green.
- Rules covered today (canonical ids):
  `manifest_parses`,
  `all_required_components_exist`,
  `all_statuses_valid`,
  `all_dimensions_present`,
  `all_testing_gates_present`,
  `production_ready_requires_all_gates_pass`,
  `pilot_ready_requires_route_smoke_or_persona_walk`,
  `every_component_has_next_action`,
  `every_blocker_has_severity_and_description`,
  `no_live_monitoring_claim_unless_source_says_live`,
  `overall_readiness_percent_within_planned_range`,
  `maturity_snapshot_present`.
- New rules added by future slices must be appended to
  `PRODUCTION_READINESS_VALIDATION_RULES` in the order they were added,
  with at least one negative test case in the validator integration
  test, and named in this section.

## §K · Freshness metadata

The Production Readiness tracker must distinguish manifest freshness from
true live monitoring.

Freshness metadata may be computed from the repository-backed manifest
and the current request/view timestamp. It must not imply that GitHub,
Vercel, route smoke, persona crawler, database-backed readiness, or
observability signals are being polled unless those integrations exist
and are backed by safe server-side configuration.

Canonical freshness fields:

- `lastUpdated`
- `dataSource`
- `updateMode`
- `freshnessStatus`
- `staleReason`
- `nextRefreshRecommendation`

Canonical freshness statuses:

- `fresh`
- `aging`
- `stale`
- `unknown`

Canonical update modes:

- `static_manifest`
- `repository_snapshot`
- `github_checks`
- `vercel_deploy`
- `mixed`

When `updateMode` is `static_manifest` or `repository_snapshot`, the UI
must state that the tracker is not live monitoring. GitHub/Vercel/check
wording must remain a future/deferred statement unless live ingestion is
implemented in a later approved slice.
