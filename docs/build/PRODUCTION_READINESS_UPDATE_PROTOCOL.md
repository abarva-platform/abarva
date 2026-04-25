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
