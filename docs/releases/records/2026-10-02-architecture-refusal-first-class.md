# 2026-10-02-architecture-refusal-first-class — Architecture refusal is a first-class block

## Release ID

`2026-10-02-architecture-refusal-first-class`

## Status

`candidate`

## Plain-English Summary

When the model declines to generate the target-state architecture because the
request tripped one of its usage policies, the product used to report a vague
"assembly failed" error and throw away the reason the model gave. An operator
could not tell a genuine out-of-bounds request from a false alarm, and could not
see which policy was involved.

This change makes that refusal a clear, first-class outcome. The deliverable is
blocked, the policy category and the provider's explanation are carried through,
and the message states plainly that the work is blocked and is never quietly
sent to a different model to get a different answer. A reviewer can then narrow
or rephrase the input and try again, or confirm the request is genuinely out of
bounds.

Important: this does not add any model fallback. There was none before and there
is none now — the only existing fallbacks are deterministic, no-model scaffolding.
The egress stays Anthropic-only; routing around a safety refusal to a
less-restricted model is exactly what this change refuses to do.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deliverable-authoring
behavior for all clients, not feature-gated.

- `PRODUCTS` (Moves): the required target-state-architecture generation path now
  distinguishes a policy refusal from a generic generation failure and surfaces
  its category/explanation. No change to evidence use, figure tracing, or any
  model-selection behavior.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — applies to every Move that generates a target-state
  architecture deliverable.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/visual-system/architecture-generation.ts`: new
  `ArchitectureRefusalError` (carries `category`/`explanation`); a `refusal`
  branch in `generateArchitectureModel` that throws it before the generic
  no-structured-model error.
- `src/lib/deliverables/orchestrator/generate-service.ts`: the required
  architecture path catch maps the refusal to a distinct
  `architecture_generation_refused` blocked reason and a human blocker that says
  the deliverable is blocked and never re-routed to another model. The
  non-required exhibits path is unchanged (it still records the reason into its
  deterministic, no-model scaffolding).
- Tests: refusal cases in `architecture-generation.test.ts`; a first-class
  refusal-block case in the orchestrator `surface.test.ts`.

## QA / Validation

- `npx jest src/lib/visual-system src/lib/deliverables` — 116 suites / 1,418
  tests pass.
- New tests assert: a refusal becomes a typed, categorized error (not
  "no structured model"); a refusal with no category is not given an invented
  one; the orchestrator returns `architecture_generation_refused` with the
  category and a "never routed to a different model" blocker, and persists no
  model-swapped output.
- Scoped `tsc` over changed files: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the normal web image the repo-owned ACA main deploy workflow builds from the
merge SHA. No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: only if a refusal can be reproduced on a real
  Move; otherwise covered by the unit/integration tests above (a refusal is a
  provider-side event not deterministically reproducible on demand).

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- The quarantine-reason TEXT (for any blocked deliverable, not just refusals) is
  still not rendered to a human in the phase/Cabinet UI — only a "blocked" state
  is shown. Surfacing the reason string, including this refusal category and
  explanation, to the reviewer UI is a separate follow-up and out of scope here.
